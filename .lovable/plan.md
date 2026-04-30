## Planlama sayfası iyileştirmeleri

Üç değişiklik:

### 1) Saat ızgarası 00:00'dan başlasın (24 saat)
- `hafta-gorunumu.tsx` ve `gun-gorunumu.tsx` içindeki `SAATLER` dizisi `[6..23]` yerine `[0..23]` olacak (24 satır).
- Hafta görünümünde `SAAT_PX = 48` yüksek olduğundan ızgara çok uzar; hafta için `SAAT_PX = 40`'a düşürülecek (24×40 = 960px). Gün görünümü 64 → 56'ya düşecek (daha kompakt). Etkinlik konumlandırma `top` formülü zaten `SAATLER[0]*60` kullandığı için 0'dan başlayınca doğal olarak doğru çalışır.
- İlk açılışta ızgara otomatik olarak günün saatine kaydırılacak (ör. sabah 8 yerine boş gece saatleri görünmesin): kapsayıcıya bir `ref` eklenip `useEffect` ile `scrollTop = (mevcutSaat - 1) * SAAT_PX` uygulanır. Sayfa açıkken yapılan tıklamalarda kaydırma sıfırlanmaz.

### 2) "Şu an" kırmızı çizgisi
- Hafta ve gün görünümlerinde, eğer görünen aralık bugünü içeriyorsa, mevcut zamanı gösteren ince kırmızı yatay çizgi.
- `useEffect` ile her dakika güncellenen bir `simdi` state'i (component-local; dialog reset bug'ıyla alakası yok). 
- Hafta görünümü: çizgi sadece bugünün sütununda; sol kenarda küçük yuvarlak nokta.
- Gün görünümü: ankara bugünse tam genişlik kırmızı çizgi.
- Renk: `border-destructive` / `bg-destructive` token'ları (tema ile uyumlu).

### 3) Etkinlik sürükle-bırak (yeniden zamanlama)
- Yalnızca kullanıcı tarafından eklenen `takvim_etkinlik` kayıtları taşınabilir; ders/sınav/proje/amel olayları (id'si `ilim:` veya `amel:` ile başlayanlar) sürüklenmez (zaten kendi sayfalarında düzenleniyor).
- Native HTML5 drag&drop (kütüphane eklemeden):
  - Etkinlik bloğu `draggable`; `onDragStart`'ta `id`, kaynak başlangıç dakikası ve süre `dataTransfer`'a yazılır.
  - Saat slot butonları `onDragOver` (preventDefault) ve `onDrop` ile yeni başlangıç saatini hesaplar; aynı süreyi koruyarak yeni `baslangic`/`bitis` üretilir.
  - Hafta görünümünde başka güne; gün görünümünde aynı güne taşıma desteklenir.
  - 15 dakikalık snap (drop konumu saate yuvarlanır; basitlik için saat başına snap, ileride 15 dk eklenebilir).
- Mutasyon: mevcut `useEtkinlikGuncelle()` çağrılır (`{ baslangic, bitis }`). TanStack Query refetch ile UI güncellenir.
- Tekrar eden etkinlikler: tekrar tanımlı (`tekrar !== 'yok'`) olanlar için sürükle-bırak devre dışı (drag handle gizlenir / `draggable=false`) — tek seferlik bir tarih taşımak tekrar serisini bozar; bunu detay diyaloğundan yapmak daha güvenli. Tooltip ile "tekrar eden etkinlik — düzenlemek için tıklayın" gösterilir.
- Görsel feedback: sürüklenirken blok yarı saydam; geçerli drop hedefi olan slot `bg-primary/10` ile vurgulanır.

### Değişecek dosyalar
- `src/components/mizan/takvim/hafta-gorunumu.tsx` — SAATLER, SAAT_PX, scroll-to-now, şu-an çizgisi, drag&drop slot/blok.
- `src/components/mizan/takvim/gun-gorunumu.tsx` — aynı üç değişiklik.
- `src/routes/takvim.tsx` — `HaftaGorunumu` ve `GunGorunumu`'na `onOlayTasi: (id, yeniBaslangic) => void` callback'i ve `useEtkinlikGuncelle` bağlantısı.

### Kapsam dışı
- Aylık görünüm (zaten saatsiz, sürüklemeye uygun değil).
- Görev (saatsiz to-do) sürüklemesi — şimdilik yalnızca etkinlikler.
- Etkinlik süresini değiştirmek için kenar tutamağı (resize) — ayrı bir iş.
