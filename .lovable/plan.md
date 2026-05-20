# Sistemin bugünkü durumu — mühendis gözüyle

Kodu hızlıca taradım. Sistem işliyor ama **fazlalıklar bilinç kaybından, eksikler ise tutarsızlıktan** geliyor. Mükemmeliyetçi değil, akıcı bir sistem istiyorsan üç şeyi sırayla çözmek gerek.

---

## Gözüme çarpan ana sorunlar

### 1. İkili kaynaklar (en büyük kafa karışıklığı)
- `src/lib/takvim-hooks.ts` + `takvim-tipleri.ts` **VE** `src/lib/takvim/hooks.ts` + `tipler.ts` → aynı domain için iki paralel API. Dashboard eskisini, Takvim sayfası yenisini kullanıyor.
- `src/components/takvim/etkinlik-dialog.tsx` **VE** `src/components/mizan/takvim/etkinlik-hizli-popover.tsx`+`gorev-dialog.tsx` → dialog'lar iki dizine bölünmüş.
- Sonuç: bir alan değişince iki yerde de değiştirmek lazım, biri unutuluyor, sessiz bug çıkıyor.

### 2. İsimlendirme tutarsızlığı
- `lib/network-hooks.ts` (tire ile düz) **ama** `lib/takvim/hooks.ts` (klasör altında). İkisi de domain ama farklı kalıp.
- `routes/mizan.ilim.tsx` (nokta-ayraçlı flat) ile `routes/workspace.notlar.tsx` aynı tarz, ama `routes/network.tsx` ve `routes/takvim.tsx` tepe seviyede. Kullanıcı için **/mizan**, **/workspace**, **/network**, **/takvim** dört ayrı dünya — neden ayrı oldukları açık değil.

### 3. Şişkin dosyalar (Takvim'i böldük — sıra diğerlerinde)
```
843  routes/network.rapor.tsx
796  components/mizan/network/kisiler-tab.tsx
788  routes/mizan.ilim.$id.tsx
767  routes/mizan.amel.$id.tsx
709  routes/mizan.amel.index.tsx
587  components/mizan/dashboard/akis-modu.tsx
528  components/mizan/dashboard/amel-akis-modu.tsx
475  components/mizan/network/kardes-faaliyet-timeline.tsx
1468 lib/network-hooks.ts   ← devasa, tek dosya
```
Takvim 964 → 413 oldu ve okunabilirlik uçtu. Aynı operasyon **network-hooks** ve **mizan.ilim.$id / mizan.amel.$id** için en yüksek getiriyi verir.

### 4. Akış (UX) açısından küçük fazlalıklar
- Takvim header'ında **Bugün butonu + `t` kısayolu + başlık popover'ında bugüne dön** — üç giriş, aynı iş.
- Yeni etkinlik için **`n` + `c` + header butonu + FAB + mini takvim üstündeki Oluştur** — beş giriş.
- Dashboard'da `BugunFab` + Takvim'de ayrı FAB + Mutfak'ta yok — global bir "hızlı ekle" yok, sayfaya göre değişiyor.

### 5. "Dakik ve net" için eksik olanlar
- **Domain'ler arası bağ yok**: Hedef → Etkinlik, Ders → Takvim, Görev → Çetele birbirine referans veremiyor (ya da veriyorsa UI'da görünmüyor). Kullanıcı bir görevi takvime atayamıyor.
- **Tek bir komut paleti yok** (`Cmd+K`): "bugün ne var", "yeni etkinlik", "X kişisine git" — şu an her sayfa kendi aramasını yapıyor.
- **Bildirim sistemi** sadece Takvim'de var (browser Notification). Hedef vade'si, görev deadline'ı bildirim üretmiyor.

---

## Önerim: 3 fazda sadeleştirme

### Faz A — Temizlik (1 oturum, düşük risk)
1. `lib/takvim-hooks.ts` + `lib/takvim-tipleri.ts` içeriğini `lib/takvim/`'e taşı, tüm import'ları güncelle, eski dosyaları sil.
2. `components/takvim/etkinlik-dialog.tsx`'i `components/mizan/takvim/`'e taşı, eskisini sil.
3. `lib/network-hooks.ts` (1468 sat) → `lib/network/` altında `kisiler.ts`, `istisareler.ts`, `gundemler.ts`, `maneviyat.ts` olarak böl.

**Kazanç:** tek doğruluk kaynağı, kod gezinmesi yarı yarıya kısalır.

### Faz B — Şişkin route'ları böl (Takvim ile aynı yöntem)
1. `routes/mizan.ilim.$id.tsx` (788) — ders detayı, dersler-listesi, sınav-listesi, ilerleme-grafikleri olarak ayır.
2. `routes/mizan.amel.$id.tsx` (767) ve `mizan.amel.index.tsx` (709) — modül listesi, kurs detayı, ilerleme'ye ayır.
3. `routes/network.rapor.tsx` (843) — rapor başlığı, filtreler, grafik bölümleri, PDF aksiyonları olarak ayır.

**Kazanç:** her dosya tek bir şeye odaklı, AI/insan değişiklik yaparken yan etki ihtimali düşer.

### Faz C — Akışı sıkılaştır (en yüksek hissedilir fayda)
1. **Global komut paleti (`Cmd+K`)**: arama + hızlı oluştur + son ziyaret edilenler. Her sayfadaki kendi aramasını besler.
2. **Cross-domain bağlama**: Görev'e "takvime ekle", Hedef'e "etkinlik üret", Ders'e "sınav takvimle" eylemleri.
3. **Birleşik bildirim merkezi**: takvim hatırlatıcı + görev vade + hedef checkpoint tek yerden.
4. **UX redundancy temizliği**: header'daki Bugün butonunu kaldır (başlık popover'ı yeter), `n` kısayolunu sil (`c` yeter), her sayfada aynı FAB davranışı.

---

## Önce hangisi?

Bana sorarsan **Faz A** ile başlayalım — temizlik. Çünkü Faz B ve C'yi kirli zeminde yapmak iki kat iş demek. Faz A bir oturumda biter, davranış değişmez, gözle görünür hiçbir şey eklenip çıkmaz ama sistem **kavramsal olarak yarıya iner**.

Onaylarsan Faz A için tek tek migration'ı planlayıp uygulayabilirim. Ya da kafanda farklı bir öncelik varsa söyle, sıralamayı sana göre kurarım.
