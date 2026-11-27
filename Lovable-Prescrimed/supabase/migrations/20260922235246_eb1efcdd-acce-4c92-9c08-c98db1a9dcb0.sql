CREATE OR REPLACE VIEW public.vw_patologia_completa AS
SELECT
  s.id,
  s.codigo,
  s.nome,
  s.sinonimos,
  s.ambientes,
  s.cid_sugerido,
  s.gravidade_tipica,
  s.categoria,
  s.medicamentos_ambulatoriais,
  s.medicamentos_hospitalares,
  s.exames_comuns,
  s.orientacoes,
  s.sinais_alerta,
  s.status,
  s.fonte,
  COALESCE(
    jsonb_agg(to_jsonb(pm) ORDER BY pm.prioridade)
      FILTER (WHERE pm.id IS NOT NULL),
    '[]'::jsonb
  ) AS medicamentos_vinculados
FROM public.base_sindromes AS s
LEFT JOIN public.patologia_medicamento AS pm
  ON pm.patologia_normalizada = public.iv_normalize_text(s.nome)
GROUP BY
  s.id, s.codigo, s.nome, s.sinonimos, s.ambientes, s.cid_sugerido,
  s.gravidade_tipica, s.categoria, s.medicamentos_ambulatoriais,
  s.medicamentos_hospitalares, s.exames_comuns, s.orientacoes,
  s.sinais_alerta, s.status, s.fonte;

REVOKE ALL ON public.vw_patologia_completa FROM PUBLIC, anon;
GRANT SELECT ON public.vw_patologia_completa TO authenticated, service_role;