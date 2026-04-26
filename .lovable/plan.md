## Hedef

Ana sayfanın dikeyde uzamasını önle, **Görevler**'i ilk bakışta görünür kıl, **Amel** ile **İlim** kartlarını eşit ağırlıkta yan yana hizala.

## Yeni Layout (ana sayfa, `src/routes/index.tsx`)

```
┌─ Header (selamlama + Mana/İlim/Amel rozetleri) ──────────────────┐

┌─ Bugünün Çetelesi ──┬─ Zaman Çizelgesi ──┬─ Görevler (YENİ) ────┐
│ (Mana + İlim)       │ (bugünün programı) │ Bugün + gecikmiş     │
│                     │                    │ + hızlı ekle input   │
└─────────────────────┴────────────────────┴──────────────────────┘

┌─ Bugünün Müfredatı (2-KOLON GRID) ───────────────────────────────┐
│  [Amel modülü 1]              [Amel modülü 2]                    │
│  [Amel modülü 3]              [Amel modülü 4]                    │
└──────────────────────────────────────────────────────────────────┘

┌─ Gelecek Günler ─────────────────────────────────────────────────┐
┌─ Evdekiler ──────────────────────────────────────────────────────┐
```

**Grid değişikliği:**
- Mevcut: `lg:grid-cols-[5fr_7fr]` → 2 kolon
- Yeni: `lg:grid-cols-[4fr_5fr_3fr]` → 3 kolon (çetele | zaman çizelgesi | görevler)
- Mobilde (md altı): tek kolon, sırasıyla yığılır

## Yeni Bileşen: `bugun-gorevleri.tsx`

`src/components/mizan/dashboard/bugun-gorevleri.tsx` (yeni dosya)

**Veri:**
- `useGorevler(haftaBas, haftaSonu)` ile hafta görevlerini çek
- Filtre: `vade <= bugün` ve `tamamlandi === false` → "Bugün + gecikmiş"
- Bugün tamamlananları küçük "Bugün biten" sayacında göster

**UI (kompakt, ~280px genişlikte):**
```
┌─ Görevler ─────────────────── [+] ─┐
│ 2/5 · bugün                        │
├────────────────────────────────────┤
│ [GECİKMİŞ — kırmızı pill]          │
│ ☐ Vergi formu doldur · İlim · dün │
│                                    │
│ [BUGÜN]                            │
│ ☐ Kütüphane kitap iade · Mana     │
│ ☐ Toplantı notları · Amel         │
│ ☐ Spora gitmek · Kişisel · !      │
├────────────────────────────────────┤
│ ➕ Hızlı görev ekle...   [Detay]   │
└────────────────────────────────────┘
```

**Hızlı ekleme inline input:**
- `<input>` + Enter → bugün vadeli, varsayılan alan `kisisel`, `oncelik: orta` ile `useGorevEkle` çağrısı
- Boş başlık ignore
- Yanındaki "Detay" linki mevcut `GorevDialog`'u açar (alan/öncelik/vade seçilebilir)

**Etkileşim:**
- Checkbox → `useGorevGuncelle({ tamamlandi: !x })` (mevcut hook)
- Görev başlığına tıkla → tam dialog açılır
- Boş durumda: "Bugün için görev yok 🎉" + inline input

**Görsel hiyerarşi:**
- Gecikmiş görevler üstte, kırmızı sol-bordür (`border-l-2 border-destructive`)
- Bugün görevleri altta, alan rengi sol-bordür
- Yüksek öncelik için `!` rozeti (mevcut `GorevPaneli` deseni)

## `BugununMufredati` — 2-kolon grid

`src/components/mizan/dashboard/bugunun-mufredati.tsx`:
- `<ul>`'u `grid grid-cols-1 md:grid-cols-2` yap
- Her modül kartı kompaktlaştırılır (gerekirse), ama içerik aynı kalır
- Tek kart varsa full-width görünür (grid otomatik)

## Dialog state yönetimi

Ana sayfada `GorevDialog` mount'lanır:
```tsx
const [gorevDialogAcik, setGorevDialogAcik] = React.useState(false);
const [duzenlenenGorev, setDuzenlenenGorev] = React.useState<TakvimGorev | null>(null);

<GorevDialog
  acik={gorevDialogAcik}
  onOpenChange={setGorevDialogAcik}
  gorev={duzenlenenGorev}
  varsayilanVade={isoGun(simdi)}
/>
```

`BugunGorevleri` bileşenine `onYeni` ve `onDuzenle` prop'ları geçilir.

## Dosya değişiklikleri

**Yeni:**
- `src/components/mizan/dashboard/bugun-gorevleri.tsx`

**Düzenlenecek:**
- `src/routes/index.tsx` — grid 3-kolon, GorevDialog mount, BugunGorevleri yerleştir
- `src/components/mizan/dashboard/bugunun-mufredati.tsx` — liste → 2-kolon grid

## Edge case'ler

- **Görev yok:** "Bugün için görev yok 🎉" + inline ekleme
- **Mobil (<lg):** 3 kolon → 1 kolon, sırasıyla: Çetele → Zaman çizelgesi → Görevler → Müfredat
- **Çok dar viewport (849px tablet):** `lg:` breakpoint 1024'te aktif olduğu için zaten tek kolon (mevcut davranışa benzer)
- **Hızlı ekleme:** Boş input Enter'a basılırsa hiçbir şey yapmaz; başarılı eklemede input temizlenir
- **`varsayilanVade`:** GorevDialog'un mevcut prop'larını kontrol et, gerekirse minimal genişletme yapılır

## Sonuç

- Mana, İlim, Görevler tek satırda yan yana → "bugün ne yapacağım" sorusunun tam cevabı tek bakışta
- Amel müfredatı 2-kolon grid → ilim ve amelin görsel ağırlığı eşitlenir
- Sayfa dikeyde ~%30 daha kısa, kaydırma azalır
- Hem hızlı ekleme (inline) hem detaylı ekleme (dialog) mevcut