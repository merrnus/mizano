## Takvim Redesign — Google Calendar tarzı sadeleştirme

### Tespit
Yapı aslında **Google Calendar'a çok yakın** (header + sol sidebar + ana grid + mobil sheet). Ama:
- **964 satır tek dosyada** — 11 alt-komponent inline (geliştirici acısı, kullanıcı acısı değil)
- **Header çok kalabalık**: geri ok, hamburger, takvim ikonu, "Bugün", ‹ ›, başlık, sayı rozeti, arama ikonu, görünüm select, "Oluştur", ayarlar → 10+ element, mobilde sıkışıyor
- **Arama gizli** — popover ikonun arkasında; Google Calendar'da inline genişler
- **Görünüm değiştirme iki yerde** — üstte select + mobilde alt nav (çift kontrol, kafa karıştırıcı)
- **Mobilde "+"** alt nav'a sıkışmış; klasik FAB daha keşfedilebilir
- **Klavye kısayolu yok** — Google Calendar'da G/W/M/Y, T, J/K, C, / standartı

### Plan: 2 faz

---

### **Faz 1 — UX sadeleştirme** (kullanıcıya görünür kazanç)

**1. Header yeniden düzeni**
```
[‹] [›] [Bugün]   Mart 2026 ▾    🔍 Ara… (inline)   [Gün▾]  [+ Oluştur]  [⋯]
```
- Geri ok kaldırılır (zaten sol sidebar'da Bugün linki var)
- "Bugün" + ‹ ›: sola, kompakt grup
- Başlık ortada, küçük chevron ile aydan ay seçici popover (mini takvim)
- **Arama**: sm+ ekranda inline input (w-44 → focus'ta w-72 büyür), mobilde ikon
- Görünüm: kompakt segmented control (Gün/Hafta/Ay/Yıl) — desktop'ta görünür, mobilde select kalır
- Ayarlar: 3-dot menü (.ics import/export buraya)
- "Bugün X etkinlik" rozeti kaldırılır — başlık altına küçük metin

**2. Mobil sadeleştirme**
- Alt nav'daki "Bugün" silinir (header'da var)
- Alt nav'daki "+" silinir → sağ-alt **FAB** (sticky)
- Alt nav sadece görünüm seçici olarak kalır: 4 düğme (Gün/Hafta/Ay/Yıl) — segmented control
- Hamburger menü yerleşik kalır (sidebar açar)

**3. Klavye kısayolları** (Google Calendar standardı)
- `T` → Bugün
- `J` / `K` veya `←` / `→` → İleri/geri
- `G` / `W` / `M` / `Y` → Gün/Hafta/Ay/Yıl
- `C` → Oluştur
- `/` → Arama focus
- Input/textarea içinde tetiklenmez

**4. Başlık tıklanabilir → mini takvim popover**
- "Mart 2026 ▾" tıklanınca popover'da mini takvim açılır, ay/yıl atlamak için. Google Calendar'daki davranış.

**Etkilenen dosya:** sadece `src/routes/takvim.tsx` (header bloğu + bottom nav bloğu + yeni `useEffect` kısayollar için).

---

### **Faz 2 — Kod ayrıştırma** (görünmez ama bakım için kritik)

964 satırlık dosyayı 7 parçaya böl:

```
src/components/mizan/takvim/
├── takvim-toolbar.tsx         (yeni — header)
├── takvim-yan-panel.tsx       (yeni — mini takvim + liste + yaklaşan)
├── ay-gorunumu.tsx            (taşı, ~110 sat)
├── hafta-gorunumu.tsx         (taşı, ~100 sat)
├── gun-sutun.tsx              (taşı, ~190 sat)
├── yil-gorunumu.tsx           (taşı, ~35 sat)
├── olay-menu.tsx              (taşı, ~40 sat)
└── (mevcut) etkinlik-dialog.tsx, etkinlik-hizli-popover.tsx, gorev-dialog.tsx
```

Sonuç: `takvim.tsx` ~150 satır (sadece state + orkestrasyon).

**Davranış değişikliği YOK** — sadece dosya bölünmesi. Build sonrası birebir aynı çalışacak.

---

### Sıralama önerisi

İkisini ayrı turlarda yapmak daha güvenli:
1. **Önce Faz 1** — sen test edersin, UX değişikliklerini görürsün, geri bildirim verirsin
2. **Sonra Faz 2** — refactor; davranış değişmediğinden risk düşük

### Etkilenmeyen
- Veri katmanı (`src/lib/takvim/*`) — dokunulmaz
- `etkinlik-dialog.tsx`, `etkinlik-hizli-popover.tsx`, `gorev-dialog.tsx` — dokunulmaz
- Çakışma/tekrar/ics mantığı — dokunulmaz
- Sürükleme, resize, context menu davranışı — aynı kalır

### Soru
Faz 1 ile başlayıp onayını alıp Faz 2'ye geçmemi mi istersin, yoksa **ikisini birden** tek seferde yapayım mı? (İkisi birden = daha hızlı ama tek büyük diff, geri dönmek zor.)
