
-- 1) gorev_kategori
CREATE TABLE public.gorev_kategori (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  ad text NOT NULL,
  emoji text,
  renk text,
  siralama integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.gorev_kategori ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gorev_kategori select" ON public.gorev_kategori
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "gorev_kategori insert" ON public.gorev_kategori
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "gorev_kategori update" ON public.gorev_kategori
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "gorev_kategori delete" ON public.gorev_kategori
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER trg_gorev_kategori_updated_at
  BEFORE UPDATE ON public.gorev_kategori
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2) cetele_sablon yeni kolonlar
ALTER TABLE public.cetele_sablon
  ADD COLUMN kategori_id uuid REFERENCES public.gorev_kategori(id) ON DELETE SET NULL,
  ADD COLUMN tahmini_sure_dk integer;

-- 3) gunluk_gorev
CREATE TABLE public.gunluk_gorev (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tarih date NOT NULL DEFAULT CURRENT_DATE,
  baslik text NOT NULL,
  tahmini_sure_dk integer,
  kategori_id uuid REFERENCES public.gorev_kategori(id) ON DELETE SET NULL,
  sablon_id uuid REFERENCES public.cetele_sablon(id) ON DELETE SET NULL,
  tamamlandi boolean NOT NULL DEFAULT false,
  tamamlanma_at timestamptz,
  siralama integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_gunluk_gorev_user_tarih ON public.gunluk_gorev(user_id, tarih);

ALTER TABLE public.gunluk_gorev ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gunluk_gorev select" ON public.gunluk_gorev
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "gunluk_gorev insert" ON public.gunluk_gorev
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "gunluk_gorev update" ON public.gunluk_gorev
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "gunluk_gorev delete" ON public.gunluk_gorev
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER trg_gunluk_gorev_updated_at
  BEFORE UPDATE ON public.gunluk_gorev
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
