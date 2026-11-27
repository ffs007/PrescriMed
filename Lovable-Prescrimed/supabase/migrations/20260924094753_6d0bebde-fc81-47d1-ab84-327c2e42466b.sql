
ALTER TABLE public.clinical_condition_medication
  ADD COLUMN IF NOT EXISTS dose_referencia text,
  ADD COLUMN IF NOT EXISTS instrucao_paciente text,
  ADD COLUMN IF NOT EXISTS instrucao_paciente_ped text,
  ADD COLUMN IF NOT EXISTS dose_ped_calc jsonb;

COMMENT ON COLUMN public.clinical_condition_medication.dose_referencia IS 'Faixa/limites de dose para o médico ver na tela. Nunca vai para o PDF.';
COMMENT ON COLUMN public.clinical_condition_medication.instrucao_paciente IS 'Instrução ao paciente adulto que vai para o PDF.';
COMMENT ON COLUMN public.clinical_condition_medication.instrucao_paciente_ped IS 'Instrução pediátrica; pode conter {dose}, substituído pela dose calculada pelo peso.';
COMMENT ON COLUMN public.clinical_condition_medication.dose_ped_calc IS 'Regra estruturada de dose por peso: mgkg, per (dose|dia), div, max, min, unit, mgpu, step, regra.';

CREATE OR REPLACE FUNCTION public.fn_ccm_instrucao_obrigatoria()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.opcao_chave IS NULL OR NEW.review_status = 'inactive' THEN RETURN NEW; END IF;
  IF clin_normalize(coalesce(NEW.populacao,'ambos')) IN ('adulto','ambos') AND coalesce(btrim(NEW.instrucao_paciente),'') = '' THEN
    RAISE EXCEPTION 'Opção % sem instrução ao paciente adulto', NEW.opcao_chave;
  END IF;
  IF clin_normalize(coalesce(NEW.populacao,'ambos')) IN ('pediatrico','ambos') AND coalesce(btrim(NEW.instrucao_paciente_ped),'') = '' THEN
    RAISE EXCEPTION 'Opção % sem instrução pediátrica', NEW.opcao_chave;
  END IF;
  IF position('{dose}' in coalesce(NEW.instrucao_paciente_ped,'')) > 0 AND (NEW.dose_ped_calc IS NULL OR (NEW.dose_ped_calc->>'mgkg') IS NULL) THEN
    RAISE EXCEPTION 'Opção % usa dose por peso sem regra de cálculo', NEW.opcao_chave;
  END IF;
  RETURN NEW;
END $$;

DROP FUNCTION IF EXISTS public.fn_sugestoes_terapeuticas(text, text, text, jsonb);
CREATE FUNCTION public.fn_sugestoes_terapeuticas(p_condicao text DEFAULT NULL::text, p_sindrome text DEFAULT NULL::text, p_contexto text DEFAULT NULL::text, p_paciente jsonb DEFAULT '{}'::jsonb)
 RETURNS TABLE(vinculo_id uuid, origem text, condicao_nome text, medicamento_id uuid, medicamento_nome text, principio_ativo text, classe_terapeutica text, apresentacao text, concentracao text, via text, dose_adulto text, dose_pediatrica text, frequencia text, duracao text, papel text, prioridade integer, care_context text, populacao text, notas text, vinculo_revisado boolean, medicamento_liberado boolean, apresentacao_utilizavel boolean, dose_incompleta boolean, tipo_receita text, alto_risco boolean, evitar_gestante boolean, ajuste_renal boolean, ajuste_hepatico boolean, alertas_paciente text[], grupo integer, opcao_chave text, subgrupo text, linha_tratamento text, nomes_comerciais text, idade_minima text, gestacao text, lactacao text, contraindicacoes text, interacoes text, monitorizacao text, ajuste_renal_texto text, ajuste_hepatico_texto text, fonte text, flags_populacao text[], nao_farmacologico boolean, dose_referencia text, instrucao_paciente text, instrucao_paciente_ped text, dose_ped_calc jsonb)
 LANGUAGE sql STABLE SET search_path TO 'public'
