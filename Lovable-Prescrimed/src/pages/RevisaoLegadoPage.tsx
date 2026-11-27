import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

type Kind = "med" | "quadro" | "protocolo";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

const STATUS: Record<string, string> = {
  legado_a_revisar: "A revisar",
  revisado: "Revisado",
  inativo: "Inativo",
};
const LINES = ["primeira", "alternativa", "suporte", "sintomatico"];

const TABLE: Record<Kind, { table: string; key: string; order: string }> = {
  med: { table: "catalogo_medicamentos_legado", key: "id_legado", order: "nome" },
  quadro: { table: "catalogo_patologias_legado", key: "id_legado", order: "nome" },
  protocolo: { table: "catalogo_protocolos_legado", key: "patologia_id_legado", order: "patologia_id_legado" },
};

const db = (t: string) => supabase.from(t as never) as any; // eslint-disable-line @typescript-eslint/no-explicit-any

const PAGE = 50;

/** Só nomes, para rótulos (medicamentos e quadros citados nos protocolos). */
function useNames(kind: "med" | "quadro") {
  const { table } = TABLE[kind];
  return useQuery({
    queryKey: ["revisao-legado", "nomes", kind],
    queryFn: async (): Promise<Row[]> => {
      const { data, error } = await db(table).select("id_legado, nome").order("nome");
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

/** Lista filtrada e paginada no banco (50 por página). */
function useRows(kind: Kind, q: string, status: string, page: number, quadroIds: number[] | null) {
  const { table, order } = TABLE[kind];
  return useQuery({
    queryKey: ["revisao-legado", kind, q, status, page, quadroIds],
    queryFn: async (): Promise<{ rows: Row[]; total: number; pend: number }> => {
      let query = db(table).select("*", { count: "exact" }).order(order);
      if (status !== "todos") query = query.eq("status_conteudo", status);
      const t = q.trim().replace(/[%,()]/g, " ");
      if (t) {
        if (kind === "protocolo") query = query.in("patologia_id_legado", quadroIds?.length ? quadroIds : [-1]);
        else query = query.or(`nome.ilike.%${t}%,categoria.ilike.%${t}%${kind === "quadro" ? `,cid.ilike.%${t}%` : ""}`);
      }
      const [{ data, error, count }, pendQ] = await Promise.all([
        query.range(page * PAGE, page * PAGE + PAGE - 1),
        db(table).select("*", { count: "exact", head: true }).eq("status_conteudo", "legado_a_revisar"),
      ]);
      if (error) throw error;
      return { rows: data ?? [], total: count ?? 0, pend: pendQ.count ?? 0 };
    },
    placeholderData: (prev) => prev,
  });
}

function StatusBadge({ s }: { s: string }) {
  return (
    <Badge variant={s === "revisado" ? "default" : s === "inativo" ? "outline" : "secondary"} className="text-[10px]">
      {STATUS[s] ?? s}
    </Badge>
  );
}

/** Campos do JSON: texto/número/sim-não viram campos; listas e objetos ficam em texto estruturado. */
function DadosEditor({ value, onChange }: { value: Row; onChange: (v: Row) => void }) {
  return (
    <div className="grid gap-3">
      {Object.entries(value)
        .filter(([k]) => k !== "id" && k !== "name")
        .map(([k, v]) => (
          <div key={k} className="grid gap-1">
            <Label className="text-xs">{k}</Label>
            {typeof v === "boolean" ? (
              <Select value={String(v)} onValueChange={(x) => onChange({ ...value, [k]: x === "true" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Sim</SelectItem>
                  <SelectItem value="false">Não</SelectItem>
                </SelectContent>
              </Select>
            ) : v !== null && typeof v === "object" ? (
              <Textarea
                className="font-mono text-xs"
                defaultValue={JSON.stringify(v)}
                onBlur={(e) => {
                  try {
                    onChange({ ...value, [k]: JSON.parse(e.target.value) });
                  } catch {
                    toast.error(`Campo "${k}" com formato inválido`);
                  }
                }}
              />
            ) : (
              <Input
                value={v ?? ""}
                onChange={(e) =>
                  onChange({ ...value, [k]: typeof v === "number" && e.target.value !== "" ? Number(e.target.value) : e.target.value })
                }
              />
            )}
          </div>
        ))}
    </div>
  );
}

function SugestoesEditor({ value, onChange, meds }: { value: Row[]; onChange: (v: Row[]) => void; meds: Map<number, string> }) {
  const set = (i: number, patch: Row) => onChange(value.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  return (
    <div className="space-y-2">
      {value.map((s, i) => (
        <div key={i} className="rounded-md border p-2 grid gap-2 sm:grid-cols-[1fr_8rem_6rem_auto] items-end">
          <div className="grid gap-1">
            <Label className="text-xs">Medicamento (código) — {meds.get(Number(s.medicationId)) ?? "não encontrado"}</Label>
            <Input type="number" value={s.medicationId ?? ""} onChange={(e) => set(i, { medicationId: Number(e.target.value) })} />
          </div>
          <div className="grid gap-1">
            <Label className="text-xs">Linha</Label>
            <Select value={s.line ?? "primeira"} onValueChange={(x) => set(i, { line: x })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{LINES.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid gap-1">
            <Label className="text-xs">Dias</Label>
            <Input
              type="number"
              value={s.overrideDurationDays ?? ""}
              onChange={(e) => set(i, { overrideDurationDays: e.target.value ? Number(e.target.value) : undefined })}
            />
          </div>
          <Button variant="ghost" size="icon" aria-label="Remover" onClick={() => onChange(value.filter((_, j) => j !== i))}>
            <Trash2 className="h-4 w-4" />
          </Button>
          <div className="sm:col-span-4 grid gap-1">
            <Label className="text-xs">Observação</Label>
            <Input value={s.note ?? ""} onChange={(e) => set(i, { note: e.target.value })} />
          </div>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={() => onChange([...value, { line: "primeira", medicationId: 0, note: "" }])}>
        <Plus className="h-4 w-4 mr-1" /> Adicionar medicamento
      </Button>
    </div>
  );
}

function EditDialog({ kind, row, onClose, meds, quadros }: {
  kind: Kind; row: Row | null; onClose: () => void; meds: Map<number, string>; quadros: Map<number, string>;
}) {
  const qc = useQueryClient();
  const [draft, setDraft] = useState<Row | null>(row);
  const [saving, setSaving] = useState(false);
  if (row && draft?.[TABLE[kind].key] !== row[TABLE[kind].key]) setDraft(row);
  if (!row || !draft) return null;

  const title = kind === "protocolo" ? quadros.get(draft.patologia_id_legado) ?? `Quadro ${draft.patologia_id_legado}` : draft.nome;

  const save = async () => {
    setSaving(true);
    const { key, table } = TABLE[kind];
    const patch: Row = { status_conteudo: draft.status_conteudo, fonte: draft.fonte || null };
    if (kind === "protocolo") Object.assign(patch, { contexto: draft.contexto, sugestoes: draft.sugestoes });
    else Object.assign(patch, { nome: draft.nome, categoria: draft.categoria, dados: { ...draft.dados, name: draft.nome } });
    if (kind === "quadro") patch.cid = draft.cid;
    const { error } = await db(table).update(patch).eq(key, row[key]);
    setSaving(false);
    if (error) return toast.error("Não foi possível salvar: " + error.message);
    toast.success("Alteração salva");
    qc.invalidateQueries();
    onClose();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          {kind !== "protocolo" && (
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="grid gap-1"><Label className="text-xs">Nome</Label>
                <Input value={draft.nome ?? ""} onChange={(e) => setDraft({ ...draft, nome: e.target.value })} /></div>
              <div className="grid gap-1"><Label className="text-xs">Categoria</Label>
                <Input value={draft.categoria ?? ""} onChange={(e) => setDraft({ ...draft, categoria: e.target.value })} /></div>
              {kind === "quadro" && (
                <div className="grid gap-1"><Label className="text-xs">CID</Label>
                  <Input value={draft.cid ?? ""} onChange={(e) => setDraft({ ...draft, cid: e.target.value })} /></div>
              )}
            </div>
          )}
          {kind === "protocolo" && (
            <div className="grid gap-1"><Label className="text-xs">Conduta / contexto</Label>
              <Textarea value={draft.contexto ?? ""} onChange={(e) => setDraft({ ...draft, contexto: e.target.value })} /></div>
          )}
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="grid gap-1"><Label className="text-xs">Situação</Label>
              <Select value={draft.status_conteudo} onValueChange={(x) => setDraft({ ...draft, status_conteudo: x })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(STATUS).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent>
              </Select></div>
            <div className="grid gap-1"><Label className="text-xs">Fonte</Label>
              <Input value={draft.fonte ?? ""} onChange={(e) => setDraft({ ...draft, fonte: e.target.value })} /></div>
          </div>
          {kind === "protocolo" ? (
            <SugestoesEditor value={draft.sugestoes ?? []} onChange={(s) => setDraft({ ...draft, sugestoes: s })} meds={meds} />
          ) : kind === "quadro" ? (
            <div className="grid gap-1">
              <Label className="text-xs">Medicamentos do quadro — {(draft.dados?.meds ?? []).map((id: number) => meds.get(id) ?? id).join(", ") || "nenhum"}</Label>
              <DadosEditor value={draft.dados ?? {}} onChange={(d) => setDraft({ ...draft, dados: d })} />
            </div>
          ) : (
            <DadosEditor value={draft.dados ?? {}} onChange={(d) => setDraft({ ...draft, dados: d })} />
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Salvando…" : "Salvar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ListTab({ kind, meds, quadros }: { kind: Kind; meds: Map<number, string>; quadros: Map<number, string> }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("todos");
  const [page, setPage] = useState(0);
  const quadroIds = useMemo(() => {
    if (kind !== "protocolo" || !q.trim()) return null;
    const t = q.trim().toLowerCase();
    return [...quadros.entries()].filter(([, n]) => n.toLowerCase().includes(t)).map(([id]) => id).slice(0, 200);
  }, [kind, q, quadros]);
  const { data, isLoading, error } = useRows(kind, q, status, page, quadroIds);
  const [editing, setEditing] = useState<Row | null>(null);

  const label = (r: Row) => (kind === "protocolo" ? quadros.get(r.patologia_id_legado) ?? `Quadro ${r.patologia_id_legado}` : r.nome);
  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;
  const pend = data?.pend ?? 0;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden />
          <Input className="pl-8" placeholder="Buscar…" value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} aria-label="Buscar" />
        </div>
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(0); }}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas situações</SelectItem>
            {Object.entries(STATUS).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground">{total} itens · {pend} a revisar</span>
      </div>
      {error && <p className="text-sm text-destructive">Não foi possível carregar a lista.</p>}
      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <ul className="divide-y rounded-md border">
          {rows.map((r) => (
            <li key={r[TABLE[kind].key]}>
              <button className="w-full text-left px-3 py-2 hover:bg-muted/50 flex items-center justify-between gap-2" onClick={() => setEditing(r)}>
                <span className="min-w-0">
                  <span className="block text-sm font-medium truncate">{label(r)}</span>
                  <span className="block text-xs text-muted-foreground truncate">
                    {kind === "protocolo" ? `${(r.sugestoes ?? []).length} medicamentos · ${r.contexto ?? ""}` : [r.cid, r.categoria].filter(Boolean).join(" · ")}
                  </span>
                </span>
                <StatusBadge s={r.status_conteudo} />
              </button>
            </li>
          ))}
          {rows.length === 0 && <li className="p-4 text-center text-sm text-muted-foreground">Nada encontrado.</li>}
        </ul>
      )}
      {total > PAGE && (
        <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
          <span>Página {page + 1} de {Math.ceil(total / PAGE)}</span>
          <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Anterior</Button>
          <Button size="sm" variant="outline" disabled={(page + 1) * PAGE >= total} onClick={() => setPage((p) => p + 1)}>Próxima</Button>
        </div>
      )}
      <EditDialog kind={kind} row={editing} onClose={() => setEditing(null)} meds={meds} quadros={quadros} />
    </div>
  );
}

export default function RevisaoLegadoPage() {
  const navigate = useNavigate();
  const medsQ = useNames("med");
  const quadrosQ = useNames("quadro");
  const meds = useMemo(() => new Map((medsQ.data ?? []).map((m) => [m.id_legado as number, m.nome as string])), [medsQ.data]);
  const quadros = useMemo(() => new Map((quadrosQ.data ?? []).map((m) => [m.id_legado as number, m.nome as string])), [quadrosQ.data]);

  return (
    <div className="container mx-auto max-w-5xl px-4 py-6 space-y-4">
      <Helmet><title>Revisão do legado | PrescriMed</title></Helmet>
      <header>
        <Button variant="ghost" size="sm" className="mb-2 gap-2" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>
        <h1 className="text-2xl font-bold">Revisão do conteúdo legado</h1>
        <p className="text-sm text-muted-foreground">Edite medicamentos, quadros e protocolos antigos e marque cada um como revisado.</p>
      </header>
      <Tabs defaultValue="med">
        <TabsList>
          <TabsTrigger value="med">Medicamentos</TabsTrigger>
          <TabsTrigger value="quadro">Quadros</TabsTrigger>
          <TabsTrigger value="protocolo">Protocolos</TabsTrigger>
        </TabsList>
        <TabsContent value="med"><ListTab kind="med" meds={meds} quadros={quadros} /></TabsContent>
        <TabsContent value="quadro"><ListTab kind="quadro" meds={meds} quadros={quadros} /></TabsContent>
        <TabsContent value="protocolo"><ListTab kind="protocolo" meds={meds} quadros={quadros} /></TabsContent>
      </Tabs>
    </div>
  );
}
