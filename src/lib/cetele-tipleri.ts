import type { Database } from "@/integrations/supabase/types";

export type CeteleSablon = Database["public"]["Tables"]["cetele_sablon"]["Row"];
export type CeteleSablonEkle = Database["public"]["Tables"]["cetele_sablon"]["Insert"];
export type CeteleSablonGuncelle = Database["public"]["Tables"]["cetele_sablon"]["Update"];
export type CeteleKayit = Database["public"]["Tables"]["cetele_kayit"]["Row"];
export type CeteleKayitEkle = Database["public"]["Tables"]["cetele_kayit"]["Insert"];

export type CeteleBirim = Database["public"]["Enums"]["cetele_birim"];
export type CeteleHedefTipi = Database["public"]["Enums"]["cetele_hedef_tipi"];
export type CeteleAlan = Database["public"]["Enums"]["cetele_alan"];

export const BIRIM_ETIKET: Record<CeteleBirim, string> = {
  sayfa: "sayfa",
  adet: "adet",
  dakika: "dk",
  ikili: "",
};

export const ALAN_ETIKET: Record<CeteleAlan, string> = {
  mana: "Mana",
  ilim: "İlim",
  amel: "Amel",
  kisisel: "Kişisel",
};

export const ALAN_RENK_VAR: Record<CeteleAlan, string> = {
  mana: "--mana",
  ilim: "--ilim",
  amel: "--amel",
  kisisel: "--kisisel",
};

export type HucreDurum = "yesil" | "sari" | "kirmizi" | "bos";

export const BASLANGIC_PAKETI: Array<Omit<CeteleSablonEkle, "user_id">> = [
  { ad: "Kuran-ı Kerim", birim: "sayfa", hedef_tipi: "gunluk", hedef_deger: 3, alan: "mana", siralama: 1 },
  { ad: "Cevşen", birim: "adet", hedef_tipi: "gunluk", hedef_deger: 3, alan: "mana", siralama: 2 },
  { ad: "Risale", birim: "sayfa", hedef_tipi: "gunluk", hedef_deger: 10, alan: "mana", siralama: 3, uc_aylik_hedef: 600 },
  { ad: "Pırlanta", birim: "sayfa", hedef_tipi: "gunluk", hedef_deger: 5, alan: "mana", siralama: 4, uc_aylik_hedef: 300 },
  { ad: "Manevi kitap", birim: "sayfa", hedef_tipi: "gunluk", hedef_deger: 5, alan: "mana", siralama: 5 },
  { ad: "mp3 dinleme", birim: "dakika", hedef_tipi: "gunluk", hedef_deger: 20, alan: "mana", siralama: 6, uc_aylik_hedef: 1800 },
  { ad: "Evvâbîn", birim: "ikili", hedef_tipi: "gunluk", hedef_deger: 1, alan: "mana", siralama: 7 },
  { ad: "Virdler", birim: "adet", hedef_tipi: "gunluk", hedef_deger: 1, alan: "mana", siralama: 8 },
  { ad: "Oruç", birim: "ikili", hedef_tipi: "haftalik", hedef_deger: 2, alan: "mana", siralama: 9 },
  { ad: "Teheccüd", birim: "ikili", hedef_tipi: "haftalik", hedef_deger: 3, alan: "mana", siralama: 10 },
  { ad: "Ezber (sure/dua)", birim: "adet", hedef_tipi: "esnek", hedef_deger: 1, alan: "mana", siralama: 11, uc_aylik_hedef: 10 },
];