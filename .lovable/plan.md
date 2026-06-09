## Tavsiyem: Tek bir "Ek (Ek/Attachment) sistemi" — her yere bağlanır

Şu an sistemde 3 storage kovan var: `mutfak-dosya` (kullanılıyor), `ders-dosya` ve `amel-dosya` (boş, kullanılmıyor). Yani altyapı bunun için zaten yarı kurulmuş, sadece sürücüde takılı kalmış. Mantıklı olan: **iki ayrı sistem değil, tek bir "ek" primitif'i** kurup her yere bağlamak.

### Temel fikir

Tek bir `ekler` tablosu, polimorfik bağlanır (`baglam_turu` + `baglam_id`). İki tipte ek olur:
- **dosya** — Storage'a yüklenir (PDF, görsel, doc)
- **link** — Harici URL + meta (başlık, açıklama, favicon)

Bu sayede aynı ek bileşeni:
- `ilim` dersine PDF kaynak / link ekler
- `amel` kaydına sertifika / kanıt fotoğrafı ekler
- `not`a referans linki ekler
- `belge`ye gömülü dosya ekler
- `hedef`e plan PDF'i ekler

### Önerilerim (3 katmanlı)

**1. Dosya yükleme — sade saklama, akıllı önizleme**
- PDF/görsel/doc yüklenir, küçük thumbnail oluşturulur (görseller için)
- PDF için ilk sayfa thumbnail (`pdfjs-dist` ile client-side) — liste görünümünde tanımayı kolaylaştırır
- OCR/metin arama **şimdilik yok**: maliyetli, kapsam genişletir, ileride istenirse Lovable AI ile eklenir
- 20MB üst sınır, MIME whitelist

**2. Link ekleme — otomatik önizleme**
- URL yapıştırınca arka planda OpenGraph/oEmbed çekilir (başlık, açıklama, görsel, favicon)
- Bir `og:fetch` server function (TanStack Start) — cache'lenir, başarısızsa düz URL gösterilir
- Twitter/X, YouTube, GitHub, Notion linkleri için özel rich card görünümü (opsiyonel iyileştirme)

**3. Yer/yerleşim — "ekler" sekmesi her yerde aynı**
- Her detay sayfasının (ilim/$id, amel/$id, hedef/$id, belge/$id, not kart) altına/yanına aynı `<EklerPaneli>` bileşeni
- Mutfak'ta yeni bir `/workspace/kaynaklar` sayfası: **tüm ekleri tek yerden** (filtrelemeli — tipe/bağlama göre) görüntüleme ve arama
- Sürücü zaten dosya merkezi olarak kalır; "kaynaklar" linkleri + Mizan'a bağlı dosyaları gösterir

### Veri modeli (özet)

```sql
create table public.ekler (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  baglam_turu text not null,  -- 'ilim' | 'amel' | 'hedef' | 'not' | 'belge' | 'serbest'
  baglam_id uuid,             -- null = serbest (kaynaklar sayfasında)
  tur text not null,          -- 'dosya' | 'link'
  baslik text,
  -- dosya alanları
  storage_path text,
  mime_type text,
  boyut bigint,
  -- link alanları
  url text,
  aciklama text,
  onizleme_url text,          -- og:image
  favicon_url text,
  site_adi text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

RLS: user_id = auth.uid(). Tek kova `ekler-dosya` (mevcut `ders-dosya`/`amel-dosya`'yı sileriz veya bunlardan birini yeniden adlandırıp tek başına kullanırız).

### Bileşenler

- `<EklerPaneli baglamTuru baglamId />` — listele, ekle, sil
- `<EkEkleDialog>` — sekmeli: "Dosya yükle" | "Link yapıştır"
- `<EkKart>` — dosya: ikon+ad+boyut+indir; link: thumbnail+başlık+site_adi+aç
- `useEkler(baglam)`, `useEkYukle`, `useLinkEkle`, `useEkSil` hooks (mutfak-hooks pattern'ı)
- `og-fetch.functions.ts` — server fn, URL'den OpenGraph meta çeker

### Yol haritası (kademeli)

1. **Faz 1 (temel):** `ekler` tablo + RLS + tek kova, `<EklerPaneli>` bileşeni, dosya yükleme, basit link (URL+başlık), `ilim/$id` ve `amel/$id` sayfalarına entegre
2. **Faz 2 (otomatik link):** server fn ile OG meta çekme, link kartı zenginleşir
3. **Faz 3 (kaynaklar):** `/workspace/kaynaklar` merkezi sayfa, arama+filtre, "serbest ekler"
4. **Faz 4 (PDF önizleme):** pdfjs ile thumbnail, ileride istersen OCR/AI özetleme

### Karar noktaları

- Bu plan **3 boş kovaları temizleyip tek kova**ya geçer — onayın gerek
- İlk fazda hangi detay sayfalarına ekleyelim? Önerim: `ilim/$id` + `amel/$id` + `hedef/$id` (en doğal kazanım)
- OG meta çekme **3rd-party servis** mi yoksa **kendi server fn** mi? Önerim: kendi server fn (basit fetch + HTML parse, bağımsız, ücretsiz)
- Onayla, Faz 1'i kuralım.
