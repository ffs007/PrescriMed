DROP POLICY "ver modelos" ON public.tpl_modelos;
CREATE POLICY "ver modelos" ON public.tpl_modelos FOR SELECT TO authenticated USING (owner = auth.uid() OR publicacao = 'publicado' OR public.fn_tpl_nivel(id, auth.uid()) IS NOT NULL);
DROP POLICY "ver versoes" ON public.tpl_versoes;
CREATE POLICY "ver versoes" ON public.tpl_versoes FOR SELECT TO authenticated USING (autor = auth.uid() OR public.fn_tpl_nivel(modelo_id, auth.uid()) IS NOT NULL);
DROP POLICY "usos proprios" ON public.tpl_usos;
CREATE POLICY "usos proprios" ON public.tpl_usos FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid() AND public.fn_tpl_nivel(modelo_id, auth.uid()) IS NOT NULL);