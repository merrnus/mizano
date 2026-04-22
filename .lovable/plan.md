# Mizan — Denge Sistemi (v1: Görünüm Katmanı)

Bu plan **sadece frontend / görünüm**. Backend (veri saklama, auth, gerçek takip) ikinci aşamada. Şimdi tüm modüllerin iskeletini, navigasyonunu ve örnek (mock) içeriklerle çalışan halini kuracağız. Yerine oturduğunda backend'e geçeriz.

## Genel Mimari

**Çift sidebar düzeni (Vercel tarzı, ama Mizan ruhuyla):**

- **Sol sidebar — Workspace Araçları:** Tablolar, Takvim, Notlar, Tasks, Pomodoro
- **Sağ sidebar — Kişisel Hayat Alanları:** Akademi, Maneviyat, Hedefler, Kardeşler & Gündemler, İstatistik
- Her iki sidebar daraltılabilir (icon-only mod). Mobilde drawer olarak açılır.
- Üstte ince bir topbar: Mizan logosu (ortada hat ilhamlı), arama, tema toggle, hızlı + butonu.

**Stil dili:**

- Linear/Notion temeli: yumuşak kartlar, ince border, sakin tipografi (Inter)
- Mizan kimliği: ince altın aksan (#C9A961 tonu) + turkuaz vurgu (denge sembolü için)
- Açık + koyu tema, varsayılan koyu
- Bol boşluk, hızlı geçişler, mobil-uyumlu

## Sayfalar / Rotalar

### 1. `/` — Ana Sayfa (Mizan Merkez) — Hibrit düzen

- **Üst şerit:** Bugünün zaman çizelgesi (sabah/öğle/akşam) — üniversite dersleri, akşam programları, sohbetler tek satırda
- **Orta blok — Bugünün Dengesi (3 kart):** Akademi (bugünkü ders/görev), Maneviyat (bugünkü evrad), Dünyevi Hedef (bugünkü adım) — her kart "tamamlandı" işaretlenir
- **Alt blok — Haftalık Denge Isı Haritası:** 7 gün × 3 alan (maneviyat / dünyevi / akademi) renk yoğunluğuyla — bir haftaya tek bakışta dengeyi görürsün
- **Yan kolon (sağda, ana içerik içinde):** Hızlı not ekle + Pomodoro mini timer + Bugünün gündem hatırlatması

### 2. `/akademi`

- Aktif dönem dersleri + 7 borç dersi ayrı sekmeler
- Her ders kartı: ad, hoca, sınav tarihi, proje durumu, ilerleme barı
- Ders detayında: notlar, sınav takvimi, proje görevleri (mini todo)

### 3. `/maneviyat`

- **3 Aylık Müfredat sekmesi:** Hedefler (kitaplar, hatim, hıfz vb.) ilerleme barı ile
- **Haftalık Evrad-ı Ezkâr (Çetele) sekmesi:** 7 gün × ezkâr matrisi, tıklayıp işaretleme
- İkisi otomatik bağlı: müfredattaki "okunan kitap" haftalık çeteleye düşer
- Detayları sonra dolduracağın yerler placeholder olarak hazır

### 4. `/hedefler`

- Dünyevi hedefler (Networking/CCNA, Linux, vb.)
- 3 aylık + haftalık görünüm (maneviyat ile aynı yapı)
- İlerleme barı, mini günlük adımlar

### 5. `/kardesler` (Talebeler)

- 3 grup sekmesi: **Ev**, **GG (eve gelenler)**, **OMM (eve gelmeyenler)**
- Ek: **Kuran Dersi / Online Rehberlik** alt sekmesi
- Her kişi kartı: profil (akademik durum, ilgi alanları, insani notlar), faaliyet özeti, maneviyat takip durumu
- Kişi detay sayfası: Profil / Faaliyet / Maneviyat / Notlar tabları

### 6. `/gundemler`

- Gündem havuzu (kart listesi) — her gündem hangi gruba/kişiye uygulanacak işaretlenir
- Filtreler: hafta, grup, durum
- "Bu gündemi şu kişilere uygula" hızlı aksiyonu

### 7. `/takvim`

- Aylık + haftalık görünüm
- Kategoriler: Üniversite, Akşam programı, Sohbet, İstişare, Kandil, Spor, Doğum günü, Kamp
- Renkli olaylar, tıklayınca detay panel

### 8. `/notlar`

- Keep tarzı kart ızgarası, hızlı ekleme
- Etiketler, arama, sabitleme

### 9. `/tablolar`

- Sheets tarzı esnek tablo aracı (v1'de basit: ad ver, sütun ekle, satır ekle)
- Listeleme + tek tablo görünümü

### 10. `/tasks`

- Klasik görev listesi — bağlam atanabilir (akademi/maneviyat/kardeş/gündem)

### 11. `/pomodoro`

- Tam ekran pomodoro + günlük seans sayacı

### 12. `/istatistik`

- Haftalık/aylık denge grafikleri (recharts), boş durumlar şimdilik mock veri

## Ortak UI Bileşenleri

- **AppShell:** çift sidebar + topbar
- **DengeKarti:** alan özet kartı (ilerleme + mini metrik)
- **IsiHaritasi:** haftalık 7×N matris
- **HizliEkle:** her yerden + ile not/görev/hedef ekleme
- **BosDurum:** "Henüz veri yok" için sade illustrasyon + CTA

## Teknik Notlar

- TanStack Start + Tailwind v4 + shadcn (mevcut stack)
- Her modül ayrı route dosyası (SSR + SEO uygun)
- Tüm veriler v1'de mock (frontend state). Backend v2'de Lovable Cloud + RLS
- Tema: koyu varsayılan, açık opsiyonel; renk sistemi `oklch` ile altın/turkuaz aksan

## v1 Sonrası Yol Haritası (sadece referans)

1. **v2 — Backend:** Lovable Cloud, auth, gerçek veri katmanı, RLS
2. **v3 — Alışkanlık & Rutin:** önceki projeden taşıma
3. **v4 — Yapay zeka:** günlük denge önerisi, gündem üretici, özet asistanı

---

**"Implement plan" tuşuna bastığında:** Tüm route iskeletini, çift sidebar AppShell'i, ana sayfanın hibrit düzenini ve modüllerin görünür mock halini kuracağım. Sonra tek tek "şu modülü daha derin yapalım" diyerek ilerleriz.