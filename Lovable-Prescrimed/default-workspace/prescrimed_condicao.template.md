# PrescriMed — Template de Cadastro de Condição Clínica

| Campo | Valor |
|---|---|
| Versão do template | 1.0.0 |
| Data | 2026-11-05 |
| Condição | **«não informada»** — campo obrigatório, ver Bloco 1 |
| Status | Template estrutural — **conteúdo clínico não validado** |
| Responsável clínico | «nome, CRM/UF» |
| Fontes anexadas | **Nenhuma** |
| Pesquisa externa realizada | **Não** |
| Uso assistencial | **Bloqueado** até cumprir o Anexo B |

> **Aviso de integridade.** Nenhuma fonte clínica foi fornecida nesta solicitação e nenhuma pesquisa externa foi executada. Todos os campos clínicos estão como `«preencher»` ou `null`. Este documento define **estrutura, regras editoriais e critérios de aceite** — não contém dose, posologia, conduta, diagnóstico, código de faturamento ou referência bibliográfica. Nada aqui é recomendação clínica. A publicação exige validação formal (Anexo B) com fontes registradas (Anexo C).

---

## Como usar este template

1. **Bloco 1–5** definem identidade e fronteira da condição. Sem isso, o resto não deve ser escrito.
2. **Bloco 6–8** definem reconhecimento e documentação (alarmes, anamnese, exame físico).
3. **Bloco 9–15** definem conduta (prescrição, medicações, alternativas, ajustes, exames).
4. **Bloco 16–21** definem saída (orientações, documentos, encaminhamentos, critérios).
5. **Bloco 22–23** definem segurança (alertas, contraindicações, dados mínimos).
6. **Bloco 24–25** fecham auditoria e lacunas.
7. Ao final: **Anexo A** (banco), **Anexo B** (gate), **Anexo C** (fontes), **Anexo D** (JSON), **Anexo E** (anti-padrões).

**Regra de ouro:** se um campo não muda conduta, não muda documento e não muda segurança, ele não entra. Template não é formulário para preencher tudo — é contrato de conteúdo mínimo.

## Convenções

| Símbolo | Significado |
|---|---|
| `«...»` | Conteúdo a preencher e validar — **nunca** publicável como está |
| `null` | Ausente no JSON |
| **O** | Obrigatório para publicar |
| **C** | Condicional (definir o gatilho) |
| **F** | Facultativo |
| `[Verificar]` | Exige confirmação jurídica, regulatória, clínica ou de fornecedor |
| `claim_id` | Vínculo com afirmação clínica atômica + fonte (obrigatório em conteúdo clínico) |
| `risk_class` | A (crítico), B (relevante), C (apoio) — herda a matriz da especificação |

**Regra de proveniência:** todo item clínico (dose, contraindicação, alerta, critério, exame) aponta para `claim_id`; todo `claim_id` aponta para ≥ 1 fonte registrada. Item sem `claim_id` não publica.

---

## 1. Nome da condição

| Campo | Tipo | Obrig. | Regra |
|---|---|---|---|
| `nome_canonico` | string | O | Nome diagnóstico em português, singular, sem sigla, sem nome de medicamento, sem termo popular |
| `nome_exibicao` | string | O | ≤ 60 caracteres; pode incluir qualificador clínico (`«condição» — «qualificador»`) |
| `slug` | string | O | kebab-case, único, estável (não muda após publicação) |
| `cid10` | string[] | O | ≥ 1 código; uso sujeito a licença [Verificar] |
| `ciap2` | string[] | C | Apenas se houver uso na atenção primária |
| `especialidade` | enum | O | `«emergencia / clínica_medica / pediatria / ginecologia_obstetricia / cirurgia / ortopedia / outra»` |
| `risk_class` | enum | O | `A / B / C` — define revisão e dupla checagem |
| `populacao` | enum[] | O | `adulto / pediatrico / gestante / puerpera / idoso` |
| `status` | enum | O | `rascunho / em_revisao / aprovado / publicado / suspenso / arquivado` |
| `definicao_operacional` | string | O | ≤ 80 palavras (Bloco 4) |

**Regras de aceite**
- O nome canônico não pode ser sintoma isolado, achado laboratorial ou medicamento.
- Verificação de duplicidade: se sobreposição ≥ 80% com condição existente, cadastrar como variação da existente.
- Sigla só é aceita como termo de busca (Bloco 3), nunca como nome canônico.
- `slug` imutável após a primeira publicação (links e auditoria dependem dele).

---

## 2. Termos de busca

Objetivo: garantir que o médico encontre a condição com o vocabulário que ele realmente usa — inclusive errado.

| # | `termo` | `tipo` | `peso` (0–1) | Justificativa | `testado` | `claim_id` |
|---|---|---|---|---|---|---|
| 1 | «termo» | `canonico` | 1,0 | nome canônico | ☐ | — |
| 2 | «termo» | `sinonimo` | «0,8» | «por que é usado» | ☐ | «claim» |
| 3 | «termo» | `popular` | «0,6» | «como o paciente/médico fala» | ☐ | «claim» |
| 4 | «termo» | `abreviacao` | «0,7» | «sigla de uso corrente» | ☐ | «claim» |
| 5 | «termo» | `erro_comum` | «0,4» | «erro de digitação frequente» | ☐ | — |
| 6 | «termo» | `regional` | «0,5» | «região onde é usado» | ☐ | «claim» |

