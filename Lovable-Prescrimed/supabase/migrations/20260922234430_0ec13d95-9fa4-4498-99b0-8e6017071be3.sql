-- Regras de leitura mais específicas nas tabelas de apoio sinalizadas pelo scanner.

-- Sugestões de escore: usuários logados leem apenas as entradas ativas.
DROP POLICY IF EXISTS "sugestoes_escore_select_auth" ON public.stg_sugestoes_escore_contexto;
CREATE POLICY "sugestoes_escore_select_ativas" ON public.stg_sugestoes_escore_contexto
  FOR SELECT TO authenticated
  USING (
    ativo IS TRUE
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'revisor'::public.app_role)
  );

-- Monitoramento: usuários logados leem apenas linhas de conteúdo válido
-- (com princípio ativo e exame preenchidos); rascunhos de importação ficam
-- restritos a admin/revisor.
DROP POLICY IF EXISTS "Usuários autenticados leem registros de monitoramento" ON public.stg_med_monitoramento;
CREATE POLICY "monitoramento_select_conteudo_valido" ON public.stg_med_monitoramento
  FOR SELECT TO authenticated
  USING (
    (btrim(coalesce(principio_ativo, '')) <> '' AND btrim(coalesce(nome_exame, '')) <> '')
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'revisor'::public.app_role)
  );

-- Configurações do histórico: usuários logados leem apenas a configuração
-- vigente (a mais recente); versões antigas só para administradores.
DROP POLICY IF EXISTS "Auth read historico_settings" ON public.historico_settings;
CREATE POLICY "historico_settings_select_vigente" ON public.historico_settings
  FOR SELECT TO authenticated
  USING (
    id = (SELECT s.id FROM public.historico_settings s ORDER BY s.updated_at DESC NULLS LAST LIMIT 1)
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  );