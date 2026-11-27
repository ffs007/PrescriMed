"""Painel de diversidade: mostra, registro por registro, o que cada síndrome cobre.

Uso: python tools/painel.py
Gera sindromes/dist/PAINEL_DIVERSIDADE.md com uma linha por síndrome: número de
fármacos, classes distintas, cenários de escolha, procedimentos e os agentes.
Serve como prova visual de que a síndrome não é "dipirona + um antiemético".
"""
from __future__ import annotations

import csv
import json
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ROOT = Path(__file__).resolve().parent.parent
SIND = ROOT / "sindromes"
SAIDA = SIND / "dist" / "PAINEL_DIVERSIDADE.md"

PISOS = {
    "medicamentos": 6,
    "criterios_escolha": 5,
    "nao_farmacologico": 5,
    "procedimentos": 3,
    "metas": 4,
    "fluxo": 5,
}


def completo(s: dict) -> bool:
    if any(len(s.get(c) or []) < p for c, p in PISOS.items()):
        return False
    for med in s.get("medicamentos") or []:
        if not all(med.get(c) for c in ("apresentacoes", "preparo", "tempo_infusao", "monitorizacao")):
            return False
    return True


def esc(texto: str) -> str:
    return str(texto).replace("|", "/")


def main() -> int:
    ordem = [linha["id"] for linha in csv.DictReader((SIND / "catalogo.csv").open(encoding="utf-8"), delimiter=";")]
    registros = {}
    for caminho in SIND.glob("*.json"):
        if caminho.name.startswith("_"):
            continue
        with caminho.open(encoding="utf-8") as fh:
            dados = json.load(fh)["sindrome"]
        registros[dados["id"]] = dados

    prontos = [registros[i] for i in ordem if i in registros and completo(registros[i])]
    area_atual = None
    linhas = [
        "# Painel de diversidade terapêutica",
        "",
        f"Registros no padrão v0.2.0: **{len(prontos)}** de {len(ordem)}.",
        "",
        "Cada linha é uma síndrome reescrita: mostra quantas opções terapêuticas ela oferece,",
        "quantas classes diferentes, quantos cenários de decisão e quais procedimentos entram.",
        "",
    ]

    for s in prontos:
        if s["area"] != area_atual:
            area_atual = s["area"]
            linhas.append(f"## {area_atual}")
            linhas.append("")
            linhas.append("| Síndrome | Fármacos | Classes | Cenários | Procedimentos | Agentes |")
            linhas.append("|---|---|---|---|---|---|")
        meds = s.get("medicamentos") or []
        classes = len({m.get("classe") for m in meds})
        agentes = ", ".join(m["agente"] for m in meds)
        linhas.append(
            f"| {esc(s['nome'])} | {len(meds)} | {classes} | {len(s.get('criterios_escolha') or [])} "
            f"| {len(s.get('procedimentos') or [])} | {esc(agentes)} |"
        )
        if s is prontos[-1] or prontos[prontos.index(s) + 1]["area"] != area_atual:
            linhas.append("")

    SAIDA.write_text("\n".join(linhas) + "\n", encoding="utf-8")
    print(f"OK: {len(prontos)} registros no painel -> {SAIDA}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
