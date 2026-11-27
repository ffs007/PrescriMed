#!/usr/bin/env node
/* Deduplicação de COBERTURA entre as duas importações do default-workspace.
   A sessão A (ZCode, pipeline de curadoria) produziu 55 condições nomeadas
   (substitutos de legados) + cobriu 21 síndromes com condições já curadas.
   A sessão B (import.mjs atual) gerou ws-* para TODAS as 221 — criando gêmeos.
   Regra: quando a síndrome já tem arquivo curado NÃO-ws (mais completo,
   motor-wired, assinado), o gêmeo ws-* é removido. Nada é fundido por nome:
   só por mapa explícito do relatório de importação da sessão A.
   Uso: node scripts/workspace/merge-cleanup.mjs [--dry] */
import { readFileSync, readdirSync, unlinkSync, existsSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const DRY = process.argv.includes("--dry");
const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const COND = join(raiz, "content", "condicoes");
const REP = join(raiz, "reports", "curadoria", "IMPORT-WORKSPACE.md");

/* 1) mapa síndrome → arquivo-alvo (sessão A) */
const mapa = new Map();
const rep = readFileSync(REP, "utf8");
for (const m of rep.matchAll(/^- \*\*([A-Z]{2,4}-\d\d) .*?→ `([^`]+\.json)`/gim)) mapa.set(m[1], m[2]);
const pulLine = rep.match(/\*\*Puladas:\*\* (.+)$/m);
const puladas = pulLine ? pulLine[1].split(",").map((s) => s.trim()) : [];
const cobertosPorCurado = new Set([...mapa.entries()].filter(([, f]) => !f.startsWith("ws-")).map(([id]) => id));
for (const p of puladas) cobertosPorCurado.add(p);

/* 2) nomes normalizados dos curados (rede de segurança por nome exato) */
const norm = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim();
const nomesCurados = new Set();
for (const f of readdirSync(COND).filter((f) => f.endsWith(".json") && !f.startsWith("ws-"))) {
  const j = JSON.parse(readFileSync(join(COND, f), "utf8"));
  nomesCurados.add(norm(j.nome));
}

/* 3) varre ws-* e remove gêmeos */
const removidos = [], mantidos = [];
for (const f of readdirSync(COND).filter((x) => x.startsWith("ws-") && x.endsWith(".json"))) {
  const j = JSON.parse(readFileSync(join(COND, f), "utf8"));
  const sid = j.ws?.id || (j.meta?.redigido || "").match(/\(([^,()]+\.json),/)?.[1]?.split("_")[0];
  const motivo1 = j.ws?.id && cobertosPorCurado.has(j.ws.id);
  const motivo2 = nomesCurados.has(norm(j.nome));
  if (motivo1 || motivo2) {
    if (!DRY) unlinkSync(join(COND, f));
    removidos.push(`${j.ws?.id || "?"} ${j.nome} (${f}) — ${motivo1 ? "coberto por curado da sessão A" : "nome idêntico a curado"}`);
  } else mantidos.push(f);
}
console.log(`gêmeos removidos: ${removidos.length} | ws mantidos: ${mantidos.length}`);
removidos.forEach((r) => console.log("  ✕ " + r));
if (!DRY) {
  const contagem = readdirSync(COND).filter((f) => f.endsWith(".json")).length;
  console.log(`total em content/condicoes: ${contagem}`);
}
