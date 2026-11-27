/* Higiene de caso (P0 de segurança) — aditivo.
   O chooseProto do artefato troca C.proto sem limpar a receita do paciente
   anterior (rx, ctrl, hospitalar, exames, anamnese, escores…), que então
   aparece prescrita para o próximo paciente. Este hook detecta a TROCA de
   condição e zera os artefatos clínicos em memória (mantém os dados do
   paciente e a preferência "mostrar todas as classes"), persiste e
   re-renderiza a página da nova condição já limpa.
   "Novo atendimento" do app continua zerando tudo inclusive o paciente. */
(function () {
  "use strict";
  var prev = null;
  try { prev = window.PSAPP && window.PSAPP.test && window.PSAPP.test.C ? (window.PSAPP.test.C() || {}).proto : null; } catch (_) {}

  function blank() {
    return {
      hosp: { init: {}, dieta: "", dietaTxt: "", hid: [], sel: {}, cuid: {}, extra: [], obs: "", allCls: false, open: {} },
      rx: { itens: [], duasVias: false, naoUsar: "", visto: "", cuidados: "", alarme: "", retorno: "" },
      ctrl: { itens: [], end: "", cpf: "", semCpf: false },
      lab: { sel: {}, cid: "", desc: "", obs: "" },
      comp: { sel: {}, cid: "", desc: "", obs: "", separar: true },
      anam: { qp: "", tempo: "", chips: {}, fields: {}, ant: {}, meds: "", notas: "", final: "", edited: false },
      ef: { sv: {}, sel: {}, notas: "", final: "", edited: false },
      enc: { esp: "", prio: "Eletiva", motivo: "", pergunta: "", final: "", edited: false },
      transf: { destino: "", recurso: "", regulacao: "", regulador: "", hora: "", transporte: "USA (suporte avançado)", acomp: "", disp: "Acesso venoso periférico", cond: "Estável", final: "", edited: false },
      evol: { final: "", resumo: "" },
    };
  }

  function limpar(C) {
    var b = blank();
    ["hosp", "rx", "ctrl", "lab", "comp", "anam", "ef", "enc", "transf", "evol"].forEach(function (k) { C[k] = JSON.parse(JSON.stringify(b[k])); });
    C.rxSel = {}; C.rxOpen = {}; C.scores = {}; C.docs = [];
    try { window.PSAPP && window.PSAPP.pr && window.PSAPP.pr.setScore && window.PSAPP.pr.setScore("__psx_sync", null); } catch (_) {}
  }

  function tick() {
    try {
      var C = window.PSAPP && window.PSAPP.test && window.PSAPP.test.C();
      if (!C) return;
      if (prev == null) { prev = C.proto; return; }
      if (C.proto === prev) return;
      prev = C.proto;
      limpar(C);
      try { window.PSAPP.pr.choose(C.proto); } catch (_) {} // re-render da condição, já limpa
    } catch (_) {}
  }
  setInterval(tick, 250);
  /* aba em segundo plano tem timers estrangulados: ao voltar ao foco, reconcilia na hora */
  window.addEventListener("focus", tick);
  document.addEventListener("visibilitychange", function () { if (!document.hidden) tick(); });
})();
