CREATE TABLE public.tpl_modelos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner uuid NOT NULL DEFAULT auth.uid(),
  nome text NOT NULL,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  ramo_principal text NOT NULL DEFAULT 'principal',
  publicacao text NOT NULL DEFAULT 'privado' CHECK (publicacao IN ('privado','pendente','publicado','recusado')),
  revisor uuid, revisao_obs text, revisado_em timestamptz,
  codigo text UNIQUE DEFAULT substr(replace(gen_random_uuid()::text,'-',''),1,8),
  origem_id uuid,
  arquivado boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.tpl_versoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  modelo_id uuid NOT NULL REFERENCES public.tpl_modelos(id) ON DELETE CASCADE,
  autor uuid NOT NULL DEFAULT auth.uid(),
  ramo text NOT NULL DEFAULT 'principal',
  pai uuid REFERENCES public.tpl_versoes(id),
  mensagem text NOT NULL DEFAULT '',
  conteudo jsonb NOT NULL,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  hash text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.tpl_versoes(modelo_id, created_at DESC);
CREATE TABLE public.tpl_compart (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  modelo_id uuid NOT NULL REFERENCES public.tpl_modelos(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  nivel text NOT NULL DEFAULT 'leitura' CHECK (nivel IN ('leitura','colab')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (modelo_id, user_id)
);
CREATE TABLE public.tpl_sugestoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  modelo_id uuid NOT NULL REFERENCES public.tpl_modelos(id) ON DELETE CASCADE,
  autor uuid NOT NULL DEFAULT auth.uid(),
  base_versao uuid,
  mensagem text NOT NULL DEFAULT '',
  conteudo jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','aceita','recusada')),
  decidido_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.tpl_usos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  modelo_id uuid NOT NULL REFERENCES public.tpl_modelos(id) ON DELETE CASCADE,
  versao_id uuid,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  contexto jsonb NOT NULL DEFAULT '{}'::jsonb,
  pct_mod numeric, segundos integer, estrelas smallint CHECK (estrelas BETWEEN 1 AND 5), polegar smallint CHECK (polegar IN (-1,1)),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.tpl_tempos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  com_modelo boolean NOT NULL,
  segundos integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tpl_modelos, public.tpl_compart, public.tpl_sugestoes, public.tpl_usos TO authenticated;
GRANT SELECT, INSERT ON public.tpl_versoes, public.tpl_tempos TO authenticated;
GRANT ALL ON public.tpl_modelos, public.tpl_versoes, public.tpl_compart, public.tpl_sugestoes, public.tpl_usos, public.tpl_tempos TO service_role;

CREATE OR REPLACE FUNCTION public.fn_tpl_nivel(_m uuid, _u uuid) RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE
    WHEN EXISTS (SELECT 1 FROM tpl_modelos WHERE id=_m AND owner=_u) THEN 'dono'
    WHEN EXISTS (SELECT 1 FROM tpl_compart WHERE modelo_id=_m AND user_id=_u AND nivel='colab') THEN 'colab'
    WHEN EXISTS (SELECT 1 FROM tpl_compart WHERE modelo_id=_m AND user_id=_u) THEN 'leitura'
    WHEN EXISTS (SELECT 1 FROM tpl_modelos WHERE id=_m AND publicacao='publicado') THEN 'publico'
    WHEN public.has_role(_u,'admin') AND EXISTS (SELECT 1 FROM tpl_modelos WHERE id=_m AND publicacao='pendente') THEN 'revisor'
    ELSE NULL END
$$;

ALTER TABLE public.tpl_modelos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tpl_versoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tpl_compart ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tpl_sugestoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tpl_usos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tpl_tempos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ver modelos" ON public.tpl_modelos FOR SELECT TO authenticated USING (public.fn_tpl_nivel(id, auth.uid()) IS NOT NULL);
CREATE POLICY "criar modelo" ON public.tpl_modelos FOR INSERT TO authenticated WITH CHECK (owner = auth.uid() AND publicacao IN ('privado','pendente'));
CREATE POLICY "editar proprio" ON public.tpl_modelos FOR UPDATE TO authenticated USING (owner = auth.uid()) WITH CHECK (owner = auth.uid() AND publicacao IN ('privado','pendente','publicado','recusado'));
CREATE POLICY "apagar proprio" ON public.tpl_modelos FOR DELETE TO authenticated USING (owner = auth.uid());

CREATE POLICY "ver versoes" ON public.tpl_versoes FOR SELECT TO authenticated USING (public.fn_tpl_nivel(modelo_id, auth.uid()) IS NOT NULL);
CREATE POLICY "criar versao" ON public.tpl_versoes FOR INSERT TO authenticated WITH CHECK (autor = auth.uid() AND public.fn_tpl_nivel(modelo_id, auth.uid()) = 'dono');

CREATE POLICY "ver compart" ON public.tpl_compart FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.fn_tpl_nivel(modelo_id, auth.uid()) = 'dono');
CREATE POLICY "dono compart" ON public.tpl_compart FOR ALL TO authenticated USING (public.fn_tpl_nivel(modelo_id, auth.uid()) = 'dono') WITH CHECK (public.fn_tpl_nivel(modelo_id, auth.uid()) = 'dono');
CREATE POLICY "sair compart" ON public.tpl_compart FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "ver sugestoes" ON public.tpl_sugestoes FOR SELECT TO authenticated USING (autor = auth.uid() OR public.fn_tpl_nivel(modelo_id, auth.uid()) = 'dono');
CREATE POLICY "sugerir" ON public.tpl_sugestoes FOR INSERT TO authenticated WITH CHECK (autor = auth.uid() AND status='pendente' AND public.fn_tpl_nivel(modelo_id, auth.uid()) = 'colab');
CREATE POLICY "decidir sugestao" ON public.tpl_sugestoes FOR UPDATE TO authenticated USING (public.fn_tpl_nivel(modelo_id, auth.uid()) = 'dono');

CREATE POLICY "usos proprios" ON public.tpl_usos FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid() AND public.fn_tpl_nivel(modelo_id, auth.uid()) IS NOT NULL);
CREATE POLICY "dono ve usos" ON public.tpl_usos FOR SELECT TO authenticated USING (public.fn_tpl_nivel(modelo_id, auth.uid()) = 'dono');
CREATE POLICY "tempos proprios" ON public.tpl_tempos FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.fn_tpl_convidar(_modelo uuid, _email text, _nivel text) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _u uuid;
BEGIN
  IF public.fn_tpl_nivel(_modelo, auth.uid()) <> 'dono' THEN RAISE EXCEPTION 'sem permissão'; END IF;
  IF _nivel NOT IN ('leitura','colab') THEN RAISE EXCEPTION 'nível inválido'; END IF;
  SELECT id INTO _u FROM auth.users WHERE lower(email) = lower(trim(_email)) LIMIT 1;
  IF _u IS NULL THEN RETURN false; END IF;
  INSERT INTO tpl_compart(modelo_id, user_id, nivel) VALUES (_modelo, _u, _nivel)
    ON CONFLICT (modelo_id, user_id) DO UPDATE SET nivel = EXCLUDED.nivel;
  RETURN true;
