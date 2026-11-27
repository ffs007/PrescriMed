# Auditoria clínica — Lote 3/4 (protocolos 83–123)

Revisor: médico revisor sênior (medicina de emergência, PS/Sala Vermelha, adulto + pediatria).
Âmbito: 41 protocolos ambulatoriais (10 novos + 31 legados `leg_*`), 17 entradas do mapa hospitalar (parte 3) e 29 kits por queixa (parte 3).
Veredictos: ADEQUADO / NÃO_CURADO / COM_ERROS / PERIGOSO / VAZIO-INCOMPLETO.

---

## Resumo do lote (contagem por veredicto)

| Veredicto | n | % |
|---|---|---|
| ADEQUADO | 12 | 29% |
| COM_ERROS | 17 | 41% |
| VAZIO-INCOMPLETO | 7 | 17% |
| PERIGOSO | 3 | 7% |
| NÃO_CURADO | 2 | 5% |
| **Total** | **41** | 100% |

Leitura geral: os protocolos **novos** (curados: constipação, parasitoses, pediatria respiratória, dermatite de fraldas, febre sem foco) estão bons — alertas corretos, esquemas sensatos. O problema do lote é a **base legada `leg_*`**: 24 dos 29 protocolos com problema são legados, com três padrões recursivos: (a) catálogos despejados (amigdalite com 32 itens, gota com 26); (b) posologias copiadas de outro contexto (budesonida+formoterol de asma na rinite, ácido mefenâmico "a partir do sangramento" na gota, omeprazol em COVID/laringite); (c) marcações de controle erradas ([ctrl] em ISRS e amitriptilina, que não são Portaria 344).

---

## Tabela: protocolo | veredicto | principais problemas

