# Gestão de protocolos em três camadas (pessoal, equipe, institucional)

## Decisões já tomadas
- Os 61 protocolos do PS Express viram a base institucional. Os médicos podem copiá-los para a camada pessoal ou de equipe e personalizar.
- Equipes e coordenadores são criados pelos administradores.
- Alerta de desatualização: busca semanal automática no PubMed pelas palavras-chave de cada protocolo, mais aviso quando vence a data de revisão. Nada muda sozinho: o resultado vira sugestão para o coordenador.
- Webinars e comparação entre instituições ficam para depois.

## O que o médico verá
1. **Botão "Protocolos" na tela inicial**, com três abas: Meus, Da equipe, Institucionais. Busca tolerante a erros de digitação por título, palavra-chave, CID ou remédio.
2. **Protocolo completo** com: título, palavras-chave, resumo de uma linha, escopo (idade, condições incluídas e excluídas, contexto), objetivos, fluxograma interativo (pergunta → resposta → conduta), remédios com posologia e alternativas, critérios de internação, alta e transferência para UTI, exames essenciais e opcionais com momento certo, referências primárias e secundárias com link, datas de criação, atualização e próxima revisão, autor e aprovador com nome e CRM, e indicadores.
3. **"Aplicar na prescrição"**: os remédios passam pelo motor do app (dose por peso, rim, alergia, gestação, controle especial). Todos os alertas e o "Revisei este documento" continuam valendo.
4. **Camadas e permissões:**
   - Pessoal: só o autor; cada salvamento cria uma versão; acompanha a conta em qualquer aparelho.
   - Equipe (plantão diurno/noturno, ambulatório, enfermaria, UTI pediátrica/neonatal): membros veem; quem tem permissão edita; o coordenador aprova.
   - Institucional: aprovado por uma instância (direção técnica, comitê de padronização, CCIH, núcleo de segurança do paciente). Marcado como obrigatório ou recomendado e travado para edição.
5. **Sugestão de mudança**: qualquer médico propõe alteração em protocolo de equipe ou institucional, num formulário com descrição, justificativa com evidências, impacto esperado, barreiras e como contorná-las. Entra numa fila por prioridade, com prazo de resposta configurável (padrão 7 dias úteis). Recusa exige justificativa.
6. **Comunicação das mudanças**: aviso dentro do app, primeiro para quem mais usa o protocolo; histórico de mudanças em cores (verde = adição, vermelho = remoção, amarelo = alteração); para mudanças críticas de segurança, um quiz curto antes de liberar o uso da nova versão.
7. **Painel administrativo**:
   - protocolos mais aplicados por período, turno e médico;
   - desvios: quando a receita emitida difere do protocolo aplicado (remédio trocado, dose ou via diferente), com tipo e frequência;
   - alertas do PubMed e de revisão vencida;
   - antes e depois da implantação e comparação entre equipes, usando adesão, taxa de modificação e avaliação (não há registro de desfecho clínico no app);
   - tempo de cada etapa da sugestão: proposta, análise, aprovação e implantação.

## Limites
- Recall da ANVISA/FDA e mudanças de diretrizes de sociedades (AAP, SBP) não têm uma fonte automática confiável. Ficam como alerta manual registrado pelo coordenador.
- Os "desfechos" vêm da adesão, das modificações e das avaliações.
- Os avisos aparecem dentro do app, não no celular com o app fechado.

## Detalhes técnicos
- Tabelas: prot_equipes, prot_membros (papel: membro/editor/coordenador), prot_instancias, prot_protocolos (camada, dono, equipe, obrigatório, travado, próxima revisão, origem do PS Express), prot_versoes (conteúdo jsonb imutável, changelog, crítico, hash), prot_sugestoes (campos do formulário, prioridade, prazo, status, justificativa da recusa), prot_eventos (abertura, aplicação, desvio, emissão), prot_quiz e prot_quiz_resp, prot_alertas (pubmed/revisão/manual), prot_notif. RLS por camada com funções security definer (fn_prot_nivel) e has_role; GRANTs em todas.
- Os 61 protocolos são copiados uma única vez do conteúdo do protótipo (CLIN/D) como versão 1 institucional. Os arquivos do protótipo não mudam.
- Interface: nova extensão public/prototype/lovable-protocols.js, carregada após app.js, com ponte __psxBridge.prot. O fluxograma é guardado como nós e arestas em JSON.
- Desvio: na emissão do PDF, os itens da receita são comparados com os da versão do protocolo aplicado.
- PubMed: função agendada semanal (E-utilities, sem chave), com lote limitado, trava contra execução dupla e registro do que já foi visto. A IA do app resume cada artigo novo para o coordenador.
- Testes com Playwright nas duas contas de teste: criar equipe (admin), protocolo pessoal, enviar para a equipe, aprovar, propor sugestão, recusar com justificativa, quiz bloqueando o uso, desvio aparecendo no painel.
- AGENTS.md ganha a regra da extensão de protocolos.
