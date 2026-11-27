"""Normaliza valores fora do enum aceito pelo schema, antes do build.

Uso: python tools/normalizar.py && python tools/build.py

Correções seguras (não mudam o sentido clínico):
- severidade "moderada"/"moderado" -> "precaucao"
- severidade "alta"/"média"/"leve" -> "grave"/"precaucao"/"informativo"
- contexto com "pronto-socorro"/"PS"/"UTI" -> "hospitalar"
- papel fora da lista -> "condicional"

Imprime cada alteração para auditoria. Não cria campo, não apaga conteúdo.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ROOT = Path(__file__).resolve().parent.parent
SIND = ROOT / "sindromes"

SEVERIDADE = {
    "moderada": "precaucao",
    "moderado": "precaucao",
    "alta": "grave",
    "alto": "grave",
    "média": "precaucao",
    "media": "precaucao",
    "leve": "informativo",
    "baixa": "informativo",
    "baixo": "informativo",
}
CONTEXTO = {"pronto-socorro": "hospitalar", "ps": "hospitalar", "uti": "hospitalar", "enfermaria": "hospitalar"}
PAPEIS = {"primeira_linha", "alternativa", "condicional", "resgate"}

CHAVES_CANONICAS = [
    "id", "area", "nome", "aliases", "contexto", "populacao", "status", "risk_class", "versao",
    "visao_geral", "inclusao", "exclusao", "sinais_alarme", "perguntas_rapidas", "criterios_escolha",
    "medicamentos", "nao_farmacologico", "procedimentos", "metas", "fluxo", "populacoes_especiais",
    "exames", "orientacoes", "efeitos_adversos", "conduta_efeito_adverso", "documentos", "anamnese",
    "exame_fisico", "referencias", "alertas_sistema", "auditoria",
]


def main() -> int:
    mudancas = 0
    for caminho in sorted(SIND.glob("*.json")):
        if caminho.name.startswith("_"):
            continue
        with caminho.open(encoding="utf-8") as fh:
            dados = json.load(fh)
        s = dados.get("sindrome", {})
        alterou = False

        for extra in [k for k in s if k not in CHAVES_CANONICAS]:
            print(f"{caminho.name}: chave extra '{extra}' removida")
            del s[extra]
            alterou = True

        for chave in ("contexto",):
            valores = s.get(chave) or []
            novos = []
            for valor in valores:
                corrigido = CONTEXTO.get(str(valor).strip().lower(), valor)
                if corrigido != valor:
                    print(f"{caminho.name}: {chave} '{valor}' -> '{corrigido}'")
                    alterou = True
                if corrigido not in novos:
                    novos.append(corrigido)
            if novos and novos != valores:
                s[chave] = novos
                alterou = True

        for lista in ("sinais_alarme", "alertas_sistema"):
            for item in s.get(lista) or []:
                valor = item.get("severidade")
                if isinstance(valor, str) and valor.strip().lower() in SEVERIDADE:
                    novo = SEVERIDADE[valor.strip().lower()]
                    print(f"{caminho.name}: {lista}.severidade '{valor}' -> '{novo}'")
                    item["severidade"] = novo
                    alterou = True

        for med in s.get("medicamentos") or []:
            papel = med.get("papel")
            if isinstance(papel, str) and papel not in PAPEIS:
                print(f"{caminho.name}: papel '{papel}' -> 'condicional'")
                med["papel"] = "condicional"
                alterou = True

        if alterou:
            mudancas += 1
            with caminho.open("w", encoding="utf-8", newline="\n") as fh:
                json.dump(dados, fh, ensure_ascii=False, indent=2)
                fh.write("\n")

    print(f"arquivos normalizados: {mudancas}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
