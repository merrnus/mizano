## Sorun
`GunlukChecklist`'te etiketler yanlış eşlenmiş:
- Üstteki "İlim" bölümü aslında **Amel** olmalı (amel_kurs modülleri — Git/Linux pratik müfredat).
- Alttaki "Amel" bölümü aslında **Mana** olmalı (cetele_sablon `alan='mana'` — Evvâbîn/Teheccüd evrâdı).
- İlim'in kendi tabloları var (`ders`, `ders_sinav`) ve kendi sayfası mevcut — dashboard checklist'inde İlim bölümü olmayacak.

Ek olarak Odak kartında ufak bir tekrar var ve checklist'in birkaç pürüzü var.

## Yapılacaklar

### 1) `src/components/mizan/dashboard/gunluk-checklist.tsx`
- Üst bölümün adı **Amel** olsun, renk `var(--amel)`, emoji 🛠️ veya 📚 yerine alana uygun bir şey (örn. ✅ / 📚 koruyabilirim — kullanıcı tercihini sorabilirim ama varsayılan: alan rengi yeterli, mevcut emoji'leri sade tutalım).
  - Bileşeni `AmelBolumu` olarak yeniden adlandır.
  - "Tümü" linki `/mizan/amel`'e gidiyor — doğru, kalır.
- Alt bölümün adı **Mana** olsun, renk `var(--mana)`.
  - Bileşeni `ManaBolumu` olarak yeniden adlandır.
  - "Tümü" linki `/mizan/mana` — doğru, kalır.
- `void simdi;` satırını kaldır, `simdi` prop'unu Mana bölümüne hiç geçirme.
- Her iki bölüm de boşsa kart hiç render olmasın değil de, en azından bir kez "Bugün için aktif bir şablon yok — Mana sayfasına git" minik boş durumu ekle (opsiyonel — istersen atlarım, sor).

### 2) `src/components/mizan/dashboard/odak-karti.tsx`
- `BosIcerik` içindeki "Etkinlik ekle" butonunu kaldır. FAB zaten aynı şeyi yapıyor (kullanıcı önceki turda "iki aynı şey lazım değil" dedi).
- Sadece "Takvime git" link butonu kalsın.
- Bunun sonucunda `onYeniEtkinlik` prop'u kullanılmaz olur → `OdakKarti`'dan `onYeniEtkinlik` prop'unu kaldır.
- `src/routes/index.tsx`'te `<OdakKarti>` çağrısından `onYeniEtkinlik` prop'unu çıkar.

### 3) Amel satırı "tek tık tüm hedefi tamamlar" davranışı
Şu an `AmelBolumu`/Mana bölümünde tek tık checkbox hedefi tek seferde dolduruyor; bu cetele kavramıyla çelişiyor (artımlı sayım kaybolmuş). İki seçenek:
- **(a)** Mevcut davranışı koru ama UI'da daha net belli et: checkbox yerine sağda `30/100` etiketi tıklanabilir olsun (+1 ekler), checkbox sadece "hepsini tamamla" işlevi.
- **(b)** Şimdilik dokunma, davranışı planda not olarak bırak, kullanıcı isterse sonraki turda çöz.

Bu plan **(b)**'yi varsayıyor — sade kalsın, davranış değişmesin. Etkili olduğunu görürsen sonra (a)'yı yaparız.

### 4) Header alt başlık
`GunlukChecklist` header'ı şu an "Bugünün Çetelesi / İşaretle, ilerle". Aynen kalır — yalnız iki bölümün adları (Amel & Mana) altta görünür.

## Dokunulmayacaklar
- `index.tsx` JSX yapısı (sadece bir prop kaldırma).
- Veritabanı şeması (migration YOK — kullanıcı "İlim'in kendi tabloları var, zaten" dedi; mevcut `cetele_sablon.alan='mana'` kayıtları olduğu yerde kalıyor, sadece UI etiketi düzeliyor).
- Header'daki 3 BriefRing halkası (Mana/İlim/Amel) — onlar zaten doğru alanları sayıyor.
- `EtkinlikDetaySheet`, `AlanDetaySheet`, `BugunFab`.

## Beklenen sonuç
Dashboard'da Odak kartının altında tek bir "Bugünün Çetelesi" kartı: üstte **🛠️ Amel** (aktif kursların ilk eksik modülleri), altta **🤲 Mana** (evrâd şablonları). İlim, kendi sayfasından takip edilir. Halkalar ve checklist içerikleri aynı kavramı sayar — kopukluk kalkar.
