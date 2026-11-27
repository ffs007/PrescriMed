import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Award, BookOpen, Download, GraduationCap, ShieldAlert, Sparkles, Timer, TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import QRCode from "qrcode";
import { jsPDF } from "jspdf";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { supabaseUntyped } from "@/integrations/supabase/untyped";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Ev = { id: string; tipo: string; dominio: string; medicamento: string | null; motivo: string | null; justificativa: string | null; contexto: Record<string, unknown>; created_at: string };
type Med = { id: string | null; n: string; cls: string | null; ctrl?: boolean };
type Cme = { id: string; titulo: string; fonte: string | null; tipo: string; horas: number; concluido_em: string; origem: string };

const PERIODOS: Record<string, { label: string; dias: number }> = {
  diaria: { label: "Diária", dias: 1 }, semanal: { label: "Semanal", dias: 7 }, quinzenal: { label: "Quinzenal", dias: 15 },
  mensal: { label: "Mensal", dias: 30 }, trimestral: { label: "Trimestral", dias: 90 },
};
const FAIXAS: Array<[string, number]> = [["Neonato (<28 d)", 0.93], ["Lactente jovem (1–6 m)", 6], ["Lactente (6–24 m)", 24], ["Pré-escolar (2–5 a)", 72], ["Escolar (6–11 a)", 144], ["Adolescente (12–17 a)", 216], ["Adulto (18–59 a)", 720], ["Idoso (≥60 a)", Infinity]];
const faixa = (m: unknown) => { if (typeof m !== "number") return "Idade não informada"; return FAIXAS.find(([, lim]) => m < lim)?.[0] ?? "Idade não informada"; };
const CTX: Record<string, string> = { ambulatorial: "Ambulatorial / leve", internacao: "Internação / grave", emergencia: "Emergência" };
const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);
const cv = (xs: number[]) => { if (xs.length < 2) return null; const m = xs.reduce((s, x) => s + x, 0) / xs.length; const sd = Math.sqrt(xs.reduce((s, x) => s + (x - m) ** 2, 0) / (xs.length - 1)); return m ? sd / m : null; };
const fmtMin = (s: number) => (s >= 60 ? `${Math.floor(s / 60)} min ${Math.round(s % 60)} s` : `${Math.round(s)} s`);
const ATB = /amoxi|azitro|cefal|ceftri|claritro|cipro|levoflo|sulfa|clinda|metronid|penicil|benzatina|cefuro|doxici|nitrofur/i;
const AMPLO = /ceftri|cipro|levoflo|clavul|cefuro|piperac|merop|vancom/i;
const ANALG = /dipirona|paracet|ibupro|cetoprof|tramad|morfin|nimesul|naprox/i;

