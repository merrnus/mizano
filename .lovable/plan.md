

# Hedefler — Modüler Tip Sistemi

`/mizan/amel` şu an statik dummy listesi. Bunu gerçek, **tipi olan, alandan bağımsız** bir hedef sistemine çeviriyoruz. Hedefler sadece Amel'e değil — **Mana, İlim, Amel** her alana ait olabilir; "Hedefler" ortak bir omurga.

## 1. Veri modeli

İki yeni tablo + bir enum.

```text
ENUM hedef_tip
  'kurs'        — modül-bazlı (modül listesi ile %)
  'aliskanlik'  — gün streaki (günlük yap/yapma)
  'proje'       — milestone listesi
  'sayisal'     — hedef miktar + birikim
  'tekil'       — yapıldı/yapılmadı

TABLO hedef
  id, user_id, ad, aciklama
  alan          cetele_alan       (mana | ilim | amel | kisisel)
  tip           hedef_tip
  baslangic     date
  bitis         date              (nullable — açık uçlu)
  durum         'aktif' | 'tamamlandi' | 'arsiv'
  
  -- tip-spesifik alanlar (jsonb yerine ayrı kolonlar; null'lanabilir)
  hedef_miktar  numeric           (sayısal için)
  birim         text              (sayısal için: kg, km, sayfa…)
  sablon_id     uuid → cetele_sablon  (sayısal için: çetele bağı, opsiyonel)
  streak_birim  'gunluk'|'haftalik'   (alışkanlık için)
  
  notlar, siralama, created_at, updated_at

TABLO hedef_adim         (kurs modülleri & proje milestone'ları)
  id, hedef_id → hedef
  baslik, aciklama
  tamamlandi    boolean
  tamamlanma    date
  vade          date           (nullable)
  siralama
```

**Notlar:**
- `aliskanlik` için ayrı tablo gerekmez — `cetele_kayit` zaten gün-bazlı kayıt tutuyor; alışkanlık hedefi opsiyonel olarak bir `cetele_sablon`'a bağlanır ve streak oradan hesaplanır.
- `tekil` için ek tabloya ihtiyaç yok — `durum` alanı yeter.
- Tüm tablolarda **RLS**: `user_id = auth.uid()` üzerinden CRUD.

## 2. Tip-bazlı kart render

Tek `HedefKart` bileşeni, içinde `tip`'e göre iç gövde değişir:

```text
KURS / PROJE                  ALIŞKANLIK
┌──────────────────────┐      ┌──────────────────────┐
│ Ad           [alan]  │      │ Ad           [alan]  │
│ ▓▓▓▓▓▓▓░░░░ 4/6     │      │ Streak: 12 gün 🔥    │
│ Sonraki: Modül 5     │      │ ▓▓▓░▓▓▓░▓▓▓ (28 gün) │
│ Vade: 12 May         │      │ Bu hafta: 5/7        │
└──────────────────────┘      └──────────────────────┘

SAYISAL                       TEKİL
┌──────────────────────┐      ┌──────────────────────┐
│ Ad           [alan]  │      │ Ad           [alan]  │
│ 245 / 600 sayfa      │      │ Vade: 20 Nis         │
│ ▓▓▓▓▓░░░░░ 41%       │      │ [✓ Tamamla]          │
│ Günde ort: 8.2       │      │                      │
└──────────────────────┘      └──────────────────────┘
```

Ortak: ad, alan rengi (sol şerit), durum (aktif/tamamlandı/arşiv), tıklayınca detay sayfası.

## 3. Sayfa yapısı

### `/mizan/amel` (ve genel hedef hub'ı)

Üç sekme:
- **Aktif** — tipi-karışık kart şeridi, üstte filtre çipleri (Tümü / Mana / İlim / Amel / Kişisel) + tip filtresi
- **Tamamlananlar** — küçük rozet kartları, tamamlanma tarihi
- **Arşiv** — vazgeçilenler

