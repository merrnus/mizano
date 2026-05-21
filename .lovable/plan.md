# Sadeleştirme Planı — Rehberlik · Planlama · İstikamet

Felsefe: **Tüm planlama Rehberlik'ten başlar**. Takvim sadece yansımadır. Bir aksiyon = bir tıklama + tek modal.

## Hedef bilgi mimarisi

```text
┌─────────────────────────────────────────────────┐
│ Topbar: [Rehberlik] [Planlama] [İstikamet]      │
├──────────┬──────────────────────────────────────┤
│ Sidebar  │  ana içerik                          │
│ Evdekiler│                                      │
│ GG       │  (seçili kategori burada açılır)     │
│ OMM      │                                      │
│ Kuran    │                                      │
│ Online   │                                      │
└──────────┴──────────────────────────────────────┘
```

Sidebar = `gundem_kategori` tablosundan gelen kullanıcı kategorileri (zaten var: Evdekiler, GG, OMM, Kuran, Online).

---

## Faz 1 — Rehberlik (Network sadeleştirme)

`/network` tek görev: **kategori seç → kişi listesi → Faaliyet Planla**.

**Kaldırılacak / gizlenecek** (kod silinmez, route'lar opsiyonel "Derin Mod"a taşınır):
- İstişareler sekmesi, Gündemler sekmesi, Maneviyat sekmesi, Rapor sayfası, FAB karmaşası, sorumlu seçici, evrad/mufredat editörleri
- 4 sekmeli tab bar → tek görünüm

**Yeni `/network` (Rehberlik) düzeni:**
- Sol: kategori sidebar (mevcut sol-sidebar bileşeni yeniden kullanılır)
- Üst: tek büyük buton **"Faaliyet Planla"**
- Liste satırı: `● Ad   ·   Sonraki: 23 Kas · Çay/Kahve`
  - Nokta rengi son `kardes_etkinlik.tarih`'e göre:
    - Yeşil: ≤7 gün
    - Sarı: 8–21 gün
    - Gri: >21 gün veya hiç
- Tıklama → küçük sheet: Son faaliyet + bu hafta için "Haftalık Okuma ✓" checkbox (zaten var olan `kardes_evrad` mantığı tek satıra indirgenir)

**Faaliyet Planla modal'ı** (yeni, sade):
- Aktivite tipi: gruplu select (sabit varsayılan + kullanıcı kendi ekleyebilsin)
  - Aksiyon: Halı Saha, Çay/Kahve, Sabah Namazı+Çorba
  - Manevi: Hasbihal, Kuran Pratik, Online Sohbet
  - Alt buton: "+ Yeni tip ekle" (kullanıcı bazlı `aktivite_tip` tablosu)
- Kişi(ler): kategori önceden seçili → çoklu kişi seçimi
- Tarih + Saat picker
- Kaydet

Kaydetme tek transaction'da:
1. `takvim_etkinlik` insert (Planlama'da otomatik görünür)
2. Her seçilen kişi için `kardes_etkinlik` insert + `takvim_etkinlik_id` bağla (zaten var olan alan)

---

## Faz 2 — Planlama (Takvim read-only mod)

`/takvim` mevcut tam takvim aşırı; yeni mod:
- Varsayılan **Hafta** görünümü (mevcut `hafta-gorunumu` korunur)
- "Etkinlik ekle" / FAB / sağ tık menüsü → **kaldırılır**
- Etkinliğe tıkla → sadece detay sheet (düzenle butonu Rehberlik'teki kaynak kişiye link verir)
- Üst bar: hafta navigasyonu + "Bugün" + alan filtreleri (kategori renkleri)
- "Görev ekle" akışları gizlenir (görev sistemi Mizan tarafında kalır, takvimde sadece okunur)

Mesaj: "Planlama, Rehberlik'ten gelen faaliyetlerin yansımasıdır."

---

## Faz 3 — İstikamet (haftalık özet)

Yeni `/istikamet` rotası (mevcut `mizan/index.tsx` dashboard'undan ayrı, sade tek sayfa):
- Üstte: "Bu hafta X faaliyet tamamlandı / Y planlandı" — büyük sayı
- Kategori başına ilerleme satırı:
  - `GG   ████████░░  6/8` (yapılan kardes_etkinlik / planlanan)
- "İhmal edilen kardeşler" listesi: 21+ gündür faaliyeti olmayan kişiler (gri nokta), kategori bazlı gruplu
- Tek tıkla → Rehberlik'te o kişiye git

---

## Veri modeli

Mevcut tablolar yeterli. Tek küçük ekleme:

```sql
create table public.aktivite_tip (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  ad text not null,
  grup text not null check (grup in ('aksiyon','manevi')),
  siralama int not null default 0,
  created_at timestamptz not null default now()
);
-- RLS: auth.uid() = user_id (4 policy)
-- Seed: kullanıcı ilk girişte 6 varsayılan tip
```

Kullanım: `kardes_etkinlik.tip` enum'una dokunmayız (geriye dönük uyumluluk). Yeni tip seçimi `kardes_etkinlik.baslik` + `takvim_etkinlik.aciklama` alanlarına yazılır; enum için "diger" gibi nötr bir değer kullanılır.

> Alternatif: yeni özel tipler için `kardes_etkinlik`'e nullable `tip_id uuid` kolonu eklenir, eski `tip` enum'u dururken yeni tipler bu kolondan okunur. Onayını beklerim.

---

## Yapılacaklar sırası

1. `aktivite_tip` migration + 6 varsayılan seed hook'u
2. Yeni `FaaliyetPlanlaDialog` bileşeni (`src/components/mizan/network/faaliyet-planla-dialog.tsx`)
3. `routes/network.tsx` yeniden yazımı: tek görünüm, sidebar + liste + buton (eski sekmeli yapı `_derin/` altına taşınır, route gizli)
4. Kişi satırında "sonraki faaliyet" + durum noktası hesaplaması (yeni hook `useSonrakiFaaliyet`)
5. `routes/takvim.tsx` read-only mod toggle'ı; oluşturma/düzenleme aksiyonları kaldırılır
6. `routes/istikamet.tsx` yeni rota; haftalık özet + ihmal listesi
7. Topbar/sol-sidebar: 3 ana tab'a indirgenmiş üst nav

## Riskler / kararlar (onayını bekliyorum)

- **İstişare/Gündem/Rapor**: tamamen sil mi, yoksa `/derin/*` altında erişilebilir mi kalsın? Önerim: kalsın, üst nav'dan kaldırılsın.
- **`aktivite_tip` tablosu**: yukarıdaki sade yaklaşım mı, yoksa `kardes_etkinlik`'e `tip_id` kolonu mu?
- **Mizan dashboard**: dokunmayalım, sadece yeni `/istikamet` ekleyelim — yoksa `/` rotasını da `/istikamet`'e mi yönlendirelim?
