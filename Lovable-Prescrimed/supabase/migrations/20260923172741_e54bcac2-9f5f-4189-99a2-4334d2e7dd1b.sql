CREATE INDEX IF NOT EXISTS idx_atendimentos_ambiente ON public.atendimentos(ambiente);
CREATE INDEX IF NOT EXISTS idx_ccm_condicao_id ON public.clinical_condition_medication(condicao_id);
CREATE INDEX IF NOT EXISTS idx_ccm_linha ON public.clinical_condition_medication(linha_tratamento);
CREATE INDEX IF NOT EXISTS idx_ccm_populacao ON public.clinical_condition_medication(populacao);
CREATE INDEX IF NOT EXISTS idx_ccm_condicao_norm ON public.clinical_condition_medication(public.clin_normalize(condicao_nome));
CREATE INDEX IF NOT EXISTS idx_bmd_populacao ON public.base_medicamentos_dose(populacao);
CREATE INDEX IF NOT EXISTS idx_pat_amb_norm ON public.patologia_ambiente(public.clin_normalize(nome_patologia));
CREATE INDEX IF NOT EXISTS idx_sind_pat_norm ON public.sindrome_patologia(public.clin_normalize(nome_patologia));
CREATE INDEX IF NOT EXISTS idx_pat_med_amb ON public.patologia_medicamento(ambiente);
CREATE INDEX IF NOT EXISTS idx_sind_med_amb ON public.sindrome_medicamento(ambiente);
CREATE INDEX IF NOT EXISTS idx_pat_cont_amb ON public.patologia_conteudo(ambiente);
CREATE INDEX IF NOT EXISTS idx_pat_doc_amb ON public.patologia_documentos(ambiente);
CREATE INDEX IF NOT EXISTS idx_bpe_norm ON public.base_patologia_exames(public.clin_normalize(nome_patologia));
CREATE INDEX IF NOT EXISTS idx_anam_norm ON public.condicao_anamnese(public.clin_normalize(condicao_nome));
CREATE INDEX IF NOT EXISTS idx_anam_pop ON public.condicao_anamnese(populacao);
CREATE INDEX IF NOT EXISTS idx_exfis_norm ON public.condicao_exame_fisico(public.clin_normalize(condicao_nome));
CREATE INDEX IF NOT EXISTS idx_exfis_pop ON public.condicao_exame_fisico(populacao);
CREATE INDEX IF NOT EXISTS idx_enc_norm ON public.condicao_encaminhamento_modelo(public.clin_normalize(condicao_nome));
CREATE INDEX IF NOT EXISTS idx_transf_norm ON public.condicao_transferencia_modelo(public.clin_normalize(condicao_nome));
CREATE INDEX IF NOT EXISTS idx_leg_med_nome ON public.catalogo_medicamentos_legado(nome);
CREATE INDEX IF NOT EXISTS idx_leg_pat_nome ON public.catalogo_patologias_legado(nome);

-- Filtra no banco o conteúdo de um quadro (pilares), por nomes equivalentes.
CREATE OR REPLACE FUNCTION public.fn_pilar_condicao(p_tabela text, p_nomes text[])
RETURNS SETOF jsonb LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path=public AS $$
BEGIN
  IF p_tabela NOT IN ('condicao_anamnese','condicao_exame_fisico','condicao_encaminhamento_modelo','condicao_transferencia_modelo') THEN
    RAISE EXCEPTION 'tabela não permitida';
  END IF;
  RETURN QUERY EXECUTE format(
    'SELECT to_jsonb(t) FROM public.%I t WHERE t.ativo AND public.clin_normalize(t.condicao_nome) = ANY ($1) LIMIT 200', p_tabela)
  USING (SELECT array_agg(public.clin_normalize(n)) FROM unnest(p_nomes) n);
END $$;
GRANT EXECUTE ON FUNCTION public.fn_pilar_condicao(text, text[]) TO authenticated;

CREATE OR REPLACE FUNCTION public.fn_exames_condicao(p_nomes text[])
RETURNS SETOF public.base_patologia_exames LANGUAGE sql STABLE SECURITY INVOKER SET search_path=public AS $$
  SELECT * FROM public.base_patologia_exames e
  WHERE e.status IN ('ativo','aprovado')
    AND public.clin_normalize(e.nome_patologia) = ANY (SELECT public.clin_normalize(n) FROM unnest(p_nomes) n)
  LIMIT 200
$$;
GRANT EXECUTE ON FUNCTION public.fn_exames_condicao(text[]) TO authenticated;