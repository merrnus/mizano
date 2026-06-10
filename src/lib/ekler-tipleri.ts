export type EkTur = "dosya" | "link";

export type EkBaglamTuru =
  | "hedef"
  | "not"
  | "belge"
  | "ders"
  | "kurs"
  | "istisare"
  | "kisi"
  | "serbest";

export interface Ek {
  id: string;
  user_id: string;
  baglam_turu: string | null;
  baglam_id: string | null;
  tur: EkTur;
  baslik: string | null;
  storage_path: string | null;
  mime_type: string | null;
  boyut: number | null;
  url: string | null;
  aciklama: string | null;
  onizleme_url: string | null;
  favicon_url: string | null;
  site_adi: string | null;
  siralama: number;
  created_at: string;
  updated_at: string;
}

export const BAGLAM_ETIKET: Record<string, string> = {
  hedef: "Hedef",
  not: "Not",
  belge: "Belge",
  ders: "Ders",
  kurs: "Kurs",
  istisare: "İstişare",
  kisi: "Kişi",
  serbest: "Serbest",
};