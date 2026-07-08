## Amaç
Ana sayfayı tek odak noktalı, sinyal yoğun bir "Bugün" ekranına indirge. Üç kat başlık, boş dev grid ve dağınık ekleme yolları temizlensin.

## Yeni yerleşim (tek kart)

```text
┌─────────────────────────────────────────────┐
│ ÇARŞAMBA · 8 TEMMUZ         [mana][ilim][amel]│  ← selamlama + mini halkalar tek satır
│ Hayırlı geceler, saalutlume                  │
├─────────────────────────────────────────────┤
│ ŞİMDİ 21:34                                  │
│ ● Boş — sıradaki: yarın 09:00 "…"           │  ← dolu ise: aktif etkinlik + ilerleme
│ [Şimdi] [+ Ekle]                             │
├─────────────────────────────────────────────┤
│ Program                              (T)şimdi│  ← tek başlık, sekmeler burada
│ ┌ 05–07  ── boş ─────────── ⌄               │  ← boş saat aralıkları kollaps (24px)
│ │ 08:00                                     │
│ │ 09:00  ▓ Ders — 09:00-10:30               │  ← dolu saatler tam yükseklik
│ │ 10:00                                     │
│ │ 11–15  ── boş ─────────── ⌄               │
│ │ 16:00  ▓ Toplantı                         │
│ └ 17–24  ── boş ─────────── ⌄               │
├─────────────────────────────────────────────┤
│ Saat dışı · 0/2                              │
│ + hızlı görev…                               │
│ ☐ Rapor gönder      ☐ Kitap oku              │
└─────────────────────────────────────────────┘
                                    [FAB +]
```

## Değişiklikler

### 1. `src/routes/index.tsx` — başlık düzeni
- Halka boyutunu küçült (`h-9 w-9` → mini), başlıkla **aynı satıra** al (`grid-cols-[minmax(0,1fr)_auto]`, `min-w-0`, `truncate`, `shrink-0`).
- "Program/Akış" sekmesini kaldır → **BugunProgram kartının header'ına** taşı (segment kontrol olarak). Ana sayfada gereksiz `mb-3` şerit gitsin.
- `EtkinlikHizliDialog` state ve `BugunFab` korunur; **tek ekleme yolu FAB** olur (aşağıda kart içindeki "+ Ekle" ve "Takvim →" kaldırılır).

### 2. `src/components/mizan/dashboard/bugun-program.tsx` — yeniden düzenle

**a) Üstte "Şimdi / Sıradaki" özet bandı (yeni)**
- Aktif etkinlik varsa: renkli çubuk + başlık + bitişe kalan süre + ilerleme mikro bar.
- Yoksa: "Şimdi boş" + `sıradaki: HH:mm — başlık` (bugün varsa bugünden, yoksa yarından).
- Sağda: `Şimdi'ye kaydır` ikon butonu.

**b) Kollaps zaman şeridi**
- Ardışık boş saatler tek satırda birleşir: `"05–08 · boş" ⌄` (yükseklik ≈ 24px, tıklayınca açılır).
- Dolu saatler ve şu andan ±1 saat her zaman açık.
- Varsayılan pencere: ilk etkinlikten 1 saat önce → son etkinlikten 1 saat sonra; hiç yoksa 08:00–20:00. (Bugün olayı yoksa dev boş grid göstermeyi bırak.)
- Şimdi çizgisi ve sürükle-bırak korunur.

**c) Header sadeleşir**
- "BUGÜN" chip kalksın. Tek başlık: **"Program"** solda + segment (**Program / Akış**) ortada + `Şimdi` ikon butonu sağda.
- "Takvim →" link ve "+ Ekle" pill kaldırılır (FAB tek ekleme noktası).

**d) "Saat dışı" başlığa sayaç ekle**
- `Saat dışı · tamam/toplam`. Boşken tek satır ipucu (mevcut) kalır.

### 3. `src/components/mizan/dashboard/bugun-fab.tsx`
- Alt navla çakışmayı önlemek için `bottom` offset'i mevcut `pb-40 sm:pb-28`'e uyacak şekilde artır; sağ altta 16px iç boşluk. (Sadece pozisyon; davranış değişmez.)

## Etkilenmeyen
- `BugunAkisi`, takvim entegrasyonu, sürükle-bırak, çakışma sütunlaması, tekrar mantığı.
- Renkler ve tokenler; yeni renk eklenmeyecek (semantik `--mana/--ilim/--amel/--foreground/--muted`).

## Doğrulama
- Mobil (375px) ve tablet (768px) Playwright ekran görüntüsü: başlık taşmıyor, halkalar sığıyor, boş günde dev boşluk yok, FAB nav ile çakışmıyor.
- `tsgo` tip kontrolü.
- Etkileşim: bir etkinlik ekle → şerit doğru saati aç, "Şimdi" özet güncelle; sil → boşa dön.

## Kapsam dışı (sonra)
- Hafta noktalı şerit, günün özet rakamları, "T" dışı klavye kısayolları, sürükle-bırak süre değiştirme.