-- 1) Yeni enum tipi
CREATE TYPE public.cetele_alan_v2 AS ENUM ('mana', 'ilim', 'amel', 'kisisel');

-- 2) cetele_sablon: default kaldır, kolonu yeni tipe çevir, default geri koy
ALTER TABLE public.cetele_sablon ALTER COLUMN alan DROP DEFAULT;
ALTER TABLE public.cetele_sablon
  ALTER COLUMN alan TYPE public.cetele_alan_v2
  USING (
    CASE alan::text
      WHEN 'maneviyat' THEN 'mana'
      WHEN 'akademi'   THEN 'ilim'
      WHEN 'dunyevi'   THEN 'amel'
      WHEN 'kisisel'   THEN 'kisisel'
    END
  )::public.cetele_alan_v2;
ALTER TABLE public.cetele_sablon ALTER COLUMN alan SET DEFAULT 'mana'::public.cetele_alan_v2;

-- 3) takvim_etkinlik
ALTER TABLE public.takvim_etkinlik ALTER COLUMN alan DROP DEFAULT;
ALTER TABLE public.takvim_etkinlik
  ALTER COLUMN alan TYPE public.cetele_alan_v2
  USING (
    CASE alan::text
      WHEN 'maneviyat' THEN 'mana'
      WHEN 'akademi'   THEN 'ilim'
      WHEN 'dunyevi'   THEN 'amel'
      WHEN 'kisisel'   THEN 'kisisel'
    END
  )::public.cetele_alan_v2;
ALTER TABLE public.takvim_etkinlik ALTER COLUMN alan SET DEFAULT 'kisisel'::public.cetele_alan_v2;

-- 4) takvim_gorev
ALTER TABLE public.takvim_gorev ALTER COLUMN alan DROP DEFAULT;
ALTER TABLE public.takvim_gorev
  ALTER COLUMN alan TYPE public.cetele_alan_v2
  USING (
    CASE alan::text
      WHEN 'maneviyat' THEN 'mana'
      WHEN 'akademi'   THEN 'ilim'
      WHEN 'dunyevi'   THEN 'amel'
      WHEN 'kisisel'   THEN 'kisisel'
    END
  )::public.cetele_alan_v2;
ALTER TABLE public.takvim_gorev ALTER COLUMN alan SET DEFAULT 'kisisel'::public.cetele_alan_v2;

-- 5) Eski enum'u sil ve yeniyi orijinal isimle yeniden adlandır
DROP TYPE public.cetele_alan;
ALTER TYPE public.cetele_alan_v2 RENAME TO cetele_alan;