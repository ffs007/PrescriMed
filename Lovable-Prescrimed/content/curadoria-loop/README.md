# Loop de curadoria clínica

Este loop organiza a criação do banco de rascunhos para pesquisa em várias IAs. Ele não conecta ao Supabase, não importa seeds, não promove conteúdo e não altera o motor clínico. Isso é intencional: os conteúdos clínicos só podem avançar após fontes verificáveis e revisão humana.

O catálogo candidato contém apenas termos de trabalho extraídos do material de produto. A primeira rodada de pesquisa descobre e consolida o catálogo canônico; só depois o loop pode expandir módulos por condição.

## Uso

```powershell
npm run curadoria:loop -- init --run piloto-20261105
npm run curadoria:loop -- next --run piloto-20261105 --count 4
# Envie cada arquivo de outbox para uma IA independente e salve a resposta como .md/.txt/.json.
npm run curadoria:loop -- ingest --run piloto-20261105 --task CAT-respiratorio-a --file C:\caminho\resposta.md
npm run curadoria:loop -- review --run piloto-20261105 --task CAT-respiratorio-a --decision accept --reviewer "identificador real do revisor"
npm run curadoria:loop -- status --run piloto-20261105
```

Após ter um catálogo canônico revisado, forneça um JSON com `conditions`, contendo `condition_ref`, `name` e `category`, e expanda a fila:

```powershell
npm run curadoria:loop -- expand --run piloto-20261105 --catalog C:\caminho\catalogo-revisado.json
```

`next` pode ser chamado repetidamente (por exemplo, por agendador local) e gera apenas tarefas cuja dependência foi aceita. Ele nunca chama fornecedores de IA nem envia dados externos. Isso evita misturar modelos, vazar dados e publicar conteúdo sem revisão.

Os estados são `pending`, `leased`, `submitted`, `accepted`, `rejected` e `blocked`. Uma resposta recebida fica `submitted`; só `accepted` libera suas dependências. `rejected` e `blocked` preservam o histórico e impedem promoção silenciosa.

Antes de conectar qualquer etapa ao banco real, confirme o schema/migrations vigentes e resolva a divergência arquitetural registrada em `PARECER-2026-11-04.md`: o schema `curadoria` ainda não alimenta o motor clínico ativo do protótipo.
