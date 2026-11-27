// Extrator de mapeamentos clínicos para auditoria.
// Carrega os arquivos de DADOS do protótipo (na ordem do index.html, sem UI)
// e emite: mappings.json (completo) + batches/batch_N.md (lote legível para revisão clínica).
// Uso: node scripts/audit/extract-mappings.mjs
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const protoDir = resolve(root, "public/prototype");
const outDir = resolve(root, "reports/auditoria-clinica");
mkdirSync(resolve(outDir, "batches"), { recursive: true });

// Apenas arquivos de dados/taxonomia — sem app.js nem extensões com DOM.
const LOAD = [
  "proto-data.js", "proto-data-2.js", "proto-data-3.js", "proto-data-4.js", "proto-data-5.js",
  "legacy-data.js", "expansion-data.js",
  "hosp-data.js", "hosp-expansion.js",
  "lovable-custom.js",      // mescla homônimos (tolerante a falha)
  "lovable-rxtaxonomy.js",  // PSX_RXMAP / kits por queixa
];

const ctx = { console: { log() {}, warn() {}, error() {} } };
ctx.window = ctx;
ctx.globalThis = ctx;
vm.createContext(ctx);
const skipped = [];
for (const f of LOAD) {
  try {
    vm.runInContext(readFileSync(resolve(protoDir, f), "utf8"), ctx, { filename: f });
  } catch (e) {
    skipped.push(`${f}: ${String(e && e.message).slice(0, 120)}`);
  }
}

const DB = ctx.PROTO_DB || {};
const HD = ctx.HOSP_DB || {};
const RXMAP = ctx.PSX_RXMAP || null;
const drugs = DB.drugs || {}, classes = DB.classes || {}, protocols = DB.protocols || [];

const trunc = (s, n) => String(s == null ? "" : s).replace(/\s+/g, " ").trim().slice(0, n);

function drugSummary(id) {
  const d = drugs[id];
  if (!d) return { id, nome: `??MISSING:${id}` };
  const pos = d.a && d.a[0] && d.a[0].pos && d.a[0].pos[0] ? trunc(d.a[0].pos[0].t, 110) : "";
  return {
    id,
    nome: d.n,
    flags: [d.ctrl ? "ctrl" : "", d.atb ? "atb" : "", d.gx ? "gx" : "", d.gc ? "gc" : "", d.notif ? "notif" : ""].filter(Boolean),
    ap: trunc(d.a && d.a[0] && d.a[0].ap, 60),
    posologia: pos,
    pediatrico: !!(d.p && d.p.reg && d.p.reg.length) || !!(d.p && d.p.faixas),
    origem: d.origem || "proto",
    nota: trunc(d.nota, 120),
  };
}
function classSummary(k) {
  const c = classes[k];
  if (!c) return { k, nome: `??MISSING:${k}`, meds: [] };
  return { k, nome: c.n, meds: (c.d || []).map(drugSummary) };
}

// 1) protocolos ambulatoriais (pós-mescla do lovable-custom)
const protos = protocols.map(p => ({
  id: p.id, nome: p.n, cat: p.cat, origem: p.origem || "proto",
  alias: trunc(p.alias, 80), cid: (p.cid || []).map(c => c[0]).join(","),
  alerta: trunc(p.alerta, 260), naoUsar: trunc(p.naoUsar, 160),
  classes: (p.cls || []).map(classSummary),
}));

// 2) mapa hospitalar
const hospMap = Object.entries(HD.map || {}).map(([pid, clsKeys]) => {
  const p = protocols.find(x => x.id === pid);
  return {
    protocolo: pid, nome: p ? p.n : "??",
    classes: clsKeys.map(k => {
      const c = HD.classes && HD.classes[k];
      if (!c) return { k, nome: `??MISSING:${k}`, meds: [] };
      return { k, nome: c.n, meds: (c.d || []).map(id2 => {
        const d = HD.drugs[id2];
        return d ? { id: id2, nome: d.n, ap: trunc(d.ap, 60) } : { id: id2, nome: `??MISSING:${id2}` };
      }) };
    }),
  };
});

// 3) simulação de preset do modo emergência: 1º remédio das 4 primeiras classes
const presets = protocols
  .filter(p => (p.cls || []).length)
  .map(p => ({
    protocolo: p.id, nome: p.n,
    preset: (p.cls || []).slice(0, 4)
      .map(k => (classes[k] && classes[k].d || []).filter(id2 => drugs[id2]).map(id2 => drugs[id2].n)[0])
      .filter(Boolean),
  }));

