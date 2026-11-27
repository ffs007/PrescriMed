ALTER TABLE public.med_ajuste ADD CONSTRAINT med_ajuste_medicamento_uk UNIQUE (medicamento_id);
ALTER TABLE public.med_apresentacao ADD CONSTRAINT med_apresentacao_medicamento_uk UNIQUE (medicamento_id);
ALTER TABLE public.med_busca ADD CONSTRAINT med_busca_medicamento_uk UNIQUE (medicamento_id);
ALTER TABLE public.med_dose ADD CONSTRAINT med_dose_medicamento_uk UNIQUE (medicamento_id);
ALTER TABLE public.med_gestacao_lactacao ADD CONSTRAINT med_gestacao_lactacao_medicamento_uk UNIQUE (medicamento_id);
ALTER TABLE public.med_governanca ADD CONSTRAINT med_governanca_medicamento_uk UNIQUE (medicamento_id);
ALTER TABLE public.med_regulatorio ADD CONSTRAINT med_regulatorio_medicamento_uk UNIQUE (medicamento_id);
ALTER TABLE public.med_seguranca ADD CONSTRAINT med_seguranca_medicamento_uk UNIQUE (medicamento_id);
ALTER TABLE public.med_uso ADD CONSTRAINT med_uso_medicamento_uk UNIQUE (medicamento_id);
ALTER TABLE public.med_via ADD CONSTRAINT med_via_medicamento_uk UNIQUE (medicamento_id);
CREATE OR REPLACE FUNCTION public.fn_sync_med_normalizado() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
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
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.fn_sync_med_normalizado() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER trg_bmg_sync_normalizado AFTER INSERT OR UPDATE ON public.base_medicamentos_geral FOR EACH ROW EXECUTE FUNCTION public.fn_sync_med_normalizado();
CREATE OR REPLACE VIEW public.vw_medicamento_completo WITH (security_invoker=true) AS SELECT m.id,
    m.principio_ativo, m.nome_comercial_referencia, m.classe_terapeutica, m.categoria_clinica, m.subclasse_terapeutica, m.tipo_receita, m.alto_risco, m.antimicrobiano, m.alerta_gestacao, m.ativo, m.status_revisao, m.busca_normalizada,
    COALESCE(m.apresentacao, ap.apresentacao_texto) AS apresentacao,
    COALESCE(m.concentracao, ap.concentracao) AS concentracao,
    ap.forma_farmaceutica, ap.unidade_concentracao,
    COALESCE(m.via_administracao, ap.via_administracao, dz.via) AS via_administracao,
    ap.total_apresentacoes,
    COALESCE(m.dose_adulto_padrao, dz.dose_adulto, dz.posologia_adulto) AS dose_adulto,
    COALESCE(m.dose_pediatrica_padrao, dz.dose_pediatrica, dz.posologia_pediatrica) AS dose_pediatrica,
    COALESCE(m.frequencia_padrao, dz.frequencia) AS frequencia,
    COALESCE(m.duracao_padrao, dz.duracao) AS duracao,
    dz.dose_maxima_dia, dz.observacao_dose, dz.total_doses,
    (COALESCE(m.dose_adulto_padrao, dz.dose_adulto, dz.posologia_adulto) IS NULL) AS dose_incompleta,
    (COALESCE(m.apresentacao, ap.apresentacao_texto) IS NULL) AS apresentacao_incompleta,
    COALESCE(ap.total_apresentacoes, (0)::bigint) AS apresentacoes_disponiveis,
    ap.apresentacao_id AS apresentacao_unica_id,
    ap.rotulo AS apresentacao_rotulo,
    ((COALESCE(ap.total_apresentacoes, (0)::bigint) = 1) AND ap.utilizavel) AS apresentacao_autoselecionavel,
    dz.posologia_adulto AS posologia_texto,
    (COALESCE(dz.total_doses, (0)::bigint) > 0) AS tem_posologia
   FROM (((SELECT mm.id, mm.principio_ativo, mm.nome_comercial_referencia, mm.classe_terapeutica, mm.categoria_clinica, mm.subclasse_terapeutica, mm.tipo_receita, mm.alto_risco, mm.antimicrobiano, mm.ativo, mm.status_revisao,
      mb.busca_normalizada, mg.alerta_gestacao, ma.apresentacao, ma.concentracao, mv.via_administracao,
      md.dose_adulto_padrao, md.dose_pediatrica_padrao, md.frequencia_padrao, md.duracao_padrao
     FROM public.med_medicamento mm
     LEFT JOIN public.med_busca mb ON mb.medicamento_id=mm.id
     LEFT JOIN public.med_gestacao_lactacao mg ON mg.medicamento_id=mm.id
     LEFT JOIN public.med_apresentacao ma ON ma.medicamento_id=mm.id
     LEFT JOIN public.med_via mv ON mv.medicamento_id=mm.id
     LEFT JOIN public.med_dose md ON md.medicamento_id=mm.id) m
     LEFT JOIN LATERAL ( SELECT a.apresentacao_id, a.apresentacao_texto, a.rotulo, a.concentracao, a.forma_farmaceutica, a.unidade_concentracao, a.via AS via_administracao, a.utilizavel, count(*) OVER () AS total_apresentacoes
           FROM vw_apresentacao_completa a
          WHERE ((a.medicamento_id = m.id) AND (a.ativo IS NOT FALSE))
          ORDER BY a.utilizavel DESC, a.rotulo
         LIMIT 1) ap ON (true))
     LEFT JOIN LATERAL ( SELECT max(fn_via_canonica(d.via)) FILTER (WHERE (d.via IS NOT NULL)) AS via,
            max(CASE WHEN ((d.populacao IS NULL) OR (d.populacao !~~* '%pedi%'::text)) THEN NULLIF(concat_ws(' '::text, NULLIF(concat_ws('-'::text, (d.dose_min)::text, NULLIF((d.dose_max)::text, (d.dose_min)::text)), ''::text), d.dose_unidade), ''::text) ELSE NULL::text END) AS dose_adulto,
            max(CASE WHEN (d.populacao ~~* '%pedi%'::text) THEN NULLIF(concat_ws(' '::text, NULLIF(concat_ws('-'::text, (d.dose_min)::text, NULLIF((d.dose_max)::text, (d.dose_min)::text)), ''::text), d.dose_unidade), ''::text) ELSE NULL::text END) AS dose_pediatrica,
            max(d.posologia_texto) FILTER (WHERE ((d.populacao IS NULL) OR (d.populacao !~~* '%pedi%'::text))) AS posologia_adulto,
            max(d.posologia_texto) FILTER (WHERE (d.populacao ~~* '%pedi%'::text)) AS posologia_pediatrica,
            max(d.frequencia) AS frequencia,
            max(d.duracao) AS duracao,
            max(concat_ws(' '::text, (d.dose_maxima_dia)::text, d.dose_maxima_dia_unidade)) AS dose_maxima_dia,
            max(d.observacao_dose) AS observacao_dose,
            count(*) AS total_doses
           FROM base_medicamentos_dose d
          WHERE (d.medicamento_id = m.id)) dz ON (true));