**Regras de aceite**
- Mínimo: 1 canônico + 3 sinônimos/populares + 1 abreviação (quando existir).
- Todo termo é testado no conjunto dourado de busca; a condição deve aparecer no **top 3** para cada termo.
- Termo ambíguo (que abre outra condição com mais frequência) é rejeitado ou recebe desambiguação explícita.
- Termo ofensivo ou estigmatizante não entra, mesmo que popular.
- `erro_comum` não exige fonte clínica (é dado linguístico), mas exige registro de frequência.

---

## 3. Sinônimos e expressões populares

| Expressão | Tipo | Registro/região | Risco de ambiguidade | Decisão |
|---|---|---|---|---|
| «expressão» | `sinonimo` | «nacional» | «baixo» | aceito |
| «expressão» | `popular` | ««região»» | «médio — também usado para «outra condição»» | aceito com desambiguação |
| «expressão» | `abreviacao` | «nacional» | «baixo» | aceito |
| «expressão» | `erro_comum` | — | — | aceito |

**Regras de aceite**
- Expressão popular **nunca** vira condição separada; ela mapeia para o nome canônico.
- Expressão com ambiguidade real exige tela de desambiguação (ex.: "dor no peito" pode abrir mais de uma condição).
- Cada expressão tem origem registrada (fonte, entrevista com médicos, log de busca) para auditoria.

---

## 4. Definição operacional para o sistema

Não é definição de livro-texto. É o contrato que diz ao sistema **quando abrir esta condição e quando não abrir**.

```
É «condição/síndrome» caracterizada por «elementos definidores».
No pronto-socorro, aplica-se quando «contexto de uso».
Não se aplica quando «fronteira de exclusão» — nesse caso, usar «condição alternativa».
```

| Campo | Regra |
|---|---|
| Extensão | ≤ 80 palavras |
| Conteúdo | População-alvo + apresentação típica + fronteira |
| Proibido | Tratamento, dose, prognóstico detalhado, fisiopatologia extensa |
| Obrigatório | Nomear ao menos 2 diagnósticos diferenciais com link para a condição correspondente |

**Critério de aceite:** um médico que nunca viu o sistema consegue decidir, lendo apenas este bloco, se o caso é desta condição ou de outra.

---

## 5. Inclusões e exclusões

| Tipo | Item | Condição alternativa | Observação |
|---|---|---|---|
| Inclui | «apresentação clínica» | — | «variação aceita» |
| Inclui | «faixa etária/contexto» | — | «condição de inclusão» |
| Exclui | «achado/situação» | «condição X» | «por que exclui» |
| Exclui | «diagnóstico diferencial» | «condição Y» | «como diferenciar em 1 frase» |

**Regras de aceite**
- Toda exclusão aponta para uma condição existente no catálogo. Exclusão sem destino é porta fechada — proibida.
- Cobrir os principais diferenciais (mínimo 3, definido pelo revisor clínico).
- "Inclui" não pode ser tão amplo que capture outra condição do catálogo.

---

## 6. Sinais de alarme

| ID | Sinal | Por que importa | Ação imediata | Destino | `claim_id` |
|---|---|---|---|---|---|
| AL-01 | «sinal observável» | «o que indica» | «verbo de ação» | `sala_vermelha` | «claim» |
| AL-02 | «sinal» | «o que indica» | «ação» | `observacao` | «claim» |
| AL-03 | «sinal» | «o que indica» | «ação» | `transferencia` | «claim» |

**Regras de aceite**
- Sinal precisa ser **observável** (exame, medida, história objetiva) — "piora clínica" não é sinal.
- Ação começa com verbo e é executável no PS (ex.: "acionar", "monitorizar", "solicitar", "encaminhar").
- `destino` ∈ `sala_vermelha | observacao | internacao | transferencia | reavaliacao`.
- Máximo 10 sinais, ordenados por gravidade; os 3 primeiros aparecem no cabeçalho da condição.
- Nenhum sinal sem `claim_id`. Nenhum sinal sem ação.

---

## 7. Anamnese direcionada

### 7.1 Campos

| ID | Campo | Tipo | Obrig. | Exibição | Por que (decisão que muda) |
|---|---|---|---|---|---|
| AN-01 | Queixa e duração | texto curto | O | sempre | define enquadramento |
| AN-02 | Início (súbito/progressivo) | enum | O | sempre | diferencia etiologias |
| AN-03 | Sintomas associados | multienum | O | sempre | «quais» |
| AN-04 | Antecedentes relevantes | multienum | C | «se» | muda conduta/risco |
| AN-05 | Medicações em uso | lista | O | sempre | interação/duplicidade |
| AN-06 | Alergias | lista | O | sempre | contraindicação |
| AN-07 | Fatores de risco | multienum | C | «se» | estratificação |
| AN-08 | Revisão dirigida — «sistema 1» | multienum | C | «se» | «decisão» |
| AN-09 | Revisão dirigida — «sistema 2» | multienum | C | «se» | «decisão» |
| AN-10 | Contexto (exposição, viagem, trauma) | multienum | C | «se» | «decisão» |

