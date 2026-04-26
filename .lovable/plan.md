# Müfredat (Amel) — İyileştirme + Seed Planı

Claude'un önerisini mevcut sisteme göre sadeleştirdim. Hiyerarşi (Alan → Kurs → Modül/Kaynak/Not) zaten doğru kurulu; sadece **eksik UI parçaları** + **bir kerelik veri ekleme** yapılacak. "Progress bug" gerçek bir bug değil (CCNA'da sadece 1 modül olduğu için %0 doğru); modüller eklenince düzelecek. "Notlar" sekmesi de zaten mevcut.

---

## 1) Şema değişikliği — yeni kaynak tipi

**Migration:** `amel_kaynak_tip` enum'una `lab` değerini ekle.

```sql
ALTER TYPE amel_kaynak_tip ADD VALUE IF NOT EXISTS 'lab';
```

`src/lib/amel-tipleri.ts` → `KAYNAK_TIP_ETIKET` map'ine `lab: "Lab"` ekle.

---

## 2) UI iyileştirmeleri

### `src/routes/mizan.amel.$id.tsx`

**a) Kaynak formu (KaynakSekmesi)**  
Zaten "link" tipi için URL var. Tipi `Select` ile seçilebilir hale getir (Video / PDF / Link / Lab / Resim / Not). Tüm tiplerde başlık + opsiyonel URL alanı bulunsun (Lab tipinde URL Packet Tracer linki olabilir).

**b) Sertifika tarihi uyarısı**  
Header'da sertifika tarihi gösterilirken, tarih bugünden geçmişse `text-amber-600` + `⚠ geçmiş tarih` rozeti göster. Tarih `Pencil` butonundan zaten düzenlenebiliyor; ek bir şey gerekmiyor.

```tsx
{kurs.sertifika_tarihi && (
  <span className={cn(
    "flex items-center gap-1",
    new Date(kurs.sertifika_tarihi) < new Date() && "text-amber-600"
  )}>
    Sertifika sınavı: {formatDate(kurs.sertifika_tarihi)}
    {new Date(kurs.sertifika_tarihi) < new Date() && (
      <Badge variant="outline" className="h-4 border-amber-500/40 text-[9px] text-amber-600">
        geçmiş
      </Badge>
    )}
  </span>
)}
```

### `src/routes/mizan.amel.index.tsx` — `ProjeForm`

**c) GitHub URL alanı**  
DB kolonu `amel_proje.repo_url` zaten var. Forma `<Input id="proje-repo" placeholder="https://github.com/..." />` ekle, kaydederken `repo_url` olarak gönder. Proje kartında varsa küçük bir GitHub linki göster.

---

## 3) Veri seed'i (bir kerelik insert)

Mevcut DB durumu: 1 alan (`ders`) + 1 kurs (`ccna`) + 1 modül.

**Strateji:** Mevcut kayıtları silmek yerine **yeniden adlandırıp** kullan, böylece varolan modülün kaybolma riski olmaz — ama eldeki tek modül muhtemelen test verisi olduğundan onu silip 26 modüllü Jeremy's IT Lab müfredatını koyacağız.

**Adımlar (sırasıyla insert tool ile):**

1. **Mevcut "ders" alanını yeniden adlandır:**
   - `ad: "Networking"`, `renk: "#3b82f6"` (mavi), `siralama: 0`
2. **Mevcut tek modülü sil**, ardından mevcut "ccna" kursunu güncelle:
   - `ad: "CCNA 200-301"`, `saglayici: "Cisco / Jeremy's IT Lab"`, `kod: "200-301"`, `durum: "izliyor"`
3. **CCNA — 26 modül ekle** (siralama 0–25, tam liste Claude'un mesajındaki sırayla):
   `Network Devices & Cables (Day 1-2)` … `Mega Lab — Final Project`
4. **CCNA — 3 kaynak ekle:**
   - Video: "Jeremy's IT Lab" → `https://youtube.com/@JeremysITLab`
   - PDF: "Official CCNA Exam Topics" → `https://learningnetwork.cisco.com/s/ccna-exam-topics`
   - Lab: "Packet Tracer Labs" (URL boş)
5. **Yeni alanlar oluştur:**
   - `Linux & System` — renk `#10b981` (yeşil), siralama 1
   - `Development` — renk `#f59e0b` (altın/amel), siralama 2
   - `Tools` — renk `#8b5cf6` (mor), siralama 3
6. **Yeni kurslar:**
   - **Linux** (Linux & System altında) → 8 modül (Terminal Fundamentals … Security & Firewall)
   - **Web Tehnici** (Development altında) → modülsüz başla
   - **Git** (Tools altında) → 4 modül (Git Basics … README & GitHub Profile)
7. **Git için 1 kaynak:** Link "Official Git Documentation" → `https://git-scm.com/doc`
8. **Projeler:** boş kalır (Claude'un isteği).

INSERT'ler `code--exec` + `psql` ile değil, `supabase--insert` (state-changing) ile yapılacak. Tüm kayıtlar `auth.uid()` yerine senin kullanıcı id'ne bağlanacak — `gundem_kisi` veya başka tablolardan user_id'yi okuyup tek bir kullanıcı için ekleyeceğim (sistemde tek kullanıcı varsa otomatik bulunur).

---

## 4) Yapılmayacaklar (Claude'un önerip de gereksiz olduğunu düşündüklerim)

- ❌ "Progress 0/1 bug fix" → bug değil; veri eklenince düzelir.
- ❌ Yeni "Notlar" sekmesi eklemek → zaten var (`NotSekmesi` + her modülün kendi notu).
- ❌ Hiyerarşiyi değiştirmek → zaten istenen yapıda.
- ❌ Tema değişikliği → cream/gold zaten kullanılıyor.

---

## Etkilenen dosyalar

- `supabase/migrations/<timestamp>_amel_kaynak_lab.sql` (yeni)
- `src/lib/amel-tipleri.ts` (KAYNAK_TIP_ETIKET'e lab eklemek)
- `src/routes/mizan.amel.$id.tsx` (kaynak formu tip seçici + sertifika uyarısı)
- `src/routes/mizan.amel.index.tsx` (ProjeForm'a repo_url alanı + kart üzerinde GitHub linki)
- DB veri insert'leri (alan/kurs/modül/kaynak)

## Onay

Onaylarsan bu sırayla uygularım. Özellikle "mevcut ccna kursunu yeniden adlandır + tek modülü sil" adımı için onayın net olmalı — eğer o tek modülde değerli bir veri varsa söyle, korurum.