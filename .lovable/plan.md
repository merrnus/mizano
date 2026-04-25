
# Mutfak — Tam Google Ekosistemi Dokunuşu

Hedef: Notlar (Keep), Belge (Docs), Tablo (Sheets), Sürücü (Drive) ve Pomodoro modüllerini Google'ın "akıcı, sade, fonksiyonel" hissini taşıyacak şekilde derinleştirmek. Yeni paket gerekmiyor — TipTap, Tailwind, lucide ve Supabase mevcut.

---

## 1) Hub (`workspace.index.tsx`) — Google Apps launcher hissi

- Üstte: arama çubuğu (tüm not/belge/tablo başlıklarında client-side arama → sonuca tıkla, doğrudan ilgili sayfaya).
- "Son kullanılanlar" şeridi: notlar+belgeler+tablolar `updated_at desc` (ilk 6) — küçük renkli kart şeridi.
- Mevcut HubTile'ler korunur ama `rounded-3xl`, ince border, hover'da hafif `shadow-lg` + ikonun arka planı yumuşar (Google Apps tile hissi).
- "Hızlı oluştur" FAB (sağ alt, mobilde de) → DropdownMenu: Yeni not / Yeni belge / Yeni tablo.

## 2) Notlar (Keep) — `workspace.notlar.tsx` + `not-kart.tsx` + `not-composer.tsx`

- **Etiket (label) sistemi:**
  - Composer'a "Etiket ekle" chip-input (Enter ile ekle, x ile çıkar).
  - Sol kenarda (mobilde üstte yatay scroll) etiket çubuğu: tüm etiketler + sayaçları, tıkla = filtre, Tümü/Arşiv linkleri.
  - Kart üstünde mini etiket badge'leri.
- **Çoklu seçim + toplu eylem:** uzun bas / hover'da checkbox → seçilen notları toplu arşivle/sil/renk değiştir (üstte ince action bar belirir).
- **Onay/madde işareti notu:** Composer'da "Liste" toggle → `icerik` JSON `{type:"list", items:[{text,done}]}` olarak saklanır (mevcut `text` ile geri uyumlu — string ise düz metin, JSON parse edilebiliyorsa liste). Kartlarda checkbox tıklanabilir.
- **Arşiv görünümü:** `/workspace/notlar?arsiv=1` (search param), aynı sayfa, başlık değişir, "Geri yükle" butonu eklenir.
- **Geri al (undo) toast:** Sil/arşivle sonrası 5sn'lik Sonner toast, "Geri al" tıklanırsa state restore.

## 3) Belge (Docs) — `belge-editor.tsx` + `workspace.belge.$id.tsx`

Mevcut TipTap genişletilir (paket eklemeden, sadece StarterKit ve mevcut Link/Placeholder ile):
- **Toolbar genişletme:** Hizalama (sol/orta/sağ), kod bloğu, yatay çizgi, görev listesi (StarterKit'in TaskList'ini açıyoruz; zaten paket içinde).
- **Floating bubble menu:** Metin seçilince yukarıda mini formatlama bar (B/I/U/Link) — `BubbleMenu` extension StarterKit'e ait değil, **eklemeden** bunun yerine selection üzerine sticky toolbar zaten var → bu yüzden onun yerine "/" slash komutu yapıyoruz:
- **Slash menü (/):** Boş satırda `/` yazınca floating popover: Başlık 1/2/3, Liste, Sıralı liste, Alıntı, Kod, Çizgi. (Custom suggestion → ProseMirror plugin, paket gerekmez; basit DOM popover ile editor.commands çağrılır.)
- **Sayfa düzeni:** A4 hissi — `max-w-[816px]`, beyaz kart, gölge, üstte ince ruler değil ama kenar boşluğu daha geniş → Docs hissi.
- **Kelime/karakter sayacı:** sağ alt sabit küçük rozet.
- **Outline (içindekiler):** sol kolon (lg+) — H1/H2/H3 başlıklarını listeler, tıkla → smooth scroll.
- **Kaydetme rozeti:** "Drive'da kaydedildi" yerine "Buluta kaydedildi · şimdi" + zaman.

