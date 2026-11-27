# AUDITORIA CLÍNICA DO CONTEÚDO — VEREDITO CONSOLIDADO
**Data:** 04/11/2026 · **Método:** extração programática de todos os mapeamentos (164 protocolos, 145 com medicação, 67 entradas hospitalares, 103 kits) + revisão clínica independente em 4 lotes (relatórios: `resultados_lote_1..4.md`; insumo: `batches/batch_1..4.md`).
**Natureza:** triagem por IA para decisão do médico responsável (Dr. Felipe). Nada aqui é liberação clínica — a palavra final é sua, item a item.

---

## 1. Veredito quantificado (164 protocolos)

| Veredito | n | % | Significado |
|---|---|---|---|
| **ADEQUADO** | 56 | 34% | clinicamente correto e razoavelmente curado |
| **NÃO_CURADO** | 28 | 17% | aceitável, mas catálogo despejado (6+ equivalentes sem 1ª linha) |
| **COM_ERROS** | 58 | 35% | ≥1 item clinicamente errado/ineficaz/desatualizado |
| **PERIGOSO** | 8 | 5% | capaz de causar dano direto |
| **VAZIO/INCOMPLETO** | 8 | 5% | sem opções ou faltando o essencial |
| **FORA_DE_ESCOPO** | 6 | 4% | manutenção ambulatorial, não PS |

**→ 66% do conteúdo (108/164) precisa de intervenção antes de qualquer uso assistencial.**
Mapa hospitalar (amostra distribuída) e kits: **≥9 dos 103 kits de 1 clique geram receita incompleta ou perigosa**; bloco hospitalar de emergências graves (sepse, PCR, CAD, TEP, HDA, hidroeletrolíticos) tem **doses corretas e é confiável**.

## 2. Os erros mais graves (top 12, extraídos dos 4 lotes)

1. **Anafilaxia sem adrenalina prescritível** — o alerta diz que adrenalina IM é 1ª linha, mas nenhuma classe permite prescrevê-la. O app "prescreve de menos" exatamente onde uma droga salva.
2. **Óleo mineral VIA ORAL p/ rolha de cerume** (colisão de ID `oleo_mineral` — o objeto ótico foi sobrescrito pelo laxante oral) → 15 mL VO à noite; risco de broncoaspiração/pneumonia lipóide no idoso.
3. **Kit Malária = Dipirona sozinha** (1 clique → alta sintomática de doença potencialmente fatal e de notificação compulsória, sem antimalárico).
4. **Kit DM2 duplica metformina** ("Metformina + NPH + Metformina") → 1 clique = dose dobrada.
5. **Kit Gota = Colchicina + Alopurinol na crise** (inicia ultato-redutor sem profilaxia, padrão que provoca flares) + protocolo legado com 26 itens incluindo AAS.
6. **Kit Depressão = Sertralina + Fluoxetina juntos** (2 ISRS sem indicação, iniciados em PS).
7. **Sífilis "tratada" com ceftriaxona 500mg IM DU** (esquema de gonorréia; não soroesteriliza; falsa cura) — no ambulatorial E no hospitalar.
8. **AAS 500mg 6/6h em protocolos pediátricos** (escarlatina, mão-pé-boca) — risco de síndrome de Reye; o marcador de gestação não cobre criança.
9. **SMZ-TMP 12/12h por 3 DIAS clonado da cistite** para pielonefrite, celulite, abscesso, impetigo, foliculite, queimadura, coqueluche, diverticulite — subtratamento em série.
10. **Dipirona 2,5g EV de 8/8h (7,5g/dia) na cólica abdominal** (~dobro do máximo diário) + protocolo sem nenhum red flag de abdome cirúrgico.
11. **Iatrogenia obstétrica**: ITU de gestante com ciprofloxacino/gentamicina/AINEs; urgência hipertensiva de gestante liderada por captopril (IECA teratogênico).
12. **Carisoprodol** (banido pela Anvisa desde 2016) ainda ofertado na lombalgia; posologias copiadas entre condições (valaciclovir de zoster no herpes simples; fluconazol semanal "(tinha)" na candidíase oral; diazepam "se vertigem" na abstinência alcoólica; prometazina "se coceira" na êmese gestacional).

