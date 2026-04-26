
İki ayrı iş var. İkisini sırasıyla yapacağım.

---

## 1. Kategoriler panelini küçült (Kişiler sayfası)

**Sorun**: Sol taraftaki kategori paneli (220px genişlik, "Kategoriler" başlığı, "Tümü" / "Kategorisiz" satırları, alt alta liste, alttaki "Yeni kategori" inputu) ekranda fazla yer kaplıyor — odağı kişilerden çalıyor.

**Çözüm**: Sol kolonu kaldırıp, kategorileri **üstte yatay chip satırı**'na çevir (filter çipleri pattern'i — `kardes-faaliyet-timeline`'daki `FiltreChip` ile aynı).

### Değişiklikler

**`src/components/mizan/network/kisiler-tab.tsx`**:
- Üst seviye `grid lg:grid-cols-[220px_1fr]` layout'unu kaldır → tek kolon `space-y-3`.
- `KategoriPaneli` bileşenini **`KategoriChipBar`** olarak yeniden yaz:
  - "Kategoriler" başlığı yok.
  - Yatay flex-wrap, küçük chip'ler: `Tümü · 12`, `Kategorisiz · 3`, sonra her kategori `GG · 5` formunda.
  - Aktif chip primary border + `bg-primary/15`.
  - **Hover'da** chip'in sağında küçük `Pencil` / `Trash2` ikonları (sadece kullanıcı kategorileri için, "Tümü" / "Kategorisiz" hariç).
  - En sona "+ Yeni" chip butonu — tıklayınca inline input açılır (popover değil, basit conditional).
- `KategoriSatir` bileşenini sil (artık kullanılmıyor).
- Düzenleme modu: chip yerinde `<Input className="h-7 w-24">` göster, Enter / Esc ile kapat.

**Beklenen yükseklik**: ~36–40px (tek satır, taşarsa wrap). Önceki ~250px+ panel yerine.

---

## 2. Derin takip profiline "Maneviyat" sekmesi ekle

**Şu anki durum**: `/network/kisi/$id` sayfasında 2 sekme var: **Profil**, **Faaliyetler**. Faaliyetler içinde `kuran`, `sohbet`, `kamp`, `sinav`, `yarisma`, `sophia`, `kandil`, `zoom` gibi maneviyat tipleri zaten var ama hepsi tek timeline'da karışık.

**Kullanıcının isteği**: Maneviyat ayrı bir sekme olsun, içinde:
- **3 aylık müfredat / hedef** (kişiye özel)
- **Haftalık evrâd-u ezkâr** (kişiye özel checklist)
- Maneviyat etkinliklerinin özet görünümü (sohbet / kuran / sophia / kamp / sınav / yarışma / kandil / zoom — bunlar zaten `kardes_etkinlik` tablosunda var, sadece filtreli göstereceğiz)

### Yapı

**Sekme bar**:
```
Profil · Faaliyetler · Maneviyat
```

**Maneviyat sekmesi içeriği** (üstten alta):

1. **3 Aylık Hedef / Müfredat kartı**
   - Tek bir aktif "müfredat" kaydı (başlık + 3 aylık hedef listesi maddeleri + tamamlanma yüzdesi).
   - Maddeler tıklanarak işaretlenebilir (checklist).
   - "Yeni dönem başlat" butonu — eskisi arşivlenir, yenisi oluşur.

2. **Haftalık Evrâd-u Ezkâr kartı**
   - Bu haftaya ait checklist (örn: günlük Kuran, dua, sünnet ibadetler — kullanıcı tanımlı).
   - 7 gün × N madde grid (cetele-style mini, kişi başına).
   - Şablon: kullanıcı kişiye özel madde ekler/çıkarır; her hafta otomatik yeni satır oluşur (hafta bazlı kayıt).

3. **Maneviyat etkinlik özeti**
   - Sadece `kuran`, `sohbet`, `sophia`, `kamp`, `sinav`, `yarisma`, `kandil`, `zoom` tiplerini gösteren mini timeline (son 8 kayıt).
   - "Tümünü gör" → Faaliyetler sekmesine git, ilgili filtre seçili.

### DB değişiklikleri (migration)

İki yeni tablo:

