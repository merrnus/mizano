## Görevlerim listesini sadeleştir

Tek dosya değişikliği: `src/components/mizan/dashboard/gunluk-checklist.tsx`. Mantık, veri katmanı ve sıralama olduğu gibi kalır — yalnızca üst sıra ve satır içi aksiyonların görünümü değişir.

### 1) Başlık satırı

- "Şablonları yönet" linki (`Settings2` → `/mizan/mana`) **tamamen kaldırılır**. Bu liste şablonlardan bağımsız; o butonun çetele sayfasına gitmesi kafa karıştırıcıydı.
- "Sıfırla" (`RotateCcw`) butonu kalır, aynı yerde.
- "Görevlerim" başlığı kalır.
- Kullanılmayan `Link` import'u ve `Settings2` ikonu temizlenir.

Sonuç: başlık satırında sadece **Görevlerim** + (görev varsa) ↻ sıfırla.

### 2) Satır aksiyonları — tek popover

Şu an her satırda hover'la beliren 4 ayrı kontrol var: sürükle tutamacı, saat, süre, sil. Bunlar görsel olarak yoğun. Yeni davranış:

- Satırın **başlık alanına tıklamak** satırın altında küçük bir aksiyon popover'ı açar (mevcut `SurePopover` stilinde, satır altında inline).
- Popover içeriği tek satır:
  - Saat girişi (mevcut `<input type="time">` mantığı)
  - Süre seçici (mevcut `SurePopover` butonları: 5/10/15/30/45/60 + özel)
  - Sil butonu (sağda, `text-destructive`)
- Açıkken satıra tekrar tıklamak veya dışarı tıklamak popover'ı kapatır (mevcut click-outside pattern'i yeniden kullanılır).
- Saat ve süre **rozetleri** (saat varsa `09:30`, süre varsa `30 dk`) satırda sağda **her zaman** görünmeye devam eder — hover'a bağlı opaklık kalkar, kalıcı olurlar. Bunlara tıklamak da aynı popover'ı açar.
- Daire checkbox tıklaması popover'ı açmaz; sadece tamamla/geri al yapar (mevcut davranış).
- Sürükleme tutamacı (`GripVertical`) kalır ama sadece `group-hover` ile görünmeye devam eder — bu zaten sade, kullanıcı bunu kaldırmayı istemedi (yalnızca hover ikonlarını tek menüde topladık).

### 3) Temizlenecek hover-only ikonlar

Aşağıdaki "boşken görünen, hover'da beliren" butonlar **kaldırılır** (artık popover'dan ulaşılıyor):

- Saat eklemek için hover'daki `Clock` ikonu
- Süre eklemek için hover'daki `Timer` ikonu
- Hover'daki `X` sil butonu

Değer **varsa** gösterilen rozetler (saat, süre) kalır; tıklanınca popover açılır.

### Teknik notlar

- Mevcut `SurePopover` bileşeni satır-altı tam aksiyon popover'ına genişletilir (`AksiyonPopover` olarak yeniden adlandırılabilir). API genişler: `saat`, `onSaat`, ek olarak `onSil`.
- `Satir` bileşenine yerel `popoverAcik` state'i eklenir; `saatAcik` ve `sureAcik` state'leri kaldırılır.
- `Timer`, `Settings2`, `Clock` (satırdaki hover varyantı için) gibi artık kullanılmayan import'lar temizlenir. `Clock` hızlı ekleme satırının "Saat / süre" düğmesinde kullanılmaya devam ettiği için import'u korunur.
- Veritabanı, hook'lar, sıralama mantığı, tamamlananlar bölümü — **dokunulmaz**.

### Etkilenmeyen kısımlar

- `BugunFab`, `OdakKarti`, `BriefRings`, hızlı ekleme satırı (`HizliEkleSatiri`) aynen kalır.
- `/mizan/mana` sayfası ve şablon sistemi etkilenmez; sadece bu listeden oraya giden kısayol kaldırılır.
