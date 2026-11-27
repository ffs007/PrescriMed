# Padrão de cobertura — registros novos (v0.2.0)

Complemento de `_PADRAO_DIVERSIDADE.md`. Aqui o registro **não existe ainda**: ele é
criado do zero para fechar uma linha do catálogo mestre (`sindromes_pronto_atendimento.csv`).

## Fonte da verdade

- Fila: `sindromes/fila_cobertura.csv` (`id;area;nome;master_ref`).
- Cada linha da fila tem um `master_ref` (ex.: `S-048`) que aponta para a síndrome do
  catálogo mestre que o registro cobre.
- Não invente id novo nem renomeie o id da fila.

## Estrutura

As mesmas 31 chaves da GI-09, na mesma ordem de `_PADRAO_DIVERSIDADE.md`:
`id, area, nome, aliases, contexto, populacao, status, risk_class, versao, visao_geral,
inclusao, exclusao, sinais_alarme, perguntas_rapidas, criterios_escolha, medicamentos,
nao_farmacologico, procedimentos, metas, fluxo, populacoes_especiais, exames, orientacoes,
efeitos_adversos, conduta_efeito_adverso, documentos, anamnese, exame_fisico, referencias,
alertas_sistema, auditoria`

## Pisos

Iguais aos da reescrita (≥6 fármacos em ≥4 classes, ≥5 cenários, ≥5 medidas não
farmacológicas, ≥3 procedimentos, ≥4 metas, ≥5 passos de fluxo, ≥3 alertas com ao menos
1 bloqueante), e cada fármaco com apresentações, preparo, tempo de infusão, monitorização,
ajuste renal, observações, `confirmar_apresentacao_local: true`, `fonte` e `claim_id: null`.

## Metadados

- `status`: `estruturado_em_revisao`.
- Nenhuma chave extra no objeto `sindrome` (nada de `master_ref`, `fonte_mestre`): o
  vínculo com o catálogo mestre fica em `fila_cobertura.csv`.
- `versao`: `0.2.0`.
- `risk_class`: A para o que mata ou deixa sequela em horas; B para o que exige decisão
  correta mas tolera algumas horas; C para o autolimitado de manejo ambulatorial.
- `populacao`: `adulto`, `pediatrico`, `idoso` ou combinação — conforme a síndrome.
- `contexto`: só `ambulatorial` e/ou `hospitalar`.
- `aliases`: incluir o nome exato do catálogo mestre.
- `auditoria.changelog`: duas entradas — `0.1.0` ("Criação do registro a partir do
  catálogo mestre.") e `0.2.0` ("Primeira versão no padrão de diversidade.").
- `auditoria.autor` e `revisor_clinico`: `null`. Nunca inventar nome.

## Procedimentos do Box de Emergência

Quando o registro exigir procedimento que existe no manual do box, referencie o
protocolo no campo `procedimentos[].protocolo` (ex.: `"protocolo": "BOX-04"`).
O manual fica em `procedimentos/` e é compilado por `tools/build_procedimentos.py`.

## Enums aceitos (o build rejeita o resto)

- `contexto`: `ambulatorial`, `hospitalar`.
- `severidade`: `grave`, `precaucao`, `informativo`. **Não existe `moderada`.**
- `papel`: `primeira_linha`, `alternativa`, `condicional`, `resgate`.

## Verificação

```powershell
python tools/normalizar.py
python tools/build.py
python tools/progresso.py
```
