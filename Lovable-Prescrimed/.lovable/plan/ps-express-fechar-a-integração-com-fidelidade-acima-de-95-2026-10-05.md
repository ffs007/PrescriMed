# PS Express: fechar a integração com fidelidade acima de 95%

## Onde estamos
Comparei o novo pacote (PresCrimed_Protótipo-2) com o que já está instalado no app. Os 15 arquivos de motor, dados e PDFs são **idênticos byte a byte**. O `index.html` só difere em duas linhas que acrescentamos (a ponte para a IA do app e os itens da base anterior). Ou seja: o protótipo já roda íntegro como tela principal após o login. Falta comprovar a fidelidade e fechar o que ficou pendente.

## O que vou fazer
1. **Prova de fidelidade lado a lado.** Abro o protótipo puro e o app com os mesmos cliques, nos 61 protocolos. Comparo telas, módulos e mensagens, e registro qualquer diferença.
2. **Prova do motor e dos PDFs.** Rodo três pacientes (criança de 12 kg, adulto, gestante) em todos os documentos: receita + orientações, controle especial (2 vias), APAC, prescrição hospitalar, encaminhamento, transferência e evolução. Doses e PDFs precisam sair iguais aos do protótipo.
3. **Assistente "Claude no plantão".** Testo o chat, a leitura de prontuário por foto e as orientações de alta pela IA do app, com o mesmo texto de instrução do protótipo. Corrijo o que falhar.
4. **Dose por peso nos 98 medicamentos da base anterior.** Hoje eles só têm dose em texto. Converto para o formato do motor do protótipo (mg/kg, máximo, apresentação) todos que tiverem dado suficiente. Os que não tiverem ficam listados no relatório, com o motivo. Nada vai para fila de curadoria.
5. **Melhorias aditivas do plano aprovado.** Busca de condição que aceita palavras sem acento e erros de digitação. A unidade e a cidade ficam salvas na conta do médico, não só no aparelho. O rascunho do atendimento continua salvo no aparelho, como o protótipo já faz.
6. **Relatório final.** Entrego um documento com: itens do protótipo, itens da base anterior, conversões que falharam, cada diferença encontrada nas provas e como ela foi resolvida.

## O que não muda
- Nenhum arquivo do protótipo é editado.
- Nenhum conteúdo é reduzido nem enviado para curadoria.
- Login, planos e pagamento continuam como estão.
- As páginas antigas continuam guardadas, mas fora do menu.

## Detalhes técnicos
- As provas de fidelidade usam Playwright em duas abas: `/prototype/index.html` sem a ponte e `/app` com a sessão do usuário. Comparo o DOM e as capturas de tela, e extraio o texto dos PDFs gerados.
- A conversão de dose fica em `public/prototype/legacy-data.js`, no mesmo formato de `drugs` do `engine.js`, com `origem: base_anterior`.
- A busca tolerante e a unidade por conta entram como um script extra carregado depois de `app.js`. Ele envolve as funções do protótipo sem alterá-las. A unidade sincroniza `psx.cfg` com uma coluna nova em `profiles`.
- Antes de cada mudança fora do protótipo, a decisão é registrada em `AGENTS.md`.
