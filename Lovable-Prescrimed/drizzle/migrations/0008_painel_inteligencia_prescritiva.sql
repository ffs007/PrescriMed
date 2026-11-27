CREATE TABLE public.pi_prefs (
  user_id uuid PRIMARY KEY,
  periodicidade text NOT NULL DEFAULT 'mensal',
  especialidade text, anos_formado int, tipo_pratica text,
  cme_meta_horas numeric DEFAULT 50, cme_prazo date,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pi_prefs TO authenticated;
GRANT ALL ON public.pi_prefs TO service_role;
ALTER TABLE public.pi_prefs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pi_prefs own" ON public.pi_prefs FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.pi_cme (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  titulo text NOT NULL, fonte text, tipo text NOT NULL DEFAULT 'curso',
  horas numeric NOT NULL DEFAULT 1, concluido_em date NOT NULL DEFAULT current_date,
  certificado_url text, origem text NOT NULL DEFAULT 'externo',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pi_cme TO authenticated;
GRANT ALL ON public.pi_cme TO service_role;
ALTER TABLE public.pi_cme ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pi_cme own" ON public.pi_cme FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.pi_portfolios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  codigo text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(9),'hex'),
  resumo jsonb NOT NULL, hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.pi_portfolios TO authenticated;
GRANT ALL ON public.pi_portfolios TO service_role;
ALTER TABLE public.pi_portfolios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pi_port own read" ON public.pi_portfolios FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "pi_port own insert" ON public.pi_portfolios FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.fn_pi_verificar(_codigo text)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object('codigo', p.codigo, 'emitido_em', p.created_at, 'hash', p.hash, 'resumo', p.resumo)
  FROM public.pi_portfolios p WHERE p.codigo = _codigo
$$;
GRANT EXECUTE ON FUNCTION public.fn_pi_verificar(text) TO anon, authenticated;

-- Comparação anônima: só devolve percentis quando há pelo menos 5 médicos no período.
CREATE OR REPLACE FUNCTION public.fn_pi_pares(_desde timestamptz)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH u AS (
    SELECT user_id,
      count(*) FILTER (WHERE tipo = 'emissao_documento') AS emissoes,
      count(*) FILTER (WHERE tipo IN ('alerta','bloqueio')) AS alertas,
      count(*) FILTER (WHERE tipo = 'liberacao') AS overrides,
      avg(NULLIF((contexto->>'segundos')::numeric,0)) FILTER (WHERE tipo = 'emissao_documento') AS seg,
      avg(CASE WHEN contexto->>'protocolo' = 'true' THEN 1.0 ELSE 0 END) FILTER (WHERE tipo = 'emissao_documento') AS prot
    FROM public.safety_events WHERE created_at >= _desde GROUP BY user_id
  ), r AS (SELECT *, CASE WHEN alertas > 0 THEN overrides::numeric / alertas END AS taxa FROM u)
  SELECT CASE WHEN (SELECT count(*) FROM r) < 5 THEN jsonb_build_object('n', (SELECT count(*) FROM r), 'suficiente', false)
  ELSE jsonb_build_object('n', (SELECT count(*) FROM r), 'suficiente', true,
    'emissoes', (SELECT jsonb_build_array(percentile_cont(0.1) WITHIN GROUP (ORDER BY emissoes), percentile_cont(0.25) WITHIN GROUP (ORDER BY emissoes), percentile_cont(0.5) WITHIN GROUP (ORDER BY emissoes), percentile_cont(0.75) WITHIN GROUP (ORDER BY emissoes), percentile_cont(0.9) WITHIN GROUP (ORDER BY emissoes)) FROM r),
    'taxa_override', (SELECT jsonb_build_array(percentile_cont(0.1) WITHIN GROUP (ORDER BY taxa), percentile_cont(0.25) WITHIN GROUP (ORDER BY taxa), percentile_cont(0.5) WITHIN GROUP (ORDER BY taxa), percentile_cont(0.75) WITHIN GROUP (ORDER BY taxa), percentile_cont(0.9) WITHIN GROUP (ORDER BY taxa)) FROM r WHERE taxa IS NOT NULL),
    'segundos', (SELECT jsonb_build_array(percentile_cont(0.1) WITHIN GROUP (ORDER BY seg), percentile_cont(0.25) WITHIN GROUP (ORDER BY seg), percentile_cont(0.5) WITHIN GROUP (ORDER BY seg), percentile_cont(0.75) WITHIN GROUP (ORDER BY seg), percentile_cont(0.9) WITHIN GROUP (ORDER BY seg)) FROM r WHERE seg IS NOT NULL),
    'protocolo', (SELECT jsonb_build_array(percentile_cont(0.1) WITHIN GROUP (ORDER BY prot), percentile_cont(0.25) WITHIN GROUP (ORDER BY prot), percentile_cont(0.5) WITHIN GROUP (ORDER BY prot), percentile_cont(0.75) WITHIN GROUP (ORDER BY prot), percentile_cont(0.9) WITHIN GROUP (ORDER BY prot)) FROM r WHERE prot IS NOT NULL))
  END
$$;
GRANT EXECUTE ON FUNCTION public.fn_pi_pares(timestamptz) TO authenticated;