# Auditoria clínica — Lote 2/4 (protocolos 42–82)

Revisor: revisor clínico sênior de medicina de emergência (contexto PS/Sala Vermelha, Brasil, adultos e pediatria).
Escopo: batch_2.md — 41 protocolos ambulatoriais (42–82) + 13 blocos do mapa hospitalar (classes EV) + 24 kits por queixa (parte 2).
Data: 2026-11-04. Esta revisão é triagem decisória; a palavra final é do médico responsável pelo projeto.

---

## Resumo do lote (contagem por veredicto)

| Veredicto | Protocolos | % |
|---|---|---|
| ADEQUADO | 18 | 43,9% |
| NÃO_CURADO | 14 | 34,1% |
| COM_ERROS | 9 | 22,0% |
| PERIGOSO | 0 protocolos (1 **kit** classificado PERIGOSO — Malária) | — |
| VAZIO/INCOMPLETO | 0 protocolos (1 **bloco do mapa hospitalar** incompleto — Bronquiolite) | — |
| **Total** | **41** | 100% |

Achado transversal nº 1: a classe "Anti-inflamatórios não esteroides (AINEs)" com **13 opções idênticas e sem 1ª linha marcada** está replicada em 9 protocolos (DIP, mastite, prostatite, orquiepididimite, dor torácica baixo risco, entorse, contusão, fratura, tendinite, cervicalgia) — é o maior problema de produto do lote.

Achado transversal nº 2: **bug de copy-paste de posologias entre protocolos** — textos de um protocolo reaproveitados noutro com indicação absurda no contexto (prometazina "se coceira ou alergia" em protocolos de êmese/vertigem; diazepam "se crise de vertigem intensa" em ansiedade e abstinência alcoólica; tansulosina "até eliminar o cálculo" em prostatite; "calor local no baixo ventre" em cervicalgia). Isso não é bibliografia mal escolhida: é defeito de sistema de templates que pode chegar à prescrição impressa.

---

## Tabela: protocolo | veredicto | principais problemas

