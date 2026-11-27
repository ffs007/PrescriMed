#!/usr/bin/env node
/* Compatibilidade default-workspace (221 síndromes) x motor do protótipo.
   Responde: quantos agentes batem com drogas do PROTO_DB/HOSP_DB/curados,
   quantas síndromes ficam 100% mapeadas, e qual a sobreposição com as
   35 condições já curadas em content/condicoes. */
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const WS = join(ROOT, "default-workspace", "sindromes");
const MAP = JSON.parse(readFileSync(join(ROOT, "reports", "auditoria-clinica", "mappings.json"), "utf8"));
const COND = join(ROOT, "content", "condicoes");

/* ---------- normalização ---------- */
const ROUTE = /\b(ev|iv|im|sc|vo|sl|inalatoria|inalatorio|topica|topico|retal|sublingual|nebulizacao|nebulizado|spray|injetavel|injecao|injetavel|infusao|gotas|colirio|oftalmico|otologico|pomada|creme|gel|comprimido|capsula|xarope|suspensao|oral|nasal|fortificada|fortificado|parenteral|venoso|intravenoso|intramuscular|subcutaneo|autoinjetor|altafluxo|alto fluxo|umidificado|solucion|solucao|soro|medicinal|aquosa|profilaxia|via)\b/g;
const norm = (s) =>
  (s || "").toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/\(.*?\)/g, " ")
    .replace(/\b\d+([.,]\d+)?\s*(mg|mcg|g|ml|ui|%|mg\/ml|kcal|l\/min)\b/g, " ")
    .replace(/\b\d+([.,]\d+)?\b/g, " ")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ").trim();
/* nome sem rota/apresentação — para casar "morfina" com "morfina (ev)" */
const core = (s) => norm(s).replace(ROUTE, " ").replace(/\s+/g, " ").trim();

/* ---------- inventário do motor ---------- */
const engine = new Map(); // coreName -> {id, nome, origem}
const addEngine = (nome, id, origem) => {
  const c = core(nome);
  if (c && !engine.has(c)) engine.set(c, { id, nome, origem });
};
for (const p of MAP.protocolos) for (const c of p.classes || []) for (const m of c.meds || [])
  addEngine(m.nome, m.id, "proto");
/* hospMap é um ARRAY de protocolos hospitalares {protocolo, nome, classes[{meds}]} */
for (const hp of Object.values(MAP.hospMap || {})) for (const c of hp.classes || []) for (const m of c.meds || [])
  addEngine(m.nome, m.id, "hosp");

/* sinônimos: core(agente workspace) -> core(nome no motor) — só vale se o alvo existir */
const SYN = {
  "penicilina benzatina": "benzilpenicilina benzatina",
  "penicilina g benzatina": "benzilpenicilina benzatina",
  "penicilina benzatinica": "benzilpenicilina benzatina",
  "penicilina cristalina": "penicilina g cristalina",
  "penicilina g cristalinica aquosa": "penicilina g cristalina",
  "amoxicilina clavulanato": "amoxicilina clavulanato",
  "ampicilina sulbactam": "ampicilina sulbactam",
  "dipirona metamizol": "dipirona",
  "acido acetilsalicilico": "acido acetilsalicilico",
  "nitroglicerina sublingual": "dinitrato isossorbida",
  "polietilenoglicol 3350": "macrogol",
  "sais de reidratacao oral": "sais de reidratacao oral",
  "hioscina butilbrometo": "butilbrometo escopolamina",
  "escopolamina hioscina": "butilbrometo escopolamina",
  "butilbrometo de escopolamina hioscina": "butilbrometo escopolamina",
  "butil escopolamina hioscina": "butilbrometo escopolamina",
};

/* resolve agente -> hit no inventário (core exato → encolhendo tokens → prefixo) */
function resolve(agente) {
  const c = core(agente);
  if (!c) return null;
  const viaSyn = SYN[c];
  if (viaSyn && engine.has(viaSyn)) return engine.get(viaSyn);
  let hit = engine.get(c);
  if (hit) return hit;
  const toks = c.split(" ");
  for (let k = toks.length - 1; k > 0 && !hit; k--) hit = engine.get(toks.slice(0, k).join(" "));
  if (hit) return hit;
  for (const [k2, v] of engine)
    if (k2.startsWith(c + " ") || k2.endsWith(" " + c) || c.startsWith(k2 + " ") || c.endsWith(" " + k2)) return v;
  return null;
}

