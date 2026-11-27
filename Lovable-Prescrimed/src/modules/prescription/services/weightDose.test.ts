import { describe, it, expect } from "vitest";
import { buildPatientInstruction, calculateWeightDose, DOSE_NOT_CALCULATED, NOT_FOR_AGE } from "./weightDose";
import { receitaSchema } from "@/schemas/documento.schema";

const para = { mgkg: 10, per: "dose" as const, div: 1, max: 750, unit: "gota", mgpu: 10, step: 1, regra: "10 mg/kg/dose — 1 gota/kg" };
const s = { presentation: "Gotas 200 mg/mL", adultInstruction: null, pediatricInstruction: "Dar {dose} de 6/6h.", rule: para, nonPharmacological: false };

describe("dose por peso", () => {
  it("12 kg de paracetamol gotas = 12 gotas em negrito com a regra", () => {
    const t = buildPatientInstruction(s, { isPediatric: true, weight: "12" });
    expect(t).toContain("**12 gotas**");
    expect(t).toContain("10 mg/kg/dose");
  });
  it("sem peso bloqueia", () => {
    expect(buildPatientInstruction(s, { isPediatric: true, weight: "" })).toBe(DOSE_NOT_CALCULATED);
    expect(receitaSchema.safeParse({ selected: [{ text: `X\n${DOSE_NOT_CALCULATED}` }] }).success).toBe(false);
  });
  it("opção só pediátrica não serve para adulto", () => {
    expect(buildPatientInstruction(s, { isPediatric: false, weight: "70" })).toBe(NOT_FOR_AGE);
  });
  it("respeita dose máxima e divide dose diária", () => {
    const amox = { mgkg: 50, per: "dia" as const, div: 2, max: 1000, unit: "mL", mgpu: 50, step: 0.5, regra: "" };
    expect(calculateWeightDose(amox, 12)!.units).toBe(6);
    expect(calculateWeightDose(amox, 60)!.units).toBe(20);
  });
});