**Regras de aceite**
- Máximo 8 campos visíveis por padrão; o resto em "mais campos".
- Só entram sistemas com relação clínica demonstrável. Sistema sem decisão associada é proibido.
- Todo campo `C` tem gatilho explícito de exibição.
- "Negativos relevantes" são um campo, não uma frase livre.

### 7.2 Texto gerado (determinístico)

```
Paciente de «idade» anos, «sexo», com «queixa» de início «início» e duração «duração»,
associado a «sintomas_associados». Nega «negativos_relevantes».
Antecedentes: «antecedentes». Em uso de «medicacoes». Alergias: «alergias».
```

**Regras de aceite**
- Cada frase do template tem um campo de origem; frase sem campo é erro de conteúdo.
- O texto reflete exatamente o que foi marcado — teste automatizado de fidelidade.
- Edição manual é permitida e registrada em diff (autoria preservada).

---

## 8. Exame físico direcionado

| Bloco | Item | Obrig. | Por que | Achado que muda conduta |
|---|---|---|---|---|
| Vitais | PA, FC, FR, T, SpO₂ | O | «critério» | «limiar de alarme» |
| Vitais | Glicemia capilar | C | «se» | «limiar» |
| Vitais | Peso | C | «se» | «dose por kg» |
| Geral | Estado geral, hidratação, perfusão | O | «critério» | «achado» |
| Segmentar | «exame dirigido 1» | O | «critério» | «achado» |
| Segmentar | «exame dirigido 2» | C | «se» | «achado» |
| Negativos | «achado negativo relevante» | O | «exclui gravidade» | — |

**Regras de aceite**
- Nada de semiotécnica completa: cada item existe porque muda conduta, estratifica risco ou compõe documento.
- Máximo 10 itens visíveis; o restante é opcional.
- Achados negativos relevantes são explícitos (o que se pesquisou e não se encontrou).
- Nenhum item de exame físico pode ser exigido se não houver ação associada a ele.

---

## 9. Prescrição ambulatorial

Itens levados pelo paciente, sem administração hospitalar. `setting = ambulatorial`.

| ID | Classe | Item | Indicação | Dose | Via | Freq. | Duração | Dose máx. | Ajustes | Precauções | Alternativa | `claim_id` |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| PA-01 | «sintomatico/antibiotico/suporte» | «medicamento» | «indicação específica» | «valor + unidade» | «VO» | «intervalo» | «dias» | «valor + unidade» | «renal/hepático/…» | «principais» | «PA-0x» | «claim» |
| PA-02 | ... | ... | ... | ... | ... | ... | ... | ... | ... | ... | ... | ... |

**Regras de aceite**
- Nenhum item sem indicação específica (a indicação é da condição, não "uso geral").
- Antibiótico/terapia com duração máxima explícita e critério de reavaliação.
- "Se necessário" exige dose máxima por dia e frequência máxima.
- Via intravenosa só com justificativa de manutenção domiciliar/hospitalar — não é padrão ambulatorial.
- Toda dose com `dose_maxima` quando a classe exigir teto; ausência deve ser justificada.
- Item indisponível no formulário local gera alerta e alternativa (não bloqueio silencioso).

---

## 10. Prescrição intra-hospitalar rápida

Itens administrados na unidade. `setting = intrahospitalar`.

| ID | Classe | Item | Indicação | Dose | Diluição | Via | Tempo/velocidade | Freq. | Duração | Monitorização | Dupla checagem | `claim_id` |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| PI-01 | «classe» | «medicamento» | «indicação» | «valor + unidade» | «volume + diluente» | «IV/IM/SC» | «minutos ou mL/h» | «intervalo» | «dose única/dias» | «o que medir» | sim/não | «claim» |

**Regras de aceite**
- Medicamento de alta vigilância exige dupla checagem e monitorização explícita.
- "Contínuo" sem velocidade ou dose/hora é proibido.
- Toda via IV tem diluição, tempo de infusão e compatibilidade declarados quando aplicável.
- Item "se necessário" define limite por período (não "à vontade").

---

## 11. Medicações principais

Menu terapêutico em nível de classe — **sem dose** (dose fica nos Blocos 9 e 10, onde há contexto).

| Classe terapêutica | Papel | Por que está no conjunto | Quando evitar | `claim_id` |
|---|---|---|---|---|
| «classe» | `primeira_linha` | «objetivo clínico» | «situação» | «claim» |
| «classe» | `suporte` | «objetivo» | «situação» | «claim» |
| «classe» | `resgate` | «objetivo» | «situação» | «claim» |

