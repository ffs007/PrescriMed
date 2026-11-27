# Gestação por trimestre, anamnese pediátrica e checagem de enfermagem

Tudo entra como extensão aditiva (scripts depois de app.js). Os arquivos do protótipo não mudam. O conteúdo novo é gerado por IA e mostra o aviso "confira a dose".

## 1. Risco na gestação por trimestre
- A idade gestacional que já existe em "Dados do paciente" define o trimestre: 1º (até 13 semanas e 6 dias), 2º (14 a 27 semanas e 6 dias) ou 3º (a partir de 28 semanas). O selo mostra a categoria e o trimestre, por exemplo "D · 3º tri".
- A tabela de gestação passa a ter categorias por trimestre quando o risco muda. Exemplos:
  - AINEs: C até 20 semanas, D depois.
  - IECA e BRA: C no 1º trimestre, D no 2º e no 3º.
  - Dipirona: C no 1º, B no 2º, D no 3º.
  - Sulfametoxazol: D no 1º e no termo, C no 2º.
  - Nitrofurantoína: D a partir de 38 semanas.
  - Ondansetrona: C no 1º, B depois.
  - Tetraciclinas: D a partir de 15 semanas.
  - Fluconazol, tiamazol e albendazol: maior risco no 1º trimestre.
- Sem idade gestacional, vale a pior categoria do medicamento, com o aviso "informe a IG".
- Os bloqueios de D e X, a justificativa e a auditoria seguem como hoje. Se a IG mudar e um remédio já prescrito subir de categoria, aparece um alerta pedindo revisão.

## 2. Anamnese e exame físico pediátricos (idade abaixo de 12 anos)
- Quando a idade for menor que 12 anos, a anamnese de cada condição ganha um bloco pediátrico com pré-natal e parto, vacinação, desenvolvimento, alimentação, creche e escola, quem relata a história, diurese/fraldas e aceitação de líquidos.
- O exame físico ganha estado geral e atividade, choro, fontanela (até 18 meses), sinais de desidratação, tiragem e batimento de asa de nariz, enchimento capilar, peso e percentil, e sinais vitais com a faixa normal da idade, destacando os valores fora dela.
- O texto padrão do exame troca termos de adulto pelos pediátricos (por exemplo, "ativo e reativo", "fontanela normotensa").
- Algumas condições ganham itens próprios: síndromes respiratórias (esforço respiratório, sibilância, estridor), gastroenterites (grau de desidratação), febre sem foco (sinais de toxemia) e otite e faringite (otoscopia, oroscopia).
- Se a idade ficar igual ou acima de 12 anos, o bloco some. O que o médico já editou à mão não é apagado.

## 3. PDF de checagem de enfermagem
- Novo botão "Checagem de enfermagem (PDF)" na Prescrição hospitalar, com a mesma exigência de "Revisei este documento".
- O PDF é uma folha de 24 horas com o paciente, o leito, a data, as alergias em destaque e os itens da prescrição.
- Os horários saem da frequência do item: 6/6 h → 06-12-18-24; 8/8 h → 06-14-22; 12/12 h → 08-20; 1×/dia → 08; "se necessário" e "ACM" sem horário fixo, com campo para anotar. Itens contínuos (soro, bomba) e cuidados aparecem como "contínuo" ou "por turno".
- A primeira dose usa a hora atual, e os horários seguintes seguem o padrão da unidade. O horário-base é configurável nos Ajustes (padrão 06h). Antes de gerar, o médico pode ajustar os horários de cada item.
- Cada horário tem quadro para rubrica e marcação de "não administrado". Há espaço para assinatura do médico e da enfermagem por turno (M, T, N).
- A folha recebe o estilo dos documentos (logo, cabeçalho) e sai em retrato, com mais páginas se precisar.

## Testes
- Gestante com 10, 24 e 36 semanas usando ibuprofeno, enalapril e dipirona: confirmar a categoria e o bloqueio em cada caso.
- Criança de 3 anos com bronquiolite e com gastroenterite: conferir o bloco pediátrico. Adulto: confirmar que o bloco não aparece.
- Prescrição hospitalar com dipirona 6/6 h, ceftriaxona 12/12 h, soro contínuo e um item "se necessário": conferir a grade de horários no PDF.

## Detalhes técnicos
- preg-data.js: campo opcional `tri: {t1, t2, t3}` e `semanas: [[de, até, cat]]` para limites como 20 e 38 semanas. lovable-safety.js resolve a categoria pela IG e recalcula ao mudar o campo "ig".
- Novo peds-anam.js, com blocos pediátricos por grupo de condição e os sinais vitais por faixa etária, que envolve anamText e efText via window.PSAPP.test e injeta os campos na tela quando a idade for menor que 12 anos.
- Novo lovable-nursing.js, com o parser de frequência (regex sobre "x/x h", "1x/dia", "SN", "ACM", "contínuo") e a grade gerada em jsPDF, usando a entrada de hospItems(). Horário-base salvo em psx.cfg.
- Registrar no AGENTS.md a regra dos scripts novos.
