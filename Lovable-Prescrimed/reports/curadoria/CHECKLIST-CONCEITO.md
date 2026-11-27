# CHECKLIST DA CONCEÇÃO — PrescriMed v. concepção Dr. Felipe

_Checklist completo extraído do texto-conceito do Dr. Felipe (2026-11-06), com status real verificado no app. Itens ❌ têm plano na fila do fundo._

## 1. Conceito central
| Item | Status |
|---|---|
| Fluxo rápido/intuitivo/minimalista com banco robusto por trás | ✅ (235 condições curadas; gate V1–V10; enriquecimento do banco) |
| Condições dos PS de todo o Brasil (Norte a Sul, público/privado) | ✅ 16 áreas + GO completa + pediatria + procedimentos |

## 2. Busca inteligente
| Item | Status |
|---|---|
| Acha mesmo digitando errado (fuzzy/Levenshtein) | ✅ (lovable-search v1) |
| Acha por frase popular ("dor de cabeça" → Cefaleia/Enxaqueca/Cefaleia em salvas) | ✅ **NOVO** (lovable-search v2 — 60+ sinônimos populares; testado: bicho de pé→Escabiose, cobra me mordeu→Peçonhentos) |
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
| **Personalizar hospital: marcar medicações/recursos disponíveis → app se adapta** (indica o que tem; sugere transferência se imprescindível falta) | ❌ **PLANO** — ver fila ② |
| **Múltiplas condições selecionadas → listas mescladas e deduplicadas** (prescrições, exames, atestados, anamnese…) | ❌ **PLANO** — ver fila ① (grande) |

## 4. Dados do paciente com pré-filtros
| Item | Status |
|---|---|
| Pediátricos (peso, idade; doses mg/kg) | ✅ |
| Obstétricos (gestação; IG por DUM/US) | ⚠️ parcial — gestação ✓; cálculo de IG por DUM/US ❌ (fila ③) |
| Renais (ClCr com cálculo) | ✅ (campo creatinina + ClCr) |
| **Hepatopatas (drogas hepatotóxicas em vermelho)** | ❌ **PLANO** — fila ③ |
| Cardiopatas | ⚠️ parcial — alertas por condição; filtro global de paciente ❌ fila ③ |

## 5. Internação / passagem de bastão
| Item | Status |
|---|---|
| **Modal INTERNAÇÃO com AIH** (preenchimento automático + complementações + upload de documento-modelo lido por IA) | ❌ **PLANO** — fila ④ |
| **Evolução de admissão + prescrição de enfermaria (dieta, cuidados) + exames de admissão** | ❌ **PLANO** — fila ④ |
| Escopo: médico da sala vermelha (não enfermaria) | ✅ princípio respeitado |

## 6. Sala Vermelha — módulos
| Item | Status |
|---|---|
| Painel PCR (ACLS com ciclo/epinefrina/metrônomo) | ✅ |
| Módulo Cardioversão/Desfibrilação | ⚠️ parcial — no Box (PROC-11) + painel PCR; módulo dedicado com cálculo de energia por peso → fila ⑤ |
| **ECG por IA: leitura + acurácia + laudo + ensino curto** | ❌ **PLANO** — fila ⑥ (requer bridge de imagem) |
| **Raio-X por IA: idem** | ❌ **PLANO** — fila ⑥ |
| Procedimentos interativos passo-a-passo | ✅ **24 procedimentos** no Box (10 grupos) |
| **Modal "E no SUS?"** (alternativas para interiores — ex.: IO com agulha 40x12) | ✅ **NOVO** (19 procedimentos com adaptação SUS, flag "adapte ao serviço") |

## 7. Responsabilidade ética / banco relacional
| Item | Status |
|---|---|
| **Prompts para pesquisar em IAs + pipeline (validar→armazenar→processar→adicionar)** | ✅ **NOVO** — [PROMPTS-PESQUISA.md](PROMPTS-PESQUISA.md) |
| Gate de curadoria antes de publicar | ✅ (V1–V10 + digest + assinatura CRM) |

## 8. UI/UX "Steve Jobs"
| Item | Status |
|---|---|
| Layout cockpit do atendimento (paciente+ações+módulos esq., módulo vivo+timeline meio, avisos+segurança+trava dir.) | ✅ **NOVO** (lovable-layout) |
| Hover invertido em módulos/ações | ✅ **NOVO** |
| Backdrop/rodapé dos modais | ✅ (lovable-polish) |
| Identidade visual documentada | ✅ (docs/IDENTIDADE-VISUAL.md) |
| Revisão contínua botão a botão (espaçamentos, tipografia, bordas) | 🔄 contínuo — rodada por rodada |

---

# FILA DE IMPLEMENTAÇÃO (um por um, em loop)

**① MESCLAR CONDIÇÕES** (maior valor clínico): seleção múltipla de condições → prescrições/exames/anamnese/atestados **mesclados e deduplicados** (molécula repetida cai; classes idênticas fundem). Design: array de protos ativos no estado; distribuidor une classes por nome; dedupe por molécula no emitter do modal (não no banco).
**② HOSPITAL DO USUÁRIO**: personalização de medicações/recursos disponíveis → selo "disponível/indisponível" nas prescrições hospitalares + **sugestão de transferência** quando o que falta for imprescindível à condição.
**③ PACIENTE ESPECIAL**: toggle hepatopata (hepatotóxicas em vermelho nas listas) + cardiopata; cálculo de IG obstétrica por DUM e US.
**④ INTERNAÇÃO/AIH**: modal com AIH preenchida pelos dados do atendimento, campos complementares obrigatórios, upload de modelo para IA extrair, evolução de admissão, prescrição de enfermaria (dieta/cuidados), exames de admissão.
**⑤ SALA VERMELHA extras**: módulo dedicado de cardioversão/desfibrilação com energia calculada por peso.
**⑥ ECG/RX por IA**: upload de imagem → leitura IA com nota de acurácia → laudo + ensinamentos curtos (usa o bridge psx-assist; exige extensão para imagem).
