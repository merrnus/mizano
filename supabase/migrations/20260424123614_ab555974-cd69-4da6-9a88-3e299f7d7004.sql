-- Enums
CREATE TYPE public.amel_kurs_durum AS ENUM ('planli', 'izliyor', 'beklemede', 'tamam', 'birakti');
CREATE TYPE public.amel_kaynak_tip AS ENUM ('link', 'dosya', 'resim', 'not');
CREATE TYPE public.amel_proje_durum AS ENUM ('planli', 'devam', 'beklemede', 'tamam', 'iptal');

-- amel_alan
CREATE TABLE public.amel_alan (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  ad TEXT NOT NULL,
  aciklama TEXT,
  renk TEXT,
  ikon TEXT,
  siralama INTEGER NOT NULL DEFAULT 0,
  arsiv BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.amel_alan ENABLE ROW LEVEL SECURITY;
CREATE POLICY "amel_alan select" ON public.amel_alan FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "amel_alan insert" ON public.amel_alan FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "amel_alan update" ON public.amel_alan FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "amel_alan delete" ON public.amel_alan FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER amel_alan_updated_at BEFORE UPDATE ON public.amel_alan FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- amel_kurs
CREATE TABLE public.amel_kurs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  alan_id UUID NOT NULL REFERENCES public.amel_alan(id) ON DELETE CASCADE,
  ad TEXT NOT NULL,
  kod TEXT,
  saglayici TEXT,
  aciklama TEXT,
  durum public.amel_kurs_durum NOT NULL DEFAULT 'planli',
  baslangic DATE,
  bitis DATE,
  sertifika_tarihi DATE,
  sertifika_konum TEXT,
  notlar TEXT,
  siralama INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_amel_kurs_alan ON public.amel_kurs(alan_id);
ALTER TABLE public.amel_kurs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "amel_kurs select" ON public.amel_kurs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "amel_kurs insert" ON public.amel_kurs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "amel_kurs update" ON public.amel_kurs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "amel_kurs delete" ON public.amel_kurs FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER amel_kurs_updated_at BEFORE UPDATE ON public.amel_kurs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- amel_modul
CREATE TABLE public.amel_modul (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  kurs_id UUID NOT NULL REFERENCES public.amel_kurs(id) ON DELETE CASCADE,
  baslik TEXT NOT NULL,
  aciklama TEXT,
  siralama INTEGER NOT NULL DEFAULT 0,
  tamamlandi BOOLEAN NOT NULL DEFAULT false,
  tamamlanma DATE,
  notlar TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_amel_modul_kurs ON public.amel_modul(kurs_id);
ALTER TABLE public.amel_modul ENABLE ROW LEVEL SECURITY;
CREATE POLICY "amel_modul select" ON public.amel_modul FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "amel_modul insert" ON public.amel_modul FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "amel_modul update" ON public.amel_modul FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "amel_modul delete" ON public.amel_modul FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER amel_modul_updated_at BEFORE UPDATE ON public.amel_modul FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- amel_kaynak
CREATE TABLE public.amel_kaynak (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  kurs_id UUID NOT NULL REFERENCES public.amel_kurs(id) ON DELETE CASCADE,
  baslik TEXT NOT NULL,
  tip public.amel_kaynak_tip NOT NULL DEFAULT 'link',
  url TEXT,
  icerik TEXT,
  storage_path TEXT,
  siralama INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_amel_kaynak_kurs ON public.amel_kaynak(kurs_id);
ALTER TABLE public.amel_kaynak ENABLE ROW LEVEL SECURITY;
CREATE POLICY "amel_kaynak select" ON public.amel_kaynak FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "amel_kaynak insert" ON public.amel_kaynak FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "amel_kaynak update" ON public.amel_kaynak FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "amel_kaynak delete" ON public.amel_kaynak FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER amel_kaynak_updated_at BEFORE UPDATE ON public.amel_kaynak FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- amel_proje
CREATE TABLE public.amel_proje (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  alan_id UUID REFERENCES public.amel_alan(id) ON DELETE SET NULL,
  kurs_id UUID REFERENCES public.amel_kurs(id) ON DELETE SET NULL,
  ad TEXT NOT NULL,
  aciklama TEXT,
  durum public.amel_proje_durum NOT NULL DEFAULT 'planli',
  baslangic DATE,
  deadline DATE,
  tamamlanma DATE,
  repo_url TEXT,
  notlar TEXT,
  siralama INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_amel_proje_alan ON public.amel_proje(alan_id);
CREATE INDEX idx_amel_proje_kurs ON public.amel_proje(kurs_id);
ALTER TABLE public.amel_proje ENABLE ROW LEVEL SECURITY;
CREATE POLICY "amel_proje select" ON public.amel_proje FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "amel_proje insert" ON public.amel_proje FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "amel_proje update" ON public.amel_proje FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "amel_proje delete" ON public.amel_proje FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER amel_proje_updated_at BEFORE UPDATE ON public.amel_proje FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- amel_proje_adim
CREATE TABLE public.amel_proje_adim (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  proje_id UUID NOT NULL REFERENCES public.amel_proje(id) ON DELETE CASCADE,
  baslik TEXT NOT NULL,
  aciklama TEXT,
  vade DATE,
  tamamlandi BOOLEAN NOT NULL DEFAULT false,
  tamamlanma DATE,
  siralama INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_amel_proje_adim_proje ON public.amel_proje_adim(proje_id);
ALTER TABLE public.amel_proje_adim ENABLE ROW LEVEL SECURITY;
CREATE POLICY "amel_proje_adim select" ON public.amel_proje_adim FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "amel_proje_adim insert" ON public.amel_proje_adim FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "amel_proje_adim update" ON public.amel_proje_adim FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "amel_proje_adim delete" ON public.amel_proje_adim FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER amel_proje_adim_updated_at BEFORE UPDATE ON public.amel_proje_adim FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('amel-dosya', 'amel-dosya', false);

CREATE POLICY "amel-dosya select own" ON storage.objects FOR SELECT
  USING (bucket_id = 'amel-dosya' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "amel-dosya insert own" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'amel-dosya' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "amel-dosya update own" ON storage.objects FOR UPDATE
  USING (bucket_id = 'amel-dosya' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "amel-dosya delete own" ON storage.objects FOR DELETE
  USING (bucket_id = 'amel-dosya' AND auth.uid()::text = (storage.foldername(name))[1]);