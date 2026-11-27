// Gerador + validador do conteúdo clínico curado.
// Lê content/condicoes/*.json (status:"aprovado" OU --rascunho) e emite
// public/prototype/curated-core.js + curated-pkg-N.js (sob demanda; ver lovable-packages.js).
// Regras do gate: ver content/MODELO.md. Uso:
//   node scripts/content/build.mjs            → só aprovados
//   node scripts/content/build.mjs --rascunho → inclui rascunhos (com aviso no console)
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const includeDrafts = process.argv.includes("--rascunho");

/* ---- carrega dados base (mesma ordem do index.html, só dados) ---- */
const protoDir = resolve(root, "public/prototype");
const ctx = { console: { log() {}, warn() {}, error() {} } };
ctx.window = ctx; ctx.globalThis = ctx;
vm.createContext(ctx);
for (const f of ["proto-data.js","proto-data-2.js","proto-data-3.js","proto-data-4.js","proto-data-5.js","legacy-data.js","expansion-data.js","hosp-data.js","hosp-expansion.js","lovable-rxtaxonomy.js"]) {
  vm.runInContext(readFileSync(resolve(protoDir, f), "utf8"), ctx, { filename: f });
}
const D = ctx.PROTO_DB, H = ctx.HOSP_DB;

/* ---- catálogo compartilhado (para V5: base usado por >1 condição curada) ---- */
const BASE_USE = {};
const BANNED = ["carisoprodol"];
const BANNED_RE = BANNED.map(b => new RegExp(b, "i"));

const errors = [], warns = [];
const err = (c, m) => errors.push(`[${c}] ${m}`);
const warn = (c, m) => warns.push(`[${c}] ${m}`);
/* V11: mesma molecula em duas classes da MESMA secao (amb x amb / hosp x hosp).
   VO x EV e legitimo (ids diferentes); isto pega repeticao real dentro da secao. */
const duplicatas = [];

/* ---- lê condições ---- */
const condDir = resolve(root, "content/condicoes");
const files = readdirSync(condDir).filter(f => f.endsWith(".json"));
const conds = files.map(f => JSON.parse(readFileSync(resolve(condDir, f), "utf8")));

const out = { protos: [], classes: [], drugs: [], hospClasses: [], hospDrugs: [], hospMap: {} };
const digest = [];
const IDS_VISTOS = new Map(); // V10: um id de protocolo = um único arquivo-fonte
/* soma/dedup no emitter: drogas idênticas entre condições compartilham 1 id */
const SHARED = new Map();
const sharedId = (kind, d) => {
  const key = kind + "|" + JSON.stringify([d.n, d.a, d.ap || "", d.nota || "", d.via || "", d.dose || ""]);
  if (SHARED.has(key)) return SHARED.get(key);
  SHARED.set(key, d.id);
  return null;
};

