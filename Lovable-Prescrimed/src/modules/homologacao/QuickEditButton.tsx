import { useState } from "react";
import { Pencil, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useHomologacao } from "./HomologacaoProvider";

interface Props {
  linkId: string;
  name: string;
  adultDose?: string | null;
  pediatricDose?: string | null;
  instruction?: string | null;
  pediatricInstruction?: string | null;
}

/** Edição rápida de dose/instrução (só no modo homologação). Altera na hora, com histórico. */
export default function QuickEditButton(p: Props) {
  const { ativo } = useHomologacao();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ a: "", p: "", i: "", ip: "" });
  const [busy, setBusy] = useState(false);
  if (!ativo || !p.linkId) return null;

  const abrir = () => {
    setF({ a: p.adultDose ?? "", p: p.pediatricDose ?? "", i: p.instruction ?? "", ip: p.pediatricInstruction ?? "" });
    setOpen(true);
  };
  const salvar = async () => {
    if (!f.i.trim()) return toast.error("A instrução ao paciente é obrigatória");
    setBusy(true);
    const { error } = await supabase.rpc("fn_homologacao_editar_vinculo" as never, {
      _id: p.linkId, _dose_adulto: f.a || null, _dose_pediatrica: f.p || null, _instrucao: f.i, _instrucao_ped: f.ip || null,
    } as never);
    setBusy(false);
    if (error) return toast.error(error.message || "Não foi possível salvar");
    toast.success("Alteração salva e registrada no histórico");
    setOpen(false);
    qc.invalidateQueries();
  };

  return (
    <>
      <button type="button" onClick={abrir} aria-label={`Editar rapidamente ${p.name}`} title="Edição rápida (homologação)"
        className="shrink-0 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
        <Pencil className="h-3.5 w-3.5" />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edição rápida — {p.name}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label>Dose adulto (referência)</Label><Input value={f.a} onChange={(e) => setF({ ...f, a: e.target.value })} /></div>
            <div className="space-y-1"><Label>Dose pediátrica (referência)</Label><Input value={f.p} onChange={(e) => setF({ ...f, p: e.target.value })} /></div>
            <div className="space-y-1"><Label>Instrução ao paciente (vai para o PDF)</Label><Textarea rows={2} value={f.i} onChange={(e) => setF({ ...f, i: e.target.value })} /></div>
            <div className="space-y-1"><Label>Instrução pediátrica</Label><Textarea rows={2} value={f.ip} onChange={(e) => setF({ ...f, ip: e.target.value })} /></div>
            <p className="text-[11px] text-muted-foreground">A alteração vale na hora para todos os testadores e pode ser desfeita no painel de homologação. A regra de cálculo por peso não muda aqui.</p>
          </div>
          <DialogFooter><Button onClick={salvar} disabled={busy}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
