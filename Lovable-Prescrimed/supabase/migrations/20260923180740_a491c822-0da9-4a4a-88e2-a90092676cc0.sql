CREATE OR REPLACE FUNCTION public.fn_med_gravar_normalizado(NEW public.base_medicamentos_geral)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $f$
BEGIN
  INSERT INTO public.med_medicamento (id,principio_ativo,principio_ativo_dcb,nome_comercial_referencia,classe_terapeutica,subclasse_terapeutica,categoria_clinica,codigo_atc,tipo_receita,antimicrobiano,alto_risco,ativo,status_revisao) VALUES (NEW.id,NEW.principio_ativo,NEW.principio_ativo_dcb,NEW.nome_comercial_referencia,NEW.classe_terapeutica,NEW.subclasse_terapeutica,NEW.categoria_clinica,NEW.codigo_atc,NEW.tipo_receita,NEW.antimicrobiano,NEW.alto_risco,NEW.ativo,NEW.status_revisao) ON CONFLICT (id) DO UPDATE SET principio_ativo=EXCLUDED.principio_ativo,principio_ativo_dcb=EXCLUDED.principio_ativo_dcb,nome_comercial_referencia=EXCLUDED.nome_comercial_referencia,classe_terapeutica=EXCLUDED.classe_terapeutica,subclasse_terapeutica=EXCLUDED.subclasse_terapeutica,categoria_clinica=EXCLUDED.categoria_clinica,codigo_atc=EXCLUDED.codigo_atc,tipo_receita=EXCLUDED.tipo_receita,antimicrobiano=EXCLUDED.antimicrobiano,alto_risco=EXCLUDED.alto_risco,ativo=EXCLUDED.ativo,status_revisao=EXCLUDED.status_revisao,updated_at=now();
  INSERT INTO public.med_ajuste (medicamento_id,exige_ajuste_renal,exige_ajuste_hepatico) VALUES (NEW.id,NEW.exige_ajuste_renal,NEW.exige_ajuste_hepatico) ON CONFLICT (medicamento_id) DO UPDATE SET exige_ajuste_renal=EXCLUDED.exige_ajuste_renal,exige_ajuste_hepatico=EXCLUDED.exige_ajuste_hepatico;
  INSERT INTO public.med_apresentacao (medicamento_id,forma_farmaceutica,apresentacao,concentracao,unidade_dose) VALUES (NEW.id,NEW.forma_farmaceutica,NEW.apresentacao,NEW.concentracao,NEW.unidade_dose) ON CONFLICT (medicamento_id) DO UPDATE SET forma_farmaceutica=EXCLUDED.forma_farmaceutica,apresentacao=EXCLUDED.apresentacao,concentracao=EXCLUDED.concentracao,unidade_dose=EXCLUDED.unidade_dose;
  INSERT INTO public.med_busca (medicamento_id,nome_normalizado,principio_ativo_normalizado,principio_ativo_en,nomes_comerciais,nomes_comerciais_br,sinonimos,termos_busca,abreviacoes,nomes_populares,equivalencias,busca_normalizada,prioridade_busca) VALUES (NEW.id,NEW.nome_normalizado,NEW.principio_ativo_normalizado,NEW.principio_ativo_en,NEW.nomes_comerciais,NEW.nomes_comerciais_br,NEW.sinonimos,NEW.termos_busca,NEW.abreviacoes,NEW.nomes_populares,NEW.equivalencias,NEW.busca_normalizada,NEW.prioridade_busca) ON CONFLICT (medicamento_id) DO UPDATE SET nome_normalizado=EXCLUDED.nome_normalizado,principio_ativo_normalizado=EXCLUDED.principio_ativo_normalizado,principio_ativo_en=EXCLUDED.principio_ativo_en,nomes_comerciais=EXCLUDED.nomes_comerciais,nomes_comerciais_br=EXCLUDED.nomes_comerciais_br,sinonimos=EXCLUDED.sinonimos,termos_busca=EXCLUDED.termos_busca,abreviacoes=EXCLUDED.abreviacoes,nomes_populares=EXCLUDED.nomes_populares,equivalencias=EXCLUDED.equivalencias,busca_normalizada=EXCLUDED.busca_normalizada,prioridade_busca=EXCLUDED.prioridade_busca;
  INSERT INTO public.med_dose (medicamento_id,dose_adulto_padrao,dose_pediatrica_padrao,dose_maxima_adulto,dose_maxima_pediatrica,unidade_dose,frequencia_padrao,duracao_padrao,observacao_posologia,exige_peso) VALUES (NEW.id,NEW.dose_adulto_padrao,NEW.dose_pediatrica_padrao,NEW.dose_maxima_adulto,NEW.dose_maxima_pediatrica,NEW.unidade_dose,NEW.frequencia_padrao,NEW.duracao_padrao,NEW.observacao_posologia,NEW.exige_peso) ON CONFLICT (medicamento_id) DO UPDATE SET dose_adulto_padrao=EXCLUDED.dose_adulto_padrao,dose_pediatrica_padrao=EXCLUDED.dose_pediatrica_padrao,dose_maxima_adulto=EXCLUDED.dose_maxima_adulto,dose_maxima_pediatrica=EXCLUDED.dose_maxima_pediatrica,unidade_dose=EXCLUDED.unidade_dose,frequencia_padrao=EXCLUDED.frequencia_padrao,duracao_padrao=EXCLUDED.duracao_padrao,observacao_posologia=EXCLUDED.observacao_posologia,exige_peso=EXCLUDED.exige_peso;
  INSERT INTO public.med_gestacao_lactacao (medicamento_id,alerta_gestacao,alerta_lactacao) VALUES (NEW.id,NEW.alerta_gestacao,NEW.alerta_lactacao) ON CONFLICT (medicamento_id) DO UPDATE SET alerta_gestacao=EXCLUDED.alerta_gestacao,alerta_lactacao=EXCLUDED.alerta_lactacao;
  INSERT INTO public.med_governanca (medicamento_id,prioridade_mvp,fonte_referencia,data_atualizacao,revisado_por,criado_por,atualizado_por,versao,versao_anterior_id,motivo_alteracao,lote_id,created_at) VALUES (NEW.id,NEW.prioridade_mvp,NEW.fonte_referencia,NEW.data_atualizacao,NEW.revisado_por,NEW.criado_por,NEW.atualizado_por,NEW.versao,NEW.versao_anterior_id,NEW.motivo_alteracao,NEW.lote_id,NEW.created_at) ON CONFLICT (medicamento_id) DO UPDATE SET prioridade_mvp=EXCLUDED.prioridade_mvp,fonte_referencia=EXCLUDED.fonte_referencia,data_atualizacao=EXCLUDED.data_atualizacao,revisado_por=EXCLUDED.revisado_por,criado_por=EXCLUDED.criado_por,atualizado_por=EXCLUDED.atualizado_por,versao=EXCLUDED.versao,versao_anterior_id=EXCLUDED.versao_anterior_id,motivo_alteracao=EXCLUDED.motivo_alteracao,lote_id=EXCLUDED.lote_id,created_at=EXCLUDED.created_at;
  INSERT INTO public.med_regulatorio (medicamento_id,exige_receita_especial,exige_retencao_receita,na_rename,codigo_dcb) VALUES (NEW.id,NEW.exige_receita_especial,NEW.exige_retencao_receita,NEW.na_rename,NEW.codigo_dcb) ON CONFLICT (medicamento_id) DO UPDATE SET exige_receita_especial=EXCLUDED.exige_receita_especial,exige_retencao_receita=EXCLUDED.exige_retencao_receita,na_rename=EXCLUDED.na_rename,codigo_dcb=EXCLUDED.codigo_dcb;
  INSERT INTO public.med_seguranca (medicamento_id,alerta_alergia_classe,risco_interacao_relevante,risco_duplicidade,lasa_confundido_com) VALUES (NEW.id,NEW.alerta_alergia_classe,NEW.risco_interacao_relevante,NEW.risco_duplicidade,NEW.lasa_confundido_com) ON CONFLICT (medicamento_id) DO UPDATE SET alerta_alergia_classe=EXCLUDED.alerta_alergia_classe,risco_interacao_relevante=EXCLUDED.risco_interacao_relevante,risco_duplicidade=EXCLUDED.risco_duplicidade,lasa_confundido_com=EXCLUDED.lasa_confundido_com;
  INSERT INTO public.med_uso (medicamento_id,uso_principal,uso_em_urgencia,uso_emergencia,uso_ambulatorial_rapido,cid_relacionados,queixas_relacionadas,protocolos_relacionados,modelos_rapidos_relacionados,mecanismo_acao,subclasse,observacoes) VALUES (NEW.id,NEW.uso_principal,NEW.uso_em_urgencia,NEW.uso_emergencia,NEW.uso_ambulatorial_rapido,NEW.cid_relacionados,NEW.queixas_relacionadas,NEW.protocolos_relacionados,NEW.modelos_rapidos_relacionados,NEW.mecanismo_acao,NEW.subclasse,NEW.observacoes) ON CONFLICT (medicamento_id) DO UPDATE SET uso_principal=EXCLUDED.uso_principal,uso_em_urgencia=EXCLUDED.uso_em_urgencia,uso_emergencia=EXCLUDED.uso_emergencia,uso_ambulatorial_rapido=EXCLUDED.uso_ambulatorial_rapido,cid_relacionados=EXCLUDED.cid_relacionados,queixas_relacionadas=EXCLUDED.queixas_relacionadas,protocolos_relacionados=EXCLUDED.protocolos_relacionados,modelos_rapidos_relacionados=EXCLUDED.modelos_rapidos_relacionados,mecanismo_acao=EXCLUDED.mecanismo_acao,subclasse=EXCLUDED.subclasse,observacoes=EXCLUDED.observacoes;
  INSERT INTO public.med_via (medicamento_id,via_administracao,vinculo_iv_medication_id) VALUES (NEW.id,NEW.via_administracao,NEW.vinculo_iv_medication_id) ON CONFLICT (medicamento_id) DO UPDATE SET via_administracao=EXCLUDED.via_administracao,vinculo_iv_medication_id=EXCLUDED.vinculo_iv_medication_id;
