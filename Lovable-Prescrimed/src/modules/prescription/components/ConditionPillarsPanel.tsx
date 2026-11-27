import { useState } from "react";
import { ClipboardList, Copy, Send, Siren, Stethoscope, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import type { ClinicalEnvironment } from "../types/prescription";
import { useConditionPillars } from "../hooks/useConditionPillars";

const cn = (...xs: Array<string | false | null | undefined>) => xs.filter(Boolean).join(" ");

interface Props {
  conditionName: string | null | undefined;
  environment: ClinicalEnvironment;
}

const Block = ({
  icon: Icon,
  title,
  count,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  count: number;
  children: React.ReactNode;
}) => {
  const [open, setOpen] = useState(false);
  if (count === 0) return null;
  return (
    <div className="rounded-md border border-ink-soft bg-card/60">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] font-semibold text-ink"
      >
        <Icon className="h-3.5 w-3.5 text-primary" />
        {title}
        <span className="ml-auto rounded-full border border-ink-soft px-2 py-0.5 text-[10px] font-medium text-ink-muted">
          {count}
        </span>
      </button>
      {open && <div className="space-y-2 border-t border-ink-soft px-3 py-2">{children}</div>}
    </div>
  );
};

const ConditionPillarsPanel = ({ conditionName, environment }: Props) => {
  const { anamnesis, physicalExam, referrals, transfers, hasContent } = useConditionPillars(
    conditionName,
    environment,
  );

  if (!conditionName || !hasContent) return null;

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: `${label} copiado`, description: "Cole no documento e edite antes de emitir." });
    } catch {
      toast({ title: "Não foi possível copiar", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-2 border-t border-ink-soft pt-4">
      <div className="text-[10px] font-semibold uppercase tracking-editorial text-ink-faint">
        Base clínica desta condição — revise antes de usar
      </div>

      <Block icon={ClipboardList} title="Anamnese direcionada" count={anamnesis.length}>
        {anamnesis.map((item) => (
          <div key={item.id} className="text-[12px] leading-relaxed">
            <div className="flex items-start gap-2">
              {item.redFlag && <Siren className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" />}
              <div>
                <span className="text-[10px] uppercase tracking-editorial text-ink-faint">
                  {item.bloco}
                </span>
                <div className={cn("text-ink", item.redFlag && "font-medium text-destructive")}>
                  {item.pergunta}
                </div>
                {item.porQue && <div className="text-ink-muted">{item.porQue}</div>}
              </div>
            </div>
          </div>
        ))}
      </Block>

      <Block icon={Stethoscope} title="Exame físico direcionado" count={physicalExam.length}>
        {physicalExam.map((item) => (
          <div key={item.id} className="text-[12px] leading-relaxed">
            <span className="text-[10px] uppercase tracking-editorial text-ink-faint">
              {item.sistema}
            </span>
            <div className="text-ink">{item.oQueProcurar}</div>
            {item.achadoEsperado && (
              <div className="text-ink-muted">Esperado: {item.achadoEsperado}</div>
            )}
            {item.sugereDiferencial && (
              <div className="text-ink-muted">Diferencial: {item.sugereDiferencial}</div>
            )}
            {item.mudaConduta && (
              <div className="font-medium text-destructive">Muda conduta: {item.mudaConduta}</div>
            )}
          </div>
        ))}
      </Block>

      <Block icon={Send} title="Modelos de encaminhamento" count={referrals.length}>
        {referrals.map((item) => (
          <div key={item.id} className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-medium text-ink">{item.titulo}</span>
              {item.urgencia && (
                <span className="rounded-full border border-warning/40 bg-warning/10 px-2 py-0.5 text-[10px] text-warning">
                  {item.urgencia}
                </span>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto h-7 gap-1 text-[11px]"
                onClick={() => copy(item.corpo, "Modelo de encaminhamento")}
              >
                <Copy className="h-3 w-3" />
                Copiar
              </Button>
            </div>
            <pre className="whitespace-pre-wrap rounded-md border border-ink-soft bg-paper-alt/40 p-2 text-[11px] leading-relaxed text-ink-muted">
              {item.corpo}
            </pre>
          </div>
        ))}
      </Block>

      <Block icon={Truck} title="Modelos de transferência" count={transfers.length}>
        {transfers.map((item) => (
          <div key={item.id} className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-medium text-ink">{item.titulo}</span>
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto h-7 gap-1 text-[11px]"
                onClick={() => copy(item.corpo, "Modelo de transferência")}
              >
                <Copy className="h-3 w-3" />
                Copiar
              </Button>
            </div>
            {item.riscos && (
              <div className="text-[11px] text-destructive">Riscos do transporte: {item.riscos}</div>
            )}
            <pre className="whitespace-pre-wrap rounded-md border border-ink-soft bg-paper-alt/40 p-2 text-[11px] leading-relaxed text-ink-muted">
              {item.corpo}
            </pre>
          </div>
        ))}
      </Block>
    </div>
  );
};

export default ConditionPillarsPanel;