| # | Protocolo | Veredicto | Principais problemas |
|---|---|---|---|
| 83 | [constipacao] Constipação intestinal | ADEQUADO | Alerta bom (alarmes, Hirschsprung, óleo mineral <1a). 6 laxantes aceitáveis (são opções reais, não equivalentes potentes). |
| 84 | [hemorroida] Doença hemorroidária | **PERIGOSO** | AAS 1 cp 6/6h como analgésico em queixa cujo sintoma cardinal é **sangramento retal ativo** (antiplaquetário agrava sangramento e é analgésico inadequado). |
| 85 | [fissura-anal] Fissura anal | COM_ERROS | Mesmo AAS 6/6h em lesão que sangra ("sangue vivo no papel"); falta diltiazem como alternativa tópica. Nifedipino 0,2%+lidocaína correto. |
| 86 | [parasitoses] Parasitoses intestinais | ADEQUADO | Alerta estrongiloidíase/corticoide correto; ivermectina com faixa de peso. Ressalva: metronidazol "1 cp 8/8h" sem mg (amebíase pede 500–750 mg 8/8h). |
| 87 | [bronquiolite] Bronquiolite viral | ADEQUADO | Excelente: critérios de internação corretos e bloco "NÃO USAR" alinhado à SBP. |
| 88 | [crupe] Laringite viral (crupe) | COM_ERROS | ALERTA correto (dex 0,15–0,6 mg/kg **dose única**) contraditado pela classe: corticoide **por 5 dias** e prednisolona **40 mg fixo** (dose adulta) em protocolo pediátrico. |
| 89 | [colica-lactente] Cólica do lactente | COM_ERROS | Simeticona "**1 comprimido** 8/8h" para lactente — forma farmacêutica errada (deveria ser gotas/suspensão); suporte não farmacológico correto. |
| 90 | [dermatite-fraldas] Dermatite de fraldas | ADEQUADO | "NÃO USAR" correto (corticoide potente, talco, neomicina); hidrocortisona leve 7d ok. |
| 91 | [febre-crianca] Febre sem foco 3m–3a | ADEQUADO | Critérios de risco corretos (<3 meses = investigação completa). |
| 92 | [paroniquia] Paroníquia | **NÃO_CURADO** | Classe "Antimicrobianos orais (celulite, erisipela, abscesso)" com **9 ATBs** colados sob paroníquia; benzilpenicilina benzatina não cobre *S. aureus*; SMZ-TMP "3 dias" insuficiente; doxiciclina/azitromicina sem lugar aqui. 1ª linha correta: amox-clav ou cefalexina (após drenagem). |
| 93 | [leg_2009] Abdome agudo | VAZIO-INCOMPLETO | "(sem classes — sem medicação vinculada)": nada prescritível. Conduta textual razoável (jejum, acesso, SF, cirurgia) mas sem opioide para dor intensa e sem antiemético. Escopolamina 20 mg EV está correta. |
| 94 | [leg_27] Amebíase | ADEQUADO | Metronidazol + secnidazol ok; falta agente luminal (paromomicina) após nitroimidazol e aviso de efeito antabuse/álcool — ressalvas menores. |
| 95 | [leg_41] Hipotireoidismo | COM_ERROS | Classe **duplicada verbatim** (2x "Levotiroxina — 1 comprimido em jejum"); "1 comprimido" sem mcg, sem titulação por peso/TSH, sem monitorização; sem esquema pediátrico. |
| 96 | [leg_1] Amigdalite bacteriana | **NÃO_CURADO** | Classe única com **32 itens**: 10 ATBs + **15 AINHs** + 5 corticoides + anti-histamínico. Corticoide de rotina em amigdalite; prednisona/prednisolona 40 mg fixos com (ped✓); celecoxibe 10d/etoricoxibe 7d para dor de garganta; ácido mefenâmico com texto de dismenorreia; dexclorfeniramina "se coceira". |
| 97 | [leg_13] Faringite aguda | VAZIO-INCOMPLETO | Sem **nenhum ATB e nenhum critério** (Centor/McIsaac) para faringite estreptocócica; dexametasona 4 mg EV fixa no ALERTA para faringite comum não é padrão. |
| 98 | [leg_14] Rinite alérgica | COM_ERROS | **Budesonida+formoterol inalatório** (medicação de ASMA, com regra de resgate "máx 8 doses/dia") para rinite; falta o essencial — corticoide **nasal**; classe duplicada. |
| 99 | [leg_15] Laringite aguda | COM_ERROS | Dexametasona **10 mg EV fixa** (sem mg/kg); prednisona 40 mg fixa 5d (pediátrico); **omeprazol 14d** sem justificativa; adrenalina "0,5 mL" sem especificar diluição nem peso. |
| 100 | [leg_16] Bronquite aguda | VAZIO-INCOMPLETO | Sem broncodilatador de alta (sequer o salbutamol que o próprio ALERTA usa); núcleo = mucolíticos sem evidência; sem orientação de não usar ATB. |
| 101 | [leg_18] IVAS | COM_ERROS | **Simeticona** para resfriado (sem relação); anti-histamínico sistêmico como item fixo; falta soro nasal/descongestionante tópico e orientações. |
| 102 | [leg_19] COVID-19 sintomático | COM_ERROS | Omeprazol 14d fixo sem indicação; ALERTA mistura cenário de UTI/internação (dex 6 mg EV 10d, enoxaparina) com alta ambulatorial sem separar por gravidade; falta orientação de oximetria domiciliar/sinais de alarme. |
| 103 | [leg_20] DRGE | ADEQUADO | Omeprazol/pantoprazol/domperidona ok; falta antiácido de demanda e medidas comportamentais (nota menor). |
| 104 | [leg_24] Cólica abdominal | **PERIGOSO** | "Dipirona **2,5 g EV de 8/8h**" = até **7,5 g/dia**, quase o dobro do máximo diário da bula (4 g/dia) — risco de hipotensão, agranulocitose, neurotoxicidade. Além disso, cólica inespecífica como diagnóstico de alta **sem red flags** (sangramento, febre, peritonite). |
| 105 | [leg_25] Parasitose intestinal | ADEQUADO | Redundante com [parasitoses] (mais completo), mas coerente. |
| 106 | [leg_8] ITU (cistite) | COM_ERROS | Quinolona como **única** 1ª linha oral (norfloxacino 7d — resistência de *E. coli* no Brasil; diretrizes: nitrofurantoína 5d ou fosfomicina dose única); ciprofloxacino **EV de entrada** para cistite no ALERTA; SMZ-TMP 7d (o padrão para cistite simples é 3d); **falta nitrofurantoína e fosfomicina na classe** (a nitrofurantoína aparece no kit, mas não no protocolo — inconsistência). |
| 107 | [leg_47] Deficiência vit. D | VAZIO-INCOMPLETO | "Vitamina D — 1 comprimido por semana por 8 semanas" sem UI (50.000 UI?), sem reavaliação/manutenção, sem causa (sem pedido de 25-OH-D/PTH). |
| 108 | [leg_30] Urticária aguda | ADEQUADO | ALERTA correto (adrenalina IM se anafilaxia); anti-histamínicos + corticoide curto aceitáveis. |
| 109 | [leg_31] Dermatite alérgica | VAZIO-INCOMPLETO | **Nenhum corticoide tópico** — o essencial da dermatite de contato; só sistêmicos (loratadina, desloratadina, prednisona 40 mg). O mapa hospitalar [dermatite] repete o mesmo defeito. |
| 110 | [leg_33] Micose cutânea | ADEQUADO | Cetoconazol tópico ok; resíduo de texto "(tinha)" no item do fluconazol; falta terbinafina tópica como 1ª linha mais simples (nota). |
| 111 | [leg_4] Artrite gotosa (crise) | **PERIGOSO** | 26 itens; **Alopurinol listado na classe da crise** sem nenhum alerta de não iniciar ULT na fase aguda (e "por 30 dias" = iniciar e abandonar, padrão que provoca flares de repetição); **AAS como analgésico** na gota (ineficaz, eleva urato, agrava flare); ácido mefenâmico com posologia copiada de dismenorreia; 15 AINHs + 4 corticoides IM de depósito como equivalentes de 1 clique. Colchicina em esquema low-dose correto — único acerto. |
| 112 | [leg_35] Gota (prevenção) | VAZIO-INCOMPLETO | Só alopurinol "1 cp 30 dias": sem titulação, sem alvo (urato <6 mg/dL), sem profilaxia de flare (colchicina 0,5 1–2x/d), sem revisão laboratorial (renal/ALT). |
| 113 | [leg_36] Lombalgia/cervicalgia | COM_ERROS | Dexametasona 4 mg EV/dia por 3d para lombalgia mecânica (não indicada); **sem red flags** (cauda equina, trauma, febre, câncer); sem paracetamol; sem orientação de manter-se ativo. |
| 114 | [leg_37] Mialgia | ADEQUADO | AINH + dipirona razoável para queixa musculoesquelética benigna. |
| 115 | [leg_10] Diabetes tipo 2 | COM_ERROS | Glibenclamida "1 cp" fixa iniciada em PS sem mg, sem função renal/idade (risco hipoglicemia grave em idoso); ALERTA "insulina conforme glicemia" sem escala de correção nem alvo; metformina ok. |
| 116 | [leg_38] Dislipidemia | COM_ERROS | Três estatina s "1 comprimido" sem mg, sem LDL/alvo, sem perfil lipídico prévio — iniciar estatina cega na alta de PS. |
| 117 | [leg_39] IC (manutenção) | COM_ERROS | **Atenolol** como betabloqueador de IC (sem benefício comprovado em IC\FEr; os indicados são carvedilol/bisoprolol/metoprolol succinato); sem dose; HCTZ em vez de diurético de alça para congestão; falta espironolactona. ALERTA de descompensação ok. |
| 118 | [leg_40] Prevenção cardiovascular | ADEQUADO | AAS + estatina coerentes com prevenção secundária (CID I25). Doses presumidas, não explícitas (nota). |
| 119 | [leg_44] Depressão leve/moderada | COM_ERROS | **[ctrl] errado em fluoxetina, sertralina e escitalopram** — nenhum é Portaria 344; "1 cápsula" sem titulação; sem alerta de risco de suicídio no início (jovens <25a) e sem vínculo de seguimento — PS não deveria iniciar ISRS contínuo sem plano. |
| 120 | [leg_45] Transtorno de ansiedade | COM_ERROS | Mesmo [ctrl] errado em sertralina/escitalopram; sem duração/titulação; sem manejo de crise aguda. |
| 121 | [leg_3] Anemia ferropriva | COM_ERROS | "Sacarato de hidróxido férrico — 2 amp em 500 mL SF, EV lento 4h": dissonante da bula (diluição em até 200 mL, infusão ~15–90 min) e **sem indicação de quando ferro EV é adequado** (intolerância oral/má absorção/perdas); ferro oral ok. |
| 122 | [leg_48] Pré-natal (suplementação) | COM_ERROS | Ácido fólico e ferro **"por 30 dias"** — na gestação a suplementação é contínua (fólico ao menos até o fim do 1º trimestre; ferro conforme hemograma); sem dose do fólico (400–800 mcg?). |
| 123 | [leg_50] Herpes zoster | VAZIO-INCOMPLETO | **Sem antiviral oral** (aciclovir 800 mg 5x/d, valaciclovir 1 g 8/8h — dentro de 72 h): perda da janela terapêutica; só analgésico + tramadol + amitriptilina (e amitriptilina marcada [ctrl] indevidamente); falta gabapentina para dor neurogênica e aviso oftalmológico se zona oftálmica. |

