# Fase 1 — Cronograma e Tarefa 1.5 (schemas Zod únicos)

## Situação real da Fase 1 (hoje, 23/09/2026)

| Tarefa | Situação | Prova já entregue |
|---|---|---|
| 1.1 Atendimento persistido (A) | Concluída | Atendimento salvo no banco e reaberto |
| 1.2 Remover listas clínicas fixas (B) | Concluída | Busca no código por listas clínicas retornou vazia; 255 testes passando |
| 1.3 Normalizar tabelas grandes (C) | Concluída | 12 tabelas med_* com no máximo 15 colunas; cadastro grava direto nelas |
| 1.4 Filtragem no banco (D) | Concluída (falta "Minhas Patologias") | 20/20 consultas entre 138 e 186 ms |
| 1.5 Schemas Zod únicos (E) | Em andamento | Regras de medicamento prontas e testadas |

Responsável técnico por todas as tarefas: Lovable (agente de desenvolvimento). Validador: Felipe.

## Cronograma

| Tarefa | Início | Entrega prevista |
|---|---|---|
| 1.4 pendência: Minhas Patologias filtrada no banco | 24/09 | 24/09 |
| 1.5a Pasta `src/schemas/` + paciente, atendimento, medicamento, dose | 24/09 | 25/09 |
| 1.5b documento e alerta + ligar em todos os formulários | 25/09 | 28/09 |
| 1.5c Mesmos schemas nas funções do servidor + trava no banco | 28/09 | 29/09 |
| 1.5d Remoção das validações manuais + prova final | 29/09 | 30/09 |
| Validação da Fase 1 por você | 30/09 | a sua data |

Observação honesta: o trabalho só avança quando você manda mensagem. As datas valem se houver uma mensagem por dia útil.

## Relatório diário
Não consigo enviar mensagens sozinho no fim do dia. Ao final de cada rodada vou entregar: concluído, em andamento e bloqueios, e manter o `roadmap.md` atualizado com a mesma informação.

## Tarefa 1.5 — o que será feito
1. Criar `src/schemas/` com: `paciente`, `atendimento`, `medicamento` (movido do local atual), `dose`, `documento` (um schema por tipo: receita, atestado, exames, encaminhamento, declaração, relatório, orientações, procedimento, AIH, APAC, notificação) e `alerta`.
2. Formulários: trocar as validações manuais atuais (documentValidation das duas pastas, validação de dose, formulários de diluição IV, interações, contraindicações, paciente) pelos schemas.
3. Funções do servidor: copiar automaticamente os schemas para a pasta compartilhada das funções (um script de sincronização gera a cópia a partir de `src/schemas/`), para que uma alteração valha para tela e servidor.
4. Banco: toda gravação clínica passa pelo schema antes de salvar; nas tabelas críticas (paciente, atendimento, prescrição, dose) acrescentar regras no próprio banco equivalentes às obrigatórias, para que nada inválido entre nem por fora do app.
5. Prova de aceite: um teste automático que procura no código funções de validação manual de campos e falha se achar alguma; testes de cada schema com dado válido e inválido; demonstração de gravação inválida sendo recusada.

## Critério "zero if/else"
O código sempre terá "if" para lógica normal (ex.: mostrar ou esconder uma tela). O critério que vou provar é: zero verificações manuais de campos de dados fora de `src/schemas/`, comprovado pelo teste automático do item 5.

## Fases 2 e 3
Não começam antes da sua validação da Fase 1. Lotes de 10 condições: cada lote só avança após você testar os 6 pilares de cada condição.
