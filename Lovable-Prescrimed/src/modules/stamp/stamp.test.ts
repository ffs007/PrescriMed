import { describe, expect, it } from "vitest";
import { stampLines, stampSchema } from "./stamp";

describe("carimbo médico", () => {
  it("formata CRM-UF número", () => {
    expect(stampLines({ nome: "Ana Souza", crm: "123456", uf: "SP" })[1]).toBe("CRM-SP 123456");
  });
  it("omite a terceira linha sem RQE e cargo", () => {
    expect(stampLines({ nome: "Ana Souza", crm: "123456", uf: "SP" })).toHaveLength(2);
  });
  it("junta RQE e cargo", () => {
    expect(stampLines({ nome: "A", crm: "1", uf: "SP", rqe: "1234", cargo: "Diretor Técnico" })[2]).toBe("RQE 1234 · Diretor Técnico");
  });
  it("rejeita CRM com letras", () => {
    expect(stampSchema.safeParse({ nome: "Ana Souza", crm: "12a", uf: "SP" }).success).toBe(false);
  });
});
