/* PrescriMed — Tema oficial (04/11/2026, Dr. Felipe).
   Fonte de verdade visual: landing "/" (clareza, proporção áurea, minimalismo).
   Regras: (1) sempre claro — o modo escuro automático está desativado;
           (2) azul-canônico #005E8A é reservado a CTA/links/foco — nunca a fundos de leitura;
           (3) seleção/estado ativo = tinta (ink) + hairline, não preenchimento azul;
           (4) superfícies brancas, bordas hairline, raio pequeno, sombras quase invisíveis.
   Camada 100% CSS + trava de tema; não altera dados, cálculos nem travas clínicas. */
(function () {
  "use strict";

  /* ---------- trava: sempre claro ---------- */
  function forceLight() { document.documentElement.setAttribute("data-theme", "light"); }
  forceLight();
  setInterval(forceLight, 800);

  var LIGHT = [
    "--bg:#F5F8FF;--surface:#FFFFFF;--soft:#F0F5FF;--line:#C3CCDA;--ink:#12202B;--muted:#47535F",
    "--accent:#005E8A;--accent-ink:#FFFFFF;--accent-soft:#E7EFFC",
    "--ok:#1F8A55;--warn:#B07A1E;--warn-soft:#FBF4E2;--bad:#B32222;--bad-soft:#FDF2F1",
    "--ai:#6C3CB7;--cyan:#1F6FB2;color-scheme:light"
  ].join(";");

  var css = [
    /* paleta oficial — claro travado (inclusive se o SO estiver em dark) */
    ":root,:root[data-theme=light]{" + LIGHT + "}",
    "@media (prefers-color-scheme:dark){:root:not([data-theme=light]),:root[data-theme=dark]{" + LIGHT + "}}",

    /* tipografia editorial (landing) */
    "body{font-size:15px}",
    "h1,h2,h3{letter-spacing:-.015em}",
    ".hero{padding-block:40px 18px}",
    ".hero h1{font-size:clamp(30px,4.6vw,46px);line-height:1.05;letter-spacing:-.02em;max-width:22ch}",
    ".hero p{max-width:55ch}",
    ".wrap{max-width:1440px}",

    /* proporção áurea nas composições de duas colunas */
    ".two{grid-template-columns:minmax(0,1.618fr) minmax(0,1fr)}",
    ".pm-cockpit{gap:20px;padding:20px 24px 96px}",
    ".pm-side-card{border-radius:6px;box-shadow:none}",

    /* cartões e hover: hairline + tinta, sem sombra carregada */
    ".cond:hover,.mod:hover{border-color:var(--ink);box-shadow:none}",
    ".cond,.mod,.box,.sumcard,.pm-side-card{box-shadow:none}",
    ".chip.pos,.chip.norm.on{background:var(--soft);border-color:var(--line);color:var(--ink)}",

    /* badges clínicos: contorno, sem preenchimento */
    ".badge{background:transparent;border:1px solid color-mix(in srgb,currentColor 45%,transparent);color:var(--muted);font-weight:700}",
    ".badge:first-letter{text-transform:uppercase}",
    ".badge.w{color:var(--warn)}",
    ".badge.b{color:var(--bad)}",

    /* linha de posologia: papel branco, hairline — não caixa azul */
    ".line{background:var(--surface);border:1px solid var(--line);color:var(--ink)}",

    /* ícones dos módulos: neutro suave, glifo azul-canônico */
    ".mod .ic{background:var(--soft);color:var(--accent)}",

    /* ---------- modal de medicações: minimalismo ---------- */
    ".rxm-grid{grid-template-columns:minmax(232px,280px) minmax(0,1fr)}",
    ".rxm-search .in{background:var(--surface)}",
    ".rxm-tabs button.on{background:var(--ink);border-color:var(--ink);color:#fff}",
    ".rxm-side .rxm-cat.on,.rxm-side .rxm-cat.on .nm{background:transparent;color:var(--ink);font-weight:700}",
    ".rxm-side .rxm-cat.on{box-shadow:inset 2px 0 0 var(--ink)}",
    ".rxm-side .rxm-cat.on .ct{background:var(--ink);color:#fff}",
    ".rxm-rows>h3{border-top:1px solid var(--line);margin:18px 0 8px!important;padding-top:14px;font:700 12px var(--f-display);letter-spacing:.07em;text-transform:uppercase;color:var(--muted)!important}",
    ".rxm-rows>h3:first-child{border-top:0;margin-top:4px!important;padding-top:0}",
    ".rxm-rows .drow{border-radius:6px;padding:10px 12px;margin-bottom:8px}",
    ".rxm-rows .drow.rxm-on{border-color:var(--ink);box-shadow:none}",
    ".rxm-rows .drow.rxm-act{outline:2px solid color-mix(in srgb,var(--accent) 45%,transparent)}",
    ".rxm-rows .drow .dhead .nm{font-size:15.5px}",
    ".rxm-protlink{background:var(--surface);border:1px dashed var(--line);color:var(--ink);font-weight:600;border-radius:6px}",
    ".rxm-protlink:hover{border-color:var(--ink)}",
    ".rxm-kit{background:var(--surface);border:1px dashed var(--muted)}",
    ".rxm-bar .chipx{background:var(--soft);color:var(--ink);border:1px solid var(--line)}",
    ".rxm-bar .chipx.kit{background:var(--surface);border:1px dashed var(--line)}",
    ".rxm-freq .row.on{background:var(--soft);color:var(--ink)}",
    ".rxm-freq .row.on .cbx{background:var(--ink);border-color:var(--ink);color:#fff}",
    ".rxm-mtabs button.on{background:var(--ink);border-color:var(--ink);color:#fff}",

    /* diálogos: canto contido, backdrop claro */
    "dialog.modal{border-radius:12px;box-shadow:0 24px 64px rgba(16,24,40,.18)}",
    "dialog.modal::backdrop{background:rgba(18,32,43,.32)}"
  ].join("\n");

  var st = document.createElement("style");
  st.id = "psxOfficialTheme";
  st.textContent = css;
  document.head.appendChild(st);
})();
