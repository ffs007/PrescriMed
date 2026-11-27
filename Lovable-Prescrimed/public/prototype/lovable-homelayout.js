/* Página inicial: filtros principais em uma linha + "Mais filtros ▾".
   Só exibição: os chips continuam sendo os do motor; os excedentes ficam recolhidos.
   Sem loop: só escreve no DOM quando algo muda, e o observador é agendado por quadro. */
(function () {
  "use strict";
  if (window.PSX_HOMELAY) return;
  var MAIN = 8, open = false, scheduled = false;

  function setDisp(el, v) { if (el.style.display !== v) el.style.display = v; }
  function setText(el, t) { if (el.textContent !== t) el.textContent = t; }

  function enhance() {
    var cats = document.querySelector("#app .cats");
    if (!cats) return;
    var chips = Array.prototype.slice.call(cats.querySelectorAll("button.chip:not([data-psx-morebtn])"));
    var btn = cats.querySelector("[data-psx-morebtn]");
    if (chips.length <= MAIN + 1) {
      chips.forEach(function (c) { setDisp(c, ""); });
      if (btn) btn.remove();
      return;
    }
    var activeIdx = chips.findIndex(function (c) { return c.classList.contains("on"); });
    if (activeIdx >= MAIN) open = true;
    chips.forEach(function (c, i) { setDisp(c, (open || i < MAIN) ? "" : "none"); });
    if (!btn) {
      btn = document.createElement("button");
      btn.type = "button";
      btn.className = "chip";
      btn.dataset.psxMorebtn = "1";
      btn.addEventListener("click", function () { open = !open; enhance(); });
      cats.appendChild(btn);
    } else if (btn !== cats.lastElementChild) {
      cats.appendChild(btn);
    }
    setText(btn, open ? "Menos filtros ▴" : "Mais filtros ▾");
    setDisp(btn, "");
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(function () { scheduled = false; enhance(); });
  }

  var root = document.getElementById("app") || document.body;
  new MutationObserver(schedule).observe(root, { childList: true, subtree: true });
  enhance();
  window.PSX_HOMELAY = true;
})();