---

## Detalhes dos COM_ERROS / PERIGOSO / VAZIO

### PERIGOSOS

**1. [leg_4] Artrite gotosa (crise) + kit associado**
- Item crítico: **Alopurinol na classe da crise aguda**, junto com colchicina/AINHs, sem qualquer alerta. O kit de 1 clique "Gota (dor)" prescreve *Colchicina + Alopurinol* juntos: iniciar ULT no primeiro atendimento da crise é a forma clássica de prolongar/provocar novos flares, e "1 cp/dia por 30 dias" (parar em 30 dias) é o pior dos dois mundos — ULT intermitente sem alvo.
- Item crítico: **AAS como analgésico da gota** ("1 cp 6/6h se dor") — AAS em dose analgésica reduz excreção de urato e é analgésico ineficaz para a artrite cristalina; contraindicado.
- Estrutura: 26 itens numa classe única — 15 AINHs (incluindo indometacina, piroxicam, meloxicam, 2 coxibs) + prednisona/prednisolona/dexametasona/betametasona VO + 4 corticoides IM de depósito + dexclorfeniramina ("se coceira" — copiada de protocolo alérgico) — convida à polifarmázia AINH+corticoide simultâneo (soma de toxicidade GI/renal).
- Posologia copiada de outro contexto: ácido mefenâmico "a partir do início da cólica **ou do sangramento**".
- Correção mínima: crise = colchicina low-dose (já correta) **ou** AINH único **ou** corticoide curto; alopurinol só em protocolo de prevenção com regra "iniciar 2–4 semanas após resolução, com profilaxia de flare".