## 4) Tablo (Sheets) — `tablo-editor.tsx` + `workspace.tablo.$id.tsx`

- **Yeni kolon tipleri:**
  - `secim` (tek seçim, renkli pill — kolon ayarında seçenekler tanımlanır)
  - `cok_secim` (çoklu pill)
  - `url` (link ikonu, tıkla → yeni sekme)
  - `email`
  - `dosya` opsiyonel (sürücüden bağla — ileri faz, şimdilik atlıyoruz)
- **Hücre düzenleme:** Sheets hissi — tek tık seç (border highlight), çift tık düzenle, Enter alta git, Tab sağa git, ok tuşları gezinme.
- **Satır/kolon sürükle-bırak:** native HTML5 DnD ile yeniden sıralama (paket gerekmez). Tutamak hover'da görünür (⋮⋮).
- **Toplam satırı:** alt çizgi üstünde "Toplam" satırı — sayı kolonları için Sum/Avg/Count/Min/Max (kolon header'ından seçilebilir).
- **Sıralama & filtre:** kolon header'da küçük chevron → asc/desc; metin/sayı için filtre input.
- **Donmuş ilk kolon ve header:** `sticky` ile (yatay/dikey scroll'da kalır).
- **Hücre formülü (basit):** `=A1+B1` veya `=SUM(C:C)` mini parser (opsiyonel, ileri — şimdilik temel SUM/AVG/COUNT toplam satırına bırakılır, hücre formülü ileride).

## 5) Sürücü (Drive) — `workspace.surucu.tsx`

- **Görünüm geçişi:** Grid ↔ Liste toggle (üst sağ). Liste görünümünde tablo: ad / tip / boyut / değiştirilme / aksiyon.
- **Görsel önizleme:** image mime → kart üstünde signed URL ile thumbnail (`object-cover`, `aspect-square`).
- **Dosya önizleme dialog:** tıkla → büyük modal: image inline, pdf iframe, diğerleri için "İndir".
- **Yeniden adlandır:** dropdown menu → prompt → `mutfak_dosya.ad` update.
- **Taşı:** dropdown → klasör seç → `klasor` update.
- **Klasör silme/yeniden adlandırma:** breadcrumb yanında … menü.
- **Sıralama:** ad / tarih / boyut.
- **Kullanım çubuğu:** alt çubukta "Toplam X dosya · YY MB kullanılıyor".
- **Çoklu seçim + toplu sil/taşı.**

## 6) Pomodoro — `pomodoro-ring.tsx` + `workspace.pomodoro.tsx`

- **Ayarlar paneli:** Odak/Kısa mola/Uzun mola süreleri (varsayılan 25/5/15), `localStorage`.
- **Oturum sayacı:** Bugün tamamlanan pomodoro sayısı + 4'te bir uzun mola otomatik geçiş.
- **Görev bağlantısı:** "Şu an üzerinde çalıştığım" başlığı (input) — bittiğinde `localStorage` log'una düşer (ileride `takvim_gorev` ile bağlanabilir).
- **Bildirim & ses:** Notification API + ufak beep (Web Audio, dosya gerekmez).
- **Tam ekran modu:** "Sadece zamanlayıcı" — distraction-free.

## 7) Genel "Google hissi" dokunuşları

- Tipografi: başlıklar `tracking-tight font-semibold`, body `text-sm/relaxed` — mevcut zaten yakın, küçük ayarlar.
- Renk: Google'ın sarı/mavi/yeşil/kırmızı vurguları zaten hub gradient'lerinde var — kart hover'larında ilgili renkten çok ince halo (`ring-1 ring-{renk}/20`).
- Material-vari ripple yerine: aktif tıkla → 120ms scale-95 (Tailwind `active:scale-[0.98]`).
- Boş durumlar: Google'ın illustrasyon-light tonu — emoji + tek cümle CTA.
- Klavye kısayolları (yardım modal `?`):
  - `g h` Hub, `g n` Notlar, `g d` Belge, `g t` Tablo, `g s` Sürücü, `g p` Pomodoro
  - `c` yeni öğe (bağlama göre), `/` arama, `Esc` kapat.

## 8) Veritabanı değişiklikleri

Tek migrasyon gerekiyor:

```sql
-- Notlarda checkbox-listesi için icerik artık opsiyonel JSON da tutabilsin.
-- Mevcut text alanı korunuyor; istemcide JSON.parse dene, başarısızsa düz metin.
-- (Şema değişikliği gerekmiyor — text yeterli.)

-- Tablo kolon tipleri için sadece TS tipi genişliyor; kolonlar JSONB olduğundan DB değişmez.

-- Pomodoro için DB yok (localStorage).
```

→ **Migrasyon gerekmez.** Tüm yeni özellikler mevcut şemayla çalışır. (Notes etiketler `text[]` zaten var; Tablo `kolonlar`/`satirlar` JSONB zaten esnek.)

## 9) Yeni/değişen dosyalar (özet)

Yeni:
- `src/components/mizan/mutfak/etiket-cubuk.tsx` — Notlar etiket sidebar
- `src/components/mizan/mutfak/not-liste-icerik.tsx` — Liste tipi not içerik render/edit
- `src/components/mizan/mutfak/slash-menu.tsx` — Belge slash komut popover
- `src/components/mizan/mutfak/belge-outline.tsx` — Sol içindekiler
- `src/components/mizan/mutfak/tablo-hucre/*.tsx` — Yeni tip hücreler (secim, cok_secim, url, email)
- `src/components/mizan/mutfak/tablo-toplam.tsx` — Toplam satırı
- `src/components/mizan/mutfak/dosya-onizleme.tsx` — Drive preview modal
- `src/components/mizan/mutfak/hub-arama.tsx` — Üst arama
- `src/components/mizan/mutfak/hub-fab.tsx` — Hızlı oluştur FAB
- `src/components/mizan/mutfak/pomodoro-ayarlar.tsx` — Ayarlar paneli
- `src/lib/mutfak-kisayollar.ts` — Klavye kısayol hook'u

Değişen:
- `src/lib/mutfak-tipleri.ts` — `TabloKolonTip`'e `secim|cok_secim|url|email` ekle, `TabloKolon`'a opsiyonel `secenekler:{id,etiket,renk}[]`
- `src/components/mizan/mutfak/not-kart.tsx`, `not-composer.tsx` — etiket + liste desteği
- `src/components/mizan/mutfak/belge-editor.tsx` — toolbar + slash + sayaç
- `src/components/mizan/mutfak/tablo-editor.tsx` — yeni tip + DnD + sticky + sıralama + filtre + toplam
- `src/components/mizan/mutfak/pomodoro-ring.tsx` — ayar/sayaç/ses
- `src/routes/workspace.index.tsx` — arama + son kullanılanlar + FAB
- `src/routes/workspace.notlar.tsx` — etiket çubuk + arşiv view + toplu eylem
- `src/routes/workspace.belge.$id.tsx` — outline kolonu + A4 layout
- `src/routes/workspace.surucu.tsx` — grid/liste + preview + yeniden adlandır + toplu

## 10) Uygulama sırası (atomik adımlar)

1. **Tipleri genişlet** (`mutfak-tipleri.ts`) ve hub arama+FAB+son kullanılanlar.
2. **Notlar:** etiket sistemi + liste tipi not + arşiv view + undo toast.
3. **Belge:** TipTap toolbar genişletme + slash menü + outline + sayaç + A4 layout.
4. **Tablo:** yeni kolon tipleri + sticky + sıralama/filtre + DnD + toplam.
5. **Sürücü:** grid/liste + thumbnail + önizleme + yeniden adlandır + taşı + kullanım.
6. **Pomodoro:** ayarlar + oturum sayacı + bildirim/ses + tam ekran.
7. **Klavye kısayolları + son cila** (boş durumlar, animasyon, hover halo).

Her adım kendi başına çalışır halde teslim edilir; build her adımda yeşil kalır.

---

Onayla → sırayla uygulamaya başlıyorum.
