
# Bağlam Temelli Çetele

## Hedef

Çetele maddelerini hayatın akışına göre düzenlenebilir hale getir:
- Her madde 0+ bağlama atanabilir (Masa Başı, Yolda, Camide, Dinlenme).
- Ana sayfada "şu an buradayım" filtresi → odak modu.
- Haftalık Mana tablosunda bağlama göre gruplanmış bölümler.
- Haftalık hedefler (Oruç 0/2) için mini nokta göstergesi.

Drag-drop YOK — chip toggle her şeyi karşılıyor, mobilde de pürüzsüz.

---

## 1. Veri Modeli (Migration)

`cetele_sablon` tablosuna `baglamlar text[] not null default '{}'` kolonu eklenir.

Bağlam değerleri serbest string array — başlangıçta 4 sabit ID kullanılır:
- `masa` → 🏠 Masa Başı
- `yol`  → 🚌 Yolda
- `cami` → 🕌 Camide
- `dinlenme` → 🛋️ Dinlenme

Sabit liste TS tarafında (`src/lib/cetele-baglam.ts`) tutulur — etiket, emoji, soft renk (mavi/yeşil/turuncu/mor) bir arada. İleride genişletmek için array kullandığımızdan veri tabanı şeması değişmez.

Mevcut 11 başlangıç paketi maddesinin varsayılan bağlamları:
- Kuran, Risale, Pırlanta, Manevi kitap, mp3 → `masa`, `yol`, `dinlenme`
- Cevşen, Virdler → `yol`, `cami`
- Evvâbîn, Teheccüd → `cami` (ev de olabilir ama ana çağrışım namaz)
- Oruç → tüm bağlamlar (gün boyu)
- Ezber → `yol`, `dinlenme`

`BASLANGIC_PAKETI` (cetele-tipleri.ts) güncellenir, yeni eklenen şablonlarda da bağlam seçilebilir.

---

## 2. Bağlam Yönetimi UI

### `SablonForm` (yeni şablon / düzenle)
Form'a "Bağlamlar" bölümü eklenir: 4 chip, tıklayınca toggle. Birden fazla seçilebilir, hiç seçmemek de geçerli (boş = "her yerde" / filtresiz görünür).

### Satır içi chip'ler
Her şablon satırının yanında bağlam ikon-chip'leri görünür (sadece atananlar, küçük & soft). Bir chip'e uzun tıklamak yerine — küçük "düzenle" popover'ından chip'leri toggle ederek hızlıca güncelle. (Tablo satırını şişirmemek için.)

---

## 3. Ana Sayfa — "Şu Anda Buradayım" Filtresi

`BugunCetelesi` üstüne yatay chip-bar:
```text
[ Hepsi ] [ 🏠 Masa ] [ 🚌 Yol ] [ 🕌 Cami ] [ 🛋️ Dinlenme ]
```
- Tek seçim (segmented control). Varsayılan: "Hepsi".
- Seçilen chip belirgin (soft renk dolgulu), diğerleri sade outline.
- Filtre `localStorage`'da hatırlanır (`cetele-baglam`).
- "Hepsi" dışında bir bağlam seçilirse: `baglamlar.includes(seçim) || baglamlar.length === 0` koşuluna uyan şablonlar gösterilir (boş = her yerde).
- Filtre sonucu boşsa nazik mesaj: "Bu bağlamda evrad yok — düzenle butonuyla ekleyebilirsin."

`AkışModu` ve "eksik sayısı" hesabı da filtreden geçen şablonlar üzerinden çalışır.

---

## 4. Haftalık Tablo — Bağlama Göre Gruplandırma

`/mizan/mana` (`mizan.mana.tsx`):
- Üstte filtre yerine, tablonun gövdesi bağlam başlıklarına bölünür.
- Her grup için tablo içine bir "başlık satırı" (`<tr>` colspan ile) — sol şerit + soft arka plan + bağlam adı + madde sayısı.
- Sıralama: kullanıcının en çok kullandığı bağlamlar önce (basitçe sabit sıra: Masa → Yol → Cami → Dinlenme → Etiketsiz).
- Bir madde birden fazla bağlama atanmışsa: her grupta bir kez görünür (tablonun tablo özelliği bozulmasın). Aynı madde 2 kez olursa veri kayıtları zaten ortak (sablon_id aynı) — kafa karıştırmaz, çift görünür ama her iki satırdaki kutucuklar aynı veriyi gösterir/değiştirir.
- "Etiketsiz" grubu (boş `baglamlar`) en altta, soft gri.

Pzt-Paz × kutucuk × Hedef sütunu yapısı **olduğu gibi korunur**.

### Haftalık hedef göstergesi
Mevcut "Hedef" hücresinde `2/2 /h` yerine:
- Haftalık tip: küçük noktalar `● ● ○ ○` (hedef kadar nokta, doluluk kadar dolu) + alt satır sayı.
- Günlük tip: değişmez.
- Boyut küçük, sayı yine yanında — dokunulabilirlik etkilenmez.

---

## 5. Görsel Detaylar

`src/lib/cetele-baglam.ts` içinde her bağlam için:
```ts
{ id: 'masa', etiket: 'Masa Başı', emoji: '🏠', renk: 'sky' }    // mavi
{ id: 'yol',  etiket: 'Yolda',     emoji: '🚌', renk: 'emerald'} // yeşil
{ id: 'cami', etiket: 'Camide',    emoji: '🕌', renk: 'amber'}   // turuncu
{ id: 'dinlenme', etiket: 'Dinlenme', emoji: '🛋️', renk: 'violet'} // mor
```

Renkler mevcut alan renklerinin (mana/ilim/amel) yanında **ikincil tonlar** olarak. Asla onlarla çakışmaz (alan = sol şerit, bağlam = chip + grup başlığı).

---

## 6. Dosya Değişiklikleri

**Migration:**
- `cetele_sablon.baglamlar text[] not null default '{}'`

**Yeni:**
- `src/lib/cetele-baglam.ts` — bağlam sabitleri + helper'lar
- `src/components/mizan/baglam-chip.tsx` — toggle/display chip
- `src/components/mizan/baglam-filtre.tsx` — ana sayfa filtre çubuğu
- `src/components/mizan/haftalik-hedef-noktalar.tsx` — mini nokta göstergesi

**Güncellenen:**
- `src/lib/cetele-tipleri.ts` — `BASLANGIC_PAKETI` + tip
- `src/components/mizan/sablon-form.tsx` — bağlam seçici
- `src/components/mizan/dashboard/bugun-cetelesi.tsx` — filtre entegrasyonu
- `src/routes/mizan.mana.tsx` — gruplama + nokta göstergesi
- `src/lib/cetele-hooks.ts` — insert/update'te `baglamlar` alanı

---

## 7. Mobile / Responsive

- Filtre chip-bar: yatay scroll, `snap-x`, dokunma hedefleri 36px+.
- Tablo gruplama: mevcut `overflow-x-auto` zaten var, başlık satırı sticky değil (basitlik için).
- Bağlam chip toggle SablonForm dialog içinde — mobil tam ekran açılır, sorun yok.

---

## Kapsam Dışı (Şimdilik)

- Saatlere göre otomatik bağlam önerisi ("Sabah → Camide" vb.)
- Konum-tabanlı otomatik geçiş
- Drag-drop sıralama
- Özel/yeni bağlam ekleme (4 sabit yeterli; ileride array açık)
