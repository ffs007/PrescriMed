#!/usr/bin/env node
/* Gera public/prototype/procedures-data.js a partir de default-workspace/procedimentos/BOX-*.json
   Formato consumido por lovable-procedures.js (aba "Procedimentos" do Box). */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const dir = join(raiz, "default-workspace", "procedimentos");
const CAT = { acesso: "Acessos vasculares", via_aerea: "Via aérea e ventilação", toracica: "Tórax", hemodinamica: "Hemodinâmica", neurologica: "Neurologia", digestiva: "Digestiva", urinaria: "Urinária", ferida: "Feridas", musculoesqueletica: "Musculoesquelética", diagnostica: "Diagnóstico à beira do leito", circulacao: "Circulação", abdomen: "Abdome", ui: "Urologia", sedacao: "Sedação/procedimental", outros: "Outros" };
const LISTA = (v) => Array.isArray(v) ? v : v ? [v] : [];

/* Alternativas práticas "E no SUS?" — adaptação para serviços com recursos limitados
   (interiores/rede pública). Sugestões de prática corrente — confira o protocolo local. */
const SUS = {
  "BOX-01": "Periferia calibrosa (18G) sempre antes de central. Ultrassom: use o aparelho da sala (porta/linear). Seldinger com kit central básico; sem kit, acesso central só em centro com UTI/hemodinâmica — prefira periférico bem mantido + IO se falha, e transfira.",
  "BOX-02": "Sem videolaringoscópio: laringoscópio convencional (lâminas 3 e 4), tubo comum com cuff, bougie se disponível (não improvisar bougie). Capnografia: detector colorimétrico descartável; sem ele, ausculta + condensação no tubo + SpO2/ECG. Pré-oxigene com máscara com reservatório.",
  "BOX-03": "Cricotireoidotomia por bisturi: bisturi nº 11 comum, pinça Kocher/hemostática, tubo traqueal nº 6 (menor se dificuldade). Sem tubo: cricotireoidotomia por AGULHA 14G/16G com cateter + ventilação intermitente com equipo de O2 e válvula improvisada — resgate enquanto se garante via definitiva.",
  "BOX-04": "Dreno torácico tubo siliconizado nº 28–32 (24–28 em jovem/mulher). Sem kit de dreno: punção com agulha 40x12 + equipo de soro e selo d'água improvisado (frasco de SF 500 mL com 2 cm de coluna) como ponte até o dreno definitivo.",
  "BOX-05": "Toracocentese com agulha 40x12 + equipo simples + frasco estéril. Marque o nível com o US da sala se disponível.",
  "BOX-06": "Pericardiocentese subxifóidea com agulha espinhal 40x12 + equipo; ECG na agulha se monitor disponível. Sem cirurgista: punção de resgate + transferência imediata.",
  "BOX-08": "Paracentese com agulha 40x12 + equipo + frasco estéril. Albumina > 5 L pode faltar — priorize remoção gradual e vigilância.",
  "BOX-09": "Sonda vesical de silicone 14–16 F comum (jogo de sondagem da sala). Lubrificante: gel de lidocaína ou SF estéril com gel.",
  "BOX-11": "Desfibrilador é obrigatório em PS (CFM/Anvisa). Indisponível ou falha: RCP de alta qualidade + epinefrina + suporte imediato. Nunca improvisar choque.",
  "BOX-13": "Acesso intraósseo SEM agulha própria: AGULHA ESPINHAL 40x12 (18G) com mandril — punção da tíbia proximal (2 cm abaixo e medial da tuberosidade), confirme aspirando medula e infundindo SF sem extravasamento; fixação robusta e vigilância do sítio. Retire em até 24 h.",
  "BOX-14": "Sutura com mononylon 4-0/5-0 e porta-agulha comuns; sem porta-agulha: pinça mosquito curva firme. Anestésico: lidocaína 2% simples (sem vasoconstritor em extremidades).",
  "BOX-15": "Incisão e drenagem com bisturi nº 11 + pinça hemostática + dreno penrose improvisado com luva de procedimento cortada. Anestesia local com lidocaína 2%.",
  "BOX-16": "Tala improvisada: tábua enfaixada, papelão acolchoado, atadura de crepe; gesso apenas se material do ambulatório.",
  "BOX-17": "Redução com analgesia IV da sala (fentanil/midazolam); sem fluoroscopia: manobras clássicas + RX pós-redução obrigatório.",
  "BOX-18": "Gasômetro POC indisponível: colete em seringa heparinizada (SF 0,9% por êmbolo), expulse bolhas, transporte em gelo por carrito (~15 min). Interprete clinicamente enquanto aguarda (SpO2, padrão respiratório).",
  "BOX-19": "POCUS: use o US da sala/obstetrícia (sonda convexa serve para FAST/MOST/pneumotórax). Sem aparelho: exame físico estruturado + transferência se imagem for imprescindível.",
  "BOX-20": "VNI: aparelhos BIPAP/CPAP da UTI/portáteis + máscara oronasal comum. Sem VNI: O2 com cateter comum, posição sentada, nebulizações de resgate frequentes e transferência precoce se falha.",
  "BOX-21": "CANH sem aparelho próprio: cateter nasal comum com O2 6–15 L/min umidificado + monitorização rigorosa; transferência se desconforto importante — não improvisar circuitos de alta pressão.",
  "BOX-22": "Descompressão com agulha calibrosa longa (40x12 ou 30x8) no 2º EIC linha hemiclavicular (ou 4º–5º EIC axilar anterior); após saída de ar, válvula improvisada (dedo de luva com furo).",
};

const procs = readdirSync(dir).filter((f) => /^BOX-\d+_.*\.json$/.test(f)).map((f) => {
  const p = JSON.parse(readFileSync(join(dir, f), "utf8")).procedimento;
  const secoes = [
    ["Indicações", LISTA(p.indicacoes)],
    ["Contraindicações", LISTA(p.contraindicacoes)],
    ["Material", LISTA(p.material)],
    ["Anestesia/sedação", LISTA(p.anestesia)],
    ["Posicionamento", LISTA(p.posicionamento)],
    ["Técnica", LISTA(p.tecnica)],
    ["Confirmação", LISTA(p.confirmacao)],
    ["Cuidados pós", LISTA(p.cuidados_pos)],
    ["Complicações", LISTA(p.complicacoes)],
    ["Registro mínimo no prontuário", LISTA(p.registro_minimo)],
  ].filter(([, l]) => l.length);
  return {
    id: p.id, n: p.nome,
    cat: CAT[p.categoria] || p.categoria || "Outros",
    urg: p.urgencia || "", tempo: p.tempo_estimado_min || null, dif: p.dificuldade || null,
    rel: LISTA(p.sindromes_relacionadas),
    sus: SUS[p.id] || null,
    secoes,
  };
}).sort((a, b) => a.cat.localeCompare(b.cat, "pt-BR") || a.n.localeCompare(b.n, "pt-BR"));

const js = `/* GERADO por scripts/workspace/build-procedures.mjs — NÃO EDITAR.
   Fonte: default-workspace/procedimentos/BOX-*.json (curadoria Dr. Felipe). */
window.PSX_PROCEDURES = ${JSON.stringify(procs)};
`;
writeFileSync(join(raiz, "public", "prototype", "procedures-data.js"), js, "utf8");
console.log("procedimentos:", procs.length, "| seções totais:", procs.reduce((a, p) => a + p.secoes.length, 0));
