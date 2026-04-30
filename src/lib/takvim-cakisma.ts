import { type EtkinlikOlay } from "./takvim-hooks";

export type CakismaYerlesim = {
  olay: EtkinlikOlay;
  sutun: number;
  sutunSayisi: number;
};

/**
 * Bir gün içindeki olayları örtüşen gruplara ayırıp her birine
 * (sutun, sutunSayisi) ataması yapar. Google Calendar tipi yerleşim.
 */
export function cakismayiYerlestir(olaylar: EtkinlikOlay[]): CakismaYerlesim[] {
  const sirali = [...olaylar].sort(
    (a, b) =>
      a.olayBaslangic.getTime() - b.olayBaslangic.getTime() ||
      a.olayBitis.getTime() - b.olayBitis.getTime(),
  );

  const sonuc: CakismaYerlesim[] = [];
  let grup: EtkinlikOlay[] = [];
  let grupBitis = 0;

  const grupYerlestir = (g: EtkinlikOlay[]) => {
    // her olaya en küçük müsait sütunu ata
    const sutunBitisleri: number[] = [];
    const atamalar = new Map<string, number>();
    for (const o of g) {
      const bas = o.olayBaslangic.getTime();
      let yer = -1;
      for (let i = 0; i < sutunBitisleri.length; i++) {
        if (sutunBitisleri[i] <= bas) {
          yer = i;
          break;
        }
      }
      if (yer === -1) {
        yer = sutunBitisleri.length;
        sutunBitisleri.push(0);
      }
      sutunBitisleri[yer] = o.olayBitis.getTime();
      atamalar.set(o.id + ":" + bas, yer);
    }
    const sayi = sutunBitisleri.length;
    for (const o of g) {
      sonuc.push({
        olay: o,
        sutun: atamalar.get(o.id + ":" + o.olayBaslangic.getTime()) ?? 0,
        sutunSayisi: sayi,
      });
    }
  };

  for (const o of sirali) {
    if (grup.length === 0) {
      grup.push(o);
      grupBitis = o.olayBitis.getTime();
      continue;
    }
    if (o.olayBaslangic.getTime() < grupBitis) {
      grup.push(o);
      grupBitis = Math.max(grupBitis, o.olayBitis.getTime());
    } else {
      grupYerlestir(grup);
      grup = [o];
      grupBitis = o.olayBitis.getTime();
    }
  }
  if (grup.length > 0) grupYerlestir(grup);
  return sonuc;
}