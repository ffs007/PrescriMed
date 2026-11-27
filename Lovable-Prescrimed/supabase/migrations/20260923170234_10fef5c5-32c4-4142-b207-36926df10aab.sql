
CREATE TABLE public.med_medicamento AS SELECT id, principio_ativo, principio_ativo_dcb, nome_comercial_referencia, classe_terapeutica, subclasse_terapeutica, categoria_clinica, codigo_atc, tipo_receita, medicamento_controlado AS controlado, antimicrobiano, alto_risco, ativo, status_revisao, updated_at FROM public.base_medicamentos_geral;
CREATE TABLE public.med_busca AS SELECT id AS medicamento_id, nome_normalizado, principio_ativo_normalizado, principio_ativo_en, nomes_comerciais, nomes_comerciais_br, sinonimos, termos_busca, abreviacoes, nomes_populares, equivalencias, busca_normalizada, prioridade_busca FROM public.base_medicamentos_geral;
CREATE TABLE public.med_uso AS SELECT id AS medicamento_id, uso_principal, uso_em_urgencia, uso_emergencia, uso_ambulatorial_rapido, cid_relacionados, queixas_relacionadas, protocolos_relacionados, modelos_rapidos_relacionados, mecanismo_acao, subclasse, observacoes FROM public.base_medicamentos_geral;
CREATE TABLE public.med_apresentacao AS SELECT id AS medicamento_id, forma_farmaceutica, apresentacao, concentracao, unidade_dose FROM public.base_medicamentos_geral;
CREATE TABLE public.med_via AS SELECT id AS medicamento_id, via_administracao, medicamento_injetavel AS injetavel, medicamento_oral AS oral, medicamento_topico AS topico, medicamento_inalatorio AS inalatorio, vinculo_iv_medication_id FROM public.base_medicamentos_geral;
CREATE TABLE public.med_dose AS SELECT id AS medicamento_id, dose_adulto_padrao, dose_pediatrica_padrao, dose_maxima_adulto, dose_maxima_pediatrica, unidade_dose, frequencia_padrao, duracao_padrao, observacao_posologia, exige_peso FROM public.base_medicamentos_geral;
CREATE TABLE public.med_ajuste AS SELECT id AS medicamento_id, exige_ajuste_renal, exige_ajuste_hepatico FROM public.base_medicamentos_geral;
CREATE TABLE public.med_gestacao_lactacao AS SELECT id AS medicamento_id, alerta_gestacao, alerta_lactacao FROM public.base_medicamentos_geral;
CREATE TABLE public.med_seguranca AS SELECT id AS medicamento_id, alerta_alergia_classe, risco_interacao_relevante, risco_duplicidade, lasa_confundido_com FROM public.base_medicamentos_geral;
CREATE TABLE public.med_regulatorio AS SELECT id AS medicamento_id, exige_receita_especial, exige_retencao_receita, na_rename, codigo_dcb FROM public.base_medicamentos_geral;
CREATE TABLE public.med_governanca AS SELECT id AS medicamento_id, prioridade_mvp, fonte_referencia, data_atualizacao, revisado_por, criado_por, atualizado_por, versao, versao_anterior_id, motivo_alteracao, lote_id, created_at FROM public.base_medicamentos_geral;
CREATE TABLE public.med_iv AS SELECT i.id AS iv_id, g.id AS medicamento_id, to_jsonb(i) AS dados, now() AS migrado_em FROM public.iv_medications i LEFT JOIN public.base_medicamentos_geral g ON g.vinculo_iv_medication_id::text = i.id::text;

ALTER TABLE public.med_medicamento ADD PRIMARY KEY (id);
ALTER TABLE public.med_iv ADD PRIMARY KEY (iv_id);
ALTER TABLE public.med_iv ADD CONSTRAINT med_iv_med_fk FOREIGN KEY (medicamento_id) REFERENCES public.med_medicamento(id) ON DELETE SET NULL;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['med_busca','med_uso','med_apresentacao','med_via','med_dose','med_ajuste','med_gestacao_lactacao','med_seguranca','med_regulatorio','med_governanca'] LOOP
    EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (medicamento_id) REFERENCES public.med_medicamento(id) ON DELETE CASCADE', t, t||'_fk');
    EXECUTE format('CREATE INDEX %I ON public.%I (medicamento_id)', 'idx_'||t||'_med', t);
  END LOOP;
  FOREACH t IN ARRAY ARRAY['med_medicamento','med_busca','med_uso','med_apresentacao','med_via','med_dose','med_ajuste','med_gestacao_lactacao','med_seguranca','med_regulatorio','med_governanca','med_iv'] LOOP
    EXECUTE format('GRANT SELECT ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('GRANT INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (true)', t||'_read', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (public.has_role(auth.uid(),''admin'') OR public.has_role(auth.uid(),''revisor'')) WITH CHECK (public.has_role(auth.uid(),''admin'') OR public.has_role(auth.uid(),''revisor''))', t||'_write', t);
  END LOOP;
END $$;
CREATE UNIQUE INDEX ux_med_dose_med ON public.med_dose(medicamento_id);
CREATE INDEX idx_med_medicamento_ativo ON public.med_medicamento(ativo, principio_ativo);

CREATE OR REPLACE VIEW public.vw_med_normalizado WITH (security_invoker=on) AS
SELECT m.*, a.forma_farmaceutica, a.apresentacao, a.concentracao, v.via_administracao,
       d.dose_adulto_padrao, d.dose_pediatrica_padrao, d.frequencia_padrao, d.duracao_padrao,
       j.exige_ajuste_renal, j.exige_ajuste_hepatico, gl.alerta_gestacao, gl.alerta_lactacao
FROM public.med_medicamento m
LEFT JOIN public.med_apresentacao a ON a.medicamento_id=m.id
LEFT JOIN public.med_via v ON v.medicamento_id=m.id
LEFT JOIN public.med_dose d ON d.medicamento_id=m.id
LEFT JOIN public.med_ajuste j ON j.medicamento_id=m.id
LEFT JOIN public.med_gestacao_lactacao gl ON gl.medicamento_id=m.id;
GRANT SELECT ON public.vw_med_normalizado TO authenticated;
