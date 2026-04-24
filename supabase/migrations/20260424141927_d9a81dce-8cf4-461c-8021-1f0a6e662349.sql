
-- ============ MUTFAK: Notes / Docs / Sheets / Drive ============

-- 1) NOTLAR
CREATE TABLE public.mutfak_not (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  baslik text,
  icerik text NOT NULL DEFAULT '',
  renk text NOT NULL DEFAULT 'sari',
  pinned boolean NOT NULL DEFAULT false,
  etiketler text[] NOT NULL DEFAULT '{}',
  arsiv boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.mutfak_not ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mutfak_not select" ON public.mutfak_not FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "mutfak_not insert" ON public.mutfak_not FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "mutfak_not update" ON public.mutfak_not FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "mutfak_not delete" ON public.mutfak_not FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER mutfak_not_updated_at BEFORE UPDATE ON public.mutfak_not
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_mutfak_not_user ON public.mutfak_not(user_id, pinned DESC, updated_at DESC);

-- 2) BELGE (Docs)
CREATE TABLE public.mutfak_belge (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  baslik text NOT NULL DEFAULT 'Adsız belge',
  icerik jsonb NOT NULL DEFAULT '{"type":"doc","content":[]}'::jsonb,
  emoji text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.mutfak_belge ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mutfak_belge select" ON public.mutfak_belge FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "mutfak_belge insert" ON public.mutfak_belge FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "mutfak_belge update" ON public.mutfak_belge FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "mutfak_belge delete" ON public.mutfak_belge FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER mutfak_belge_updated_at BEFORE UPDATE ON public.mutfak_belge
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_mutfak_belge_user ON public.mutfak_belge(user_id, updated_at DESC);

-- 3) TABLO (Sheets)
CREATE TABLE public.mutfak_tablo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  baslik text NOT NULL DEFAULT 'Adsız tablo',
  kolonlar jsonb NOT NULL DEFAULT '[]'::jsonb,
  satirlar jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.mutfak_tablo ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mutfak_tablo select" ON public.mutfak_tablo FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "mutfak_tablo insert" ON public.mutfak_tablo FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "mutfak_tablo update" ON public.mutfak_tablo FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "mutfak_tablo delete" ON public.mutfak_tablo FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER mutfak_tablo_updated_at BEFORE UPDATE ON public.mutfak_tablo
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_mutfak_tablo_user ON public.mutfak_tablo(user_id, updated_at DESC);

-- 4) DOSYA (Drive metadata)
CREATE TABLE public.mutfak_dosya (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  ad text NOT NULL,
  mime_type text,
  boyut bigint NOT NULL DEFAULT 0,
  klasor text NOT NULL DEFAULT '/',
  storage_path text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.mutfak_dosya ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mutfak_dosya select" ON public.mutfak_dosya FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "mutfak_dosya insert" ON public.mutfak_dosya FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "mutfak_dosya update" ON public.mutfak_dosya FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "mutfak_dosya delete" ON public.mutfak_dosya FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_mutfak_dosya_user ON public.mutfak_dosya(user_id, klasor, created_at DESC);

-- 5) STORAGE BUCKET
INSERT INTO storage.buckets (id, name, public) VALUES ('mutfak-dosya', 'mutfak-dosya', false)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "mutfak-dosya select" ON storage.objects FOR SELECT
  USING (bucket_id = 'mutfak-dosya' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "mutfak-dosya insert" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'mutfak-dosya' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "mutfak-dosya update" ON storage.objects FOR UPDATE
  USING (bucket_id = 'mutfak-dosya' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "mutfak-dosya delete" ON storage.objects FOR DELETE
  USING (bucket_id = 'mutfak-dosya' AND auth.uid()::text = (storage.foldername(name))[1]);