function count<T>(xs: T[], key: (x: T) => string | null | undefined) {
  const m = new Map<string, number>(); xs.forEach((x) => { const k = key(x); if (k) m.set(k, (m.get(k) ?? 0) + 1); });
  return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([nome, n]) => ({ nome, n }));
}
function Kpi({ icon: Icon, label, value, hint }: { icon: typeof Award; label: string; value: string; hint?: string }) {
  return (
    <Card><CardContent className="flex items-start gap-3 p-4">
      <span className="rounded-md bg-accent p-2 text-accent-foreground"><Icon className="size-4" /></span>
      <div><p className="text-xs text-muted-foreground">{label}</p><p className="font-mono text-2xl font-semibold text-foreground">{value}</p>{hint && <p className="text-xs text-muted-foreground">{hint}</p>}</div>
    </CardContent></Card>
  );
}
function Empty({ children }: { children: React.ReactNode }) { return <p className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">{children}</p>; }
function Rank({ data, total }: { data: { nome: string; n: number }[]; total: number }) {
  if (!data.length) return <Empty>Sem registros no período.</Empty>;
  return <ul className="space-y-2">{data.slice(0, 10).map((d) => (
    <li key={d.nome}><div className="flex justify-between text-sm"><span className="text-foreground">{d.nome}</span><span className="font-mono text-muted-foreground">{d.n} · {pct(d.n, total)}%</span></div><Progress value={pct(d.n, total)} className="h-1.5" /></li>
  ))}</ul>;
}
function Box({ p, mine, fmt }: { p: number[] | null | undefined; mine: number | null; fmt: (n: number) => string }) {
  if (!p || p.length < 5 || p.some((x) => x == null)) return <Empty>Ainda não há médicos suficientes para comparar (mínimo de 5, para manter o anonimato).</Empty>;
  const max = Math.max(p[4], mine ?? 0) * 1.1 || 1, x = (v: number) => `${(v / max) * 100}%`;
  return (
    <div className="space-y-1">
      <div className="relative h-8 rounded bg-muted">
        <div className="absolute top-1/2 h-px bg-muted-foreground" style={{ left: x(p[0]), width: `calc(${x(p[4])} - ${x(p[0])})` }} />
        <div className="absolute top-1 h-6 rounded border border-primary bg-primary/20" style={{ left: x(p[1]), width: `calc(${x(p[3])} - ${x(p[1])})` }} />
        <div className="absolute top-1 h-6 w-0.5 bg-primary" style={{ left: x(p[2]) }} />
        {mine != null && <div className="absolute -top-1 h-10 w-1 rounded bg-success" style={{ left: x(mine) }} title="Você" />}
      </div>
      <p className="text-xs text-muted-foreground">P10 {fmt(p[0])} · P25 {fmt(p[1])} · mediana {fmt(p[2])} · P75 {fmt(p[3])} · P90 {fmt(p[4])}{mine != null && <> · <b className="text-foreground">você {fmt(mine)}</b></>}</p>
    </div>
  );
}

export default function InteligenciaPage() {
  const qc = useQueryClient();
  const [periodoLocal, setPeriodoLocal] = useState<string | null>(null);
  const prefs = useQuery({ queryKey: ["pi_prefs"], queryFn: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabaseUntyped.from("pi_prefs").select("*").eq("user_id", user?.id).maybeSingle();
    return { uid: user?.id ?? null, email: user?.email ?? "", ...(data ?? { periodicidade: "mensal", cme_meta_horas: 50, cme_prazo: null }) } as Record<string, unknown> & { uid: string | null };
  } });
  const periodo = periodoLocal ?? (prefs.data?.periodicidade as string) ?? "mensal";
  const dias = PERIODOS[periodo]?.dias ?? 30;
  const desde = useMemo(() => new Date(Date.now() - dias * 864e5).toISOString(), [dias]);
  const desdeAnterior = useMemo(() => new Date(Date.now() - 2 * dias * 864e5).toISOString(), [dias]);

  const evs = useQuery({ queryKey: ["pi_evs", desdeAnterior], queryFn: async () => {
    const { data, error } = await supabaseUntyped.from("safety_events").select("*").gte("created_at", desdeAnterior).order("created_at").limit(5000);
    if (error) throw error; return (data ?? []) as Ev[];
  } });
  const todos = useQuery({ queryKey: ["pi_all"], queryFn: async () => {
    const { data } = await supabaseUntyped.from("safety_events").select("tipo,created_at").order("created_at").limit(10000);
    return (data ?? []) as Pick<Ev, "tipo" | "created_at">[];
  } });
  const pares = useQuery({ queryKey: ["pi_pares", desde], queryFn: async () => {
    const { data } = await supabase.rpc("fn_pi_pares" as never, { _desde: desde } as never); return data as Record<string, unknown> | null;
  } });
  const cme = useQuery({ queryKey: ["pi_cme"], queryFn: async () => {
    const { data } = await supabaseUntyped.from("pi_cme").select("*").order("concluido_em", { ascending: false }); return (data ?? []) as Cme[];
  } });
  const tplCount = useQuery({ queryKey: ["pi_tpl"], queryFn: async () => {
    const uid = prefs.data?.uid; if (!uid) return { modelos: 0, protocolos: 0 };
    const [a, b] = await Promise.all([
      supabaseUntyped.from("tpl_modelos").select("id", { count: "exact", head: true }).eq("owner", uid),
      supabaseUntyped.from("prot_protocolos").select("id", { count: "exact", head: true }).eq("autor", uid),
    ]);
    return { modelos: a.count ?? 0, protocolos: b.count ?? 0 };
  }, enabled: !!prefs.data?.uid });

  const savePrefs = useMutation({ mutationFn: async (patch: Record<string, unknown>) => {
    const uid = prefs.data?.uid; if (!uid) return;
    const { error } = await supabaseUntyped.from("pi_prefs").upsert({ user_id: uid, periodicidade: periodo, ...patch, updated_at: new Date().toISOString() });
    if (error) throw error;
  }, onSuccess: () => { qc.invalidateQueries({ queryKey: ["pi_prefs"] }); toast.success("Preferência salva."); } });

  const A = useMemo(() => {
    const all = evs.data ?? [], cur = all.filter((e) => e.created_at >= desde), prev = all.filter((e) => e.created_at < desde);
    const em = cur.filter((e) => e.tipo === "emissao_documento"), emPrev = prev.filter((e) => e.tipo === "emissao_documento");
    const ctx = (e: Ev) => e.contexto ?? {};
    const meds = em.flatMap((e) => ((ctx(e).meds as Med[]) ?? []));
    const alertas = cur.filter((e) => ["alerta", "bloqueio"].includes(e.tipo)), overrides = cur.filter((e) => e.tipo === "liberacao");
    const alertasPrev = prev.filter((e) => ["alerta", "bloqueio"].includes(e.tipo)).length;
    const segs = em.map((e) => Number(ctx(e).segundos)).filter((s) => s > 0 && s < 7200);
    const segProt = em.filter((e) => ctx(e).protocolo === true).map((e) => Number(ctx(e).segundos)).filter((s) => s > 0 && s < 7200);
    const segLivre = em.filter((e) => ctx(e).protocolo !== true).map((e) => Number(ctx(e).segundos)).filter((s) => s > 0 && s < 7200);
    const avg = (xs: number[]) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null);
    const porDia = new Map<string, number>(); em.forEach((e) => { const d = e.created_at.slice(0, 10); porDia.set(d, (porDia.get(d) ?? 0) + 1); });
    const porMes = new Map<string, number>(); (todos.data ?? []).filter((e) => e.tipo === "emissao_documento").forEach((e) => { const m = e.created_at.slice(0, 7); porMes.set(m, (porMes.get(m) ?? 0) + 1); });
    // Pesos por medicamento (variabilidade dos pacientes atendidos)
    const pesoPorMed = new Map<string, number[]>(); em.forEach((e) => { const w = Number(ctx(e).peso); ((ctx(e).meds as Med[]) ?? []).forEach((m) => { if (w > 0) pesoPorMed.set(m.n, [...(pesoPorMed.get(m.n) ?? []), w]); }); });
    // Sequência sem override
    let seq = 0; for (let i = cur.length - 1; i >= 0; i--) { if (cur[i].tipo === "liberacao") break; if (cur[i].tipo === "emissao_documento") seq++; }
    let seqTotal = 0; const t = todos.data ?? []; for (let i = t.length - 1; i >= 0; i--) { if (t[i].tipo === "liberacao") break; if (t[i].tipo === "emissao_documento") seqTotal++; }
    const emerg = em.filter((e) => ctx(e).contexto === "emergencia").map((e) => Number(ctx(e).segundos)).filter((s) => s > 0);
    return {
      cur, em, emPrev, meds, alertas, overrides, alertasPrev, segs, segProt, segLivre, avg, seq, seqTotal, emerg, pesoPorMed,
      condicoes: count(em, (e) => ctx(e).condicao as string),
      faixas: count(em, (e) => faixa(ctx(e).idade_meses)),
      contextos: count(em, (e) => CTX[ctx(e).contexto as string] ?? "Não informado"),
      modulos: count(em, (e) => (ctx(e).modulo as string) || "Documento"),
      principios: count(meds, (m) => m.n), classes: count(meds, (m) => m.cls ?? "Classe não identificada"),
      tiposAlerta: count(alertas, (e) => `${e.dominio} · ${e.tipo}`),
      justif: count(overrides, (e) => e.justificativa || "Sem justificativa"),
      overrideMeds: count(overrides, (e) => e.medicamento),
      protoTaxa: pct(em.filter((e) => ctx(e).protocolo === true).length, em.length),
      desvios: count(cur.filter((e) => e.tipo === "desvio_protocolo"), (e) => e.justificativa),
      serie: [...porDia.entries()].map(([d, n]) => ({ d: d.slice(5), n })),
      sazonal: [...porMes.entries()].map(([m, n]) => ({ m, n })),
      atb: meds.filter((m) => ATB.test(m.n)).length, amplo: meds.filter((m) => AMPLO.test(m.n)).length, analg: meds.filter((m) => ANALG.test(m.n)).length,
      ctrl: meds.filter((m) => m.ctrl).length,
    };
  }, [evs.data, todos.data, desde]);

  // Padrões atípicos (regras estatísticas transparentes, não modelo opaco)
  const sinais = useMemo(() => {
    const s: { nivel: "alto" | "medio" | "info"; texto: string }[] = [];
    if (A.alertasPrev >= 3 && A.alertas.length >= A.alertasPrev * 2) s.push({ nivel: "alto", texto: `Alertas de segurança dobraram em relação ao período anterior (${A.alertasPrev} → ${A.alertas.length}).` });
    const tx = pct(A.overrides.length, A.alertas.length);
    if (A.alertas.length >= 5 && tx > 30) s.push({ nivel: "alto", texto: `Você liberou ${tx}% dos alertas. Revise se os overrides foram clinicamente justificados.` });
    const semJ = A.overrides.filter((o) => !o.justificativa).length; if (semJ) s.push({ nivel: "medio", texto: `${semJ} liberação(ões) de alerta sem justificativa registrada.` });
    if (A.em.length >= 10 && pct(A.amplo, Math.max(A.atb, 1)) > 40) s.push({ nivel: "medio", texto: `${pct(A.amplo, A.atb)}% dos antibióticos prescritos são de amplo espectro.` });
    if (A.em.length >= 10 && pct(A.atb, A.em.length) > 50) s.push({ nivel: "medio", texto: `Antibiótico presente em ${pct(A.atb, A.em.length)}% dos documentos.` });
    if (A.emPrev.length >= 5 && A.em.length < A.emPrev.length * 0.5) s.push({ nivel: "info", texto: `Volume de documentos caiu mais de 50% (${A.emPrev.length} → ${A.em.length}).` });
    if (A.em.length >= 10 && A.protoTaxa < 20) s.push({ nivel: "info", texto: `Só ${A.protoTaxa}% dos atendimentos usaram modelo ou protocolo.` });
    return s;
  }, [A]);

  const educ = useMemo(() => {
    const q = (t: string) => encodeURIComponent(t), out: { tema: string; motivo: string; links: [string, string][] }[] = [];
    const add = (tema: string, motivo: string, termo: string) => out.push({ tema, motivo, links: [["UpToDate", `https://www.uptodate.com/contents/search?search=${q(termo)}`], ["Medscape", `https://search.medscape.com/search/?q=${q(termo)}`], ["DynaMed", `https://www.dynamed.com/results?q=${q(termo)}`], ["PubMed", `https://pubmed.ncbi.nlm.nih.gov/?term=${q(termo)}`]] });
    if (A.amplo > 0 && pct(A.amplo, Math.max(A.atb, 1)) > 30) add("Uso racional de antimicrobianos (stewardship)", "Proporção elevada de antibióticos de amplo espectro.", "antibiotic stewardship outpatient");
    const doseAlerts = A.alertas.filter((a) => /dose|renal/i.test(`${a.dominio} ${a.motivo}`)).length;
    if (doseAlerts >= 3) add("Ajuste de dose e função renal", `${doseAlerts} alertas de dose/renal no período.`, "drug dosing renal impairment");
    if (A.alertas.some((a) => /gest|lact/i.test(a.dominio))) add("Medicamentos na gestação e lactação", "Alertas de gestação/lactação recebidos.", "drug safety pregnancy lactation");
    if (A.em.length >= 10 && pct(A.analg, A.em.length) < 15) add("Manejo da dor", "Analgesia pouco frequente nos documentos.", "pain management emergency department");
    if (A.protoTaxa < 30 && A.em.length >= 5) add("Prática baseada em protocolos", "Baixo uso de modelos/protocolos.", "clinical practice guidelines adherence");
    if (A.ctrl > 0) add("Prescrição de controlados", `${A.ctrl} medicamento(s) de controle especial.`, "controlled substances prescribing safety");
    return out;
  }, [A]);

  const horasCme = (cme.data ?? []).reduce((s, c) => s + Number(c.horas || 0), 0);
  const meta = Number(prefs.data?.cme_meta_horas ?? 50), prazo = prefs.data?.cme_prazo as string | null;
  const diasPrazo = prazo ? Math.ceil((new Date(prazo).getTime() - Date.now()) / 864e5) : null;

  const conquistas = [
    ...[50, 100, 500].map((n) => ({ nome: `${n} documentos seguidos sem liberar alerta crítico`, ok: A.seqTotal >= n, prog: Math.min(100, pct(A.seqTotal, n)) })),
    { nome: "Protocolos em ≥ 70% dos atendimentos (mín. 20)", ok: A.em.length >= 20 && A.protoTaxa >= 70, prog: A.em.length >= 20 ? Math.min(100, Math.round(A.protoTaxa / 0.7)) : pct(A.em.length, 20) },
    { nome: "Emergência: mediana < 3 min (mín. 10 casos)", ok: A.emerg.length >= 10 && [...A.emerg].sort((a, b) => a - b)[Math.floor(A.emerg.length / 2)] < 180, prog: pct(Math.min(A.emerg.length, 10), 10) },
    { nome: "Contribuiu com modelo ou protocolo para a biblioteca", ok: (tplCount.data?.modelos ?? 0) + (tplCount.data?.protocolos ?? 0) > 0, prog: (tplCount.data?.modelos ?? 0) + (tplCount.data?.protocolos ?? 0) > 0 ? 100 : 0 },
    { nome: `Meta de educação continuada (${meta} h)`, ok: horasCme >= meta, prog: Math.min(100, pct(horasCme, meta)) },
  ];

  const [novo, setNovo] = useState({ titulo: "", fonte: "", horas: "1", concluido_em: new Date().toISOString().slice(0, 10) });
  const addCme = useMutation({ mutationFn: async () => {
    if (!novo.titulo.trim()) throw new Error("Informe o título.");
    const { error } = await supabaseUntyped.from("pi_cme").insert({ titulo: novo.titulo.trim(), fonte: novo.fonte || null, horas: Number(novo.horas.replace(",", ".")) || 1, concluido_em: novo.concluido_em });
    if (error) throw error;
  }, onSuccess: () => { setNovo({ ...novo, titulo: "", fonte: "" }); qc.invalidateQueries({ queryKey: ["pi_cme"] }); toast.success("Atividade registrada."); }, onError: (e: Error) => toast.error(e.message) });

  async function exportar() {
    try {
      const resumo = {
        medico: prefs.data?.email, periodo: PERIODOS[periodo].label, gerado_em: new Date().toISOString(),
        documentos: A.em.length, por_contexto: A.contextos, por_faixa: A.faixas, top_condicoes: A.condicoes.slice(0, 10),
        alertas: A.alertas.length, overrides: A.overrides.length, uso_protocolo_pct: A.protoTaxa,
        tempo_medio_s: A.avg(A.segs), cme_horas: horasCme, conquistas: conquistas.filter((c) => c.ok).map((c) => c.nome),
      };
      const txt = JSON.stringify(resumo);
      const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(txt));
      const hash = [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
      const { data, error } = await supabaseUntyped.from("pi_portfolios").insert({ resumo, hash }).select("codigo").single();
      if (error) throw error;
      const url = `${window.location.origin}/verificar/${(data as { codigo: string }).codigo}`;
      const qr = await QRCode.toDataURL(url, { margin: 1, width: 240 });
      const d = new jsPDF(); let y = 20;
      const line = (t: string, size = 10, bold = false) => { d.setFont("helvetica", bold ? "bold" : "normal"); d.setFontSize(size); d.splitTextToSize(t, 140).forEach((l: string) => { if (y > 280) { d.addPage(); y = 20; } d.text(l, 14, y); y += size * 0.5; }); y += 2; };
      d.addImage(qr, "PNG", 160, 12, 36, 36);
      line("PrescriMed — Portfólio de atividade clínica", 15, true);
      line(`Médico: ${resumo.medico} · Período: ${resumo.periodo} · Emitido em ${new Date().toLocaleString("pt-BR")}`, 9);
      y += 4;
      line("Volume e complexidade", 12, true);
      line(`Documentos emitidos: ${resumo.documentos}`); line(`Por contexto: ${A.contextos.map((c) => `${c.nome} ${c.n}`).join("; ") || "—"}`); line(`Por faixa etária: ${A.faixas.map((c) => `${c.nome} ${c.n}`).join("; ") || "—"}`);
      line(`Principais condições: ${A.condicoes.slice(0, 10).map((c) => `${c.nome} (${c.n})`).join("; ") || "—"}`);
      line("Qualidade e segurança", 12, true);
      line(`Alertas recebidos: ${resumo.alertas} · Liberações (override): ${resumo.overrides} · Uso de modelo/protocolo: ${resumo.uso_protocolo_pct}%`);
      line(`Tempo médio de montagem: ${resumo.tempo_medio_s ? fmtMin(resumo.tempo_medio_s) : "—"}`);
      line("Educação continuada", 12, true);
      line(`Horas registradas: ${horasCme}`); (cme.data ?? []).slice(0, 15).forEach((c) => line(`• ${c.titulo}${c.fonte ? ` (${c.fonte})` : ""} — ${c.horas} h — ${c.concluido_em}`, 9));
      line("Conquistas", 12, true); line(resumo.conquistas.join("; ") || "—");
      y += 4; line(`Verificação: ${url}`, 8); line(`Impressão digital SHA-256: ${hash}`, 7);
      line("Documento gerado a partir dos registros do PrescriMed. A assinatura da instituição emissora deve ser aplicada pelo responsável institucional.", 7);
      d.save(`portfolio-prescrimed-${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success("Portfólio gerado com QR Code de verificação.");
    } catch (e) { toast.error((e as Error).message || "Não foi possível gerar o portfólio."); }
  }

  const loading = evs.isLoading || prefs.isLoading;
  const pp = pares.data as { suficiente?: boolean; n?: number; emissoes?: number[]; taxa_override?: number[]; segundos?: number[]; protocolo?: number[] } | null;

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="ghost" size="icon" aria-label="Voltar ao atendimento"><Link to="/app"><ArrowLeft className="size-4" /></Link></Button>
        <div className="mr-auto">
          <h1 className="text-2xl font-semibold text-foreground">Inteligência prescritiva</h1>
          <p className="text-sm text-muted-foreground">Seus padrões de prescrição, só visíveis para você. Comparações com pares são anônimas.</p>
        </div>
        <Select value={periodo} onValueChange={(v) => { setPeriodoLocal(v); savePrefs.mutate({ periodicidade: v }); }}>
          <SelectTrigger className="w-40" aria-label="Periodicidade do relatório"><SelectValue /></SelectTrigger>
          <SelectContent>{Object.entries(PERIODOS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
        </Select>
        <Button onClick={exportar}><Download className="size-4" /> Portfólio</Button>
      </div>

      {loading ? <p className="text-sm text-muted-foreground">Carregando…</p> : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi icon={TrendingUp} label="Documentos no período" value={String(A.em.length)} hint={`anterior: ${A.emPrev.length}`} />
            <Kpi icon={ShieldAlert} label="Alertas · liberações" value={`${A.alertas.length} · ${A.overrides.length}`} hint={`taxa de override ${pct(A.overrides.length, A.alertas.length)}%`} />
            <Kpi icon={Timer} label="Tempo médio de montagem" value={A.avg(A.segs) ? fmtMin(A.avg(A.segs)!) : "—"} hint="da escolha da condição ao PDF" />
            <Kpi icon={BookOpen} label="Uso de modelo/protocolo" value={`${A.protoTaxa}%`} hint={`${A.seqTotal} documentos seguidos sem override`} />
          </div>

          {sinais.length > 0 && (
            <Card className="border-warning/50"><CardHeader className="pb-2"><CardTitle className="text-base">Padrões que merecem atenção</CardTitle><CardDescription>Regras estatísticas transparentes sobre seus registros; não substituem julgamento clínico.</CardDescription></CardHeader>
              <CardContent className="space-y-2">{sinais.map((s, i) => <div key={i} className="flex items-start gap-2 text-sm"><Badge variant={s.nivel === "alto" ? "destructive" : "secondary"}>{s.nivel === "alto" ? "Alto" : s.nivel === "medio" ? "Médio" : "Info"}</Badge><span className="text-foreground">{s.texto}</span></div>)}</CardContent></Card>
          )}

          <Tabs defaultValue="quadros">
            <TabsList className="flex h-auto flex-wrap">
              <TabsTrigger value="quadros">Quadros</TabsTrigger><TabsTrigger value="meds">Medicamentos</TabsTrigger><TabsTrigger value="seg">Segurança</TabsTrigger>
              <TabsTrigger value="efic">Eficiência e protocolos</TabsTrigger><TabsTrigger value="pares">Pares</TabsTrigger><TabsTrigger value="edu">Educação</TabsTrigger><TabsTrigger value="conq">Conquistas</TabsTrigger>
            </TabsList>

            <TabsContent value="quadros" className="grid gap-4 md:grid-cols-2">
              <Card><CardHeader><CardTitle className="text-base">Condições mais atendidas</CardTitle></CardHeader><CardContent><Rank data={A.condicoes} total={A.em.length} /></CardContent></Card>
              <Card><CardHeader><CardTitle className="text-base">Faixa etária</CardTitle></CardHeader><CardContent><Rank data={A.faixas} total={A.em.length} /></CardContent></Card>
              <Card><CardHeader><CardTitle className="text-base">Contexto e gravidade</CardTitle><CardDescription>Inferido do módulo usado: ambulatorial, internação ou Modo Emergência.</CardDescription></CardHeader><CardContent><Rank data={A.contextos} total={A.em.length} /></CardContent></Card>
              <Card><CardHeader><CardTitle className="text-base">Sazonalidade (todos os meses)</CardTitle></CardHeader><CardContent className="h-56">
                {A.sazonal.length ? <ResponsiveContainer><BarChart data={A.sazonal}><CartesianGrid strokeDasharray="3 3" className="stroke-border" /><XAxis dataKey="m" fontSize={11} /><YAxis allowDecimals={false} fontSize={11} /><Tooltip /><Bar dataKey="n" name="Documentos" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer> : <Empty>Sem documentos ainda.</Empty>}
              </CardContent></Card>
              <Card className="md:col-span-2"><CardHeader><CardTitle className="text-base">Desfechos</CardTitle></CardHeader><CardContent><Empty>O PrescriMed ainda não registra desfechos (alta, transferência, reinternação, óbito). Eles aparecerão aqui quando o registro de desfecho for incluído no atendimento.</Empty></CardContent></Card>
            </TabsContent>

            <TabsContent value="meds" className="grid gap-4 md:grid-cols-2">
              <Card><CardHeader><CardTitle className="text-base">Princípios ativos</CardTitle></CardHeader><CardContent><Rank data={A.principios} total={A.meds.length} /></CardContent></Card>
              <Card><CardHeader><CardTitle className="text-base">Classes terapêuticas</CardTitle></CardHeader><CardContent><Rank data={A.classes} total={A.meds.length} /></CardContent></Card>
              <Card className="md:col-span-2"><CardHeader><CardTitle className="text-base">Variabilidade dos pacientes por medicamento</CardTitle><CardDescription>Peso médio e coeficiente de variação (CV). CV alto indica casos heterogêneos; as doses são sempre calculadas pelo motor conforme o peso.</CardDescription></CardHeader><CardContent>
                {A.pesoPorMed.size ? <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-muted-foreground"><th className="py-1">Medicamento</th><th>n</th><th>Peso médio</th><th>CV</th></tr></thead><tbody>
                  {[...A.pesoPorMed.entries()].sort((a, b) => b[1].length - a[1].length).slice(0, 12).map(([n, ws]) => { const c = cv(ws); return <tr key={n} className="border-t border-border"><td className="py-1 text-foreground">{n}</td><td className="font-mono">{ws.length}</td><td className="font-mono">{(ws.reduce((s, x) => s + x, 0) / ws.length).toFixed(1)} kg</td><td>{c == null ? "—" : <Badge variant={c > 0.6 ? "secondary" : "outline"}>{Math.round(c * 100)}%</Badge>}</td></tr>; })}
                </tbody></table></div> : <Empty>Sem medicamentos com peso registrado no período.</Empty>}
                <p className="mt-3 text-xs text-muted-foreground">Comparação de dose mg/kg com faixas recomendadas, lista de essenciais da OMS e padronização institucional ainda não estão disponíveis: exigem tabelas de referência validadas que a base não contém.</p>
              </CardContent></Card>
            </TabsContent>

            <TabsContent value="seg" className="grid gap-4 md:grid-cols-2">
              <Card><CardHeader><CardTitle className="text-base">Tipos de alerta</CardTitle></CardHeader><CardContent><Rank data={A.tiposAlerta} total={A.alertas.length} /></CardContent></Card>
              <Card><CardHeader><CardTitle className="text-base">Aceitação × liberação</CardTitle></CardHeader><CardContent className="space-y-3">
                <div className="flex justify-between text-sm"><span>Alertas respeitados</span><b className="font-mono">{Math.max(0, A.alertas.length - A.overrides.length)}</b></div>
                <div className="flex justify-between text-sm"><span>Liberados com justificativa</span><b className="font-mono">{A.overrides.filter((o) => o.justificativa).length}</b></div>
                <div className="flex justify-between text-sm"><span>Liberados sem justificativa</span><b className="font-mono text-destructive">{A.overrides.filter((o) => !o.justificativa).length}</b></div>
                <Progress value={100 - pct(A.overrides.length, A.alertas.length)} />
              </CardContent></Card>
              <Card><CardHeader><CardTitle className="text-base">Justificativas de override</CardTitle></CardHeader><CardContent><Rank data={A.justif} total={A.overrides.length} /></CardContent></Card>
              <Card><CardHeader><CardTitle className="text-base">Medicamentos com override</CardTitle></CardHeader><CardContent><Rank data={A.overrideMeds} total={A.overrides.length} /></CardContent></Card>
            </TabsContent>

            <TabsContent value="efic" className="grid gap-4 md:grid-cols-2">
              <Card className="md:col-span-2"><CardHeader><CardTitle className="text-base">Documentos por dia</CardTitle></CardHeader><CardContent className="h-56">
                {A.serie.length ? <ResponsiveContainer><LineChart data={A.serie}><CartesianGrid strokeDasharray="3 3" className="stroke-border" /><XAxis dataKey="d" fontSize={11} /><YAxis allowDecimals={false} fontSize={11} /><Tooltip /><Line dataKey="n" name="Documentos" stroke="hsl(var(--primary))" strokeWidth={2} /></LineChart></ResponsiveContainer> : <Empty>Sem documentos no período.</Empty>}
              </CardContent></Card>
              <Card><CardHeader><CardTitle className="text-base">Tempo de montagem</CardTitle></CardHeader><CardContent className="space-y-2 text-sm">
                <div className="flex justify-between"><span>Com modelo/protocolo</span><b className="font-mono">{A.avg(A.segProt) ? fmtMin(A.avg(A.segProt)!) : "—"}</b></div>
                <div className="flex justify-between"><span>Prescrição livre</span><b className="font-mono">{A.avg(A.segLivre) ? fmtMin(A.avg(A.segLivre)!) : "—"}</b></div>
                {A.avg(A.segProt) && A.avg(A.segLivre) && A.avg(A.segLivre)! > A.avg(A.segProt)! && (
                  <p className="rounded-md bg-accent p-2 text-accent-foreground">Usar modelos em todos os atendimentos livres economizaria cerca de {fmtMin((A.avg(A.segLivre)! - A.avg(A.segProt)!) * A.segLivre.length)} no período.</p>
                )}
              </CardContent></Card>
              <Card><CardHeader><CardTitle className="text-base">Tempo por módulo (volume)</CardTitle></CardHeader><CardContent><Rank data={A.modulos} total={A.em.length} /></CardContent></Card>
              <Card className="md:col-span-2"><CardHeader><CardTitle className="text-base">Desvios de protocolo e justificativas</CardTitle></CardHeader><CardContent><Rank data={A.desvios} total={A.desvios.reduce((s, d) => s + d.n, 0)} /></CardContent></Card>
            </TabsContent>

            <TabsContent value="pares" className="space-y-4">
              <Card><CardHeader><CardTitle className="text-base">Você entre os pares</CardTitle><CardDescription>{pp?.n ?? 0} médico(s) com registros no período. Faixa = P25–P75; traço = mediana; marcador verde = você.</CardDescription></CardHeader><CardContent className="space-y-5">
                <div><p className="mb-1 text-sm font-medium">Documentos emitidos</p><Box p={pp?.suficiente ? pp.emissoes : null} mine={A.em.length} fmt={(n) => String(Math.round(n))} /></div>
                <div><p className="mb-1 text-sm font-medium">Taxa de override</p><Box p={pp?.suficiente ? pp.taxa_override : null} mine={A.alertas.length ? A.overrides.length / A.alertas.length : null} fmt={(n) => `${Math.round(n * 100)}%`} /></div>
                <div><p className="mb-1 text-sm font-medium">Tempo médio de montagem</p><Box p={pp?.suficiente ? pp.segundos : null} mine={A.avg(A.segs)} fmt={fmtMin} /></div>
                <div><p className="mb-1 text-sm font-medium">Uso de protocolo</p><Box p={pp?.suficiente ? pp.protocolo : null} mine={A.em.length ? A.protoTaxa / 100 : null} fmt={(n) => `${Math.round(n * 100)}%`} /></div>
              </CardContent></Card>
              <Card><CardHeader><CardTitle className="text-base">Seu perfil para comparação</CardTitle><CardDescription>Usado para estratificar os pares quando houver volume suficiente.</CardDescription></CardHeader><CardContent className="grid gap-3 sm:grid-cols-3">
                <div><Label>Especialidade</Label><Input defaultValue={(prefs.data?.especialidade as string) ?? ""} onBlur={(e) => savePrefs.mutate({ especialidade: e.target.value })} /></div>
                <div><Label>Anos desde a residência</Label><Input type="number" defaultValue={(prefs.data?.anos_formado as number) ?? ""} onBlur={(e) => savePrefs.mutate({ anos_formado: Number(e.target.value) || null })} /></div>
                <div><Label>Tipo de prática</Label><Select defaultValue={(prefs.data?.tipo_pratica as string) ?? undefined} onValueChange={(v) => savePrefs.mutate({ tipo_pratica: v })}><SelectTrigger><SelectValue placeholder="Escolha" /></SelectTrigger><SelectContent><SelectItem value="academica">Acadêmica</SelectItem><SelectItem value="comunitaria">Comunitária</SelectItem></SelectContent></Select></div>
              </CardContent></Card>
            </TabsContent>

            <TabsContent value="edu" className="grid gap-4 md:grid-cols-2">
              <Card className="md:col-span-2"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Sparkles className="size-4" /> Sugestões pelos seus dados</CardTitle></CardHeader><CardContent className="space-y-3">
                {educ.length ? educ.map((e) => <div key={e.tema} className="rounded-md border border-border p-3"><p className="font-medium text-foreground">{e.tema}</p><p className="text-sm text-muted-foreground">{e.motivo}</p><div className="mt-2 flex flex-wrap gap-2">{e.links.map(([n, u]) => <Button key={n} asChild size="sm" variant="outline"><a href={u} target="_blank" rel="noreferrer">{n}</a></Button>)}</div></div>)
                  : <Empty>Nenhuma lacuna identificada no período. As sugestões aparecem conforme seus registros.</Empty>}
              </CardContent></Card>
              <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><GraduationCap className="size-4" /> Educação continuada</CardTitle><CardDescription>{horasCme} de {meta} h{diasPrazo != null && ` · prazo em ${diasPrazo} dia(s)`}</CardDescription></CardHeader><CardContent className="space-y-3">
                <Progress value={Math.min(100, pct(horasCme, meta))} />
                {diasPrazo != null && diasPrazo <= 60 && horasCme < meta && <p className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">Faltam {meta - horasCme} h e o prazo vence em {diasPrazo} dia(s).</p>}
                <div className="grid grid-cols-2 gap-2"><div><Label>Meta (h)</Label><Input type="number" defaultValue={meta} onBlur={(e) => savePrefs.mutate({ cme_meta_horas: Number(e.target.value) || 50 })} /></div><div><Label>Prazo</Label><Input type="date" defaultValue={prazo ?? ""} onBlur={(e) => savePrefs.mutate({ cme_prazo: e.target.value || null })} /></div></div>
              </CardContent></Card>
              <Card><CardHeader><CardTitle className="text-base">Registrar atividade ou certificado</CardTitle></CardHeader><CardContent className="space-y-2">
                <Input placeholder="Título (curso, webinar, artigo)" value={novo.titulo} onChange={(e) => setNovo({ ...novo, titulo: e.target.value })} />
                <div className="grid grid-cols-3 gap-2"><Input placeholder="Fonte" value={novo.fonte} onChange={(e) => setNovo({ ...novo, fonte: e.target.value })} /><Input placeholder="Horas" value={novo.horas} onChange={(e) => setNovo({ ...novo, horas: e.target.value })} /><Input type="date" value={novo.concluido_em} onChange={(e) => setNovo({ ...novo, concluido_em: e.target.value })} /></div>
                <Button onClick={() => addCme.mutate()} disabled={addCme.isPending}>Registrar</Button>
                <ul className="max-h-48 space-y-1 overflow-auto text-sm">{(cme.data ?? []).map((c) => <li key={c.id} className="flex justify-between border-t border-border pt-1"><span>{c.titulo}{c.fonte && <span className="text-muted-foreground"> · {c.fonte}</span>}</span><span className="font-mono text-muted-foreground">{c.horas} h</span></li>)}</ul>
              </CardContent></Card>
            </TabsContent>

            <TabsContent value="conq" className="grid gap-3 md:grid-cols-2">
              {conquistas.map((c) => <Card key={c.nome}><CardContent className="flex items-center gap-3 p-4">
                <Award className={c.ok ? "size-6 text-success" : "size-6 text-muted-foreground"} />
                <div className="flex-1"><p className="text-sm font-medium text-foreground">{c.nome}</p><Progress value={c.prog} className="mt-1 h-1.5" /></div>
                {c.ok && <Badge>Conquistada</Badge>}
              </CardContent></Card>)}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
