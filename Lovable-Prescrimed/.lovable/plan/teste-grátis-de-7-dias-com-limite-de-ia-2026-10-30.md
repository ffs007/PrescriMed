# Teste grátis de 7 dias com limite de IA

## O que o usuário vai ver
- **Cadastro = 7 dias de acesso total**, sem cartão. Todo o app fica liberado, Pro incluído (AIH, notificação compulsória, atualizações por IA, assistentes).
- **IA no teste: 30 usos no total, no máximo 8 por dia.** Um contador fica visível ("IA: 12 de 30 · hoje 3 de 8"). Quando o limite acaba, aparece um aviso com o botão "Assinar para IA ilimitada". O resto do app continua funcionando até o fim dos 7 dias.
- **Faixa no topo do app** mostrando "Teste grátis: faltam X dias", com o botão "Assinar". Do 5º dia em diante, ela ganha mais destaque.
- **Depois do 7º dia sem assinatura, tudo fica bloqueado.** Qualquer página do app leva para a tela de planos com a mensagem "Seu teste terminou". Documentos e dados continuam guardados e voltam assim que a pessoa assinar.
- **Contas que já existem** ganham 7 dias contando de hoje.
- **Quem assina** segue exatamente como hoje, sem limite de teste.
- **Administradores** não são afetados.
- A página de preços e as perguntas frequentes passam a dizer: "7 dias grátis com acesso completo, sem cartão. A IA tem 30 usos no período."

## Por que 30 usos e 8 por dia
- Um plantão típico usa de 3 a 5 chamadas de IA: orientações, estruturação de protocolo e entrada inteligente. 30 usos cobrem uns 6 plantões, o bastante para a pessoa perceber o valor.
- O teto de 8 por dia barra quem tenta gastar tudo num dia só, por curiosidade.
- O custo por cadastro fica limitado e previsível: no máximo 30 chamadas por pessoa, para sempre.

## Detalhes técnicos
1. **Banco de dados:** adicionar `trial_ends_at` em `profiles`, com valor padrão `now() + 7 days` para novos cadastros. Preencher as contas existentes com `now() + 7 days`. Criar a tabela `ia_uso_trial (user_id, created_at, funcao)` com RLS (cada usuário lê só as próprias linhas; só o servidor grava).
2. **Funções no servidor:**
   - `fn_acesso_status_self()` devolve `{assinante, em_trial, trial_ends_at, ia_total, ia_hoje}`.
   - `fn_tem_acesso(uuid)` = assinante OU trial vigente OU admin.
   - `has_active_subscription_self()` passa a aceitar também o trial vigente, para que as regras atuais dos recursos Pro liberem esses recursos durante o teste.
3. **Cota de IA aplicada no servidor:** antes de chamar o modelo, as funções `psx-assist`, `ai-assist`, `clinical-ai`, `smart-input-extract`, `iv-extract` e `prot-pubmed` (só quando o usuário dispara manualmente) checam a cota:
   - assinante ou admin: sem limite;
   - em trial: grava o uso e devolve 402 `trial-ia-limit` quando passar de 30 no total ou de 8 no dia (dia no fuso de São Paulo);
   - sem acesso: devolve 402 `sem-acesso`.
4. **No app:**
   - Novo hook `useAcesso` que junta `useSubscription` com o status do trial.
   - Novo `RequireAccess` no `AppShell`, que bloqueia todas as rotas `/app/*` exceto `/app/assinatura`, o retorno do pagamento e `/app/instalar`.
   - `RequireSubscription` passa a usar o mesmo critério.
   - Faixa do trial e contador de IA.
   - O tratamento de erro da IA (`functionsError`) ganha a mensagem do limite. A ponte de IA do protótipo mostra o mesmo aviso, sem mexer nos arquivos do protótipo.
5. **Textos:** atualizar `PricingSection` e `FAQSection`.
6. **Testes:**
   - O trial dura 7 dias.
   - O 31º uso de IA é bloqueado.
   - O 9º uso no mesmo dia é bloqueado.
   - Um assinante não tem limite.
   - Depois do 7º dia, sem assinatura, o acesso é negado.
7. **Registro:** gravar o valor das regras (7 dias, 30/8) na memória e a regra de arquitetura (cota aplicada no servidor) no AGENTS.md.
