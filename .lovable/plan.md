## Gündem detay sheet sadeleştirme

`src/components/mizan/network/gundem-detay-sheet.tsx` içinde tekrar eden ve gereksiz alanları kaldır.

### Kaldırılacaklar

1. **SheetDescription** (başlığın altındaki içerik özeti) — aşağıdaki "İçerik" alanı ile birebir aynı, çift gösterim.
2. **Öncelik** select (Ana/Yan gündem) — gereksiz.
3. **Sorumlular** bölümü (chip listesi + SorumluSecici) — gereksiz.
4. **Etiketler** bölümü (badge listesi + input) — gereksiz.

### Kalacaklar

- Başlık: "Gündem"
- Tabs: Detay / İlerleme
- Detay sekmesinde: İçerik, Karar, Sonuç, Deadline, Durum, Eklendi tarihi, Sil/İptal/Kaydet butonları.

### Temizlik

- `kaydet()` fonksiyonundan `sorumluAyarla.mutateAsync` çağrısı ve `etiketler` parametresi çıkarılacak.
- Kullanılmayan state'ler (`etiketGiris`, `etiketler`, `sorumlu_ids`) ve hook'lar (`useGundemSorumluAyarla`, `useKisiler`, `SorumluSecici`) ile import'lar (`Badge`, `Avatar`, `AvatarFallback`, `X`) temizlenecek.

Sadece bu tek dosya değişecek; veri modeli/DB dokunulmayacak (alanlar şemada kalmaya devam eder, başka yerlerde kullanılıyor olabilir).
