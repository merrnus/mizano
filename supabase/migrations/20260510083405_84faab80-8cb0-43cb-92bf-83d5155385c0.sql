
-- 1. takvim tablosu
CREATE TABLE public.takvim (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  ad text NOT NULL,
  renk text NOT NULL DEFAULT 'cal-1',
  gorunur boolean NOT NULL DEFAULT true,
  is_default boolean NOT NULL DEFAULT false,
  siralama integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.takvim ENABLE ROW LEVEL SECURITY;

CREATE POLICY "takvim select" ON public.takvim FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "takvim insert" ON public.takvim FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "takvim update" ON public.takvim FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "takvim delete" ON public.takvim FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER takvim_updated_at
  BEFORE UPDATE ON public.takvim
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2. takvim_etkinlik kolon ekleri
ALTER TABLE public.takvim_etkinlik
  ADD COLUMN IF NOT EXISTS takvim_id uuid,
  ADD COLUMN IF NOT EXISTS renk text,
  ADD COLUMN IF NOT EXISTS tum_gun_bitis date,
  ADD COLUMN IF NOT EXISTS hatirlatici_dk integer,
  ADD COLUMN IF NOT EXISTS tekrar_kural text;

-- 3. Her kullanıcıya varsayılan "Kişisel" takvim oluştur ve mevcut etkinlikleri bağla
DO $$
DECLARE
  rec record;
  yeni_id uuid;
BEGIN
  FOR rec IN SELECT DISTINCT user_id FROM public.takvim_etkinlik LOOP
    INSERT INTO public.takvim (user_id, ad, renk, is_default, siralama)
    VALUES (rec.user_id, 'Kişisel', 'cal-1', true, 0)
    RETURNING id INTO yeni_id;

    UPDATE public.takvim_etkinlik
      SET takvim_id = yeni_id
      WHERE user_id = rec.user_id AND takvim_id IS NULL;
  END LOOP;
END $$;

CREATE INDEX IF NOT EXISTS idx_takvim_etkinlik_takvim_id ON public.takvim_etkinlik(takvim_id);
CREATE INDEX IF NOT EXISTS idx_takvim_etkinlik_user_baslangic ON public.takvim_etkinlik(user_id, baslangic);

-- 4. Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.takvim;
ALTER PUBLICATION supabase_realtime ADD TABLE public.takvim_etkinlik;
