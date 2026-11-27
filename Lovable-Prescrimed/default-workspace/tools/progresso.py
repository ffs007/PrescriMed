"""Relatório de adesão ao padrão de diversidade v0.2.0.

Uso: python tools/progresso.py
Lê sindromes/*.json (exceto _schema.json) e imprime:
- quantos registros já têm o bloco de diversidade completo
- média de fármacos, distribuição por área
- lista dos que ainda faltam, em ordem de catálogo
"""
from __future__ import annotations

import csv
import io
import json
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ROOT = Path(__file__).resolve().parent.parent
SIND = ROOT / "sindromes"

PISOS = {
    "medicamentos": 6,
    "criterios_escolha": 5,
    "nao_farmacologico": 5,
    "procedimentos": 3,
    "metas": 4,
    "fluxo": 5,
}

CAMPOS_FARMACO = ("apresentacoes", "preparo", "tempo_infusao", "monitorizacao", "observacoes")


def carregar():
    registros = {}
    for caminho in sorted(SIND.glob("*.json")):
        if caminho.name.startswith("_"):
            continue
        with caminho.open(encoding="utf-8") as fh:
            dados = json.load(fh)["sindrome"]
        registros[dados["id"]] = (caminho.name, dados)
    return registros


PLACEHOLDERS = ("a definir", "conforme protocolo", "não definido", "não definida", "todo", "xxx", "preencher")


def procurar_placeholders(no, caminho="") -> list[str]:
    achados = []
    if isinstance(no, dict):
        for chave, valor in no.items():
            achados += procurar_placeholders(valor, f"{caminho}.{chave}")
    elif isinstance(no, list):
        for indice, valor in enumerate(no):
            achados += procurar_placeholders(valor, f"{caminho}[{indice}]")
    elif isinstance(no, str):
        texto = no.strip().lower()
        if not texto or texto in PLACEHOLDERS:
            achados.append(caminho)
    return achados


def avaliar(s: dict) -> tuple[bool, list[str]]:
    faltas = []
    for campo, piso in PISOS.items():
        valor = s.get(campo) or []
        if len(valor) < piso:
            faltas.append(f"{campo}={len(valor)}<{piso}")
    for indice, med in enumerate(s.get("medicamentos") or [], start=1):
        for campo in CAMPOS_FARMACO:
            if not med.get(campo):
                faltas.append(f"med{indice}.{campo}")
                break
    return (not faltas), faltas


def main() -> int:
    registros = carregar()
    ordem = []
    catalogo = {}
    with (SIND / "catalogo.csv").open(encoding="utf-8") as fh:
        for linha in csv.DictReader(fh, delimiter=";"):
            ordem.append(linha["id"])
            catalogo[linha["id"]] = linha

    completos, parciais = [], []
    total_meds = 0
    for sid in ordem:
        if sid not in registros:
            linha = catalogo[sid]
            parciais.append((sid, linha["area"], linha["nome"], ["arquivo ausente"]))
            continue
        _, s = registros[sid]
        ok, faltas = avaliar(s)
        total_meds += len(s.get("medicamentos") or [])
        (completos if ok else parciais).append((sid, s["area"], s["nome"], faltas))

    print(f"registros: {len(registros)} | catálogo: {len(ordem)}")
    print(f"padrão completo: {len(completos)} | pendentes: {len(parciais)}")
    print(f"média de fármacos: {total_meds / max(len(registros), 1):.1f}")

    areas: dict[str, list[int]] = {}
    for sid, area, nome, _ in completos:
        areas.setdefault(area, [0, 0])[0] += 1
    for sid in ordem:
        area = registros[sid][1]["area"] if sid in registros else catalogo[sid]["area"]
        areas.setdefault(area, [0, 0])[1] += 1
    print("\npor área (completos/total):")
    for area, (feitos, tot) in sorted(areas.items(), key=lambda kv: -kv[1][1]):
        print(f"  {area:<26} {feitos:>3}/{tot:<3}")

    print("\npendentes (id | nome | primeira falta):")
    for sid, area, nome, faltas in parciais:
        primeira = faltas[0] if faltas else "-"
        print(f"  {sid:<8} {nome[:44]:<44} {primeira}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
