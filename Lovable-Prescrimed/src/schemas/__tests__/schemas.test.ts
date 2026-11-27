import { describe, it, expect } from "vitest";
import { doseGravavel, alertaSchema, atendimentoSchema, pacienteSchema, pendencias, encaminhamentoSchema } from "..";

describe("schemas únicos", () => {
  it("paciente sem nome é recusado", () => {
    expect(pacienteSchema.safeParse({ patientName: "", isPediatric: false, weight: "" }).success).toBe(false);
  });
  it("dose com mínima > máxima é recusada", () => {
    const ok = doseGravavel({ principio_ativo: "x", via: "VO", populacao: "adulto", dose_tipo: "fixa", dose_unidade: "mg", fonte_id: "f", dose_min: "10", dose_max: "5" });
    expect(ok).toBe(false);
  });
  it("dose válida passa", () => {
    expect(doseGravavel({ principio_ativo: "x", via: "VO", populacao: "adulto", dose_tipo: "fixa", dose_unidade: "mg", fonte_id: "f", dose_min: "5", dose_max: "10" })).toBe(true);
  });
  it("alerta crítico sem fonte é recusado", () => {
    expect(alertaSchema.safeParse({ tipo: "interacao", gravidade: "critica", titulo: "abc", mensagem: "abc" }).success).toBe(false);
  });
  it("atendimento com CID inválido é recusado", () => {
    expect(atendimentoSchema.safeParse({ ambiente: "ps", paciente_nome: "A", cid: "XYZ" }).success).toBe(false);
  });
  it("encaminhamento exige hipótese ou resumo", () => {
    expect(pendencias(encaminhamentoSchema, { especialidade: "Cardio", hipotese: "", resumoClinico: "" }))
      .toContain("Hipótese diagnóstica ou resumo clínico");
  });
});

import { camposObrigatoriosSchema, emissaoSchema } from "..";
describe("documentos regulatórios e emissão", () => {
  it("AIH sem campo obrigatório lista o campo", () => {
    expect(pendencias(camposObrigatoriosSchema([{ key: "cid", label: "CID", required: true }]), { cid: " " })).toEqual(["CID"]);
  });
  it("emissão sem perfil é recusada", () => {
    expect(pendencias(emissaoSchema, { perfil: null, paciente: { nome: "A" }, tipo: "receita", itens: [{ kind: "x" }], exigirControle: false }).length).toBeGreaterThan(0);
  });
});
