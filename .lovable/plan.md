
# Rehberlik Sayfası — "Google Müh. Olsa Nasıl Yapardı?" Redesign Planı

Google'ın Contacts + Inbox + Material 3 dilini bizim "İstişare odaklı" mantığımıza uyarlıyoruz. Amaç: gereksiz kromu kaldır, kişiyi merkeze al, istişareyi bir akış haline getir, hızlı eylemleri her yerden ulaşılabilir kıl.

## Tasarım Prensipleri (Google'dan ödünç)

1. **Content-first, chrome-light** — başlık + tab + filtre üst üste yığılı değil, tek satırda toplanır.
2. **Search is the nav** — üstte tek bir geniş arama çubuğu hem kişi hem istişare hem gündem arar (Gmail/Drive paterni).
3. **Density seçimi** — Compact / Comfortable / Cozy toggle (Gmail).
4. **Avatar + renk = kimlik** — kategori rengi avatar halkasına geçer, badge yığını kalkar.
5. **Hover'da değil, tıklamada açılan detay** — sağdan slide-in panel, full sayfa değil (Inbox/Calendar paterni; takvimde de yaptık).
6. **FAB** — sağ-altta tek, bağlama göre değişen "+ Yeni" (Material).
7. **Empty state'ler illüstrasyonlu, eyleme yönlendiren** — boş ekranlar boşa gitmez.

## Yapısal Değişiklikler

### 1) Üst bar (tek satır, Gmail tarzı)
```text
┌─────────────────────────────────────────────────────────────┐
│  Rehberlik   🔍 Kişi, istişare veya gündem ara…    ⚙  👤  │
└─────────────────────────────────────────────────────────────┘
```
- "Yol Arkadaşları" başlığı küçülür, sol tarafa.
- Arama global; sonuçlar grup başlıklı dropdown'da (Kişiler / İstişareler / Gündemler).
- Rapor butonu üst-sağdaki overflow menüye taşınır.

### 2) İki sekmeli ana görünüm — sekmeler segmented
- "Kişiler" ve "İstişareler" yerine Material segmented control. Sekme altı 2px primary çizgi.
- URL state aynen korunur.

### 3) Kişiler sekmesi — "Contacts-grade"
- **Sol kolon (≥md):** Kategoriler dikey liste, sayı badge'li, drag-to-reorder, "+ Yeni kategori" altta. Mobilde üstte yatay chip kalır.
- **Sağ alan:** Kişiler — varsayılan "kart yerine satır" (Contacts list). Density toggle ile kart görünümüne geçilebilir.
- Her satırda: renkli halkalı avatar · isim · alt satırda küçük gri "kategoriler · son etkinlik tarihi" · sağda hover'da hızlı eylemler (mesaj, etkinlik ekle, düzenle, sil).
- Derin takip ⭐ ikonu sol kenarda küçük şerit halinde — daha sakin.
- Çoklu seçim: satır soluna hover edince checkbox gelir; seçilince üstte "3 kişi · Kategori ata · Etkinlik · Sil" action bar açılır (Gmail paterni).
- Hızlı kişi ekleme inline kalkar; FAB → "Yeni kişi" sheet.
- Tıklayınca: hafif takip ise sağdan **detay paneli** (50% genişlik), derin takip ise tam sayfaya geç.

### 4) İstişareler sekmesi — "Timeline + Kanban hibridi"
- Üstte yatay zaman şeridi (son 6 ay, ay grupları), her noktada istişare. Inbox'ın "schedule" görünümüne benzer.
- Altta liste: her satır küçük ilerleme halkası (tamamlanan/toplam), başlık, tarih, "3 ana / 5 yan gündem" özeti, sorumlu avatar yığını.
- Liste satırına tıklayınca yine sağdan detay paneli; gündemler içinde inline checkbox ile kapatılabilir (sayfa açmadan).
- Filtre chip'leri: "Bu ay · Açık · Tamamlanan · Beni ilgilendirenler".

### 5) Detay paneli (sağdan slide-in)
- 480px varsayılan, "Tam ekran aç" butonu üstte (takvimdeki popover paternine paralel).
- Kişi paneli: avatar + ad + kategori chip'leri + "Son 5 etkinlik" timeline + "Açık gündemler" listesi + hızlı not.
- İstişare paneli: gündem listesi inline editlenebilir, sürükle-sırala, "+ Gündem" altta sticky.

### 6) FAB (Material)
- Sağ-alt, primary renkli, bağlam: Kişiler sekmesinde "Yeni kişi", İstişareler'de "Yeni istişare". Long-press / dropdown ile diğer eylemler.

### 7) Mikroetkileşimler
- Satır hover'da hafif elevation (shadow-sm → shadow), 120ms.
- Panel açılışında 200ms ease-out slide + content fade-in.
- Checkbox tamamlamada Material "ripple" + strikethrough animasyonu.
- Boş durum: küçük SVG illüstrasyon + tek CTA.

## Teknik Notlar

- `src/routes/network.tsx`: header sadeleşir, global arama eklenir, FAB eklenir.
- `src/components/mizan/network/kisiler-tab.tsx`: chip-bar ↔ dikey kategori paneli (md+), satır komponentine refactor, çoklu seçim state'i, density toggle.
- `src/components/mizan/network/istisareler-tab.tsx`: timeline şeridi + zenginleşmiş satırlar; sağ panel için yeni `istisare-detay-panel.tsx`.
- Yeni: `src/components/mizan/network/kisi-detay-panel.tsx` (mevcut Sheet'ten içerik taşınır, "tam ekran aç" eklenir).
- Yeni: `src/components/mizan/network/global-arama.tsx` — kişi/istişare/gündem üzerinde combobox tarzı arama.
- Yeni: `src/components/mizan/network/fab.tsx` — bağlam-duyarlı floating action button.
- Tüm renkler `src/styles.css` semantic token'ları üzerinden (yeni custom renk yok).
- Mobile (<sm): kategoriler chip bar olarak kalır, FAB alt nav'ın üstüne pozisyonlanır (pb-24 mantığı).

## Kapsam Dışı (bu turda)
- Backend / RLS / hook değişiklikleri yok; sadece sunum katmanı.
- Rapor sayfası dokunulmaz, sadece menüye taşınır.

---

Onaylarsan adım adım uygulayalım. Tercih edersen bunun yerine sadece **Kişiler sekmesi**ne odaklanan daha küçük bir ilk faz da yapabiliriz — söyle yeter.
