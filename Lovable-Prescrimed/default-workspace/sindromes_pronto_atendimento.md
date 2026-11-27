# PrescriMed — Base de síndromes clínicas para pronto atendimento

| Campo | Valor |
|---|---|
| Versão | 1.0.0 |
| Data | 2026-11-05 |
| Escopo | Mapeamento sindrômico para produto e priorização de MVP |
| Status | Curadoria inicial — **não validado clinicamente** |
| Uso assistencial | Bloqueado até validação formal (mesmo gate da condição clínica) |
| Fontes anexadas | Nenhuma — lista construída a partir de prática clínica geral, sem pesquisa externa |

> **Aviso.** Esta é uma lista de trabalho para desenhar o produto, não um protocolo. Não contém doses, condutas ou referências. A frequência é estimativa qualitativa e precisa ser calibrada com dados locais. Documentos APAC/AIH, notificação compulsória e regras de encaminhamento dependem de norma e fluxo local `[Verificar]`.

## Como ler as tabelas

| Código | Significado |
|---|---|
| **A / M / B** | Frequência estimada: alta, média, baixa |
| **Amb** | Adequada para prescrição ambulatorial: S = sim; S* = somente após estratificação; N = não |
| **Hosp** | Exige módulo hospitalar (IV, observação, imagem, especialista) |
| **Alarme** | Exige bloco de sinais de alarme e critérios de retorno |
| **Ped / Gest / Ger** | Exige cuidado específico em pediatria, gestação/lactação, geriatria |
| **R** | Receita | 
| **E** | Solicitação de exames |
| **At** | Atestado |
| **Rel** | Relatório/resumo clínico |
| **Enc** | Encaminhamento |
| **APAC / AIH** | Documentos SUS — sujeitos a regra local [Verificar] |
| **Onda** | 1 = MVP; 2 = segurança; 3 = expansão |

**Síndrome de entrada ≠ diagnóstico.** A lista mistura portas de entrada (ex.: dor abdominal, dispneia) e hipóteses frequentes (ex.: pielonefrite, dengue). No produto, a entrada deve ser a síndrome; a prescrição é montada por hipótese escolhida. Isso evita que o médico precise fechar diagnóstico para começar a documentar — e mantém o julgamento clínico explícito.


## Respiratório

*Maior volume de pronto atendimento. O eixo é separar viral de bacteriano e identificar hipoxemia/gravidade.*

| ID | Síndrome | Freq | Amb | Hosp | Alarme | Ped | Gest | Ger | Documentos | Observação de segurança | Onda |
|---|---|---|---|---|---|---|---|---|---|---|---|
| S-001 | Dispneia aguda indiferenciada | A | S* | S | S | S | S | S | E, Rel, Enc | Saturação, ECG e gasometria quando indicado; excluir TEP, IC e broncoespasmo. | 2 |
| S-002 | IVAS / resfriado comum | A | S | N | N | S | N | N | R, At | Sintomas leves; antibiótico não é rotina. Piora após 10 dias ou falta de ar muda a hipótese. | 1 |
| S-003 | Síndrome gripal / influenza | A | S | N | S | S | S | S | R, E, At | Gestante, idoso e imunossuprimido têm risco maior. Falta de ar e hipoxemia indicam gravidade. | 2 |
| S-004 | Faringoamigdalite aguda | A | S | N | S | S | N | N | R, E, At | Diferenciar viral de bacteriana; avaliar abscesso e comprometimento de via aérea. | 1 |
| S-005 | Laringite / crupe | M | S | N | S | S | N | N | R | Estridor em repouso, tiragem e sonolência são gravidade. Não é quadro de antibiótico de rotina. | 2 |
| S-006 | Bronquite aguda | A | S | N | N | S | N | N | R | Tosse persistente exige investigação; evitar antibiótico automático. | 3 |
| S-007 | Crise de asma | A | S* | S | S | S | S | S | R, E, Rel | Gravidade por fala, frequência respiratória e saturação; reavaliar resposta antes da alta. | 2 |
| S-008 | DPOC exacerbado | M | N | S | S | N | N | S | R, E, Rel, AIH | Gasometria no grave; atenção à retenção de CO2 e ao uso de O2. | 3 |
| S-009 | Pneumonia adquirida na comunidade | A | S* | S | S | S | S | S | R, E, Rel, AIH | Estratificar gravidade; saturação e imagem. Idoso pode não ter febre. | 2 |
| S-010 | Derrame pleural | B | N | S | S | S | S | S | E, Rel, AIH | Diagnóstico etiológico; toracocentese quando indicada. | 3 |
| S-011 | Tromboembolismo pulmonar | M | N | S | S | S | S | S | E, Rel, AIH | Estratificação de risco e imagem; não atrasar conduta quando indicada. | 3 |
| S-012 | Pneumotórax | B | N | S | S | S | N | S | E, Rel, AIH | Instabilidade exige descompressão imediata. | 3 |
| S-013 | Hemoptise | B | N | S | S | S | S | S | E, Rel, Enc | Volume e instabilidade definem urgência; excluir sangramento de via aérea alta. | 3 |
| S-014 | Insuficiência respiratória aguda | M | N | S | S | S | S | S | E, Rel, AIH | Sala vermelha; suporte ventilatório conforme protocolo institucional. | 3 |
| S-015 | Bronquiolite viral | A | S* | S | S | S | N | N | R, E, Rel | Lactente abaixo de 3 meses, apneia ou hipoxemia indicam internação. | 2 |


## Gastrointestinal

*Dor abdominal é a síndrome que mais exige reavaliação seriada e exclusão cirúrgica antes da alta.*

