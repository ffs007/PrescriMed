#!/usr/bin/env python3
"""Build do catálogo PrescriMed: valida JSONs, gera documentos e seed SQL."""

import json
import sys
from pathlib import Path

from jsonschema import Draft202012Validator

BASE = Path(__file__).resolve().parent.parent / "sindromes"
DIST = BASE / "dist"
SCHEMA = json.loads((BASE / "_schema.json").read_text(encoding="utf-8"))
VALIDATOR = Draft202012Validator(SCHEMA)


def esc(value) -> str:
    if value is None:
        return ""
    return str(value).replace("|", "/").replace("\n", " ").strip()


def table(headers, rows):
    if not rows:
        return ""
    out = ["| " + " | ".join(headers) + " |", "|" + "|".join(["---"] * len(headers)) + "|"]
    for row in rows:
        out.append("| " + " | ".join(esc(c) for c in row) + " |")
    return "\n".join(out)


def bullets(items):
    return "\n".join(f"- {esc(i)}" for i in items) if items else ""


def render(s: dict) -> str:
    meds = s.get("medicamentos", [])
    alertas = s.get("alertas_sistema", [])
    sinais = s.get("sinais_alarme", [])
    exames = s.get("exames", {})
    orient = s.get("orientacoes", {})
    docs = s.get("documentos", {})
    refs = s.get("referencias", [])
    pop = s.get("populacoes_especiais", [])
    efeitos = s.get("efeitos_adversos", [])

    md = [f"# {s['id']} — {s['nome']}", ""]
    md.append(table(["Campo", "Valor"], [
        ["Área", s.get("area")],
        ["Contexto", ", ".join(s.get("contexto", []))],
        ["População", ", ".join(s.get("populacao", []))],
        ["Status", s.get("status")],
        ["Risco", s.get("risk_class")],
        ["Versão", s.get("versao")],
    ]))
    md += ["", "## 1. Visão geral", "", s.get("visao_geral", ""), ""]

    md += ["## 2. Critérios de inclusão", ""]
    md.append(bullets(s.get("inclusao", [])))
    excl = s.get("exclusao", [])
    if excl:
        md += ["", "**Exclui e encaminha**", ""]
        md.append(table(["Situação", "Fluxo"], [[e.get("situacao"), e.get("fluxo")] for e in excl]))
    md.append("")

    md += ["## 3. Sinais de alarme", ""]
    md.append(table(["Sinal", "Por que importa", "Ação", "Severidade"],
                    [[a.get("sinal"), a.get("por_que"), a.get("acao"), a.get("severidade")] for a in sinais]))
    md.append("")

    md += ["## 4. Perguntas rápidas", ""]
    md.append(bullets(s.get("perguntas_rapidas", [])))
    md.append("")

    md += ["## 5. Escolha terapêutica por cenário", ""]
    crit = s.get("criterios_escolha", [])
    if crit:
        md.append(table(["Cenário", "Escolha", "Por quê"],
                        [[c.get("cenario"), c.get("escolha"), c.get("porque")] for c in crit]))
    else:
        md.append("_Não definida para este registro._")
    md.append("")

    md += ["## 5.1 Medicamentos geralmente considerados", "",
           "**[REVISÃO MÉDICA OBRIGATÓRIA]** Doses usuais; confirmar apresentação e disponibilidade local.", ""]
    md.append(table(["Agente", "Dose", "Via", "Frequência", "Duração", "Indicação"],
                    [[m.get("agente"), m.get("dose"), m.get("via"), m.get("frequencia"),
                      m.get("duracao"), m.get("indicacao")] for m in meds]))
    md.append("")
    for m in meds:
        extras = []
        if m.get("apresentacoes"):
            extras.append("- **Apresentações:** " + "; ".join(m["apresentacoes"]))
        if m.get("preparo"):
            extras.append("- **Preparo:** " + m["preparo"])
        if m.get("tempo_infusao"):
            extras.append("- **Tempo de infusão:** " + m["tempo_infusao"])
        if m.get("monitorizacao"):
            extras.append("- **Monitorização:** " + "; ".join(m["monitorizacao"]))
        if m.get("ajuste_renal"):
            extras.append("- **Ajuste renal:** " + m["ajuste_renal"])
        if m.get("ajuste_hepatico"):
            extras.append("- **Ajuste hepático:** " + m["ajuste_hepatico"])
        if m.get("observacoes"):
            extras.append("- **Observações:** " + m["observacoes"])
        if extras:
            md += [f"**{m.get('agente')}**", ""] + extras + [""]

    md += ["## 5.2 Medidas não farmacológicas", ""]
    nf = s.get("nao_farmacologico", [])
    if nf:
        md.append(table(["Medida", "Detalhe"],
                        [[n.get("medida"), n.get("detalhe")] for n in nf]))
    else:
        md.append("_Não definidas._")
    md.append("")

    md += ["## 5.3 Procedimentos", ""]
    proc = s.get("procedimentos", [])
    if proc:
        md.append(table(["Procedimento", "Indicação", "Técnica", "Complicações"],
                        [[p.get("nome"), p.get("indicacao"), p.get("tecnica"), p.get("complicacoes")] for p in proc]))
    else:
        md.append("_Não aplicável._")
    md.append("")

    md += ["## 5.4 Metas", ""]
    md.append(bullets(s.get("metas", [])) or "_Não definidas._")
    md.append("")

    md += ["## 6. Populações especiais", ""]
    md.append(table(["População", "Ajuste", "Alerta"],
                    [[p.get("populacao"), p.get("ajuste"), p.get("alerta")] for p in pop]))
    md.append("")

    md += ["## 7. Exames comuns", ""]
    md.append(table(["Exame", "Indicação", "O que muda"],
                    [[e.get("nome"), e.get("indicacao"), e.get("o_que_muda")] for e in exames.get("comuns", [])]))
    md.append("")

    md += ["## 8. Quando não pedir exames", ""]
    md.append(table(["Exame", "Motivo"],
                    [[e.get("exame"), e.get("motivo")] for e in exames.get("evitar", [])]))
    md.append("")

    md += ["## 9. Orientações ao paciente", "", "**Fazer**", "", bullets(orient.get("fazer", [])), "",
           "**Evitar**", "", bullets(orient.get("evitar", [])), ""]

    md += ["## 10. Efeitos adversos", ""]
    md.append(table(["Agente", "Efeitos", "Observação"],
                    [[e.get("agente"), ", ".join(e.get("efeitos", [])), e.get("observacao")] for e in efeitos]))
    md.append("")

    md += ["## 11. Se houver efeito adverso", "", bullets(s.get("conduta_efeito_adverso", [])), ""]
    md += ["## 12. Quando retornar", "", bullets(orient.get("retorno", [])), ""]

    md += ["## 13. Receita ambulatorial", ""]
    amb = docs.get("receita_ambulatorial", {}).get("itens", [])
    md.append(table(["Item", "Dose", "Via", "Frequência", "Duração", "Condição"],
                    [[i.get("item"), i.get("dose"), i.get("via"), i.get("frequencia"),
                      i.get("duracao"), i.get("condicao")] for i in amb]))
    md.append("")

    md += ["## 14. Prescrição hospitalar", ""]
    hosp = docs.get("receita_hospitalar", {}).get("itens", [])
    md.append(table(["Item", "Dose", "Via", "Frequência", "Monitorização"],
                    [[i.get("item"), i.get("dose"), i.get("via"), i.get("frequencia"),
                      i.get("monitorizacao")] for i in hosp]))
    md.append("")

    md += ["## 15. Pedido de exames", ""]
    campos = docs.get("pedido_exames", {}).get("campos", [])
    md.append("\n".join(f"- [ ] {esc(c)}" for c in campos))
    md.append("")

    md += ["## 16. Atestado", "", "> " + esc(docs.get("atestado", {}).get("texto_template", "")), ""]
    md += ["## 17. Encaminhamento", ""]
    md.append(bullets(docs.get("encaminhamento", {}).get("campos", [])))
    md.append("")
    md += ["## 18. Relatório", "", "> " + esc(docs.get("relatorio", {}).get("texto_template", "")), ""]

    md += ["## 19. Anamnese", "", "```", s.get("anamnese", {}).get("texto_template", ""), "```", ""]
    md += ["## 20. Exame físico", "", "```", s.get("exame_fisico", {}).get("texto_template", ""), "```", ""]

    md += ["## 21. Referências a verificar", ""]
    md.append(table(["Tipo", "O que verificar"],
                    [[r.get("tipo"), r.get("o_que_verificar")] for r in refs]))
    md.append("")

    md += ["## 22. Alertas de segurança", ""]
    md.append(table(["ID", "Gatilho", "Severidade", "Mensagem", "Ação", "Bloqueante"],
                    [[a.get("id"), a.get("gatilho"), a.get("severidade"), a.get("mensagem"),
                      a.get("acao"), "sim" if a.get("bloqueante") else "não"] for a in alertas]))
    md.append("")
    md += ["## 23. JSON", "", f"Registro completo em `{s['id']}.json`.", ""]
    return "\n".join(md)


