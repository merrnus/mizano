export type NotRenk = "sari" | "pembe" | "mavi" | "yesil" | "mor" | "gri";

export const NOT_RENKLERI: { id: NotRenk; bg: string; ring: string; label: string }[] = [
  { id: "sari", bg: "bg-amber-100/70 dark:bg-amber-950/40", ring: "ring-amber-400", label: "Sarı" },
  { id: "pembe", bg: "bg-rose-100/70 dark:bg-rose-950/40", ring: "ring-rose-400", label: "Pembe" },
  { id: "mavi", bg: "bg-sky-100/70 dark:bg-sky-950/40", ring: "ring-sky-400", label: "Mavi" },
  { id: "yesil", bg: "bg-emerald-100/70 dark:bg-emerald-950/40", ring: "ring-emerald-400", label: "Yeşil" },
  { id: "mor", bg: "bg-violet-100/70 dark:bg-violet-950/40", ring: "ring-violet-400", label: "Mor" },
  { id: "gri", bg: "bg-zinc-100/70 dark:bg-zinc-900/40", ring: "ring-zinc-400", label: "Gri" },
];

export type MutfakNot = {
  id: string;
  user_id: string;
  baslik: string | null;
  icerik: string;
  renk: NotRenk;
  pinned: boolean;
  etiketler: string[];
  arsiv: boolean;
  created_at: string;
  updated_at: string;
};

export type MutfakBelge = {
  id: string;
  user_id: string;
  baslik: string;
  icerik: unknown;
  emoji: string | null;
  created_at: string;
  updated_at: string;
};

export type TabloKolonTip =
  | "metin"
  | "sayi"
  | "tarih"
  | "checkbox"
  | "secim"
  | "cok_secim"
  | "url"
  | "email";

export type TabloSecenek = {
  id: string;
  etiket: string;
  renk: string; // ör: "sky" | "amber" | "rose" | "emerald" | "violet" | "zinc"
};

export type TabloOzet = "yok" | "sum" | "avg" | "count" | "min" | "max";

export type TabloKolon = {
  id: string;
  ad: string;
  tip: TabloKolonTip;
  secenekler?: TabloSecenek[];
  ozet?: TabloOzet;
  genislik?: number;
};

export const SECENEK_RENKLERI = [
  "sky",
  "amber",
  "rose",
  "emerald",
  "violet",
  "zinc",
] as const;

export function secenekRenkSinifi(renk: string): string {
  switch (renk) {
    case "sky":
      return "bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-200";
    case "amber":
      return "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200";
    case "rose":
      return "bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-200";
    case "emerald":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200";
    case "violet":
      return "bg-violet-100 text-violet-800 dark:bg-violet-950/50 dark:text-violet-200";
    default:
      return "bg-zinc-100 text-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-200";
  }
}

export type TabloSatir = {
  id: string;
  hucreler: Record<string, string | number | boolean | null>;
};

export type MutfakTablo = {
  id: string;
  user_id: string;
  baslik: string;
  kolonlar: TabloKolon[];
  satirlar: TabloSatir[];
  created_at: string;
  updated_at: string;
};

export type MutfakDosya = {
  id: string;
  user_id: string;
  ad: string;
  mime_type: string | null;
  boyut: number;
  klasor: string;
  storage_path: string;
  created_at: string;
};
