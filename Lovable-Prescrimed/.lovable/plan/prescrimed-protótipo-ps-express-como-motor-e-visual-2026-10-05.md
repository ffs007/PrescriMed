# PrescriMed = Protótipo (PS Express) como motor e visual

O protótipo é a fonte da verdade: tela, fluxo, motor de doses, conteúdo e PDFs ficam exatamente como estão. Nada do conteúdo dele é reduzido nem vai para curadoria. O app atual se adapta ao protótipo, não o contrário.

## O que o usuário vai ver
- Mesma tela do protótipo: barra superior com unidade, busca de condição, painel da condição com os módulos em blocos, cada módulo abrindo em janela, assistente flutuante no canto.
- Mesmo visual (cores, fontes Schibsted Grotesk / Atkinson Hyperlegible / JetBrains Mono, tema claro e escuro).
- Todos os módulos: receita de alta, prescrição hospitalar, controle especial, anamnese, exame físico, escores com conduta, exames (SIGTAP), APAC, encaminhamento, transferência, evolução.
- Todos os PDFs com o mesmo desenho: receita + orientações, controle especial (2 vias), APAC, prescrição hospitalar, encaminhamento, transferência, evolução.
- Assistente "no plantão" com as mesmas funções (lê condição, paciente, anamnese, exame e escores; escreve orientações e textos), agora pela IA do Lovable. Continua só assistivo.
- Nome da unidade e cidade configuráveis por usuário (padrão: "PS Express HMC · Cabeceiras-GO").
- Continuam: login, planos e pagamento (assinatura bloqueia o uso sem plano ativo).

## O que sai da tela
Todas as outras páginas atuais (curadoria, revisão, homologação, indicadores, pacientes/histórico, segurança, link do paciente, assinatura digital, notificações, ambientes etc.) deixam de aparecer no menu. O código e os dados ficam guardados, sem apagar nada, para reativar depois se você pedir.

## Base antiga
- Itens que o protótipo já tem: vale o do protótipo, o antigo é ignorado.
- Itens da base atual que o protótipo NÃO tem (medicamentos, quadros, vínculos): convertidos uma única vez para o formato do protótipo e incluídos como prontos para uso, sem fila de revisão. Ficam marcados como "origem: base anterior" só para rastreio interno, sem selo na tela.
- Antes de concluir, entrego um relatório: quantos itens vieram do protótipo, quantos da base antiga, e quais não puderam ser convertidos por faltar dado essencial (ex.: medicamento sem apresentação), com o motivo.

## Melhorias além do protótipo (sem tirar nada)
- App instalável no celular (já existe hoje) mantido.
- Busca de condição tolerante a acento e erro de digitação.
- Rascunho do atendimento salvo no aparelho, para não perder ao recarregar.

## Validação
- Comparação lado a lado protótipo × app em telas reais (mesmos cliques, mesmos resultados).
- Teste do motor: mesmos pacientes (ex.: criança de 12 kg, adulto, gestante) devem gerar exatamente as mesmas doses e PDFs que o protótipo.
- Contagem final: 61 protocolos e ~537 medicamentos presentes, mais os itens migrados.

## Detalhes técnicos
- Arquivos do protótipo copiados para `src/prototype/` como módulos TS com o mínimo de alteração (troca de `window.*` por imports; dados, textos e regras byte-idênticos). jsPDF via pacote.
- Interface do protótipo portada para React mantendo o mesmo HTML/CSS; tokens do protótipo viram as variáveis do `index.css` (sem cores fixas em componentes).
- `window.claude` substituído por uma função de backend usando a IA do Lovable, com o mesmo prompt/contexto do protótipo.
- Configuração da unidade guardada no perfil do usuário (coluna nova, sem mexer no resto).
- Script único exporta da base atual os itens ausentes no protótipo para `src/prototype/legacy-data.ts` no mesmo formato de `drugs`/`protocols`; o app passa a ler só arquivos, não o banco clínico.
- Rotas antigas removidas do menu e do roteador; `/` autenticado abre o protótipo; login e Stripe mantidos.
- Registrar a decisão em `AGENTS.md` e atualizar a memória do projeto (regras antigas de curadoria/revisão deixam de valer).
