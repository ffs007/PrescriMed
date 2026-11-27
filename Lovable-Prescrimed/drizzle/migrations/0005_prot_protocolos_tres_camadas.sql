CREATE TABLE public.prot_equipes (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), nome text NOT NULL, tipo text NOT NULL DEFAULT 'outro', ativo boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.prot_membros (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), equipe_id uuid NOT NULL REFERENCES public.prot_equipes(id) ON DELETE CASCADE, user_id uuid NOT NULL, papel text NOT NULL DEFAULT 'membro' CHECK (papel IN ('membro','editor','coordenador')), created_at timestamptz NOT NULL DEFAULT now(), UNIQUE (equipe_id, user_id));
CREATE TABLE public.prot_instancias (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), nome text NOT NULL UNIQUE, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.prot_protocolos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  camada text NOT NULL CHECK (camada IN ('pessoal','equipe','institucional')),
  owner uuid NOT NULL,
  equipe_id uuid REFERENCES public.prot_equipes(id) ON DELETE SET NULL,
  proto_origem text,
  titulo text NOT NULL,
  status text NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho','pendente','aprovado','recusado')),
  obrigatorio boolean NOT NULL DEFAULT false,
  travado boolean NOT NULL DEFAULT false,
  instancia_id uuid REFERENCES public.prot_instancias(id) ON DELETE SET NULL,
  aprovado_por uuid, aprovado_em timestamptz, aprovador_nome text, aprovador_crm text,
  proxima_revisao date,
  prazo_sugestao_dias int NOT NULL DEFAULT 7,
  arquivado boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX prot_inst_origem_uq ON public.prot_protocolos (proto_origem) WHERE camada = 'institucional';
CREATE TABLE public.prot_versoes (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), protocolo_id uuid NOT NULL REFERENCES public.prot_protocolos(id) ON DELETE CASCADE, autor uuid NOT NULL, numero int NOT NULL, conteudo jsonb NOT NULL DEFAULT '{}', changelog text NOT NULL DEFAULT '', critico boolean NOT NULL DEFAULT false, hash text, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE (protocolo_id, numero));
CREATE TABLE public.prot_sugestoes (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), protocolo_id uuid NOT NULL REFERENCES public.prot_protocolos(id) ON DELETE CASCADE, autor uuid NOT NULL, tipo text NOT NULL DEFAULT 'alteracao' CHECK (tipo IN ('adicao','remocao','alteracao')), descricao text NOT NULL, justificativa text NOT NULL, evidencias text NOT NULL DEFAULT '', impacto text NOT NULL DEFAULT '', barreiras text NOT NULL DEFAULT '', mitigacao text NOT NULL DEFAULT '', prioridade text NOT NULL DEFAULT 'media' CHECK (prioridade IN ('alta','media','baixa')), prazo date, status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','em_analise','aprovada','recusada','implantada')), resposta text, decidido_por uuid, analise_em timestamptz, decidido_em timestamptz, implantado_em timestamptz, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.prot_eventos (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), protocolo_id uuid NOT NULL REFERENCES public.prot_protocolos(id) ON DELETE CASCADE, versao_id uuid, user_id uuid NOT NULL, tipo text NOT NULL CHECK (tipo IN ('abertura','aplicacao','emissao','desvio')), detalhes jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX prot_eventos_p ON public.prot_eventos (protocolo_id, created_at);
CREATE TABLE public.prot_leituras (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, versao_id uuid NOT NULL REFERENCES public.prot_versoes(id) ON DELETE CASCADE, quiz_ok boolean NOT NULL DEFAULT false, acertos int, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE (user_id, versao_id));
CREATE TABLE public.prot_alertas (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), protocolo_id uuid NOT NULL REFERENCES public.prot_protocolos(id) ON DELETE CASCADE, tipo text NOT NULL CHECK (tipo IN ('pubmed','revisao','manual')), titulo text NOT NULL, url text, resumo text, chave text, resolvido boolean NOT NULL DEFAULT false, created_by uuid, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE (protocolo_id, chave));
CREATE TABLE public.prot_job_state (id text PRIMARY KEY, locked_until timestamptz, last_run timestamptz, cursor int NOT NULL DEFAULT 0, paused_reason text);

GRANT SELECT ON public.prot_equipes, public.prot_membros, public.prot_instancias TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.prot_equipes, public.prot_membros, public.prot_instancias TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.prot_protocolos, public.prot_sugestoes, public.prot_alertas, public.prot_leituras TO authenticated;
GRANT SELECT, INSERT ON public.prot_versoes, public.prot_eventos TO authenticated;
GRANT ALL ON public.prot_equipes, public.prot_membros, public.prot_instancias, public.prot_protocolos, public.prot_versoes, public.prot_sugestoes, public.prot_eventos, public.prot_leituras, public.prot_alertas, public.prot_job_state TO service_role;