END $f$;
REVOKE ALL ON FUNCTION public.fn_med_gravar_normalizado(public.base_medicamentos_geral) FROM PUBLIC, anon, authenticated;

-- Trigger antigo: pula quando a gravação já veio pela nova estrutura
CREATE OR REPLACE FUNCTION public.fn_sync_med_normalizado()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $f$
BEGIN
  IF coalesce(current_setting('app.med_direto', true), '') = 'on' THEN RETURN NEW; END IF;
  PERFORM public.fn_med_gravar_normalizado(NEW);
  RETURN NEW;
END $f$;

CREATE OR REPLACE FUNCTION public.fn_med_salvar(p jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $f$
DECLARE
  v_id uuid; v_base jsonb; r public.base_medicamentos_geral; v_cols text; v_set text;
BEGIN
  IF NOT (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'revisor')) THEN
    RAISE EXCEPTION 'Sem permissão para gravar medicamentos' USING ERRCODE='42501';
  END IF;
  IF coalesce(trim(p->>'principio_ativo'),'') = '' THEN
    RAISE EXCEPTION 'Princípio ativo é obrigatório';
  END IF;
  v_id := nullif(p->>'id','')::uuid;
  IF v_id IS NOT NULL THEN
    SELECT to_jsonb(b) INTO v_base FROM public.base_medicamentos_geral b WHERE b.id = v_id;
  END IF;
  IF v_base IS NULL THEN
    v_base := jsonb_build_object(
      'id', coalesce(v_id, gen_random_uuid()),
      'nomes_comerciais','{}'::text[],'sinonimos','{}'::text[],'categoria_clinica','dor_febre',
      'uso_em_urgencia',false,'uso_emergencia',false,'uso_ambulatorial_rapido',false,
      'medicamento_injetavel',false,'medicamento_oral',false,'medicamento_topico',false,'medicamento_inalatorio',false,
      'medicamento_controlado',false,'antimicrobiano',false,'tipo_receita','comum',
      'exige_receita_especial',false,'exige_retencao_receita',false,'exige_peso',false,
      'exige_ajuste_renal',false,'exige_ajuste_hepatico',false,'alerta_gestacao','sem_dados','alerta_lactacao','sem_dados',
      'risco_interacao_relevante',false,'risco_duplicidade',false,
      'cid_relacionados','{}'::text[],'queixas_relacionadas','{}'::text[],'protocolos_relacionados','{}'::text[],
      'modelos_rapidos_relacionados','{}'::text[],'termos_busca','{}'::text[],'abreviacoes','{}'::text[],
      'nomes_populares','{}'::text[],'equivalencias','[]'::jsonb,'prioridade_busca',0,'prioridade_mvp','media',
      'status_revisao','rascunho','data_atualizacao',current_date,'ativo',true,'created_at',now(),
      'versao',1,'lote_id','cadastro_app','na_rename',false,'alto_risco',false,
      'criado_por', auth.uid());
  END IF;
  r := jsonb_populate_record(NULL::public.base_medicamentos_geral, v_base || (p - 'id') || jsonb_build_object('atualizado_por', auth.uid()));
  r.nome_normalizado := public.iv_normalize_text(r.principio_ativo);
  r.principio_ativo_normalizado := r.nome_normalizado;
  r.busca_normalizada := public.clin_normalize(concat_ws(' ', r.principio_ativo, r.nome_comercial_referencia, r.apresentacao, r.concentracao, r.classe_terapeutica, r.subclasse_terapeutica, r.categoria_clinica));
  r.updated_at := now();

  -- 1) fonte da verdade: nova estrutura
  PERFORM public.fn_med_gravar_normalizado(r);

  -- 2) cópia de consulta na ficha antiga (sem reenviar para a nova estrutura)
  PERFORM set_config('app.med_direto','on', true);
  SELECT string_agg(quote_ident(column_name), ',' ORDER BY ordinal_position),
         string_agg(quote_ident(column_name)||'=EXCLUDED.'||quote_ident(column_name), ',' ORDER BY ordinal_position) FILTER (WHERE column_name <> 'id')
    INTO v_cols, v_set
    FROM information_schema.columns WHERE table_schema='public' AND table_name='base_medicamentos_geral';
  EXECUTE format('INSERT INTO public.base_medicamentos_geral (%s) SELECT %s FROM jsonb_populate_record(NULL::public.base_medicamentos_geral, $1) ON CONFLICT (id) DO UPDATE SET %s', v_cols, v_cols, v_set)
    USING to_jsonb(r);
  PERFORM set_config('app.med_direto','off', true);
  RETURN r.id;
