/* Risco na gestação (categoria FDA clássica / ANVISA RDC 60/2010) e na lactação (origem expansao_ia — confira).
   cat: A/B/C/D/X (pior/geral); tri {t1,t2,t3} ou sem [[de, até, cat]] variam pela IG. lact: "ok" compatível | "c" cautela | "e" evitar. t: risco × benefício. ok/no: uso aceitável / desaconselhado. */
(function () {
  "use strict";
  window.PSX_PREG = [
    { k: ["paracetamol"], cat: "B", lact: "ok", t: "Analgésico de escolha na gestação, na menor dose eficaz." },
    { k: ["dipirona"], cat: "C", tri: { t1: "C", t2: "B", t3: "D" }, lact: "c", t: "Evitar no 1º e no 3º trimestre; preferir paracetamol." },
    { k: ["ibuprofeno", "diclofenaco", "cetoprofeno", "naproxeno", "nimesulida", "cetorolaco", "piroxicam", "meloxicam", "tenoxicam"], cat: "D", sem: [[0, 20, "C"], [20, 45, "D"]], lact: "c", t: "AINE após 20 semanas: oligoâmnio e fechamento do canal arterial.", ok: "Uso curto antes de 20 semanas, sem alternativa.", no: "Terceiro trimestre; dor leve com opção de paracetamol." },
    { k: ["aas", "acido acetilsalicilico"], cat: "D", lact: "c", t: "Analgésico em dose plena: evitar. AAS 100–150 mg para prevenir pré-eclâmpsia é indicação aceita.", ok: "Profilaxia de pré-eclâmpsia em dose baixa.", no: "Analgesia em dose plena." },
    { k: ["varfarina"], cat: "X", lact: "ok", t: "Embriopatia varfarínica; trocar por heparina.", ok: "Prótese valvar mecânica, decisão especializada.", no: "Tromboprofilaxia e TEV na gestação." },
    { k: ["enalapril", "captopril", "losartana", "valsartana", "ramipril", "lisinopril"], cat: "D", tri: { t1: "C", t2: "D", t3: "D" }, lact: "c", t: "IECA/BRA: fetotoxicidade renal no 2º e no 3º trimestre. Trocar por metildopa, nifedipino ou labetalol.", no: "Hipertensão crônica na gestação." },
    { k: ["metildopa", "nifedipino", "labetalol", "hidralazina"], cat: "C", lact: "ok", t: "Anti-hipertensivos de escolha na gestação." },
    { k: ["sinvastatina", "atorvastatina", "rosuvastatina"], cat: "X", lact: "e", t: "Suspender a estatina na gestação e na lactação." },
    { k: ["isotretinoina", "acitretina"], cat: "X", lact: "e", t: "Teratogênico grave.", no: "Qualquer uso na gestação." },
    { k: ["misoprostol"], cat: "X", lact: "c", t: "Uterotônico; só em indicação obstétrica.", ok: "Indução ou esvaziamento uterino com protocolo obstétrico." },
    { k: ["metotrexato"], cat: "X", lact: "e", t: "Teratogênico e abortivo." },
    { k: ["valproato", "acido valproico", "divalproato"], cat: "X", lact: "c", t: "Defeitos do tubo neural e risco ao neurodesenvolvimento.", ok: "Epilepsia refratária sem alternativa, decisão compartilhada." },
    { k: ["fenitoina", "carbamazepina", "fenobarbital"], cat: "D", lact: "c", t: "Teratogênico; manter só se necessário, com ácido fólico.", ok: "Epilepsia controlada com o fármaco." },
    { k: ["tetraciclina", "doxiciclina", "minociclina"], cat: "D", sem: [[0, 15, "C"], [15, 45, "D"]], lact: "c", t: "Coloração dentária e alteração óssea fetal após 15 semanas." },
    { k: ["ciprofloxacino", "levofloxacino", "norfloxacino", "moxifloxacino"], cat: "C", lact: "c", t: "Quinolona: preferir alternativas (betalactâmicos)." },
    { k: ["sulfametoxazol", "bactrim"], cat: "C", sem: [[0, 14, "D"], [14, 36, "C"], [36, 45, "D"]], lact: "c", t: "Evitar no 1º trimestre (antifolato) e no termo (kernicterus)." },
    { k: ["nitrofurantoina"], cat: "B", sem: [[0, 38, "B"], [38, 45, "D"]], lact: "ok", t: "Evitar no termo (≥ 38 semanas): risco de hemólise neonatal." },
    { k: ["amoxicilina", "cefalexina", "azitromicina", "penicilina", "benzatina", "ceftriaxona", "clavulanato"], cat: "B", lact: "ok", t: "Antimicrobianos seguros na gestação." },
    { k: ["metronidazol"], cat: "B", lact: "c", t: "Seguro; na lactação em dose única de 2 g, suspender amamentação por 12–24 h." },
    { k: ["fluconazol"], cat: "D", tri: { t1: "D", t2: "C", t3: "C" }, lact: "ok", t: "Doses altas e prolongadas: malformações. Na candidíase, preferir via vaginal." },
    { k: ["tramadol", "codeina", "morfina"], cat: "C", tri: { t1: "C", t2: "C", t3: "D" }, lact: "c", t: "Opioide: curto prazo; risco de abstinência neonatal. Codeína evitar na lactação." },
    { k: ["diazepam", "clonazepam", "alprazolam", "midazolam"], cat: "D", lact: "c", t: "Benzodiazepínico: hipotonia e abstinência neonatal; uso agudo pontual aceitável.", ok: "Crise convulsiva, eclâmpsia refratária ao magnésio." },
    { k: ["prednisona", "prednisolona", "dexametasona", "hidrocortisona", "metilprednisolona"], cat: "C", tri: { t1: "C", t2: "B", t3: "B" }, lact: "ok", t: "Corticoide: benefício materno costuma superar o risco." },
    { k: ["ondansetrona"], cat: "B", tri: { t1: "C", t2: "B", t3: "B" }, lact: "ok", t: "Evitar no 1º trimestre se houver alternativa (possível fenda oral)." },
    { k: ["metoclopramida", "dimenidrinato", "piridoxina"], cat: "B", lact: "ok", t: "Antieméticos aceitos na gestação." },
    { k: ["omeprazol", "pantoprazol", "ranitidina"], cat: "C", lact: "ok", t: "Uso aceitável quando indicado." },
    { k: ["loratadina", "dexclorfeniramina", "cetirizina"], cat: "B", lact: "ok", t: "Anti-histamínicos aceitos." },
    { k: ["prometazina"], cat: "C", lact: "c", t: "Aceitável; sedação neonatal perto do parto." },
    { k: ["salbutamol", "fenoterol", "budesonida", "ipratropio"], cat: "C", lact: "ok", t: "Tratar a asma: hipóxia materna é o maior risco." },
    { k: ["enoxaparina", "heparina"], cat: "B", lact: "ok", t: "Anticoagulantes de escolha na gestação." },
    { k: ["rivaroxabana", "apixabana", "dabigatrana"], cat: "C", lact: "e", t: "DOAC: sem dados de segurança; usar heparina." },
    { k: ["amiodarona"], cat: "D", lact: "e", t: "Hipotireoidismo fetal; só em arritmia grave refratária." },
    { k: ["sertralina", "fluoxetina", "escitalopram", "citalopram", "paroxetina"], cat: "C", lact: "c", t: "ISRS: manter se indicado; paroxetina é D (cardiopatia). Na lactação, preferir sertralina." },
    { k: ["litio", "carbonato de litio"], cat: "D", lact: "e", t: "Anomalia de Ebstein; nível sérico rigoroso." },
    { k: ["metformina", "insulina"], cat: "B", lact: "ok", t: "A insulina é a primeira escolha no diabetes gestacional." },
    { k: ["glibenclamida"], cat: "C", lact: "c", t: "Preferir insulina." },
    { k: ["sulfato ferroso", "acido folico"], cat: "A", lact: "ok", t: "Suplementação recomendada." },
    { k: ["sulfato de magnesio"], cat: "D", lact: "ok", t: "Uso prolongado acima de 5–7 dias: alterações ósseas fetais. Na eclâmpsia, é a escolha.", ok: "Pré-eclâmpsia grave e eclâmpsia." },
    { k: ["tiamazol", "metimazol"], cat: "D", tri: { t1: "D", t2: "C", t3: "C" }, lact: "ok", t: "Evitar no 1º trimestre (preferir propiltiouracil)." },
    { k: ["albendazol", "mebendazol", "ivermectina"], cat: "C", tri: { t1: "C", t2: "B", t3: "B" }, lact: "c", t: "Evitar no 1º trimestre." },
    { k: ["aciclovir", "valaciclovir"], cat: "B", lact: "ok", t: "Aceitável quando indicado." },
    { k: ["oseltamivir"], cat: "C", lact: "ok", t: "Recomendado na síndrome gripal da gestante (grupo de risco)." },
    { k: ["testosterona"], cat: "X", lact: "e", t: "Virilização fetal." },
    { k: ["finasterida", "dutasterida"], cat: "X", lact: "e", t: "Malformação genital masculina." },
    { k: ["leflunomida", "micofenolato", "talidomida", "ribavirina", "bosentana"], cat: "X", lact: "e", t: "Teratogênico." }
  ];
  window.PSX_PREG_LINKS = [
    ["FEBRASGO — Protocolos", "https://www.febrasgo.org.br/pt/protocolos-febrasgo"],
    ["ACOG — Clinical guidance", "https://www.acog.org/clinical"],
    ["LactMed (NIH)", "https://www.ncbi.nlm.nih.gov/books/NBK501922/"],
    ["e-lactancia", "https://www.e-lactancia.org/"],
    ["Ministério da Saúde — Gestação de alto risco", "https://bvsms.saude.gov.br/bvs/publicacoes/manual_gestacao_alto_risco.pdf"]
  ];
})();
