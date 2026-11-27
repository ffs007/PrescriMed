import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";

function readPolicy(table: string, name: string) {
  return execFileSync("lovable", ["supabase", "query",
    `SELECT qual,with_check FROM pg_policies WHERE schemaname='public' AND tablename='${table}' AND policyname='${name}'`,
  ], { encoding: "utf8" });
}

describe("clinical preparation access", () => {
  it("restricts medication restrictions in preparation to curators/admins", () => {
    expect(readPolicy("stg_med_restricoes", "stg_med_restricoes_select_auth")).toContain("fn_curadoria_pode_editar()");
  }, 20_000);

  it("restricts clinical tests to curators/admins", () => {
    expect(readPolicy("testes_clinicos_v2", "Autenticados leem testes_clinicos_v2")).toContain("fn_curadoria_pode_editar()");
  }, 20_000);

  it("requires protocol authority on both the original and updated alert", () => {
    const result = execFileSync("lovable", ["supabase", "query",
      "SELECT (qual = with_check) AS same_authority, (with_check LIKE '%fn_prot_nivel(protocolo_id)%' AND with_check LIKE '%admin%' AND with_check LIKE '%coordenador%' AND with_check LIKE '%dono%') AS protocol_authority FROM pg_policies WHERE schemaname='public' AND tablename='prot_alertas' AND policyname='resolver alertas'",
    ], { encoding: "utf8" });
    expect(result).toMatch(/same_authority[\s\S]*true/);
    expect(result).toMatch(/protocol_authority[\s\S]*true/);
  }, 20_000);
});