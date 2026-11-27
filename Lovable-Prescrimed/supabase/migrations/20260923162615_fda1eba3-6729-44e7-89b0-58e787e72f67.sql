CREATE TABLE public.catalogo_medicamentos_legado (
  id_legado integer PRIMARY KEY,
  nome text NOT NULL,
  categoria text,
  dados jsonb NOT NULL,
  status_conteudo text NOT NULL DEFAULT 'legado_a_revisar',
  fonte text NOT NULL DEFAULT 'Catálogo interno PrescriMed (código legado)',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.catalogo_patologias_legado (
  id_legado integer PRIMARY KEY,
  nome text NOT NULL,
  cid text,
  categoria text,
  dados jsonb NOT NULL,
  status_conteudo text NOT NULL DEFAULT 'legado_a_revisar',
  fonte text NOT NULL DEFAULT 'Catálogo interno PrescriMed (código legado)',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.catalogo_protocolos_legado (
  patologia_id_legado integer PRIMARY KEY,
  contexto text,
  sugestoes jsonb NOT NULL,
  status_conteudo text NOT NULL DEFAULT 'legado_a_revisar',
  fonte text NOT NULL DEFAULT 'Catálogo interno PrescriMed (código legado)',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.catalogo_exames_legado (
  id_legado text PRIMARY KEY,
  nome text NOT NULL,
  categoria text,
  justificativa_padrao text,
  sinonimos text[] NOT NULL DEFAULT '{}',
  status_conteudo text NOT NULL DEFAULT 'legado_a_revisar',
  fonte text NOT NULL DEFAULT 'Catálogo interno PrescriMed (código legado)',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.catalogo_medicamentos_overlay (
  id_legado integer PRIMARY KEY,
  nome text,
  classe_terapeutica text,
  dados jsonb NOT NULL,
  status_conteudo text NOT NULL DEFAULT 'legado_a_revisar',
  fonte text NOT NULL DEFAULT 'Catálogo interno PrescriMed (código legado)',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.catalogo_medicamentos_legado TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.catalogo_medicamentos_legado TO authenticated;
GRANT ALL ON public.catalogo_medicamentos_legado TO service_role;
GRANT SELECT ON public.catalogo_patologias_legado TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.catalogo_patologias_legado TO authenticated;
GRANT ALL ON public.catalogo_patologias_legado TO service_role;
GRANT SELECT ON public.catalogo_protocolos_legado TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.catalogo_protocolos_legado TO authenticated;
GRANT ALL ON public.catalogo_protocolos_legado TO service_role;
GRANT SELECT ON public.catalogo_exames_legado TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.catalogo_exames_legado TO authenticated;
GRANT ALL ON public.catalogo_exames_legado TO service_role;
GRANT SELECT ON public.catalogo_medicamentos_overlay TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.catalogo_medicamentos_overlay TO authenticated;
GRANT ALL ON public.catalogo_medicamentos_overlay TO service_role;

ALTER TABLE public.catalogo_medicamentos_legado ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalogo_patologias_legado ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalogo_protocolos_legado ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalogo_exames_legado ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalogo_medicamentos_overlay ENABLE ROW LEVEL SECURITY;

CREATE POLICY "catalogo_med_legado_read" ON public.catalogo_medicamentos_legado FOR SELECT TO authenticated USING (true);
CREATE POLICY "catalogo_med_legado_write" ON public.catalogo_medicamentos_legado FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'revisor'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'revisor'));

CREATE POLICY "catalogo_pat_legado_read" ON public.catalogo_patologias_legado FOR SELECT TO authenticated USING (true);
CREATE POLICY "catalogo_pat_legado_write" ON public.catalogo_patologias_legado FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'revisor'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'revisor'));

CREATE POLICY "catalogo_prot_legado_read" ON public.catalogo_protocolos_legado FOR SELECT TO authenticated USING (true);
CREATE POLICY "catalogo_prot_legado_write" ON public.catalogo_protocolos_legado FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'revisor'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'revisor'));

CREATE POLICY "catalogo_exames_legado_read" ON public.catalogo_exames_legado FOR SELECT TO authenticated USING (true);
CREATE POLICY "catalogo_exames_legado_write" ON public.catalogo_exames_legado FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'revisor'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'revisor'));

CREATE POLICY "catalogo_overlay_read" ON public.catalogo_medicamentos_overlay FOR SELECT TO authenticated USING (true);
CREATE POLICY "catalogo_overlay_write" ON public.catalogo_medicamentos_overlay FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'revisor'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'revisor'));

CREATE TRIGGER trg_catalogo_med_legado_updated BEFORE UPDATE ON public.catalogo_medicamentos_legado FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_generic();
CREATE TRIGGER trg_catalogo_pat_legado_updated BEFORE UPDATE ON public.catalogo_patologias_legado FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_generic();
CREATE TRIGGER trg_catalogo_prot_legado_updated BEFORE UPDATE ON public.catalogo_protocolos_legado FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_generic();
CREATE TRIGGER trg_catalogo_exames_legado_updated BEFORE UPDATE ON public.catalogo_exames_legado FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_generic();
CREATE TRIGGER trg_catalogo_overlay_updated BEFORE UPDATE ON public.catalogo_medicamentos_overlay FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_generic();