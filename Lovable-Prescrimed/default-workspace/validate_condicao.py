#!/usr/bin/env python3
"""Validador de condição clínica do PrescriMed.

Três gates independentes:
  1. Estrutura  — JSON Schema (tipos, enums, campos obrigatórios).
  2. Publicação — se status=publicado: sem placeholders, ≥2 revisores, ≥2 fontes,
                  próxima revisão definida, nenhuma lacuna bloqueante.
  3. Editorial  — avisos de completude (não bloqueiam rascunho).

Uso:
    python validate_condicao.py prescrimed_condicao.exemplo.json
    python validate_condicao.py arquivo.json --schema prescrimed_condicao.schema.json
    python validate_condicao.py arquivo.json --strict   # avisos viram erro

Saída: 0 = válido; 1 = reprovado (estrutura, publicação ou avisos com --strict).
"""

import argparse
import json
import sys
from pathlib import Path

try:
    import jsonschema
except ImportError:
    sys.exit("jsonschema ausente: pip install jsonschema")

PLACEHOLDER = "\u00ab"  # «


def carregar(caminho: Path) -> dict:
    with caminho.open(encoding="utf-8") as fh:
        return json.load(fh)


def varrer_placeholders(no, caminho="#"):
    achados = []
    if isinstance(no, dict):
        for chave, valor in no.items():
            achados += varrer_placeholders(valor, f"{caminho}/{chave}")
    elif isinstance(no, list):
        for i, valor in enumerate(no):
            achados += varrer_placeholders(valor, f"{caminho}[{i}]")
    elif isinstance(no, str) and PLACEHOLDER in no:
        achados.append(caminho)
    return achados


def avisos_editoriais(c: dict, incluir_claims: bool = True):
    avisos = []
    termos = c["termos_busca"]["termos"]
    if len(termos) < 5:
        avisos.append(f"termos de busca: {len(termos)} (mínimo editorial: 5)")
    if not any(t.get("testado") for t in termos):
        avisos.append("nenhum termo de busca foi testado no conjunto dourado")
    if len(c["sinais_alarme"]) < 3:
        avisos.append(f"sinais de alarme: {len(c['sinais_alarme'])} (mínimo editorial: 3)")
    sem_acao = [s["id"] for s in c["sinais_alarme"] if len(s.get("acao", "")) < 3]
    if sem_acao:
        avisos.append(f"sinais sem ação executável: {', '.join(sem_acao)}")
    if not c["fontes"]:
        avisos.append("nenhuma fonte registrada")
    if len(c["auditoria"].get("revisores", [])) < 1:
        avisos.append("nenhum revisor clínico nomeado")
    itens = (
        c["prescricoes"]["ambulatorial"]["itens"]
        + c["prescricoes"]["intrahospitalar"]["itens"]
    )
    sem_claim = [i["id"] for i in itens if not i.get("claim_id")]
    if incluir_claims and itens and sem_claim:
        avisos.append(f"itens de prescrição sem claim/fonte: {', '.join(sem_claim)}")
    if any(len(i.get("precaucoes", [])) == 0 for i in itens):
        avisos.append("há item de prescrição sem precauções declaradas")
    exames = (
        c["exames"]["urgencia"]
        + c["exames"]["complementares"]
        + c["exames"]["nao_rotineiros"]
    )
    sem_mudanca = [e["id"] for e in exames if not e.get("o_que_muda")]
    if sem_mudanca:
        avisos.append(f"exames sem 'o que muda na conduta': {', '.join(sem_mudanca)}")
    if not any(o["categoria"] == "sinais_de_alarme" for o in c["orientacoes"]):
        avisos.append("orientações sem bloco de sinais de alarme ao paciente")
    bloq = [l["id"] for l in c["lacunas"] if l.get("bloqueia_publicacao")]
    if bloq:
        avisos.append(f"lacunas bloqueantes abertas: {', '.join(bloq)}")
    return avisos