**2. [leg_24] Cólica abdominal (conduta EV)**
- "Escopolamina 20 mg **+ Dipirona 2,5 g EV de 8/8h**": dipirona em bolus de 2,5 g repetido 3x/dia = **7,5 g/dia EV**, quase o dobro do máximo diário descrito em bula (4 g/dia em adultos). Risco: hipotensão, broncoespasmo, agranulocitose (relação dose-dependente em uso alto), colapso.
- Escopolamina 20 mg EV está correta; o problema é só a dipirona.
- Adicional: "Cólica abdominal" como protocolo fechado de alta **sem nenhum sinal de alarme** (sangramento digestivo, febre, peritonismo, gestação) — risco de mascarar abdome cirúrgico.

**3. [hemorroida] Doença hemorroidária**
- **AAS 1 cp 6/6h "se dor ou febre"** num protocolo cuja apresentação típica é **sangramento retal ativo**. Antiplaquetário em sangramento ativo, com duração indefinida e como "alternativa" ao paracetamol. Remove-lo ou restringir a "cardioproteção pré-existente, não iniciar".
- O mesmo item existe em [fissura-anal] (sangramento menor, mas mesma lógica) — classifiquei fissura como COM_ERROS.

### NÃO_CURADOS

**4. [leg_1] Amigdalite bacteriana — catálogo com 32 itens numa classe**
- 10 antimicrobianos (incluindo axetilcefuroxima 10d, cefaclor 10d, eritromicina 10d, fenoximetilpenicilina — esta sim 1ª linha), quando o padrão é: amoxicilina ou penicilina; alternativa cefalexina; alérgico: azitro/claritro/clindamicina.
- **15 AINHs equivalentes** para odinofagia, incluindo coxibs por 7–10 dias, indometacina, piroxicam.
- **Corticoide de rotina** (prednisona/prednisolona 40 mg fixo com (ped✓) — dose adulta em campo pediátrico; betametasona 12/12h; dexametasona 5d).
- Dexclorfeniramina e dipirona/paracetamol — mistura de протоколos.
- Suspensões pediátricas corretas, mas no meio do catálogo.
- Marcadores inconsistentes: AAS marcado [gc] aqui e [gx] nos protocolos novos (gestação: contraindicado, sobretudo 3º trimestre).

