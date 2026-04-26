export type GundemDurum = "bekliyor" | "yapiliyor" | "yapildi" | "ertelendi";
export type GundemOncelik = "ana" | "yan";

export const GUNDEM_DURUMLAR: { id: GundemDurum; ad: string; renk: string }[] = [
  { id: "bekliyor", ad: "Bekliyor", renk: "bg-muted-foreground/40" },
  { id: "yapiliyor", ad: "Yapılıyor", renk: "bg-primary" },
  { id: "yapildi", ad: "Yapıldı", renk: "bg-[var(--maneviyat)]" },
  { id: "ertelendi", ad: "Ertelendi", renk: "bg-[var(--dunyevi)]" },
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