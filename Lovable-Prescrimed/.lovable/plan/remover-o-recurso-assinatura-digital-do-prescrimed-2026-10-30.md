# Remover o recurso "Assinatura Digital" do PrescriMed

Varredura feita em landing, /app, painéis admin, modais e protótipo. O PDF continua idêntico: só sai a promessa/etapa de assinar digitalmente. "Assinar" no sentido de **assinar o plano** (cobrança) e "assinar à mão/carimbo" ficam.

## O que sai

**Landing**
- `TrustSection.tsx`: remover o card inteiro "Assinatura digital · ICP-Brasil"; grade reajustada ao novo número de cards.
- `ModulesSection.tsx`: trocar "Prontuário leve & assinatura ICP-Brasil integrada" por "Prontuário leve integrado".
- `FeaturesSection.tsx`: remover a frase "PDF assinável via ICP-Brasil." (vira "PDF pronto para impressão e carimbo").

**Painel admin (/app/admin)**
- `IVDilutionAdminPage.tsx`: remover a aba "Assinatura Digital" e seu conteúdo.
- Apagar a pasta `src/modules/digital-signature/` (card "em breve" + hook sem uso).
- Itens de checklist/config beta: remover "Assinatura digital" de `ConfiguracoesBetaTab`, `hardeningConstants` ("Assinatura digital / link" → "Link público"), `RevisaoFinalBetaTab`, `BetaReadinessCard`, `featureSuggestions`, rótulo de status em `clinical-tests-v2/lib/status.ts` e o caso de teste "O — Assinatura digital pronta" em `seedCases.ts`.
- Questionário de requisitos: remover as opções "Assinatura digital ICP-Brasil".
- Permissões: remover `assinatura.assinar` ("Assinar digitalmente") da lista de permissões exibidas.
- `SignatureProfilesTab.tsx`: o campo "Assinatura digital (URL)" vira "Imagem da assinatura (URL)" (é a imagem escaneada impressa, não certificado).

**Personalização de documentos (modal)**
- `DocumentCustomizationDialog.tsx`: remover o interruptor "Bloco de assinatura digital" e a nota.
- `defaults.ts`: o modelo pronto que ligava o bloco passa a não ligá-lo; descrição sem "assinatura digital"; nota padrão neutra.
- `validation.ts`: dicas passam a sugerir só "linha de assinatura ou carimbo".
- `BrandingChrome.tsx`: deixar de mostrar o selo "Assinatura digital" na pré-visualização.

**Comentários/rodapés de texto**
- `EmissionActions.tsx`: limpar o comentário sobre ICP-Brasil.

## O que NÃO muda
- Geração, visualização e impressão do PDF (protótipo `docs-pdf.js`, `lovable-rxunified.js`, renderizador). O aviso "conferir antes de assinar" no rodapé do PDF permanece (assinatura física/carimbo).
- Botões "Assinar" da página de planos e do bloqueio de teste (cobrança).
- Banco de dados: as colunas/linhas antigas ficam inertes (sem migração), para não arriscar dados.
- Links gov.br de fontes clínicas e a função interna de link público (URL assinada é termo técnico).

## Detalhe técnico
- `renderDocument.ts` mantém o ramo `digitalSignatureBlock` sem alteração (layout do PDF intocado); como nenhuma tela liga mais a opção, ele fica dormente.
- Validar com nova busca por "assinatura digital|ICP-Brasil|certificado digital" (só deve sobrar migração antiga e o ramo dormente) e conferir landing + /app/admin no navegador.
