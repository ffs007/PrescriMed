DO $$
DECLARE t text;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'sandbox_exec') THEN
    FOREACH t IN ARRAY ARRAY['catalogo_medicamentos_legado','catalogo_patologias_legado','catalogo_protocolos_legado','catalogo_exames_legado','catalogo_medicamentos_overlay'] LOOP
      EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO sandbox_exec', t);
      EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', t);
      EXECUTE format('ALTER TABLE public.%I NO FORCE ROW LEVEL SECURITY', t);
    END LOOP;
  END IF;
END $$;

CREATE POLICY "catalogo_med_legado_seed" ON public.catalogo_medicamentos_legado FOR ALL TO sandbox_exec USING (true) WITH CHECK (true);
CREATE POLICY "catalogo_pat_legado_seed" ON public.catalogo_patologias_legado FOR ALL TO sandbox_exec USING (true) WITH CHECK (true);
CREATE POLICY "catalogo_prot_legado_seed" ON public.catalogo_protocolos_legado FOR ALL TO sandbox_exec USING (true) WITH CHECK (true);
CREATE POLICY "catalogo_exames_legado_seed" ON public.catalogo_exames_legado FOR ALL TO sandbox_exec USING (true) WITH CHECK (true);
CREATE POLICY "catalogo_overlay_seed" ON public.catalogo_medicamentos_overlay FOR ALL TO sandbox_exec USING (true) WITH CHECK (true);