**Regras de aceite**
- Ao menos uma medida não farmacológica no conjunto (hidratação, repouso, isolamento, monitorização) quando aplicável.
- "Quando evitar" é obrigatório para toda classe.
- Nenhuma classe entra sem papel definido (não existe "outros").

---

## 12. Alternativas

| Alternativa | Critério de troca | Quando NÃO usar | `claim_id` |
|---|---|---|---|
| «medicamento/classe» | `indisponivel_local` | «situação» | «claim» |
| «medicamento/classe» | `alergia` | «situação» | «claim» |
| «medicamento/classe» | `contraindicacao` | «situação» | «claim» |
| «medida não farmacológica» | `falha_ou_intolerancia` | «situação» | «claim» |

**Regras de aceite**
- Alternativa só existe com critério de troca; sem critério, é opção solta — proibida.
- Critérios padronizados: `indisponivel_local | alergia | contraindicacao | falha | intolerancia | custo | preferencia_institucional`.
- Alternativa que exige monitorização diferente deve declarar isso.
- Toda alternativa é checada contra o formulário local antes de aparecer.

---

## 13. Ajustes e precauções

| População | Dado de entrada | Regra de ajuste | Monitorização | Risco se não ajustar | `claim_id` |
|---|---|---|---|---|---|
| Pediátrico | peso (kg) | «regra por peso» | «o que medir» | «risco» | «claim» |
| Gestante | IG/DUM | «regra» | «o que» | «risco» | «claim» |
| Lactante | — | «regra» | «o que» | «risco» | «claim» |
| Renal | ClCr estimada | «faixas» | «o que» | «risco» | «claim» |
| Hepático | «Child-Pugh/enzimas» | «faixas» | «o que» | «risco» | «claim» |
| Obeso | peso/IMC | «regra» | «o que» | «risco» | «claim» |
| Idoso | idade/fragilidade | «regra» | «o que» | «risco» | «claim» |
| Cardiopata | «condição» | «regra» | «o que» | «risco» | «claim» |

**Regras de aceite**
- Todo ajuste referencia um campo do Bloco 23. Ajuste sem dado de entrada é inexecutável.
- Fórmula de função renal padronizada pela instituição [Verificar].
- Faixas numéricas são conteúdo clínico validado, não constante de código.
- Alergia é tratada como contraindicação no motor de regras (Bloco 22).

---

## 14. Exames de urgência

| ID | Exame | Indicação | O que muda na conduta | Prazo esperado | Recurso | Código | `claim_id` |
|---|---|---|---|---|---|---|---|
| EU-01 | «exame» | «indicação» | «decisão que altera» | «min/h» | `«lab / rx / ecg / us / tc»` | «TUSS/SIGTAP/LOINC» [Verificar] | «claim» |

**Regras de aceite**
- "O que muda na conduta" é obrigatório. Exame que não muda decisão sai da lista.
- Prazo é declarado (o que é "urgente" naquela unidade).
- Recurso exigido é confrontado com a capacidade da unidade; ausência gera sugestão de transferência.
- Exame point-of-care é marcado como tal.

---

## 15. Exames complementares

| ID | Exame | Indicação | O que muda | Prazo | Rotina? | `claim_id` |
|---|---|---|---|---|---|---|
| EC-01 | «exame» | «indicação» | «decisão» | «h/dias» | sim/não | «claim» |

### 15.1 Exames não rotineiros (justificativa obrigatória)

| Exame | Quando considerar | Quando não solicitar | `claim_id` |
|---|---|---|---|
| «exame» | «gatilho» | «situação» | «claim» |

### 15.2 Exames a evitar

| Exame | Motivo | Alternativa | `claim_id` |
|---|---|---|---|
| «exame» | «baixo valor, radiação, custo, tempo» | «conduta» | «claim» |

**Regras de aceite**
- "Não rotineiro" exige gatilho e contraindicação de uso.
- "Evitar" exige motivo explícito e alternativa — é conteúdo de stewardship, não opinião.
- Nenhum exame é solicitado automaticamente pelo sistema; a decisão é sempre humana.

---

## 16. Orientações de alta

| ID | Categoria | Texto ao paciente | Obrigatória |
|---|---|---|---|
| OR-01 | `cuidados` | «linguagem clara» | sim |
| OR-02 | `medicacao` | «como tomar, o que fazer se esquecer» | sim |
| OR-03 | `alimentacao_hidratacao` | «orientação» | «C» |
| OR-04 | `retorno` | «quando e onde retornar» | sim |
| OR-05 | `sinais_de_alarme` | «procurar emergência se…» | sim |

**Regras de aceite**
- Linguagem de paciente: 2ª pessoa, frases curtas, sem sigla, sem termo técnico não explicado.
- ≤ 12 itens; cada item com uma única instrução.
- Sinais de alarme em linguagem leiga devem espelhar o Bloco 6 (mesma lista, outra linguagem).
- Obrigatório conter "retorne imediatamente se" e "retorno recomendado em".
- Nenhuma orientação promete resultado ou substitui reavaliação.