def main() -> int:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    ap = argparse.ArgumentParser(description="Valida uma condição clínica do PrescriMed.")
    ap.add_argument("arquivo", type=Path)
    ap.add_argument("--schema", type=Path, default=Path(__file__).with_name("prescrimed_condicao.schema.json"))
    ap.add_argument("--strict", action="store_true", help="avisos editoriais viram erro")
    args = ap.parse_args()

    if not args.arquivo.exists():
        print(f"ERRO: arquivo não encontrado: {args.arquivo}")
        return 1

    doc = carregar(args.arquivo)
    schema = carregar(args.schema)
    validador = jsonschema.Draft202012Validator(schema, format_checker=jsonschema.FormatChecker())
    condicao = doc["condicao"]
    status = condicao.get("status", "?")
    falhou = False

    erros = sorted(validador.iter_errors(doc), key=lambda e: list(e.path))
    if erros:
        falhou = True
        print(f"[1/3] ESTRUTURA: {len(erros)} erro(s)")
        for e in erros:
            local = "/".join(str(p) for p in e.path) or "(raiz)"
            print(f"  - {local}: {e.message}")
    else:
        print("[1/3] ESTRUTURA: OK")

    if status == "publicado" and not erros:
        problemas = []
        placeholders = varrer_placeholders(condicao)
        if placeholders:
            problemas.append(f"{len(placeholders)} campo(s) com placeholder «…»")
            for p in placeholders[:15]:
                problemas.append(f"    {p}")
        if len(condicao["fontes"]) < 2:
            problemas.append("menos de 2 fontes registradas")
        if len(condicao["auditoria"].get("revisores", [])) < 2:
            problemas.append("menos de 2 revisores clínicos")
        if not condicao["auditoria"].get("proxima_revisao"):
            problemas.append("próxima revisão não definida")
        bloqueantes = [l["id"] for l in condicao["lacunas"] if l.get("bloqueia_publicacao")]
        if bloqueantes:
            problemas.append(f"lacunas bloqueantes abertas: {', '.join(bloqueantes)}")
        itens = (
            condicao["prescricoes"]["ambulatorial"]["itens"]
            + condicao["prescricoes"]["intrahospitalar"]["itens"]
        )
        sem_claim_item = [i["id"] for i in itens if not i.get("claim_id")]
        if sem_claim_item:
            problemas.append(f"itens de prescrição sem claim/fonte: {', '.join(sem_claim_item)}")
        sem_claim_alarme = [s["id"] for s in condicao["sinais_alarme"] if not s.get("claim_id")]
        if sem_claim_alarme:
            problemas.append(f"sinais de alarme sem claim/fonte: {', '.join(sem_claim_alarme)}")
        exames = (
            condicao["exames"]["urgencia"]
            + condicao["exames"]["complementares"]
            + condicao["exames"]["nao_rotineiros"]
        )
        sem_claim_exame = [e["id"] for e in exames if not e.get("claim_id")]
        if sem_claim_exame:
            problemas.append(f"exames sem claim/fonte: {', '.join(sem_claim_exame)}")
        if problemas:
            falhou = True
            print(f"[2/3] PUBLICAÇÃO: BLOQUEADA ({len(problemas)} motivo(s))")
            for p in problemas:
                print(f"  - {p}")
        else:
            print("[2/3] PUBLICAÇÃO: OK")
    elif status == "publicado":
        print("[2/3] PUBLICAÇÃO: não avaliada — corrija a estrutura primeiro")
    else:
        print(f"[2/3] PUBLICAÇÃO: não aplicável (status={status})")

    avisos = avisos_editoriais(condicao, incluir_claims=(status != "publicado"))
    if avisos:
        print(f"[3/3] EDITORIAL: {len(avisos)} aviso(s)")
        for a in avisos:
            print(f"  - {a}")
        if args.strict:
            falhou = True
    else:
        print("[3/3] EDITORIAL: OK")

    if falhou:
        print("RESULTADO: REPROVADO")
        return 1
    if status != "publicado":
        print("RESULTADO: VÁLIDO PARA RASCUNHO — publicação bloqueada até cumprir o gate")
    else:
        print("RESULTADO: APROVADO PARA PUBLICAÇÃO")
    return 0


if __name__ == "__main__":
    sys.exit(main())