| ID | Síndrome | Freq | Amb | Hosp | Alarme | Ped | Gest | Ger | Documentos | Observação de segurança | Onda |
|---|---|---|---|---|---|---|---|---|---|---|---|
| S-016 | Dor abdominal aguda inespecífica | A | S* | S | S | S | S | S | E, Rel, Enc, AIH | Exame seriado; não liberar com dor desproporcional, sinais peritoneais ou instabilidade. | 2 |
| S-017 | Gastroenterite aguda | A | S | N | S | S | S | S | R, E, At | Avaliar desidratação. Evitar antidiarreico em disenteria ou febre alta. | 1 |
| S-018 | Disenteria / diarreia invasiva | M | S | N | S | S | S | S | R, E, At | Sangue nas fezes, febre e toxemia mudam a conduta; considerar coprocultura. | 3 |
| S-019 | Náuseas e vômitos | A | S | N | S | S | S | S | R, E | Vômito persistente, sangue, cefaleia ou dor abdominal exigem investigação. | 1 |
| S-020 | Constipação / impactação fecal | A | S | N | N | S | S | S | R, Enc | Excluir obstrução. Idoso com mudança recente de hábito precisa de investigação. | 1 |
| S-021 | Dispepsia / epigastralgia | A | S | N | S | S | S | S | R, E, Enc | Sinais de alarme: perda de peso, disfagia, sangramento, anemia, idade avançada. | 1 |
| S-022 | DRGE | A | S | N | N | S | S | S | R, Enc | Disfagia, odinofagia e perda de peso saem do quadro típico. | 3 |
| S-023 | Doença ulcerosa / H. pylori | M | S | N | S | S | N | S | R, E, Enc | Sangramento digestivo é emergência; investigar H. pylori quando indicado. | 3 |
| S-024 | Cólica biliar | M | S | N | S | S | S | S | R, E, Enc | Febre e icterícia associadas sugerem colangite; dor persistente sugere colecistite. | 3 |
| S-025 | Colecistite aguda | M | S* | S | S | S | S | S | R, E, Rel, AIH | Avaliação cirúrgica; não postergar em idoso e diabético. | 3 |
| S-026 | Pancreatite aguda | M | N | S | S | S | S | S | E, Rel, AIH | Gravidade precoce; hidratação e analgesia. Excluir causas obstrutivas e alcoólicas. | 3 |
| S-027 | Apendicite aguda | M | N | S | S | S | S | S | E, Rel, AIH | Avaliação cirúrgica; analgesia não impede reavaliação seriada. | 3 |
| S-028 | Diverticulite aguda | M | S* | S | S | S | N | S | R, E, Rel | Abscesso ou perfuração mudam a conduta; idoso frágil interna mais. | 3 |
| S-029 | Doença inflamatória intestinal em surto | B | N | S | S | S | S | S | R, E, Rel, Enc | Diferenciar de infeccioso antes de intensificar imunossupressão. | 3 |
| S-030 | Hemorragia digestiva alta | M | N | S | S | S | S | S | E, Rel, AIH | Estabilizar antes da endoscopia; acesso venoso e tipagem. | 3 |
| S-031 | Hemorragia digestiva baixa | M | N | S | S | S | S | S | E, Rel, AIH | Idoso com instabilidade e sangramento é urgência. | 3 |
| S-032 | Doença hemorroidária / fissura | A | S | N | S | S | S | S | R, At, Enc | Sangramento retal não é sempre hemorroida; excluir causa proximal. | 3 |
| S-033 | Abscesso perianal | B | N | S | S | S | N | S | R, Rel, AIH | Drenagem cirúrgica; avaliar sepse e diabetes. | 3 |
| S-034 | Parasitose intestinal | A | S | N | N | S | S | S | R, At | Saneamento e tratamento de contatos; atenção a hiperinfecção em imunossuprimido. | 3 |


## Urinário

*ITU em homem, gestante e idoso é complicada até prova contrária. Hematúria no idoso exige investigação.*

| ID | Síndrome | Freq | Amb | Hosp | Alarme | Ped | Gest | Ger | Documentos | Observação de segurança | Onda |
|---|---|---|---|---|---|---|---|---|---|---|---|
| S-035 | Cistite aguda | A | S | N | N | S | S | S | R, E, At | Disúria e urgência sem febre. Febre ou dor lombar mudam para pielonefrite. | 1 |
| S-036 | Pielonefrite aguda | M | S* | S | S | S | S | S | R, E, Rel, AIH | Febre e dor lombar; avaliar sepse e obstrução. Gestante interna com frequência. | 2 |
| S-037 | ITU complicada | M | N | S | S | S | S | S | R, E, Rel, AIH | Homem, gestante, diabético, cateter e anomalia urinária exigem cuidado adicional. | 3 |
| S-038 | Cólica renal / litíase | A | S | S | S | S | S | S | R, E, At, Enc | Excluir infecção e obstrução; dor refratária ou febre mudam a conduta. | 2 |
| S-039 | Retenção urinária aguda | M | N | S | S | S | S | S | R, E, Rel, Enc | Sondagem e investigação da causa; cuidado com bexiga de esforço. | 3 |
| S-040 | Hematúria | M | S* | N | S | S | S | S | E, Enc | Coágulos com retenção são urgência; idoso com hematúria assintomática investigar malignidade. | 3 |
| S-041 | Prostatite aguda | M | S* | S | S | S | N | S | R, E, Rel | Pode evoluir com sepse; não massagear próstata na fase aguda. | 3 |
| S-042 | Orquiepididimite | M | S | N | S | S | N | N | R, E, At, Enc | Jovem com dor testicular: excluir torção, que é tempo-dependente. | 3 |
| S-043 | Balanopostite | M | S | N | N | S | N | S | R, Enc | Diabético e fimose exigem atenção; candidíase é frequente. | 3 |
| S-044 | Uretrite / síndrome uretral | M | S | N | S | S | S | N | R, E, At, Enc | Tratar parceiros e notificar conforme norma local. | 3 |
| S-045 | Injúria renal aguda | M | N | S | S | S | S | S | E, Rel, AIH | Volume, fármacos e obstrução; avaliar nefrologia. | 3 |


## Cardiovascular

*Dor torácica e síncope são as portas de entrada de maior risco. ECG precoce é obrigatório.*

