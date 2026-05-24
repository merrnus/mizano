## Görev Havuzu kaldırılıyor

"Bugün" ekranındaki Havuz sheet'i ve onu açan tüm butonlar kaldırılacak. Şablonlar zaten Mana sayfasında yönetildiği için bu kısayol fazlalık ve görsel olarak yorucu.

### Yapılacaklar

1. `src/components/mizan/dashboard/havuz-sheet.tsx` dosyası silinir.
2. `src/routes/index.tsx`:
   - `HavuzSheet` import'u kaldırılır.
   - `havuzAcik` state'i ve `<HavuzSheet …/>` render'ı kaldırılır.
   - `GunlukChecklist`'e geçilen `onHavuzAc` prop'u kaldırılır.
   - Aynı state'i kullanan diğer bileşendeki `onHavuz={() => setHavuzAcik(true)}` prop'u kaldırılır (satır 190).
3. `src/components/mizan/dashboard/gunluk-checklist.tsx`:
   - `onHavuzAc` prop'u tip ve imzadan çıkarılır.
   - Header'daki "Havuzdan ekle" ikon butonu ve boş‑durumdaki "Havuzdan ekle" butonu kaldırılır.
   - Boş durumda sadece "Bir görev ekleyin" placeholder'ı kalır; kullanıcı görevleri üstteki hızlı ekleme satırından veya Mana sayfasından ekler.
4. Üstteki diğer bileşen (satır 190'daki `onHavuz` alıcısı) — prop opsiyonel hale getirilir veya çağrı tamamen kesilir; bu bileşen dosyasında havuz açan UI varsa o da kaldırılır.

### Etkilenmeyen kısımlar

- Şablonların kendisi (`cetele_sablon`) ve Mana sayfası dokunulmaz.
- "Esnek Görevler" listesinin Google Tasks tarzı görünümü olduğu gibi kalır; sadece havuz kısayolu temizlenir.
- Veritabanı değişikliği yok.