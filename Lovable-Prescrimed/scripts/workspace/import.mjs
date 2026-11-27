#!/usr/bin/env node
/* Importa o catalogo do default-workspace (sindromes v0.2.0) para o formato
   content/condicoes/*.json, que e o unico consumido por scripts/content/build.mjs.
   Regras: emite rascunho; nao inventa dose; nao sobrescreve conteudo aprovado sem flag.
   Uso:
     node scripts/workspace/import.mjs --dry
     node scripts/workspace/import.mjs
     node scripts/workspace/import.mjs --substituir-aprovados
     node scripts/workspace/import.mjs --limite 5 --dry
*/
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { carregarMotor, resolverAmbulatorial, resolverHospitalar, viaHospitalar, norm } from "./lib/engine.mjs";
import { parseDose, comporPos, humanizarClasse, limpar } from "./lib/dose.mjs";

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const args = process.argv.slice(2);
const flag = (f) => args.includes(f);
const valor = (f, d) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : d; };

const DRY = flag("--dry");
const FORCAR = flag("--forcar");
const MESCLAR = flag("--mesclar");
const SUBSTITUIR_APROVADOS = flag("--substituir-aprovados");
const LIMITE = valor("--limite", null) ? Number(valor("--limite")) : null;
/* --somente ALG-07,INF-08 : limita a importacao a sindromes especificas (id do workspace) */
const SOMENTE = valor("--somente", null)
  ? new Set(valor("--somente").split(",").map((s) => s.trim().toUpperCase()))
  : null;
const WS_DIR = resolve(raiz, "default-workspace/sindromes");
const OUT_DIR = resolve(raiz, valor("--out", "content/condicoes"));
const REL_DIR = resolve(raiz, "reports/workspace");
const HOJE = "2026-11-06";

const motor = carregarMotor();
const wsFiles = readdirSync(WS_DIR).filter((f) => /^[A-Z]{2,4}-\d\d_.*\.json$/.test(f)).sort();
const curados = new Map();
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
for (const f of readdirSync(OUT_DIR).filter((f) => f.endsWith(".json"))) {
  const c = JSON.parse(readFileSync(resolve(OUT_DIR, f), "utf8"));
  curados.set(f, c);
}

const POR_PAPEL = { primeira_linha: 0, alternativa: 1, condicional: 2, resgate: 3 };
const ROTULO_PAPEL = { primeira_linha: "1a linha", alternativa: "alternativa", condicional: "condicional", resgate: "resgate" };

const slug = (s) => norm(s).replace(/\s+/g, "_").slice(0, 40) || "item";
const normNome = (s) => norm(s);
const score = (c) => {
  const classes = (c.ambulatorial?.classes || []).length + (c.hospitalar?.classes || []).length;
  const itens = (c.ambulatorial?.classes || []).reduce((a, k) => a + (k.itens || []).length, 0)
    + (c.hospitalar?.classes || []).reduce((a, k) => a + (k.itens || []).length, 0);
  const ped = JSON.stringify(c).match(/"ped"/g)?.length || 0;
  return classes * 3 + itens + (c.redFlags || []).length * 2 + ped * 2 + (c.alerta ? 5 : 0) + (c.naoUsar || []).length * 3;
};