| # | Protocolo | Veredicto | Principais problemas |
|---|---|---|---|
| 42 | corrimento-vaginal | ADEQUADO | Abordagem sindrômica deveria sugerir terapia combinada (candidíase + VB/tricomoníase) no mesmo encontro, não só classes separadas |
| 43 | candidiase-vaginal | ADEQUADO | Itraconazol 200 mg 12/12 h ×1 dia é off-PCDT (fluconazol é o padrão oral); aceitável como alternativa |
| 44 | vaginose | ADEQUADO | Tinidazol fora de uso habitual no Brasil; 6 opções sem marcação de 1ª linha (leve) |
| 45 | tricomoniase | ADEQUADO | Bom (abstinência de álcool + tratar parceria explícitos); falta dose única 2 g de metronidazol como alternativa documentada |
| 46 | uretrite-cervicite | ADEQUADO | Esquema duplo ceftriaxona 500 mg + azitromicina 1 g correto (padrão MS/Brasil); sem opção para alérgico a cefalosporina |
| 47 | dip | NÃO_CURADO | Classe AINEs com 13 opções equivalentes sem 1ª linha; AAS listado como analgésico em mulher em idade fértil com DIP |
| 48 | sifilis | **COM_ERROS** | Ceftriaxona 500 mg IM dose única listada como tratamento de sífilis (esquema inexistente p/ sífilis); falta esquema tardia (3 sem. / 7,2M UI) |
| 49 | ulcera-genital | NÃO_CURADO | Classe única mistura PWB + azitromicina + cipro + doxiciclina + aciclovir (tratamentos de doenças DIFERENTES) como se equivalentes — risco de marcar tudo junto |
| 50 | herpes-genital | ADEQUADO | Só cobre primeiro episódio; sem esquema de recorrência (aciclovir 800 mg 8/8 h ×2 d etc.) |
| 51 | verrugas-genitais | ADEQUADO | Falta ácido tricloroacético (aplicação médica) como opção; autoaplicação correta |
| 52 | dismenorreia | NÃO_CURADO | 6 AINEs equivalentes sem 1ª linha marcada (ácido mefenâmico lidera a lista mas sem etiqueta) |
| 53 | sangramento-uterino | NÃO_CURADO | 6 AINEs sem hierarquia; "4 comprimidos (1 g)" de tranexâmico só bate com cp 250 mg (ambíguo se cp 500 mg); hormonal correto com exclusão de gestão |
| 54 | emese-gestacao | **COM_ERROS** | Prometazina com texto "à noite se coceira ou alergia" dentro de protocolo de êmese gestacional (copy-paste de antialérgico, sem dose) |
| 55 | itu-gestante | ADEQUADO | Bom: nitrofurantoína com cautela a termo, proibição de FQ/doxi, urocultura de controle |
| 56 | contracepcao-emergencia | ADEQUADO | Falta janela de eficácia (≤72 h ideal / até 120 h) e DIU-Cu 5 dias como método mais eficaz |
| 57 | violencia-sexual | ADEQUADO | PEP TDF/3TC+DTG correta; PWB como "profilaxia" de sífilis é conduta não recomendada pelo PCDT (seguimento sorológico); metronidazol 7 d em vez de 2 g DU |
| 58 | mastite | NÃO_CURADO | Classe AINEs com 13 itens em lactante sem marcar ibuprofeno como preferido (o ALERTA até diz que ibuprofeno é compatível) |
| 59 | prostatite | **COM_ERROS** | Tansulosina com posologia "por até 4 semanas ou até eliminar o cálculo" — texto de cálculo renal em prostatite; + 13 AINEs |
| 60 | orquiepididimite | NÃO_CURADO | ALERTA de torção excelente; 13 AINEs sem hierarquia; esquemas por faixa etária (<35 vs >35) implícitos sem marcação |
| 61 | urgencia-hipertensiva | NÃO_CURADO | 10 anti-hipertensivos sem hierarquia p/ início em PS; espironolactona/furosemida como "início/ajuste" é inadequado sem indicação específica; ótimo ALERTA (proíbe nifedipino SL) |
| 62 | hiperglicemia | ADEQUADO | Boa titulação de metformina e NPH; ALERTA CAD/EHH correto |
| 63 | hipoglicemia | **COM_ERROS** | Classes de INÍCIO de antidiabético (glibenclamida, gliclazida, dapagliflozina, NPH 10 U) copiadas do protocolo de hiperglicemia — oferecer sulfonilureia (causa do evento!) na alta pós-hipoglicemia é incoerente e pode reproduzir o evento |
| 64 | vertigem | **COM_ERROS** | Prometazina "se coceira ou alergia" (copy-paste); classe mistura supressores de crise (meclizina) com crônicos (betaistina 30 d, flunarizina contínua) sem hierarquia |
| 65 | ansiedade | **COM_ERROS** | Diazepam "se crise de vertigem intensa, por até 3 dias" — texto de outro protocolo dentro da crise de ansiedade; BZD rotulado [notif] (é Notificação C/receita azul, não "B") |
| 66 | depressao | ADEQUADO | ALERTA de suicídio excelente; ISRS marcados [ctrl] incorretamente (ISRS não é controlado pela Portaria 344) — erro conservador, não clínico |
| 67 | insonia | ADEQUADO | Higiene do sono como 1ª linha correta; mesmo erro de rótulo [ctrl] em antidepressivos |
| 68 | abstinencia-alcool | **COM_ERROS** | Diazepam com texto de vertigem ×3 dias (esquema insuficiente p/ abstinência, que é sintomática 5–7 d); "Notificação B (azul)" é incorreto (azul = Notificação C/C1) |
| 69 | paralisia-facial | ADEQUADO | Prednisolona pediátrica 40 mg fixa sem mg/kg; aciclovir "1 cp 5×/d" sem mg (se 200 mg = subdose p/ Bell, usual 400 mg 5×/d) |
| 70 | dor-toracica-baixo-risco | NÃO_CURADO | Gate clínico impecável (ECG, troponina 0/3 h, HEART ≤3); porém 13 AINEs + 6 IBPs sem 1ª linha |
| 71 | ait | **COM_ERROS** | Sinvastatina listada como "estatina de alta intensidade" (é moderada; 80 mg é dose proibida); estatinas sem mg definido; dupla antiagregação oferecida sem critério de risco (ABCD2/NIHSS) |
| 72 | epilepsia | ADEQUADO | "1 comprimido" sem mg em anticonvulsivantes; [ctrl] incorreto em fenitoína/carbamazepina/valproato (não são controlados); falta resgate (midazolam nasal) |
| 73 | ic-ajuste | ADEQUADO | Sem mg definidos; iniciar carvedilol/dapagliflozina exige euvolemia — deveria estar no ALERTA |
| 74 | entorse | NÃO_CURADO | Ottawa correto; 13 AINEs sem hierarquia |
| 75 | contusao | NÃO_CURADO | Idem (13 AINEs); ALERTA de síndrome compartimental ótimo |
| 76 | fratura-imobilizada | NÃO_CURADO | 13 AINEs; opioides fracos bem limitados (3–5 d); ALERTA TEV bom |
| 77 | tendinite | NÃO_CURADO | 13 AINEs; sem opção de infiltração/corticoide para bursite refratária |
| 78 | cervicalgia | NÃO_CURADO | 5 relaxantes incluindo carisoprodol+4 fármacos (dependência/abuso); "calor local … no baixo ventre" (copy-paste de dismenorreia); 13 AINEs |
| 79 | gota | ADEQUADO | Colchicina com carga correta (1 mg + 0,5 mg 1 h, depois 12/12 h); prednisona 40 mg ×5 d ok; ALERTA artrite séptica |
| 80 | ferimento | **COM_ERROS** | Benzilpenicilina benzatina 1,2M IM DU listada como opção de "celulite/erisipela/abscesso" (não atinge níveis terapêuticos p/ celulite); SMZ-TMP 12/12 h ×3 dias é subdose; + 9 ATBs orais sem hierarquia |
| 81 | mordedura | NÃO_CURADO | Amoxicilina+clavulanato duplicada (5 d e 7 d) como itens separados; alternativas em monodroga (clindamicina, SMZ-TMP) não cobrem Pasteurella sem combinação |
| 82 | tce-leve | ADEQUADO | Coerente (proíbe AINE/AAS/sedativos; só paracetamol/dipirona); PECARN/regra canadense citados |

