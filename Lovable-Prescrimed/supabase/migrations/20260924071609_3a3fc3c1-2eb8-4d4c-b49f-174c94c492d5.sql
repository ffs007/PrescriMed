ALTER TABLE public.clinical_condition_medication
  ALTER COLUMN medicamento_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS opcao_chave text,
  ADD COLUMN IF NOT EXISTS medicamento_nome_livre text,
  ADD COLUMN IF NOT EXISTS classe_texto text,
  ADD COLUMN IF NOT EXISTS subgrupo text,
  ADD COLUMN IF NOT EXISTS nomes_comerciais text,
  ADD COLUMN IF NOT EXISTS apresentacao_texto text,
  ADD COLUMN IF NOT EXISTS dose_adulto text,
  ADD COLUMN IF NOT EXISTS dose_pediatrica text,
  ADD COLUMN IF NOT EXISTS idade_minima text,
  ADD COLUMN IF NOT EXISTS via text,
  ADD COLUMN IF NOT EXISTS frequencia text,
  ADD COLUMN IF NOT EXISTS duracao text,
  ADD COLUMN IF NOT EXISTS gestacao text,
  ADD COLUMN IF NOT EXISTS lactacao text,
  ADD COLUMN IF NOT EXISTS interacoes text,
  ADD COLUMN IF NOT EXISTS flags_populacao text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS nao_farmacologico boolean NOT NULL DEFAULT false;

ALTER TABLE public.clinical_condition_medication
  DROP CONSTRAINT IF EXISTS clinical_condition_medication_condicao_tipo_condicao_normal_key;
DROP INDEX IF EXISTS public.clinical_condition_medication_condicao_tipo_condicao_normal_key;
CREATE UNIQUE INDEX IF NOT EXISTS ccm_legacy_uniq ON public.clinical_condition_medication
  (condicao_tipo, condicao_normalizada, medicamento_id, care_context, papel) WHERE opcao_chave IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS ccm_opcao_uniq ON public.clinical_condition_medication
  (condicao_tipo, condicao_normalizada, opcao_chave) WHERE opcao_chave IS NOT NULL;

CREATE OR REPLACE FUNCTION public.fn_ccm_validar_completude()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE faltando text[] := '{}';
BEGIN
  IF NEW.opcao_chave IS NULL THEN RETURN NEW; END IF;
  IF NEW.medicamento_id IS NULL AND COALESCE(btrim(NEW.medicamento_nome_livre),'') = '' THEN faltando := faltando || 'nome'; END IF;
  IF COALESCE(btrim(NEW.linha_tratamento),'') = '' THEN faltando := faltando || 'linha_tratamento'; END IF;
  IF COALESCE(btrim(NEW.source_reference),'') = '' THEN faltando := faltando || 'fonte'; END IF;
  IF NOT NEW.nao_farmacologico THEN
    IF COALESCE(btrim(NEW.apresentacao_texto),'') = '' THEN faltando := faltando || 'apresentacao'; END IF;
    IF COALESCE(btrim(NEW.dose_adulto),'') = '' THEN faltando := faltando || 'dose_adulto'; END IF;
    IF COALESCE(btrim(NEW.dose_pediatrica),'') = '' THEN faltando := faltando || 'dose_pediatrica'; END IF;
    IF COALESCE(btrim(NEW.via),'') = '' THEN faltando := faltando || 'via'; END IF;
    IF COALESCE(btrim(NEW.frequencia),'') = '' THEN faltando := faltando || 'frequencia'; END IF;
    IF COALESCE(btrim(NEW.duracao),'') = '' THEN faltando := faltando || 'duracao'; END IF;
    IF COALESCE(btrim(NEW.ajuste_renal),'') = '' THEN faltando := faltando || 'ajuste_renal'; END IF;
    IF COALESCE(btrim(NEW.ajuste_hepatico),'') = '' THEN faltando := faltando || 'ajuste_hepatico'; END IF;
    IF COALESCE(btrim(NEW.gestacao),'') = '' THEN faltando := faltando || 'gestacao'; END IF;
    IF COALESCE(btrim(NEW.lactacao),'') = '' THEN faltando := faltando || 'lactacao'; END IF;
    IF COALESCE(btrim(NEW.contraindicacoes),'') = '' THEN faltando := faltando || 'contraindicacoes'; END IF;
    IF COALESCE(btrim(NEW.interacoes),'') = '' THEN faltando := faltando || 'interacoes'; END IF;
    IF COALESCE(btrim(NEW.monitorizacao),'') = '' THEN faltando := faltando || 'monitorizacao'; END IF;
  END IF;
  IF array_length(faltando,1) > 0 THEN
    RAISE EXCEPTION 'Opção % incompleta: %', NEW.opcao_chave, array_to_string(faltando, ', ');
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_ccm_completude ON public.clinical_condition_medication;
CREATE TRIGGER trg_ccm_completude BEFORE INSERT OR UPDATE ON public.clinical_condition_medication
  FOR EACH ROW EXECUTE FUNCTION public.fn_ccm_validar_completude();

