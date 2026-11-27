# Modelos pessoais de prescrição (biblioteca de conhecimento clínico)

## Decisões já tomadas
- Salvar o atendimento inteiro **ou** só um módulo (receita ambulatorial, alta, hospitalar, exames, atestados, orientações).
- Compartilhar só com quem tem conta no app (convite por e-mail ou código).
- Biblioteca institucional aprovada pelos administradores.
- Sem registro de desfecho: a efetividade vem das estrelas/polegar e da taxa de modificação.

## O que o médico verá
1. **Botão "Salvar como modelo"** em cada módulo e no atendimento. Formulário com:
   - etiquetas em níveis (ex.: respiratório > pneumonia > comunitária > típica > 2-5 anos);
   - gravidade, contexto (ambulatório, PS, internação, UTI), nível de evidência, idade mínima e máxima, comorbidades;
   - cada remédio marcado como essencial ou opcional, com alternativas para alergia ou falta;
   - orientações domiciliares (versão simples e versão detalhada), sinais de alerta, prevenção, nutrição, atividade/escola, reavaliações, exames de controle, materiais (links e PDFs), justificativa e referências.
   - Os dados do paciente são removidos antes de salvar.
2. **"Meus modelos"** na tela inicial e ao abrir um atendimento:
   - busca por nome, etiqueta, sintoma, diagnóstico, CID-10 ou remédio, tolerante a erros de digitação;
   - filtros por idade do paciente atual (os modelos compatíveis aparecem primeiro), contexto, data, uso e avaliação;
   - os mais usados ficam em destaque.
3. **Aplicar modelo:** preenche os módulos e passa pelo mesmo motor do app: dose por peso, superfície corporal e rim, checagem de alergia (trocando pela alternativa cadastrada e avisando), gestação e controle especial. Remédio fora da lista do hospital aparece com aviso e a alternativa. Todos os alertas e a confirmação "Revisei este documento" continuam valendo.
4. **Após emitir:** pedido rápido de avaliação (estrelas e polegar). O app registra quanto o modelo foi alterado.
5. **Histórico de versões:** cada salvamento cria uma versão com data e descrição. Há comparação lado a lado (remédios, doses e orientações destacados), restauração em um clique, variações de teste ("ramos") que podem ser consolidadas na versão principal, e incorporação de sugestões de colegas.
6. **Compartilhamento:**
   - só leitura, com opção de fazer uma cópia própria;
   - modo colaborativo, em que o colega sugere mudanças e o autor aprova ou recusa;
   - envio para a biblioteca institucional, que um administrador aprova.
7. **Exportar e importar** em JSON, XML ou CSV, com opção de criptografia por senha.
8. **Painel do médico:** uso ao longo do tempo, taxa de modificação, média das avaliações, tempo médio de montagem com modelo e sem modelo. Quando um protocolo da base mudar, aparece uma sugestão de revisão nos modelos ligados a ele.

## Limites
- "Ilustrações" ficam como anexos (imagem ou PDF). O app não as gera.
- A sugestão de atualização vem de mudanças nos protocolos do próprio app. O app não acompanha diretrizes externas.
- A cobertura de convênio não existe no app. Fica de fora, salvo se você fornecer as listas.

## Detalhes técnicos
- Tabelas: tpl_modelos (dono, metadados, ramo principal), tpl_versoes (conteúdo jsonb imutável, pai, ramo, mensagem, hash), tpl_ramos, tpl_compart (usuário, nível leitura/colab), tpl_sugestoes (diff proposto, status), tpl_publicacao (status, revisor admin), tpl_usos (versão, paciente anonimizado, % de modificação, tempo de montagem, avaliação). RLS por dono, compartilhados e admin via has_role, com GRANTs.
- Convite por código: RPC security definer; por e-mail, a busca é feita em profiles.
- Interface: nova extensão public/prototype/lovable-templates.js, carregada após app.js e usando as ligações da página (__psxBridge.tpl*) para ler e gravar. A captura e a aplicação usam PSAPP.test (C, hospItems, openMod) e os módulos de lovable-documents.js. Os arquivos do protótipo não mudam.
- O painel usa gráficos em canvas leve dentro do próprio protótipo.
- O diff entre versões é feito por item (chave = remédio, exame ou orientação), campo a campo.
- A criptografia da exportação usa AES-GCM (WebCrypto, chave derivada da senha por PBKDF2).
- Testes com Playwright: salvar, buscar, aplicar a uma criança de 12 kg com alergia, versionar, restaurar, compartilhar entre as duas contas de teste, aprovar como admin, exportar e importar.
- AGENTS.md ganha a regra da extensão de modelos.
