#!/usr/bin/env node
/* Auditoria da assinatura: cada condicao assinada tem representante vivo no runtime?
   Le o digest assinado, o mapa do import (reports/curadoria/IMPORT-WORKSPACE.md) e
   content/condicoes. Nao altera nada. Escreve reports/curadoria/AUDITORIA-ASSINATURA-<data>.md.
   Uso: node scripts/workspace/audit-assinatura.mjs [--digest <arquivo.md>] */
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const args = process.argv.slice(2);
const arg = (f, d) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : d; };
const DIGEST = resolve(raiz, arg("--digest", "C:\\Users\\ffs007\\Downloads\\digest-assinado-27-11-2026.md"));
const COND = resolve(raiz, "content/condicoes");
const HOJE = new Date().toISOString().slice(0, 10);

const norm = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();

/* ---- 1. digest assinado ---- */
const texto = readFileSync(DIGEST, "utf8");
const linhas = [...texto.matchAll(/^- \[x\]\s+(\S+)\s+(.+?)\s+-\s+risco\s+(\S+)\s+-\s+(\d+)\s+classes amb\s*\/\s*(\d+)\s+hosp\s*\/\s*(\d+)\s+itens/gim)];
const assinadas = linhas.map((m) => ({
  id: m[1], nome: m[2].trim(), risco: m[3].replace(/\*/g, ""),
  amb: Number(m[4]), hosp: Number(m[5]), itens: Number(m[6]),
}));
const assinatura = {
  nome: (texto.match(/\|\s*Nome\s*\|\s*([^|]+)\|/) || [])[1]?.trim() || null,
  crm: (texto.match(/\|\s*CRM\/UF\s*\|\s*([^|]+)\|/) || [])[1]?.trim() || null,
  data: (texto.match(/\|\s*Data\s*\|\s*([^|]+)\|/) || [])[1]?.trim() || null,
  total: (texto.match(/\|\s*Condicoes aprovadas nesta rodada\s*\|\s*([^|]+)\|/) || [])[1]?.trim() || null,
};

/* ---- 2. arquivos vivos ---- */
const arquivos = readdirSync(COND).filter((f) => f.endsWith(".json"));
const vivos = new Map();
for (const f of arquivos) {
  const c = JSON.parse(readFileSync(resolve(COND, f), "utf8"));
  const itens = (c.ambulatorial?.classes || []).reduce((a, k) => a + (k.itens || []).length, 0)
    + (c.hospitalar?.classes || []).reduce((a, k) => a + (k.itens || []).length, 0);
  vivos.set(f, { arquivo: f, id: c.id, nome: c.nome, status: c.status, itens, ws: c.ws?.id || null, normNome: norm(c.nome) });
}
const porWsId = new Map();
for (const v of vivos.values()) if (v.ws) porWsId.set(v.ws, v);
const porNome = new Map();
for (const v of vivos.values()) if (!porNome.has(v.normNome)) porNome.set(v.normNome, v);

/* ---- 3. mapa síndrome -> arquivo (IMPORT-WORKSPACE) ---- */
const mapa = new Map();
const puladas = new Set();
try {
  const rep = readFileSync(resolve(raiz, "reports/curadoria/IMPORT-WORKSPACE.md"), "utf8");
  for (const m of rep.matchAll(/^- \*\*([A-Z]{2,4}-\d\d) .*?-> \x60([^\x60]+\.json)\x60/gim)) mapa.set(m[1], m[2]);
  const linha = rep.match(/\*\*Puladas:\*\* (.+)$/m);
  if (linha) linha[1].split(",").forEach((s) => puladas.add(s.trim()));
} catch { /* relatorio ausente: cai no casamento por nome */ }

/* casamento tolerante, so para localizar o equivalente (nunca para fundir conteudo) */
const tokensDe = (s) => new Set(norm(s).split(" ").filter((t) => t.length > 3));
function parecido(nome) {
  const alvo = tokensDe(nome);
  let melhor = null, melhorScore = 0;
  for (const v of vivos.values()) {
    const t = tokensDe(v.nome);
    if (!t.size || !alvo.size) continue;
    let inter = 0;
    for (const x of alvo) if (t.has(x)) inter++;
    const score = inter / Math.max(alvo.size, t.size);
    if (score > melhorScore) { melhorScore = score; melhor = v; }
  }
  return melhorScore >= 0.5 ? melhor : null;
}

const AREA = { alg: "ALG", car: "CAR", derm: "DERM", end: "END", ger: "GER", gi: "GI", go: "GO", inf: "INF", msk: "MSK", neu: "NEU", oft: "OFT", ped: "PED", psq: "PSQ", resp: "RESP", tra: "TRA", uro: "URO" };
function fonte(id) {
  const m = id.match(/^ws-([a-z]+)(\d{2})$/i);
  if (!m) return null;
  const a = AREA[m[1].toLowerCase()];
  return a ? a + "-" + m[2] : null;
}

