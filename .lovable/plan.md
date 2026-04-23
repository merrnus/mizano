

# Çetele Sistemi — Plan (Güncel)

## Ana Karar: `/mizan` Hub'a Dönüşüyor

`/mizan` artık **3 büyük kart hub'ı** olur. Tab yapısı kalkar. Her alan kendi sayfasına sahip — şimdilik sadece Maneviyat detaylanır, Akademi/Dünyevi karttan tam sayfaya tıklanır ama içerikleri mevcut haliyle taşınır.

**Sebep:** Tab içinde çetele sıkışır. Üç alan eşit görsel ağırlık almalı — Mizan = denge demek. Hub yapısı bu felsefeyle uyumlu.

```text
/mizan                  → Hub: Akademi / Dünyevi / Maneviyat (3 büyük kart)
  └─ /mizan/maneviyat   → Tam çetele sayfası (yeni, zengin)
  └─ /mizan/akademi     → Mevcut ders listesi (taşınır)
  └─ /mizan/dunyevi     → Mevcut hedef listesi (taşınır)
```

Sidebar'da tek "Mizan" linki. Alt sayfalar hub kartlarından açılır.

## Hub Kartı (her alan için)

```text
┌────────────────────────────┐
│ 📖 Maneviyat               │
│                            │
│ Bu hafta: 78%              │
│ ●●●●●●●●○○ (10 evrad)      │
│                            │
│ Bugün: Kuran 2/3 sf        │
│ Sıradaki: Cevşen           │
│                            │
│           [ Detay → ]      │
└────────────────────────────┘
```

Akademi kartında: aktif ders sayısı + yaklaşan sınav. Dünyevi kartında: aktif hedef sayısı + en yakın milestone.

## Veri Modeli (Çetele)

**Şablon:**
- `ad`, `birim` (sayfa/adet/dakika/ikili), `hedef_tipi` (gunluk/haftalik), `hedef_deger`, `alan`, `aktif`, `siralama`
- Opsiyonel: `3aylik_hedef: { deger, baslangic }`

**Kayıt:**
- `sablon_id`, `tarih`, `miktar`, `not`, `olusturuldu_at`
- Aynı gün birden fazla kayıt → toplam = sum

**Renk:** Yeşil (≥min) / Sarı (yapıldı ama altı) / Kırmızı (geçmiş, hiç) / Boş (bugün/gelecek).
İkili evradlar: yeşil veya boş, kırmızı yok (opsiyonel ibadet).

## `/mizan/maneviyat` Sayfası

```text
┌──────────────────────────────────────────────────┐
│ Haftalık Çetele    [< 21-27 Nis >]  [+ Evrad]   │
├──────────────────────────────────────────────────┤
│                Pzt Sal Çar Per Cum Cmt Paz  Hed  │
│ Kuran (sf)      3   4   2   3   -   1   -   3/g │
│ Cevşen (ad)     3   5   3   -   -   -   -   3/g │
│ Risale (sf)    10   -  15  20   -   -   -  10/g │
│ Pırlanta (sf)   5   5   -   -   -   -   -   5/g │
│ Kitap (sf)      -   -  10   -   -   -   -   5/g │
│ mp3 (dk)       20  30   -  20   -   -   -  20/g │
│ Evvâbîn         ✓   ✓   ✓   -   -   ✓   -  her  │
│ Virdler         ✓   ✓   ✓   ✓   ✓   ✓   -   1/g │
│ Oruç            -   ✓   -   ✓   -   -   -   2/h │
│ Teheccüd        ✓   -   ✓   -   -   ✓   -   3/h │
├──────────────────────────────────────────────────┤
│ + Plan dışı evrad (bu hafta)                    │
└──────────────────────────────────────────────────┘

3 Aylık Bağlı Hedefler
┌──────────────────────────────────────────────────┐
│ Risale — Sözler        ████░░░░░░  240/600 sf   │
│ Pırlanta — Asrın...    ██████░░░░  180/300 sf   │
│ Manevi kitap (1 adet)  █░░░░░░░░░  Başlandı     │
│ mp3 toplam             ███░░░░░░░  9/30 saat    │
│ Ezber (sure/dua)       ██░░░░░░░░  3/10 adet    │
└──────────────────────────────────────────────────┘
```

