import type { Database } from "@/integrations/supabase/types";

export type Ders = Database["public"]["Tables"]["ders"]["Row"];
export type DersEkle = Database["public"]["Tables"]["ders"]["Insert"];
export type DersGuncelle = Database["public"]["Tables"]["ders"]["Update"];

export type DersSinav = Database["public"]["Tables"]["ders_sinav"]["Row"];
export type DersSinavEkle = Database["public"]["Tables"]["ders_sinav"]["Insert"];
export type DersSinavGuncelle = Database["public"]["Tables"]["ders_sinav"]["Update"];

export type DersProje = Database["public"]["Tables"]["ders_proje"]["Row"];
export type DersProjeEkle = Database["public"]["Tables"]["ders_proje"]["Insert"];
export type DersProjeGuncelle = Database["public"]["Tables"]["ders_proje"]["Update"];

export type DersKaynak = Database["public"]["Tables"]["ders_kaynak"]["Row"];
export type DersKaynakEkle = Database["public"]["Tables"]["ders_kaynak"]["Insert"];
export type DersKaynakGuncelle = Database["public"]["Tables"]["ders_kaynak"]["Update"];

export type DersSaat = Database["public"]["Tables"]["ders_saat"]["Row"];
export type DersSaatEkle = Database["public"]["Tables"]["ders_saat"]["Insert"];
export type DersSaatGuncelle = Database["public"]["Tables"]["ders_saat"]["Update"];

export type DersDurum = Database["public"]["Enums"]["ders_durum"];
export type DersSinavTip = Database["public"]["Enums"]["ders_sinav_tip"];
export type DersKaynakTip = Database["public"]["Enums"]["ders_kaynak_tip"];
export type HaftaGun = Database["public"]["Enums"]["hafta_gun"];

export const DERS_DURUM_ETIKET: Record<DersDurum, string> = {
  izliyor: "İzliyor",
  birakti: "Bıraktı",
  gecti: "Geçti",
  restant: "Restant",
};

export const SINAV_TIP_ETIKET: Record<DersSinavTip, string> = {
  vize: "Vize",
  final: "Final",
  quiz: "Quiz",
  odev: "Ödev",
  proje: "Proje",
  butunleme: "Bütünleme",
};

export const KAYNAK_TIP_ETIKET: Record<DersKaynakTip, string> = {
  link: "Link",
  dosya: "Dosya",
  resim: "Resim",
  not: "Not",
};

export const HAFTA_GUN_ETIKET: Record<HaftaGun, string> = {
  pazartesi: "Pzt",
  sali: "Sal",
  carsamba: "Çar",
  persembe: "Per",
  cuma: "Cum",
  cumartesi: "Cmt",
  pazar: "Paz",
};

export const HAFTA_GUN_TAM: Record<HaftaGun, string> = {
  pazartesi: "Pazartesi",
  sali: "Salı",
  carsamba: "Çarşamba",
  persembe: "Perşembe",
  cuma: "Cuma",
  cumartesi: "Cumartesi",
  pazar: "Pazar",
};

export const HAFTA_GUN_LISTESI: HaftaGun[] = [
  "pazartesi",
  "sali",
  "carsamba",
  "persembe",
  "cuma",
  "cumartesi",
  "pazar",
];

/** JS Date.getDay() (0=pazar) → bizim enum sırası */
export function jsGununEnumu(jsGun: number): HaftaGun {
  // 0=pazar,1=pzt..6=cmt
  return ["pazar", "pazartesi", "sali", "carsamba", "persembe", "cuma", "cumartesi"][jsGun] as HaftaGun;
}