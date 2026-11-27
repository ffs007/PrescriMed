/* Condições/receitas personalizadas do médico (localStorage psx.custom, espelhado na conta) e o
   "Receituário em branco". Carregado antes de app.js: só acrescenta itens ao PROTO_DB no formato original. */
(function () {
  "use strict";
  var D = window.PROTO_DB, CL = window.CLIN, HD = window.HOSP_DB, SC = window.SCORES; if (!D) return;
  var data; try { data = JSON.parse(localStorage.getItem("psx.custom") || "null") || {}; } catch (_) { data = {}; }
  var conds = Array.isArray(data.conds) ? data.conds : [];

  // Deduplicação: condições da base anterior com o mesmo nome de outra são fundidas (o original do protótipo prevalece).
  (function () {
    var norm = function (s) { return String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim(); };
    var uniq = function (a, b, key) { var out = (a || []).slice(), seen = {}; out.forEach(function (x) { seen[key(x)] = 1; }); (b || []).forEach(function (x) { if (!seen[key(x)]) { seen[key(x)] = 1; out.push(x); } }); return out; };
    var id = function (x) { return Array.isArray(x) ? x[0] : x; };
    var byName = {}, keep = [];
    D.protocols.forEach(function (p) {
      var k = norm(p.n), cur = byName[k];
      if (!cur) { byName[k] = p; keep.push(p); return; }
      var legP = /^leg_/.test(p.id || ""), legC = /^leg_/.test(cur.id || "");
      if (!legP && !legC) { keep.push(p); return; }
      var main = legC && !legP ? p : cur, extra = main === p ? cur : p;
      ["cid", "cls", "lab", "comp"].forEach(function (f) { main[f] = uniq(main[f], extra[f], id); });
      if (!main.alerta && extra.alerta) main.alerta = extra.alerta;
      if (main === p) { keep[keep.indexOf(cur)] = p; byName[k] = p; }
    });
    D.protocols.length = 0; keep.forEach(function (p) { D.protocols.push(p); });
  })();

  D.protocols.push({ id: "__branco", n: "Receituário em branco", cat: "Geral", alias: "receita branco livre vazio receituario em branco", cid: [], cls: [], lab: [], comp: [], origem: "lovable" });

  function aliasMaps(id, base) {
    if (!base) return;
    [CL, HD].forEach(function (root) {
      if (!root) return;
      Object.keys(root).forEach(function (k) { var m = root[k]; if (m && typeof m === "object" && !Array.isArray(m) && Object.prototype.hasOwnProperty.call(m, base) && !Object.prototype.hasOwnProperty.call(m, id)) m[id] = m[base]; });
    });
    if (SC && SC.SUG && SC.SUG[base] && !SC.SUG[id]) SC.SUG[id] = SC.SUG[base];
  }

  conds.forEach(function (c) {
    if (!c || !c.id || !c.n) return;
    var base = c.base ? D.protocols.find(function (p) { return p.id === c.base; }) : null;
    var cls = [];
    var drugs = (c.drugs || []).filter(function (id) { return !!D.drugs[id]; });
    if (drugs.length) { D.classes["usr_" + c.id] = { n: "Minha seleção — " + c.n, d: drugs }; cls.push("usr_" + c.id); }
    (c.cls && c.cls.length ? c.cls : base ? base.cls || [] : []).forEach(function (k) { if (D.classes[k] && cls.indexOf(k) < 0) cls.push(k); });
    var p = {
      id: c.id, n: c.n, cat: "Minhas condições", origem: "personalizado",
      alias: [c.alias, base ? base.alias : "", base ? base.n : ""].filter(Boolean).join(" "),
      cid: c.cid && c.cid.length ? c.cid : base ? base.cid || [] : [],
      cls: cls,
      lab: c.lab && c.lab.length ? c.lab : base ? (base.lab || []).slice() : [],
      comp: c.comp && c.comp.length ? c.comp : base ? (base.comp || []).slice() : [],
      naoUsar: c.naoUsar || (base && base.naoUsar) || "",
      alerta: c.alerta || (base && base.alerta) || "",
      custom: { cuidados: c.cuidados || "", alarme: c.alarme || "", retorno: c.retorno || "", visto: c.visto || "" }
    };
    D.protocols.push(p);
    aliasMaps(c.id, c.base);
  });
})();
