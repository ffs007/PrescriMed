CREATE OR REPLACE FUNCTION public.fn_prot_add_membro(_equipe uuid, _email text, _papel text) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE u uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'apenas administradores'; END IF;
  SELECT id INTO u FROM auth.users WHERE lower(email) = lower(trim(_email)) LIMIT 1;
  IF u IS NULL THEN RETURN false; END IF;
  INSERT INTO public.prot_membros (equipe_id, user_id, papel) VALUES (_equipe, u, coalesce(_papel,'membro'))
  ON CONFLICT (equipe_id, user_id) DO UPDATE SET papel = EXCLUDED.papel;
  RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.fn_prot_add_membro(uuid,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_prot_add_membro(uuid,text,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.fn_prot_membros_email(_equipe uuid) RETURNS TABLE(id uuid, user_id uuid, papel text, email text) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT m.id, m.user_id, m.papel, u.email::text FROM public.prot_membros m JOIN auth.users u ON u.id = m.user_id
  WHERE m.equipe_id = _equipe AND (public.has_role(auth.uid(),'admin') OR public.fn_prot_papel(_equipe) IS NOT NULL) $$;
REVOKE ALL ON FUNCTION public.fn_prot_membros_email(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_prot_membros_email(uuid) TO authenticated;