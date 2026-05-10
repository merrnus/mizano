import type { Etkinlik, EtkinlikEkle } from "./tipler";

function pad(n: number) { return String(n).padStart(2, "0"); }
function toICS(d: Date) {
  return (
    d.getUTCFullYear() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    "Z"
  );
}
function esc(s: string) { return s.replace(/[\\;,]/g, (c) => "\\" + c).replace(/\n/g, "\\n"); }

export function disaAktar(etkinlikler: Etkinlik[]): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Mizan//Takvim//TR",
  ];
  for (const e of etkinlikler) {
    const bas = new Date(e.baslangic);
    const bit = e.bitis ? new Date(e.bitis) : new Date(bas.getTime() + 3600_000);
    lines.push(
      "BEGIN:VEVENT",
      `UID:${e.id}@mizan`,
      `DTSTAMP:${toICS(new Date())}`,
      `DTSTART:${toICS(bas)}`,
      `DTEND:${toICS(bit)}`,
      `SUMMARY:${esc(e.baslik)}`,
    );
    if (e.aciklama) lines.push(`DESCRIPTION:${esc(e.aciklama)}`);
    if (e.konum) lines.push(`LOCATION:${esc(e.konum)}`);
    if (e.tekrar_kural && e.tekrar_kural !== "yok") lines.push(`RRULE:${e.tekrar_kural}`);
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

export function indir(metin: string, dosyaAdi = "takvim.ics") {
  const blob = new Blob([metin], { type: "text/calendar" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = dosyaAdi;
  a.click();
  URL.revokeObjectURL(url);
}

function parseICSDate(s: string): Date {
  // 20240115T123000Z veya 20240115T123000 veya 20240115
  if (/^\d{8}$/.test(s)) {
    const y = +s.slice(0, 4), mo = +s.slice(4, 6) - 1, d = +s.slice(6, 8);
    return new Date(y, mo, d);
  }
  const m = s.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z?)$/);
  if (!m) return new Date(s);
  const [, y, mo, d, h, mi, se, z] = m;
  if (z) return new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi, +se));
  return new Date(+y, +mo - 1, +d, +h, +mi, +se);
}

export function iceAktar(metin: string, takvimId: string, userId: string): EtkinlikEkle[] {
  const lines = metin.replace(/\r\n[ \t]/g, "").split(/\r?\n/);
  const out: EtkinlikEkle[] = [];
  let cur: Partial<EtkinlikEkle> | null = null;
  let allDay = false;
  let endDate: string | null = null;
  for (const line of lines) {
    if (line === "BEGIN:VEVENT") { cur = {}; allDay = false; endDate = null; continue; }
    if (line === "END:VEVENT" && cur) {
      if (cur.baslangic && cur.baslik) {
        out.push({
          ...cur,
          baslik: cur.baslik!,
          baslangic: cur.baslangic!,
          tum_gun: allDay,
          tum_gun_bitis: allDay ? endDate : null,
          takvim_id: takvimId,
          user_id: userId,
        } as EtkinlikEkle);
      }
      cur = null; continue;
    }
    if (!cur) continue;
    const idx = line.indexOf(":");
    if (idx < 0) continue;
    const head = line.slice(0, idx); const val = line.slice(idx + 1);
    const key = head.split(";")[0];
    if (key === "SUMMARY") cur.baslik = val.replace(/\\,/g, ",").replace(/\\;/g, ";").replace(/\\n/g, "\n");
    else if (key === "DESCRIPTION") cur.aciklama = val;
    else if (key === "LOCATION") cur.konum = val;
    else if (key === "DTSTART") {
      allDay = head.includes("VALUE=DATE");
      cur.baslangic = parseICSDate(val).toISOString();
    } else if (key === "DTEND") {
      const d = parseICSDate(val);
      cur.bitis = d.toISOString();
      if (head.includes("VALUE=DATE")) endDate = val.slice(0, 4) + "-" + val.slice(4, 6) + "-" + val.slice(6, 8);
    } else if (key === "RRULE") {
      cur.tekrar_kural = val;
    }
  }
  return out;
}
