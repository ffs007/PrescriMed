# Auditoria clínica — Lote 1/4 (protocolos 1–41)
Revisor: auditoria clínica sênior de medicina de emergência (PS/Sala Vermelha, adulto + pediatria, rede pública e privada).
Data: 2026-11-04. Escopo: protocolos ambulatoriais 1–41, mapa hospitalar (parte 1) e kits por queixa (parte 1) do arquivo `batches/batch_1.md`.

---

## Resumo do lote (contagem por veredicto)

| Veredicto | Contagem |
|---|---|
| ADEQUADO | 8 |
| NÃO_CURADO | 12 |
| COM_ERROS | 20 |
| PERIGOSO | 1 |
| VAZIO/INCOMPLETO | 0 |
| **Total** | **41** |

**Padrões transversais (valem para quase todo o lote e são o principal problema de produto):**

1. **Classe AINE com 14 itens idênticos e sem hierarquia** replicada em ~15 protocolos de dor. Para um app que promete prescrição rápida, 14 AINEs equivalentes sem marcação de 1ª linha é anti-produto. Inclui itens questionáveis como rotina de PS: **nimesulida** (restrição Anvisa >12 anos, hepatotoxicidade — sem nota), **piroxicam** (meia-vida longa, risco GI/skin, inadequado para dor aguda), **celecoxibe/etoricoxibe** (sem indicação para dor aguda de PS).
2. **AAS como 3º analgésico de rotina** em quase todos os protocolos, inclusive GECA, IVAS, faringite, OMA (condições de alta frequência pediátrica) — sem nenhuma ressalva de idade/síndrome de Reye no texto da posologia. Em PS moderno, AAS como analgésico/antitérmico de rotina está desatualizado. A varicela e a dengue, corretamente, excluem — provando que o sistema sabe fazer isso, mas só fez ali.
3. **Classe anti-histamínica com 11 itens** clonada em 12+ protocolos, inclusive onde não tem indicação (celulite, foliculite, micose, pediculose, asma).
4. **Posologias sem mg** ("1 comprimido de 6/6h") — impossível auditar dose sem mg; risco de subdose/superdose silenciosa.
5. **Textos truncados** (dados corrompidos que chegam à prescrição): SRO ("após cada evacu"), loperamida ("Máx"), gabapentina ("de 8 em 8"), salbutamol ("se tosse,"), triancinolona ("por a"), permetrina escabiose ("ret"), higiene palpebral ("2 veze"). Se esses textos alimentam a receita, é defeito de produto grave.
6. **Classe "Antimicrobianos orais (celulite, erisipela, abscesso)" inteira copiada** para abscesso, impetigo, foliculite, queimadura, hordéolo, otite externa — sem curadoria por condição (é o padrão COM_ERROS dominante do lote).

---

## Tabela: protocolo | veredicto | principais problemas