| ID | Síndrome | Freq | Amb | Hosp | Alarme | Ped | Gest | Ger | Documentos | Observação de segurança | Onda |
|---|---|---|---|---|---|---|---|---|---|---|---|
| S-046 | Dor torácica indiferenciada | A | S* | S | S | S | S | S | E, Rel, Enc, AIH | ECG precoce; estratificar SCA, TEP e dissecção antes de liberar. | 2 |
| S-047 | Síndrome coronariana aguda | M | N | S | S | S | S | S | E, Rel, AIH | Tempo-dependente; protocolo de dor torácica e estratificação. | 3 |
| S-048 | Angina estável | M | S | N | S | S | S | S | R, E, Enc | Encaminhar cardiologia; otimizar fatores de risco. | 3 |
| S-049 | Insuficiência cardíaca descompensada | M | S* | S | S | S | S | S | R, E, Rel, AIH | Avaliar congestão e perfusão; identificar precipitante. | 3 |
| S-050 | Edema agudo de pulmão | M | N | S | S | S | S | S | E, Rel, AIH | Sala vermelha; suporte ventilatório quando indicado. | 3 |
| S-051 | Crise hipertensiva | A | S* | S | S | S | S | S | R, E, Rel, Enc | Diferenciar urgência de emergência com lesão de órgão-alvo. | 2 |
| S-052 | Fibrilação atrial com resposta rápida | M | S* | S | S | S | S | S | R, E, Rel, AIH | Instabilidade e risco tromboembólico orientam conduta. | 3 |
| S-053 | Taquicardia supraventricular | M | N | S | S | S | S | S | E, Rel, AIH | Instabilidade exige cardioversão; documentar traçado. | 3 |
| S-054 | Bradicardia sintomática | B | N | S | S | S | S | S | E, Rel, AIH | Revisar fármacos e bloqueio; avaliar marcapasso. | 3 |
| S-055 | Síncope | M | S* | S | S | S | S | S | E, Rel, Enc, AIH | ECG obrigatório; estratificar causa cardíaca. | 2 |
| S-056 | Pericardite aguda | B | S* | S | S | S | N | S | R, E, Rel | Avaliar derrame e tamponamento; sinais de gravidade. | 3 |
| S-057 | Miocardite | B | N | S | S | S | S | S | E, Rel, AIH | Arritmia e insuficiência cardíaca; internação. | 3 |
| S-058 | Trombose venosa profunda | M | S* | S | S | S | S | S | R, E, Rel, AIH | Ultrassom e anticoagulação; investigar TEP. | 3 |
| S-059 | Endocardite | B | N | S | S | S | S | S | E, Rel, AIH | Hemoculturas antes do antibiótico; ecocardiograma. | 3 |
| S-060 | Dissecção de aorta | B | N | S | S | S | S | S | E, Rel, AIH | Dor súbita e laceração; controle de pressão e cirurgia. | 3 |
| S-061 | Parada cardiorrespiratória | B | N | S | S | S | S | S | Rel, AIH | Protocolo de RCP; registro cronológico de eventos. | 3 |


## Neurológico

*Cefaleia é comum; o risco está nas bandeiras vermelhas. AVC e crise epiléptica são tempo-dependentes.*

| ID | Síndrome | Freq | Amb | Hosp | Alarme | Ped | Gest | Ger | Documentos | Observação de segurança | Onda |
|---|---|---|---|---|---|---|---|---|---|---|---|
| S-062 | Déficit neurológico focal agudo | M | N | S | S | S | S | S | E, Rel, AIH, Enc | Registrar hora do início; glicemia e protocolo de AVC. | 2 |
| S-063 | Cefaleia primária | A | S | N | S | S | S | S | R, At, Enc | Diagnóstico positivo; qualquer bandeira vermelha exclui primária. | 1 |
| S-064 | Cefaleia de alarme | M | S* | S | S | S | S | S | E, Rel, AIH | Súbita, febre, déficit, papiledema, gestante ou puerpério exigem investigação. | 2 |
| S-065 | AVC isquêmico | M | N | S | S | S | S | S | E, Rel, AIH, Enc | Tempo de janela; protocolo de reperfusão. | 3 |
| S-066 | AVC hemorrágico | B | N | S | S | S | S | S | E, Rel, AIH | Controle de pressão; avaliação neurocirúrgica. | 3 |
| S-067 | Ataque isquêmico transitório | M | N | S | S | S | S | S | E, Rel, Enc | Risco precoce elevado; investigação imediata. | 3 |
| S-068 | Crise epiléptica | M | S* | S | S | S | S | S | R, E, Rel, AIH | Proteger via aérea; checar glicemia e causas reversíveis. | 2 |
| S-069 | Estado de mal epiléptico | B | N | S | S | S | S | S | E, Rel, AIH | Emergência; protocolo escalonado. | 3 |
| S-070 | Vertigem / tontura | A | S* | S | S | S | S | S | R, E, Rel, Enc | Diferenciar periférica de central; avaliar risco vascular. | 2 |
| S-071 | Meningite | B | N | S | S | S | S | S | E, Rel, AIH | Não atrasar antibiótico por exames de imagem. | 3 |
| S-072 | Encefalite | B | N | S | S | S | S | S | E, Rel, AIH | Imagem e antiviral; suporte em UTI. | 3 |
| S-073 | Paralisia facial periférica | M | S | N | S | S | S | S | R, E, Enc | Diferenciar central; proteger córnea. | 3 |
| S-074 | Delirium / confusão mental | M | N | S | S | S | S | S | E, Rel, AIH | Investigar causa orgânica antes de atribuir a psiquiatria ou demência. | 3 |
| S-075 | Neuropatia periférica aguda | B | S | N | S | S | S | S | R, E, Enc | Progressão rápida e fraqueza respiratória exigem internação. | 3 |
| S-076 | Intoxicação exógena | M | N | S | S | S | S | S | E, Rel, AIH | Toxicologia; antídoto conforme agente; notificação quando aplicável. | 3 |
| S-077 | Lombalgia com déficit neurológico | M | S* | S | S | S | S | S | E, Rel, Enc, AIH | Síndrome da cauda equina é emergência cirúrgica. | 3 |


## Dor musculoesquelética

*Maioria ambulatorial. Bandeiras vermelhas e critérios de imagem evitam excesso e atraso.*

