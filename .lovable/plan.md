
# Raporu kategori bazlı hiyerarşik yapıya dönüştür

## Amaç
Şu anki rapor "düz tablo + tek kişi filtresi" mantığında. Kullanıcı şunu istiyor: rapor **kategoriler** üzerinden okunsun (Evdekiler, GG, OMM…), her kategorinin içinde **o kategoriye düşen her kardeşin** o aralıktaki gündem kararları + faaliyet sonuçları görülsün. Yani bir kategori = bir bölüm; içinde kişi başına alt kart.

Hiyerarşi:
```
[KATEGORİ: Evdekiler]
  └─ Ahmet Y.
       • Gündemler (kararlar): …
       • Faaliyetler (sonuçlar): …
  └─ Mehmet K.
       • Gündemler …
       • Faaliyetler …
[KATEGORİ: GG]
  …
```

## Değişiklikler

### 1. `src/routes/network.rapor.tsx`
- **Kişi filtresini kaldır** (`kisiId` search paramı + Select). Kişi artık sonuç içindeki bir grup başlığı, filtre değil.
- **Kategori filtresi mevcut** — birden fazla seçilebilir; hiçbiri seçilmezse "tüm kategoriler" gibi davransın (bütün kategoriler bölüm olarak çıksın). Bu şekilde varsayılan deneyim de hiyerarşik olur.
- "Gündemler ve Kararlar" + "Kardeş Faaliyetleri" bölümlerini iki ayrı düz tablo olmaktan çıkar; tek bir **"Kategori bazlı rehberlik"** bölümüne dönüştür:
  - Her kategori için bir kart (renk noktası + ad + toplam kişi sayısı).
  - Kategori altında, o kategorideki her kişi için bir alt blok.
  - Alt blokta iki mini tablo / liste:
    - **Gündem kararları:** o kişinin sorumlu olduğu, aralıktaki gündemler — tarih · içerik · karar (boşsa "Sonuç eksik" rozeti) · durum.
    - **Faaliyetler & sonuçlar:** o kişiye ait `kardes_etkinlik` — tarih · tip · başlık · sonuç (boşsa "Sonuç eksik").
  - Kişide hiç gündem/faaliyet yoksa "bu aralıkta kayıt yok" notu (kapsam seçimine göre).
- Maneviyat kapsamı seçiliyse, her kişi bloğunun altına küçük bir maneviyat satırı ekle (müfredat % + evrad doluluk %). Kategoriye göre filtrelenmiş halde.
- "Bir kategoriye düşmeyen" kişiler için en altta opsiyonel **"Kategorisiz"** bölümü (sadece o kişilerin de gündem/faaliyeti varsa görünür).
- Üst özet kartlar aynen kalır (toplam gündem, toplam faaliyet, maneviyat ortalamaları).
- Hızlı tarih butonları, kapsam toggle'ları, sonuç doluluğu ve gündem durumu filtreleri **aynen kalır**.

### 2. `src/lib/network-hooks.ts`
- `RaporFiltre`'den `kisiId` alanını kaldır (artık kullanılmıyor).
- `useRaporGundemler` & `useRaporFaaliyetler` & `useRaporManeviyat` query key'lerinden `kisiId` çıkar.
- `useRaporGundemler` ve `useRaporFaaliyetler` içindeki `if (filtre.kisiId)` bloklarını sil — gruplandırma artık component tarafında yapılacak.
- Hook'ların döndürdüğü satırlar zaten `kisi_id` / `sorumlu_ids` içeriyor, gruplandırma için yeterli. **Şema değişikliği yok.**
- Yeni yardımcı: `useKisiKategoriBaglari()` — `gundem_kisi_kategori` tablosundan tüm `(kisi_id, kategori_id)` çiftlerini tek seferde çekip Map döner; rapor sayfası kişi → kategori eşlemesini bundan yapar (aksi halde her kişi için ayrı sorgu olurdu). Var olan `useKisiler()` zaten `KisiDetay` döndürüyor mu kontrol edilecek; dönüyorsa onu kullanırız, yeni hook'a gerek kalmayabilir.

### 3. `src/lib/network-rapor-pdf.ts`
- PDF'i de aynı hiyerarşiyle üret:
  - Her kategori için yeni bölüm başlığı.
  - Her kişi için alt başlık + iki küçük tablo (Gündemler / Faaliyetler).
- `RaporPdfGirdi`'ye `gruplar: { kategori: {id, ad, renk}, kisiler: { kisi_id, kisi_ad, gundemler, faaliyetler, maneviyat? }[] }[]` şeklinde önceden gruplandırılmış veri gelsin (gruplandırma component tarafında bir kez yapılır, PDF'e hazır verilir). Eski "düz gundemler/faaliyetler" alanlarını kaldır.
- Türkçe karakter sadeleştirme (`trText`) korunur.

### 4. UX detayları
- Boş kategoriler (o aralıkta hiçbir kişide kayıt yok) varsayılan olarak gizli; toggle ile gösterilebilir ("Boş kategorileri göster").
- Bir kişi birden fazla kategoride ise, **her kategoride tekrar listelenir** (kasıtlı — kategori bazlı okuma için). İstersek "her kişi tek bir birincil kategoride" kuralı eklenebilir ama mevcut veri modeli buna uygun değil; tekrar listeleme daha doğru.
- Kişi başlığına tıklayınca `/network/kisi/$id` profiline gider (mevcut link kullanılabilir).

## Veritabanı değişikliği
**Yok.** Mevcut `gundem_kisi_kategori` tablosu kişi-kategori eşlemesini zaten tutuyor.

## Dosya değişiklikleri
- **Güncel:** `src/routes/network.rapor.tsx` (büyük yeniden düzenleme — kişi filtresi çıkar, hiyerarşik render eklenir)
- **Güncel:** `src/lib/network-hooks.ts` (`RaporFiltre.kisiId` kaldır, `kisiId` filtreleme bloklarını sil, gerekiyorsa `useKisiKategoriBaglari` ekle)
- **Güncel:** `src/lib/network-rapor-pdf.ts` (gruplandırılmış veriye göre yeniden yapılandır)

## İlk iteresyon
1. Hook'lardan `kisiId` temizliği + (gerekirse) kişi-kategori eşleme yardımcısı.
2. Rapor sayfası: kişi filtresi kaldır, kategori → kişi hiyerarşik render.
3. PDF'i yeni veri yapısına göre güncelle.