| # | Protocolo | Veredicto | Principais problemas |
|---|---|---|---|
| 1 | febre-dor | NÃO_CURADO | 14 AINEs equivalentes sem 1ª linha; AAS sem ressalva pediátrica; nimesulida/piroxicam sem notas |
| 2 | cefaleia | NÃO_CURADO | 14 AINEs; ergotamina máx 4/dia sem limite semanal e sem proibir combinação com triptano; topiramato marcado [ctrl] indevidamente (não é controlado) |
| 3 | lombalgia | COM_ERROS | **Carisoprodol (banido pela Anvisa desde 2016)** ainda listado; associação carisoprodol+paracetamol+diclofenaco duplicaria AINE se combinada com a classe AINE |
| 4 | colica-renal | NÃO_CURADO | 14 AINEs; clinicamente ok (AINE é 1ª linha aqui, tansulosina correta); falta alerta de retorno se febre (pielonefrite) |
| 5 | geca | COM_ERROS | AAS listado em protocolo majoritariamente pediátrico sem aviso Reye; loperamida com (ped✓) e sem ressalva "não usar se febre/sangue/<2 anos"; textos truncados (SRO, loperamida) |
| 6 | nauseas | NÃO_CURADO | 6 IBP por 14–28 dias para náusea aguda auto-limitada = sem indicação/overtreatment |
| 7 | dispepsia | NÃO_CURADO | 6 IBP equivalentes sem hierarquia; restante correto |
| 8 | colica-biliar | COM_ERROS | IBP (14–28 dias) listado para cólica biliar = sem indicação; AINE correto aqui; falta nota de encaminhamento cirúrgico |
| 9 | ivas-gripe | COM_ERROS | Corticoide nasal 14 dias para resfriado comum (sem indicação, diretrizes desaconselham); 11 anti-histamínicos; mel sem ressalva <1 ano |
| 10 | faringite | COM_ERROS | Corticoide sistêmico 40 mg/5 dias para faringite comum = agressivo demais; penicilina benzatina 1.200.000 UI fixa com (ped✓) — criança <30 kg precisa 600.000 UI |
| 11 | oma | NÃO_CURADO | 14 AINEs; antibioticoterapia correta e completa; sem erros clínicos |
| 12 | sinusite | NÃO_CURADO | 11 anti-histamínicos (indicação só na forma alérgica); ATBs e tópicos nasais corretos |
| 13 | cistite | ADEQUADO | Nitrofurantoína/fosfomicina/SMZ-TMP 3d corretos; fenazopiridina 2 dias correta; nota: ciprofloxacino 7d para cistite simples é longo (3d basta) |
| 14 | pielonefrite | COM_ERROS | **SMZ-TMP 12/12h por 3 DIAS** (copiado da cistite) — insuficiente para pielonefrite; cefuroxima 7d curto (10–14d); amox-clav 7d limítrofe |
| 15 | pac | ADEQUADO | Cobertura típica+atípica correta; oseltamivir presente; nota: levo como opção reservada ok, mas marcar restrição |
| 16 | asma | NÃO_CURADO | 11 anti-histamínicos sem indicação direta em asma (só rinite comórbida); resto correto (SMART máx 8 doses/d ✓, corticoide oral ✓) |
| 17 | urticaria | ADEQUADO | 2ª geração 1ª linha ✓; corticoide só se grave (nota); 11 anti-histamínicos é excessivo mas todas as opções são legítimas aqui |
| 18 | dengue | ADEQUADO | Alerta NÃO USAR AINE/AAS/corticoide correto e destacado; item "Hidratação oral (dengue)" sem droga (bug de dados) |
| 19 | celulite | COM_ERROS | **SMZ-TMP 3 dias** insuficiente; azitromicina inadequada para celulite; 11 anti-histamínicos sem indicação; falta marcar cefalexina/penicilina como 1ª linha |
| 20 | abscesso | COM_ERROS | **Benzilpenicilina benzatina não cobre S. aureus** (patógeno principal do furúnculo); SMZ-TMP 3d; 9 ATBs orais para furúnculo incentiva antibiótico onde o tratamento é drenagem |
| 21 | impetigo | COM_ERROS | SMZ-TMP 3 dias; benzatina não cobre estafilo; tópicos (mupirocina) corretos como 1ª linha mas sem hierarquia |
| 22 | foliculite | COM_ERROS | 9 ATBs orais para foliculite simples (o tratamento é tópico/hibiene); SMZ-TMP 3d; benzatina inadequada |
| 23 | escabiose | COM_ERROS | **Deltametrina com posologia de pediculose** ("aplicar no cabelo, pente fino") na escabiose; escada de corticoides tópicos até clobetasol para prurido de escabiose = excessivo |
| 24 | pediculose | NÃO_CURADO | 11 anti-histamínicos; permetrina/deltametrina/ivermectina corretas; falta dimeticone (padrão atual) — nota |
| 25 | micose | NÃO_CURADO | Antifúngicos corretos; 11 anti-histamínicos sem indicação em micose |
| 26 | candidiase-pele | COM_ERROS | **Griseofulvina não tem atividade contra Candida** (item ineficaz listado); antifúngicos orais para intertrigo simples = overtreatment; textos copy-paste de tinha em todo o protocolo |
| 27 | zoster | ADEQUADO | Antivirais e doses corretos para zoster; escada de dor neuropática com titulação ✓; texto da gabapentina truncado |
| 28 | herpes-simples | COM_ERROS | **Posologias de zoster coladas no herpes labial**: aciclovir 800 mg 5x/d 7d (dose de zoster); valaciclovir "1 g 8/8h (herpes zoster)" — para labial é 2 g 12/12h por 1 dia |
| 29 | varicela | ADEQUADO | Exclusão correta de AAS/ibuprofeno com justificativa; aciclovir 800 5x/d correto p/ adulto; valaciclovir anotado "(herpes zoster)" copy-paste |
| 30 | picada | NÃO_CURADO | Escada tópica até clobetasol para picada de inseto = potência excessiva; corticoide sistêmico 40 mg/5d para picada comum = exagero |
| 31 | queimadura | COM_ERROS | **9 ATBs orais para queimadura leve 1º/2º grau** — profilaxia antibiótica sistêmica é contraindicada; benzatina/SMZ-TMP-3d copy-paste; sulfadiazina correta |
| 32 | dermatite | ADEQUADO | Escada de potências correta e ordenada; nota: sem aviso de não usar clobetasol em face/dobras |
| 33 | conjuntivite | COM_ERROS | **Tobramicina+dexametasona como opção comum de conjuntivite** sem diferenciar etiologia — corticoide oftálmico em conjuntivite infecciosa não especificada (risco herpes/úlcera) |
| 34 | hordeolo | COM_ERROS | **9 ATBs orais para hordéolo simples** (auto-limitado; ATB oral só em celulite preseptal); benzatina absurda aqui |
| 35 | abrasao-cornea | COM_ERROS | **Tobramicina+dexametasona para abrasão/trauma de córnea** — corticoide com epitélio lesado retarda cicatrização e favorece úlcera/melting; moxifloxacino ok |
| 36 | otite-externa | COM_ERROS | 9 ATBs orais para otite externa simples (tratamento é tópico); gotas cipro+HC e polimixina corretas; benzatina absurda aqui |
| 37 | cerume | **PERIGOSO** | **Óleo mineral "Tomar 15 mL à noite" — VIA ORAL para cerume**: rota errada (é tópico/otológico; 15 mL VO é laxativo), ineficaz para a indicação e com risco de broncoaspiração/pneumonia lipóide em idosos |
| 38 | afta | ADEQUADO | Tópicos orais corretos e completos |
| 39 | gengivoestomatite | COM_ERROS | Herpangina é enterovírus — antiviral não tem eficácia, mas classe antiviral listada para a condição; valaciclovir/fanciclovir com posologia "(herpes zoster)" copy-paste |
| 40 | odontalgia | NÃO_CURADO | 14 AINEs; metronidazol isolado como opção para abscesso dentário é cobertura inadequada (flora mista aeróbia/anaeróbia); ATBs principais corretos |
| 41 | candidiase-oral | COM_ERROS | **Fluconazol "1 cápsula 1x/semana por 4 semanas (tinha)"** — copy-paste da tinha; candidíase oral = 100 mg/dia por 7–14 dias. Dose semanal é insuficiente |

