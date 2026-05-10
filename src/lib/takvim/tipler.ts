import type { Database } from "@/integrations/supabase/types";

export type Takvim = Database["public"]["Tables"]["takvim"]["Row"];
export type TakvimEkle = Database["public"]["Tables"]["takvim"]["Insert"];
export type TakvimGuncelle = Database["public"]["Tables"]["takvim"]["Update"];

export type Etkinlik = Database["public"]["Tables"]["takvim_etkinlik"]["Row"];
export type EtkinlikEkle = Database["public"]["Tables"]["takvim_etkinlik"]["Insert"];
export type EtkinlikGuncelle = Database["public"]["Tables"]["takvim_etkinlik"]["Update"];

export type Gorunum = "ay" | "hafta" | "gun" | "yil";

/** Etkinliğin (tekrar dahil) bir gerçek olayı: tarih bazlı genişletilmiş hali. */
export type EtkinlikOlay = Etkinlik & {
  olayBaslangic: Date;
  olayBitis: Date;
};

export function etkinlikBitisi(e: Etkinlik): Date {
  if (e.bitis) return new Date(e.bitis);
  const bas = new Date(e.baslangic);
  return new Date(bas.getTime() + 60 * 60 * 1000);
}