---

## Detalhes dos COM_ERROS / PERIGOSO / VAZIO (item a item)

### 48 — [sifilis] — COM_ERROS
1. **Ceftriaxona 500 mg IM dose única como opção da classe "Sífilis"** — este é o esquema de gonorréia, não de sífilis. Para sífilis, ceftriaxona (apenas em penicilino-alérgicos não-gestantes, com dessensibilização preferida) exige 1 g IM/dia ou 1 g/dia EV por 10–14 dias. Dose única não soroesteriliza o paciente: **alta com sífilis em atividade e falsa sensação de tratamento**. É o item mais grave do lote entre os erros de conteúdo.
2. **Cobertura só de sífilis recente** — a posologia da PWB cita "(sífilis recente…" (texto truncado) e não há esquema para sífilis tardia/desconhecida (PWB 2,4M UI/semana ×3 semanas) nem para neurosífilis (cristalina EV, encaminhar). Doxiciclina para tardia é 28 dias, não 7.
3. Rótulo: o ALERTA "NÃO USAR doxiciclina ou ceftriaxona em lugar da penicilina na gestante" é excelente — mas contradiz a própria lista que oferece ambos como alternativas sem restrição de gestação além do [gx].

### 54 — [emese-gestacao] — COM_ERROS
1. **Prometazina — "Tomar 1 comprimido à noite se coceira ou alergia"** dentro da classe "Antieméticos na gestação". Prometazina tem papel legítimo em NVG/hiperêmese (25 mg à noite), mas a instrução veio de um protocolo de alergia (mesmo bug aparece na vertigem). Sem dose, sem indicação correta: se prescrita literalmente, a gestante recebe anti-histamínico "para alergia" num quadro de vômitos.
2. Menor: dimenidrinato+piridoxina como primeira opção é empírica brasileira; piridoxina isolada/doxilamina+piridoxina é o padrão com melhor evidência (nota, não erro).

