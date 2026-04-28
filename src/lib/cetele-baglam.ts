// Bağlam (context) — kullanıcı tarafından yönetilen etiketler (cetele_baglam tablosu).
// cetele_sablon.baglamlar text[] içinde slug'lar tutulur.

/** Bağlam slug'ı — kullanıcı tanımlı, ama tip olarak string. */
export type BaglamId = string;

export type BaglamRenk = "sky" | "emerald" | "amber" | "violet";

export const BAGLAM_RENKLERI: readonly BaglamRenk[] = ["sky", "emerald", "amber", "violet"] as const;

/** Veri tabanından gelen bağlam tanımı (tek satır). */
export type BaglamTanim = {
  id: string;        // db row id
  slug: string;      // sablon.baglamlar[] içinde tutulan değer
  etiket: string;
  emoji: string;
  renk: BaglamRenk;
  siralama: number;
};

/** Yeni eklenen bağlama otomatik renk: mevcut sayıya göre rotasyon. */
export function siradakiRenk(mevcutSayi: number): BaglamRenk {
  return BAGLAM_RENKLERI[mevcutSayi % BAGLAM_RENKLERI.length];
}

/** Bir şablon, verilen bağlam filtresine uyuyor mu? */
export function baglamEslesir(sablonBaglamlari: string[] | null | undefined, secim: BaglamId | null): boolean {
  if (secim === null) return true; // "Hepsi"
  const liste = sablonBaglamlari ?? [];
  // Boş bağlam = "her yerde" (filtrede daima görün)
  if (liste.length === 0) return true;
  return liste.includes(secim);
}

/** Renk → soft arka plan / kenar / metin sınıfları (Tailwind, statik string). */
export const BAGLAM_SINIF: Record<
  BaglamRenk,
  { yumusakBg: string; yumusakBorder: string; metin: string; dolguBg: string; dolguMetin: string; serit: string }
> = {
  sky: {
    yumusakBg: "bg-sky-500/10",
    yumusakBorder: "border-sky-500/30",
    metin: "text-sky-700 dark:text-sky-300",
    dolguBg: "bg-sky-500/20",
    dolguMetin: "text-sky-800 dark:text-sky-100",
    serit: "bg-sky-500",
  },
  emerald: {
    yumusakBg: "bg-emerald-500/10",
    yumusakBorder: "border-emerald-500/30",
    metin: "text-emerald-700 dark:text-emerald-300",
    dolguBg: "bg-emerald-500/20",
    dolguMetin: "text-emerald-800 dark:text-emerald-100",
    serit: "bg-emerald-500",
  },
  amber: {
    yumusakBg: "bg-amber-500/10",
    yumusakBorder: "border-amber-500/30",
    metin: "text-amber-700 dark:text-amber-300",
    dolguBg: "bg-amber-500/20",
    dolguMetin: "text-amber-800 dark:text-amber-100",
    serit: "bg-amber-500",
  },
  violet: {
    yumusakBg: "bg-violet-500/10",
    yumusakBorder: "border-violet-500/30",
    metin: "text-violet-700 dark:text-violet-300",
    dolguBg: "bg-violet-500/20",
    dolguMetin: "text-violet-800 dark:text-violet-100",
    serit: "bg-violet-500",
  },
};
