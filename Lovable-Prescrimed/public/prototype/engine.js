/* Motor de doses (receita VO/alta) extraído do Laudo APAC Express — puro, sem DOM.
   Engine.calc(drugId, sel) usa o paciente atual de Engine.setPatient({peso, idadeM, perfil, gest}). */
(function () {
  "use strict";
  var D = window.PROTO_DB;
  var fold = function (s) { return String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(); };
  var nf = function (x, d) { return Number(x).toLocaleString("pt-BR", { maximumFractionDigits: d == null ? 2 : d }); };
  var P = { peso: null, idadeM: null, perfil: "auto", gest: false };
  function PT() { return P; }
  var pesoN = function () { var v = parseFloat(String(P.peso == null ? "" : P.peso).replace(",", ".")); return v > 0 && v < 400 ? v : null; };
  var ageM = function () { return P.idadeM == null || P.idadeM === "" || isNaN(+P.idadeM) ? null : +P.idadeM; };
  function perfil() {
    if (P.perfil === "adulto" || P.perfil === "ped") return P.perfil;
    var a = ageM(); if (a != null) return a < 144 ? "ped" : "adulto";
    var w = pesoN(); if (w != null && w < 40) return "ped";
    return "adulto";
  }
  /* ------------------------- cálculo de doses ------------------------- */
  function freqTxt(h) { return h >= 24 ? "1 vez ao dia" : "de " + h + " em " + h + " horas"; }
  function unitNoun(ap, n) {
    var a = fold(ap), base = /capsula/.test(a) ? "cápsula" : /sache|granulado|envelope/.test(a) ? "envelope" : /dragea/.test(a) ? "drágea" : "comprimido";
    if (n === 0.5) return "meio " + (base === "cápsula" || base === "drágea" ? base : base);
    var w = n % 1 ? (Math.floor(n) + " " + base + (Math.floor(n) > 1 ? "s" : "") + " e meio") : (n + " " + base + (n > 1 ? "s" : ""));
    return w;
  }
  function roundVol(v) { var st = v < 2 ? 0.1 : v < 10 ? 0.5 : 1; return Math.max(st, Math.round(v / st) * st); }

  function pedCalc(dr, sel, adultoPorPeso) {
    var p = dr.p, w = pesoN(), a = ageM(), out = { warn: [] };
    if (dr.tipo === "hidr") return hidr(dr, true);
    if (!p) return { ok: false, err: "Sem esquema pediátrico cadastrado (uso não recomendado ou sem dados nesta base)." };
    if (p.min && !adultoPorPeso && a != null && a < p.min) return { ok: false, err: "Uso a partir de " + (p.min >= 24 ? nf(p.min / 12, 0) + " anos" : p.min + " meses") + "." };
    if (p.min && !adultoPorPeso && a == null) out.warn.push("Informe a idade (mínimo " + (p.min >= 24 ? nf(p.min / 12, 0) + " anos" : p.min + " meses") + ").");
    if (p.same) { var rs = adultCalc(dr, sel); if (rs.ok) rs.warn = out.warn.concat(rs.warn || []); return rs; }
    var via = p.via || dr.via || "Uso oral";
    if (p.fix) {
      if (dr.n.indexOf("oseltamivir") >= 0 || p.menor1ano) {
        if (a != null && a < 12) {
          if (!w) return { ok: false, err: "Informe o peso (< 1 ano: dose por kg)." };
          var mgk = a >= 9 ? 3.5 : 3, mg = Math.round(w * mgk);
          return { ok: true, med: dr.n + " 30 mg cápsula", q: "10 cápsulas", via: via, pos: "Dar " + mg + " mg de 12 em 12 horas por 5 dias (preparar a partir da cápsula de 30 mg conforme orientação da farmácia — protocolo MS).", det: mgk + " mg/kg × " + nf(w, 1) + " kg = " + mg + " mg/dose", warn: out.warn };
        }
      }
      var key = p.fix === "peso" ? w : a;
      if (key == null) return { ok: false, err: p.fix === "peso" ? "Informe o peso." : "Informe a idade." };
      var b = p.faixas.find(function (f) { return key < f.ate || (p.fix === "peso" && key <= f.ate); });
      if (!b) return { ok: false, err: "Fora das faixas cadastradas." };
      if (b.err) return { ok: false, err: b.err };
      return { ok: true, med: dr.n + " " + String(b.ap || p.ap).split(" — ")[0], q: b.q || p.q, via: via, pos: b.t, det: "Faixa por " + p.fix, warn: out.warn };
    }
    if (p.tipo === "jatos" || p.tipo === "gotasKg") {
      if (!w) return { ok: false, err: "Informe o peso." };
      var n = Math.min(p.max, Math.max(p.min, Math.round(w / p.porKg)));
      var t = p.tipo === "jatos" ? "Inalar " + n + " " + p.t : "Nebulizar " + n + " gotas " + p.t;
      return { ok: true, med: dr.n + " " + p.ap, q: p.q, via: via, pos: t, det: "1 " + (p.tipo === "jatos" ? "jato" : "gota") + " a cada " + p.porKg + " kg (mín. " + p.min + ", máx. " + p.max + ") → " + n, warn: out.warn };
    }
    if (!w) return { ok: false, err: "Informe o peso." };
    var reg = p.reg.find(function (r) { return r.id === sel.reg; }) || p.reg[0];
    var forms = p.f.filter(function (f) { return !reg.f || reg.f.indexOf(f.id) >= 0; });
    var dias = reg.dias ? (sel.dias != null && reg.dias.indexOf(+sel.dias) >= 0 ? +sel.dias : reg.dias[0]) : 0;
    var perDay = reg.n || 24 / reg.h, raw = reg.mgkg != null ? reg.mgkg * w : reg.mgkgdia * w / perDay;
    var dose = Math.min(raw, reg.max), capped = raw > reg.max + 1e-9;
    function amt(form) {
      var o = {};
      if (form.tipo === "liq" && form.gt) {
        var g = Math.max(1, Math.round(dose / form.gt)); while (g > 1 && g * form.gt > reg.max + 1e-9) g--;
        o.mgReal = g * form.gt; o.amount = g + (g > 1 ? " gotas" : " gota"); o.unitsPerDose = g * form.gt / form.c;
      } else if (form.tipo === "liq") {
        var v = roundVol(dose / form.c); var stp = v < 2 ? 0.1 : v < 10 ? 0.5 : 1;
        while (v - stp > 0 && v * form.c > reg.max * 1.001) v = Math.round((v - stp) * 10) / 10;
        o.mgReal = v * form.c; o.amount = nf(v, 1) + " mL"; o.unitsPerDose = v;
      } else {
        var u = form.split ? Math.max(0.5, Math.round(dose / form.mg * 2) / 2) : Math.max(1, Math.round(dose / form.mg));
        while (u > (form.split ? 0.5 : 1) && u * form.mg > reg.max * 1.001) u -= form.split ? 0.5 : 1;
        o.mgReal = u * form.mg; o.amount = unitNoun(form.ap, u); o.unitsPerDose = u;
      }
      o.dev = Math.abs(o.mgReal - dose) / dose; o.vol = form.tipo === "liq" && !form.gt ? o.unitsPerDose : 0; o.big = o.vol > 20; return o;
    }
    var form = forms.find(function (f) { return f.id === sel.form; }), auto = !form;
    if (!form) { form = forms.find(function (f) { var o = amt(f); return o.dev <= 0.2 && !o.big; }) || forms.find(function (f) { return amt(f).dev <= 0.2; }) || forms.slice().sort(function (x, y) { return amt(x).dev - amt(y).dev; })[0]; }
    var A0 = amt(form), amount = A0.amount, mgReal = A0.mgReal, unitsPerDose = A0.unitsPerDose, qtd;
    if (A0.dev > (reg.tol || 0.5)) return { ok: false, err: "Nenhuma dose segura com " + form.ap.split(" — ")[0] + ": " + amount + " = " + nf(mgReal, 0) + " mg para dose calculada de " + nf(dose, 1) + " mg (" + Math.round(A0.dev * 100) + "% de diferença)." + (forms.length > 1 ? " Escolha outra apresentação." : " Usar outro fármaco ou formulação manipulada."), form: form, forms: forms, reg: reg };
    var nDoses = dias ? perDay * dias + (/dobro/.test(reg.cond || "") ? 1 : 0) : 0;
    if (dias) {
      if (/injet/.test(fold(form.ap))) { var na = Math.ceil(nDoses); qtd = na + (na > 1 ? " frascos-ampola" : " frasco-ampola"); }
      else if (form.tipo === "liq") { var tot = unitsPerDose * nDoses, fr = Math.max(1, Math.ceil(tot / form.vol)); qtd = fr + (fr > 1 ? " frascos" : " frasco") + " de " + nf(form.vol, 1) + " mL"; }
      else { var nu = Math.ceil(unitsPerDose * nDoses); qtd = nu + " " + (/capsula/.test(fold(form.ap)) ? "cápsulas" : /sache|granulado|envelope/.test(fold(form.ap)) ? "envelopes" : "comprimidos"); }
    } else qtd = form.tipo === "liq" ? "1 frasco" + (form.vol ? " de " + nf(form.vol, 1) + " mL" : "") : "1 caixa";
    var rvia = reg.via || via, verb = /intramuscular/i.test(rvia) ? "Aplicar" : "Dar";
    var U = form.un || "mg";
    var pos = verb + " " + amount + (form.un ? "" : " (" + nf(mgReal, mgReal < 10 ? 2 : 0) + " mg)") + (/intramuscular/i.test(rvia) ? " por via intramuscular" : "") + " " + (reg.ftxt || freqTxt(reg.h)) + (reg.cond ? " " + reg.cond : "") + (dias ? " por " + dias + (dias > 1 ? " dias" : " dia") : "") + ".";
    var det = (reg.mgkg != null ? nf(reg.mgkg) + " " + U + "/kg/dose" : nf(reg.mgkgdia) + " " + U + "/kg/dia ÷ " + perDay) + " × " + nf(w, 1) + " kg = " + nf(raw, 1) + " " + U + (capped ? " → teto " + nf(reg.max) + " " + U + "/dose" : "") + " → " + amount + (form.un ? "" : " (" + nf(mgReal, 2) + " mg)");
    var dev = A0.dev; if (A0.big) out.warn.push("Volume alto por dose (" + nf(A0.vol, 1) + " mL) — prefira outra apresentação."); if (auto && forms.length > 1 && form !== forms[0]) out.warn.push("Apresentação escolhida automaticamente pela melhor aproximação de dose."); if (dev > 0.2) out.warn.push("Arredondamento da apresentação: " + Math.round(dev * 100) + "% de diferença da dose calculada — considere outra apresentação.");
    return { ok: true, med: dr.n + " " + form.ap.split(" — ")[0].replace(/ \(dose em [^)]*\)/, ""), q: qtd, via: rvia, pos: pos, det: det, warn: out.warn, reg: reg, form: form, forms: forms, dias: dias };
  }
  function hidr(dr, ped) {
    var w = pesoN(); if (!w) return { ok: false, err: "Informe o peso." };
    var ml;
    if (!ped) ml = 60 * w; else ml = w <= 10 ? 130 * w : w <= 20 ? 100 * w : 80 * w;
    var L = Math.round(ml / 100) / 10, sro = Math.round(ml / 3 / 50) * 50;
    return { ok: true, med: "Hidratação oral", q: "—", via: "Uso oral",
      pos: "Beber cerca de " + nf(L, 1) + " litros de líquidos por dia (" + nf(ml, 0) + " mL): cerca de " + nf(sro, 0) + " mL em soro de reidratação oral e o restante em água, sucos, chás e água de coco. Beber aos poucos, ao longo do dia, e aumentar se tiver febre ou vômitos.",
      det: (ped ? (w <= 10 ? "130" : w <= 20 ? "100" : "80") : "60") + " mL/kg/dia × " + nf(w, 1) + " kg = " + nf(ml, 0) + " mL/dia; 1/3 em SRO" };
  }
  function adultCalc(dr, sel) {
    if (dr.tipo === "hidr") return hidr(dr, false);
    if (!dr.a || !dr.a.length) return { ok: false, err: "Sem apresentação adulta cadastrada (uso pediátrico)." };
    var ap = dr.a[sel.ai || 0] || dr.a[0], pos = ap.pos[sel.pi || 0] || ap.pos[0];
    return { ok: true, med: dr.n + " " + ap.ap, q: pos.q || ap.q, via: ap.via || dr.via || "Uso oral", pos: pos.t, det: "" };
  }
  /* exames: troca automática entre códigos SIGTAP de população geral e de gestante */
  var GEST_MAP = { "0214010058": "0214010040", "0214010074": "0214010082", "0202031110": "0202031179", "0202031446": "0202031454", "0202031470": "0202031489", "0202031500": "0202031519" };
  function gestCode(c) { if (PT().gest) return GEST_MAP[c] || c; for (var g in GEST_MAP) if (GEST_MAP[g] === c) return g; return c; }
  function calc(id, sel) {
    var r = calc0(id, sel), dr = D.drugs[id];
    if (dr.notif && r.ok) return { ok: false, notif: true, err: "Exige Notificação de Receita " + dr.notif + " (talonário numerado da Vigilância) — o app não imprime. Prescrever no talonário: " + r.med + " — " + r.pos + " Quantidade: " + r.q + "." };
    if (PT().gest && r.ok) {
      if (dr.gx) return { ok: false, err: "Contraindicado na gestação: " + dr.gx };
      if (dr.gc) r.warn = (r.warn || []).concat(["Gestação: " + dr.gc]);
    }
    return r;
  }
  /* insulina NPH por peso (adulto): 0,1–0,2 UI/kg/dia, ao deitar ou 2/3 manhã + 1/3 noite, com titulação pela glicemia de jejum */
  var INS_UKG = [[0.1, "0,1 UI/kg — idoso, DRC, magro ou risco de hipoglicemia"], [0.15, "0,15 UI/kg — padrão"], [0.2, "0,2 UI/kg — obeso, glicemia muito alta / HbA1c > 10%"]];
  var INS_ESQ = [["noite", "dose única às 22 h (bedtime)"], ["2x", "2/3 antes do café + 1/3 às 22 h"]];
  function insCalc(dr, sel) {
    var w = pesoN(), ukg = +(sel.ukg || 0.1), esq = sel.esq || "noite";
    var tot = Math.max(4, Math.round(w * ukg)), apI = sel.ai || 0, ap = dr.a[apI] || dr.a[0], pen = /caneta/.test(fold(ap.ap)), warn = [];
    var ajuste = " Medir a glicemia em jejum todos os dias: se acima de 130 por 3 dias seguidos, aumentar 2 unidades (4 unidades se acima de 180); se abaixo de 80 ou se tiver hipoglicemia, diminuir 4 unidades. Reavaliar na UBS em até 7 dias.";
    var pos, inj;
    if (esq === "2x") {
      var m = Math.round(tot * 2 / 3), n = tot - m; inj = 2;
      pos = "Aplicar " + m + " unidades de insulina NPH por via subcutânea 30 minutos antes do café da manhã e " + n + " unidades às 22 horas." + ajuste.replace("aumentar 2 unidades", "aumentar 2 unidades na dose das 22 h") + " Glicemia antes do jantar acima de 130: aumentar 2 unidades na dose da manhã.";
    } else {
      inj = 1; pos = "Aplicar " + tot + " unidades de insulina NPH por via subcutânea às 22 horas." + ajuste;
      if (tot > 30) warn.push("Dose noturna > 30 UI: considere dividir em 2 aplicações (2/3 manhã + 1/3 noite).");
    }
    var mes = tot * 30 + (pen ? 2 * inj * 30 : 0), q = pen ? Math.ceil(mes / 300) + (Math.ceil(mes / 300) > 1 ? " canetas/refis de 3 mL" : " caneta/refil de 3 mL") : Math.max(1, Math.ceil(mes / 1000)) + (Math.ceil(mes / 1000) > 1 ? " frascos de 10 mL" : " frasco de 10 mL");
    return { ok: true, med: dr.n + " " + ap.ap, q: q + " (30 dias)", via: ap.via || dr.via, pos: pos, det: nf(ukg) + " UI/kg × " + nf(w, 1) + " kg = " + tot + " UI/dia" + (pen ? " · inclui 2 UI de purga por aplicação" : ""), warn: warn };
  }
  function calc0(id, sel) {
    var dr = D.drugs[id]; sel = sel || {};
    if (dr.ins && perfil() !== "ped" && pesoN()) return insCalc(dr, sel);
    if (perfil() === "ped") return pedCalc(dr, sel);
    if (dr.pa && dr.p && pesoN()) { var r = pedCalc(dr, sel, true); if (r.ok) r.det = (r.det ? r.det + " · " : "") + "dose por peso também no adulto"; return r; }
    if (dr.pa && (!dr.a || !dr.a.length)) return { ok: false, err: "Informe o peso (dose calculada por kg)." };
    return adultCalc(dr, sel);
  }


  window.Engine = {
    setPatient: function (o) { for (var k in o) P[k] = o[k]; },
    patient: function () { return P; }, perfil: perfil, peso: pesoN, idadeM: ageM,
    calc: calc, gestCode: gestCode, INS_UKG: INS_UKG, INS_ESQ: INS_ESQ, nf: nf, fold: fold
  };
})();
