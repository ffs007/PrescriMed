# CHECKLIST DA CONCEPÇÃO — PrescriMed v. concepção Dr. Felipe

_Checklist completo extraído do texto-conceito do Dr. Felipe (2026-11-06), com status real verificado no app. **Rodada 27/11: fila ①–⑥ IMPLEMENTADA e testada ponta a ponta no navegador** (lovable-concepcao.js, 100% aditivo, sem editar app.js)._

## 1. Conceito central
| Item | Status |
|---|---|
| Fluxo rápido/intuitivo/minimalista com banco robusto por trás | ✅ (235 condições curadas; gate V1–V10; enriquecimento do banco) |
| Condições dos PS de todo o Brasil (Norte a Sul, público/privado) | ✅ 16 áreas + GO completa + pediatria + procedimentos |

## 2. Busca inteligente
| Item | Status |
|---|---|
| Acha mesmo digitando errado (fuzzy/Levenshtein) | ✅ (lovable-search v1) |
| Acha por frase popular ("dor de cabeça" → Cefaleia/Enxaqueca/Cefaleia em salvas) | ✅ (lovable-search v2 — 60+ sinônimos populares; testado: bicho de pé→Escabiose, cobra me mordeu→Peçonhentos) |
| Condição sinônima ou mais próxima | ✅ (aliases + fuzzy + sinônimos) |

## 3. Modais estratégicos por condição (específicos, nada genérico)
| Modal | Status |
|---|---|
| Prescrição ambulatorial/de alta | ✅ (com alternativas exaustivas por condição) |
| Prescrição intra-hospitalar rápida | ✅ (variantes com posologia da condição em 1º lugar) |
| Exames de urgência (sem "glicemia em jejum" haha) | ✅ (APAC laboratorial por condição) |
| Outros exames complementares + APAC automático layout SUS | ✅ (APAC imagem/consulta) |
| Atestados e Declarações | ✅ |
| Anamnese/Exame físico dirigidos pré-setados por condição | ✅ (templates por condição) |
| Escores e Calculadoras | ✅ (12 disponíveis + cdss) |
| Encaminhamento ao PSF / especialidades | ✅ |
| Transferência inter-hospitalar | ✅ |
| Personalização: logotipo, CRM, médico, RQE, endereço | ✅ (psx.cfg/docstyle) |
| Carimbo personalizado com imagem datada nas impressões | ✅ (lovable-stamp) |
| **Personalizar hospital: marcar medicações/recursos → app se adapta** | ✅ **IMPLEMENTADO 27/11** — botão "🏥 Meu hospital" no painel; selo vermelho "SEM NO SEU HOSPITAL" na linha do fármaco; **banner com sugestão de transferência** quando item imprescindível da condição ou recurso (UTI/TC/hemodinâmica…) falta — testado: furosemida em falta no EAP → banner + botão "Abrir Transferência" |
| **Múltiplas condições → listas mescladas e deduplicadas** | ✅ **IMPLEMENTADO 27/11** — botão "＋ Mesclar condição"; banda "Mesclado: A + B" com remover; prescrições hospitalar/ambulatorial, exames (união dos sugeridos), anamnese/exame físico (grupos unidos), encaminhamento, transferência e evolução ganham renderizadores mesclados com **dedupe de molécula e de exame** — testado: Dor torácica cardiovascular + EAP → classes das duas condições num modal só |

## 4. Dados do paciente com pré-filtros
| Item | Status |
|---|---|
| Pediátricos (peso, idade; doses mg/kg) | ✅ |
| Obstétricos (gestação; IG por DUM/US) | ✅ **IMPLEMENTADO 27/11** — campos DUM e "IG por US (semanas)" em Dados do paciente; faixa "IG 12s 3d (DUM) · US: 12s · DPP 08/06/2027" no painel (Naegele testado) |
| Renais (ClCr com cálculo) | ✅ (campo creatinina + ClCr) |
| **Hepatopatas (drogas hepatotóxicas em vermelho)** | ✅ **IMPLEMENTADO 27/11** — toggle "Hepatopata" em Dados do paciente; hepatotóxicas (~40 moléculas) recebem badge vermelho nas prescrições |
| Cardiopatas | ✅ **IMPLEMENTADO 27/11** — toggle "Cardiopata"; banner de cautela de volume (10 mL/kg) no modal hospitalar |

## 5. Internação / passagem de bastão
| Item | Status |
|---|---|
| **Modal INTERNAÇÃO com AIH** (preenchimento automático + upload de modelo lido por IA) | ✅ **IMPLEMENTADO 27/11** — card "Internação / AIH"; AIH pré-preenchida do atendimento (caráter/tipo/regime/CID), upload de modelo PDF→IA extrai campos com validação de valores |
| **Evolução de admissão + prescrição de enfermaria + exames de admissão** | ✅ **IMPLEMENTADO 27/11** — evolução de admissão auto-redigida (S/O/A/P com Assistente), prescrição de enfermaria montada da prescrição do PS + dieta, 9 exames de admissão com busca SIGTAP que marcam no pedido APAC; PDF da AIH |
| Escopo: médico da sala vermelha (não enfermaria) | ✅ princípio respeitado |

