# Fase 1 — Reestruturação arquitetural do PrescriMed

Nenhum conteúdo clínico novo entra nesta fase. Só estrutura.

## O que confirmei no sistema antes de planejar

- Os arquivos com dados clínicos fixos no código existem e ainda são usados: lista de medicamentos (629 linhas), lista de exames (28 linhas) e as receitas por patologia (828 linhas). Telas de busca, sugestão, impressão e catálogo leem deles.
- Não existe nenhuma entidade de atendimento no banco (nem paciente persistido). Cada documento recolhe os dados de novo.
- Tabela de medicamentos: 79 colunas. Tabela de medicamentos endovenosos: 149 colunas.
- Interações: a tabela principal está vazia (0); existe uma tabela secundária com 36 registros.
- Base atual: 258 medicamentos ativos, 440 doses, 48 apresentações, 984 vínculos condição-medicamento.
- Não existe pasta de validações compartilhadas (`src/schemas/`).

## Sequência de entrega

Entrego por tarefa, com prova concreta de cada critério de aceitação ao final de cada uma. Tarefa 1.2 vem antes de 1.1 porque o atendimento é o contrato que as telas vão consumir depois.

### Etapa A — Atendimento como coração do sistema (Tarefa 1.2)

- Tabelas `pacientes` e `atendimentos`: ambiente, instituição/unidade/convênio, sinais vitais (PA, FC, FR, temperatura, saturação, glicemia, dor, Glasgow), hipótese diagnóstica, CID principal e secundários, início/fim e situação.
- Cada documento emitido passa a apontar obrigatoriamente para um atendimento.
- Provider global de atendimento em aberto; todas as telas de documento passam a ler paciente/idade/peso/ambiente desse contexto, sem recoletar.
- Prova: criar um atendimento, emitir três documentos diferentes sem redigitar nada e listar os três em uma única consulta.

### Etapa B — Fim da duplicidade de dados (Tarefa 1.1)

- Migro para o banco o conteúdo que hoje só existe em código: as receitas por patologia (linha terapêutica, ambiente, medicamento, posologia) e a biblioteca de exames, marcados como conteúdo legado a revisar, com fonte registrada.
- Todas as telas passam a ler do banco via TanStack Query. Removo os arquivos estáticos e os testes que dependiam deles são reescritos contra dados de teste.
- Prova: busca no código por listas clínicas fixas retorna vazio; alteração feita no banco aparece na tela ao recarregar a consulta.

### Etapa C — Normalização das tabelas gordas (Tarefa 1.3)

- Quebro a tabela de 79 colunas em: medicamento, apresentações, vias, doses, contraindicações, ajustes (renal/hepático/idade), interações, gestação e lactação, monitorização — nenhuma acima de 15 colunas.
- O conteúdo dos medicamentos endovenosos (149 colunas) entra nessa mesma estrutura.
- Migração com conferência de contagem por tabela antes e depois. As tabelas antigas ficam em modo somente leitura enquanto eu valido; a exclusão definitiva é um passo separado, com sua confirmação, para não perder dados sem volta.
- Prova: contagens antes/depois, amostra de 20 medicamentos comparada campo a campo e tempo de consulta medido.

### Etapa D — Filtragem no banco (Tarefa 1.4)

- Reescrevo as consultas que hoje trazem centenas de linhas para filtrar no banco por condição, ambiente, população e linha de tratamento.
- Índices nos campos de filtro e de ligação; paginação nas listas que crescem (medicamentos, condições, prescrições).
- Prova: nenhuma consulta acima de 50 linhas sem paginação; tempos medidos antes e depois.

### Etapa E — Validação única (Tarefa 1.5)

- Pasta de schemas compartilhados: paciente, atendimento, medicamento, dose, documento, alerta.
- Formulários, funções de servidor e gravação no banco passam a usar os mesmos schemas; validações soltas nos componentes são removidas.
- Prova: tentativa de gravar dado inválido é recusada no formulário e no servidor pelo mesmo schema.

## Cronograma

Trabalho por sessão, não por dia de calendário — cada etapa acima é uma entrega fechada, com a prova na tela, e só avanço para a próxima depois da sua conferência. Ordem: A, B, C, D, E. Etapas A e B são as que você percebe imediatamente no uso; C e D são o que faz o app parar de travar; E é o que impede dado errado de entrar.

## Duas decisões que preciso sinalizar

1. As receitas por patologia que hoje estão em código são conteúdo clínico real. Elas vão para o banco marcadas como legado a revisar, não apagadas — apagar seria perder conduta já em uso.
2. Excluir as tabelas antigas de medicamentos é irreversível. Faço isso como último passo isolado, depois de você validar a nova estrutura.

## Nota técnica

Novas tabelas com regras de acesso por usuário e por papel, concessões explícitas e carimbo de criação/atualização. Migração de dados por SQL determinístico com conferência de contagem. Front-end sem redesenho visual nesta fase: só troca de fonte de dados, contexto de atendimento e validação. Fases 2 (motor de interações e alertas) e 3 (lotes de conteúdo clínico) ficam paradas até você aprovar a Fase 1.
