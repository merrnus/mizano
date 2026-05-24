## Amaç
Bugün ekranındaki **Esnek Görevler** bölümünü, gerçek Google Tasks hissi verecek şekilde yeniden tasarla. Mevcut "düz liste" yapısı doğru ama görsel olarak hâlâ özel/zarif bir kart gibi duruyor — Google Tasks'taki bilindik kalıbı uygulayalım.

## Yeni görünüm (Google Tasks kalıbı)

```text
┌─────────────────────────────────────────┐
│  Görevlerim                  ⋯  ⚙       │   ← kart kenarı yok; düz başlık
│  Sıralama: Saatime göre ▾               │   ← küçük gri sıralama seçici
│                                         │
│  + Bir görev ekleyin                    │   ← üstte tek satırlık ekleme
│  ─────────────────────────────          │
│  ○  Sabah istişaresi          10:00     │
│  ○  Kitap oku             ⏱ 30 dk       │
│  ○  Spor                                │
│                                         │
│  ▾  Tamamlananlar (3)                   │   ← tıklayınca açılır/kapanır
│     ⬤  Kahvaltı                         │   ← üstü çizili, soluk
│     ⬤  Sabah evradı                     │
└─────────────────────────────────────────┘
```

Kilit görsel kararlar:
- Dış kart `border`'ı ve "ESNEK GÖREVLER / Bugün ne yapacağım?" iki satırlı şık başlık kaldırılır. Yerine **tek satır**: sol başlık "Görevlerim" + sağda küçük ikon menüsü (havuz, şablonlar, sıfırla).
- Checkbox'lar daire (Tasks tarzı). Tamamlanan görev: dolu daire + üstü çizili + %50 opaklık.
- Satırlar daha geniş (`py-2.5`), arada `divide-y` yerine sade boşluk; hover'da çok hafif gri vurgu.
- Saat ve süre rozetleri sağa hizalı, mono fontla.
- **Hızlı ekleme satırı yukarıya alınır** (Google Tasks'taki gibi listenin başında); tek input + Enter ile ekler. Saat/süre kayıt için satır içi küçük ikon-butonlar (saat ikonu, ⏱ ikonu) ile aç/kapan mini popover.
- **Tamamlananlar** ayrı bir "Tamamlananlar (n)" açılır başlığı altında; varsayılan kapalı.
- Sürükleyip bırakarak sıralama: `@dnd-kit/sortable` ile aktif görevler için sürükle tutamağı (`⋮⋮`) hover'da görünür.
- Boş durumda büyük "Bir görev ekleyin" placeholder'ı + havuz butonu.

## Davranış
- Checkbox tıklandığında: anında tamamla, kısa bir gecikmeyle (~250 ms) "Tamamlananlar" grubuna kayar (mevcut optimistik akış korunur).
- Tamamlananlar bölümü `useState` ile aç/kapa; aktif görev yokken otomatik açık.
- Saat tıklanırsa inline `<input type="time">` açılır → kaybedince güncelle.
- Süre rozeti tıklanırsa küçük popover (5/10/15/30/45/60 dk hızlı seçim + özel).
- Sürükle-bırak: aktif liste içinde `siralama` alanı güncellenir (sadece saatsiz olanlar için; saatli olanlar kronolojik kalır).

## Dosyalar
- **Güncellenecek:** `src/components/mizan/dashboard/gunluk-checklist.tsx` (tam yeniden tasarım)
- **Güncellenecek:** `src/lib/gunluk-gorev.ts` — `useGunlukGorevYenidenSirala(items: {id, siralama}[])` hook'u eklenir (toplu update)
- **Bağımlılık:** `@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities` (projede yoksa eklenir)
- `index.tsx`, `havuz-sheet.tsx` değişmez

## Kapsam dışı
- Veritabanı şeması — `gunluk_gorev` tablosu olduğu gibi yeterli (saat, siralama, tamamlandi alanları zaten var).
- "Zamanlı görev = etkinlik" entegrasyonu yok.
- Bugün ekranındaki diğer kartlar (Odak, Sıradaki, Zaman Çizelgesi) bu turda değişmez.