/* ---------- monta o registro no formato content/condicoes ---------- */
function montar(s, arquivo) {
  const meds = [...(s.medicamentos || [])].sort(
    (a, b) => (POR_PAPEL[a.papel] ?? 9) - (POR_PAPEL[b.papel] ?? 9)
  );
  const receitaAmb = s.documentos?.receita_ambulatorial?.itens || [];
  const receitaHosp = s.documentos?.receita_hospitalar?.itens || [];
  const pedPop = (s.populacoes_especiais || []).find((p) => /crian/i.test(p.populacao || ""));
  const usadosNovo = new Set();
  const naoUsar = [];

  const classesAmb = new Map();
  const classesHosp = new Map();
  const semMatch = [];
  let nBase = 0, nHosp = 0, nNovo = 0, parseOk = 0, parseFalha = 0, nDup = 0;

  /* V4: a mesma molecula nao pode aparecer duas vezes na mesma classe */
  const vistosClasse = new Map();
  const jaNaClasse = (classe, chave) => {
    if (!vistosClasse.has(classe)) vistosClasse.set(classe, new Set());
    const s = vistosClasse.get(classe);
    if (s.has(chave)) return true;
    s.add(chave);
    return false;
  };

  const casaReceita = (agente, lista) => {
    const alvo = normNome(agente).split(" ").slice(0, 2).join(" ");
    if (!alvo) return null;
    return lista.find((i) => normNome(i.item).includes(alvo) || normNome(agente).includes(normNome(i.item).split(" ").slice(0, 2).join(" "))) || null;
  };

  for (const m of meds) {
    const agente = limpar(m.agente || m.nome || "");
    if (!agente) continue;
    const doseTxt = [m.dose, m.frequencia, m.duracao, m.dose_maxima ? "max. " + m.dose_maxima : ""].filter(Boolean).join("; ");
    const dose = parseDose(doseTxt);
    if (dose.status === "ok") parseOk++; else parseFalha++;
    const ped = pedPop?.ajuste || dose.ped || null;
    const rx = casaReceita(agente, receitaAmb) || casaReceita(agente, receitaHosp);

    const pos = comporPos({
      dose: m.dose, via: m.via, frequencia: m.frequencia, duracao: m.duracao, tempo_infusao: m.tempo_infusao,
    });
    const motivo = limpar([m.indicacao, ROTULO_PAPEL[m.papel] ? "(" + ROTULO_PAPEL[m.papel] + ")" : "", rx?.condicao || ""].filter(Boolean).join(" "));
    const nota = limpar([m.preparo, (m.monitorizacao || []).map((x) => "monitorar: " + x).join("; ")].filter(Boolean).join(" - ")).slice(0, 320);
    for (const c of m.contraindicacoes || []) {
      const t = limpar(c).replace(/\.$/, "");
      if (t && t.length >= 8 && !naoUsar.some((x) => normNome(x) === normNome(t))) naoUsar.push(t);
    }
    const linha = m.papel === "primeira_linha" ? 1 : 2;
    const classeNome = humanizarClasse(m.classe || "outros");
    const hosp = viaHospitalar(m.via);

    if (hosp) {
      const hit = resolverHospitalar(motor, agente);
      let item;
      if (hit && jaNaClasse(classeNome, hit.id)) { nDup++; continue; }
      if (hit) { nHosp++; item = { linha, hosp: hit.id, motivo, nota, dose }; }
      else {
        nNovo++; semMatch.push({ agente, classe: m.classe, via: m.via });
        let id = slug(agente); while (usadosNovo.has("h_" + id)) id += "_2"; usadosNovo.add("h_" + id);
        item = { linha, novo: { id, n: agente.charAt(0).toUpperCase() + agente.slice(1), ap: limpar(m.apresentacoes?.[0] || ""), via: limpar(m.via || "IV"), pos }, motivo, nota, dose };
      }
      if (!classesHosp.has(classeNome)) classesHosp.set(classeNome, []);
      classesHosp.get(classeNome).push(item);
      continue;
    }

    const hit = resolverAmbulatorial(motor, agente);
    if (hit && jaNaClasse(classeNome, hit.id)) { nDup++; continue; }
    if (hit) { nBase++; }
    else { nNovo++; semMatch.push({ agente, classe: m.classe, via: m.via }); }

    let item;
    if (hit) {
      item = { linha, base: hit.id, pos, posTodas: true, motivo, nota, dose };
      if (ped) item.ped = ped;
    } else {
      let id = slug(agente); while (usadosNovo.has(id)) id += "_2"; usadosNovo.add(id);
      item = { linha, novo: { id, n: agente.charAt(0).toUpperCase() + agente.slice(1), ap: limpar(m.apresentacoes?.[0] || ""), q: "", pos }, motivo, nota, dose };
      if (ped) item.ped = ped;
    }
    if (!classesAmb.has(classeNome)) classesAmb.set(classeNome, []);
    classesAmb.get(classeNome).push(item);
  }

  /* orientacoes viram classe propria (V6) */
  const or = s.orientacoes || {};
  const orientItens = [];
  (or.fazer || []).forEach((t, i) => orientItens.push({ linha: i === 0 ? 1 : 2, novo: { id: "ori_fazer_" + (i + 1), n: "Orientação ao paciente", ap: "", q: "", pos: limpar(t) }, motivo: "cuidados e plano de ação" }));
  (or.evitar || []).forEach((t, i) => orientItens.push({ novo: { id: "ori_evitar_" + (i + 1), n: "Não fazer", ap: "", q: "", pos: limpar(t) }, motivo: "evitar erro de manejo" }));
  if (orientItens.length) classesAmb.set("Orientações e retorno", orientItens);

  /* Medidas nao farmacologicas e procedimentos tambem sao conduta: entram como
     classe propria, com o texto integral da sindrome (nada e reescrito aqui). */
  const nf = s.nao_farmacologico || [];
  if (nf.length) {
    classesAmb.set("Medidas não farmacológicas", nf.map((m, i) => ({
      linha: i === 0 ? 1 : 2,
      novo: { id: "nf_" + (i + 1), n: limpar(m.medida), ap: "", q: "", pos: limpar(m.detalhe) },
      motivo: "medida não farmacológica da síndrome",
    })));
  }
  const proc = s.procedimentos || [];
  if (proc.length) {
    classesHosp.set("Procedimentos à beira do leito", proc.map((p, i) => ({
      linha: i === 0 ? 1 : 2,
      novo: { id: "proc_" + (i + 1), n: limpar(p.nome), ap: "", via: "procedimento", pos: limpar("Indicação: " + (p.indicacao || "") + ". Técnica: " + (p.tecnica || "") + (p.complicacoes ? ". Complicações: " + p.complicacoes : "")) },
      motivo: "procedimento indicado na síndrome",
    })));
  }

  const ordenar = (mapa) => [...mapa.entries()]
    .map(([nome, itens]) => {
      const ord = itens.sort((a, b) => (a.linha || 9) - (b.linha || 9));
      const classe = { nome, itens: ord };
      /* classe sem 1a linha declarada nao ganha preset automatico (V1) */
      if (!ord.some((i) => i.linha === 1)) classe.semPreset = true;
      return classe;
    })
    .sort((a, b) => (b.itens.some((i) => i.linha === 1) ? 1 : 0) - (a.itens.some((i) => i.linha === 1) ? 1 : 0) || b.itens.length - a.itens.length);

  const alarmes = (s.sinais_alarme || []).map((a) => limpar(a.sinal) + (a.acao ? " -> " + limpar(a.acao) : ""));
  const fluxo = (s.fluxo || []).map((f, i) => (i + 1) + ") " + limpar(f)).join(" ");
  const alerta = limpar(
    (alarmes.length ? "Sinais de alarme: " + alarmes.slice(0, 4).join("; ") + ". " : "") + fluxo
  ).slice(0, 1500);

  const id = "ws-" + s.id.toLowerCase().replace("-", "_");
  const registro = {
    id,
    nome: s.nome,
    cat: s.risk_class === "A" ? "Emergência" : (s.area || "Outros"),
    alias: norm([s.nome, ...(s.aliases || [])].join(" ")),
    cid: [],
    status: "rascunho",
    meta: {
      redigido: "import default-workspace (" + arquivo + ", v" + (s.versao || "0.2.0") + ")",
      revisao: null,
      data: HOJE,
      fontes: (s.referencias || []).map((r) => "[verificar] " + limpar(r.tipo) + ": " + limpar(r.o_que_verificar)),
    },
    alerta,
    redFlags: alarmes.slice(0, 8),
    naoUsar: naoUsar.slice(0, 8),
    ambulatorial: { classes: ordenar(classesAmb) },
    hospitalar: { classes: ordenar(classesHosp) },
    ws: {
      id: s.id,
      versao: s.versao || null,
      arquivo,
      area: s.area || null,
      risco: s.risk_class || null,
      populacao: s.populacao || [],
      contexto: s.contexto || [],
      lacunas: (s.lacunas || []).length,
    },
  };
  return { registro, stats: { nBase, nHosp, nNovo, nDup, parseOk, parseFalha, semMatch, orientItens: orientItens.length } };
}