/* ---------- curados (content/condicoes) ---------- */
const curated = [];
for (const f of readdirSync(COND).filter((x) => x.endsWith(".json"))) {
  const j = JSON.parse(readFileSync(join(COND, f), "utf8"));
  curated.push({ file: f, id: j.id, nome: j.nome, status: j.status });
  // drogas "novo" curadas também entram no inventário
  const push = (it) => { if (it.novo) engine.set(norm(it.novo.n), { id: it.novo.id, nome: it.novo.n, origem: "cur" }); };
  for (const sec of ["ambulatorial", "hospitalar"]) for (const cl of j[sec]?.classes || [])
    for (const it of cl.itens || []) push(it);
}

/* ---------- varre síndromes ---------- */
const files = readdirSync(WS).filter((f) => f.endsWith(".json") && !f.startsWith("_"));
const stats = { sind: 0, itens: 0, agentesUnicos: new Set() };
const unmatched = new Map(); // agente -> [sindromes]
const perSind = [];
for (const f of files) {
  const j = JSON.parse(readFileSync(join(WS, f), "utf8"));
  const s = j.sindrome || j.condicao;
  stats.sind++;
  let ok = 0, total = 0;
  const miss = [];
  for (const m of s.medicamentos || []) {
    total++;
    const a = m.agente;
    stats.agentesUnicos.add(a);
    const hit = resolve(a);
    if (hit) ok++;
    else { if (!unmatched.has(a)) unmatched.set(a, []); unmatched.get(a).push(s.id); miss.push(a); }
  }
  stats.itens += total;
  perSind.push({ id: s.id, nome: s.nome, ok, total, miss });
}

/* ---------- sobreposição com curados ---------- */
const curNames = curated.map((c) => ({ ...c, n: norm(c.nome) }));
const overlap = [];
for (const p of perSind) {
  const n = norm(p.nome);
  const hit = curNames.find((c) => c.n === n || c.n.includes(n) || n.includes(c.n));
  if (hit) overlap.push(`${p.id} «${p.nome}» ↔ ${hit.file} (${hit.status})`);
}

/* ---------- relatório ---------- */
const full = perSind.filter((p) => p.total > 0 && p.ok === p.total).length;
const agentArr = [...unmatched.entries()].sort((a, b) => b[1].length - a[1].length);
console.log("=== COMPATIBILIDADE WORKSPACE x MOTOR ===");
console.log(`Síndromes: ${stats.sind} | Itens de medicação: ${stats.itens} | Agentes únicos: ${stats.agentesUnicos.size}`);
console.log(`Itens mapeados: ${stats.itens - agentArr.reduce((s, [, v]) => s + v.length, 0)} / ${stats.itens}`);
console.log(`Síndromes 100% mapeadas: ${full} / ${stats.sind}`);
console.log(`Agentes SEM match (únicos): ${unmatched.size} / ${stats.agentesUnicos.size}`);
console.log(`Sobreposição com curadas (${curated.length}): ${overlap.length}`);
overlap.forEach((o) => console.log("  " + o));
console.log("\n=== TOP 40 AGENTES SEM MAPEAMENTO (por nº de aparições) ===");
agentArr.slice(0, 40).forEach(([a, ids]) => console.log(`  ${String(ids.length).padStart(3)}x  ${a}   [${ids.slice(0, 4).join(",")}]`));
console.log("\n=== SÍNDROMES COM MAIS LACUNAS ===");
perSind.filter((p) => p.miss.length).sort((a, b) => b.miss.length - a.miss.length).slice(0, 15)
  .forEach((p) => console.log(`  ${p.id} ${p.nome}: ${p.ok}/${p.total} ok — faltam: ${p.miss.slice(0, 5).join(", ")}`));
