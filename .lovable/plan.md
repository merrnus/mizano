
# Sayfa Analizi — Tespit Edilen Tutarsızlıklar ve Hatalar

Tüm rotaları, sidebar/topbar/ikon-rail'i, dashboard widget'larını ve detay sheet'lerini taradım. Çoğu yer tutarlı; ancak aşağıdaki **9 net sorun** var. Çoğu küçük ama bir kısmı gerçek bug.

---

## 🔴 1) `/mizan` (İstikamet) sayfası hâlâ statik yüzde gösteriyor

**Dosya:** `src/routes/mizan.index.tsx` (satır 41-43)

```ts
const manaYuzde = yuzdeHesapla("mana");
const ilimYuzde = 58;     // ❌ statik
const amelYuzde = 32;     // ❌ statik
```

Ana sayfa (`/`) düzgün şekilde Amel'i `useAmelKurslar`+`useTumAmelModuller` üzerinden hesaplıyor; ama İstikamet hub sayfasında hâlâ eski sabit sayılar var. Aynı kart kullanıcı her açtığında "%58 / %32" diyor — gerçek değil.

**Düzeltme:** `/` sayfasındaki amel yüzde hesabını (kursların ortalama ilerlemesi) buraya da taşı. İlim için en azından "izliyor" durumundaki ders sayısının tamamlanan sınav oranı ile bir placeholder hesaplanabilir veya geçici olarak `null` gösterilip "—" yazılabilir, statik 58 olamaz.

## 🔴 2) Ana sayfa (`/`) İlim yüzdesi de hâlâ statik

**Dosya:** `src/routes/index.tsx` (satır 67)

```ts
const ilimYuzde = 58;  // ❌ statik
```

Aynı problem ana sayfada. Şu an Mana ve Amel gerçek hesaplanıyor; İlim sahte. Kullanıcı "/mizan" ile "/" arasında geçince aynı %58'i görüyor — bu da hesabın gerçek olmadığını ele veriyor.

**Düzeltme:** İlim için somut bir formül belirle. Öneri: aktif derslerin (`durum === "izliyor"`) tamamlanan modül/proje oranı veya geçen sınavların oranı. Eğer henüz formül netleşmediyse "—" göster ve renk noktasını gri yap.

## 🔴 3) Network'te "Rapor" tab'i orphan — `TabsContent` yok

**Dosya:** `src/routes/network.tsx` (satır 75-92)

`TabsList`'te `<TabsTrigger value="rapor">Rapor</TabsTrigger>` var; `setTab("rapor")` ise `/network/rapor`'a navigate yapıyor. Ama eğer Tabs uncontrolled state ile bir an "rapor" değerine geçerse karşılığı bir `<TabsContent value="rapor">` olmadığı için ekran beyaz kalır. Şu an `childActive/raporActive` kontrolüyle `<Outlet />` döndürerek kurtarılıyor, ama bu garip bir mimari — radix-tabs konsola "no matching content" warning'i basabilir.

**Düzeltme:** Rapor'u tab olmaktan çıkarıp ayrı bir buton (örn. üst sağ "Rapor" link butonu) yap. Ya da boş bir `<TabsContent value="rapor" />` ekleyip warning'i susturup current logic'i koru.

## 🟠 4) Topbar'da ölü route etiketleri

**Dosya:** `src/components/mizan/topbar.tsx` (satır 28-31)

```ts
["/mizan/amel", "Hedefler"],   // ❌ amel sayfasının başlığı "Müfredat"
["/mizan/akademi", "Akademi"], // ❌ artık sadece redirect
["/mizan/dunyevi", "Dünyevi"], // ❌ artık sadece redirect
["/mizan/maneviyat", "Maneviyat"], // ❌ artık sadece redirect
["/gundemler", "Gündemler"],   // ❌ artık sadece redirect → /network?tab=gundemler
```

