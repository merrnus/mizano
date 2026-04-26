# Minimal sadeleştirme: Görevler sütunu → eylem butonları

## Amaç
Ana sayfadaki "Bugün Görevleri" sütunu, zaman çizelgesindeki bilgiyi tekrarlıyor. Onu kaldırıp yerine sade `+ Görev ekle` ve `+ Etkinlik ekle` butonları koyacağız.

## Değişiklikler

### 1. `src/routes/index.tsx`
- Grid'i 3 kolondan **2 kolona** indir: `lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]` (çetele | zaman çizelgesi).
- `<BugunGorevleri />` import'unu ve render'ını kaldır.
- Yeni state ekle: `etkinlikDialogAcik` (gorev dialog state'i zaten var).
- `EtkinlikDialog` import et ve mount et (`varsayilanBaslangic={simdi}`).
- Zaman çizelgesi kartının **altına** (grid'in dışında, küçük bir flex satırı) iki buton:
  - `+ Görev ekle` → `setGorevDialogAcik(true)`
  - `+ Etkinlik ekle` → `setEtkinlikDialogAcik(true)`
- Butonlar `Button variant="outline" size="sm"` ile, ikon (`Plus` / `CalendarPlus`) ile, sağa hizalı veya zaman çizelgesi genişliğinde — minimal stil.

### 2. `src/components/mizan/dashboard/bugun-gorevleri.tsx`
- **Sil.** Başka yerde import edilmiyor (sadece index.tsx kullanıyordu).

## Sonuç
- Ana sayfa daha ferah, dikey daha kısa.
- Görev/etkinlik eklemek hâlâ tek tıkla mümkün (tam dialog ile detaylı).
- Bilgi tekrarı yok: bugünün işleri tek yerde — zaman çizelgesinde.
