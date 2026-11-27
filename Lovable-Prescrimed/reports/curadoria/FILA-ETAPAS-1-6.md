# Fila 1–6 — estado

_Atualizado 27/11/2026._

| # | Etapa | Estado | Entrega |
|---|---|---|---|
| 1 | Bundle sob demanda | **feito** | PR #4 — core 1,02 MB + 8 pacotes; loader com espera e precarga |
| 2 | CI de assinatura | **feito** | PR #3 — workflow `curadoria.yml` com piso de cobertura 100% |
| 3 | Gate V11 (molécula repetida) | **feito** | PR #3 — 27 pares no relatório, build segue verde |
| 4 | "E no meu hospital?" | pendente | marcar recursos da unidade e adaptar a condição |
| 5 | Editor de condição no app | pendente | editar dose/motivo e exportar patch assinável |
| 6 | Painel de fadiga de alerta | pendente | override por alerta a partir de `safety_events` |

## Notas para retomar

- **4**: a extensão precisa de âncora estável no DOM da condição. Ver como
  `lovable-cdss.js` e `lovable-procedures.js` inserem painéis; guardar o estado em
  `psx.stock` e espelhar em `profiles.psx_cfg` (exige ajuste no PrototypePage).
- **5**: sem backend de escrita, o caminho é editar em memória e exportar um patch
  JSON que `scripts/workspace/aplicar-patch.mjs` aplica em `content/condicoes`.
- **6**: dados vêm de `__psxBridge.listSafety` (`safety_events`); agregar por
  `tipo`/`motivo` e mostrar taxa de override por regra.
