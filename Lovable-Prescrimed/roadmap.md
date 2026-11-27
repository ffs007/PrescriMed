# Roadmap — Fase 1

## SEO (out/2026)
- [ ] Concluir Google Search Console (bloqueado: papel do usuário não permite criar conexão e nenhuma conexão está acessível; administrador do espaço precisa criar/compartilhar conexão)
- [x] Restringir restrições em preparação e catálogo de testes à curadoria/administração e validar permissão nas edições de alertas
- [x] Corrigir descrição do título principal e texto alternativo das capturas de homologação
- [x] Corrigir domínio do sitemap e sua indicação no robots.txt
- [x] Validar páginas públicas e registrar correções na revisão de SEO
- [x] Restringir instituições e equipes a membros e gestores, e blocos clínicos planejados à curadoria/administração

## Redesign PrescriMed (out/2026)
- [x] Consolidar identidade visual clínica e tokens acessíveis
- [x] Aplicar cockpit responsivo de paciente, documentos e segurança sem alterar o motor clínico
- [x] Remover o nome antigo da interface e substituir Claude por Assistente PrescriMed
- [x] Validar visualmente o cockpit clínico em desktop, tablet e celular

## Complemento do protótipo ambulatorial
- [x] Separar Prescrição ambulatorial de Receita de alta, com conteúdo e estado independentes
- [x] Deduplicar o protótipo Receitas Ambulatoriais contra o motor clínico atual, mantendo um único motor por função
- [x] Reordenar os módulos: prescrição ambulatorial, prescrição hospitalar, exames laboratoriais, outros exames complementares, atestados e declarações, demais módulos clínicos
- [x] Acrescentar atestado médico e declaração de comparecimento com revisão e PDF
- [x] Validar fluxo, persistência e PDFs em desktop e celular

## Correção da receita por condição
- [x] Adicionar Voltar à Revisão do conteúdo legado
- [x] Exibir vínculos da condição/ambiente/população por classe, com seleção múltipla e detalhes cadastrados; verificar amigdalite bacteriana na revisão da receita
- [ ] Validar emissão efetiva do PDF e corrigir apresentações/posologias incompletas ou incompatíveis na base clínica (depende de revisão clínica dos dados)

## Etapa D — filtragem no banco
- [x] Índices: quadro (nome normalizado), condicao_id, ambiente, população, linha de tratamento, atendimento, paciente, médico
- [x] Conteúdo do quadro (anamnese, exame físico, encaminhamento, transferência, exames) filtrado no banco
- [x] Nova prescrição: trocar lista completa de medicamentos (~520) por busca paginada no banco
- [x] Catálogo de quadros (Dashboard / Minhas Patologias) por ambiente e busca no banco — feito na nova prescrição; Minhas Patologias pendente
- [x] Busca unificada (clinicalSearch) no banco
- [x] Telas administrativas com limite alto (vínculos 5000, indicadores 2000, uso 5000, auditoria 500, revisão do legado 1000) → paginação — feito: revisão do legado, auditoria de protocolos, indicadores de escores, funil, vínculos medicamento×patologia
- [x] Medição final: 20/20 consultas < 200 ms (138–186 ms, incluindo ida e volta pela rede)

## Etapa C — pendente
- [x] Telas de cadastro/importação gravando direto na nova estrutura; ficha antiga só consulta

## Etapa E — schemas Zod compartilhados
- [x] Medicamento: regras únicas no formulário, importação CSV e antes de gravar
- [x] 1.5a Pasta src/schemas (paciente, atendimento, medicamento, dose, documento, alerta); documentos da prescrição usam os schemas
- [x] 1.4 Minhas Patologias filtrada no banco (ambiente, busca, especialidade; páginas de 50)
- [x] 1.5b Doses (revisão) e alertas (interações, contraindicações, ficha IV) usam src/schemas
- [x] 1.5b-2 Documentos avançados (AIH, APAC, notificação) e documentos/lib/documentValidation
- [x] 1.5c Schemas nas funções do servidor + regras no banco
- [x] 1.5d Teste que falha se houver validação manual fora de src/schemas + prova final

## Fase 3 — lotes clínicos
- [x] Lote 3 (ITU baixa, gastroenterite, celulite/erisipela, lombalgia, enxaqueca, cefaleia tensional) — aguardando teste do usuário

## Preenchimento profundo — Lotes 1 e 2 (padrão "Minhas Receitas")
- [x] Estrutura completa por opção (16 campos, trava de completude, auditoria)
- [x] Tela: classes/subgrupos, destaque 1ª linha, filtros rápidos, detalhes clínicos
- [x] Faringoamigdalite bacteriana — medicamentos (38 opções)
- [ ] Faringoamigdalite — exames (4 lab + 2 imagem), anamnese 10+, exame físico 6+, 3 encaminhamentos, 2 transferências
- [x] Medicamentos: Síndrome gripal (17), Dor torácica (18), Asma (20), Exacerbação de DPOC (20), Pneumonia (21), Bronquiolite (16), Crupe (10)
- [x] Síndrome gripal: +3 opções (20)
- [x] Teste logado + PDF dos 8 quadros (Dor torácica e Asma brônquica incluídas no catálogo de Urgências)
- [ ] Problemas do teste: dose pediátrica por kg não calculada; apresentação repetida na linha; revisão corta texto longo; PDF sai sem marcar "Revisei"; oseltamivir 45 mg sem dose para adulto (aguarda decisão do usuário)
- [ ] Pilares (exames, anamnese, exame físico, documentos) dos 8 quadros
- [x] Unificar cadastros duplicados (asma, dor torácica)

## Modo Homologação
- [x] Perfil Homologador, chave no painel, faixa vermelha, marca d'água em PDF/impressão
- [x] Aviso "em validação" no lugar de "aguardando revisão"; alertas de segurança mantidos
- [x] Reportar problema (com captura), edição rápida com histórico/desfazer, promoção em lote
- [x] Registro de eventos e painel /app/homologacao; indicadores oficiais excluem teste
- [ ] E-mail semanal — bloqueado: falta domínio de envio de e-mail

## Lote outubro/2026
- [x] Controle especial automático na prescrição (seleção e linhas digitadas)
- [x] Estilo dos documentos por médico (logo, margens, cabeçalho, rodapé) salvo na conta
- [x] Expansão da base marcada (16 condições, 16 itens, 18 medicamentos antigos marcados como controle, 26 exames, 6 escores)
- [x] Receituário em branco e condições personalizadas por médico

## Segurança medicamentosa (out/2026)
- [x] Função renal (Cockcroft-Gault + CKD-EPI/MDRD/Schwartz), faixas configuráveis, ajuste/bloqueio com justificativa
- [x] Gestação/lactação obrigatória, D/X e "evitar na lactação" bloqueiam com justificativa e concordância
- [x] Calculadoras, escores e fluxos com "Aceitar na prescrição"
- [x] Dietas, dispositivos e cuidados de enfermagem novos
- [x] Auditoria append-only (safety_events) e painel de registros

- [x] Protocolos em três camadas (pessoal, equipe, institucional), sugestões, quiz, painel, PubMed
- [ ] Webinars e comparação entre instituições (adiado pelo usuário)
- [x] Motor de recomendação clínica contextual (painel de escores, comparação, calculadoras pediátricas, cartão de parada)

- [x] Modo Emergência (lovable-emergency.js)
- [ ] Integração com sistema de senhas do PS (adiado pelo usuário)
