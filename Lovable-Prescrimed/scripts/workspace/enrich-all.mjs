#!/usr/bin/env node
/* Enriquecimento GLOBAL: devolve às condições os campos de segurança do banco
   que os importadores descartaram — contraindicações, observações clínicas e
   ajuste renal de CADA medicamento. Nada é inventado: tudo vem do
   default-workspace. Idempotente (marca meta.enriquecido). */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const COND = join(raiz, "content", "condicoes");
const SRC = join(raiz, "default-workspace", "sindromes");
const MAP = JSON.parse(readFileSync(join(raiz, "reports", "auditoria-clinica", "mappings.json"), "utf8"));

/* ---------- normalização ---------- */
const ROUTE = /\b(ev|iv|im|sc|vo|sl|inalatoria|inalatorio|topica|topico|retal|sublingual|nebulizacao|nebulizado|spray|injetavel|injecao|infusao|gotas|colirio|oftalmico|otologico|pomada|creme|gel|comprimido|capsula|xarope|suspensao|oral|nasal|fortificada|fortificado|parenteral|venoso|intravenoso|intramuscular|subcutaneo|autoinjetor|alto fluxo|umidificado|solucao|soro|medicinal|aquosa|profilaxia|via)\b/g;
const norm = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  .replace(/\(.*?\)/g, " ")
  .replace(/\b\d+([.,]\d+)?\s*(mg|mcg|g|ml|ui|%|mg\/ml|kcal|l\/min)\b/g, " ")
  .replace(/\b\d+([.,]\d+)?\b/g, " ")
  .replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
const core = (s) => norm(s).replace(ROUTE, " ").replace(/\s+/g, " ").trim();
const cap = (s, n) => { s = String(s || "").trim(); return s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, "") + "…" : s; };

/* ---------- nome do motor por id ---------- */
const id2name = new Map();
for (const p of MAP.protocolos) for (const c of p.classes || []) for (const m of c.meds || []) if (!id2name.has(m.id)) id2name.set(m.id, m.nome);
for (const hp of Object.values(MAP.hospMap || {})) for (const c of hp.classes || []) for (const m of c.meds || []) if (!id2name.has(m.id)) id2name.set(m.id, m.nome);

/* ---------- fonte: síndrome por id e por nome ---------- */
const srcById = new Map(), srcByNome = new Map();
for (const f of readdirSync(SRC).filter((x) => /^([A-Z]{2,4})-\d\d_.*\.json$/.test(x))) {
  const s = JSON.parse(readFileSync(join(SRC, f), "utf8")).sindrome;
  if (!s) continue;
  srcById.set(s.id, s); srcByNome.set(norm(s.nome), s);
}

/* ---------- campos de segurança de um medicamento-fonte ---------- */
function camposSeguranca(m) {
  const parts = [];
  const contras = (m.contraindicacoes || []).filter((c) => c && String(c).trim().length > 4)
    .map((c) => String(c).trim().replace(/\.$/, ""));
  if (contras.length) parts.push("NÃO: " + contras.join("; "));
  if (m.observacoes && String(m.observacoes).trim()) parts.push("Obs: " + cap(m.observacoes, 230));
  if (m.ajuste_renal && !/^sem ajuste/i.test(String(m.ajuste_renal))) parts.push("Renal: " + cap(m.ajuste_renal, 90));
  return parts.join(" · ");
}

/* ---------- varre as condições derivadas do banco ---------- */
const stats = { arquivos: 0, itens: 0, enriquecidos: 0, semFonte: 0, semMatch: 0 };
const log = [];

for (const f of readdirSync(COND).filter((x) => x.endsWith(".json"))) {
  const caminho = join(COND, f);
  const j = JSON.parse(readFileSync(caminho, "utf8"));
  const doBanco = (j.ws && j.ws.id) || /default-workspace/i.test((j.meta && j.meta.redigido) || "");
  if (!doBanco) continue;
  if (j.meta && j.meta.enriquecido) continue; // idempotência

  const fonte = (j.ws && j.ws.id && srcById.get(j.ws.id)) || srcByNome.get(norm(j.nome)) || null;
  if (!fonte) { stats.semFonte++; continue; }

  /* mapa agente-fonte -> campos */
  const fontesPorCore = new Map();
  for (const m of fonte.medicamentos || []) {
    const k = core(m.agente);
    if (k && !fontesPorCore.has(k)) fontesPorCore.set(k, camposSeguranca(m));
  }

  let mudou = false;
  const merge = (it, chaveNome) => {
    stats.itens++;
    const k = core(chaveNome);
    const campos = fontesPorCore.get(k);
    if (!campos) { stats.semMatch++; return; }
    const atual = String(it.nota || "");
    if (atual.includes(campos.slice(0, 40))) return; // já presente
    it.nota = cap((atual ? atual + " · " : "") + campos, 640);
    stats.enriquecidos++; mudou = true;
  };

  for (const sec of ["ambulatorial", "hospitalar"]) {
    for (const cl of (j[sec]?.classes || [])) {
      for (const it of cl.itens || []) {
        if (it.novo) merge(it, it.novo.n);
        else if (it.base) merge(it, id2name.get(it.base) || it.base);
        else if (it.hosp) merge(it, id2name.get(it.hosp) || it.hosp);
      }
    }
  }

  if (mudou) {
    j.meta = j.meta || {};
    j.meta.enriquecido = "contraindicações/observações/ajuste renal do default-workspace (2026-11-06)";
    writeFileSync(caminho, JSON.stringify(j, null, 2) + "\n", "utf8");
    stats.arquivos++;
    log.push(`${f}: ${fonte.id} enriquecido`);
  }
}
console.log(JSON.stringify(stats, null, 1));
log.slice(0, 12).forEach((l) => console.log("  " + l));
