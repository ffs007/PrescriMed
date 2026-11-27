import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Award, CheckCircle2, ChevronLeft, ChevronRight, Circle, GraduationCap, PlayCircle } from "lucide-react";
import jsPDF from "jspdf";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type Perfil = "residente" | "plantonista" | "preceptor";
const PERFIS: Record<Perfil, { nome: string; desc: string }> = {
  residente: { nome: "Residente / recém-formado", desc: "Explicações completas em cada passo." },
  plantonista: { nome: "Plantonista / emergencista", desc: "Foco em velocidade: busca, Modo Emergência e atalhos." },
  preceptor: { nome: "Preceptor / gestor", desc: "Foco em protocolos, auditoria e painel de inteligência." },
};

type Passo = { t: string; resumo: string; pontos: string[]; pratica: string; quiz: { p: string; o: string[]; c: number }[] };
const PASSOS: Passo[] = [
  { t: "Bem-vindo ao PrescriMed", resumo: "Um cockpit clínico de precisão: a IA sugere, você decide. Nenhum documento sai sem a sua revisão.",
    pontos: ["Catálogo organizado por síndrome → condição → prescrição.", "Doses calculadas pelo peso e conferidas por alertas de segurança.", "Todo PDF exige marcar “Revisei este documento”."],
    pratica: "Escolha seu perfil acima: o tour se adapta a ele.",
    quiz: [{ p: "Quem decide a conduta final?", o: ["A IA", "O médico", "O sistema automaticamente"], c: 1 }] },
  { t: "Busca clínica", resumo: "Encontre o quadro pelo nome, CID-10, sintoma ou iniciais a partir do 2º caractere.",
    pontos: ["Exemplo: digite “J18” ou “pneumo”.", "Erros de digitação são tolerados.", "Atalho “/” leva ao campo de busca."],
    pratica: "No atendimento, digite “bronq” e abra Bronquiolite.",
    quiz: [{ p: "A busca aceita código CID-10?", o: ["Sim", "Não"], c: 0 }] },
  { t: "Ficha do paciente", resumo: "Paciente didático: João, 8 meses, 8,2 kg, bronquiolite, alergia a amoxicilina.",
    pontos: ["Idade e peso são checados em tempo real (ex.: 82 kg num lactente gera aviso).", "Alergias aparecem como etiquetas vermelhas.", "Creatinina permite ajuste renal automático."],
    pratica: "Preencha idade 8 meses e peso 8,2 kg na ficha.",
    quiz: [{ p: "Peso 82 kg para 8 meses:", o: ["É aceito sem aviso", "Gera alerta de inconsistência"], c: 1 }] },
  { t: "Primeira prescrição", resumo: "Selecione os medicamentos sugeridos; a dose é recalculada pelo peso.",
    pontos: ["Unidades padronizadas: mg/kg/dia, gotas, mL.", "Intervalos e horários sugeridos.", "Orientações ao cuidador sobre preparo de suspensões."],
    pratica: "Marque um antitérmico e confira a dose em mL.",
    quiz: [{ p: "Ao mudar o peso, a dose:", o: ["Permanece igual", "É recalculada"], c: 1 }] },
  { t: "Os 4 escudos de segurança", resumo: "Experimente provocar alertas para conhecê-los.",
    pontos: ["Alergia documentada: bloqueio e sugestão de substituição.", "Dose máxima por idade/peso.", "Função renal (ClCr).", "Gestação e lactação por trimestre."],
    pratica: "Tente prescrever amoxicilina para o João e veja o bloqueio.",
    quiz: [{ p: "Prescrever um alérgeno documentado:", o: ["Passa sem aviso", "Dispara alerta e pede justificativa"], c: 1 }] },
  { t: "Checklist antes de emitir", resumo: "Conferência de interações, duplicidades e campos obrigatórios antes de liberar o documento.",
    pontos: ["Duplicidade terapêutica é sinalizada.", "Interações relevantes aparecem no painel.", "Só após revisar o botão de PDF é liberado."],
    pratica: "Abra a revisão e marque “Revisei este documento”.",
    quiz: [{ p: "Sem marcar “Revisei este documento”:", o: ["O PDF é baixado", "O download fica bloqueado"], c: 1 }] },
  { t: "Emissão do PDF", resumo: "Um único PDF: receita comum em A4 retrato e controle especial em A4 paisagem.",
    pontos: ["Até 10 itens comuns por folha, numeração contínua.", "Controle especial (Portaria 344/98): até 3 por folha, 2 vias lado a lado.", "Pré-visualização antes de baixar."],
    pratica: "Gere a prescrição ambulatorial e abra a pré-visualização.",
    quiz: [{ p: "Quantos itens de controle especial por folha?", o: ["Até 3", "Até 10"], c: 0 }] },
  { t: "Entrega ao paciente", resumo: "Envie a orientação pelo WhatsApp com mensagem estruturada.",
    pontos: ["O texto abre pronto no WhatsApp para você revisar.", "O paciente recebe a mensagem no celular.", "O PDF deve ser anexado por você."],
    pratica: "No Modo Emergência, use “Enviar” para ver a mensagem.",
    quiz: [{ p: "A mensagem é enviada sem você ver?", o: ["Sim", "Não, abre para revisão"], c: 1 }] },
  { t: "Painel de Inteligência", resumo: "Acompanhe seus indicadores, adesão a protocolos e portfólio com horas de educação continuada.",
    pontos: ["Comparação com colegas só de forma anônima.", "Portfólio em PDF com QR Code verificável.", "Este certificado entra no seu portfólio."],
    pratica: "Abra o Painel de Inteligência no menu lateral.",
    quiz: [{ p: "A comparação com colegas é:", o: ["Nominal", "Anônima"], c: 1 }] },
];
const ORDEM: Record<Perfil, number[]> = {
  residente: [0, 1, 2, 3, 4, 5, 6, 7, 8],
  plantonista: [0, 1, 2, 4, 3, 6, 7, 5, 8],
  preceptor: [0, 8, 5, 4, 1, 2, 3, 6, 7],
};
const LS = "psx.onboarding";

