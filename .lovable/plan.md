## Sorun

Akış modunda **"Atla" (ileri)** butonu var ama **geri dönme** imkânı yok. Kullanıcı yanlışlıkla bir kartı atlarsa veya az önce işaretlediği kartı tekrar görmek isterse, oturumu kapatmak zorunda kalıyor.

## Çözüm

`src/components/mizan/dashboard/akis-modu.tsx` içine hafif bir **"Geri"** kontrolü eklenecek. Mevcut tasarımı bozmadan:

### 1. Alt aksiyonlar satırına "Geri" butonu
Şu an alt satırda solda **Atla**, sağda **süre** var. Yapı şöyle olacak:

```
[← Geri]                [Atla →]   [süre]
```

- **Geri** butonu sadece `idx > 0` iken görünür/aktif olur (ilk kartta gizli ya da disabled).
- Tıklandığında `idx`'i 1 azaltır, `yeniMiktar` input'unu temizler, `flash` durumunu sıfırlar.
- Önemli: geri gidilen kartın `tamamlananIds` / `atlananIds` set'inden çıkarılmasına **gerek yok** — toplam canlı `kayitlar`'dan hesaplandığı için kart hâlâ doğru durumu (eklenmiş miktarı) gösterecek. Atlananlar için ise listeden çıkarmak doğru olur ki tekrar "atlandı" olarak işaretlenmesin → geri tuşu **atlanan kayıttan çıkarır**.

### 2. Klavye kısayolu
Mevcut `keydown` listener'ına ek:
- `ArrowLeft` → geri (idx > 0 ise)
- `ArrowRight` → atla (mevcut davranış için kısayol)

Bu, masaüstünde akışı çok daha hızlı hâle getirir. Mobilde mevcut buton yeterli.

### 3. İlerleme noktaları (progress dots) tıklanabilir mi?
**Hayır, bu turda eklemeyelim.** Şu an noktalar sadece görsel; tıklanabilir yapmak yeni etkileşim modeli demektir (geri/ileri atlama, durumların korunması vs.). Geri butonu + klavye kısayolu yeterli ve net.

## Değişecek dosya

- `src/components/mizan/dashboard/akis-modu.tsx` — tek dosya değişikliği.

## Değişmeyecek

- Veri akışı, hooks, mutation davranışı.
- Tasarım dili (renk, animasyon, layout).
- Diğer hiçbir bileşen.
