-- Takvim için yeni enum tipleri
CREATE TYPE public.takvim_tekrar AS ENUM ('yok', 'haftalik', 'aylik');
CREATE TYPE public.gorev_oncelik AS ENUM ('dusuk', 'orta', 'yuksek');

-- TAKVİM ETKİNLİK
CREATE TABLE public.takvim_etkinlik (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  baslik text NOT NULL,
  aciklama text,
  baslangic timestamptz NOT NULL,
  bitis timestamptz,
  tum_gun boolean NOT NULL DEFAULT false,
  alan public.cetele_alan NOT NULL DEFAULT 'kisisel',
  konum text,
  tekrar public.takvim_tekrar NOT NULL DEFAULT 'yok',
  tekrar_bitis date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.takvim_etkinlik ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Kullanıcılar kendi etkinliklerini görür"
  ON public.takvim_etkinlik FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Kullanıcılar kendi etkinliklerini ekler"
  ON public.takvim_etkinlik FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Kullanıcılar kendi etkinliklerini günceller"
  ON public.takvim_etkinlik FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Kullanıcılar kendi etkinliklerini siler"
  ON public.takvim_etkinlik FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER takvim_etkinlik_set_updated_at
  BEFORE UPDATE ON public.takvim_etkinlik
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_takvim_etkinlik_user_baslangic
  ON public.takvim_etkinlik (user_id, baslangic);

-- TAKVİM GÖREV
CREATE TABLE public.takvim_gorev (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  baslik text NOT NULL,
  aciklama text,
  vade date NOT NULL,
  tamamlandi boolean NOT NULL DEFAULT false,
  oncelik public.gorev_oncelik NOT NULL DEFAULT 'orta',
  alan public.cetele_alan NOT NULL DEFAULT 'kisisel',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.takvim_gorev ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Kullanıcılar kendi görevlerini görür"
  ON public.takvim_gorev FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Kullanıcılar kendi görevlerini ekler"
  ON public.takvim_gorev FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Kullanıcılar kendi görevlerini günceller"
  ON public.takvim_gorev FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Kullanıcılar kendi görevlerini siler"
  ON public.takvim_gorev FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER takvim_gorev_set_updated_at
  BEFORE UPDATE ON public.takvim_gorev
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_takvim_gorev_user_vade
  ON public.takvim_gorev (user_id, vade);