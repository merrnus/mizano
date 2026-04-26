## Hedef
Ana sayfadaki **Bugünün Zaman Çizelgesi** bileşenini üç açıdan iyileştirmek:

**A. Etkinlik tıklaması** → tam sayfa `/takvim`'e gitmek yerine **sağdan açılan yarım ekran sheet** ile detay/düzenleme. Sheet içinde mevcut `EtkinlikDialog` mantığı yer alır (başlık, saat, alan, konum, sil/güncelle).

**B. Görev davranışı:**
- Sol noktanın yerine **checkbox** → tıklayınca `useGorevGuncelle` ile `tamamlandi` toggle.
- **Tamamlanan görevler en alta** sıralanır (tamamlanma sırasına göre — `updated_at` desc), soluk (`opacity-50`) ve `line-through` ile gösterilir.
- Görev satırına tıklayınca aynı pattern: **sağdan sheet** açılır, mevcut `GorevDialog` form mantığı içinde (vade/öncelik/alan/sil/güncelle).

**C. Görsel:** Şu an `bugun-zaman-cizelgesi.tsx`'te `absolute left-[1.85rem] top-6 bottom-6 w-px bg-border` ile çizilen **dikey rail** etkinlikler için anlamlı (zaman akışı), ama **görevlerin (Bugünkü Görevler bölümü) sol kenarından da geçiyor** ve görsel olarak hoş durmuyor. Görevler bölümü zaten ayrı bir blok (border-t ile ayrılmış) — rail'in görevlere uzamaması gerekiyor.

---

## Yapılacak değişiklikler

### 1. Yeni dosya: `src/components/mizan/dashboard/etkinlik-detay-sheet.tsx`
Mevcut `EtkinlikDialog`'un içeriğini `Sheet` (sağdan, `side="right"`, `w-full sm:max-w-md`) içine taşır. **Mevcut `EtkinlikDialog`'u silmiyoruz** — takvim sayfasında kullanılmaya devam edebilir; ama bu yeni sheet detay/düzenleme için ana sayfadan kullanılacak.

Aslında daha temiz yol: **`EtkinlikDialog`'a `varyant?: "dialog" | "sheet"` prop'u eklemek yerine**, ayrı bir sheet bileşeni kuralım çünkü:
- Sheet zaten ana sayfada kullanılıyor (`AlanDetaySheet`)
- `Dialog` modal etkinlik **ekleme** için uygun (kısa form), Sheet detay **görüntüleme/düzenleme** için uygun (geniş alan + okunaklı)

Yeni dosya `EtkinlikDetaySheet` içerir:
- Aynı form alanları (başlık, tüm gün, başlangıç/bitiş, alan, tekrar, konum, açıklama)
- Üstte küçük "Takvime git" linki (`<Link to="/takvim">`) — kullanıcı isterse tam sayfaya geçer
- Footer: Sil (sol) + İptal/Güncelle (sağ)

### 2. Yeni dosya: `src/components/mizan/dashboard/gorev-detay-sheet.tsx`
Aynı yaklaşım `GorevDialog` için. Form alanları: başlık, vade, öncelik, alan, açıklama, tamamlandı toggle.

### 3. `src/components/mizan/dashboard/bugun-zaman-cizelgesi.tsx` — ana değişiklikler

**Props:**
```ts
type Props = {
  simdi: Date;
};
```
İçeride state ile sheet'ler kontrol edilir (kendi içinde — parent'a state dağıtmaya gerek yok).

**Görev veri akışı:**
- `useGorevler` ile bugün vadeli görevler alınıyor (mevcut)
- `useGorevGuncelle` import et → checkbox `onChange` → `tamamlandi` toggle
- Sıralama: `tamamlanmamış (alfabetik/öncelik) → tamamlanmış (updated_at desc)`

