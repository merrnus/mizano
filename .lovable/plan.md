# Takvim düzeltme planı

`/takvim` ekranını üç ana problem etrafında toparlayacağım: görünür ve sabit menü, gerçekten çalışan haftalık görünüm, güvenilir sürükle-bırak.

## Yapılacaklar

1. **Takvim kabuğunu görünür ve sabit hale getireceğim**
   - Üst çubuğu her zaman görünür bırakacağım.
   - Sol menüyü masaüstünde sabit/sticky yapacağım.
   - Mobil ve orta genişlikte menü düğmesini her zaman erişilebilir tutacağım.
   - Alt mobil çubuğa **Hafta** sekmesini ekleyeceğim.

2. **Haftalık görünümü gerçekten geri getireceğim**
   - Mobilde haftayı zorla güne düşüren akışı kaldıracağım.
   - Gün/hafta görünüm ayrımını aynı bileşen içinde ama net davranışla yeniden kuracağım.
   - Küçük ekranlarda haftalık görünümü yatay kaydırmalı veya sıkıştırılmış ama kullanılabilir olacak şekilde düzenleyeceğim.

3. **Sürükle-bırakı yeniden kuracağım**
   - Mevcut native HTML5 drag mantığını gözden geçirip günler arası taşıma hatasını kaldıracağım.
   - Özellikle şu bug’ı düzelteceğim: bırakılan sütun sadece kendi günündeki olayları bildiği için başka güne taşınan etkinliği bulamıyor.
   - Fare + touch uyumlu pointer tabanlı taşıma davranışına geçeceğim ya da mevcut sistemi bu standarda yükselteceğim.
   - Uzun takvimde aşağı/yukarı taşırken otomatik scroll ekleyeceğim.

4. **Takvimin kırılmasına yol açan yan hataları temizleyeceğim**
   - Gerçek zamanlı kanal aboneliklerini güvenli hale getirip tekrar abonelik çakışmalarını engelleyeceğim.
   - Takvim ekranında blank/çöken durum oluşturan akış varsa bunu aynı çalışma içinde temizleyeceğim.

5. **Canlı doğrulama yapacağım**
   - Masaüstü ve mobil önizlemede menü açılıyor mu, hafta görünümü seçilebiliyor mu, etkinlik başka gün/saate taşınabiliyor mu diye kontrol edeceğim.
   - Özellikle kullanıcı senaryosu olarak: etkinliği aşağı-yukarı taşıma, başka güne bırakma, hafta görünümüne geçme ve menüye erişme akışlarını test edeceğim.

## Teknik notlar

- **Ana dosyalar:** `src/routes/takvim.tsx`, `src/lib/takvim/hooks.ts`
- **Tespit edilen somut sorunlar:**
  - Mobilde `hafta` görünümü kod içinde otomatik olarak `gün` görünümüne düşürülüyor.
  - Mobil alt navigasyonda `Hafta` seçeneği yok.
  - Drop işlemi hedef sütundaki filtrelenmiş olay listesinde kaynak olayı aradığı için günler arası taşıma kırılıyor.
  - Realtime abonelik tarafında kanal kullanımına bağlı runtime hata izi var.

## Beklenen sonuç

Bu iş sonunda `/takvim` sayfasında:
- menü görünür ve erişilebilir olacak,
- haftalık görünüm gerçekten mevcut olacak,
- sürükle-bırak hem saat içinde hem günler arasında çalışacak,
- uzun zaman çizelgesinde taşıma sırasında ekran kullanıcıyla birlikte akacak.