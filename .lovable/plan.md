# Amel ana sayfa entegrasyonu

## Konsept özet

- **Mana** üstte kalır (kısa, tekrarlı eylemler — mevcut "Bugünün Çetelesi" kartı + Shorts akış)
- **Amel** ayrı bir **"Bugünün Müfredatı"** kartına alınır (uzun odak işleri — modül kartları + Pomodoro akışı)
- Kategoriler ana sayfada **renk noktası + kurs adı** olarak kompakt gösterilir
- Günlük seçim **otomatik**: "izliyor" durumundaki her kursun ilk tamamlanmamış modülü bugüne girer

---

## 1. Ana sayfa düzeni (`src/routes/index.tsx`)

Mevcut grid:
```
[Bugünün Çetelesi (Mana+İlim+Amel mix)] | [Bugün Zaman Çizelgesi]
[Gelecek Günler]
[Evdekiler Widget]
```

Yeni düzen:
```
[Bugünün Çetelesi (sadece Mana+İlim)]   | [Bugün Zaman Çizelgesi]
[Bugünün Müfredatı (Amel)]              | (devam)
[Gelecek Günler]
[Evdekiler Widget]
```

`BugunCetelesi` bileşeninden `amel` alanını çıkarıyoruz (artık burada gösterilmiyor) — yeni `BugununMufredati` bileşeni o yükü devralacak.

**Header rozet yüzdeleri:** Hardcoded `amelYuzde = 32` yerine gerçek hesap → izlenen kursların ortalama ilerleme yüzdesi.

---

## 2. Yeni bileşen: `BugununMufredati`

**Dosya:** `src/components/mizan/dashboard/bugunun-mufredati.tsx`

**Veri kaynağı:**
- `useAmelAlanlar()` — alan rengi için
- `useAmelKurslar()` — `durum === "izliyor"` kursları al
- `useTumAmelModuller()` — her kurs için ilk `tamamlandi === false` modülü bul

**Algoritma (otomatik bugün listesi):**
```ts
const bugunModulleri = izlenenKurslar
  .map(kurs => {
    const kursModulleri = tumModuller
      .filter(m => m.kurs_id === kurs.id)
      .sort((a, b) => a.siralama - b.siralama);
    const ilkEksik = kursModulleri.find(m => !m.tamamlandi);
    return ilkEksik ? { modul: ilkEksik, kurs, alan: alanlar.find(a => a.id === kurs.alan_id) } : null;
  })
  .filter(Boolean);
```

**Görsel yapı (her satır):**
```
🟦  CCNA · OSPF Temelleri              [☐]   [▶ Çalış]
    Modül 12/26 · ~45 dk
```

- Sol: alan renkli nokta (alan.renk veya varsayılan)
- Orta: kurs adı + modül başlığı
- Alt satır: ilerleme metni (örn. "Modül 12/26")
- Sağ: checkbox (tamamla) + "Çalış" butonu (Pomodoro/Akış başlatır)

**Boş durum:** "Aktif kursun yok. CCNA, Linux gibi izlemekte olduğun kurslar burada görünür."  → `Link to="/mizan/amel"`

**Başlık satırı:**
```
BUGÜNÜN MÜFREDATI                              [Akış Modu ▶]
3 modül · ~2 saat 15 dk
```

Sağdaki "Akış Modu" butonu yeni `AmelAkisModu` bileşenini açar.

---

## 3. Yeni bileşen: `AmelAkisModu` (Pomodoro destekli)

**Dosya:** `src/components/mizan/dashboard/amel-akis-modu.tsx`

Mana'nın Shorts akışından farklı olarak **dikey scroll yok** — her modül tek bir tam ekran kart. Manuel "Sonraki" / "Atla" butonları geri gelir çünkü modül tek tıkla bitmez.

**Her kart içeriği:**
- Üstte: kurs adı + alan rozeti (renk noktası)
- Büyük başlık: modül başlığı (örn. "OSPF Temelleri")
- Açıklama (varsa `modul.aciklama`)
- "Kaynaklar" şeridi: bu kursa bağlı kaynakların kompakt listesi (link/lab/dosya) — tıklanınca yeni sekme/sheet
- **Pomodoro paneli (merkezde):**
  - Büyük zamanlayıcı: 25:00
  - [▶ Başlat] / [⏸ Duraklat] / [↺ Sıfırla]
  - Süre seçimi: 15 / 25 / 50 dk pill'leri
  - Bitiminde: hafif ses/titreşim + "Mola ver" önerisi