## 6. Sala Vermelha — módulos
| Item | Status |
|---|---|
| Painel PCR (ACLS com ciclo/epinefrina/metrônomo) | ✅ |
| **Módulo Cardioversão/Desfibrilação dedicado com energia por peso** | ✅ **IMPLEMENTADO 27/11** — card próprio: energia por ritmo (FA 150 J → 200; flutter/TSV 100 J; TVcp 100 J; FV/pVT 200 J não-sincronizado) e **por peso na pediatria (2 J/kg → 4 J/kg, teto 10 J/kg)**, sedação calculada (midazolam/fentanil/ketamina por kg), drogas pós-2º choque (amiodarona/epinefrina por kg), checklist e registro no atendimento — testado nos dois regimes |
| **ECG por IA: leitura + acurácia + laudo + ensino curto** | ✅ **IMPLEMENTADO 27/11** — card "ECG / RX com IA": upload de imagem (downscale 1600px) pelo bridge com gate limits(); laudo estruturado + NOTA DE ACURÁCIA + 3 ensinamentos; editável antes de registrar no prontuário |
| **Raio-X por IA: idem** | ✅ **IMPLEMENTADO 27/11** — mesmo card, prompt dedicado (achados por sistema, impressão, sugestão, acurácia) |
| Procedimentos interativos passo-a-passo | ✅ 24 procedimentos no Box (10 grupos) |
| **Modal "E no SUS?"** (alternativas para interiores) | ✅ (19 procedimentos com adaptação SUS, flag "adapte ao serviço") |

## 7. Responsabilidade ética / banco relacional
| Item | Status |
|---|---|
| **Prompts para pesquisar em IAs + pipeline** | ✅ — [PROMPTS-PESQUISA.md](PROMPTS-PESQUISA.md) (playbook PESQUISAR→CRUZAR→REDIGIR→GATE→ASSINAR→BUILD) |
| Gate de curadoria antes de publicar | ✅ (V1–V10 + digest + assinatura CRM) |

## 8. UI/UX "Steve Jobs"
| Item | Status |
|---|---|
| Layout cockpit do atendimento | ✅ (lovable-layout; fusão colunas 1+2 feita conforme pedido) |
| Hover invertido em módulos/ações | ✅ |
| Backdrop/rodapé dos modais | ✅ (lovable-polish) |
| Identidade visual documentada | ✅ (docs/IDENTIDADE-VISUAL.md) |
| Revisão contínuia botão a botão | 🔄 contínuo |

---

# FILA ①–⑥ — CONCLUÍDA (27/11), em `lovable-concepcao.js` (um script aditivo, cache-busted)

**Arquitetura**: usa só `PSAPP.test` (C/hcalc/hospItems/anamnese/efText/openMod/chooseProto) + globals; intercepta cliques dos cards em fase de captura quando há mesclagem e faz patch de `PSAPP.test.openMod` para rotear aos renderizadores mesclados. `app.js` intocado. Verificação: navegador local, cenário "Dor torácica cardiovascular + Edema Agudo de Pulmão".

- **① MESCLAR CONDIÇÕES** — ✅ banda com remover; união de classes, exames sugeridos, grupos de anamnese/EF, hdx múltiplas em enc/transf/evol; dedupe por molécula no emitter (testado: item pré-existente → 2ª via descartada) e por exame; protoBlock estendido às condições mescladas (AINE bloqueado se dengue/varicela estiver entre elas).
- **② MEU HOSPITAL** — ✅ psx.hospital (drogas por id + 10 recursos); selos vermelhos em ambos os modais de prescrição (nativo e mesclado); banner de transferência com lista do que falta + recurso da condição.
- **③ PACIENTE ESPECIAL** — ✅ hepato/cardio/IG; ~40 hepatotóxicas mapeadas; faixa de IG no painel com DPP.
- **④ INTERNAÇÃO/AIH** — ✅ 4 boxes (AIH, evolução de admissão, enfermaria, exames de admissão) + upload de modelo lido por IA + PDF.
- **⑤ CARDIOVERSÃO/DESFIBRILAÇÃO** — ✅ energia adulto/pediátrica por ritmo e peso + sedação + pós-choque + checklist + registro.
- **⑥ ECG/RX COM IA** — ✅ upload → laudo estruturado + acurácia + 3 ensinamentos; fallback honesto se a visualização não envia imagens.

# PRÓXIMA FILA (sugestões, ordem proposta)

**⑦ Exercício de repetição/espaçada**: quiz curto por condição (3 perguntas baseadas nos "não fazer" e nas doses) para o plantonista treinar — usa o conteúdo já curado, fecha o ciclo ensino-aplicação que o ⑥ começou.
**⑧ Contexto de plantão**: relatório de fim de plantão (todos os atendimentos do turno, com escalas e destinos) exportável em PDF/clipboard.
**⑹⑩ Backup/sincronia do caso**: `psx.case` espelha para tabela própria via `__psxBridge` (como tpl/prot) para retomar atendimento de outro dispositivo.
**⑪ Offline-first completo**: service worker para o protótipo funcionar 100% offline no hospital (o banco já é local; falta cache dos assets).
**⑫ Expansão do banco**: aplicar PROMPTS-PESQUISA.md às 20 condições de maior porta de PS que ainda têm versão resumida (fila de aprofundamento contínua).
