## Amaç

Ana sayfa (`/`) şu an "Akış" listesi. Bunu **saat bloklu günlük program** (Google Calendar günlük görünüm hissi + resimdeki gibi net saat şeritleri) yapmak, hem manuel program eklenebilsin hem de takvim etkinlikleri otomatik dolsun. Ayrıca takvim entegrasyon bug'ını çöz.

## Resim değerlendirmesi

Görsel netlik açısından iyi (kalın saat + büyük başlık), ancak birebir kopyalamak dijitalde çalışmıyor:
- Sabit saat aralıkları (2:30–4:00, 9:00–10:00…) her günün aynı olduğunu varsayıyor → biz dinamik olmalıyız.
- Zebra dolgu güzel ama tek renk; alan renkleri (mana/ilim/amel) kaybolur.
- Boş saatler görünmüyor → "şimdi" nerede belli değil.

**Önerim:** resimdekinden ilham al ama Google Calendar tarzı **saat şeritli tek sütun** kullan; boş saatler görünsün, bloklar renkli olsun, "şimdi" çizgisi kayan olsun.

## Yeni Ana Sayfa yapısı

```text
┌─ selamlama + halkalar (aynı) ───────────────────────┐
├─ Bugün · [Program ▾] [Akış] ← sekme ────────────────┤
│                                                     │
│  05 ─────────────                                   │
│  06 ─────────────                                   │
│  07 ─── ┌──────────────────┐                        │
│  08     │ 07:00–08:30      │  ← etkinlik (mana)     │
│         │ Sabah namazı+vird│                        │
│  09 ─── └──────────────────┘                        │
│  10 ─── ┌───────┐                                   │
│         │Okuma  │  10:00–11:30                      │
│  11 ─── └───────┘                                   │
│  12 ─── ═══ ŞİMDİ 12:14 ═════════════               │
│  13 ─── ┌──────────────────┐                        │
│         │ Öğle molası      │                        │
│  14 ─── └──────────────────┘                        │
│  ...                                                │
│                                                     │
│  Saat dışı (⏱︎ olmayan görev/ritüel) ─────────────  │
│  ▢ Cevşen  · [+ ekle]                              │
│  ▢ Manevi kitap · [+ ekle]                          │
└─────────────────────────────────────────────────────┘
```

**Sekmeler:**
- **Program** (varsayılan): saat şeritli günlük görünüm (yukarıdaki).
- **Akış**: mevcut liste (kaldırmıyoruz, saat şeridi görmek istemeyenler için).

**Program görünümü davranışı:**
- 05:00–24:00 arası varsayılan pencere; kullanıcı sabaha kaydırırsa 00–05 de açılır (auto-crop: en erken bloktan en geç bloğa göre).
- İlk render'da "şimdi" satırına scroll.
- Boş saat şeridine tıklayınca → hızlı ekle popover'ı (başlık + süre, o saati başlangıç yapar).
- Blok tıklaması → mevcut `EtkinlikDetaySheet`.
- Saat dışı öğeler (saatsiz görev + ritüel) alt bantta liste olarak kalır (mevcut `Satir` bileşenleri yeniden kullanılır).

## Manuel program vs Takvim entegrasyonu

**Tek kaynak: `takvim_etkinlik` tablosu.** Ayrı bir "program şablonu" tablosu açmak yerine mevcut takvim etkinliklerini kullanırız:
- Ana sayfada saat şeridine tıkla → `EtkinlikHizliDialog` açılır → varsayılan takvime kaydeder → hem takvimde hem burada görünür.
- Her gün tekrarlayan program (2:30 Teheccüd gibi) için diyalogda "her gün / hafta içi / seçili günler" kısayolu ekleriz (RRULE `FREQ=DAILY` / `BYDAY=MO,TU,...`).
- Böylece bir kere programı gir → her gün otomatik görünür (resimdeki gibi sabit tablo hissi ama esneklik korunur).

## Takvim entegrasyonu bug'ı (ayrı fix, aynı iş kalemi)

**Kök neden:** `bugun-akisi.tsx` eski `genisletEtkinlikleri` fonksiyonunu kullanıyor. Bu fonksiyon sadece eski `takvim_etkinlik.tekrar` enum'ına (`yok|haftalik|aylik`) bakıyor. Yeni takvim sayfası (`src/routes/takvim.tsx`) ise RRULE tabanlı `genisletListe` (src/lib/takvim/tekrar.ts) kullanıyor ve etkinlikleri `tekrar_kural` (RRULE string) alanına yazıyor. Sonuç: takvimden RRULE ile eklenen tekrarlı etkinlikler ana sayfaya düşmüyor; tek seferlik olanlar bile `takvim_id` gizli/filtreli takvime yazıldıysa görünmüyor olabilir.

**Düzeltme:**
1. `bugun-akisi.tsx` içindeki import'u değiştir: `genisletEtkinlikleri` → `genisletListe` (`@/lib/takvim/tekrar`).
2. Aynı çağrıyı takvim sayfasındaki gibi yap: `genisletListe(etkinlikler, gunBas, gunSon)`.
3. `useTakvimler()` ile aktif takvimleri çek, `gorunur=false` olanları filtrele (opsiyonel — kullanıcı takvim gizlemişse ana sayfada da gizle).
4. Eski `genisletEtkinlikleri` fonksiyonunu şimdilik dokunma (başka yerde import var mı hızlı kontrol edilir, yoksa sonraki iterasyonda kaldırılır).

## Etkilenen dosyalar

- `src/routes/index.tsx` — sekme + program bileşeni yerleşimi.
- `src/components/mizan/dashboard/bugun-akisi.tsx` — `genisletListe`'ye geçiş (bug fix).
- Yeni: `src/components/mizan/dashboard/bugun-program.tsx` — saat şeridi görünümü (`GunSutun` mantığından esinlenilebilir ama basitleştirilmiş, tek gün).
- `src/components/mizan/takvim/etkinlik-hizli-dialog.tsx` — "her gün / hafta içi" RRULE kısayolları (yoksa küçük eklenti).

## Kapsam dışı (bu turda yok)

- Takvim çakışma çözümü / yan yana kolonlar (tek sütun yeter, çakışan bloklar dikey yığılır).
- Sürükle-bırak taşıma (v2).
- Program şablonu (haftalık farklı program) — RRULE yeter.

## Açık soru

1. Sekmeler mi yoksa **Program tek görünüm** olsun (Akış'ı tamamen kaldır)? Ben "sekme + Program varsayılan" öneriyorum, ama Akış'ı tamamen kaldırmak da temiz olur.
2. Saat şeridi yoğunluğu: **her saat 48px** (kompakt) mı, **60px** (rahat) mı?
