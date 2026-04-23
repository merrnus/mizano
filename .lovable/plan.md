

# Takvim Ekleme + Menü Yeniden Düzenleme

## Görsel kararı

Paylaştığın v0 takvimi referans alınacak — Apple Calendar + Things tarzı:
- Sol: hafta görünümü (saat ızgarası, alan rengiyle dolu etkinlik blokları)
- Sağ: Görevler paneli (Bugün / Bu Hafta grupları, checkbox + alan rengi noktası)
- Üst: Ay/Hafta/Gün segment kontrolü + Bugün + < > + Yeni butonu

## Menü yeniden düzeni

Mevcut 5 öğe → temizlenmiş 5 öğe (Takvim eklendi, Gündemler birleşti):

```text
ESKİ                          YENİ
─────────────────────         ─────────────────────
Dashboard          /          Dashboard          /
Kişisel Mizan      /mizan     Kişisel Mizan      /mizan
Kardeşler Ağı      /network   Takvim & Görevler  /takvim   ← YENİ
Gündemler          /gundemler Kardeşler Ağı      /network  ← Gündemler içinde tab
Çalışma Alanı      /workspace Çalışma Alanı      /workspace
```

**Gündemler → Kardeşler Ağı'na taşınıyor.** Çünkü gündem = bir kişiye/gruba atanan konu. İki sayfada birden duruyordu, gereksiz tekrar.

## Kardeşler Ağı'nın yeni yapısı

`/network` artık iki sekmeli:

```text
┌─ Kardeşler Ağı ─────── [+ Kişi] [+ Gündem] ┐
│  [Kişiler] [Gündemler]                     │
├────────────────────────────────────────────┤
│  (seçili tab'ın içeriği — mevcut UI'lar)   │
└────────────────────────────────────────────┘
```

- **Kişiler tab**: mevcut `network.tsx` kart grid'i + drawer (aynı kalıyor)
- **Gündemler tab**: mevcut `gundemler.tsx` kanban/liste + toplu ata (aynı kalıyor)
- Drawer'da kişiye gündem atama, gündem kartından kişi havuzu açma — iki yön de çalışıyor (zaten kısmen var)
- Eski `/gundemler` rotası → `/network?tab=gundemler` kalıcı yönlendirme

## Yeni rota: `/takvim`

### Veri modeli (2 yeni tablo)

**`takvim_etkinlik`** — zamanlı olaylar (ders, sohbet, randevu)

| Alan | Tip |
|---|---|
| id, user_id | uuid |
| baslik, aciklama? | text |
| baslangic | timestamptz |
| bitis? | timestamptz |
| tum_gun | bool |
| alan | enum: maneviyat / akademi / dunyevi / kisisel |
| konum? | text |
| tekrar | enum: yok / haftalik / aylik |
| tekrar_bitis? | date |

**`takvim_gorev`** — saatsiz to-do'lar (vade tarihi + alan + öncelik)

| Alan | Tip |
|---|---|
| id, user_id | uuid |
| baslik, aciklama? | text |
| vade | date |
| tamamlandi | bool |
| oncelik | enum: dusuk / orta / yuksek |
| alan | enum (aynı) |

Her tabloya RLS (4 policy: SELECT/INSERT/UPDATE/DELETE, hepsi `user_id = auth.uid()`) + `set_updated_at` trigger.

### Sayfa düzeni

```text
┌─ Takvim & Görevler ──────────── [< Bugün >] [Ay|Hafta|Gün] [+ Yeni] ┐
│  Nisan 2026 · Hafta 17                                              │
├─────────────────────────────────────────────┬───────────────────────┤
│  PZT  SAL  ÇAR  PER  CUM  CMT  PAZ          │  Görevler        [+]  │
│  07                                         │  4/10 · bu hafta      │
│  08                                         │                       │
│  09  ┌Hadis┐                                │  BUGÜN            3   │
│  10  └────┘                                 │  ☑ Kitap güncelle     │
│  11  ┌Tefsir┐                               │    • Akademi          │
│  ...                                        │  ☐ Disk sipariş et    │
│  (alan rengiyle dolu etkinlik blokları)     │    • Dünyevi          │
│                                             │                       │
│                                             │  BU HAFTA         4   │
│                                             │  ☐ Kehf okuma         │
│                                             │    • Manevi · Cuma    │
└─────────────────────────────────────────────┴───────────────────────┘
```