**5. [paroniquia] — classe de antibióticos errada e excessiva**
- Classe entitulada "(celulite, erisipela, abscesso)" com 9 ATBs colados no protocolo de paroníquia.
- **Benzilpenicilina benzatina IM dose única** não cobre *S. aureus* (penicilinase) — ineficaz para o germe nº 1 da paroníquia.
- **SMZ-TMP "por 3 dias"** — duração insuficiente para infecção de partes moles (5–7d).
- Doxiciclina e azitromicina sem papel definido; amox-clav ou cefalexina 7d após drenagem é o esperado.

### VAZIO-INCOMPLETOS (essencial ausente)

- **[leg_50] Herpes zoster sem antiviral oral** — o mais grave do grupo: a conduta EV tem aciclovir 10 mg/kg, mas a alta não tem aciclovir/valaciclovir; só dipirona/tramadol/amitriptilina. Janela de 72 h perdida por design.
- **[leg_31] Dermatite alérgica sem nenhum tópico** — dermatite de contato tratada só com sistêmicos (e o mapa hospitalar [dermatite] repete: só corticoide EV e classe de anafilaxia).
- **[leg_13] Faringite sem ATB e sem critério de Centor** — não distingue viral x estreptocócica.
- **[leg_16] Bronquite sem broncodilatador de alta** — o ALERTA nebuliza salbutamol, a alta não o traz; mucolíticos sem evidência como núcleo.
- **[leg_35] Gota prevenção** sem titulação/alvo/profilaxia de flare (ver acima).
- **[leg_47] Vitamina D** sem UI, sem reavaliação.
- **[leg_2009] Abdome agudo** sem nenhum item prescritível e sem opioide na analgesia da conduta.

---

## Kits problemáticos

| Kit | Problema | Gravidade |
|---|---|---|
| **Gota (dor): Colchicina + Alopurinol** | Inicia ULT na crise aguda em 1 clique, sem profilaxia e sem plano de continuidade. Corrigir para: colchicina (ou AINH único) na crise; alopurinol apenas em seguimento. | **Crítica** |
| **Depressão: Sertralina + Fluoxetina** | **Dois ISRS juntos** — duplicação de classe sem indicação, risco serotoninérgico e má prática; nenhum dos dois titulado; PS iniciando antidepressivo contínuo sem seguimento. | **Crítica** |
| **Cistite: Nitrofurantoína + Norfloxacino** | Dois antimicrobianos simultâneos para cistite simples; e a nitrofurantoína **nem existe na classe do protocolo leg_8** (kit inconsistente com o protocolo). Corrigir para monoterapia. | Alta |
| **Etilismo: Tiamina + Diazepam + Naltrexona** | Tiamina (antes da glicose) e diazepam corretos; **naltrexona não é medicação de PS/agudização** — exige abstinência prévia, avaliação de hepatopatia e vínculo; e antagoniza opioides analgésicos se trauma concomitante. | Alta |
| **Pé diabético: Cefalexina** | Cobertura insuficiente se infecção moderada/grave (não cobre gram-negativos/anaeróbios); aceitável apenas para celulite leve não penetrante — precisa de gate de gravidade/avaliação. | Moderada |
| **Fissura anal: pomada nifedipino+lidocaína** | Kit só com a pomada; o tratamento da fissura depende de ablandar as fezes — o kit deveria incluir o laxante (que existe no protocolo). | Moderada |
| **TCE leve: Paracetamol** | Correto — mas o mapa hospitalar de TCE leve oferece cetorolaco/diclofenaco na mesma classe, o que enfraquece a segurança do conjunto (risco de sangramento intracraniano). | Leve (mapa) |