---

## 17. Atestado ou declaração

| Tipo | Aplicável? | Quando | Campos obrigatórios | Dias | CID | Assinatura |
|---|---|---|---|---|---|---|
| Atestado médico | «sim/não» | «critério» | «nome, documento, data, período» | «definir política» | «com/sem» [Verificar] | «física/eletrônica» |
| Declaração de comparecimento | «sim/não» | «critério» | «nome, horário, data» | — | — | «…» |
| Declaração de acompanhante | «sim/não» | «critério» | «…» | — | — | «…» |

**Regras de aceite**
- "Se aplicável" é resposta válida — nem toda condição gera atestado.
- Dias de afastamento não são preenchidos automaticamente; exigem decisão médica e política institucional.
- Regras legais de conteúdo, CID e assinatura marcadas `[Verificar]` antes da publicação.
- Documento sempre com autor, CRM, data/hora e identificador.

---

## 18. Encaminhamentos

| Destino | Critério | Prioridade | Informações mínimas | Documento | `claim_id` |
|---|---|---|---|---|---|
| `PSF/atenção_primaria` | «critério» | `eletiva` | «diagnóstico, conduta, medicações, retorno» | Encaminhamento | «claim» |
| `especialidade:«X»` | «critério» | `prioritaria / eletiva` | «…» | Encaminhamento | «claim» |
| `referencia_secundaria` | «critério» | `urgente` | «…» | Transferência | «claim» |

**Regras de aceite**
- Todo encaminhamento tem destino existente na rede da unidade e critério objetivo.
- "Informações mínimas" inclui pendências e o que já foi feito (evita repetição).
- Prioridade é definida por critério clínico, não por disponibilidade de vaga.
- Encaminhamento sem documento gerado é registro incompleto.

---

## 19. Critérios de alta

| ID | Critério | Tipo | Como verificar | `claim_id` |
|---|---|---|---|---|
| CA-01 | «critério objetivo» | `obrigatorio` | «exame/observação» | «claim» |
| CA-02 | «critério» | `obrigatorio` | «…» | «claim» |
| CA-03 | «situação» | `contraindicador` | «…» | «claim» |

**Regras de aceite**
- Alta exige **todos** os `obrigatorio` verdadeiros e **nenhum** `contraindicador` presente.
- Critério não atendido exige justificativa registrada (não bloqueio silencioso).
- A alta só é concluída com: orientações + sinais de alarme + retorno + prescrição (quando aplicável).
- Critérios são verificáveis no PS, sem depender de exame inexistente na unidade.

---

## 20. Critérios de observação

| ID | Critério | Tempo mínimo | Reavaliação | O que monitorar | Gatilho de mudança |
|---|---|---|---|---|---|
| OB-01 | «critério» | «h» | «a cada X h» | «parâmetro» | «piora → conduta» |

**Regras de aceite**
- Observação sempre tem prazo e horário de reavaliação — observação indefinida é proibida.
- Cada critério declara o que fazer se piorar (destino).
- O sistema lembra a reavaliação; o atraso é registrado.

---

## 21. Critérios de transferência

| ID | Recurso ausente | Condição que exige | Destino | Prioridade | Estabilização antes do transporte | `claim_id` |
|---|---|---|---|---|---|---|
| TR-01 | `«UTI / TC / cirurgia / banco_de_sangue / especialista»` | «situação» | «referência» | `imediata / urgente / eletiva` | «o que fazer antes» | «claim» |

**Regras de aceite**
- Transferência é ligada a `unit_capability` (recurso declarado como indisponível).
- Exige confirmação de vaga/aceite do destino antes do envio [Verificar fluxo local].
- Resumo de transferência contém: diagnóstico, condutas, pendências, riscos, contato, exames.
- Prioridade é clínica; a logística não redefine prioridade.

---

## 22. Alertas de segurança e contraindicações

### 22.1 Alertas

| ID | Tipo | Gatilho | Severidade | Mensagem (≤ 140 caracteres) | Ação | Override | Motivos |
|---|---|---|---|---|---|---|---|
| SA-01 | `alergia` | «medicamento/classe» | `grave` | «texto» | «trocar/justificar» | sim | `alergia_conhecida` |
| SA-02 | `dose_maxima` | «acima do teto» | `grave` | «texto» | «reduzir/justificar» | sim | `necessidade_clinica` |
| SA-03 | `gestacao` | «classe X em gestante» | `grave` | «texto» | «alternativa» | sim | `risco_beneficio` |
| SA-04 | `renal` | «ClCr abaixo do limiar» | `precaucao` | «texto» | «ajustar» | sim | `ajuste_individualizado` |
| SA-05 | `interacao` | «par» | `precaucao` | «texto» | «monitorizar» | sim | `monitorizacao_disponivel` |
| SA-06 | `duplicidade` | «mesmo princípio ativo» | `precaucao` | «texto» | «escolher um» | sim | `associacao_intencional` |
| SA-07 | `recurso_local` | «item fora do formulário» | `precaucao` | «texto» | «alternativa/transferir» | sim | `importacao_autorizada` |