| ID | Síndrome | Freq | Amb | Hosp | Alarme | Ped | Gest | Ger | Documentos | Observação de segurança | Onda |
|---|---|---|---|---|---|---|---|---|---|---|---|
| S-078 | Lombalgia aguda mecânica | A | S | N | S | S | S | S | R, At, Enc | Bandeiras vermelhas: déficit, febre, câncer, trauma, incontinência. | 1 |
| S-079 | Lombalgia com radiculopatia | M | S* | N | S | S | S | S | R, E, Enc | Déficit progressivo e alteração esfincteriana são urgência. | 3 |
| S-080 | Cervicalgia | A | S | N | S | S | S | S | R, At | Trauma com déficit neurológico é urgência. | 1 |
| S-081 | Dor miofascial | A | S | N | N | S | S | S | R | Sinais sistêmicos excluem origem muscular. | 3 |
| S-082 | Entorse de tornozelo | A | S | N | N | S | N | S | R, E, At | Aplicar critério de Ottawa antes de solicitar radiografia. | 1 |
| S-083 | Entorse de joelho | M | S | N | N | S | N | S | R, E, At, Enc | Instabilidade e derrame agudo sugerem lesão ligamentar. | 3 |
| S-084 | Lesão meniscal ou ligamentar | B | S* | N | N | S | N | S | E, Enc | Imagem e ortopedia; restringir carga. | 3 |
| S-085 | Tendinopatia | A | S | N | N | S | S | S | R, Enc | Evitar infiltração sem avaliação especializada. | 3 |
| S-086 | Bursite | M | S | N | N | S | S | S | R, E, Rel | Suspeita séptica exige aspirado e internação. | 3 |
| S-087 | Gota / artrite gotosa | M | S | N | S | S | N | S | R, E, Enc | Confirmar cristais; excluir artrite séptica. | 3 |
| S-088 | Artrite séptica | B | N | S | S | S | S | S | E, Rel, AIH | Articulação quente com febre é emergência. | 3 |
| S-089 | Osteoartrite em crise | A | S | N | N | S | S | S | R, Enc | Analgesia e reabilitação; avaliar causa de descompensação. | 3 |
| S-090 | Fibromialgia | M | S | N | N | S | S | S | R, Enc | Diagnóstico clínico; não confundir com doença inflamatória. | 3 |
| S-091 | Costocondrite | M | S | N | S | S | S | S | R | Excluir causa cardíaca antes de atribuir à parede torácica. | 3 |


## Dermatológico

*Celulite e abscesso exigem delimitação e sinais sistêmicos. Herpes zoster ocular é urgência.*

| ID | Síndrome | Freq | Amb | Hosp | Alarme | Ped | Gest | Ger | Documentos | Observação de segurança | Onda |
|---|---|---|---|---|---|---|---|---|---|---|---|
| S-092 | Celulite / erisipela | A | S* | S | S | S | S | S | R, Rel, AIH | Delimitar área; sinais sistêmicos; diferenciar de trombose. | 2 |
| S-093 | Abscesso cutâneo | A | S | N | S | S | S | S | R, Rel, At | Drenagem é o centro; avaliar risco de MRSA. | 3 |
| S-094 | Foliculite | A | S | N | N | S | S | S | R | Recorrente exige investigação e controle de fatores. | 3 |
| S-095 | Impetigo | A | S | N | N | S | N | S | R, At | Contágio; higiene e tratamento de contatos. | 3 |
| S-096 | Herpes zoster | M | S | N | S | S | S | S | R, At, Enc | Ocular e Ramsay Hunt são urgências. | 1 |
| S-097 | Herpes simples | A | S | N | N | S | S | S | R | Imunossuprimido e neonatal são graves. | 3 |
| S-098 | Dermatite de contato | A | S | N | N | S | S | S | R, At | Identificar e afastar o agente. | 3 |
| S-099 | Dermatite atópica em surto | A | S | N | N | S | S | S | R, Enc | Avaliar infecção secundária. | 3 |
| S-100 | Micose superficial | A | S | N | N | S | S | S | R | Confirmar quando atípico ou refratário. | 3 |
| S-101 | Escabiose | A | S | N | N | S | S | S | R, At | Tratar contatos; surto institucional. | 1 |
| S-102 | Pediculose | A | S | N | N | S | S | S | R, At | Tratar contatos; orientar escola. | 3 |
| S-103 | Exantema viral | A | S | N | S | S | S | S | R, At | Petéquias, sinais meníngeos e comprometimento de mucosa são alarme. | 3 |
| S-104 | Reação cutânea grave a medicamento | B | N | S | S | S | S | S | Rel, AIH | Suspender o fármaco; avaliar superfície corporal e mucosa. | 3 |


## Alergias

*Anafilaxia é a única emergência absoluta. Adrenalina não pode atrasar por anti-histamínico.*

| ID | Síndrome | Freq | Amb | Hosp | Alarme | Ped | Gest | Ger | Documentos | Observação de segurança | Onda |
|---|---|---|---|---|---|---|---|---|---|---|---|
| S-105 | Anafilaxia | M | N | S | S | S | S | S | R, Rel, AIH | Adrenalina intramuscular imediata; não postergar por anti-histamínico. | 2 |
| S-106 | Urticária aguda | A | S | N | S | S | S | S | R, At | Sinais de anafilaxia; duração acima de 6 semanas muda investigação. | 1 |
| S-107 | Angioedema | M | N | S | S | S | S | S | R, Rel, AIH | Avaliar via aérea; investigar IECA e angioedema hereditário. | 3 |
| S-108 | Rinite alérgica | A | S | N | N | S | S | S | R, Enc | Controle ambiental; encaminhar se refratária. | 1 |
| S-109 | Alergia a medicamento | M | S* | S | S | S | S | S | R, Rel, Enc | Suspender e registrar; reações graves exigem internação. | 3 |
| S-110 | Alergia alimentar | M | S | N | S | S | S | S | R, Enc | Plano de ação e orientação de evicção. | 3 |
| S-111 | Picada de inseto | A | S | N | S | S | S | S | R, At | Anafilaxia e infecção secundária. | 3 |


## Psiquiatria e sono

*Excluir causa orgânica antes de rotular como psiquiátrico. Risco suicida é triagem obrigatória.*

| ID | Síndrome | Freq | Amb | Hosp | Alarme | Ped | Gest | Ger | Documentos | Observação de segurança | Onda |
|---|---|---|---|---|---|---|---|---|---|---|---|
| S-112 | Crise de ansiedade / pânico | A | S | N | S | S | S | S | R, Rel, Enc | Excluir dor torácica, hipoglicemia e hipertireoidismo. | 3 |
| S-113 | Agitação psicomotora | M | N | S | S | S | S | S | R, Rel, AIH | Risco de agressão; contenção conforme protocolo. | 3 |
| S-114 | Ideação suicida | M | N | S | S | S | S | S | Rel, Enc, AIH | Avaliação de risco; não deixar sozinho; plano de segurança. | 3 |
| S-115 | Psicose aguda | M | N | S | S | S | S | S | R, Rel, AIH | Excluir causa orgânica; segurança da equipe. | 3 |
| S-116 | Depressão maior | A | S | N | N | S | S | S | R, Enc | Risco suicida; encaminhamento e seguimento. | 3 |
| S-117 | Abstinência alcoólica | M | N | S | S | S | S | S | R, E, Rel, AIH | Monitorar gravidade; delirium tremens é emergência. | 3 |
| S-118 | Intoxicação alcoólica | M | N | S | S | S | S | S | E, Rel, AIH | Excluir trauma e hipoglicemia. | 3 |
| S-119 | Insônia aguda | A | S | N | N | S | S | S | R, Enc | Higiene do sono; evitar hipnótico em idoso. | 3 |
| S-120 | Transtorno bipolar em crise | B | N | S | S | S | S | S | R, Rel, AIH | Mania e psicose exigem avaliação de segurança. | 3 |


