/**
 * Dados de teste do catálogo clínico.
 *
 * O catálogo real vive no banco; os testes usam estas amostras fixas para
 * exercitar o motor de sugestão e segurança sem rede.
 */
import type { Medication } from "@/types/prescription";
import type { MedicationV2 } from "@/modules/prescription/types/clinical";
import type { SuggestionRecipe } from "@/modules/prescription/types/suggestionLines";

export const TEST_AMOXICILINA_ID = 1;
export const TEST_DIPIRONA_ID = 4;

export const TEST_MEDICATIONS: Medication[] = [
  {
    id: TEST_AMOXICILINA_ID,
    name: "Amoxicilina 500mg",
    dosage: "1 cápsula de 8/8h",
    instructions: "por 7 dias",
    category: "Antibióticos",
    prescriptionType: "branca2vias",
    pediatricDose: "50 mg/kg/dia",
    safeForPregnant: true,
  },
  {
    id: TEST_DIPIRONA_ID,
    name: "Dipirona 500mg",
    dosage: "1 comprimido de 6/6h",
    instructions: "se dor ou febre",
    category: "Analgésicos",
    prescriptionType: "comum",
    pediatricDose: "25 mg/kg/dose",
  },
];

export const TEST_MEDICATION_OVERLAY: MedicationV2[] = [
  {
    ...TEST_MEDICATIONS[0],
    activeIngredient: "amoxicillin",
    therapeuticClass: "antibiotico-betalactamico",
    presentations: [
      {
        id: "cap-500",
        form: "capsula",
        strength: 500,
        unit: "mg",
        routes: ["oral"],
        label: "500 mg cápsula",
      },
    ],
    adultDose: { amount: 500, unit: "mg", intervalHours: 8, durationDays: 7 },
    pediatricDoseStructured: { mgPerKgPerDay: 50, intervalHours: 8, durationDays: 7 },
  },
  {
    ...TEST_MEDICATIONS[1],
    activeIngredient: "metamizole",
    therapeuticClass: "analgesico-antipiretico",
    presentations: [
      {
        id: "gotas-500-ml",
        form: "gotas",
        strength: 500,
        unit: "mg/mL",
        perVolumeMl: 1,
        routes: ["oral"],
        label: "500 mg/mL gotas",
      },
    ],
    adultDose: { amount: 500, unit: "mg", intervalHours: 6 },
    pediatricDoseStructured: { mgPerKgPerDose: 25, intervalHours: 6 },
    requiresWeight: true,
  },
];

export const TEST_AZITROMICINA_ID = 2;
export const TEST_SINVASTATINA_ID = 14;

/** Par usado para exercitar a regra de interação por classe terapêutica. */
TEST_MEDICATION_OVERLAY.push(
  {
    id: TEST_AZITROMICINA_ID,
    name: "Azitromicina 500mg",
    dosage: "1 comprimido 1x/dia",
    instructions: "por 3 dias",
    category: "Antibióticos",
    therapeuticClass: "antibiotico-macrolideo",
    adultDose: { amount: 500, unit: "mg", intervalHours: 24, durationDays: 3 },
  },
  {
    id: TEST_SINVASTATINA_ID,
    name: "Sinvastatina 20mg",
    dosage: "1 comprimido à noite",
    instructions: "uso contínuo",
    category: "Cardiovascular",
    therapeuticClass: "estatina",
    adultDose: { amount: 20, unit: "mg", intervalHours: 24 },
    interactions: [
      {
        withClass: "antibiotico-macrolideo",
        severity: "avoid",
        message: "Risco de miopatia — evitar associação com macrolídeos.",
      },
    ],
  },
);

export const TEST_PROTOCOLS: Record<number, { pathologyId: number; suggestions: SuggestionRecipe[] }> = {
  1: {
    pathologyId: 1,
    suggestions: [
      { medicationId: TEST_AMOXICILINA_ID, line: "primeira", highlight: true },
      { medicationId: TEST_DIPIRONA_ID, line: "sintomatico" },
    ],
  },
};

export const getTestProtocol = (pathologyId: number) => TEST_PROTOCOLS[pathologyId];
