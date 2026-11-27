"""Mapa de cobertura: cada linha do catálogo mestre -> registro do catálogo local.

Uso: python tools/mapa_cobertura.py
Gera sindromes/MAPA_COBERTURA.csv (master_id;master_sindrome;registro;como) e lista
as linhas do mestre que ficaram sem registro, para revisão manual.
O casamento é por similaridade de nome, com overrides explícitos para os casos em que
o nome local mudou de propósito.
"""
from __future__ import annotations

import csv
import difflib
import sys
import unicodedata
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ROOT = Path(__file__).resolve().parent.parent
SIND = ROOT / "sindromes"

# Linhas do mestre que são a mesma entidade de um registro já existente, com nome diferente.
OVERRIDES = {
    "S-017": "GI-01",   # gastroenterite aguda = diarreia aguda
    "S-019": "GI-03",   # náuseas e vômitos
    "S-020": "GI-07",   # constipação / impactação
    "S-022": "GI-06",   # DRGE
    "S-030": "GI-09",   # HDA
    "S-031": "GI-10",   # HDB
    "S-032": "GI-08",   # hemorroida / fissura
    "S-036": "URO-02",  # pielonefrite
    "S-042": "URO-10",  # orquiepididimite
    "S-043": "URO-06",  # balanopostite
    "S-044": "URO-06",  # uretrite
    "S-046": "CAR-01",  # dor torácica indiferenciada
    "S-050": "CAR-06",  # edema agudo de pulmão
    "S-051": "CAR-02",  # crise hipertensiva
    "S-055": "NEU-04",  # síncope
    "S-062": "NEU-08",  # déficit focal agudo
    "S-070": "NEU-03",  # vertigem
    "S-071": "NEU-15",  # meningite
    "S-074": "NEU-09",  # delirium / confusão
    "S-079": "NEU-11",  # lombalgia com radiculopatia
    "S-080": "MSK-02",  # cervicalgia
    "S-085": "MSK-07",  # tendinopatia
    "S-086": "MSK-07",  # bursite
    "S-087": "MSK-06",  # gota
    "S-094": "DERM-10", # foliculite
    "S-095": "DERM-10", # impetigo
    "S-101": "DERM-05", # escabiose
    "S-102": "DERM-13", # pediculose
    "S-111": "DERM-09", # picada de inseto
    "S-116": "PSQ-05",  # depressão maior
    "S-124": "END-03",  # hiperglicemia sem cetoacidose
    "S-125": "END-04",  # hipotireoidismo / coma mixedematoso
    "S-126": "END-04",  # tireotoxicose
    "S-130": "END-10",  # hiponatremia
    "S-133": "PED-05",  # crupe
    "S-135": "PED-07",  # faringite estreptocócica
    "S-136": "PED-03",  # gastroenterite e desidratação
    "S-143": "PED-04",  # asma pediátrica
    "S-145": "GI-16",   # verminose
    "S-149": "URO-08",  # DIP
    "S-150": "URO-07",  # vaginose
    "S-151": "URO-07",  # candidíase
    "S-152": "URO-07",  # tricomoníase
    "S-155": "GO-02",   # abortamento
    "S-159": "GO-03",   # eclâmpsia
    "S-162": "GO-05",   # mastite
    "S-166": "GO-07",   # violência sexual
    "S-167": "GER-01",  # queda
    "S-168": "GER-02",  # delirium
    "S-170": "GER-03",  # polifarmácia
    "S-179": "RESP-02", # síndrome viral
    "S-180": "INF-02",  # dengue
    "S-185": "INF-01",  # sepse
    "S-189": "URO-06",  # gonorreia e clamídia
    "S-194": "OFT-01",  # olho vermelho
    "S-209": "TRA-01",  # laceração
    "S-210": "MSK-05",  # contusão
    "S-211": "MSK-04",  # entorse
    "S-212": "TRA-05",  # fratura fechada
    "S-216": "DERM-08", # queimadura
    "S-218": "TRA-04",  # TCE leve
    "S-003": "RESP-02", # síndrome gripal
    "S-005": "PED-05",  # laringite / crupe
    "S-009": "RESP-14", # pneumonia adquirida na comunidade
    "S-001": "RESP-15", # dispneia aguda indiferenciada
    "S-018": "GI-18",   # disenteria
    "S-023": "GI-19",   # doença ulcerosa
    "S-025": "GI-20",   # colecistite
    "S-027": "GI-14",   # apendicite
    "S-029": "GI-21",   # DII em surto
    "S-037": "URO-12",  # ITU complicada
    "S-048": "CAR-12",  # angina estável
    "S-052": "CAR-13",  # FA com resposta rápida
    "S-053": "CAR-14",  # TSV
    "S-054": "CAR-15",  # bradicardia sintomática
    "S-057": "CAR-16",  # miocardite
    "S-058": "CAR-07",  # TVP
    "S-059": "CAR-17",  # endocardite
    "S-065": "NEU-08",  # AVC isquêmico
    "S-066": "NEU-12",  # AVC hemorrágico
    "S-075": "NEU-17",  # neuropatia periférica aguda
    "S-081": "MSK-11",  # dor miofascial
    "S-084": "MSK-12",  # lesão meniscal
    "S-088": "MSK-13",  # artrite séptica
    "S-091": "MSK-14",  # costocondrite
    "S-097": "DERM-11", # herpes simples
    "S-100": "DERM-12", # micose superficial
    "S-107": "ALG-07",  # angioedema
    "S-120": "PSQ-09",  # bipolar em crise
    "S-123": "END-09",  # estado hiperosmolar
    "S-139": "PED-10",  # varicela
    "S-140": "PED-11",  # mão-pé-boca
    "S-141": "PED-12",  # escarlatina
    "S-142": "PED-13",  # ITU pediátrica
    "S-144": "PED-14",  # pneumonia pediátrica
    "S-146": "PED-15",  # constipação pediátrica
    "S-147": "PED-16",  # cólica do lactente
    "S-156": "GO-08",   # gravidez ectópica
    "S-157": "GO-09",   # hiperêmese gravídica
    "S-161": "GO-10",   # ITU na gestação
    "S-163": "GO-11",   # abscesso mamário
    "S-164": "GO-12",   # dismenorreia
    "S-165": "GO-13",   # amenorreia
    "S-169": "GER-07",  # síncope no idoso
    "S-172": "GER-08",  # desnutrição
    "S-176": "GER-10",  # demência com agitação
    "S-177": "GER-09",  # fratura de fragilidade
    "S-181": "INF-08",  # chikungunya
    "S-182": "INF-09",  # zika
    "S-187": "INF-10",  # mononucleose
    "S-188": "INF-11",  # sífilis
    "S-191": "INF-12",  # tétano
    "S-192": "INF-13",  # infecção de ferida
    "S-195": "OFT-07",  # ceratite
    "S-196": "OFT-08",  # glaucoma agudo
    "S-197": "OFT-09",  # uveíte
    "S-198": "OFT-10",  # hordéolo / calázio
    "S-199": "OFT-11",  # blefarite
    "S-201": "OFT-12",  # perda visual súbita
    "S-213": "TRA-07",  # luxação
    "S-214": "TRA-08",  # corpo estranho cutâneo
    "S-217": "TRA-09",  # picada peçonhenta
    "S-219": "TRA-10",  # trauma dentário
    "S-220": "TRA-11",  # trauma de mão e dedo
    "S-222": "TRA-12",  # hematoma subungueal
    "S-004": "RESP-03", # faringoamigdalite aguda
    "S-006": "RESP-11", # bronquite aguda = tosse aguda
    "S-007": "RESP-12", # crise de asma
    "S-011": "CAR-08",  # tromboembolismo pulmonar
    "S-015": "PED-02",  # bronquiolite viral
    "S-021": "GI-05",   # dispepsia / epigastralgia
    "S-024": "GI-12",   # cólica biliar
    "S-026": "GI-13",   # pancreatite aguda
    "S-028": "GI-15",   # diverticulite aguda
    "S-033": "GI-22",   # abscesso perianal
    "S-040": "URO-04",  # hematúria
    "S-041": "URO-13",  # prostatite aguda
    "S-056": "CAR-18",  # pericardite aguda
    "S-063": "NEU-01",  # cefaleia primária
    "S-064": "NEU-02",  # cefaleia de alarme
    "S-076": "PSQ-08",  # intoxicação exógena
    "S-077": "NEU-11",  # lombalgia com déficit neurológico
    "S-078": "MSK-01",  # lombalgia aguda mecânica
    "S-083": "MSK-12",  # entorse de joelho
    "S-099": "ALG-03",  # dermatite atópica em surto
    "S-103": "PED-08",  # exantema viral
    "S-104": "ALG-02",  # reação cutânea grave a medicamento
    "S-108": "RESP-06", # rinite alérgica
    "S-109": "ALG-02",  # alergia a medicamento
    "S-118": "PSQ-10",  # intoxicação alcoólica aguda
    "S-128": "END-05",  # distúrbio hidroeletrolítico
    "S-134": "PED-06",  # otite média na infância
    "S-138": "PED-08",  # exantema súbito
    "S-153": "GO-01",   # sangramento uterino anormal
    "S-154": "GO-02",   # ameaça de abortamento
    "S-158": "GO-03",   # pré-eclâmpsia
    "S-160": "GO-04",   # trabalho de parto prematuro
    "S-171": "GI-11",   # desidratação no idoso
    "S-175": "URO-05",  # retenção urinária
    "S-178": "INF-14",  # febre sem foco no adulto
    "S-186": "INF-01",  # choque séptico
    "S-200": "OFT-02",  # corpo estranho ocular
    "S-202": "RESP-04", # otite externa
    "S-204": "RESP-05", # rinossinusite aguda
    "S-208": "TRA-01",  # ferimento cortante
    "S-221": "MSK-04",  # trauma de tornozelo
}


