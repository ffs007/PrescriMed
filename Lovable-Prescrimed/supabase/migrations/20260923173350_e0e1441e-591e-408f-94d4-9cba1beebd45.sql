CREATE OR REPLACE FUNCTION public.fn_norm_quadro(p text)
RETURNS text LANGUAGE sql IMMUTABLE PARALLEL SAFE SET search_path TO 'public','extensions'
AS $$ SELECT trim(regexp_replace(lower(extensions.unaccent(coalesce(p,''))), '[^a-z0-9]+', ' ', 'g')) $$;

CREATE OR REPLACE FUNCTION public.fn_quadros_ambiente(
  p_ambiente text, p_busca text DEFAULT NULL, p_limit int DEFAULT 50, p_offset int DEFAULT 0)
RETURNS TABLE(total bigint, uid text, nome text, cid text, categoria text, is_emergencia boolean,
  sinonimos text[], meds jsonb, hospital_meds jsonb, subtypes jsonb,
  ambientes text[], gravidade text, especialidade text, sistema text, frequencia int,
  gravidade_por_ambiente jsonb, frequencia_por_ambiente jsonb)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path TO 'public','extensions'
AS $$
WITH src AS (
  SELECT r.id::text AS id, r.nome_patologia, r.cid10, r.categoria_clinica, r.sinonimos::text AS sinonimos, r.subtipo::text AS subtipo, r.is_emergencia::text AS is_em, 0 AS ord
  FROM base_patologias_ref r
  UNION ALL
  SELECT c.id::text, c.nome_patologia, c.cid10, c.categoria_clinica, c.sinonimos::text, c.subtipo::text, c.is_emergencia::text, 1
  FROM base_patologias_clinicas c
), named AS (
  SELECT s.*, trim(s.nome_patologia) AS base,
    CASE WHEN coalesce(trim(s.subtipo),'') <> '' AND s.subtipo !~* '^n(a|ã)o[_ ]'
      AND fn_norm_quadro(s.subtipo) <> fn_norm_quadro(s.nome_patologia)
      THEN trim(s.nome_patologia) || ' — ' || trim(s.subtipo) ELSE trim(s.nome_patologia) END AS nome
  FROM src s WHERE coalesce(trim(s.nome_patologia),'') <> ''
), dedup AS (
  SELECT DISTINCT ON (fn_norm_quadro(n.nome)) n.*, fn_norm_quadro(n.nome) AS k, fn_norm_quadro(n.base) AS kb,
    max(n.cid10) OVER (PARTITION BY fn_norm_quadro(n.nome)) AS any_cid
  FROM named n ORDER BY fn_norm_quadro(n.nome), n.ord
), env AS (
  SELECT key, array_agg(DISTINCT ambiente) AS ambientes,
    (array_agg(gravidade ORDER BY CASE gravidade WHEN 'critica' THEN 4 WHEN 'grave' THEN 3 WHEN 'moderada' THEN 2 WHEN 'leve' THEN 1 ELSE 0 END DESC))[1] AS gravidade,
    (array_agg(especialidade) FILTER (WHERE especialidade IS NOT NULL))[1] AS especialidade,
    (array_agg(sistema) FILTER (WHERE sistema IS NOT NULL))[1] AS sistema,
    max(coalesce(frequencia,0))::int AS frequencia,
    jsonb_object_agg(ambiente, gravidade) FILTER (WHERE gravidade IS NOT NULL) AS gpa,
    jsonb_object_agg(ambiente, coalesce(frequencia,0)) AS fpa
  FROM (
    SELECT nome_normalizado AS key, * FROM patologia_ambiente WHERE ambiente IN ('ambulatorial','urgencia','emergencia') AND coalesce(nome_normalizado,'')<>''
    UNION
    SELECT fn_norm_quadro(nome_patologia), * FROM patologia_ambiente WHERE ambiente IN ('ambulatorial','urgencia','emergencia')
  ) x GROUP BY key
), cur AS (
  SELECT DISTINCT ON (fn_norm_quadro(nome)) fn_norm_quadro(nome) AS k, dados FROM catalogo_patologias_legado ORDER BY fn_norm_quadro(nome), id_legado
), full_rows AS (
  SELECT d.id, d.nome, coalesce(d.any_cid, cu.dados->>'cid') AS cid,
    coalesce(d.categoria_clinica, cu.dados->>'category') AS categoria,
    (lower(coalesce(d.is_em,'')) IN ('true','sim','t','1') OR coalesce((cu.dados->>'isEmergency')::boolean,false) OR 'emergencia' = ANY(coalesce(e.ambientes,'{}'))) AS is_em,
    array_remove(regexp_split_to_array(coalesce(d.sinonimos,''), '\s*[;,|]\s*'), '') ||
      coalesce(ARRAY(SELECT jsonb_array_elements_text(coalesce(cu.dados->'synonyms','[]'::jsonb))), '{}') AS sin,
    coalesce(cu.dados->'meds','[]'::jsonb) AS meds, cu.dados->'hospitalMeds' AS hm,
    CASE WHEN d.nome = d.base THEN cu.dados->'subtypes' END AS st,
    coalesce(e.ambientes, ARRAY['ambulatorial','urgencia','emergencia']) AS ambientes,
    e.gravidade, coalesce(e.especialidade, d.categoria_clinica) AS especialidade,
    CASE WHEN e.key IS NULL THEN NULL ELSE coalesce(e.sistema,'outros') END AS sistema,
    coalesce(e.frequencia,0) AS frequencia, e.gpa, e.fpa
  FROM dedup d
  LEFT JOIN env e ON e.key = d.k
  LEFT JOIN LATERAL (SELECT dados FROM cur WHERE cur.k = d.k OR cur.k = d.kb ORDER BY (cur.k = d.k) DESC LIMIT 1) cu ON true
), filt AS (
  SELECT * FROM full_rows f
  WHERE p_ambiente = ANY(f.ambientes)
    AND (coalesce(p_busca,'') = '' OR fn_norm_quadro(f.nome || ' ' || coalesce(f.cid,'') || ' ' || array_to_string(f.sin,' ')) LIKE '%' || fn_norm_quadro(p_busca) || '%')
)
SELECT count(*) OVER (), id, nome, cid, categoria, is_em, sin, meds, hm, st, ambientes, gravidade, especialidade, sistema, frequencia, gpa, fpa
FROM filt ORDER BY frequencia DESC, nome
LIMIT least(greatest(coalesce(p_limit,50),1),50) OFFSET greatest(coalesce(p_offset,0),0);
$$;
GRANT EXECUTE ON FUNCTION public.fn_quadros_ambiente(text,text,int,int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_norm_quadro(text) TO authenticated;