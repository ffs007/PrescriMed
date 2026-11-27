import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
describe("schemas do servidor", () => {
  it("cópia do servidor está igual à fonte (rode npm run sync:schemas)", () => {
    for (const f of readdirSync("src/schemas").filter((f) => f.endsWith(".ts"))) {
      const srv = readFileSync(`supabase/functions/_shared/schemas/${f}`, "utf8");
      const exp = "// GERADO por scripts/sync-schemas.mjs — não editar. Fonte: src/schemas\n" +
        readFileSync(`src/schemas/${f}`, "utf8").replace(/from "zod"/g, 'from "npm:zod@3.23.8"').replace(/from "\.\/([\w.]+?)"/g, 'from "./$1.ts"');
      expect(srv).toBe(exp);
    }
  });
});