for (const c of conds) {
  const id = c.id;
  if (IDS_VISTOS.has(id)) err(id, `V10: id de protocolo duplicado (já declarado em ${IDS_VISTOS.get(id)}) — uma condição = um arquivo`);
  IDS_VISTOS.set(id, "content/condicoes");
  if (c.status !== "aprovado" && !includeDrafts) { warn(id, `status "${c.status}" — fora do build (use --rascunho para incluir)`); continue; }
  if (c.status !== "aprovado") warn(id, "incluído como RASCUNHO (pendente de assinatura)");

  /* V7 red flags */
  if (c.cat === "Emergência" && (!c.redFlags || c.redFlags.length < 3)) err(id, "V7: Emergência precisa de ≥3 red flags");
  /* V6 orientações */
  const hasOrient = (c.ambulatorial?.classes || []).some(k => /orient/i.test(k.nome));
  if (!hasOrient) warn(id, "V6: sem classe de Orientações");
  /* V8 pediatria */
  const anyPed = JSON.stringify(c).match(/"ped"/);
  if (!anyPed) warn(id, "V8: nenhum item com pediatria");

  const clsKeys = [], hospKeys = [];
  const secao = { amb: new Map(), hosp: new Map() };

  /* ---- ambulatorial ---- */
  for (const [i, k] of (c.ambulatorial?.classes || []).entries()) {
    const key = `cur_${id}__c${i + 1}`;
    const isOrient = /orient/i.test(k.nome);
    const drugs = [], seen = new Set();
    const ordered = [...(k.itens || [])].sort((a, b) => (a.linha || 9) - (b.linha || 9));
    const firstLine = ordered.some(x => (x.linha || 9) === 1);
    if (!firstLine && !k.semPreset) err(id, `V1: classe "${k.nome}" sem item linha:1`);

    for (const it of ordered) {
      let drug = null;
      if (it.novo) {                       // item novo declarado inline
        drug = { id: `cur_${id}__${it.novo.id}`, n: it.novo.n, a: [{ ap: it.novo.ap || "", q: it.novo.q || "", pos: [{ t: it.novo.pos }] }], nota: [it.motivo, it.novo.nota, it.ped ? `Pediatria: ${it.ped}` : ""].filter(Boolean).join(" · "), origem: "curado" };
        if (it.dose || it.novo.dose) drug.dose = it.dose || it.novo.dose;
        if (!it.novo.pos) warn(id, `V9: item novo "${it.novo.n}" sem posologia`);
        const sh = sharedId("amb-novo", drug);
        if (sh) drug.id = sh; else out.drugs.push(drug);
      } else if (it.base) {                // variante do base com posologia DA CONDIÇÃO
        const b = D.drugs[it.base];
        if (!b) { err(id, `V3: base inexistente "${it.base}"`); continue; }
        if (BANNED_RE.some(re => re.test(b.n))) { err(id, `V2: droga banida "${b.n}"`); continue; }
        if (seen.has(it.base)) { err(id, `V4: molécula duplicada na classe (${b.n})`); continue; }
        seen.add(it.base);
        BASE_USE[it.base] = (BASE_USE[it.base] || 0) + 1;
        if (!it.pos && BASE_USE[it.base] > 0 && (b.a?.[0]?.pos?.[0]?.t || "").length < 60) warn(id, `V5: "${b.n}" sem pos específica (herda "${(b.a?.[0]?.pos?.[0]?.t || "").slice(0, 40)}…")`);
        drug = JSON.parse(JSON.stringify(b));
        drug.id = `cur_${id}__${it.base}`;
        drug.origem = "curado";
        if (it.pos && drug.a?.length) drug.a = drug.a.map((a, ai) => (it.posTodas || ai === 0) ? { ...a, pos: [{ t: it.pos }] } : a);
        if (it.dose) drug.dose = it.dose;
        const notas = [it.motivo, it.ped ? `Pediatria: ${it.ped}` : "", it.nota].filter(Boolean);
        if (notas.length) drug.nota = (drug.nota ? drug.nota + " · " : "") + notas.join(" · ");
        const sh = sharedId("amb-base", drug);
        if (sh) drug.id = sh; else out.drugs.push(drug);
      } else if (it.ref) {                 // referência direta a id curado já criado
        drug = { __ref: `cur_${id}__${it.ref}` };
      }
      if (drug) {
        const chave = String(it.base || it.novo?.id || it.ref || drug.id || drug.__ref);
        const dono = secao.amb.get(chave);
        if (dono) duplicatas.push({ id, nome: c.nome, secao: "ambulatorial", chave, de: dono, para: k.nome });
        else secao.amb.set(chave, k.nome);
        drugs.push(drug.id || drug.__ref);
      }
    }
    out.classes.push({ key, nome: (isOrient ? k.nome : k.nome), d: drugs });
    clsKeys.push(key);
  }

  /* ---- hospitalar (substitui HD.map[id]) ---- */
  for (const [i, k] of (c.hospitalar?.classes || []).entries()) {
    const key = `curh_${id}__c${i + 1}`;
    const ids = [];
    const addHosp = (idFinal, chave) => {
      const dono = secao.hosp.get(chave);
      if (dono) duplicatas.push({ id, nome: c.nome, secao: "hospitalar", chave, de: dono, para: k.nome });
      else secao.hosp.set(chave, k.nome);
      ids.push(idFinal);
    };
    for (const it of (k.itens || [])) {
      if (it.novo) {                       // droga hospitalar NOVA (não cadastrada no HOSP_DB)
        const d = { id: `curh_${id}__${it.novo.id}`, n: it.novo.n, a: [it.novo.pos || "Conforme protocolo"].filter(Boolean), ap: it.novo.ap || "", via: it.novo.via || "EV", nota: [it.motivo, it.ped ? `Pediatria: ${it.ped}` : ""].filter(Boolean).join(" · "), origem: "curado" };
        if (it.dose || it.novo.dose) d.dose = it.dose || it.novo.dose;
        if (BANNED_RE.some(re => re.test(d.n))) { err(id, `V2: droga banida (hosp novo) "${d.n}"`); continue; }
        const sh = sharedId("hosp-novo", d);
        if (sh) d.id = sh; else out.hospDrugs.push(d);
        addHosp(d.id, "novo:" + it.novo.id);
      } else if (!H.drugs[it.hosp]) { err(id, `V3: hosp inexistente "${it.hosp}"`); continue; }
      else {
        const nat = H.drugs[it.hosp];
        if (BANNED_RE.some(re => re.test(nat.n))) { err(id, `V2: droga banida (hosp) "${nat.n}"`); continue; }
        if (it.pos || it.motivo || it.nota || it.dose) {
          /* variante da condição: posologia DA síndrome primeiro (pos explícita ou
             dose.texto do import estruturado), opções nativas do cadastro depois. */
          const posTxt = it.pos || (it.dose && it.dose.texto) || "";
          const v = JSON.parse(JSON.stringify(nat));
          v.id = `curh_${id}__${it.hosp}`;
          v.origem = "curado";
          const pos = [posTxt].filter(Boolean);
          v.a = [...pos, ...((nat.a || []).filter(x => !pos.includes(x)))].filter(Boolean);
          if (!v.a.length) v.a = ["Conforme protocolo"];
          const notas = [it.motivo, it.nota].filter(Boolean);
          if (notas.length) v.nota = (v.nota ? v.nota + " · " : "") + notas.join(" · ");
          if (it.dose) v.dose = it.dose;
          const sh = sharedId("hosp-base", v);
          if (sh) v.id = sh; else out.hospDrugs.push(v);
          addHosp(v.id, it.hosp);
        } else addHosp(it.hosp, it.hosp);
      }
    }
    if (ids.length) { out.hospClasses.push({ key, nome: k.nome, d: ids }); hospKeys.push(key); }
  }
  if (hospKeys.length) out.hospMap[id] = hospKeys;

  /* ---- protocolo substituto ---- */
  const proto = {
    id, n: c.nome, cat: c.cat || "Emergência",
    alias: c.alias || "", cid: c.cid || [], cls: clsKeys,
    alerta: c.alerta || "", naoUsar: (c.naoUsar || []).join("; "),
    redFlags: c.redFlags || [], origem: "curado", curStatus: c.status,
  };
  out.protos.push(proto);
  digest.push({ ...c, _clsKeys: clsKeys, _hospKeys: hospKeys });
}

