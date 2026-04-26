## Hedef

Mevcut **Network → Gündemler** sekmesindeki mock kanban'ı, gerçek istişare iş akışına dayanan kalıcı bir sisteme dönüştürmek. İstişarede konuşulan gündemler toplu girilebilecek, her birine karar / sorumlu / deadline atanacak, ilerleme takip edilecek.

---

## 1) Veritabanı

Yedi yeni tablo. Hepsinde `user_id uuid not null`, `created_at`, `updated_at` (trigger ile) ve standart RLS (`auth.uid() = user_id`).

### `gundem_kategori` — kişi etiketleri
- `id uuid pk`, `user_id`, `ad text` (Evdekiler, GG, OMM, Kuran, Online…)
- `renk text`, `siralama int default 0`
- Kullanıcı kendi yönetir, sistem 5 default'la başlar (ilk kayıtta seed)

### `gundem_kisi` — rehber (manuel kişiler, sisteme üye değil)
- `id`, `user_id`, `ad text`, `notlar text`
- Mevcut `network.tsx`'deki hardcoded kişiler buraya migrate edilir

### `gundem_kisi_kategori` — kişi ↔ kategori (çoklu)
- `kisi_id uuid`, `kategori_id uuid`, primary key (kisi_id, kategori_id)
- Bir kişi birden çok kategoride olabilir

### `istisare` — toplantı
- `id`, `user_id`, `tarih date`, `baslik text` (default "{tarih} İstişaresi")
- `notlar text` (toplantının genel notları)

### `gundem` — gündem maddesi
- `id`, `user_id`, `istisare_id uuid not null`
- `icerik text` (gündemin kendisi)
- `karar text nullable` (alınan karar)
- `deadline date nullable`
- `durum gundem_durum` enum: `bekliyor`, `yapiliyor`, `yapildi`, `ertelendi` (default `bekliyor`)
- `oncelik gundem_oncelik` enum: `ana`, `yan` (default `ana`)
- `etiketler text[] default '{}'` (serbest etiket: Eğitim, Mali, Etkinlik…)
- `siralama int`, `tamamlanma date nullable`

### `gundem_sorumlu` — gündem ↔ kişi (çoklu)
- `gundem_id`, `kisi_id`, pk (gundem_id, kisi_id)

### `gundem_yorum` — ilerleme notları
- `id`, `user_id`, `gundem_id`, `metin text`, `created_at`

**Index'ler:** `gundem(user_id, istisare_id)`, `gundem(user_id, durum, deadline)`, `gundem_sorumlu(kisi_id)`.

**Trigger:** `set_updated_at` (zaten mevcut) ilgili tablolara bağlanır.

---

## 2) Tipler & Hooks

### `src/lib/network-tipleri.ts` (yeni)
- `GundemDurum`, `GundemOncelik`, `Kategori`, `Kisi`, `KisiDetay` (kategori adlarıyla), `Istisare`, `Gundem`, `GundemDetay` (sorumlular + yorum sayısı), `GundemYorum`

### `src/lib/network-hooks.ts` (yeni)
TanStack Query üzerine:
- **Kategori:** `useKategoriler`, `useKategoriEkle`, `useKategoriGuncelle`, `useKategoriSil`
- **Kişi:** `useKisiler` (kategori filtresi opsiyonel), `useKisiEkle`, `useKisiGuncelle`, `useKisiSil`, `useKisiKategoriAta` (toplu)
- **İstişare:** `useIstisareler`, `useIstisare(id)`, `useIstisareEkle`, `useIstisareGuncelle`, `useIstisareSil`
- **Gündem:** `useGundemler` (filtreli: istisare/durum/sorumlu/oncelik), `useGundemEkle`, `useGundemTopluEkle` (toplu paste için), `useGundemGuncelle`, `useGundemSil`, `useGundemSorumluAta`, `useGundemSonrakiIstisareyeTasi`
- **Yorum:** `useGundemYorumlar(gundem_id)`, `useGundemYorumEkle`, `useGundemYorumSil`

---

## 3) Sayfa Yapısı

### `src/routes/network.tsx` — yenilenir
3 tab: **Kişiler** | **İstişareler** | **Gündemler**
- `validateSearch` ile `?tab=kisiler|istisareler|gundemler` (default: gundemler)
- `?tab=gundemler` query desteklenmeye devam eder (geriye uyumluluk)

### Tab 1: Kişiler — `src/components/mizan/network/kisiler-tab.tsx` (yenilenir)
Mevcut hardcoded liste kaldırılır. Yerine:
- Sol: kategori listesi (CRUD inline) + "Tümü" + "Kategorisiz"
- Sağ: kişi grid'i (avatar + ad + kategori chip'leri). Tıklayınca sheet açılır → kişi düzenle, kategori ekle/çıkar, notlar, sil
- Üst: "+ Kişi Ekle" + arama
- Toplu işlem: birden çok kişi seç → "Kategori ata" / "Sil"

### Tab 2: İstişareler — yeni `istisareler-tab.tsx`
- Üst: "+ Yeni İstişare" (tarih + başlık → kayıt + redirect)
- Liste: tarih sırasıyla istişareler. Her satır: tarih, başlık, gündem sayısı (toplam / tamam), tıklayınca detay sayfası

