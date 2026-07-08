## Amaç
Bugün → Program görünümündeki "Saat dışı" bölümünü tamamen manuel hale getir. Mana ritüelleri ve otomatik iliştirmeler kaldırılsın; yalnızca kullanıcının eklediği saatsiz `gunluk_gorev` kayıtları görünsün.

## Değişiklik: `src/components/mizan/dashboard/bugun-program.tsx`

1. **Ritüel entegrasyonunu kaldır**
   - `useBugunManaRituelleri` (veya benzeri mana hook'u) importu ve çağrısı silinir.
   - "Saat dışı" listesinde ritüel satırları ve inline miktar girişi kaldırılır.
   - İlgili yardımcı state / mutation'lar (ritüel tamamla vb.) temizlenir.

2. **Saatsiz veri kaynağı = sadece `gunluk_gorev`**
   - Bugünün görevlerinden `saat === null` olanlar filtrelenir.
   - Her satır: checkbox (tamamla/geri al) + başlık + sil butonu.
   - Boşsa ince bir "Saat dışı görev yok" ipucu gösterilir.

3. **Hızlı ekleme korunur ve öne çıkar**
   - Mevcut `HizliGorevEkle` bileşeni "Saat dışı" başlığının hemen altında kalır (Enter ile ekler, `saat=null`).

4. **Başlık sadeleşir**
   - "Saat dışı" başlığı yanındaki ritüel sayacı / rozetleri kaldırılır; sadece görev sayısı (opsiyonel) gösterilir.

## Etkilenmeyen alanlar
- Saatli program bloğu, sürükle-bırak, çakışma sütunlaması, "Şimdi" butonu, `T` kısayolu — aynı kalır.
- Mana sayfası ve ritüel kayıt akışı değişmez; ritüeller yalnızca Mana sekmesinde takip edilir.
- Akış (feed) görünümü değişmez.

## Doğrulama
- `tsgo` ile tip kontrolü.
- Preview'da: saatsiz görev ekle → listede görünür, tamamla → üstü çizilir, sil → kaybolur, ritüel satırı görünmez.