/* ---- relatório ---- */
const r = { conds: digest.length, errors, warns, duplicatas: duplicatas.length, status: digest.map(c => `${c.id}:${c.status}`) };
if (errors.length) { console.error(JSON.stringify(r, null, 1)); process.exit(1); }

/* ---- V11: relatorio de molecula repetida na mesma secao ---- */
if (duplicatas.length) {
  const linhas = ["# V11 — molécula repetida na mesma seção", "",
    "_Gerado por scripts/content/build.mjs. Não bloqueia o build: é dívida de curadoria._", "",
    "| Condição | Nome | Seção | Molécula | Classe A | Classe B |", "|---|---|---|---|---|---|"];
  for (const d of duplicatas) linhas.push(`| ${d.id} | ${d.nome} | ${d.secao} | ${d.chave} | ${d.de} | ${d.para} |`);
  mkdirSync(resolve(root, "reports/curadoria"), { recursive: true });
  writeFileSync(resolve(root, "reports/curadoria/DUPLICATAS-V11.md"), linhas.join("\n") + "\n", "utf8");
  warn("V11", `${duplicatas.length} molécula(s) repetida(s) na mesma seção — ver reports/curadoria/DUPLICATAS-V11.md`);
}

 /* ---- empacotamento: core + pacotes sob demanda ---- */
