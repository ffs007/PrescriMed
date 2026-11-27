/* Suporte à decisão na emergência (aditivo; origem expansao_ia — confira antes de usar):
   escores com preenchimento automático pelos sinais vitais (NEWS2, qSOFA, CURB-65, HEART, TIMI, GRACE simplificado),
   calculadoras (trombolíticos, enoxaparina pela função renal, reposição volêmica, ânion gap, osmolaridade, HAS-BLED,
   sedoanalgesia) e fluxos resumidos. Toda sugestão é revisável; aceitar adiciona às orientações e fica registrado. */
(function () {
  "use strict";
  var VER = "2026.10-1";
  var api = function () { return window.PSAPP && window.PSAPP.test; };
  var Cs = function () { var a = api(); return a && a.C(); };
  var num = function (v) { var n = parseFloat(String(v == null ? "" : v).replace(",", ".")); return isFinite(n) ? n : null; };
  var nf = function (n, d) { return Number(n).toLocaleString("pt-BR", { maximumFractionDigits: d == null ? 1 : d }); };
  function el(tag, a) { var n = document.createElement(tag); a = a || {}; Object.keys(a).forEach(function (k) { var v = a[k]; if (v == null) return; if (k === "text") n.textContent = v; else if (k.slice(0, 2) === "on") n.addEventListener(k.slice(2), v); else n.setAttribute(k, v); }); for (var i = 2; i < arguments.length; i++) [].concat(arguments[i]).forEach(function (c) { if (c != null) n.appendChild(typeof c === "string" ? document.createTextNode(c) : c); }); return n; }
  function pt() { var C = Cs() || { pac: {}, ef: { sv: {} } }, P = window.PSAPP && window.PSAPP.pr, sv = (C.ef && C.ef.sv) || {}, pa = String(sv.pa || "").split(/[x\/]/); return { peso: P && P.peso(), anos: P && P.idadeM() != null ? P.idadeM() / 12 : null, pas: num(pa[0]), fc: num(sv.fc), fr: num(sv.fr), tax: num(sv.tax), spo2: num(sv.spo2), sexo: C.pac.sexo, renal: window.PSX_SAFE ? window.PSX_SAFE.calc() : null }; }
  function accept(txt, tool) { var a = window.PSAPP; if (a && a.addOrient) a.addOrient(txt); if (window.PSX_SAFE) window.PSX_SAFE.log({ tipo: "ajuste_aceito", dominio: "decisao", motivo: tool + ": " + txt, fonte: "Calculadoras PrescriMed v" + VER }); toast("Adicionado às orientações da prescrição."); }
  function toast(t) { var x = el("div", { class: "toast", role: "status", text: t }); document.body.appendChild(x); setTimeout(function () { x.remove(); }, 2600); }

  /* cada ferramenta: campos [id, rótulo, tipo ("n" número | "c" checkbox | [[v,l]] select), autofill], calc(v) -> {r, s (sugestão), cls} */
  var T = [
    { id: "news2", n: "NEWS2", g: "Escores", obj: "Gravidade e deterioração clínica em adultos.", lim: "Não validado em < 16 anos e em gestantes (usar MEOWS).", ref: "Royal College of Physicians 2017",
      f: [["fr", "FR (irpm)", "n", "fr"], ["spo2", "SpO₂ (%)", "n", "spo2"], ["o2", "Em O₂ suplementar", "c"], ["pas", "PAS (mmHg)", "n", "pas"], ["fc", "FC (bpm)", "n", "fc"], ["tax", "Temperatura (°C)", "n", "tax"], ["cons", "Consciência", [["0", "Alerta"], ["3", "Confusão / voz / dor / sem resposta"]]]],
      calc: function (v) { var s = 0, b = function (x, arr) { for (var i = 0; i < arr.length; i++) if (x <= arr[i][0]) return arr[i][1]; return arr[arr.length - 1][1]; };
        if (v.fr == null || v.spo2 == null || v.pas == null || v.fc == null || v.tax == null) return { r: "Preencha FR, SpO₂, PAS, FC e temperatura." };
        s += b(v.fr, [[8, 3], [11, 1], [20, 0], [24, 2], [999, 3]]); s += b(v.spo2, [[91, 3], [93, 2], [95, 1], [100, 0]]); s += v.o2 ? 2 : 0; s += b(v.pas, [[90, 3], [100, 2], [110, 1], [219, 0], [999, 3]]); s += b(v.fc, [[40, 3], [50, 1], [90, 0], [110, 1], [130, 2], [999, 3]]); s += b(v.tax, [[35, 3], [36, 1], [38, 0], [39, 1], [99, 2]]); s += +v.cons || 0;
        var cls = s >= 7 ? "alto" : s >= 5 ? "médio" : "baixo"; return { r: "NEWS2 " + s + " — risco " + cls, s: s >= 7 ? "NEWS2 " + s + ": avaliação médica imediata, monitorização contínua, considerar UTI/regulação." : s >= 5 ? "NEWS2 " + s + ": avaliação médica urgente; sinais vitais de 1/1 h." : "NEWS2 " + s + ": sinais vitais de 4/4 a 12/12 h.", bad: s >= 5 }; } },
    { id: "qsofa", n: "qSOFA", g: "Escores", obj: "Triagem de risco em suspeita de infecção.", lim: "Baixa sensibilidade; não exclui sepse. Use com NEWS2 e lactato.", ref: "Sepsis-3 (JAMA 2016); SSC 2021",
      f: [["fr", "FR (irpm)", "n", "fr"], ["pas", "PAS (mmHg)", "n", "pas"], ["cons", "Alteração do nível de consciência", "c"]],
      calc: function (v) { var s = (v.fr >= 22 ? 1 : 0) + (v.pas != null && v.pas <= 100 ? 1 : 0) + (v.cons ? 1 : 0); return { r: "qSOFA " + s + "/3", s: s >= 2 ? "qSOFA ≥ 2: pacote de sepse da 1ª hora (lactato, hemoculturas, antimicrobiano, 30 mL/kg de cristaloide se hipotensão ou lactato ≥ 4)." : "qSOFA < 2: manter vigilância; reavaliar se piorar.", bad: s >= 2 }; } },
    { id: "curb", n: "CURB-65", g: "Escores", obj: "Gravidade da pneumonia adquirida na comunidade.", lim: "Não considera hipoxemia nem comorbidades.", ref: "BTS; SBPT 2018",
      f: [["c", "Confusão mental", "c"], ["u", "Ureia > 43 mg/dL (> 7 mmol/L)", "c"], ["fr", "FR (irpm)", "n", "fr"], ["pas", "PAS (mmHg)", "n", "pas"], ["pad", "PAD ≤ 60", "c"], ["anos", "Idade", "n", "anos"]],
      calc: function (v) { var s = (v.c ? 1 : 0) + (v.u ? 1 : 0) + (v.fr >= 30 ? 1 : 0) + ((v.pas != null && v.pas < 90) || v.pad ? 1 : 0) + (v.anos >= 65 ? 1 : 0); return { r: "CURB-65 " + s, s: s <= 1 ? "CURB-65 " + s + ": tratamento ambulatorial se sem hipoxemia." : s === 2 ? "CURB-65 2: considerar internação." : "CURB-65 " + s + ": internação; ≥ 4 avaliar UTI.", bad: s >= 2 }; } },
    { id: "heart", n: "HEART", g: "Escores", obj: "Risco de evento cardíaco em dor torácica.", lim: "Não usar em supra de ST ou instabilidade.", ref: "Six et al. 2008; SBC 2021",
      f: [["h", "História", [["0", "Pouco suspeita"], ["1", "Moderadamente"], ["2", "Muito suspeita"]]], ["e", "ECG", [["0", "Normal"], ["1", "Repolarização inespecífica"], ["2", "Infra de ST significativo"]]], ["anos", "Idade", "n", "anos"], ["r", "Fatores de risco", [["0", "Nenhum"], ["1", "1–2"], ["2", "≥ 3 ou aterosclerose"]]], ["t", "Troponina", [["0", "≤ limite"], ["1", "1–3× limite"], ["2", "> 3× limite"]]]],
      calc: function (v) { var a = v.anos == null ? 0 : v.anos >= 65 ? 2 : v.anos >= 45 ? 1 : 0, s = (+v.h || 0) + (+v.e || 0) + a + (+v.r || 0) + (+v.t || 0); return { r: "HEART " + s, s: s <= 3 ? "HEART " + s + " (baixo risco): alta com seguimento, se troponina seriada negativa." : s <= 6 ? "HEART " + s + " (moderado): observação, troponina seriada e estratificação." : "HEART " + s + " (alto): estratégia invasiva precoce, cardiologia.", bad: s >= 4 }; } },
    { id: "timi", n: "TIMI (SCA sem supra)", g: "Escores", obj: "Risco em SCA sem supradesnível de ST.", lim: "Derivado de ensaios clínicos.", ref: "Antman 2000",
      f: [["a", "Idade ≥ 65", "c"], ["b", "≥ 3 fatores de risco", "c"], ["c", "Coronariopatia conhecida (estenose ≥ 50%)", "c"], ["d", "AAS nos últimos 7 dias", "c"], ["e", "≥ 2 episódios de angina em 24 h", "c"], ["f", "Desvio de ST ≥ 0,5 mm", "c"], ["g", "Marcador de necrose positivo", "c"]],
      calc: function (v) { var s = ["a", "b", "c", "d", "e", "f", "g"].filter(function (k) { return v[k]; }).length; return { r: "TIMI " + s + "/7", s: s >= 3 ? "TIMI " + s + ": risco intermediário/alto — anticoagulação e estratificação invasiva." : "TIMI " + s + ": baixo risco.", bad: s >= 3 }; } },
    { id: "hasbled", n: "HAS-BLED", g: "Escores", obj: "Risco de sangramento em anticoagulação.", lim: "Não contraindica a anticoagulação; aponta fatores corrigíveis.", ref: "Pisters 2010; ESC 2024",
      f: [["h", "Hipertensão (PAS > 160)", "c"], ["a", "Disfunção renal ou hepática (1 cada)", [["0", "Nenhuma"], ["1", "Uma"], ["2", "Ambas"]]], ["s", "AVC prévio", "c"], ["b", "Sangramento prévio", "c"], ["l", "INR lábil", "c"], ["e", "Idade > 65", "c"], ["d", "Drogas (AAS/AINE) ou álcool (1 cada)", [["0", "Nenhum"], ["1", "Um"], ["2", "Ambos"]]]],
      calc: function (v) { var s = (v.h ? 1 : 0) + (+v.a || 0) + (v.s ? 1 : 0) + (v.b ? 1 : 0) + (v.l ? 1 : 0) + (v.e ? 1 : 0) + (+v.d || 0); return { r: "HAS-BLED " + s, s: s >= 3 ? "HAS-BLED " + s + ": alto risco de sangramento — corrigir fatores e reavaliar com frequência." : "HAS-BLED " + s + ": risco baixo/moderado.", bad: s >= 3 }; } },
    { id: "alteplase", n: "Alteplase no AVC isquêmico", g: "Calculadoras", obj: "Dose de trombolítico pelo peso.", lim: "Só após TC sem sangramento, até 4,5 h e checklist de contraindicações completo.", ref: "AHA/ASA 2019; MS — Linha de cuidado do AVC",
      f: [["peso", "Peso (kg)", "n", "peso"]],
      calc: function (v) { if (!v.peso) return { r: "Informe o peso." }; var t = Math.min(0.9 * v.peso, 90), b = t * 0.1; return { r: "Alteplase " + nf(t) + " mg (0,9 mg/kg, máx. 90 mg)", s: "Alteplase " + nf(t) + " mg EV: " + nf(b) + " mg em bólus em 1 min e " + nf(t - b) + " mg em 60 min. PA < 185/110 antes e < 180/105 por 24 h." }; } },
    { id: "tnk", n: "Tenecteplase no IAM com supra", g: "Calculadoras", obj: "Dose por faixa de peso.", lim: "Até 12 h do início; ≥ 75 anos usar meia dose.", ref: "ESC 2023; SBC",
      f: [["peso", "Peso (kg)", "n", "peso"], ["anos", "Idade", "n", "anos"]],
      calc: function (v) { if (!v.peso) return { r: "Informe o peso." }; var d = v.peso < 60 ? 30 : v.peso < 70 ? 35 : v.peso < 80 ? 40 : v.peso < 90 ? 45 : 50; if (v.anos >= 75) d = d / 2; return { r: "Tenecteplase " + nf(d) + " mg" + (v.anos >= 75 ? " (meia dose ≥ 75 anos)" : ""), s: "Tenecteplase " + nf(d) + " mg EV em bólus único (5–10 s). Associar AAS, clopidogrel e anticoagulação." }; } },
    { id: "enox", n: "Enoxaparina pela função renal", g: "Calculadoras", obj: "Dose terapêutica ou profilática ajustada ao ClCr.", lim: "Peso > 150 kg ou < 40 kg: considerar anti-Xa.", ref: "Bula ANVISA; ACCP",
      f: [["peso", "Peso (kg)", "n", "peso"], ["uso", "Indicação", [["t", "Tratamento"], ["p", "Profilaxia"]]]],
      calc: function (v) { var r = pt().renal; if (!v.peso) return { r: "Informe o peso." }; var cl = r && r.clcr; var low = cl != null && cl < 30; var d = v.uso === "p" ? (low ? "20 mg SC 1×/dia" : "40 mg SC 1×/dia") : (low ? nf(v.peso, 0) + " mg SC 1×/dia (1 mg/kg a cada 24 h)" : nf(v.peso, 0) + " mg SC de 12/12 h (1 mg/kg)"); return { r: "Enoxaparina " + d + (cl == null ? " · sem ClCr: informe a creatinina" : " · ClCr " + nf(cl, 0)), s: "Enoxaparina " + d + (cl != null ? " (ClCr " + nf(cl, 0) + " mL/min)." : "."), bad: cl != null && cl < 15 }; } },
    { id: "volume", n: "Reposição volêmica", g: "Calculadoras", obj: "Volume inicial de cristaloide.", lim: "Reavaliar a cada bólus; cautela em IC, DRC e idosos.", ref: "SSC 2021; MS dengue 2024; Holliday-Segar",
      f: [["peso", "Peso (kg)", "n", "peso"], ["ctx", "Contexto", [["sepse", "Sepse / hipoperfusão (30 mL/kg)"], ["dengue", "Dengue grupo C (10 mL/kg em 1 h)"], ["manut", "Manutenção (Holliday-Segar)"]]]],
      calc: function (v) { if (!v.peso) return { r: "Informe o peso." }; var w = v.peso, t;
        if (v.ctx === "dengue") t = "SF 0,9% " + nf(10 * w, 0) + " mL em 1 h; reavaliar e repetir até 3 vezes.";
        else if (v.ctx === "manut") { var ml = w <= 10 ? 100 * w : w <= 20 ? 1000 + 50 * (w - 10) : 1500 + 20 * (w - 20); t = "Manutenção " + nf(ml, 0) + " mL/24 h (" + nf(ml / 24, 0) + " mL/h)."; }
        else t = "Cristaloide " + nf(30 * w, 0) + " mL nas primeiras 3 h, em bólus de 500 mL com reavaliação.";
        return { r: t, s: t }; } },
    { id: "ag", n: "Ânion gap", g: "Calculadoras", obj: "Investigar acidose metabólica.", lim: "Hipoalbuminemia reduz o AG; usar o valor corrigido.", ref: "Kraut & Madias 2007",
      f: [["na", "Na (mEq/L)", "n"], ["cl", "Cl (mEq/L)", "n"], ["hco3", "HCO₃ (mEq/L)", "n"], ["alb", "Albumina (g/dL, opcional)", "n"]],
      calc: function (v) { if (v.na == null || v.cl == null || v.hco3 == null) return { r: "Preencha Na, Cl e HCO₃." }; var ag = v.na - v.cl - v.hco3, c = v.alb != null ? ag + 2.5 * (4 - v.alb) : null; return { r: "AG " + nf(ag) + (c != null ? " · corrigido " + nf(c) : "") + " mEq/L", s: (c != null ? c : ag) > 12 ? "Ânion gap elevado: pesquisar lactato, cetonas, função renal e intoxicações." : "Ânion gap normal.", bad: (c != null ? c : ag) > 12 }; } },
    { id: "osm", n: "Osmolaridade sérica", g: "Calculadoras", obj: "Osmolaridade calculada e gap osmolar.", lim: "Gap > 10 sugere álcoois tóxicos.", ref: "Fórmula 2Na + glicose/18 + ureia/6",
      f: [["na", "Na (mEq/L)", "n"], ["gl", "Glicose (mg/dL)", "n"], ["ur", "Ureia (mg/dL)", "n"], ["med", "Osmolalidade medida (opcional)", "n"]],
      calc: function (v) { if (v.na == null || v.gl == null || v.ur == null) return { r: "Preencha Na, glicose e ureia." }; var o = 2 * v.na + v.gl / 18 + v.ur / 6; return { r: "Osm calculada " + nf(o, 0) + " mOsm/L" + (v.med != null ? " · gap " + nf(v.med - o, 0) : ""), s: o > 320 ? "Osmolaridade > 320: considerar estado hiperosmolar." : "Osmolaridade " + nf(o, 0) + " mOsm/L.", bad: o > 320 || (v.med != null && v.med - o > 10) }; } },
    { id: "sedo", n: "Sedoanalgesia contínua", g: "Calculadoras", obj: "Faixas de infusão por peso.", lim: "Titular por escala (RASS / CPOT); reduzir em idosos, choque e insuficiência hepática ou renal.", ref: "SCCM PADIS 2018",
      f: [["peso", "Peso (kg)", "n", "peso"]],
      calc: function (v) { if (!v.peso) return { r: "Informe o peso." }; var w = v.peso; var t = "Fentanil 1–2 mcg/kg/h = " + nf(w) + "–" + nf(2 * w) + " mcg/h · Midazolam 0,02–0,1 mg/kg/h = " + nf(0.02 * w) + "–" + nf(0.1 * w) + " mg/h · Propofol 5–50 mcg/kg/min = " + nf(0.3 * w) + "–" + nf(3 * w) + " mg/h."; return { r: t, s: t + " Meta RASS 0 a −2." }; } }
  ];
  var FLOWS = [
    ["Síndrome coronariana aguda", "ECG em 10 min → supra de ST: reperfusão (angioplastia em até 120 min ou trombólise em 30 min) · sem supra: troponina seriada, HEART/TIMI, AAS 300 mg mastigado, anticoagulação se alto risco."],
    ["AVC", "Glicemia → NIHSS → TC sem contraste → janela até 4,5 h e sem contraindicações: alteplase/tenecteplase · oclusão de grande vaso: trombectomia (regulação) · PA alvo conforme a conduta."],
    ["Sepse", "Lactato → hemoculturas → antimicrobiano na 1ª hora → 30 mL/kg de cristaloide se hipotensão ou lactato ≥ 4 → noradrenalina para PAM ≥ 65 → reavaliar lactato."],
    ["Choque", "Classificar (hipovolêmico, distributivo, cardiogênico, obstrutivo) com POCUS → volume conforme resposta → vasopressor → tratar a causa."],
    ["Anafilaxia", "Adrenalina IM 0,01 mg/kg (máx. 0,5 mg) na coxa, repetir a cada 5–15 min → O₂, decúbito, volume → anti-H1 e corticoide são adjuvantes → observar 6–24 h."],
    ["Crise hipertensiva", "Lesão de órgão-alvo? sim = emergência: anti-hipertensivo EV, reduzir até 25% na 1ª hora · não = urgência: anti-hipertensivo oral e seguimento."],
    ["Insuficiência respiratória", "SpO₂ alvo 92–96% (88–92% na DPOC) → O₂ escalonado → VNI na DPOC ou EAP → IOT se falha, rebaixamento ou fadiga."],
    ["Trauma", "xABCDE: hemorragia exsanguinante → via aérea com coluna → ventilação → circulação (ácido tranexâmico até 3 h) → neurológico → exposição."],
    ["Taquiarritmias", "Instável: cardioversão sincronizada · estável QRS estreito regular: manobra vagal → adenosina · QRS largo: amiodarona ou cardioversão eletiva."]
  ];

  function open() {
    var dlg = document.getElementById("psxDecDlg");
    if (!dlg) { dlg = el("dialog", { class: "modal", id: "psxDecDlg" }, el("div", { class: "mhead" }, el("div", null, el("h2", { text: "Calculadoras e fluxos" }), el("small", { text: "apoio à decisão · v" + VER + " · confira antes de usar" })), el("button", { class: "x", type: "button", "aria-label": "Fechar", text: "×", onclick: function () { dlg.close(); } })), el("div", { class: "mbody" }), el("div", { class: "mfoot" })); document.body.appendChild(dlg); }
    var b = dlg.querySelector(".mbody"); b.textContent = ""; var P = pt();
    ["Escores", "Calculadoras"].forEach(function (g) {
      b.appendChild(el("h3", { text: g, style: "margin:10px 0 6px" }));
      T.filter(function (x) { return x.g === g; }).forEach(function (t) {
        var v = {}, out = el("div"), card = el("details", { class: "box", style: "margin-bottom:8px" }, el("summary", null, el("b", { text: t.n }), el("small", { text: " — " + t.obj })));
        var form = el("div", { style: "display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:8px" });
        t.f.forEach(function (f) {
          var inp; if (f[2] === "c") { inp = el("input", { type: "checkbox" }); inp.addEventListener("change", function () { v[f[0]] = inp.checked; run(); }); form.appendChild(el("label", { class: "check" }, inp, document.createTextNode(f[1]))); return; }
          if (Array.isArray(f[2])) { inp = el("select", { class: "sel" }, f[2].map(function (o) { return el("option", { value: o[0], text: o[1] }); })); v[f[0]] = f[2][0][0]; inp.addEventListener("change", function () { v[f[0]] = inp.value; run(); }); }
          else { var auto = f[3] ? P[f[3]] : null; inp = el("input", { class: "in mono", inputmode: "decimal", value: auto != null ? String(Math.round(auto * 10) / 10).replace(".", ",") : "" }); v[f[0]] = auto; inp.addEventListener("input", function () { v[f[0]] = num(inp.value); run(); }); }
          form.appendChild(el("label", { class: "f" }, el("span", { text: f[1] + (f[3] && P[f[3]] != null ? " · do prontuário" : "") }), inp));
        });
        function run() { out.textContent = ""; var r = t.calc(v); out.appendChild(el("div", { class: "alertbox" + (r.bad ? " bad" : "") }, el("b", { text: r.r }))); if (r.s) out.appendChild(el("div", { class: "btns" }, el("span", { class: "det", text: "Sugestão: " + r.s }), el("button", { class: "btn sm", type: "button", text: "Aceitar na prescrição", onclick: function () { accept(r.s, t.n); } }))); }
        card.append(form, out, el("div", { class: "det", text: "Objetivo: " + t.obj + " Limitações: " + t.lim + " Referência: " + t.ref + "." }));
        b.appendChild(card); run();
      });
    });
    b.appendChild(el("h3", { text: "Fluxos resumidos", style: "margin:10px 0 6px" }));
    FLOWS.forEach(function (f) { b.appendChild(el("details", { class: "box", style: "margin-bottom:8px" }, el("summary", null, el("b", { text: f[0] })), el("div", { text: f[1] }), el("div", { class: "det", text: "Resumo de apoio — siga o protocolo institucional." }))); });
    if (!dlg.open) dlg.showModal();
  }
  function homeBtn() {
    var hero = document.querySelector("#app .hero"); if (!hero || !document.getElementById("homeQ") || hero.querySelector("[data-psx-dec]")) return;
    (hero.querySelector("[data-psx-home]") || hero).appendChild(el("button", { class: "btn", type: "button", "data-psx-dec": "1", text: "Calculadoras e fluxos", onclick: open }));
  }
  var t = null; new MutationObserver(function () { if (t) return; t = setTimeout(function () { t = null; homeBtn(); }, 150); }).observe(document.body, { childList: true, subtree: true });
  homeBtn();
  window.PSX_DECISION = { open: open, tools: T, version: VER };
})();
