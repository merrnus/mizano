## Ekler Sistemi — Faz 2 + 3 + 4 Tek Seferde

Faz 1 (ekler tablosu, bucket, `EklerPaneli`, hedef detayı, `/workspace/kaynaklar`) zaten canlı. Şimdi geri kalan üç fazı bir arada uyguluyoruz.

---

### Faz 2 — Otomatik link zenginleştirme (sunucu tarafı)

- `src/lib/og.functions.ts` zaten var ama dialog'da sadece başlık tahmin ediyor. `fetchOgMeta`'yı şu alanlarla tam çalışır hale getir: `baslik`, `aciklama`, `onizleme_url`, `favicon_url`, `site_adi`.
- `EkEkleDialog` link sekmesi: URL yapıştırınca **debounce**'lu otomatik `fetchOgMeta` çağrısı → form alanlarına önizleme doldur (kullanıcı override edebilir).
- Mevcut linkler için `EkKart` üzerinde "Önizlemeyi yenile" aksiyonu.

### Faz 3 — Modüller arası tam entegrasyon

`EklerPaneli`'ni şu sayfalara da bağla (baglam_turu + baglam_id):

- `mizan.ilim.$id.tsx` → `baglam_turu: "ders"` (eski `ders_kaynak` tablosuna dokunmadan, ek panel olarak)
- `mizan.amel.$id.tsx` → `baglam_turu: "kurs"`
- `workspace.belge.$id.tsx` → `baglam_turu: "belge"`
- `workspace.notlar.tsx` (seçili not detayında) → `baglam_turu: "not"`
- `network.istisare.$id.tsx` → `baglam_turu: "istisare"` (tipler dosyasına ekle)
- `network.kisi.$id.tsx` → `baglam_turu: "kisi"` (kardeşle ilgili kaynak/link arşivi)

`ekler-tipleri.ts` içindeki `EkBaglamTuru` ve `BAGLAM_ETIKET` haritasını yeni türlerle genişlet (istisare, kisi).

`/workspace/kaynaklar` filtre çipleri otomatik olarak yeni türleri gösterecek.

### Faz 4 — PDF önizleme + içerik

- `bun add pdfjs-dist` (Worker uyumlu, sadece tarayıcıda dinamik import).
- `src/lib/pdf-onizleme.ts` istemci-yan modül: bir PDF storage path'ten ilk sayfanın küçük resmini canvas üzerinden üretip data URL döndürür, IndexedDB benzeri basit bir bellek cache'i ile.
- `EkKart` dosya tipi PDF ise küçük resmi göster; tıklayınca full-screen `Dialog` içinde `<iframe>` ile yerleşik PDF görüntüleyici aç (tarayıcının native PDF viewer'ı).
- Görseller (`image/*`) için zaten signed URL ile küçük resim göster.

---

### Teknik detaylar

**Yeni / değişen dosyalar:**

```text
src/lib/og.functions.ts                          (genişlet — tam OG parse)
src/lib/pdf-onizleme.ts                          (yeni — pdfjs thumbnail)
src/lib/ekler-tipleri.ts                         (yeni baglamlar)
src/components/ekler/ekler-paneli.tsx            (otomatik OG, PDF thumb, önizle dialog)
src/components/ekler/pdf-onizleme-dialog.tsx     (yeni — iframe viewer)
src/routes/mizan.ilim.$id.tsx                    (panel ekle)
src/routes/mizan.amel.$id.tsx                    (panel ekle)
src/routes/workspace.belge.$id.tsx               (panel ekle)
src/routes/workspace.notlar.tsx                  (seçili nota panel)
src/routes/network.istisare.$id.tsx              (panel ekle)
src/routes/network.kisi.$id.tsx                  (panel ekle)
package.json / bun.lockb                         (pdfjs-dist)
```

**Veritabanı:** ek migration **gerekmez** — `ekler` tablosu zaten polymorphic; `baglam_turu` serbest metin.

**Güvenlik / performans:**
- `fetchOgMeta` 5 sn timeout, 2 MB max body, `text/html` content-type kontrolü, kendi sunucumuzdan istek → CORS yok.
- `pdfjs-dist` worker'ı `?url` import ile lazy yüklenir, SSR'a sızmaz (sadece `useEffect` içinde).
- Thumbnail üretimi sadece dosya boyutu < 10 MB ise yapılır.

---

### Kapsam dışı (şimdilik)

- PDF içinden tam metin OCR / AI özet (ileride ayrı bir faz).
- Sürücü (`workspace.surucu.tsx`) zaten kendi sistemiyle çalışıyor — ona dokunmuyoruz.
- Eski `ders_kaynak` / `amel_kaynak` tablolarının migration'u — yeni sistem yan yana çalışır, kullanıcı isterse ileride taşırız.
