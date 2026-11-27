import { useState } from "react";
import { useLocation } from "react-router-dom";
import { Bug, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/providers/AuthProvider";
import { useHomologacao } from "./HomologacaoProvider";
import { logHomologacao } from "./state";

export const TIPOS_PROBLEMA = ["Erro de dose", "Medicamento faltando", "Bug de interface", "Fluxo confuso", "Sugestão de melhoria", "Outro"];
const GRAVIDADES = [["baixa", "Baixa"], ["media", "Média"], ["alta", "Alta"], ["critica", "Crítica (risco ao paciente)"]] as const;

export default function ReportProblemButton() {
  const { ativo } = useHomologacao();
  const { user } = useAuth();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [captura, setCaptura] = useState<string | null>(null);
  const [tipo, setTipo] = useState(TIPOS_PROBLEMA[0]);
  const [gravidade, setGravidade] = useState("media");
  const [descricao, setDescricao] = useState("");
  const [busy, setBusy] = useState(false);
  if (!ativo || !user) return null;

  const abrir = async () => {
    setBusy(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(document.body, { scale: 0.5, logging: false, ignoreElements: (el) => el.hasAttribute("data-report-ignore") });
      setCaptura(canvas.toDataURL("image/jpeg", 0.6));
    } catch {
      setCaptura(null);
    } finally {
      setBusy(false);
      setOpen(true);
    }
  };

  const enviar = async () => {
    if (!descricao.trim()) return toast.error("Descreva o problema");
    setBusy(true);
    let atendimento: unknown = null;
    try { atendimento = JSON.parse(sessionStorage.getItem("prescrimed:encounter") ?? localStorage.getItem("prescrimed:encounter") ?? "null"); } catch { /* sem atendimento */ }
    const { error } = await supabase.from("relatorios_homologacao" as never).insert({
      user_id: user.id,
      user_email: user.email,
      tipo,
      gravidade,
      descricao: descricao.trim(),
      tela: pathname,
      captura,
      contexto: { url: window.location.href, viewport: `${window.innerWidth}x${window.innerHeight}`, atendimento, horario: new Date().toISOString() },
    } as never);
    setBusy(false);
    if (error) return toast.error("Não foi possível enviar o relato");
    logHomologacao({ acao: "problema_reportado", detalhe: { tipo, gravidade } });
    toast.success("Obrigado! Problema registrado.");
    setOpen(false);
    setDescricao("");
  };

  return (
    <>
      <Button data-report-ignore onClick={abrir} disabled={busy} variant="destructive" className="fixed bottom-20 right-4 z-50 gap-2 shadow-lg md:bottom-4 print:hidden">
        {busy && !open ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bug className="h-4 w-4" />}Reportar problema
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent data-report-ignore className="max-w-lg">
          <DialogHeader><DialogTitle>Reportar problema</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Tipo</Label>
                <Select value={tipo} onValueChange={setTipo}><SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TIPOS_PROBLEMA.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1"><Label>Gravidade</Label>
                <Select value={gravidade} onValueChange={setGravidade}><SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{GRAVIDADES.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="space-y-1"><Label htmlFor="rep-desc">Descrição</Label>
              <Textarea id="rep-desc" rows={4} value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="O que aconteceu? O que você esperava?" /></div>
            {captura && <img src={captura} alt="Captura da tela atual" className="max-h-40 w-full rounded border object-contain" />}
            <p className="text-[11px] text-muted-foreground">Enviamos junto: tela atual, dados do atendimento, seu usuário e o horário.</p>
          </div>
          <DialogFooter><Button onClick={enviar} disabled={busy}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Enviar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
