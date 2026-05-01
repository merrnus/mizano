## Plan

Takvimdeki 3 problemi birlikte ele alacağım:
1. Akşam saatlerinin görünmemesi
2. Alt saatlerde sürüklerken sayfanın kendi kendine yukarı kayması
3. Etkinliğin bırakmadan önce hedef sütun/zamanda canlı görünmemesi

## Yapılacaklar

### 1) Takvim yüksekliğini düzeltip geç saatleri erişilebilir hale getireceğim
- `/takvim` sayfasındaki yerleşimi, takvimin ekranda kalan alanı gerçekten kullanacağı şekilde düzenleyeceğim.
- Gün/hafta görünümündeki `max-h-[78vh]` yaklaşımını gözden geçirip, sabit oran yerine daha güvenilir bir `flex + min-h-0` düzenine çevireceğim.
- Böylece takvim kendi içinde düzgün scroll alacak ve 21:00–24:00 aralığı her zaman erişilebilir olacak.
- Görev panelinin ve alt mobil barın takvim alanını istemeden daraltmasını da engelleyeceğim.

### 2) Sürükleme sırasında dış sayfa scroll’unu durduracağım
- Mevcut sürükleme mantığında scroll hesabını daha sağlam hale getireceğim.
- Sürükleme aktifken hareket/bitiş olaylarını sadece kartın üstüne bırakmak yerine daha güvenilir bir global dinleme modeliyle yöneteceğim.
- Auto-scroll sadece takvim ızgarasının üst/alt kenarına yaklaşınca çalışacak; outer page scroll devreye girmeyecek.
- Sürükleme boyunca scroll referansını sabitleyip, container scroll değişse bile kartın pointer altında “kaçmadan” kalmasını sağlayacağım.
- Böylece alt saatlerdeki etkinliği yukarı/aşağı taşırken eski “sayfa kendiliğinden yukarı gidiyor” hissi kaybolacak.

### 3) Google Calendar benzeri canlı sürükleme önizlemesi ekleyeceğim
- Şu an etkinlik kendi orijinal sütununda kalıyor ve ancak bırakınca yeni yere gidiyor. Bunu değiştireceğim.
- Sürükleme başladığında:
  - kaynak kart yarı saydam kalacak,
  - ayrı bir “drag preview” kartı oluşacak,
  - bu preview, pointer nereye gidiyorsa o saat ve o sütunda canlı olarak görünecek.
- Hafta görünümünde sütun değişimi anlık yansıyacak.
- Gün görünümünde de aynı mantıkla saat pozisyonu canlı taşınacak.
- Boyutlandırma (resize) davranışını da aynı sistemle uyumlu tutacağım.

### 4) Tıklama ve sürükleme ayrımını daha da sertleştireceğim
- Drag bittikten sonra detay panelinin yanlışlıkla açılmaması için mevcut click suppression mantığını güçlendireceğim.
- Gerçek drag oturumu oluştuysa bırakma sonrası click tamamen yutulacak.

### 5) Son kontrol
- Gün ve hafta görünümünde ayrı ayrı test edeceğim.
- Özellikle şunları doğrulayacağım:
  - 21:00, 22:00, 23:00 görünür mü?
  - Alt saatlerden sürüklerken sayfa zıplıyor mu?
  - Etkinlik başka sütuna götürülürken havada hedef yerde görünüyor mu?
  - Bırakınca detay paneli açılıyor mu?

## Teknik detaylar
- İncelenen ana dosyalar:
  - `src/components/mizan/takvim/gun-gorunumu.tsx`
  - `src/components/mizan/takvim/hafta-gorunumu.tsx`
  - `src/lib/takvim-surukle.ts`
  - `src/routes/takvim.tsx`
- Muhtemel kod değişiklikleri:
  - Takvim kapsayıcı yüksekliğinin yeniden düzenlenmesi
  - Sürükleme hook’unun pointer + scroll senkronizasyonunun yeniden yazılması
  - Hafta görünümünde canlı overlay/preview kartı eklenmesi
  - Gün görünümünde aynı preview mantığının sade versiyonu

Onaydan sonra bunu doğrudan uygulayacağım.