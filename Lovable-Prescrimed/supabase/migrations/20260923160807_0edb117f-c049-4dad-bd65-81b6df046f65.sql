CREATE TYPE public.atendimento_ambiente AS ENUM ('ambulatorial','ps','emergencia','hospitalar','uti');
CREATE TYPE public.atendimento_status AS ENUM ('em_andamento','encerrado','cancelado');

CREATE TABLE public.pacientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  medico_id uuid NOT NULL DEFAULT auth.uid(),
  nome text NOT NULL,
  data_nascimento date,
  sexo text,
  peso_kg numeric(6,2),
  alergias text,
  funcao_renal text,
  documento text,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pacientes TO authenticated;
GRANT ALL ON public.pacientes TO service_role;
ALTER TABLE public.pacientes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pacientes_own" ON public.pacientes FOR ALL TO authenticated
  USING (medico_id = auth.uid()) WITH CHECK (medico_id = auth.uid());

CREATE TABLE public.atendimentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id uuid NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  medico_id uuid NOT NULL DEFAULT auth.uid(),
  ambiente public.atendimento_ambiente NOT NULL DEFAULT 'ambulatorial',
  instituicao text,
  unidade text,
  convenio text,
  sinais_vitais jsonb NOT NULL DEFAULT '{}'::jsonb,
  hipotese_diagnostica text,
  cid_principal text,
  cids_secundarios text[] NOT NULL DEFAULT '{}',
  data_hora_inicio timestamptz NOT NULL DEFAULT now(),
  data_hora_fim timestamptz,
  status public.atendimento_status NOT NULL DEFAULT 'em_andamento',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.atendimentos TO authenticated;
GRANT ALL ON public.atendimentos TO service_role;
ALTER TABLE public.atendimentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "atendimentos_own" ON public.atendimentos FOR ALL TO authenticated
  USING (medico_id = auth.uid()) WITH CHECK (medico_id = auth.uid());

CREATE INDEX idx_pacientes_medico ON public.pacientes (medico_id, created_at DESC);
CREATE INDEX idx_atendimentos_medico_status ON public.atendimentos (medico_id, status, data_hora_inicio DESC);
CREATE INDEX idx_atendimentos_paciente ON public.atendimentos (paciente_id, data_hora_inicio DESC);

ALTER TABLE public.documentos_gerados ADD COLUMN atendimento_id uuid REFERENCES public.atendimentos(id) ON DELETE SET NULL;
ALTER TABLE public.prescricoes_historico ADD COLUMN atendimento_id uuid REFERENCES public.atendimentos(id) ON DELETE SET NULL;
CREATE INDEX idx_documentos_gerados_atendimento ON public.documentos_gerados (atendimento_id);
CREATE INDEX idx_prescricoes_historico_atendimento ON public.prescricoes_historico (atendimento_id);

CREATE TRIGGER trg_pacientes_updated BEFORE UPDATE ON public.pacientes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_generic();
CREATE TRIGGER trg_atendimentos_updated BEFORE UPDATE ON public.atendimentos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_generic();