ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS psx_safety jsonb;
CREATE TABLE public.safety_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  tipo text NOT NULL,
  dominio text NOT NULL,
  medicamento text,
  motivo text,
  fonte text,
  justificativa text,
  contexto jsonb NOT NULL DEFAULT '{}'::jsonb
);
GRANT SELECT, INSERT ON public.safety_events TO authenticated;
GRANT ALL ON public.safety_events TO service_role;
ALTER TABLE public.safety_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own insert" ON public.safety_events FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "own or admin read" ON public.safety_events FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE INDEX safety_events_user_idx ON public.safety_events(user_id, created_at DESC);