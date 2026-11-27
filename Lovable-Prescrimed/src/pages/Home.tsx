import { Link } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  FileCheck2,
  FilePlus2,
  FileText,
  History as HistoryIcon,
  Mic,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Stethoscope,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState, type ElementType } from "react";
import { supabase } from "@/integrations/supabase/client";
import { reportError } from "@/lib/reportError";

export default function Home() {
  const [counts, setCounts] = useState({ presc: 0, docs: 0, favs: 0 });

  useEffect(() => {
    (async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const since = today.toISOString();
      const [prescRes, docsRes, favsRes] = await Promise.all([
        supabase.from("prescricoes_historico").select("*", { count: "exact", head: true }).gte("criado_em", since),
        supabase.from("documentos_gerados").select("*", { count: "exact", head: true }).gte("data_hora", since),
        supabase.from("patologia_personalizacao").select("*", { count: "exact", head: true }).eq("favorito", true),
      ]);
      const failed = [prescRes, docsRes, favsRes].find((result) => result.error);
      if (failed?.error) {
        reportError("Home.contadores", failed.error);
        return;
      }
      setCounts({ presc: prescRes.count ?? 0, docs: docsRes.count ?? 0, favs: favsRes.count ?? 0 });
    })();
  }, []);

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="clinical-eyebrow">Visão clínica</p>
          <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">Painel de atendimento</h1>
          <p className="mt-1 text-sm text-muted-foreground">Acesso rápido aos fluxos e pendências do dia.</p>
        </div>
        <Button asChild className="gap-2 self-start sm:self-auto">
          <Link to="/app/prescricao/nova"><Plus className="h-4 w-4" />Nova prescrição</Link>
        </Button>
      </div>

      <section aria-labelledby="acoes-rapidas">
        <h2 id="acoes-rapidas" className="mb-3 text-sm font-semibold">Ações rápidas</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <QuickAction to="/app/prescricao/nova" icon={Stethoscope} label="Novo atendimento" tone="primary" />
          <QuickAction to="/app/prescricao/nova" icon={FilePlus2} label="Nova prescrição" tone="success" />
          <QuickAction to="/app/documentos" icon={FileText} label="Novo documento" tone="cyan" />
          <QuickAction to="/app/prescricao/nova?smart=1" icon={Mic} label="Entrada inteligente" tone="warning" />
          <QuickAction to="/app/medicamentos" icon={Search} label="Busca clínica" tone="primary" />
          <QuickAction to="/app/atualizacoes" icon={Sparkles} label="Revisão assistiva" tone="regulatory" />
        </div>
      </section>

      <section aria-labelledby="tarefas-criticas">
        <h2 id="tarefas-criticas" className="mb-3 text-sm font-semibold">Situação do dia</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatusCard icon={FileCheck2} label="Prescrições hoje" value={counts.presc} tone="success" to="/app/prescricoes" />
          <StatusCard icon={AlertTriangle} label="Alertas para revisar" value={0} tone="critical" to="/app/seguranca" />
          <StatusCard icon={FileText} label="Documentos gerados" value={counts.docs} tone="warning" to="/app/documentos" />
          <StatusCard icon={Star} label="Modelos favoritos" value={counts.favs} tone="primary" to="/app/modelos" />
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="clinical-panel">
          <div className="flex items-center justify-between border-b p-4">
            <div><p className="clinical-eyebrow">Atividade</p><h2 className="font-semibold">Resumo clínico</h2></div>
            <Button asChild variant="outline" size="sm"><Link to="/app/historico">Ver histórico</Link></Button>
          </div>
          <div className="grid gap-3 p-4 sm:grid-cols-3">
            <Metric icon={Activity} value={counts.presc} label="Prescrições" />
            <Metric icon={FileText} value={counts.docs} label="Documentos" />
            <Metric icon={ShieldCheck} value="Revisado" label="Emissão médica" />
          </div>
        </section>

        <section className="clinical-panel p-4">
          <p className="clinical-eyebrow">Segurança clínica</p>
          <h2 className="mt-1 font-semibold">Revisão humana obrigatória</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Sugestões assistivas permanecem editáveis e nenhum documento é emitido sem confirmação médica.</p>
          <Button asChild variant="outline" className="mt-4 w-full gap-2"><Link to="/app/seguranca"><ShieldCheck className="h-4 w-4" />Abrir segurança</Link></Button>
        </section>
      </div>
    </div>
  );
}

type Tone = "primary" | "success" | "warning" | "critical" | "cyan" | "regulatory";

function QuickAction({ to, icon: Icon, label, tone }: { to: string; icon: ElementType; label: string; tone: Tone }) {
  return <Link to={to} className="clinical-action group"><span className={`clinical-icon clinical-icon-${tone}`}><Icon className="h-5 w-5" /></span><span>{label}</span></Link>;
}

function StatusCard({ icon: Icon, label, value, tone, to }: { icon: ElementType; label: string; value: number; tone: Tone; to: string }) {
  return <div className="clinical-panel p-4"><div className="flex items-center justify-between"><span className={`clinical-icon clinical-icon-${tone}`}><Icon className="h-4 w-4" /></span><span className={`clinical-badge clinical-badge-${tone}`}>{value}</span></div><h3 className="mt-4 text-sm font-semibold">{label}</h3><div className="mt-3 text-3xl font-semibold tabular-nums">{value}</div><Button asChild variant="outline" size="sm" className="mt-4 w-full"><Link to={to}>Revisar</Link></Button></div>;
}

function Metric({ icon: Icon, value, label }: { icon: ElementType; value: number | string; label: string }) {
  return <div className="rounded-md border bg-muted/30 p-4"><Icon className="h-4 w-4 text-primary" /><div className="mt-3 text-xl font-semibold tabular-nums">{value}</div><div className="mt-1 text-xs text-muted-foreground">{label}</div></div>;
}
