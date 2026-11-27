/**
 * MedicationExplorer — bloco de medicamentos contextual (Etapa 4).
 *
 * Três abas: Sugeridos (vínculos do quadro no ambiente, ordenados por papel
 * terapêutico e revisão), Meus atalhos (favoritos e recentes) e Buscar na base.
 * Tudo vem do motor único `services/clinicalSuggestions`. Nada é adicionado
 * automaticamente, nenhuma dose é inventada e nada não revisado aparece antes
 * do que já foi revisado.
 */
import { registerStructured, buildPatientInstruction } from "../services/weightDose";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Clock, Search, Sparkles, Star } from "lucide-react";
import type { Medication } from "@/types/prescription";
import type { ClinicalEnvironment } from "../types/prescription";
import {
  ROLE_LABELS,
  recordToMedication,
  suggestionToMedication,
  useClinicalSuggestions,
  useFavoriteMedications,
  useMedicationBaseCount,
  useMedicationSearch,
  useRecentMedications,
  type ClinicalSuggestion,
  type MedicationPresentation,
} from "../hooks/useLinkedMedications";
import { getMedicationPresentations } from "../services/clinicalSuggestions";
import { stableNumericId } from "../hooks/useMedications";
import { filterRelevant, pushRecentMedication, type QuickMedication } from "../services/quickAccess";
import MedicationPresentationPicker from "./MedicationPresentationPicker";
import QuickEditButton from "@/modules/homologacao/QuickEditButton";
import { useHomologacao } from "@/modules/homologacao/HomologacaoProvider";
import { logHomologacao } from "@/modules/homologacao/state";

const cn = (...xs: Array<string | false | null | undefined>) => xs.filter(Boolean).join(" ");

type TabKey = "sugeridos" | "atalhos" | "base";

const QUICK_CHIPS: Array<[string, string]> = [
  ["primeira", "1ª linha"], ["alergia", "Alergia"], ["falha", "Falha terapêutica"],
  ["pediatria", "Criança"], ["gestante", "Gestante"], ["idoso", "Idoso"], ["renal", "Rim"], ["hepatico", "Fígado"],
];

interface Props {
  conditionName?: string | null;
  conditionId?: string | null;
  syndromeName?: string | null;
  environment: ClinicalEnvironment;
  selected: Array<{ id: number }>;
  isPediatric: boolean;
  isPregnant: boolean;
  onAddMedication: (med: Medication) => void;
  onRemoveMedication: (id: number) => void;
}

const MedRow = ({
  med,
  hint,
  badge,
  isSelected,
  unsafe,
  warning,
  incomplete,
  pendingReview,
  onAdd,
  onRemove,
}: {
  med: Medication;
  hint?: string | null;
  badge?: string | null;
  isSelected: boolean;
  unsafe: boolean;
  warning?: string | null;
  incomplete?: boolean;
  pendingReview?: boolean;
  onAdd: () => void;
  onRemove?: () => void;
}) => (
  <div
    className={cn(
      "flex items-start gap-2 rounded-md border p-2 text-xs",
      unsafe
        ? "border-destructive/30 bg-destructive/5"
        : isSelected
        ? "border-canon-blue/30 bg-canon-blue/5"
        : "border-ink-soft bg-paper-alt/30",
    )}
  >
    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="font-medium text-ink">{med.name}</span>
        {badge && (
          <span className="rounded border border-ink-soft px-1 py-px text-[9px] font-semibold uppercase tracking-editorial text-ink-faint">
            {badge}
          </span>
        )}
      </div>
      <p className="mt-0.5 text-ink-muted">{med.dosage}</p>
      {hint && <p className="mt-0.5 text-[10px] text-ink-faint">{hint}</p>}
      {pendingReview && (
        <p className="mt-0.5 text-[10px] font-semibold text-amber-600">
          Vínculo ainda não revisado — conferir antes de prescrever
        </p>
      )}
      {incomplete && (
        <p className="mt-0.5 text-[10px] font-semibold text-amber-600">Dose não cadastrada — revisar antes de emitir</p>
      )}
      {unsafe && warning && <p className="mt-0.5 text-[10px] font-semibold text-destructive">{warning}</p>}
    </div>
    <Button
      variant={isSelected ? "outline" : "default"}
      size="sm"
      type="button"
      onClick={isSelected ? onRemove : onAdd}
      disabled={isSelected && !onRemove}
      aria-label={`${isSelected ? "Remover" : "Adicionar"} ${med.name}`}
      className="h-7 w-7 shrink-0 p-0"
    >
      {isSelected ? "✓" : "+"}
    </Button>
  </div>
);

