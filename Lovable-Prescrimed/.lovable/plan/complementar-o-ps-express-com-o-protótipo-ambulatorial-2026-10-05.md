# Complementar o PS Express com o protótipo ambulatorial

## Resultado
O PS Express continuará sendo a tela e o motor principal. O protótipo anexado será incorporado apenas onde acrescenta capacidade; receitas, APAC, controle especial, SIGTAP, doses e orientações que já existem não serão duplicados.

A ordem principal ficará:
1. **Prescrição ambulatorial** — a atual “Receita de alta”, incluindo orientações e encaminhamento automático dos controlados para a receita especial.
2. **Prescrição hospitalar** — mantém cálculo, diluição e segurança atuais.
3. **Exames laboratoriais** — mantém sugestões por condição e APAC/SIGTAP.
4. **Outros exames complementares** — imagem, ECG, endoscopia e consulta especializada, sem repetir laboratório.
5. **Atestados e declarações** — novo: atestado médico e declaração de comparecimento.
6. **Demais etapas clínicas** — anamnese, exame físico, escores, controle especial, encaminhamento, transferência, evolução e resumo de alta.

## O que será aproveitado sem redundância
- A receita ambulatorial do anexo será mapeada para a receita de alta existente, que já contém o mesmo motor e mais integração com a condição e o paciente.
- A APAC do anexo será mapeada aos dois pedidos existentes: laboratorial e demais exames.
- A receita de controle especial continuará única e ligada à prescrição ambulatorial.
- Histórico, dados do paciente e dados fixos da unidade continuarão compartilhados pelo atendimento, sem novos cadastros paralelos.
- O assistente continuará usando a conexão atual e os dados do caso; não haverá um segundo chat.

## Novos documentos
### Atestado médico
- Período de afastamento em dias, data inicial, finalidade opcional e opção de exibir CID somente com consentimento registrado.
- Texto revisável antes da emissão.
- PDF com paciente, data, profissional e unidade já informados no atendimento.

### Declaração de comparecimento
- Data, horário inicial e final, acompanhante opcional e texto revisável.
- PDF com os mesmos dados compartilhados, sem pedir novamente informações já preenchidas.

## Implementação e segurança
- Os arquivos originais dos protótipos permanecem substituíveis e sem mistura: a complementação entra como extensão carregada depois do motor atual.
- A extensão reutiliza o paciente, a unidade e o profissional já salvos; os novos documentos ficam no mesmo rascunho local do atendimento.
- Todo PDF exige conferência explícita imediatamente antes de baixar ou imprimir. Alterar qualquer campo desfaz a conferência.
- CID no atestado fica oculto por padrão e só aparece após consentimento explícito.
- O conteúdo anexado não será enviado para curadoria nem reduzido.

## Verificação
- Conferir que cada função equivalente aparece uma única vez.
- Testar os módulos na nova ordem em computador e celular.
- Gerar e inspecionar os PDFs de atestado e comparecimento, inclusive textos longos e campos opcionais.
- Revalidar prescrição ambulatorial, hospitalar, APAC laboratorial, APAC complementar e controle especial para garantir que a reorganização não alterou seus resultados.
