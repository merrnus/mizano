# Bağlam Yönetimi (CRUD)

Şu an 4 bağlam (`masa`, `yol`, `cami`, `dinlenme`) kodda sabit. Bunu kullanıcının kendi bağlamlarını yönetebileceği esnek bir yapıya çeviriyoruz.

## Ne Olacak

- Kullanıcı **kendi bağlamlarını** ekleyebilir (örn. "Spor salonunda", "Uyumadan önce").
- Mevcut bağlamların **adını ve emojisini** değiştirebilir.
- Bağlam **silebilir** — silinince o bağlama atanmış maddelerden etiket otomatik kaldırılır.
- **Renkler sabit** kalır: 4 renk (mavi/yeşil/turuncu/mor) sırayla atanır, kullanıcı renk seçemez (istek üzerine).
- İlk kez yükleyen mevcut kullanıcılara default 4 bağlam **otomatik seed** edilir (geriye dönük uyum).

## Veritabanı Değişikliği

Yeni tablo: `cetele_baglam`

```text
id          uuid PK
user_id     uuid NOT NULL
slug        text NOT NULL    -- kalıcı id, sablon.baglamlar[] içinde bu kullanılır
etiket      text NOT NULL    -- "Masa Başı"
emoji       text NOT NULL    -- "🏠"
renk        text NOT NULL    -- 'sky' | 'emerald' | 'amber' | 'violet'
siralama    int  NOT NULL    -- chip sırası
created_at, updated_at
UNIQUE(user_id, slug)
```

- RLS: standart 4 policy (user_id = auth.uid()).
- `cetele_sablon.baglamlar` text[] aynen kalır — slug'ları tutar.
- Bağlam silindiğinde: client tarafı tek transaction'da o slug'ı tüm `cetele_sablon.baglamlar` array'lerinden çıkarır.

## Yeni / Değişen Dosyalar

**Yeni**
- `src/lib/cetele-baglam-hooks.ts` — `useBaglamlar()`, `useBaglamMutations()` (TanStack Query).
- `src/components/mizan/baglam-yonetim-dialog.tsx` — ekle/düzenle/sil modali. Liste + satır içi düzenleme + emoji picker (basit text input + öneri grid).
- `src/components/mizan/baglam-form.tsx` — tek bağlam için form (etiket + emoji + renk dropdown, ki şimdilik gizli/otomatik).

**Değişen**
- `src/lib/cetele-baglam.ts` — sabit `BAGLAMLAR` kalkar; sadece **renk paleti** ve helper'lar (`baglamEslesir`, renk class'ları) burada kalır. `BaglamId = string`.
- `src/components/mizan/baglam-filtre.tsx` — kullanıcı bağlamlarını DB'den okur. Sağında küçük "⚙️ Yönet" butonu → dialog'u açar. Hiç bağlam yoksa yardımcı boş durum.
- `src/components/mizan/baglam-chip.tsx` — slug + etiket + emoji + renk prop alır.
- `src/components/mizan/sablon-form.tsx` — bağlam chip'leri DB'den gelir.
- `src/components/mizan/dashboard/bugun-cetelesi.tsx` — bağlam listesini hook'tan alır.
- `src/routes/mizan.mana.tsx` — gruplama başlıkları DB'deki bağlamlardan oluşur.

## Migration İçeriği

1. `CREATE TABLE public.cetele_baglam` + indexler (user_id, siralama).
2. RLS aç + 4 policy.
3. `set_updated_at()` trigger.
4. **Seed function** + **bir defalık seed**: mevcut tüm kullanıcılar için default 4 bağlamı (`masa/yol/cami/dinlenme`) ekle (eğer yoksa). Yeni kayıt olan kullanıcılar için signup akışında auto-seed yapmıyoruz; bunun yerine `useBaglamlar()` hook'u **kullanıcının hiç bağlamı yoksa** ilk yüklemede 4 default'u ekler (idempotent client seed).

## Silme Davranışı

Kullanıcı bağlam siliyor → onay dialog'u: "Bu bağlam X maddeden kaldırılacak. Maddeler silinmez, sadece etiket çıkar." → Onaylanırsa:
1. İlgili sablonların `baglamlar` array'lerinden slug'ı çıkar (tek `update` döngüsü).
2. `cetele_baglam` satırını sil.

## UI Akışı

- Bağlam filtre barının sağında küçük ikon buton (`Settings2`).
- Tıklayınca dialog açılır: liste + her satırda inline edit (emoji + ad + sürükle sırala + sil butonu) + altta "+ Yeni bağlam" satırı.
- Renk seçimi UI'da yok; yeni bağlam eklendiğinde sıradaki renk otomatik atanır (4 renk arasında modulo).

## Etki Alanı

- Mevcut data uyumlu (slug'lar `masa/yol/cami/dinlenme` kalır).
- `BaglamId` artık `string` — tip değişimi tüm bileşenlere yayılır ama imza aynı.
- Ek paket gerekmez.