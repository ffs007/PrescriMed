DROP FUNCTION IF EXISTS public.fn_quadros_ambiente(text, text, integer, integer);
CREATE OR REPLACE FUNCTION public.fn_quadros_ambiente(p_ambiente text, p_busca text DEFAULT NULL::text, p_limit integer DEFAULT 50, p_offset integer DEFAULT 0, p_especialidade text DEFAULT NULL::text)
 RETURNS TABLE(total bigint, uid text, nome text, cid text, categoria text, is_emergencia boolean, sinonimos text[], meds jsonb, hospital_meds jsonb, subtypes jsonb, ambientes text[], gravidade text, especialidade text, sistema text, frequencia integer, gravidade_por_ambiente jsonb, frequencia_por_ambiente jsonb)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'extensions'
AS $function$
WITH src AS MATERIALIZED (
  SELECT r.id::text AS id, r.nome_patologia, r.cid10, r.categoria_clinica, r.sinonimos::text AS sinonimos, r.subtipo::text AS subtipo, r.is_emergencia::text AS is_em, 0 AS ord
  FROM base_patologias_ref r
  UNION ALL
  SELECT c.id::text, c.nome_patologia, c.cid10, c.categoria_clinica, c.sinonimos::text, c.subtipo::text, c.is_emergencia::text, 1
  FROM base_patologias_clinicas c
), named AS MATERIALIZED (
  SELECT s.*, trim(s.nome_patologia) AS base, fn_norm_quadro(s.nome_patologia) AS kb,
    CASE WHEN coalesce(trim(s.subtipo),'') <> '' AND s.subtipo !~* '^n(a|ã)o[_ ]'
      AND fn_norm_quadro(s.subtipo) <> fn_norm_quadro(s.nome_patologia)
      THEN trim(s.nome_patologia) || ' — ' || trim(s.subtipo) ELSE trim(s.nome_patologia) END AS nome
  FROM src s WHERE coalesce(trim(s.nome_patologia),'') <> ''
), keyed AS MATERIALIZED (
  SELECT n.*, fn_norm_quadro(n.nome) AS k FROM named n
), dedup AS MATERIALIZED (
  SELECT DISTINCT ON (k) keyed.*, max(cid10) OVER (PARTITION BY k) AS any_cid
  FROM keyed ORDER BY k, ord
), pa AS MATERIALIZED (
  SELECT nome_normalizado AS key, ambiente, gravidade, especialidade, sistema, frequencia FROM patologia_ambiente
   WHERE ambiente IN ('ambulatorial','urgencia','emergencia') AND coalesce(nome_normalizado,'')<>''
  UNION
  SELECT fn_norm_quadro(nome_patologia), ambiente, gravidade, especialidade, sistema, frequencia FROM patologia_ambiente
   WHERE ambiente IN ('ambulatorial','urgencia','emergencia')
), env AS MATERIALIZED (
  SELECT key, array_agg(DISTINCT ambiente) AS ambientes,
    (array_agg(gravidade ORDER BY CASE gravidade WHEN 'critica' THEN 4 WHEN 'grave' THEN 3 WHEN 'moderada' THEN 2 WHEN 'leve' THEN 1 ELSE 0 END DESC))[1] AS gravidade,
    (array_agg(especialidade) FILTER (WHERE especialidade IS NOT NULL))[1] AS especialidade,
    (array_agg(sistema) FILTER (WHERE sistema IS NOT NULL))[1] AS sistema,
    max(coalesce(frequencia,0))::int AS frequencia,
    jsonb_object_agg(ambiente, gravidade) FILTER (WHERE gravidade IS NOT NULL) AS gpa,
    jsonb_object_agg(ambiente, coalesce(frequencia,0)) AS fpa
  FROM pa GROUP BY key
), cur AS MATERIALIZED (
  SELECT DISTINCT ON (k) k, dados FROM (SELECT fn_norm_quadro(nome) AS k, dados, id_legado FROM catalogo_patologias_legado) z ORDER BY k, id_legado
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
  LEFT JOIN cur c1 ON c1.k = d.k
  LEFT JOIN cur c2 ON c2.k = d.kb
  CROSS JOIN LATERAL (SELECT coalesce(c1.dados, c2.dados) AS dados) cu
), filt AS (
  SELECT * FROM full_rows f
  WHERE (coalesce(p_ambiente,'') IN ('','todos') OR p_ambiente = ANY(f.ambientes))
    AND (coalesce(p_especialidade,'') IN ('','todas') OR f.especialidade = p_especialidade)
    AND (coalesce(p_busca,'') = '' OR fn_norm_quadro(f.nome || ' ' || coalesce(f.cid,'') || ' ' || array_to_string(f.sin,' ')) LIKE '%' || fn_norm_quadro(p_busca) || '%')
)
SELECT count(*) OVER (), id, nome, cid, categoria, is_em, sin, meds, hm, st, ambientes, gravidade, especialidade, sistema, frequencia, gpa, fpa
FROM filt ORDER BY frequencia DESC, nome
LIMIT least(greatest(coalesce(p_limit,50),1),50) OFFSET greatest(coalesce(p_offset,0),0);
$function$;
GRANT EXECUTE ON FUNCTION public.fn_quadros_ambiente(text, text, integer, integer, text) TO anon, authenticated, service_role;