/* ---- 4. classificacao ---- */
const linhasOut = [];
let ok = 0, menor = 0, ausente = 0;
for (const s of assinadas) {
  const src = fonte(s.id);
  const alvoNome = mapa.get(src);
  let vivo = (alvoNome && vivos.get(alvoNome)) || porWsId.get(src) || porNome.get(norm(s.nome)) || parecido(s.nome) || null;
  if (src && puladas.has(src) && vivo) vivo = { ...vivo, equivalente: true };
  let situacao, delta = null;
  if (!vivo) { situacao = "ausente"; ausente++; }
  else {
    delta = vivo.itens - s.itens;
    if (delta === 0) { situacao = "exato"; ok++; }
    else if (delta < 0) { situacao = vivo.equivalente ? "equivalente curado (dedup)" : "menos itens"; menor++; }
    else { situacao = "mais itens"; ok++; }
  }
  linhasOut.push({ ...s, fonte: src, vivo, situacao, delta });
}

/* ---- 5. relatorio ---- */
const md = [];
md.push("# Auditoria da assinatura — 27/11/2026", "");
md.push("_Gerado por scripts/workspace/audit-assinatura.mjs a partir do digest assinado e de content/condicoes._", "");
md.push("## Assinatura lida", "");
md.push("| Campo | Valor |", "|---|---|");
md.push("| Nome | " + (assinatura.nome || "—") + " |");
md.push("| CRM/UF | " + (assinatura.crm || "—") + " |");
md.push("| Data | " + (assinatura.data || "—") + " |");
md.push("| Condicoes na rodada | " + (assinatura.total || assinadas.length) + " |");
md.push("| Itens assinados | " + assinadas.reduce((a, s) => a + s.itens, 0) + " |");
md.push("");
md.push("## Resultado", "");
md.push("| Situacao | Condicoes |", "|---|---|");
md.push("| Representante vivo com a mesma contagem de itens | " + ok + " |");
md.push("| Representante vivo com MENOS itens que o assinado | " + menor + " |");
md.push("| Sem representante vivo | " + ausente + " |");
md.push("");
const somaAssinada = assinadas.reduce((a, s) => a + s.itens, 0);
const somaLida = linhasOut.reduce((a, r) => a + (r.vivo ? r.vivo.itens : 0), 0);
const mapeadas = linhasOut.filter((r) => r.vivo).length;
md.push("Total assinado: **" + assinadas.length + "** condicoes / **" + somaAssinada + "** itens · arquivos em content/condicoes: **" + arquivos.length + "**.");
md.push("");
md.push("| Comparacao | Valor |", "|---|---|");
md.push("| Condicoes assinadas com representante vivo | " + mapeadas + " de " + assinadas.length + " |");
md.push("| Itens assinados | " + somaAssinada + " |");
md.push("| Itens vivos nos representantes | " + somaLida + " |");
md.push("| Cobertura de itens | " + (somaAssinada ? (somaLida / somaAssinada * 100).toFixed(1) : "0") + "% |");
md.push("");
if (somaLida < somaAssinada * 0.95) {
  md.push("**Veredito:** o conteudo assinado NAO e o conteudo presente neste diretorio. Promover status ou rodar build nao recupera o que falta — e preciso restaurar a versao que gerou este digest antes de aplicar a assinatura.", "");
}
md.push("");
const ruins = linhasOut.filter((l) => l.situacao !== "exato" && l.situacao !== "mais itens");
if (ruins.length) {
  md.push("## Divergencias", "");
  md.push("| Assinado | Nome | Itens assinados | Arquivo vivo | Itens vivos | Delta |", "|---|---|---|---|---|---|");
  for (const r of ruins) {
    md.push("| " + r.id + " | " + r.nome + " | " + r.itens + " | " + (r.vivo ? r.vivo.arquivo : "—") + " | " + (r.vivo ? r.vivo.itens : "—") + " | " + (r.delta == null ? "—" : r.delta) + " |");
  }
  md.push("");
}
md.push("## Todas as condicoes assinadas", "");
md.push("| Assinado | Nome | Risco | Itens assinados | Arquivo vivo | Itens vivos | Status |", "|---|---|---|---|---|---|---|");
for (const r of linhasOut) {
  md.push("| " + r.id + " | " + r.nome + " | " + r.risco + " | " + r.itens + " | " + (r.vivo ? r.vivo.arquivo : "—") + " | " + (r.vivo ? r.vivo.itens : "—") + " | " + (r.vivo ? r.vivo.status : r.situacao) + " |");
}
md.push("");
writeFileSync(resolve(raiz, "reports/curadoria/AUDITORIA-ASSINATURA-" + HOJE + ".md"), md.join("\n") + "\n", "utf8");
console.log("assinadas lidas: " + assinadas.length + " | exato/mais: " + ok + " | menos itens: " + menor + " | ausente: " + ausente);
console.log("assinatura: " + (assinatura.nome || "?") + " | " + (assinatura.crm || "?") + " | " + (assinatura.data || "?"));
console.log("relatorio: reports/curadoria/AUDITORIA-ASSINATURA-" + HOJE + ".md");
