## Hedef

Mizan'da kardeş faaliyeti (sohbet, teke-tek, kamp vb.) eklendiğinde / güncellendiğinde / silindiğinde, aynı etkinlik **Google Calendar primary** takvimine de yansısın. Tek yönlü: **Mizan → Google**.

## Yaklaşım: Workspace owner connector

- **Seçilen kapsam**: Lovable Cloud'un hazır Google Calendar connector'u kullanılır → tek bir Google hesabına (senin) bağlanır.
- **Süre**: ~30–45 dakika.
- **Sınırlama (kabul edildi)**: Bu uygulamayı kullanan herkes kendi faaliyetlerini **senin** Google takvimine yazar. Tek kullanıcı için ideal, çoklu kullanıcı için değil. İleride çoklu kullanıcı gerekirse per-user OAuth'a geçilebilir (3–5 saatlik ayrı iş).

## Planın adımları

### 1. Google Calendar connector'unu projeye bağla
- `standard_connectors--connect` ile `google_calendar` connector'u eklenir.
- Sen Google hesabınla OAuth onayını verirsin, connector secret'ları (`LOVABLE_API_KEY`, `GOOGLE_CALENDAR_API_KEY`) projeye otomatik gelir.
- Doğrulama için `verify_credentials` endpoint'i bir kez çağrılır.

### 2. Veri modeli: faaliyete saat aralığı ekle
**Kabul edilen seçim**: başlangıç + bitiş saati (iki ayrı saat alanı).

`kardes_etkinlik` tablosuna iki yeni kolon eklenir (migration):
- `baslangic_saati TIME NULL` — boşsa "saat belirsiz" anlamı taşır
- `bitis_saati TIME NULL`
- `google_event_id TEXT NULL` — Google'a yazıldığında dönen event ID burada saklanır (sonradan update/delete için şart)

Mevcut `tarih DATE` alanı korunur. Saatler boşsa Google'a all-day event olarak yazılır.

### 3. Form'a saat alanları ekle
**Dosya**: `src/components/mizan/network/kardes-faaliyet-timeline.tsx`

Mevcut "Yeni etkinlik" formuna iki opsiyonel saat input'u eklenir:
- "Başlangıç" (time input)
- "Bitiş" (time input, başlangıçtan sonra olmalı)
- Boş bırakılırsa: tüm gün etkinliği olarak Google'a yazılır
- Bitiş başlangıçtan önceyse uyarı verilir (toast)

Düzenleme akışı için aynı alanlar düzenleme modunda da görünür olur.

### 4. Server function: Google Calendar gateway proxy'si
**Yeni dosya**: `src/integrations/google-calendar.functions.ts`

İki server function (`createServerFn`, `requireSupabaseAuth` middleware ile):

- **`syncEtkinlikToGoogle({ etkinlikId })`** — etkinliği DB'den okur, Google API'ye gönderir:
  - Eğer `google_event_id` yoksa → `POST /calendars/primary/events` (yeni oluştur), dönen ID'yi DB'ye yazar.
  - Eğer `google_event_id` varsa → `PATCH /calendars/primary/events/{id}` (güncelle).
  - Saatler boşsa `start.date` / `end.date` (all-day), doluysa `start.dateTime` / `end.dateTime` + `timeZone: "Europe/Istanbul"` kullanılır.
  - Title: faaliyet başlığı + tipi (örn. "Sohbet — Ahmet ile haftalık").
  - Description: kişi adı + notlar + sonuç (varsa).
  - Hata durumunda DB'de `google_event_id` boş kalır, kullanıcıya toast ile bildirilir ama Mizan kaydı yine de oluşur (graceful degradation).

- **`deleteEtkinlikFromGoogle({ googleEventId })`** — `DELETE /calendars/primary/events/{id}`. Hata olursa sessizce yutulur (event zaten Google'da yoksa sorun değil).

Gateway URL: `https://connector-gateway.lovable.dev/google_calendar/calendar/v3/calendars/primary/events`

Headers:
```
Authorization: Bearer ${LOVABLE_API_KEY}
X-Connection-Api-Key: ${GOOGLE_CALENDAR_API_KEY}
Content-Type: application/json
```

### 5. Mizan hooks'larını sync'e bağla
**Dosya**: `src/lib/network-hooks.ts`

- `useKardesEtkinlikEkle` mutation'ı: insert başarılı olunca `syncEtkinlikToGoogle` çağrılır, dönen `google_event_id` DB'ye yazılır (update).
- `useKardesEtkinlikGuncelle` mutation'ı: update başarılı olunca aynı sync function çağrılır (PATCH yapar).
- `useKardesEtkinlikSil` mutation'ı: silmeden önce `google_event_id`'yi okuyup `deleteEtkinlikFromGoogle` çağrılır, sonra Mizan'dan silinir.

### 6. UI'da küçük gösterge
Faaliyet kartlarında, eğer `google_event_id` doluysa, küçük bir Google Calendar ikonu (lucide `Calendar`) gösterilir → "Google Takvim'de senkronize" tooltip'iyle. Doluysa kullanıcı zaman aralığını da görür.

### 7. Hata yönetimi
- Connector bağlı değilse / token süresi dolduysa: server function açıkça "Google bağlantısı yok, sadece Mizan'a kaydedildi" toast'u döndürür.
- Network/API hatası: Mizan kaydı **kesinlikle** oluşur, sadece Google sync atlanır. Kullanıcı sonradan kaydı düzenleyip yeniden tetikleyebilir.

## Tablolar / migration özeti

```sql
ALTER TABLE kardes_etkinlik
  ADD COLUMN baslangic_saati TIME NULL,
  ADD COLUMN bitis_saati TIME NULL,
  ADD COLUMN google_event_id TEXT NULL;
```

RLS değişmez (mevcut user_id politikaları yeterli). Foreign key yok.

## Kapsam dışı (bilerek)

- Çift yönlü sync (Google → Mizan): istenmedi.
- Çoklu kullanıcı / per-user OAuth: tek kullanıcı için gereksiz.
- Ayrı "Mizan - Kardeşler" takvimi: primary seçildi.
- Ayarlar sayfası: kullanıcı seçimi yok, hardcoded primary.
- Geçmişe dönük toplu sync: sadece bundan sonra eklenen/düzenlenen kayıtlar Google'a gider.

## Onay sonrası ilk adım

Plan onaylanırsa connect tool'u Google Calendar için tetiklenir, sen OAuth onayını verirsin, ardından tüm kod değişiklikleri tek seferde uygulanır.