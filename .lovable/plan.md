# Network Rapor Sayfası + PDF

## Amaç
Gündemler, kardeş faaliyetleri ve (opsiyonel) maneviyat verilerini tek yerden filtreleyip görmek; aynı görünümü PDF olarak dışa aktarmak.

## Yapılacaklar

### 1. Yeni rota: `src/routes/network.rapor.tsx`
- Network sekmesinin altında 4. sekme olarak "Rapor" eklenir (Kişiler · İstişareler · Gündemler · Rapor).
- `validateSearch` ile filtreler URL'de tutulur (paylaşılabilir/yer imine alınabilir):
  - `from`, `to` → tarih aralığı (ISO string, varsayılan: son 30 gün)
  - `kisiId` → tek kişi filtresi (opsiyonel)
  - `kategoriId` → kategori filtresi (opsiyonel; kişiler üzerinden)
  - `kapsam` → `["gundem","faaliyet","maneviyat"]` çoklu seçim (varsayılan: gündem + faaliyet)
  - `sonucDurumu` → `tumu | dolu | bos` (sonuç/karar yazılı mı?)
  - `gundemDurumu` → `tumu | bekliyor | yapildi`

### 2. Üst filtre çubuğu
- Tarih aralığı: hızlı butonlar (Bu hafta · Bu ay · Son 3 ay · Özel) + iki date input.
- Kişi seçici (Combobox, "Tümü" varsayılan).
- Kategori chip listesi (çoklu seçim).
- Kapsam toggle'ları (Gündemler / Faaliyetler / Maneviyat).
- "Sonuç dolu / boş / tümü" segmented.
- Sağda: **PDF indir** butonu.

### 3. Özet kartlar (üstte)
- Toplam gündem · Tamamlanan · Sonuç yazılı oran %
- Toplam faaliyet · Sonuç yazılı oran % · En aktif kardeş
- Maneviyat seçiliyse: aktif müfredat sayısı, son 7 gün evrad doluluk oranı

### 4. İçerik blokları (kapsama göre)
- **Gündemler bölümü:** İstişare bazlı gruplandırma. Her gündem: içerik, karar (sonuç), sorumlular, durum, tarih. Kararı boş olanlar görsel olarak işaretli (kırmızı nokta).
- **Faaliyetler bölümü:** Kişi bazlı gruplandırma (veya tarih bazlı, toggle ile). Her faaliyet: tip, tarih, başlık, sonuç. Sonuç boşsa "Sonuç eksik" rozeti.
- **Maneviyat bölümü (opsiyonel):** Kişi başına aktif müfredat ilerlemesi (% madde tamamlanma) + son 30 gün evrad heatmap özeti.

### 5. Veri katmanı
`src/lib/network-hooks.ts` içine ekle:
- `useRaporGundemler(filtreler)` — `gundem` + `istisare` + `gundem_sorumlu` + `gundem_kisi` join, tarih ve kişi filtresi server-side.
- `useRaporFaaliyetler(filtreler)` — `kardes_etkinlik` + `gundem_kisi` + `gundem_kisi_kategori` join.
- `useRaporManeviyat(filtreler)` — `kardes_mufredat` + `kardes_evrad_madde` + `kardes_evrad_kayit`.
- Her hook tek `useQuery`, queryKey filtreleri içerir.

### 6. PDF dışa aktarımı
- Lib: **`jspdf` + `jspdf-autotable`** (Worker uyumlu, tamamen client-side, mevcut filtrelenmiş veriden çalışır — ek server function gerektirmez).
- `src/lib/network-rapor-pdf.ts` modülü:
  - `raporPdfUret({ filtreler, gundemler, faaliyetler, maneviyat })` fonksiyonu.
  - Başlık: "Mizan Rapor — {tarih aralığı}", filtre özeti.
  - Bölümler: Özet → Gündemler tablosu → Faaliyetler tablosu → (varsa) Maneviyat tablosu.
  - Türkçe karakter desteği için Inter veya Noto Sans font embed (jsPDF'e base64 ile yüklenir).
  - Sayfa altı: oluşturulma tarihi, sayfa no.
- "PDF indir" butonu mevcut React Query verisini fonksiyona geçer, `rapor-{from}-{to}.pdf` olarak indirir.

### 7. Network sekmesi entegrasyonu
- `src/routes/network.tsx`: `TabKey` tipine `"rapor"` eklenir, `TabsList`'e yeni trigger eklenir, route altyapısı zaten var (alt rotalar gibi `Outlet` ile değil; doğrudan tab içeriği olarak `<RaporTab />` render edilir).
- Alternatif: ayrı `/network/rapor` route'u — daha temiz URL ve loader avantajı için bunu tercih ediyorum. Sekme değişimi `navigate({ to: "/network/rapor" })` ile.

### 8. Boş/yükleniyor/hata durumları
- Tarih aralığında veri yoksa: "Bu kriterlerle kayıt bulunamadı" + filtre sıfırlama butonu.
- Yükleniyor: skeleton kartlar.
- Hata: retry butonlu uyarı.

## Dosya değişiklikleri özet
- **Yeni:** `src/routes/network.rapor.tsx`, `src/components/mizan/network/rapor-filtreler.tsx`, `src/components/mizan/network/rapor-ozet-kartlar.tsx`, `src/components/mizan/network/rapor-icerik.tsx`, `src/lib/network-rapor-pdf.ts`
- **Güncel:** `src/lib/network-hooks.ts` (3 yeni hook), `src/routes/network.tsx` (4. sekme)
- **Bağımlılık:** `bun add jspdf jspdf-autotable`

## Veritabanı değişikliği
**Yok.** Mevcut tablolar (`gundem`, `istisare`, `gundem_sorumlu`, `kardes_etkinlik`, `gundem_kisi`, `gundem_kisi_kategori`, `kardes_mufredat`, `kardes_evrad_*`) yeterli.

## Onay sonrası ilk iterasyon
1. Rota + filtre çubuğu + gündem/faaliyet hook'ları + liste görünümü.
2. Özet kartlar.
3. PDF indirme.
4. Maneviyat bölümü (kapsam seçilirse).
