
# Rapor sayfasını sadeleştir — "tek bakışta okunur" hale getir

## Sorun
Şu an sayfada çok fazla görsel yük var:
- Filtre bloğu 4 alt bölümden oluşuyor (tarih + hızlı butonlar, sonuç doluluğu toggle, gündem durumu toggle, kategori chip'leri, kapsam toggle, "boş göster" checkbox) ve büyük bir kart kaplıyor.
- 3 özet kart yan yana (her biri başlık + büyük rakam + 2 alt satır) — ekranda ayrı bir bölüm daha açıyor.
- Her kategori bir kart, içinde her kişi için ayrı bir blok, her blokta 4 kolonlu mini tablolar (tarih · sol · sağ · rozet) — derinlik 3 seviye, satırlar dar olduğu için metin kırılıyor.
- Sonuç: kullanıcı "şu an aralık ne, kim ne yapmış" sorusuna 2-3 saniyede cevap bulamıyor.

## Hedef
Tek bir okunabilir akış: **Üstte tek satır kontrol → tek satır özet → kategori → kişi kart listesi.** Her şey isteğe bağlı/gizlenebilir, varsayılan görünüm minimal.

## Değişiklikler

### 1. Filtre bloğunu **tek satır kontrol çubuğuna** indir (`network.rapor.tsx`)
- Büyük "Filtreler" kartını kaldır. Yerine başlığın hemen altında **yapışkan/kompakt bir çubuk** koy:
  - **Tarih:** tek bir Popover butonu (`"Son 30 gün ▾"`). Açılınca: hızlı seçenekler (Bu hafta / Bu ay / Son 30 gün / Son 3 ay) + altında iki date input (özel aralık).
  - **Kategori:** tek bir Popover butonu (`"Kategoriler · 2 seçili"` veya `"Tüm kategoriler"`). Açılınca chip listesi.
  - **Kapsam:** kompakt 3'lü segment (Gündem · Faaliyet · Maneviyat) ikon + çok kısa etiket. Varsayılan sadece "Gündem + Faaliyet".
  - **"Daha fazla filtre"** açılır menüsü (isteğe bağlı): sonuç doluluğu (Tümü/Dolu/Boş), gündem durumu (Tümü/Bekliyor/Yapıldı), "boş kategorileri göster" checkbox. **Varsayılan kapalı** — çoğu kullanıcı bunlara hiç dokunmuyor.
  - Sağda **PDF indir** butonu.
- Çubuk `sticky top-0` olabilir, sayfa kayarken erişilebilir kalır.

### 2. Özet bölümünü **tek satır şeride** indir
- 3 ayrı kartı kaldır. Yerine tek bir ince bant:
  ```
  📅 30 gün  ·  📂 Tüm kategoriler  ·  📋 12 gündem (8 sonuçlu, %67)  ·  ⚡ 24 faaliyet (18 sonuçlu, %75)  ·  ✨ 6 kişi
  ```
- Aktif kapsama göre alanlar görünür/gizli. Yer az, bilgi yoğun, yatay tek satır (mobilde sarsın).

### 3. Kategori → kişi listesini **akordiyon + kompakt satıra** çevir
Şu anki yapı: her kategori bir kart, içinde her kişi için ayrı bölüm, her bölümde mini tablolar. Çok derin.

Yeni yapı:
- Her **kategori** = bir başlık satırı (renk noktası · ad · "5 kardeş, 12 kayıt"). Tıklayınca açılır/kapanır (varsayılan açık).
- Her **kişi** = ince bir satır:
  ```
  ▸ Ahmet Y.        3 gündem · 2 faaliyet · ✨ %80           [→ profil]
  ```
  Tıklayınca aşağı doğru detay açılır (kişi bazlı akordiyon).
- Kişi detayı açıldığında tek bir **birleşik zaman çizelgesi** göster:
  - Gündem ve faaliyet karışık, tarih sırasıyla.
  - Her satır: `[ikon] [tarih] başlık → sonuç/karar` (sonuç boşsa kırmızı `Sonuç eksik` rozeti).
  - 4 kolonlu mini tablo yok, sadece liste. Daha az çizgi, daha az kolon ayracı.
- Maneviyat varsa kişi başlığı satırının sağına küçük rozet (`✨ %80`).

### 4. Boş durum & yükleme
- "Bu kriterlerle kayıt yok" mesajı tek satır, ikon yok, sade.
- Yüklenirken inline skeleton (3-4 boş satır), büyük "Yükleniyor…" kutusu kullanılmaz.

### 5. Kart/border yoğunluğunu azalt
- Kategori başlıkları artık `bg-muted` şerit yerine sade ayraç (`border-b`) + biraz boşluk.
- Kişi satırları arasında ince ayraç (`divide-y divide-border/50`) yeterli, her birine `rounded-xl border` koyma.
- Mini tablolardaki `rounded-md border bg-background/40` kalkar — sadece tarih + metin.

## Bilgi mimarisi karşılaştırması

**Önce (şu an):**
```
[Filtre Kartı: tarih · hızlı · sonuç · gündem · kategoriler · kapsam · checkbox]
[Özet Kart 1] [Özet Kart 2] [Özet Kart 3]
[Kategori Kartı]
  ┗ Kişi Bloğu
      ┗ Mini Tablo: Gündemler (4 kolon)
      ┗ Mini Tablo: Faaliyetler (4 kolon)
      ┗ Maneviyat şeridi
  ┗ Kişi Bloğu …
```

**Sonra (önerilen):**
```
[Sticky çubuk: 📅 ▾ · 📂 ▾ · [Gündem|Faaliyet|Maneviyat] · ⋯ · [PDF]]
[Tek satır özet: 30g · 12 gündem (67%) · 24 faaliyet (75%) · 6 kişi]
■ Evdekiler — 5 kardeş, 12 kayıt              ▾
   Ahmet Y.    3 · 2 · ✨80%                   ▸
   Mehmet K.   1 · 4                            ▸
■ GG — 3 kardeş, 8 kayıt                       ▾
   …
```
Kişi açılırsa altına birleşik kronolojik liste düşer.

## Davranış kuralları
- Varsayılan: tüm kategoriler açık, kişiler kapalı (ad/sayı görünür, detay tıklayınca açılır).
- Kullanıcı kategori chip'i seçerse otomatik o kategori açık, diğerleri görünmez (zaten filtre).
- "Daha fazla filtre" varsayılan kapalı; bir alan değiştirilince başlığında "● 1" işareti.
- Tarih popover'ı kapanınca otomatik uygula.
- PDF butonu görünür yapıyı bire bir basar (mevcut PDF'in kategori → kişi yapısı zaten uygun, **PDF kodunda değişiklik yok**).

## Dosya değişiklikleri
- **Düzenle:** `src/routes/network.rapor.tsx` — sayfa baştan organize edilir; `KategoriKart`, `KisiBlokSatir`, `MiniListe`, `OzetKart` bileşenleri yeniden yazılır (akordiyon + kompakt satır + birleşik zaman çizelgesi). Search şeması ve filtre mantığı **aynı kalır** (URL state korunur).
- **Düzenle (küçük):** Yeni filtre çubuğu için shadcn `Popover` kullanılacak — zaten `src/components/ui/popover.tsx` mevcut.
- **Değişmez:** `src/lib/network-hooks.ts`, `src/lib/network-rapor-pdf.ts`, `src/lib/network-tipleri.ts`. Veri akışı, gruplandırma fonksiyonu (`gruplandir`) ve PDF üretimi olduğu gibi kalır.

## Geri dönüş garantisi
- URL search şeması aynı (`from`, `to`, `kategoriIds`, `kapsam`, `sonucDurumu`, `gundemDurumu`, `bosGoster`) — eski bookmark'lar çalışmaya devam eder.
- PDF çıktısı değişmez.
- Hiçbir veri kaybı yok, sadece görsel hiyerarşi sadeleşiyor.