/* RXMAP: cada classe curada entra na taxonomia com queixa = nome da condição
   → o modal gera "⚡ Usar kit: <Condição>" = 1º item (1ª linha) de cada classe. */
const rxmap = {};
for (const c of digest) (c._clsKeys || []).forEach((k, i) => { rxmap[k] = { sec: "emergencia", ord: 100 + i, q: c.nome }; });
const applyRx = `
  var rm = ${JSON.stringify(rxmap)};
  Object.keys(rm).forEach(function(k){ window.PSX_RXMAP[k] = rm[k]; });
  if (window.PSX_RXSEC && !window.PSX_RXSEC.some(function(s){ return s.id === "emergencia"; })) {
    var i = window.PSX_RXSEC.findIndex(function(s){ return s.id === "outros"; });
    window.PSX_RXSEC.splice(i < 0 ? window.PSX_RXSEC.length : i, 0, { id: "emergencia", n: "Emergência" });
  }`;
/* ---- empacotamento sob demanda: core (protocolos) + pacotes (classes/drogas) ---- */
const PACOTES = 8;
const ordem = [...out.protos].sort((a, b) => String(a.cat || "").localeCompare(String(b.cat || "")) || a.id.localeCompare(b.id));
const bucket = {};
ordem.forEach((p, i) => { bucket[p.id] = Math.min(PACOTES - 1, Math.floor((i * PACOTES) / ordem.length)); });

const classPorKey = new Map(out.classes.map((c) => [c.key, c]));
const drugPorId = new Map(out.drugs.map((d) => [d.id, d]));
const hospClassPorKey = new Map(out.hospClasses.map((c) => [c.key, c]));
const hospDrugPorId = new Map(out.hospDrugs.map((d) => [d.id, d]));

const pacotes = Array.from({ length: PACOTES }, () => ({ classes: [], drugs: [], hospClasses: [], hospDrugs: [], hospMap: {} }));
for (const p of out.protos) {
  const pk = pacotes[bucket[p.id] ?? 0];
  const cls = [...new Set(p.cls || [])];
  const hcls = [...new Set(out.hospMap[p.id] || [])];
  for (const k of cls) { const c = classPorKey.get(k); if (c) pk.classes.push(c); }
  for (const k of hcls) { const c = hospClassPorKey.get(k); if (c) pk.hospClasses.push(c); }
  if (hcls.length) pk.hospMap[p.id] = hcls;
}
for (const pk of pacotes) {
  const ids = new Set(), hids = new Set();
  for (const c of pk.classes) for (const id of c.d) ids.add(id);
  for (const c of pk.hospClasses) for (const id of c.d) hids.add(id);
  pk.drugs = [...ids].map((id) => drugPorId.get(id)).filter(Boolean);
  pk.hospDrugs = [...hids].map((id) => hospDrugPorId.get(id)).filter(Boolean);
}

/* core: tudo que a busca e a home precisam, sem corpos de farmaco */
const cabecalho = "/* GERADO por scripts/content/build.mjs - NAO EDITAR. Fonte: content/condicoes/*.json */\n";
const rxBloco = "if (window.PSX_RXMAP && window.PSX_RXSEC) { " + applyRx + " } else { window.addEventListener(\"load\", function(){ " + applyRx + " }); }";
const core = cabecalho + "(function(){\n \"use strict\";\n var DB = window.PROTO_DB, HD = window.HOSP_DB; if (!DB) return;\n"
  + " var protos = " + JSON.stringify(out.protos) + ";\n"
  + " protos.forEach(function(p){ var i = DB.protocols.findIndex(function(x){ return x.id === p.id; }); if (i >= 0) DB.protocols[i] = p; else DB.protocols.push(p); });\n"
  + " window.PSX_BUCKET = " + JSON.stringify(bucket) + ";\n"
  + " window.PSX_PKG_COUNT = " + PACOTES + ";\n"
  + " " + rxBloco + "\n"
  + " window.PSX_CURATED = { ids: protos.map(function(p){ return p.id; }), status: " + JSON.stringify(Object.fromEntries(digest.map((c) => [c.id, c.status]))) + " };\n"
  + "})();\n";
