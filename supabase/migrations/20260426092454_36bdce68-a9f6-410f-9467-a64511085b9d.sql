-- ENUM types
CREATE TYPE public.gundem_durum AS ENUM ('bekliyor', 'yapiliyor', 'yapildi', 'ertelendi');
CREATE TYPE public.gundem_oncelik AS ENUM ('ana', 'yan');

-- gundem_kategori
CREATE TABLE public.gundem_kategori (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  ad text NOT NULL,
  renk text,
  siralama integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.gundem_kategori ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gundem_kategori select" ON public.gundem_kategori FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "gundem_kategori insert" ON public.gundem_kategori FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "gundem_kategori update" ON public.gundem_kategori FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "gundem_kategori delete" ON public.gundem_kategori FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER gundem_kategori_updated BEFORE UPDATE ON public.gundem_kategori FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- gundem_kisi
CREATE TABLE public.gundem_kisi (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  ad text NOT NULL,
  notlar text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.gundem_kisi ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gundem_kisi select" ON public.gundem_kisi FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "gundem_kisi insert" ON public.gundem_kisi FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "gundem_kisi update" ON public.gundem_kisi FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "gundem_kisi delete" ON public.gundem_kisi FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER gundem_kisi_updated BEFORE UPDATE ON public.gundem_kisi FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_gundem_kisi_user ON public.gundem_kisi(user_id);

-- gundem_kisi_kategori
CREATE TABLE public.gundem_kisi_kategori (
  user_id uuid NOT NULL,
  kisi_id uuid NOT NULL,
  kategori_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (kisi_id, kategori_id)
);
ALTER TABLE public.gundem_kisi_kategori ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gundem_kisi_kategori select" ON public.gundem_kisi_kategori FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "gundem_kisi_kategori insert" ON public.gundem_kisi_kategori FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "gundem_kisi_kategori delete" ON public.gundem_kisi_kategori FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_gkk_kategori ON public.gundem_kisi_kategori(kategori_id);
CREATE INDEX idx_gkk_user ON public.gundem_kisi_kategori(user_id);

-- istisare
CREATE TABLE public.istisare (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tarih date NOT NULL DEFAULT CURRENT_DATE,
  baslik text NOT NULL DEFAULT 'İstişare',
  notlar text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.istisare ENABLE ROW LEVEL SECURITY;
CREATE POLICY "istisare select" ON public.istisare FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "istisare insert" ON public.istisare FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "istisare update" ON public.istisare FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "istisare delete" ON public.istisare FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER istisare_updated BEFORE UPDATE ON public.istisare FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_istisare_user_tarih ON public.istisare(user_id, tarih DESC);

-- gundem
CREATE TABLE public.gundem (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  istisare_id uuid NOT NULL,
  icerik text NOT NULL,
  karar text,
  deadline date,
  durum public.gundem_durum NOT NULL DEFAULT 'bekliyor',
  oncelik public.gundem_oncelik NOT NULL DEFAULT 'ana',
  etiketler text[] NOT NULL DEFAULT '{}',
  siralama integer NOT NULL DEFAULT 0,
  tamamlanma date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.gundem ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gundem select" ON public.gundem FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "gundem insert" ON public.gundem FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "gundem update" ON public.gundem FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "gundem delete" ON public.gundem FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER gundem_updated BEFORE UPDATE ON public.gundem FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_gundem_user_istisare ON public.gundem(user_id, istisare_id);
CREATE INDEX idx_gundem_user_durum_deadline ON public.gundem(user_id, durum, deadline);

-- gundem_sorumlu
CREATE TABLE public.gundem_sorumlu (
  user_id uuid NOT NULL,
  gundem_id uuid NOT NULL,
  kisi_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (gundem_id, kisi_id)
);
ALTER TABLE public.gundem_sorumlu ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gundem_sorumlu select" ON public.gundem_sorumlu FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "gundem_sorumlu insert" ON public.gundem_sorumlu FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "gundem_sorumlu delete" ON public.gundem_sorumlu FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_gs_kisi ON public.gundem_sorumlu(kisi_id);
CREATE INDEX idx_gs_user ON public.gundem_sorumlu(user_id);

-- gundem_yorum
CREATE TABLE public.gundem_yorum (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  gundem_id uuid NOT NULL,
  metin text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.gundem_yorum ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gundem_yorum select" ON public.gundem_yorum FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "gundem_yorum insert" ON public.gundem_yorum FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "gundem_yorum update" ON public.gundem_yorum FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "gundem_yorum delete" ON public.gundem_yorum FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_gy_gundem ON public.gundem_yorum(gundem_id, created_at DESC);