## Endócrino e metabólico

*Hipoglicemia e cetoacidose são tempo-dependentes. Distúrbios eletrolíticos exigem ECG.*

| ID | Síndrome | Freq | Amb | Hosp | Alarme | Ped | Gest | Ger | Documentos | Observação de segurança | Onda |
|---|---|---|---|---|---|---|---|---|---|---|---|
| S-121 | Hipoglicemia | M | S* | S | S | S | S | S | R, E, Rel | Glicose imediata; investigar causa e recorrência. | 2 |
| S-122 | Cetoacidose diabética | M | N | S | S | S | S | S | E, Rel, AIH | Potássio, gasometria e hidratação; monitorização seriada. | 3 |
| S-123 | Estado hiperosmolar | B | N | S | S | S | S | S | E, Rel, AIH | Idoso com hiperglicemia extrema e desidratação. | 3 |
| S-124 | Hiperglicemia sem cetoacidose | M | S* | N | S | S | S | S | R, E, Enc | Avaliar infecção, adesão e risco de descompensação. | 3 |
| S-125 | Hipotireoidismo / coma mixedematoso | B | N | S | S | S | S | S | E, Rel, AIH | Hipotermia e bradicardia; suporte. | 3 |
| S-126 | Tireotoxicose / crise tireotóxica | B | N | S | S | S | S | S | E, Rel, AIH | Arritmia e insuficiência cardíaca. | 3 |
| S-127 | Desidratação | A | S* | S | S | S | S | S | R, E, Rel | Idoso e lactente desidratam com mais facilidade; calcular déficit. | 3 |
| S-128 | Distúrbio hidroeletrolítico | M | N | S | S | S | S | S | E, Rel, AIH | Correção gradual; monitorar ECG e função renal. | 3 |
| S-129 | Hipercalemia | B | N | S | S | S | S | S | E, Rel, AIH | ECG imediato; estabilização de membrana. | 3 |
| S-130 | Hiponatremia | M | N | S | S | S | S | S | E, Rel, AIH | Correção lenta; risco neurológico. | 3 |


## Pediatria

*Peso é obrigatório. Febre em menor de 3 meses é risco. Desidratação é o eixo do manejo.*

| ID | Síndrome | Freq | Amb | Hosp | Alarme | Ped | Gest | Ger | Documentos | Observação de segurança | Onda |
|---|---|---|---|---|---|---|---|---|---|---|---|
| S-131 | Febre sem foco | A | S* | S | S | S | S | N | R, E, Rel | Menor de 3 meses exige avaliação ampliada; sinais de toxemia. | 2 |
| S-132 | Bronquiolite | A | S* | S | S | S | N | N | R, E, Rel | Hipoxemia e apneia; lactente jovem interna mais. | 3 |
| S-133 | Crupe | A | S | N | S | S | N | N | R | Estridor em repouso e tiragem indicam gravidade. | 3 |
| S-134 | Otite média aguda na infância | A | S | N | N | S | N | N | R | Bilateral em lactente e otorreia mudam manejo. | 3 |
| S-135 | Faringite estreptocócica | A | S | N | S | S | N | N | R, E, At | Teste rápido quando indicado; escarlatina. | 3 |
| S-136 | Gastroenterite e desidratação | A | S* | S | S | S | S | N | R, E, Rel | Classificar desidratação; plano de reidratação. | 2 |
| S-137 | Convulsão febril | M | S* | S | S | S | N | N | R, E, Rel | Idade e duração; excluir meningite quando indicado. | 3 |
| S-138 | Exantema súbito | M | S | N | N | S | N | N | R, At | Benigno; orientar sinais de alarme. | 3 |
| S-139 | Varicela | M | S | N | S | S | S | S | R, At | Imunossuprimido e gestante são risco. | 3 |
| S-140 | Síndrome mão-pé-boca | M | S | N | N | S | S | N | R, At | Hidratação; contágio. | 3 |
| S-141 | Escarlatina | M | S | N | S | S | N | N | R, At | Tratar e orientar complicações. | 3 |
| S-142 | ITU pediátrica | M | S* | S | S | S | N | N | R, E, Rel | Coleta adequada; imagem em recorrência. | 3 |
| S-143 | Asma pediátrica | A | S* | S | S | S | N | N | R, E, Rel | Gravidade e resposta ao tratamento. | 3 |
| S-144 | Pneumonia pediátrica | A | S* | S | S | S | N | N | R, E, Rel, AIH | Hipoxemia e idade jovem indicam internação. | 3 |
| S-145 | Verminose | A | S | N | N | S | S | N | R, At | Higiene; atenção a hiperinfecção. | 3 |
| S-146 | Constipação pediátrica | A | S | N | N | S | S | N | R, Enc | Impactação; excluir causas orgânicas. | 3 |
| S-147 | Cólica do lactente | A | S | N | N | S | N | N | R, Enc | Excluir causas orgânicas; orientação. | 3 |


## Ginecologia e obstetrícia

*Teste de gravidez em idade fértil com dor ou sangramento. Ectópica é emergência.*