## 3. Causas-raiz (engenharia de conteúdo — não de medicina)

Todos os 4 lotes convergem para os mesmos 4 defeitos sistêmicos:

1. **Clonagem de classes entre condições.** A classe "AINEs" (12-13 itens) está injetada em ≥11 condições; classes genéricas coladas onde não deviam (anti-hipertensivos de uso contínuo em epistaxe; hipoglicemiantes na hipoglicemia — o kit pode reproduzir o evento que trouxe o paciente).
2. **Posologia colada junto com a classe.** O texto de dose pertence ao par (medicamento × condição), mas no modelo atual viaja com o medicamento → "se coceira", "3 dias", "(tinha)" aparecem em contextos errados.
3. **Kits automáticos "1º remédio de cada classe"** (`kitFor`, lovable-rxmodal.js:554) — heurística que produz receitas incompletas (zoster sem antiviral, asma sem broncodilatador de resgate, DIP sem metronidazol) ou perigosas (kits 3-6 acima).
4. **Ausência de hierarquia (1ª linha) e de escopo.** 24% das classes têm 6+ opções equivalentes; amigdalite com 32 opções; dermatologia/manutenção ambulatorial misturadas com PS.

Agravantes: 100% dos 47 medicamentos legados sem esquema pediátrico estruturado; 18 itens de IA sem fila de revisão; marcações [ctrl] inventadas em itens legados.

## 4. O que está BOM e deve ser preservado

- **Motor clínico** (`engine.js`): cálculo adulto/pediátrico mg/kg, insulina, hidratação, escolha automática de apresentação — bom e testável.
- **Camada de segurança**: alergias, gestação (gx/gc + trimestres), renal (ClCr), bloqueios com justificativa, `safety_events` append-only.
- **Bloco hospitalar de emergências graves**: sepse, choque séptico, PCR, CAD, TEP, HDA, hiper/hipocalemia etc. — condutas e doses corretas (fonte: base legada revisada + revisão do lote 4).
- **Gates clínicos e antimicrobianos curados**: torção testicular, HEART/troponina, HINTS, tétano/raiva, IST/DIP/gota (esquemas essencialmente corretos); dengue/varicela com exclusão correta de AAS/AINE.
- **PDFs, carimbo, modo emergência (fluxo), ponte IA/cota** — a infraestrutura de produto.

## 5. Conclusão

O problema do PrescriMed **não é o motor, nem o visual, nem o banco** — é o **conteúdo**, construído por clonagem (o modo de operação do Lovable), sem modelo de curadoria com 1ª linha, escopo e posologia por condição. Para o padrão que você definiu ("prescrever rápido com conteúdo pré-pronto de excelente nível"), o conteúdo precisa ser **reconstruído sob um modelo curado**, usando o que passou na auditoria como semente.

## 6. Modelo de conteúdo proposto (para discussão)

Por condição do PS:
- **1ª linha** (1-2 itens, pré-selecionados no preset) + **alternativas** (≤3, com motivo: alergia, gravidez, falha)
- **Posologia por condição** (o texto de dose pertence ao par condição×droga — nunca herda)
- **Red flags / não-usar** explícitos; **escopo PS** (condições de manutenção saem)
- **Kits manuais por queixa** (definidos item a item, revisados; nada de "1º da classe")
- **Pediatria estruturada** obrigatória onde a condição atende crianças
- **Gate de validação no CI**: script que reprova classe com 6+ equivalentes sem 1ª linha, posologia vazia ou copiada (hash duplicado entre condições), droga banida (lista Anvisa), kit automático
- Tudo versionado; IA gera **rascunho**, você **assina** — nada vai ao app sem assinatura.
