#!/usr/bin/env node
/* Fecha a lacuna de itens entre o digest assinado e o registro vivo.
   Para cada sindrome com itens < assinado, acrescenta itens do staging que ainda
   nao existem no registro (por molecula), PARANDO ao atingir o alvo assinado.
   Aditivo e idempotente. Uso: node scripts/workspace/fechar-lacunas.mjs [--dry] [--ids ...] */
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const args = process.argv.slice(2);
const DRY = args.includes("--dry");
const val = (f, d) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : (d === undefined ? null : d); };
const COND = resolve(raiz, "content/condicoes");
const STG = resolve(raiz, "content/_staging");
const DIGEST = resolve(raiz, val("--digest", "C:\\Users\\ffs007\\Downloads\\digest-assinado-27-11-2026.md"));
const norm = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();

/* alvo assinado por sindrome (ws-alg01 -> 18) */
const alvo = new Map();
const texto = readFileSync(DIGEST, "utf8");
for (const m of texto.matchAll(/^- \[x\]\s+(\S+)\s+(.+?)\s+-\s+risco\s+(\S+)\s+-\s+(\d+)\s+classes amb\s*\/\s+(\d+)\s+hosp\s*\/\s+(\d+)\s+itens/gim)) {
  const id = m[1].match(/^ws-([a-z]+)(\d{2})$/i);
  if (id) alvo.set(id[1].toUpperCase() + "-" + id[2], Number(m[6]));
}

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
  const t = tokensDe(nome);
  let melhor = null, score = 0;
  for (const v of vivos.values()) {
    if (!v.tokens.size || !t.size) continue;
    let inter = 0;
    for (const x of t) if (v.tokens.has(x)) inter++;
    const s = inter / Math.max(t.size, v.tokens.size);
    if (s > score) { score = s; melhor = v.arquivo; }
  }
  return score >= 0.5 ? melhor : null;
}
const AREA = { ALG: "alg", CAR: "car", DERM: "derm", END: "end", GER: "ger", GI: "gi", GO: "go", INF: "inf", MSK: "msk", NEU: "neu", OFT: "oft", PED: "ped", PSQ: "psq", RESP: "resp", TRA: "tra", URO: "uro" };
const arquivoWs = (sid) => { const [a, n] = sid.split("-"); return "ws-" + (AREA[a] || a.toLowerCase()) + "_" + n + ".json"; };
const chaveItem = (it) => (it.base || it.hosp || norm(it.novo?.n || "")).toLowerCase();
const contar = (c) => (c.ambulatorial?.classes || []).reduce((a, k) => a + (k.itens || []).length, 0)
  + (c.hospitalar?.classes || []).reduce((a, k) => a + (k.itens || []).length, 0);

const soIds = val("--ids") ? new Set(val("--ids").split(",").map((s) => s.trim().toUpperCase())) : null;
let fechadas = 0, adicionados = 0, jaOk = 0, semAlvo = 0;
const resumo = [];

for (const f of readdirSync(STG).filter((f) => f.endsWith(".json"))) {
  const staged = JSON.parse(readFileSync(resolve(STG, f), "utf8"));
  const sid = staged.ws?.id;
  if (!sid || (soIds && !soIds.has(sid))) continue;
  const meta = alvo.get(sid);
  if (!meta) { semAlvo++; continue; }
  let nome = mapa.get(sid) || (existsSync(resolve(COND, arquivoWs(sid))) ? arquivoWs(sid) : null);
  if (!nome || !existsSync(resolve(COND, nome))) nome = equivalente(staged.nome);
  if (!nome || !existsSync(resolve(COND, nome))) { semAlvo++; continue; }

  const atual = JSON.parse(readFileSync(resolve(COND, nome), "utf8"));
  let vivo = contar(atual);
  if (vivo >= meta) { jaOk++; continue; }
  let falta = meta - vivo;

  const presentes = new Set();
  for (const k of [...(atual.ambulatorial?.classes || []), ...(atual.hospitalar?.classes || [])]) for (const it of k.itens || []) presentes.add(chaveItem(it));

  let add = 0;
  for (const chave of ["ambulatorial", "hospitalar"]) {
    if (falta <= 0) break;
    atual[chave] = atual[chave] || { classes: [] };
    for (const k of staged[chave]?.classes || []) {
      if (falta <= 0) break;
      const novos = [];
      for (const it of k.itens || []) {
        if (falta <= 0) break;
        const ch = chaveItem(it);
        if (presentes.has(ch)) continue;
        presentes.add(ch); novos.push({ ...it }); falta--; add++;
      }
      if (!novos.length) continue;
      const existente = atual[chave].classes.find((x) => norm(x.nome) === norm(k.nome));
      if (existente) existente.itens.push(...novos);
      else atual[chave].classes.push({ ...k, itens: novos, origem: "workspace", fonte: sid });
    }
  }
  if (!add) continue;
  atual.meta = { ...atual.meta, lacuna_fechada: sid + " (+" + add + ") em " + new Date().toISOString().slice(0, 10) };
  if (!DRY) writeFileSync(resolve(COND, nome), JSON.stringify(atual, null, 2) + "\n", "utf8");
  fechadas++; adicionados += add;
  resumo.push(nome + " <- " + sid + " (+" + add + ", total " + (vivo + add) + "/" + meta + ")");
}
console.log((DRY ? "[dry-run] " : "") + "condicoes completadas: " + fechadas + " | itens: " + adicionados + " | ja ok: " + jaOk + " | sem alvo: " + semAlvo);
resumo.slice(0, 8).forEach((l) => console.log("  " + l));
