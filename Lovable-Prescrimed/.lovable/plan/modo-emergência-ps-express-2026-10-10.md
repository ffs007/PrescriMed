# Modo Emergência (PS Express)

Uma tela alternativa em tela cheia, dentro do PS Express, para plantões sob pressão. Liga e desliga por um botão no topo ou pelo atalho Ctrl+Shift+E.

## O que aparece (só 3 blocos)
1. **Busca de quadro clínico**: campo grande, sempre com o cursor nele. Os resultados aparecem a partir de 2 letras. A busca aceita erros de digitação, iniciais ("pnm" encontra pneumonia) e sintoma isolado (febre, tosse, diarreia, vômitos). A ordem segue o quanto você usa cada quadro. A seta para baixo mostra as buscas recentes. Tudo funciona pelo teclado: setas, Enter e Tab.
2. **Ficha mínima do paciente** (janela compacta):
   - Nome ou iniciais.
   - Data de nascimento (dd/mm/aaaa ou calendário). A idade é calculada sozinha.
   - Peso, com aviso quando parecer improvável para a idade.
   - Alergias em etiquetas vermelhas grandes.
   - Caixas para insuficiência renal, hepática e cardíaca.
   - Salva sozinha a cada 5 s, só neste aparelho.
3. **Prescrição expressa**: vem do protocolo institucional travado do quadro escolhido. As doses já são calculadas pelo peso pelo motor atual, com via, frequência, duração, cuidados em casa e sinais de retorno.
   - Uma alergia conhecida tira o remédio da lista e sugere outro do mesmo protocolo. Isso não é automático: você confirma.
   - Insuficiência renal usa os alertas de ajuste que já existem.
   - Se você mudar algo do protocolo, pede uma justificativa de 1 clique (motivos prontos ou texto livre).

## Fica escondido nesse modo
Estatísticas, dicas, anamnese detalhada, painel de escores (aparece só se mudar a conduta), histórico e avisos não urgentes.

## Atalhos (legenda fixa no rodapé e dica ao passar o mouse)
| Atalho | Ação |
|---|---|
| Alt+B | Ir para a busca |
| Alt+P | Abrir a ficha do paciente |
| Alt+R | Nova prescrição |
| Alt+M | Adicionar remédio |
| Alt+O | Adicionar orientação |
| Alt+F | Finalizar |
| Alt+I | Imprimir |
| Alt+W | WhatsApp |
| Alt+N | Próximo paciente |
| Esc | Cancelar |
| Ctrl+S | Salvar |

## Cronômetro do atendimento
Mostra MM:SS: verde até 5 min, amarelo de 5 a 10 min e laranja depois de 10 min. Tem botão de pausa.

## Finalizar e enviar
- Antes de imprimir ainda é preciso marcar "Revisei este documento". Essa trava continua (vale também no Alt+F e no Alt+I).
- **WhatsApp**: abre a conversa com o texto e um link seguro do documento. Você confirma o envio.
- **Próximo paciente**: limpa a tela. Não chama a próxima senha; isso fica para depois.

## Revisão posterior obrigatória
Toda receita feita neste modo vai para a lista "Pendentes de revisão" no painel. Mais tarde você completa anamnese, exame, escores e justificativas, e marca como revisada.

## Fora do escopo (por decisão)
Ligação com o sistema de senhas e envio automático por WhatsApp.

## Detalhes técnicos
- Novo `public/prototype/lovable-emergency.js`, carregado por último. Os arquivos do protótipo não mudam.
- O modo reaproveita a busca atual, `PSX_TPL.applyTemplate({track:false})` para os protocolos institucionais, `PSX_SAFE` para alergias e rim, e os geradores de PDF atuais.
- Rascunho e uso pessoal ficam em localStorage (`psx.emerg.*`). As receitas feitas no modo são registradas em `safety_events` (tipo `emergencia_pendente` / `emergencia_revisada`), assim a lista de pendências fica rastreável.
- O link do WhatsApp usa a função `public-document-link` que já existe.
- Atualizar o AGENTS.md e o roadmap.
- Testar no navegador: atalhos, busca por "pnm", criança de 12 kg com alergia, PDF travado sem revisão e pendência criada.
