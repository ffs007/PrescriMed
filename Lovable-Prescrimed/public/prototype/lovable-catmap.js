/* Unificação de rótulos de especialidade — SÓ exibição, em memória, antes do app.js.
   Os arquivos de dados e a especialidade gravada em cada condição não mudam.
   Os mapas clínicos (anamnese, exame físico, encaminhamento) ganham as chaves
   unificadas apontando para o conteúdo já existente — nada é criado nem removido. */
(function () {
  "use strict";
  var D = window.PROTO_DB, CL = window.CLIN;
  if (!D || !D.protocols) return;

  var UNIFY = {
    "Neurológico": "Neurologia",
    "Urológico": "Urologia / Andrologia",
    "Dermatológico": "Pele e alergia",
    "Alergia/Pele": "Pele e alergia",
    "Pele e partes moles": "Pele e alergia",
    "Gastrointestinal": "Gastro / Proctologia",
    "Infeccioso": "Infectologia",
    "Ouvido": "Otorrino",
    "Olho": "Oftalmologia",
    "Oftalmológico": "Oftalmologia"
  };
  // "Cardiovascular / Metabólico" é separado por condição (rótulo misto)
  var ENDO = ["hiperglicemia", "hipoglicemia"];

  D.protocols.forEach(function (p) {
    if (p.cat === "Cardiovascular / Metabólico") p.cat = ENDO.indexOf(p.id) >= 0 ? "Endócrino / Metabólico" : "Cardiovascular";
    else if (UNIFY[p.cat]) p.cat = UNIFY[p.cat];
  });

  if (!CL) return;
  function mergeArr(map, oldKey, newKey) {
    if (!map || !map[oldKey]) return;
    map[newKey] = (map[newKey] || []).concat(map[oldKey]).filter(function (x, i, a) { return a.indexOf(x) === i; });
  }
  [CL.ANAM_MAP_CAT, CL.EF_MAP_CAT].forEach(function (map) {
    Object.keys(UNIFY).forEach(function (old) { mergeArr(map, old, UNIFY[old]); });
    mergeArr(map, "Cardiovascular / Metabólico", "Cardiovascular");
    mergeArr(map, "Cardiovascular / Metabólico", "Endócrino / Metabólico");
  });
  if (CL.CAT_ESP) {
    Object.keys(UNIFY).forEach(function (old) {
      if (CL.CAT_ESP[old] && !CL.CAT_ESP[UNIFY[old]]) CL.CAT_ESP[UNIFY[old]] = CL.CAT_ESP[old];
    });
    if (CL.CAT_ESP["Cardiovascular / Metabólico"]) {
      if (!CL.CAT_ESP["Cardiovascular"]) CL.CAT_ESP["Cardiovascular"] = "Cardiologia";
      if (!CL.CAT_ESP["Endócrino / Metabólico"]) CL.CAT_ESP["Endócrino / Metabólico"] = "Endocrinologia";
    }
  }
})();
