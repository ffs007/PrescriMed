ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS psx_docstyle jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS psx_custom jsonb;