CREATE OR REPLACE VIEW public.vw_completude_condicao WITH (security_invoker = true) AS
SELECT condicao_nome,
  count(*) AS opcoes,
  count(*) FILTER (WHERE NOT nao_farmacologico) AS opcoes_farmacologicas,
  count(*) FILTER (WHERE nao_farmacologico) AS opcoes_nao_farmacologicas,
  count(DISTINCT COALESCE(medicamento_nome_livre, medicamento_id::text)) FILTER (WHERE NOT nao_farmacologico) AS medicamentos,
  count(DISTINCT classe_texto) AS classes,
  count(*) FILTER (WHERE 'pediatria' = ANY(flags_populacao)) AS pediatria,
  count(*) FILTER (WHERE 'gestante' = ANY(flags_populacao)) AS gestante,
  count(*) FILTER (WHERE 'idoso' = ANY(flags_populacao)) AS idoso,
  count(*) FILTER (WHERE 'renal' = ANY(flags_populacao)) AS renal,
  count(*) FILTER (WHERE 'hepatico' = ANY(flags_populacao)) AS hepatico,
  count(*) FILTER (WHERE 'alergia' = ANY(flags_populacao)) AS alergia,
  count(*) FILTER (WHERE 'falha' = ANY(flags_populacao)) AS falha
FROM public.clinical_condition_medication
WHERE opcao_chave IS NOT NULL AND review_status <> 'inactive'
GROUP BY condicao_nome;
GRANT SELECT ON public.vw_completude_condicao TO authenticated;
GRANT SELECT ON public.vw_completude_condicao TO service_role;

DROP FUNCTION IF EXISTS public.fn_sugestoes_terapeuticas(text, text, text, jsonb);
CREATE FUNCTION public.fn_sugestoes_terapeuticas(p_condicao text DEFAULT NULL, p_sindrome text DEFAULT NULL, p_contexto text DEFAULT NULL, p_paciente jsonb DEFAULT '{}'::jsonb)
 RETURNS TABLE(vinculo_id uuid, origem text, condicao_nome text, medicamento_id uuid, medicamento_nome text, principio_ativo text, classe_terapeutica text, apresentacao text, concentracao text, via text, dose_adulto text, dose_pediatrica text, frequencia text, duracao text, papel text, prioridade integer, care_context text, populacao text, notas text, vinculo_revisado boolean, medicamento_liberado boolean, apresentacao_utilizavel boolean, dose_incompleta boolean, tipo_receita text, alto_risco boolean, evitar_gestante boolean, ajuste_renal boolean, ajuste_hepatico boolean, alertas_paciente text[], grupo integer,
   opcao_chave text, subgrupo text, linha_tratamento text, nomes_comerciais text, idade_minima text, gestacao text, lactacao text, contraindicacoes text, interacoes text, monitorizacao text, ajuste_renal_texto text, ajuste_hepatico_texto text, fonte text, flags_populacao text[], nao_farmacologico boolean)
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
    u.flags_populacao, u.nao_farmacologico
  FROM uni u
  LEFT JOIN public.vw_medicamento_completo v ON v.id = u.medicamento_id
  LEFT JOIN public.base_medicamentos_geral g ON g.id = u.medicamento_id
  ORDER BY 30, u.prioridade, 5;
$function$;
GRANT EXECUTE ON FUNCTION public.fn_sugestoes_terapeuticas(text, text, text, jsonb) TO authenticated, service_role;