/* ---------- conflito com o curado (Q4: o mais completo vence) ---------- */
function acharCurado(nome) {
  const n = normNome(nome);
  for (const [arquivo, c] of curados) {
    if (arquivo.startsWith("ws-")) continue;
    const cn = normNome(c.nome);
    if (!cn || cn !== n) continue;
    return { arquivo, c };
  }
  return null;
}

/* Semelhanca apenas para relatorio: nomes parecidos NAO sao fundidos sozinhos.
   Casos reais do catalogo ("Colica renal" x "Colica do lactente") mostram que
   similaridade de nome nao e evidencia de mesma doenca. */
const tokensDe = (s) => new Set(normNome(s).split(" ").filter((t) => t.length > 3));
function semelhanca(a, b) {
  const ta = tokensDe(a), tb = tokensDe(b);
  if (!ta.size || !tb.size) return 0;
  let inter = 0;
  for (const t of ta) if (tb.has(t)) inter++;
  /* exige dois radicais em comum: um token so gera falso positivo
     ("HIV agudo" x "AVC agudo") e nao deve aparecer como duplicata. */
  if (inter < 2) return 0;
  return inter / Math.max(ta.size, tb.size);
}
function candidatos(nome) {
  const lista = [];
  for (const p of motor.D.protocols) lista.push({ tipo: "motor", chave: p.id, nome: p.n });
  for (const [arquivo, c] of curados) {
    if (arquivo.startsWith("ws-")) continue;
    lista.push({ tipo: "curado", chave: arquivo.replace(/\.json$/, ""), nome: c.nome });
  }
  return lista
    .map((x) => ({ ...x, score: semelhanca(nome, x.nome) }))
    .filter((x) => x.score >= 0.4)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

function mesclar(c, registro) {
  const marca = (k) => (k.origem || "") === "workspace";
  const classesAtuais = (c.ambulatorial?.classes || []).filter((k) => !marca(k));
  const nomes = new Set(classesAtuais.map((k) => normNome(k.nome)));
  const novas = (registro.ambulatorial?.classes || [])
    .filter((k) => !nomes.has(normNome(k.nome)))
    .map((k) => ({ ...k, origem: "workspace" }));
  const hospAtuais = (c.hospitalar?.classes || []).filter((k) => !marca(k));
  const nomesH = new Set(hospAtuais.map((k) => normNome(k.nome)));
  const novasH = (registro.hospitalar?.classes || [])
    .filter((k) => !nomesH.has(normNome(k.nome)))
    .map((k) => ({ ...k, origem: "workspace" }));
  return {
    ...c,
    alerta: c.alerta || registro.alerta,
    redFlags: (c.redFlags || []).length ? c.redFlags : registro.redFlags,
    naoUsar: c.naoUsar || [],
    ambulatorial: { classes: [...classesAtuais, ...novas] },
    hospitalar: { classes: [...hospAtuais, ...novasH] },
    meta: { ...c.meta, importado: "default-workspace " + (registro.ws?.id || "") + " em " + HOJE },
  };
}

/* ---------- execucao ---------- */
const relatorio = { data: HOJE, total: 0, novos: [], mesclados: [], mantidos: [], bloqueados: [], pulados: [], conflitos: [], stats: { nBase: 0, nHosp: 0, nNovo: 0, parseOk: 0, parseFalha: 0 }, semMatch: new Map() };
let arquivos = LIMITE ? wsFiles.slice(0, LIMITE) : wsFiles;
if (SOMENTE) arquivos = arquivos.filter((f) => SOMENTE.has(f.slice(0, f.indexOf("_"))) || SOMENTE.has(f.match(/^([A-Z]{2,4}-\d\d)/)[1]));

for (const arquivo of arquivos) {
  const bruto = JSON.parse(readFileSync(resolve(WS_DIR, arquivo), "utf8"));
  const s = bruto.sindrome || bruto.condicao;
  if (!s || !s.id) continue;
  relatorio.total++;
  const idAlvo = "ws-" + s.id.toLowerCase().replace("-", "_");
  if (curados.has(idAlvo + ".json") && !FORCAR) {
    relatorio.pulados.push({ ws: s.id, id: idAlvo, motivo: "ja importado" });
    continue;
  }
  const { registro, stats } = montar(s, arquivo);
  relatorio.conflitos.push({ ws: s.id, id: idAlvo, nome: s.nome, candidatos: candidatos(s.nome) });
  relatorio.stats.nBase += stats.nBase;
  relatorio.stats.nHosp += stats.nHosp;
  relatorio.stats.nNovo += stats.nNovo;
  relatorio.stats.parseOk += stats.parseOk;
  relatorio.stats.parseFalha += stats.parseFalha;
  relatorio.stats.nDup = (relatorio.stats.nDup || 0) + stats.nDup;
  for (const m of stats.semMatch) {
    const k = m.agente + "|" + m.classe;
    relatorio.semMatch.set(k, (relatorio.semMatch.get(k) || 0) + 1);
  }

  const conflito = MESCLAR ? acharCurado(s.nome) : null;
  if (conflito) {
    const sNovo = score(registro), sVelho = score(conflito.c);
    const aprovado = conflito.c.status === "aprovado";
    if (sNovo <= sVelho) {
      relatorio.mantidos.push({ ws: s.id, nome: s.nome, arquivo: conflito.arquivo, scoreNovo: sNovo, scoreVelho: sVelho });
      continue;
    }
    if (aprovado && !SUBSTITUIR_APROVADOS) {
      relatorio.bloqueados.push({ ws: s.id, nome: s.nome, arquivo: conflito.arquivo, scoreNovo: sNovo, scoreVelho: sVelho, motivo: "curado aprovado (use --substituir-aprovados)" });
      continue;
    }
    const mesclado = mesclar(conflito.c, registro);
    relatorio.mesclados.push({ ws: s.id, nome: s.nome, arquivo: conflito.arquivo, scoreNovo: sNovo, scoreVelho: sVelho, aprovado });
    if (!DRY) writeFileSync(resolve(OUT_DIR, conflito.arquivo), JSON.stringify(mesclado, null, 2) + "\n", "utf8");
    curados.set(conflito.arquivo, mesclado);
    continue;
  }

  relatorio.novos.push({ ws: s.id, nome: s.nome, id: registro.id, classes: registro.ambulatorial.classes.length, hosp: registro.hospitalar.classes.length });
  if (!DRY) writeFileSync(resolve(OUT_DIR, registro.id + ".json"), JSON.stringify(registro, null, 2) + "\n", "utf8");
}

/* ---------- relatorio ---------- */
const semMatch = [...relatorio.semMatch.entries()].sort((a, b) => b[1] - a[1]);
const md = [];
md.push("# Import default-workspace para content/condicoes", "");
md.push("_Gerado por scripts/workspace/import.mjs em " + HOJE + (DRY ? " (dry-run)" : "") + "._", "");
md.push("| Metrica | Valor |", "|---|---|");
md.push("| Registros lidos | " + relatorio.total + " |");
md.push("| Novos (ws-*) | " + relatorio.novos.length + " |");
md.push("| Mesclados em curado existente | " + relatorio.mesclados.length + " |");
md.push("| Mantidos (curado mais completo) | " + relatorio.mantidos.length + " |");
md.push("| Bloqueados (curado aprovado) | " + relatorio.bloqueados.length + " |");
md.push("| Ja importados (pulados) | " + relatorio.pulados.length + " |");
md.push("| Itens base (droga do motor) | " + relatorio.stats.nBase + " |");
md.push("| Itens hospitalares (droga do motor) | " + relatorio.stats.nHosp + " |");
md.push("| Itens novos (droga criada) | " + relatorio.stats.nNovo + " |");
md.push("| Posologia estruturada OK | " + relatorio.stats.parseOk + " |");
md.push("| Posologia nao interpretada | " + relatorio.stats.parseFalha + " |");
md.push("");
if (relatorio.bloqueados.length) {
  md.push("## Bloqueados por estarem aprovados (decisao humana pendente)", "");
  relatorio.bloqueados.forEach((b) => md.push("- " + b.ws + " " + b.nome + " -> " + b.arquivo + " (score " + b.scoreNovo + " x " + b.scoreVelho + ")"));
  md.push("");
}
if (relatorio.conflitos.length) {
  md.push("## Possiveis duplicatas (decisao humana na revisao)", "");
  md.push("Nomes parecidos NAO foram fundidos automaticamente: similaridade de nome nao prova mesma doenca.", "");
  md.push("| Registro | Nome | Candidato | Onde | Similaridade |", "|---|---|---|---|---|");
  for (const c of relatorio.conflitos) {
    if (!c.candidatos.length) continue;
    const t = c.candidatos[0];
    md.push("| " + c.id + " | " + c.nome + " | " + t.nome + " | " + t.tipo + ":" + t.chave + " | " + t.score.toFixed(2) + " |");
  }
  md.push("");
}
if (relatorio.mantidos.length) {
  md.push("## Mantidos: o curado e mais completo", "");
  relatorio.mantidos.forEach((b) => md.push("- " + b.ws + " " + b.nome + " -> " + b.arquivo + " (score " + b.scoreNovo + " x " + b.scoreVelho + ")"));
  md.push("");
}
md.push("## Agentes sem correspondencia no motor (top 40)", "");
md.push("| Agente | Classe | Ocorrencias |", "|---|---|---|");
semMatch.slice(0, 40).forEach(([k, n]) => { const partes = k.split("|"); md.push("| " + partes[0] + " | " + partes[1] + " | " + n + " |"); });
md.push("");
md.push("Total de agentes distintos sem correspondencia: **" + new Set(semMatch.map(([k]) => k.split("|")[0])).size + "**.");
mkdirSync(REL_DIR, { recursive: true });
if (!DRY) {
  writeFileSync(resolve(REL_DIR, "import-" + HOJE + ".md"), md.join("\n") + "\n", "utf8");
  writeFileSync(resolve(REL_DIR, "import-" + HOJE + ".json"), JSON.stringify({ ...relatorio, semMatch }, null, 2) + "\n", "utf8");
}
console.log(md.slice(0, 16).join("\n"));
console.log("\nAgentes sem match (distintos):", new Set(semMatch.map(([k]) => k.split("|")[0])).size);
if (DRY) console.log("\n[dry-run] nada foi escrito.");
