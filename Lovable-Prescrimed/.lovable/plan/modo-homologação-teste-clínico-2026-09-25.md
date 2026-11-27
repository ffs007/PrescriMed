# Modo Homologação / Teste Clínico

Decisões: ativação por chave no painel admin (perfil Homologador); dados de teste etiquetados nas mesmas tabelas; edição rápida altera o catálogo na hora com histórico; relatório semanal no painel e por e-mail.

## O que o usuário verá
- Faixa vermelha fixa no topo de todas as telas: "AMBIENTE DE HOMOLOGAÇÃO — DADOS DE TESTE" (só para quem está no modo).
- PDFs com marca d'água diagonal "MODELO DE TESTE — NÃO VÁLIDO PARA USO CLÍNICO" em todas as páginas.
- Conteúdo "aguardando revisão" liberado para uso, com aviso discreto "Conteúdo em validação clínica — confira a dose antes de emitir".
- Alertas de alergia, interação, dose pediátrica (inclusive bloqueio sem peso) e "Revisei este documento" continuam obrigatórios.
- Botão flutuante "Reportar problema" em todas as telas (tipo, descrição, captura de tela, atendimento, usuário, horário).
- Ícone de lápis em cada linha de medicamento para corrigir dose/instrução na hora.
- Painel admin "Homologação": liga/desliga o modo, lista de relatórios, usuários mais ativos, condições e medicamentos mais usados, problemas por tipo/gravidade, alertas mais ignorados, relatório semanal e botão "Promover conteúdo validado".
- E-mail semanal com o resumo (precisa de domínio de envio configurado).

## Etapas
1. Banco: papel `homologador`; configuração global do modo; coluna `is_homologacao` nos registros gerados (prescrições, documentos, logs) com filtros nas duas pontas; tabelas `relatorios_homologacao`, `homologacao_eventos`, `homologacao_edicoes` (histórico) e marcação "validado pelo usuário"; RPCs de resumo e de promoção em lote. Acesso restrito por RLS.
2. Contexto no app que diz se o usuário está em homologação; faixa, tema de alerta e marca d'água no PDF.
3. Troca dos bloqueios por status de revisão por aviso (somente em homologação).
4. Botão de reportar com captura de tela; edição rápida com registro.
5. Registro de eventos: tela aberta, medicamento escolhido, documento emitido, alerta ignorado.
6. Painel admin + promoção em lote; estatísticas oficiais excluem registros de teste.
7. E-mail semanal agendado (configuração de domínio de envio primeiro).
8. Teste: abrir as 8 condições, emitir PDF com item pendente, conferir marca d'água, reportar problema, editar dose, confirmar que dados de teste não aparecem fora do modo.

## Ressalva de segurança
A edição rápida altera a dose para todos os testadores imediatamente; cada alteração fica no histórico e pode ser desfeita pelo painel.