Kits corretos como 1º clique: parasitose (albendazol), pneumonia (amoxicilina), abscesso dentário (amoxicilina — com a ressalva de que drenagem é o tratamento), leptospirose (doxiciclina — falta a marcação de notificação compulsória), caxumba/varicela (paracetamol), IVAS/faringite (dipirona), tricomoníase (metronidazol), contracepção de emergência (levonorgestrel), prostatite (ciprofloxacino), cólica do lactente (L. reuteri — evidência modesta, mas seguro), epistaxe (vaselina), micose (cetoconazol), pitiríase (hidroxizina), sangramento uterino agudo (tranexâmico + progestina — aceitável), TCE leve (paracetamol). Úlcera genital com benzilpenicilina benzatina é defensável no contexto brasileiro de prevalência de sífilis, mas deveria citar a possibilidade de herpes.

### Mapa hospitalar (parte 3) — classes EV vs protocolo

- **[ait] AIT/AVC menor**: recebe a classe "Dor torácica — suspeita de SCA" (AAS, **clopidogrel, dinitrato de isossorbida, morfina, enoxaparina**) — **mapeamento errado**; AIT pede antiagregação (AAS ± clopidogrel curto), estatinas e investigação — não nitrato/morfina.
- **[dor-toracica-baixo-risco]**: idem — após ECG/troponina normais, ofertar carga dupla antiagregação + morfina é inadequado e arriscado (sangramento sem benefício).
- **[lombalgia], [zoster], [entorse]**: classe "Opioides" inclui **naloxona** — antagonista listado como se fosse analgésico prescritível; risco de prescrição errada por 1 clique. Naloxona deve ficar em classe própria de "reversão/antídoto".
- **[zoster]**: sem aciclovir/valaciclovir em nenhuma via — nem na classe EV.
- **[geca]**: sem **solução de reidratação oral** (essencial da GEOA) nem zinco; antieméticos e antiespasmódicos ok.
- **[ivas-gripe]**: classe de ATBs (ceftriaxona, levofloxacino...) diretamente acessível num protocolo de resfriado, sem gate — estímulo a antibiótico para virose.
- **[dermatite]**: só corticoide EV + classe de anafilaxia; sem tópicos nem anti-histamínico oral.
- **[pac], [odontalgia], [uretrite-cervicite], [orquiepididimite], [emese-gestacao], [agitacao], [crupe], [tce-leve], [cervicalgia]**: classes apropriadas (ressalva: AINHs no kit analgésico do TCE leve, acima; prometazina/metoclopramida na gestação exigem cautela, mas ondansetrona e doxilamina+piridoxina estão presentes).

---

## Erros de dose/posologia detectados