def norm(texto: str) -> str:
    base = unicodedata.normalize("NFKD", texto).encode("ascii", "ignore").decode().lower()
    for antigo in ("/", "-", "(", ")", ",", "."):
        base = base.replace(antigo, " ")
    return " ".join(base.split())


def main() -> int:
    mestre = list(csv.DictReader((ROOT / "sindromes_pronto_atendimento.csv").open(encoding="utf-8-sig"), delimiter=";"))
    registros = list(csv.DictReader((SIND / "catalogo.csv").open(encoding="utf-8"), delimiter=";"))
    nomes = [(r["id"], norm(r["nome"])) for r in registros]
    existentes = {r["id"] for r in registros}

    linhas, sem_registro = [], []
    for m in mestre:
        mid, nome = m["id"], m["sindrome"]
        if mid in OVERRIDES and OVERRIDES[mid] in existentes:
            linhas.append((mid, nome, OVERRIDES[mid], "override"))
            continue
        alvo = norm(nome)
        melhor = max(((difflib.SequenceMatcher(None, alvo, n).ratio(), rid) for rid, n in nomes), default=(0, ""))
        if melhor[0] >= 0.86:
            linhas.append((mid, nome, melhor[1], "nome"))
        else:
            sem_registro.append((mid, nome, round(melhor[0], 2), melhor[1]))

    with (SIND / "MAPA_COBERTURA.csv").open("w", encoding="utf-8", newline="\n") as fh:
        escritor = csv.writer(fh, delimiter=";", lineterminator="\n")
        escritor.writerow(["master_id", "master_sindrome", "registro", "como"])
        escritor.writerows(linhas)

    print(f"mestre: {len(mestre)} | mapeados: {len(linhas)} | sem registro: {len(sem_registro)}")
    for item in sem_registro:
        print(f"  {item[0]} {item[1]} (melhor {item[2]} -> {item[3]})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
