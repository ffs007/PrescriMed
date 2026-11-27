#!/usr/bin/env node
/* Remove classes marcadas origem:"workspace" que NAO sejam "Medidas nao farmacologicas".
   Uso para desfazer uma fusao ampla mantendo o acrescimo seguro. Idempotente. */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const DRY = process.argv.includes("--dry");
const COND = resolve(raiz, "content/condicoes");
const manter = /medidas n.o farmacol/i;
let arquivos = 0, removidas = 0;
for (const f of readdirSync(COND).filter((f) => f.endsWith(".json"))) {
  const c = JSON.parse(readFileSync(resolve(COND, f), "utf8"));
  let mudou = false;
  for (const chave of ["ambulatorial", "hospitalar"]) {
    const classes = c[chave]?.classes;
    if (!classes) continue;
    const filtradas = classes.filter((k) => !(k.origem === "workspace" && !manter.test(k.nome)));
    if (filtradas.length !== classes.length) {
      removidas += classes.length - filtradas.length;
      c[chave].classes = filtradas;
      mudou = true;
    }
  }
  if (mudou) { arquivos++; if (!DRY) writeFileSync(resolve(COND, f), JSON.stringify(c, null, 2) + "\n", "utf8"); }
}
console.log((DRY ? "[dry-run] " : "") + "arquivos ajustados: " + arquivos + " | classes removidas: " + removidas);
