# PROMPTS DE PESQUISA — playbook de expansão do banco (responsabilidade ética)

Como usar IA para trazer informação nova ao PrescriMed **sem contaminar o gate**.
Pipeline: **PESQUISAR → CRUZAR → REDIGIR → GATE → ASSINAR → BUILD**. Nada entra no app sem passar pelos 6 degraus.

## Degrau 1 — PESQUISAR (prompt para a IA de pesquisa)

```
Atue como farmacólogo clínico revisor de protocolos de urgência e emergência brasileiros.
Pesquise e sintetize o MANEJO ATUAL de "[CONDIÇÃO]" para uso em pronto-socorro no Brasil,
cobrindo OBRIGATORIAMENTE:
1) Definição operacional de 2-3 frases (o que o médico do PS decide em minutos).
2) Sinais de alarme que mudam destino (mín. 5, cada um com a conduta).
3) Prescrição AMBULATORIAL: fármacos de 1ª linha + alternativas exaustivas, com dose adulto,
   dose pediátrica (mg/kg quando couber), via, frequência, duração, dose máxima.
4) Prescrição HOSPITALAR (EV/IM/SC/nebulização): mesmo nível de detalhe + diluição e tempo de infusão.
5) Contraindicações POR FÁRMACO (não genéricas) e ajuste renal/hepático.
6) "Não fazer" do PS para essa condição (erros comuns que matam).
7) Exames de urgência (com APAC quando couber no SUS) e complementares.
8) Fontes: diretriz da sociedade brasileira da especialidade (ano), Protocolos MS, bula ANVISA.
Responda em JSON com as chaves: nome, cat, alias[], cid[], alerta, redFlags[], naoUsar[],
ambulatorial{classes[{nome,itens[{linha,droga,ap,pos,ped,motivo}]}]},
hospitalar{classes[...]}, exames{urgencia[],complementares[]}.
NÃO invente apresentação comercial. Dose máxima sempre. Fonte ao lado de cada item.
```

## Degrau 2 — CRUZAR (o que fazer com o resultado em mãos)

A saída da IA é MINÉRIO, não conteúdo. Regras:
1. **Cruzamento obrigatório**: cada dose conferida em 2ª fonte independente (bulário ANVISA,
   diretriz citada, UpToDate/Micromedex se disponível). Dose sem 2ª fonte = não entra.
2. **Regra de ouro**: IA alucina apresentação comercial — o workspace exige
   `confirmar_apresentacao_local: true`. Confira na farmácia do serviço.
3. Divergência entre fontes → escolha a DIRETRIZ brasileira mais recente e anote a divergência
   em `motivo` (ex.: "SBC 2023 diverge de UpToDate — seguido SBC").
4. Conteúdo que você (Dr. Felipe) não assinaria NÃO entra — a IA sugere, você decide.

## Degrau 3 — REDIGIR (converter para o molde)

Copie o JSON para `default-workspace/sindromes/XX-99_nome.json` no molde `sindrome/1.0.0`
(veja ALG-01 como exemplar: medicamentos com papel/indicacao/dose/via/frequencia/duracao/
dose_maxima/contraindicacoes/observacoes + auditoria.fontes). Ou me entregue a resposta
crua que eu converto no molde.

## Degrau 4 — GATE

`node scripts/workspace/import.mjs` → converte para `content/condicoes/*.json` e roda o
gate V1–V10 (1ª linha declarada, droga banida, referência válida, molécula duplicada,
posologia herdada, orientações, red flags ≥3, pediatria, posologia vazia, id duplicado).
**Erro de gate = não compila.** Avisos = revisar antes de assinar.

## Degrau 5 — ASSINAR

`reports/curadoria/DIGEST-CURADORIA.md` → leia → "aprovo" no chat (ou `aprovar.mjs` com CRM).
Condição só vira produção com status aprovado e assinatura registrada.

## Degrau 6 — BUILD

`node scripts/content/build.mjs` → `curated-data.js` → F5 no preview → teste a condição
(busca, prescrições, doses, avisos) → pronto para a internet.

## Dicas de prompt contínuo

- Atualização de condição existente: "...compare o manejo que você sabe com ESTE protocolo
  [colar JSON da condição] e liste SOMENTE as divergências com fonte e ano."
- Droga nova no Brasil: "...dê apresentações ANVISA vigentes, doses PS, contraindicações e
  o que a diretriz brasileira diz; sinalize se off-label no PS."
- Revisão por denúncia de erro: "um colega afirma que [X] está errado neste protocolo
  [colar]. Verifique com fontes e diga, com data/fonte, se procede."
