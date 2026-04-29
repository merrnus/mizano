## Plan

### Sorun
Ana sayfadaki "Görev ekle" butonuyla eklediğin görev, "Bugünün programları"nın altında (zaman çizelgesi widget'ında) görünmüyor — ama `/takvim` sayfasında görünüyor.

### Kök neden
`GorevDialog` (ve aynı bug `EtkinlikDialog`'da) içindeki `useEffect`:

```ts
React.useEffect(() => {
  if (!acik) return;
  ...
  setVade(isoGun(varsayilanVade ?? new Date()));
  ...
}, [acik, duzenle, varsayilanVade]);  // ← varsayilanVade dependency
```

`index.tsx`'te `simdi` her dakika `setInterval` ile yeni `Date()` referansına dönüyor. `varsayilanVade={simdi}` prop'u her dakika yeni referans → dialog **açıkken** bu effect tetikleniyor → kullanıcının yazdığı tüm form alanları sıfırlanıyor (vade dahil). Eğer kullanıcı dakika değişimine denk geldiyse görev yanlış güne ya da boş başlıkla kaydolmuş olabilir.

Ayrıca `useGorevler` query'si tarih aralığı için Date prop'larından `isoGun` türetiyor — `simdi` her dakika değişince queryKey de değişiyor, ama içerik aynı tarih → gereksiz refetch ama bug değil.

Asıl olası senaryo: dialog açıldı → kullanıcı yazıyor → dakika döndü → form sıfırlandı → kullanıcı kaydetti → görev yarına ya da varsayılan değerlere düştü. Ya da kullanıcı boşken Tab ile vade'yi default ('') haliyle gönderdi → DB'de NULL olamıyor (NOT NULL kolon) → hata. Hata durumunda görev kaydolmuyor ama kullanıcı toast'u görmemiş olabilir.

### Çözüm

**1) Dialog form sıfırlama bug'ını düzelt**
- `gorev-dialog.tsx` ve `etkinlik-dialog.tsx` içindeki `useEffect` dependency'sini `[acik, duzenle?.id]` olarak değiştir. Varsayılan değerler sadece dialog **ilk açıldığında** uygulansın, sonradan prop değişiminde değil.
- Bu, dakika dönüşünde formun sıfırlanmasını engeller.

**2) `index.tsx`'teki `simdi` referansını dialog için stabilize et**
- `varsayilanVade` ve `varsayilanBaslangic` props'larına `simdi` yerine `useMemo` ile günlük bazda stabilize edilmiş bir Date referansı geç. Yani sadece gün değiştiğinde değişsin, dakika değişiminde değişmesin.

**3) `useGorevler` queryKey'i sadece tarih string'iyle bağlansın (Date değil)**
- `aralikBas`/`aralikBitis` tarih string'i alacak şekilde refactor edilebilir, ama minimum değişiklik için sadece `BugunZamanCizelgesi` ve `BugunCetelesi` içinde `gunBas`/`gunSon` Date'lerini `useMemo` ile günlük olarak hesapla — `simdi` her dakika yenilense bile aynı referans dönsün.

### Değiştirilecek dosyalar
- `src/components/mizan/takvim/gorev-dialog.tsx` — useEffect dependency düzeltmesi
- `src/components/mizan/takvim/etkinlik-dialog.tsx` — aynı düzeltme
- `src/components/mizan/dashboard/bugun-zaman-cizelgesi.tsx` — `gunBas`/`gunSon` `useMemo` ile gün bazlı stabilize
- `src/components/mizan/dashboard/bugun-cetelesi.tsx` — aynı stabilizasyon (haftaBas için)
- `src/routes/index.tsx` — dialog'lara stabilize edilmiş Date geç

### Bir önceki konu: çetele bağlam ekleme kısayolu
Bunu da dahil etmemi ister misin yoksa önce sadece görev bug'ını mı çözeyim? Cevabına göre planı küçültebilirim — ama varsayılan olarak ikisini birden uygulayacağım (önceki mesajda da planlamıştık):

- Yeni `baglam-ata-popover.tsx` → şablon satırının yanına "+ etiket" butonu
- `bugun-cetelesi.tsx` ve `mizan.mana.tsx` içindeki şablon listelerine bu popover entegre edilecek
