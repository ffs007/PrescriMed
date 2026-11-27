# Diagnóstico do PrescriMed + base clínica profunda (6 pilares)

## O que eu já verifiquei no banco real (agora, não nos arquivos)

- 234 tabelas em `public` e o esquema de curadoria nacional presente.
- 292 condições clínicas com ambiente definido; 293 na tabela de referência.
- 258 medicamentos ativos, 440 doses, 48 apresentações, **0 interações medicamentosas cadastradas**.
- 943 vínculos condição × medicamento, mas cobrindo apenas **161 condições** — as outras ~130 ficam sem tratamento.
- Exames por condição: 357 registros cobrindo **76 condições** — as demais caem na lista genérica.
- Anamnese, exame físico, encaminhamento e transferência: a tabela que deveria guardar isso (`patologia_conteudo`) está **vazia, 0 registros**. Hoje esses textos vivem em código, iguais para todos os quadros.

Resumo honesto: o front já está organizado (síndrome → ambiente → documento), mas o banco é largo e raso. Dos 6 pilares, 2 existem parcialmente (medicamentos, exames) e 4 não existem como dado.

## Entrega 1 — Relatório de diagnóstico

Documento estruturado com: arquitetura e duplicidades (dado clínico em arquivo estático vs banco), estado de cada categoria com exemplos de registro completo e de registro raso, inconsistências recorrentes, passivos técnicos (cache/sincronização, validação, contexto único de atendimento, rascunhos), os 5 problemas mais críticos e as 3 prioridades. Entregue como arquivo para download, sem mexer no app.

## Entrega 2 — Estrutura dos 6 pilares no banco

Criar as tabelas que faltam, todas por condição + ambiente + gravidade + população, com fonte, nível de evidência e revisão:

1. Terapêutica: ampliar o vínculo atual com linha de tratamento, alternativa para alergia, troca de via com dose equivalente, contraindicações, ajuste renal/hepático, monitorização, adversos, gestação/lactação e medidas não farmacológicas. Ligar também as interações (hoje zeradas).
2. Anamnese direcionada: roteiro por blocos (início, características, associados, antecedentes, hábitos, familiar, fatores de risco, red flags, contexto social).
3. Exame físico direcionado: achado, sistema, se confirma / sugere diferencial / indica gravidade, e o que muda conduta imediatamente.
4. Exames complementares: quando pedir, por que, achado esperado, ponto de corte que muda conduta, quando não pedir, e estratificação essencial / complementar / segunda linha / seguimento.
5. Encaminhamento: modelos por tipo, com a estrutura obrigatória em campos, editáveis.
6. Transferência inter-hospitalar: modelos por complexidade (maior complexidade, UTI, especialidade), com escore de gravidade, condutas já instituídas, riscos do transporte.

Tudo com leitura para médicos e escrita só para curadoria/administração.

## Entrega 3 — Três condições clínicas completas, como padrão de qualidade

Preenchimento exaustivo dos 6 pilares, nos 5 ambientes, para:
- Amigdalite bacteriana
- Dor torácica de baixo risco
- Síndrome gripal

Servem de referência de profundidade para todas as demais.

## Entrega 4 — Plano de preenchimento sequencial

Ordem por frequência em pronto-socorro, em lotes de 10 condições, cada lote com conferência na tela antes do próximo. Painel mostrando, por condição, quantos dos 6 pilares já estão completos e revisados.

## Front-end

Sem redesenho nesta etapa. Apenas ligar as telas aos dados novos: anamnese, exame físico e textos passam a vir da condição escolhida, e os exames deixam de repetir a lista genérica quando a condição tem exames curados. Continua minimalista, poucos cliques.

## Detalhes técnicos

- Novas tabelas em `public`: `condicao_anamnese`, `condicao_exame_fisico`, `condicao_encaminhamento_modelo`, `condicao_transferencia_modelo`, e colunas adicionais de segurança em `clinical_condition_medication` (linha, alternativa_alergia, equivalencia_via, monitorizacao, ajustes). Chave de junção por `condicao_normalizada` (`clin_normalize`) + `care_context`, igual ao vínculo existente.
- `GRANT` explícito e RLS em cada tabela nova: SELECT para `authenticated`, escrita via `has_role('admin'|'revisor')`, `ALL` para `service_role`.
- Seed idempotente (`NOT EXISTS` / `ON CONFLICT`), com `fonte` e `nivel_evidencia` obrigatórios; nada inventado sem fonte.
- Serviços/hooks novos em `src/modules/prescription/services` seguindo o padrão de `conditionExams.ts`; `patologia_conteudo` é aposentada ou passa a view sobre as novas tabelas.
- `src/components/ui/*` intocado; nenhuma cor fixa em componentes.
