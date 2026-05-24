# Bugün sayfası — minimalist yeniden yapı

## Amaç
"Bugün" sayfasını "şu an ne yapmalıyım?" sorusuna tek bakışta cevap veren bir akış hâline getirmek. Tekrarlayan kartları kaldırıp tek bir Odak kartı + birleşik bir günlük checklist bırakmak.

## Yeni sayfa iskeleti (`src/routes/index.tsx`)
Aşağıdan yukarıya:

1. **Header** — değişmiyor: selamlama + tarih + 3 BriefRing (Mana / İlim / Amel).
2. **Odak kartı** (yeni, tek kart) — `NowCard`'ın yerine geçer.
3. **Bugünün Çetelesi** (yeniden tasarlanmış) — İlim + Amel birleşik checklist.
4. **BugunFab** (alt sağ + butonu) — değişmiyor.

Kaldırılacak bölümler:
- `BugunZamanCizelgesi` ("Bugünün Takvimi" / Up Next) — Odak kartı bunu kapsıyor.
- `BugununMufredati` — çetele içine taşınıyor.
- `GelecekGunler` (4 gün ileri bakış) — tamamen kaldırılıyor.
- `BuHaftaWidget` — kullanıcının listesinde yok ama "remove redundant" ruhuna uygun. **Karar gerekirse koruyabilirim** (aşağıdaki açık soruya bak).

## 1) Odak kartı
Mevcut `NowCard` zaten "ongoing → next event → first open task → first incomplete amel modülü → boş" önceliğini uyguluyor. Kullanıcının isteği yalnızca **şu an olan etkinlik, yoksa bugünün sıradaki etkinliği**. Bu yüzden:

- Yeni dosya: `src/components/mizan/dashboard/odak-karti.tsx`
- Mantık: bugünün etkinlikleri (`useEtkinlikler` + `genisletEtkinlikleri`) → 
  - `ongoing` varsa onu göster ("Şu an", kalan dk),
  - yoksa bugünün sıradaki etkinliğini göster ("Sıradaki", kaç dk sonra),
  - yoksa boş durum: "Bugün için planlı etkinlik yok" + Takvime git linki.
- Görsel dil mevcut `NowCard` ile aynı: ince üst şerit (alan rengi), büyük saat, başlık, konum, "Detay" butonu (sheet açar).
- Görev / amel modülü kapsam dışı (artık checklist'te yer alacak).
- Eski `NowCard` ve `BugunZamanCizelgesi` dosyaları **silinmiyor** (başka yerden ithal edilebilir diye), sadece `index.tsx`'ten kullanım kaldırılıyor. İsterseniz silebilirim.

## 2) Birleşik günlük checklist
- Yeni dosya: `src/components/mizan/dashboard/gunluk-checklist.tsx`
- Tek `<section>`, içinde iki alt başlık:
  - **📚 İlim** — `useAmelKurslar` + `useTumAmelModuller`'dan aktif kursların ilk tamamlanmamış modülleri (mevcut `BugununMufredati` mantığı) — ama "İlim" başlığı altında.  
    Not: Mevcut veri modelinde "ilim" alanı `useDersler`/`useSinavlar` üzerinden (ders/sınav), Git/Linux gibi "müfredat" öğeleri ise `amel_kurs` tablosunda. Kullanıcının verdiği örnek (Git, Linux) müfredat kurslarına denk düştüğü için **İlim bölümünde aktif amel kurslarının modüllerini** listeleyeceğim. (Bu konuda aşağıdaki açık soruya bak.)
  - **🤲 Amel** — Mana evrâdı çetele şablonları (mevcut `BugunCetelesi`'nin `mana` filtresi). Her şablon için tek tık checkbox: hedefe ulaştıysa "tamam" (üstü çizili + fade), değilse boş.  
    Hızlı işaretle: `CeteleHucre` yerine basit checkbox kullanılacak — tek tık tüm hedefi bir kerede tamamlatır (`useKayitYaz` ile `hedef_deger` kadar miktar yazılır). Detay sayfası eski gibi `/mizan/mana`.
- Stil: her satır ince border, checkbox sol, başlık ortada, sağda hedef/birim küçük yazı. Tamamlandığında `line-through` + `opacity-50`.
- Akış modu butonları (Play "Akış") sadeleştirme adına çıkarılıyor; kullanıcı detay sayfalarından erişebilir.
- Bağlam filtresi (`BaglamFiltre`) çetele kısmından çıkarılıyor (cognitive load azaltma). Detay sayfalarında kalmaya devam ediyor.

## 3) Index sayfası diff özeti
`src/routes/index.tsx`:
- Şu importlar kaldırılıyor: `BugunCetelesi`, `BugunZamanCizelgesi`, `GelecekGunler`, `BugununMufredati`, `NowCard`, `BuHaftaWidget`.
- Yeni importlar: `OdakKarti`, `GunlukChecklist`.
- JSX gövdesi:
  ```text
  <header />                    -- aynı
  <OdakKarti simdi={simdi}
             onYeniEtkinlik=...
             onYeniGorev=... />
  <GunlukChecklist simdi={simdi} />
  <BugunFab ... />
  ```
- `AlanDetaySheet`, `GorevDialog`, `EtkinlikHizliDialog` mevcut hâliyle korunuyor.

## 4) Stil
Mevcut tasarım token'ları (`var(--mana)`, `var(--ilim)`, `var(--amel)`, `bg-card`, `border-border` vb.) aynen kullanılıyor. Yeni renk eklenmiyor, yeni varyant eklenmiyor.

## Açık soru (uygulamadan önce)
Sayfada **"Bu hafta Evdekiler" (`BuHaftaWidget`)** ve **"Mana çetelesi (evrâd)"** ile **"Amel başlığı altında listelenecek şey"** seçimi konusunda küçük belirsizlik var:

- "Amel (Spiritual)" başlığı altında **Evvâbîn, Teheccüd** gibi öğeler söylediniz → bunlar bugün `cetele_sablon` tablosunda `alan = 'mana'` olarak duruyor (kod tabanında "Mana = maneviyat/evrâd"). Yani sizin "Amel" dediğiniz şey, kodda "Mana" alanı. Plan bunu varsayıyor: **🤲 Amel bölümünde Mana çetele şablonları gösterilecek**. Onaylıyor musunuz, yoksa veritabanı etiketlerini de değiştirelim mi?
- `BuHaftaWidget`'ı kaldırayım mı, yoksa kalsın mı? (Listenizde adı geçmediği için kaldırmaya meyilliyim.)

Onaylarsanız "Implement plan" ile uygularım.