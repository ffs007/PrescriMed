import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function VerificarPortfolioPage() {
  const { codigo = "" } = useParams();
  const q = useQuery({ queryKey: ["verif", codigo], queryFn: async () => {
    const { data } = await supabase.rpc("fn_pi_verificar" as never, { _codigo: codigo } as never);
    return data as { emitido_em: string; hash: string; resumo: Record<string, unknown> } | null;
  } });
  const r = q.data?.resumo as Record<string, unknown> | undefined;
  return (
    <main className="mx-auto max-w-xl p-6">
      <Card><CardHeader><CardTitle>Verificação de portfólio PrescriMed</CardTitle></CardHeader><CardContent className="space-y-2 text-sm">
        {q.isLoading ? <p>Verificando…</p> : !q.data ? <p className="text-destructive">Código não encontrado. Este portfólio não é autêntico.</p> : <>
          <p className="font-medium text-success">Portfólio autêntico.</p>
          <p>Médico: {String(r?.medico ?? "—")}</p><p>Período: {String(r?.periodo ?? "—")}</p>
          <p>Emitido em: {new Date(q.data.emitido_em).toLocaleString("pt-BR")}</p>
          <p>Documentos: {String(r?.documentos ?? 0)} · Alertas: {String(r?.alertas ?? 0)} · Uso de protocolo: {String(r?.uso_protocolo_pct ?? 0)}%</p>
          <p className="break-all font-mono text-xs text-muted-foreground">SHA-256: {q.data.hash}</p>
        </>}
      </CardContent></Card>
    </main>
  );
}
