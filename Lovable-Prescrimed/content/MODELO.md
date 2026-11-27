# MODELO DE CONTEÚDO CLÍNICO — PrescriMed (v1, 04/11/2026)
**Princípio do proprietário (Dr. Felipe):** *"minimalista no visual e no fluxo, extremamente robusto nas opções."*
→ **Não existe teto de alternativas.** O que a auditoria condenou não foi quantidade — foi ausência de hierarquia, posologia clonada e itens clinicamente errados.

## Estrutura por condição (`content/condicoes/*.json`)

1. **Identidade**: id, nome, categoria, CID, alias de busca, `status` (rascunho/aprovado), meta de autoria/revisão/fontes.
2. **Conduta (alerta)**: texto curto de estabilização EV — o que fazer nos primeiros minutos, com doses.
3. **Red flags**: lista explícita (≥3 para Emergência) — aparece no topo da condição.
4. **Não usar**: armadilhas da condição.
5. **Ambulatorial (alta)**: classes terapêuticas. **Sem limite de itens.** Cada item tem:
   - `linha: 1` (1ª linha — entra no preset e é pré-marcada) ou 2+ (alternativa);
   - `motivo`: por que existe ali ("1ª linha", "se alergia", "se gestante", "via oral impossível", "refratária"...);
   - `pos`: **posologia escrita PARA ESTA condição** (nunca herdada do cadastro do medicamento);
   - `ped`: dose pediátrica (texto estruturado ou cálculo do motor quando o base tem esquema).
6. **Hospitalar**: classes EV que substituem o mapa do `HOSP_DB` da condição (itens = ids hospitalares existentes + motivo).
7. **Orientações** (classe ORIENT): retorno, cuidados, plano de ação.

## Regras do validador (gate — `node scripts/content/build.mjs`)

| # | Regra | Nível |
|---|---|---|
| V1 | Toda classe tem ≥1 item `linha:1` (ou `semPreset` explícito) | **erro** |
| V2 | Nenhuma droga banida (lista Anvisa — ex.: carisoprodol) | **erro** |
| V3 | Referências (base/hosp/novos) existem nos dados | **erro** |
| V4 | Molécula duplicada dentro da mesma classe | **erro** |
| V5 | Item de base compartilhado sem `pos` próprio (risco de posologia clonada) | aviso |
| V6 | Condição de Emergência sem classe de Orientações | aviso |
| V7 | Red flags < 3 em condição de Emergência | **erro** |
| V8 | Sem pediatria (texto ou motor) em condição que atende crianças | aviso |

## Fluxo de curadoria (governança)

`rascunho` (ZCode redige com fontes) → **Dr. Felipe lê o DIGEST (`reports/curadoria/`) e assina** → `status: "aprovado"` entra no build → gerado `public/prototype/curated-data.js` (substitui o protocolo antigo da condição no PROTO_DB e o mapa hospitalar).
Nada com status ≠ aprovado é substituído — o gerador recusa.

## Por que isso mata os defeitos da auditoria

- **Posologia clonada** → cada item carrega `pos` da condição (V5).
- **Sem hierarquia** → `linha` + `motivo` em todo item (V1); o preset e o kit automático ("1º item da classe") passam a pegar a 1ª linha por construção.
- **Kits perigosos** → 1º item = 1ª linha garantida; combinações do kit são sempre as marcadas pelo curador.
- **Escopo** → condição só entra com red flags + conduta + classes revisadas.
- **Robustez** → quantas alternativas o clínico precisar, cada uma com motivo visível.
