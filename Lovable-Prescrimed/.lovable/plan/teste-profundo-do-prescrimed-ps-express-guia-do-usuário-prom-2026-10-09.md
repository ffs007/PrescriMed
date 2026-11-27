# Teste profundo do PrescriMed / PS Express + guia do usuário + prompts de evolução

## Decisões já tomadas
- Corrigir todos os erros possíveis durante o teste (críticos e microtextos); o que não couber vira plano de correção.
- Contas descartáveis podem ser criadas para testar cadastro e recuperação de senha, e apagadas ao final.
- Entrega em três arquivos .md separados.
- Exemplos do guia adaptados à medicina (plantão, ambulatório, alta, enfermagem, ensino).
- Conteúdo clínico do protótipo não é reduzido nem enviado para curadoria.

## Etapa 1 — Teste profundo
Percorrer, com navegador automatizado e as duas contas de teste:
1. Entrada: página inicial, cadastro, login, erro de senha, recuperação e redefinição de senha, sessão em duas abas/aparelhos, saída, sessão expirada, conta sem plano (tela "Assinatura necessária"), planos e retorno do pagamento.
2. PS Express, módulo por módulo: busca (inclusive com erros de digitação), escolha de condição, dados do paciente (adulto, criança de 12 kg, criança de 3 anos, gestante 10/24/36 semanas, creatinina alterada), anamnese e exame físico, prescrição ambulatorial, controle especial automático, receita de alta, prescrição hospitalar e checagem de enfermagem, exames laboratoriais e complementares, atestados e comparecimento, APAC, escores e calculadoras, receituário em branco, condições personalizadas (criar, editar, apagar), ajustes e estilo de documentos, segurança medicamentosa, assistente de IA (chat, foto, alta).
3. Cada elemento: um clique, cliques repetidos, teclado (Tab/Enter/Esc), campos obrigatórios vazios, valores absurdos (peso 0, 500 kg, idade negativa, texto em campo numérico), mudança de ideia no meio, recarregar a página e retomar, várias abas.
4. Contexto: desktop, tablet e celular; Chromium e, quando possível, Firefox/WebKit; rede lenta e queda de internet simulada; tempo de resposta medido por ação.
5. Todos os PDFs gerados conferidos página a página (dose em negrito, marca, cortes de texto, revisão obrigatória antes de baixar).
6. Registrar: o que acontece, clareza das mensagens, feedback visual, pontos mortos, loops, ações sem retorno, alertas para ações irreversíveis, vocabulário inconsistente.

## Etapa 2 — Correções
- Corrigir na hora bloqueios, travamentos, mensagens confusas, rótulos inconsistentes e falhas de fluxo, sempre como acréscimo ao protótipo (sem alterar os arquivos originais dele).
- Inclui pendências conhecidas: repetição infinita na reorganização dos módulos, faixa normal dos sinais vitais pediátricos, primeira dose da checagem pela hora atual (opcional), PDF de atestado/comparecimento.
- Após cada correção, repetir o teste do trecho afetado.

## Entregáveis (em Arquivos)
1. `relatorio-teste-profundo.md` — mapa de tudo que o usuário pode fazer, achados (problema, impacto, causa provável, solução, prioridade, indicador de sucesso), o que foi corrigido e plano em três fases (imediato, curto prazo, melhoria contínua), incluindo consistência visual e microtextos.
2. `guia-do-usuario-prescrimed.md` — texto corrido: problemas que resolve (diretos e indiretos, com Bricolagem clínica: montar receitas, condições próprias e documentos a partir das mesmas peças), jornada do primeiro acesso ao uso avançado, cada ação passo a passo com caminhos alternativos e perfis iniciante/intermediário/avançado, fases de experimentação a maturidade, objetivos, exemplos práticos médicos, boas práticas, interrupções e retomadas.
3. `prompts-evolucao-roi.md` — prompts sequenciais em ordem decrescente de valor, linguagem leiga, cada um dizendo o que muda no uso (velocidade, menos erros, ajuda iniciantes, usos avançados, trabalho em equipe).

## Limites honestos
- Login social: só será testado se existir; hoje o acesso é por e-mail e senha.
- Inatividade prolongada é simulada (expiração forçada da sessão), não esperada em tempo real.
- Cliques sustentados e arrastar-e-soltar só onde existirem.
