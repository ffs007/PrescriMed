CREATE OR REPLACE FUNCTION public.fn_sugestoes_terapeuticas(
  p_condicao text DEFAULT NULL,
  p_sindrome text DEFAULT NULL,
  p_contexto text DEFAULT NULL,
  p_paciente jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE(
  vinculo_id uuid, origem text, condicao_nome text,
  medicamento_id uuid, medicamento_nome text, principio_ativo text, classe_terapeutica text,
  apresentacao text, concentracao text, via text,
  dose_adulto text, dose_pediatrica text, frequencia text, duracao text,
  papel text, prioridade integer, care_context text, populacao text, notas text,
  vinculo_revisado boolean, medicamento_liberado boolean,
  apresentacao_utilizavel boolean, dose_incompleta boolean,
  tipo_receita text, alto_risco boolean,
  evitar_gestante boolean, ajuste_renal boolean, ajuste_hepatico boolean,
  alertas_paciente text[], grupo integer
)
LANGUAGE sql STABLE SET search_path = public AS $$
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
    u.medicamento_id, COALESCE(v.principio_ativo, 'Medicamento'), v.principio_ativo, v.classe_terapeutica,
    v.apresentacao, v.concentracao, v.via_administracao,
    v.dose_adulto, v.dose_pediatrica, v.frequencia, v.duracao,
    u.papel::text, u.prioridade, u.care_context::text, u.populacao, u.notes,
    (u.review_status = 'reviewed'),
    EXISTS (SELECT 1 FROM public.vw_medicamento_liberado lib WHERE lib.medicamento_id = u.medicamento_id),
    COALESCE(v.apresentacao_autoselecionavel, false) OR COALESCE(v.apresentacoes_disponiveis, 0) > 0,
    COALESCE(v.dose_incompleta, true),
    v.tipo_receita::text, COALESCE(v.alto_risco, false),
    COALESCE(g.alerta_gestacao IS NOT NULL AND g.alerta_gestacao <> 'seguro', false),
    COALESCE(g.exige_ajuste_renal, false), COALESCE(g.exige_ajuste_hepatico, false),
    ARRAY_REMOVE(ARRAY[
      CASE WHEN COALESCE((p_paciente->>'gestante')::boolean, false)
             AND g.alerta_gestacao IS NOT NULL AND g.alerta_gestacao <> 'seguro'
           THEN 'Alerta na gestação' END,
      CASE WHEN COALESCE((p_paciente->>'pediatrico')::boolean, false) AND v.dose_pediatrica IS NULL
           THEN 'Sem dose pediátrica cadastrada' END,
      CASE WHEN COALESCE((p_paciente->>'renal')::boolean, false) AND COALESCE(g.exige_ajuste_renal, false)
           THEN 'Requer ajuste renal' END,
      CASE WHEN COALESCE((p_paciente->>'hepatico')::boolean, false) AND COALESCE(g.exige_ajuste_hepatico, false)
           THEN 'Requer ajuste hepático' END,
      CASE WHEN COALESCE(g.exige_peso, false) AND (p_paciente->>'peso') IS NULL
           THEN 'Dose depende do peso' END
    ], NULL),
    CASE
      WHEN u.review_status <> 'reviewed' THEN 4
      WHEN u.papel IN ('primeira_linha','resgate') THEN 1
      WHEN u.papel IN ('alternativa','hospitalar','situacao_especifica') THEN 2
      ELSE 3
    END
  FROM uni u
  LEFT JOIN public.vw_medicamento_completo v ON v.id = u.medicamento_id
  LEFT JOIN public.base_medicamentos_geral g ON g.id = u.medicamento_id
  ORDER BY 30, (SELECT CASE WHEN EXISTS (SELECT 1 FROM public.vw_medicamento_liberado lib WHERE lib.medicamento_id = u.medicamento_id) THEN 0 ELSE 1 END), u.prioridade, 5;
$$;