-- Enums
CREATE TYPE public.ders_durum AS ENUM ('izliyor', 'birakti', 'gecti', 'restant');
CREATE TYPE public.ders_sinav_tip AS ENUM ('vize', 'final', 'quiz', 'odev', 'proje', 'butunleme');
CREATE TYPE public.ders_kaynak_tip AS ENUM ('link', 'dosya', 'resim', 'not');
CREATE TYPE public.hafta_gun AS ENUM ('pazartesi', 'sali', 'carsamba', 'persembe', 'cuma', 'cumartesi', 'pazar');

-- ders
CREATE TABLE public.ders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  ad text NOT NULL,
  kod text,
  kredi numeric DEFAULT 0,
  donem text,
  hoca text,
  restant boolean NOT NULL DEFAULT false,
  durum ders_durum NOT NULL DEFAULT 'izliyor',
  etiketler text[] NOT NULL DEFAULT '{}',
  gecme_baraji numeric DEFAULT 60,
  notlar text,
  siralama integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ders select" ON public.ders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "ders insert" ON public.ders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ders update" ON public.ders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "ders delete" ON public.ders FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER ders_set_updated_at BEFORE UPDATE ON public.ders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ders_sinav
CREATE TABLE public.ders_sinav (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  ders_id uuid NOT NULL REFERENCES public.ders(id) ON DELETE CASCADE,
  tip ders_sinav_tip NOT NULL DEFAULT 'vize',
  baslik text,
  tarih timestamptz,
  agirlik numeric,
  alinan_not numeric,
  notlar text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ders_sinav ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ders_sinav select" ON public.ders_sinav FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "ders_sinav insert" ON public.ders_sinav FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ders_sinav update" ON public.ders_sinav FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "ders_sinav delete" ON public.ders_sinav FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER ders_sinav_set_updated_at BEFORE UPDATE ON public.ders_sinav FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX ON public.ders_sinav (ders_id);

-- ders_proje
CREATE TABLE public.ders_proje (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  ders_id uuid NOT NULL REFERENCES public.ders(id) ON DELETE CASCADE,
  baslik text NOT NULL,
  aciklama text,
  modul_no integer,
  deadline date,
  tamamlandi boolean NOT NULL DEFAULT false,
  tamamlanma date,
  siralama integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ders_proje ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ders_proje select" ON public.ders_proje FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "ders_proje insert" ON public.ders_proje FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ders_proje update" ON public.ders_proje FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "ders_proje delete" ON public.ders_proje FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER ders_proje_set_updated_at BEFORE UPDATE ON public.ders_proje FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX ON public.ders_proje (ders_id);

-- ders_kaynak
CREATE TABLE public.ders_kaynak (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  ders_id uuid NOT NULL REFERENCES public.ders(id) ON DELETE CASCADE,
  tip ders_kaynak_tip NOT NULL DEFAULT 'link',
  baslik text NOT NULL,
  url text,
  storage_path text,
  icerik text,
  siralama integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ders_kaynak ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ders_kaynak select" ON public.ders_kaynak FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "ders_kaynak insert" ON public.ders_kaynak FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ders_kaynak update" ON public.ders_kaynak FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "ders_kaynak delete" ON public.ders_kaynak FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER ders_kaynak_set_updated_at BEFORE UPDATE ON public.ders_kaynak FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX ON public.ders_kaynak (ders_id);

-- ders_ders_saati (haftalık tekrar eden ders saatleri)
CREATE TABLE public.ders_saat (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  ders_id uuid NOT NULL REFERENCES public.ders(id) ON DELETE CASCADE,
  gun hafta_gun NOT NULL,
  baslangic time NOT NULL,
  bitis time NOT NULL,
  konum text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ders_saat ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ders_saat select" ON public.ders_saat FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "ders_saat insert" ON public.ders_saat FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ders_saat update" ON public.ders_saat FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "ders_saat delete" ON public.ders_saat FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER ders_saat_set_updated_at BEFORE UPDATE ON public.ders_saat FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX ON public.ders_saat (ders_id);

-- Storage bucket (private)
INSERT INTO storage.buckets (id, name, public) VALUES ('ders-dosya', 'ders-dosya', false);

CREATE POLICY "ders-dosya read own" ON storage.objects FOR SELECT
USING (bucket_id = 'ders-dosya' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "ders-dosya insert own" ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'ders-dosya' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "ders-dosya update own" ON storage.objects FOR UPDATE
USING (bucket_id = 'ders-dosya' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "ders-dosya delete own" ON storage.objects FOR DELETE
USING (bucket_id = 'ders-dosya' AND auth.uid()::text = (storage.foldername(name))[1]);