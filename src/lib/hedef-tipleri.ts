import type { Database } from "@/integrations/supabase/types";
import type { CeteleAlan } from "./cetele-tipleri";

export type Hedef = Database["public"]["Tables"]["hedef"]["Row"];
export type HedefEkle = Database["public"]["Tables"]["hedef"]["Insert"];
export type HedefGuncelle = Database["public"]["Tables"]["hedef"]["Update"];
export type HedefAdim = Database["public"]["Tables"]["hedef_adim"]["Row"];
export type HedefAdimEkle = Database["public"]["Tables"]["hedef_adim"]["Insert"];

export type HedefTip = Database["public"]["Enums"]["hedef_tip"];
export type HedefDurum = Database["public"]["Enums"]["hedef_durum"];
export type StreakBirim = Database["public"]["Enums"]["streak_birim"];

export const TIP_ETIKET: Record<HedefTip, string> = {
  kurs: "Kurs / Sertifika",
  aliskanlik: "Alışkanlık",
  proje: "Proje",
  sayisal: "Sayısal",
  tekil: "Tekil",
};

export const TIP_ACIKLAMA: Record<HedefTip, string> = {
  kurs: "Modül / ders listesi ile ilerleme",
  aliskanlik: "Günlük tekrarla streak",
  proje: "Milestone'lar ile proje takibi",
  sayisal: "Hedef miktara birikim",
  tekil: "Tek seferlik yapıldı/yapılmadı",
};

export const DURUM_ETIKET: Record<HedefDurum, string> = {
  aktif: "Aktif",
  tamamlandi: "Tamamlandı",
  arsiv: "Arşiv",
};

export const ALAN_LISTESI: CeteleAlan[] = ["mana", "ilim", "amel", "kisisel"];

export function hedefIlerleme(hedef: Hedef, adimlar: HedefAdim[] = []): number {
  if (hedef.durum === "tamamlandi") return 100;
  switch (hedef.tip) {
    case "kurs":
    case "proje": {
      const ilgili = adimlar.filter((a) => a.hedef_id === hedef.id);
      if (ilgili.length === 0) return 0;
      const tamam = ilgili.filter((a) => a.tamamlandi).length;
      return Math.round((tamam / ilgili.length) * 100);
    }
    case "sayisal": {
      // birikim hesabı kayıt verisinden gelir; varsayılan 0
      return 0;
    }
    case "tekil":
      return 0;
    case "aliskanlik":
      return 0;
    default:
      return 0;
  }
}