**Sıralama snippet'i:**
```ts
const siraliGorevler = React.useMemo(() => {
  const acik = bugunGorevleri.filter((g) => !g.tamamlandi);
  const kapali = bugunGorevleri
    .filter((g) => g.tamamlandi)
    .sort((a, b) =>
      new Date(b.updated_at ?? 0).getTime() - new Date(a.updated_at ?? 0).getTime(),
    );
  return [...acik, ...kapali];
}, [bugunGorevleri]);
```

**Etkinlik kartı:** `<Link to="/takvim">` kaldır → `<button onClick={() => setSecilenEtkinlik(o)}>` yap. Sheet açılır.

**Görev satırı:** `<li>` içinde:
- Sol: `<Checkbox checked={g.tamamlandi} onCheckedChange={(v) => guncelle.mutate({...})} />` (renkli alan dot'u checkbox border'ı olarak kalabilir veya yanına küçük dot eklenir)
- Orta: başlık (tamamlandıysa `line-through opacity-60`)
- Sağ: öncelik etiketi
- Tüm satır click → görev sheet'i açılır (checkbox tıklamasını `e.stopPropagation()` ile ayır)

**Rail çizgisi düzeltmesi (C):**
Mevcut:
```tsx
<div className="absolute left-[1.85rem] top-6 bottom-6 w-px bg-border" />
```
Bu rail tüm `relative px-5 py-5` container'ı kapsadığı için görev bloğunun (border-t ile ayrılan) içinden de geçiyor.

**Çözüm:** Rail'i sadece etkinlik `<ul>`'unu saran ayrı bir `relative` container içine taşı:
```tsx
<div className="relative">
  <div className="absolute left-[1.85rem] top-3 bottom-3 w-px bg-border" />
  <ul>...etkinlikler...</ul>
</div>
{bugunGorevleri.length > 0 && (
  <div className="mt-5 border-t border-border pt-4">
    {/* Görevler — rail YOK */}
  </div>
)}
```

### 4. `src/routes/index.tsx` — sadeleştirme
- `BugunZamanCizelgesi` kendi sheet'lerini yönettiği için artık `GorevDialog` ve `EtkinlikDialog` dialog'larını ana sayfada tutmaya gerek var mı? **Evet, kalsın** — çünkü ana sayfadaki "Görev ekle" / "Etkinlik ekle" butonları bunları açıyor (yeni kayıt için dialog yine uygun, hızlı ekleme).
- Yani `index.tsx` değişmez (veya minimal). Sheet'ler sadece zaman çizelgesi içinde detay/düzenleme akışında kullanılır.

---

## Açık karar (varsayım yapıyorum, beğenmezsen söyle)

**Sheet vs Dialog tutarlılığı:** "Yeni ekle" akışı dialog (orta), "düzenle" akışı sheet (sağdan). Bu **bilinçli bir UX ayrımı** — yeni kayıt hızlı ve modal, düzenleme bağlamı koruyarak yan panelde. Eğer ikisinin de sheet olmasını istersen söyle, ana sayfadaki "Görev/Etkinlik ekle" butonları da sheet açacak şekilde ayarlarım.

**Tamamlanan görevlerin sırası:** Tamamlanma sırasına göre (en son tamamlanan en üstte, tamamlananlar arasında). Veritabanında `tamamlandi_at` alanı yok — `updated_at` proxy olarak kullanılır (görev güncellenince `updated_at` Supabase trigger ile değişiyor varsayımıyla). Eğer `takvim_gorev` tablosunda `updated_at` yoksa, basit "tamamlananlar en altta, kendi içinde alfabetik" sıralama kullanırım.

---

## Dosya özeti
- **Yeni:** `src/components/mizan/dashboard/etkinlik-detay-sheet.tsx`
- **Yeni:** `src/components/mizan/dashboard/gorev-detay-sheet.tsx`
- **Düzenle:** `src/components/mizan/dashboard/bugun-zaman-cizelgesi.tsx` (checkbox, sıralama, sheet entegrasyonu, rail düzeltmesi)
- **Değişmez:** `src/routes/index.tsx` (mevcut "ekle" dialog'ları korunur)