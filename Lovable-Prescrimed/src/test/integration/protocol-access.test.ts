// Live policy regression checks: run explicitly against the project's Cloud database.
import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";

function policy(table: string, name: string) {
  return execFileSync("lovable", ["supabase", "query",
    `SELECT qual FROM pg_policies WHERE schemaname='public' AND tablename='${table}' AND policyname='${name}'`,
  ], { encoding: "utf8" });
}

describe("restricted protocol directories", () => {
  it("restricts institutions through membership/ownership instead of all authenticated users", () => {
    expect(policy("prot_instancias", "auth le instancias")).toContain("fn_prot_pode_ver_instancia(id)");
    const definition = execFileSync("lovable", ["supabase", "query",
      "SELECT pg_get_functiondef('public.fn_prot_pode_ver_instancia(uuid)'::regprocedure) AS definition",
    ], { encoding: "utf8" });
    expect(definition).toContain("p.instancia_id = _instancia");
    expect(definition).toContain("p.owner = auth.uid()");
    expect(definition).toContain("fn_prot_papel(p.equipe_id) IS NOT NULL");
  }, 20_000);

  it("restricts teams to members and administrators", () => {
    const rule = policy("prot_equipes", "auth le equipes");
    expect(rule).toContain("fn_prot_papel(id) IS NOT NULL");
    expect(rule).toContain("has_role(auth.uid(), 'admin'::app_role)");
  }, 20_000);

  it("restricts planned clinical blocks to curators and administrators", () => {
    expect(policy("base_blocos_medicamentos_planejados", "blocos plan read auth")).toContain("fn_curadoria_pode_editar()");
    const definition = execFileSync("lovable", ["supabase", "query",
      "SELECT pg_get_functiondef('public.fn_curadoria_pode_editar()'::regprocedure) AS definition",
    ], { encoding: "utf8" });
    expect(definition).toContain("'admin'::app_role");
    expect(definition).toContain("'revisor'::app_role");
  }, 20_000);
});