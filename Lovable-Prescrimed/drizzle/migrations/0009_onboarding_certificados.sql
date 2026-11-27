CREATE TABLE public.onb_progresso (
  user_id uuid PRIMARY KEY,
  perfil text NOT NULL DEFAULT 'residente',
  passos jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.onb_progresso TO authenticated;
GRANT ALL ON public.onb_progresso TO service_role;
ALTER TABLE public.onb_progresso ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own progress" ON public.onb_progresso FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.onb_certificados (
  codigo text PRIMARY KEY,
  user_id uuid NOT NULL,
  nome text NOT NULL,
  crm text,
  perfil text NOT NULL,
  carga_horas numeric NOT NULL DEFAULT 1,
  emitido_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.onb_certificados TO authenticated;
GRANT ALL ON public.onb_certificados TO service_role;
ALTER TABLE public.onb_certificados ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own certs read" ON public.onb_certificados FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own certs insert" ON public.onb_certificados FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.fn_onb_verificar(_codigo text)
RETURNS TABLE(nome text, crm text, perfil text, carga_horas numeric, emitido_em timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT nome, crm, perfil, carga_horas, emitido_em FROM public.onb_certificados WHERE codigo = _codigo
$$;
GRANT EXECUTE ON FUNCTION public.fn_onb_verificar(text) TO anon, authenticated;