END $$;

CREATE OR REPLACE FUNCTION public.fn_tpl_entrar_codigo(_codigo text) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _m uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'sem sessão'; END IF;
  SELECT id INTO _m FROM tpl_modelos WHERE codigo = lower(trim(_codigo));
  IF _m IS NULL THEN RETURN NULL; END IF;
  INSERT INTO tpl_compart(modelo_id, user_id, nivel) SELECT _m, auth.uid(), 'leitura'
    WHERE NOT EXISTS (SELECT 1 FROM tpl_modelos WHERE id=_m AND owner=auth.uid())
    ON CONFLICT DO NOTHING;
  RETURN _m;
END $$;

CREATE OR REPLACE FUNCTION public.fn_tpl_revisar_publicacao(_modelo uuid, _aprovar boolean, _obs text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'apenas administradores'; END IF;
  UPDATE tpl_modelos SET publicacao = CASE WHEN _aprovar THEN 'publicado' ELSE 'recusado' END,
    revisor = auth.uid(), revisao_obs = _obs, revisado_em = now() WHERE id = _modelo AND publicacao = 'pendente';
END $$;

-- dono não pode se autopublicar: só privado/pendente pelo próprio dono
CREATE OR REPLACE FUNCTION public.fn_tpl_guard_pub() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.publicacao IS DISTINCT FROM OLD.publicacao AND NEW.publicacao IN ('publicado','recusado')
     AND NOT public.has_role(auth.uid(),'admin') THEN
    RAISE EXCEPTION 'publicação exige aprovação de administrador';
  END IF;
  NEW.updated_at = now();
  RETURN NEW;
END $$;
CREATE TRIGGER tpl_guard_pub BEFORE UPDATE ON public.tpl_modelos FOR EACH ROW EXECUTE FUNCTION public.fn_tpl_guard_pub();

REVOKE EXECUTE ON FUNCTION public.fn_tpl_convidar(uuid,text,text), public.fn_tpl_entrar_codigo(text), public.fn_tpl_revisar_publicacao(uuid,boolean,text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.fn_tpl_convidar(uuid,text,text), public.fn_tpl_entrar_codigo(text), public.fn_tpl_revisar_publicacao(uuid,boolean,text), public.fn_tpl_nivel(uuid,uuid) TO authenticated;