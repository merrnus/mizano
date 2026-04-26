# Sayfa analizi & temizlik — uygulandı

## Düzeltilen sorunlar

1. **Statik İlim/Amel yüzdeleri kaldırıldı.** Hem `/` (Bugün) hem de `/mizan`
   (İstikamet) sayfasında `ilimYuzde = 58`, `amelYuzde = 32` gibi sabit değerler
   yerine gerçek hesap kullanılıyor. Tek bir helper:
   `src/lib/istikamet-yuzde.ts` → `amelYuzdesi` (aktif kursların ortalama
   modül-ilerlemesi) ve `ilimYuzdesi` (notu girilmiş sınavlardan geçenlerin
   oranı; hiç notlu sınav yoksa "—" gösterilir).
2. **`IstikametKart` artık opsiyonel `metin` prop'u alıyor**: yüzde yerine
   "—" basabilmek için.
3. **Network "Rapor" tab'ı orphan değil.** Tab'ten çıkarıldı, üst sağa Buton
   olarak taşındı; `TabsContent` boş kalmıyor, `Tabs.value` her zaman
   `kisiler | istisareler | gundemler`.
4. **Topbar etiketleri tutarlı.** `/mizan/amel` → "Müfredat" (eski "Hedefler"
   yanlıştı). Ölü redirect rotalarının (`akademi`, `dunyevi`, `maneviyat`,
   `gundemler`) etiketleri haritadan silindi.
5. **`BugunCetelesi` sadece Mana gösteriyor.** İlim çetele şablonu kullanmıyor;
   listeden çıkarıldı.
6. **`BuHaftaWidget` faaliyet sütunu** yalnızca bugün ve sonrasını gösteriyor;
   programlar (istişare + sohbet) tüm hafta görünmeye devam ediyor.

## Henüz yapılmayan (kullanıcı kararı bekleniyor)

- Ölü redirect dosyaları (`mizan.akademi.tsx`, `mizan.dunyevi.tsx`,
  `mizan.maneviyat.tsx`, `gundemler.tsx`) — eski URL'leri geri uyumlu tutmak
  için bırakıldı. İstenirse silinebilir.

## Doğrulama

`bunx tsc --noEmit` temiz.
