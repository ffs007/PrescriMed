import { describe, it, expect } from "vitest";
import { validarMedicamento } from "../medicamento.schema";
describe("medicamentoSchema", () => {
  it("aceita mínimo válido e limpa vazios", () => {
    const r = validarMedicamento({ principio_ativo: "Dipirona", apresentacao: "" });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.apresentacao).toBeNull();
  });
  it("exige princípio ativo", () => expect(validarMedicamento({ principio_ativo: "" }).ok).toBe(false));
  it("rejeita categoria desconhecida", () => expect(validarMedicamento({ principio_ativo: "X1", categoria_clinica: "abc" }).ok).toBe(false));
  it("revisado exige fonte", () => expect(validarMedicamento({ principio_ativo: "Dipirona", status_revisao: "revisado" }).ok).toBe(false));
  it("rejeita CID inválido", () => expect(validarMedicamento({ principio_ativo: "Dipirona", cid_relacionados: ["xx"] }).ok).toBe(false));
});