- Alt aksiyonlar:
  - [✓ Tamamlandı] → modülü işaretle, sonraki karta geç
  - [Sonraki modül →] → işaretlemeden geç
  - [✕ Kapat]

**Pomodoro state'i bileşen içinde tutulur** (basit `setInterval`). Veritabanına yazılmaz — sadece bu oturumlukdur. Sonradan istersen `pomodoro_oturum` tablosu eklenir.

**Klavye:** `Space` = Pomodoro başlat/duraklat, `Enter` = tamamla, `→` = sonraki, `Esc` = kapat.

---

## 4. Header rozet yüzdesi (gerçek veri)

`src/routes/index.tsx`'te `amelYuzde` hesaplaması:

```ts
const izlenenKurslar = kurslar.filter(k => k.durum === "izliyor");
const amelYuzde = izlenenKurslar.length === 0
  ? 0
  : Math.round(
      izlenenKurslar.reduce((acc, k) => {
        const kursModulleri = tumModuller.filter(m => m.kurs_id === k.id);
        return acc + kursIlerleme(kursModulleri);
      }, 0) / izlenenKurslar.length
    );
```

`useAmelKurslar()` ve `useTumAmelModuller()` hook'ları index.tsx'e eklenir.

---

## 5. `BugunCetelesi` güncellemesi

`src/components/mizan/dashboard/bugun-cetelesi.tsx`:

```diff
- const alanlar: CeteleAlan[] = ["mana", "ilim", "amel"];
+ const alanlar: CeteleAlan[] = ["mana", "ilim"];
```

Amel artık çetele şablonlarından beslenmiyor; modüllerden besleniyor → ayrı kart. Mana/İlim çetelesi sade kalıyor.

---

## 6. Sıralama tahminleri (modül süresi)

Modül kartında "~45 dk" göstermek için `amel_modul` tablosuna ek kolon yok — şimdilik **statik tahmin**:
- Modül `aciklama` boşsa → 30 dk varsayılan
- Modül `aciklama` doluysa → karakter sayısına göre kabaca 30/45/60 dk

İleride istersen `amel_modul.tahmini_dakika integer` kolonu eklenebilir, ama şu an gereksiz karmaşıklık.

---

## Etkilenen dosyalar

**Yeni:**
- `src/components/mizan/dashboard/bugunun-mufredati.tsx` (~180 satır)
- `src/components/mizan/dashboard/amel-akis-modu.tsx` (~250 satır, Pomodoro mantığı dahil)

**Düzenlenen:**
- `src/routes/index.tsx` — yeni kartı yerleştir, amelYuzde gerçek hesap
- `src/components/mizan/dashboard/bugun-cetelesi.tsx` — amel alanını listeden çıkar

**Veritabanı değişikliği:** Yok. Mevcut `amel_kurs.durum` ve `amel_modul.tamamlandi` kolonları yeterli.

---

## Çıkış sonrası görünüm (mockup)

```
─────────────────────────────────────────────────────────────
  Cumartesi, 26 Nisan 2026
  ☀️ Hayırlı günler              [● Mana 65%] [● İlim 58%] [● Amel 18%]
─────────────────────────────────────────────────────────────

┌─ BUGÜNÜN ÇETELESİ ────────┐  ┌─ BUGÜN ZAMAN ÇİZELGESİ ─┐
│  ● MANA      [▶ Akış · 3] │  │ 09:00 ...               │
│  □ Sabah Evrad     [+]    │  │ 12:30 ...               │
│  □ Kuran Tilavet   [+]    │  │ ...                     │
│  ● İLİM      [▶ Akış · 2] │  │                         │
│  □ Hadis-i Şerif   [+]    │  │                         │
└───────────────────────────┘  │                         │
                               │                         │
┌─ BUGÜNÜN MÜFREDATI [Akış▶]┐  │                         │
│  3 modül · ~2 sa 15 dk    │  │                         │
│  🟦 CCNA · OSPF Temelleri │  │                         │
│      12/26 · ~45 dk  ☐ ▶  │  │                         │
│  🟢 Linux · Bash Scripts  │  │                         │
│      3/8 · ~30 dk    ☐ ▶  │  │                         │
│  🟡 Git · Branching       │  │                         │
│      2/4 · ~30 dk    ☐ ▶  │  │                         │
└───────────────────────────┘  └─────────────────────────┘
```

Onaylarsan implementasyona geçerim.