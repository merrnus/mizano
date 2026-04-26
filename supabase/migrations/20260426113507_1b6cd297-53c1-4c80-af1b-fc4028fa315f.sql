ALTER TABLE public.kardes_etkinlik
  ADD COLUMN IF NOT EXISTS baslangic_saati TIME NULL,
  ADD COLUMN IF NOT EXISTS bitis_saati TIME NULL,
  ADD COLUMN IF NOT EXISTS takvim_etkinlik_id UUID NULL REFERENCES public.takvim_etkinlik(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_kardes_etkinlik_takvim ON public.kardes_etkinlik(takvim_etkinlik_id) WHERE takvim_etkinlik_id IS NOT NULL;