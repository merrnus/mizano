## Faz 2 — Takvim kod ayrıştırma

Mevcut `src/routes/takvim.tsx` (~960 satır) sayfa-orkestrasyon dosyası olarak ~150 satıra inecek. 7 alt-komponent kendi dosyalarına taşınır. **Davranış değişmez** — sadece dosya bölünmesi.

### Dosya planı

```
src/components/mizan/takvim/
├── mini-takvim.tsx          (yeni — 37 sat)
├── takvim-listesi.tsx       (yeni — 46 sat)
├── yaklasan-listesi.tsx     (yeni — 19 sat)
├── olay-menu.tsx            (yeni — ~40 sat)
├── ay-gorunumu.tsx          (yeni — ~115 sat)
├── hafta-gorunumu.tsx       (yeni — ~100 sat + GunSutun helper)
├── gun-sutun.tsx            (yeni — ~190 sat, içinde pxToDk + GunSutun)
└── yil-gorunumu.tsx         (yeni — ~35 sat)
```

`takvim.tsx`'te kalan: route definition, state, mutasyon handler'ları, klavye dinleyici, hatırlatıcı timer'ı, swipe, `yanIcerik` JSX, ana JSX iskeleti (header + main + bottom nav + dialog'lar). ~150 satır.

### Import düzeni
Her yeni dosya kendi gerekli importlarını (date-fns, lucide, ui/*, lib/takvim/*, tipler) içerir. `takvim.tsx` artık sadece kullandığı 8 komponenti import eder.

### Korunanlar (dokunulmaz)
- `src/lib/takvim/*` (hooks, tekrar, cakisma, renkler, ics, tipler)
- `src/components/takvim/etkinlik-dialog.tsx`
- `src/components/mizan/takvim/etkinlik-hizli-popover.tsx`
- `src/components/mizan/takvim/gorev-dialog.tsx`
- Faz 1'de yeniden düzenlenen header, bottom nav, FAB, klavye kısayolları — değişmez

### Yöntem
1. Yeni dosyaları yarat, ilgili fonksiyon bloklarını birebir kopyala (tip imzaları dahil)
2. `takvim.tsx`'ten alt-komponent tanımlarını sil, başa importları ekle
3. `useMedya` hook'u `takvim.tsx`'te kalır (sadece orada kullanılıyor)
4. Build doğrulama

### Risk
Düşük. Saf taşıma, mantık değişmiyor. Tek sıkıntı olabilir: `HaftaGorunumu` → `GunSutun` çağırıyor, `OlayMenu` birden fazla görünümden çağrılıyor — bunlar normal import'la çözülür.
