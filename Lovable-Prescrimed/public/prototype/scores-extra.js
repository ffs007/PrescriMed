/* Escores adicionais (origem: expansao_ia) no mesmo formato de window.SCORES. Confira antes de usar. */
(function () {
  "use strict";
  var S = window.SCORES; if (!S) return;
  var YN = [["0", "não"], ["1", "sim"]];
  function F(k, l, opts, def) { return { k: k, l: l, opts: opts, def: def == null ? opts[0][0] : def }; }
  function pts(n) { return [["0", "não (0)"], [String(n), "sim (+" + String(n).replace(".", ",") + ")"]]; }
  var sum = function (v, ks) { return ks.reduce(function (a, k) { return a + (parseFloat(v[k]) || 0); }, 0); };
  var AV = " Escore de expansão (IA) — conferir.";

  S.T.qsofa = { n: "qSOFA (sepse)", f: function () { return [F("fr", "FR ≥ 22 irpm", YN), F("pas", "PAS ≤ 100 mmHg", YN), F("mental", "Alteração do nível de consciência", YN)]; },
    calc: function (v) { var s = sum(v, ["fr", "pas", "mental"]); return s >= 2 ? { s: s, cls: "bad", t: "Alto risco de desfecho ruim", c: "Investigar sepse: lactato, hemoculturas, antibiótico na 1ª hora e cristaloide 30 mL/kg se hipotensão ou lactato ≥ 4. Não liberar." } : { s: s, cls: s ? "warn" : "ok", t: "qSOFA < 2", c: "Não exclui sepse; reavaliar sinais vitais e considerar SOFA/NEWS." }; },
    note: "Seymour et al. 2016 (Sepsis-3)." + AV };

  S.T.wells_tep = { n: "Wells (TEP)", f: function () { return [F("tvp", "Sinais clínicos de TVP", pts(3)), F("alt", "TEP é o diagnóstico mais provável", pts(3)), F("fc", "FC > 100 bpm", pts(1.5)), F("imob", "Imobilização ≥ 3 dias ou cirurgia em 4 semanas", pts(1.5)), F("prev", "TVP/TEP prévio", pts(1.5)), F("hemo", "Hemoptise", pts(1)), F("ca", "Câncer ativo", pts(1))]; },
    calc: function (v) { var s = sum(v, ["tvp", "alt", "fc", "imob", "prev", "hemo", "ca"]); return s > 4 ? { s: s, cls: "bad", t: "TEP provável", c: "Angiotomografia de tórax; anticoagular empiricamente se sem contraindicação e atraso no exame." } : { s: s, cls: "warn", t: "TEP improvável", c: "Aplicar PERC; se positivo, D-dímero. D-dímero negativo exclui." }; },
    note: "Wells et al. 2000." + AV };

  S.T.perc = { n: "PERC (TEP)", f: function () { return [F("id", "Idade ≥ 50 anos", YN), F("fc", "FC ≥ 100", YN), F("sat", "SpO₂ < 95%", YN), F("hemo", "Hemoptise", YN), F("estr", "Uso de estrogênio", YN), F("prev", "TVP/TEP prévio", YN), F("edema", "Edema unilateral de perna", YN), F("cir", "Cirurgia/trauma em 4 semanas", YN)]; },
    calc: function (v) { var s = sum(v, ["id", "fc", "sat", "hemo", "estr", "prev", "edema", "cir"]); return s === 0 ? { s: s, cls: "ok", t: "PERC negativo", c: "Com baixa probabilidade clínica, TEP excluído sem D-dímero." } : { s: s, cls: "warn", t: "PERC positivo", c: "Solicitar D-dímero (ou imagem conforme probabilidade)." }; },
    note: "Kline et al. 2004. Só para baixa probabilidade pré-teste." + AV };

  S.T.cha2ds2 = { n: "CHA₂DS₂-VASc (FA)", f: function () { return [F("ic", "Insuficiência cardíaca", pts(1)), F("has", "Hipertensão", pts(1)), F("id", "Idade", [["0", "< 65 (0)"], ["1", "65–74 (+1)"], ["2", "≥ 75 (+2)"]]), F("dm", "Diabetes", pts(1)), F("avc", "AVC/AIT/tromboembolismo prévio", pts(2)), F("vasc", "Doença vascular (IAM, DAP, placa aórtica)", pts(1)), F("sexo", "Sexo feminino", pts(1))]; },
    calc: function (v) { var s = sum(v, ["ic", "has", "id", "dm", "avc", "vasc", "sexo"]), base = s - (parseFloat(v.sexo) || 0); return base >= 2 ? { s: s, cls: "bad", t: "Alto risco tromboembólico", c: "Anticoagulação oral indicada (avaliar sangramento com HAS-BLED)." } : base === 1 ? { s: s, cls: "warn", t: "Risco intermediário", c: "Considerar anticoagulação oral, decisão compartilhada." } : { s: s, cls: "ok", t: "Baixo risco", c: "Sem indicação de anticoagulação." }; },
    note: "Lip et al. 2010; ESC 2020." + AV };

  S.T.glasgow = { n: "Glasgow (nível de consciência)", f: function () { return [F("o", "Abertura ocular", [["4", "4 — espontânea"], ["3", "3 — ao chamado"], ["2", "2 — à pressão"], ["1", "1 — nenhuma"]]), F("v", "Resposta verbal", [["5", "5 — orientado"], ["4", "4 — confuso"], ["3", "3 — palavras"], ["2", "2 — sons"], ["1", "1 — nenhuma"]]), F("m", "Resposta motora", [["6", "6 — obedece"], ["5", "5 — localiza"], ["4", "4 — flexão normal"], ["3", "3 — flexão anormal"], ["2", "2 — extensão"], ["1", "1 — nenhuma"]])]; },
    calc: function (v) { var s = sum(v, ["o", "v", "m"]); return s <= 8 ? { s: s, cls: "bad", t: "Grave", c: "Proteger via aérea (IOT), TC de crânio, regulação imediata." } : s <= 12 ? { s: s, cls: "warn", t: "Moderado", c: "TC de crânio, observação e reavaliação neurológica seriada." } : { s: s, cls: "ok", t: "Leve", c: "Aplicar regra canadense de TC; reavaliar." }; },
    note: "Teasdale & Jennett 1974 (versão 2014)." + AV };

  S.T.alvarado = { n: "Alvarado (apendicite)", f: function () { return [F("mig", "Dor migratória para FID", pts(1)), F("ano", "Anorexia", pts(1)), F("nv", "Náuseas/vômitos", pts(1)), F("dor", "Dor à palpação em FID", pts(2)), F("desc", "Descompressão brusca dolorosa", pts(1)), F("feb", "Temperatura ≥ 37,3 °C", pts(1)), F("leuco", "Leucocitose > 10.000", pts(2)), F("desv", "Desvio à esquerda", pts(1))]; },
    calc: function (v) { var s = sum(v, ["mig", "ano", "nv", "dor", "desc", "feb", "leuco", "desv"]); return s >= 7 ? { s: s, cls: "bad", t: "Alta probabilidade", c: "Avaliação cirúrgica; jejum, analgesia e hidratação." } : s >= 5 ? { s: s, cls: "warn", t: "Probabilidade intermediária", c: "Imagem (USG/TC) e observação com reavaliação." } : { s: s, cls: "ok", t: "Baixa probabilidade", c: "Considerar outras causas; orientar retorno se piora." }; },
    note: "Alvarado 1986." + AV };

  ["qsofa", "wells_tep", "perc", "cha2ds2", "glasgow", "alvarado"].forEach(function (k) { if (S.ORDER.indexOf(k) < 0) S.ORDER.push(k); });
  var sug = { "exp-diverticulite": ["qsofa"], "exp-lepto": ["qsofa"], "pielonefrite": ["qsofa"], "pac": ["curb", "qsofa"], "tce-leve": ["ccthr", "glasgow"], "dor-toracica-baixo-risco": ["heart", "wells_tep", "perc"] };
  Object.keys(sug).forEach(function (k) { var cur = S.SUG[k] || []; sug[k].forEach(function (x) { if (cur.indexOf(x) < 0) cur.push(x); }); S.SUG[k] = cur; });
})();