def sql_str(value) -> str:
    if value is None:
        return "null"
    return "'" + str(value).replace("'", "''") + "'"


def sql_array(values) -> str:
    if not values:
        return "'{}'"
    return "array[" + ", ".join(sql_str(v) for v in values) + "]"


def build():
    DIST.mkdir(exist_ok=True)
    files = sorted(p for p in BASE.glob("*.json") if not p.name.startswith("_"))
    if not files:
        sys.exit("nenhum JSON encontrado")

    ok, errors = [], []
    for path in files:
        data = json.loads(path.read_text(encoding="utf-8"))
        problems = sorted(VALIDATOR.iter_errors(data), key=lambda e: list(e.path))
        if problems:
            errors.append((path.name, problems))
            continue
        s = data["sindrome"]
        (DIST / f"{s['id']}.md").write_text(render(s), encoding="utf-8", newline="\n")
        ok.append((s, path))

    if errors:
        for name, problems in errors:
            print(f"ERRO {name}")
            for p in problems[:5]:
                print("  ", "/".join(map(str, p.path)), p.message)
        sys.exit(1)

    # seed.sql
    sql = [
        "-- PrescriMed — seed gerado por tools/build.py",
        "-- Requer PostgreSQL 13+.",
        "",
        "create table if not exists pm_syndrome (",
        "  id text primary key,",
        "  area text not null,",
        "  nome text not null,",
        "  contexto text[] not null default '{}',",
        "  populacao text[] not null default '{}',",
        "  status text not null,",
        "  risk_class text,",
        "  versao text,",
        "  payload jsonb not null,",
        "  updated_at timestamptz not null default now()",
        ");",
        "",
        "create table if not exists pm_medication (",
        "  syndrome_id text not null references pm_syndrome(id) on delete cascade,",
        "  idx int not null,",
        "  agente text, dose text, via text, frequencia text, duracao text, indicacao text,",
        "  contraindicacoes jsonb, fonte text, confirmar_apresentacao_local boolean,",
        "  primary key (syndrome_id, idx)",
        ");",
        "",
        "create table if not exists pm_alert (",
        "  syndrome_id text not null references pm_syndrome(id) on delete cascade,",
        "  alert_id text not null,",
        "  tipo text, gatilho text, severidade text, mensagem text, acao text, bloqueante boolean,",
        "  primary key (syndrome_id, alert_id)",
        ");",
        "",
    ]

    for s, _ in ok:
        payload = json.dumps({"schema_version": "1.0.0", "sindrome": s}, ensure_ascii=False)
        sql.append(
            "insert into pm_syndrome (id, area, nome, contexto, populacao, status, risk_class, versao, payload) values ("
            f"{sql_str(s['id'])}, {sql_str(s.get('area'))}, {sql_str(s.get('nome'))}, "
            f"{sql_array(s.get('contexto', []))}, {sql_array(s.get('populacao', []))}, "
            f"{sql_str(s.get('status'))}, {sql_str(s.get('risk_class'))}, {sql_str(s.get('versao'))}, "
            f"$json${payload}$json$::jsonb) "
            "on conflict (id) do update set area=excluded.area, nome=excluded.nome, "
            "contexto=excluded.contexto, populacao=excluded.populacao, status=excluded.status, "
            "risk_class=excluded.risk_class, versao=excluded.versao, payload=excluded.payload, "
            "updated_at=now();"
        )
        sql.append("")

    sql += [
        "truncate pm_medication, pm_alert;",
        "",
        "insert into pm_medication (syndrome_id, idx, agente, dose, via, frequencia, duracao, indicacao, contraindicacoes, fonte, confirmar_apresentacao_local)",
        "select s.id, (t.ord - 1)::int, m->>'agente', m->>'dose', m->>'via', m->>'frequencia', m->>'duracao',",
        "       m->>'indicacao', coalesce(m->'contraindicacoes', '[]'::jsonb), m->>'fonte',",
        "       coalesce((m->>'confirmar_apresentacao_local')::boolean, false)",
        "from pm_syndrome s",
        "cross join lateral jsonb_array_elements(s.payload->'sindrome'->'medicamentos') with ordinality as t(m, ord);",
        "",
        "insert into pm_alert (syndrome_id, alert_id, tipo, gatilho, severidade, mensagem, acao, bloqueante)",
        "select s.id, a->>'id', a->>'tipo', a->>'gatilho', a->>'severidade', a->>'mensagem', a->>'acao',",
        "       coalesce((a->>'bloqueante')::boolean, false)",
        "from pm_syndrome s",
        "cross join lateral jsonb_array_elements(s.payload->'sindrome'->'alertas_sistema') as a;",
        "",
        "create or replace view pm_syndrome_resumo as",
        "select id, area, nome, status, risk_class,",
        "       jsonb_array_length(payload->'sindrome'->'medicamentos') as n_medicamentos,",
        "       jsonb_array_length(payload->'sindrome'->'alertas_sistema') as n_alertas",
        "from pm_syndrome;",
        "",
    ]
    (DIST / "seed.sql").write_text("\n".join(sql), encoding="utf-8", newline="\n")

    # índice
    rows = [[s["id"], s["nome"], s.get("status"), str(len(s.get("medicamentos", []))),
             str(len(s.get("alertas_sistema", [])))] for s, _ in ok]
    idx = ["# Índice de síndromes", "",
           f"Total: **{len(ok)}** síndromes.", "",
           table(["ID", "Nome", "Status", "Medicamentos", "Alertas"], rows), ""]
    (DIST / "INDICE.md").write_text("\n".join(idx), encoding="utf-8", newline="\n")

    print(f"OK: {len(ok)} síndromes")
    print(f"Docs: {DIST}")
    print(f"Seed: {DIST / 'seed.sql'}")


if __name__ == "__main__":
    build()