### 22.2 Contraindicações absolutas

| Situação | Conduta | `claim_id` |
|---|---|---|
| «situação» | «não usar / trocar por» | «claim» |

**Regras de aceite**
- Todo alerta tem ação; alerta informativo sem ação é ruído e deve sair.
- Severidade segue o padrão do produto (`grave | precaucao | informativo`); cor nunca é o único diferenciador.
- Override sempre com motivo e registro; alerta permanece no histórico.
- Máximo 3 alertas simultâneos na tela; o resto em painel.
- Bloqueio só para regra classificada como crítica e aprovada pelo Comitê.
- Mensagem descreve o risco e a saída — não apenas "atenção".

---

## 23. Dados mínimos necessários do paciente

| Dado | Obrig. | Por que (regra que consome) | Validação |
|---|---|---|---|
| Idade | O | faixa etária, dose, critérios | 0–120 anos |
| Peso | C | dose por kg, ajuste | > 0 kg; alerta se implausível |
| Gestação / IG | C | contraindicação, ajuste | IG 0–42 semanas |
| Alergias | O | alerta grave | lista ou "nega" explícito |
| Comorbidades | C | interação, risco | lista |
| Função renal (ClCr) | C | ajuste renal | valor + unidade |
| Função hepática | C | ajuste hepático | classificação/enzimas |
| Cardiopatia | C | contraindicação | sim/não |
| Medicações em uso | O | interação/duplicidade | lista |

**Regras de aceite**
- Nenhum campo sem regra consumidora. Campo sem uso é removido do produto.
- Dado ausente gera **aviso com ação**, não bloqueio — exceto regra crítica configurada.
- Não coletar CPF/nome completo por padrão; apenas quando exigido por documento/faturamento, com finalidade e justificativa.
- "Nega alergia" é diferente de "não informado" — o sistema não pode confundir os dois.

---

## 24. Auditoria e versionamento

| Campo | Exemplo | Regra |
|---|---|---|
| `condicao_id` | `cond_«slug»` | imutável |
| `versao` | `1.0.0` | semver; major = mudança clínica relevante |
| `status` | `rascunho` | máquina de estados do produto |
| `autor` | «nome» | quem escreveu |
| `crm_autor` | «CRM/UF» | obrigatório |
| `revisor_clinico_1` | «nome» | distinto do autor |
| `revisor_clinico_2` | «nome» | obrigatório em classe A |
| `data_criacao` | ISO-8601 | automático |
| `data_aprovacao` | ISO-8601 | automático |
| `data_publicacao` | ISO-8601 | automático |
| `fontes` | `[«source_id»]` | ≥ 1 (≥ 2 em classe A) |
| `proxima_revisao` | ISO-8601 | 6/12/24 meses por classe |
| `risk_class` | `A` | define dupla revisão |
| `changelog` | «o que mudou e por quê» | obrigatório a cada versão |
| `hash_conteudo` | sha256 | integridade do publicado |

**Ciclo de vida**

```
rascunho ──► em_revisao ──► aprovado ──► publicado ──► suspenso ──► arquivado
                 │                          │
                 └────── ajustes ◄──────────┘ (nova versão)
```

- Só `publicado` aparece para o assistencial.
- `suspenso` continua visível para curadoria e auditoria, com motivo.
- `arquivado` sai da busca, mas permanece recuperável para reconstrução.

**Regras de aceite**
- Versão publicada é imutável; correção gera nova versão com `supersedes`.
- Todo atendimento fixa a versão usada (rastreabilidade).
- Mudança em dose/contraindicação exige novo `major` e revisão de impacto.
- Conteúdo vencido é sinalizado e não pode ser publicado como vigente.

---

## 25. Lacunas para validação

Como **nenhuma fonte foi anexada**, todo bloco clínico está em lacuna. Lista consolidada:

| ID | Bloco | Lacuna | Impacto | O que pesquisar | Tipo de fonte | Bloqueia? |
|---|---|---|---|---|---|---|
| L-01 | 1–5 | Nome canônico, CID e fronteira não validados | Alto | definição e critérios diagnósticos | diretriz + protocolo institucional | sim |
| L-02 | 2–3 | Termos não testados com médicos reais | Médio | vocabulário usado no PS | entrevista + log de busca | não |
| L-03 | 6 | Sinais de alarme não definidos | Crítico | critérios de gravidade | diretriz + protocolo | sim |
| L-04 | 7 | Anamnese dirigida não definida | Alto | elementos preditores | diretriz | sim |
| L-05 | 8 | Exame físico dirigido não definido | Alto | achados e limiares | diretriz | sim |
| L-06 | 9–10 | Nenhuma prescrição definida | Crítico | esquemas, doses, diluições | diretriz + bulário + farmácia | sim |
| L-07 | 11–12 | Classes e alternativas não definidas | Alto | primeira linha e trocas | diretriz + formulário local | sim |
| L-08 | 13 | Ajustes não definidos | Crítico | ajustes renal/hepático/pediátrico | bulário + farmácia | sim |
| L-09 | 14–15 | Exames e indicações não definidos | Alto | o que muda conduta | diretriz + protocolo | sim |
| L-10 | 16 | Orientações não redigidas | Médio | linguagem e conteúdo | revisão clínica + enfermagem | sim |
| L-11 | 17 | Documentos e regras legais não verificados | Médio | exigências legais | jurídico [Verificar] | sim |
| L-12 | 18–21 | Critérios de saída não definidos | Crítico | alta/observação/transferência | diretriz + regulação | sim |
| L-13 | 22 | Alertas e contraindicações não definidos | Crítico | riscos e limiares | diretriz + farmácia | sim |
| L-14 | 23 | Dados mínimos não justificados por regra | Alto | dependência de cada dado | engenharia + clínica | sim |
| L-15 | 24 | Responsável e revisores não nomeados | Crítico | governança | coordenação | sim |

