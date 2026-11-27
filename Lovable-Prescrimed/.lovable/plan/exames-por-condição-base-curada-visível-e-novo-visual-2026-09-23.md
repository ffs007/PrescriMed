# Exames por condição, base curada visível e novo visual

## Primeiro: sim, estou ligado ao banco real

Consultei o banco do projeto agora, não os arquivos que você enviou. O que ele responde:

- 258 medicamentos ativos
- 943 vínculos medicamento × condição, **todos já revisados**
- 130 carimbos de revisão clínica, 129 medicamentos liberados
- 357 vínculos de exames por condição, cobrindo 76 condições clínicas

Ou seja: sua curadoria está no banco. O problema é na tela, não no dado.

## Onde está o erro dos exames

Os exames mostrados hoje **não vêm do banco**. Vêm de duas listas fixas dentro do código:
uma biblioteca geral de 20 exames e textos escritos à mão por patologia. Nenhuma tela lê
a tabela de exames por condição. Por isso aparecem sempre os mesmos exames, qualquer que
seja a condição.

Correção: passar a ler os exames do banco, filtrando pela condição e pelo ambiente
(ambulatório, urgência, emergência), com finalidade, obrigatoriedade, justificativa e
conduta se alterado. Quando a condição não tiver exame cadastrado, a tela mostra a lista
geral marcada como "sugestão genérica", como você escolheu.

## Onde está o erro da base curada que "não aparece"

Dois motivos distintos:

1. Os 129 medicamentos liberados são os que têm carimbo de revisão. Os outros existem e
   estão revisados no vínculo, mas a tela de sugestão exige o carimbo para exibir. Vou
   alinhar: vínculo revisado aparece como sugestão; o carimbo passa a valer só para a
   pré-seleção automática de dose/apresentação, com selo visível.
2. Os exames curados nunca chegaram à tela (item acima).

Vou incluir um painel de conferência simples mostrando, para cada condição: quantos
tratamentos e exames revisados ela tem, para você ver a curadoria refletida.

## Novo visual (app inteiro)

Uso as imagens como referência de estilo, não de texto. O que extraio delas:

- Azul clínico como cor principal, verde para confirmado, âmbar para atenção, vermelho
  para crítico, roxo para regulatório; fundo claro acinzentado, cartões brancos
  arredondados com sombra leve.
- Menu lateral claro com item ativo em azul suave, topo com busca, instituição, alertas e
  perfil.
- Cartões de ação rápida com ícone em círculo colorido, faixa de tarefas críticas com
  número grande e botão "Revisar".
- Selos: alerta crítico, cautela, nível de evidência, conformidade regulatória.
- Telas clínicas em duas colunas: contexto do paciente à esquerda, linha do tempo de
  auditoria e sugestões à direita.

Aplicação em ordem: identidade e componentes base → menu/topo/painel inicial → prescrição,
patologias/síndromes, documentos, prescrições → protocolos, escores, indicadores,
internações, notificações → telas administrativas. Sem poluição visual, leitura rápida,
como você pediu.

## Detalhes técnicos

- Serviço novo lendo `base_patologia_exames` por `nome_patologia` normalizado + contexto,
  com fallback para `EXAMS_LIBRARY` sinalizado; hook + integração em `ExamesForm`,
  `PathologyDetailSections` e no gerador de solicitação de exames.
- Ajuste no filtro de `clinicalSuggestions.ts`: exibir por `review_status='reviewed'`;
  `medicamento_liberado` passa a controlar apenas auto-seleção e selo.
- Função de banco de resumo por condição (tratamentos e exames revisados) para o painel.
- Tokens HSL em `index.css`/`tailwind.config.ts` e variantes shadcn; sem cores fixas nos
  componentes; `src/components/ui/*` não é alterado.
