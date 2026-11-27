# Fila 1–6 — estado

_Atualizado 27/11/2026._

| # | Etapa | Estado | Entrega |
|---|---|---|---|
| 1 | Bundle sob demanda | **feito** | PR #4 — core 1,02 MB + 8 pacotes; loader com espera e precarga |
| 2 | CI de assinatura | **feito** | PR #3 — workflow `curadoria.yml` com piso de cobertura 100% |
| 3 | Gate V11 (molécula repetida) | **feito** | PR #3 — 27 pares no relatório, build segue verde |
| 4 | "E no meu hospital?" | **feito** | `lovable-cockpit.js` aba Recursos: marca o que a unidade tem (`psx.stock`), cartão na condição mostra "X de Y opções" e lista as classes sem opção local |
| 5 | Editor de condição no app | **feito** | aba Editar: altera posologia em memória e exporta `patch-<cond>.json`; `scripts/workspace/aplicar-patch.mjs` aplica com checagem de concorrência |
| 6 | Painel de fadiga de alerta | **feito** | aba Alertas: agrega `safety_events` via `__psxBridge.listSafety` por tipo/motivo, com contagem e último evento |

## Notas

- **4**: estado em `psx.stock` (local por dispositivo — recurso de unidade é local por
  definição). Espelhar em `profiles.psx_cfg` exigiria mexer no PrototypePage; fica para
  quando o checklist de unidade virar multi-dispositivo.
- **5**: o patch não escreve no banco; ele vira arquivo e passa pelo gate + build, que é
  o caminho governado. `pos_antes` funciona como controle de concorrência.
- **6**: a leitura prioriza `listSafety` (Supabase) e cai para `psx.safety.queue`
  quando offline.
