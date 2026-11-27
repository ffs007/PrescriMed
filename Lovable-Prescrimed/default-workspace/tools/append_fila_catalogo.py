"""Acrescenta ao catalogo.csv as linhas de fila_cobertura.csv que ainda não existem lá.

Uso: python tools/append_fila_catalogo.py
Mantém o formato id;area;nome;contexto;populacao;onda;status;json e não duplica ids.
"""
from __future__ import annotations

import csv
import io
import sys
import unicodedata
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ROOT = Path(__file__).resolve().parent.parent
SIND = ROOT / "sindromes"


def slug(nome: str) -> str:
    texto = unicodedata.normalize("NFKD", nome).encode("ascii", "ignore").decode().lower()
    for antigo, novo in (("/", "_"), ("(", ""), (")", ""), (" ", "_"), ("-", "_"), (",", "")):
        texto = texto.replace(antigo, novo)
    while "__" in texto:
        texto = texto.replace("__", "_")
    return texto.strip("_")


def main() -> int:
    fila = list(csv.DictReader((SIND / "fila_cobertura.csv").open(encoding="utf-8"), delimiter=";"))
    caminho = SIND / "catalogo.csv"
    linhas = [linha.rstrip("\n") for linha in caminho.open(encoding="utf-8")]
    ids = {linha.split(";")[0] for linha in linhas[1:] if linha.strip()}

    novas = []
    for r in fila:
        if r["id"] in ids:
            continue
        populacao = "pediatrico" if r["area"] == "Pediatria" else ("idoso" if r["area"] == "Geriatria" else "adulto")
        contexto = "ambulatorial,hospitalar" if r["area"] in (
            "Cardiovascular", "Gastrointestinal", "Infectologia", "Pediatria", "Respiratório/ORL",
        ) else "hospitalar"
        novas.append(f'{r["id"]};{r["area"]};{r["nome"]};{contexto};{populacao};2;pendente;{r["id"]}_{slug(r["nome"])}.json')

    with caminho.open("w", encoding="utf-8", newline="\n") as fh:
        fh.write("\n".join(linhas + novas) + "\n")
    print(f"linhas acrescentadas: {len(novas)} | total: {len(linhas) + len(novas) - 1}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
