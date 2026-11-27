BEGIN;

DO $$
BEGIN
  CREATE TEMP TABLE _map_conditions ON COMMIT DROP AS
    SELECT id, min(id) OVER (PARTITION BY tipo, nome_normalizado, instituicao_id) AS canonical
    FROM curadoria.condicoes_clinicas;
  UPDATE curadoria.condicao_exames j SET condicao_id = m.canonical FROM _map_conditions m WHERE j.condicao_id = m.id AND m.id <> m.canonical;
  UPDATE curadoria.condicao_classes_medicamentosas j SET condicao_id = m.canonical FROM _map_conditions m WHERE j.condicao_id = m.id AND m.id <> m.canonical;
  UPDATE curadoria.condicao_exame_fisico j SET condicao_id = m.canonical FROM _map_conditions m WHERE j.condicao_id = m.id AND m.id <> m.canonical;
  UPDATE curadoria.condicao_modelos_documento j SET condicao_id = m.canonical FROM _map_conditions m WHERE j.condicao_id = m.id AND m.id <> m.canonical;
  UPDATE curadoria.condicao_linha_cuidado j SET condicao_id = m.canonical FROM _map_conditions m WHERE j.condicao_id = m.id AND m.id <> m.canonical;
  DELETE FROM curadoria.condicoes_clinicas c USING _map_conditions m WHERE c.id = m.id AND m.id <> m.canonical;

  CREATE TEMP TABLE _map_classes ON COMMIT DROP AS
    SELECT id, min(id) OVER (PARTITION BY slug, instituicao_id) AS canonical
    FROM curadoria.classes_medicamentosas;
  UPDATE curadoria.condicao_classes_medicamentosas j SET classe_medicamentosa_id = m.canonical FROM _map_classes m WHERE j.classe_medicamentosa_id = m.id AND m.id <> m.canonical;
  DELETE FROM curadoria.classes_medicamentosas c USING _map_classes m WHERE c.id = m.id AND m.id <> m.canonical;

  CREATE TEMP TABLE _map_exams ON COMMIT DROP AS
    SELECT id, min(id) OVER (PARTITION BY codigo_exame, instituicao_id) AS canonical
    FROM curadoria.exames_complementares;
  UPDATE curadoria.condicao_exames j SET exame_id = m.canonical FROM _map_exams m WHERE j.exame_id = m.id AND m.id <> m.canonical;
  DELETE FROM curadoria.exames_complementares c USING _map_exams m WHERE c.id = m.id AND m.id <> m.canonical;

  CREATE TEMP TABLE _map_protocols ON COMMIT DROP AS
    SELECT id, min(id) OVER (PARTITION BY slug, instituicao_id) AS canonical
    FROM curadoria.protocolos_clinicos;
  DELETE FROM curadoria.protocolos_clinicos c USING _map_protocols m WHERE c.id = m.id AND m.id <> m.canonical;

  CREATE TEMP TABLE _map_lines ON COMMIT DROP AS
    SELECT id, min(id) OVER (PARTITION BY slug, instituicao_id) AS canonical
    FROM curadoria.linhas_cuidado;
  UPDATE curadoria.linha_cuidado_acoes j SET linha_id = m.canonical FROM _map_lines m WHERE j.linha_id = m.id AND m.id <> m.canonical;
  UPDATE curadoria.condicao_linha_cuidado j SET linha_cuidado_id = m.canonical FROM _map_lines m WHERE j.linha_cuidado_id = m.id AND m.id <> m.canonical;
  DELETE FROM curadoria.linhas_cuidado c USING _map_lines m WHERE c.id = m.id AND m.id <> m.canonical;

  CREATE TEMP TABLE _map_models ON COMMIT DROP AS
    SELECT id, min(id) OVER (PARTITION BY tipo_documento, instituicao_id) AS canonical
    FROM curadoria.modelos_documento;
  UPDATE curadoria.condicao_modelos_documento j SET modelo_documento_id = m.canonical FROM _map_models m WHERE j.modelo_documento_id = m.id AND m.id <> m.canonical;
  DELETE FROM curadoria.modelos_documento c USING _map_models m WHERE c.id = m.id AND m.id <> m.canonical;
END $$;

ALTER TABLE curadoria.condicoes_clinicas DROP CONSTRAINT IF EXISTS uk_condicoes_clinicas_nome_negocio;
ALTER TABLE curadoria.condicoes_clinicas ADD CONSTRAINT uk_condicoes_clinicas_nome_negocio UNIQUE NULLS NOT DISTINCT (tipo, nome_normalizado, instituicao_id);
ALTER TABLE curadoria.classes_medicamentosas DROP CONSTRAINT IF EXISTS uk_classes_med_slug_instituicao;
ALTER TABLE curadoria.classes_medicamentosas ADD CONSTRAINT uk_classes_med_slug_instituicao UNIQUE NULLS NOT DISTINCT (slug, instituicao_id);
ALTER TABLE curadoria.exames_complementares DROP CONSTRAINT IF EXISTS uk_exames_codigo_instituicao;
ALTER TABLE curadoria.exames_complementares ADD CONSTRAINT uk_exames_codigo_instituicao UNIQUE NULLS NOT DISTINCT (codigo_exame, instituicao_id);
ALTER TABLE curadoria.protocolos_clinicos DROP CONSTRAINT IF EXISTS uk_protocolos_slug_inst;
ALTER TABLE curadoria.protocolos_clinicos ADD CONSTRAINT uk_protocolos_slug_inst UNIQUE NULLS NOT DISTINCT (slug, instituicao_id);
ALTER TABLE curadoria.linhas_cuidado DROP CONSTRAINT IF EXISTS uk_linhas_cuidado_slug_inst;
ALTER TABLE curadoria.linhas_cuidado ADD CONSTRAINT uk_linhas_cuidado_slug_inst UNIQUE NULLS NOT DISTINCT (slug, instituicao_id);
ALTER TABLE curadoria.modelos_documento DROP CONSTRAINT IF EXISTS uk_modelo;
ALTER TABLE curadoria.modelos_documento ADD CONSTRAINT uk_modelo UNIQUE NULLS NOT DISTINCT (tipo_documento, instituicao_id);

COMMIT;