| ID | Síndrome | Freq | Amb | Hosp | Alarme | Ped | Gest | Ger | Documentos | Observação de segurança | Onda |
|---|---|---|---|---|---|---|---|---|---|---|---|
| S-148 | Dor pélvica aguda | A | S* | S | S | S | S | N | E, Rel, Enc | Teste de gravidez; excluir ectópica e torção. | 2 |
| S-149 | Doença inflamatória pélvica | M | S* | S | S | S | S | N | R, E, Rel | Tratar parceiros; abscesso exige internação. | 3 |
| S-150 | Vaginose bacteriana | A | S | N | N | S | S | N | R | Recorrência frequente; não é IST clássica. | 3 |
| S-151 | Candidíase vulvovaginal | A | S | N | N | S | S | N | R | Recorrente exige investigação. | 1 |
| S-152 | Vaginite por Trichomonas | M | S | N | N | S | S | N | R, E | Tratar parceiros. | 3 |
| S-153 | Sangramento uterino anormal | M | S* | S | S | S | S | S | E, Rel, Enc | Excluir gestação; avaliar instabilidade. | 3 |
| S-154 | Ameaça de abortamento | M | S* | S | S | S | N | N | E, Rel, Enc | Ultrassom e fator Rh. | 3 |
| S-155 | Abortamento | M | N | S | S | S | S | N | E, Rel, AIH | Hemorragia e esvaziamento; suporte. | 3 |
| S-156 | Gravidez ectópica | M | N | S | S | S | S | N | E, Rel, AIH | Emergência cirúrgica; não atrasar. | 3 |
| S-157 | Hiperêmese gravídica | M | S* | S | S | S | S | N | R, E, Rel | Desidratação e cetose; internação se refratária. | 3 |
| S-158 | Pré-eclâmpsia | M | N | S | S | S | S | N | E, Rel, AIH | Pressão e proteinúria; sinais de gravidade. | 3 |
| S-159 | Eclâmpsia | B | N | S | S | S | S | N | E, Rel, AIH | Emergência obstétrica; protocolo institucional. | 3 |
| S-160 | Trabalho de parto prematuro | M | N | S | S | S | S | N | E, Rel, AIH | Avaliação obstétrica imediata. | 3 |
| S-161 | ITU na gestação | M | S* | S | S | S | S | N | R, E, Rel | Sempre tratar; pielonefrite interna. | 3 |
| S-162 | Mastite | A | S | N | S | S | S | N | R, At, Enc | Abscesso exige drenagem; manter amamentação. | 3 |
| S-163 | Abscesso mamário | M | N | S | S | S | S | N | R, Rel, AIH | Drenagem e avaliação cirúrgica. | 3 |
| S-164 | Dismenorreia | A | S | N | N | S | S | N | R, At | Secundária se refratária ou início tardio. | 1 |
| S-165 | Amenorreia | M | S | N | N | S | S | N | R, E, Enc | Excluir gestação; investigar causas. | 3 |
| S-166 | Violência sexual | M | N | S | S | S | S | N | E, Rel, AIH | Protocolo, profilaxias e notificação conforme norma local. | 3 |


## Geriatria

*Apresentação atípica é regra. Iatrogenia e delirium devem ser investigados em toda síndrome.*

| ID | Síndrome | Freq | Amb | Hosp | Alarme | Ped | Gest | Ger | Documentos | Observação de segurança | Onda |
|---|---|---|---|---|---|---|---|---|---|---|---|
| S-167 | Queda | A | S* | S | S | S | S | S | E, Rel, Enc | Fratura, TCE e causas cardiovasculares; anticoagulado é risco. | 3 |
| S-168 | Delirium | M | N | S | S | S | S | S | E, Rel, AIH | Investigar infecção, fármacos, retenção e constipação. | 3 |
| S-169 | Síncope no idoso | M | S* | S | S | S | S | S | E, Rel, Enc | Causa cardíaca e polifarmácia. | 3 |
| S-170 | Polifarmácia / iatrogenia | M | S | N | S | S | S | S | R, E, Rel | Revisar prescrição e interações. | 3 |
| S-171 | Desidratação no idoso | A | S* | S | S | S | S | S | R, E, Rel | Tolerância oral e função renal. | 3 |
| S-172 | Desnutrição | M | S | N | N | S | S | S | R, Rel, Enc | Avaliação nutricional e causas. | 3 |
| S-173 | Úlcera por pressão | M | S* | S | S | S | S | S | R, Rel, APAC* | Infecção e curativo; fluxo ambulatorial conforme local. | 3 |
| S-174 | Incontinência urinária | M | S | N | N | S | S | S | R, Enc | Excluir retenção e infecção. | 3 |
| S-175 | Retenção urinária | M | N | S | S | S | S | S | R, E, Rel | Sondagem e investigação da causa. | 3 |
| S-176 | Demência com agitação | M | N | S | S | S | S | S | R, Rel, Enc | Excluir dor, infecção e delirium. | 3 |
| S-177 | Fratura de fragilidade | M | N | S | S | S | S | S | E, Rel, AIH | Osteoporose e avaliação cirúrgica. | 3 |


## Infectologia geral

*Sazonalidade e região mudam a hipótese: dengue, malária, leptospirose e febre amarela.*

| ID | Síndrome | Freq | Amb | Hosp | Alarme | Ped | Gest | Ger | Documentos | Observação de segurança | Onda |
|---|---|---|---|---|---|---|---|---|---|---|---|
| S-178 | Febre sem foco no adulto | M | S* | S | S | S | S | S | E, Rel, AIH | Sinais de gravidade e viagem; investigar foco. | 2 |
| S-179 | Síndrome viral | A | S | N | N | S | S | S | R, At | Sinais de alarme e evolução. | 3 |
| S-180 | Dengue | A | S* | S | S | S | S | S | R, E, At, Rel, AIH | Sinais de alarme; evitar AINE e AAS; notificação. | 2 |
| S-181 | Chikungunya | M | S | N | S | S | S | S | R, At, Rel | Artralgia prolongada; notificação. | 3 |
| S-182 | Zika | B | S | N | S | S | S | S | R, At | Gestante exige atenção; notificação. | 3 |
| S-183 | Leptospirose | B | S* | S | S | S | S | S | R, E, Rel, AIH | Exposição e icterícia; hemorragia. | 3 |
| S-184 | Malária | B | N | S | S | S | S | S | E, Rel, AIH | Área endêmica; gota espessa. | 3 |
| S-185 | Sepse | M | N | S | S | S | S | S | E, Rel, AIH | Reconhecimento precoce; culturas e foco. | 2 |
| S-186 | Choque séptico | M | N | S | S | S | S | S | E, Rel, AIH | Ressuscitação e UTI. | 3 |
| S-187 | Mononucleose | M | S | N | S | S | S | S | R, E, At | Esplenomegalia; evitar trauma abdominal. | 3 |
| S-188 | Sífilis | M | S | N | S | S | S | S | R, E, At, Enc | Parceiros e notificação. | 3 |
| S-189 | Gonorreia e clamídia | M | S | N | S | S | S | S | R, E, At, Enc | Parceiros; resistência antimicrobiana. | 3 |
| S-190 | Tuberculose | M | S | N | S | S | S | S | R, E, Enc | Isolamento quando indicado; notificação. | 3 |
| S-191 | Tétano | B | N | S | S | S | S | S | E, Rel, AIH | Profilaxia e suporte; UTI. | 3 |
| S-192 | Infecção de ferida | M | S | N | S | S | S | S | R, Rel, Enc | Drenagem e culturas quando indicado. | 3 |


