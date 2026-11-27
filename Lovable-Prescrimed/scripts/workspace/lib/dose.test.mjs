import { test } from "node:test";
import assert from "node:assert/strict";
import { parseDose, comporPos, humanizarClasse } from "./dose.mjs";

test("dose com faixa em mg preserva min, max e unidade", () => {
  const d = parseDose("0,3-0,5 mg (0,3-0,5 mL da solucao 1 mg/mL)");
  assert.equal(d.status, "ok");
  assert.equal(d.valor, 0.3);
  assert.equal(d.valor_max, 0.5);
  assert.equal(d.unidade, "mg");
});

test("dose por kg e reconhecida como por_kg", () => {
  const d = parseDose("15 mg/kg de 6 em 6 horas");
  assert.equal(d.status, "ok");
  assert.equal(d.valor, 15);
  assert.equal(d.unidade, "mg/kg");
  assert.equal(d.por_kg, true);
  assert.equal(d.freq_h, 6);
});

test("infusao continua em mcg/kg/min nao vira dose fixa", () => {
  const d = parseDose("0,05-0,5 mcg/kg/min em bomba de infusao");
  assert.equal(d.status, "ok");
  assert.equal(d.por_kg, true);
  assert.equal(d.por_min, true);
});

test("pediatria e separada do restante", () => {
  const d = parseDose("0,3-0,5 mg (0,3-0,5 mL da solucao 1 mg/mL); crianca 0,01 mg/kg");
  assert.match(d.ped || "", /crianca/i);
});

test("dose maxima em texto vira campo proprio", () => {
  const d = parseDose("500 mg de 8 em 8 horas; maximo 4 g por dia");
  assert.deepEqual(d.dose_maxima, { valor: 4, unidade: "g" });
});

test("texto sem numero nao inventa dose", () => {
  const d = parseDose("conforme resposta clinica");
  assert.equal(d.status, "falha");
  assert.equal(d.valor, null);
});

test("texto vazio falha sem excecao", () => {
  const d = parseDose("");
  assert.equal(d.status, "falha");
});

test("frequencia 8/8 h e traduzida para intervalo", () => {
  const d = parseDose("500 mg 8/8 h por 7 dias");
  assert.equal(d.freq_h, 8);
  assert.equal(d.duracao_dias, 7);
});

test("posicao da prescricao mantem as quatro partes", () => {
  const pos = comporPos({ dose: "500 mg", via: "VO", frequencia: "de 6 em 6 horas", duracao: "por 5 dias" });
  assert.match(pos, /^500 mg\. Via VO\. De 6 em 6 horas\. Por 5 dias\.$/);
});

test("posicao nao repete a mesma parte", () => {
  const pos = comporPos({ dose: "1 g", via: "IV", frequencia: "IV", duracao: "" });
  const partes = pos.split(". ").filter(Boolean);
  assert.equal(new Set(partes.map((p) => p.toLowerCase())).size, partes.length);
});

test("classe terap\u00eautica ganha acento e caixa", () => {
  assert.equal(humanizarClasse("analgesico_antitermico"), "Analg\u00e9sico antit\u00e9rmico");
  assert.equal(humanizarClasse("anti_histaminico_h1"), "Anti-histam\u00ednico H1");
  assert.equal(humanizarClasse("aine"), "AINE");
});

test("classe vazia cai em Outros", () => {
  assert.equal(humanizarClasse(""), "Outros");
});
