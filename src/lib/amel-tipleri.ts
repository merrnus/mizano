import type { Database } from "@/integrations/supabase/types";

export type AmelAlan = Database["public"]["Tables"]["amel_alan"]["Row"];
export type AmelAlanEkle = Database["public"]["Tables"]["amel_alan"]["Insert"];
export type AmelAlanGuncelle = Database["public"]["Tables"]["amel_alan"]["Update"];

export type AmelKurs = Database["public"]["Tables"]["amel_kurs"]["Row"];
export type AmelKursEkle = Database["public"]["Tables"]["amel_kurs"]["Insert"];
export type AmelKursGuncelle = Database["public"]["Tables"]["amel_kurs"]["Update"];

export type AmelModul = Database["public"]["Tables"]["amel_modul"]["Row"];
export type AmelModulEkle = Database["public"]["Tables"]["amel_modul"]["Insert"];
export type AmelModulGuncelle = Database["public"]["Tables"]["amel_modul"]["Update"];

export type AmelKaynak = Database["public"]["Tables"]["amel_kaynak"]["Row"];
export type AmelKaynakEkle = Database["public"]["Tables"]["amel_kaynak"]["Insert"];
export type AmelKaynakGuncelle = Database["public"]["Tables"]["amel_kaynak"]["Update"];

export type AmelProje = Database["public"]["Tables"]["amel_proje"]["Row"];
export type AmelProjeEkle = Database["public"]["Tables"]["amel_proje"]["Insert"];
export type AmelProjeGuncelle = Database["public"]["Tables"]["amel_proje"]["Update"];

export type AmelProjeAdim = Database["public"]["Tables"]["amel_proje_adim"]["Row"];
export type AmelProjeAdimEkle = Database["public"]["Tables"]["amel_proje_adim"]["Insert"];
export type AmelProjeAdimGuncelle = Database["public"]["Tables"]["amel_proje_adim"]["Update"];

export type AmelKursDurum = Database["public"]["Enums"]["amel_kurs_durum"];
export type AmelKaynakTip = Database["public"]["Enums"]["amel_kaynak_tip"];
export type AmelProjeDurum = Database["public"]["Enums"]["amel_proje_durum"];

export const KURS_DURUM_ETIKET: Record<AmelKursDurum, string> = {
  planli: "Planlı",
  izliyor: "İzliyorum",
  beklemede: "Beklemede",
  tamam: "Tamamlandı",
  birakti: "Bıraktım",
};

export const PROJE_DURUM_ETIKET: Record<AmelProjeDurum, string> = {
  planli: "Planlı",
  devam: "Devam ediyor",
  beklemede: "Beklemede",
  tamam: "Tamamlandı",
  iptal: "İptal",
};

export const KAYNAK_TIP_ETIKET: Record<AmelKaynakTip, string> = {
  link: "Bağlantı",
  dosya: "Dosya",
  resim: "Resim",
  not: "Not",
  lab: "Lab",
};

export function kursIlerleme(moduller: AmelModul[]): number {
  if (moduller.length === 0) return 0;
  const tamam = moduller.filter((m) => m.tamamlandi).length;
  return Math.round((tamam / moduller.length) * 100);
}

export function projeIlerleme(adimlar: AmelProjeAdim[]): number {
  if (adimlar.length === 0) return 0;
  const tamam = adimlar.filter((a) => a.tamamlandi).length;
  return Math.round((tamam / adimlar.length) * 100);
}