**Regra:** `bloqueia = sim` impede publicação. Lacuna não bloqueante deve ter plano e prazo.

---

## Anexo A — Mapa para banco de dados

**Recomendação:** na Fase 1, persistir este conteúdo como JSONB validado em `content_item_version.payload` (E26), porque o formato ainda vai evoluir com a curadoria. Normalizar em tabelas só quando houver consulta que exija índice ou integridade referencial.

| Bloco | Destino | Observação |
|---|---|---|
| 1 | `condition` (E11) | identidade e risco |
| 2–3 | `clinical_term` (E12) | 1:N, com tipo e peso |
| 4–5 | `condition.definicao_operacional` + `condition_scope` | escopo pode iniciar em JSONB |
| 6 | `condition_alarm` (nova) ou `order_set_item` tipo `alarme` | normalizar se houver alerta em tempo real |
| 7–8 | `clinical_note_template` / `note_field` | campos tipados; texto por template |
| 9–10 | `order_set` + `order_set_item` (E15) + `dose_rule` (E18) | `setting` distingue ambulatorial/intra |
| 11 | `medication` (E16) | nível de classe, sem dose |
| 12 | `order_set_item.alternativas` | critério de troca obrigatório |
| 13 | `dose_adjustment` (E19) | faixas e fórmula versionada |
| 14–15 | `exam_catalog` (E22) + `order_set_item` | códigos sujeitos a licença [Verificar] |
| 16 | `order_set_item` tipo `orientacao` | categorias fixas |
| 17 | `document_template` (E24) | versão e layout |
| 18 | `referral_rule` (nova) ou `order_set_item` | destino e prioridade |
| 19–21 | `disposition_criteria` (nova) | checklist verificável |
| 22 | `safety_rule` (E43) + `contraindication` (E20) | severidade e override |
| 23 | `patient` (E34) + `clinical_data_snapshot` (E37) | snapshot imutável |
| 24 | `content_version` (E25) + `review_decision` (E30) | imutável e assinado |
| 25 | `content_gap` (E31) / `review_task` (E30) | fila de curadoria |

**Novas tabelas sugeridas:** `condition_alarm`, `disposition_criteria`, `referral_rule` — criar apenas se a consulta exigir; caso contrário, manter em JSONB.

---

## Anexo B — Gate de prontidão (publicação)

- [ ] Bloco 1 completo; nome canônico sem sigla e sem duplicidade ≥ 80%.
- [ ] ≥ 5 termos de busca, todos testados no top 3.
- [ ] Definição operacional ≤ 80 palavras, com ≥ 2 diferenciais nomeados.
- [ ] Toda exclusão aponta para condição existente.
- [ ] ≥ 3 sinais de alarme, cada um com ação e destino.
- [ ] Anamnese ≤ 8 campos visíveis; nenhum sistema sem decisão associada.
- [ ] Exame físico ≤ 10 itens; achados negativos explícitos.
- [ ] Todo item de prescrição com indicação, dose, via, frequência, duração e precauções.
- [ ] Antibióticos/terapias com opção principal + alternativa + critério de troca.
- [ ] Todo ajuste com dado de entrada declarado no Bloco 23.
- [ ] Todo exame com "o que muda na conduta"; não rotineiros com gatilho.
- [ ] Orientações com sinais de alarme em linguagem leiga e critério de retorno.
- [ ] Critérios de alta/observação/transferência verificáveis e com contraindicação de alta.
- [ ] Alertas com severidade, ação, override e motivo.
- [ ] Todo item clínico com `claim_id` e todo `claim_id` com ≥ 1 fonte.
- [ ] 2 revisores distintos (classe A) + aprovação registrada.
- [ ] `proxima_revisao` definida conforme classe.
- [ ] Teste de busca, de renderização e de regra aprovados.
- [ ] Nenhuma lacuna com `bloqueia = sim` aberta.
- [ ] Checklist de texto genérico aplicado (Anexo E).

---

## Anexo C — Fontes a consultar

Nenhuma fonte foi anexada; nenhuma referência foi inventada. Lista de **categorias** a localizar, com o que extrair e como registrar.

