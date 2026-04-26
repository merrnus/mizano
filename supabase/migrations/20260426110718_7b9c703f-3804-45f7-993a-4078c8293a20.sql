-- 3 aylık müfredat
CREATE TABLE public.kardes_mufredat (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  kisi_id UUID NOT NULL REFERENCES public.gundem_kisi(id) ON DELETE CASCADE,
  baslik TEXT NOT NULL DEFAULT '3 Aylık Hedef',
  baslangic DATE,
  bitis DATE,
  maddeler JSONB NOT NULL DEFAULT '[]'::jsonb,
  arsiv BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.kardes_mufredat ENABLE ROW LEVEL SECURITY;

CREATE POLICY "kardes_mufredat select" ON public.kardes_mufredat FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "kardes_mufredat insert" ON public.kardes_mufredat FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "kardes_mufredat update" ON public.kardes_mufredat FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "kardes_mufredat delete" ON public.kardes_mufredat FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_kardes_mufredat_kisi ON public.kardes_mufredat(kisi_id, arsiv);

CREATE TRIGGER trg_kardes_mufredat_updated
BEFORE UPDATE ON public.kardes_mufredat
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Evrâd maddeleri (kişi başına şablon)
CREATE TABLE public.kardes_evrad_madde (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  kisi_id UUID NOT NULL REFERENCES public.gundem_kisi(id) ON DELETE CASCADE,
  metin TEXT NOT NULL,
  siralama INTEGER NOT NULL DEFAULT 0,
  aktif BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.kardes_evrad_madde ENABLE ROW LEVEL SECURITY;

CREATE POLICY "kardes_evrad_madde select" ON public.kardes_evrad_madde FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "kardes_evrad_madde insert" ON public.kardes_evrad_madde FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "kardes_evrad_madde update" ON public.kardes_evrad_madde FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "kardes_evrad_madde delete" ON public.kardes_evrad_madde FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_kardes_evrad_madde_kisi ON public.kardes_evrad_madde(kisi_id, aktif);

CREATE TRIGGER trg_kardes_evrad_madde_updated
BEFORE UPDATE ON public.kardes_evrad_madde
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Evrâd günlük tamamlanma kayıtları
CREATE TABLE public.kardes_evrad_kayit (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  kisi_id UUID NOT NULL REFERENCES public.gundem_kisi(id) ON DELETE CASCADE,
  madde_id UUID NOT NULL REFERENCES public.kardes_evrad_madde(id) ON DELETE CASCADE,
  tarih DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (madde_id, tarih)
);

ALTER TABLE public.kardes_evrad_kayit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "kardes_evrad_kayit select" ON public.kardes_evrad_kayit FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "kardes_evrad_kayit insert" ON public.kardes_evrad_kayit FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "kardes_evrad_kayit delete" ON public.kardes_evrad_kayit FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_kardes_evrad_kayit_kisi_tarih ON public.kardes_evrad_kayit(kisi_id, tarih);