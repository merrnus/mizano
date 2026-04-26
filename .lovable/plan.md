## Sorun

`AlanDetaySheet` (ana sayfadaki Mana / İlim / Amel pill butonlarına tıklayınca açılan yarım panel):

1. **Amel sekmesi:** Sadece `hedef` tablosundaki "aktif" kayıtları gösteriyor. Müfredata eklediğin **aktif kurslar** (`amel_kurs.durum = 'aktif'`) burada görünmüyor — halbuki gerçek "amel hedeflerin" bunlar (modül ilerlemesiyle birlikte). Yeni eklediğin hedef bir kurs/proje olduğu için sheet'e yansımıyor.
2. **İlim sekmesi:** Aktif dersler bölümünün altına ayrıca "Aktif Hedefler" bölümü ve "Hedef ekle" butonu basılıyor. Hedeflerin yeri istikamet (ana ekran) — burada gereksiz.

## Çözüm

### 1. `src/components/mizan/alan-detay-sheet.tsx`

**a) Amel için yeni "Aktif Müfredat" bölümü ekle** (İlim'in "Aktif Dersler" bölümüne paralel):
- `useAmelKurslar()` ve `useTumAmelModuller()` hook'larını çağır.
- `kurslar.filter((k) => k.durum === "aktif")` → her kurs için `kursIlerleme(modüller)` ile yüzde hesapla.
- Kart tasarımı: kurs adı + kod, alt satırda "modül x/y · %z" + ince Progress bar.
- Tıklayınca `/mizan/amel/$id` route'una git, sheet kapansın.
- Boş durum: "Henüz aktif kursun yok." + `/mizan/amel`'e gitme linki (Hedef ekle butonu YOK).

**b) Amel'den "Aktif Hedefler" (`hedef` tablosu) bölümünü kaldır.** Müfredat artık ana içerik. Bu sayede `useHedefler` / `useTumAdimlar` çağrıları sadece İlim için gerekecek (onu da b adımıyla kaldırıyoruz) → hook çağrılarını koşullandırma yerine basitçe tüm "Aktif Hedefler" section'ını sil.

**c) İlim'den de "Aktif Hedefler" bölümünü kaldır.** "Hedefler istikamette yönetiliyor" mantığına uygun olarak `aktifAlan !== "mana"` koşulu ile basılan tüm `Aktif Hedefler` bloğu silinir.

**d) Temizlik:** `useHedefler`, `useTumAdimlar`, `HedefKart`, `Target`, `hedefIlerleme` import'ları artık kullanılmıyor → kaldır. `ilgili` useMemo bloğu silinecek.

**e) Amel sekmesinin "Aktif Müfredat" boş olduğunda** "Müfredata git" linki ile yönlendirme — Hedef ekle butonu yok.

### Sonuçta sheet içerikleri

| Alan | İçerik |
|---|---|
| **Mana** | 3 Aylık Hedefler (mevcut, dokunulmuyor) |
| **İlim** | Aktif Dersler (mevcut) — başka section yok |
| **Amel** | **YENİ:** Aktif Müfredat (kurslar + ilerleme) — başka section yok |

Alt aksiyon ("X sayfasını aç" butonu) tüm alanlarda aynen kalır.

## Değiştirilecek dosyalar

- `src/components/mizan/alan-detay-sheet.tsx` (ana değişiklik)

## Etkilenmeyen yerler

- `useHedefler` / `HedefKart` projenin başka yerlerinde (örn. `/mizan` istikamet sayfası, `alan-hedefleri-mini.tsx`) kullanılmaya devam ediyor — sadece bu sheet'ten temizleniyor.
- Mana 3 aylık çetele bölümü ve renkli başlık şeridi aynen korunur.