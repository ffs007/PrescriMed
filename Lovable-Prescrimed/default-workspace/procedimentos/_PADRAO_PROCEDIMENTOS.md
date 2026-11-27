# Padrão do manual de procedimentos do Box de Emergência

Objetivo: cada procedimento que se faz na sala vermelha vira um protocolo executável,
não uma linha de rodapé na síndrome. Quem está com o material na mão precisa achar
indicação, contraindicação, material, passo a passo, como confirmar que deu certo,
o que pode dar errado e o que fazer depois.

## Arquivo

`procedimentos/BOX-XX_<slug>.json`, um protocolo por arquivo, UTF-8 sem BOM.

## Estrutura obrigatória

```json
{
  "schema_version": "1.0.0",
  "procedimento": {
    "id": "BOX-01",
    "nome": "Acesso venoso central",
    "categoria": "acesso",
    "urgencia": "eletivo_urgente",
    "tempo_estimado_min": 15,
    "dificuldade": 3,
    "indicacoes": ["..."],
    "contraindicacoes": ["..."],
    "material": ["..."],
    "anestesia": "...",
    "posicionamento": "...",
    "tecnica": ["1. ...", "2. ..."],
    "confirmacao": ["..."],
    "complicacoes": [{"complicacao": "...", "conduta": "..."}],
    "cuidados_pos": ["..."],
    "registro_minimo": ["..."],
    "sindromes_relacionadas": ["CAR-11", "INF-01"],
    "fonte": "ATLS/ACEP/literatura",
    "versao": "0.1.0",
    "revisor_clinico": null
  }
}
```

## Regras de conteúdo

- `categoria`: `via_aerea`, `acesso`, `hemodinamica`, `toracica`, `neurologica`,
  `urinaria`, `digestiva`, `ferida`, `musculoesqueletica`, `diagnostica`.
- `urgencia`: `emergencia` (segundos a minutos), `urgente` (até 1 h), `eletivo_urgente` (até 24 h).
- `dificuldade`: 1 (básico), 2 (intermediário), 3 (avançado).
- `tecnica`: passo a passo numerado, na ordem real de execução, com números concretos
  (calibre, volume, profundidade, tempo, ângulo). Mínimo 8 passos.
- `confirmacao`: como saber que está no lugar certo (ultrassom, capnografia, retorno de
  líquido, Rx). Mínimo 2 itens.
- `complicacoes`: mínimo 4, cada uma com conduta imediata.
- `cuidados_pos`: mínimo 3.
- `registro_minimo`: o que precisa constar no prontuário (mínimo 4 itens).
- `sindromes_relacionadas`: ids que existem em `sindromes/`.
- Nada de "a definir", "conforme protocolo", "avaliar individualmente" como desculpa.
- `revisor_clinico`: sempre `null` até revisão médica formal.

## Build

`python tools/build_procedimentos.py` valida e gera `procedimentos/dist/PROCEDIMENTOS_BOX.md`.
