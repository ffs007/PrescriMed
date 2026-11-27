/* Busca do PS (aditiva) — v2:
   1) SINÔNIMOS POPULARES: o brasileiro diz "dor de cabeça", "pressão alta", "bicho de pé",
      "pedra no rim" — o sistema mapeia para o nome canônico da condição antes de buscar.
   2) FUZZY: palavra não encontrada → trocada pela mais parecida do vocabulário (Levenshtein).
   Não altera app.js: sobrescreve o campo de busca com a versão canônica. */
(function () {
  "use strict";
  var fold = function (s) { return String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(); };

  /* frase popular (fold) → termo canônico de busca */
  var SIN = [
    ["dor de cabeca", "cefaleia"], ["dor na cabeca", "cefaleia"], ["cabeca doendo", "cefaleia"],
    ["pressao alta", "hipertensao"], ["pressao nas alturas", "hipertensao"], ["pressao descontrolada", "hipertensao"],
    ["dor no peito", "dor toracica"], ["dor no torax", "dor toracica"], ["peito doendo", "dor toracica"],
    ["falta de ar", "dispneia"], ["falta d ar", "dispneia"], ["sem ar", "dispneia"], ["ofegante", "dispneia"],
    ["azia", "dispepsia"], ["queimacao no estomago", "dispepsia"], ["estomago doendo", "dispepsia"], ["gastrite", "dispepsia"],
    ["enjoo", "nauseas"], ["enjoos", "nauseas"], ["vontade de vomitar", "nauseas"], ["nausea", "nauseas"],
    ["catarro", "gripe"], ["gripe forte", "gripe"], ["estado gripal", "gripe"],
    ["dor de garganta", "faringite"], ["garganta doendo", "faringite"], ["garganta inflamada", "faringite"],
    ["coceira no corpo", "urticaria"], ["placas na pele", "urticaria"], ["alergia na pele", "urticaria"],
    ["bicho de pe", "escabiose"], ["sarna", "escabiose"],
    ["tontura", "vertigem"], ["cabeca tonta", "vertigem"],
    ["desmaio", "sincope"], ["desmaiou", "sincope"],
    ["ataque convulsivo", "convulsao"], ["batedeira", "convulsao"], ["convulsionando", "convulsao"],
    ["pedra no rim", "colica renal"], ["dor renal", "colica renal"], ["colica do rim", "colica renal"],
    ["ardencia para urinar", "cistite"], ["queimacao ao urinar", "cistite"], ["dor para urinar", "cistite"], ["urina ardendo", "cistite"],
    ["dor nas costas", "lombalgia"], ["costas doendo", "lombalgia"], ["lombar", "lombalgia"],
    ["torcicolo", "cervicalgia"], ["pescoco doendo", "cervicalgia"],
    ["inchaco nas pernas", "edema"], ["pernas inchadas", "edema"],
    ["mordida de cachorro", "ferimento"], ["mordida de gato", "ferimento"], ["mordido por cachorro", "ferimento"],
    ["cortou", "ferimento"], ["corte fundo", "ferimento"], ["ferida cortante", "ferimento"],
    ["derrame", "avc"], ["entorpecimento de um lado", "avc"],
    ["vomitando sangue", "hemorragia digestiva"], ["sangue no vomito", "hemorragia digestiva"],
    ["chiado no peito", "asma"], ["bubo no peito", "asma"],
    ["diarreia com sangue", "disenteria"],
    ["dor abdominal", "dor abdominal"], ["barriga doendo", "dor abdominal"], ["dor na barriga", "dor abdominal"],
    ["acucar alto", "hiperglicemia"], ["diabetes descompensada", "hiperglicemia"],
    ["delirium tremens", "abstinencia alcoolica"],
    ["caiu da escada", "queda"],
    ["picada de cobra", "peconhento"], ["cobra me mordeu", "peconhento"], ["picada de aranha", "peconhento"], ["picada de escorpiao", "peconhento"]
  ];

  /* ---------- fuzzy (mantido da v1) ---------- */
  var vocab = null;
  function words() {
    if (vocab) return vocab;
    var set = {}, P = (window.PROTO_DB && window.PROTO_DB.protocols) || [];
    P.forEach(function (p) {
      fold(p.n + " " + (p.alias || "") + " " + p.cat).split(/[^a-z0-9]+/).forEach(function (w) { if (w.length >= 3) set[w] = 1; });
    });
    return (vocab = Object.keys(set));
  }
  function lev(a, b) {
    var m = a.length, n = b.length, d = [], i, j;
    for (i = 0; i <= m; i++) d[i] = [i];
    for (j = 1; j <= n; j++) d[0][j] = j;
    for (i = 1; i <= m; i++) for (j = 1; j <= n; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[m][n];
  }
  function fix(tok) {
    var W = words();
    if (tok.length < 4 || W.some(function (w) { return w.indexOf(tok) >= 0; })) return tok;
    var best = tok, bd = tok.length <= 5 ? 1 : 2;
    W.forEach(function (w) {
      if (Math.abs(w.length - tok.length) > 2) return;
      var dd = lev(tok, w);
      if (dd < bd || (dd === bd && best === tok)) { bd = dd; best = w; }
    });
    return best;
  }

  /* ---------- aplicação ---------- */
  var aplicando = 0; // self-healing: expira sozinho, nunca trava
  document.addEventListener("input", function (e) {
    var el = e.target;
    if (!el || el.id !== "homeQ" || aplicando) return;
    var v = fold(el.value);
    if (v.length < 3) return;
    var out = v;
    SIN.forEach(function (par) {
      if (out.indexOf(par[0]) >= 0) out = out.split(par[0]).join(" " + par[1] + " ");
    });
    out = out.split(/(\s+)/).map(function (t) { return /\s/.test(t) || !t ? t : fix(t); }).join("").replace(/\s+/g, " ").trim();
    if (out !== v) {
      aplicando++;
      el.value = out;
      el.dispatchEvent(new Event("input", { bubbles: true }));
      setTimeout(function () { if (aplicando > 0) aplicando--; }, 40);
    }
  }, true);
})();
