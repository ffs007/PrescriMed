"""Sincroniza a coluna `json` do catalogo.csv com o nome real dos arquivos.

Uso: python tools/sync_catalogo_json.py
Para cada id do catálogo, procura `sindromes/<ID>_*.json` e grava o nome encontrado.
Não inventa linha nova: só corrige a coluna `json` de linhas existentes.
"""
from __future__ import annotations

import csv
import io
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ROOT = Path(__file__).resolve().parent.parent
SIND = ROOT / "sindromes"


def main() -> int:
    caminho = SIND / "catalogo.csv"
    with caminho.open(encoding="utf-8") as fh:
        linhas = list(csv.DictReader(fh, delimiter=";"))
    campos = list(linhas[0].keys())

    correcoes = 0
    for linha in linhas:
        sid = linha["id"]
        arquivos = sorted(p.name for p in SIND.glob(f"{sid}_*.json"))
        if not arquivos:
            continue
        atual = linha.get("json", "")
        if atual != arquivos[0]:
            linha["json"] = arquivos[0]
            correcoes += 1

    with caminho.open("w", encoding="utf-8", newline="\n") as fh:
        escritor = csv.DictWriter(fh, fieldnames=campos, delimiter=";", lineterminator="\n")
        escritor.writeheader()
        escritor.writerows(linhas)

    print(f"linhas corrigidas: {correcoes}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
