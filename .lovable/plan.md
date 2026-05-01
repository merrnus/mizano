# Plan: Takvim sürükle-bırak deneyimini düzeltme ve Google Calendar seviyesine yaklaştırma

Senin şikayetlerin haklı; mevcut sürükle-bırak akışı hâlâ “ham” çalışıyor. İncelemede iki ana sorun net çıktı:

1. **Sürüklerken scroll alanı hareket ediyor ve kart sabit hissi vermiyor**
   - Şu an sürükleme olayları doğrudan scroll eden grid üzerinde çalışıyor.
   - Kart kendi doğal akışında kalırken konteyner `scrollTop` ile kaydırılıyor, bu yüzden nesne “elin altında sabit” kalmıyor.

2. **Sürükleme bitince detay paneli açılıyor**
   - Event kartı bir `button` ve drag sonrası `click` olayı bastırılmıyor.
   - Yani sistem bunu hem “drag” hem de “click” gibi yorumlayabiliyor.

Ayrıca ekran yoğunluğu tarafında da fark var:
- Gün görünümünde saat başına **56 px**, hafta görünümünde **40 px** kullanılıyor.
- Bu yüzden senin istediğin gibi tek bakışta daha fazla saat görünmüyor.
- Google Calendar hissi için görünür saat yoğunluğu daha sıkı ve daha kontrollü olmalı.

## Yapılacaklar

### 1) Sürükleme motorunu stabilize et
**Hedef:** kart sürüklenirken sayfa/konteyner oynasa bile sürüklenen öğe görsel olarak sabit ve kontrollü hissettirsin.

Bunun için:
- `src/lib/takvim-surukle.ts` içinde sürükleme durumuna **başlangıç pointer konumu**, **drag başladı mı**, **drag mesafesi eşiği**, **son pointer koordinatı**, **scroll başlangıç snapshot’ı** gibi alanlar eklenecek.
- `pointermove` / `pointerup` takibi yalnızca scroll konteynerine değil, gerekirse **window/document seviyesinde** güvenceye alınacak.
- Görsel taşıma mantığı, kartı doğrudan scroll içeriğinde “zıplatmak” yerine **ghost/overlay preview** ile çalışacak.
- Otomatik scroll daha yumuşak hale getirilecek; pointer kenara yaklaşınca scroll olacak ama kartın preview’su pointer’a bağlı kalacak.

**Beklenen sonuç:** yukarı/aşağı taşırken “scroll kayıyor, kart elimden kaçıyor” hissi kaybolacak.

### 2) Drag ile click’i kesin olarak ayır
**Hedef:** sürükledikten sonra detay paneli asla açılmasın.

Bunun için:
- `gun-gorunumu.tsx` ve `hafta-gorunumu.tsx` içinde kart tıklama mantığı değiştirilecek.
- Sadece gerçekten tıklama yapıldıysa `onOlayClick` çalışacak.
- Drag mesafesi belli bir eşiği geçtiyse:
  - o etkileşim “click” sayılmayacak,
  - `pointerup` sonrası kısa süreli **click suppression** uygulanacak,
  - resize işlemi sonrası da panel açılmayacak.

**Beklenen sonuç:** taşıma/resize sonrası yanlışlıkla dialog açılmayacak.

### 3) Saat yoğunluğunu Google Calendar’a yaklaştır
**Hedef:** ekranda yaklaşık 12 saatlik blok daha rahat görülsün.

Bunun için:
- `SAAT_PX` değerleri yeniden ayarlanacak.
- Özellikle hafta görünümünde daha kompakt bir yükseklik kullanılacak.
- Gün görünümünde masaüstü ve dar ekran için farklı yoğunluk değerlendirilecek.
- Gerekirse üst başlık ve hücre içi padding’ler de azaltılacak.

**Beklenen sonuç:** tek ekranda daha fazla saat görünür olacak; görünüm daha profesyonel ve “takvim gibi” hissedecek.

### 4) Görsel sürükleme geri bildirimi ekle
**Hedef:** kullanıcı sürüklerken nereye taşıdığını çok net görsün.

Bunun için:
- Orijinal kart hafif soluk kalacak.
- Taşınan kart için daha belirgin bir preview/ghost gösterilecek.
- Hedef sütun ve hedef zaman aralığı daha net vurgulanacak.
- Resize sırasında yeni bitiş süresi daha anlaşılır hale getirilecek.

**Beklenen sonuç:** sürükleme “teknik olarak çalışıyor” seviyesinden çıkıp gerçekten güven veren bir UX’e dönüşecek.

### 5) Hafta ve gün görünümünü aynı etkileşim kurallarıyla hizala
**Hedef:** iki görünümün davranışı birbirinden farklı hissettirmesin.

Bunun için:
- `src/components/mizan/takvim/gun-gorunumu.tsx`
- `src/components/mizan/takvim/hafta-gorunumu.tsx`
- `src/lib/takvim-surukle.ts`

bu üç yerde ortak kurallar uygulanacak:
- aynı drag eşiği,
- aynı click suppression,
- aynı auto-scroll mantığı,
- aynı drag preview davranışı.

### 6) Son rötuş: görev paneli ve sonraki adımlar
İlk turda ana odak etkinlik drag/resize olacak. Ardından ikinci kalite turunda şunları netleştireceğim:
- görevleri sağ panelden takvime sürükleme,
- all-day satırı,
- daha gelişmiş recurring event davranışı (tek örnek mi, tüm seri mi?),
- mobil/touch davranışı.

Bunlar ilk düzeltme paketine mecburi değil ama Google Calendar benzerliğini tamamlayan eksikler.

## Teknik detaylar

**Değişecek dosyalar**
- `src/lib/takvim-surukle.ts`
- `src/components/mizan/takvim/gun-gorunumu.tsx`
- `src/components/mizan/takvim/hafta-gorunumu.tsx`
- Gerekirse küçük koordinasyon için `src/routes/takvim.tsx`

**Uygulama yaklaşımı**
- native/yarım drag mantığını tamamen bırakmadan, mevcut pointer tabanlı yapıyı daha sağlam bir state machine’e çevireceğim
- “tık mıydı, drag miydi?” ayrımı state seviyesinde yapılacak
- scroll hareketi ile kart preview’su birbirinden ayrılacak
- yoğunluk/pixel ayarları yeniden dengelenecek

## Google Calendar ile karşılaştırınca şu an eksik olanlar
Bu düzeltmeden sonra bile ileri seviye farklar şunlar kalabilir:
- all-day lane
- görevleri doğrudan grid’e bırakma
- sürüklerken zaman etiketi balonu
- seri etkinlikte “bu etkinlik / tüm seri” seçimi
- sticky saat kolonu ve daha rafine responsive davranış

Ama önce senin şu an en çok canını sıkan **3 temel problemi** çözeceğim:
1. drag sabitsizliği
2. drag sonrası yanlış click
3. ekranda az saat görünmesi

Onay verirsen bunu uygulamaya geçeyim.