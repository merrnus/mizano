## Bugün — "Google standartı" yeniden tasarım

Google'ın "günün özeti" desenleri (Calendar Schedule, Assistant Your Day, Material 3 At-a-Glance, Tasks Today) referans alındı. Hedef: **göz tek bir yere düşsün, sıradaki eylem ortada olsun, geri kalanı progressive disclosure ile arka planda dursun.**

---

### Mevcut durumun problemi (kısa)

```text
[ Selamlama .................. (Mana 70%)(İlim 40%)(Amel 90%) ]   ← bilgi var, eylem yok
[ Bugünün Çetelesi       ][ Bugünün Zaman Çizelgesi          ]   ← iki ağır kart yan yana, rekabet
                              [+ Görev]  [+ Etkinlik]            ← sayfanın ortasında kayıp aksiyonlar
[ Bugünün Müfredatı (Amel) ............................... ]
[ Gelecek Günler — 4 gün kartı ........................... ]
[ Bu hafta — Programlar / Faaliyetler .................... ]
```

Sorunlar: tek bir "şu an ne yapayım?" odak yok, % chip'leri dekoratif, hızlı ekle butonları içeride boğuluyor, scroll uzun ve hiyerarşisiz.

---

### Yeni mimari (üstten alta)

```text
┌─────────────────────────────────────────────────────────────┐
│ App-bar:  Bugün · 16 Mayıs Cumartesi · 14:22                │
│           [Mana 70%] [İlim 40%] [Amel 90%]   (mini ring)    │
├─────────────────────────────────────────────────────────────┤
│ ✦ NOW CARD  (büyük, tek spotlight)                          │
│   "Şu an" — devam eden ya da bir sonraki 1 öge              │
│   14:30  Talebe ile görüşme · 30 dk · Salon                 │
│   ▸ Aç   ▸ Ertele 10 dk   ▸ Tamamla                         │
├─────────────────────────────────────────────────────────────┤
│ Up Next (zaman çizelgesi spine)                             │
│   15:00 ─•─ Evrad-ı şerif                                   │
│   16:30 ─•─ Modül: Akaid §3                                 │
│   18:15 ─•─ İstişare — Ahmet                                │
│   "Gün sonuna 4 öge"  ▾ tümünü göster                       │
├─────────────────────────────────────────────────────────────┤
│ Peek tiles (3 kolon, kompakt — tıkla genişler)              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                     │
│  │ Çetele   │ │ Müfredat │ │ Görevler │                     │
│  │ 3 / 7    │ │ 2 modül  │ │ 4 açık   │                     │
│  │ ▸ Akış   │ │ ▸ Çalış  │ │ ▸ Hepsi  │                     │
│  └──────────┘ └──────────┘ └──────────┘                     │
├─────────────────────────────────────────────────────────────┤
│ Sonraki 4 gün — yatay carousel (snap), küçük kartlar        │
├─────────────────────────────────────────────────────────────┤
│ Bu hafta — kardeşler (mevcut widget, sadeleştirilmiş)       │
└─────────────────────────────────────────────────────────────┘

FAB (sağ-alt, alt-bar üstünde):  [ + ]
  açılır: Etkinlik · Görev · Müfredat modülü tamamla
```

---

### Bölüm bölüm tasarım

**1. App-bar (yeni)**  
Tek satır: selamlama + tarih solda, 3 küçük halka (mana/ilim/amel) sağda. Pill'ler kaldırıldı; yerine **mini ring** (24px daire + sayı altında 10px). Tıklanınca yine `AlanDetaySheet` açılır. Material 3 "at-a-glance" tipi.

**2. Now Card — spotlight (yeni, sayfanın ana fikri)**  
Sayfanın yüksek-kontrast tek büyük kartı. İçerik kuralı:
- Şu an devam eden etkinlik varsa **onu** göster (live ring + dakika sayacı).
- Yoksa: bugünün sıradaki etkinliği.
- Etkinlik de yoksa: bugünün ilk açık `önemli/yüksek` görevi.
- O da yoksa: müfredat ilk modülü.
- O da yoksa: "Bugün boş — bir şey ekle" empty state + büyük FAB ipucu.

Aksiyonlar (sağda, 3 chip): **Aç** (sheet), **10 dk ertele** (görev/etkinlik için), **Tamamla / Katıldım**. Üst-sağda alan rengi ince çizgi. Yumuşak `0 0 24px var(--alan)/15` gölge.

**3. Up Next — timeline spine**  
Mevcut `BugunZamanCizelgesi`'nden türetilir ama **Now Card'da gösterilen öge listenin başından çıkarılır** (tekrar olmaması için). Varsayılan: bugünün kalan ilk 4 ögesi. Alt link: `▾ Tümünü göster` → in-place genişler (collapsible), `/takvim` linki ek olarak kalır.

