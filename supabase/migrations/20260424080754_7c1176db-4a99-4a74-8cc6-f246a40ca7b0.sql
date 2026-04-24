-- Enum: hedef tipi
CREATE TYPE public.hedef_tip AS ENUM ('kurs', 'aliskanlik', 'proje', 'sayisal', 'tekil');

-- Enum: hedef durumu
CREATE TYPE public.hedef_durum AS ENUM ('aktif', 'tamamlandi', 'arsiv');

-- Enum: streak birimi
CREATE TYPE public.streak_birim AS ENUM ('gunluk', 'haftalik');

-- Tablo: hedef
CREATE TABLE public.hedef (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  ad TEXT NOT NULL,
  aciklama TEXT,
  alan public.cetele_alan NOT NULL DEFAULT 'amel',
  tip public.hedef_tip NOT NULL,
  baslangic DATE NOT NULL DEFAULT CURRENT_DATE,
  bitis DATE,
  durum public.hedef_durum NOT NULL DEFAULT 'aktif',
  hedef_miktar NUMERIC,
  birim TEXT,
  sablon_id UUID REFERENCES public.cetele_sablon(id) ON DELETE SET NULL,
  streak_birim public.streak_birim,
  notlar TEXT,
  siralama INTEGER NOT NULL DEFAULT 0,
  tamamlanma DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.hedef ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Kullanıcılar kendi hedeflerini görür"
  ON public.hedef FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Kullanıcılar kendi hedeflerini ekler"
  ON public.hedef FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Kullanıcılar kendi hedeflerini günceller"
  ON public.hedef FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Kullanıcılar kendi hedeflerini siler"
  ON public.hedef FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER hedef_updated_at
  BEFORE UPDATE ON public.hedef
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_hedef_user_durum ON public.hedef(user_id, durum);
CREATE INDEX idx_hedef_user_alan ON public.hedef(user_id, alan);

-- Tablo: hedef_adim (kurs modülleri / proje milestone'ları)
CREATE TABLE public.hedef_adim (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hedef_id UUID NOT NULL REFERENCES public.hedef(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  baslik TEXT NOT NULL,
  aciklama TEXT,
  tamamlandi BOOLEAN NOT NULL DEFAULT false,
  tamamlanma DATE,
  vade DATE,
  siralama INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.hedef_adim ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Kullanıcılar kendi adımlarını görür"
  ON public.hedef_adim FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Kullanıcılar kendi adımlarını ekler"
  ON public.hedef_adim FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Kullanıcılar kendi adımlarını günceller"
  ON public.hedef_adim FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Kullanıcılar kendi adımlarını siler"
  ON public.hedef_adim FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER hedef_adim_updated_at
  BEFORE UPDATE ON public.hedef_adim
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_hedef_adim_hedef ON public.hedef_adim(hedef_id, siralama);