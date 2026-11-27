#!/usr/bin/env node
/* Acrescenta a classe "Medidas nao farmacologicas" (texto integral da sindrome)
   aos registros que ainda nao a tem. Aditivo e idempotente: nunca altera item,
   classe ou status existente.
   Mapa sindrome -> arquivo: reports/curadoria/IMPORT-WORKSPACE.md; sem mapa,
   usa ws-<area>_<nn>.json.
   Uso: node scripts/workspace/add-classes.mjs [--dry] */
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const DRY = process.argv.includes("--dry");
const COND = resolve(raiz, "content/condicoes");
const WS = resolve(raiz, "default-workspace/sindromes");
const norm = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
const limpar = (s) => String(s == null ? "" : s).replace(/\s+/g, " ").trim();

/* mapa explicito do import (nunca por semelhanca de nome) */
const mapa = new Map();
const rep = readFileSync(resolve(raiz, "reports/curadoria/IMPORT-WORKSPACE.md"), "utf8");
for (const m of rep.matchAll(/^- \*\*([A-Z]{2,4}-\d\d) .*?-> \x60([^\x60]+\.json)\x60/gim)) mapa.set(m[1], m[2]);

const AREA = { ALG: "alg", CAR: "car", DERM: "derm", END: "end", GER: "ger", GI: "gi", GO: "go", INF: "inf", MSK: "msk", NEU: "neu", OFT: "oft", PED: "ped", PSQ: "psq", RESP: "resp", TRA: "tra", URO: "uro" };
const arquivoWs = (sid) => { const [a, n] = sid.split("-"); return "ws-" + (AREA[a] || a.toLowerCase()) + "_" + n + ".json"; };

const fontes = readdirSync(WS).filter((f) => /^[A-Z]{2,4}-\d\d_.*\.json$/.test(f));
let adicionadas = 0, jaTinha = 0, semArquivo = 0, semFonte = 0;
const log = [];

/* fallback: quando a sindrome foi deduplicada (sem arquivo proprio), localiza o
   registro curado equivalente pelo nome — apenas para ANNEXAR medidas, nunca para fundir. */
const vivos = readdirSync(COND).filter((f) => f.endsWith(".json")).map((f) => {
  const c = JSON.parse(readFileSync(resolve(COND, f), "utf8"));
  return { arquivo: f, nome: c.nome, tokens: new Set(norm(c.nome).split(" ").filter((t) => t.length > 3)) };
});
const tokensDe = (s) => new Set(norm(s).split(" ").filter((t) => t.length > 3));
function equivalente(nome) {
  const alvo = tokensDe(nome);
  let melhor = null, score = 0;
  for (const v of vivos) {
    if (!v.tokens.size || !alvo.size) continue;
    let inter = 0;
    for (const t of alvo) if (v.tokens.has(t)) inter++;
    const s2 = inter / Math.max(alvo.size, v.tokens.size);
    if (s2 > score) { score = s2; melhor = v; }
  }
  return score >= 0.5 ? melhor.arquivo : null;
}

for (const f of fontes) {
  const s = JSON.parse(readFileSync(resolve(WS, f), "utf8")).sindrome;
  const sid = s.id;
  let alvo = mapa.get(sid) || arquivoWs(sid);
  if (!existsSync(resolve(COND, alvo))) alvo = equivalente(s.nome) || alvo;
  const caminho = resolve(COND, alvo);
  if (!existsSync(caminho)) { semArquivo++; continue; }
  const nf = s.nao_farmacologico || [];
  if (!nf.length) { semFonte++; continue; }
  const c = JSON.parse(readFileSync(caminho, "utf8"));
  const jaTem = (c.ambulatorial?.classes || []).some((k) => /medidas n.o farmacol/i.test(k.nome));
  if (jaTem) { jaTinha++; continue; }
  const itens = nf.map((m, i) => ({
    linha: i === 0 ? 1 : 2,
    novo: { id: "nf_" + (i + 1), n: limpar(m.medida), ap: "", q: "", pos: limpar(m.detalhe) },
    motivo: "medida não farmacológica da síndrome",
  }));
  c.ambulatorial = c.ambulatorial || { classes: [] };
  c.ambulatorial.classes.push({ nome: "Medidas não farmacológicas", itens, origem: "workspace", fonte: sid });
  c.meta = { ...c.meta, medidas_adicionadas: sid + " em " + new Date().toISOString().slice(0, 10) };
  if (!DRY) writeFileSync(caminho, JSON.stringify(c, null, 2) + "\n", "utf8");
  adicionadas++;
  log.push(alvo + " <- " + sid + " (" + itens.length + " medidas)");
}

console.log((DRY ? "[dry-run] " : "") + "classes adicionadas: " + adicionadas + " | ja tinham: " + jaTinha + " | sem arquivo: " + semArquivo + " | sem fonte: " + semFonte);
log.slice(0, 5).forEach((l) => console.log("  " + l));
