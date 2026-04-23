
# Menü Yeniden Adlandırma + Filtre Temizliği

İki küçük ama etkili dokunuş: kliseden uzak yeni menü isimleri ve `/network` Kişiler tabındaki gereksiz "Tümü" butonu.

## 1. Menü adlandırma

Yeni isimler — günlük dilden uzaklaşmadan, her birinin **bir niyeti** var:

```text
ESKİ                          YENİ              ANLAM
─────────────────────         ─────────         ──────────────────────────
Dashboard          /          Bugün             Şu an, anlık hâl
Kişisel Mizan      /mizan     İstikamet         Yön, kıble, kişisel ölçü
Takvim & Görevler  /takvim    Planlama          Zaman + iş düzeni
Kardeşler Ağı      /network   Rehberlik         İnsanlarla yürüme, yol arkadaşlığı
Çalışma Alanı      /workspace Mutfak            Pişirme, üretim, ortak emek
```

**Rotalar (URL'ler) aynı kalıyor** — sadece görünen etiketler değişiyor. Bu sayede mevcut linkler/redirect'ler kırılmaz, kullanıcı kafa karışıklığı yaşamaz.

### Etkilenecek yerler

| Dosya | Değişiklik |
|---|---|
| `src/components/mizan/sol-sidebar.tsx` | 5 menü öğesinin label'ları güncellenir |
| `src/components/mizan/icon-rail.tsx` | Aynı güncelleme + tooltip metinleri |
| `src/routes/index.tsx` | Üst başlıktaki "Komuta Merkezi / Dashboard" varsa "Bugün" olur |
| `src/routes/mizan.tsx` | Sayfa başlığı "Kişisel Mizan" → "İstikamet" |
| `src/routes/takvim.tsx` | Sayfa başlığı "Takvim & Görevler" → "Planlama" |
| `src/routes/network.tsx` | Sayfa başlığı "Kardeşler Ağı" → "Rehberlik" |
| `src/routes/workspace.tsx` | Sayfa başlığı "Çalışma Alanı" → "Mutfak" |
| `src/routes/__root.tsx` ve route `head()` meta'ları | `<title>` ve description'lar yeni isimlerle güncellenir |

**Dosya/route adları değişmiyor.** `mizan.tsx`, `network.tsx`, `workspace.tsx` dosya isimleri kalır — bu iç organizasyonu bozmamak için. Sadece kullanıcıya görünen metinler değişir.

### Alt rotalar (Mizan içi)

`/mizan/akademi`, `/mizan/maneviyat`, `/mizan/dunyevi` alt sekmeleri **olduğu gibi kalır** — bunlar zaten temiz isimler. Üst başlığı "İstikamet" olur, içerik değişmez.

## 2. Kişiler tabında "Tümü" kaldırma

`/network` → Kişiler sekmesindeki etiket filtresinde şu an:

```text
[Tümü (8)] [Evdekiler (3)] [GG (2)] [OMM (2)] [Kuran (3)] [Online (2)]
```

→ olacak:

```text
[Evdekiler (3)] [GG (2)] [OMM (2)] [Kuran (3)] [Online (2)]
```

**Mantık:** Hiçbir filtre seçili değilken (varsayılan durum) tüm kişiler zaten görünür — ayrı bir "Tümü" butonu gereksiz. Bir etiket seçilince filtrelenir, **aynı etikete tekrar tıklanırsa filtre kaldırılır** (toggle davranışı). Bu hem alanı temizler hem daha sezgisel olur.

### Etkilenecek dosya

- `src/routes/network.tsx` → `KisilerIcerigi` içindeki "Tümü" butonu çıkarılır, etiket butonlarının `onClick`'i toggle olacak şekilde güncellenir (`aktif === e ? "tumu" : e`). Varsayılan state `"tumu"` olarak kalır (içsel olarak "filtre yok" anlamı taşır).

## Uygulama sırası

1. Sidebar + IconRail label'ları
2. Her route'un sayfa başlığı + `head()` meta
3. `/network` Kişiler "Tümü" butonu kaldır + toggle davranışı
4. `index.tsx` varsa üst başlık güncelle

## Notlar

- **Mizan** kelimesi sidebar'dan kalkıyor ama uygulama markası olarak header/logo'da kalmaya devam ediyor — "Mizan" uygulama adı, "İstikamet" sayfa başlığı.
- "Mutfak" biraz cesur bir seçim ama tam da paylaştığın ton — birlikte bir şeyler pişirilen, atölyeden daha sıcak bir mekân hissi veriyor.
- Selamlama bileşeni hâlâ sıraya — bu küçük temizlik bittikten sonra ona dönülür.