### 59 — [prostatite] — COM_ERROS
1. **Tansulosina — "por até 4 semanas ou até eliminar o cálculo"**: texto clonado do protocolo de cálculo renal. Prostatite não tem cálculo a eliminar; em prostatite aguda o alfabloqueador é para drenagem/edema (curto prazo, com cautela em retenção). O médico que lê a posologia na receita percebe o absurdo — perde confiança no app no pior momento.
2. Os 3 antimicrobianos (cipro/levo/SMZ-TMP ×28 d) estão corretos e o ALERTA (não massagear, cistostomia em vez de sonda) é de boa qualidade.

### 63 — [hipoglicemia] — COM_ERROS
1. **Classes "Antidiabéticos orais" e "Insulina" com posologias de INÍCIO** (metformina em titulação, glibenclamida, gliclazida, dapagliflozina, NPH 10 U à noite) clonadas do protocolo de hiperglicemia. O ALERTA do próprio protocolo manda **suspender/trocar sulfonilureia** e reduzir insulina — e a classe logo abaixo oferece glibenclamida para "início". Num kit de 1 clique (1º item de cada classe), um paciente com hipoglicemia por sulfonilureia ganharia nova receita de sulfa + NPH. É incoerência clínica com potencial de reiterar o evento que motivou a consulta.
2. O que deveria estar: ajuste para menos, revisão de nefropatia/infeção, orientação de regra dos 15 (essa está correta e presente).

### 64 — [vertigem] — COM_ERROS
1. **Prometazina — "à noite se coceira ou alergia"** (mesmo bug do protocolo 54). Prometazina é supressor vestibular/antiemético válido em vertigem — o texto é que está errado.
2. Classe "Supressores vestibulares (só na crise)" mistura drogas de crise (meclizina, dimenidrinato, diazepam ≤3 d — coerentes com o ALERTA) com drogas crônicas de manutenção (betaistina 30 d, flunarizina "uso contínuo até a consulta") — sem hierarquia, contraria o próprio ALERTA que limita supressor a 3 dias.
3. Diazepam [notif]: BZD é Notificação de Receita C (azul), não notificação compulsória — rótulo regulatório incorreto (recorrente no lote).

### 65 — [ansiedade] — COM_ERROS
1. **Diazepam — "Tomar 1 comprimido de 12 em 12 horas se crise de vertigem intensa, por até 3 dias"** dentro da classe "Ansiolíticos de curto prazo". Terceira ocorrência do mesmo clone de texto. Na crise de pânico o uso é "se crise", não "vertigem".
2. ALERTA e desenho geral são bons (ECG/glicemia antes de rotular, risco de suicídio, BZD como ponte) — o erro é o item clonado.
3. ISRS com titulação correta; rótulo [ctrl] em ISRS é incorreto (não são controlados) — erro conservador.

### 68 — [abstinencia-alcool] — COM_ERROS
1. **Diazepam com posologia de vertigem ("se crise de vertigem intensa, por até 3 dias")** no protocolo de abstinência. Aqui o clone não é só cosmético: **3 dias fixos de BZD é esquema insuficiente** para abstinência (a duração é sintomática, tipicamente 5–7 d com taper); quem prescrever o texto literal subtrata o paciente com CIWA limítrofe.
2. **"Diazepam exige Notificação B (azul)"** — incorreto: azul = Notificação de Receita C (Lista C1). Notificação B é amarela. Erro regulatório que aparece também no kit de rótulos [notif].
3. Tiamina apenas VO 30 dias — no ALERTA corretamente diz "tiamina antes de glicose", mas não há item de tiamina EV para uso no serviço (o mapa hospitalar tem — ver abaixo). Aceitável para o braço ambulatorial CIWA <10.

