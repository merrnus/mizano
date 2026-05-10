import type { EtkinlikOlay } from "./tipler";

export type Yerlesim = { olay: EtkinlikOlay; sutun: number; toplam: number };

export function yerlestir(olaylar: EtkinlikOlay[]): Yerlesim[] {
  const sirali = [...olaylar].sort(
    (a, b) =>
      a.olayBaslangic.getTime() - b.olayBaslangic.getTime() ||
      a.olayBitis.getTime() - b.olayBitis.getTime(),
  );
  const sonuc: Yerlesim[] = [];
  let grup: EtkinlikOlay[] = [];
  let grupBitis = 0;

  const flush = () => {
    const sutunBitis: number[] = [];
    const atama = new Map<EtkinlikOlay, number>();
    for (const o of grup) {
      let yer = sutunBitis.findIndex((b) => b <= o.olayBaslangic.getTime());
      if (yer === -1) {
        yer = sutunBitis.length;
        sutunBitis.push(0);
      }
      sutunBitis[yer] = o.olayBitis.getTime();
      atama.set(o, yer);
    }
    const toplam = sutunBitis.length;
    for (const o of grup) sonuc.push({ olay: o, sutun: atama.get(o) ?? 0, toplam });
  };

  for (const o of sirali) {
    if (grup.length === 0) {
      grup = [o];
      grupBitis = o.olayBitis.getTime();
      continue;
    }
    if (o.olayBaslangic.getTime() < grupBitis) {
      grup.push(o);
      grupBitis = Math.max(grupBitis, o.olayBitis.getTime());
    } else {
      flush();
      grup = [o];
      grupBitis = o.olayBitis.getTime();
    }
  }
  if (grup.length) flush();
  return sonuc;
}
