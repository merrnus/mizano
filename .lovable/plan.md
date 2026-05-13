## Hedef

Takvim sayfasını üç noktada Google Calendar davranışına yaklaştırmak:

1. Varsayılan görünüm **haftalık** olsun (şu an "ay").
2. Bir etkinliğe tıklayınca büyük dialog yerine **küçük bir popover (detay kartı)** açılsın; içinde "Daha fazla seçenek" düğmesi tam dialog'u açsın.
3. Etkinliği sürüklerken fare nereye giderse oraya **canlı bir hayalet (ghost) önizleme** gösterilsin (saat etiketiyle birlikte).

## Değişiklikler

### 1) Varsayılan görünüm: hafta
**Dosya:** `src/routes/takvim.tsx`
- `useState<Gorunum>("ay")` → `useState<Gorunum>("hafta")`.
- LocalStorage'a yazma yok; ilk açılış her zaman hafta. (İstenirse sonra hatırlatma eklenebilir.)

### 2) Hızlı popover detay kartı
**Yeni dosya:** `src/components/mizan/takvim/etkinlik-hizli-popover.tsx`
- `Popover` tabanlı küçük kart. İçerik:
  - Başlık (renkli nokta + büyük yazı)
  - Tarih + saat aralığı, "Tüm gün" varsa rozet
  - Konum (varsa)
  - Açıklama (varsa, max 3 satır)
  - Takvim adı + renk
  - Alt satır: **Düzenle**, **Çoğalt**, **Sil**, **Daha fazla seçenek** (tam dialog'u açar)
- `Popover` `open`/`onOpenChange` controlled; trigger görünmez bir referans element olabilir veya doğrudan tıklanan etkinliğin DOM noktasına ankrlanır.

**Dosya:** `src/routes/takvim.tsx`
- Yeni state: `hizli` = `{ olay: EtkinlikOlay; anchor: { x: number; y: number } } | null`.
- `olayDuzenle` (etkinliğe tıklama callback'i) **artık dialog değil, popover açar**:
  - Önceki davranış: `setDuzenle(e); setDiyAcik(true)`.
  - Yeni: `setHizli({ olay, anchor })`.
- Tam dialog yalnızca:
  - Hızlı popover'daki **"Daha fazla seçenek"** butonuyla,
  - Boş slot tıklayıp/seçince **yeni etkinlik** akışında,
  - Yan paneldeki "Yaklaşan" / arama sonuçları gibi listelerden açıldığında çalışır.
- AyGörünümü, HaftaGörünümü ve GunSutun'un `onOlayClick` callback'lerine `(olay, event)` imzası eklenir; tıklanan butonun `getBoundingClientRect()` ile anchor üretilir.

### 3) Sürükleme canlı önizleme (ghost)
**Dosya:** `src/routes/takvim.tsx` (`GunSutun` ve `HaftaGorunumu`)
- Şu an `dragHandle` HTML5 drag-and-drop kullanıyor; `dragover` sırasında hedef konum görselleştirilmiyor.
- Eklenecek davranış:
  - `HaftaGorunumu` seviyesinde `dragOver = { gunIndex: number; basDk: number; sureDk: number; baslik: string; renk: string } | null` state'i.
  - Her `GunSutun`'da `onDragOver` içinde `pxToDk(localY)` ile dakika hesaplanır; parent'a `onDragHover(gunIndex, basDk, payload)` ile bildirilir. `onDragLeave`'de temizlenir; `onDrop`'ta da temizlenir.
  - `GunSutun`'da, eğer `dragOver` bu güne aitse, etkinliğin **kaynak süresi** kadar yükseklikte yarı saydam bir hayalet kart render edilir:
    - Konum: `top = (basDk/60)*SAAT_PX`, `height = (sureDk/60)*SAAT_PX`.
    - Stil: olayın renginde `opacity-60`, kesik çizgili kenar (`border-2 border-dashed`), üstte `HH:mm – HH:mm` etiketi.
    - `pointer-events-none`.
  - Tarayıcının varsayılan sürüklenen elemanın hayaletini gizlemek için `dragstart`'ta `e.dataTransfer.setDragImage(bosImg, 0, 0)` (1×1 px transparent) kullanılacak; böylece sadece bizim kontrol ettiğimiz canlı önizleme görünür.
- **Çakışmasız** olsun diye 15 dakikalık snap zaten var; aynı snap önizlemede kullanılır.

### Teknik notlar
- Yeni dosya dışında değişen tek route dosyası `src/routes/takvim.tsx`. `EtkinlikDialog` API'si değişmiyor; yalnızca açılma noktası (popover'daki "Daha fazla seçenek" butonu) farklı.
- Mevcut `OlayMenu` (sağ tık) korunuyor; sol tık artık popover açıyor, sağ tık hâlâ context menüsü.
- Mobilde popover yine küçük açılır (Radix Popover responsive). İstenirse mobilde Sheet'e düşürülebilir — şimdilik popover ile gidiyoruz.

## Kapsam dışı (bu turda yapılmayacak)
- Google Calendar görsel kimliği (renk paleti, font).
- "Tasks/Event/Appointment schedule" sekmeli yeni etkinlik akışı.
- "Other calendars" / abone takvim sistemi.
- Drag sırasında çoklu gün arası uzun etkinliklerin önizlemesi (yalnızca tek hücre/gün önizlemesi yapılacak).
