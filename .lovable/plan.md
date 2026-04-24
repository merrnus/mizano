## Amaç
Mobilde (392px) etkinlik dialogundaki Başlangıç/Bitiş `datetime-local` inputlarının çakışmasını çözmek ve Google Calendar'a benzer, ayrı tarih + saat alanlarına sahip net bir form sunmak.

## 1) `src/components/mizan/takvim/etkinlik-dialog.tsx`

### State değişikliği
Tek string yerine ayrı parçalar:
- `baslangicTarih` (YYYY-MM-DD), `baslangicSaat` (HH:mm)
- `bitisTarih` (YYYY-MM-DD), `bitisSaat` (HH:mm)

`toLocalInput`/`fromLocalInput` yerine küçük yardımcılar: `toDateInput(d)`, `toTimeInput(d)`, `birlestir(tarih, saat)` → ISO Date.

`useEffect` içindeki initial set ve `kaydet`'teki ISO dönüşümü buna göre güncellenir.

### Layout (Google Calendar tarzı)
"Tüm gün" switch'ini koruyoruz. Altındaki blok:

**Tüm gün AÇIK:**
```
[ Başlangıç tarihi ] [ Bitiş tarihi ]   ← grid-cols-2 (her iki input da kompakt date)
```

**Tüm gün KAPALI (saatli):**
```
Başlangıç
[ Tarih (flex-1) ] [ Saat (w-[110px]) ]

Bitiş
[ Tarih (flex-1) ] [ Saat (w-[110px]) ]
```
İki ayrı satır halinde dikey istif — 392px'te sığar; sabit `sm:` breakpoint gerekmez çünkü her satır kendi içinde zaten dar.

### Akıllı varsayılanlar / doğrulama
- Yeni etkinlikte bitiş = başlangıç + 1 saat (zaten var, parçalı state'e taşınır).
- `kaydet`'te: bitiş < başlangıç ise toast hata + `bitis` otomatik `başlangıç + 1 saat`'e düzeltilip kaydet iptal.
- Başlangıç tarihi/saati değişince, bitiş hâlâ başlangıçtan önceyse otomatik olarak +1 saat ileri kaydır (Google Calendar davranışı).
- Tüm gün açılınca: bitiş tarihi boşsa başlangıç tarihine eşitle.

### Diğer
- "Alan" ve "Tekrar" satırı `grid-cols-2` olarak kalır (zaten 392px'te sığıyor — Select trigger'ları esnek).
- `DialogContent`'a `max-h-[90vh] overflow-y-auto` ekle ki içerik uzayınca mobilde kaydırılabilsin.

## 2) `src/components/mizan/takvim/gorev-dialog.tsx`

Tek değişiklik: 3'lü grid'i mobilde dikey istifle.
- `grid grid-cols-3 gap-2` → `grid grid-cols-1 gap-2 sm:grid-cols-3`
- "Vade" sütunundaki `col-span-1` ifadesini kaldır (artık gereksiz).
- 392px'te Vade / Öncelik / Alan üçü dikey istiflenir, ≥640px'te yan yana kalır.

## Dokunulmayacaklar
- `useEtkinlikEkle` / `useEtkinlikGuncelle` hook'ları ve `TakvimEtkinlikEkle` tipi — payload şeması (ISO baslangic/bitis) aynı kalır.
- Veritabanı / migration yok.
- `index.tsx`, `takvim.tsx` ve diğer çağıran yerler etkilenmez (props imzası aynı).

## Kabul kriterleri
- 392px'te Başlangıç ve Bitiş alanları üst üste binmeden net görünür.
- Tüm gün açıkken tek satırda iki tarih, kapalıyken iki satırda tarih+saat çiftleri.
- Bitiş < Başlangıç engellenir (toast + auto-shift).
- Yeni etkinlikte bitiş otomatik +1 saat.
- Görev dialogunda Vade/Öncelik/Alan mobilde dikey, desktop'ta yatay.
