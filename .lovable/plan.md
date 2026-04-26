## Hedef

Mevcut **"Bu hafta Evdekiler"** widget'ı (3 sütun: doğum günü, teke-tek bekleyen, yaklaşan program) `derin_takip=true` olan kişilerle sınırlıydı. Bunu **tüm kişileri** kapsayacak ve 2 sütuna sadeleşecek şekilde yeniden tasarlıyoruz.

## Yeni içerik modeli

**Hafta tanımı:** İçinde bulunulan **Pazartesi–Pazar** ISO haftası. Sebep: takvim haftası olduğu için hafta sonuna doğru içerik azalmaz, "bu hafta" tabiri kullanıcının doğal mental modeliyle örtüşür.

**1. Hafta Programları** (sol sütun)
- Bu haftaya (Pzt–Paz) düşen `tip = istisare` veya `tip = sohbet` olan tüm `kardes_etkinlik` kayıtları.
- `derin_takip` filtresi **yok** — tüm kişiler için.
- Tarih + (varsa) saat + kişi adı + başlık.
- Geçmiş günlerinki soluk (`opacity-60`) ve check ikonuyla; bugün/gelecek normal.

**2. Faaliyetler** (sağ sütun)
- Bu haftaya düşen, **istisare ve sohbet hariç** kalan tüm `kardes_etkinlik` tipleri (teke_tek, kuran, sophia, kamp, sinav, yarisma, hediye, gezi, spor, dogum_gunu, kandil, zoom).
- `derin_takip` filtresi **yok**.
- Tip etiketinin renk noktası + kişi adı + başlık + tarih.
- Aynı geçmiş/gelecek görsel ayrımı.

İki sütun da boşsa "Bu hafta plan yok" mesajı; biri boşsa o sütun "—" gösterir.

## Etkileşim: sağdan kişi sheet

- **"Tümü →"** linki kaldırılır (zaten Network sayfasında erişilebilir).
- Widget içindeki her satır tıklanınca, mevcut `/network/kisi/$id` sayfasına gitmek yerine **sağdan açılan bir Sheet** ile o kişinin özet kartı + bu haftaki etkinlikleri gösterilir.
- Sheet içinde "Tüm faaliyetler" linki kişi sayfasına yönlendirir (kullanıcının istediği gibi sayfa değişimi olmadan hızlı bakış).

## Teknik değişiklikler

**`src/lib/network-hooks.ts`** — `useEvdekilerOzet` hook'unu yeniden yazıyoruz:

- Adı `useBuHaftaOzet` olarak değişir (anlamı genişlediği için).
- `derin_takip` filtresini kaldır → tüm `gundem_kisi` kayıtlarını çek.
- Hafta sınırları: `startOfWeek(now, { weekStartsOn: 1 })` ve `endOfWeek(now, { weekStartsOn: 1 })` (date-fns).
- Tek sorgu: `kardes_etkinlik` where `tarih BETWEEN haftaBas AND haftaSon`.
- Dönüş tipi:
  ```ts
  type BuHaftaOzet = {
    programlar: { kisi: Kisi; etkinlik: KardesEtkinlik }[]; // istisare + sohbet
    faaliyetler: { kisi: Kisi; etkinlik: KardesEtkinlik }[]; // diğerleri
  };
  ```
- İki liste `tarih` artan, sonra `baslangic_saati` artan sıralanır.
- Eski `useEvdekilerOzet` export'u kaldırılır (başka yerde kullanılmıyor — sadece widget'ta).

**`src/components/mizan/dashboard/evdekiler-widget.tsx`** — yeniden yazılır:

- Dosya adı `bu-hafta-widget.tsx` olarak yeniden adlandırılır, component adı `BuHaftaWidget`.
- Başlık: **"Bu hafta"** (önceki "Bu hafta Evdekiler" yerine).
- 2 sütunlu grid (`md:grid-cols-2`): "Programlar" | "Faaliyetler".
- Satır tıklama → `setSecilenKisiId(id)` → sağdan Sheet açılır.
- "Tümü →" linki kaldırılır.
- Boş durum: tüm liste boşsa widget hiç render edilmez (mevcut davranış korunur).

**`src/components/mizan/dashboard/kisi-ozet-sheet.tsx`** (YENİ) — sağdan açılan kişi özet sheet'i:
- `Sheet` (shadcn), `side="right"`, `className="w-full sm:max-w-md"`.
- İçerik: kişi avatarı + ad, kategoriler (rozet), telefon/üniversite/bölüm (varsa), bu hafta etkinlikleri listesi.
- Footer'da `Link to="/network/kisi/$id"` → "Tüm profili aç →".

**`src/routes/index.tsx`** — import güncellenir:
- `EvdekilerWidget` → `BuHaftaWidget`.
- Render konumu aynı kalır.

## Dosya değişiklikleri

- ✏️ `src/lib/network-hooks.ts` — `useEvdekilerOzet` → `useBuHaftaOzet` (rename + yeniden yaz)
- 🗑️ `src/components/mizan/dashboard/evdekiler-widget.tsx` — silinir
- ➕ `src/components/mizan/dashboard/bu-hafta-widget.tsx` — yeni
- ➕ `src/components/mizan/dashboard/kisi-ozet-sheet.tsx` — yeni
- ✏️ `src/routes/index.tsx` — import + JSX güncellemesi
- ✏️ `.lovable/plan.md` — kayıt

## Açıkta bırakılan

- Doğum günleri ve "teke-tek bekleyen" hatırlatıcıları widget'tan kaldırılıyor — kullanıcı bunları istemediği için. İhtiyaç olursa sonra ayrı bir mini bileşen olarak geri eklenebilir.
- Tıklanan etkinliği düzenleme akışı bu turda kapsam dışı (kişi sheet'i sadece görüntüleme).