## Oftalmologia e otorrinolaringologia

*Olho vermelho com dor ou visão reduzida é urgência. Epistaxe e via aérea exigem cuidado.*

| ID | Síndrome | Freq | Amb | Hosp | Alarme | Ped | Gest | Ger | Documentos | Observação de segurança | Onda |
|---|---|---|---|---|---|---|---|---|---|---|---|
| S-193 | Conjuntivite | A | S | N | N | S | S | S | R, Enc | Dor intensa e visão reduzida saem do quadro simples. | 1 |
| S-194 | Olho vermelho | A | S* | S | S | S | S | S | R, Enc | Diferenciar conjuntivite de ceratite e glaucoma. | 3 |
| S-195 | Ceratite | B | N | S | S | S | S | S | R, Enc | Oftalmologia imediata; lente de contato é fator de risco. | 3 |
| S-196 | Glaucoma agudo | B | N | S | S | S | S | S | R, Rel, AIH | Emergência; dor, halos e midríase. | 3 |
| S-197 | Uveíte | B | S* | S | S | S | S | S | R, Enc | Oftalmologia; investigar causa sistêmica. | 3 |
| S-198 | Hordéolo / calázio | A | S | N | N | S | S | S | R | Calor local; recorrência investigar. | 3 |
| S-199 | Blefarite | A | S | N | N | S | S | S | R | Higiene palpebral. | 3 |
| S-200 | Corpo estranho ocular | M | S* | S | S | S | S | S | R, Rel, Enc | Eversão palpebral; avaliar abrasão. | 3 |
| S-201 | Perda visual súbita | B | N | S | S | S | S | S | E, Rel, AIH | Oclusão vascular e arterite; urgência. | 3 |
| S-202 | Otite externa | A | S | N | N | S | N | S | R | Diabético e idoso: avaliar otite externa maligna. | 1 |
| S-203 | Otite média aguda | A | S | N | N | S | N | N | R | Complicações em lactente e imunossuprimido. | 1 |
| S-204 | Rinossinusite aguda | A | S | N | S | S | S | S | R, At | Sinais orbitários e intracranianos são emergência. | 1 |
| S-205 | Epistaxe | A | S* | S | S | S | S | S | R, Rel | Anticoagulação e instabilidade. | 3 |
| S-206 | Abscesso periamigdaliano | M | N | S | S | S | N | S | R, E, Rel, AIH | Via aérea; drenagem. | 3 |
| S-207 | Surdez súbita | B | N | S | S | S | S | S | R, Enc | Urgência otorrinolaringológica. | 3 |


## Pequenos traumas

*Mecanismo e exame neurovascular. Tétano e raiva são decisões documentais, não só clínicas.*

| ID | Síndrome | Freq | Amb | Hosp | Alarme | Ped | Gest | Ger | Documentos | Observação de segurança | Onda |
|---|---|---|---|---|---|---|---|---|---|---|---|
| S-208 | Ferimento cortante | A | S | N | S | S | S | S | R, At, Rel | Limpeza, corpo estranho e profilaxia antitetânica. | 1 |
| S-209 | Laceração | A | S | N | S | S | S | S | R, At, Rel | Sutura e resultado estético; avaliar tendão. | 1 |
| S-210 | Contusão | A | S | N | N | S | S | S | R, At | Radiografia se dor óssea ou mecanismo importante. | 1 |
| S-211 | Entorse | A | S | N | N | S | S | S | R, E, At | Critério de Ottawa; imobilização. | 3 |
| S-212 | Fratura fechada | M | S* | S | S | S | S | S | R, E, Rel, Enc, AIH | Exame neurovascular; imobilização e analgesia. | 3 |
| S-213 | Luxação | B | N | S | S | S | S | S | E, Rel, AIH | Redução e avaliação neurovascular. | 3 |
| S-214 | Corpo estranho cutâneo | A | S | N | S | S | S | S | R, Rel | Remoção e profilaxia. | 3 |
| S-215 | Mordedura animal | M | S | N | S | S | S | S | R, E, At, Enc | Raiva e tétano; infecção. | 3 |
| S-216 | Queimadura | M | S* | S | S | S | S | S | R, Rel, AIH | Extensão, profundidade e via aérea. | 2 |
| S-217 | Picada de animal peçonhento | M | S* | S | S | S | S | S | R, E, Rel | Soroterapia quando indicada; notificação. | 3 |
| S-218 | Traumatismo cranioencefálico leve | M | S* | S | S | S | S | S | E, Rel, Enc | Anticoagulado e sinais de alarme. | 3 |
| S-219 | Trauma dentário | M | S | N | S | S | S | N | R, Rel, Enc | Reimplante e dentista; tempo. | 3 |
| S-220 | Trauma de mão e dedo | M | S* | S | S | S | S | S | R, E, Rel | Tendão, nervo e unha. | 3 |
| S-221 | Trauma de tornozelo | A | S | N | N | S | S | S | R, E, At | Critério de Ottawa. | 3 |
| S-222 | Hematoma subungueal | A | S | N | N | S | S | S | R, Rel | Trepanagem quando indicada. | 3 |
| S-223 | Trauma ocular | M | N | S | S | S | S | S | E, Rel, AIH | Perfuração e acuidade visual; oftalmologia. | 3 |


## Priorização de MVP

**Critério.** Onda 1 = alta frequência + manejo ambulatorial + documento intensivo (receita/atestado) + baixa dependência de imagem urgente. Onda 2 = alta frequência **ou** alto risco, com alarmes e módulo hospitalar; entra quando o motor de segurança estiver pronto. Onda 3 = baixa frequência, alta complexidade, dependência de especialista/imagem avançada.

**Síndromes de entrada sugeridas para a tela inicial (10):** dor torácica, dispneia, dor abdominal, febre, cefaleia, dor lombar, disúria, dor de garganta, lesão de pele, trauma. Cada uma abre um leque de hipóteses — não um diagnóstico único.


