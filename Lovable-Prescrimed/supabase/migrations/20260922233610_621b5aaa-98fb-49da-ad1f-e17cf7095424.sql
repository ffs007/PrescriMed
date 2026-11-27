-- 1.9: gate de assinatura no servidor para os recursos Pro (AIH, notificação
-- compulsória, atualizações por IA).
DROP FUNCTION IF EXISTS public.has_active_subscription(uuid, text);

CREATE OR REPLACE FUNCTION public.has_active_subscription(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = user_uuid
      AND (
        (status IN ('active', 'trialing', 'past_due') AND (current_period_end IS NULL OR current_period_end > now()))
        OR (status = 'canceled' AND current_period_end > now())
      )
  );
$$;
REVOKE ALL ON FUNCTION public.has_active_subscription(uuid) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_active_subscription(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.has_active_subscription_self()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_active_subscription(auth.uid());
$$;
REVOKE ALL ON FUNCTION public.has_active_subscription_self() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.has_active_subscription_self() TO authenticated;

DROP POLICY IF EXISTS "own notificacoes insert" ON public.notificacoes_compulsorias;
CREATE POLICY "own notificacoes insert" ON public.notificacoes_compulsorias
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.has_active_subscription_self());

DROP POLICY IF EXISTS "own ia updates" ON public.ia_atualizacoes_pendentes;
DROP POLICY IF EXISTS "own ia updates select" ON public.ia_atualizacoes_pendentes;
DROP POLICY IF EXISTS "own ia updates insert" ON public.ia_atualizacoes_pendentes;
DROP POLICY IF EXISTS "own ia updates update" ON public.ia_atualizacoes_pendentes;
DROP POLICY IF EXISTS "own ia updates delete" ON public.ia_atualizacoes_pendentes;
CREATE POLICY "own ia updates select" ON public.ia_atualizacoes_pendentes
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own ia updates insert" ON public.ia_atualizacoes_pendentes
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.has_active_subscription_self());
CREATE POLICY "own ia updates update" ON public.ia_atualizacoes_pendentes
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "own ia updates delete" ON public.ia_atualizacoes_pendentes
  FOR DELETE TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "own protocol versions" ON public.protocolo_versoes;
DROP POLICY IF EXISTS "own protocol versions select" ON public.protocolo_versoes;
DROP POLICY IF EXISTS "own protocol versions insert" ON public.protocolo_versoes;
DROP POLICY IF EXISTS "own protocol versions update" ON public.protocolo_versoes;
DROP POLICY IF EXISTS "own protocol versions delete" ON public.protocolo_versoes;
CREATE POLICY "own protocol versions select" ON public.protocolo_versoes
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own protocol versions insert" ON public.protocolo_versoes
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND (origem = 'manual' OR public.has_active_subscription_self()));
CREATE POLICY "own protocol versions update" ON public.protocolo_versoes
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "own protocol versions delete" ON public.protocolo_versoes
  FOR DELETE TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Owner insert documentos_gerados" ON public.documentos_gerados;
CREATE POLICY "Owner insert documentos_gerados" ON public.documentos_gerados
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = gerado_por
    AND (
      tipo NOT IN ('aih'::documento_tipo, 'notificacao_compulsoria'::documento_tipo)
      OR public.has_active_subscription_self()
    )
  );

-- Curadoria: revisor passa a ter o mesmo acesso do admin nas telas de curadoria.
DROP POLICY IF EXISTS "Admins gerenciam stg_import_lotes" ON public.stg_import_lotes;
CREATE POLICY "stg_import_lotes_admin_revisor" ON public.stg_import_lotes
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'revisor'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'revisor'::public.app_role));

DROP POLICY IF EXISTS "stg_admin_only" ON public.stg_exames;
CREATE POLICY "stg_exames_admin_revisor" ON public.stg_exames
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'revisor'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'revisor'::public.app_role));

DROP POLICY IF EXISTS "stg_admin_only" ON public.stg_patologias;
CREATE POLICY "stg_patologias_admin_revisor" ON public.stg_patologias
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'revisor'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'revisor'::public.app_role));

DROP POLICY IF EXISTS "stg_admin_only" ON public.stg_patologia_exames;
CREATE POLICY "stg_patologia_exames_admin_revisor" ON public.stg_patologia_exames
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'revisor'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'revisor'::public.app_role));

DROP POLICY IF EXISTS "Admins gerenciam curadoria_decisoes" ON public.curadoria_decisoes;
CREATE POLICY "curadoria_decisoes_admin_revisor" ON public.curadoria_decisoes
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'revisor'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'revisor'::public.app_role));

DROP POLICY IF EXISTS "etl_log_admin_select" ON public.etl_promocao_log;
CREATE POLICY "etl_log_admin_revisor_select" ON public.etl_promocao_log
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'revisor'::public.app_role));