ALTER TABLE public.pacientes ADD CONSTRAINT pacientes_nome_obrigatorio CHECK (btrim(coalesce(nome,'')) <> '');
ALTER TABLE public.pacientes ADD CONSTRAINT pacientes_peso_faixa CHECK (peso_kg IS NULL OR (peso_kg > 0.3 AND peso_kg <= 400));
ALTER TABLE public.atendimentos ADD CONSTRAINT atendimentos_cid_formato CHECK (cid_principal IS NULL OR cid_principal ~* '^([A-Z][0-9]{2}(\.[0-9]{1,2})?)?$');
ALTER TABLE public.prescricoes_historico ADD CONSTRAINT prescricoes_itens_lista CHECK (itens IS NULL OR jsonb_typeof(itens) = 'array');
ALTER TABLE public.med_dose ALTER COLUMN medicamento_id SET NOT NULL;