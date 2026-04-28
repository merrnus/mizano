-- 1. Tablo
CREATE TABLE public.cetele_baglam (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  slug text NOT NULL,
  etiket text NOT NULL,
  emoji text NOT NULL DEFAULT '📌',
  renk text NOT NULL DEFAULT 'sky',
  siralama integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, slug)
);

CREATE INDEX idx_cetele_baglam_user ON public.cetele_baglam(user_id, siralama);

-- 2. RLS
ALTER TABLE public.cetele_baglam ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cetele_baglam select" ON public.cetele_baglam
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "cetele_baglam insert" ON public.cetele_baglam
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "cetele_baglam update" ON public.cetele_baglam
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "cetele_baglam delete" ON public.cetele_baglam
  FOR DELETE USING (auth.uid() = user_id);

-- 3. Trigger
CREATE TRIGGER cetele_baglam_set_updated_at
  BEFORE UPDATE ON public.cetele_baglam
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 4. Default seed mevcut kullanıcılar için (cetele_sablon'dan kullanıcıları al)
INSERT INTO public.cetele_baglam (user_id, slug, etiket, emoji, renk, siralama)
SELECT u.user_id, v.slug, v.etiket, v.emoji, v.renk, v.siralama
FROM (SELECT DISTINCT user_id FROM public.cetele_sablon) u
CROSS JOIN (VALUES
  ('masa', 'Masa Başı', '🏠', 'sky', 0),
  ('yol', 'Yolda', '🚌', 'emerald', 1),
  ('cami', 'Camide', '🕌', 'amber', 2),
  ('dinlenme', 'Dinlenme', '🛋️', 'violet', 3)
) AS v(slug, etiket, emoji, renk, siralama)
ON CONFLICT (user_id, slug) DO NOTHING;