### 71 — [ait] — COM_ERROS
1. **Sinvastatina listada sob a classe "Estatinas de alta intensidade"** — sinvastatina é estatina de moderada intensidade (40 mg) e a dose de 80 mg é proibida pela ANVISA/FDA. Para prevenção secundária pós-AIT, alta intensidade = atorvastatina 40–80 mg ou rosuvastatina 20–40 mg.
2. **Estatinas sem dose em mg** ("1 comprimido à noite") — atorvastatina 10 mg e 80 mg são o mesmo "1 comprimido"; sem mg, a prescrição não garante alta intensidade, que é o objetivo declarado da classe.
3. **Dupla antiagregação (AAS 300 + clopidogrel 300, depois 21 d) sem critério de seleção** — o ALERTA limita a duração (correto) mas a classe não diferencia AIT de baixo risco (monoterapia) de AIT de alto risco/AVC menor (dupla). Oferecer carga dupla indiscriminadamente a todo AIT aumenta sangramento sem benefício comprovado nos casos de baixo risco.
4. Anti-hipertensivos: mesma lista de 10 itens sem hierarquia do protocolo 61.

### 80 — [ferimento] — COM_ERROS
1. **Benzilpenicilina benzatina 1.200.000 UI IM dose única como opção da classe "Antimicrobianos orais (celulite, erisipela, abscesso)"** — benzatina não produz níveis séricos terapêuticos para celulite/abscesso em curso (é esquema de profilaxia de febre reumática/erisipela recorrente, ou alternativa para estreptocócicas de garganta). Para erisipela o padrão oral é penicilina V/amoxicilina 7–10 d (para cellulite com S. aureus suspeito, cefalexina/oxacilina). Item clinicamente errado + categoria "orais" contendo droga IM.
2. **SMZ-TMP 12/12 h por 3 dias** para "celulite, erisipela, abscesso" — subdose grave: 3 dias não cura celulite (padrão 5–7 d; erisipela 7–10 d) e SMZ-TMP não é cobertura adequada para estreptococos/estafilococos clássicos em muitos contextos. O mesmo "3 dias" reaparece na mordedura.
3. 9 antimicrobianos orais equivalentes sem 1ª linha e sem indicação por cenário (mordedura? contambridão? imunodeprimido?) — NÃO_CURADO somado.
4. Pontos bons: cálculo de profilaxia antitetânica referenciado, ATB sistêmico restrito a condições definidas.

### PERIGOSO (protocolos)
Nenhum protocolo do lote atinge o critério de dose/rota/combinação com capacidade imediata de dano. O item PERIGOSO do lote está nos **kits** (ver seção seguinte: kit Malária = dipirona).

### VAZIO/INCOMPLETO (protocolos e mapa)
- Nenhum protocolo ambulatorial está sem opções.
- **Mapa hospitalar [bronquiolite]: INCOMPLETO** — única classe é "Analgésicos e antitérmicos" e, além de incompleto (nada de suporte: oxigenoterapia, hidratação, nem as medicações de resgate discutíveis do manejo — adrenalina nebulização, hipertônica — estão mapeadas), a classe padrão importada inclui **cetorolaco, cetoprofeno, tenoxicam e diclofenaco**, AINEs IV/potentes sem lugar de rotina em lactentes com bronquiolite. Se o mapa alimenta seleção rápida do PS pediátrico, é armadilha.

---

## Kits problemáticos

