# Padrão de diversidade dos registros (v0.2.0)

Referência viva: `sindromes/GI-09_hda.json` e `sindromes/dist/GI-09.md`.
Todo registro reescrito precisa passar neste checklist. Não é sugestão: é o piso.

## O problema que este padrão resolve

O catálogo antigo tinha média de 3,4 fármacos por síndrome, dipirona em 37% deles, e
nenhuma informação de apresentação, preparo, tempo de infusão ou monitorização. O
resultado parecia formulário preenchido, não conduta clínica. A reescrita existe para
que cada síndrome responda: **"o que eu faço, em qual cenário, com qual alternativa,
e o que eu monitoro"**.

## Estrutura obrigatória (mesmas chaves da GI-09, nesta ordem)

`id, area, nome, aliases, contexto, populacao, status, risk_class, versao, visao_geral,
inclusao, exclusao, sinais_alarme, perguntas_rapidas, criterios_escolha, medicamentos,
nao_farmacologico, procedimentos, metas, fluxo, populacoes_especiais, exames, orientacoes,
efeitos_adversos, conduta_efeito_adverso, documentos, anamnese, exame_fisico, referencias,
alertas_sistema, auditoria`

## Pisos quantitativos

| Campo | Mínimo | Observação |
|---|---|---|
| `medicamentos` | 6 | 4 classes terapêuticas distintas no mínimo |
| `criterios_escolha` | 5 | cada um com cenário, escolha e porquê |
| `nao_farmacologico` | 5 | medida + detalhe operacional |
| `procedimentos` | 3 | nome, indicação, técnica, complicações |
| `metas` | 4 | mensuráveis quando possível |
| `fluxo` | 5 | ordem real de decisão, não lista de sintomas |
| `sinais_alarme` | 5 | com severidade e ação |
| `perguntas_rapidas` | 6 | perguntas que mudam conduta |
| `populacoes_especiais` | 4 | ajuste + alerta |
| `alertas_sistema` | 3 | ao menos 1 `bloqueante: true` |
| `exames.comuns` | 3 | com `o_que_muda` |
| `exames.evitar` | 2 | com motivo |
| `referencias` | 3 | tipo + o que verificar |

## Valores de enum aceitos pelo schema (o build rejeita o resto)

- `contexto`: `ambulatorial` ou `hospitalar`. Nada de "pronto-socorro", "UTI", "enfermaria".
- `sinais_alarme[].severidade` e `alertas_sistema[].severidade`: `grave`, `precaucao` ou `informativo`. **Não existe `moderada`** — use `precaucao`.
- `medicamentos[].papel`: `primeira_linha`, `alternativa`, `condicional` ou `resgate`.
- `exclusao[].fluxo`, `alertas_sistema[].acao` e `status`: texto livre curto.

## Cada fármaco precisa de

`classe, agente, papel (primeira_linha|alternativa|condicional|resgate), indicacao, dose,
unidade, via, frequencia, duracao, dose_maxima, contraindicacoes[], efeitos_adversos[],
apresentacoes[], preparo, tempo_infusao, monitorizacao[], ajuste_renal, ajuste_hepatico
(quando aplicável), observacoes, confirmar_apresentacao_local: true, fonte, claim_id: null`

- `apresentacoes`: formas comerciais reais (comprimido, ampola com concentração, frasco, spray, creme).
- `preparo`: como se prepara/dilui; para VO, escrever "Uso direto" ou a diluição quando existe.
- `tempo_infusao`: tempo real (bolus, 2–3 min, 30 min, infusão contínua); para VO, "não se aplica".
- `monitorizacao`: o que se olha depois de dar (parâmetros concretos, não "observar").

## Regra de diversidade terapêutica

1. **Dipirona não é bengala.** Só entra quando é escolha real (dor/Febre com indicação
   específica) e nunca como preenchimento. Se a síndrome não é dolorosa ou febril, não entra.
2. **Cada síndrome deve ter ao menos um fármaco que só ela usaria** (ex.: anafilaxia →
   adrenalina IM; HDA → terlipressina; crise asmática → sulfato de magnésio).
3. **Alternativas de verdade**: quando a primeira linha falha, qual é a segunda? Qual a
   opção se o serviço não tem a primeira?
4. **Classe variada**: não repetir três AINEs nem três IBP como se fossem opções.
5. **Não farmacológico e procedimento contam como conduta.** Uma síndrome cirúrgica sem
   procedimento listado está incompleta.

## Tom e conteúdo

- Português do Brasil, técnico, direto. Sem "considere", sem "pode-se avaliar".
- Dose de adulto padrão (ANVISA/FDA/CDC/WHO/protocolos locais). Pediatria em mg/kg.
- `confirmar_apresentacao_local: true` é aviso de conferência local, não bloqueio.
- Nada de campo vazio, `null` onde cabe texto, "a definir" ou "conforme protocolo".
- `status` permanece `estruturado_em_revisao`; `versao` sobe para `0.2.0`; adicionar
  entrada no `auditoria.changelog`.
- `auditoria.autor` e `revisor_clinico` continuam `null` — não inventar nome.

## Verificação antes de entregar

```powershell
python -c "import json;d=json.load(open('sindromes/ARQ.json',encoding='utf-8'))['sindrome'];print(len(d['medicamentos']),len(d['criterios_escolha']),len(d['procedimentos']))"
```

O JSON precisa carregar, e os números precisam bater com os pisos acima.
