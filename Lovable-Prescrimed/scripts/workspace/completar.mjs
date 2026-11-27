#!/usr/bin/env node
/* Completa registros vivos com itens do import que ainda NAO existem neles.
   Regra: por molecula. Item cujo farmaco ja aparece em qualquer classe do registro
   e descartado (evita prescrever a mesma coisa duas vezes). Nunca altera item,
   classe ou status existente; so acrescenta.
   Uso: node scripts/workspace/completar.mjs [--dry] [--ids CAR-11,END-02] [--min-deficit 3] */
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const args = process.argv.slice(2);
const DRY = args.includes("--dry");
const val = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : null; };
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
const chaveItem = (it) => (it.base || it.hosp || norm(it.novo?.n || "")).toLowerCase();

const soIds = val("--ids") ? new Set(val("--ids").split(",").map((s) => s.trim().toUpperCase())) : null;
let arquivos = 0, itensAdicionados = 0;
const resumo = [];
for (const f of readdirSync(STG).filter((f) => f.endsWith(".json"))) {
  const novo = JSON.parse(readFileSync(resolve(STG, f), "utf8"));
  const sid = novo.ws?.id;
  if (!sid || (soIds && !soIds.has(sid))) continue;
  let alvo = mapa.get(sid) || (existsSync(resolve(COND, arquivoWs(sid))) ? arquivoWs(sid) : null);
  if (!alvo || !existsSync(resolve(COND, alvo))) alvo = equivalente(novo.nome);
  if (!alvo || !existsSync(resolve(COND, alvo))) continue;
  const atual = JSON.parse(readFileSync(resolve(COND, alvo), "utf8"));
  atual.ambulatorial = atual.ambulatorial || { classes: [] };
  atual.hospitalar = atual.hospitalar || { classes: [] };
  const presentes = new Set();
  for (const k of [...atual.ambulatorial.classes, ...atual.hospitalar.classes]) for (const it of k.itens || []) presentes.add(chaveItem(it));

  let n = 0;
  for (const chave of ["ambulatorial", "hospitalar"]) {
    for (const k of novo[chave]?.classes || []) {
      const novos = (k.itens || []).filter((it) => !presentes.has(chaveItem(it)));
      if (!novos.length) continue;
      novos.forEach((it) => presentes.add(chaveItem(it)));
      const existente = atual[chave].classes.find((x) => norm(x.nome) === norm(k.nome));
      if (existente) existente.itens.push(...novos.map((it) => ({ ...it })));
      else atual[chave].classes.push({ ...k, itens: novos.map((it) => ({ ...it })), origem: "workspace", fonte: sid });
      n += novos.length;
    }
  }
  if (!n) continue;
  atual.meta = { ...atual.meta, completado_workspace: sid + " (+" + n + " itens) em " + new Date().toISOString().slice(0, 10) };
  if (!DRY) writeFileSync(resolve(COND, alvo), JSON.stringify(atual, null, 2) + "\n", "utf8");
  arquivos++; itensAdicionados += n;
  resumo.push(alvo + " <- " + sid + " (+" + n + ")");
}
console.log((DRY ? "[dry-run] " : "") + "registros completados: " + arquivos + " | itens acrescentados: " + itensAdicionados);
resumo.slice(0, 8).forEach((l) => console.log("  " + l));