| Kit | Avaliação | Problema |
|---|---|---|
| **Malária (infeccao): kit = Dipirona** | **PERIGOSO** | Malária é [notif], exige diagnóstico (gota espessa/TDR) e antimalárico específico (cloroquina/ACT/primaquina segundo espécie). Um kit de 1 clique cuja prescrição completa é "dipirona" fabrica alta sintomática de caso potencialmente fatal (Falciparum). Se o catálogo não tem antimaláricos, o kit não deveria existir — deveria haver apenas o ALERTA de notificação/regulação. |
| Dermatite atópica (pele): kit = Loratadina | COM_ERROS | Antihistamínico oral não trata dermatite atópica (prurido em DA não é histamina-mediado). 1ª linha = emoliente + corticoide tópico de potência adequada — nenhum dos dois no kit. Paciente volta sem tratamento da dermatite. |
| Epilepsia (neuro): kit = Fenitoína | COM_ERROS | O protocolo manda "manter/ajustar dose habitual"; o kit prescreve fenitoína 100 mg 8/8 h para qualquer epiléptico conhecido — inclusive aquele em uso de valproato/levetiracetam, somando um 2º anticonvulsivante sem indicação e sem nível. Kit deveria ser apenas "orientações" + receita da droga que o paciente já usa (campo livre). |
| Insuficiência cardíaca (cardio): kit = Furosemida + **Maleato de enalapril + Enalapril** | COM_ERROS de produto | "Maleato de enalapril" e "Enalapril" listados como dois remédios distintos do kit — duplicação de molécula (dose dobrada de IECA se prescritor não notar). Além disso kit sem carvedilol/dapagliflozina é defensável, mas com a duplicação não. |
| Enxaqueca (dor): kit = Sumatriptana + Propranolol | PROBLEMÁTICO (moderado) | Sumatriptana para a crise ok; **iniciar propranolol (profilaxxia) no encontro agudo do PS** sem avaliar frequência de crises/contraindicações (asma, bradi, gestação [gc] está marcado) é excesso para 1 clique; e a combinação triptana+beta-bloqueador no mesmo clique precisa de checagem ativa. |
| Fibromialgia (dor): kit = Dipirona | POBRE/VAZIO funcional | Analgésico simples isolado não é tratamento de fibromialgia (amitriptilina/ciclobenzaprina noturna, exercício); kit gera receita inefetiva e sensação de manejo. |
| Crise hemorroidária (gastro): kit = Diosmina + hesperidina | POBRE | Só flavonoide; sem analgésico, sem tópico anestésico/anti-hemorroidário, sem orientação de banho de assento — o que mais alivia o paciente que chega ao PS. |
| Bronquite aguda (respiratorio): kit = Acetilcisteína | INOFENSIVO mas questionável | Mucolítico sem evidência para bronquite aguda; ao menos não empurra antibiótico. |
| Crupe (pediatria): kit = Dexametasona | OK | Correto (dose única); incluir orientações já vinculadas. |
| Demais kits (cólica abdominal=escopolamina; enjoo=dimenidrinato; rinossinusite=amoxicilina; celulite=cefalexina; mononucleose=paracetamol; amigdalite=amoxicilina; vitamina D; vertigem=meclizina+Brandt-Daroff; escabiose=permetrina; seborreica=cetoconazol; aftas=triancinolona; vaginose=metronidazol; sífilis=benzatina; dismenorreia=mefenâmico+calor; HTA gestação=metildopa; cálculo=tansulosina; ferimento=curativo) | OK | Fazem sentido como kit inicial da queixa. |

---

## Erros de dose/posologia detectados (textuais)

