# Plan: Kişiler — Derin Takip & Faaliyet Geçmişi

## 🎯 Hedef
Mevcut basit kişi yönetiminin üstüne, **kişi başına aktive edilebilen "derin takip" modu** ekle. Bu modda kişinin (özellikle Evdeki kardeşlerin) künyesi, akademik durumu, ilgi alanları ve tüm faaliyet/etkinlik timeline'ı tek sayfada görünür. Ana sayfaya da "Bu hafta Evdekiler" widget'ı koyalım.

**Kapsamı bilinçli olarak küçük tutuyoruz:** Bu turda Profil + Faaliyetler. 3 aylık manevi müfredat ve haftalık evrad çetelesi sonraki tura.

---

## 1. Veritabanı Migration

### 1a. `gundem_kisi` tablosunu genişlet
Yeni kolonlar (hepsi nullable, mevcut veriyi bozmaz):
- `derin_takip` boolean default false — bu kişi için tam sayfa profil açılsın mı
- `telefon` text
- `dogum_tarihi` date
- `foto_url` text
- `universite` text
- `bolum` text
- `sinif` text  *(serbest: "Hazırlık", "3. sınıf", "Mezun"…)*
- `gano` numeric
- `akademik_durum` text  *(hazırlık/aktif/mezun/ara verdi…)*
- `ilgi_alanlari` text[] default '{}'
- `sorumluluk_notu` text  *("Bana ait sorumluluklar")*

### 1b. Yeni enum: `kardes_etkinlik_tip`
14 tip — kullanıcının istekleri tam karşılanıyor:
`sohbet, istisare, kuran, sophia, kamp, sinav, yarisma, hediye, gezi, spor, teke_tek, dogum_gunu, kandil, zoom`

### 1c. Yeni tablo: `kardes_etkinlik`
- `id` uuid PK
- `user_id` uuid (RLS)
- `kisi_id` uuid → gundem_kisi.id (silinince cascade temizlemek için kod tarafında halledilecek, FK eklemiyoruz çünkü mevcut tablolarda da yok)
- `tip` kardes_etkinlik_tip
- `tarih` date NOT NULL
- `baslik` text NOT NULL  *(kısa özet: "Çay sohbeti", "Doğum günü kutlaması")*
- `notlar` text  *(uzun açıklama, sonuç, hatıralar)*
- `sonuc` text  *(yarışma derecesi, sınav puanı vb. için opsiyonel)*
- `created_at`, `updated_at` timestamptz
- RLS: standart user_id == auth.uid() (4 policy: select/insert/update/delete)
- `set_updated_at()` trigger

---

## 2. Tipler ve Hooks

### 2a. `src/lib/network-tipleri.ts` — Genişletme
- `Kisi` ve `KisiDetay` tipine yeni kolonlar otomatik gelir (Database tipinden çekiyoruz).
- Yeni: `KardesEtkinlik`, `KardesEtkinlikTip` tipleri.
- `ETKINLIK_TIP_LISTE`: `{ id, ad, ikon, renk }` array — UI'da chip/select için. (Türkçe etiketler: "Sohbet, İstişare, Kuran, Sophia, Kamp, Sınav, Yarışma, Hediye, Gezi, Spor, Teke Tek, Doğum Günü, Kandil, Zoom")

### 2b. `src/lib/network-hooks.ts` — Yeni hook'lar
- `useKisi(id)` — tek kişi detayı (kategori_ids ile)
- `useKisiGuncelleDetay()` — yeni alanları (telefon, dogum_tarihi, akademik vs.) update eden mutation
- `useKardesEtkinlikler(kisi_id?)` — bir kişinin (veya tümünün) etkinliklerini tarihe göre desc çek
- `useKardesEtkinlikEkle()` / `useKardesEtkinlikGuncelle()` / `useKardesEtkinlikSil()`
- `useEvdekilerOzet()` — ana sayfa widget için: derin_takip=true olan kişiler + her birinin son teke_tek tarihi + bu hafta doğum günü olanlar

---

## 3. Routing

### 3a. Yeni route: `src/routes/network.kisi.$id.tsx`
TanStack file-based: `network.kisi.$id` → `/network/kisi/:id`
- `Route.useParams()` ile id al
- Kişi yoksa `notFoundComponent`
- Üst kısımda geri butonu → `/network?tab=kisiler`
- 2 sekme (Tabs): **Profil** | **Faaliyetler**

### 3b. `kisiler-tab.tsx` davranış değişikliği
Kişi kartına tıklayınca:
- Eğer `kisi.derin_takip === true` → `/network/kisi/$id`'ye git
- Değilse → mevcut Sheet açılır (hızlı düzenleme)
- Sheet'in içine küçük bir switch eklenecek: "Derin takip" toggle. Açılınca bu kişi tam sayfa moduna geçer.