1. **Dipirona 2,5 g EV de 8/8 h (leg_24, cólica abdominal)** — 7,5 g/dia EV; excede o máximo diário da bula (~4 g/dia). **Dose nociva.**
2. **Corticoide no crupe (protocolo novo)** — ALERTA manda dexametasona 0,15–0,6 mg/kg **dose única**; a classe prescreve dexametasona "1 cp/dia por 5 dias" e prednisolona "2 cp (40 mg)/dia por 5 dias" (dose fixa adulta em protocolo pediátrico). Contradição interna.
3. **Dexametasona 10 mg EV dose única fixa (leg_15, laringite)** — sem ajuste por peso; alta para criança pequena.
4. **Prednisona/prednisolona 40 mg fixos com (ped✓) (leg_1, leg_4, leg_15, leg_30, leg_31)** — dose adulta em campo pediátrico; corticoide de rotina em amigdalite e faringite sem indicação.
5. **Metronidazol "1 comprimido de 8/8 h por 7 dias" sem mg ([parasitoses], [leg_27])** — amebíase exige 500–750 mg 8/8 h; "1 cp" de 250 mg daria 750 mg/dia (subdose para amebíase; correto apenas para giardíase se cp = 250 mg). Ambiguidade que vira erro no balcão.
6. **Benzilpenicilina benzatina IM em paroníquia (paroniquia)** — sem cobertura para *S. aureus*; item inapropriado, não exatamente dose, mas escolha.
7. **SMZ-TMP "por 3 dias" (paroniquia)** — subduracao para parts moles (5–7 d); **SMZ-TMP e norfloxacino "por 7 dias" (leg_8)** — superduracao para cistite simples (3 d).
8. **Dexametasona 4 mg EV 1x/dia por 3 dias (leg_36, lombalgia; leg_13 faringite; leg_4 gota)** — corticoide sistêmico sem indicação em 3 queixas mecânicas/inflamatórias simples.
9. **Dexametasona 6 mg EV por 10 dias (leg_19, COVID)** — correto apenas para hospitalizado hipoxêmico; colado num protocolo "sintomático" de alta ambulatorial, sem separação de cenário.
10. **Budesonida+formoterol 12/12 h, máx. 8 doses/dia (leg_14, rinite)** — posologia de asma (resgate) aplicada a rinite; item inteiro inapropriado.
11. **Simeticona "1 comprimido de 8/8 h" ([colica-lactente])** — comprimido para lactente; forma farmacêutica errada (gotas).
12. **Ácido mefenâmico "a partir do início da cólica ou do sangramento" (leg_1, leg_4)** — posologia de dismenorreia copiada para amigdalite e gota.
13. **Naproxeno "2 comprimidos de 12/12 h" (leg_1, leg_4)** — sem mg; se cp = 550 mg, atinge o teto diário sem espaço para titulação; ambíguo.
14. **Sacarato de hidróxido férrico "2 amp em 500 mL SF, EV lento 4 h" (leg_3)** — diluição/temppo divergentes da bula (até 200 mL, ~15–90 min); sem critério de indicação de via EV.
15. **Marcações [ctrl] incorretas**: fluoxetina, sertralina, escitalopram (leg_44, leg_45) e amitriptilina (leg_50) não são Portaria 344 — marcação errada induz receita/regra de controle inexistente.
16. **AAS com marcação inconsistente** — [gx] nos protocolos novos (correto) vs [gc] em leg_1/leg_4; e [gc] em norfloxacino (leg_8) sem justificativa.
17. **Ácido fólico e sulfato ferroso "por 30 dias" no pré-natal (leg_48)** — duração incompatível com suplementação gestacional contínua.
18. **Escopolamina 20 mg EV (leg_24, leg_2009)** — correta (bromidrato/butilbrometo 20 mg = 1 amp) — registrada aqui apenas para deixar explícito que NÃO é erro.

---

## Recomendações prioritárias para o curador

1. Bloquear os kits Gota e Depressão antes de qualquer uso real (1 clique gera combinação nociva em ambos).
2. Corrigir a dipirona EV da cólica abdominal (máx 1 g/dose, 4 g/dia) e remover AAS de hemorroida/fissura/gota.
3. Retirar alopurinol da classe da crise de gota e reescrever leg_35 como prevenção adequada (titulação + profilaxia + alvo de urato).
4. Reescrever crupe: corticoide = dose única (como o próprio ALERTA já diz), nunca 5 dias com 40 mg fixo.
5. Curadoria de leg_1 (amigdalite) e paroniquia: reduzir a 3–4 opções com papel definido; corrigir marcações [ctrl].
6. Adicionar antiviral oral ao zoster, corticoide tópico à dermatite, TRO à GECA, critérios de Centor à faringite e broncodilatador à bronquite.
7. No mapa hospitalar: mover naloxona para classe de antídotos; remover classes de SCA de [ait] e [dor-toracica-baixo-risco]; adicionar aciclovir EV ao zoster.
