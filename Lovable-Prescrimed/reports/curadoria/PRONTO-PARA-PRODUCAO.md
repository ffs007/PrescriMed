# PRONTO PARA PRODUÇÃO — fusão default-workspace ↔ webapp

_Data: 2026-11-06 · Autor: ZCode · Assinatura: Dr. Felipe ("Aprovo", em chat)_

## Estado final

| Item | Valor |
|---|---|
| Condições curadas no runtime | **235** (todas `aprovado`) |
| 35 condições próprias do pipeline (15 aprovadas antes + 20 lotes 1–2) | ✔ |
| Condições do workspace importadas e vivas | **149** (de 221 síndromes; 72 gêmeos de cobertura removidos) |
| Substituições de protocolos legados | 51 arquivos (dismenorreia, escabiose, hipoglicemia, IC descompensada…) |
| Drogas hospitalares no runtime | **1.052** (nativas + variantes por condição + novas) |
| Procedimentos curados no Box | **24** (BOX-01 a BOX-24) em 10 grupos |
| Build de produção | **0 erros** (gate V1–V9) |
| Bundle | `curated-data.js` 3,84 MB · `procedures-data.js` ~60 KB |

## Lote 1 do aprofundamento (2026-11-06, `enrich-queue.mjs`)

## Layout do atendimento (2026-11-06, `lovable-layout.js`)

Disposição pedida pelo Dr. Felipe, implementada e provada no navegador:
- **Esquerda**: Ações do atendimento (Aplicar modelo / Salvar / Protocolos) em cima, módulos abaixo (lista vertical)
- **Meio**: cartão do módulo aberto ("Em edição: … ● ao vivo" / "Último módulo aberto: …" após fechar; reseta ao trocar de condição) + "Atendimento até agora" sempre por último
- **Direita**: Avisos da condição (Não usar / Atenção / Paciente — clones, originais preservados no app) em cima, depois Segurança clínica e Trava de emissão
- **Hover invertido** em módulos e ações (fundo azul, texto branco)
- Home desliga o grid e volta ao fluxo normal; ida/volta testadas sem resíduo

## Lote 1 — detalhe original

Condições enriquecidas à mão (padrão WeMEDS), provadas no runtime:
- **Sepse**: + Reanimação hemodinâmica (RL 30 mL/kg, noradrenalina 1º vasopressor — periférica aceita, vasopressina, dobutamina) + pacote da 1ª hora no alerta
- **Choque séptico**: + Vasopressores e inotrópicos
- **Dor torácica**: + AAS condicional (após excluir dissecção) + etiologia (esmolol na dissecção, colchicina na pericardite)
- **TEP**: + Trombólise massiva (alteplase 100 mg/2 h) + guardas de sangramento
- **AVC suspeito**: guardas de janela (4,5 h), PA por estratégia, antiagregação pós-TC
- **Crise convulsiva**: + Levetiracetam IV na 2ª linha; flumazenil proibido de rotina; eclâmpsia → Mg
- **Crupe**: + adrenalina nebulizada (estridor em repouso) + dexametasona 0,6 mg/kg
- **Bronquiolite**: "o que NÃO funciona" (sem salbutamol/corticoide/ATB de rotina) + critérios de internação
- **Intoxicações**: + carvão ativado com contraindicações + NAC/fomepizol/atropina/flumazenil

Correções de processo no mesmo lote: `enrich-queue.mjs` agora grava SEMPRE no arquivo lido (nunca pelo id interno — sepse.json é `leg_2001`); **gate V10** no build: id de protocolo duplicado = erro.

## Enrichment global (2026-11-06, 2ª rodada)

- **Posologia terapêutica como 1ª opção**: itens hospitalares com posologia da síndrome (pos explícita ou `dose.texto` do import estruturado) agora viram variante da condição com essa posologia em 1º lugar no combobox — corrige o caso enoxaparina (abria profilaxia 40 mg numa SCA) em TODAS as condições.
- **Segurança por droga devolvida ao app**: `contraindicacoes` + `observacoes` + `ajuste_renal` de cada medicamento do default-workspace, descartados pelos importadores, foram remontados nas notas de **1.674 itens em 200 condições** (`enrich-all.mjs`). Ex.: esmolol ("NÃO: cocaína; FC < 50; BAV 2–3º; asma grave; choque" + meia-vida 9 min), naproxeno na dismenorreia ("Evitar em dengue...").
- **SCA-âncora** (enriquecimento manual `enrich-car09.mjs` + `fix-car09-classes.mjs`): 12 classes hospitalares — clopidogrel ≥75 anos, HNF com TTPa alvo, nitroglicerina EV com diluição, metoprolol com contras, prasugrel, IAM de VD, esquema de insulina, espironolactona FE≤40%, GpIIb/IIIa, alteplase/SK.
- **Assinatura**: CRM-DF 34266 · CRM-GO 28469 em todos os `meta.assinatura`.

## Verificações executadas (navegador, produção)

1. **Runtime**: 235 curados, todos aprovados; tenecteplase com dose por peso; SCA hospitalar sem `[object Object]`; console limpo.
2. **Rodapé da receita** (bug do anexo): barra sincronizada com a altura real do `#mFoot` (69px = 69px), sobreposição **zero** — fix em `lovable-polish.js`.
3. **Higiene de caso (P0)**: receita contaminada entre condições é zerada em ≤120 ms com a página ativa; catch-up em `focus`/`visibilitychange` para aba em segundo plano (`lovable-casehygiene.js`).
4. **Box**: aba Procedimentos mostra os 24 curados (os 8 legados eram subconjunto — dedupe por cobertura).
5. **Foco/kit**: dismenorreia abre "Por queixa" com "⚡ Usar kit: Dismenorreia" — sem contaminação de receita entre queixas.

## O que ainda é pendência honesta

- **CRM no registro de assinatura**: a aprovação em massa gravou "registro em chat". Informe o CRM uma vez (perfil do app ou `aprovar.mjs`) para formalizar.
- **Hosp wired sem `pos`**: itens hospitalares que herdam o cadastro nativo continuam intocados (comportamento desejado); variantes só existem quando o workspace trazia posologia própria.
- **Dose pediátrica mg/kg automática**: o campo `dose` estruturada está gravado nos JSONs; o cálculo automático exige conferência de concentração local (decisão já registrada pela sessão de importação) — próximo ciclo.
- **Especificação/schema do workspace** (`prescrimed_condicao.schema.json`, governança com claim_ids/fontes/revisores): é o modelo do produto v2; recomendado adotar como próximo passo do pipeline, não bloqueia esta entrega.

## Como regenerar (tudo versionado em git)

```bash
node scripts/workspace/import.mjs          # (re)importa o workspace
node scripts/workspace/merge-cleanup.mjs   # remove gêmeos de cobertura
node scripts/workspace/finish.mjs          # aprova + dedupe intra-classe
node scripts/workspace/build-procedures.mjs
node scripts/content/build.mjs             # produção (só aprovados)
```

## Para publicar

O artefato é estático: sincronize `public/prototype/*` (+ `content/` e `scripts/` para reprodutibilidade) para o host do app. Nenhuma migração de banco é exigida por esta entrega.
