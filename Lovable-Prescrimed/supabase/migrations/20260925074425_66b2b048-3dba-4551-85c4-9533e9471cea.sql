ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'homologador';

CREATE TABLE public.homologacao_config (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  ativo boolean NOT NULL DEFAULT false,
  email_relatorio text,
  atualizado_por uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.homologacao_config (id) VALUES (true) ON CONFLICT DO NOTHING;
GRANT SELECT, UPDATE ON public.homologacao_config TO authenticated;
GRANT ALL ON public.homologacao_config TO service_role;
ALTER TABLE public.homologacao_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "config leitura" ON public.homologacao_config FOR SELECT TO authenticated USING (true);
CREATE POLICY "config admin" ON public.homologacao_config FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.fn_em_homologacao(_uid uuid DEFAULT auth.uid())
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN (SELECT ativo FROM homologacao_config WHERE id) AND EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = _uid AND role::text IN ('homologador','admin'));
END $$;

CREATE TABLE public.relatorios_homologacao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  user_email text,
  tipo text NOT NULL,
  gravidade text NOT NULL DEFAULT 'media',
  descricao text NOT NULL,
  tela text,
  contexto jsonb NOT NULL DEFAULT '{}'::jsonb,
  captura text,
  status text NOT NULL DEFAULT 'aberto',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.relatorios_homologacao TO authenticated;
GRANT ALL ON public.relatorios_homologacao TO service_role;
ALTER TABLE public.relatorios_homologacao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rel inserir" ON public.relatorios_homologacao FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "rel ver" ON public.relatorios_homologacao FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "rel admin" ON public.relatorios_homologacao FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.homologacao_eventos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  acao text NOT NULL,
  tela text,
  condicao text,
  medicamento text,
  detalhe jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.homologacao_eventos (created_at DESC);
GRANT SELECT, INSERT ON public.homologacao_eventos TO authenticated;
GRANT ALL ON public.homologacao_eventos TO service_role;
ALTER TABLE public.homologacao_eventos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ev inserir" ON public.homologacao_eventos FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND public.fn_em_homologacao());
CREATE POLICY "ev ver" ON public.homologacao_eventos FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.homologacao_edicoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  vinculo_id uuid NOT NULL REFERENCES public.clinical_condition_medication(id) ON DELETE CASCADE,
  antes jsonb NOT NULL,
  depois jsonb NOT NULL,
  validado boolean NOT NULL DEFAULT false,
  promovido boolean NOT NULL DEFAULT false,
  desfeito boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.homologacao_edicoes TO authenticated;
GRANT ALL ON public.homologacao_edicoes TO service_role;
ALTER TABLE public.homologacao_edicoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ed ver" ON public.homologacao_edicoes FOR SELECT TO authenticated USING (public.fn_em_homologacao() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "ed validar" ON public.homologacao_edicoes FOR UPDATE TO authenticated USING (public.fn_em_homologacao());

-- Etiqueta nos registros gerados
ALTER TABLE public.prescricoes_historico ADD COLUMN IF NOT EXISTS is_homologacao boolean NOT NULL DEFAULT false;
ALTER TABLE public.documentos_gerados ADD COLUMN IF NOT EXISTS is_homologacao boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.fn_marcar_homologacao() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN NEW.is_homologacao := public.fn_em_homologacao(auth.uid()); RETURN NEW; END $$;
CREATE TRIGGER trg_homolog_presc BEFORE INSERT ON public.prescricoes_historico FOR EACH ROW EXECUTE FUNCTION public.fn_marcar_homologacao();
CREATE TRIGGER trg_homolog_docs BEFORE INSERT ON public.documentos_gerados FOR EACH ROW EXECUTE FUNCTION public.fn_marcar_homologacao();