---

## Detalhes dos COM_ERROS / PERIGOSO / VAZIO

### PERIGOSO

**[37] cerume — Óleo mineral 15 mL VO à noite**
- Erro de rota: amolecedor de cerume é tópico (gotas otológicas). "Tomar 15 mL" é a posologia de laxativo emulsionante de óleo mineral, não de cerumenolítico.
- Potencial de dano: broncoaspiração e pneumonia lipóide (população típica de cerume impactado é idosa); além de falha terapêutica completa com persistência da queixa.
- Correção: óleo mineral/glicerina 2–3 gotas no conduto 2–3x/dia, ou manter apenas oleato de trolamina (que está correto no mesmo protocolo).

### COM_ERROS (item a item)

**[3] lombalgia — Carisoprodol + paracetamol + diclofenaco + cafeína**
- Carisoprodol teve comercialização **proibida pela Anvisa (RDC 108/2016)** no Brasil. Item banido ainda oferecido como opção vigente gera receita juridicamente inválida e clínica desatualizada. Substituir por relaxante disponível (ciclobenzaprina já está na lista).

**[5] geca**
- AAS como opção em gastroenterite aguda: condição com alta frequência pediátrica; sem ressalva de idade/síndrome de Reye no texto. Remover ou travar com alerta.
- Loperamida com (ped✓) e texto truncado no máximo diário: loperamida é contraindicada <2 anos e desaconselhada se febre/sangue nas fezes (risco de íleo/megacolo tóxico em disenteria). O marcador ped✓ sem essas travas é risco alto — verificar o esquema pediátrico interno antes de liberar.
- SRO com texto truncado ("após cada evacu") — instrução incompleta na receita.

**[8] colica-biliar — classe IBP (6 itens, 14–28 dias)**
- Sem indicação na cólica biliar. O tratamento da crise é AINE/espasmódico/opioide se necessário; IBP não tem papel. Remove credibilidade e gera receita-ruído.

