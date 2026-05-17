## Mutfak Hub Redesign — Google Workspace tarzı

### Hedef
Hub'ı "her şey eşit ağırlıkta tile grid"den, **arama-merkezli, son kullanılanlar öncelikli, araçlar ikincil** bir yapıya çevirmek. Tek bakışta "ne yapacağım" net olsun.

### Mevcut problem
- 6 tile + recents + arama + FAB aynı anda göze çarpıyor
- "Yeni belge" hem FAB'da hem tile'da (çift eylem)
- Hangi araç "ana" belli değil — pomodoro ile notlar eşit ağırlıkta
- Recents küçük, oysa kullanıcı %80 oraya gidecek

### Yeni hiyerarşi (yukarıdan aşağı)

```
┌─────────────────────────────────────────┐
│  Mutfak                                 │  ← küçük başlık, eyebrow yok
│  ┌───────────────────────────────────┐  │
│  │ 🔍  Ara: not, belge, tablo…    ⌘K │  │  ← BÜYÜK, merkezi, autofocus
│  └───────────────────────────────────┘  │
│                                         │
│  Son kullanılanlar                      │  ← H2, belirgin
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐           │  ← daha büyük kartlar (h-32)
│  │belge│ │tablo│ │ not │ │belge│   →   │     yatay scroll, snap
│  └────┘ └────┘ └────┘ └────┘           │
│                                         │
│  Hızlı oluştur                          │  ← H3, küçük
│  [+ Not] [+ Belge] [+ Tablo]            │  ← chip butonlar, satır içi
│                                         │
│  Araçlar                                │  ← H3
│  ▸ Notlar          12 not, 3 sabitli   │  ← liste, ikon + sayaç
│  ▸ Belge           5 belge              │
│  ▸ Tablo           2 tablo              │
│  ▸ Sürücü          18 dosya             │
│  ▸ Pomodoro        odak süresi          │
└─────────────────────────────────────────┘
```

### Değişiklikler

**1. Arama (HubArama) öne çıkar**
- Card-like büyük arama kutusu (h-14), placeholder "Notlarda, belgelerde, tablolarda ara…"
- Sağ üstte ⌘K kısayolu rozeti
- Sayfa yüklendiğinde autofocus

**2. Son kullanılanlar büyür**
- Kart genişliği `w-44` → `w-52`, yükseklik `h-32`
- Belge için içerik önizleme satırı eklenir (ilk 60 karakter)
- "Tümünü gör →" linki sağ üstte
- Boşsa "Henüz bir şey yok, aşağıdan başlayalım" mesajı

**3. Hızlı oluştur — chip satırı (FAB'ı değiştirir)**
- FAB kaldırılır (mobil dahil); yerine sayfa içi 3 chip buton
- `[+ Yeni not] [+ Belge] [+ Tablo]` — outline button, ikon + label
- Mobilde de aynı; FAB karmaşası biter

**4. Tile grid → liste satırları**
- 6 büyük tile yerine kompakt liste:
  - sol: ikon (renkli badge, küçük)
  - orta: ad + tek satır açıklama
  - sağ: sayaç + chevron
- 5 araç, dikey liste, her satır `h-16`
- "Yakında" placeholder tile silinir (gereksiz)

**5. Header sadeleşir**
- "Mutfak" eyebrow + büyük başlık + alt yazı kalıyor ama daha küçük (text-2xl yerine değil, ama padding azalır)
- Sparkles ikonu kalır

### Teknik detaylar

**Düzenlenecek dosyalar:**
- `src/routes/workspace.index.tsx` — komple layout yeniden yazılır
- `src/components/mizan/mutfak/hub-fab.tsx` — **silinir**
- `src/components/mizan/mutfak/hub-tile.tsx` — kullanılmaz olur (silmek yerine bırakabiliriz, başka yerde kullanılırsa)
- `src/components/mizan/mutfak/hub-arama.tsx` — daha büyük variant (prop ekle veya stil güncelle)

**Yeni küçük komponentler (inline veya yeni dosya):**
- `RecentKartBuyuk` — mevcut `RecentKart`'ın büyük varyantı (workspace.index.tsx içinde inline kalabilir)
- `AracSatiri` — araç listesi satırı (inline)
- `HizliOlusturChips` — 3 chip buton (inline, mevcut hook'ları kullanır: `useNotEkle` benzeri yoksa /workspace/notlar'a yönlendir, `useBelgeEkle`, `useTabloEkle` zaten var)

**Backend / hook değişikliği:** YOK. Sadece sunum katmanı.

**⌘K kısayolu:** Bu plan kapsamında sadece görsel rozet. Gerçek global ⌘K palette ileride (öncelik 5).

### Etkilenmeyen
- `/workspace/notlar`, `/belge`, `/tablo`, `/surucu`, `/pomodoro` alt sayfaları — dokunulmaz
- Diğer Mutfak komponentleri (not-kart, not-composer, belge-editor, tablo-editor) — dokunulmaz
- Veri katmanı, RLS, tipler — dokunulmaz

### Doğrulama
- Build başarılı
- `/workspace` yüklendiğinde: arama büyük, recents belirgin, FAB yok
- Mobil viewport'ta (723px) hâlâ rahat okunur
