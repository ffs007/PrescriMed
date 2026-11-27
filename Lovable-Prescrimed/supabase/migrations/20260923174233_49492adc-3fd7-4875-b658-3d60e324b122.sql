CREATE OR REPLACE FUNCTION public.fn_cobertura_vinculos()
RETURNS TABLE(ambiente text, total bigint, com bigint)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path TO 'public'
AS $$
  SELECT pa.ambiente::text, count(*),
    count(*) FILTER (WHERE EXISTS (
      SELECT 1 FROM clinical_condition_medication c
      WHERE c.condicao_tipo = 'patologia' AND c.papel = 'primeira_linha' AND c.review_status <> 'inactive'
        AND c.care_context::text = pa.ambiente::text AND c.condicao_normalizada = pa.nome_normalizado))
  FROM patologia_ambiente pa GROUP BY 1
$$;
GRANT EXECUTE ON FUNCTION public.fn_cobertura_vinculos() TO authenticated;
CREATE INDEX IF NOT EXISTS idx_ccm_cobertura ON public.clinical_condition_medication (condicao_tipo, care_context, condicao_normalizada) WHERE papel = 'primeira_linha';