Üstte **+ Yeni Hedef** butonu → tip seçim diyaloğu → tipe özel form.

### Hedef detay — `/mizan/hedef/$id`

- Kurs/Proje: adım listesi (ekle/sil/tamamla, drag-to-reorder)
- Sayısal: çetele şablonu seçili ise grafik (son 30 gün) + manuel ekleme
- Alışkanlık: ısı haritası takvimi (son 90 gün)
- Tekil: tek tamamla butonu
- Tüm tipler: notlar, alan değiştirme, vade/bitiş düzenleme, arşivle/sil

## 4. Mevcut sayfaya etkisi

- `/mizan/amel`: dummy `hedefler` array'i kalkar, gerçek hedeflerden Amel alanındakiler + (opsiyonel) tüm hedeflere geçiş linki.
- `/mizan/mana` ve `/mizan/ilim`: kendi sayfalarında "Bu alandaki hedefler" mini bölümü.
- `/mizan` ana sayfa: kart altı detayda her alan için tamamlanan/aktif hedef sayısı görünebilir.
- **Üç-aylık çetele hedefleri** zaten `cetele_sablon.uc_aylik_hedef`'te yaşıyor — bunları "sayısal hedef" olarak otomatik göstermeyeceğiz, ayrı sistemler kalır. İstersen ileride birleştiririz.

## 5. Etkilenecek/yeni dosyalar

| Dosya | Değişiklik |
|---|---|
| Migration | `hedef_tip` enum, `hedef`, `hedef_adim` tabloları, RLS politikaları, `updated_at` trigger |
| `src/lib/hedef-tipleri.ts` | YENİ — tipler, etiketler, tip→ikon haritası |
| `src/lib/hedef-hooks.ts` | YENİ — `useHedefler`, `useHedefEkle`, `useHedefSil`, `useAdimEkle/Tamamla`, `useStreakHesapla` |
| `src/components/mizan/hedef/hedef-kart.tsx` | YENİ — tip-anahtarlı kart |
| `src/components/mizan/hedef/hedef-form.tsx` | YENİ — tip seçim + tipe özel alanlar |
| `src/components/mizan/hedef/adim-listesi.tsx` | YENİ — kurs/proje için |
| `src/components/mizan/hedef/streak-isi-haritasi.tsx` | YENİ — alışkanlık için |
| `src/routes/mizan.amel.tsx` | dummy → gerçek liste, sekmeler, +Yeni |
| `src/routes/mizan.hedef.$id.tsx` | YENİ — detay sayfası |
| `src/routes/mizan.mana.tsx` & `mizan.ilim.tsx` | "Bu alandaki hedefler" bölümü ekle |

## 6. Sıralama

1. **Migration** — enum + iki tablo + RLS + trigger
2. **Tipler + hooks** — `hedef-tipleri.ts`, `hedef-hooks.ts`
3. **Kart bileşeni** (4 tip render) + form (tip seçimli)
4. **`/mizan/amel` sayfası** — sekmeler, filtreler, +Yeni dialog
5. **Detay sayfası** — adım listesi, ısı haritası, sayısal ekleme
6. **Mana ve İlim sayfalarına** "alan hedefleri" mini bölüm

## Notlar

- **Sayısal hedefin çetele bağı** opsiyonel — bağlıysa miktar otomatik gelir, bağlı değilse manuel girilir.
- **Alışkanlık streaki** çetele şablonuna zorunlu bağlı — yoksa hangi günde "yapıldı" sayılacağını bilemeyiz.
- **Tip değiştirilemez** (oluşturduktan sonra) — temiz veri için. Yanlış tip seçildiyse silip yeniden oluşturulur.
- Detay sayfasının URL'i `/mizan/hedef/$id` — alana bağımlı değil, çünkü hedef alanı değişebilir.
- İlk versiyonda **drag-to-reorder, etiket, tekrarlayan hedef** YOK — sade tutuyoruz, ihtiyaç çıkarsa eklenir.

