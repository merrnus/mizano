## Hedef

Bugün sayfası, gün boyunca yapılması istenen esnek görevleri kullanıcının havuzdan **çekerek** oluşturduğu bir checklist'e dönüşür. Hiçbir şey otomatik gelmez. Odak kartı sadece bir sonraki/şu anki takvim etkinliğini gösterir. İT/Git kurs modülleri dashboard'dan kaldırılır.

## Veri modeli (3 küçük migration)

### 1) `gorev_kategori` (yeni)
- `id`, `user_id`, `ad text`, `emoji text` (örn. 📖 💬 🤲), `renk text` (token adı, örn. 'mana'), `siralama int`, timestamps
- RLS: user kendi satırı
- Seed (ilk açılışta kod tarafında değil; sadece şema): yok — UI'da boşsa varsayılan "Maneviyat / Okumalar / İletişim & Rehberlik / Diğer" tek tıkla oluşturulur

### 2) `cetele_sablon` (mevcut tablo — kolon ekle)
- `kategori_id uuid null` (FK → gorev_kategori.id, ON DELETE SET NULL)
- `tahmini_sure_dk int null`
- Mevcut Mana şablonları korunur; artık "Görev Havuzu" rolündedir. `alan='kisisel'` şablonlar da havuzda görünür → "Begench'e gündem ilet" gibi non-mana öğeler için kullanıcı yeni şablon ekleyebilir.

### 3) `gunluk_gorev` (yeni — sadece bugün ekran için)
- `id`, `user_id`, `tarih date default current_date`
- `baslik text`, `tahmini_sure_dk int null`
- `kategori_id uuid null` (FK gorev_kategori)
- `sablon_id uuid null` (FK cetele_sablon; özel görevlerde null)
- `tamamlandi bool default false`, `tamamlanma_at timestamptz null`
- `siralama int default 0`, timestamps
- RLS: user kendi satırı
- İndeks: `(user_id, tarih)`
- Planlama sekmesine sızmaz; sadece bu ekranda yaşar.

## UI değişiklikleri

### `odak-karti.tsx` (küçük kozmetik)
- "Şu an" / "Sıradaki" rozet metni → **"ŞU AN"** / **"SIRADAKİ"** (tam uppercase, tracking sıkı; mevcut stil zaten yakın).
- Geri kalan davranış (devam eden / sıradaki tek etkinlik, tüm gün, dakika sayacı) korunur.

### `gunluk-checklist.tsx` → **Esnek Görevler** (tam yeniden yazım)
- Veri kaynağı: yalnızca `gunluk_gorev` (bugünün tarihi).
- Gruplama: `kategori_id`'ye göre. Her kategori başlığı: emoji + ad, renk varsa kullanıcı tokenı. 5'ten fazla öğe varsa kategori collapsible (varsayılan açık).
- Satır görünümü:
  ```text
  [ ] Kuran-ı Kerim                            20 dk
  [✓] Begench'e gündem ilet                     5 dk   (line-through, opacity-50)
  ```
  Süre rozeti: küçük muted pill (`tabular-nums`). `tahmini_sure_dk` null ise rozet gizlenir.
- Checkbox: tek tık → `tamamlandi` toggle + `tamamlanma_at` set/clear. Strikethrough + opacity-50.
- Satır sağda hover'da küçük × → `gunluk_gorev` satırını siler (havuzdan değil).
- Üst sağda küçük "Sıfırla" link → bugünün tüm `gunluk_gorev` satırlarını siler (onay dialog).
- Boş durum: "Bugün için görev seçmedin." + iki buton: **+ Havuzdan ekle** ve **+ Hızlı görev**.
- Liste sonunda her zaman **inline hızlı ekle satırı** (baslik input + dk input + Enter). Kategori seçimi sade dropdown (opsiyonel, varsayılan "Diğer").

### `havuz-sheet.tsx` (yeni — havuzdan çoklu seçim)
- Sağdan açılan Sheet. Başlık: "Görev Havuzu".
- İçerik: kategoriye göre gruplanmış `cetele_sablon` listesi (tüm `alan` değerleri dahil). Her satır: checkbox + ad + süre rozeti.
- Üstte: arama input + "Kategori yönet" linki (küçük inline dialog ile kategori ekle/sil).
- En altta: "Özel görev ekle" satırı (baslik + dk + kategori) — havuza eklemeden tek seferlik `gunluk_gorev` üretir.
- Footer: "Seçilenleri ekle (N)" → seçili her şablon için `gunluk_gorev` insert (aynı şablon bugün zaten varsa atla).

### `bugun-fab.tsx` (mini-FAB'lar revize)
- Mevcut iki mini-FAB:
  - **Havuzdan ekle** (ListTodo ikonu) — Havuz Sheet'i açar. (`onGorev` yerine.)
  - **Etkinlik** — değişmez.
- `index.tsx`'te eski `GorevDialog` (takvim_gorev) kullanımı bu sayfadan kaldırılır; Planlama sekmesinde durur.

### `sablon-form.tsx` (mevcut)
- İki yeni alan: **Kategori** (select + "yeni" inline) ve **Tahmini süre (dk)**.

## Yeni dosya/hook listesi

- migrations × 3 (kategori, sablon kolonları, gunluk_gorev)
- `src/lib/gorev-kategori.ts` — useKategoriler, ekle/güncelle/sil
- `src/lib/gunluk-gorev.ts` — useBugunGorevler(tarih), ekle (tekil + toplu), toggleTamamlandi, sil, sifirla
- `src/components/mizan/dashboard/gunluk-checklist.tsx` — yeniden yazılır
- `src/components/mizan/dashboard/havuz-sheet.tsx` — yeni
- `src/components/mizan/dashboard/hizli-ekle-satiri.tsx` — yeni (inline)
- `src/components/mizan/dashboard/kategori-yonet-dialog.tsx` — yeni (küçük)
- `src/components/mizan/dashboard/bugun-fab.tsx` — etiket/handler değişimi
- `src/components/mizan/dashboard/odak-karti.tsx` — uppercase rozet
- `src/components/mizan/sablon-form.tsx` — iki yeni alan
- `src/routes/index.tsx` — Havuz Sheet state'i + FAB handler değişimi, GorevDialog/EtkinlikHizliDialog'un Etkinlik akışı korunur, Görev akışı kaldırılır

## Etki / korunan davranış

- Header (selamlama + 3 BriefRing) korunur. Ring yüzdeleri **hâlâ** mevcut kaynaklardan hesaplanır (Mana=cetele, İlim=ders/sınav, Amel=kurs modülleri). Dashboard'da kurs modülleri görünmez ama Mizan/Amel sayfasında durmaya devam eder.
- "Gelecek Günler" kaldırılmış halde kalır.
- Plan/takvim akışı etkilenmez.

## Açık varsayım

- Kategori varsayılan paleti: "Maneviyat 🤲 (mana)", "Okumalar 📖 (mana)", "İletişim & Rehberlik 💬 (kisisel)", "Diğer · (kisisel)". Boş listede tek tık "Varsayılanları oluştur" butonuyla insert edilir.
- `gunluk_gorev` her gün için ayrı satırlar tutar; gün değişince dünün öğeleri ekranda görünmez ama silinmez (geçmiş istatistik için kalır). Otomatik temizleme yok.

Onaylarsan migration'lar ve dosyalar sırayla uygulanır.