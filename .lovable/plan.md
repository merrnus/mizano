# /takvim — Tam Ekran Canvas Düzeni

## Sorun
Şu an /takvim, AppShell'in içinde render ediliyor: üstte 3rem `Topbar`, altta 4rem `AltTabBar` (mobil), solda IconRail/Sidebar var. Bu yüzden 724×615 viewport'ta takvime kalan alan ~615 − 48 (topbar) − 64 (alt tab) − header (≈64) − padding ≈ **400 px**. Google Calendar'da ise toolbar dışında neredeyse tüm yükseklik gride ayrılır.

## Hedef
`/takvim` rotasında global topbar ve alt tab barını **devre dışı bırakıp**, takvimin kendi kompakt başlığını ekranın tepesine sabitlemek; grid'in viewport yüksekliğinin **%90+'ını** kaplamasını sağlamak.

## Değişiklikler

### 1) `src/components/mizan/app-shell.tsx`
- `isTakvim` zaten hesaplanıyor; bu bayrağı yukarı taşıyıp **`Topbar` ve `AltTabBar`'ı /takvim'de render etmeyeceğiz**.
- IconRail mobilde gizli olduğu için sorun yok; desktop'ta dar şerit kalmaya devam eder (kullanıcı isterse onu da kapatırız).
- `SidebarInset` /takvim'de `xl:pl-12` kalsın (rail için); diğer rotalarda topbar+alt tab eskisi gibi görünür.

```tsx
{!isTakvim && <Topbar />}
<Main isTakvim={isTakvim}>{children}</Main>
{!isTakvim && <AltTabBar />}
```

`Main`: /takvim için `h-svh overflow-hidden` (header yok, alt bar yok → tüm ekran takvimin).

### 2) `src/routes/takvim.tsx`
- Dış kapsayıcının yüksekliği: `h-[100dvh]` (artık 3rem topbar + 4rem alt bar düşülmesine gerek yok).
- Header'ı **tek satıra** sıkıştır (mobilde de): başlık küçük, sağda nav + view + Yeni; "Planlama" overline'ı kaldır → dikeyde ~24 px kazanım.
- Header `h-12 shrink-0`, grid `flex-1 min-h-0`.
- Mobil için sol-üstte küçük bir "geri" butonu (← Mizan'a) ekle ki kullanıcı global navigasyona dönebilsin (alt tab bar yok artık).

### 3) `src/components/mizan/takvim/hafta-gorunumu.tsx` & `gun-gorunumu.tsx`
- Saat satırı yüksekliğini viewport'a uyacak şekilde **dinamik** yap: `--saat-h: max(36px, calc((100% - 32px) / 14))` gibi — böylece 615 px ekranda 14 saat scrollsuz, 1080 px ekranda 24 saat scrollsuz görünür.
- Default scroll konumu: 08:00.

### 4) `src/components/mizan/takvim/gorev-paneli.tsx`
- `xl` (1280) yerine `lg` (1024) breakpoint'inde yan panel; altında **drawer** (Sheet) olarak aç. 724 px viewport'ta yatayda yer kaplamayacak.

## ASCII

```text
Önce (724×615):                Sonra:
┌─────────────────────────┐   ┌─────────────────────────┐
│ Topbar (48)             │   │ Takvim header (48)      │
├─────────────────────────┤   ├─────────────────────────┤
│ Takvim header (~64)     │   │                         │
├─────────────────────────┤   │   GRID (567 px)         │
│ Grid (~400, scroll)     │   │   tüm saatler          │
├─────────────────────────┤   │                         │
│ AltTabBar (64)          │   │                         │
└─────────────────────────┘   └─────────────────────────┘
```

## Etkilenen dosyalar
- `src/components/mizan/app-shell.tsx`
- `src/routes/takvim.tsx`
- `src/components/mizan/takvim/hafta-gorunumu.tsx`
- `src/components/mizan/takvim/gun-gorunumu.tsx`
- `src/components/mizan/takvim/gorev-paneli.tsx`

Onayla, uygulayayım.