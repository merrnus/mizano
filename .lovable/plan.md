# Akış Modu → Shorts Deneyimi

## Hedef
`src/components/mizan/dashboard/akis-modu.tsx` içindeki **Geri / Atla** butonlarını ve yatay kart geçişlerini kaldırıp, YouTube Shorts'taki gibi **dikey kaydırma + snap** deneyimine çevirmek.

---

## Davranış

**Kart yapısı**
- Tüm kartlar tek bir uzun dikey listede render edilir.
- Her kart **viewport yüksekliğinde** (`h-[100dvh]`) — yan yana değil, alt alta.
- Konteyner: `overflow-y-auto scroll-smooth snap-y snap-mandatory` — tarayıcının kendi snap mekanizması kullanılır, ekstra animasyon kütüphanesi yok.
- Her kart: `snap-start snap-always` — yumuşak ama her zaman tam ortalı.

**Etkileşim**
- **Mobil**: native dikey swipe (iOS/Android touch scroll + snap).
- **Desktop**: mouse wheel + trackpad. Ek olarak **↑ / ↓ / Space / Shift+Space** klavye kısayolları → `scrollIntoView({ behavior: "smooth" })` ile bir sonraki/önceki karta geç.
- **PageUp / PageDown / Home / End** de doğal olarak çalışır (browser default).
- ESC → kapat (mevcut davranış korunur).
- ←→ tuşları kaldırılır (yatay mantık artık yok).

**Aktif kart tespiti**
- `IntersectionObserver` ile hangi kartın viewport'un %60'ından fazlasını kapladığını izle → `aktifIdx` state'ini güncelle.
- Süre sayacı, ilerleme göstergesi ve "Tamamla" butonunun davranışı `aktifIdx`'e göre çalışmaya devam eder.

**Tamamla / Atla davranışı**
- "Tamamla" butonu mevcut yerinde (kart içinde) kalır — hedef ekleyince otomatik olarak bir sonraki karta scroll'lar.
- "Atla" eylemi artık ayrı bir buton değil, **sadece swipe** ile gerçekleşir. `atlananIds` state'ine ekleme şu an "kullanıcı sonraki karta geçti ve önceki tamamlanmamıştı" mantığıyla yapılır.
- Geri scroll yapıldığında atlanan kart tekrar gösterilir (atlananlar set'inden çıkarılır) — Shorts'ta da aynı.

**Sağdaki ilerleme şeridi (Shorts UX dokunuşu)**
- Sağda dikey, sticky bir mini gösterge: her kart için 1 nokta.
- Aktif olan: dolu ve renkli (alanın rengi). Tamamlananlar: küçük tik. Atlananlar: hafif soluk.
- Tıklayınca o karta scroll'lar (klavye/mouse ile gezinmenin shortcut'u).

**Üst sabit bar**
- Sol: alan adı + "X/Y" sayacı.
- Sağ: süre sayacı + ✕ kapatma.
- Mevcut "tamamlandı/atlandı" özet metni alttan üste taşınır, sticky kalır.

---

## Teknik değişiklikler

**Tek dosya**: `src/components/mizan/dashboard/akis-modu.tsx`

1. **Mevcut `idx` state ve `setIdx` çağrılarını kaldır** — tek aktif kart yerine artık scroll pozisyonu kaynak doğruluk.
2. **Yeni state**: `aktifIdx` (sadece IntersectionObserver tarafından set edilir).
3. **Render değişikliği**: tek kart yerine `baslangictakiSira.map()` ile tüm kartları render et, her birini `<section className="h-[100dvh] snap-start snap-always flex items-center justify-center">` içine sar.
4. **Konteyner**: dış `<main>` → `overflow-y-auto snap-y snap-mandatory scroll-smooth h-[100dvh]`.
5. **Ref dizisi**: `cardRefs = useRef<HTMLElement[]>([])` — her kartın DOM ref'i, programmatik `scrollIntoView` için.
6. **Klavye handler**: ←→'yi kaldır, ↑↓ + Space ekle. Hepsi `cardRefs.current[hedefIdx]?.scrollIntoView({ behavior: "smooth", block: "start" })` çağırır.
7. **IntersectionObserver**: `threshold: 0.6` — aktif kart belirleme.
8. **`tamamla()` sonrası**: bir sonraki karta auto-scroll (mevcut davranışın eşdeğeri).
9. **Geri/Atla buton bloğunu kaldır** (satır 412–431). Yerine alt kısma sadece süre + tamamlanma özet metni kalır.
10. **Yan ilerleme şeridi**: sağda sabit dikey nokta listesi (`fixed right-3 top-1/2 -translate-y-1/2`).

---

## Kapsam dışı (bu turda yapılmayacak)
- **Amel ana sayfa entegrasyonu** ("Bugünün Müfredatı" widget'ı + rozet yüzdesini gerçek veriden hesaplama) — bunu Mana akışını test ettikten sonra ayrı bir turda ele alacağız.
- Mana sayfasındaki haftalık navigasyon ChevronLeft/Right butonları (akış modu ile alakasız, hafta değiştiriyor — onlar kalmalı).

---

## Etkilenen dosyalar
- `src/components/mizan/dashboard/akis-modu.tsx` (yeniden yazım, ~440 satır)

Veritabanı, hook ya da başka bir UI dosyasına dokunulmuyor. `cetele_kayit` ekleme akışı (`useKayitEkle`) aynı kalıyor.
