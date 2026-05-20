## Faz A — Temizlik (tamamlandı ✓)

- `lib/takvim-hooks.ts` + `lib/takvim-tipleri.ts` → `lib/takvim/`'e konsolide (yeni `gorev.ts`, eski isim aliasları korundu)
- `components/takvim/etkinlik-dialog.tsx` → `components/mizan/takvim/etkinlik-dialog.tsx`'e taşındı
- Eski basit dashboard dialog → `etkinlik-hizli-dialog.tsx` (`EtkinlikHizliDialog`)
- `lib/network-hooks.ts` (1468 sat) → `lib/network/` altında 9 dosya (kategori, kisiler, istisareler, gundemler, kardes-etkinlik, bu-hafta, kardes-mufredat, kardes-evrad, rapor); kök `network-hooks.ts` barrel re-export

Build temiz, davranış değişmedi.

## Sırada
- **Faz B** — şişkin route'ları böl (mizan.ilim.$id, mizan.amel.$id, network.rapor)
- **Faz C** — global Cmd+K, cross-domain bağlama, birleşik bildirim, UX redundancy temizliği
