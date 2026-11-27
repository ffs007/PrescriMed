"""Compila e valida o manual de procedimentos do Box de Emergência.

Uso: python tools/build_procedimentos.py
Lê procedimentos/BOX-*.json, valida contra procedimentos/_schema.json e gera
procedimentos/dist/PROCEDIMENTOS_BOX.md agrupado por categoria.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ROOT = Path(__file__).resolve().parent.parent
PROC = ROOT / "procedimentos"
DIST = PROC / "dist"

CATEGORIAS = {
    "via_aerea": "Via aérea",
    "acesso": "Acessos",
    "hemodinamica": "Hemodinâmica e arritmias",
    "toracica": "Tórax",
    "neurologica": "Neurológico",
    "urinaria": "Urinário",
    "digestiva": "Digestivo",
    "ferida": "Feridas e partes moles",
    "musculoesqueletica": "Musculoesquelético",
    "diagnostica": "Diagnóstico à beira-leito",
    "anestesia": "Anestesia e analgesia",
}

URGENCIA = {"emergencia": "Emergência", "urgente": "Urgente", "eletivo_urgente": "Eletivo urgente"}


def esc(texto: object) -> str:
    return str(texto).replace("|", "/").replace("\n", " ")


def validar(dados: dict, schema: dict) -> list[str]:
    try:
        import jsonschema
    except ImportError:  # pragma: no cover
        return []
    validador = jsonschema.Draft202012Validator(schema)
    return [f"{erro.json_path}: {erro.message}" for erro in validador.iter_errors(dados)]


def main() -> int:
    schema = json.loads((PROC / "_schema.json").read_text(encoding="utf-8"))
    arquivos = sorted(p for p in PROC.glob("BOX-*.json"))
    if not arquivos:
        print("nenhum procedimento encontrado")
        return 1

    procedimentos, erros = [], []
    for caminho in arquivos:
        with caminho.open(encoding="utf-8") as fh:
            dados = json.load(fh)
        for erro in validar(dados, schema):
            erros.append(f"{caminho.name}: {erro}")
        procedimentos.append(dados["procedimento"])

    ids = [p["id"] for p in procedimentos]
    duplicados = sorted({i for i in ids if ids.count(i) > 1})

    for erro in erros:
        print(f"ERRO {erro}")

    DIST.mkdir(parents=True, exist_ok=True)
    linhas = [
        "# Manual de procedimentos do Box de Emergência",
        "",
        f"Protocolos: **{len(procedimentos)}** · gerado por `tools/build_procedimentos.py`.",
        "",
        "Cada protocolo traz indicação, contraindicação, material, técnica numerada,",
        "confirmação do posicionamento, complicações com conduta e registro mínimo.",
        "",
        "| ID | Procedimento | Categoria | Urgência | Dificuldade | Tempo |",
        "|---|---|---|---|---|---|",
    ]
    for p in sorted(procedimentos, key=lambda x: x["id"]):
        linhas.append(
            f"| {p['id']} | [{esc(p['nome'])}](#{p['id'].lower().replace('-', '')}) | "
            f"{CATEGORIAS.get(p['categoria'], p['categoria'])} | {URGENCIA.get(p['urgencia'], p['urgencia'])} | "
            f"{'★' * p['dificuldade']} | {p['tempo_estimado_min']} min |"
        )
    linhas.append("")

    for categoria in CATEGORIAS:
        do_grupo = [p for p in procedimentos if p["categoria"] == categoria]
        if not do_grupo:
            continue
        linhas.append(f"## {CATEGORIAS[categoria]}")
        linhas.append("")
        for p in sorted(do_grupo, key=lambda x: x["id"]):
            linhas.append(f"### {p['id']} — {p['nome']}")
            linhas.append("")
            linhas.append(f"**Urgência:** {URGENCIA.get(p['urgencia'], p['urgencia'])} · "
                          f"**Dificuldade:** {'★' * p['dificuldade']} · "
                          f"**Tempo:** {p['tempo_estimado_min']} min")
            linhas.append("")
            linhas.append("**Indicações**")
            linhas.extend(f"- {esc(i)}" for i in p["indicacoes"])
            linhas.append("")
            linhas.append("**Contraindicações**")
            linhas.extend(f"- {esc(i)}" for i in p["contraindicacoes"])
            linhas.append("")
            linhas.append(f"**Material:** {esc('; '.join(p['material']))}")
            linhas.append("")
            linhas.append(f"**Anestesia:** {esc(p['anestesia'])}")
            linhas.append("")
            linhas.append(f"**Posicionamento:** {esc(p['posicionamento'])}")
            linhas.append("")
            linhas.append("**Técnica**")
            linhas.extend(f"{esc(passo)}" for passo in p["tecnica"])
            linhas.append("")
            linhas.append("**Como confirmar**")
            linhas.extend(f"- {esc(i)}" for i in p["confirmacao"])
            linhas.append("")
            linhas.append("**Complicações e conduta**")
            linhas.append("")
            linhas.append("| Complicação | Conduta imediata |")
            linhas.append("|---|---|")
            linhas.extend(f"| {esc(c['complicacao'])} | {esc(c['conduta'])} |" for c in p["complicacoes"])
            linhas.append("")
            linhas.append("**Cuidados pós-procedimento**")
            linhas.extend(f"- {esc(i)}" for i in p["cuidados_pos"])
            linhas.append("")
            linhas.append(f"**Registro mínimo:** {esc('; '.join(p['registro_minimo']))}")
            linhas.append("")
            linhas.append(f"**Síndromes relacionadas:** {', '.join(p['sindromes_relacionadas'])}")
            linhas.append("")
            linhas.append(f"*Fonte: {esc(p['fonte'])} · versão {p['versao']} · revisor clínico: "
                          f"{p['revisor_clinico'] or 'não definido'}*")
            linhas.append("")
            linhas.append("---")
            linhas.append("")

    (DIST / "PROCEDIMENTOS_BOX.md").write_text("\n".join(linhas), encoding="utf-8")

    print(f"OK: {len(procedimentos)} procedimentos")
    print(f"Doc: {DIST / 'PROCEDIMENTOS_BOX.md'}")
    if duplicados:
        print(f"ERRO ids duplicados: {duplicados}")
        return 1
    if erros:
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
