# App instalável (PWA) com guia de instalação

## O que já existe
- Manifesto, ícones e cor de tema configurados.
- Faixa de instalação no topo (botão "Instalar app" no Android; instrução curta no iPhone), dispensável.
- Modo offline no app publicado (service worker protegido, nunca na pré-visualização).

## O que será adicionado

### 1. Guia de instalação passo a passo
- Nova tela "Instalar app" (acessível pela faixa de instalação e pelo menu lateral) com instruções ilustradas por plataforma:
  - **Android (Chrome):** menu ⋮ → "Instalar app" / "Adicionar à tela inicial".
  - **iPhone/iPad (Safari):** botão Compartilhar → "Adicionar à Tela de Início" → Adicionar.
  - Aviso de que no iPhone é preciso abrir pelo Safari (o botão de instalação automática não existe no iOS).
- Detecção automática da plataforma para mostrar primeiro o guia do dispositivo em uso, com abas para ver o outro.

### 2. Melhoria da faixa de instalação
- A faixa atual passa a abrir o guia completo (em vez de só texto curto), mantendo o botão direto "Instalar app" no Android quando o navegador permite.

### 3. Verificações finais
- Conferir ícones (192/512, maskable e apple-touch-icon) e cor de tema.
- Testar no navegador: faixa aparece uma vez, guia abre, dispensa funciona.
- Offline continua valendo só no app publicado.

## Detalhes técnicos
- Nova página `src/pages/InstalarAppPage.tsx` + rota `/app/instalar`; link em `AppSidebar` e `InstallAppBanner`.
- Reuso da detecção de plataforma já existente em `InstallAppBanner`.
- Sem alterar `src/components/ui/*` nem os arquivos do protótipo PS Express.
- Sem novas cores fixas: apenas tokens de tema.
