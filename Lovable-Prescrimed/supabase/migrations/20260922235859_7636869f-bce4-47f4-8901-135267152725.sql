DROP POLICY IF EXISTS "Authenticated read clinical alerts settings" ON public.clinical_alerts_settings;
CREATE POLICY "Authenticated read current clinical alerts settings"
ON public.clinical_alerts_settings
FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR id = (
    SELECT c.id FROM public.clinical_alerts_settings c
    ORDER BY c.updated_at DESC NULLS LAST
    LIMIT 1
  )
);

DROP POLICY IF EXISTS stg_med_dose_historico_select_auth ON public.stg_med_dose_historico;
CREATE POLICY stg_med_dose_historico_select_own_or_admin
ON public.stg_med_dose_historico
FOR SELECT TO authenticated
USING (
  alterado_por = auth.uid()
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'revisor'::app_role)
);