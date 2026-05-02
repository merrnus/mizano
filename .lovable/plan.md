## Hedef
Takvimi mevcut dar, panel-sıkışık ve kısmi yapıdan çıkarıp; tam ekran hissi veren, merkezi state kullanan, Google Calendar benzeri tam özellikli bir planlama modülüne dönüştürmek.

## Ne değişecek

### 1. Takvim kabuğunu yeniden kuracağım
- `/takvim` ekranını mevcut sıkışık layout mantığından çıkaracağım.
- Takvim alanı masaüstünde gerçek anlamda ana yüzey olacak; yan panel ikincil hale gelecek.
- İç scroll sadece gerekli bölgelerde olacak; ilk açılışta kullanıcı gün/hafta görünümünde ana içeriği daha fazla görecek.
- Mobil ve masaüstü için ayrı yerleşim davranışı tanımlayacağım.

### 2. Merkezi takvim state’i kuracağım
- `currentDate`, `view`, seçili etkinlik, drag durumu, filtreler, arama, görünür takvimler ve mini takvim seçimi tek merkezde tutulacak.
- Bu yapı takvimin her görünümde aynı referans tarihi kullanmasını sağlayacak.
- State yerel kalıcı saklamaya bağlanacak; görünüm ve kullanıcı takvim tercihleri kaybolmayacak.

### 3. Görünümleri tam özellikli hale getireceğim
- Ay görünümü: etkinlikleri daha doğru gösteren, çok günlük olayları destekleyen yeni grid.
- Hafta görünümü: 00:00–23:00 tam eksen, all-day alanı, çalışma saatleri vurgusu, bugünkü kırmızı çizgi, çakışan etkinlik yerleşimi.
- Gün görünümü: hafta görünümünün tek güne odaklı ayrıntılı sürümü.
- Yıl görünümü: 12 aylık grid, hızlı gezinme ve tarih seçimi.
- Görünümler arası geçişler daha akıcı olacak.

### 4. Sürükle-bırak ve yeniden boyutlandırmayı baştan ele alacağım
- Drag işlemi sırasında etkinlik gerçekten imleci takip edecek.
- Ghost preview hedef sütun ve saate canlı taşınacak.
- Sayfanın kendiliğinden zıplaması yerine yalnızca takvim grid’i kontrollü davranacak.
- Etkinlik taşıma sonrası yanlışlıkla detay paneli açılmayacak.
- Gün/hafta görünümünde resize davranışı Google Calendar mantığına yaklaştırılacak.
- Boş zaman aralığını sürükleyerek yeni etkinlik oluşturma eklenecek.

### 5. Kenar çubuğunu Google Calendar mantığına yaklaştıracağım
- Mini takvim date picker eklenecek.
- Takvim listesi ve görünürlük checkbox’ları eklenecek.
- “Yeni takvim oluştur” akışı eklenecek.
- Yaklaşan etkinlikler listesi eklenecek.
- Arama alanı ve hızlı sonuç listesi eklenecek.

### 6. Etkinlik modelini genişleteceğim
- Başlık, açıklama, başlangıç, bitiş, tüm gün, konum, renk etiketi, hatırlatıcı, tekrar, takvim ilişkisi desteklenecek.
- Tekrar seçenekleri: yok, günlük, haftalık, iki haftada bir, aylık, yıllık, özel.
- Çoğaltma, silme onayı ve sağ tık menüsü eklenecek.
- Renk sistemi 8 sabit takvim/etiket rengiyle netleştirilecek.

### 7. Veri katmanını promptuna uyacak şekilde düzenleyeceğim
- Takvimin kullanıcı etkinlikleri ve takvimleri merkezi client store + localStorage ile kalıcı hale getirilecek.
- Auto-save her değişiklikte çalışacak.
- `.ics` import/export desteği eklenecek.
- Mevcut uygulamadan gelen bağlı olaylar varsa bunları ayrı overlay takvim mantığıyla uyumlu hale getireceğim; kullanıcı takvimiyle karışmaları engellenecek.