**[9] ivas-gripe — Budesonida/mometasona spray 14 dias**
- Corticoide nasal para resfriado comum não tem indicação (é tratamento de rinite alérgica/ sinusite crônica). 14 dias de esteróide nasal por IVAS = overtreatment incrustado. Nota adicional: mel com (ped✓) sem excluir <1 ano (botulismo).

**[10] faringite**
- Prednisona/prednisolona 40 mg/dia × 5 dias para faringite comum: agressivo e sem respaldo de rotina (evidência existe para dose única de dexametasona em faringite grave/abscesso). Em PS, oferecer corticoide de 5 dias como classe padrão para dor de garganta banal é errado.
- Benzilpenicilina benzatina 1.200.000 UI IM com (ped✓): a dose pediátrica (<30 kg) é 600.000 UI. Se o esquema pediátrico estruturado não diferencia, é dose duplicada na criança pequena — verificar internamente.

**[14] pielonefrite — SMZ-TMP 12/12h por 3 dias**
- Copiado da cistite. Pielonefrite exige 10–14 dias (SMZ-TMP: 14d se suscetível). 3 dias = falha terapêutica, bacteriemia persistente, reinternação. Também: cefuroxima 7d é curto para rim (10–14d); amox-clav 7d limítrofe.

**[19] celulite**
- SMZ-TMP 3 dias: insuficiente (5–7d mínimo, 7–10d se erisipela recorrente). Mesma cópia da cistite.
- Azitromicina 3 dias para celulite: cobertura não confiável para estreptococo/estafilo; não é alternativa padrão.
- Anti-histamínicos (11 itens) sem indicação em celulite.

**[20] abscesso**
- Benzilpenicilina benzatina para furúnculo/abscesso: penicilina não cobre S. aureus (patógeno principal). Item ineficaz para a condição.
- SMZ-TMP 3 dias (idem).
- Estrutura: o tratamento do abscesso cutâneo simples é drenagem; oferecer 9 ATBs orais como classe padrão sem hierarquia incentiva antibiótico desnecessário.

**[21] impetigo**
- SMZ-TMP 3 dias (idem, insuficiente — impetigo 5–7d).
- Benzatina: impetigo é doença estafilocócica/estreptocócica; benzatina não cobre estafilo produtor de penicilinase. Cefalexina/amox-clav/mupirocina são as escolhas certas (estão lá, mas sem hierarquia contra as erradas).

**[22] foliculite**
- 9 ATBs orais para foliculite simples (tratamento: tópico + higiene; oral só em foliculite extensa/recorrente). SMZ-TMP 3d e benzatina idem acima.

**[23] escabiose**
- Deltametrina com posologia de pediculose ("aplicar no cabelo molhado… pente fino… repetir após 7 dias"): para escabiose é loção corporal do pescoço aos pés. Posologia de outra doença = risco de tratamento incorreto (só o couro cabeludo tratado, escabiose persiste).
- Escada de corticoides tópicos culminando em clobetasol para prurido de escabiose: potência inadequada para a indicação (e uso sobre parasita vivo sem escabicida em paralelo pode piorar).

**[26] candidiase-pele**
- **Griseofulvina listada para candidíase cutânea: não tem atividade contra Candida spp.** Item ineficaz.
- Classe de antifúngicos orais (4 itens, incluindo itraconazol 200 mg/d) para intertrigo simples: overtreatment — tópico é o padrão.
- Todo o protocolo é um copy-paste de [micose] (mantém "pitiríase versicolor", "tinha do corpo" nas posologias).

**[28] herpes-simples**
- Aciclovir 800 mg 5x/d × 7d para herpes labial: é o esquema de ZOSTER. Labial: 400 mg 8/8h (ou 200 mg 5x/d) × 5d; melhor ainda valaciclovir 2 g 12/12h por 1 dia.
- Valaciclovir e fanciclovir listados com a posologia anotada "(herpes zoster)" dentro do protocolo de herpes simples — doses erradas para a condição do protocolo.

**[31] queimadura**
- Classe de 9 ATBs orais para queimadura leve de 1º/2º grau pequena: profilaxia antibiótica sistêmica em queimadura é contraindicada; ATB só se infecção documentada. Inclui benzatina (sem cobertura para flora de queimadura) e SMZ-TMP 3d.