-- Edição rápida com histórico
CREATE OR REPLACE FUNCTION public.fn_homologacao_editar_vinculo(_id uuid, _dose_adulto text, _dose_pediatrica text, _instrucao text, _instrucao_ped text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v record;
BEGIN
  IF NOT public.fn_em_homologacao() THEN RAISE EXCEPTION 'Somente no modo homologação'; END IF;
  IF coalesce(trim(_instrucao),'') = '' THEN RAISE EXCEPTION 'Instrução ao paciente é obrigatória'; END IF;
  SELECT dose_adulto, dose_pediatrica, instrucao_paciente, instrucao_paciente_ped INTO v FROM clinical_condition_medication WHERE id = _id;
  UPDATE clinical_condition_medication SET dose_adulto=_dose_adulto, dose_pediatrica=_dose_pediatrica,
    instrucao_paciente=_instrucao, instrucao_paciente_ped=nullif(trim(_instrucao_ped),''), updated_at=now() WHERE id=_id;
  INSERT INTO homologacao_edicoes (vinculo_id, antes, depois) VALUES (_id, to_jsonb(v),
    jsonb_build_object('dose_adulto',_dose_adulto,'dose_pediatrica',_dose_pediatrica,'instrucao_paciente',_instrucao,'instrucao_paciente_ped',_instrucao_ped));
  INSERT INTO homologacao_eventos (acao, detalhe) VALUES ('edicao_rapida', jsonb_build_object('vinculo_id',_id));
END $$;

CREATE OR REPLACE FUNCTION public.fn_homologacao_desfazer(_edicao uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE e record;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Apenas admin'; END IF;
  SELECT * INTO e FROM homologacao_edicoes WHERE id=_edicao AND NOT desfeito;
  IF NOT FOUND THEN RETURN; END IF;
  UPDATE clinical_condition_medication SET dose_adulto=e.antes->>'dose_adulto', dose_pediatrica=e.antes->>'dose_pediatrica',
    instrucao_paciente=e.antes->>'instrucao_paciente', instrucao_paciente_ped=e.antes->>'instrucao_paciente_ped', updated_at=now() WHERE id=e.vinculo_id;
  UPDATE homologacao_edicoes SET desfeito=true WHERE id=_edicao;
END $$;

CREATE OR REPLACE FUNCTION public.fn_homologacao_promover()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n integer;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Apenas admin'; END IF;
  WITH alvo AS (SELECT DISTINCT vinculo_id FROM homologacao_edicoes WHERE validado AND NOT promovido AND NOT desfeito)
  UPDATE clinical_condition_medication c SET review_status='aprovado', revisado_por=auth.uid(), revisado_em=now()
  FROM alvo WHERE c.id = alvo.vinculo_id;
  GET DIAGNOSTICS n = ROW_COUNT;
  UPDATE homologacao_edicoes SET promovido=true WHERE validado AND NOT desfeito;
  RETURN n;
END $$;

CREATE OR REPLACE FUNCTION public.fn_homologacao_resumo(_desde timestamptz DEFAULT now() - interval '7 days')
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') AND current_user <> 'service_role' THEN RAISE EXCEPTION 'Apenas admin'; END IF;
  RETURN jsonb_build_object(
    'usuarios', (SELECT coalesce(jsonb_agg(x),'[]') FROM (SELECT coalesce(p.email, e.user_id::text) nome, count(*) total FROM homologacao_eventos e LEFT JOIN auth.users p ON p.id=e.user_id WHERE e.created_at>=_desde GROUP BY 1 ORDER BY 2 DESC LIMIT 10) x),
    'condicoes', (SELECT coalesce(jsonb_agg(x),'[]') FROM (SELECT condicao nome, count(*) total FROM homologacao_eventos WHERE created_at>=_desde AND condicao IS NOT NULL GROUP BY 1 ORDER BY 2 DESC LIMIT 10) x),
    'medicamentos', (SELECT coalesce(jsonb_agg(x),'[]') FROM (SELECT medicamento nome, count(*) total FROM homologacao_eventos WHERE created_at>=_desde AND acao='medicamento_selecionado' GROUP BY 1 ORDER BY 2 DESC LIMIT 10) x),
    'alertas', (SELECT coalesce(jsonb_agg(x),'[]') FROM (SELECT coalesce(detalhe->>'alerta','(sem nome)') nome, count(*) total FROM homologacao_eventos WHERE created_at>=_desde AND acao='alerta_ignorado' GROUP BY 1 ORDER BY 2 DESC LIMIT 10) x),
    'problemas', (SELECT coalesce(jsonb_agg(x),'[]') FROM (SELECT tipo, gravidade, count(*) total FROM relatorios_homologacao WHERE created_at>=_desde GROUP BY 1,2 ORDER BY 3 DESC) x),
    'documentos', (SELECT count(*) FROM homologacao_eventos WHERE created_at>=_desde AND acao='documento_emitido'),
    'eventos', (SELECT count(*) FROM homologacao_eventos WHERE created_at>=_desde)
  );
END $$;