-- 1. gundem_kisi tablosuna yeni alanlar
ALTER TABLE public.gundem_kisi
  ADD COLUMN IF NOT EXISTS derin_takip boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS telefon text,
  ADD COLUMN IF NOT EXISTS dogum_tarihi date,
  ADD COLUMN IF NOT EXISTS foto_url text,
  ADD COLUMN IF NOT EXISTS universite text,
  ADD COLUMN IF NOT EXISTS bolum text,
  ADD COLUMN IF NOT EXISTS sinif text,
  ADD COLUMN IF NOT EXISTS gano numeric,
  ADD COLUMN IF NOT EXISTS akademik_durum text,
  ADD COLUMN IF NOT EXISTS ilgi_alanlari text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS sorumluluk_notu text;

-- 2. Etkinlik tipi enum
DO $$ BEGIN
  CREATE TYPE public.kardes_etkinlik_tip AS ENUM (
    'sohbet','istisare','kuran','sophia','kamp','sinav','yarisma',
    'hediye','gezi','spor','teke_tek','dogum_gunu','kandil','zoom'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. kardes_etkinlik tablosu
CREATE TABLE IF NOT EXISTS public.kardes_etkinlik (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kisi_id uuid NOT NULL,
  tip public.kardes_etkinlik_tip NOT NULL,
  tarih date NOT NULL DEFAULT CURRENT_DATE,
  baslik text NOT NULL,
  notlar text,
  sonuc text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kardes_etkinlik_kisi ON public.kardes_etkinlik(kisi_id);
CREATE INDEX IF NOT EXISTS idx_kardes_etkinlik_user_tarih ON public.kardes_etkinlik(user_id, tarih DESC);

ALTER TABLE public.kardes_etkinlik ENABLE ROW LEVEL SECURITY;

CREATE POLICY "kardes_etkinlik select" ON public.kardes_etkinlik
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "kardes_etkinlik insert" ON public.kardes_etkinlik
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "kardes_etkinlik update" ON public.kardes_etkinlik
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "kardes_etkinlik delete" ON public.kardes_etkinlik
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER kardes_etkinlik_set_updated_at
  BEFORE UPDATE ON public.kardes_etkinlik
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();