## Önceki refaktör sonrası tespit edilen 7 pürüz

Tüm sayfaları masaüstü + mobil görünümde gerçek veriyle gezdim. Bulgular ve düzeltmeler aşağıda — sırasıyla, en bozuk olandan başlayarak.

---

### 1. Mobilde FAB içeriğin üzerine biniyor *(kritik)*

`BugunFab` sağ alt köşede sabit. Ana sayfada "Bugünün çetelesinden" satırlarındaki sayıları (0/3 sayfa, 0/3 adet) kapatıyor.

**Düzeltme:** `routes/index.tsx`'in en alt content wrapper'ına mobilde `pb-24` ekle. Alternatif: FAB scroll-down sırasında gizlensin (`useScrollDirection` zaten var).

---

### 2. Mobil header sıkışıklığı *(kritik)*

Selamlama "İyi akşamlar, saalutlume" + 3 `BriefRing` halka tek satırda. Dar ekranda halkalar isim üstüne biniyor.

**Düzeltme:** Header'ı mobilde 2 satıra böl — üst satır selamlama, alt satır halkalar tam genişlikte 3 eşit kolon.

---

### 3. `/mizan` boş veri edge case'i

"Bu haftanın özeti"nde tüm değerler 0 olduğunda hem **En güçlü** hem **Dikkat** alanı "Mana 0/57" gösteriyor. Anlamsız.

**Düzeltme:** `mizan.index.tsx`'te toplam=0 ise 3 özet kartını gizleyip yerine tek satır boş-durum mesajı: *"Bu hafta henüz çetele kaydı yok. Bugün ilk değerlerini gir."* + CTA `/mizan/mana`.

---

### 4. `OdakKarti` boş durumda fazla yer kaplıyor

"Bugün için planlı etkinlik yok" tek cümlelik bilgi için ~200px alan. Hem mobilde hem masaüstünde ekranın değerli üst kısmını dolduruyor.

**Düzeltme:** Boş durumda kartı kompakt forma indir — tek satır, küçük takvim ikonu + metin + "Takvime git" inline link (~48px). Etkinlik varsa mevcut büyük form kalsın.

---

### 5. `MutfakYanPanel` + alt route sidebar'ı duplicate

`/workspace/notlar`'da: sol panel (recent + arama) → notlar/arşiv tab sidebar'ı → not listesi → içerik = **4 sütun**. Üstte de ayrıca topbar araması, yan panelde ikinci arama.

**Düzeltme:**
- Yan paneldeki arama kutusunu kaldır (topbar araması zaten var, mutfak içeriğini de o kapsasın).
- "Son kullanılanlar" listesi `collapsible` olsun, varsayılan açık.
- `/workspace/notlar`, `/workspace/belge`, `/workspace/tablo` index sayfalarının kendi inner sidebar'ı var → bu route'larda `YanPanel`'i otomatik daralt (collapsed/ikon).

---

### 6. `CeteleBugunMini` ile `GunlukChecklist` arasında zayıf görsel ayrım

İki "yapılacak" listesi alt alta, fark sadece küçük gri yazıyla anlatılıyor. Kullanıcı bağlamı kaybediyor.

**Düzeltme:**
- `CeteleBugunMini` kartını farklı varyant (daha düşük opaklık background, ince üst kenar / `border-t-2 border-primary/20`).
- Başlığa küçük rozet: "RİTÜEL" — `GunlukChecklist`'in başlığına da rozet: "BUGÜN".
- Aralarına 1px separator + arada `space-y-6` yerine `space-y-2`.

---

### 7. `BriefRings` masaüstünde de hiyerarşi zayıf

Halkalar selamlamayla aynı satırda, header'a sıkışık. Tıklanabilir ama davet edici değil.

**Düzeltme:** Masaüstünde `lg:` breakpoint üzeri halkaları header'dan çıkar, hemen altına 3 kolon halinde büyütülmüş haliyle yerleştir (mevcut `denge-halkalari.tsx` boyut varyantı varsa onu kullan, yoksa basit `size="lg"` prop'u ekle).

---

## Kapsam dışı (bilinçli)

- **Takvim "ana sayfaya dön" kısayolu** — sol sidebar zaten görünür, sidebar'daki "Bugün" ikonu işi görüyor.
- **Sidebar collapsed/expanded davranışı** — düzgün çalışıyor, dokunulmuyor.
- **`BriefRings` → sheet geri getirme** — kullanıcı önceki turda explicit "navigate" istedi, geri almıyorum.
- **Tema/dil/auth/db** — hiçbiri etkilenmiyor, sadece UI/layout.

---

## Teknik özet

| # | Dosya |
|---|---|
| 1 | `routes/index.tsx` (mobile bottom padding) |
| 2 | `routes/index.tsx` (header responsive layout) |
| 3 | `routes/mizan.index.tsx` (empty-state branch) |
| 4 | `dashboard/odak-karti.tsx` (compact empty variant) |
| 5 | `mutfak/yan-panel.tsx` + `routes/workspace.tsx` |
| 6 | `dashboard/gunluk-checklist.tsx` + `dashboard/cetele-bugun-mini.tsx` |
| 7 | `routes/index.tsx` + muhtemelen `dashboard/brief-rings.tsx` size prop |

Hepsi pure frontend. Migration/RLS/auth yok.

---

**Sırayla 1→7 uygulayacağım. Onaylarsan başlıyorum; "şu maddeyi atla" / "şuradan başla" demek istersen söyle.**