`/mizan/amel` artık "Müfredat" başlığını taşıyor (`mizan.amel.index.tsx` head meta'sı da öyle). Topbar'ın mobilde gösterdiği etiket yanlış. Diğer üçü ise zaten kullanıcının görmediği redirect rotaları — map'ten çıkarılmalı.

**Düzeltme:** `"Hedefler"` → `"Müfredat"`, ve diğer üç redirect satırını sil.

## 🟠 5) Ölü redirect rotalarının kaldırılması (opsiyonel ama temiz)

**Dosyalar:** `src/routes/mizan.akademi.tsx`, `mizan.dunyevi.tsx`, `mizan.maneviyat.tsx`, `gundemler.tsx`

Bu dört dosya `beforeLoad → throw redirect` yapıyor. Eğer eski URL'lerin (yer imleri vb.) kırılmaması bekleniyorsa kalsın; aksi takdirde sil. Topbar/sidebar/icon-rail/alt-tab-bar hiçbiri bunlara link vermiyor, dış bağ da yok. Şu an sadece kod kabarıklığı yaratıyorlar.

**Karar:** Sen yer imi geriye uyumluluğunu önemsiyorsan bırakırız; istemezsen siliriz.

## 🟠 6) `BugunCetelesi` Amel'i atlıyor; "Hızlı işaretle" başlığı yanıltıcı

**Dosya:** `src/components/mizan/dashboard/bugun-cetelesi.tsx` (satır 28)

```ts
const alanlar: CeteleAlan[] = ["mana", "ilim"];
```

Yorum doğru: "Amel artık modüllerden besleniyor." Ama İlim'in bu listede ne yaptığı belirsiz — kullanıcının `cetele_sablon`'da `alan="ilim"` kayıtları muhtemelen yok (ilim sayfası ders/sınav modeli kullanıyor, çetele şablonu değil). Pratikte İlim bölümü her zaman boş çıkıyor (gruplu filter'la `g.sablonlar.length > 0` ile gizleniyor) ama listede tutmanın anlamı yok.

**Düzeltme:** Listeyi `["mana"]`'ya indir; başlığı da "Mana — Hızlı işaretle" olarak netleştir veya doğrudan "Bugünün Evrâdı" yap.

## 🟠 7) `EtkinlikDetaySheet`'te "kişisel" alanı varken takvim renk haritasında yok

**Dosya:** `src/components/mizan/dashboard/etkinlik-detay-sheet.tsx` (satır 266) ve `gorev-detay-sheet.tsx` (satır 149)

Select dropdown `Object.keys(ALAN_ETIKET)` kullanıyor → `mana | ilim | amel | kisisel`. `var(--kisisel)` CSS değişkeni `cetele-tipleri.ts`'te var ama `src/styles.css`'te tanımlı mı kontrol edilmeli. Eğer tanımlı değilse renkli noktalar şeffaf görünür. (Şüphe ama doğrulanmalı.)

**Doğrulama:** `src/styles.css`'i okuyup `--kisisel` var mı bakacağım; yoksa eklenecek (örn. nötr gri).

## 🟠 8) `bu-hafta-widget` — 2 sütun ama ikinci sütun çoğunlukla boş

**Dosya:** `src/components/mizan/dashboard/bu-hafta-widget.tsx`

Hook `etkinlik.tip === "istisare" || === "sohbet"` ise programlar, diğerleri faaliyetler diye ayırıyor. Faaliyet sütunu `Sadece önümüzdeki 7 gün` filtrelemiyor — `useBuHaftaOzet` ISO haftası (Pzt-Paz) tüm etkinlikleri çekiyor, sonra sütuna koyuyor. Yani geçmiş günlerdeki faaliyetler de "Faaliyetler" sütununda gözüküyor. Bu önceki kararla (sadece önümüzdeki 7 gün) çelişiyor.

**Düzeltme:** Faaliyet listesini `tarih >= bugün` ile filtrele (geçmiş günleri faaliyetlerden çıkar). Programlar (istisare+sohbet) tüm hafta kalsın.

## 🟢 9) Küçük temizlik: `BugunCetelesi`'nde `kisisel` fallback yanlış

**Dosya:** `src/components/mizan/dashboard/bugun-cetelesi.tsx` (satır 14)

```ts
kisisel: "/mizan/mana",  // fallback — şu an dashboardda gösterilmiyor
```

Mantıken `kisisel` için Amel'e değil de Takvim'e (`/takvim`) gitmesi daha doğru olabilir. Şu an pratikte tetiklenmiyor ama yanlış semantik.

---

# Uygulama Planı

1. **`src/routes/index.tsx`** ve **`src/routes/mizan.index.tsx`**: İlim yüzdesi için ya gerçek formül (önereceğim formül: izlenen derslerin geçen/toplam sınav oranı) ya "—" placeholder. Ana sayfa zaten Amel'i hesaplıyor; aynı util'i (`yuzdeHesaplaAmel`, `yuzdeHesaplaIlim`) küçük bir helper'a (`src/lib/istikamet-yuzde.ts`) çıkarıp iki sayfada paylaş.
2. **`src/components/mizan/topbar.tsx`**: `"Hedefler"` → `"Müfredat"`. Ölü 4 satırı (`akademi`, `dunyevi`, `maneviyat`, `gundemler`) map'ten kaldır.
3. **`src/routes/network.tsx`**: Rapor'u `TabsTrigger` olmaktan çıkar; sağ üst köşeye normal bir `Link` butonu olarak koy. `childActive/raporActive` ile `<Outlet />` dönüşü gereksiz hale gelir, sadeleşir.
4. **`src/components/mizan/dashboard/bugun-cetelesi.tsx`**: `alanlar = ["mana"]`. `kisisel` fallback'ini `/takvim` yap.
5. **`src/components/mizan/dashboard/bu-hafta-widget.tsx` + `useBuHaftaOzet`**: Faaliyet sütununu `tarih >= bugün` ile filtrele.
6. **`src/styles.css`**: `--kisisel` CSS değişkeni var mı doğrula; yoksa nötr (örn. `oklch(0.65 0.02 240)`) ekle.
7. **Ölü redirect dosyalarını silmeyeceğim** — kullanıcı onaylarsa sileriz; default davranışım korumak.

İlim yüzdesi formülünü ve rapor butonunun yerini netleştirmek için onay aldıktan hemen sonra hepsini tek seferde uygularım.
