# Yapı İyileştirmeleri — 4 Aşamalı Uygulama

Önceki gözlemlerin hepsini mantıklı bir sırayla, küçük adımlarla uyguluyorum. Her aşama bağımsız çalışır, bir öncekini bozmaz. Soldan başlıyoruz: **navigasyon → ana sayfa → çetele köprüsü → mutfak**.

---

## Aşama 1 — Navigasyon ikiliğini çöz (SolSidebar + IconRail)

**Problem:** Desktop'ta sol kenarda iki sidebar var (`SolSidebar` tam menü + `IconRail` ikon şerit). Roller belirsiz.

**Çözüm:**
- `IconRail` kaldırılıyor. Tek bir `SolSidebar` kalıyor; bu sidebar collapsed (ikon-only) ve expanded (ikon+label) iki moda sahip olacak.
- `useSidebar()` zaten shadcn'de var — `SolSidebar`'a `collapsible="icon"` ekleyip varsayılan olarak collapsed başlatıyoruz. Hover'da veya toggle ile expand oluyor.
- `app-shell.tsx`'ten `IconRail` import'u ve `xl:pl-12` padding'i kaldırılıyor (sidebar artık kendi alanını yönetiyor).
- Mobile'da `AltTabBar` aynı kalıyor (mobil için doğru pattern).

**Sonuç:** Tek navigasyon kaynağı. Daha sade kenar.

---

## Aşama 2 — `/mizan` hub ile ana sayfa tekrarını çöz

**Problem:** Ana sayfa (`/`) ve `/mizan` hub'ı aynı 3 halkayı farklı boyutta gösteriyor.

**Çözüm — `/mizan` hub'ını "haftalık denge raporu" sayfasına dönüştür:**
- Üst kısım: 3 büyük `IstikametKart` kalır (mana/ilim/amel) — buradan derin sayfalara giriş.
- Yeni bölüm 1: **Bu haftanın özeti** — `haftaSablonOzet` verisiyle "tamamlanan/toplam" + en güçlü/zayıf alan.
- Yeni bölüm 2: **Streak ısı haritası** (son 12 hafta) — mevcut `streak-isi-haritasi.tsx` component'i tüm alanlar için yeniden kullanılır.
- Ana sayfadaki `BriefRings` kalıyor ama davranışı küçük değişiyor: tıklayınca `AlanDetaySheet` yerine doğrudan ilgili alan sayfasına (`/mizan/mana` vb.) gidiyor — hub bir ara katman olmaktan çıkıyor, kısayol oluyor.

**Sonuç:** `/mizan` artık tekrar değil, gerçek "rapor" sayfası.

---

## Aşama 3 — Ana sayfa `GunlukChecklist` ↔ `/mizan/mana` çetele köprüsü

**Problem:** Ana sayfadaki esnek görevler ile çetele sistemi paralel duruyor, kullanıcı hangisini ne zaman kullanacağını bilmiyor.

**Çözüm:**
- `GunlukChecklist`'in altına küçük bir **"Bugünün çetelesinden"** bölümü ekleniyor. Bugüne denk gelen çetele şablonları (sayılı liste, max 3) tıklanabilir satırlar olarak gösteriliyor — tamamlanma durumu çetele tablosuna yazılıyor (`useHaftaKayitlari` mutation).
- Üstte küçük açıklama: *"Esnek görevler bugüne özel · Çetele tekrar eden ritüeller"*.
- "Tümünü gör" linki `/mizan/mana`'ya gidiyor.

**Sonuç:** İki sistem birbirine referans veriyor, rol farkı görsel olarak net.

---

## Aşama 4 — Mutfak (`/workspace`) birleşik akış

**Problem:** Belge/not/tablo/sürücü ayrı route'lar, aralarında geçiş hub'a dönmeden mümkün değil.

**Çözüm:**
- `workspace.tsx` layout route'una **sol panel** ekleniyor (sadece `/workspace/*` rotalarında, mobile'da gizli):
  - Üstte arama kutusu (mevcut `HubArama` reuse).
  - Altında "Son kullanılanlar" listesi — son 10 belge/not/tablo karışık, ikonlu, tıklayınca o item'a gidiyor.
- `workspace.index.tsx` (hub tile grid) korunuyor — landing olarak iş görüyor.
- Belge editörü açıkken bile sol panelden başka bir nota geçiş tek tıkla mümkün.

**Sonuç:** Mutfak gerçek bir "workspace" gibi davranıyor — bağlamı kaybetmeden gezinti.

---

## Aşamada YAPILMAYAN şeyler (bilinçli)

- **Takvim "ana sayfaya dön" kısayolu:** `SolSidebar` collapsed modda zaten görünür kalıyor, ekstra kısayol gereksiz.
- **`/mizan` hub'ını tamamen kaldırmak:** Çok agresif olur; "rapor" olarak konumlandırmak daha güvenli.
- **Component / hook isimlendirme refaktörü:** Bu turun kapsamı dışında.
- **Veritabanı / RLS / migration:** Hiçbir aşama schema değiştirmiyor. Sadece UI/route düzeni.

---

## Teknik detaylar (kısa)

| Aşama | Dokunulan dosyalar |
|---|---|
| 1 | `app-shell.tsx`, `sol-sidebar.tsx`, sil: `icon-rail.tsx` |
| 2 | `mizan.index.tsx` (yeniden yazım), `dashboard/brief-rings.tsx` (onAc → navigate), `routes/index.tsx` (`AlanDetaySheet` kaldır) |
| 3 | `dashboard/gunluk-checklist.tsx` (alt bölüm), muhtemelen küçük yeni component `cetele-bugun-mini.tsx` |
| 4 | `workspace.tsx` (layout panel), olası yeni `mutfak/son-kullanilanlar.tsx`; `mutfak-hooks.ts` "recent" sorgusu eklenebilir |

Hepsi pure frontend. Auth/Cloud şeması değişmiyor.

---

**Onaylarsan Aşama 1'den başlayıp sırayla ilerleyeceğim. Her aşamadan sonra durup sana göstermemi istersen söyle — yoksa 4'ünü peş peşe yapıp tek seferde teslim ederim.**

