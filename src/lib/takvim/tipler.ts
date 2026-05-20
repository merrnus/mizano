import type { Database } from "@/integrations/supabase/types";
import type { CeteleAlan } from "@/lib/cetele-tipleri";

export type Takvim = Database["public"]["Tables"]["takvim"]["Row"];
export type TakvimEkle = Database["public"]["Tables"]["takvim"]["Insert"];
export type TakvimGuncelle = Database["public"]["Tables"]["takvim"]["Update"];

export type Etkinlik = Database["public"]["Tables"]["takvim_etkinlik"]["Row"];
export type EtkinlikEkle = Database["public"]["Tables"]["takvim_etkinlik"]["Insert"];
export type EtkinlikGuncelle = Database["public"]["Tables"]["takvim_etkinlik"]["Update"];

/** Eski isim aliasları — dashboard widget'ları bu isimleri kullanıyor. */
export type TakvimEtkinlik = Etkinlik;
export type TakvimEtkinlikEkle = EtkinlikEkle;
export type TakvimEtkinlikGuncelle = EtkinlikGuncelle;

export type TakvimGorev = Database["public"]["Tables"]["takvim_gorev"]["Row"];
export type TakvimGorevEkle = Database["public"]["Tables"]["takvim_gorev"]["Insert"];
export type TakvimGorevGuncelle = Database["public"]["Tables"]["takvim_gorev"]["Update"];
export type TakvimTekrar = Database["public"]["Enums"]["takvim_tekrar"];
export type GorevOncelik = Database["public"]["Enums"]["gorev_oncelik"];

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

export function alanRengi(alan: CeteleAlan): string {
  return `var(--${alan})`;
}

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
