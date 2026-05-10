
# /takvim — Google Calendar Klonu (Sıfırdan)

Mevcut takvim kodu (görev paneli, çetele/amel/ilim entegrasyonları, sürükle yardımcıları, görünüm bileşenleri) tamamen silinecek; yerine bağımsız, full-screen bir GC klonu konacak. Veriler Lovable Cloud'da tutulacak; çoklu takvim için yeni bir tablo eklenecek.

## 1. Veritabanı (migration)

Yeni tablo: `takvim`
- `id, user_id, ad, renk` (8 preset'ten biri), `gorunur boolean default true`, `is_default boolean`, `siralama`, timestamps
- RLS: sadece sahibi CRUD edebilir

Mevcut `takvim_etkinlik` tablosuna eklemeler:
- `takvim_id uuid` (yeni `takvim` tablosuna referans, nullable→backfill→not null)
- `renk text` (etkinlik özel rengi, null ise takvim rengi)
- `tum_gun_bitis date` (çoklu gün için)
- `konum, hatirlatici_dk int`, `tekrar_kural text` (RFC5545 RRULE — daily/weekly/biweekly/monthly/yearly/custom için)
- Mevcut `alan` kolonu kalır ama UI'dan kaldırılır (geri uyum için).

Backfill: her kullanıcıya "Kişisel" varsayılan takvim oluştur, mevcut etkinlikleri ona bağla.

`takvim_gorev` tablosu olduğu gibi kalır ama UI'dan ayrıştırılır (bu sayfa sadece etkinliklerle ilgilenir).

## 2. Silinecek dosyalar

```
src/components/mizan/takvim/gun-gorunumu.tsx
src/components/mizan/takvim/hafta-gorunumu.tsx
src/components/mizan/takvim/ay-gorunumu.tsx
src/components/mizan/takvim/etkinlik-dialog.tsx
src/components/mizan/takvim/gorev-dialog.tsx
src/components/mizan/takvim/gorev-paneli.tsx
src/lib/takvim-surukle.ts
src/lib/takvim-cakisma.ts
src/lib/takvim-hooks.ts
src/lib/takvim-tipleri.ts
src/routes/takvim.tsx
```

`app-shell.tsx`'teki `/takvim` özel-case'i sadeleşir (zaten chrome'u gizliyor).

## 3. Yeni dosya yapısı

```
src/routes/takvim.tsx                     # full-screen kabuk, route
src/components/takvim/
  ust-bar.tsx                             # Today, < >, başlık, görünüm seçici, ara
  yan-panel.tsx                           # mini takvim, takvim listesi, yaklaşan etkinlikler
  ay-gorunumu.tsx                         # 6x7 grid, çok-günlü span, hafta no, weekend stil
  hafta-gorunumu.tsx                      # 7 sütun, all-day band, saat grid, now-line, çakışma
  gun-gorunumu.tsx                        # tek sütun versiyonu
  yil-gorunumu.tsx                        # 12 mini ay
  etkinlik-cipi.tsx                       # ay/hafta için renkli blok
  etkinlik-dialog.tsx                     # oluştur/düzenle modal (tüm alanlar)
  silme-onay.tsx                          # AlertDialog
  baglam-menu.tsx                         # sağ-tık (edit/dup/delete/renk)
  takvim-yonet.tsx                        # takvim oluştur/sil/renk
  arama-paneli.tsx                        # dropdown sonuç
  bildirim-merkezi.tsx                    # in-app reminder popup
  alt-mobil-bar.tsx                       # mobil görünüm seçici
src/lib/takvim/
  tipler.ts                               # Etkinlik, Takvim, Gorunum, Renk
  hooks.ts                                # useEtkinlikler, useTakvimler, mutasyonlar
  cakisma.ts                              # GC tarzı çakışma sütun ataması
  tekrar.ts                               # RRULE expand (daily/weekly/biweekly/monthly/yearly/custom)
  ics.ts                                  # export/import .ics
  dogal-dil.ts                            # "Lunch tomorrow 12pm-1pm" → Etkinlik
  bildirim.ts                             # Notification API + in-app
  klavye.ts                               # T/M/W/D/Y + ok tuşları
  surukle.ts                              # DnD + dikey resize + auto-scroll
  renkler.ts                              # 8 preset (semantic token)
```

## 4. Görünümler ve davranış

- **Ay (varsayılan):** 6×7 grid, bugün mavi daire, hafta numarası (sol), hafta sonu daha açık, çok-günlü etkinlik gerçek span (continueLeft/continueRight), boş alana tıkla → yeni etkinlik (gün+09:00).
- **Hafta:** üstte all-day band, 00–23 saat grid, çalışma saatleri (9–17) hafif vurgu, kırmızı now-line (her dakika güncellenir), çakışan olaylar yan yana sütun, tıkla-sürükle ile boş aralık seç → yeni etkinlik, bloğun alt kenarından dikey resize, etkinliği başka güne/saate sürükle.
- **Gün:** Hafta'nın tek-sütun türevi.
- **Yıl:** 12 mini ay grid; bir aya tıkla → ay görünümüne geç.
- Görünümler arası `framer-motion` ile küçük cross-fade.

## 5. Etkinlik formu (modal)

Alanlar: başlık (zorunlu), açıklama, takvim seçici, renk (varsayılan takvim rengi + 8 preset), başlangıç tarih+saat, bitiş tarih+saat, tüm gün toggle, konum, hatırlatıcı (yok/5/15/30/60/1440 dk), tekrar (yok/günlük/haftalık/2-haftalık/aylık/yıllık/özel). "Çoğalt" butonu ve "Sil" (onay ile).

## 6. Çoklu takvim

Yan panelde takvim listesi (renk noktası + checkbox + ad). Görünür olmayanlar grid'de filtrelenir. "Yeni takvim" butonu küçük dialog açar (ad + 8 renk). Sağ-tık ile sil/yeniden adlandır. localStorage'da `gorunur` durumu cache'lenir.

## 7. Arama, ICS, klavye, bildirim

- **Arama:** üst bar sağda input; başlık+açıklama+konum içinde anlık dropdown sonuç; tıkla → ilgili tarihe atla ve dialog aç.
- **ICS:** "Dışa aktar" tüm görünür etkinlikleri `.ics` indirir; "İçe aktar" `.ics` dosyasını parse edip seçili takvime ekler.
- **Klavye:** T (bugün), M/W/D/Y, ←/→ (gezinti), `/` (arama), N (yeni), Esc (modal kapat).
- **Bildirim:** mount'ta `Notification.requestPermission()`; `setTimeout` ile hatırlatıcı zamanlaması + her zaman in-app sonner toast. Üst barda bugünkü etkinlik sayısı rozeti.

## 8. UX detayları

- Karanlık üst bar (`bg-card border-b`), prominent ay/yıl başlığı.
- Tasarım sistemi: tüm renkler `src/styles.css`'teki semantic token + 8 takvim rengi (oklch) `--cal-1..8`.
- Mobil (<768): yan panel offcanvas, alt bar görünüm seçici, ay görünümünde sola/sağa swipe ile ay değişimi (touch handler).
- Tooltip (hover) etkinliklerin üstünde tam detayı gösterir.
- Loading skeleton + boş durum mesajları.

## 9. Faz sırası (tek PR içinde, dosya bazında)

1. Migration (takvim tablosu + etkinlik kolonları + backfill).
2. `lib/takvim/*` tipler+hook+cakisma+tekrar+renkler.
3. Route kabuğu + üst bar + yan panel.
4. Ay → Hafta → Gün → Yıl görünümleri.
5. Etkinlik dialog + DnD + resize + sağ-tık.
6. Arama + ICS + klavye + bildirim + mobil swipe + alt bar.
7. Eski dosyaları sil, `app-shell` sadeleştir.

## Teknik notlar

- TanStack Query ile hooks (`useTakvimler`, `useEtkinlikler({from,to})`).
- Tüm yazma işlemleri RLS ile auth'lu kullanıcı üzerinden Supabase browser client ile.
- `date-fns` mevcut, `framer-motion` mevcut; yeni paket gerekmez.
- Realtime: `takvim_etkinlik` ve `takvim` tablolarına `supabase_realtime` publication eklenir → çoklu cihaz canlı senkron.
- Tip güvenliği: `Database` türleri otomatik regenerate olur.
