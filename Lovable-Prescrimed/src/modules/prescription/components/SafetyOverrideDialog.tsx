import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ShieldAlert } from "lucide-react";
import type { ClinicalAlert } from "../services/clinicalSafety";

interface Props {
  alert: ClinicalAlert | null;
  onConfirm: (justification: string) => void;
  onCancel: () => void;
}

const MIN_LEN = 8;

const MOTIVOS_ESTRUTURADOS = [
  { id: "m1", label: "Ausência de alternativa terapêutica" },
  { id: "m2", label: "Uso prévio tolerado (sem reações)" },
  { id: "m3", label: "Benefício supera risco atual" },
  { id: "m4", label: "Ajuste de dose / monitorização ativa" },
  { id: "m5", label: "Decisão compartilhada / CI" },
  { id: "m6", label: "Curto prazo (situação aguda transitória)" },
  { id: "m7", label: "Consulta especialista confirmada" },
] as const;

type MotivoId = (typeof MOTIVOS_ESTRUTURADOS)[number]["id"];

const SafetyOverrideDialog = ({ alert, onConfirm, onCancel }: Props) => {
  const [text, setText] = useState("");
  const [motivos, setMotivos] = useState<Set<MotivoId>>(new Set());
  const open = !!alert;

  useEffect(() => {
    if (!open) {
      setText("");
      setMotivos(new Set());
    }
  }, [open]);

  const motivoLabels = useMemo(
    () => MOTIVOS_ESTRUTURADOS.filter((m) => motivos.has(m.id)).map((m) => m.label),
    [motivos],
  );

  const valid = text.trim().length >= MIN_LEN || motivoLabels.length > 0;

  const toggle = (id: MotivoId) => {
    setMotivos((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const buildFinalJustification = (): string => {
    const trimmed = text.trim();
    if (motivoLabels.length > 0) {
      const prefix = `[ESTRUTURADO ${motivoLabels.join("; ")}]`;
      return trimmed ? `${prefix} ${trimmed}` : prefix;
    }
    return trimmed;
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-md bg-destructive/10 text-destructive">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <DialogTitle>Confirmar prescrição apesar do alerta</DialogTitle>
          <DialogDescription className="text-xs">
            {alert?.title}: {alert?.message}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label className="text-xs font-medium text-ink">
              Motivos estruturados <span className="text-ink-faint">(opcional, marcáveis)</span>
            </Label>
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {MOTIVOS_ESTRUTURADOS.map((m) => (
                <div key={m.id} className="flex items-start gap-2 rounded-md border p-2">
                  <Checkbox
                    id={`mot-${m.id}`}
                    checked={motivos.has(m.id)}
                    onCheckedChange={() => toggle(m.id)}
                    data-testid={`motivo-checkbox-${m.label.replace(/\s+/g, "-").toLowerCase()}`}
                  />
                  <Label
                    htmlFor={`mot-${m.id}`}
                    className="text-[12px] leading-tight cursor-pointer select-none pt-0.5"
                  >
                    {m.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="safety-justification" className="text-xs font-medium text-ink">
              Justificativa clínica <span className="text-ink-faint">(texto livre, min {MIN_LEN} se nenhum marcado)</span>
            </Label>
            <Textarea
              id="safety-justification"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Ex: paciente já fez uso prévio sem reação anafilática; benefício supera risco neste caso."
              rows={4}
              className="resize-none bg-paper-alt/40 border-ink-soft text-sm"
            />
            <p className="text-[10px] text-ink-faint">
              Sua justificativa será registrada no log de segurança da sessão.
              {motivoLabels.length === 0 && <> Mínimo {MIN_LEN} caracteres ou ao menos 1 motivo.</>}
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="ghost" onClick={onCancel} className="h-9">
            Cancelar
          </Button>
          <Button
            onClick={() => {
              if (!valid || !alert) return;
              onConfirm(buildFinalJustification());
            }}
            disabled={!valid}
            className="h-9 bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Confirmar e seguir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SafetyOverrideDialog;
