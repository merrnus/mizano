## Bitirilecek işler

Program görünümü çalışıyor; kalan cilalar:

### 1) Saatsiz görev için hızlı ekle
`SaatDisi` başlığının yanına küçük "+ görev" satırı. Enter ile `useGunlukGorevEkle` çağırır (saat=null, tarih=bugün).

### 2) Sürükle-bırak ile saat değiştirme
`saatliOlaylar` bloklarına `draggable`. Slot alanına `onDragOver`/`onDrop`: drop Y → dakika (15dk snap). `updateEtkinlik` ile `baslangic`/`bitis` güncelle (süre korunur). Tekrarlı olayda sadece o gün / tüm seri sorusu için basit onay (`confirm`) — ilk sürümde "sadece bu olay değil, ana kayıt" güncellenir; tekrarlı ise uyarı toast ile geri al.

### 3) Çakışma yönetimi (yan yana)
Aynı zaman aralığında birden çok blok varsa iki/üç sütuna böl. Basit greedy: olayları başlangıç saatine göre sırala, çakışan grupları bul, her gruptaki bloğa `left: (i/n)*100%`, `width: (1/n)*100% - gap` ver.

### 4) Küçük UX
- Boş slot hover'ında hafif "+" ikonu.
- "Şimdi" butonu: header'a bir buton, tıklayınca now satırına scroll.
- Klavye: `T` bugüne dön (zaten bugün ama scroll now).

### Dosyalar
- düzenle: `src/components/mizan/dashboard/bugun-program.tsx`
- gerekirse yardımcı: `src/lib/takvim/hooks.ts` içindeki `useEtkinlikGuncelle` (varsa) kullanılacak; yoksa mevcut update fonksiyonuna bakılıp aynı desen izlenecek.

### Kapsam dışı
- Rezervasyon/uyarı bildirimleri
- Çoklu takvim renk filtresi (takvim sayfasında zaten var)

Onaylarsan sırayla uygularım.
