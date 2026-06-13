## Sorun

`/takvim` immersive modda: `AppShell` Topbar'ı, `AltTabBar` da alt sekme barını bu yolda gizliyor. Sonuç olarak takvim açıkken Bugün/İstikamet/Planlama/Rehberlik/Mutfak'a geçecek hiçbir görünür yol kalmıyor — kullanıcı sadece tarayıcı geri tuşuyla çıkabiliyor.

## Çözüm

Takvimin kendi header'ına (sol-üst) bir **modül seçici** ekle. Mevcut "Menu" ikonunu (şu an sadece mobilde yan paneli açıyor) tüm ekran boylarında göster ve davranışını ikiye böl:

- **xl ve üzeri (sidebar zaten kapalı):** ikonun yanına ayrı bir "modüller" Popover'ı; içinde 5 link (Bugün, İstikamet, Planlama=aktif, Rehberlik, Mutfak) + ayraç + sol panel içeriği (mevcut `yanIcerik`).
- **xl altı:** mevcut `Sheet` (yan panel) açılır; üstüne 5 modüllük yatay navigasyon şeridi eklenir, altında bugünkü `yanIcerik` (MiniTakvim + takvim listesi + yaklaşanlar) korunur.

Böylece `AltTabBar`'ı `/takvim`'de göstermeden (immersive mod bozulmadan), kullanıcı tek tıklamayla diğer modüllere geçebilir.

## Değişecek dosyalar

- `src/routes/takvim.tsx`
  - Sol-üst `Menu` butonunun `md:hidden`'ı kaldırılır, her boyutta görünür olur.
  - `yanIcerik` JSX'inin en üstüne bir `ModulNav` bileşeni eklenir: 5 satırlık `<Link>` listesi (ikon + etiket), aktif olan "Planlama" highlight'lı. Sheet kapanışı ile birlikte navigasyon çalışır.
  - Masaüstü (`md:flex`) sabit `aside` da `yanIcerik`'i render ettiği için aynı modül listesi orada da otomatik görünür — ekstra Popover gerekmez.

## Teknik detaylar

- Linkler `@tanstack/react-router`'dan `<Link to="..." />` ile; aktif state için `activeProps`/`activeOptions={{ exact: true }}` (özellikle `/` için).
- `AltTabBar` ve `AppShell` davranışı değişmez — `/takvim` immersive kalır.
- İkonlar `AltTabBar` ile birebir aynı: `LayoutDashboard, Scale, CalendarDays, Users, Briefcase`.
- Mobil `Sheet` zaten `setYanSheet(false)` ile kapanıyor; her link tıklamasında bu çağrılır.

## Kapsam dışı

- `AppShell`/`AltTabBar` değişmez.
- Takvim içi işlevsellik (etkinlik CRUD, görünüm değiştirici, ICS) dokunulmaz.
