// Gera supabase/functions/_shared/schemas a partir de src/schemas (fonte única).
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
const src = "src/schemas", out = "supabase/functions/_shared/schemas";
mkdirSync(out, { recursive: true });
export const transform = (code) =>
  "// GERADO por scripts/sync-schemas.mjs — não editar. Fonte: src/schemas\n" +
  code.replace(/from "zod"/g, 'from "npm:zod@3.23.8"')
      .replace(/from "\.\/([\w.]+?)"/g, 'from "./$1.ts"');
for (const f of readdirSync(src).filter((f) => f.endsWith(".ts")))
  writeFileSync(`${out}/${f}`, transform(readFileSync(`${src}/${f}`, "utf8")));
console.log("schemas sincronizados");
