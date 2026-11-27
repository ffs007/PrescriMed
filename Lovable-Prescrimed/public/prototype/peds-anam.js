/* Anamnese e exame físico pediátricos (< 12 anos) — extensão aditiva (origem expansao_ia — confira).
   Carregado depois de clin-data.js e antes de app.js: acrescenta grupos ao CLIN e torna os mapas
   por condição sensíveis à idade (Proxy). Só lê o paciente atual (PSAPP.test.C) na hora da renderização. */
(function () {
  "use strict";
  var CL = window.CLIN; if (!CL || !CL.ANAM || !CL.EF) return;
  var G = function (l, items, fields) { return { l: l, items: items, fields: fields || [] }; };
  var I = function (k, l, n, alt) { return { k: k, l: l, n: n, alt: alt || [] }; };

  function ageM() {
    try {
      var p = window.PSAPP.test.C().pac, v = parseFloat(String(p.idade == null ? "" : p.idade).replace(",", "."));
      if (!isNaN(v)) return p.idUn === "meses" ? v : v * 12;
    } catch (_) {}
    try { var a = window.Engine.idadeM(); if (a != null) return a; } catch (_) {}
    return null;
  }
  function child() { var a = ageM(); return a != null && a < 144; }
  window.PSX_PED = { ageM: ageM, child: child };

  /* ---------- Anamnese ---------- */
  CL.ANAM.pedhist = G("Pediátrico — história", ["pré-natal sem intercorrências", "parto a termo", "prematuridade", "intercorrências neonatais", "vacinação em dia", "vacinação atrasada", "desenvolvimento adequado para a idade", "atraso do desenvolvimento", "aleitamento materno", "alimentação adequada para a idade", "frequenta creche/escola", "contactantes doentes", "aceitação de líquidos preservada", "aceitação de líquidos reduzida", "diurese/fraldas habituais", "menos fraldas molhadas"],
    [{ k: "inf", l: "Informante (quem relata)" }, { k: "nasc", l: "Peso ao nascer / IG ao nascer" }, { k: "curva", l: "Peso atual e percentil" }]);
  CL.ANAM.pedresp = G("Pediátrico — respiratório", ["cansaço para mamar/comer", "respiração rápida", "chiado", "estridor", "tosse ladrante", "pausas respiratórias", "episódios prévios de sibilância", "uso prévio de broncodilatador"]);
  CL.ANAM.pedgi = G("Pediátrico — hidratação", ["vômitos a cada ingestão", "diarreia com sangue", "evacuações > 6/dia", "boca seca", "sem lágrimas ao chorar", "olhos fundos", "sonolência fora do habitual"]);
  CL.ANAM.pedfebre = G("Pediátrico — febre", ["febre há mais de 5 dias", "febre em menor de 3 meses", "prostração mesmo sem febre", "manchas na pele", "recusa alimentar total", "choro ao manipular"]);
  CL.ANAM.pedorl = G("Pediátrico — ouvido e garganta", ["leva a mão à orelha", "otorreia", "recusa alimentar por dor", "salivação excessiva", "voz abafada"]);

  /* ---------- Exame físico ---------- */
  CL.EF.pedsv = { l: "Pediátrico — sinais vitais e crescimento", it: [
    I("fc", "FC", "FC dentro da faixa para a idade", ["taquicárdico para a idade", "bradicárdico para a idade"]),
    I("fr", "FR", "FR dentro da faixa para a idade", ["taquipneico para a idade", "bradipneico"]),
    I("tec", "Enchimento capilar", "enchimento capilar < 2 s", ["enchimento capilar 2–3 s", "enchimento capilar > 3 s"]),
    I("cres", "Crescimento", "peso e estatura adequados para a idade", ["peso abaixo do p3", "peso acima do p97"])] };
  CL.EF.pedresp = { l: "Pediátrico — esforço respiratório", it: [
    I("esf", "Esforço", "sem tiragens, sem batimento de asa de nariz, sem gemência", ["tiragem subcostal", "tiragem intercostal", "tiragem de fúrcula", "batimento de asa de nariz", "gemência", "balanço toracoabdominal"]),
    I("ruid", "Ruídos", "sem sibilos, sem estridor", ["sibilos difusos", "estridor em repouso", "estridor ao choro", "crepitações finas"])] };
  CL.EF.pedgi = { l: "Pediátrico — grau de desidratação (OMS)", it: [
    I("grau", "Classificação", "sem desidratação (plano A)", ["algum grau de desidratação (plano B)", "desidratação grave (plano C)"])] };
  CL.EF.pedfebre = { l: "Pediátrico — sinais de toxemia", it: [
    I("tox", "Toxemia", "sem sinais de toxemia; interage e sorri", ["aspecto toxemiado", "não sorri / não interage", "petéquias abaixo da linha do mamilo", "rigidez de nuca", "fontanela abaulada"])] };
  CL.EF.pedorl = { l: "Pediátrico — otoscopia e oroscopia", it: [
    I("oto", "Otoscopia", "membranas timpânicas íntegras, translúcidas, sem abaulamento", ["MT hiperemiada e abaulada à direita", "MT hiperemiada e abaulada à esquerda", "otorreia", "MT opaca com nível"]),
    I("oro", "Oroscopia", "orofaringe sem hiperemia, amígdalas normais", ["hiperemia de orofaringe", "exsudato amigdaliano", "petéquias em palato", "vesículas/úlceras em orofaringe"])] };
  /* Estado geral com termos pediátricos (só usado no lugar de "geral" para criança). */
  CL.EF.pedgeral = { l: "Estado geral", it: [
    I("eg", "Estado geral", "Bom estado geral, ativo e reativo, choro forte e consolável", ["Regular estado geral, hipoativo", "Mau estado geral, toxemiado", "Irritado, choro inconsolável", "Letárgico"]),
    I("pele", "Pele e mucosas", "corado, hidratado, acianótico, anictérico", ["hipocorado (+/4+)", "desidratado (+/4+)", "ictérico", "cianótico", "pele moteada"])] };
  var fontNote = "fontanela avaliada até 18 meses";
  if (CL.EF.ped && CL.EF.ped.it) CL.EF.ped.it.forEach(function (it) { if (it.k === "font" && it.alt.indexOf("fechada (> 18 meses)") < 0) it.alt.push("fechada (> 18 meses)"); });
  void fontNote;

  /* ---------- Mapas sensíveis à idade ---------- */
  function extraFor(list, ef) {
    var add = [], has = function (k) { return list.indexOf(k) >= 0; };
    if (has("resp") || has("ar")) add.push("pedresp");
    if (has("gi") || has("abd")) add.push("pedgi");
    if (has("febre")) add.push("pedfebre");
    if (has("orl") || has("oro") || has("oto")) add.push("pedorl");
    return ef ? ["pedsv"].concat(add) : ["pedhist"].concat(add);
  }
  function wrap(map, ef) {
    return new Proxy(map, { get: function (t, k) {
      var v = t[k]; if (!Array.isArray(v) || !child()) return v;
      var out = v.slice();
      if (ef) { out = out.map(function (x) { return x === "geral" ? "pedgeral" : x; }); if (out.indexOf("ped") < 0) out.unshift("ped"); }
      else if (out.indexOf("ped") < 0) out.push("ped");
      extraFor(v, ef).forEach(function (x) { if (out.indexOf(x) < 0) out.push(x); });
      return out;
    } });
  }
  ["ANAM_MAP", "ANAM_MAP_CAT"].forEach(function (k) { if (CL[k]) CL[k] = wrap(CL[k], false); });
  ["EF_MAP", "EF_MAP_CAT"].forEach(function (k) { if (CL[k]) CL[k] = wrap(CL[k], true); });
})();
