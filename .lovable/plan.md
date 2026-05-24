## Mevcut Durum

Bugün sayfası zaten istenen yapıya çok yakın:
- Header: selamlama + tarih ✅
- OdakKarti: "ŞU AN" / "SIRADAKİ" rozetli, sıradaki etkinliği gösteren kart ✅
- GunlukChecklist: süre rozetli, üstü çizilen + opaklık düşen checkbox'lar ✅
- BugunFab + HavuzSheet: havuzdan seçim + özel görev ekleme ✅

## Eksik

GunlukChecklist başlığının sağ üstünde **"⚙️ Şablonları Yönet"** kestirme ikonu yok. Şu anda orada yalnız "Sıfırla" var.

## Plan

`src/components/mizan/dashboard/gunluk-checklist.tsx` — header'ın sağ tarafına `Settings2` ikonlu küçük bir bağlantı eklenecek:

- `<Link to="/mana">` ile `Settings2` (lucide) ikonu — `text-muted-foreground hover:text-foreground`, `Sıfırla` butonunun yanında.
- `aria-label="Şablonları yönet"`, tooltip için `title` aynı metin.
- Görsel ağırlık dengeli: `h-3.5 w-3.5` ikon, gap-2 ile mevcut "Sıfırla" linkinin solunda.
- Mana sayfası (`/mana`) zaten `cetele_sablon` CRUD ekranı — `tahmini_sure_dk` ve `kategori_id` alanları `SablonForm`'da mevcut.

Başka değişiklik gerekmiyor; backend, FAB, HavuzSheet, OdakKarti dokunulmayacak.
