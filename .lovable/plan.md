## Amaç

Kişi detay sayfasında profil formunu sadeleştir. Tekrar eden ve gereksiz alanları kaldır.

## Tespit edilen tekrarlar

1. **Derin takip switch'i** (form altı) ile **"Derin takibi kapat" butonu** (üst header) — ikisi de aynı `kisi.derin_takip` alanını değiştiriyor. **Tam tekrar.**
2. **Kategoriler** — üst kartta badge olarak görünüyor (sadece okuma), formda düzenlenebiliyor. Bölünmüş ama tek edit yeri var.
3. **Notlar** — sadece formda var, tekrar değil ama "Kategoriler & Notlar" başlığı altında olması mantıksız.

## Yapılacak değişiklikler

**Dosya: `src/components/mizan/network/kardes-profil-form.tsx`**

- **Kaldır:** "Kategoriler & Notlar" bölümünün tamamı (`<Bolum ikon={Sparkles}>` bloğu, satır 224-265).
  - Kategoriler: zaten üst kartta görünüyor; düzenleme için ayrı bir UX gerekiyorsa o ayrı iş.
  - Notlar: kaldırılıyor.
  - Derin takip switch: zaten üst header'daki buton ile yapılıyor.
- **State temizliği:** `secKategoriler`, `derin`, `notlar`, `setSecKategoriler`, `setDerin`, `setNotlar`, `toggleKat` ve `useKisiKategoriAyarla` import + kullanımları kaldırılacak.
- **`kaydet` fonksiyonu:** `ayarla.mutateAsync` çağrısı kaldırılacak; `guncelle.mutateAsync` payload'ından `derin_takip` ve `notlar` çıkarılacak.
- **Props:** `kategoriler` artık kullanılmadığı için prop'tan kaldırılacak.

**Dosya: `src/routes/network.kisi.$id.tsx`**

- `<KardesProfilForm>` çağrısından `kategoriler` prop'u kaldırılacak.
- `useKategoriler()` hook çağrısı yine de gerekli (üst kart `kisiKategoriler` için kullanıyor) — dokunulmayacak.

## Kategoriler düzenleme — ayrı not

Kategoriler artık sadece üst kartta gösterim olacak. Düzenleme için ileride üst karta inline edit (badge'e tıkla → açılır) eklenebilir. Şimdilik kapsam dışı; istersen ayrı iş olarak ele alırız.

## Eksikler listesi (hatırlatma)

Önceki turda listelediğim, henüz yapılmamış potansiyel iyileştirmeler:

1. Takvim etkinliğinden kardeş profiline dönüş linki
2. Çakışma uyarısı (aynı saatte başka etkinlik)
3. Tekrarlayan faaliyet (haftalık/aylık rutin)
4. Faaliyet öncesi hatırlatıcı/bildirim
5. Belirli kardeşin faaliyetlerini takvimde filtreli görme
6. Saat aralığı validasyonu (bitiş < başlangıç engeli) — **bu bir bug, öncelikli**
7. UX cilaları (tooltip, silme onay mesajları)

Profil temizliği onaylanırsa devamında hangisini yapalım, sen seç.
