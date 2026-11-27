# Carimbo Médico Visual

## O que o médico verá
- Nova tela **Ajustes** (`/app/ajustes`, link no menu do atendimento) com a aba **Meu Carimbo**.
- Formulário à esquerda: Nome completo, CRM, UF (lista de 27 estados), Especialidade/RQE (opcional), Cargo (opcional), e chave "Imprimir carimbo nos documentos".
- À direita, prévia ao vivo de um carimbo de borracha: borda retangular fina, texto centralizado em fonte serifada (Times), linha 1 nome em negrito, linha 2 `CRM-UF 000000`, linha 3 `RQE / Cargo` (some quando vazia).
- Botão Salvar; ao abrir de novo em outro aparelho, os dados voltam da conta.
- Em todo PDF (Receita comum, Receita de controle especial, Atestado/declarações, APAC), o carimbo aparece logo acima da linha de assinatura; a linha fica livre para a rubrica.

## Etapas
1. Banco: coluna `stamp_config jsonb` em `profiles` (nula por padrão). Políticas atuais de perfil (dono lê/edita) já cobrem.
2. Página React `AjustesPage.tsx` com abas (shadcn Tabs) e componente `StampPreview.tsx`, tokens do design system; fonte serifada só dentro da prévia. Validação com zod (nome e CRM obrigatórios, CRM só dígitos, UF obrigatória, limites de tamanho).
3. Sincronização: `PrototypePage` passa a espelhar `profiles.stamp_config` ↔ `localStorage psx.stamp` (mesmo mecanismo do `psx.docstyle`), para o motor de PDF ler sem rede.
4. PDF: novo script aditivo `public/prototype/lovable-stamp.js`, carregado após `lovable-docstyle.js`, sem alterar os geradores originais:
   - envolve o jsPDF e registra cada linha horizontal curta seguida, até 7 mm abaixo, do texto com o nome do médico — que é como `rx-pdf`, `docs-pdf`, `ctrl-pdf` e `apac-pdf` desenham a assinatura hoje;
   - ao finalizar o documento, desenha o carimbo (retângulo 0,3 mm, Times, 3 linhas centralizadas) centralizado sobre essa linha, reduzindo a fonte se não couber; na controle especial, em cada uma das duas vias;
   - sem carimbo configurado ou chave desligada, o PDF sai exatamente como hoje.
5. Teste: `src/modules/stamp/stamp.test.ts` para formatação das linhas (`CRM-SP 123456`, linha 3 omitida quando RQE e cargo vazios, junção "RQE 1234 · Diretor Técnico").
6. Verificação com Playwright: preencher e salvar o carimbo, gerar receita e atestado no /app e conferir no PDF a posição acima da linha.

## Detalhes técnicos
- Formato JSON: `{ nome, crm, uf, rqe?, especialidade?, cargo?, ativo }`.
- Registro em AGENTS.md: carimbo em `lovable-stamp.js` com espelhamento `psx.stamp` ↔ `profiles.stamp_config`.
- Ponto de risco: se algum gerador não desenhar a linha seguida do nome (ex.: APAC sem `sol.carimbo`), o script usa a posição fixa conhecida da área de assinatura daquele formulário; confirmo cada um na verificação.
