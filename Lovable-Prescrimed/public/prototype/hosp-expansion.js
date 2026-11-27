/* Expansão aditiva da prescrição hospitalar (origem expansao_ia — confira): dietas, dispositivos e cuidados de enfermagem.
   Só acrescenta ao final das listas de HOSP_DB (índices existentes de dietaMap preservados). Versão e responsável registrados em PSX_HOSP_META. */
(function () {
  "use strict";
  var HD = window.HOSP_DB; if (!HD) return;
  var has = function (arr, v) { return arr.some(function (x) { return (Array.isArray(x) ? x[1] : x) === v; }); };
  [
    "Dieta enteral por sonda conforme nutrição (vazão inicial 20 mL/h, progredir conforme tolerância)",
    "Dieta hipercalórica e hiperproteica",
    "Dieta para doente renal (restrição de potássio, fósforo e proteína conforme ClCr)",
    "Dieta hipossódica e com restrição hídrica (1.000–1.500 mL/dia)",
    "Dieta pastosa com espessante (disfagia)",
    "Dieta para gestante (fracionada, 5–6 refeições)",
    "Dieta sem resíduos (preparo de exame)"
  ].forEach(function (d) { if (!has(HD.dietas, d)) HD.dietas.push(d); });
  [
    ["svd", "Sonda vesical de demora: técnica asséptica, fixação, bolsa abaixo da bexiga; reavaliar a necessidade diariamente"],
    ["sne", "Sonda nasoenteral: confirmar posição por radiografia antes de usar; cabeceira a 30–45°; lavar com 20 mL de água após dieta e medicações"],
    ["sng", "Sonda nasogástrica aberta em frasco; anotar débito de 6/6 h"],
    ["cvc", "Cateter venoso central: curativo estéril a cada 7 dias (filme) ou 48 h (gaze); revisar inserção diariamente"],
    ["avp96", "Acesso periférico: trocar curativo se sujo ou úmido; avaliar flebite a cada turno"],
    ["lpp", "Prevenção de lesão por pressão: Braden na admissão e diário; mudança de decúbito de 2/2 h; colchão pneumático se Braden ≤ 12"],
    ["curat", "Curativo da ferida com SF 0,9% e cobertura conforme leito da ferida, 1×/dia ou se saturado"],
    ["dor", "Avaliação da dor (escala 0–10, FLACC na criança) de 4/4 h e 1 h após analgésico"],
    ["morse", "Escala de Morse na admissão; grades elevadas, cama baixa e acompanhante se alto risco"],
    ["ctrlhid", "Restrição hídrica conforme prescrição; anotar ingesta e diurese"],
    ["isol", "Precaução respiratória para aerossóis (máscara N95, quarto privativo)"],
    ["delir", "Prevenção de delirium: orientação, óculos e aparelho auditivo, sono noturno, mobilização precoce"],
    ["tev", "Profilaxia mecânica de TEV: meia elástica ou compressão pneumática se contraindicado anticoagulante"],
    ["jejum", "Jejum para procedimento a partir de ___ h"],
    ["contenc", "Contenção mecânica só com prescrição; reavaliar a cada 15–30 min e registrar"]
  ].forEach(function (c) { if (!HD.cuidados.some(function (x) { return x[0] === c[0]; })) HD.cuidados.push(c); });
  window.PSX_HOSP_META = { versao: "2026.10-1", data: "2026-10-05", responsavel: "expansao_ia (PrescriMed)", origem: "expansao_ia" };
})();
