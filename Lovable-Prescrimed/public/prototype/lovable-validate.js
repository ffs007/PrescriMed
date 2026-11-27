/* Validação dos dados do paciente: avisa na hora valores impossíveis ou improváveis (idade, peso,
   creatinina, altura, idade gestacional). Aditivo: só observa os campos do protótipo, sem alterá-lo. */
(function () {
  "use strict";
  var num = function (v) { v = String(v || "").trim().replace(",", "."); return v === "" ? null : (/^-?\d+(\.\d+)?$/.test(v) ? parseFloat(v) : NaN); };
  var byPh = function (ph) { return document.querySelector('dialog[open] input[placeholder="' + ph + '"]'); };
  function igInput() {
    var d = document.querySelector("dialog[open]"); if (!d) return null;
    var lab = Array.prototype.find.call(d.querySelectorAll("label, div, span"), function (e) { return /IDADE GESTACIONAL/i.test(e.textContent) && e.children.length < 3; });
    var box = lab && lab.parentElement; return box ? box.querySelector("input") : null;
  }
  function rules() {
    var un = document.getElementById("p_idUn"), meses = un && /m/i.test(un.value);
    var ida = num((document.getElementById("p_idade") || {}).value), peso = num((document.getElementById("p_peso") || {}).value);
    var anos = ida == null || isNaN(ida) ? null : (meses ? ida / 12 : ida);
    return [
      [document.getElementById("p_idade"), function (v) {
        if (v == null) return ""; if (isNaN(v)) return "Use só números (ex.: 7).";
        if (v < 0) return "Idade não pode ser negativa.";
        if (meses ? v > 1500 : v > 120) return "Idade improvável — confira.";
        if (!meses && v !== Math.floor(v)) return "Para frações de ano, use a unidade 'meses'.";
        return "";
      }],
      [document.getElementById("p_peso"), function (v) {
        if (v == null) return ""; if (isNaN(v)) return "Use só números (ex.: 12,5).";
        if (v <= 0) return "Peso precisa ser maior que zero.";
        if (v < 0.4 || v > 300) return "Peso improvável — as doses ficariam erradas. Confira.";
        if (anos != null && anos < 1 && v > 15) return "Peso alto para menos de 1 ano — confira.";
        if (anos != null && anos >= 1 && anos < 12 && v > 90) return "Peso alto para a idade — confira.";
        if (anos != null && anos >= 18 && v < 25) return "Peso baixo para adulto — confira.";
        return "";
      }],
      [byPh("ex.: 1,2"), function (v) { if (v == null) return ""; if (isNaN(v)) return "Use só números (ex.: 1,2)."; if (v <= 0 || v > 25) return "Creatinina improvável (mg/dL) — confira."; return ""; }],
      [byPh("ex.: 170"), function (v) { if (v == null) return ""; if (isNaN(v)) return "Use só números, em centímetros."; if (v < 30 || v > 250) return "Altura improvável (em cm) — confira."; return ""; }],
      [igInput(), function (v) { if (v == null) return ""; if (isNaN(v)) return "Use só números de semanas."; if (v <= 0 || v > 44) return "Idade gestacional deve ficar entre 1 e 44 semanas."; return ""; }],
    ];
    void peso;
  }
  function msgFor(inp) {
    var id = "psxv-" + (inp.id || inp.placeholder || "ig").replace(/\W/g, "");
    var m = document.getElementById(id);
    if (!m) { m = document.createElement("div"); m.id = id; m.setAttribute("role", "alert"); m.style.cssText = "color:#b42318;font-size:12px;margin-top:4px;line-height:1.3"; inp.insertAdjacentElement("afterend", m); }
    return m;
  }
  function check() {
    rules().forEach(function (r) {
      var inp = r[0]; if (!inp) return;
      var t = r[1](num(inp.value)), m = msgFor(inp);
      m.textContent = t; inp.setAttribute("aria-invalid", t ? "true" : "false");
      inp.style.borderColor = t ? "#b42318" : "";
    });
  }
  document.addEventListener("input", function (e) { if (e.target && e.target.closest && e.target.closest("dialog[open]")) check(); }, true);
  document.addEventListener("change", function (e) { if (e.target && e.target.closest && e.target.closest("dialog[open]")) check(); }, true);
})();
