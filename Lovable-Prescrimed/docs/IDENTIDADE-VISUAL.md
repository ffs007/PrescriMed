# IDENTIDADE VISUAL OFICIAL — PrescriMed
**Referência canônica:** landing `/` (aprovada pelo Dr. Felipe: clara, proporção áurea, minimalista).
**Aplicada em:** `public/prototype/` via `lovable-theme.js` (skin carregado por último; modo escuro desativado por decisão do proprietário).
**Data:** 04/11/2026

## 1. Tokens ( fontes de verdade )

| Papel | Token/Valor | Uso |
|---|---|---|
| Fundo | `#F5F8FF` (hsl 225 100% 98%) | fundo geral |
| Superfície | `#FFFFFF` | cartões, modais, linhas |
| Tinta | `#12202B` (hsl 207 36% 11%) | texto primário e **estados selecionados** |
| Tinta suave | `#47535F` | texto secundário |
| Hairline | `#C3CCDA` (hsl 214 14% 78%) | TODAS as bordas (1px) |
| Azul-canônico | `#005E8A` (hsl 199 100% 27%) | **só** CTA primário, links, foco — nunca fundo de leitura |
| Azul-soft | `#E7EFFC` | fundo de ícones/marcas discretas, nunca texto longo |
| OK / Aviso / Erro | `#1F8A55` / `#B07A1E` / `#B32222` (+ soft) | semântica clínica (tint de 8-12% em fundo) |
| IA | `#6C3CB7` | botões do assistente |
| Fontes | Inter (display/body) · IBM Plex Mono (doses/códigos) | tnum ligado |
| Raio | 4-6px (cartões 8, modais 12) | nunca cantos exagerados |
| Sombra | `0 1px 3px rgba(16,24,40,.08)` | quase invisível; hover = borda tinta, não sombra |

## 2. Regras invioláveis

1. **Sempre claro.** `data-theme=light` travado (`lovable-theme.js` re-força a cada 800ms; `<html data-theme=light>` no index).
2. **Azul não é fundo.** Preenchimento azul-canônico apenas em botão primário/CTA. Leitura de dose/posologia: fundo branco + hairline + mono.
3. **Seleção = tinta.** Categoria ativa, remédio marcado, chip de selecionado, tab ativa: borda/barra **tinta** + fundo branco ou `--soft` — nunca preenchimento azul.
4. **Hairline em tudo.** Divisórias de seção (small-caps + linha 1px), cartões, chips. Sem caixas dentro de caixas.
5. **Proporção áurea.** Colunas duais `1.618fr : 1fr`; whitespace generoso (hero ≥40px, gaps 16-24px); texto corrido ≤55ch; títulos com tracking -0.015/-0.02em.
6. **Semântica clínica preservada.** Alertas (warn/bad/ok) mantêm cor + rótulo — acessibilidade e leitura rápida no plantão acima de estética.
7. **Alvo de toque ≥40px**; foco visível (`outline 2px` azul-canônico/50%).

## 3. Arquivos

- `public/prototype/lovable-theme.js` — skin oficial (CSS + trava de tema). Carrega por último (`index.html:254`).
- `public/prototype/index.html` — `<html data-theme=light>` + script do tema.
- Landing (`src/index.css`, tailwind) permanece a referência; tokens acima derivam dela 1:1.

## 4. Como mudar a identidade no futuro
Editar APENAS `lovable-theme.js` (tokens no objeto `LIGHT`) e/ou os tokens da landing — as duas fontes devem ser mantidas idênticas. Qualquer tela nova deve consumir essas variáveis (`--bg/--surface/--line/--ink/--accent/...`), nunca cores literais.
