#!/usr/bin/env node
/* Aplica um patch exportado pelo editor do cockpit (lovable-cockpit.js) em content/condicoes.
   O patch traz { condicao, itens: [{ droga, pos_antes, pos_depois }] }, onde "droga" e o id
   de runtime (cur_<cond>__<base> ou curh_<cond>__<hosp>). Recusa item cuja posologia atual
   nao bata com pos_antes — evita sobrescrever edicao feita depois do export.
   Uso: node scripts/workspace/aplicar-patch.mjs --patch patch-x.json [--dry] */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const args = process.argv.slice(2);
const val = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : null; };
const DRY = args.includes("--dry");
const arq = val("--patch");
if (!arq) { console.error("Informe --patch <arquivo.json>"); process.exit(2); }

const patch = JSON.parse(readFileSync(resolve(raiz, arq), "utf8"));
const condId = patch.condicao;
if (!condId) { console.error("Patch sem campo 'condicao'."); process.exit(2); }

const dir = resolve(raiz, "content/condicoes");
const arquivos = readdirSync(dir).filter((f) => f.endsWith(".json"));
let alvo = null;
for (const f of arquivos) {
  const c = JSON.parse(readFileSync(resolve(dir, f), "utf8"));
  if (c.id === condId) { alvo = { f, c }; break; }
}
if (!alvo) { console.error("Condicao nao encontrada em content/condicoes: " + condId); process.exit(1); }

const c = alvo.c;
const chave = (id) => String(id).replace(/^curh?_/, "").replace(condId + "__", "");
let aplicados = 0, recusados = 0;
const log = [];

for (const it of patch.itens || []) {
  const base = chave(it.droga);
  let achou = false;
  for (const secao of ["ambulatorial", "hospitalar"]) {
    for (const k of c[secao]?.classes || []) {
      for (const item of k.itens || []) {
        const chaveItem = item.base || item.hosp || (item.novo && item.novo.id);
        if (chaveItem !== base) continue;
        achou = true;
        const atual = item.pos || (item.novo && item.novo.pos) || "";
        if (it.pos_antes && atual !== it.pos_antes) {
          recusados++;
          log.push("RECUSADO " + base + ": posologia atual difere do patch");
          continue;
        }
        if (item.novo) item.novo.pos = it.pos_depois; else item.pos = it.pos_depois;
        if (item.posTodas !== undefined) item.posTodas = true;
        aplicados++;
        log.push("aplicado " + base);
      }
    }
  }
  if (!achou) { recusados++; log.push("NAO ENCONTRADO " + base); }
}

log.forEach((l) => console.log("  " + l));
if (recusados && !aplicados) { console.error("Nada aplicado: " + recusados + " recusa(s)."); process.exit(1); }
if (!DRY && aplicados) {
  c.meta = { ...c.meta, patch_aplicado: (patch.gerado_em || "") + " (" + aplicados + " itens)" };
  writeFileSync(resolve(dir, alvo.f), JSON.stringify(c, null, 2) + "\n", "utf8");
}
console.log((DRY ? "[dry-run] " : "") + "aplicados: " + aplicados + " | recusados: " + recusados);
if (aplicados && !DRY) console.log("Agora rode: node scripts/content/build.mjs");