**Hücre etkileşimi:**
- Sayısal: tek tık → popover `[- 3 +]` + not + "Yeni giriş ekle" (gün içi 2. kayıt)
- İkili: tek tık → toggle
- Geçmiş gün: hafta navigasyonu ile geri git, normal yaz

**Plan dışı evrad:** Sayfa altında "+" → şablon seç ya da tek seferlik satır (`aktif: false`, sadece bu hafta).

**3 aylık ↔ haftalık bağ:** Risale satırına yazılan her sayfa otomatik 3 aylık ilerlemeye eklenir. Tek kayıt, çift görünüm.

## Başlangıç Şablonları (Senin Verdiğin Liste)

| # | Ad | Birim | Hedef | 3 aylık |
|---|---|---|---|---|
| 1 | Kuran-ı Kerim | sayfa | 3/gün | — |
| 2 | Cevşen | adet | 3/gün | — |
| 3 | Risale | sayfa | 10/gün | 600 sf |
| 4 | Pırlanta | sayfa | 5/gün | 300 sf |
| 5 | Manevi kitap | sayfa | 5/gün | 1 kitap |
| 6 | mp3 dinleme | dakika | 20/gün | 30 saat |
| 7 | Evvâbîn | ikili | her gün | — |
| 8 | Virdler | adet | 1/gün (min) | — |
| 9 | Oruç | ikili | 2/hafta | — |
| 10 | Teheccüd | ikili | 3/hafta | — |
| 11 | Ezber | adet | esnek | 10 adet |

İlk açılışta "Başlangıç paketini yükle" butonu → bu 11 şablon eklenir, sen üstüne düzenlersin.

## Dashboard (`/`) — Çetele Bağlantısı

Mevcut "Günlük Çetele" bölümü gerçek veriden okur:
- Bugünün şablonları + haftalık hedefliler (oruç gibi)
- Tek tık → ikili toggle, sayısal +1 (uzun bas → custom)
- "Tümünü gör →" `/mizan/maneviyat`

## Veri Saklama

İki seçenek — onaydan sonra ilk soru:
- **Lovable Cloud (önerilen):** Kalıcı, çoklu cihaz, geriye dönük analiz. Tablolar: `cetele_sablon`, `cetele_kayit`.
- **localStorage:** Tek cihaz, tarayıcı temizlenince kaybolur. Bu kadar değerli veri için riskli.

## Build Adımları

1. Veri modeli + storage adapter (`src/lib/cetele-store.ts`, `src/lib/cetele-tipleri.ts`)
2. `/mizan` hub: 3 kart yapısı (`mizan.tsx` yeniden yazılır)
3. `/mizan/maneviyat`: çetele tablosu + hücre popover + hafta navigasyonu
4. `/mizan/akademi` ve `/mizan/dunyevi`: mevcut içerikler taşınır
5. Şablon yönetimi modal (`+ Evrad`)
6. Plan dışı evrad ekleme
7. 3 aylık ilerleme bloğu
8. Dashboard çetele bağlantısı
9. Başlangıç paketi seed butonu

## Teknik Dosyalar

**Yeni:**
- `src/routes/mizan.maneviyat.tsx`
- `src/routes/mizan.akademi.tsx`
- `src/routes/mizan.dunyevi.tsx`
- `src/components/mizan/cetele-tablosu.tsx`
- `src/components/mizan/cetele-hucre-popover.tsx`
- `src/components/mizan/sablon-form.tsx`
- `src/components/mizan/uc-aylik-ilerleme.tsx`
- `src/lib/cetele-store.ts`
- `src/lib/cetele-tipleri.ts`

**Değişen:**
- `src/routes/mizan.tsx` → tab yerine 3 kart hub
- `src/routes/index.tsx` → çetele bölümü gerçek veri
- `src/components/mizan/sol-sidebar.tsx` → "Mizan" tek link kalır (alt sayfalar hub'dan)

## Onaydan Sonraki İlk Soru

**Lovable Cloud mu, localStorage mı?** (Önerim: Cloud — bu veri çok değerli, tek cihaza bağlamamak gerekir.)

