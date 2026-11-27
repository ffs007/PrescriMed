/* Polimento de layout — aditivo (não toca no artefato).
   Fix 1: .rxm-bar tinha bottom:57px fixo (rodapé antigo). Com o checkbox
   "Revisei este documento" o #mFoot ficou mais alto e a barra colidia
   com os botões. Agora a barra acompanha a altura REAL do rodapé de cada modal. */
(function () {
  "use strict";
  /* invasão: dialog.modal não é posicionado → .rxm-bar absoluta ancorava no viewport;
     e o backdrop não escurecia a home, deixando a lista de condições "entrar" no modal. */
  try {
    document.head.appendChild(document.createElement("style")).textContent =
      "dialog.modal{position:relative}" +
      "dialog.modal::backdrop{background:rgba(15,26,38,.62);backdrop-filter:blur(2px)}";
  } catch (_) {}
  var ro = null;
  try { ro = new ResizeObserver(function () { sync(); }); } catch (_) {}

  function sync() {
    document.querySelectorAll("dialog.modal").forEach(function (m) {
      if (!m.open) return;
      var bar = m.querySelector(".rxm-bar");
      var foot = m.querySelector(".mfoot");
      if (bar && foot) {
        var h = foot.offsetHeight;
        if (bar.style.bottom !== h + "px") bar.style.bottom = h + "px";
        if (ro) { try { ro.observe(foot); } catch (_) {} }
      }
    });
  }

  var mo = new MutationObserver(function () { requestAnimationFrame(sync); });
  try { mo.observe(document.documentElement, { subtree: true, childList: true, attributes: true, attributeFilter: ["open", "class", "style"] }); } catch (_) {}
  window.addEventListener("resize", sync);
  setInterval(sync, 700); // cinto de segurança (modal reaberto, resize não notificado etc.)
  sync();
})();
