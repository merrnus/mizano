ALTER TABLE public.takvim_etkinlik
ADD COLUMN IF NOT EXISTS tamamlandi boolean NOT NULL DEFAULT false;