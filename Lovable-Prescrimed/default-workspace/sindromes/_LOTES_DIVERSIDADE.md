# Fila de reescrita — padrão de diversidade v0.2.0

Fonte da ordem: `sindromes/catalogo.csv`. Cada rodada pega o próximo bloco pendente,
reescreve em paralelo, roda `python tools/build.py` e `python tools/progresso.py`.

| # | Bloco | Registros | IDs |
|---|---|---|---|
| 1 | Alergias | 6 | ALG-01 … ALG-06 |
| 2 | Cardiovascular | 11 | CAR-01 … CAR-11 |
| 3 | Dermatológico | 10 | DERM-01 … DERM-10 |
| 4 | Endócrino | 8 | END-01 … END-08 |
| 5 | Gastrointestinal | 17 | GI-01 … GI-17 (GI-09 já pronto) |
| 6 | Geriatria | 6 | GER-01 … GER-06 |
| 7 | Ginecologia/Obstetrícia | 7 | GO-01 … GO-07 |
| 8 | Infectologia | 7 | INF-01 … INF-07 |
| 9 | Musculoesquelético | 10 | MSK-01 … MSK-10 |
| 10 | Neurológico | 16 | NEU-01 … NEU-16 |
| 11 | Oftalmo/Otorrino | 6 | OFT-01 … OFT-06 |
| 12 | Pediatria | 9 | PED-01 … PED-09 |
| 13 | Psiquiatria | 8 | PSQ-01 … PSQ-08 |
| 14 | Respiratório/ORL | 17 | RESP-01 … RESP-17 |
| 15 | Pequenos traumas | 6 | TRA-01 … TRA-06 |
| 16 | Urinário | 11 | URO-01 … URO-11 |

Total: 155 registros. Meta: 5–6 registros por rodada (2–3 subagentes em paralelo,
cada um com 2 registros, mais escrita direta quando o bloco exige mais nuance).

## Critério de pronto

`python tools/progresso.py` reporta o registro como completo: ≥6 fármacos com
apresentação/preparo/tempo/monitorização, ≥5 critérios de escolha, ≥5 medidas não
farmacológicas, ≥3 procedimentos, ≥4 metas, ≥5 passos de fluxo.
