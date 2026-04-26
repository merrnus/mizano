import type { Database } from "@/integrations/supabase/types";

export type GundemDurum = "bekliyor" | "yapiliyor" | "yapildi" | "ertelendi";
export type GundemOncelik = "ana" | "yan";

export const GUNDEM_DURUMLAR: { id: GundemDurum; ad: string; renk: string }[] = [
  { id: "bekliyor", ad: "Bekliyor", renk: "bg-muted-foreground/40" },
  { id: "yapildi", ad: "Yapıldı", renk: "bg-[var(--maneviyat)]" },
];

export const VARSAYILAN_KATEGORILER: { ad: string; renk: string; siralama: number }[] = [
  { ad: "Evdekiler", renk: "var(--maneviyat)", siralama: 0 },
  { ad: "GG", renk: "var(--dunyevi)", siralama: 1 },
  { ad: "OMM", renk: "var(--muted-foreground)", siralama: 2 },
  { ad: "Kuran", renk: "var(--primary)", siralama: 3 },
  { ad: "Online", renk: "var(--akademi)", siralama: 4 },
];

export type Kategori = {
  id: string;
  user_id: string;
  ad: string;
  renk: string | null;
  siralama: number;
  created_at: string;
  updated_at: string;
};

export type Kisi = {
  id: string;
  user_id: string;
  ad: string;
  notlar: string | null;
  derin_takip: boolean;
  telefon: string | null;
  dogum_tarihi: string | null;
  foto_url: string | null;
  universite: string | null;
  bolum: string | null;
  sinif: string | null;
  gano: number | null;
  akademik_durum: string | null;
  ilgi_alanlari: string[];
  sorumluluk_notu: string | null;
  created_at: string;
  updated_at: string;
};

export type KisiDetay = Kisi & {
  kategori_ids: string[];
};

export type Istisare = {
  id: string;
  user_id: string;
  tarih: string;
  baslik: string;
  notlar: string | null;
  created_at: string;
  updated_at: string;
};

export type IstisareOzet = Istisare & {
  toplam_gundem: number;
  tamamlanan: number;
};

export type Gundem = {
  id: string;
  user_id: string;
  istisare_id: string;
  icerik: string;
  karar: string | null;
  deadline: string | null;
  durum: GundemDurum;
  oncelik: GundemOncelik;
  etiketler: string[];
  siralama: number;
  tamamlanma: string | null;
  created_at: string;
  updated_at: string;
};

export type GundemDetay = Gundem & {
  sorumlu_ids: string[];
  yorum_sayisi: number;
};

export type GundemYorum = {
  id: string;
  user_id: string;
  gundem_id: string;
  metin: string;
  created_at: string;
};

/* ---------------- KARDEŞ ETKİNLİK ---------------- */

export type KardesEtkinlikTip = Database["public"]["Enums"]["kardes_etkinlik_tip"];

export type KardesEtkinlik = {
  id: string;
  user_id: string;
  kisi_id: string;
  tip: KardesEtkinlikTip;
  tarih: string;
  baslik: string;
  notlar: string | null;
  sonuc: string | null;
  baslangic_saati: string | null;
  bitis_saati: string | null;
  takvim_etkinlik_id: string | null;
  created_at: string;
  updated_at: string;
};

export const ETKINLIK_TIP_LISTE: { id: KardesEtkinlikTip; ad: string; renkVar: string }[] = [
  { id: "sohbet", ad: "Sohbet", renkVar: "--mana" },
  { id: "istisare", ad: "İstişare", renkVar: "--primary" },
  { id: "kuran", ad: "Kuran", renkVar: "--mana" },
  { id: "sophia", ad: "Sophia Dersi", renkVar: "--ilim" },
  { id: "kamp", ad: "Kamp", renkVar: "--amel" },
  { id: "sinav", ad: "Sınav", renkVar: "--ilim" },
  { id: "yarisma", ad: "Yarışma", renkVar: "--amel" },
  { id: "hediye", ad: "Hediye", renkVar: "--mana" },
  { id: "gezi", ad: "Gezi", renkVar: "--amel" },
  { id: "spor", ad: "Spor", renkVar: "--amel" },
  { id: "teke_tek", ad: "Teke Tek", renkVar: "--primary" },
  { id: "dogum_gunu", ad: "Doğum Günü", renkVar: "--amel" },
  { id: "kandil", ad: "Kandil", renkVar: "--mana" },
  { id: "zoom", ad: "Zoom", renkVar: "--ilim" },
];

export const ETKINLIK_TIP_MAP: Record<KardesEtkinlikTip, { ad: string; renkVar: string }> =
  Object.fromEntries(ETKINLIK_TIP_LISTE.map((t) => [t.id, { ad: t.ad, renkVar: t.renkVar }])) as Record<
    KardesEtkinlikTip,
    { ad: string; renkVar: string }
  >;

/* ---------------- MANEVİYAT ---------------- */

export type MufredatMadde = {
  id: string;
  metin: string;
  tamamlandi: boolean;
};

export type KardesMufredat = {
  id: string;
  user_id: string;
  kisi_id: string;
  baslik: string;
  baslangic: string | null;
  bitis: string | null;
  maddeler: MufredatMadde[];
  arsiv: boolean;
  created_at: string;
  updated_at: string;
};

export type KardesEvradMadde = {
  id: string;
  user_id: string;
  kisi_id: string;
  metin: string;
  siralama: number;
  aktif: boolean;
  created_at: string;
  updated_at: string;
};

export type KardesEvradKayit = {
  id: string;
  user_id: string;
  kisi_id: string;
  madde_id: string;
  tarih: string;
  created_at: string;
};

/** Maneviyat sekmesi için "etkinlik özeti" filtresinde kullanılan tipler. */
export const MANEVIYAT_ETKINLIK_TIPLERI: KardesEtkinlikTip[] = [
  "sohbet",
  "kuran",
  "sophia",
  "kamp",
  "sinav",
  "yarisma",
  "kandil",
  "zoom",
  "istisare",
];