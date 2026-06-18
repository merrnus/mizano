# Tutarsızlık Temizliği — Tur 1

Üç başlığı tek seferde toparlıyoruz: ölü dashboard bileşenleri, `mizan.mana` durumu ve `__root.tsx` meta. #4 (setInterval → useNow) ve #5 (baglam_turu normalize) ayrı tura bırakılıyor — biri davranış, diğeri veri modeli kararı.

## 1) Ölü dashboard bileşenlerini sil

Hiçbir yerden import edilmeyen, `BugunAkisi`'nin yerini aldığı dosyalar:

- `src/components/mizan/dashboard/bugun-cetelesi.tsx`
- `src/components/mizan/dashboard/bugunun-mufredati.tsx`
- `src/components/mizan/dashboard/akis-modu.tsx`
- `src/components/mizan/dashboard/amel-akis-modu.tsx`
- `src/components/mizan/dashboard/bu-hafta-widget.tsx`
- `src/components/mizan/dashboard/bugun-zaman-cizelgesi.tsx`
- `src/components/mizan/dashboard/cetele-bugun-mini.tsx`
- `src/components/mizan/dashboard/gelecek-gunler.tsx`
- `src/components/mizan/dashboard/gunluk-checklist.tsx`
- `src/components/mizan/dashboard/now-card.tsx`
- `src/components/mizan/dashboard/odak-karti.tsx`

Silmeden hemen önce her dosya için son bir `rg` kontrolü yapılır (gerçekten 0 referans). Korunanlar: `BugunAkisi`, `BriefRings`, `BugunFab`, `EtkinlikDetaySheet`, `GorevDetaySheet`, `KategoriYonetDialog`, `KisiOzetSheet`.

## 2) `mizan.mana` kararı: KORUNUYOR, sidebar'a ekleniyor

`/mizan/mana` rotası çalışıyor, çetele sistemi hâlâ canlı, `BugunAkisi` ve `CeteleBugunMini` oraya link veriyordu. Topbar etiketi ve route var ama sol sidebar'da görünmüyor — kullanıcı doğrudan ulaşamıyor. Çözüm: silmek yerine sidebar'da `İstikamet`'in altına eklemek.

- `src/components/mizan/sol-sidebar.tsx` — `Mana` (veya `Çetele`) maddesini ekle, `--mana` rengiyle.
- Topbar etiketini olduğu gibi bırak.

(Alternatif: tamamen sil. Ama çetele sistemi kullanıcının yatırımı olan veri — silmek erken. Önce görünür yap, kullanım gözlemle.)

## 3) `__root.tsx` meta güncelle

Şu an `description` iki kez tanımlı (biri "akademi, maneviyat…", diğeri "Bismillah") — sonuncu kazanır ama kafa karıştırıcı. Temizlik:

- Duplike `description` / `og:description` / `twitter:description` satırlarını tek sete indir.
- Açıklama "akademi, maneviyat, hedefler ve kardeşler" yerine güncel kavramlarla: **mana, ilim, amel — denge ve istikamet**.
- "Bismillah" kısa açıklamasını koru ama yalnız bir yerde.

Önerilen tek metin:
- `title`: "Mizan — Denge Sistemi" (aynı)
- `description`: "Mana, ilim, amel — hayatın üç alanında denge ve istikamet."
- `og:description` / `twitter:description`: aynı tek satır.

## Teknik notlar

- Silme: `rm` ile, tek `code--exec` çağrısında batch.
- `routeTree.gen.ts`'e dokunmuyoruz (sadece komponent silimi).
- Build sonrası TS hatası beklenmiyor — `rg` ile sıfır referans doğrulandıktan sonra siliniyor.

## Dışarıda bırakılanlar (sonraki turlar)

- **#4** `mizan.index.tsx` ve `hafta-gorunumu.tsx` içindeki yerel `setInterval` → `useNow`. Küçük refactor, ayrı tur.
- **#5** `baglam_turu` değerleri (`"kurs"`/`"ders"` vs alan adları). Veri kararı — kullanıcı onayı gerek.
