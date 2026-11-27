import { describe, expect, it } from "vitest";
import { validateReceita } from "../documentValidation";

const patient = { patientName: "Paciente Teste", isPediatric: false, weight: "" };

describe("Emissão da receita com sugestões clínicas", () => {
  it("não emite itens sugeridos com apresentação ou frequência ainda não cadastradas", () => {
    const result = validateReceita([
      { id: 1, name: "Amoxicilina", text: "Amoxicilina\nVO — 500 mg Apresentação não cadastrada · Frequência não cadastrada · Duração não cadastrada" },
    ], patient);
    expect(result.canEmit).toBe(false);
    expect(result.blockers).toContain("Complete apresentação, dose, frequência e duração da medicação 1 antes de emitir");
  });

  it("preserva a emissão de vários itens quando seus dados estão completos", () => {
    const result = validateReceita([
      { id: 1, name: "Medicamento A", text: "Medicamento A\nVO — 500 mg · cápsula 500 mg · 8/8h · 7 dias" },
      { id: 2, name: "Medicamento B", text: "Medicamento B\nVO — 250 mg · comprimido 250 mg · 12/12h · 5 dias" },
    ], patient);
    expect(result.canEmit).toBe(true);
  });
});