export default function TutorialPage() {
  const { toast } = useToast();
  const [uid, setUid] = useState<string | null>(null);
  const [perfil, setPerfil] = useState<Perfil>("residente");
  const [feitos, setFeitos] = useState<number[]>([]);
  const [pos, setPos] = useState(0);
  const [quiz, setQuiz] = useState<Record<number, number>>({});
  const [modoQuiz, setModoQuiz] = useState(false);
  const [cert, setCert] = useState<string | null>(null);

  useEffect(() => {
    try { const s = JSON.parse(localStorage.getItem(LS) || "{}"); if (s.perfil) setPerfil(s.perfil); if (s.passos) setFeitos(s.passos); } catch { /* ignore */ }
    supabase.auth.getUser().then(async ({ data }) => {
      const id = data.user?.id; if (!id) return; setUid(id);
      const { data: p } = await supabase.from("onb_progresso").select("perfil,passos").eq("user_id", id).maybeSingle();
      if (p) { setPerfil(p.perfil as Perfil); setFeitos((p.passos as number[]) || []); }
      const { data: c } = await supabase.from("onb_certificados").select("codigo").eq("user_id", id).limit(1);
      if (c?.[0]) setCert(c[0].codigo);
    });
  }, []);

  const salvar = (pf: Perfil, ps: number[]) => {
    localStorage.setItem(LS, JSON.stringify({ perfil: pf, passos: ps }));
    if (uid) supabase.from("onb_progresso").upsert({ user_id: uid, perfil: pf, passos: ps, updated_at: new Date().toISOString() }).then(() => {});
  };

  const ordem = ORDEM[perfil];
  const idx = ordem[pos];
  const passo = PASSOS[idx];
  const pct = useMemo(() => Math.round((feitos.length / PASSOS.length) * 100), [feitos]);
  const completo = feitos.length >= PASSOS.length;

  const concluir = (i: number) => {
    if (feitos.includes(i)) return;
    const n = [...feitos, i]; setFeitos(n); salvar(perfil, n);
  };
  const trocarPerfil = (p: Perfil) => { setPerfil(p); setPos(0); salvar(p, feitos); };

  const responderQuiz = () => {
    const ok = passo.quiz.every((q, k) => quiz[k] === q.c);
    if (ok) { concluir(idx); toast({ title: "Etapa validada pelo teste rápido" }); setModoQuiz(false); setQuiz({}); if (pos < 8) setPos(pos + 1); }
    else toast({ title: "Resposta incorreta", description: "Revise o conteúdo da etapa e tente de novo.", variant: "destructive" });
  };

  const emitirCertificado = async () => {
    if (!uid) { toast({ title: "Entre na sua conta para emitir" }); return; }
    const { data: prof } = await supabase.from("profiles").select("full_name,crm").eq("id", uid).maybeSingle();
    const nome = prof?.full_name?.trim();
    if (!nome) { toast({ title: "Preencha seu nome no perfil", description: "O certificado precisa do seu nome completo.", variant: "destructive" }); return; }
    let codigo = cert;
    if (!codigo) {
      codigo = "ONB-" + crypto.randomUUID().slice(0, 8).toUpperCase();
      const { error } = await supabase.from("onb_certificados").insert({ codigo, user_id: uid, nome, crm: prof?.crm || null, perfil: PERFIS[perfil].nome, carga_horas: 1 });
      if (error) { toast({ title: "Não foi possível registrar", description: error.message, variant: "destructive" }); return; }
      setCert(codigo);
    }
    const url = `${window.location.origin}/verificar-certificado/${codigo}`;
    const qr = await QRCode.toDataURL(url, { margin: 1, width: 240 });
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    doc.setDrawColor(22, 93, 255); doc.setLineWidth(1.2); doc.rect(10, 10, 277, 190);
    doc.setFont("helvetica", "bold"); doc.setFontSize(26); doc.setTextColor(22, 93, 255);
    doc.text("Certificado de Capacitação", 148.5, 45, { align: "center" });
    doc.setTextColor(30, 30, 30); doc.setFont("helvetica", "normal"); doc.setFontSize(14);
    doc.text("Certificamos que", 148.5, 65, { align: "center" });
    doc.setFont("helvetica", "bold"); doc.setFontSize(22); doc.text(nome, 148.5, 80, { align: "center" });
    doc.setFont("helvetica", "normal"); doc.setFontSize(12);
    if (prof?.crm) doc.text(`CRM ${prof.crm}`, 148.5, 89, { align: "center" });
    doc.setFontSize(13);
    doc.text(doc.splitTextToSize(`concluiu o Tour Interativo de Prescrição Eletrônica Segura do PrescriMed (trilha ${PERFIS[perfil].nome}), com carga horária de 1 hora, abrangendo busca clínica, cálculo de doses, alertas de segurança, emissão de receitas e controle especial.`, 220), 148.5, 105, { align: "center" });
    doc.setFontSize(11);
    doc.text(`Emitido em ${new Date().toLocaleString("pt-BR")}`, 30, 175);
    doc.text(`Código de autenticidade: ${codigo}`, 30, 182);
    doc.text(`Verifique em: ${url}`, 30, 189);
    doc.addImage(qr, "PNG", 230, 145, 42, 42);
    doc.save(`certificado-prescrimed-${codigo}.pdf`);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon" aria-label="Voltar"><Link to="/app"><ArrowLeft className="h-4 w-4" /></Link></Button>
        <div className="flex-1">
          <h1 className="flex items-center gap-2 text-2xl font-semibold"><GraduationCap className="h-6 w-6 text-primary" /> Tutorial & Certificação</h1>
          <p className="text-sm text-muted-foreground">9 passos guiados. Você pode sair e voltar quando quiser — o progresso fica salvo.</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Sua trilha</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-3">
            {(Object.keys(PERFIS) as Perfil[]).map((p) => (
              <button key={p} onClick={() => trocarPerfil(p)}
                className={`rounded-lg border p-3 text-left transition ${perfil === p ? "border-primary bg-primary/10" : "border-border hover:bg-muted"}`}>
                <div className="text-sm font-medium">{PERFIS[p].nome}</div>
                <div className="text-xs text-muted-foreground">{PERFIS[p].desc}</div>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3"><Progress value={pct} className="flex-1" /><span className="text-sm font-medium">{pct}%</span></div>
          <div className="flex flex-wrap gap-1">
            {ordem.map((i, k) => (
              <button key={i} onClick={() => { setPos(k); setModoQuiz(false); }} aria-label={`Passo ${k + 1}`}
                className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs ${k === pos ? "border-primary" : "border-border"} ${feitos.includes(i) ? "bg-success text-success-foreground" : ""}`}>{k + 1}</button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <Badge variant="secondary">Passo {pos + 1} de 9</Badge>
            {feitos.includes(idx) ? <span className="flex items-center gap-1 text-sm text-success"><CheckCircle2 className="h-4 w-4" /> Concluído</span> : <Circle className="h-4 w-4 text-muted-foreground" />}
          </div>
          <CardTitle>{passo.t}</CardTitle>
          <CardDescription>{passo.resumo}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!modoQuiz ? (
            <>
              <ul className="list-disc space-y-1 pl-5 text-sm">{passo.pontos.map((x) => <li key={x}>{x}</li>)}</ul>
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm"><strong>Pratique:</strong> {passo.pratica}</div>
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="outline"><Link to="/app"><PlayCircle className="mr-1 h-4 w-4" /> Praticar no atendimento</Link></Button>
                <Button variant="ghost" onClick={() => setModoQuiz(true)}>Pular com teste rápido</Button>
                <Button onClick={() => { concluir(idx); if (pos < 8) setPos(pos + 1); }}>Marcar como concluído</Button>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              {passo.quiz.map((q, k) => (
                <div key={q.p}><p className="mb-2 text-sm font-medium">{q.p}</p>
                  <div className="flex flex-wrap gap-2">{q.o.map((o, j) => (
                    <Button key={o} size="sm" variant={quiz[k] === j ? "default" : "outline"} onClick={() => setQuiz({ ...quiz, [k]: j })}>{o}</Button>
                  ))}</div>
                </div>
              ))}
              <div className="flex gap-2"><Button onClick={responderQuiz}>Confirmar</Button><Button variant="ghost" onClick={() => setModoQuiz(false)}>Voltar ao conteúdo</Button></div>
            </div>
          )}
          <div className="flex justify-between border-t pt-3">
            <Button variant="ghost" disabled={pos === 0} onClick={() => { setPos(pos - 1); setModoQuiz(false); }}><ChevronLeft className="h-4 w-4" /> Anterior</Button>
            <Button variant="ghost" disabled={pos === 8} onClick={() => { setPos(pos + 1); setModoQuiz(false); }}>Próximo <ChevronRight className="h-4 w-4" /></Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Award className="h-5 w-5 text-warning" /> Certificado (1 hora)</CardTitle>
          <CardDescription>{completo ? "Todas as etapas concluídas. Emita seu certificado com QR Code de verificação." : `Conclua as 9 etapas para liberar (faltam ${PASSOS.length - feitos.length}).`}</CardDescription></CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Button disabled={!completo} onClick={emitirCertificado}>{cert ? "Baixar certificado novamente" : "Emitir certificado"}</Button>
          {feitos.includes(4) && <Badge variant="outline">Guardião da Dose Pediátrica</Badge>}
          {feitos.includes(6) && <Badge variant="outline">Mestre do Controle Especial</Badge>}
        </CardContent>
      </Card>
    </div>
  );
}
