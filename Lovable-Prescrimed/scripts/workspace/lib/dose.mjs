/* Posologia em texto livre (pt-BR) -> dose estruturada.
   Regra: o parser nunca inventa. Se nao interpreta, devolve status "falha",
   e o texto original continua sendo a fonte da prescricao. */

const UNID = ["mg/kg/dia", "mcg/kg/min", "mg/kg", "mcg/kg", "mg", "mcg", "\u00b5g", "g", "UI", "mL", "L/min", "gotas", "jatos", "%"];

export function limpar(v) {
  return String(v == null ? "" : v)
    .replace(/\u00a0/g, " ")
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function num(s) {
  const n = Number(String(s).replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function capitalizar(s) {
  const t = limpar(s);
  if (!t) return "";
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function semPontoFinal(s) {
  return limpar(s).replace(/[.;,]+$/, "");
}

/* ---- frequencia ---- */
function lerFrequencia(t) {
  let m;
  if ((m = t.match(/\b(\d{1,2})\s*\/\s*(\d{1,2})\s*h\b/))) return { h: Number(m[2]), texto: m[0] };
  if ((m = t.match(/de\s+(\d{1,2})\s+em\s+(\d{1,2})\s*h/))) return { h: Number(m[2]), texto: m[0] };
  if ((m = t.match(/a cada\s+(\d{1,3})(?:\s*-\s*(\d{1,3}))?\s*(min|minutos?|h|horas?)/i))) {
    const un = /min/i.test(m[3]) ? "min" : "h";
    return { h: un === "h" ? Number(m[1]) : null, texto: m[0], min: un === "min" ? Number(m[1]) : null };
  }
  if ((m = t.match(/(\d{1,2})\s*x\s*\/?\s*dia/i))) return { h: Math.round(24 / Number(m[1])), texto: m[0] };
  if ((m = t.match(/(\d{1,2})\s*vez(?:es)?\s*(?:ao|por)\s*dia/i))) return { h: Math.round(24 / Number(m[1])), texto: m[0] };
  if (/uma vez ao dia|1 vez ao dia|dose unica|dose \u00fanica/i.test(t)) return { h: 24, texto: "1 vez ao dia" };
  return { h: null, texto: null };
}

/* ---- duracao ---- */
function lerDuracao(t) {
  let m;
  if (/dose \u00fanica|dose unica/i.test(t)) return { dias: 0, texto: "dose \u00fanica" };
  if ((m = t.match(/(?:por|durante)\s+(\d{1,2})\s+dias?/i))) return { dias: Number(m[1]), texto: m[0] };
  if ((m = t.match(/\b(\d{1,2})\s+dias?\b/i))) return { dias: Number(m[1]), texto: m[0] };
  if (/at\u00e9\s+(?:a\s+)?(?:estabiliza|\w+)/i.test(t)) return { dias: null, texto: "at\u00e9 estabiliza\u00e7\u00e3o" };
  return { dias: null, texto: null };
}

/* ---- dose ---- */
export function parseDose(textoBruto) {
  const original = limpar(textoBruto);
  const out = {
    texto: original,
    status: "falha",
    valor: null,
    valor_max: null,
    unidade: null,
    por_kg: false,
    por_min: false,
    por_h: false,
    dose_maxima: null,
    ped: null,
    freq_h: null,
    freq_texto: null,
    freq_min: null,
    duracao_dias: null,
    duracao_texto: null,
    motivos: [],
  };
  if (!original) { out.motivos.push("texto vazio"); return out; }

  let principal = original;
  let ped = null;
  const pedMatch = principal.match(/(?:crian[c\u00e7]a|pedi[a\u00e1]tric\w*|lactente)[^.;]*/i);
  if (pedMatch) {
    ped = limpar(pedMatch[0]);
    principal = limpar(principal.replace(pedMatch[0], " "));
  }
  let maxMatch = principal.match(/m[a\u00e1]xim\w*\s*(?:de\s*)?([\d.,]+)\s*(mg|mcg|g|UI|mL)/i);
  if (!maxMatch) maxMatch = original.match(/m[a\u00e1]x\.?\s*(?:de\s*)?([\d.,]+)\s*(mg|mcg|g|UI|mL)/i);
  if (maxMatch) {
    const v = num(maxMatch[1]);
    if (v != null) out.dose_maxima = { valor: v, unidade: maxMatch[2] };
  }

  const un = UNID.join("|");
  const faixa = new RegExp("([\\d.,]+)\\s*(?:-|a|at\\u00e9)\\s*([\\d.,]+)\\s*(" + un + ")", "i");
  const unica = new RegExp("([\\d.,]+)\\s*(" + un + ")", "i");
  let m = principal.match(faixa) || principal.match(unica);
  if (m) {
    if (m.length === 4) {
      out.valor = num(m[1]);
      out.valor_max = num(m[2]);
      out.unidade = m[3].toLowerCase();
    } else {
      out.valor = num(m[1]);
      out.unidade = m[2].toLowerCase();
    }
    if (out.unidade === "\u00b5g") out.unidade = "mcg";
    out.por_kg = /\/\s*kg/i.test(m[0]) || /\/\s*kg/i.test(principal);
    out.por_min = /\/\s*min/i.test(m[0]) || /\/\s*min/i.test(principal);
    out.por_h = /\/\s*h\b/i.test(m[0]);
    out.status = out.valor == null ? "falha" : "ok";
  } else {
    out.motivos.push("sem valor numerico com unidade");
  }

  const f = lerFrequencia(original);
  out.freq_h = f.h;
  out.freq_texto = f.texto;
  out.freq_min = f.min || null;
  const d = lerDuracao(original);
  out.duracao_dias = d.dias;
  out.duracao_texto = d.texto;
  if (ped) out.ped = ped;

  if (out.status === "ok" && !out.freq_h && !out.freq_texto && !out.duracao_dias) {
    out.motivos.push("sem frequencia nem duracao reconhecida");
  }
  return out;
}

/* ---- composicao do texto da prescricao ---- */
export function comporPos(med) {
  const partes = [];
  const dose = semPontoFinal(med.dose);
  if (dose) partes.push(capitalizar(dose));
  const via = semPontoFinal(med.via);
  const viaCurta = (via.match(/\b(VO|IV|IM|SC|EV|SL|SC)\b/i) || [])[1] || "";
  const doseJaDizVia = viaCurta && new RegExp("\\b" + viaCurta + "\\b", "i").test(dose);
  if (via && !doseJaDizVia) partes.push(/^via\b/i.test(via) ? capitalizar(via) : "Via " + via);
  else if (via && via.length > viaCurta.length + 12 && !doseJaDizVia) partes.push(capitalizar(via));
  const freq = semPontoFinal(med.frequencia);
  if (freq) partes.push(capitalizar(freq));
  const dur = semPontoFinal(med.duracao);
  if (dur) partes.push(capitalizar(dur));
  const inf = semPontoFinal(med.tempo_infusao);
  if (inf && !/^n\u00e3o se aplica|nao se aplica/i.test(inf)) partes.push(capitalizar(inf));

  const vistos = new Set();
  const unicas = partes.filter((p) => {
    const k = p.toLowerCase();
    if (vistos.has(k)) return false;
    vistos.add(k);
    return true;
  });
  let texto = unicas.join(". ").replace(/\.\s*\./g, ".").replace(/\s+/g, " ").trim();
  if (!/[.!?]$/.test(texto)) texto += ".";
  if (texto.length > 600) {
    const corte = texto.slice(0, 600);
    const ultimo = Math.max(corte.lastIndexOf(". "), corte.lastIndexOf("; "));
    texto = (ultimo > 200 ? corte.slice(0, ultimo) : corte).trim() + " \u2026";
  }
  return texto;
}

/* ---- nome de classe terap\u00eautica ---- */
const TOKENS = {
  aine: "AINE", ibp: "IBP", h1: "H1", h2: "H2", isrs: "ISRS", irsn: "IRSN", iv: "IV",
  analgesico: "analg\u00e9sico", antitermico: "antit\u00e9rmico", corticoide: "corticoide",
  opioide: "opioide", benzodiazepinico: "benzodiazep\u00ednico", anestesico: "anest\u00e9sico",
  cristaloide: "cristaloide", penicilina: "penicilina", inibidor: "inibidor",
  betalactamase: "betalactamase", vitamina: "vitamina", lincosamida: "lincosamida",
  imunoglobulina: "imunoglobulina", betabloqueador: "betabloqueador", macrolideo: "macrol\u00eddeo",
  eletrolito: "eletr\u00f3lito", antibiotico: "antibi\u00f3tico", topico: "t\u00f3pico",
  tetraciclina: "tetraciclina", histaminico: "histam\u00ednico", nitroimidazol: "nitroimidazol",
  antiviral: "antiviral", fraco: "fraco", cefalosporina: "cefalosporina",
  antidepressivo: "antidepressivo", triciclico: "tric\u00edclico", antipsicotico: "antipsic\u00f3tico",
  atipico: "at\u00edpico", fluoroquinolona: "fluoroquinolona", anticonvulsivante: "anticonvulsivante",
  antiagregante: "antiagregante", plaquetario: "plaquet\u00e1rio", geracao: "gera\u00e7\u00e3o",
  antiemetico: "antiem\u00e9tico", imunobiologico: "imunobiol\u00f3gico",
  antifibrinolitico: "antifibrinol\u00edtico", antidoto: "ant\u00eddoto",
  aminoglicosideo: "aminoglicos\u00eddeo", vasopressor: "vasopressor", diuretico: "diur\u00e9tico",
  alca: "de al\u00e7a", sistemico: "sist\u00eamico", inalatorio: "inalat\u00f3rio",
  broncodilatador: "broncodilatador", antiarritmico: "antiarr\u00edtmico", antiarritimico: "antiarr\u00edtmico",
  vasodilatador: "vasodilatador", antitrombotico: "antitromb\u00f3tico", heparina: "heparina",
  anticoagulante: "anticoagulante", trombolitico: "trombol\u00edtico", inotropico: "inotr\u00f3pico",
  sedativo: "sedativo", relaxante: "relaxante", muscular: "muscular", antiacido: "anti\u00e1cido",
  procinetico: "procin\u00e9tico", laxante: "laxante", antifungico: "antif\u00fangico",
  antiparasitario: "antiparasit\u00e1rio", escabicida: "escabicida", pediculicida: "pediculicida",
  emoliente: "emoliente", queratolitico: "queratol\u00edtico", fotoprotetor: "fotoprotetor",
  oftalmico: "oft\u00e1lmico", otologico: "otol\u00f3gico", nasal: "nasal", bucal: "bucal",
  subcutaneo: "subcut\u00e2neo", intramuscular: "intramuscular", intravenoso: "intravenoso",
  inalatoria: "inalat\u00f3ria", nebulizacao: "nebuliza\u00e7\u00e3o", oxigenio: "oxig\u00eanio",
  solucao: "solu\u00e7\u00e3o", salina: "salina", glicosado: "glicosado", potassio: "pot\u00e1ssio",
  calcio: "c\u00e1lcio", magnesio: "magn\u00e9sio", sodio: "s\u00f3dio", bicarbonato: "bicarbonato",
  hormonal: "hormonal", tireoidiano: "tireoidiano", hipoglicemiante: "hipoglicemiante",
  insulina: "insulina", corticosteroide: "corticosteroide", imunossupressor: "imunossupressor",
  antagonista: "antagonista", agonista: "agonista", muscarinico: "muscar\u00ednico",
  curta: "curta", acao: "a\u00e7\u00e3o", longa: "longa", beta2: "beta-2", adrenergico: "adren\u00e9rgico",
  simpatomimetico: "simpatomim\u00e9tico", parassimpatolitico: "parassimpatol\u00edtico",
  antiinflamatorio: "anti-inflamat\u00f3rio",
  nao: "n\u00e3o", esteroide: "esteroide", hormonal: "hormonal",
};

export function humanizarClasse(chave) {
  const k = limpar(chave).toLowerCase();
  if (!k) return "Outros";
  const partes = k.split(/[_\s]+/).filter(Boolean);
  const saida = [];
  for (let i = 0; i < partes.length; i++) {
    const p = partes[i];
    if (p === "anti" && i + 1 < partes.length) {
      const prox = TOKENS[partes[i + 1]] || partes[i + 1];
      saida.push("anti-" + prox);
      i++;
      continue;
    }
    saida.push(TOKENS[p] || p);
  }
  const texto = saida.join(" ").replace(/\s+/g, " ").trim();
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}
