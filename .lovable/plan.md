

# İstikamet Yenilemesi — Mana / İlim / Amel Kartları

## 1. İsimlendirme — tam değişim

URL'ler dahil her yer:

```text
ESKİ                              YENİ
─────────────────────             ──────────────────
/mizan/maneviyat                  /mizan/mana
/mizan/akademi                    /mizan/ilim
/mizan/dunyevi                    /mizan/amel

DB enum: cetele_alan
'maneviyat' / 'akademi' / 'dunyevi' → 'mana' / 'ilim' / 'amel'
('kisisel' aynı kalır)

CSS değişkenleri
--maneviyat → --mana
--akademi   → --ilim
--dunyevi   → --amel
```

Renk eşleştirmesi referans görseldeki gibi:
- **Mana** → mavi (mevcut maneviyat tonu — zaten mavi)
- **İlim** → mor (mevcut akademi yeşildi → **mora çekilir**)
- **Amel** → sarı/altın (mevcut dünyevi sarıydı — kalır)

İkonlar:
- Mana → `Sprout` (lotus/yaprak — referansa yakın)
- İlim → `BookOpen` (kitap — referansla aynı)
- Amel → `Hammer` veya `Wrench` (çekiç-anahtar — referansa yakın)

## 2. Yeni kart bileşeni: `IstikametKart`

Referans birebir:

```text
┌────────────────────────┐
│                        │
│        [glow ikon]     │
│                        │
│         Mana           │
│                        │
│         85%            │
│                        │
│   ━━━━━━━━──────       │  ← neon glow bar
└────────────────────────┘
```

- Karanlık arka plan (`bg-card`), yumuşak border
- Üstte ikon — alanın renginde, hafif `drop-shadow` glow
- İsim (medium, 14-16px), büyük yüzde (text-4xl, semibold, tracking-tight)
- Altta neon ilerleme barı: dolan kısım renk + glow, kalan kısım `bg-muted/40`
- Hover'da hafif parıltı artar, tıklanabilir → ilgili `/mizan/{alan}` sayfasına gider

## 3. Dinamik rozet — "leading area" yerine bağlamlı mikro-mesaj

Üç senaryo, tek rozet (üç kartın **üst hizasında**, ilgili kartın üstüne yapışır):

```text
1. Bir kart belirgin önde (max - others > 15%)
   → "ÖNDESİN" rozet, en yüksek kartın üstünde, o alanın renginde

2. Bir kart belirgin geride (others - min > 15%)
   → "EL VER" rozet, en düşük kartın üstünde, kırmızımsı/uyarı tonu

3. Hepsi yakın (max - min ≤ 15%)
   → "DENGEDE" rozet, ortadaki kartın üstünde, primary/nötr tonda
```

Tek satır metin. Rozet stili: ince border, `rounded-full`, küçük caps (`text-[10px] uppercase tracking-[0.2em]`), referansla aynı oval form.

## 4. Yerleştirme

### `/mizan` (asıl gösteri)

`mizan.index.tsx` üç-kart şeridi `IstikametKart` ile değişir. Mevcut `ManeviyatKart` ve `StatikKart` bileşenleri kaldırılır. Üst başlık zaten "İstikamet" — değişmez.

Sayfa görünümü:

```text
İSTİKAMET
Üç Alanın Dengesi

           [ÖNDESİN]
┌──────┐ ┌──────┐ ┌──────┐
│ Mana │ │ İlim │ │ Amel │
│ 85%  │ │ 89%  │ │ 32%  │   ← örnek; rozet hangi karta yapıştığı dinamik
└──────┘ └──────┘ └──────┘

(altında alanların kısa detayı — bugünkü ilk 2-3 kalem her alandan)
```

### `/` Bugün anasayfa — sade "burdayım" hattı

Mevcut **DengeHalkalari** kalır (asıl görsel). Onun altında **küçük 3-mini şerit**: ikon + isim + yüzde + kısa bar — rozet yok, glow zayıf, tıklanabilir. Karta gitme kısayolu gibi.

```text
Haftalık Denge
[       halkalar       ]  ← mevcut

[Mana 85%] [İlim 89%] [Amel 32%]   ← yeni mini hat, link
```

