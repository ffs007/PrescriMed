# Preenchimento profundo dos Lotes 1 e 2 (padrão superior ao "Minhas Receitas")

Li o anexo inteiro (398 linhas, 8 regras + ação imediata + critério de aceitação). Nada foi omitido.

## Situação real no banco hoje (conferida agora)

| Quadro | Vínculos | Remédios distintos | Meta do anexo |
|---|---|---|---|
| Faringoamigdalite bacteriana | 11 | 8 | 25 (15 antibióticos) |
| Síndrome gripal | 14 | 6 | 20 |
| Dor torácica de baixo risco | 5 | 5 | 15 |
| Asma / crise asmática (4 cadastros separados) | 40 | ~20 | 20 |
| Exacerbação de DPOC | 9 | 6 | 20 |
| Pneumonia comunitária | 24 | 11 | 18 |
| Bronquiolite | 10 | 5 | 15 |
| Crupe | 5 | 5 | 10 |

Asma e dor torácica têm cadastros duplicados com nomes diferentes. Vou juntá-los num quadro só.

## Como vou fazer (em 4 etapas, um quadro por vez)

**Etapa 1 — Estrutura que falta (Regras 2, 3 e 5)**
- Cada apresentação e dose vira uma opção separada com caixa de marcar.
- Todos os 16 campos obrigatórios da Regra 3 passam a existir por opção, incluindo ajuste renal/hepático, gestação, lactação, contraindicações, interações, monitorização, fonte e nomes comerciais.
- Marcadores de uso especial em cada opção: criança, gestante, idoso, rim, fígado e alergia.
- Uma trava no banco impede salvar uma opção com campo vazio. Quando algo não se aplica, o texto precisa dizer isso, por exemplo "Não requer ajuste".
- Medidas sem remédio (hidratação, oxigênio, repouso vocal) entram como opções de tratamento.

**Etapa 2 — Conteúdo clínico (Regras 1, 6, 7 e 8)**, para os 8 quadros:
- Remédios: vou cumprir as quantidades mínimas por classe e por linha (1ª linha, alternativa para alergia, 2ª linha e resgate), com várias apresentações e doses de adulto e de criança.
- Exames: no mínimo 4 de laboratório e 2 de imagem, cada um com quando pedir, por que pedir, achado esperado, valor que muda a conduta e quando não pedir.
- Anamnese: 10 ou mais perguntas, com pelo menos 3 sinais de alarme destacados.
- Exame físico: 6 ou mais itens, cada um classificado como confirma, diferencial, gravidade ou muda a conduta.
- Documentos: 3 modelos de encaminhamento (ambulatorial, urgência, procedimento) e 2 de transferência (maior complexidade, UTI), com campos e texto editável.
- Todo o conteúdo fica marcado como **"aguardando sua revisão"**, com a fonte citada (Ministério da Saúde/PCDT, IDSA, GINA, GOLD, SBP, SBC). Não invento dados sem fonte.
- Ordem: Faringoamigdalite, Gripal, Dor torácica, Asma, DPOC, Pneumonia, Bronquiolite e Crupe.

**Etapa 3 — Tela de prescrição (Regra 4 e item 4 da aceitação)**
- Os remédios aparecem agrupados por classe e, dentro de cada classe, por subgrupo (por exemplo, "Beta-lactâmicos orais"). A 1ª linha fica destacada.
- Botões rápidos para marcar: 1ª linha, Alergia, Falha terapêutica, Criança, Gestante, Idoso, Rim e Fígado.
- Filtro por população. Medidas sem remédio aparecem numa seção própria.
- O visual continua limpo e com poucos cliques.

**Etapa 4 — Prova e relatório (critério de aceitação)**
- Relatório por quadro: total de remédios, quantos por classe, quantas apresentações por remédio e quantos servem para cada população especial.
- Checagem no banco mostrando 100% dos campos preenchidos em cada opção.
- Teste logado na tela, com captura de imagem, dos 8 quadros.

## Limites que preciso deixar claros

- **Comparação com o "Minhas Receitas":** não tenho acesso a esse aplicativo. Vou comparar com o número que você citou (15 antibióticos na amigdalite). Para os outros quadros, só consigo comparar se você me mandar os números ou as telas.
- **Conferência clínica:** o conteúdo vai ficar pronto para você revisar, mas não liberado. As doses precisam da sua conferência antes de irem para as sugestões automáticas.
- **Tamanho do trabalho:** são cerca de 150 a 200 opções de remédio, além de exames, perguntas e modelos. Isso vai levar várias rodadas. Vou entregar um quadro completo por vez e não vou chamar nada de pronto sem provar.
- O Lote 3 só começa depois que você aprovar os Lotes 1 e 2.

## Detalhes técnicos

- `clinical_condition_medication` ganha colunas: `apresentacao_texto`, `dose_adulto`, `dose_pediatrica`, `idade_minima`, `via`, `frequencia`, `duracao`, `linha_tratamento` (enum: primeira, segunda, terceira, alergia, resgate, hospitalar), `subgrupo`, `ajuste_renal`, `ajuste_hepatico`, `gestacao`, `lactacao`, `contraindicacoes`, `interacoes`, `monitorizacao`, `nomes_comerciais`, `flags_populacao text[]`, `nao_farmacologico bool`. Vários registros por medicamento, um por apresentação e dose.
- Uma trigger de validação barra campos vazios quando o status for diferente de rascunho. Uma view de auditoria `vw_completude_condicao` calcula a porcentagem de preenchimento.
- `fn_sugestoes_terapeuticas` passa a devolver os campos novos. Os quadros duplicados (asma, dor torácica, faringoamigdalite) são unificados por `condicao_id` canônico, com alias.
- Pilares: `condicao_exame_fisico`, `condicao_anamnese`, `condicao_encaminhamento_modelo`, `condicao_transferencia_modelo` e exames por condição recebem colunas `quando_pedir`, `quando_nao_pedir`, `ponto_corte` e `classificacao`, se ainda não existirem.
- A carga de dados é feita por SQL idempotente, sem duplicar em caso de nova execução.
- `MedicationExplorer` recebe os subgrupos, as fichas de filtro e o destaque de linha. `src/components/ui/*` não é alterado e não uso cores fixas.
- Testes: completude no banco, agrupamento e filtros, e Playwright logado nos 8 quadros.