**[33] conjuntivite**
- Tobramicina + dexametasona (colírio) como opção da mesma classe dos ATBs puros: corticoide oftálmico em conjuntivite bacteriana tem papel restritíssimo; sem diferenciação etiológica, o 1-clique/médico apressado prescreve corticoide+antibiótico para toda conjuntivite (risco se herpes simplex ocular, ulceração). Se mantiver, precisa de trava "nunca se suspeita de etiologia viral/herpética".
- Nota positiva: cloranfenicol pomada é realidade brasileira; nafazolina com teto de 3 dias correto.

**[34] hordeolo**
- 9 ATBs orais para hordéolo (terçol) simples: doença auto-limitada tratada com compressa morna ± ATB tópico. ATB oral reservado a celulite preseptal. Benzatina particularmente absurda. A classe inteira deveria sair ou virar "excepcional".

**[35] abrasao-cornea**
- Tobramicina + dexametasona para abrasão de córnea/corpo estranho: corticosteroide tópico com epitélio corneano lesado retarda reepitelização e aumenta risco de úlcera/melting e infecção secundária. Este é o achado oftálmico mais grave do lote — remover do protocolo de trauma.
- Compressa morna e higiene palpebral são irrelevantes aqui (copy-paste).

**[36] otite-externa**
- 9 ATBs orais para otite externa difusa: o tratamento é tópico (gotas com corticoide+ATB — corretamente presentes). ATB oral só em otite externa maligna/diabetes/imunossupressão. Benzatina idem absurda.

**[39] gengivoestomatite**
- Protocolo mistura gengivoestomatite herpética (aciclovir tem papel se grave/precose) com HERPANGINA (enterovírus — antiviral não tem nenhuma eficácia). A classe antiviral disponível para ambas sem distinguir gera prescrição inútil em criança com herpangina.
- Valaciclovir/fanciclovir com posologia "(herpes zoster)" copy-paste.

**[41] candidiase-oral**
- Fluconazol "1 cápsula 1x/semana × 4 semanas (tinha)": copy-paste da tinha — candidíase oral trata-se com 100 mg/dia × 7–14d (ou nistatina/miconazol tópicos, que estão corretos). Dose semanal = insuficiente, infecção persiste.

### VAZIO/INCOMPLETO
Nenhum protocolo do lote ficou sem opções quando deveria ter — o problema dominante é o excesso, não a ausência.

---

## Avaliação do MAPA HOSPITALAR (classes EV, parte 1)

| Protocolo | Avaliação |
|---|---|
| febre-dor | Adequado. Cetorolaco EV como 1ª linha de dor no PS é correto; painel de antieméticos EV completo. |
| cistite | Adequado (suporte sintomático; ATB é oral). |
| dispepsia | Adequado com nota: **simeticona listada em "Proteção gástrica"** — simeticona não é proteção gástrica (e a apresentação IV não é padrão). |
| oma | Adequado. Penicilina cristalina/ampicilina-sulbactam para complicações é correto. |
| urticaria | Adequado. Adrenalina na frente da classe nomeada corretamente; hidrocortisona succinato ✓. |
| celulite | Adequado. Cefazolina/oxacilina EV é o padrão correto; profilaxia TEV apropriada para imobilizados. |
| queimadura | Adequado com 2 notas: **naloxona listada dentro de "Opioides"** (é antagonista de resgate — categorização confusa pode levar a prescrevê-la como analgésica); falta classe de reposição volêmica (Ringer lactato/SG) mesmo para queimadura pequena. |
| dip | Parcialmente adequado: ceftriaxona+metronidazol/gentamicina ok; **benzilpenicilina benzatina listada para DIP não tem indicação**; ideal marcar ceftriaxona+metronidazol como par padrão. |
| sangramento-uterino | **Incompleto como mapa**: só ácido tranexâmico; falta a classe hormonal (acetato de medroxiprogesterona/pílula combinada em altas doses), que é pilar do manejo do sangramento uterino agudo não gestante. |
| mastite | Adequado (anti-estafilocócicos EV corretos). |
| hiperglicemia | Adequado com nota: Glicose 50% serve para hipoglicemia iatrogênica (ok ter à mão); falta classe de hidratação (SG 0,9%) que é parte do tratamento. |
| vertigem | Adequado (dimenidrinato/prometazina/diazepam EV = prática brasileira padrão). |
| ansiedade | Adequado com nota: haloperidol+prometazina é o padrão brasileiro de sedação; midazolam E diazepam na mesma lista como alternativas ok. |
| fratura-imobilizada | Adequado (morfina/tramadol + TEV profilática apropriada). |
| ferimento | Adequado. Lidocaína 2% sem vasoconstritor correta para sutura; painel imunobiológico de tétano/raiva completo e correto. |
| hemorroida | Problemático no detalhe: **morfina para crise hemorroidária** piora o fator desencadeante (constipação) e é exagero; tramadol basta. Naloxona na classe "Opioides" idem nota acima. |
| anafilaxia | Adequado e bem estruturado (adrenalina primeiro, broncodilatador, corticoide). |