ALTER TABLE public.prot_equipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prot_membros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prot_instancias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prot_protocolos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prot_versoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prot_sugestoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prot_eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prot_leituras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prot_alertas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prot_job_state ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.fn_prot_papel(_equipe uuid) RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT papel FROM public.prot_membros WHERE equipe_id = _equipe AND user_id = auth.uid() LIMIT 1 $$;

-- nivel: admin | dono | coordenador | editor | leitor | null
CREATE OR REPLACE FUNCTION public.fn_prot_nivel(_p uuid) RETURNS text LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.prot_protocolos; pap text;
BEGIN
  SELECT * INTO r FROM public.prot_protocolos WHERE id = _p; IF NOT FOUND THEN RETURN NULL; END IF;
  IF public.has_role(auth.uid(), 'admin') THEN RETURN 'admin'; END IF;
  IF r.camada = 'pessoal' THEN RETURN CASE WHEN r.owner = auth.uid() THEN 'dono' END; END IF;
  IF r.camada = 'equipe' THEN
    pap := public.fn_prot_papel(r.equipe_id);
    IF pap IS NOT NULL THEN RETURN pap; END IF;
    RETURN CASE WHEN r.owner = auth.uid() THEN 'leitor' END;
  END IF;
  RETURN CASE WHEN r.status = 'aprovado' OR r.owner = auth.uid() THEN 'leitor' END;
END $$;

