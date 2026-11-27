# Redesign integral PrescriMed — cockpit clínico e identidade única

## Objetivo
Padronizar a experiência pública e autenticada com a identidade PrescriMed do anexo, reduzir poluição visual e transformar o atendimento no cockpit clínico de três colunas, sem alterar o motor clínico, os vínculos, os cálculos, os alertas ou a revisão obrigatória antes da emissão.

## 1. Design system PrescriMed
- Consolidar em tokens semânticos a paleta solicitada: azul clínico, verde de segurança, ciano de dados, roxo assistivo, âmbar de atenção e vermelho de bloqueio, com superfícies claras e modo noturno navy.
- Adotar Inter na interface e IBM Plex Mono nos dados clínicos, doses, frequências, idade, peso e ClCr.
- Uniformizar foco, bordas, sombras, densidade, botões, campos, badges, modais e estados desabilitados com contraste WCAG AA.
- Aplicar o sistema tanto à camada React quanto à ferramenta clínica incorporada, sem modificar `src/components/ui/*`.

## 2. Cockpit clínico responsivo
- Criar uma camada visual aditiva sobre a ferramenta clínica existente, preservando seu motor e seus arquivos-base.
- Em desktop e tablet, organizar o atendimento em três áreas estáveis:
  1. **Paciente:** idade, peso, sexo, alergias, gestação/lactação, creatinina, altura e ClCr, com validação imediata.
  2. **Documento:** busca por queixa, condição ou CID; módulos de receita ambulatorial, alta, hospitalar, exames, atestados, evolução, APAC e checagem de enfermagem; seleção e ajuste dos itens.
  3. **Prévia e segurança:** prévia do documento, alertas clínicos e trava “Revisei este documento” antes de baixar, imprimir ou enviar.
- Em telas menores, converter as três áreas em fluxo sequencial compacto, mantendo ações críticas acessíveis e sem campos espremidos.
- Reaproveitar os dados, estados e geradores atuais; nenhuma sugestão clínica nova será inventada pelo redesign.

## 3. Componentes e feedback clínico
- Padronizar cards de condições, autoria, população e riscos; badges de dose calculada, ajuste renal, bloqueio e sugestão assistiva.
- Destacar alergias e contraindicações sem depender apenas de cor.
- Renomear o assistente visível para **Assistente PrescriMed** e apresentá-lo como apoio sujeito à revisão médica.
- Manter o modo emergência, busca tolerante, modelos, protocolos, documentos e personalização da unidade, ajustando apenas sua apresentação ao novo sistema.
- Acrescentar feedback discreto de salvamento local e transições curtas, respeitando redução de movimento.

## 4. Páginas padronizadas
- Atualizar landing page, login, cadastro e recuperação de acesso com a mesma identidade clínica, sem elementos decorativos supérfluos.
- Padronizar dashboard/entrada do atendimento, biblioteca e condições próprias, configurações da unidade, instalação do app e assinatura/planos.
- Preservar autenticação, pagamentos, permissões e rotas atuais.

## 5. Remoção integral do nome antigo
- Remover **“PS Express”** de toda interface, títulos, iframes, mensagens, documentação ativa e comentários que tratem a ferramenta pelo nome antigo, mantendo apenas **PrescriMed**.
- Substituir também referências visíveis a “Claude” por **Assistente PrescriMed**.
- Manter identificadores técnicos legados como `psx.*`, `PSX_*` e nomes de funções/tabelas quando necessários à compatibilidade; eles não aparecem para o usuário e renomeá-los colocaria dados e integrações existentes em risco.
- Atualizar metadados públicos para a marca PrescriMed e remover URLs/nomes antigos que ainda apareçam no cabeçalho social.

## 6. Segurança e validação
- Garantir que alertas renal, gestacional, lactação, alergia, dose máxima e peso pediátrico continuem ativos.
- Confirmar que PDF, impressão e envio permaneçam bloqueados até a revisão explícita e sejam novamente bloqueados após alteração relevante.
- Testar os principais fluxos em desktop, tablet e celular: acesso, busca, paciente, seleção de condição, módulos documentais, prévia, revisão, PDF, configurações, assinatura e modo emergência.
- Verificar contraste, foco por teclado, leitura por tecnologia assistiva, ausência de sobreposição, console limpo e compilação sem erros.

## Detalhes técnicos
- A adaptação da ferramenta incorporada será feita por extensões carregadas após o motor atual, mantendo os arquivos-base substituíveis e a lógica clínica intacta.
- Os tokens globais serão a fonte única de cores; não serão introduzidas cores visuais hardcoded nos componentes.
- A remoção do nome antigo será validada por busca automatizada de texto, distinguindo marca visível de identificadores técnicos de compatibilidade.
