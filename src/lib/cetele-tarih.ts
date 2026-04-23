import { addDays, format, isAfter, isToday, parseISO, startOfWeek } from "date-fns";

export function haftaBaslangici(d: Date): Date {
  return startOfWeek(d, { weekStartsOn: 1 }); // Pazartesi
}

export function haftaGunleri(haftaBas: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(haftaBas, i));
}

export function tarihFormat(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

export function tarihParse(s: string): Date {
  return parseISO(s);
}

export function gecmisMi(d: Date): boolean {
  return !isToday(d) && !isAfter(d, new Date());
}

export function gelecekMi(d: Date): boolean {
  return isAfter(d, new Date()) && !isToday(d);
}

export const GUN_KISA = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

export function haftaEtiketi(haftaBas: Date): string {
  const son = addDays(haftaBas, 6);
  const sameMonth = haftaBas.getMonth() === son.getMonth();
  if (sameMonth) {
    return `${format(haftaBas, "d")}-${format(son, "d MMM")}`;
  }
  return `${format(haftaBas, "d MMM")} - ${format(son, "d MMM")}`;
}