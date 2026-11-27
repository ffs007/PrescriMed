DROP TRIGGER IF EXISTS trg_ccm_instrucao_obrigatoria ON public.clinical_condition_medication;
CREATE TRIGGER trg_ccm_instrucao_obrigatoria BEFORE INSERT OR UPDATE ON public.clinical_condition_medication
FOR EACH ROW EXECUTE FUNCTION public.fn_ccm_instrucao_obrigatoria();