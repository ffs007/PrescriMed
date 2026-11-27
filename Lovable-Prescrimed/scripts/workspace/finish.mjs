#!/usr/bin/env node
/* Fase final da fusão workspace ↔ webapp:
   1) Aprovação: rascunho → aprovado (assinatura em massa do Dr. Felipe, 2026-11-06)
   2) Deduplicação intra-classe:
      - wired (base) vs novo com a mesma molécula → remove o novo (o wired já
        carrega a posologia do workspace)
      - novo vs novo com a mesma molécula → mantém o 1º (linha 1 vem primeiro)
   Grava relatório em reports/curadoria/FINISH-FUSAO.md */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const COND = join(root, "content", "condicoes");
const MAP = JSON.parse(readFileSync(join(root, "reports", "auditoria-clinica", "mappings.json"), "utf8"));

/* nome por id do motor (amb + hosp) */
const id2name = new Map();
for (const p of MAP.protocolos) for (const c of p.classes || []) for (const m of c.meds || []) if (!id2name.has(m.id)) id2name.set(m.id, m.nome);
for (const hp of Object.values(MAP.hospMap || {})) for (const c of hp.classes || []) for (const m of c.meds || []) if (!id2name.has(m.id)) id2name.set(m.id, m.nome);

const ROUTE = /\b(ev|iv|im|sc|vo|sl|inalatoria|inalatorio|topica|topico|retal|sublingual|nebulizacao|nebulizado|spray|injetavel|injecao|infusao|gotas|colirio|oftalmico|otologico|pomada|creme|gel|comprimido|capsula|xarope|suspensao|oral|nasal|fortificada|fortificado|parenteral|venoso|intravenoso|intramuscular|subcutaneo|autoinjetor|alto fluxo|umidificado|solucao|soro|medicinal|aquosa|profilaxia|via)\b/g;
const norm = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  .replace(/\(.*?\)/g, " ")
  .replace(/\b\d+([.,]\d+)?\s*(mg|mcg|g|ml|ui|%|mg\/ml|kcal|l\/min)\b/g, " ")
  .replace(/\b\d+([.,]\d+)?\b/g, " ")
  .replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
const core = (s) => norm(s).replace(ROUTE, " ").replace(/\s+/g, " ").trim();

const stats = { aprovadas: 0, jaAprovadas: 0, dedupWiredNovo: 0, dedupNovoNovo: 0, classes: 0 };
const log = ["# FUSÃO FINAL — aprovação + deduplicação", "", `_Executado em ${new Date().toISOString()}_`, ""];

for (const f of readdirSync(COND).filter((x) => x.endsWith(".json"))) {
  const j = JSON.parse(readFileSync(join(COND, f), "utf8"));
  const antes = j.status;
  if (antes === "rascunho") {
    j.status = "aprovado";
    if (j.meta) {
      j.meta.revisao = "Dr. Felipe (aprovado em 2026-11-06)";
      j.meta.assinatura = { nome: "Dr. Felipe", crm: "registro em chat — 2026-11-06 (CRM a constar no perfil)", data: "2026-11-06", escopo: "aprovação das condições do default-workspace + lotes de curadoria" };
    }
    stats.aprovadas++;
  } else stats.jaAprovadas++;

  /* dedupe por classe */
  const hits = [];
  for (const sec of ["ambulatorial", "hospitalar"]) {
    for (const [ci, k] of (j[sec]?.classes || []).entries()) {
      stats.classes++;
      const cores = new Map(); // core → índice do item que fica
      const keep = [];
      const ordered = [...(k.itens || [])].map((it, i) => ({ it, i }))
        .sort((a, b) => (a.it.linha || 9) - (b.it.linha || 9) || a.i - b.i);
      for (const { it, i } of ordered) {
        let c = null, kind = null;
        if (it.base) { c = core(id2name.get(it.base) || it.base); kind = "wired"; }
        else if (it.novo) { c = core(it.novo.n); kind = "novo"; }
        else { keep.push(it); continue; }
        if (!c) { keep.push(it); continue; }
        const prev = cores.get(c);
        if (!prev) { cores.set(c, { kind, i }); keep.push(it); continue; }
        if (prev.kind === "novo" && kind === "wired") {
          /* wired chega depois do novo: o wired é melhor — troca */
          const idx = keep.findIndex((x) => x === prev.keepIt);
          if (idx >= 0) keep.splice(idx, 1);
          cores.set(c, { kind, i });
          keep.push(it);
          hits.push(`[swap] ${j.id} ${sec}[${ci}] "${k.nome}": novo → substituído pelo wired (${c})`);
          stats.dedupWiredNovo++;
        } else {
          hits.push(`[drop] ${j.id} ${sec}[${ci}] "${k.nome}": ${kind === "novo" ? "novo duplicado" : "novo sombreado por wired"} (${c})`);
          if (kind === "novo" && prev.kind === "novo") stats.dedupNovoNovo++; else stats.dedupWiredNovo++;
        }
        prev.keepIt = it;
      }
      k.itens = keep;
      if (!keep.some((x) => x.linha === 1)) keep[0].linha = 1; // V1 sempre garantido
    }
  }
  writeFileSync(join(COND, f), JSON.stringify(j, null, 1) + "\n", "utf8");
  if (hits.length) log.push(...hits);
}
log.splice(3, 0, "",
  `**Aprovadas agora:** ${stats.aprovadas} · já aprovadas: ${stats.jaAprovadas}`,
  `**Dedup:** ${stats.dedupWiredNovo} wired×novo · ${stats.dedupNovoNovo} novo×novo (em ${stats.classes} classes)`,
  "");
writeFileSync(join(root, "reports", "curadoria", "FINISH-FUSAO.md"), log.join("\n"), "utf8");
console.log(JSON.stringify(stats, null, 1));
