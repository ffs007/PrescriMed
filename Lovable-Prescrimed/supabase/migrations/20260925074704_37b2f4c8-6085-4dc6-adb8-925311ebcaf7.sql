CREATE OR REPLACE FUNCTION public.fn_homologacao_promover()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n integer;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Apenas admin'; END IF;
  WITH alvo AS (SELECT DISTINCT vinculo_id FROM homologacao_edicoes WHERE validado AND NOT promovido AND NOT desfeito)
  UPDATE clinical_condition_medication c SET review_status='reviewed', revisado_por=auth.uid(), revisado_em=now()
  FROM alvo WHERE c.id = alvo.vinculo_id;
  GET DIAGNOSTICS n = ROW_COUNT;
  UPDATE homologacao_edicoes SET promovido=true WHERE validado AND NOT desfeito;
  RETURN n;
END $$;
REVOKE EXECUTE ON FUNCTION public.fn_homologacao_promover() FROM PUBLIC, anon;