END $f$;

CREATE OR REPLACE FUNCTION public.fn_med_salvar_lote(p jsonb)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $f$
DECLARE e jsonb; n int := 0;
BEGIN
  IF jsonb_typeof(p) <> 'array' THEN RAISE EXCEPTION 'Lote deve ser uma lista'; END IF;
  FOR e IN SELECT * FROM jsonb_array_elements(p) LOOP
    PERFORM public.fn_med_salvar(e); n := n + 1;
  END LOOP;
  RETURN n;
END $f$;

CREATE OR REPLACE FUNCTION public.fn_med_excluir(p_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $f$
BEGIN
  IF NOT (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'revisor')) THEN
    RAISE EXCEPTION 'Sem permissão para excluir medicamentos' USING ERRCODE='42501';
  END IF;
  DELETE FROM public.med_medicamento WHERE id = p_id;
  DELETE FROM public.base_medicamentos_geral WHERE id = p_id;
END $f$;

REVOKE ALL ON FUNCTION public.fn_med_salvar(jsonb), public.fn_med_salvar_lote(jsonb), public.fn_med_excluir(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_med_salvar(jsonb), public.fn_med_salvar_lote(jsonb), public.fn_med_excluir(uuid) TO authenticated;

-- Ficha antiga: só consulta pelo app
REVOKE INSERT, UPDATE, DELETE ON public.base_medicamentos_geral FROM authenticated, anon;