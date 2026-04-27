ALTER TABLE public.cetele_sablon
  ADD COLUMN IF NOT EXISTS baglamlar text[] NOT NULL DEFAULT '{}'::text[];

CREATE INDEX IF NOT EXISTS idx_cetele_sablon_baglamlar
  ON public.cetele_sablon USING GIN (baglamlar);