AS $function$
  WITH ctx AS (
    SELECT NULLIF(btrim(COALESCE(p_contexto, '')), '') AS c,
      CASE WHEN COALESCE(p_paciente->>'pediatrico','false') = 'true' THEN 'pediatrico' ELSE 'adulto' END AS publico,
      CASE WHEN (p_paciente->>'condicao_id') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        THEN (p_paciente->>'condicao_id')::uuid ELSE NULL::uuid END AS id_condicao
  ), cond AS (
    SELECT l.*, 'patologia'::text AS origem_calc
    FROM public.clinical_condition_medication l, ctx
    WHERE (COALESCE(btrim(p_condicao), '') <> '' OR ctx.id_condicao IS NOT NULL)
      AND l.condicao_tipo = 'patologia'
      AND (l.condicao_id = ctx.id_condicao OR ((ctx.id_condicao IS NULL OR l.condicao_id IS NULL) AND l.condicao_normalizada = public.clin_normalize(p_condicao)))
      AND l.review_status <> 'inactive'
      AND (ctx.c IS NULL OR l.care_context = 'qualquer' OR l.care_context::text = ctx.c)
      AND (l.populacao IS NULL OR public.clin_normalize(l.populacao) IN ('ambos','todos','qualquer','geral','adulto pediatrico',ctx.publico)
        OR (ctx.publico = 'pediatrico' AND public.clin_normalize(l.populacao) = 'pediatria'))
  ), sind AS (
    SELECT l.*, 'sindrome'::text AS origem_calc
    FROM public.clinical_condition_medication l, ctx
    WHERE COALESCE(btrim(p_sindrome), '') <> ''
      AND NOT EXISTS (SELECT 1 FROM cond)
      AND l.condicao_tipo = 'sindrome'
      AND l.condicao_normalizada = public.clin_normalize(p_sindrome)
      AND l.review_status <> 'inactive'
      AND (ctx.c IS NULL OR l.care_context = 'qualquer' OR l.care_context::text = ctx.c)
      AND (l.populacao IS NULL OR public.clin_normalize(l.populacao) IN ('ambos','todos','qualquer','geral','adulto pediatrico',ctx.publico)
        OR (ctx.publico = 'pediatrico' AND public.clin_normalize(l.populacao) = 'pediatria'))
  ), uni AS (SELECT * FROM cond UNION ALL SELECT * FROM sind)
  SELECT
    u.id, u.origem_calc, u.condicao_nome,
    u.medicamento_id, COALESCE(u.medicamento_nome_livre, v.principio_ativo, 'Medicamento'), COALESCE(u.medicamento_nome_livre, v.principio_ativo),
    COALESCE(u.classe_texto, v.classe_terapeutica),
    COALESCE(u.apresentacao_texto, v.apresentacao), CASE WHEN u.apresentacao_texto IS NULL THEN v.concentracao END, COALESCE(u.via, v.via_administracao),
    COALESCE(u.dose_adulto, v.dose_adulto), COALESCE(u.dose_pediatrica, v.dose_pediatrica), COALESCE(u.frequencia, v.frequencia), COALESCE(u.duracao, v.duracao),
    u.papel::text, u.prioridade, u.care_context::text, u.populacao, u.notes,
    (u.review_status = 'reviewed'),
    EXISTS (SELECT 1 FROM public.vw_medicamento_liberado lib WHERE lib.medicamento_id = u.medicamento_id),
    u.opcao_chave IS NOT NULL OR COALESCE(v.apresentacao_autoselecionavel, false) OR COALESCE(v.apresentacoes_disponiveis, 0) > 0,
    CASE WHEN u.opcao_chave IS NOT NULL THEN false ELSE COALESCE(v.dose_incompleta, true) END,
    v.tipo_receita::text, COALESCE(v.alto_risco, false),
    COALESCE(g.alerta_gestacao IS NOT NULL AND g.alerta_gestacao <> 'seguro', false),
    COALESCE(g.exige_ajuste_renal, false), COALESCE(g.exige_ajuste_hepatico, false),
    ARRAY_REMOVE(ARRAY[
      CASE WHEN COALESCE((p_paciente->>'gestante')::boolean, false)
             AND g.alerta_gestacao IS NOT NULL AND g.alerta_gestacao <> 'seguro' THEN 'Alerta na gestação' END,
      CASE WHEN COALESCE((p_paciente->>'pediatrico')::boolean, false) AND COALESCE(u.dose_pediatrica, v.dose_pediatrica) IS NULL
           THEN 'Sem dose pediátrica cadastrada' END,
      CASE WHEN COALESCE((p_paciente->>'renal')::boolean, false) AND COALESCE(g.exige_ajuste_renal, false) THEN 'Requer ajuste renal' END,
      CASE WHEN COALESCE((p_paciente->>'hepatico')::boolean, false) AND COALESCE(g.exige_ajuste_hepatico, false) THEN 'Requer ajuste hepático' END,
      CASE WHEN COALESCE(g.exige_peso, false) AND (p_paciente->>'peso') IS NULL THEN 'Dose depende do peso' END
    ], NULL),
    CASE
      WHEN u.review_status <> 'reviewed' THEN 4
      WHEN u.papel IN ('primeira_linha','resgate') THEN 1
      WHEN u.papel IN ('alternativa','hospitalar','situacao_especifica') THEN 2
      ELSE 3
    END,
    u.opcao_chave, u.subgrupo, u.linha_tratamento, u.nomes_comerciais, u.idade_minima, u.gestacao, u.lactacao,
    u.contraindicacoes, u.interacoes, u.monitorizacao, u.ajuste_renal, u.ajuste_hepatico, u.source_reference,
    u.flags_populacao, u.nao_farmacologico,
    u.dose_referencia, u.instrucao_paciente, u.instrucao_paciente_ped, u.dose_ped_calc
  FROM uni u
  LEFT JOIN public.vw_medicamento_completo v ON v.id = u.medicamento_id
  LEFT JOIN public.base_medicamentos_geral g ON g.id = u.medicamento_id
  ORDER BY 30, u.prioridade, 5;
$function$;
GRANT EXECUTE ON FUNCTION public.fn_sugestoes_terapeuticas(text, text, text, jsonb) TO authenticated;
