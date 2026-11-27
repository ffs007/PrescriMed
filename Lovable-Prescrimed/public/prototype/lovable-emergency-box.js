/* Módulo de Emergência e Cuidados Críticos (aditivo; origem expansao_ia — confira doses antes de usar).
   1) Painel PCR: ciclo de RCP 2 min, epinefrina 3–5 min, amiodarona 300/150 (máx 450), checagem de ritmo,
      metrônomo Web Audio 100–120 bpm com pulso visual e vibração, 5Hs/5Ts, guias por ritmo, eventos e relatório.
   2) Box de Emergência: infusões bidirecionais, intoxicações/antídotos, ventilação, SIR, paliativos,
      gasometria e procedimentos. Registros vão a safety_events via PSX_SAFE.log (tipo registro_pcr / registro_calculo). */
(function () {
  "use strict";
  var T = window.PSAPP && window.PSAPP.test;
  function el(tag, a) { var e = document.createElement(tag); a = a || {}; Object.keys(a).forEach(function (k) { var v = a[k]; if (v == null) return; if (k === "text") e.textContent = v; else if (k === "html") e.innerHTML = v; else if (k.slice(0, 2) === "on") e.addEventListener(k.slice(2), v); else e.setAttribute(k, v); }); for (var i = 2; i < arguments.length; i++) [].concat(arguments[i]).forEach(function (c) { if (c != null) e.append(c); }); return e; }
  var num = function (v) { var n = parseFloat(String(v == null ? "" : v).replace(",", ".")); return isFinite(n) ? n : null; };
  var nf = function (n, d) { return n == null || !isFinite(n) ? "—" : Number(n).toLocaleString("pt-BR", { maximumFractionDigits: d == null ? 1 : d }); };
  var fold = function (s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); };
  var toast = function (m) { var t = el("div", { class: "psxB-toast", role: "status", text: m }); document.body.appendChild(t); setTimeout(function () { t.remove(); }, 3000); };
  var log = function (o) { try { window.PSX_SAFE && window.PSX_SAFE.log(Object.assign({ dominio: "emergencia", fonte: "box_emergencia" }, o)); } catch (_) {} };
  function peso() { try { var p = window.PSAPP.pr && window.PSAPP.pr.peso ? window.PSAPP.pr.peso() : null; if (p) return p; var e = JSON.parse(localStorage.getItem("psx.emerg.pac") || "null"); return e && num(e.peso); } catch (_) { return null; } }
  var hhmm = function (t) { return new Date(t).toLocaleTimeString("pt-BR"); };
  var mmss = function (s) { s = Math.max(0, Math.round(s)); return String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0"); };

  document.head.appendChild(el("style", { text:
    ".psxB{position:fixed;inset:0;z-index:60;background:var(--bg);color:var(--ink);display:flex;flex-direction:column;overflow:auto}" +
    ".psxB>header{display:flex;gap:8px;align-items:center;padding:10px 14px;border-bottom:1px solid var(--line);background:var(--surface);flex-wrap:wrap;position:sticky;top:0;z-index:2}" +
    ".psxB main{padding:14px;max-width:1200px;width:100%;margin:0 auto;display:grid;gap:12px}" +
    ".psxB .cd{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:14px}" +
    ".psxB h3{margin:0 0 8px;font-size:13px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted)}" +
    ".psxB .big{font:800 54px/1 'IBM Plex Mono',ui-monospace,monospace}.psxB .mid{font:700 28px/1.1 'IBM Plex Mono',ui-monospace,monospace}" +
    ".psxB .g3{display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(260px,1fr))}" +
    ".psxB .fg{display:grid;gap:8px;grid-template-columns:repeat(auto-fit,minmax(130px,1fr))}" +
    ".psxB label{display:flex;flex-direction:column;font-size:12px;color:var(--muted);gap:2px}" +
    ".psxB input,.psxB select{font-size:15px;padding:7px;border:1px solid var(--line);border-radius:8px;background:var(--bg);color:var(--ink)}" +
    ".psxB .res{margin-top:8px;padding:10px;border-radius:10px;background:var(--accent-soft);font-size:15px}" +
    ".psxB .alert{background:color-mix(in srgb,var(--bad) 14%,transparent);color:var(--bad);font-weight:700;padding:8px;border-radius:8px;margin-top:6px}" +
    ".psxB .ok{color:var(--ok);font-weight:700}.psxB .warn{color:var(--warn);font-weight:700}" +
    ".psxB table{border-collapse:collapse;width:100%;font-size:14px}.psxB td,.psxB th{border-bottom:1px solid var(--line);padding:6px;text-align:left;vertical-align:top}" +
    ".psxB .tabs{display:flex;gap:6px;flex-wrap:wrap}.psxB .tabs button[aria-selected=true]{background:var(--accent);color:var(--accent-ink);border-color:var(--accent)}" +
    ".psxB ul{margin:4px 0;padding-left:18px}.psxB li{margin:2px 0}" +
    ".psxB .beat{width:64px;height:64px;border-radius:50%;background:var(--bad);opacity:.2;transition:opacity .06s}.psxB .beat.on{opacity:1}" +
    ".psxB .flash{animation:psxBf 1s 3}@keyframes psxBf{50%{background:color-mix(in srgb,var(--bad) 30%,var(--surface))}}" +
    ".psxB details{border:1px solid var(--line);border-radius:10px;padding:8px 10px;margin:6px 0;background:var(--surface)}.psxB summary{cursor:pointer;font-weight:700}" +
    ".psxB-toast{position:fixed;bottom:60px;left:50%;transform:translateX(-50%);z-index:10001;background:var(--ink);color:var(--bg);padding:10px 14px;border-radius:10px}" +
    "#psxB-pcrbtn{background:var(--bad);color:#fff;border-color:var(--bad);font-weight:800}" +
    ".psxB .disc{font-size:12px;color:var(--muted)}"
  }));

  function shell(id, title, extra) {
    var r = el("div", { class: "psxB", id: id, role: "dialog", "aria-label": title });
    r.appendChild(el("header", {}, el("strong", { text: title }), extra || null, el("span", { style: "flex:1" }),
      el("button", { class: "btn sm", type: "button", text: "Fechar (Esc)", onclick: function () { r.dispatchEvent(new Event("close")); r.remove(); } })));
    var m = el("main"); r.appendChild(m); document.body.appendChild(r);
    return { root: r, main: m };
  }
  document.addEventListener("keydown", function (e) { if (e.key !== "Escape") return; var o = document.querySelectorAll(".psxB"); if (o.length && !document.querySelector("dialog[open]")) { var l = o[o.length - 1]; l.dispatchEvent(new Event("close")); l.remove(); } });

  /* ================= ÁUDIO ================= */
  var ac = null;
  function beep(f, d, vol) { try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); var o = ac.createOscillator(), g = ac.createGain(); o.frequency.value = f; g.gain.value = vol == null ? 0.3 : vol; o.connect(g); g.connect(ac.destination); o.start(); o.stop(ac.currentTime + (d || 0.08)); } catch (_) {} }
  function alarm() { beep(880, 0.2, 0.5); setTimeout(function () { beep(660, 0.2, 0.5); }, 250); setTimeout(function () { beep(880, 0.3, 0.5); }, 500); if (navigator.vibrate) navigator.vibrate([200, 100, 200]); }

  /* ================= PCR ================= */
  var PCR_KEY = "psx.pcr";
  function pcrOpen() {
    if (document.getElementById("psxB-pcr")) return;
    var S = JSON.parse(localStorage.getItem(PCR_KEY) || "null") || { t0: Date.now(), cyc0: Date.now(), ciclos: 0, paused: 0, pausedAt: 0, epi: [], amio: [], ev: [], ritmo: "", hts: {} };
    var save = function () { localStorage.setItem(PCR_KEY, JSON.stringify(S)); };
    var now = function () { return S.pausedAt || Date.now(); };
    var ev = function (t) { S.ev.push({ t: Date.now(), d: t }); save(); drawLog(); };
    var sh = shell("psxB-pcr", "❤ PCR — Suporte avançado (ACLS/AHA 2020)"), m = sh.main;
    var cyc = el("div", { class: "big", text: "02:00" }), tot = el("div", { class: "mid" }), ncy = el("div"), rit = el("div", { class: "note" });
    var bPause = el("button", { class: "btn", type: "button", text: "Pausar" });
    bPause.onclick = function () { if (S.pausedAt) { var d = Date.now() - S.pausedAt; S.paused += d; S.cyc0 += d; S.pausedAt = 0; } else S.pausedAt = Date.now(); save(); bPause.textContent = S.pausedAt ? "Retomar" : "Pausar"; };
    var main1 = el("section", { class: "cd", id: "psxB-cyc" }, el("h3", { text: "Ciclo de RCP (2 min)" }), cyc, el("div", {}, "Tempo total de PCR: ", tot), ncy, rit,
      el("div", { class: "btns", style: "margin-top:8px" }, bPause,
        el("button", { class: "btn", type: "button", text: "Novo ciclo agora", onclick: function () { S.ciclos++; S.cyc0 = Date.now(); ev("Ciclo " + S.ciclos + " concluído (manual)"); } }),
        el("button", { class: "btn ghost", type: "button", text: "Reiniciar PCR", onclick: function () { if (confirm("Apagar este registro de PCR e começar outro?")) { localStorage.removeItem(PCR_KEY); sh.root.remove(); stopMet(); pcrOpen(); } } })));
    // epinefrina
    var epiT = el("div", { class: "mid" }), epiN = el("div");
    var epi = el("section", { class: "cd" }, el("h3", { text: "Epinefrina 1 mg IV/IO a cada 3–5 min" }), epiT, epiN,
      el("button", { class: "btn primary", type: "button", style: "margin-top:8px", text: "✓ Aplicar epinefrina 1 mg", onclick: function () { S.epi.push(Date.now()); S.epiWarn = 0; ev("Epinefrina 1 mg IV/IO (dose " + S.epi.length + ")"); } }),
      el("p", { class: "disc", text: "Pediatria: 0,01 mg/kg (0,1 mL/kg da 1:10.000), máx. 1 mg." }));
    // amiodarona
    var amN = el("div", { class: "mid" }), amB = el("button", { class: "btn primary", type: "button" });
    amB.onclick = function () { var tot = S.amio.reduce(function (a, x) { return a + x.mg; }, 0); if (tot >= 450) return; var mg = S.amio.length ? 150 : 300; S.amio.push({ t: Date.now(), mg: mg }); ev("Amiodarona " + mg + " mg IV bolus"); drawAmio(); };
    var am = el("section", { class: "cd" }, el("h3", { text: "Amiodarona (ritmos chocáveis refratários)" }), amN, amB, el("div", { id: "psxB-amlog", class: "note" }),
      el("p", { class: "disc", text: "Alternativa: lidocaína 1–1,5 mg/kg, depois 0,5–0,75 mg/kg (máx. 3 mg/kg). Pediatria: amiodarona 5 mg/kg (máx. 300 mg), até 3 doses." }));
    function drawAmio() { var tot = S.amio.reduce(function (a, x) { return a + x.mg; }, 0); amN.textContent = tot + " mg / 450 mg"; amB.disabled = tot >= 450; amB.textContent = tot >= 450 ? "Dose máxima atingida (450 mg)" : "✓ Aplicar " + (S.amio.length ? "2ª dose: 150 mg" : "1ª dose: 300 mg"); am.querySelector("#psxB-amlog").textContent = S.amio.map(function (x) { return hhmm(x.t) + " — " + x.mg + " mg"; }).join(" · "); if (tot >= 450 && !am.querySelector(".alert")) am.appendChild(el("div", { class: "alert", text: "Limite máximo recomendado de amiodarona em bolus atingido (450 mg)." })); }
    // metrônomo
    var bpm = 110, vol = 0.4, met = null, mute = false, vib = false, beatEl = el("div", { class: "beat", "aria-hidden": "true" });
    function startMet() { stopMet(); met = setInterval(function () { if (!mute) beep(1000, 0.04, vol); if (vib && navigator.vibrate) navigator.vibrate(30); beatEl.classList.add("on"); setTimeout(function () { beatEl.classList.remove("on"); }, 90); }, 60000 / bpm); }
    function stopMet() { if (met) clearInterval(met); met = null; }
    var bpmIn = el("input", { type: "range", min: "100", max: "120", value: "110", "aria-label": "Frequência" }), bpmL = el("b", { text: "110 bpm" });
    bpmIn.oninput = function () { bpm = +bpmIn.value; bpmL.textContent = bpm + " bpm"; if (met) startMet(); };
    var volIn = el("input", { type: "range", min: "0", max: "1", step: "0.05", value: "0.4", "aria-label": "Volume" }); volIn.oninput = function () { vol = +volIn.value; };
    var mB = el("button", { class: "btn primary", type: "button", text: "▶ Ligar metrônomo", onclick: function () { if (met) { stopMet(); mB.textContent = "▶ Ligar metrônomo"; } else { startMet(); mB.textContent = "■ Parar metrônomo"; } } });
    var metS = el("section", { class: "cd" }, el("h3", { text: "Metrônomo de compressões" }), el("div", { style: "display:flex;gap:14px;align-items:center" }, beatEl, el("div", {}, bpmL, bpmIn)),
      el("label", {}, "Volume", volIn),
      el("div", { class: "btns" }, mB,
        el("label", { style: "flex-direction:row;gap:4px;align-items:center" }, el("input", { type: "checkbox", onchange: function (e) { mute = e.target.checked; } }), "Sem som (só luz)"),
        el("label", { style: "flex-direction:row;gap:4px;align-items:center" }, el("input", { type: "checkbox", onchange: function (e) { vib = e.target.checked; } }), "Vibrar (celular)")),
      el("p", { class: "disc", text: "Profundidade 5–6 cm (adulto), retorno total do tórax, trocar compressor a cada 2 min, fração de compressão > 80%." }));
    // ritmo
    var RIT = {
      chocavel: ["FV / TV sem pulso (chocável)", ["Choque imediato: bifásico 120–200 J (ou máx. do aparelho); monofásico 360 J. Pediatria: 2 J/kg → 4 J/kg → até 10 J/kg.", "RCP 2 min imediatamente após o choque.", "Após 2º choque: epinefrina 1 mg a cada 3–5 min.", "Após 3º choque: amiodarona 300 mg (depois 150 mg) ou lidocaína.", "Via aérea avançada + capnografia; tratar 5Hs/5Ts."]],
      naochoc: ["AESP / Assistolia (não chocável)", ["RCP 2 min, sem choque.", "Epinefrina 1 mg IV/IO o mais cedo possível, a cada 3–5 min.", "Assistolia: confirmar em 2 derivações, checar cabos e ganho.", "Buscar ativamente causas reversíveis (5Hs/5Ts).", "Considerar via aérea avançada e capnografia (EtCO₂ < 10 mmHg após 20 min = mau prognóstico)."]],
      rce: ["RCE — cuidados pós-PCR", ["SpO₂ 92–98%, PaCO₂ 35–45 mmHg.", "PAS ≥ 90 / PAM ≥ 65 mmHg (volume, noradrenalina).", "ECG 12 derivações: supra ST → cateterismo de emergência.", "Controle direcionado de temperatura 32–36 °C por ≥ 24 h; evitar febre.", "Glicemia 140–180 mg/dL; EEG se não responsivo."]]
    };
    var ritBox = el("div");
    function setRit(k) { S.ritmo = k; save(); ritBox.textContent = ""; var r = RIT[k]; ritBox.append(el("strong", { text: r[0] }), el("ol", {}, r[1].map(function (t) { return el("li", { text: t }); }))); }
    var ritS = el("section", { class: "cd" }, el("h3", { text: "Checagem de ritmo → conduta" }),
      el("div", { class: "btns" },
        el("button", { class: "btn", type: "button", text: "FV/TV sem pulso", onclick: function () { setRit("chocavel"); ev("Ritmo: FV/TV sem pulso"); } }),
        el("button", { class: "btn", type: "button", text: "AESP", onclick: function () { setRit("naochoc"); ev("Ritmo: AESP"); } }),
        el("button", { class: "btn", type: "button", text: "Assistolia", onclick: function () { setRit("naochoc"); ev("Ritmo: Assistolia"); } }),
        el("button", { class: "btn", type: "button", text: "⚡ Choque", onclick: function () { var j = prompt("Energia do choque (J)", "200"); if (j) ev("Choque " + j + " J"); } })), ritBox);
    if (S.ritmo) setRit(S.ritmo);
    // 5H5T
    var HT = [["Hipovolemia", "Cristaloide em bolus, hemoderivados se sangramento"], ["Hipóxia", "O₂ 100%, via aérea avançada, confirmar tubo"], ["Hidrogênio (acidose)", "Ventilação adequada; bicarbonato 1 mEq/kg se acidose grave/hipercalemia"], ["Hipo/Hipercalemia", "Hiper: gluconato de cálcio 10% 30 mL, bicarbonato, insulina+glicose; Hipo: KCl"], ["Hipotermia", "Reaquecimento ativo; choques/drogas espaçados se < 30 °C"], ["Tensão no tórax (pneumotórax)", "Descompressão por agulha 2º EIC/4-5º EIC LAM, depois dreno"], ["Tamponamento cardíaco", "Pericardiocentese guiada por ultrassom"], ["Toxinas", "Antídoto específico (ver Box › Intoxicações); lipídeo 20% se anestésico local"], ["Trombose pulmonar", "Considerar trombolítico (alteplase 50 mg bolus); RCP 60–90 min após"], ["Trombose coronariana", "Cateterismo pós-RCE; considerar trombólise"]];
    var htS = el("section", { class: "cd" }, el("h3", { text: "Causas reversíveis — 5Hs e 5Ts" }), el("table", {}, HT.map(function (h, i) { var c = el("input", { type: "checkbox" }); c.checked = !!S.hts[i]; c.onchange = function () { S.hts[i] = c.checked; ev((c.checked ? "Avaliado: " : "Desmarcado: ") + h[0]); }; return el("tr", {}, el("td", {}, c), el("td", {}, el("strong", { text: h[0] })), el("td", { text: h[1] })); })));
    // eventos
    var logUl = el("ul", { style: "max-height:260px;overflow:auto" });
    function drawLog() { logUl.textContent = ""; S.ev.slice().reverse().forEach(function (x) { logUl.appendChild(el("li", { text: hhmm(x.t) + " (" + mmss((x.t - S.t0) / 1000) + ") — " + x.d })); }); }
    function report() { var lines = ["RELATÓRIO DE PCR — PrescriMed", "Início: " + new Date(S.t0).toLocaleString("pt-BR"), "Tempo total: " + mmss((now() - S.t0 - S.paused) / 1000), "Ciclos: " + S.ciclos, "Epinefrina: " + S.epi.length + " mg (" + S.epi.length + " doses)", "Amiodarona: " + S.amio.reduce(function (a, x) { return a + x.mg; }, 0) + " mg", "", "LINHA DO TEMPO:"].concat(S.ev.map(function (x) { return hhmm(x.t) + " [" + mmss((x.t - S.t0) / 1000) + "] " + x.d; })); return lines.join("\n"); }
    var evS = el("section", { class: "cd" }, el("h3", { text: "Eventos e relatório" }),
      el("div", { class: "btns" }, ["Intubação orotraqueal", "Acesso venoso central", "Acesso intraósseo", "Acesso venoso periférico", "Capnografia instalada"].map(function (t) { return el("button", { class: "btn sm", type: "button", text: t, onclick: function () { ev(t); } }); }),
        el("button", { class: "btn sm primary", type: "button", text: "♥ RCE", onclick: function () { ev("RCE — retorno da circulação espontânea"); setRit("rce"); stopMet(); } }),
        el("button", { class: "btn sm", type: "button", text: "Encerrar (óbito)", onclick: function () { if (confirm("Registrar encerramento dos esforços?")) { ev("Esforços encerrados — constatação de óbito"); stopMet(); } } })),
      logUl,
      el("div", { class: "btns", style: "margin-top:8px" },
        el("button", { class: "btn", type: "button", text: "Copiar relatório", onclick: function () { navigator.clipboard && navigator.clipboard.writeText(report()); toast("Relatório copiado."); } }),
        el("button", { class: "btn", type: "button", text: "Baixar PDF do relatório", onclick: function () { if (!window.jspdf) return; var d = new window.jspdf.jsPDF(); d.setFontSize(10); var y = 15; report().split("\n").forEach(function (l) { d.splitTextToSize(l, 180).forEach(function (s) { if (y > 285) { d.addPage(); y = 15; } d.text(s, 15, y); y += 5; }); }); d.save("relatorio-pcr.pdf"); } }),
        el("button", { class: "btn primary", type: "button", text: "Registrar no prontuário", onclick: function () { log({ tipo: "registro_pcr", motivo: "PCR", justificativa: null, contexto: { relatorio: report().slice(0, 4000), ciclos: S.ciclos, epi: S.epi.length } }); toast("Registro da PCR gravado."); } })));
    m.append(el("div", { class: "g3" }, main1, epi, am), el("div", { class: "g3" }, metS, ritS), htS, evS,
      el("p", { class: "disc", text: "Ferramenta de apoio (ACLS/AHA 2020, ERC 2021). Não substitui o líder da reanimação. Conteúdo gerado por IA — confira." }));
    var lastCyc = -1, cycWarn = 0;
    var tk = setInterval(function () {
      var el0 = (now() - S.cyc0) / 1000, left = 120 - el0;
      if (left <= 0 && !S.pausedAt) { S.ciclos++; S.cyc0 = Date.now(); alarm(); main1.classList.remove("flash"); void main1.offsetWidth; main1.classList.add("flash"); ev("Ciclo " + S.ciclos + " — CHECAR RITMO: pausar compressões < 10 s, avaliar monitor, pulso se ritmo organizado, chocar se FV/TV"); toast("⏱ Checar ritmo agora"); left = 120; }
      cyc.textContent = mmss(left); cyc.style.color = left <= 15 ? "var(--bad)" : "";
      tot.textContent = mmss((now() - S.t0 - S.paused) / 1000); ncy.textContent = "Ciclos completos: " + S.ciclos + (S.pausedAt ? " · ⏸ pausado" : "");
      rit.textContent = left <= 15 ? "Prepare-se: checagem de ritmo e troca do compressor." : "";
      var le = S.epi.length ? (Date.now() - S.epi[S.epi.length - 1]) / 1000 : null;
      epiN.textContent = "Doses: " + S.epi.length + " (" + S.epi.length + " mg)" + (S.epi.length ? " · " + S.epi.map(hhmm).join(", ") : "");
      if (le == null) { epiT.textContent = "Nenhuma dose"; epiT.style.color = ""; }
      else { epiT.textContent = "Última há " + mmss(le) + (le >= 180 ? " — JANELA DE NOVA DOSE" : " · próxima em " + mmss(180 - le)); epiT.style.color = le >= 300 ? "var(--bad)" : le >= 180 ? "var(--warn)" : "var(--ok)"; if (le >= 180 && !S.epiWarn) { S.epiWarn = 1; alarm(); toast("Epinefrina: janela de 3–5 min"); } }
    }, 250);
    sh.root.addEventListener("close", function () { clearInterval(tk); stopMet(); });
    if (!S.ev.length) ev("Início da PCR / RCP");
    drawAmio(); drawLog(); save();
  }

  /* ================= BOX ================= */
  function field(id, lab, val, attrs) { return el("label", {}, lab, el("input", Object.assign({ id: id, inputmode: "decimal", value: val == null ? "" : val }, attrs || {}))); }
  function v(root, id) { var x = root.querySelector("#" + id); return x ? num(x.value) : null; }
  function calcCard(title, fields, fn, note) {
    var res = el("div", { class: "res", "aria-live": "polite" }), c = el("div", { class: "cd" }, el("h3", { text: title }), el("div", { class: "fg" }, fields), res, note ? el("p", { class: "disc", text: note }) : null);
    var run = function () { try { res.innerHTML = fn(function (id) { return v(c, id); }, c) || ""; } catch (e) { res.textContent = "—"; } };
    c.addEventListener("input", run); c.addEventListener("change", run); setTimeout(run, 0); return c;
  }
  var uid = 0; function id(s) { return "b" + (++uid) + s; }

  // ---- 1. Infusões ----
  var VASO = [
    { n: "Noradrenalina", u: "mcg/kg/min", mg: 4, ml: 250, r: [0.01, 3], dil: "4 mg (1 amp 4 mg/4 mL) em 246 mL SG5% = 16 mcg/mL; padrão concentrado 16 mg/250 mL = 64 mcg/mL" },
    { n: "Adrenalina", u: "mcg/kg/min", mg: 4, ml: 250, r: [0.01, 1], dil: "4 mg em 250 mL = 16 mcg/mL" },
    { n: "Dopamina", u: "mcg/kg/min", mg: 250, ml: 250, r: [2, 20], dil: "250 mg (5 amp 50 mg) em 200 mL = 1000 mcg/mL" },
    { n: "Dobutamina", u: "mcg/kg/min", mg: 250, ml: 250, r: [2, 20], dil: "250 mg (1 amp) em 230 mL = 1000 mcg/mL" },
    { n: "Vasopressina", u: "U/min", mg: 20, ml: 100, r: [0.01, 0.04], dil: "20 U em 100 mL = 0,2 U/mL (dose fixa, não por kg)", fixa: true },
    { n: "Milrinona", u: "mcg/kg/min", mg: 20, ml: 100, r: [0.125, 0.75], dil: "20 mg em 80 mL = 200 mcg/mL; ataque opcional 50 mcg/kg em 10 min" },
    { n: "Nitroprussiato", u: "mcg/kg/min", mg: 50, ml: 250, r: [0.3, 10], dil: "50 mg em 250 mL SG5% = 200 mcg/mL; proteger da luz; risco de cianeto > 2 mcg/kg/min prolongado" },
    { n: "Nitroglicerina", u: "mcg/min", mg: 50, ml: 250, r: [5, 200], dil: "50 mg em 250 mL = 200 mcg/mL; frasco de vidro", fixa: true },
    { n: "Fentanil", u: "mcg/kg/h", mg: 2.5, ml: 100, r: [0.5, 3], dil: "2.500 mcg (50 mL) + 50 mL SF = 25 mcg/mL", h: true },
    { n: "Midazolam", u: "mg/kg/h", mg: 150, ml: 150, r: [0.02, 0.2], dil: "150 mg (30 mL) + 120 mL SF = 1 mg/mL", h: true, mgU: true },
    { n: "Propofol 1%", u: "mg/kg/h", mg: 1000, ml: 100, r: [0.5, 4], dil: "puro 10 mg/mL; atenção à síndrome de infusão do propofol > 4 mg/kg/h", h: true, mgU: true },
    { n: "Dexmedetomidina", u: "mcg/kg/h", mg: 0.4, ml: 100, r: [0.2, 1.4], dil: "400 mcg (2 amp) em 96 mL SF = 4 mcg/mL", h: true },
    { n: "Cetamina", u: "mg/kg/h", mg: 500, ml: 100, r: [0.1, 1], dil: "500 mg em 90 mL SF = 5 mg/mL", h: true, mgU: true }
  ];
  function infusoes() {
    var w = peso() || "", sel = el("select", { id: "inf-d", "aria-label": "Droga" }, VASO.map(function (d, i) { return el("option", { value: i, text: d.n }); }));
    var box = el("div", { class: "cd" }, el("h3", { text: "Calculadora bidirecional de infusão" }));
    var fg = el("div", { class: "fg" }, el("label", {}, "Droga", sel), field("inf-w", "Peso (kg)", w), field("inf-mg", "Droga na solução (mg)", ""), field("inf-ml", "Volume total (mL)", ""), field("inf-dose", "Dose desejada", ""), field("inf-mlh", "Vazão (mL/h)", ""));
    var res = el("div", { class: "res" }); box.append(fg, res);
    var last = "dose";
    function cur() { return VASO[+sel.value]; }
    function load() { var d = cur(); box.querySelector("#inf-mg").value = d.mg; box.querySelector("#inf-ml").value = d.ml; box.querySelector("#inf-dose").value = d.r[0]; last = "dose"; box.querySelector("#inf-dose").previousSibling.textContent = "Dose desejada (" + d.u + ")"; run(); }
    function run() {
      var d = cur(), W = d.fixa ? 1 : v(box, "inf-w"), mg = v(box, "inf-mg"), ml = v(box, "inf-ml");
      if (!mg || !ml || !W) { res.textContent = "Preencha peso, quantidade e volume."; return; }
      var conc = d.mgU ? mg / ml : (d.n === "Vasopressina" ? mg / ml : mg * 1000 / ml), unitConc = d.mgU ? "mg/mL" : d.n === "Vasopressina" ? "U/mL" : "mcg/mL";
      var perMin = !d.h; // dose por minuto
      var dose, mlh;
      if (last === "dose") { dose = v(box, "inf-dose"); mlh = dose * W * (perMin ? 60 : 1) / conc; box.querySelector("#inf-mlh").value = nf(mlh, 2).replace(/\./g, ""); }
      else { mlh = v(box, "inf-mlh"); dose = mlh * conc / (W * (perMin ? 60 : 1)); box.querySelector("#inf-dose").value = nf(dose, 3).replace(/\./g, ""); }
      var fora = dose < d.r[0] || dose > d.r[1];
      res.innerHTML = "<b>" + d.n + "</b>: concentração " + nf(conc, 3) + " " + unitConc + " · <b>" + nf(dose, 3) + " " + d.u + " = " + nf(mlh, 2) + " mL/h</b> (" + nf(mlh / 60 * 20, 1) + " gotas/min em equipo macro; " + nf(mlh, 1) + " microgotas/min)<br>Faixa usual: " + d.r[0] + "–" + d.r[1] + " " + d.u + (fora ? '<div class="alert">Dose fora da faixa usual — confira.</div>' : "") + '<div class="disc">Diluição sugerida: ' + d.dil + "</div>";
    }
    sel.onchange = load; box.querySelector("#inf-dose").addEventListener("input", function () { last = "dose"; run(); }); box.querySelector("#inf-mlh").addEventListener("input", function () { last = "mlh"; run(); });
    ["inf-w", "inf-mg", "inf-ml"].forEach(function (k) { box.querySelector("#" + k).addEventListener("input", run); });
    setTimeout(load, 0);
    var tabela = el("div", { class: "cd" }, el("h3", { text: "Tabela de gotejamento — noradrenalina 16 mcg/mL (mL/h)" }));
    function drawTab() { var W = num(box.querySelector("#inf-w").value) || 70, doses = [0.05, 0.1, 0.2, 0.3, 0.5, 0.75, 1]; tabela.querySelector("table") && tabela.querySelector("table").remove(); tabela.appendChild(el("table", {}, el("tr", {}, el("th", { text: "mcg/kg/min" }), doses.map(function (x) { return el("th", { text: nf(x, 2) }); })), el("tr", {}, el("td", { text: "mL/h (" + W + " kg)" }), doses.map(function (x) { return el("td", { text: nf(x * W * 60 / 16, 1) }); })))); }
    box.addEventListener("input", drawTab); setTimeout(drawTab, 0);
    var hep = calcCard("Heparina não fracionada IV (anticoagulação plena)", [field(id("w"), "Peso (kg)", w, { id: "hp-w" }), field("hp-tt", "TTPa relação (paciente/controle)", "")], function (g) {
      var W = g("hp-w"); if (!W) return "Informe o peso."; var r = g("hp-tt"), b = Math.round(80 * W / 100) * 100, inf = Math.round(18 * W);
      var s = "Ataque: <b>80 U/kg = " + b + " U IV</b> (máx. 10.000). Infusão: <b>18 U/kg/h = " + inf + " U/h</b> (25.000 U em 250 mL = 100 U/mL → " + nf(inf / 100, 1) + " mL/h). TTPa 6 h após.";
      if (r) s += "<br>Ajuste: " + (r < 1.2 ? "<b>80 U/kg bolus, ↑ 4 U/kg/h</b>" : r < 1.5 ? "<b>40 U/kg bolus, ↑ 2 U/kg/h</b>" : r <= 2.3 ? "<b class='ok'>Manter</b>" : r <= 3 ? "<b>↓ 2 U/kg/h</b>" : "<b class='warn'>Suspender 1 h, ↓ 3 U/kg/h</b>") + " — novo TTPa em 6 h.";
      return s + "<br>Profilaxia: enoxaparina 40 mg SC 1×/dia (ClCr < 30: 20 mg). Plena: 1 mg/kg 12/12 h.";
    }, "Nomograma de Raschke. Monitorar plaquetas (TIH).");
    var ins = calcCard("Insulina regular IV contínua (alvo 140–180 mg/dL)", [field("in-w", "Peso (kg)", w), field("in-g", "Glicemia atual (mg/dL)", ""), field("in-r", "Taxa atual (U/h)", "")], function (g) {
      var W = g("in-w"), G = g("in-g"), R = g("in-r"); if (!G) return "Solução: 100 U em 100 mL SF = 1 U/mL. Início: 0,05–0,1 U/kg/h" + (W ? " = <b>" + nf(0.05 * W, 1) + "–" + nf(0.1 * W, 1) + " U/h</b>" : "") + ".";
      if (G < 70) return "<div class='alert'>HIPOGLICEMIA: suspender insulina; glicose 50% 20–40 mL IV (pediatria SG10% 2–5 mL/kg); repetir HGT em 15 min.</div>";
      if (G < 100) return "Suspender infusão; HGT em 30 min; reiniciar com 50% da taxa quando > 140.";
      var adj = G < 140 ? -0.5 : G <= 180 ? 0 : G <= 250 ? 1 : 2, nt = R != null ? Math.max(0, R + adj) : null;
      return "Glicemia " + G + " → " + (adj === 0 ? "<b class='ok'>manter taxa</b>" : (adj > 0 ? "aumentar " : "reduzir ") + Math.abs(adj) + " U/h") + (nt != null ? " → <b>" + nf(nt, 1) + " U/h = " + nf(nt, 1) + " mL/h</b>" : "") + ". HGT de 1/1 h. Potássio > 3,3 antes de iniciar na CAD.";
    }, "Protocolo simplificado; adaptar ao protocolo institucional.");
    var outros = calcCard("Bicarbonato e magnésio", [field("bc-w", "Peso (kg)", w), field("bc-be", "Base excess (BE)", "")], function (g) {
      var W = g("bc-w"), BE = g("bc-be"); if (!W) return "Informe o peso.";
      var s = "Bicarbonato 8,4% (1 mEq/mL): PCR/hipercalemia 1 mEq/kg = <b>" + nf(W, 0) + " mEq</b>.";
      if (BE != null && BE < 0) s += " Déficit = 0,3 × peso × |BE| = <b>" + nf(0.3 * W * -BE, 0) + " mEq</b> (repor metade em 4–6 h; só se pH < 7,1).";
      return s + "<br>Sulfato de magnésio 50%: torsades 1–2 g IV em 5–20 min; asma grave 2 g em 20 min (pediatria 25–50 mg/kg, máx. 2 g); eclâmpsia 4–6 g ataque + 1–2 g/h.";
    });
    return [el("div", { class: "g3" }, box, tabela), el("div", { class: "g3" }, hep, ins, outros),
      el("div", { class: "cd" }, el("h3", { text: "Sedação — escalas" }), el("table", {}, [["+4", "Combativo"], ["+3", "Muito agitado"], ["+2", "Agitado"], ["+1", "Inquieto"], ["0", "Alerta e calmo"], ["−1", "Sonolento"], ["−2", "Sedação leve"], ["−3", "Sedação moderada"], ["−4", "Sedação profunda"], ["−5", "Não despertável"]].map(function (r) { return el("tr", {}, el("td", { text: "RASS " + r[0] }), el("td", { text: r[1] })); })), el("p", { class: "disc", text: "Alvo usual RASS 0 a −2. Ramsay 1 ansioso … 6 sem resposta. Bolus típicos: fentanil 1–2 mcg/kg; midazolam 0,02–0,1 mg/kg; propofol 0,5–1 mg/kg." }))];
  }

  // ---- 2. Intoxicações ----
  var TOX = [
    ["Paracetamol", "> 150 mg/kg (ou > 7,5 g adulto)", "Assintomático inicial; hepatite 24–72 h", "N-acetilcisteína IV 150 mg/kg em 1 h → 50 mg/kg em 4 h → 100 mg/kg em 16 h (esquema 21 h). Nível sérico 4 h (nomograma Rumack-Matthew)."],
    ["Opioides", "Variável", "Miose, bradipneia, rebaixamento", "Naloxona 0,04–0,4 mg IV, repetir a cada 2–3 min até 10 mg; pediatria 0,1 mg/kg. Infusão 2/3 da dose eficaz por hora."],
    ["Organofosforados / carbamatos", "—", "Síndrome colinérgica (SLUDGE, miose, broncorreia, bradicardia)", "Atropina 1–2 mg IV dobrando a cada 5 min até secar secreções; pralidoxima 30 mg/kg em 30 min + 8 mg/kg/h. Descontaminação da pele."],
    ["Benzodiazepínicos", "—", "Sonolência; depressão respiratória com associações", "Suporte. Flumazenil 0,2 mg IV (repetir até 1 mg) — evitar em uso crônico, convulsão ou tricíclicos."],
    ["Varfarina / cumarínicos", "—", "Sangramento, INR alto", "Vitamina K 5–10 mg IV lenta; sangramento grave: complexo protrombínico 25–50 U/kg ou plasma 15 mL/kg."],
    ["Metemoglobinemia (dapsona, nitritos, anestésicos)", "—", "Cianose com PaO₂ normal, sangue achocolatado", "Azul de metileno 1–2 mg/kg IV em 5 min se MetHb > 20–30% (contraindicado em G6PD)."],
    ["Cianeto / fumaça", "—", "Acidose lática grave, coma, colapso", "Hidroxocobalamina 70 mg/kg (5 g adulto) IV em 15 min; O₂ 100%."],
    ["Metanol / etilenoglicol", "—", "Acidose com ânion e gap osmolar elevados; cegueira (metanol)", "Fomepizol 15 mg/kg → 10 mg/kg 12/12 h ou etanol IV (alvo 100–150 mg/dL); hemodiálise."],
    ["Tricíclicos", "> 10–20 mg/kg", "QRS > 100 ms, arritmias, convulsão, anticolinérgico", "Bicarbonato de sódio 1–2 mEq/kg em bolus até QRS < 100 ms; pH 7,45–7,55."],
    ["Betabloqueador / bloqueador de cálcio", "—", "Bradicardia, hipotensão, choque", "Cálcio, glucagon 3–10 mg IV (BB), insulina em altas doses 1 U/kg + glicose, vasopressor; lipídeo 20%."],
    ["Digoxina", "—", "Náusea, visão amarela, arritmias, hipercalemia", "Anticorpo antidigoxina (Fab); corrigir potássio; evitar cálcio IV se possível."],
    ["Anestésicos locais (LAST)", "—", "Convulsão, arritmias, PCR", "Emulsão lipídica 20% 1,5 mL/kg em bolus + 0,25 mL/kg/min."],
    ["Cocaína / simpatomiméticos", "—", "Hipertermia, taquicardia, HAS, dor torácica", "Benzodiazepínicos; resfriamento; evitar betabloqueador isolado."],
    ["Ferro", "> 60 mg/kg elementar", "Vômitos, sangramento GI, choque, acidose", "Deferoxamina 15 mg/kg/h IV se ferro sérico > 500 mcg/dL ou sintomas graves."],
    ["Salicilatos", "> 150 mg/kg", "Zumbido, alcalose resp. + acidose metab.", "Alcalinização urinária (bicarbonato), potássio; hemodiálise se grave."]
  ];
  function intox() {
    var q = el("input", { placeholder: "Buscar substância, classe ou sintoma…", "aria-label": "Buscar intoxicação", style: "width:100%;font-size:18px" }), tb = el("table");
    function draw() { var f = fold(q.value); tb.textContent = ""; tb.appendChild(el("tr", {}, ["Agente", "Dose tóxica", "Quadro", "Conduta / antídoto"].map(function (h) { return el("th", { text: h }); }))); TOX.filter(function (t) { return !f || fold(t.join(" ")).indexOf(f) >= 0; }).forEach(function (t) { tb.appendChild(el("tr", {}, el("td", {}, el("b", { text: t[0] })), el("td", { text: t[1] }), el("td", { text: t[2] }), el("td", { text: t[3] }))); }); }
    q.oninput = draw; draw();
    return [el("div", { class: "cd" }, el("h3", { text: "Intoxicações e antídotos" }), q, tb),
      el("div", { class: "g3" },
        el("div", { class: "cd" }, el("h3", { text: "Toxíndromes" }), el("ul", {}, ["Colinérgica: miose, sialorreia, broncorreia, bradicardia, diarreia", "Anticolinérgica: midríase, pele seca/quente, retenção urinária, delírio, taquicardia", "Simpatomimética: midríase, sudorese, hipertermia, HAS, taquicardia", "Opioide: miose, bradipneia, coma", "Serotoninérgica (critérios de Hunter): clônus, hiperreflexia, hipertermia — ciproeptadina 12 mg", "Neuroléptica maligna: rigidez em cano de chumbo, febre, CPK alta — dantrolene/bromocriptina"].map(function (t) { return el("li", { text: t }); }))),
        el("div", { class: "cd" }, el("h3", { text: "Descontaminação" }), el("ul", {}, ["Carvão ativado 1 g/kg (máx. 50 g) até 1–2 h após ingestão, via aérea protegida", "Não usar em cáusticos, hidrocarbonetos, álcoois, metais (ferro, lítio)", "Lavagem gástrica: só exceções, < 1 h, risco de vida", "Irrigação intestinal total: ferro, lítio, pacotes de drogas", "CIATox: 0800 722 6001 (Disque-Intoxicação ANVISA)"].map(function (t) { return el("li", { text: t }); }))))];
  }

  // ---- 3. Ventilação ----
  function vent() {
    var pp = calcCard("Volume corrente protetor (ARDSnet)", [el("label", {}, "Sexo", el("select", { id: "vm-s" }, el("option", { value: "m", text: "Masculino" }), el("option", { value: "f", text: "Feminino" }))), field("vm-h", "Altura (cm)", ""), field("vm-ml", "mL/kg", "6")], function (g, c) {
      var h = g("vm-h"), s = c.querySelector("#vm-s").value, k = g("vm-ml") || 6; if (!h) return "Informe a altura.";
      var pbw = (s === "m" ? 50 : 45.5) + 0.91 * (h - 152.4);
      return "Peso predito: <b>" + nf(pbw, 1) + " kg</b> · Vt " + k + " mL/kg = <b>" + nf(pbw * k, 0) + " mL</b> (6–8 mL/kg: " + nf(pbw * 6, 0) + "–" + nf(pbw * 8, 0) + " mL).<br>Inicial: FR 14–20 (até 35 se acidose), PEEP 5–8, FiO₂ para SpO₂ 92–96% (DPOC 88–92%), Pplat ≤ 30.";
    });
    var mec = calcCard("Mecânica respiratória e oxigenação", [field("me-vt", "Vt (mL)", ""), field("me-pp", "Pressão de pico", ""), field("me-pl", "Platô", ""), field("me-pe", "PEEP", ""), field("me-pa", "PaO₂", ""), field("me-fi", "FiO₂ (%)", "")], function (g) {
      var out = [], vt = g("me-vt"), pk = g("me-pp"), pl = g("me-pl"), pe = g("me-pe"), pa = g("me-pa"), fi = g("me-fi");
      if (vt && pl != null && pe != null) { var dp = pl - pe; out.push("Driving pressure: <b class='" + (dp < 15 ? "ok" : "warn") + "'>" + dp + " cmH₂O</b> (alvo < 15)"); out.push("Complacência estática: <b>" + nf(vt / dp, 1) + " mL/cmH₂O</b> (normal 50–100)"); }
      if (vt && pk != null && pe != null) out.push("Complacência dinâmica: <b>" + nf(vt / (pk - pe), 1) + " mL/cmH₂O</b>");
      if (pk != null && pl != null) out.push("Resistência (pico−platô): " + (pk - pl) + " cmH₂O" + (pk - pl > 10 ? " — <b class='warn'>alta (broncoespasmo, secreção, tubo)</b>" : ""));
      if (pa && fi) { var pf = pa / (fi / 100); out.push("P/F: <b>" + nf(pf, 0) + "</b> — " + (pf <= 100 ? "SDRA grave" : pf <= 200 ? "SDRA moderada" : pf <= 300 ? "SDRA leve" : "sem critério de SDRA") + " (Berlim, com PEEP ≥ 5)"); }
      return out.join("<br>") || "Preencha os campos.";
    });
    var peep = el("div", { class: "cd" }, el("h3", { text: "Tabela PEEP/FiO₂ (ARDSnet, PEEP baixa)" }), el("table", {}, el("tr", {}, el("th", { text: "FiO₂" }), [0.3, 0.4, 0.4, 0.5, 0.5, 0.6, 0.7, 0.7, 0.7, 0.8, 0.9, 0.9, 0.9, 1].map(function (x) { return el("td", { text: x }); })), el("tr", {}, el("th", { text: "PEEP" }), [5, 5, 8, 8, 10, 10, 10, 12, 14, 14, 14, 16, 18, "18–24"].map(function (x) { return el("td", { text: x }); }))), el("p", { class: "disc", text: "SDRA moderada/grave: considerar PEEP alta, prona ≥ 16 h/dia se P/F < 150, bloqueio neuromuscular precoce. Recrutamento: só com monitorização e em casos selecionados." }));
    var tre = calcCard("Desmame — IRRS (Tobin)", [field("tr-fr", "FR (irpm)", ""), field("tr-vt", "Vt (mL)", "")], function (g) { var f = g("tr-fr"), vt = g("tr-vt"); if (!f || !vt) return "Durante TRE (tubo T ou PSV 5–8 por 30–120 min)."; var i = f / (vt / 1000); return "IRRS = <b class='" + (i < 105 ? "ok" : "warn") + "'>" + nf(i, 0) + "</b> " + (i < 105 ? "→ preditor de sucesso" : "→ alto risco de falha"); }, "Checklist pré-extubação: causa resolvida, PEEP ≤ 8, FiO₂ ≤ 40%, sem DVA alta, tosse eficaz, secreção manejável, desperto, teste de vazamento do cuff se risco de edema.");
    var modos = el("div", { class: "cd" }, el("h3", { text: "Modos ventilatórios e VNI" }), [["VCV (volume controlado)", "Garante Vt; vigiar Pplat (barotrauma). Base da ventilação protetora."], ["PCV (pressão controlada)", "Limita pressão; Vt variável. SDRA, broncoespasmo grave."], ["PSV (pressão de suporte)", "Paciente dispara cada ciclo. Desmame e paciente colaborativo."], ["SIMV", "Mandatórios sincronizados + espontâneos; transição."], ["PRVC", "Ajusta pressão para atingir Vt alvo; híbrido."], ["APRV", "Alta pressão contínua com liberações; SDRA refratária, equipe experiente."], ["VNI — CPAP vs BiPAP", "CPAP 5–10 (EAP, apneia). BiPAP IPAP 10–15/EPAP 5 (DPOC hipercápnico). Falha: piora em 1–2 h, pH < 7,25, rebaixamento, instabilidade → IOT sem atraso."], ["CNAF / Optiflow", "30–60 L/min, FiO₂ titulada; hipoxêmica. Índice ROX (SpO₂/FiO₂/FR) < 3,85 em 12 h = falha provável."], ["Capnografia", "EtCO₂ 35–45; espaço morto Vd/Vt = (PaCO₂ − EtCO₂)/PaCO₂. Auto-PEEP: pausa expiratória; reduzir FR/aumentar tempo expiratório."]].map(function (m) { return el("details", {}, el("summary", { text: m[0] }), el("p", { text: m[1] })); }));
    return [el("div", { class: "g3" }, pp, mec, tre), el("div", { class: "g3" }, peep, modos)];
  }

  // ---- 4. SIR ----
  function sir() {
    var w = peso() || "";
    var P7 = ["Planejamento: indicação, equipe, material, plano B (bougie, máscara laríngea, crico)", "Pré-oxigenação: O₂ 100% 3–5 min (SpO₂ > 95%); cateter nasal 15 L/min (oxigenação apneica)", "Pré-tratamento: fentanil 1–3 mcg/kg (3 min antes); lidocaína 1,5 mg/kg (HIC)", "Paralisia com indução: hipnótico + bloqueador simultâneos", "Posicionamento: rampa, orelha–esterno alinhados, cabeceira 30°", "Passagem do tubo: laringoscopia direta/vídeo; BURP se necessário", "Pós-intubação: capnografia, ausculta 5 pontos, fixação, sedação contínua, RX"];
    var chk = el("div", { class: "cd" }, el("h3", { text: "Checklist dos 7 Ps" }), P7.map(function (t, i) { var c = el("input", { type: "checkbox" }); c.onchange = function () { if (c.checked) log({ tipo: "registro_calculo", motivo: "SIR", justificativa: "Etapa " + (i + 1) + ": " + t.split(":")[0] }); }; return el("label", { style: "flex-direction:row;gap:8px;align-items:flex-start;font-size:15px;color:var(--ink);margin:4px 0" }, c, el("span", { text: (i + 1) + ". " + t })); }));
    var doses = calcCard("Doses por peso (indução + bloqueio)", [field("sr-w", "Peso (kg)", w), field("sr-id", "Idade (anos) — tubo pediátrico", "")], function (g) {
      var W = g("sr-w"), I = g("sr-id"); if (!W) return "Informe o peso.";
      var r = function (a, b) { return nf(a * W, 0) + (b ? "–" + nf(b * W, 0) : "") + " mg"; };
      var t = "<table><tr><th>Droga</th><th>Dose</th><th>Nota</th></tr>" + [["Etomidato", r(0.3), "Escolha na instabilidade"], ["Propofol", r(1.5, 2.5), "Hipotensão — evitar em choque"], ["Cetamina", r(1, 2), "Broncodilatador; mantém drive"], ["Midazolam", r(0.2, 0.3), "Início lento"], ["Tiopental", r(3, 5), "Neuroproteção, pouco usado"], ["Succinilcolina", r(1, 1.5), "45–60 s; CI: hipercalemia, queimado > 24 h, TRM, miopatia"], ["Rocurônio", r(1, 1.2), "60–90 s; reversão sugamadex 16 mg/kg = " + nf(16 * W, 0) + " mg"], ["Fentanil (pré)", nf(1 * W, 0) + "–" + nf(3 * W, 0) + " mcg", "3 min antes"]].map(function (x) { return "<tr><td><b>" + x[0] + "</b></td><td>" + x[1] + "</td><td>" + x[2] + "</td></tr>"; }).join("") + "</table>";
      if (I != null && I < 14) t += "Tubo pediátrico: (idade/4) + 4 = <b>" + nf(I / 4 + 4, 1) + " mm sem cuff</b> / " + nf(I / 4 + 3.5, 1) + " mm com cuff; profundidade ≈ 3 × tubo = " + nf(3 * (I / 4 + 3.5), 0) + " cm.";
      else t += "Tubo adulto: mulheres 7,0–7,5 mm; homens 7,5–8,0 mm; fixação ~21 cm (♀) / 23 cm (♂) na rima.";
      return t;
    });
    var lar = el("div", { class: "cd" }, el("h3", { text: "Técnica, confirmação e complicações" }), [["Laringoscopia", "Macintosh (curva, valécula) vs. Miller (reta, eleva epiglote; lactentes). BURP: back, up, right pressure na cartilagem tireoide. Plano B: bougie, máscara laríngea, cricotireoidostomia (não intubo, não oxigeno)."], ["Confirmação", "Capnografia com onda sustentada (padrão-ouro), ausculta 5 pontos, condensação, expansibilidade, RX: ponta 2–4 cm acima da carina."], ["Hipoxemia refratária", "Bolsa-valva-máscara, PEEP, checar DOPE (deslocamento, obstrução, pneumotórax, equipamento), prona."], ["Hipotensão pós-indução", "Volume, noradrenalina (push-dose: 10–20 mcg), reduzir sedação."], ["Broncoespasmo", "Ventilação lenta, broncodilatador, cetamina adicional."], ["Intubação esofágica", "Remover já, reoxigenar, nova tentativa."], ["Trauma de via aérea", "Controle do sangramento; considerar via cirúrgica."]].map(function (m) { return el("details", {}, el("summary", { text: m[0] }), el("p", { text: m[1] })); }));
    return [el("div", { class: "g3" }, chk, doses), lar];
  }

  // ---- 5. Paliativos ----
  var EQ = { "Morfina VO": 1, "Morfina IV/SC": 3, "Oxicodona VO": 1.5, "Hidromorfona VO": 5, "Codeína VO": 0.15, "Tramadol VO": 0.2, "Metadona VO (variável!)": 4, "Fentanil transdérmico (mcg/h)": 2.4 };
  function paliat() {
    var opts = Object.keys(EQ).map(function (k) { return el("option", { value: k, text: k }); });
    var conv = calcCard("Conversão equianalgésica de opioides", [el("label", {}, "De", el("select", { id: "eq-a" }, opts.map(function (o) { return o.cloneNode(true); }))), field("eq-d", "Dose diária total", ""), el("label", {}, "Para", el("select", { id: "eq-b" }, opts))], function (g, c) {
      var a = c.querySelector("#eq-a").value, b = c.querySelector("#eq-b").value, d = g("eq-d"); if (!d) return "Informe a dose em 24 h (fentanil adesivo: mcg/h).";
      var mme = d * EQ[a], alvo = mme / EQ[b], red = alvo * 0.75;
      return "≈ <b>" + nf(mme, 0) + " mg de morfina oral/dia</b> (MME). Equivalente em " + b + ": " + nf(alvo, 1) + " → <b>com redução de 25% por tolerância cruzada incompleta: " + nf(red, 1) + "/dia</b>.<br>Resgate (breakthrough): 1/6 da dose diária = " + nf(red / 6, 1) + " a cada 1 h se necessário." + (/Metadona/.test(a + b) ? "<div class='alert'>Metadona: conversão não linear — use especialista.</div>" : "");
    }, "Tabela aproximada; reavaliar em 24 h.");
    var sec = [["Escada analgésica da OMS", "1) Dor leve: paracetamol, AINE ± adjuvante. 2) Moderada: codeína, tramadol. 3) Intensa: morfina, oxicodona, metadona, fentanil. Neuropática: gabapentina, pregabalina, amitriptilina."], ["Dispneia refratária", "Morfina 2,5–5 mg VO/SC a cada 4 h, titular; O₂ se benefício de conforto; midazolam para ansiedade; ventilador no rosto, posição sentada."], ["Náuseas e vômitos", "Metoclopramida 10 mg 8/8 h (estase); ondansetrona 4–8 mg; haloperidol 0,5–2 mg (metabólica/opioide); dexametasona 4–8 mg/dia (HIC, obstrução)."], ["Constipação por opioide", "Lactulose, polietilenoglicol; bisacodil, sene; naloxegol se refratária. Prescrever laxante junto com todo opioide."], ["Delirium terminal", "Tratar causas (dor, retenção urinária, fecaloma, infecção, drogas). Haloperidol 0,5–2 mg 8–12 h; levomepromazina ou quetiapina; sedação paliativa com midazolam contínuo se refratário."], ["Protocolo SPIKES", "S — ambiente privado, sentado, familiar presente. P — \"O que você entende sobre sua doença?\" I — \"Quer saber os detalhes?\" K — informar claro, sem jargão, com pausas. E — validar emoções. S — plano, próximos passos e disponibilidade."], ["Últimos dias de vida", "Sinais: rebaixamento, Cheyne-Stokes, extremidades frias. Suspender exames, sinais vitais de rotina e dieta forçada. Prescrição antecipada: morfina SC (dor/dispneia), midazolam SC (agitação), escopolamina (estertor). Apoio à família e espiritual."], ["Princípios e diretivas", "Alívio do sofrimento físico, psíquico, social e espiritual; conferência familiar; registro das diretivas antecipadas de vontade (CFM 1.995/2012) e do representante."]];
    return [el("div", { class: "g3" }, conv, el("div", { class: "cd" }, el("h3", { text: "Controle de sintomas e comunicação" }), sec.map(function (m) { return el("details", {}, el("summary", { text: m[0] }), el("p", { text: m[1] })); })))];
  }

  // ---- 6. Gasometria ----
  function gaso() {
    var c = calcCard("Interpretador de gasometria arterial (5 passos)", [field("gs-ph", "pH", ""), field("gs-co", "PaCO₂", ""), field("gs-hc", "HCO₃⁻", ""), field("gs-na", "Na⁺", ""), field("gs-cl", "Cl⁻", ""), field("gs-al", "Albumina (g/dL)", ""), field("gs-po", "PaO₂", ""), field("gs-fi", "FiO₂ (%)", "21"), field("gs-id", "Idade", ""), field("gs-gl", "Glicose", ""), field("gs-ur", "Ureia", ""), field("gs-om", "Osmolalidade medida", "")], function (g) {
      var ph = g("gs-ph"), co = g("gs-co"), hc = g("gs-hc"), na = g("gs-na"), cl = g("gs-cl"), al = g("gs-al"), po = g("gs-po"), fi = g("gs-fi"), id2 = g("gs-id"), gl = g("gs-gl"), ur = g("gs-ur"), om = g("gs-om"), o = [];
      if (po && fi && co) { var PA = fi / 100 * (760 - 47) - co / 0.8, aa = PA - po, esp = id2 ? id2 / 4 + 4 : null; o.push("1) Oxigenação: PAO₂ " + nf(PA, 0) + ", <b>gradiente A-a " + nf(aa, 0) + "</b>" + (esp ? " (esperado ≤ " + nf(esp, 0) + (aa > esp ? " — <b class='warn'>aumentado: distúrbio V/Q, shunt ou difusão</b>" : " — normal") + ")" : "") + "; P/F " + nf(po / (fi / 100), 0)); }
      if (ph && co && hc) {
        var dis = ph < 7.35 ? "Acidemia" : ph > 7.45 ? "Alcalemia" : "pH normal"; o.push("2) <b>" + dis + "</b> (pH " + ph + ")");
        var prim;
        if (ph < 7.35) prim = hc < 22 ? "met_ac" : co > 45 ? "resp_ac" : null; else if (ph > 7.45) prim = hc > 26 ? "met_alc" : co < 35 ? "resp_alc" : null; else prim = hc < 22 && co < 35 ? "met_ac" : hc > 26 && co > 45 ? "met_alc" : null;
        var nm = { met_ac: "Acidose metabólica", resp_ac: "Acidose respiratória", met_alc: "Alcalose metabólica", resp_alc: "Alcalose respiratória" };
        o.push("3) Primário: <b>" + (prim ? nm[prim] : "indefinido / misto") + "</b>");
        if (prim === "met_ac") { var w = 1.5 * hc + 8; o.push("4) Winter: PaCO₂ esperada " + nf(w - 2, 0) + "–" + nf(w + 2, 0) + " → " + (co > w + 2 ? "<b class='warn'>acidose respiratória associada</b>" : co < w - 2 ? "<b class='warn'>alcalose respiratória associada</b>" : "compensação adequada")); }
        if (prim === "met_alc") { var e = 0.7 * hc + 21; o.push("4) PaCO₂ esperada ≈ " + nf(e, 0) + " (±2)" + (Math.abs(co - e) > 2 ? " → <b class='warn'>distúrbio respiratório associado</b>" : " — adequada")); }
        if (prim === "resp_ac") o.push("4) HCO₃⁻ esperado: aguda " + nf(24 + (co - 40) / 10, 1) + " / crônica " + nf(24 + 3.5 * (co - 40) / 10, 1));
        if (prim === "resp_alc") o.push("4) HCO₃⁻ esperado: aguda " + nf(24 - 2 * (40 - co) / 10, 1) + " / crônica " + nf(24 - 5 * (40 - co) / 10, 1));
        if (na && cl) { var ag = na - (cl + hc), agc = al ? ag + 2.5 * (4 - al) : ag; o.push("5) <b>Ânion gap " + nf(ag, 0) + "</b>" + (al ? " · corrigido p/ albumina " + nf(agc, 1) : "") + " (normal 8–12) → " + (agc > 12 ? "<b>AG elevado — MUDPILES</b>" : "AG normal — hiperclorêmica (HARDUPS)")); if (agc > 12) { var dd = (agc - 12) / (24 - hc); o.push("Delta/delta = " + nf(dd, 2) + " → " + (dd < 1 ? "acidose AG normal associada" : dd > 2 ? "alcalose metabólica associada" : "AG puro")); } }
      } else o.push("Preencha pH, PaCO₂ e HCO₃⁻.");
      if (na && gl != null && ur != null) { var osm = 2 * na + gl / 18 + ur / 6; o.push("Osmolalidade calculada <b>" + nf(osm, 0) + "</b>" + (om ? " · gap osmolar " + nf(om - osm, 0) + (om - osm > 10 ? " — <b class='warn'>toxina não medida (metanol, etilenoglicol)</b>" : "") : "")); }
      return o.join("<br>");
    });
    var cau = el("div", { class: "cd" }, el("h3", { text: "Causas" }), [["MUDPILES (AG elevado)", "Metanol/Metformina, Uremia, Cetoacidose (diabética, alcoólica, jejum), Paracetamol/Propofol, Isoniazida/Ferro, Lactato, Etilenoglicol, Salicilatos"], ["HARDUPS (AG normal)", "Hiperalimentação, Acidose tubular renal/Acetazolamida, Diarreia (Renal/intestinal), Diluição por SF, Ureterossigmoidostomia, Pós-hipocapnia, Solução salina em excesso"], ["Alcalose metabólica", "Vômitos/SNG, diuréticos, hipocalemia, Cushing, hiperaldosteronismo"], ["Acidose respiratória", "Aguda: opioides, sedativos, miastenia, Guillain-Barré, obstrução. Crônica: DPOC, obesidade-hipoventilação, cifoescoliose"], ["Alcalose respiratória", "Ansiedade, dor, hipoxemia, TEP, sepse, VM excessiva, febre, gestação, altitude, salicilatos (inicial)"]].map(function (m) { return el("details", {}, el("summary", { text: m[0] }), el("p", { text: m[1] })); }));
    return [el("div", { class: "g3" }, c, cau)];
  }

  // ---- 7. Procedimentos ----
  var PROC = [
    ["Acesso venoso central", ["Jugular interna: triângulo de Sedillot, guiado por ultrassom, técnica de Seldinger", "Subclávia: infraclavicular, junção terço médio-medial; risco de pneumotórax", "Femoral: medial à artéria (NAVEL); maior risco de infecção", "Checklist: higiene das mãos, clorexidina, barreira máxima, campo amplo, RX de posição (junção cavoatrial), descarte de perfurocortantes"]],
    ["Punção lombar", ["Indicações: meningite, HSA com TC normal, HIC idiopática", "Contraindicações: efeito de massa/HIC com desvio, coagulopatia grave (plaquetas < 50 mil, INR > 1,5), infecção no local", "Técnica: decúbito lateral fetal ou sentado, L3-L4/L4-L5 (linha das cristas ilíacas), bisel paralelo às fibras", "Líquor: celularidade, proteína, glicose (com glicemia), Gram, cultura, PCR, pressão de abertura"]],
    ["Toracocentese e drenagem torácica", ["Toracocentese guiada por US, borda superior da costela, até 1.500 mL", "Critérios de Light (exsudato se ≥ 1): proteína P/S > 0,5; LDH P/S > 0,6; LDH > 2/3 do limite sérico", "Dreno: pneumotórax 2º EIC LHC ou triângulo de segurança; derrame/hemotórax 5º–6º EIC LAM; selo d'água", "Complicações: lesão intercostal, laceração pulmonar, edema de reexpansão"]],
    ["Paracentese abdominal", ["Indicações: ascite volumosa, suspeita de PBE", "Ponto: QIE, lateral ao reto, técnica em Z", "Líquido: celularidade (PMN ≥ 250 = PBE), cultura em frasco, GASA (≥ 1,1 = hipertensão portal)", "Terapêutica > 5 L: albumina 6–8 g por litro retirado"]],
    ["Cricotireoidostomia de emergência", ["Indicação: não intubo, não oxigeno", "Cirúrgica: bisturi–bougie–tubo 6,0 com cuff, incisão sobre a membrana cricotireóidea", "Por punção (Seldinger): agulha, fio-guia, dilatador, cânula", "Complicações: sangramento, enfisema, falso trajeto, estenose tardia"]],
    ["Pericardiocentese", ["Indicação: tamponamento com instabilidade", "Subxifóidea guiada por eco, 45°, em direção ao ombro esquerdo", "ECG na agulha: supra de ST = contato miocárdico, recuar", "Deixar cateter (pigtail) e enviar líquido para análise"]],
    ["Cardioversão elétrica sincronizada", ["Taquiarritmia instável com pulso: FA, flutter, TSV, TV", "Sedação: propofol, etomidato ou midazolam + fentanil", "Energia (bifásico): FA 120–200 J; flutter 50–100 J; TSV 50–100 J; TV monomórfica 100 J; pediatria 0,5–1 J/kg → 2 J/kg", "Botão SYNC ligado — reativar após cada choque; nunca sincronizar FV/TV polimórfica"]],
    ["Acesso intraósseo", ["Indicações: emergência sem acesso venoso em 90 s", "Locais: tíbia proximal (2 cm abaixo e medial à tuberosidade), úmero proximal (adulto), tíbia distal", "Dispositivos: manual, EZ-IO, BIG; confirmar por aspiração e infusão sem extravasamento", "Infunde tudo que vai IV, com mesma farmacocinética; flush 10 mL; retirar em até 24 h"]]
  ];
  function procs() { return [el("div", { class: "cd" }, el("h3", { text: "Procedimentos — passo a passo" }), PROC.map(function (p) { return el("details", {}, el("summary", { text: p[0] }), el("ol", {}, p[1].map(function (t) { return el("li", { text: t }); }))); }), el("p", { class: "disc", text: "Ilustrações anatômicas e vídeos: previstos em fase posterior do roadmap." }))]; }

  var TABS = [["inf", "Diluições e infusões", infusoes], ["tox", "Intoxicações e antídotos", intox], ["vm", "Ventilação mecânica", vent], ["sir", "Intubação (SIR)", sir], ["pal", "Cuidados paliativos", paliat], ["gas", "Gasometria", gaso], ["proc", "Procedimentos", procs]];
  function boxOpen(tab) {
    if (document.getElementById("psxB-box")) return;
    var sh = shell("psxB-box", "🧰 Box de Emergência", el("button", { id: "psxB-pcrbtn", class: "btn sm", type: "button", text: "❤ PCR", onclick: pcrOpen }));
    var tabs = el("div", { class: "tabs", role: "tablist" }), body = el("div", { style: "display:grid;gap:12px" });
    function go(k) { localStorage.setItem("psx.box.tab", k); tabs.querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-selected", b.dataset.k === k ? "true" : "false"); }); body.textContent = ""; var t = TABS.find(function (x) { return x[0] === k; }) || TABS[0]; t[2]().forEach(function (n) { body.appendChild(n); }); }
    TABS.forEach(function (t) { tabs.appendChild(el("button", { class: "btn sm", type: "button", role: "tab", "data-k": t[0], text: t[1], onclick: function () { go(t[0]); } })); });
    var p = peso();
    sh.main.append(tabs, el("div", { class: "disc", text: (p ? "Peso do atendimento: " + p + " kg (preenchido automaticamente). " : "Sem peso no atendimento — informe nos campos. ") + "Conteúdo de apoio gerado por IA (AHA, ATLS, ARDSnet, SCCM) — confira doses e adapte ao protocolo da instituição." }), body);
    go(tab || localStorage.getItem("psx.box.tab") || "inf");
    log({ tipo: "acesso_box", motivo: "Box de Emergência" });
  }

  /* ---------- pontos de acesso ---------- */
  function inject() {
    var eh = document.querySelector("#psxEmerg header");
    if (eh && !eh.querySelector("#psxB-pcrE")) { var anchor = eh.querySelector("#psxE-pause"); var a = el("button", { id: "psxB-pcrE", class: "btn sm", type: "button", style: "background:var(--bad);color:#fff;border-color:var(--bad);font-weight:800;font-size:16px", text: "❤ PCR", onclick: pcrOpen }); var b = el("button", { id: "psxB-boxE", class: "btn sm", type: "button", text: "🧰 Box de Emergência", onclick: function () { boxOpen(); } }); anchor.after(a, b); }
    var top = document.querySelector(".top"), tg = document.getElementById("psxE-toggle");
    if (top && tg && !document.getElementById("psxB-boxT")) tg.after(el("button", { id: "psxB-boxT", class: "btn sm", type: "button", title: "Box de Emergência (Ctrl+Shift+B)", text: "🧰 Box", onclick: function () { boxOpen(); } }));
  }
  inject(); new MutationObserver(inject).observe(document.body, { childList: true, subtree: true });
  document.addEventListener("keydown", function (e) { if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "b") { e.preventDefault(); boxOpen(); } if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "p") { e.preventDefault(); pcrOpen(); } });
  window.PSX_BOX = { open: boxOpen, pcr: pcrOpen };
})();
