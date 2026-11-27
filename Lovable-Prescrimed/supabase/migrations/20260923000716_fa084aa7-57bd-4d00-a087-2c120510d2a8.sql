-- ============ 1. Camada de revisão da curadoria ============
DO $$ BEGIN
  CREATE TYPE curadoria.curadoria_status_revisao AS ENUM ('rascunho','em_revisao','aprovado','reprovado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS curadoria.revisao_registro (
  id BIGSERIAL PRIMARY KEY,
  entidade TEXT NOT NULL CHECK (entidade IN ('instituicao','classe_medicamentosa','condicao_clinica','protocolo_clinico')),
  entidade_id BIGINT NOT NULL,
  status curadoria.curadoria_status_revisao NOT NULL DEFAULT 'rascunho',
  observacao TEXT,
  revisado_por UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_curadoria_revisao_entidade
  ON curadoria.revisao_registro (entidade, entidade_id, created_at DESC);

ALTER TABLE curadoria.revisao_registro ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS revisao_registro_service ON curadoria.revisao_registro;
CREATE POLICY revisao_registro_service ON curadoria.revisao_registro
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE OR REPLACE VIEW curadoria.vw_revisao_atual AS
SELECT DISTINCT ON (entidade, entidade_id)
  entidade, entidade_id, status, observacao, revisado_por, created_at AS revisado_em
FROM curadoria.revisao_registro
ORDER BY entidade, entidade_id, created_at DESC;

-- ============ 2. Guarda de perfil ============
CREATE OR REPLACE FUNCTION public.fn_curadoria_pode_editar()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
  SELECT public.has_role(auth.uid(), 'admin'::app_role)
      OR public.has_role(auth.uid(), 'revisor'::app_role);
$$;
REVOKE ALL ON FUNCTION public.fn_curadoria_pode_editar() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_curadoria_pode_editar() TO authenticated;

-- ============ 3. Leitura ============
CREATE OR REPLACE FUNCTION public.fn_curadoria_listar(_entidade TEXT, _busca TEXT DEFAULT NULL)
RETURNS TABLE (
  id BIGINT, titulo TEXT, subtitulo TEXT, detalhe TEXT,
  ativo BOOLEAN, status TEXT, observacao TEXT, revisado_em TIMESTAMPTZ
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = curadoria, public, pg_temp
AS $$
DECLARE q TEXT := '%' || coalesce(trim(_busca), '') || '%';
BEGIN
  IF NOT public.fn_curadoria_pode_editar() THEN
    RAISE EXCEPTION 'Acesso restrito a administradores e revisores.';
  END IF;

  IF _entidade = 'instituicao' THEN
    RETURN QUERY
      SELECT i.id, i.nome, i.codigo_instituicao,
             coalesce(i.tipo_instituicao::text, '—'),
             i.ativa, coalesce(r.status::text, 'rascunho'), r.observacao, r.revisado_em
      FROM curadoria.instituicoes i
      LEFT JOIN curadoria.vw_revisao_atual r ON r.entidade = 'instituicao' AND r.entidade_id = i.id
      WHERE i.nome ILIKE q OR i.codigo_instituicao ILIKE q
      ORDER BY i.nome;
  ELSIF _entidade = 'classe_medicamentosa' THEN
    RETURN QUERY
      SELECT c.id, c.nome, c.slug, coalesce(c.descricao, '—'),
             true, coalesce(r.status::text, 'rascunho'), r.observacao, r.revisado_em
      FROM curadoria.classes_medicamentosas c
      LEFT JOIN curadoria.vw_revisao_atual r ON r.entidade = 'classe_medicamentosa' AND r.entidade_id = c.id
      WHERE c.nome ILIKE q OR c.slug ILIKE q
      ORDER BY c.nome;
  ELSIF _entidade = 'condicao_clinica' THEN
    RETURN QUERY
      SELECT c.id, c.nome, c.tipo::text,
             coalesce(array_to_string(c.cid10, ', '), '—'),
             true, coalesce(r.status::text, 'rascunho'), r.observacao, r.revisado_em
      FROM curadoria.condicoes_clinicas c
      LEFT JOIN curadoria.vw_revisao_atual r ON r.entidade = 'condicao_clinica' AND r.entidade_id = c.id
      WHERE c.nome ILIKE q OR array_to_string(c.cid10, ' ') ILIKE q
      ORDER BY c.tipo::text, c.nome;
  ELSIF _entidade = 'protocolo_clinico' THEN
    RETURN QUERY
      SELECT p.id, p.nome, p.slug, coalesce(p.descricao_curta, '—'),
             true, coalesce(r.status::text, 'rascunho'), r.observacao, r.revisado_em
      FROM curadoria.protocolos_clinicos p
      LEFT JOIN curadoria.vw_revisao_atual r ON r.entidade = 'protocolo_clinico' AND r.entidade_id = p.id
      WHERE p.nome ILIKE q OR p.slug ILIKE q
      ORDER BY p.nome;
  ELSE
    RAISE EXCEPTION 'Entidade desconhecida: %', _entidade;
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.fn_curadoria_listar(TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_curadoria_listar(TEXT, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.fn_curadoria_resumo()
RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = curadoria, public, pg_temp
AS $$
DECLARE res JSONB;
BEGIN
  IF NOT public.fn_curadoria_pode_editar() THEN
    RAISE EXCEPTION 'Acesso restrito a administradores e revisores.';
  END IF;
  SELECT jsonb_build_object(
    'instituicoes', (SELECT count(*) FROM curadoria.instituicoes),
    'classes', (SELECT count(*) FROM curadoria.classes_medicamentosas),
    'condicoes', (SELECT count(*) FROM curadoria.condicoes_clinicas),
    'protocolos', (SELECT count(*) FROM curadoria.protocolos_clinicos),
    'aprovados', (SELECT count(*) FROM curadoria.vw_revisao_atual WHERE status = 'aprovado'),
    'em_revisao', (SELECT count(*) FROM curadoria.vw_revisao_atual WHERE status = 'em_revisao'),
    'reprovados', (SELECT count(*) FROM curadoria.vw_revisao_atual WHERE status = 'reprovado')
  ) INTO res;
  RETURN res;
END;
$$;
REVOKE ALL ON FUNCTION public.fn_curadoria_resumo() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_curadoria_resumo() TO authenticated;

-- ============ 4. Criação / edição ============
CREATE OR REPLACE FUNCTION public.fn_curadoria_salvar(
  _entidade TEXT,
  _id BIGINT DEFAULT NULL,
  _nome TEXT DEFAULT NULL,
  _chave TEXT DEFAULT NULL,
  _detalhe TEXT DEFAULT NULL,
  _tipo TEXT DEFAULT NULL,
  _cid10 TEXT[] DEFAULT NULL,
  _ativo BOOLEAN DEFAULT TRUE
)
RETURNS BIGINT
LANGUAGE plpgsql SECURITY DEFINER SET search_path = curadoria, public, pg_temp
AS $$
DECLARE novo_id BIGINT;
BEGIN
  IF NOT public.fn_curadoria_pode_editar() THEN
    RAISE EXCEPTION 'Acesso restrito a administradores e revisores.';
  END IF;
  IF _nome IS NULL OR btrim(_nome) = '' THEN
    RAISE EXCEPTION 'Informe o nome.';
  END IF;

  IF _entidade = 'instituicao' THEN
    IF _id IS NULL THEN
      INSERT INTO curadoria.instituicoes (codigo_instituicao, nome, tipo_instituicao, ativa)
      VALUES (coalesce(nullif(btrim(_chave), ''), upper(replace(btrim(_nome), ' ', '_'))),
              btrim(_nome),
              coalesce(_tipo, 'publica')::curadoria.curadoria_tipo_instituicao,
              coalesce(_ativo, true))
      RETURNING id INTO novo_id;
    ELSE
      UPDATE curadoria.instituicoes SET
        nome = btrim(_nome),
        codigo_instituicao = coalesce(nullif(btrim(_chave), ''), codigo_instituicao),
        tipo_instituicao = coalesce(_tipo::curadoria.curadoria_tipo_instituicao, tipo_instituicao),
        ativa = coalesce(_ativo, ativa),
        updated_at = now()
      WHERE id = _id RETURNING id INTO novo_id;
    END IF;

  ELSIF _entidade = 'classe_medicamentosa' THEN
    IF _id IS NULL THEN
      INSERT INTO curadoria.classes_medicamentosas (slug, nome, descricao)
      VALUES (coalesce(nullif(btrim(_chave), ''), lower(replace(btrim(_nome), ' ', '_'))),
              btrim(_nome), nullif(btrim(coalesce(_detalhe, '')), ''))
      RETURNING id INTO novo_id;
    ELSE
      UPDATE curadoria.classes_medicamentosas SET
        nome = btrim(_nome),
        slug = coalesce(nullif(btrim(_chave), ''), slug),
        descricao = coalesce(nullif(btrim(coalesce(_detalhe, '')), ''), descricao),
        updated_at = now()
      WHERE id = _id RETURNING id INTO novo_id;
    END IF;

  ELSIF _entidade = 'condicao_clinica' THEN
    IF _id IS NULL THEN
      INSERT INTO curadoria.condicoes_clinicas (tipo, nome, cid10)
      VALUES (coalesce(_tipo, 'patologia')::curadoria.curadoria_tipo_condicao_clinica,
              btrim(_nome), coalesce(_cid10, '{}'::text[]))
      RETURNING id INTO novo_id;
    ELSE
      UPDATE curadoria.condicoes_clinicas SET
        nome = btrim(_nome),
        tipo = coalesce(_tipo::curadoria.curadoria_tipo_condicao_clinica, tipo),
        cid10 = coalesce(_cid10, cid10),
        updated_at = now()
      WHERE id = _id RETURNING id INTO novo_id;
    END IF;

  ELSIF _entidade = 'protocolo_clinico' THEN
    IF _id IS NULL THEN
      INSERT INTO curadoria.protocolos_clinicos (slug, nome, descricao_curta, cid10_relacionados)
      VALUES (coalesce(nullif(btrim(_chave), ''), lower(replace(btrim(_nome), ' ', '_'))),
              btrim(_nome), nullif(btrim(coalesce(_detalhe, '')), ''), coalesce(_cid10, '{}'::text[]))
      RETURNING id INTO novo_id;
    ELSE
      UPDATE curadoria.protocolos_clinicos SET
        nome = btrim(_nome),
        slug = coalesce(nullif(btrim(_chave), ''), slug),
        descricao_curta = coalesce(nullif(btrim(coalesce(_detalhe, '')), ''), descricao_curta),
        cid10_relacionados = coalesce(_cid10, cid10_relacionados),
        updated_at = now()
      WHERE id = _id RETURNING id INTO novo_id;
    END IF;
  ELSE
    RAISE EXCEPTION 'Entidade desconhecida: %', _entidade;
  END IF;

  IF novo_id IS NULL THEN
    RAISE EXCEPTION 'Registro não encontrado.';
  END IF;

  IF _id IS NULL THEN
    INSERT INTO curadoria.revisao_registro (entidade, entidade_id, status, revisado_por, observacao)
    VALUES (_entidade, novo_id, 'rascunho', auth.uid(), 'Criado na tela de curadoria.');
  END IF;

  RETURN novo_id;
END;
$$;
REVOKE ALL ON FUNCTION public.fn_curadoria_salvar(TEXT, BIGINT, TEXT, TEXT, TEXT, TEXT, TEXT[], BOOLEAN) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_curadoria_salvar(TEXT, BIGINT, TEXT, TEXT, TEXT, TEXT, TEXT[], BOOLEAN) TO authenticated;

-- ============ 5. Revisão / aprovação ============
CREATE OR REPLACE FUNCTION public.fn_curadoria_revisar(
  _entidade TEXT, _entidade_id BIGINT, _status TEXT, _observacao TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = curadoria, public, pg_temp
AS $$
BEGIN
  IF NOT public.fn_curadoria_pode_editar() THEN
    RAISE EXCEPTION 'Acesso restrito a administradores e revisores.';
  END IF;
  IF _entidade NOT IN ('instituicao','classe_medicamentosa','condicao_clinica','protocolo_clinico') THEN
    RAISE EXCEPTION 'Entidade desconhecida: %', _entidade;
  END IF;
  INSERT INTO curadoria.revisao_registro (entidade, entidade_id, status, observacao, revisado_por)
  VALUES (_entidade, _entidade_id, _status::curadoria.curadoria_status_revisao,
          nullif(btrim(coalesce(_observacao, '')), ''), auth.uid());
END;
$$;
REVOKE ALL ON FUNCTION public.fn_curadoria_revisar(TEXT, BIGINT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_curadoria_revisar(TEXT, BIGINT, TEXT, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.fn_curadoria_historico(_entidade TEXT, _entidade_id BIGINT)
RETURNS TABLE (status TEXT, observacao TEXT, revisado_em TIMESTAMPTZ)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = curadoria, public, pg_temp
AS $$
BEGIN
  IF NOT public.fn_curadoria_pode_editar() THEN
    RAISE EXCEPTION 'Acesso restrito a administradores e revisores.';
  END IF;
  RETURN QUERY
    SELECT r.status::text, r.observacao, r.created_at
    FROM curadoria.revisao_registro r
    WHERE r.entidade = _entidade AND r.entidade_id = _entidade_id
    ORDER BY r.created_at DESC
    LIMIT 50;
END;
$$;
REVOKE ALL ON FUNCTION public.fn_curadoria_historico(TEXT, BIGINT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_curadoria_historico(TEXT, BIGINT) TO authenticated;

-- ============ 6. Correções de segurança ============
DROP POLICY IF EXISTS descobertas_insert_auth ON public.library_descobertas;
CREATE POLICY descobertas_insert_own ON public.library_descobertas
  FOR INSERT TO authenticated
  WITH CHECK (criado_por = auth.uid());

DROP POLICY IF EXISTS descobertas_update_auth ON public.library_descobertas;
CREATE POLICY descobertas_update_own_or_reviewer ON public.library_descobertas
  FOR UPDATE TO authenticated
  USING (criado_por = auth.uid() OR public.fn_curadoria_pode_editar())
  WITH CHECK (criado_por = auth.uid() OR public.fn_curadoria_pode_editar());

DROP POLICY IF EXISTS "Autenticados gravam log qualidade" ON public.log_qualidade_base_medicamentosa;
CREATE POLICY "Usuario grava proprio log qualidade" ON public.log_qualidade_base_medicamentosa
  FOR INSERT TO authenticated
  WITH CHECK (usuario_id = auth.uid());

DROP POLICY IF EXISTS "Auth read beta_checklist_items" ON public.beta_checklist_items;
CREATE POLICY "Revisores leem beta_checklist_items" ON public.beta_checklist_items
  FOR SELECT TO authenticated USING (public.fn_curadoria_pode_editar());

DROP POLICY IF EXISTS "Auth read beta_modulos_revisao" ON public.beta_modulos_revisao;
CREATE POLICY "Revisores leem beta_modulos_revisao" ON public.beta_modulos_revisao
  FOR SELECT TO authenticated USING (public.fn_curadoria_pode_editar());

DROP POLICY IF EXISTS "Any auth read metas" ON public.lancamento_metas;
CREATE POLICY "Revisores leem metas de lancamento" ON public.lancamento_metas
  FOR SELECT TO authenticated USING (public.fn_curadoria_pode_editar());