const quickToMedication = (q: QuickMedication): Medication => ({
  id: Math.abs(Array.from(q.name).reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) | 0, 7)),
  name: q.name,
  category: "Meus atalhos",
  dosage: q.dose ?? "Dose não cadastrada — preencher manualmente",
  instructions: [q.presentation, q.route, q.frequency, q.duration, q.notes].filter(Boolean).join(" · "),
});

const MedicationExplorer = ({
  conditionName,
  conditionId,
  syndromeName,
  environment,
  selected,
  isPediatric,
  isPregnant,
  onAddMedication,
  onRemoveMedication,
}: Props) => {
  const { ativo: homolog } = useHomologacao();
  const [tab, setTab] = useState<TabKey>("sugeridos");
  const [term, setTerm] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const suggestionsQuery = useClinicalSuggestions({
    condition: conditionName,
    conditionId,
    syndrome: syndromeName,
    environment,
    patient: { isPediatric, isPregnant },
  });
  const search = useMedicationSearch(term);
  const baseCount = useMedicationBaseCount();
  const favorites = useFavoriteMedications();
  const { recents, remember } = useRecentMedications();

  const allSuggestions = suggestionsQuery.data?.suggestions ?? [];
  const [chip, setChip] = useState<string | null>(null);
  const suggestions = useMemo(() => {
    if (!chip) return allSuggestions;
    return allSuggestions.filter((s) => {
      if (!s.option) return false;
      const line = (s.option.line ?? "").toLowerCase();
      if (chip === "primeira") return line.startsWith("1ª");
      if (chip === "alergia") return s.option.populations.includes("alergia") || line.includes("alergia");
      if (chip === "falha") return s.option.populations.includes("falha") || line.includes("2ª") || line.includes("3ª");
      return s.option.populations.includes(chip);
    });
  }, [allSuggestions, chip]);
  const hasStructured = allSuggestions.some((s) => s.option);
  const presentationQuery = useQuery({
    queryKey: ["clinical-suggestion-presentations", suggestions.filter((s) => !s.option).map((s) => s.medicationId).sort().join(",")],
    enabled: suggestions.some((s) => !s.option),
    queryFn: async () => {
      const ids = [...new Set(suggestions.filter((s) => !s.option).map((s) => s.medicationId).filter((id): id is string => !!id))];
      const entries = await Promise.all(ids.map(async (id) => [id, await getMedicationPresentations(id)] as const));
      return new Map<string, MedicationPresentation[]>(entries);
    },
    staleTime: 5 * 60 * 1000,
  });
  const byClass = useMemo(() => {
    const groups = new Map<string, Array<{ suggestion: ClinicalSuggestion; presentation: MedicationPresentation | null }>>();
    for (const suggestion of suggestions) {
      const label = suggestion.therapeuticClass?.trim() || "Classe não cadastrada";
      const items = groups.get(label) ?? [];
      if (suggestion.option) {
        items.push({ suggestion, presentation: null });
      } else {
        const options = suggestion.medicationId ? presentationQuery.data?.get(suggestion.medicationId) : null;
        for (const presentation of options?.length ? options : [null]) items.push({ suggestion, presentation });
      }
      groups.set(label, items);
    }
    for (const items of groups.values())
      items.sort((a, b) => a.suggestion.priority - b.suggestion.priority);
    const minPri = (xs: Array<{ suggestion: ClinicalSuggestion }>) => Math.min(...xs.map((x) => x.suggestion.priority));
    return new Map([...groups].sort((a, b) => minPri(a[1]) - minPri(b[1])));
  }, [suggestions, presentationQuery.data]);

  const suggestionNames = useMemo(() => suggestions.map((s) => s.name), [suggestions]);
  const relevantFavorites = useMemo(
    () => filterRelevant(favorites.data ?? [], suggestionNames),
    [favorites.data, suggestionNames],
  );
  const relevantRecents = useMemo(() => filterRelevant(recents, suggestionNames), [recents, suggestionNames]);

  const isSelected = (id: number) => selected.some((s) => s.id === id);
  const loading = suggestionsQuery.isLoading;
  const total = suggestions.length;
  const shortcuts = relevantFavorites.length + relevantRecents.length;

  const searchMeds = (search.data ?? []).map((r) => ({ record: r, med: recordToMedication(r, isPediatric) }));

  const add = (med: Medication, quick?: QuickMedication) => {
    onAddMedication(med);
    const entry: QuickMedication =
      quick ??
      {
        medicationId: null,
        name: med.name,
        activeIngredient: null,
        presentation: null,
        route: null,
        dose: med.dosage ?? null,
        frequency: null,
        duration: null,
        notes: null,
      };
    remember(pushRecentMedication(entry));
  };

  const selectSuggestion = (s: ClinicalSuggestion, presentation: MedicationPresentation | null) => {
    logHomologacao({ acao: "medicamento_selecionado", medicamento: s.name, condicao: conditionName ?? null, detalhe: { linkId: s.linkId, apresentacao: presentation?.label ?? s.presentation ?? null } });
    if (s.option) {
      const med = suggestionToMedication(s, isPediatric);
      med.id = s.numericId;
      med.pediatricDose = undefined;
      med.name = s.name;
      med.structured = {
        presentation: s.presentation,
        adultInstruction: s.option.patientInstruction ?? null,
        pediatricInstruction: s.option.pediatricInstruction ?? null,
        rule: s.option.weightRule ?? null,
        nonPharmacological: s.option.nonPharmacological,
      };
      registerStructured(med, med.structured);
      med.dosage = "";
      med.instructions = "";
      add(med, {
        medicationId: s.medicationId, name: s.name, activeIngredient: s.activeIngredient,
        presentation: s.presentation, route: s.route, dose: isPediatric ? s.pediatricDose : s.adultDose,
        frequency: s.frequency, duration: s.duration, notes: s.notes,
      });
      return;
    }
    const matching = presentation?.posologies.filter((p) =>
      isPediatric ? /pedi/i.test(p.population ?? "") : !/pedi/i.test(p.population ?? ""),
    ) ?? [];
    const posology = matching.find((p) => p.reviewed) ?? matching[0] ?? null;
    // A dose agregada da ficha pode pertencer a outra apresentação/via.
    const dose = presentation ? posology?.text ?? null : (isPediatric ? s.pediatricDose : s.adultDose);
    const med = suggestionToMedication(s, isPediatric);
    med.id = presentation ? stableNumericId(`${s.medicationId}:${presentation.id}`) : s.numericId;
    med.dosage = [presentation ? (posology?.route ?? presentation.route) : s.route, dose ?? "Dose não cadastrada — preencher manualmente"]
      .filter(Boolean).join(" — ");
    med.pediatricDose = undefined;
    med.instructions = [presentation?.label ?? s.presentation ?? "Apresentação não cadastrada", presentation ? posology?.frequency ?? "Frequência não cadastrada" : s.frequency ?? "Frequência não cadastrada", presentation ? posology?.duration ?? "Duração não cadastrada" : s.duration ?? "Duração não cadastrada"]
      .join(" · ");
    add(med, {
      medicationId: s.medicationId, name: s.name, activeIngredient: s.activeIngredient,
      presentation: presentation?.label ?? s.presentation, route: presentation ? posology?.route ?? presentation.route : s.route,
      dose, frequency: presentation ? posology?.frequency ?? null : s.frequency,
      duration: presentation ? posology?.duration ?? null : s.duration, notes: s.notes,
    });
  };

  const TABS: Array<{ key: TabKey; label: string; icon: typeof Sparkles }> = [
    { key: "sugeridos", label: `Sugeridos${total ? ` · ${total}` : ""}`, icon: Sparkles },
    { key: "atalhos", label: `Meus atalhos${shortcuts ? ` · ${shortcuts}` : ""}`, icon: Star },
    { key: "base", label: `Buscar na base${baseCount.data ? ` · ${baseCount.data}` : ""}`, icon: Search },
  ];

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn(
              "flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-semibold transition",
              tab === key
                ? "border-canon-blue/40 bg-canon-blue/10 text-canon-blue"
                : "border-ink-soft text-ink-muted hover:text-ink",
            )}
          >
            <Icon className="h-3 w-3" />
            {label}
          </button>
        ))}
      </div>

      {tab === "sugeridos" && (
        <div className="space-y-3 max-h-[28rem] overflow-y-auto pr-1">
          {loading && <p className="text-[11px] text-ink-muted">Carregando sugestões…</p>}
          {suggestionsQuery.isError && !loading && (
            <div className="space-y-1">
              <p className="text-[11px] text-destructive">Não foi possível carregar as sugestões.</p>
              <button
                type="button"
                onClick={() => suggestionsQuery.refetch()}
                className="rounded-md border border-ink-soft px-2 py-1 text-[10px] font-semibold text-ink-muted hover:text-ink"
              >
                Tentar novamente
              </button>
            </div>
          )}
          {!loading && !suggestionsQuery.isError && total === 0 && (
            <p className="text-[11px] text-ink-muted">
              Ainda não há conduta medicamentosa cadastrada para este quadro e ambiente. Use a busca na base para
              inclusão manual.
            </p>
          )}
          {hasStructured && (
            <div className="flex flex-wrap gap-1" role="group" aria-label="Filtro rápido">
              {QUICK_CHIPS.map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setChip(chip === k ? null : k)}
                  aria-pressed={chip === k}
                  className={cn(
                    "rounded-full border px-2 py-0.5 text-[10px] font-semibold transition",
                    chip === k ? "border-canon-blue/40 bg-canon-blue/10 text-canon-blue" : "border-ink-soft text-ink-muted hover:text-ink",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
          {presentationQuery.isLoading && total > 0 && <p className="text-[11px] text-ink-muted">Carregando apresentações…</p>}
          {presentationQuery.isError && <p className="text-[11px] text-destructive">Não foi possível carregar as apresentações. Confira os dados antes de prescrever.</p>}
          {!presentationQuery.isLoading && Array.from(byClass, ([className, items]) => (
            <section key={className} className="space-y-1.5" aria-label={className}>
              <h3 className="text-[10px] font-semibold uppercase text-ink-faint">{className} · {items.length}</h3>
              {items.map(({ suggestion: s, presentation }, idx) => {
                if (s.option) {
                  const o = s.option;
                  const prevSub = idx > 0 ? items[idx - 1].suggestion.option?.subgroup : undefined;
                  const first = (o.line ?? "").startsWith("1ª");
                  const key = `opt-${s.linkId}`;
                  return (
                    <div key={key} className="space-y-1">
                      {o.subgroup && o.subgroup !== prevSub && (
                        <p className="pt-1 text-[10px] font-medium text-ink-muted">{o.subgroup}</p>
                      )}
                      <div className={cn("flex items-start gap-2 rounded-md border p-2", first ? "border-canon-blue/30 bg-canon-blue/5" : "border-ink-soft bg-paper-alt/30")}>
                        <Checkbox id={key} checked={isSelected(s.numericId)} onCheckedChange={(c) => (c ? selectSuggestion(s, null) : onRemoveMedication(s.numericId))} aria-label={`Selecionar ${s.name} ${s.presentation ?? ""}`} className="mt-0.5 shrink-0" />
                        <div className="min-w-0 flex-1 text-xs leading-relaxed text-ink">
                          {!o.nonPharmacological && <span className="float-right"><QuickEditButton linkId={s.linkId} name={s.name} adultDose={s.adultDose} pediatricDose={s.pediatricDose} instruction={o.patientInstruction} pediatricInstruction={o.pediatricInstruction} /></span>}
                          <label htmlFor={key} className="cursor-pointer">
                            <span className="font-semibold">{s.name}</span>
                            {s.presentation && <span className="text-ink-muted"> {s.presentation}</span>}
                            {o.line && <span className="ml-1 rounded border border-ink-soft px-1 text-[9px] font-semibold uppercase text-ink-faint">{o.line}</span>}
                            {o.nonPharmacological ? (
                              <span className="block text-ink-muted">Orientação ao paciente</span>
                            ) : (
                              <><span className="block whitespace-normal break-words text-ink">{buildPatientInstruction({ presentation: s.presentation, adultInstruction: o.patientInstruction ?? null, pediatricInstruction: o.pediatricInstruction ?? null, rule: o.weightRule ?? null, nonPharmacological: false }, { isPediatric, weight: null }).replace(/\*\*/g, "")}</span>
                              <span className="block text-[10px] text-ink-faint">Referência: {o.doseReference ?? (isPediatric ? s.pediatricDose : s.adultDose)}</span></>
                            )}
                          </label>
                          {!o.nonPharmacological && (
                            <details className="mt-0.5 text-[10px] text-ink-muted">
                              <summary className="cursor-pointer text-canon-blue">Detalhes clínicos</summary>
                              <dl className="mt-1 grid gap-0.5">
                                {[
                                  ["Nomes comerciais", o.commercialNames], ["Dose adulto", s.adultDose], ["Dose pediátrica", s.pediatricDose],
                                  ["Idade mínima", o.minAge], ["Ajuste renal", o.renal], ["Ajuste hepático", o.hepatic],
                                  ["Gestação", o.pregnancy], ["Lactação", o.lactation], ["Contraindicações", o.contraindications],
                                  ["Interações", o.interactions], ["Monitorização", o.monitoring], ["Fonte", o.source],
                                ].map(([k, v]) => (
                                  <div key={k as string}><dt className="inline font-semibold">{k}: </dt><dd className="inline">{v}</dd></div>
                                ))}
                              </dl>
                            </details>
                          )}
                          {!s.linkReviewed && <span className="block text-[10px] text-warning">{homolog ? "Conteúdo em validação clínica — confira a dose antes de emitir" : "Aguardando revisão clínica"}</span>}
                        </div>
                      </div>
                    </div>
                  );
                }
                const id = presentation ? stableNumericId(`${s.medicationId}:${presentation.id}`) : s.numericId;
                const matching = presentation?.posologies.filter((p) => isPediatric ? /pedi/i.test(p.population ?? "") : !/pedi/i.test(p.population ?? "")) ?? [];
                const posology = matching.find((p) => p.reviewed) ?? matching[0] ?? null;
                const dose = presentation ? posology?.text : (isPediatric ? s.pediatricDose : s.adultDose);
                const frequency = presentation ? posology?.frequency : s.frequency;
                const duration = presentation ? posology?.duration : s.duration;
                const key = `${s.linkId}:${presentation?.id ?? "none"}`;
                return (
                  <div key={key} className="flex items-start gap-2 rounded-md border border-ink-soft bg-paper-alt/30 p-2">
                    <Checkbox id={`suggestion-${key}`} checked={isSelected(id)} onCheckedChange={(checked) => checked ? selectSuggestion(s, presentation) : onRemoveMedication(id)} aria-label={`Selecionar ${s.name}, ${presentation?.label ?? s.presentation ?? "apresentação não cadastrada"}`} className="mt-0.5 shrink-0" />
                    <label htmlFor={`suggestion-${key}`} className="min-w-0 flex-1 cursor-pointer text-xs leading-relaxed text-ink">
                      <span className="font-semibold">{s.name}</span> <span className="text-ink-faint">· {ROLE_LABELS[s.role]}</span>
                      <span className="block text-ink-muted">{presentation?.label ?? s.presentation ?? "Apresentação não cadastrada"} · {dose ?? "Dose não cadastrada"} · {frequency ?? "Frequência não cadastrada"} · {duration ?? "Duração não cadastrada"}</span>
                      {(!s.linkReviewed || !s.medicationReleased || (presentation && !presentation.reviewed) || (posology && !posology.reviewed) || s.patientAlerts.length > 0) && (
                        <span className="block text-warning">{[!s.linkReviewed || !s.medicationReleased || (presentation && !presentation.reviewed) || (posology && !posology.reviewed) ? (homolog ? "Conteúdo em validação clínica — confira a dose antes de emitir" : "Dados pendentes de revisão clínica") : null, ...s.patientAlerts].filter(Boolean).join(" · ")}</span>
                      )}
                    </label>
                    <QuickEditButton linkId={s.linkId} name={s.name} adultDose={s.adultDose} pediatricDose={s.pediatricDose} />
                  </div>
                );
              })}
            </section>
          ))}
        </div>
      )}

      {tab === "atalhos" && (
        <div className="space-y-3 max-h-[28rem] overflow-y-auto pr-1">
          {shortcuts === 0 && (
            <p className="text-[11px] text-ink-muted">
              Sem favoritos ou uso recente ainda. Os medicamentos que você usar aparecem aqui.
            </p>
          )}
          {relevantFavorites.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-editorial text-ink-faint">
                <Star className="h-3 w-3" /> Favoritos · {relevantFavorites.length}
              </div>
              {relevantFavorites.map((q, i) => {
                const med = quickToMedication(q);
                return (
                  <MedRow
                    key={`fav-${q.name}-${i}`}
                    med={med}
                    hint={[q.presentation, q.route, q.frequency].filter(Boolean).join(" · ")}
                    isSelected={isSelected(med.id)}
                    unsafe={false}
                    onAdd={() => add(med, q)}
                  />
                );
              })}
            </div>
          )}
          {relevantRecents.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-editorial text-ink-faint">
                <Clock className="h-3 w-3" /> Usados recentemente · {relevantRecents.length}
              </div>
              {relevantRecents.map((q, i) => {
                const med = quickToMedication(q);
                return (
                  <MedRow
                    key={`rec-${q.name}-${i}`}
                    med={med}
                    hint={[q.presentation, q.route, q.frequency].filter(Boolean).join(" · ")}
                    isSelected={isSelected(med.id)}
                    unsafe={false}
                    onAdd={() => add(med, q)}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === "base" && (
        <div className="space-y-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-faint" />
            <Input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Princípio ativo, classe… (mín. 2 letras)"
              aria-label="Buscar medicamento na base"
              className="h-8 pl-7 text-xs"
            />
          </div>
          <div className="space-y-1.5 max-h-[26rem] overflow-y-auto pr-1">
            {search.isFetching && <p className="text-[11px] text-ink-muted">Buscando…</p>}
            {search.isError && !search.isFetching && (
              <p className="text-[11px] text-destructive">Falha na busca. Tente novamente.</p>
            )}
            {!search.isFetching && term.trim().length >= 2 && searchMeds.length === 0 && !search.isError && (
              <p className="text-[11px] text-ink-muted">Nenhum medicamento encontrado.</p>
            )}
            {searchMeds.map(({ record, med }) => (
              <div key={record.id} className="space-y-1">
                <MedRow
                  med={med}
                  hint={[record.therapeuticClass, record.presentation].filter(Boolean).join(" · ")}
                  isSelected={isSelected(med.id)}
                  unsafe={false}
                  incomplete={record.incompleteDose}
                  onAdd={() => add(med)}
                />
                <button
                  type="button"
                  onClick={() => setOpenId(openId === record.id ? null : record.id)}
                  className="text-[10px] font-semibold text-canon-blue hover:underline"
                >
                  {openId === record.id ? "Ocultar apresentações" : "Escolher apresentação e dose"}
                </button>
                {openId === record.id && (
                  <MedicationPresentationPicker
                    medicationId={record.id}
                    isPediatric={isPediatric}
                    onApply={({ presentation, posology }) =>
                      add({
                        ...med,
                        dosage: posology?.text ?? "Dose não cadastrada — preencher manualmente",
                        instructions: [presentation.label, posology?.duration, posology?.notes]
                          .filter(Boolean)
                          .join(" · "),
                      })
                    }
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicationExplorer;
