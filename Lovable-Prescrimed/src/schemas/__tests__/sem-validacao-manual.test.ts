import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

// Acusa conferência manual de campo de formulário seguida de mensagem de erro.
const PADRAO = /if \(!\w+(\.\w+)*(\.trim\(\))?\) *\{?\s*(return )?toast\.error\(\s*["'`][^"'`]*(obrigat|nome|descreva|justificativa|informe|preencha)/i;
function arquivos(d: string): string[] {
  return readdirSync(d).flatMap((n) => {
    const p = join(d, n);
    if (p.includes("components/ui") || p.includes("__tests__")) return [];
    return statSync(p).isDirectory() ? arquivos(p) : /\.tsx?$/.test(n) ? [p] : [];
  });
}
describe("validação centralizada", () => {
  it("não há conferência manual de campos obrigatórios", () => {
    const achados = arquivos("src").flatMap((f) =>
      readFileSync(f, "utf8").split("\n").map((l, i) => (PADRAO.test(l) ? `${f}:${i + 1}` : null)).filter(Boolean));
    expect(achados).toEqual([]);
  });
});
