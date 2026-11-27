ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz DEFAULT (now() + interval '7 days');
UPDATE public.profiles SET trial_ends_at = now() + interval '7 days' WHERE trial_ends_at IS NULL OR trial_ends_at < now() + interval '7 days';

CREATE TABLE public.ia_uso_trial (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  funcao text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ia_uso_trial_user_idx ON public.ia_uso_trial(user_id, created_at);
GRANT SELECT ON public.ia_uso_trial TO authenticated;
GRANT ALL ON public.ia_uso_trial TO service_role;
ALTER TABLE public.ia_uso_trial ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own ia uso select" ON public.ia_uso_trial FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.fn_em_trial(_uid uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = _uid AND trial_ends_at > now());
$$;

CREATE OR REPLACE FUNCTION public.fn_tem_acesso(_uid uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_active_subscription(_uid) OR public.has_role(_uid, 'admin') OR public.fn_em_trial(_uid);
$$;
REVOKE ALL ON FUNCTION public.fn_em_trial(uuid) FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.fn_tem_acesso(uuid) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_em_trial(uuid), public.fn_tem_acesso(uuid) TO service_role;

-- Recursos Pro liberados durante o teste grátis.
CREATE OR REPLACE FUNCTION public.has_active_subscription_self() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.fn_tem_acesso(auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.fn_acesso_status_self() RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object(
    'assinante', public.has_active_subscription(auth.uid()) OR public.has_role(auth.uid(), 'admin'),
    'em_trial', public.fn_em_trial(auth.uid()),
    'trial_ends_at', (SELECT trial_ends_at FROM public.profiles WHERE id = auth.uid()),
    'ia_total', (SELECT count(*) FROM public.ia_uso_trial WHERE user_id = auth.uid()),
    'ia_hoje', (SELECT count(*) FROM public.ia_uso_trial WHERE user_id = auth.uid()
                AND (created_at AT TIME ZONE 'America/Sao_Paulo')::date = (now() AT TIME ZONE 'America/Sao_Paulo')::date),
    'ia_limite_total', 30, 'ia_limite_dia', 8);
$$;
REVOKE ALL ON FUNCTION public.fn_acesso_status_self() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.fn_acesso_status_self() TO authenticated;

-- Consome 1 uso de IA. Retorna 'ok' | 'trial-ia-limit' | 'trial-ia-limit-dia' | 'sem-acesso'.
CREATE OR REPLACE FUNCTION public.fn_consumir_ia(_uid uuid, _funcao text) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE t int; d int;
BEGIN
  IF public.has_active_subscription(_uid) OR public.has_role(_uid, 'admin') THEN RETURN 'ok'; END IF;
  IF NOT public.fn_em_trial(_uid) THEN RETURN 'sem-acesso'; END IF;
  PERFORM pg_advisory_xact_lock(hashtext('ia_trial_' || _uid::text));
  SELECT count(*) INTO t FROM public.ia_uso_trial WHERE user_id = _uid;
  IF t >= 30 THEN RETURN 'trial-ia-limit'; END IF;
  SELECT count(*) INTO d FROM public.ia_uso_trial WHERE user_id = _uid
    AND (created_at AT TIME ZONE 'America/Sao_Paulo')::date = (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  IF d >= 8 THEN RETURN 'trial-ia-limit-dia'; END IF;
  INSERT INTO public.ia_uso_trial(user_id, funcao) VALUES (_uid, _funcao);
  RETURN 'ok';
END $$;
REVOKE ALL ON FUNCTION public.fn_consumir_ia(uuid, text) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_consumir_ia(uuid, text) TO service_role;