1. **Ceftriaxona 500 mg IM DU como "tratamento de sífilis"** (protocolo 48) — esquema inexistente para sífilis (é de gonorréia); correta seria 1 g/dia ×10–14 d em contexto excepcional.
2. **SMZ-TMP 12/12 h ×3 dias** para "celulite/erisipela/abscesso" e mordedura (protocolos 80 e 81) — 3 dias é subdose (mínimo 5–7 d) — subtratamento com risco de recidiva/complicação.
3. **Benzatina 1,2M UI DU na classe de "celulite/erisipela/abscesso"** (protocolo 80) — sem eficácia terapêutica para esses quadros; classe ainda rotulada de "orais" contendo droga IM.
4. **Prometazina "1 cp à noite se coceira ou alergia"** (protocolos 54 e 64) — indicação errada (clone de antialérgico), sem dose em mg em contexto de êmese/vertigem.
5. **Diazepam "se crise de vertigem intensa, por até 3 dias"** (protocolos 65 e 68) — clone de vertigem em ansiedade e abstinência; na abstinência alcoólica, 3 dias fixos é subtratamento.
6. **Tansulosina "até eliminar o cálculo"** (protocolo 59) — clone de cálculo renal em prostatite.
7. **"Calor local — bolsa de água morna sobre o baixo ventre"** (protocolo 78, cervicalgia) — clone de dismenorreia; deveria ser nuca/ombros.
8. **Aciclovir "1 comprimido 5×/d ×10 d"** (protocolo 69, Bell) — sem mg; se 200 mg = 1 g/dia, subdose para paralisia facial (usual 400 mg 5×/d = 2 g/dia quando se usa antiviral).
9. **Prednisolona pediátrica "2 cp (40 mg) 1×/d ×5 d"** (protocolo 69) — dose fixa adulta marcada (ped✓); em criança o correto é 1–2 mg/kg/dia (máx 60 mg) — o (ped✓) transmite falsa segurança de esquema pediátrico estruturado.
10. **Estatinas sem mg** (protocolo 71) + sinvastatina rotulada de "alta intensidade" — a prescrição "1 cp à noite" não garante a intensidade que justifica a classe.
11. **Ácido tranexâmico "4 comprimidos (1 g) 8/8 h"** (protocolo 53) — coerente só se comprimido = 250 mg; o padrão comercial mais comum é 500 mg (2 cp = 1 g). Ambíguo, risco de dose dupla do pretendido (ainda assim dentro do teto diário usual de 3–4 g, mas a ambiguidade não pode existir em hemorragia).
12. **Anticonvulsivantes "1 comprimido" sem mg** (protocolo 72) — fenitoína 100 mg 8/8 h e carbamazepina 200 mg 12/12 h são plausíveis no adulto, mas "manter/ajustar dose habitual" com posologia fixa genérica convida a erro (paciente em 400 mg 12/12 h de CBZ recebe "1 cp 12/12 h").
13. **Itraconazol 200 mg 12/12 h ×1 dia** para candidíase vulvovaginal (protocolos 42–43) — off-PCDT e inferior ao fluconazol 150 mg DU; não é perigoso, mas polui a escolha.
14. **Duplicação "Maleato de enalapril + Enalapril"** no kit de IC — risco de IECA em dose dobrada.
15. **Rótulos regulatórios incorretos (não exatamente dose, mas afetam a prescrição)**: BZD e zolpidem marcados [notif] — o correto seria [ctrl] com "Notificação de Receita C (azul)"; o ALERTA da abstinência chama isso de "Notificação B (azul)" (B é amarela). ISRS, trazodona, mirtazapina, amitriptilina, fenitoína, carbamazepina e valproato marcados [ctrl] — nenhum é controlado pela Portaria 344 (erro conservador, mas confunde o prescritor sobre receita necessária).
16. **Colchicina** (protocolo 79): carga 1 mg + 0,5 mg após 1 h, depois 0,5 mg 12/12 h — **correta** (destaque positivo; é a posologia que mais costuma vir errada em apps).
17. **PWB 2,4M UI IM DU "sífilis recente"** — correta para recente; ausência do esquema tardia (2,4M/semana ×3) é lacuna, não erro de dose.

---

## Classes EV do mapa hospitalar (parte 2) — avaliação por bloco