| # | Tipo de fonte | Onde localizar | O que extrair | Registro |
|---|---|---|---|---|
| 1 | Protocolo institucional da unidade | Coordenação clínica / educação continuada | conduta local, recursos, fluxos | `source` com versão e responsável |
| 2 | Diretriz de sociedade de especialidade brasileira | Site oficial da sociedade | definição, gravidade, tratamento | DOI/URL + edição + data + hash |
| 3 | Protocolo do Ministério da Saúde aplicável | Biblioteca virtual do MS | fluxo, critérios, notificação | portaria/versão + data |
| 4 | Formulário terapêutico nacional / RENAME | Publicação oficial | disponibilidade no SUS | edição + data [Verificar] |
| 5 | Bulário e registro Anvisa do medicamento | Consulta oficial | contraindicações, apresentações, diluição | número de registro + data |
| 6 | Base de interações medicamentosas licenciada | Contratação | pares, severidade, manejo | contrato + versão [Verificar] |
| 7 | Protocolo de regulação/transferência | Central de regulação local | critérios, destino, documentação | versão + contato |
| 8 | Normas de prescrição, documento e assinatura | CFM/ANVISA/conselho local | requisitos legais | número + vigência [Verificar] |
| 9 | Farmacêutico clínico da instituição | Serviço de farmácia | validação de doses e diluições | parecer datado |
| 10 | Referência internacional de urgência | Sociedades internacionais | segunda opinião / divergências | DOI/URL + data |

**Regra de conflito:** prevalece a hierarquia da especificação (norma > protocolo oficial > sociedade nacional > institucional > literatura), com decisão registrada e divergência visível no conteúdo.

---

## Anexo D — Arquivos e validação

| Arquivo | Função |
|---|---|
| `prescrimed_condicao.template.md` | Este template editorial (regra, campo, aceite) |
| `prescrimed_condicao.schema.json` | JSON Schema 2020-12 (estrutura, enums, gate) |
| `prescrimed_condicao.exemplo.json` | Esqueleto preenchível, válido como rascunho |
| `validate_condicao.py` | Validador dos três gates + varredura de placeholders |

```bash
python validate_condicao.py prescrimed_condicao.exemplo.json
python validate_condicao.py minha-condicao.json --strict
```

**Três gates independentes — os três precisam passar:**

| Gate | O que verifica | Reprova quando |
|---|---|---|
| 1. Estrutura | schema: tipos, enums, campos obrigatórios | falta seção, tipo errado, enum inválido |
| 2. Publicação | `status=publicado`: placeholders, ≥ 2 revisores, ≥ 2 fontes, próxima revisão, lacunas, `claim_id` em itens/sinais/exames | qualquer critério ausente |
| 3. Editorial | completude: termos testados, precauções, "o que muda" dos exames, revisor nomeado | vira erro com `--strict` |

O gate 1 é do schema; os gates 2 e 3 são do validador (`validate_condicao.py`) — ambos precisam rodar no CI e no ato de publicar.

**Limite conhecido do schema (testado):** JSON Schema valida **forma**, não **verdade**. Em um teste com o gate de publicação satisfeito (revisores, fontes, próxima revisão), a varredura ainda encontrou **144 campos com `«…»`** — doses, condutas e critérios continuavam vazios. Por isso o gate 2 inclui varredura textual recursiva, e ela é obrigatória: **schema sozinho nunca autoriza publicação**.

O que o schema impõe:
- estrutura completa (todas as seções existem, mesmo vazias);
- tipos e enums (ex.: severidade, via, destino de alarme, critério de troca);
- **gate de publicação**: `status=publicado` exige ≥ 2 revisores, ≥ 2 fontes, `proxima_revisao`, ausência de placeholders em `nome_canonico`, `definicao_operacional` e `cid10`, e nenhuma lacuna bloqueante.

---

## Anexo E — Anti-padrões (o que reprova na revisão)

| Anti-padrão | Por que falha | O que escrever |
|---|---|---|
| "Quadro clínico compatível" | não define nada | achados e critérios objetivos |
| "Conforme necessário" | não tem dose nem limite | dose, frequência e máximo |
| "Exames conforme avaliação" | não muda conduta | exame + indicação + decisão |
| "Observar evolução" | sem prazo nem gatilho | tempo, parâmetro, destino |
| "Avaliar benefício/risco" sozinho | terceiriza a decisão sem critério | critério + alternativa |
| "Uso geral" / "diversas indicações" | texto genérico | indicação específica da condição |
| Lista de 30 exames "para não esquecer" | induz sobresolicitação | exames com decisão associada |
| Dose sem unidade ou sem via | erro de administração | valor + unidade + via |
| Alerta sem ação | fadiga de alerta | risco + saída |
| Referência sem data/versão | não é auditável | fonte + versão + data + hash |

---

**Fim do template.** Conteúdo clínico: **não validado**. Publicação: **bloqueada** até o Anexo B ser cumprido com fontes do Anexo C.
