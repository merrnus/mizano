import type { Database } from "@/integrations/supabase/types";
import type { CeteleAlan } from "./cetele-tipleri";

export type TakvimEtkinlik = Database["public"]["Tables"]["takvim_etkinlik"]["Row"];
export type TakvimEtkinlikEkle = Database["public"]["Tables"]["takvim_etkinlik"]["Insert"];
export type TakvimEtkinlikGuncelle = Database["public"]["Tables"]["takvim_etkinlik"]["Update"];

export type TakvimGorev = Database["public"]["Tables"]["takvim_gorev"]["Row"];
export type TakvimGorevEkle = Database["public"]["Tables"]["takvim_gorev"]["Insert"];
export type TakvimGorevGuncelle = Database["public"]["Tables"]["takvim_gorev"]["Update"];

export type TakvimTekrar = Database["public"]["Enums"]["takvim_tekrar"];
export type GorevOncelik = Database["public"]["Enums"]["gorev_oncelik"];

export type TakvimGorunum = "ay" | "hafta" | "gun";

export const ONCELIK_ETIKET: Record<GorevOncelik, string> = {
  dusuk: "Düşük",
  orta: "Orta",
  yuksek: "Yüksek",
};

export const TEKRAR_ETIKET: Record<TakvimTekrar, string> = {
  yok: "Tekrar yok",
  haftalik: "Her hafta",
  aylik: "Her ay",
};

/** Etkinliğin görüntülenecek bitiş zamanını döndürür (bitis null ise +1 saat). */
export function etkinlikBitisi(e: TakvimEtkinlik): Date {
  if (e.bitis) return new Date(e.bitis);
  const bas = new Date(e.baslangic);
  return new Date(bas.getTime() + 60 * 60 * 1000);
}

/** Bir alan için tailwind-uyumlu CSS değişken adı. */
export function alanRengi(alan: CeteleAlan): string {
  return `var(--${alan})`;
}