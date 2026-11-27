# Segurança renal, gestação/lactação, base hospitalar e suporte à decisão

Tudo entra como extensão aditiva do PS Express (scripts carregados depois de app.js). Os arquivos do protótipo continuam iguais. Nenhum bloqueio é absoluto: o médico sempre pode liberar com justificativa estruturada, e essa liberação fica registrada. Conteúdo gerado por IA mostra o aviso "confira a dose".

## 1. Função renal (ClCr de Cockcroft-Gault como padrão)
- Novo quadro "Função renal" nos dados do paciente: idade, sexo, peso, altura e creatinina, com ClCr calculado na hora e recalculado a cada mudança de creatinina ou peso.
- Peso usado: real, ideal ou ajustado (automático em obesidade, IMC ≥ 30, e em extremos de peso, sempre mostrando qual foi usado). Em idosos, a creatinina tem um piso opcional. Diálise intermitente ou contínua pode ser marcada.
- Opções avançadas: TFG por CKD-EPI 2021 e por MDRD, Schwartz em crianças, ureia e diurese. Cada fórmula mostra os próprios limites (gestante, UTI, sarcopenia).
- Faixas configuráveis nos Ajustes: normal, leve, moderada, grave e diálise, com limites próprios para pediatria, geriatria, oncologia e UTI.
- Tabela de ajuste renal por medicamento, com dose, intervalo, via e fonte, e marcação de nefrotóxico ou de dose limítrofe. Mostra uma sugestão revisável na linha da prescrição.
- Medicamento incompatível com a função renal: a emissão fica bloqueada até haver troca, remoção ou justificativa (sem alternativa, resgate, decisão compartilhada, outra).
- Se a creatinina ou o peso mudarem, aparece um alerta pedindo para rever os medicamentos já prescritos.

## 2. Gestação e lactação
- Campo obrigatório e destacado "Gestante / Lactante / Nenhum", com idade gestacional, na entrada do atendimento e antes de emitir qualquer receita.
- Classificação de risco por medicamento (A/B/C/D/X e risco na lactação), com cores e ícones. As classes D e X bloqueiam a emissão até haver justificativa estruturada e registro da concordância da paciente. As classes C e B só mostram um sinal, sem pop-ups, para evitar excesso de alertas.
- Mensagem curta de risco x benefício, exemplos de uso aceitável e de uso desaconselhado, e links para diretrizes (FEBRASGO, ACOG, LactMed, e-lactancia), com registro da versão consultada.
- Histórico do status da paciente em linha do tempo. Quando o status muda, o app pede para rever as terapias em curso.

## 3. Base hospitalar ampliada
- Dados no formato atual de hosp-data, com campos extras: forma, concentração, via, frequência, restrições (renal, hepática, gestação, lactação, idade) e interações principais.
- Novos itens de alto impacto: soluções, dietas, dispositivos (cateteres, sondas) e cuidados de enfermagem (curativos, prevenção de quedas e de lesão por pressão, monitorização, dor), com indicação, periodicidade e materiais.
- Busca com filtros: princípio ativo, via, faixa etária, restrição renal, risco na gestação e nível de alerta. Favoritos e presets.
- Cada item guarda versão, data e responsável. Edições ficam no histórico.

## 4. Escores, calculadoras e fluxos na emergência
- Preenchimento automático dos escores com os sinais vitais e exames já digitados: NEWS2, qSOFA, CURB-65, TIMI, GRACE e HEART.
- Calculadoras: trombolítico por peso, anticoagulante por função renal, reposição volêmica, ânion gap, osmolaridade, HAS-BLED e sedoanalgesia.
- Fluxogramas resumidos: SCA, AVC, sepse, choque, anafilaxia, crise hipertensiva, insuficiência respiratória, trauma e arritmias. O resultado sugere condutas e exames que o médico aceita ou não.
- Cada ferramenta tem explicação (objetivo, população, limitações e referência) e número de versão.

## 5. Auditoria
- Tabela nova no backend para os eventos de segurança: alerta exibido, bloqueio, liberação com justificativa, ajuste aceito ou recusado e mudança de status. Cada evento registra usuário, data e hora, medicamento, motivo, fonte e justificativa. Os eventos não podem ser editados depois de gravados.
- Relatório desses eventos para administradores.

## Ordem de entrega
1 e 5 (rim e auditoria) → 2 → 4 → 3. Cada etapa é testada no navegador antes da seguinte.

## Detalhes técnicos
- Novos scripts: lovable-renal.js, lovable-gest.js, lovable-decision.js e hosp-expansion.js. Tabelas de dados: renal-data.js e preg-data.js, origem expansao_ia.
- Configuração: chave psx.safety no localStorage, espelhada em profiles.psx_safety (coluna jsonb nova).
- Tabela safety_events: insert pelo próprio usuário, select pelo próprio usuário e pelo admin (has_role), sem update ou delete, com GRANTs. A gravação passa pela ponte postMessage até o PrototypePage.
- O bloqueio reaproveita o mecanismo de "Revisei este documento" do lovable-documents.js.
