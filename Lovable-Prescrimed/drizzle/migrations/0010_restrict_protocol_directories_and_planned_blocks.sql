CREATE OR REPLACE FUNCTION public.fn_prot_pode_ver_instancia(_instancia uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
 SELECT auth.uid() IS NOT NULL AND (
   public.has_role(auth.uid(), 'admin'::public.app_role)
   OR EXISTS (
     SELECT 1 FROM public.prot_protocolos p
     WHERE p.instancia_id = _instancia
       AND (p.owner = auth.uid() OR public.fn_prot_papel(p.equipe_id) IS NOT NULL)
   )
 );
$$;
REVOKE ALL ON FUNCTION public.fn_prot_pode_ver_instancia(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_prot_pode_ver_instancia(uuid) TO authenticated, service_role;
ALTER POLICY "auth le instancias" ON public.prot_instancias TO authenticated USING (public.fn_prot_pode_ver_instancia(id));
ALTER POLICY "auth le equipes" ON public.prot_equipes TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.fn_prot_papel(id) IS NOT NULL);
ALTER POLICY "blocos plan read auth" ON public.base_blocos_medicamentos_planejados TO authenticated USING (public.fn_curadoria_pode_editar());