writeFileSync(resolve(protoDir, "curated-core.js"), core, "utf8");

pacotes.forEach((pk, n) => {
  const js = cabecalho + "(function(){\n \"use strict\";\n var DB = window.PROTO_DB, HD = window.HOSP_DB; if (!DB) return;\n"
    + " " + JSON.stringify(pk.drugs) + ".forEach(function(d){ DB.drugs[d.id] = d; });\n"
    + " " + JSON.stringify(pk.classes) + ".forEach(function(c){ DB.classes[c.key] = { n: c.nome, d: c.d }; });\n"
    + " " + JSON.stringify(pk.hospDrugs) + ".forEach(function(d){ HD.drugs[d.id] = d; });\n"
    + " " + JSON.stringify(pk.hospClasses) + ".forEach(function(c){ HD.classes[c.key] = { n: c.nome, d: c.d }; });\n"
    + " var m = " + JSON.stringify(pk.hospMap) + ";\n Object.keys(m).forEach(function(k){ HD.map[k] = m[k]; });\n"
    + " (window.PSX_PKG = window.PSX_PKG || {})[" + n + "] = 1;\n if (window.PSX_PKG_DONE) window.PSX_PKG_DONE(" + n + ");\n"
    + "})();\n";
  writeFileSync(resolve(protoDir, "curated-pkg-" + n + ".js"), js, "utf8");
});

/* ---- digest para assinatura ---- */
mkdirSync(resolve(root, "reports/curadoria"), { recursive: true });
const dig = ["# DIGEST DE CURADORIA — para assinatura do Dr. Felipe", "", `_Gerado em ${new Date().toISOString().slice(0, 10)}; build: ${digest.length} condição(ões)._`, ""];
for (const c of digest) {
  dig.push(`## ${c.nome} (\`${c.id}\`) — status: **${c.status}**`);
  dig.push(`**Fontes:** ${(c.meta?.fontes || []).join(" · ") || "—"}`);
  dig.push(`**Conduta:** ${c.alerta}`);
  dig.push(`**Red flags:** ${(c.redFlags || []).map(x => "• " + x).join("  \n") || "—"}`);
  if ((c.naoUsar || []).length) dig.push(`**Não usar:** ${c.naoUsar.join(" · ")}`);
  dig.push("");
  dig.push("### Ambulatorial (alta)");
  (c.ambulatorial?.classes || []).forEach(k => {
    dig.push(`\n**${k.nome}**${k.semPreset ? " _(sem preset)_" : ""}`);
    (k.itens || []).forEach(i => dig.push(`- ${i.linha === 1 ? "**[1ª linha]** " : ""}${i.novo?.n || (i.base && (D.drugs[i.base]?.n || i.base)) || i.ref} — ${i.novo?.pos || i.pos || "(posologia do cadastro)"}${i.ped ? ` · _Ped: ${i.ped}_` : ""}${i.motivo ? ` · _(${i.motivo})_` : ""}`));
  });
  if ((c.hospitalar?.classes || []).length) {
    dig.push("\n### Hospitalar (EV)");
    c.hospitalar.classes.forEach(k => dig.push(`- **${k.nome}:** ${k.itens.map(i => `${i.novo ? i.novo.n + (i.novo.pos ? ` — ${i.novo.pos}` : "") : (H.drugs[i.hosp]?.n || i.hosp) + (i.linha === 1 ? " (1ª linha)" : "")}${i.motivo ? ` (${i.motivo})` : ""}`).join(" · ")}`));
  }
  dig.push("\n---\n");
}
writeFileSync(resolve(root, "reports/curadoria/DIGEST-CURADORIA.md"), dig.join("\n"), "utf8");
console.log(JSON.stringify(r, null, 1));
