import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

type Cert = { nome: string; crm: string | null; perfil: string; carga_horas: number; emitido_em: string };

export default function VerificarCertificadoPage() {
  const { codigo = "" } = useParams();
  const [c, setC] = useState<Cert | null | undefined>(undefined);
  useEffect(() => {
    supabase.rpc("fn_onb_verificar", { _codigo: codigo }).then(({ data }) => setC((data as Cert[])?.[0] ?? null));
  }, [codigo]);
  return (
    <div className="mx-auto max-w-lg p-6">
      <Card>
        <CardHeader><CardTitle>Verificação de certificado PrescriMed</CardTitle></CardHeader>
        <CardContent className="space-y-1 text-sm">
          {c === undefined && <p>Verificando…</p>}
          {c === null && <p className="text-destructive">Código {codigo} não encontrado.</p>}
          {c && (<>
            <p className="font-medium text-success">Certificado autêntico</p>
            <p><strong>{c.nome}</strong>{c.crm ? ` — CRM ${c.crm}` : ""}</p>
            <p>Trilha: {c.perfil} · {c.carga_horas} h</p>
            <p>Emitido em {new Date(c.emitido_em).toLocaleString("pt-BR")}</p>
            <p className="text-muted-foreground">Código: {codigo}</p>
          </>)}
        </CardContent>
      </Card>
    </div>
  );
}