**`kardes_muferdat`** (3 aylık hedef)
- `id uuid pk`, `user_id uuid`, `kisi_id uuid → kisiler(id) on delete cascade`
- `baslik text not null`, `baslangic date`, `bitis date`
- `maddeler jsonb` — `[{id, metin, tamamlandi: bool}]`
- `arsiv bool default false`
- `created_at`, `updated_at`
- RLS: user_id = auth.uid() — full CRUD.
- İndeks: `(kisi_id, arsiv)`.

**`kardes_evrad_madde`** (kullanıcının kişi için tanımladığı evrâd maddeleri)
- `id uuid pk`, `user_id uuid`, `kisi_id uuid → kisiler(id) on delete cascade`
- `metin text not null`, `siralama int default 0`
- `aktif bool default true`
- `created_at`, `updated_at`
- RLS aynı pattern.

**`kardes_evrad_kayit`** (haftalık tamamlanma)
- `id uuid pk`, `user_id uuid`, `kisi_id uuid`, `madde_id uuid → kardes_evrad_madde(id) on delete cascade`
- `tarih date not null` (gün bazlı işaretleme)
- `created_at`
- `unique (madde_id, tarih)` — aynı gün için tek kayıt.
- RLS aynı.

### Kod değişiklikleri

**`src/lib/network-tipleri.ts`**: Yeni tipler:
```ts
export type KardesMufredat = { id, user_id, kisi_id, baslik, baslangic, bitis, maddeler: {id,metin,tamamlandi}[], arsiv, ... }
export type KardesEvradMadde = { id, user_id, kisi_id, metin, siralama, aktif, ... }
export type KardesEvradKayit = { id, madde_id, tarih, ... }
```

**`src/lib/network-hooks.ts`**: Yeni hook'lar:
- `useKardesMufredatAktif(kisiId)` — aktif (arşivlenmemiş) tek kayıt.
- `useKardesMufredatKaydet()` — upsert, madde toggle dahil.
- `useKardesMufredatYeniDonem()` — eskiyi arşivle + yeni oluştur.
- `useKardesEvradMaddeler(kisiId)`, `useKardesEvradMaddeEkle/Sil/Guncelle`.
- `useKardesEvradHaftaKayitlari(kisiId, haftaBaslangic)` — bu haftanın 7 günündeki tüm işaretler.
- `useKardesEvradToggle()` — gün × madde işaretle/kaldır.

**`src/components/mizan/network/maneviyat-tab.tsx`** (yeni):
- `<MufredatKart kisiId />` — başlık edit, tarih aralığı, maddeleri sırala/sil/ekle, checklist toggle, yüzde.
- `<EvradHaftalikKart kisiId />` — bu hafta (Pzt–Pzr) × maddeler grid, hücreye tıkla → toggle. Önceki hafta navigasyonu için ok butonları.
- `<ManeviyatEtkinlikOzet kisiId />` — `useKardesEtkinlikler` ile çek, sadece maneviyat tiplerini filtrele, son 8'i göster, "Tümünü gör" linki.

**`src/routes/network.kisi.$id.tsx`**:
- `validateSearch`: `tab` enum'una `"maneviyat"` ekle.
- TabsList'e `<TabsTrigger value="maneviyat">Maneviyat</TabsTrigger>` ekle.
- TabsContent'e `<ManeviyatTab kisiId={kisi.id} />` ekle.

### Kapsam dışı (şimdilik)
- "Bu hafta Evdekiler" widget'ı evrâd verisini de göstersin mi → ayrı turn'de konuşuruz, şimdilik sadece etkinlik özeti var.
- Bildirim / hatırlatma → kapsam dışı.

---

## Etkilenen dosyalar (özet)

**Sadece UI (1. iş)**:
- `src/components/mizan/network/kisiler-tab.tsx`

**DB + UI (2. iş)**:
- migration: `kardes_muferdat`, `kardes_evrad_madde`, `kardes_evrad_kayit` tabloları + RLS.
- `src/lib/network-tipleri.ts` (tipler).
- `src/lib/network-hooks.ts` (hook'lar).
- `src/components/mizan/network/maneviyat-tab.tsx` (yeni).
- `src/routes/network.kisi.$id.tsx` (sekme ekleme).
