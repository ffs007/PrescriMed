#!/usr/bin/env node
/* Gera o digest de assinatura das condicoes importadas do default-workspace.
   Nao altera conteudo: so le content/condicoes e escreve em reports/workspace. */
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const dir = resolve(raiz, "content/condicoes");
const saida = resolve(raiz, "reports/workspace");
const HOJE = new Date().toISOString().slice(0, 10);

const todas = readdirSync(dir).filter((f) => f.endsWith(".json")).map((f) => {
  const c = JSON.parse(readFileSync(resolve(dir, f), "utf8"));
  const nAmb = (c.ambulatorial?.classes || []).reduce((a, k) => a + (k.itens || []).length, 0);
  const nHosp = (c.hospitalar?.classes || []).reduce((a, k) => a + (k.itens || []).length, 0);
  return {
    arquivo: f, id: c.id, nome: c.nome, cat: c.cat, status: c.status,
    risco: c.ws?.risco || null, area: c.ws?.area || c.cat,
    amb: (c.ambulatorial?.classes || []).length, hosp: (c.hospitalar?.classes || []).length,
    itens: nAmb + nHosp, alertas: (c.redFlags || []).length, naoUsar: (c.naoUsar || []).length,
    ped: /"ped"/.test(JSON.stringify(c)), importado: !!c.ws,
  };
});
const ws = todas.filter((c) => c.importado);
const aprovados = todas.filter((c) => c.status === "aprovado");

const md = [];
md.push("# Digest de assinatura - condicoes importadas do default-workspace", "");
md.push("_Gerado em " + HOJE + " por scripts/workspace/digest.mjs. Nada entra no app em producao enquanto o status for rascunho._", "");
md.push("Como assinar: marque as condicoes conferidas, preencha o bloco final e peca a promocao em lote (aprovadas entram no proximo build).", "");
md.push("## Numeros", "");
md.push("| Metrica | Valor |", "|---|---|");
md.push("| Condicoes importadas (ws-*) | " + ws.length + " |");
md.push("| Ja aprovadas no catalogo | " + aprovados.length + " |");
md.push("| Itens de prescricao importados | " + ws.reduce((a, c) => a + c.itens, 0) + " |");
md.push("| Condicoes com pediatria declarada | " + ws.filter((c) => c.ped).length + " |");
md.push("| Condicoes com 3+ sinais de alarme | " + ws.filter((c) => c.alertas >= 3).length + " |");
md.push("");

const porArea = {};
for (const c of ws) {
  const k = c.area || "Outros";
  porArea[k] = porArea[k] || { n: 0, itens: 0, A: 0, B: 0, C: 0 };
  porArea[k].n++; porArea[k].itens += c.itens;
  if (c.risco) porArea[k][c.risco]++;
}
md.push("## Por area", "");
md.push("| Area | Condicoes | Itens | Risco A | Risco B | Risco C |", "|---|---|---|---|---|---|");
for (const [k, v] of Object.entries(porArea).sort()) md.push("| " + k + " | " + v.n + " | " + v.itens + " | " + v.A + " | " + v.B + " | " + v.C + " |");
md.push("");

const areas = [...new Set(ws.map((c) => c.area || "Outros"))].sort();
for (const area of areas) {
  md.push("## " + area, "");
  for (const c of ws.filter((x) => (x.area || "Outros") === area).sort((a, b) => a.id.localeCompare(b.id))) {
    const marca = c.risco === "A" ? "**A**" : c.risco || "-";
    md.push("- [ ] " + c.id + " " + c.nome + " - risco " + marca + " - " + c.amb + " classes amb / " + c.hosp + " hosp / " + c.itens + " itens / " + c.alertas + " alarmes" + (c.ped ? " / pediatria" : "") + " (" + c.arquivo + ")");
  }
  md.push("");
}
md.push("---", "");
md.push("## Assinatura", "");
md.push("Declaro que revisei as condicoes marcadas acima, conferi doses, apresentacoes e disponibilidade local, e que as nao marcadas permanecem como rascunho (fora do app em producao).", "");
md.push("| Campo | Valor |", "|---|---|");
md.push("| Nome |  |");
md.push("| CRM/UF |  |");
md.push("| Data |  |");
md.push("| Condicoes aprovadas nesta rodada |  |");
md.push("");

mkdirSync(saida, { recursive: true });
const arquivo = resolve(saida, "DIGEST-ASSINATURA-" + HOJE + ".md");
writeFileSync(arquivo, md.join("\n") + "\n", "utf8");
console.log("ok: " + arquivo);
console.log("ws: " + ws.length + " | aprovadas: " + aprovados.length + " | linhas: " + md.length);
