#!/usr/bin/env node
/* Promove condicoes importadas de rascunho para aprovado, com assinatura registrada.
   Sem nome e CRM nao promove nada: a assinatura e dado, nao intencao.
   Uso:
     node scripts/workspace/aprovar.mjs --digest reports/workspace/DIGEST-ASSINATURA-2026-11-06.md --nome "Dr. Felipe" --crm "CRM-SP 000000" --dry
     node scripts/workspace/aprovar.mjs --digest <arquivo> --nome "..." --crm "..." [--todos]
   Le os itens marcados como "[x]" no digest; com --todos promove todas as ws-*.
*/
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const dir = resolve(raiz, "content/condicoes");
const args = process.argv.slice(2);
const val = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : null; };
const DRY = args.includes("--dry");
const TODOS = args.includes("--todos");
const IDS = val("--ids") ? val("--ids").split(",").map((s) => s.trim()) : null;
const DATA_ASSINATURA = val("--data");
const digestPath = val("--digest");
const nome = val("--nome");
const crm = val("--crm");

if (!nome || !crm) {
  console.error("Recusado: informe --nome e --crm. Sem assinatura identificada nada e promovido.");
  process.exit(2);
}

/* aceita ws-alg_07 e ws-alg07; resolve para o arquivo que existir */
const resolver = (id) => {
  const base = id.replace(/\.json$/, "");
  const cands = [base, base.replace(/_/g, ""), base.replace(/^ws-([a-z]+)(\d{2})$/, "ws-$1_$2")];
  for (const c of cands) if (readdirSync(dir).includes(c + ".json")) return c;
  return base;
};

let alvos = [];
if (IDS) {
  alvos = IDS.map(resolver);
} else if (TODOS) {
  alvos = readdirSync(dir).filter((f) => f.startsWith("ws-") && f.endsWith(".json")).map((f) => f.replace(/\.json$/, ""));
} else {
  if (!digestPath) { console.error("Informe --digest <arquivo> ou --todos."); process.exit(2); }
  const texto = readFileSync(resolve(raiz, digestPath), "utf8");
  alvos = [...texto.matchAll(/^- \[x\]\s+(\S+)\s+/gim)].map((m) => resolver(m[1].toLowerCase()));
  if (!alvos.length) { console.error("Nenhum item marcado com [x] no digest. Nada a promover."); process.exit(1); }
}

const data = DATA_ASSINATURA || new Date().toISOString().slice(0, 10);
let promovidas = 0, ignoradas = 0;
for (const id of alvos) {
  const caminho = resolve(dir, id + ".json");
  let c;
  try { c = JSON.parse(readFileSync(caminho, "utf8")); } catch { ignoradas++; continue; }
  if (c.status === "aprovado") { ignoradas++; continue; }
  c.status = "aprovado";
  c.meta = { ...c.meta, revisao: nome + " - APROVADO em " + data, assinatura: { nome, crm, data, escopo: "revisao clinica registrada no digest" } };
  if (!DRY) writeFileSync(caminho, JSON.stringify(c, null, 2) + "\n", "utf8");
  promovidas++;
}
console.log((DRY ? "[dry-run] " : "") + "promovidas: " + promovidas + " | ignoradas: " + ignoradas + " | assinatura: " + nome + " (" + crm + ")");
if (promovidas && !DRY) console.log("Agora rode: node scripts/content/build.mjs");