// 4) kits por queixa (simulação do kitFor do lovable-rxmodal)
const ORIENT = /orient|orienta|medidas|higi/i;
const fold = s => String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
let kits = [];
if (RXMAP) {
  const byQ = {};
  Object.keys(classes).forEach(k => {
    const m = RXMAP[k];
    if (!m || !m.q) return;
    (byQ[m.q] = byQ[m.q] || { queixa: m.q, sec: m.sec, ord: m.ord, keys: [] }).keys.push(k);
  });
  kits = Object.values(byQ).sort((a, b) => (a.ord || 9999) - (b.ord || 9999)).map(e => {
    const meds = [], orient = [];
    e.keys.forEach(k => {
      const cs = classes[k];
      if (!cs) return;
      const ids = (cs.d || []).filter(id2 => drugs[id2]);
      if (!ids.length) return;
      if (ORIENT.test(fold(cs.n))) { orient.push(drugs[ids[0]].n); return; }
      if (meds.some(m => m.id === ids[0])) return;
      meds.push({ id: ids[0], nome: drugs[ids[0]].n, classe: cs.n, alts: ids.slice(1, 4).map(id2 => drugs[id2].n) });
    });
    return { queixa: e.queixa, secao: e.sec || "", kit: meds, orientacoes: orient };
  }).filter(k => k.kit.length);
}

writeFileSync(resolve(outDir, "mappings.json"), JSON.stringify({
  gerado_em: new Date().toISOString(),
  totais: { protocolos: protos.length, protocolos_com_cls: protos.filter(p => p.classes.length).length, classes: Object.keys(classes).length, drugs: Object.keys(drugs).length, hospMap: hospMap.length, kits: kits.length },
  skipped,
  protocolos: protos, hospMap, presets, kits,
}, null, 1), "utf8");

// ---- batches legíveis ----
const NBATCH = 4;
const per = Math.ceil(protos.length / NBATCH);
const drugLine = m => `    - ${m.nome}${m.flags && m.flags.length ? ` [${m.flags.join(",")}]` : ""}${m.posologia ? ` — ${m.posologia}` : ""}${m.pediatrico ? " (ped✓)" : ""}${m.origem === "expansao_ia" || String(m.id).startsWith("exp_") ? " ⚠IA" : ""}`;
for (let b = 0; b < NBATCH; b++) {
  const slice = protos.slice(b * per, (b + 1) * per);
  const lines = [`# Lote ${b + 1}/${NBATCH} — protocolos ${b * per + 1}–${Math.min((b + 1) * per, protos.length)}`, ""];
  slice.forEach(p => {
    lines.push(`## [${p.id}] ${p.nome}  (${p.cat}${p.origem !== "proto" ? ` · ${p.origem}` : ""})${p.cid ? ` · CID ${p.cid}` : ""}`);
    if (p.alias) lines.push(`- alias: ${p.alias}`);
    if (p.alerta) lines.push(`- ALERTA/conduta: ${p.alerta}`);
    if (p.naoUsar) lines.push(`- NÃO USAR: ${p.naoUsar}`);
    if (!p.classes.length) lines.push(`- (sem classes — sem medicação vinculada)`);
    p.classes.forEach(c => {
      lines.push(`  - CLASSE ${c.nome}${c.nome.includes("??") ? " <<REFERÊNCIA QUEBRADA>>" : ""}`);
      c.meds.forEach(m => lines.push(drugLine(m)));
    });
    lines.push("");
  });
  // distribui hospMap/kits/presets igualmente
  const hm = hospMap.filter((_, i) => i % NBATCH === b);
  if (hm.length) {
    lines.push(`## MAPA HOSPITALAR (parte ${b + 1})`, "");
    hm.forEach(h => {
      lines.push(`### [${h.protocolo}] ${h.nome}`);
      h.classes.forEach(c => {
        lines.push(`  - ${c.nome}${c.nome.includes("??") ? " <<QUEBRADO>>" : ""}: ${c.meds.map(m => m.nome).join(", ")}`);
      });
      lines.push("");
    });
  }
  const kk = kits.filter((_, i) => i % NBATCH === b);
  if (kk.length) {
    lines.push(`## KITS POR QUEIXA (1º remédio de cada classe — parte ${b + 1})`, "");
    kk.forEach(k => {
      lines.push(`### ${k.queixa} (${k.secao})`);
      lines.push(`  - kit: ${k.kit.map(m => m.nome).join(" + ")}`);
      if (k.orientacoes.length) lines.push(`  - orientações: ${k.orientacoes.join("; ")}`);
      lines.push("");
    });
  }
  writeFileSync(resolve(outDir, "batches", `batch_${b + 1}.md`), lines.join("\n"), "utf8");
}

console.log(JSON.stringify({
  protocolos: protos.length, com_cls: protos.filter(p => p.classes.length).length,
  hospMap: hospMap.length, kits: kits.length, skipped,
  saida: outDir,
}, null, 1));