Mevcut "alan kart linkleri" listesi (Maneviyat / Akademi / Dünyevi → halkanın sağındaki dikey liste) bu mini hatla **değişir**, daha kompakt durur. Suyunu çıkarmıyoruz.

## 5. Veri modeli değişikliği

`cetele_alan` enum'a yeni 3 değer eklenir, eski veriler güncellenir, eski değerler enum'dan düşürülür.

```sql
-- 1) Yeni değerleri ekle
ALTER TYPE cetele_alan ADD VALUE 'mana';
ALTER TYPE cetele_alan ADD VALUE 'ilim';
ALTER TYPE cetele_alan ADD VALUE 'amel';

-- 2) Mevcut satırları güncelle (cetele_sablon, takvim_etkinlik, takvim_gorev)
UPDATE cetele_sablon SET alan = 'mana' WHERE alan = 'maneviyat';
UPDATE cetele_sablon SET alan = 'ilim' WHERE alan = 'akademi';
UPDATE cetele_sablon SET alan = 'amel' WHERE alan = 'dunyevi';
-- aynısı takvim tabloları için

-- 3) Eski değerleri enum'dan çıkar (PG'de zor — yeni enum yarat + migrate + swap)
```

Postgres `ENUM` değer silmeyi doğrudan desteklemediği için: yeni enum (`cetele_alan_v2`) oluştur → kolonları ona migrate et → eskisini drop et → v2'yi `cetele_alan` olarak yeniden adlandır.

## 6. Etkilenecek dosyalar

| Dosya | Değişiklik |
|---|---|
| Migration | enum swap + tüm tablolarda alan değerlerini güncelle |
| `src/lib/cetele-tipleri.ts` | `Alan` tipi `mana/ilim/amel/kisisel` olur |
| `src/lib/takvim-tipleri.ts` | aynı |
| `src/styles.css` | `--maneviyat/--akademi/--dunyevi` → `--mana/--ilim/--amel` (akademi mor olur) |
| `src/components/mizan/istikamet-kart.tsx` | YENİ — kart bileşeni |
| `src/components/mizan/istikamet-rozeti.tsx` | YENİ — dinamik rozet mantığı |
| `src/components/mizan/denge-halkalari.tsx` | renk değişkeni isimleri güncellenir |
| `src/routes/mizan.index.tsx` | yeni 3 kart + rozet |
| `src/routes/mizan.maneviyat.tsx` → `mizan.mana.tsx` | rename + iç metinler "Mana" |
| `src/routes/mizan.akademi.tsx` → `mizan.ilim.tsx` | rename |
| `src/routes/mizan.dunyevi.tsx` → `mizan.amel.tsx` | rename |
| `src/routes/index.tsx` | sağdaki alan link listesi → mini 3-kart şerit; başlıklar güncel |
| Tüm `var(--maneviyat)` vb. CSS referansları | yeni isimlerle değiştir (kapsamlı arama-değiştir) |

## 7. Sıralama

1. **Migration** — enum swap + veri güncelle (kullanıcı onayı şart)
2. **Tipler + CSS değişkenleri** — `mana/ilim/amel` her yerde yenilenir
3. **`IstikametKart` + `IstikametRozeti`** bileşenleri
4. **`/mizan` ana sayfa** yeni kartlarla yenilenir
5. **Alt rotaları rename** (`mizan.mana.tsx` vs.) + iç başlıklar
6. **Bugün anasayfa** — mevcut alan linkleri yerine mini 3-şerit
7. Eski rotalardan yenilere redirect (`/mizan/maneviyat` → `/mizan/mana`) — eski linkler kırılmasın

## Notlar

- Akademi yeşilden mora geçtiği için mevcut grafiklerde renk algısı değişir — referansa sadık kalmak istedim, ama istersen mavi-yeşil-sarı kalabilir. Kararını söyle.
- Rozet metinleri **Türkçe ve mizan diline yakın**: "ÖNDESİN / EL VER / DENGEDE". İngilizce "LEADING AREA" yerine sıcak.
- "Kisisel" alanı (takvimde kullanılan) bu üçlüye dahil değil, sadece takvim için kalmaya devam eder.
- Sayfa içeriği (içerideki ders/evrad listeleri, formlar) aynı kalır — sadece kapak ve isim yenilenir.

