# Planlama görünümünü Google Calendar seviyesine çıkarma

## 1. Sorunların kökleri

**a) Neden sadece bazı etkinlikler sürüklenebiliyordu?**
Şu an `tasinabilir` koşulu, ders/amel kaynaklı olayları (`ilim:` / `amel:` ön ekli) ve tekrarlı etkinlikleri dışarıda bırakıyor. Sebep: ders/sınav/proje olayları `takvim_etkinlik` tablosundan değil, türetilmiş kaynaklardan (`useDersSaatleri`, `useSinavlar`, vb.) geliyor — `useEtkinlikGuncelle` ile güncellenemezler. Tekrarlı olaylar da tek tek değil, kuralla üretildiği için tek bir örneği taşımak veri modelinde "istisna" gerektirir.

**b) Yukarı sürüklerken sayfa kayıyor (saat 9'un üstüne çıkamıyor)**
Şu an HTML5 native drag-and-drop kullanıyoruz (`draggable`, `onDragStart/Drop`). Bu API'nin bilinen sorunu: sürükleme sırasında scroll konteynerini otomatik kaydırmaz; tarayıcı bunun yerine sayfa scroll'unu tetikler. Mobilde özellikle (touch event'lere dönüşür) yukarı sürükleme = pull-to-refresh / sayfa scroll olur. Çözüm: HTML5 drag'i tamamen bırakıp **pointer event tabanlı** (`onPointerDown/Move/Up`) bir sürükleme yapmak ve sürükleme sırasında konteyneri kendimiz kaydırmak (edge auto-scroll).

**c) Google Calendar'a göre eksikler**
1. Etkinliğin **alt kenarından yeniden boyutlandırma** (süre değiştirme).
2. **15 dakika hassasiyet** (şu an 1 saatlik snap; etkinlik 09:30 ise 09:00'a yapışıyor).
3. **Çakışan etkinliklerin yan yana** dizilmesi (şu an üst üste biniyor).
4. **Tüm gün etkinlikleri** için ayrı şerit (bizim modelde `tum_gun` alanı yok — şimdilik atlanır).
5. **Edge auto-scroll** sürükleme sırasında.
6. Sürükleme sırasında **görsel hayalet** (orijinali soluk, yeni konum vurgulanmış).

## 2. Yapılacaklar

### a) Sürüklenebilirliği genişlet
- Tek seferlik (`tekrar = "yok"`) etkinlikler: tam taşıma (mevcut davranış, ama yeni motorla).
- **Tekrarlı etkinlikler**: Tüm seriyi birlikte taşı (yani `baslangic` güncellenir, tüm gelecek örnekler kayar). Bu Google Calendar'ın "tüm seri" seçeneğine eşittir; sadece bu örneği değiştirmek istisna tablosu gerektirir, şimdilik kapsam dışı. Kullanıcıya tooltip ile "tüm seri taşınır" notu.
- **Görevler** (`takvim_gorev`): Görev panelinden takvime sürükleyip belli bir saate planlama (vade gününü ayarlama). Şu an görevlerin saati yok, sadece `vade` (gün). Yani günler arası taşıma destekli, saat boyunca taşıma değil.
- **`ilim:` / `amel:` olaylar**: Hâlâ kapalı (kaynak başka tablo) — üzerlerine gelince kürsör `not-allowed`.

### b) HTML5 drag → Pointer tabanlı motor
Yeni dosya: `src/lib/takvim-surukle.ts` — küçük hook `useSurukle({ onTasi, slotPx, slotDk })`:
- `onPointerDown` → kapama, `setPointerCapture`, body'ye `user-select:none`.
- `onPointerMove` → fare/parmak Y konumuna göre etkinliğin "hayalet" üst değerini güncelle, **15 dakikaya snap**.
- Konteynerin üst/alt 40px'inde isek `requestAnimationFrame` ile `scrollTop` += her frame ~6px → **edge auto-scroll**.
- `onPointerUp` → `releasePointerCapture`, yeni `baslangic` hesaplanır, `onTasi(id, yeniBaslangic)` çağrılır.
- Touch için `touch-action: none` etkinliğin üzerine; konteynerde sayfanın asıl scroll'una müdahale etmemek için sadece sürükleme aktifken `overscroll-behavior: contain`.

### c) `HaftaGorunumu` & `GunGorunumu` güncellemeleri
- `draggable`, `onDragStart`, `onDragOver`, `onDrop` kaldırılır. `useSurukle` bağlanır.
- Slot yüksekliği 15 dakikalık alt çizgilerle gösterilir (mevcut 40px / 56px aynı kalır; sadece visual alt çizgiler).
- Sürükleme sırasında etkinliğin orijinali `opacity-40`, hayalet `position:absolute; pointer-events:none` ile yeni konumda render edilir.
- **Resize handle**: etkinliğin alt 6px'inde `cursor-ns-resize`; aynı pointer motoruyla `bitis` güncellenir (minimum 15dk).
- **Çakışan olaylar yan yana**: gün sütununda örtüşen grupları hesapla (`column`, `columnCount`), genişliği `1/columnCount` ata. Yardımcı: `src/lib/takvim-cakisma.ts`.

### d) `takvim.tsx`
- `olayTasi` aynı kalır, ama `useEtkinlikGuncelle` çağrısı yapılırken: tekrarlı olaylar için artık `eski.baslangic` ile `o.olayBaslangic` arasındaki delta hesaplanıp `baslangic`+`bitis`'e uygulanır (seri toptan kayar).
- Yeni `olayBoyutla(id, yeniBitis)` callback'i `useEtkinlikGuncelle` ile sadece `bitis` günceller.

### e) Görev sürükleme (görev paneli → gün başlığı)
- `GorevPaneli`'ndeki görev kartı pointer ile sürüklenebilir; `HaftaGorunumu`'nun gün başlık hücresi drop hedefi olur, `useGorevGuncelle({ vade: yeniGun })`.

## 3. Dokunulacak dosyalar

- **Yeni**: `src/lib/takvim-surukle.ts`, `src/lib/takvim-cakisma.ts`
- **Düzenlenecek**: `src/components/mizan/takvim/hafta-gorunumu.tsx`, `src/components/mizan/takvim/gun-gorunumu.tsx`, `src/components/mizan/takvim/gorev-paneli.tsx`, `src/routes/takvim.tsx`

## 4. Kapsam dışı (sonraki tur)

- Tek tekrar örneğini istisna olarak ayırma (recurrence exceptions tablosu gerekir).
- Tüm gün etkinlik şeridi (`tum_gun bool` kolonu eklenmeli).
- Görevlerin saatli planlanması (görev şemasına `vade_saat` eklenmeli).
- Çoklu seçim, kopyala-yapıştır.
- Ders/sınav saatlerini ilim modülünden taşıma (kaynak modüller ayrı yönetildiği için orada düzenlenmeli).

Onaylarsan sürükleme motorunu, çakışma yerleşimini ve resize'ı tek seferde uygulayayım.
