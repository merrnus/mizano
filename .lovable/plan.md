## Hatalar + Yeniden Tasarım

### 1. Bug fixes
- **404 (Ayarlar)**: `gunluk-checklist.tsx` içindeki `<Link to="/mana">` yanlış — doğru route `/mizan/mana`. Düzeltilecek.
- **"Havuzdan ekle" kayboluyor**: Şu an buton sadece liste boşken görünüyor. Section header'a kalıcı bir "Havuzdan ekle" chip'i koyulacak (Ayarlar ikonunun yanında, hep görünür).

### 2. Google Tasks tarzı tek düz liste
Kategori kavramı UI'dan **tamamen kaldırılır**. Tek liste, drag-to-reorder, tamamlananlar otomatik alta.

**DB değişiklikleri (`gunluk_gorev`):**
- Yeni kolon: `saat time NULL` — opsiyonel "saatinde yapılacak" zaman.
- `kategori_id` ve `gorev_kategori` tablosu artık Bugün ekranında kullanılmayacak (DB'de dursun, ileride başka modüller için saklı).

**UI (`gunluk-checklist.tsx` sadeleştirme):**
- Gruplama kodu (kategoriler, `gruplar` memo, kategori başlıkları) tamamen silinir.
- Tek `<ul>`: önce tamamlanmamış görevler `siralama` sırasıyla, sonra tamamlananlar `tamamlanma_at` sırasıyla (opaklık 50%, üstü çizili).
- Görev satırı: `[checkbox] [saat varsa "09:30" mono] [başlık] [süre rozeti] [×]`
- Drag handle (`GripVertical`) — `@dnd-kit/sortable` ile sürükle-bırak; bırakınca `siralama` toplu güncellenir. (@dnd-kit zaten projede var mı kontrol; yoksa eklenir.)
- Tamamlananları otomatik alta itmek için iki listeye böl, ama görsel olarak tek `<ul>` gibi göster.

**HizliEkleSatiri sadeleştirme:**
- Kategori `Select` kaldırılır.
- Yerine opsiyonel **saat input'u** (`type="time"`, dar). Boş bırakılırsa esnek görev olur.
- Layout: `[başlık input] [saat input] [dk input] [+]`

**HavuzSheet sadeleştirme:**
- Kategori başlıklarına göre gruplama UI'dan kalkar; düz aranabilir liste (şablonlar `siralama` sırasıyla).
- "Özel görev" bloğundan kategori `Select` kaldırılır; saat alanı eklenir.

**SablonForm:**
- Kategori alanı UI'dan gizlenir (DB kolonu duruyor, dokunmuyoruz).

### 3. Section header
```
ESNEK GÖREVLER
Bugün ne yapacağım?           [Havuzdan ekle] [⚙] [↻ Sıfırla]
```
- "Havuzdan ekle" küçük bir outline chip, her zaman görünür.
- ⚙ → `/mizan/mana` (düzeltilmiş link).
- ↻ Sıfırla yalnız liste doluyken.

## Dokunulmayacak
- OdakKarti, BugunFab, BriefRings, route yapısı.
- `gorev_kategori` ve `cetele_sablon.kategori_id` DB kolonları (gelecekte tekrar kullanılabilir).

## Dosyalar
- Migration: `gunluk_gorev` tablosuna `saat time NULL` ekle.
- `src/lib/gunluk-gorev.ts`: tip + insert/update'e `saat` ekle, toplu siralama mutation'ı.
- `src/components/mizan/dashboard/gunluk-checklist.tsx`: rewrite (tek liste, drag, saat input).
- `src/components/mizan/dashboard/havuz-sheet.tsx`: gruplamayı kaldır, saat alanı, kategori kaldır.
- `src/components/mizan/sablon-form.tsx`: kategori alanı UI'dan gizle.
- `src/routes/index.tsx`: değişmez.
