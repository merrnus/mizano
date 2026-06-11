# Mimari sadeleştirme — Faz planı

Senin 12 noktanı doğru okuduğumu teyit etmek için: bu plan **#3 + #1 + #2 + #4 + #10**'a odaklanıyor (senin "en yüksek değerli" dediklerin). Geri kalanlar (#5–#9, #11–#12) ayrı bir tur olarak duruyor; istersen bu plan biter bitmez onları da yazarım.

Plan dört faza bölünmüş, **her faz tek başına çalışır ve geri alınabilir** — yani Faz 1'i görüp "yok, bu yön yanlış" dersen, Faz 2'ye geçmeden dururuz.

---

## Faz 1 — Taksonomi temizliği (#2)

**Amaç:** Sidebar ve route ağacındaki kavram enflasyonunu sıfırla. "Mana = iç hayat, İlim = öğrenme, Amel = eylem" üçlüsü kalsın; geri kalan isimler ya bunların alt-görünümü olsun ya da silinsin.

**Karar matrisi (sana soracağım):**
- `mizan.akademi` → muhtemelen İlim'in bir görünümü. Sil, İlim altına taşı.
- `mizan.dunyevi` → Amel'in bir filtresi mi yoksa bağımsız mı? Net değil.
- `mizan.maneviyat` → zaten `/mizan/mana`'ya redirect; route'u tamamen kaldır.
- Sidebar etiketleri: "Mizan" üst başlık mı, alt-sayfa mı? Şu an `/mizan` + `/mizan/mana` + `/` üçü farklı yere gidiyor, kafa karıştırıyor.

**Sonuç:** 3 alan + 1 hub. Sidebar: Bugün · İstikamet (Mana/İlim/Amel sekmeli) · Planlama · Rehberlik · Mutfak.

**Risk:** Düşük. Sadece route silme + redirect + sidebar yeniden düzeni.

---

## Faz 2 — Birleşik "Bugün" akışı (#1)

**Amaç:** Ana sayfada OdakKarti + GunlukChecklist + CeteleBugunMini'yi **tek zaman-sıralı listeye** birleştir. Veri kaynağı farklı olsa da kullanıcıya tek liste görün.

**Mimari:**
- Yeni `src/lib/bugun-akisi.ts`: `useBugunAkisi(simdi)` → `{ saat, tip: "etkinlik" | "gorev" | "ritual", baslik, alan, kaynak }[]` döner. Üç hook'u birleştirip zamana göre sıralar.
- Yeni `src/components/mizan/dashboard/bugun-akisi.tsx`: tek liste, satırın solunda tip rozeti (🕌 ritüel · ✓ görev · 📅 etkinlik), sağında zaman/aksiyon.
- Eski üç component **silinmez**, sadece `routes/index.tsx`'ten kaldırılır (gerekirse başka yerde lazım olur).

**Risk:** Orta. Sıralama mantığı (saatsiz ritüeller nereye?) ve aksiyonların (işaretle/aç/başlat) tek satırda dengelenmesi tasarım kararı gerektirir.

---

## Faz 3 — Tek primitive: Hedef → Tezahür (#3) **[en büyük iş]**

**Amaç:** Hedef'i tek "primitive" yap. Çetele şablonu, görev ve tekrarlı etkinlik onun **tezahürü** olsun. Kullanıcı bir hedef girer; sistem ona "bu nasıl tezahür etsin?" diye sorar (günlük ritüel / haftalık görev / takvim etkinliği). Tek girişten 3 yerde görünür.

**Veri modeli:**
- `hedef` tablosu zaten var. Yeni alan: `tezahur_tipi` enum (`ritual` | `gorev` | `etkinlik` | `karma`).
- Yeni tablo: `hedef_tezahur` — bir hedefin hangi çetele_sablon / takvim_gorev / takvim_etkinlik kayıtlarını ürettiğini tutar (kaynak_id + tip). Backlink için.
- Mevcut `cetele_sablon.hedef_id`, `takvim_gorev.hedef_id` alanları varsa onları kullan; yoksa migration ekle.
- **Mevcut veri korunur** — eski çetele şablonları "bağımsız ritüel" olarak yaşar; yenileri hedef üzerinden üretilir.

**Akış:**
1. Kullanıcı `/mizan/hedef/yeni` der.
2. Form: başlık + alan (mana/ilim/amel) + tezahür seçimi (kart bazlı: "Günlük ritüel olarak takip et" / "Haftalık görev olarak planla" / "Belirli tarihte etkinlik" / "Birden fazla").
3. Seçime göre alt-form (örn. ritüel için: birim, hedef miktarı, frekans).
4. Submit → hedef + ilgili çetele_sablon/takvim_* kaydı tek transaction'da oluşur, `hedef_tezahur` ile bağlanır.