Üç görünüm tek sayfada, segment kontrolü ile değişir:
- **Ay**: 7×5 grid, hücre başına max 3 etkinlik chip'i
- **Hafta** (varsayılan): 7 sütun × saat ızgarası 06–24
- **Gün**: tek kolon, daha geniş bloklar

Boş hücreye/saate tıkla → hızlı ekleme dialog'u (Etkinlik / Görev tip seçici).
Etkinlik/göreve tıkla → düzenleme/silme drawer'ı.

### Renk sistemi

Mevcut `--maneviyat` / `--akademi` / `--dunyevi` CSS değişkenleri kullanılır. Yeni `--kisisel` eklenir (toprak/bej). Etkinlik blokları alan renginin %15 dolgusu + tam doygun sol kenar çubuğu.

## Selamlama (sonradan)

Takvim bittikten sonra ana sayfaya **sade selamlama** eklenir (selam + 1 akıllı satır):

> ☀ Es-selâmu aleykum, Yusuf
> Hayırlı sabahlar • Pazartesi, 23 Nisan
> │ Bugün 09:00 — Hadis Usulü

Tek dinamik satırın önceliği: Pzt/Prş orucu → Cuma → bugünün ilk takvim etkinliği → hafta hâli → varsayılan.

## Dosya değişiklikleri

| Dosya | Değişiklik |
|---|---|
| Migration | 2 tablo + RLS + trigger + (opsiyonel) `--kisisel` rengi |
| `src/lib/takvim-tipleri.ts` | TS tipleri + alan→renk eşlemesi |
| `src/lib/takvim-hooks.ts` | `useEtkinlikler(aralik)`, `useGorevler(aralik)`, mutate hook'ları |
| `src/routes/takvim.tsx` | Sayfa + segment + sağ Görevler paneli |
| `src/components/mizan/takvim/hafta-gorunumu.tsx` | YENİ — varsayılan görünüm |
| `src/components/mizan/takvim/ay-gorunumu.tsx` | YENİ |
| `src/components/mizan/takvim/gun-gorunumu.tsx` | YENİ |
| `src/components/mizan/takvim/etkinlik-dialog.tsx` | YENİ — ekle/düzenle |
| `src/components/mizan/takvim/gorev-paneli.tsx` | YENİ — sağ panel |
| `src/components/mizan/takvim/gorev-dialog.tsx` | YENİ |
| `src/routes/network.tsx` | Tab yapısı eklenir, mevcut içerik "Kişiler" tab'ına sarılır |
| `src/routes/gundemler.tsx` | İçerik `Gundemler` komponentine çıkarılır, route silinir veya `/network`'e redirect |
| `src/components/mizan/network/gundemler-tab.tsx` | YENİ — eski gundemler içeriği komponent olarak |
| `src/components/mizan/sol-sidebar.tsx` | "Takvim & Görevler" eklenir, "Gündemler" çıkarılır |
| `src/components/mizan/icon-rail.tsx` | Aynı menü güncellemesi |

## Sıralama

1. Migration (tablolar + RLS + trigger)
2. Hook'lar + tipler
3. `/takvim` — Hafta görünümü + Görevler paneli + ekleme dialog'ları (en kritik MVP)
4. Ay + Gün görünümleri
5. Sidebar/IconRail menü güncellemesi
6. `/network` tab yapısı + Gündemler tab'ı + eski rota redirect
7. (Sonra) Selamlama bileşeni ana sayfaya

## Notlar

- Tekrar eden etkinlikler **render zamanında genişletilir** (DB'de tek satır + tekrar kuralı), ayrı satır kaydı yok
- Mobilde takvim: Hafta görünümü 3 günlük kayan görünüme düşer, Görevler paneli alta taşınır (sheet)
- v0 tasarımındaki ikon ve tipografi detayları birebir referans — chip stili, hücre yoğunluğu, "BUGÜN/BU HAFTA" başlık formatı dahil

