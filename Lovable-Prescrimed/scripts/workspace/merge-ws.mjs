#!/usr/bin/env node
/* Funde as classes do import (content/_staging) nos registros vivos, por mapa
   explicito. Aditivo: so acrescenta classe que ainda nao existe (nome normalizado)
   e nunca altera item, classe ou status existente. Idempotente.
   Uso: node scripts/workspace/merge-ws.mjs [--dry] */
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const DRY = process.argv.includes("--dry");
const COND = resolve(raiz, "content/condicoes");
const STG = resolve(raiz, "content/_staging");
const norm = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();

const mapa = new Map();
const rep = readFileSync(resolve(raiz, "reports/curadoria/IMPORT-WORKSPACE.md"), "utf8");
for (const m of rep.matchAll(/^- \*\*([A-Z]{2,4}-\d\d) .*?-> \x60([^\x60]+\.json)\x60/gim)) mapa.set(m[1], m[2]);

const vivos = new Map();
for (const f of readdirSync(COND).filter((f) => f.endsWith(".json"))) {
  const c = JSON.parse(readFileSync(resolve(COND, f), "utf8"));
  vivos.set(f, { arquivo: f, c, tokens: new Set(norm(c.nome).split(" ").filter((t) => t.length > 3)) });
}
const tokensDe = (s) => new Set(norm(s).split(" ").filter((t) => t.length > 3));
function equivalente(nome) {
  const alvo = tokensDe(nome);
  let melhor = null, score = 0;
  for (const v of vivos.values()) {
    if (!v.tokens.size || !alvo.size) continue;
    let inter = 0;
    for (const t of alvo) if (v.tokens.has(t)) inter++;
    const s2 = inter / Math.max(alvo.size, v.tokens.size);
    if (s2 > score) { score = s2; melhor = v.arquivo; }
  }
  return score >= 0.5 ? melhor : null;
}

const AREA = { ALG: "alg", CAR: "car", DERM: "derm", END: "end", GER: "ger", GI: "gi", GO: "go", INF: "inf", MSK: "msk", NEU: "neu", OFT: "oft", PED: "ped", PSQ: "psq", RESP: "resp", TRA: "tra", URO: "uro" };
const arquivoWs = (sid) => { const [a, n] = sid.split("-"); return "ws-" + (AREA[a] || a.toLowerCase()) + "_" + n + ".json"; };

let fundidos = 0, classesAdicionadas = 0, semAlvo = 0;
const resumo = [];
for (const f of readdirSync(STG).filter((f) => f.endsWith(".json"))) {
  const novo = JSON.parse(readFileSync(resolve(STG, f), "utf8"));
  const sid = novo.ws?.id;
  if (!sid) continue;
  let alvo = mapa.get(sid) || (existsSync(resolve(COND, arquivoWs(sid))) ? arquivoWs(sid) : null);
  if (!alvo || !existsSync(resolve(COND, alvo))) alvo = equivalente(novo.nome);
  if (!alvo || !existsSync(resolve(COND, alvo))) { semAlvo++; continue; }
  const atual = JSON.parse(readFileSync(resolve(COND, alvo), "utf8"));
  atual.ambulatorial = atual.ambulatorial || { classes: [] };
  atual.hospitalar = atual.hospitalar || { classes: [] };
  const existentes = new Set([...atual.ambulatorial.classes, ...atual.hospitalar.classes].map((k) => norm(k.nome)));
  let n = 0;
  for (const [destino, chave] of [[atual.ambulatorial.classes, "ambulatorial"], [atual.hospitalar.classes, "hospitalar"]]) {
    for (const k of novo[chave]?.classes || []) {
      if (existentes.has(norm(k.nome))) continue;
      existentes.add(norm(k.nome));
      destino.push({ ...k, origem: "workspace", fonte: sid });
      n++;
    }
  }
  if (!n) continue;
  atual.meta = { ...atual.meta, fundido_workspace: sid + " em " + new Date().toISOString().slice(0, 10) };
  if (!DRY) writeFileSync(resolve(COND, alvo), JSON.stringify(atual, null, 2) + "\n", "utf8");
  fundidos++; classesAdicionadas += n;
  resumo.push(alvo + " <- " + sid + " (+" + n + " classes)");
}
console.log((DRY ? "[dry-run] " : "") + "registros fundidos: " + fundidos + " | classes adicionadas: " + classesAdicionadas + " | sem alvo: " + semAlvo);
resumo.slice(0, 6).forEach((l) => console.log("  " + l));
