## Sorun

729 px (tablet/mobil) görünümde:
- "Bugünün Çetelesi" kartının sağ kısmı kırpılıyor.
- Altındaki "Bugünün Programı" (zaman çizelgesi) kartı da sağ kısmı kırpılıyor.

Sebep: `app-shell.tsx` içindeki `<main>` elemanında `overflow-x-hidden` var. İçerideki bazı flex/grid çocukları yatayda parent'tan taşıyor; taşma scroll yerine kırpılma olarak görünüyor. Suçlular:

1. **`bugun-cetelesi.tsx`** — kart başlığı altındaki `BaglamFiltre` satırı `flex` ama `min-w-0` yok. İçindeki yatay scroll alanının yanına `BaglamYonetimDialog` butonu eklendi; flex çocukları küçülemediği için satır parent'ı zorluyor.
2. **`bugun-cetelesi.tsx`** — şablon listesindeki satır `grid-cols-[minmax(0,1fr)_5rem]` + `BaglamChip` listesi `flex gap-0.5` (wrap yok). Çok bağlamı olan şablonda chipler sağa taşıyor.
3. **`bugun-zaman-cizelgesi.tsx`** — etkinlik kartı `grid-cols-[3.5rem_minmax(0,1fr)_auto]`. "Sıradaki" rozeti + uzun başlık dar ekranda 3-sütun grid'i parent'tan büyütüyor; ayrıca üst-seviye `<section>` parent flex/grid'inde `min-w-0` zinciri eksik olduğu için kart taşıyor.
4. **`index.tsx`** — `<div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">` mobilde tek sütun ama child `<section>`'lara `min-w-0` aktarılmıyor; içerideki uzun içerik bazı tarayıcılarda parent'ı genişletebiliyor.

## Yapılacak değişiklikler

### `src/components/mizan/dashboard/bugun-cetelesi.tsx`
- En dış `<section>`'a `min-w-0` ekle.
- Header'daki başlık bloğuna `min-w-0` ekle, başlık metninde `truncate` zaten var ama parent zincirine ekleyelim.
- "Hızlı işaretle" satırı (`<div className="border-b ... px-5 py-3">`) içindeki `BaglamFiltre`'nin doğru daralabilmesi için bu container'a `min-w-0` ekle.
- Şablon satırındaki bağlam chip listesini `flex gap-0.5` → `flex flex-wrap gap-0.5 max-w-full` yap; `min-w-0` ekle ki uzun bağlam dizisi 2. satıra düşsün.
- Alan başlığı satırı (`mb-3 flex items-center justify-between`) — sol gruba `min-w-0` + sağ "Detay" linkine `shrink-0` ekle.

### `src/components/mizan/baglam-filtre.tsx`
- Dış `<div className="flex items-center gap-1.5">`'e `min-w-0 w-full` ekle.
- İç scroll container `flex-1`'e `min-w-0` ekle (flex çocuğu küçülebilsin diye kritik).
- Yönetim butonu zaten `shrink-0`. Sorun yok.

### `src/components/mizan/dashboard/bugun-zaman-cizelgesi.tsx`
- En dış `<section>`'a `min-w-0` ekle.
- Header'daki başlık bloğuna `min-w-0` + `min-w-0` zinciri (h2'ye `truncate`).
- Etkinlik kart grid'i `grid-cols-[3.5rem_minmax(0,1fr)_auto]` → `grid-cols-[3.5rem_minmax(0,1fr)_auto] min-w-0` (grid'in kendisine min-w-0).
- Kart `<button>`'una `min-w-0 max-w-full` ekle.
- "Sıradaki" rozeti dar ekranda satıra düşmeden gizlensin: `hidden sm:inline-flex` (mobilde sıradaki vurgusu zaten kart kenarlık glow ile görünüyor).
- Görev `<li>` satırı `flex items-center gap-2` → child'lara `min-w-0` zinciri (başlık zaten `truncate`).
- Liste container `<ul>` ve dikey rail içeren `<div className="relative">` öğelerine `min-w-0` ekle.

### `src/routes/index.tsx`
- Bugünün çetelesi + zaman çizelgesi gridine `min-w-0` aktarılması için iki child wrapper'ına `min-w-0` ekle:
  ```tsx
  <div className="mb-3 grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
    <div className="min-w-0"><BugunCetelesi simdi={simdi} /></div>
    <div className="min-w-0"><BugunZamanCizelgesi simdi={simdi} /></div>
  </div>
  ```

## Doğrulama

Lovable preview'da tablet (729px) ve telefon (375px) viewport'larında:
- Çetele kartı: tüm sütunlar görünüyor, "Detay" linki sağda eksiksiz, bağlam chip'leri ekranı taşırmıyor.
- Zaman çizelgesi: saat/başlık/Sıradaki rozeti sığıyor; uzun başlıklar truncate.
- Yatay scroll yok, kırpılma yok.
- Masaüstünde (≥1024px) görünüm aynı kalıyor.
