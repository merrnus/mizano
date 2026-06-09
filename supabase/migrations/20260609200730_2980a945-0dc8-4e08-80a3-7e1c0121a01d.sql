
-- Ek türleri için enum
CREATE TYPE public.ek_tur AS ENUM ('dosya', 'link');

-- Polimorfik ekler tablosu
CREATE TABLE public.ekler (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  baglam_turu text,         -- 'hedef' | 'not' | 'belge' | 'ders' | 'kurs' | null=serbest
  baglam_id uuid,
  tur public.ek_tur NOT NULL,
  baslik text,
  -- dosya alanları
  storage_path text,
  mime_type text,
  boyut bigint,
  -- link alanları
  url text,
  aciklama text,
  onizleme_url text,
  favicon_url text,
  site_adi text,
  siralama integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ekler_user_idx ON public.ekler(user_id);
CREATE INDEX ekler_baglam_idx ON public.ekler(baglam_turu, baglam_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ekler TO authenticated;
GRANT ALL ON public.ekler TO service_role;

ALTER TABLE public.ekler ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ekler select" ON public.ekler FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "ekler insert" ON public.ekler FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ekler update" ON public.ekler FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "ekler delete" ON public.ekler FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER ekler_set_updated_at
  BEFORE UPDATE ON public.ekler
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Storage policies for ekler-dosya bucket (user-id-prefixed paths)
CREATE POLICY "ekler-dosya select own" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'ekler-dosya' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "ekler-dosya insert own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'ekler-dosya' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "ekler-dosya update own" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'ekler-dosya' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "ekler-dosya delete own" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'ekler-dosya' AND auth.uid()::text = (storage.foldername(name))[1]);
