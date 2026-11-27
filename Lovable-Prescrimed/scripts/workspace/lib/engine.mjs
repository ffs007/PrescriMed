/* Inventario do motor (PROTO_DB + HOSP_DB) e casamento de nomes de farmaco.
   Usado pelo importador do default-workspace. Nao escreve nada. */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const protoDir = resolve(raiz, "public/prototype");

const ARQUIVOS = [
  "proto-data.js", "proto-data-2.js", "proto-data-3.js", "proto-data-4.js", "proto-data-5.js",
  "legacy-data.js", "expansion-data.js", "hosp-data.js", "hosp-expansion.js",
  /* curated-data.js NAO entra: build.mjs nao o carrega, entao ids gerados
     (prefixo cur_ ou curh_) nao existiriam no build e viram V3. */
];

export function carregarMotor() {
  const ctx = { console: { log() {}, warn() {}, error() {} } };
  ctx.window = ctx; ctx.globalThis = ctx;
  vm.createContext(ctx);
  for (const f of ARQUIVOS) {
    try { vm.runInContext(readFileSync(resolve(protoDir, f), "utf8"), ctx, { filename: f }); } catch (e) {
      if (f !== "curated-data.js") throw new Error("falha ao carregar " + f + ": " + e.message);
    }
  }
  const D = ctx.PROTO_DB, H = ctx.HOSP_DB;
  return { D, H, idxAmb: indexar(D.drugs), idxHosp: indexar(H.drugs) };
}

const ROTAS = /\b(ev|iv|im|sc|vo|sl|inalatoria|inalatorio|topica|topico|retal|sublingual|nebulizacao|nebulizado|spray|injetavel|injecao|infusao|gotas|colirio|oftalmico|otologico|pomada|creme|gel|comprimido|capsula|xarope|suspensao|oral|nasal|fortificada|fortificado|parenteral|venoso|intravenoso|intramuscular|subcutaneo|autoinjetor|solucao|soro|medicinal|aquosa|profilaxia|via)\b/g;

export const norm = (s) =>
  (s || "").toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/\(.*?\)/g, " ")
    .replace(/\b\d+([.,]\d+)?\s*(mg|mcg|g|ml|ui|%|mg\/ml|kcal|l\/min)\b/g, " ")
    .replace(/\b\d+([.,]\d+)?\b/g, " ")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ").trim();

export const core = (s) => norm(s).replace(ROTAS, " ").replace(/\s+/g, " ").trim();

function indexar(drugs) {
  const m = new Map();
  for (const [id, d] of Object.entries(drugs || {})) {
    const c = core(d.n || id);
    if (c && !m.has(c)) m.set(c, { id, nome: d.n || id, bruto: d });
  }
  return m;
}

const SINONIMOS = {
  "penicilina benzatina": "benzilpenicilina benzatina",
  "penicilina g benzatina": "benzilpenicilina benzatina",
  "penicilina cristalina": "penicilina g cristalina",
  "penicilina g cristalinica aquosa": "penicilina g cristalina",
  "dipirona metamizol": "dipirona",
  "nitroglicerina sublingual": "dinitrato isossorbida",
  "polietilenoglicol 3350": "macrogol",
  "hioscina butilbrometo": "butilbrometo escopolamina",
  "escopolamina hioscina": "butilbrometo escopolamina",
  "butilbrometo de escopolamina hioscina": "butilbrometo escopolamina",
  "butil escopolamina hioscina": "butilbrometo escopolamina",
  "adrenalina epinefrina": "adrenalina",
  "epinefrina": "adrenalina",
  "sulfato ferroso": "ferro",
  "acido acetilsalicilico aas": "acido acetilsalicilico",
};

function achar(idx, agente) {
  const c = core(agente);
  if (!c) return null;
  const viaSin = SINONIMOS[c];
  if (viaSin && idx.has(viaSin)) return idx.get(viaSin);
  if (idx.has(c)) return idx.get(c);
  const toks = c.split(" ");
  for (let k = toks.length - 1; k > 0; k--) {
    const kk = toks.slice(0, k).join(" ");
    if (idx.has(kk)) return idx.get(kk);
  }
  for (const [k2, v] of idx) {
    if (k2.startsWith(c + " ") || k2.endsWith(" " + c) || c.startsWith(k2 + " ") || c.endsWith(" " + k2)) return v;
  }
  return null;
}

export function resolverAmbulatorial(motor, agente) {
  const hit = achar(motor.idxAmb, agente);
  if (!hit || /^cur_|^curh_/.test(hit.id)) return null;
  return { id: hit.id, nome: hit.nome, origem: "amb" };
}

export function resolverHospitalar(motor, agente) {
  const hit = achar(motor.idxHosp, agente);
  if (!hit || /^cur_|^curh_/.test(hit.id)) return null;
  return { id: hit.id, nome: hit.nome, origem: "hosp" };
}

const VIA_HOSP = /\b(iv|ev|intravenos\w*|infus\w*|bomba|central|intraossea)\b/i;
export function viaHospitalar(via) {
  return VIA_HOSP.test(String(via || ""));
}