### Tab 3: Gündemler — `gundemler-tab.tsx` (baştan yazılır)
**Mevcut mock kaldırılır.** Yeni:
- Üst toolbar: arama, filtreler (durum, öncelik, sorumlu, kategori, deadline: bu hafta/geciken/ileride/tümü), görünüm toggle (Kanban / Liste)
- **Kanban:** 4 sütun (Bekliyor / Yapılıyor / Yapıldı / Ertelendi). Drag-drop ile durum değiştir
- **Liste:** sıralanabilir tablo (içerik, sorumlu avatar grubu, deadline, öncelik, durum badge, istişare linki)
- Geciken gündemler kırmızı kenarlıkla vurgulu
- Karta tıklayınca **detay sheet** açılır (sağdan)

---

## 4) İstişare Detay Sayfası — yeni `src/routes/network.istisare.$id.tsx`
- Header: tarih, başlık (inline düzenlenebilir), genel notlar, sil butonu
- **Toplu Yapıştırma kartı:** textarea + "İçe Aktar" butonu
  - Her boş olmayan satır → bir gündem (içerik = satır, durum = bekliyor, öncelik = ana, sorumlu boş, deadline boş)
  - Tek transaction'da `useGundemTopluEkle`
- **Gündemler tablosu:** o istişareye ait gündemler. Her satır inline düzenlenebilir:
  - İçerik (textarea)
  - Karar (textarea)
  - Sorumlu(lar) — popover (aşağıda)
  - Deadline — date picker
  - Öncelik — segmented control (Ana / Yan)
  - Durum — select badge
  - Yorum sayacı (tıklayınca yorum drawer açılır)
- Footer: "Bitmeyenleri Sonraki İstişareye Taşı" → seçili veya tüm `bekliyor/yapiliyor/ertelendi` durumundakileri kullanıcının seçtiği başka istişareye `update istisare_id` ile taşır

---

## 5) Sorumlu Atama Popover — `src/components/mizan/network/sorumlu-secici.tsx`
Gündem satırında "Sorumlu" alanına tıklayınca:
1. Üstte yatay scroll kategori chip'leri: **Tümü** (default, vurgulu) | Evdekiler | GG | OMM | Kuran | Online …
2. Arama kutusu
3. Altında kişi listesi: **filtre = sadece görsel daraltma**, "Tümü"de herkes; bir kategori seçilince o kategoridekiler süzülür. Ama kullanıcı her zaman "Tümü"ye dönüp kategori dışı birini seçebilir
4. Çoklu seçim (checkbox + avatar)
5. "Yeni kişi ekle" inline kısayolu (modal açar)

---

## 6) Gündem Detay Sheet — `src/components/mizan/network/gundem-detay-sheet.tsx`
Sağdan açılan panel:
- İçerik, karar, deadline, öncelik, durum, sorumlu (chip listesi + ekle/çıkar), etiketler (multi-input)
- "İlerleme Notları" sekmesi: yorum listesi (kim/ne zaman + metin) + yeni yorum textarea
- Hangi istişarede alındı: tarih + link
- Sil butonu

---

## 7) Mevcut Sayfalara Entegrasyon

### Dashboard (`src/routes/mizan.index.tsx`)
- "Bana Atanan / Geciken Gündemler" widget'ı — ilk versiyonda sadece **deadline'ı bugün veya geçmiş** olan tüm aktif gündemler (kullanıcı kendi rehberindeki herkesi yönetiyor, bu liste yöneticinin radarı)

### Takvim (`src/routes/takvim.tsx`)
- Gündem deadline'ları opsiyonel olarak takvimde görünsün — bu iterasyonda **planlanmış ama yapılmıyor**, sadece data hazır olur. (Onaylarsan ileride eklerim, bu plan kapsamında değil.)

---

## 8) Geçiş & Temizlik
- `src/routes/gundemler.tsx` redirect → değişmez (`/network?tab=gundemler`)
- Mevcut `gundemler-tab.tsx` mock array'i tamamen silinir
- Mevcut `network.tsx` içindeki hardcoded `kisiler` array'i ve `KisilerTab` mock'u DB'ye bağlanır
- İlk kayıtta default 5 kategori (Evdekiler / GG / OMM / Kuran / Online) seed edilir — yeni `useKategoriler` ilk fetch'te boş dönerse otomatik insert

---

## 9) Yapılacaklar Sırası
1. Migration: 7 tablo + enum + index + RLS + trigger
2. `network-tipleri.ts` + `network-hooks.ts`
3. Kişiler tab (kategori CRUD + kişi CRUD + sheet)
4. İstişareler tab + İstişare detay sayfası (toplu yapıştırma dahil)
5. Sorumlu seçici popover
6. Gündemler tab (kanban + liste + filtreler)
7. Gündem detay sheet (yorumlar dahil)
8. "Sonraki istişareye taşı" akışı
9. Dashboard widget'ı

---

## Onay Gerektiren Tek Konu
**Default kategoriler** — ilk açılışta otomatik şu 5 kategori seed edilsin mi: **Evdekiler, GG, OMM, Kuran, Online**? (Mevcut mock'ta geçen isimler.) Plan'da varsayılan bu, beğenmezsen sonra silebilir/değiştirebilirsin. Bu noktayı kabul ediyorsan doğrudan uygulamaya geçiyorum.