| Bloco | Veredicto | Notas |
|---|---|---|
| cefaleia/enxaqueca | Apropriado | Dipirona+metoclopramida, clorpromazina, sumatriptana, cetorolaco, dexametasona (rescue) — coerente com manejo EV de enxaqueca no PS. |
| pielonefrite | Apropriado | Ceftriaxona/gentamicina/cipro/cefepima/amp-sulbactam — cobre o espectro esperado para internação. |
| colica-biliar | Apropriado | Antiespasmódico + analgésico + opioides (com naloxona disponível) + ATB abdominal — correto. |
| sinusite | Aceitável com ressalva | Classe "faringe/ouvido/face" só tem EV (ceftriaxona, amp-sulbactam, cristalina); amoxicilina/amox-clav orais (padrão ambulatorial) não aparecem — coerente apenas se o mapa é estritamente EV. |
| picada | Apropriado | "Anafilaxia (adrenalina primeiro)" com adrenalina, difenidramina, prometazina, hidrocortisona — ordem de prioridade explícita, muito bom. |
| abscesso | Apropriado | Lidocaína 2% s/ vasoconstritor + ATB SPPM (cefazolina, oxacilina, clindamicina) + imunobiológicos tétano/raiva. |
| **sifilis** | **PROBLEMÁTICO** | O bloco hospitalar de sífilis é a classe genérica "Antimicrobianos (DIP/ginecológico)" com **ceftriaxona em primeiro** e benzatina por último; se o hospital usa o mapa como ordem de escolha, o 1º remédio da classe de um paciente com sífilis é ceftriaxona (mesmo erro conceitual do protocolo 48). Falta penicilina cristalina (neurossífilis/internação). |
| **violencia-sexual** | **PROBLEMÁTICO** | Mesma classe DIP genérica; **não há classe de PEP antirretroviral** no bloco hospitalar (TDF/3TC+DTG são orais, mas é a medicação mais crítica e urgente do encontro) nem contracepção de emergência/levonorgestrel. |
| prostatite | Apropriado | Ceftriaxona/gentamicina/cipro/cefepima/amp-sulbactam para prostatite toxêmica internada — adequado. |
| hipoglicemia | Apropriado | Glicose 50%/10% + tiamina — ordem segura (tiamina listada junto da glicose). |
| paralisia-facial | Aceitável | Corticoides EV disponíveis; prednisona VO (padrão de Bell) não está porque o mapa é EV — ok, mas deixar explícito. |
| abstinencia-alcool | Apropriado | Tiamina + diazepam + glicose; agitação com haloperidol/prometazina/midazolam/diazepam — correto. |
| tendinite | Aceitável | Só analgésicos; sem corticoide para infiltração (triamcinolona) — lacuna de produto para bursite/epicondilite refratária. |
| mordedura | Aceitável com ressalva | Imunobiológicos completos (vacina+IGHAR/SAR, dT+IGHAT/SAT) — ótimo; mas a classe ATB é "pele e partes moles" (cefazolina/oxacilina) que não cobre Pasteurella de mordedura; amox-clav/amp-sulbactam deveriam estar. |
| **bronquiolite** | **INCOMPLETO/ARRISCADO** | Única classe = antitérmicos/AINEs padrão com cetorolaco/cetoprofeno/tenoxicam/diclofenaco — sem lugar em lactente com bronquiolite; nada do suporte real (O2, hidratação) nem opções discutíveis mapeadas. Ver detalhe na seção VAZIO. |
| convulsao-aguda | Apropriado | Diazepam/midazolam/fenitoína/fenobarbital + glicose/tiamina — sequência correta. |

---

## Recomendações prioritárias (para decisão do médico responsável)

1. **Bloquear o kit Malária** até existirem antimaláricos no catálogo (ou transformar em ALERTA de notificação + regulação).
2. **Remover ceftriaxona DU da classe "Sífilis"** (protocolo 48) e do topo do bloco hospitalar de sífilis; adicionar esquema tardia (PWB ×3 semanas).
3. **Corrigir o clone de textos** (prometazina-alergia, diazepam-vertigem, tansulosina-cálculo, calor-baixo ventre) — é bug de sistema de templates, não conteúdo isolado; sugere auditora automatizada de "posologia × classe × protocolo".
4. **Redesenhar a classe AINEs** (13 itens replicada em ≥9 protocolos) para 2–3 itens com 1ª linha marcada (ibuprofeno/naproxeno + reserva), mantendo o resto no catálogo geral.
5. **Remover sulfonilureias/insulina-início do protocolo de hipoglicemia** (63) — substituir por lógica de ajuste/redução.
6. Corrigir doses textuais listadas acima (SMZ-TMP 3 d, benzatina em celulite, aciclovir Bell, estatina sem mg, tranexâmico ambíguo) e os rótulos regulatórios (BZD = Notificação C/azul; desmarcar [ctrl] de ISRS/anticonvulsivantes não controlados).

— fim do lote 2 —
