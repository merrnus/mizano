# Mobil/Tablet Rahatlığı — Alt Tab Bar + Akıcı Topbar

Şu anki uygulama mobilde "yönetim paneli" hissi veriyor: sol şerit + dolu topbar + dar içerik = küçültülmüş masaüstü. Bunu **Instagram/Facebook tarzı app hissi**ne çeviriyoruz — sadece `<1280px` için. Masaüstü aynen kalır.

## Hedeflenen his

```text
MOBİL — ŞU AN                MOBİL — YENİ
┌──┬──────────────┐          ┌─────────────────┐
│☰ │ [Ara…]   + ☀ │  topbar  │ Bugün       👤  │  ← scroll'da gizlenir
├──┼──────────────┤          ├─────────────────┤
│⌂ │              │          │                 │
│⚖ │   içerik     │          │    içerik       │  ← daha geniş
│📅│              │          │                 │
│👥│              │          │                 │
│💼│              │          ├─────────────────┤
└──┴──────────────┘          │ ⌂  ⚖  📅  👥  💼 │  ← sticky alt tab
                             └─────────────────┘
```

## 1. Alt tab bar — yeni bileşen

**Yeni dosya:** `src/components/mizan/alt-tab-bar.tsx`

- 5 ikon: Bugün · İstikamet · Planlama · Rehberlik · Mutfak (mevcut sidebar item'larıyla aynı)
- `fixed bottom-0`, `z-40`, tam genişlik, `h-14`
- Aktif olan **renkli + ikon üstünde küçük nokta**, diğerleri muted
- `safe-area-inset-bottom` desteği (iOS notch)
- Sadece `<1280px`'de görünür (`xl:hidden`)
- `bg-background/95 backdrop-blur` + üst border

## 2. IconRail — mobil/tablette gizle

**Düzenlenecek:** `src/components/mizan/icon-rail.tsx`
- `<aside>` className'ine `hidden xl:flex` ekle (şu an her zaman görünüyor)

**Düzenlenecek:** `src/components/mizan/app-shell.tsx`
- `SidebarInset`'in `pl-12` sınıfını `xl:pl-12` yap (mobilde sol padding sıfırlanır, içerik tam genişlik)
- `<main>` altına `pb-16 xl:pb-0` ekle (alt tab bar için yer aç)
- `<AltTabBar />` bileşenini `SidebarInset` içinde en alta ekle

## 3. Topbar — mobilde sadeleştir + scroll'da gizle

**Düzenlenecek:** `src/components/mizan/topbar.tsx`

Mobilde (`<xl`) görünüm:
- Sol: **sayfa başlığı** (route'a göre dinamik: "Bugün", "İstikamet" vb.) + küçük Mizan logosu
- Sağ: tek buton — **profil/menü** (avatar circle), tıklanınca dropdown açar (Tema değiştir, Çıkış)
- Arama kutusu ve `+` butonu mobilde gizli (zaten gizliydi `+` hariç)

Masaüstünde: mevcut görünüm korunur.

**Scroll davranışı (yeni hook):**
- Yeni dosya: `src/hooks/use-scroll-direction.ts` — son scroll yönünü döndürür
- Topbar'a `transition-transform` + `-translate-y-full` (aşağı scroll) / `translate-y-0` (yukarı scroll)
- Sayfa üstünde (scrollY < 64) her zaman görünür
- Sadece mobilde aktif; masaüstünde topbar her zaman sabit

## 4. İçerik nefesi — mobilde küçük ayarlar

Tüm sayfalardaki `mx-auto w-full max-w-6xl px-4 py-6 sm:px-6` desenini bırakıyoruz, **sadece** ana sayfada (`src/routes/index.tsx`) kart yoğunluğu fazla. Plan dışı bırakıyorum çünkü bu cila iş — ana yapıyı çözdükten sonra tek tek bakarız.

## 5. Etkilenecek/yeni dosyalar

| Dosya | Değişiklik |
|---|---|
| `src/components/mizan/alt-tab-bar.tsx` | YENİ — sticky alt nav, 5 ikon, aktif state |
| `src/hooks/use-scroll-direction.ts` | YENİ — yön + pozisyon döndürür |
| `src/components/mizan/icon-rail.tsx` | `hidden xl:flex` ekle |
| `src/components/mizan/app-shell.tsx` | Mobilde `pl-12` kaldır, alt padding ekle, AltTabBar render |
| `src/components/mizan/topbar.tsx` | Mobil görünüm sadeleşir, scroll-hide davranışı, profil dropdown |

## 6. Sıralama

1. `useScrollDirection` hook
2. `AltTabBar` bileşeni
3. `IconRail` mobilde gizle + `AppShell` güncelle (alt padding + AltTabBar render)
4. `Topbar` mobil sadeleşme + profil dropdown + scroll-hide

## Notlar

- **Breakpoint** `xl` (1280px) — `useIsMobile` hook'undaki mevcut eşikle uyumlu
- **Sidebar (`SolSidebar`) hâlâ duruyor** — masaüstünde `IconRail` üstünden açılıyor; mobilde alt tab bar yeterli, sidebar'ı mobilde açma ihtiyacı kalkıyor
- **Tema toggle ve çıkış** mobilde profil dropdown'una taşınır, kaybolmaz
- **Üst başlık dinamik** — pathname → etiket eşlemesi `Topbar` içinde küçük bir map; alt-rotalarda da çalışır (örn. `/mizan/mana` → "Mana")
- Bu değişiklik sadece **shell** seviyesinde; sayfa içerikleri dokunulmaz
- İlerideki ihtiyaç: alt tab'da "+" merkezi (Instagram'daki gibi vurgulu orta buton) eklenebilir — şimdi dahil değil
