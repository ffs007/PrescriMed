CREATE OR REPLACE FUNCTION public.fn_resumo_auditoria_escores()
RETURNS TABLE(nome_escore text, total bigint, validos bigint)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path TO 'public'
AS $$
  SELECT lower(nome_escore::text), count(*), count(*) FILTER (WHERE populacao_validada AND entradas_completas)
  FROM audit_escores_clinicos GROUP BY 1
$$;
GRANT EXECUTE ON FUNCTION public.fn_resumo_auditoria_escores() TO authenticated;

CREATE OR REPLACE FUNCTION public.fn_funil_checkout(p_days int DEFAULT 30)
RETURNS jsonb
LANGUAGE sql STABLE SECURITY INVOKER SET search_path TO 'public'
AS $$
  WITH ev AS (
    SELECT user_id, tipo, recurso FROM uso_eventos
    WHERE tipo IN ('checkout_inicio','checkout_aberto','checkout_erro','checkout_retorno')
      AND criado_em >= now() - make_interval(days => p_days)
  ), st AS (SELECT DISTINCT user_id FROM ev WHERE tipo = 'checkout_inicio')
  SELECT jsonb_build_object(
    'started', (SELECT count(*) FROM st),
    'opened', (SELECT count(DISTINCT user_id) FROM ev WHERE tipo='checkout_aberto' AND user_id IN (SELECT user_id FROM st)),
    'activated', (SELECT count(DISTINCT user_id) FROM ev WHERE tipo='checkout_retorno' AND recurso='ativo' AND user_id IN (SELECT user_id FROM st)),
    'errors', (SELECT count(*) FROM ev WHERE tipo='checkout_erro'),
    'monthlyInterest', (SELECT count(DISTINCT user_id) FROM ev WHERE tipo='checkout_inicio' AND recurso='pro_monthly'),
    'yearlyInterest', (SELECT count(DISTINCT user_id) FROM ev WHERE tipo='checkout_inicio' AND recurso='pro_yearly'))
$$;
GRANT EXECUTE ON FUNCTION public.fn_funil_checkout(int) TO authenticated;