import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useHomologacao } from "@/modules/homologacao/HomologacaoProvider";

type Item = { nome: string; total: number };
type Resumo = { usuarios: Item[]; condicoes: Item[]; medicamentos: Item[]; alertas: Item[]; problemas: { tipo: string; gravidade: string; total: number }[]; documentos: number; eventos: number };

const db = supabase as unknown as { from: (t: string) => any; rpc: (f: string, a?: object) => any };

function Top({ title, items }: { title: string; items: Item[] }) {
  return (
    <Card><CardHeader className="pb-2"><CardTitle className="text-sm">{title}</CardTitle></CardHeader>
      <CardContent className="space-y-1 text-xs">
        {items.length === 0 && <p className="text-muted-foreground">Sem dados ainda.</p>}
        {items.map((i) => <div key={i.nome} className="flex justify-between gap-2"><span className="truncate">{i.nome}</span><span className="font-semibold">{i.total}</span></div>)}
      </CardContent></Card>
  );
}

export default function HomologacaoPage() {
  const qc = useQueryClient();
  const { refresh } = useHomologacao();
  const [dias, setDias] = useState(7);
  const config = useQuery({ queryKey: ["homolog-config"], queryFn: async () => (await db.from("homologacao_config").select("*").single()).data });
  const resumo = useQuery({ queryKey: ["homolog-resumo", dias], refetchInterval: 30_000, queryFn: async () => {
    const { data, error } = await db.rpc("fn_homologacao_resumo", { _desde: new Date(Date.now() - dias * 864e5).toISOString() });
    if (error) throw error; return data as Resumo; } });
  const relatos = useQuery({ queryKey: ["homolog-relatos"], refetchInterval: 30_000, queryFn: async () =>
    (await db.from("relatorios_homologacao").select("id,tipo,gravidade,descricao,tela,user_email,status,created_at,captura").order("created_at", { ascending: false }).limit(50)).data ?? [] });
  const edicoes = useQuery({ queryKey: ["homolog-edicoes"], queryFn: async () =>
    (await db.from("homologacao_edicoes").select("id,vinculo_id,antes,depois,validado,promovido,desfeito,created_at").order("created_at", { ascending: false }).limit(100)).data ?? [] });

  const toggle = async (ativo: boolean) => {
    const { error } = await db.from("homologacao_config").update({ ativo, updated_at: new Date().toISOString() }).eq("id", true);
    if (error) return toast.error("Não foi possível alterar");
    toast.success(ativo ? "Modo homologação ligado" : "Modo homologação desligado");
    config.refetch(); refresh();
  };
  const validar = async (id: string, v: boolean) => { await db.from("homologacao_edicoes").update({ validado: v }).eq("id", id); edicoes.refetch(); };
  const desfazer = async (id: string) => { const { error } = await db.rpc("fn_homologacao_desfazer", { _edicao: id }); if (error) toast.error(error.message); else { toast.success("Edição desfeita"); edicoes.refetch(); qc.invalidateQueries(); } };
  const promover = async () => {
    if (!confirm("Marcar como revisado todo conteúdo validado pelos testadores?")) return;
    const { data, error } = await db.rpc("fn_homologacao_promover");
    if (error) return toast.error(error.message);
    toast.success(`${data ?? 0} item(ns) promovido(s) para revisado`); edicoes.refetch();
  };
  const setStatus = async (id: string, status: string) => { await db.from("relatorios_homologacao").update({ status }).eq("id", id); relatos.refetch(); };

  const r = resumo.data;
  return (
    <div className="container mx-auto max-w-6xl space-y-5 px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Homologação</h1>
        <div className="flex items-center gap-2"><Switch id="hm" checked={!!config.data?.ativo} onCheckedChange={toggle} /><Label htmlFor="hm">Modo homologação ativo</Label></div>
      </div>
      <p className="text-sm text-muted-foreground">Vale para usuários com o perfil Homologador (e administradores). Atribua o perfil na tela de Segurança. Alertas de alergia, interação e dose continuam ativos.</p>

      <div className="flex gap-2">{[1, 7, 30].map((d) => <Button key={d} size="sm" variant={dias === d ? "default" : "outline"} onClick={() => setDias(d)}>{d === 1 ? "Hoje" : `${d} dias`}</Button>)}</div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Ações registradas</p><p className="text-2xl font-bold">{r?.eventos ?? "—"}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Documentos emitidos (teste)</p><p className="text-2xl font-bold">{r?.documentos ?? "—"}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Problemas reportados</p><p className="text-2xl font-bold">{r?.problemas.reduce((a, p) => a + p.total, 0) ?? "—"}</p></CardContent></Card>
      </div>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <Top title="Usuários mais ativos" items={r?.usuarios ?? []} />
        <Top title="Condições mais usadas" items={r?.condicoes ?? []} />
        <Top title="Medicamentos mais selecionados" items={r?.medicamentos ?? []} />
        <Top title="Alertas mais ignorados" items={r?.alertas ?? []} />
      </div>
      <Top title="Problemas por tipo e gravidade" items={(r?.problemas ?? []).map((p) => ({ nome: `${p.tipo} · ${p.gravidade}`, total: p.total }))} />

      <Card><CardHeader><CardTitle className="text-base">Problemas reportados</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {(relatos.data ?? []).length === 0 && <p className="text-sm text-muted-foreground">Nenhum relato ainda.</p>}
          {(relatos.data ?? []).map((x: any) => (
            <div key={x.id} className="flex flex-wrap items-start gap-3 rounded border p-2 text-sm">
              {x.captura && <a href={x.captura} target="_blank" rel="noreferrer"><img src={x.captura} alt={x.tela ? `Captura da tela ${x.tela} no relato de homologação` : "Captura de tela anexada ao relato de homologação"} className="h-16 w-24 rounded border object-cover" /></a>}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap gap-1"><Badge variant="outline">{x.tipo}</Badge><Badge variant={x.gravidade === "critica" || x.gravidade === "alta" ? "destructive" : "secondary"}>{x.gravidade}</Badge><Badge variant="secondary">{x.status}</Badge></div>
                <p className="mt-1 whitespace-pre-wrap break-words">{x.descricao}</p>
                <p className="text-[11px] text-muted-foreground">{x.user_email} · {x.tela} · {new Date(x.created_at).toLocaleString("pt-BR")}</p>
              </div>
              {x.status !== "resolvido" && <Button size="sm" variant="outline" onClick={() => setStatus(x.id, "resolvido")}>Resolver</Button>}
            </div>
          ))}
        </CardContent></Card>

      <Card><CardHeader className="flex-row items-center justify-between space-y-0"><CardTitle className="text-base">Edições rápidas</CardTitle>
        <Button size="sm" onClick={promover}>Promover conteúdo validado</Button></CardHeader>
        <CardContent className="space-y-2">
          {(edicoes.data ?? []).length === 0 && <p className="text-sm text-muted-foreground">Nenhuma edição ainda.</p>}
          {(edicoes.data ?? []).map((e: any) => (
            <div key={e.id} className="rounded border p-2 text-xs">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <span className="text-muted-foreground">{new Date(e.created_at).toLocaleString("pt-BR")}</span>
                {e.desfeito && <Badge variant="secondary">desfeita</Badge>}{e.promovido && <Badge>promovida</Badge>}
                {!e.desfeito && !e.promovido && <>
                  <Button size="sm" variant={e.validado ? "default" : "outline"} className="h-6 text-[11px]" onClick={() => validar(e.id, !e.validado)}>{e.validado ? "Validada" : "Marcar validada"}</Button>
                  <Button size="sm" variant="ghost" className="h-6 text-[11px]" onClick={() => desfazer(e.id)}>Desfazer</Button></>}
              </div>
              <div className="grid gap-1 sm:grid-cols-2">
                <div><p className="font-semibold">Antes</p><p className="break-words">{e.antes?.instrucao_paciente ?? "—"}</p><p className="text-muted-foreground">{e.antes?.dose_adulto ?? ""} {e.antes?.dose_pediatrica ?? ""}</p></div>
                <div><p className="font-semibold">Depois</p><p className="break-words">{e.depois?.instrucao_paciente ?? "—"}</p><p className="text-muted-foreground">{e.depois?.dose_adulto ?? ""} {e.depois?.dose_pediatrica ?? ""}</p></div>
              </div>
            </div>
          ))}
        </CardContent></Card>
    </div>
  );
}
