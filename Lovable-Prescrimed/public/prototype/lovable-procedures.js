/* Procedimentos curados no Box de Emergência (aditivo).
   Substitui, na aba "Procedimentos", a lista legada (8 itens) pelos 24
   procedimentos do default-workspace (curadoria Dr. Felipe) — os 8 legados
   estão contidos nos 24 (dedupe por cobertura). Só age quando a aba abre. */
(function () {
  "use strict";
  function el(tag, a) { var e = document.createElement(tag); a = a || {}; Object.keys(a).forEach(function (k) { var v = a[k]; if (v == null) return; if (k === "text") e.textContent = v; else if (k.slice(0, 2) === "on") e.addEventListener(k.slice(2), v); else e.setAttribute(k, v); }); for (var i = 2; i < arguments.length; i++) [].concat(arguments[i]).forEach(function (c) { if (c != null) e.append(c); }); return e; }

  function renderCurado() {
    var P = window.PSX_PROCEDURES || [];
    if (!P.length) return null;
    var cats = [];
    P.forEach(function (p) { var c = cats.find(function (x) { return x.n === p.cat; }); if (!c) { c = { n: p.cat, itens: [] }; cats.push(c); } c.itens.push(p); });
    var wrap = el("div", { class: "cd" }, el("h3", { text: "Procedimentos — passo a passo (curadoria)" }));
    cats.forEach(function (c) {
      var det = el("details", { open: "open" }, el("summary", { text: c.n + " (" + c.itens.length + ")" }));
      c.itens.forEach(function (p) {
        var tags = [];
        if (p.urg === "emergencia") tags.push("EMERGÊNCIA");
        if (p.tempo) tags.push("~" + p.tempo + " min");
        if (p.dif) tags.push("dificuldade " + p.dif + "/5");
        var inner = el("div", { style: "margin:8px 0 4px;padding-left:14px;border-left:2px solid var(--line)" });
        inner.appendChild(el("strong", { text: p.n }));
        if (tags.length) inner.appendChild(el("div", { class: "disc", text: tags.join(" · ") }));
        p.secoes.forEach(function (s) {
          inner.appendChild(el("div", { class: "disc", style: "margin-top:6px;font-weight:700", text: s[0] }));
          var ol = el("ol", { style: "margin:2px 0;padding-left:18px" });
          s[1].forEach(function (t) { ol.appendChild(el("li", { text: String(t).replace(/^\d+[.)]\s*/, "") })); });
          inner.appendChild(ol);
        });
        if (p.sus) {
          inner.appendChild(el("div", { style: "margin-top:8px;padding:8px 10px;border:1px solid var(--warn);border-radius:8px;background:color-mix(in srgb,var(--warn) 10%,var(--surface))" }, [
            el("b", { style: "color:var(--warn);font-size:12px;text-transform:uppercase;letter-spacing:.05em", text: "E no SUS?" }),
            el("div", { style: "font-size:13.5px;margin-top:4px", text: p.sus }),
            el("div", { class: "disc", style: "margin-top:4px", text: "Sugestão prática — adapte ao protocolo e à disponibilidade real do seu serviço." }),
          ]));
        }
        if (p.rel && p.rel.length) inner.appendChild(el("div", { class: "disc", text: "Síndromes relacionadas: " + p.rel.join(", ") }));
        det.appendChild(inner);
      });
      wrap.appendChild(det);
    });
    wrap.appendChild(el("p", { class: "disc", text: "Fonte: curadoria Dr. Felipe (default-workspace · BOX-01 a BOX-24). Confira disponibilidade de material e protocolo da instituição. Ilustrações e vídeos: fase posterior do roadmap." }));
    return wrap;
  }

  var done = false;
  function sweep() {
    var box = document.getElementById("psxB-box");
    if (!box) { done = false; return; }
    var alvo = Array.prototype.find.call(box.querySelectorAll(".cd h3"), function (h) { return /Procedimentos — passo a passo/.test(h.textContent); });
    if (!alvo) return;
    var sec = alvo.closest(".cd");
    if (sec && sec.dataset.cur) return;
    var novo = renderCurado();
    if (!novo || !sec) return;
    novo.dataset.cur = "1";
    sec.replaceWith(novo);
    done = true;
  }
  new MutationObserver(function () { try { sweep(); } catch (_) {} }).observe(document.body, { childList: true, subtree: true });
  sweep();
})();