---

## Kits problemáticos (botão de 1 clique)

| Kit | Julgamento |
|---|---|
| **Herpes zoster → Dipirona (sozinha)** | **GRAVE — defeito do mecanismo de kit.** O protocolo tem classe de antivirais; um kit de 1 clique para zoster que sai sem antiviral (o essencial, <72 h) e sem nada para dor neuropática produz alta inadequada com aparência de completa. Se a regra é "1º item de cada classe", a classe antiviral não entrou — bug. |
| **Asma → Beclometasona (sozinha)** | **PROBLEMÁTICO.** Kit de asma em PS/alta sem broncodilatador de resgate e sem corticoide oral. Paciente sai de alta pós-crise apenas com corticoide inalatório de controle — sem SABA, risco de re_crise não tratada. Kit esperado: salbutamol + prednisona ± beclometasona. |
| **Síndrome gripal → Oseltamivir (sozinho)** | **PROBLEMÁTICO.** A maioria dos IVAS não é influenza; kit de 1 clique que prescreve antiviral para todo resfriado, sem sintomático associado, é stewardship negativo. Deveria ser dipirona ± (oseltamivir só se criteria/gripe confirmada). |
| **DIP → Ceftriaxona (sozinha)** | **PROBLEMÁTICO.** DIP ambulatorial exige ceftriaxona IM **+ metronidazol** (± doxiciclina); ceftriaxona solo não cobre anaeróbios — perfilaxia/TRATAMENTO incompleto de DIP com falsa sensação de cobertura. |
| **Violência sexual → Tenofovir+lamivudina + Ceftriaxona** | **PROBLEMÁTICO (incompleto para a gravidade).** Faltam azitromicina (clamídia), metronidazol (tricomonas/bv), contracepção de emergência, e o esquema PEP completo com follow-up. Kit parcial desta natureza é mais perigoso que nenhum kit, porque simula profilaxia completa. |
| **Pré-natal (suplementação) → Sulfato ferroso** | **PROBLEMÁTICO.** Kit pré-natal sem **ácido fólico** (essencial, inclusive pré-concepcional) está incompleto para o que o nome promete. |
| **Dermatite alérgica → Loratadina (sozinha)** | **PROBLEMÁTICO.** O tratamento da dermatite de contato é corticoide tópico; anti-histamínico é coadjuvante do prurido. Kit só com loratadina trata mal a queixa principal. |
| **Otite média aguda → Amoxicilina (sozinha)** | Inconsistente com a regra declarada: o protocolo oma tem classe de analgésicos — o kit deveria trazer amoxicilina + dipirona/ibuprofeno (analgésia é pilar da alta em OMA). Antimicrobiano certo. |
| **Diverticulite → Amoxicilina+clavulanato (sozinho)** | Aceitável com ressalva: ATB correto para diverticulite leve, mas kit sem analgesia e sem orientação de dieta líquida; garantir que o protocolo-mãe traga os dois. |
| **Candidíase vaginal → Miconazol creme + Fluconazol (ambos)** | Redundância: diretrizes recomendam tópico OU oral. Kit prescrevendo ambos = polypharmacy automático. Menor, mas fácil de corrigir (ou explicitar quando associar). |
| **Hipertensão → Losartana; Hipotireoidismo → Levotiroxina** | Com ressalva: 1 clique iniciando anti-hipertensivo/levotiroxina só faz sentido com diagnóstico pré-documentado (TSH/MAPA); garantir trava para não virar "receita de primeira consulta sem exame". |
| Dengue (dipirona + hidratação); mialgia (ibuprofeno); constipação; DRGE (omeprazol); coqueluche (azitromicina); laringite (prednisona); anemia (ferro); insônia (trazodona); trigêmeo (carbamazepina); otite externa (cipro+HC); verrugas (podofilotoxina); ITU na gestação (cefalexina — escolha correta e segura); balanopostite (clotrimazol); queimadura (sulfadiazina) | Fazem sentido clínico como kit de 1 clique. Destaque positivo para ITU na gestação (ceflexina em vez de SMZ-TMP/nitrofurantoína) e dengue (respeita a exclusão de AINEs). |