### Onda 1 — MVP (24 síndromes)

Alta frequência, resolução ambulatorial e documento intensivo.

| ID | Síndrome | Categoria | Freq |
|---|---|---|---|
| S-002 | IVAS / resfriado comum | Respiratório | A |
| S-004 | Faringoamigdalite aguda | Respiratório | A |
| S-017 | Gastroenterite aguda | Gastrointestinal | A |
| S-019 | Náuseas e vômitos | Gastrointestinal | A |
| S-020 | Constipação / impactação fecal | Gastrointestinal | A |
| S-021 | Dispepsia / epigastralgia | Gastrointestinal | A |
| S-035 | Cistite aguda | Urinário | A |
| S-063 | Cefaleia primária | Neurológico | A |
| S-078 | Lombalgia aguda mecânica | Dor musculoesquelética | A |
| S-080 | Cervicalgia | Dor musculoesquelética | A |
| S-082 | Entorse de tornozelo | Dor musculoesquelética | A |
| S-096 | Herpes zoster | Dermatológico | M |
| S-101 | Escabiose | Dermatológico | A |
| S-106 | Urticária aguda | Alergias | A |
| S-108 | Rinite alérgica | Alergias | A |
| S-151 | Candidíase vulvovaginal | Ginecologia e obstetrícia | A |
| S-164 | Dismenorreia | Ginecologia e obstetrícia | A |
| S-193 | Conjuntivite | Oftalmologia e otorrinolaringologia | A |
| S-202 | Otite externa | Oftalmologia e otorrinolaringologia | A |
| S-203 | Otite média aguda | Oftalmologia e otorrinolaringologia | A |
| S-204 | Rinossinusite aguda | Oftalmologia e otorrinolaringologia | A |
| S-208 | Ferimento cortante | Pequenos traumas | A |
| S-209 | Laceração | Pequenos traumas | A |
| S-210 | Contusão | Pequenos traumas | A |

### Onda 2 — Segurança (26 síndromes)

Alta frequência ou alto risco; exigem alarme e módulo hospitalar.

| ID | Síndrome | Categoria | Freq |
|---|---|---|---|
| S-001 | Dispneia aguda indiferenciada | Respiratório | A |
| S-003 | Síndrome gripal / influenza | Respiratório | A |
| S-005 | Laringite / crupe | Respiratório | M |
| S-007 | Crise de asma | Respiratório | A |
| S-009 | Pneumonia adquirida na comunidade | Respiratório | A |
| S-015 | Bronquiolite viral | Respiratório | A |
| S-016 | Dor abdominal aguda inespecífica | Gastrointestinal | A |
| S-036 | Pielonefrite aguda | Urinário | M |
| S-038 | Cólica renal / litíase | Urinário | A |
| S-046 | Dor torácica indiferenciada | Cardiovascular | A |
| S-051 | Crise hipertensiva | Cardiovascular | A |
| S-055 | Síncope | Cardiovascular | M |
| S-062 | Déficit neurológico focal agudo | Neurológico | M |
| S-064 | Cefaleia de alarme | Neurológico | M |
| S-068 | Crise epiléptica | Neurológico | M |
| S-070 | Vertigem / tontura | Neurológico | A |
| S-092 | Celulite / erisipela | Dermatológico | A |
| S-105 | Anafilaxia | Alergias | M |
| S-121 | Hipoglicemia | Endócrino e metabólico | M |
| S-131 | Febre sem foco | Pediatria | A |
| S-136 | Gastroenterite e desidratação | Pediatria | A |
| S-148 | Dor pélvica aguda | Ginecologia e obstetrícia | A |
| S-178 | Febre sem foco no adulto | Infectologia geral | M |
| S-180 | Dengue | Infectologia geral | A |
| S-185 | Sepse | Infectologia geral | M |
| S-216 | Queimadura | Pequenos traumas | M |

### Onda 3 — Expansão

173 síndromes: menor frequência, maior complexidade ou dependência de especialista/imagem avançada. Permanecem no catálogo, mas fora do MVP.


## Regras transversais que o MVP precisa ter desde o primeiro dia

1. **Idade fértil + dor/sangramento:** teste de gravidez antes de conduta e de imagem.
2. **Alergia registrada:** bloqueio do item correspondente, não apenas aviso.
3. **Peso:** obrigatório quando a dose é por quilo (pediatria e parte da adulta).
4. **Sinais de alarme:** todo quadro com `Alarme = S` exibe sinais e critério de retorno no documento de alta.
5. **Diferenciação de gravidade:** três níveis visuais; cor nunca sozinha.
6. **Reavaliação:** todo quadro com `Hosp = S` e alta incerta exige prazo e gatilho de reavaliação.
7. **Notificação:** dengue, tuberculose, violência sexual e outros exigem fluxo próprio [Verificar lista local].
8. **Documento assinado é imutável:** correção gera nova versão, nunca edição.
9. **Sem diagnóstico fechado, sem prescrição automática:** a síndrome organiza; o médico decide.
10. **Regra local vence:** formulário, protocolo e fluxo de encaminhamento da unidade prevalecem.

## Lacunas para validação

| Lacuna | Impacto | Como resolver |
|---|---|---|
| Frequência por síndrome | Priorização errada do MVP | Extrair dos atendimentos da unidade (CID/queixa) e recalibrar as ondas |
| Cobertura por região | Dengue, malária, leptospirose variam | Mapa de sazonalidade e endemia por unidade |
| Regras de APAC/AIH | Documento errado | Validar com faturamento e regulação local [Verificar] |
| Lista de notificação compulsória | Omissão legal | Validar com vigilância epidemiológica [Verificar] |
| Síndromes ausentes | Lacuna de busca | Registrar em `content_gap` e revisar a cada ciclo |
| Critérios de internação | Uso indevido do módulo hospitalar | Validar com coordenação e auditoria |

## Próximos passos

1. Validar a lista com 3–5 emergencistas e um clínico generalista; marcar inclusões e exclusões.
2. Escolher 4 síndromes da Onda 1 e escrever o template completo (anamnese, prescrição, exames, alta).
3. Calibrar a frequência com dados locais e reordenar as ondas.
4. Definir os 10 documentos padrão e o layout de impressão.
5. Só então abrir o catálogo para as demais síndromes.

**Fim da base.** Conteúdo não validado; uso assistencial bloqueado.
