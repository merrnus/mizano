## Projeler — 3 placeholder projesi seed

Projeler sekmesi zaten istediğin tüm alanlara sahip: **Başlık, Açıklama, GitHub linki (`repo_url`), Durum (Planlı/Devam/Beklemede/Tamam/İptal), İlgili Alan ve Kurs**. Yani UI tarafında değişiklik yok — sadece veritabanına 3 placeholder proje eklenecek.

### Eklenecek projeler

| Proje | Açıklama | Durum | Kurs |
|---|---|---|---|
| **CCNA Mega Lab** | Full network topology (OSPF, VLANs, STP, DHCP, Security, Wireless) | Planlı | CCNA 200-301 (Networking) |
| **Linux Network Monitor** | Python script that pings devices and logs reachability, run on Linux server | Planlı | Linux (Linux & System) |
| **University Web Project** | Node.js web project built for university course | Devam ediyor | Web Tehnici (Development) |

### Eşleşen kurs/alan ID'leri (DB'de zaten var)
- CCNA 200-301 → alan: Networking
- Linux → alan: Linux & System
- Web Tehnici → alan: Development

### Notlar
- Status mapping: "In Progress" → `devam`, "Planned" → `planli`
- `repo_url` boş bırakılacak (GitHub link henüz yok); ileride proje detayından doldurabilirsin
- Önceki planda "projeler boş başlasın" demiştin; bu istek o kuralı bilinçli olarak değiştiriyor

### Yapılacak
- Tek bir SQL `INSERT` ile 3 satır `amel_proje` tablosuna eklenecek (her satır doğru `user_id`, `alan_id`, `kurs_id`, `durum` ile).

UI veya tip dosyalarında değişiklik gerekmiyor.