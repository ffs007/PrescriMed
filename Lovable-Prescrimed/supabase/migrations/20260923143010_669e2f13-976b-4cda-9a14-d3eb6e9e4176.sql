
-- Pilar 2: anamnese direcionada
CREATE TABLE public.condicao_anamnese (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  condicao_nome text NOT NULL,
  condicao_normalizada text GENERATED ALWAYS AS (public.clin_normalize(condicao_nome)) STORED,
  care_context vinculo_contexto NOT NULL DEFAULT 'qualquer',
  bloco text NOT NULL,
  ordem integer NOT NULL DEFAULT 0,
  pergunta text NOT NULL,
  por_que text,
  resposta_esperada text,
  red_flag boolean NOT NULL DEFAULT false,
  gravidade text,
  populacao text,
  fonte text,
  nivel_evidencia text,
  review_status vinculo_status NOT NULL DEFAULT 'pending_review',
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.condicao_anamnese TO authenticated;
GRANT ALL ON public.condicao_anamnese TO service_role;
ALTER TABLE public.condicao_anamnese ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anamnese leitura clinica" ON public.condicao_anamnese FOR SELECT TO authenticated USING (ativo);
CREATE POLICY "anamnese escrita curadoria" ON public.condicao_anamnese FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'revisor'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'revisor'));
CREATE INDEX idx_condicao_anamnese_cond ON public.condicao_anamnese (condicao_normalizada, care_context);

-- Pilar 3: exame fisico direcionado
CREATE TABLE public.condicao_exame_fisico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  condicao_nome text NOT NULL,
  condicao_normalizada text GENERATED ALWAYS AS (public.clin_normalize(condicao_nome)) STORED,
  care_context vinculo_contexto NOT NULL DEFAULT 'qualquer',
  sistema text NOT NULL,
  ordem integer NOT NULL DEFAULT 0,
  o_que_procurar text NOT NULL,
  achado_esperado text,
  confirma_diagnostico boolean NOT NULL DEFAULT false,
  sugere_diferencial text,
  indica_gravidade boolean NOT NULL DEFAULT false,
  muda_conduta_imediata text,
  gravidade text,
  populacao text,
  fonte text,
  nivel_evidencia text,
  review_status vinculo_status NOT NULL DEFAULT 'pending_review',
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.condicao_exame_fisico TO authenticated;
GRANT ALL ON public.condicao_exame_fisico TO service_role;
ALTER TABLE public.condicao_exame_fisico ENABLE ROW LEVEL SECURITY;
CREATE POLICY "exame fisico leitura clinica" ON public.condicao_exame_fisico FOR SELECT TO authenticated USING (ativo);
CREATE POLICY "exame fisico escrita curadoria" ON public.condicao_exame_fisico FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'revisor'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'revisor'));
CREATE INDEX idx_condicao_exame_fisico_cond ON public.condicao_exame_fisico (condicao_normalizada, care_context);

-- Pilar 5: encaminhamento
CREATE TABLE public.condicao_encaminhamento_modelo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  condicao_nome text NOT NULL,
  condicao_normalizada text GENERATED ALWAYS AS (public.clin_normalize(condicao_nome)) STORED,
  care_context vinculo_contexto NOT NULL DEFAULT 'qualquer',
  tipo text NOT NULL,
  especialidade_destino text,
  titulo text NOT NULL,
  corpo text NOT NULL,
  campos_obrigatorios text[] NOT NULL DEFAULT '{}',
  nivel_urgencia text,
  solicitacoes_ao_servico text,
  fonte text,
  review_status vinculo_status NOT NULL DEFAULT 'pending_review',
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.condicao_encaminhamento_modelo TO authenticated;
GRANT ALL ON public.condicao_encaminhamento_modelo TO service_role;
ALTER TABLE public.condicao_encaminhamento_modelo ENABLE ROW LEVEL SECURITY;
CREATE POLICY "encaminhamento leitura clinica" ON public.condicao_encaminhamento_modelo FOR SELECT TO authenticated USING (ativo);
CREATE POLICY "encaminhamento escrita curadoria" ON public.condicao_encaminhamento_modelo FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'revisor'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'revisor'));
CREATE INDEX idx_condicao_encaminhamento_cond ON public.condicao_encaminhamento_modelo (condicao_normalizada, care_context);

-- Pilar 6: transferencia inter-hospitalar
CREATE TABLE public.condicao_transferencia_modelo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  condicao_nome text NOT NULL,
  condicao_normalizada text GENERATED ALWAYS AS (public.clin_normalize(condicao_nome)) STORED,
  care_context vinculo_contexto NOT NULL DEFAULT 'qualquer',
  tipo text NOT NULL,
  complexidade_destino text,
  titulo text NOT NULL,
  corpo text NOT NULL,
  campos_obrigatorios text[] NOT NULL DEFAULT '{}',
  escores_sugeridos text[] NOT NULL DEFAULT '{}',
  solicitacoes_ao_servico text,
  riscos_transporte text,
  fonte text,
  review_status vinculo_status NOT NULL DEFAULT 'pending_review',
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.condicao_transferencia_modelo TO authenticated;
GRANT ALL ON public.condicao_transferencia_modelo TO service_role;
ALTER TABLE public.condicao_transferencia_modelo ENABLE ROW LEVEL SECURITY;
CREATE POLICY "transferencia leitura clinica" ON public.condicao_transferencia_modelo FOR SELECT TO authenticated USING (ativo);
CREATE POLICY "transferencia escrita curadoria" ON public.condicao_transferencia_modelo FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'revisor'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'revisor'));
CREATE INDEX idx_condicao_transferencia_cond ON public.condicao_transferencia_modelo (condicao_normalizada, care_context);

-- Pilar 1: aprofundamento do vinculo terapeutico
ALTER TABLE public.clinical_condition_medication
  ADD COLUMN IF NOT EXISTS linha_tratamento text,
  ADD COLUMN IF NOT EXISTS gravidade text,
  ADD COLUMN IF NOT EXISTS alternativa_alergia text,
  ADD COLUMN IF NOT EXISTS equivalencia_via text,
  ADD COLUMN IF NOT EXISTS contraindicacoes text,
  ADD COLUMN IF NOT EXISTS ajuste_renal text,
  ADD COLUMN IF NOT EXISTS ajuste_hepatico text,
  ADD COLUMN IF NOT EXISTS monitorizacao text,
  ADD COLUMN IF NOT EXISTS efeitos_adversos text,
  ADD COLUMN IF NOT EXISTS gestacao_lactacao text,
  ADD COLUMN IF NOT EXISTS medidas_nao_farmacologicas text,
  ADD COLUMN IF NOT EXISTS nivel_evidencia text;

-- triggers de updated_at
CREATE OR REPLACE FUNCTION public.fn_set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_condicao_anamnese_upd BEFORE UPDATE ON public.condicao_anamnese FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();
CREATE TRIGGER trg_condicao_exame_fisico_upd BEFORE UPDATE ON public.condicao_exame_fisico FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();
CREATE TRIGGER trg_condicao_encaminhamento_upd BEFORE UPDATE ON public.condicao_encaminhamento_modelo FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();
CREATE TRIGGER trg_condicao_transferencia_upd BEFORE UPDATE ON public.condicao_transferencia_modelo FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();
