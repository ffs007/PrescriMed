# PrescriMed — Status do catálogo de síndromes

Atualizado: 2026-11-05 (cobertura e diversidade concluídas — 221 registros, 223/223 linhas do mestre)

## Trilhas

| Trilha | Estado |
|---|---|
| **Cobertura** (linhas do catálogo mestre) | **223 de 223** mapeadas — 221 registros próprios + 2 linhas cobertas por registro existente |
| **Diversidade** (registros no padrão v0.2.0) | **221 de 221 (100%)** |
| **Procedimentos do box** | **24 protocolos** (BOX-01 a BOX-24) |
| Publicação | **nenhuma** — tudo `estruturado_em_revisao` |

## Números do catálogo

| Métrica | Valor |
|---|---|
| Registros | 221 |
| Fármacos | 2.257 (média 10,2; mínimo 7 por síndrome) |
| Classes terapêuticas distintas | 636 |
| Cenários de escolha | ~2.300 |
| Procedimentos clínicos citados | 1.244 |
| Alertas de sistema | 1.557 |
| Documentos gerados | 221 + índice + painel |

## Como foi feito

1. **Fase 1 (155/155)** — reescrita de todos os registros existentes no padrão de diversidade,
   com escolha por cenário, apresentações, preparo, tempo de infusão, monitorização,
   ajustes renal/hepático, medidas não farmacológicas, procedimentos e metas.
2. **Fase 2 (66 novos)** — criação dos registros que faltavam para fechar o catálogo mestre:
   CAR-12..18, NEU-17, RESP-18..20, GI-18..22, INF-08..14, END-09/10, GO-08..13,
   PED-10..16, OFT-07..12, MSK-11..14, DERM-11..13, ALG-07, PSQ-09/10, GER-07..10,
   TRA-07..12, URO-12/13.
3. **Manual do box** — 24 protocolos com indicação, contraindicação, material, técnica
   numerada, confirmação, complicações com conduta e registro mínimo.

## Ferramentas

```bash
python tools/normalizar.py            # corrige enums e chaves extras antes do build
python tools/build.py                 # valida, gera dist/*.md, seed.sql e INDICE.md
python tools/build_procedimentos.py   # valida e gera PROCEDIMENTOS_BOX.md
python tools/progresso.py             # adesão ao padrão, por área
python tools/painel.py                # painel de diversidade por síndrome
python tools/mapa_cobertura.py        # mestre -> registro, com overrides documentados
python tools/sync_catalogo_json.py    # alinha a coluna json do catalogo.csv
python tools/append_fila_catalogo.py  # acrescenta a fila ao catálogo
```

## Artefatos

- `sindromes/dist/<ID>.md` — 221 documentos clínicos.
- `sindromes/dist/seed.sql` — 221 `insert into pm_syndrome` com payload `jsonb`, mais `pm_medication` e `pm_alert`.
- `sindromes/dist/INDICE.md` e `sindromes/dist/PAINEL_DIVERSIDADE.md`.
- `procedimentos/dist/PROCEDIMENTOS_BOX.md` — manual do box.
- `sindromes/MAPA_COBERTURA.csv` — cada linha do mestre com o registro correspondente.
- `sindromes/fila_cobertura.csv` — fila usada na fase 2.

## Regras mantidas

- Nenhum registro é `publicado`: todos seguem `estruturado_em_revisao`.
- `revisor_clinico` e `autor` permanecem `null` — nenhum nome foi inventado.
- Alertas com `bloqueante=true` impedem assinatura até resolução.
- `confirmar_apresentacao_local: true` em todas as apresentações.

## Pendências (humanas)

- **Revisão clínica formal** dos 221 registros e dos 24 protocolos por revisor nomeado.
- Conferir apresentações e disponibilidade no SUS/farmácia local.
- Validar notificação compulsória e textos legais dos documentos.
- Definir `proxima_revisao` e publicar só após revisão.
- Executar o `seed.sql` em PostgreSQL real (validado por build e schema, não por execução).
