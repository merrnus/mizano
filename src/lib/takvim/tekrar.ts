import { addDays, addMonths, addYears, isBefore, isAfter, isSameDay } from "date-fns";
import type { Etkinlik, EtkinlikOlay } from "./tipler";
import { etkinlikBitisi } from "./tipler";

/**
 * Bir etkinliği [pencereBas, pencereBit] aralığında tekrar kuralına göre genişletir.
 * Desteklenen: "yok" | "FREQ=DAILY" | "FREQ=WEEKLY" | "FREQ=WEEKLY;INTERVAL=2" |
 *  "FREQ=MONTHLY" | "FREQ=YEARLY" | özel "FREQ=DAILY;INTERVAL=N"
 */
export function genislet(
  etkinlik: Etkinlik,
  pencereBas: Date,
  pencereBit: Date,
): EtkinlikOlay[] {
  const sonuc: EtkinlikOlay[] = [];
  const bas = new Date(etkinlik.baslangic);
  const bit = etkinlikBitisi(etkinlik);
  const sure = bit.getTime() - bas.getTime();

  const kural = etkinlik.tekrar_kural;
  const tekrarBitis = etkinlik.tekrar_bitis ? new Date(etkinlik.tekrar_bitis) : null;

  if (!kural || kural === "yok") {
    if (bit >= pencereBas && bas <= pencereBit) {
      sonuc.push({ ...etkinlik, olayBaslangic: bas, olayBitis: bit });
    }
    return sonuc;
  }

  // Parse simple RRULE
  const params = new Map<string, string>();
  for (const part of kural.split(";")) {
    const [k, v] = part.split("=");
    if (k && v) params.set(k.toUpperCase(), v.toUpperCase());
  }
  const freq = params.get("FREQ") ?? "DAILY";
  const interval = Math.max(1, parseInt(params.get("INTERVAL") ?? "1", 10));

  const ilerlet = (d: Date): Date => {
    if (freq === "DAILY") return addDays(d, interval);
    if (freq === "WEEKLY") return addDays(d, 7 * interval);
    if (freq === "MONTHLY") return addMonths(d, interval);
    if (freq === "YEARLY") return addYears(d, interval);
    return addDays(d, interval);
  };

  let cur = bas;
  let safety = 0;
  while (cur <= pencereBit && safety < 1000) {
    safety++;
    if (tekrarBitis && cur > tekrarBitis) break;
    const olayBit = new Date(cur.getTime() + sure);
    if (olayBit >= pencereBas) {
      sonuc.push({ ...etkinlik, olayBaslangic: cur, olayBitis: olayBit });
    }
    cur = ilerlet(cur);
  }
  return sonuc;
}

export function genisletListe(
  etkinlikler: Etkinlik[],
  bas: Date,
  bit: Date,
): EtkinlikOlay[] {
  const sonuc: EtkinlikOlay[] = [];
  for (const e of etkinlikler) sonuc.push(...genislet(e, bas, bit));
  return sonuc;
}

export const TEKRAR_SECENEK: { id: string; etiket: string; kural: string | null }[] = [
  { id: "yok", etiket: "Tekrar etmez", kural: null },
  { id: "gunluk", etiket: "Her gün", kural: "FREQ=DAILY" },
  { id: "haftalik", etiket: "Her hafta", kural: "FREQ=WEEKLY" },
  { id: "iki-haftalik", etiket: "İki haftada bir", kural: "FREQ=WEEKLY;INTERVAL=2" },
  { id: "aylik", etiket: "Her ay", kural: "FREQ=MONTHLY" },
  { id: "yillik", etiket: "Her yıl", kural: "FREQ=YEARLY" },
];

export function kuraldanId(kural: string | null | undefined): string {
  if (!kural || kural === "yok") return "yok";
  const bulundu = TEKRAR_SECENEK.find((s) => s.kural === kural);
  return bulundu?.id ?? "ozel";
}