CREATE OR REPLACE FUNCTION public.fn_prot_pode_editar(_p uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE WHEN p.travado AND NOT public.has_role(auth.uid(),'admin') THEN false
    ELSE coalesce(public.fn_prot_nivel(_p), '') IN ('admin','dono','coordenador','editor') END
  FROM public.prot_protocolos p WHERE p.id = _p $$;

CREATE POLICY "auth le equipes" ON public.prot_equipes FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin escreve equipes" ON public.prot_equipes FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "auth le membros" ON public.prot_membros FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin escreve membros" ON public.prot_membros FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "auth le instancias" ON public.prot_instancias FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin escreve instancias" ON public.prot_instancias FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "ver protocolos" ON public.prot_protocolos FOR SELECT TO authenticated USING (owner = auth.uid() OR public.fn_prot_nivel(id) IS NOT NULL);
CREATE POLICY "criar protocolos" ON public.prot_protocolos FOR INSERT TO authenticated WITH CHECK (owner = auth.uid() AND (
  camada = 'pessoal' OR (camada = 'equipe' AND public.fn_prot_papel(equipe_id) IN ('editor','coordenador')) OR public.has_role(auth.uid(),'admin')));
CREATE POLICY "editar protocolos" ON public.prot_protocolos FOR UPDATE TO authenticated USING (public.fn_prot_pode_editar(id)) WITH CHECK (true);

CREATE POLICY "ver versoes" ON public.prot_versoes FOR SELECT TO authenticated USING (autor = auth.uid() OR public.fn_prot_nivel(protocolo_id) IS NOT NULL);
CREATE POLICY "criar versoes" ON public.prot_versoes FOR INSERT TO authenticated WITH CHECK (autor = auth.uid() AND public.fn_prot_pode_editar(protocolo_id));

CREATE POLICY "ver sugestoes" ON public.prot_sugestoes FOR SELECT TO authenticated USING (autor = auth.uid() OR coalesce(public.fn_prot_nivel(protocolo_id),'') IN ('admin','coordenador','editor','dono'));
CREATE POLICY "criar sugestoes" ON public.prot_sugestoes FOR INSERT TO authenticated WITH CHECK (autor = auth.uid() AND public.fn_prot_nivel(protocolo_id) IS NOT NULL);
CREATE POLICY "decidir sugestoes" ON public.prot_sugestoes FOR UPDATE TO authenticated USING (coalesce(public.fn_prot_nivel(protocolo_id),'') IN ('admin','coordenador')) WITH CHECK (true);

CREATE POLICY "registrar eventos" ON public.prot_eventos FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "ver eventos" ON public.prot_eventos FOR SELECT TO authenticated USING (user_id = auth.uid() OR coalesce(public.fn_prot_nivel(protocolo_id),'') IN ('admin','coordenador'));

CREATE POLICY "leituras proprias" ON public.prot_leituras FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "admin ve leituras" ON public.prot_leituras FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE POLICY "ver alertas" ON public.prot_alertas FOR SELECT TO authenticated USING (coalesce(public.fn_prot_nivel(protocolo_id),'') IN ('admin','coordenador','editor','dono'));
CREATE POLICY "criar alertas" ON public.prot_alertas FOR INSERT TO authenticated WITH CHECK (coalesce(public.fn_prot_nivel(protocolo_id),'') IN ('admin','coordenador','dono'));
CREATE POLICY "resolver alertas" ON public.prot_alertas FOR UPDATE TO authenticated USING (coalesce(public.fn_prot_nivel(protocolo_id),'') IN ('admin','coordenador','dono')) WITH CHECK (true);

-- Regras de fluxo: aprovação só por coordenador/admin; institucional só admin; recusa exige justificativa.
CREATE OR REPLACE FUNCTION public.fn_prot_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE nv text := public.fn_prot_nivel(NEW.id);
BEGIN
  IF auth.uid() IS NULL THEN RETURN NEW; END IF;
  IF NEW.owner <> OLD.owner OR NEW.camada <> OLD.camada AND nv <> 'admin' AND NOT (OLD.camada='pessoal' AND NEW.camada='equipe' AND public.fn_prot_papel(NEW.equipe_id) IS NOT NULL) THEN
    IF NEW.owner <> OLD.owner THEN RAISE EXCEPTION 'dono não pode ser alterado'; END IF;
    RAISE EXCEPTION 'mudança de camada não permitida';
  END IF;
  IF (NEW.travado <> OLD.travado OR NEW.obrigatorio <> OLD.obrigatorio) AND nv <> 'admin' THEN RAISE EXCEPTION 'só administradores travam ou tornam obrigatório'; END IF;
  IF NEW.status IN ('aprovado','recusado') AND NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.camada = 'institucional' AND nv <> 'admin' THEN RAISE EXCEPTION 'protocolo institucional exige aprovação de uma instância (administrador)'; END IF;
    IF NEW.camada = 'equipe' AND nv NOT IN ('admin','coordenador') THEN RAISE EXCEPTION 'aprovação exclusiva do coordenador da equipe'; END IF;
    IF NEW.status = 'aprovado' THEN NEW.aprovado_por := auth.uid(); NEW.aprovado_em := now(); END IF;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;
CREATE TRIGGER prot_guard BEFORE UPDATE ON public.prot_protocolos FOR EACH ROW EXECUTE FUNCTION public.fn_prot_guard();

CREATE OR REPLACE FUNCTION public.fn_prot_sug_guard() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.prazo IS NULL THEN
      SELECT (now()::date + (p.prazo_sugestao_dias * 7 / 5) * interval '1 day')::date INTO NEW.prazo FROM public.prot_protocolos p WHERE p.id = NEW.protocolo_id;
    END IF;
    NEW.status := 'pendente'; RETURN NEW;
  END IF;
  IF NEW.status = 'recusada' AND length(trim(coalesce(NEW.resposta,''))) < 10 THEN RAISE EXCEPTION 'recusa exige justificativa formal (mínimo 10 caracteres)'; END IF;
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.decidido_por := auth.uid();
    IF NEW.status = 'em_analise' THEN NEW.analise_em := now(); END IF;
    IF NEW.status IN ('aprovada','recusada') THEN NEW.decidido_em := now(); END IF;
    IF NEW.status = 'implantada' THEN NEW.implantado_em := now(); END IF;
  END IF;
  NEW.autor := OLD.autor; NEW.descricao := OLD.descricao; NEW.justificativa := OLD.justificativa;
  RETURN NEW;
END $$;
CREATE TRIGGER prot_sug_guard BEFORE INSERT OR UPDATE ON public.prot_sugestoes FOR EACH ROW EXECUTE FUNCTION public.fn_prot_sug_guard();

CREATE OR REPLACE FUNCTION public.fn_prot_versao_num() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  SELECT coalesce(max(numero),0)+1 INTO NEW.numero FROM public.prot_versoes WHERE protocolo_id = NEW.protocolo_id;
  UPDATE public.prot_protocolos SET updated_at = now() WHERE id = NEW.protocolo_id;
  RETURN NEW;
END $$;
CREATE TRIGGER prot_versao_num BEFORE INSERT ON public.prot_versoes FOR EACH ROW EXECUTE FUNCTION public.fn_prot_versao_num();

INSERT INTO public.prot_instancias (nome) VALUES ('Coordenação médica'),('Direção técnica'),('Comitê de padronização terapêutica'),('Comissão de controle de infecção (CCIH)'),('Núcleo de segurança do paciente') ON CONFLICT DO NOTHING;
INSERT INTO public.prot_job_state (id) VALUES ('pubmed') ON CONFLICT DO NOTHING;