**4. Peek tiles (3 kolon)**  
Çetele, Müfredat ve Görevler artık ağır kart değil; her biri **80–96px yüksekliğinde** özet tile. Veri:
- **Çetele**: `tamamlanan/toplam` (mana), ana CTA `Akış` butonu (mevcut `AkisModu`).
- **Müfredat**: bugün izlenen `n modül · ~m dk`, CTA `Çalış` (mevcut `AmelAkisModu`).
- **Görevler**: bugünkü açık görev sayısı + en üst 2 görev başlığı, CTA `Hepsi`.

Tile'a tıklayınca aynı sayfada **inline expand** (Material 3 "Expandable card") olur; tüm liste kart içinde açılır. Aynı anda yalnızca **1 tile açık** kalır (accordion davranışı). Bu, bugünkü "iki büyük kart yan yana" baskısını ortadan kaldırır.

**5. Sonraki 4 gün — horizontal snap carousel**  
Mevcut `GelecekGunler` aynı veriyle; layout: dikey grid yerine `overflow-x-auto snap-x` yatay kayar şerit (Material You weather/news kartları gibi). Mobilde de doğal, masaüstünde 4 kart tam görünür.

**6. Bu hafta widget**  
Mevcut `BuHaftaWidget` korunur; sadece üst başlık tonu (text-sm semibold) ve boşluk diğer bölümlerle hizalanır.

**7. FAB speed-dial (yeni)**  
Sağ-alt sabit. Tek tıkla menü açar: **Etkinlik**, **Görev**, **Modül tamamla**. Sayfanın ortasındaki `+ Görev ekle` / `+ Etkinlik ekle` butonları kaldırılır. Mevcut alt tab-bar'ın üstünde (pb-24 paterni — alt menünün arkasında kalmasın).

---

### Etkileşim & micro-detaylar

- **Now Card** her dakika kendini yeniler (zaten `simdi` interval var); kalan/geçen dakikayı `12 dk sonra` / `8 dk önce başladı` olarak yazar.
- **Tile expand**: 200ms fade+height (Motion `layout`/CSS grid-rows trick). Aynı anda diğer açık tile kapanır.
- **Greeting ikonu** (Sun/Sunset/Moon) Now Card'ın sol-üstüne küçük olarak da yansır (zaman ipucu).
- **Boş gün**: tüm bölümler boşsa tek bir `EmptyState` (illustration + "Bir şey ekle" CTA), peek tile'lar gizlenir.
- **Klavye**: `N` = Now Card'ı aç, `T` = Görev ekle, `E` = Etkinlik ekle (Gmail-vari kısayollar — opsiyonel, ileri faz).

---

### Teknik plan (UI-only, backend dokunulmaz)

Yeni dosyalar:
- `src/components/mizan/dashboard/now-card.tsx` — spotlight kart; içine `useEtkinlikler` + `useGorevler` + müfredat hook'ları aynı şekilde girer; "ne göstereceğini" seçen küçük bir resolver.
- `src/components/mizan/dashboard/up-next.tsx` — `BugunZamanCizelgesi`'nin sadeleşmiş varyantı (`hariçTutId` prop'u alır, ilk N ögeyi gösterir, expand butonu).
- `src/components/mizan/dashboard/brief-rings.tsx` — 3 mini halka (header için), `AlanDetaySheet`'i tetikler.
- `src/components/mizan/dashboard/peek-tile.tsx` — generic tile + expandable içerik wrapper'ı; içine `BugunCetelesi`, `BugununMufredati` ve görev listesi gömülür.
- `src/components/mizan/dashboard/bugun-fab.tsx` — speed-dial FAB.
- `src/components/mizan/dashboard/sonraki-gunler-carousel.tsx` — `GelecekGunler`'in yatay snap varyantı (veya aynı dosyaya `varyant="carousel"` prop'u).

Dokunulacaklar:
- `src/routes/index.tsx` — yeni iskelet (header → NowCard → UpNext → 3 PeekTile → Carousel → BuHaftaWidget → FAB); eski `<BugunCetelesi/>`, `<BugunZamanCizelgesi/>`, ortadaki ekle butonları, `<BugununMufredati/>` doğrudan yerleşim yerine `PeekTile` içine taşınır.
- `src/components/mizan/dashboard/bugun-cetelesi.tsx`, `bugunun-mufredati.tsx`, `gelecek-gunler.tsx` — kart kabuğu (rounded-2xl border bg-card) **opsiyonel** hâle gelir (`bareIcerik` prop'u), çünkü PeekTile içinde olacaklar.

Yapılmayacaklar: hook/SQL/RLS/business logic'e dokunulmaz; veri kaynakları aynı.

---

### Faz önerisi

Çok büyük tek atışta yapmak yerine 2 aşama:

1. **Faz 1 (görsel iskelet + Now Card + brief rings + FAB)** — en yüksek değer; tek mesajda biter.
2. **Faz 2 (peek tile expand + horizontal carousel + klavye kısayolları)** — onaylanırsa.

Faz 1'i implement etmek için planı onayla; istersen direkt tek aşamada da yaparım.