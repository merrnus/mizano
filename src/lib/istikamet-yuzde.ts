import type { AmelKurs, AmelModul } from "./amel-tipleri";
import { kursIlerleme } from "./amel-tipleri";
import type { Ders, DersSinav } from "./ilim-tipleri";

/**
 * Amel yüzdesi: aktif (durum="aktif") kurslarının ortalama modül-ilerleme
 * yüzdesi. Hiç aktif kurs yoksa 0.
 */
export function amelYuzdesi(kurslar: AmelKurs[], moduller: AmelModul[]): number {
  const aktif = kurslar.filter((k) => k.durum === "aktif");
  if (aktif.length === 0) return 0;
  const toplam = aktif.reduce((acc, k) => {
    const km = moduller.filter((m) => m.kurs_id === k.id);
    return acc + kursIlerleme(km);
  }, 0);
  return Math.round(toplam / aktif.length);
}

/**
 * İlim yüzdesi: izlediğin derslerin sınavlarından (notu girilenler) geçenlerin
 * oranı. Sınav notu yoksa null döner; bu durumda UI "—" göstermeli.
 *
 * Kural: notu girilmiş (alinan_not !== null) sınavlar paydaya, geçenler
 * (alinan_not >= ders.gecme_baraji ?? 60) paya yazılır. Sadece izlenen ya da
 * restant derslerin sınavları sayılır.
 */
export function ilimYuzdesi(dersler: Ders[], sinavlar: DersSinav[]): number | null {
  const izlenenIds = new Set(
    dersler
      .filter((d) => d.durum === "izliyor" || d.durum === "restant" || d.durum === "gecti")
      .map((d) => d.id),
  );
  const dersBaraj = new Map(dersler.map((d) => [d.id, Number(d.gecme_baraji ?? 60)] as const));
  const notluSinavlar = sinavlar.filter(
    (s) => izlenenIds.has(s.ders_id) && s.alinan_not !== null && s.alinan_not !== undefined,
  );
  if (notluSinavlar.length === 0) return null;
  const gecen = notluSinavlar.filter(
    (s) => Number(s.alinan_not) >= (dersBaraj.get(s.ders_id) ?? 60),
  ).length;
  return Math.round((gecen / notluSinavlar.length) * 100);
}