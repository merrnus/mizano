# Bugün akışı — Mana ritüellerini "esnek miktar" satırına dönüştür

Bugün'deki mana ritüel satırları "hedef baskısı" olmadan davranacak. Kullanıcı sadece bugün ne yaptıysa kısa bir input ile yazar; aynı kayıt `cetele_kayit`'e gittiği için Mana sayfasındaki haftalık tablo otomatik dolar (entegrasyon korunur). Mana sayfasının kendisi (tablo + hedefler) bu turda değişmiyor.

## Davranış değişiklikleri (sadece `BugunAkisi`)

**Şablon filtresi**
- Eski: `alan === "mana" && hedef_tipi === "gunluk" && toplam < hedef`
- Yeni: `alan === "mana" && hedef_tipi IN ("gunluk", "esnek")`, tamamlanma filtresi yok — şablon her gün listede durur. (`haftalik` tipi — Oruç, Teheccüd gibi — Bugün akışında değil, takvim/Mana sayfasında kalır.)

**Satır UI**
- "0/100 kez" sabit hedef göstergesi kaldırılır.
- Satır sağında kompakt inline ekleyici:
  - `sayfa` / `adet` / `dakika` birimleri: küçük sayı input (1-3 hane) + "+" butonu. Adım/varsayılan: `sayfa=1`, `adet=1`, `dakika=5`.
  - `ikili` birim (Evvâbîn, Virdler gibi): input yerine tek "✓" butonu — bir tık = `+1`. Bugün kaydı varsa pasif ton + tekrar tıklanırsa toast'lı uyarı (silmek için Mana sayfası).
- Sol kısım aynı (Sparkles ikon + isim + "Ritüel" rozeti).
- Alt satırda hedef yerine yumuşak ton **"bugün: N birim"** — kayıt yoksa hiç gösterme.

**Aksiyon**
- `tamamla(ritual)` → "kalanı tamamla" yerine "input değerini ekle" (custom miktar veya birim varsayılanı). Hâlâ `useKayitEkle` çağrılır, `cetele_kayit` insert. Mana sayfası anında günceller (aynı query key).
- Tek tık "tamamlandı" mantığı kalkıyor — `bitenler` listesine ritüel düşmüyor (zaten şu an da düşmüyordu çünkü hedef tamamlanınca filtre düşürüyordu).

## Etkilenen dosya

Tek dosya: `src/components/mizan/dashboard/bugun-akisi.tsx`
- `ritualOgeleri` memo: filtre + hedef alanlarını esnetilmiş şekle çevir, `bugunMiktar` alanı ekle.
- `RitualSatir` component: hedef metnini çıkar, inline ekleyici input/+ buton blok eklemek. Ufak iç state (`miktar` string) tutar; submit'te ekle + temizle.
- `tamamla` action ritüel kolu: miktar parametresi alır.

## Veritabanı / şema

Değişiklik yok. `cetele_sablon` / `cetele_kayit` yapısı zaten `miktar: numeric` ile uyumlu. Mevcut başlangıç paketindeki `hedef_deger` alanları korunur — Mana sayfası onları kullanmaya devam eder, Bugün akışı görmezden gelir.

## Dışarıda bırakılanlar

- Mana sayfası tablosu, hedef rozetleri, haftalık özet — hepsi aynen kalır.
- `hedef_tipi="haftalik"` şablonlar (Oruç/Teheccüd) için Bugün'de ayrı görünüm — gerekirse sonraki turda.
- Ritüel satırından şablon düzenleme (hedef değiştir vb.) — Mana sayfasında zaten var, eklemiyoruz.

## Açık küçük karar

`hedef_tipi="esnek"` (örn. "Ezber") şablonu bugün her gün listede mi olsun, yoksa sadece kullanıcı ekleyince mi belirsin? **Önerim:** her gün listede dursun ama en alta; kullanım az olduğu için fazla yer kaplamaz. Onaylar mısın yoksa "sadece kayıt olunca göster" mi tercih edersin? (Onay vermezsen önerilen yolla giderim.)
