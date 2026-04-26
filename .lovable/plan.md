## Sorun

`/network?tab=kisiler` sayfasında kişi kartlarının üstünde **isim düzenleme** veya **silme** butonu yok. Şu anda:
- Düzenleme/silme sadece "Kişi Düzenle" sheet'i açıldığında görünüyor (kart tıklanınca).
- **Derin takip** açık olan kişilerde ise kart tıklanınca sheet açılmıyor, doğrudan tam profil sayfasına gidiyor — orada da silme butonu yok, isim ise form içinde.

Kullanıcı kart üzerinde direkt edit/sil aksiyonu istiyor.

## Çözüm

`src/components/mizan/network/kisiler-tab.tsx` içindeki kişi kartına (satır 128–179) hover'da görünen iki küçük buton ekle: **kalem (isim düzenle)** ve **çöp kutusu (sil)**. Kategori paneli ile tutarlı pattern (KategoriSatir'daki actions yapısı gibi).

### 1. Kart düzenini güncelle (kisiler-tab.tsx)

- Mevcut tek `<button>` sarmalayıcıyı `<div>`'e çevir; içine ana tıklanabilir alan ve aksiyon butonları koy. (İç içe `<button>` HTML hatası olur — kategori panelinde de aynı pattern kullanıldığı için sorunsuz.)
- Sağ tarafa `group-hover:flex hidden` ile iki ikon buton:
  - **Pencil** → kartı satır içinde edit moduna alır: ad alanı `<Input>` olur, Enter ile kaydet, Esc ile iptal.
  - **Trash2** → `AlertDialog` açar, onaylanırsa `useKisiSil` ile siler.
- Edit modunda `e.stopPropagation()` ile karta tıklamayı (sheet açma / profile navigate) engelle.

### 2. State

`KisilerTab` içinde:
- `inlineEdit: { id: string; ad: string } | null` — hangi kart edit modunda.
- `silAdayi: KisiDetay | null` — onay dialogu için.

`useKisiGuncelle` mutation'u zaten var (sheet'te kullanılıyor); inline kaydet için aynısını kullan. `useKisiSil` da hazır.

### 3. Tam profil sayfasına da sil butonu ekle (network.kisi.$id.tsx)

Header'daki "Derin takibi kapat" butonunun yanına (veya ayrı satıra) küçük bir **Sil** butonu (destructive variant). Onay sonrası `useKisiSil` çağır, `/network?tab=kisiler`'e geri yönlendir. İsim editi zaten profil formunda var, oraya dokunma.

## Etkilenen dosyalar

- `src/components/mizan/network/kisiler-tab.tsx` — kart yapısını güncelle, inline edit + silme akışı.
- `src/routes/network.kisi.$id.tsx` — header'a sil butonu ekle.

## Etkilenmeyen

- DB şeması, hook'lar (`useKisiGuncelle`, `useKisiSil` zaten var).
- Sheet (Kişi Düzenle) — orada hâlâ tüm alanlar düzenlenebilir.
- Hızlı kişi ekleme alanı.
