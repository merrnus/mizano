-- amel_kurs_durum enum'ını 5'ten 3'e indir: aktif, planli, tamam

-- 1. Yeni enum oluştur
CREATE TYPE public.amel_kurs_durum_yeni AS ENUM ('planli', 'aktif', 'tamam');

-- 2. Default'u kaldır (cast için)
ALTER TABLE public.amel_kurs ALTER COLUMN durum DROP DEFAULT;

-- 3. Eski değerleri yeniye eşleyerek dönüştür
ALTER TABLE public.amel_kurs
  ALTER COLUMN durum TYPE public.amel_kurs_durum_yeni
  USING (
    CASE durum::text
      WHEN 'izliyor'   THEN 'aktif'
      WHEN 'beklemede' THEN 'planli'
      WHEN 'birakti'   THEN 'tamam'
      WHEN 'planli'    THEN 'planli'
      WHEN 'tamam'     THEN 'tamam'
    END
  )::public.amel_kurs_durum_yeni;

-- 4. Yeni default
ALTER TABLE public.amel_kurs ALTER COLUMN durum SET DEFAULT 'planli'::public.amel_kurs_durum_yeni;

-- 5. Eski enum'ı sil ve yenisini orijinal isme al
DROP TYPE public.amel_kurs_durum;
ALTER TYPE public.amel_kurs_durum_yeni RENAME TO amel_kurs_durum;