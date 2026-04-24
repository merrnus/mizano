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

export type TabloKolonTip = "metin" | "sayi" | "tarih" | "checkbox";

export type TabloKolon = {
  id: string;
  ad: string;
  tip: TabloKolonTip;
};

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