---

## Erros de dose/posologia detectados (consolidado)

1. **SMZ-TMP 12/12h por 3 dias em pielonefrite, celulite, abscesso, impetigo, foliculite, queimadura** — duração copiada da cistite; insuficiente para todas essas condições (pele: 5–10d; rim: 10–14d).
2. **Herpes simples com esquema de zoster**: aciclovir 800 mg 5x/d × 7d (labial: 400 mg 8/8h × 5d); valaciclovir 1 g 8/8h × 7d anotado "(herpes zoster)" (labial: 2 g 12/12h × 1d); fanciclovir 500 mg 8/8h (labial: 1.500 mg dose única).
3. **Fluconazol semanal × 4 semanas "(tinha)" na candidíase oral** — correto seria 100 mg/dia × 7–14d. Dose insuficiente.
4. **Óleo mineral 15 mL VO à noite para cerume** — rota errada (tópico otológico); 15 mL VO é posologia laxativa.
5. **Deltametrina na escabiose com posologia de pediculose** (cabelo + pente fino) — tratamento corporal ausente.
6. **Benzilpenicilina benzatina 1.200.000 UI fixa com (ped✓)** em faringite/celulite/abscesso/impetigo/foliculite/hordéolo/otite externa/queimadura — dose pediátrica (<30 kg) é 600.000 UI; e nas indicações estafilocócicas (abscesso, impetigo, hordéolo) o fármaco em si está errado (não cobre S. aureus).
7. **Griseofulvina 6 semanas para candidíase cutânea** — sem atividade anti-Candida; item ineficaz.
8. **Ergotamina: "máximo 4/dia" sem limite semanal e sem contraindicação de uso simultâneo com triptanos** — risco de ergotismo e vasoespasmo somado (as duas classes estão no mesmo protocolo).
9. **Posologias sem miligramas** ("1 comprimido", "1 cápsula", "2 comprimidos") em todo o lote — impossível validar dose (ex.: paracetamol "1 cp 6/6h" pode ser 500 mg = subdose ou 750 mg = correto). O app calcula dose por peso? Se não, é deficiência central.
10. **Textos truncados** em SRO, loperamida (máx diário ilegível), gabapentina (esquema incompleto), salbutamol, triancinolona, permetrina (escabiose), higiene palpebral — instruções cortadas que podem chegar à receita.
11. Notas menores: ciprofloxacino 7d para cistite simples (3d basta); metronidazol isolado para abscesso dentário (cobertura inadequada); corticoide nasal 14d para resfriado; prednisona 40 mg × 5d para faringite comum; carisoprodol (banido) na lombalgia.
12. Verificação solicitada pela coordenação: não há "Escopolamina 20 mg EV" textual neste lote; as drágeas orais de butilbrometo (10 mg 8/8h) estão corretas.

---

## Recomendações prioritárias (para o médico responsável)

1. **Bloquear os itens PERIGOSO/ineficazes já identificados** antes de qualquer uso real: óleo mineral VO, carisoprodol, benzatina em indicações estafilocócicas, tobramicina+dexametasona em trauma ocular, griseofulvina em candidíase.
2. **Corrigir as durações de SMZ-TMP** (é um único registro-fonte copiado em 6 protocolos — provavelmente uma correção no banco resolve os 6).
3. **Auditar o mecanismo de kit** (herpes zoster sem antiviral prova que a regra "1º de cada classe" está falhando ou a ordem das classes está errada) e rever kits: asma, SG, DIP, violência sexual, pré-natal, dermatite.
4. Decidir política de hierarquia: o padrão "14 AINEs / 11 anti-histamínicos clonados" é aceitável como biblioteca, mas o app precisa marcar 1ª linha por condição — senão a promessa de "prescrição rápida" não se cumpre.
5. Completar mg em todas as posologias e corrigir os textos truncados antes de qualquer piloto.