**Görünüm:**
- Hedef detayında: "Bu hedef şurada görünür: [Bugünün Çetelesi] [Bu Hafta]"
- Çetele/görev satırında küçük 🎯 ikon + hover'da hedef adı.

**Risk:** Yüksek. En büyük iş bu — veri modelinde değişiklik, migration, mevcut çetele formunun yeniden konumlanması. Faz 2'den sonra ayrı bir onay turu ile başlamayı öneriyorum.

---

## Faz 4 — Mutfak'ı bağlamla bağla (#4)

**Amaç:** Not/belge/tablo'ya **opsiyonel bağlam** (ders, hedef, kişi, etkinlik) iliştirilebilsin. Bağlam etiketi var olan `baglam-chip` sistemi üzerine inşa edilir.

**Mimari:**
- `mutfak_not`, `mutfak_belge`, `mutfak_tablo` tablolarına `baglam_turu` + `baglam_id` alanları (Ekler'deki polimorfik yapının aynısı).
- `EklerPaneli`'ne paralel `IlgiliNotlar` paneli: ders/hedef/kişi detayında "Bu …e ait notlar" otomatik listelenir.
- Not/belge oluştururken üst tarafta opsiyonel "Bağla:" dropdown'u.

**Risk:** Düşük-orta. Ekler sistemi prototip oldu, aynı pattern uygulanır.

---

## Faz 5 — Akıllı hızlı ekle (#10)

**Amaç:** "Yeni ritüel ekle" tek input + parse. `Cmd+K` global picker (#9 ile kesişiyor — beraber yapalım).

**Mimari:**
- `Cmd+K` açar bir `command` dialog (shadcn `Command` zaten kurulu).
- Tek input. Örnek girdiler:
  - "Her sabah 20 dk Kur'an" → ritüel, mana, günlük, 20dk
  - "Yarın 15:00 Ahmet ile istişare" → etkinlik, network, yarın 15:00
  - "Cuma'ya kadar makaleyi bitir" → görev, cuma deadline
- Parse: Lovable AI Gateway (`google/gemini-2.5-flash`) — JSON schema ile yapılandırılmış çıktı. Sunucu fonksiyonu olarak `src/lib/hizli-ekle.functions.ts`.
- Önizleme kartı + "Düzenle / Onayla" — sihirbaz değil, doğrulama.

**Risk:** Orta. AI çağrısı + serverFn + UI. Ama yalıtık, başka şeyi bozmaz.

---

## Faz sırası ve onay noktaları

```text
Faz 1 (taksonomi)  ──► onay ──► Faz 2 (birleşik Bugün)  ──► onay
                                                              │
                          ┌───────────────────────────────────┘
                          ▼
                       Faz 3 (hedef primitive — ayrı plan turu)
                          │
                          ▼
                       Faz 4 (Mutfak bağlam) + Faz 5 (Cmd+K) — paralel
```

**Önerim:** Bu turda **sadece Faz 1 + Faz 2**'yi onayla. Çünkü Faz 3 hem teknik hem ürün açısından bir kez daha kafa kafaya vermemiz gereken iş — veri modeli kararını bir kart üstünde konuşmak isterim. Faz 1+2 bitince Faz 3 için ayrı detaylı plan yazarım.

## Bu plan dışında bıraktığım maddeler

- **#5 (Network sadeleştirme):** Senin tercihine bırakıyorum — radikal sadeleştirme mi, ayrı ürün konumlandırma mı? Karar verince ayrı plan.
- **#6 (`useNow` hook):** Küçük refactor, Faz 2 sırasında doğal olarak çıkar.
- **#7 (`useDengeOzeti`):** Küçük refactor, Faz 2 sırasında.
- **#8 (boş durumlar + onboarding):** Faz 1–4 bitince anlamlı; o sırada yeni boş ekranlar oluşacak, hepsi aynı kalıpla yazılır.
- **#9 (Cmd+K):** Faz 5'e dahil edildi.
- **#11 (kompakt mod):** Sonraya — şu an erken.
- **#12 (SSR/loader):** Faz 3 ile beraber yapılacak; veri modeli oturmadan loader yazmak boşa iş.

---

**Onaylarsan Faz 1'den başlarım. "Faz 1+2 onay" dersen ikisini tek seferde götürürüm. "Önce Faz X'i tek başına gör" istersen onu söyle.**