---

## 4. Yeni Component'ler

### 4a. `src/components/mizan/network/kardes-profil-form.tsx`
**Profil sekmesi içeriği.** Üç collapsible/section:

**Künye**
- Foto (basit URL input — bucket entegrasyonu sonraki tur)
- Ad (büyük input)
- Telefon, Doğum tarihi
- Sorumluluk notu (textarea)

**Akademik**
- Üniversite, Bölüm, Sınıf, GANO, Akademik durum

**İlgi Alanları**
- Tag input: virgülle ayır, chip olarak göster, X ile sil
- Mevcut `ilgi_alanlari` text[] kullan

**Kategoriler** (mevcut)

Alt: "Kaydet" / "İptal" butonları + toast.

### 4b. `src/components/mizan/network/kardes-faaliyet-timeline.tsx`
**Faaliyetler sekmesi içeriği.**

**Üst kısım — Yeni etkinlik formu:**
- Tip seçici (14 sabit tip — Select veya chip grid)
- Tarih (date input, default bugün)
- Başlık (input)
- Notlar (textarea, opsiyonel)
- Sonuç (yalnızca tip=sinav/yarisma seçildiğinde görünür input)
- "Ekle" butonu

**Alt kısım — Timeline:**
- Tarihe göre desc grupla (Bu hafta / Bu ay / Daha önce)
- Her kart: tip ikonu + chip + tarih + başlık + (varsa) notlar/sonuç + edit/sil aksiyonları
- Boş durum: "Henüz faaliyet yok. İlk kaydı ekle."

**Filtre:** üstte mini chip bar — tipe göre filtreleme.

### 4c. `src/components/mizan/dashboard/evdekiler-widget.tsx`
Ana sayfa için widget. Üç bölüm (compact card):

- **🎂 Bu hafta doğum günü** — `dogum_tarihi`'si bu hafta içinde olanlar
- **☕ Teke tek bekleyen** — derin_takip=true olup son `tip=teke_tek` etkinliği 14 günden eski (veya hiç yok) olanlar
- **🎉 Yaklaşan kandil/program** — sonraki 7 gün içinde planlı `kandil` veya `kamp` tipi etkinlikler

Her satıra tıklayınca → ilgili kişinin profiline gider.

---

## 5. Ana Sayfa Entegrasyonu

`src/routes/index.tsx` (Mizan hub):
- Mevcut 3 IstikametKart altına `<EvdekilerWidget />` ekle (sadece en az 1 derin_takip kişi varsa render et — "Henüz Evdekiler eklenmedi" görmesin)
- Responsive: tek sütun mobil, yan yana md+

---

## 6. UX / Polish Detayları

- Tarih input'ları için locale tr (mevcut date-fns/locale tr kullanılıyor)
- Etkinlik tip ikonları: lucide'den `MessageCircle, Users, BookOpen, GraduationCap, Tent, FileText, Trophy, Gift, Map, Trophy, Coffee, Cake, Sparkles, Video`
- Foto yokken Avatar fallback (mevcut pattern)
- Tüm yeni form'larda Türkçe label & toast mesajları
- KisilerTab'taki kart üstüne `derin_takip` ise küçük bir 🌟 veya `Eye` ikonu rozet olarak ekle (görsel ayrım)

---

## 7. Yapılmayacaklar (sonraki turlara)

- ❌ 3 aylık manevi müfredat (`kardes_hedef` tablosu)
- ❌ Haftalık evrad çetelesi (`kardes_evrad`)
- ❌ Foto upload bucket entegrasyonu (şimdilik URL field)
- ❌ Etkinlik için takvim entegrasyonu (mevcut takvim_etkinlik'le otomatik sync)
- ❌ Hatırlatma/bildirim

Bunları senin onayınla bir sonraki adımda ekleriz.

---

## 📋 Task Listesi

1. Migration: gundem_kisi genişlet + kardes_etkinlik_tip enum + kardes_etkinlik tablosu (RLS + trigger)
2. Tipler & hook'lar (network-tipleri.ts + network-hooks.ts)
3. Yeni route: /network/kisi/$id (Profil + Faaliyetler tab'lı sayfa)
4. KardesProfilForm component (künye + akademik + ilgi alanları)
5. KardesFaaliyetTimeline component (etkinlik ekle + filtreli timeline)
6. KisilerTab güncelleme (derin_takip toggle + tıklama davranışı + rozet)
7. EvdekilerWidget + ana sayfa (index.tsx) entegrasyonu

Onayını verdiğinde sırayla uygularım.