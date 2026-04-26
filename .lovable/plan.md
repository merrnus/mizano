# Ana Sayfa İyileştirmeleri — Flow Mode + Detaylar

Gemini'nin önerilerinden mevcut yapıyla çelişmeyen, gerçek değer katacak 3 madde.

## 1. Flow Mode (Akış Modu) — Üç alan da, ayrı oturum

**Amaç:** Çeteledeki habit'leri tek tek scroll'lamak yerine tam ekran, kart kart, odaklı bir şekilde işaretlemek.

**Tetikleyici:**
- `BugunCetelesi`'ndeki her alan başlığının (Mana / İlim / Amel) yanına küçük bir **"Akışa başla ▶"** butonu eklenir.
- Sadece o alanda **bugüne ait, henüz hedefe ulaşmamış** çetele şablonları varsa buton aktif olur. Hepsi tamamlanmışsa "Tamamlandı ✓" rozeti gösterilir.

**Yeni dosya:** `src/components/mizan/dashboard/akis-modu.tsx`
- Full-screen `Dialog` veya custom overlay (z-50, alan rengini taşıyan zarif gradient zemin)
- Tek seferde **bir kart** gösterir:
  - Alan etiketi (üstte, küçük)
  - Habit adı (büyük, başlık)
  - Hedef bilgisi ("Hedef 3 sayfa", "Hedef 20 dakika" vs.)
  - Mevcut ilerleme (varsa)
  - Büyük **"Tamamlandı"** butonu (mobile: swipe up da çalışır)
  - Alt: "Atla" / "Sonra" linki, ilerleme noktaları (1 / 8)
- Bittiğinde: "X habit tamamlandı, Y dakika sürdü" özet ekranı + "Kapat"
- Animasyonlar: kart geçişi `fade-in + slide`, tamamlama anında alan rengiyle kısa bir glow

**Veri akışı:**
- Mevcut `useSablonlar`, `useHaftaKayitlari` hook'larını kullanır
- Tamamlama → mevcut çetele kaydı insert mutasyonu (`CeteleHucre`'deki ile aynı mantık)
- React Query cache otomatik güncellenir, kapandığında dashboard taze yüzdeleri gösterir

**Edit:** `src/components/mizan/dashboard/bugun-cetelesi.tsx` — alan başlığına buton ekle, AkisModu bileşenini state ile aç/kapat.

## 2. Pill'lerde %100 Nefes Efekti

**Amaç:** Üstteki Mana/İlim/Amel pill'leri statik. Bir alan %100'e ulaştığında o pill yumuşak bir pulse/glow alır → tatmin verici, dikkat çekici ama rahatsız etmez.

**Edit:** `src/styles.css`
```css
@keyframes mizan-breath {
  0%, 100% { box-shadow: 0 0 0 1px var(--ring-color), 0 0 0 0 var(--glow-color); }
  50% { box-shadow: 0 0 0 1px var(--ring-color), 0 0 12px 2px var(--glow-color); }
}
.mizan-pill-complete { animation: mizan-breath 2.5s ease-in-out infinite; }
```

**Edit:** `src/routes/index.tsx` — pill butonuna `r.yuzde >= 100` ise `mizan-pill-complete` class'ı ekle, CSS değişkenleriyle alan rengini geçir.

## 3. Selamlamaya Zaman Bazlı İkon

**Amaç:** "Hayırlı günler, saalutlume" yanına minik, kişisel his veren bir ikon.

**Edit:** `src/routes/index.tsx`
- Saat aralığına göre:
  - 5–11: `Sun` (sarı)
  - 12–16: `Sun` (turuncu)
  - 17–20: `Sunset` (turuncu/kırmızı)
  - 21–4: `Moon` (mavi/mor)
- Selamlama metninin yanında `inline-flex` ile, küçük (h-5 w-5), yumuşak renk
- `aria-hidden` (dekoratif)

## Dokunulmayacaklar (Gemini'den reddedilenler)

- ❌ Yeni "Mizan Bar" (zaten pill'ler var)
- ❌ Navigasyon yeniden adlandırma (Merkez/İstikamet/Radar/Ufuk)
- ❌ Mutfak'ı Google Workspace'e bağlama
- ❌ İlim "Battle Room" / Amel "Skill Tree" (mevcut hedef/ders yapısı yeterli)
- ❌ OKLCH paletini sıfırdan değiştirme (mevcut açık tema bozulur)
- ❌ Haptic feedback (web'de değişken destek)

## Tahmini Etki

- Toplam ~3 yeni/edit dosya
- Düşük risk (mevcut hook ve veri yapısına müdahale yok, sadece UI katmanı)
- Yüksek tatmin (özellikle Flow Mode mobilde radikal bir UX iyileştirmesi)
