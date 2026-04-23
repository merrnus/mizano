
-- Çetele şablonları
CREATE TYPE public.cetele_birim AS ENUM ('sayfa', 'adet', 'dakika', 'ikili');
CREATE TYPE public.cetele_hedef_tipi AS ENUM ('gunluk', 'haftalik', 'esnek');
CREATE TYPE public.cetele_alan AS ENUM ('maneviyat', 'akademi', 'dunyevi');

CREATE TABLE public.cetele_sablon (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  ad TEXT NOT NULL,
  birim public.cetele_birim NOT NULL,
  hedef_tipi public.cetele_hedef_tipi NOT NULL DEFAULT 'gunluk',
  hedef_deger NUMERIC NOT NULL DEFAULT 1,
  alan public.cetele_alan NOT NULL DEFAULT 'maneviyat',
  aktif BOOLEAN NOT NULL DEFAULT true,
  siralama INTEGER NOT NULL DEFAULT 0,
  uc_aylik_hedef NUMERIC,
  uc_aylik_baslangic DATE,
  notlar TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX cetele_sablon_user_idx ON public.cetele_sablon(user_id);

ALTER TABLE public.cetele_sablon ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Kullanıcılar kendi şablonlarını görür"
  ON public.cetele_sablon FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Kullanıcılar kendi şablonlarını ekler"
  ON public.cetele_sablon FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Kullanıcılar kendi şablonlarını günceller"
  ON public.cetele_sablon FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY "Kullanıcılar kendi şablonlarını siler"
  ON public.cetele_sablon FOR DELETE
  USING (auth.uid() = user_id);

-- Çetele kayıtları
CREATE TABLE public.cetele_kayit (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  sablon_id UUID REFERENCES public.cetele_sablon(id) ON DELETE CASCADE NOT NULL,
  tarih DATE NOT NULL,
  miktar NUMERIC NOT NULL DEFAULT 1,
  not_metni TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX cetele_kayit_user_idx ON public.cetele_kayit(user_id);
CREATE INDEX cetele_kayit_sablon_tarih_idx ON public.cetele_kayit(sablon_id, tarih);
CREATE INDEX cetele_kayit_tarih_idx ON public.cetele_kayit(user_id, tarih);

ALTER TABLE public.cetele_kayit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Kullanıcılar kendi kayıtlarını görür"
  ON public.cetele_kayit FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Kullanıcılar kendi kayıtlarını ekler"
  ON public.cetele_kayit FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Kullanıcılar kendi kayıtlarını günceller"
  ON public.cetele_kayit FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY "Kullanıcılar kendi kayıtlarını siler"
  ON public.cetele_kayit FOR DELETE
  USING (auth.uid() = user_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER cetele_sablon_updated_at
  BEFORE UPDATE ON public.cetele_sablon
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