### 8. Erişilebilirlik ve kullanım detayları eklenecek
- Klavye kısayolları: T, M, W, D, ok tuşları.
- Aria label’lar ve klavye gezinmesi iyileştirilecek.
- Hover tooltip, loading/empty state ve hatalı durum ekranları eklenecek.
- Mobilde swipe navigasyon ve alt gezinme ile uyum korunacak.

## Uygulama adımları

### Aşama 1 — Temel mimari ve tam ekran yerleşim
- `src/routes/takvim.tsx` sadeleştirilecek ve yeni takvim shell’ine dönüştürülecek.
- Daraltan sabit yükseklik/genişlik kararları kaldırılacak.
- Takvim yüzeyi + sidebar + header görevleri ayrıştırılacak.

### Aşama 2 — Merkezi store ve veri modeli
- Yeni takvim store’u oluşturulacak.
- Mevcut görünüm tarih mantığı bu store’a taşınacak.
- Genişletilmiş event/calendar tipleri tanımlanacak.
- localStorage persist ve hydrasyon eklenecek.

### Aşama 3 — Görünümler
- Ay, hafta, gün görünümü yeniden yapılandırılacak.
- Yeni yıl görünümü eklenecek.
- Çakışma yerleşimi ve çok günlük olay mantığı iyileştirilecek.

### Aşama 4 — Etkileşimler
- Drag/drop ve resize motoru yeniden düzenlenecek.
- Slot seçerek etkinlik ekleme ve canlı preview eklenecek.
- Tıklama/sürükleme ayrımı kesinleştirilecek.

### Aşama 5 — Sidebar ve arama
- Mini takvim, takvim listesi, yaklaşan etkinlikler, arama sonuçları eklenecek.
- Bugün butonu, prev/next, görünüm geçişleri ve başlık senkronize edilecek.

### Aşama 6 — Dialoglar, hatırlatıcı, import/export
- Etkinlik dialog’u prompttaki alanlara genişletilecek.
- Hatırlatıcı ayarları ve tarayıcı bildirim akışı eklenecek.
- `.ics` import/export tamamlanacak.

### Aşama 7 — Son uyum ve kalite
- Mobil ekranlarda layout taşmaları giderilecek.
- Klavye kısayolları ve erişilebilirlik tamamlanacak.
- Görünüm geçiş animasyonları, tooltip ve boş durumlar polish edilecek.

## Etkilenecek ana dosyalar
- `src/routes/takvim.tsx`
- `src/components/mizan/takvim/hafta-gorunumu.tsx`
- `src/components/mizan/takvim/gun-gorunumu.tsx`
- `src/components/mizan/takvim/ay-gorunumu.tsx`
- `src/components/mizan/takvim/etkinlik-dialog.tsx`
- `src/components/mizan/takvim/gorev-paneli.tsx` veya bunun yerine yeni sidebar bileşenleri
- `src/lib/takvim-surukle.ts`
- `src/lib/takvim-hooks.ts`
- `src/lib/takvim-tipleri.ts`
- Yeni store / yardımcı dosyalar

## Teknik notlar
- Mevcut sorun yalnızca birkaç CSS düzeltmesiyle çözülecek seviyede değil; takvimin layout ve state mimarisinin yeniden kurgulanması gerekiyor.
- Şu anki yapı yalnızca ay/hafta/gün ve kısmi CRUD sağlıyor; senin gönderdiğin prompt ise tam ürün seviyesi bir calendar modülü istiyor.
- Bu yüzden küçük yama yerine modüler ama kapsamlı bir yeniden inşa yapacağım.
- Uygulama mevcut tasarım dilini koruyacak ama davranış olarak Google Calendar’a çok daha yakın olacak.

Onay verirsen bunu parça parça yamalamadan, doğrudan promptundaki hedefe göre takvimi yeniden kuracağım.