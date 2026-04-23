import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./auth-context";
import {
  type CeteleSablon,
  type CeteleKayit,
  type CeteleSablonEkle,
  type CeteleSablonGuncelle,
  BASLANGIC_PAKETI,
} from "./cetele-tipleri";
import { tarihFormat, haftaBaslangici, haftaGunleri } from "./cetele-tarih";
import { addDays } from "date-fns";

export function useSablonlar() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["sablonlar", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<CeteleSablon[]> => {
      const { data, error } = await supabase
        .from("cetele_sablon")
        .select("*")
        .eq("aktif", true)
        .order("siralama", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useHaftaKayitlari(haftaBas: Date) {
  const { user } = useAuth();
  const baslangic = tarihFormat(haftaBas);
  const bitis = tarihFormat(addDays(haftaBas, 6));
  return useQuery({
    queryKey: ["kayitlar", user?.id, baslangic, bitis],
    enabled: !!user,
    queryFn: async (): Promise<CeteleKayit[]> => {
      const { data, error } = await supabase
        .from("cetele_kayit")
        .select("*")
        .gte("tarih", baslangic)
        .lte("tarih", bitis);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUcAylikKayitlari(sablonIds: string[]) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["3aylik", user?.id, sablonIds.join(",")],
    enabled: !!user && sablonIds.length > 0,
    queryFn: async (): Promise<CeteleKayit[]> => {
      const baslangic = tarihFormat(addDays(new Date(), -90));
      const { data, error } = await supabase
        .from("cetele_kayit")
        .select("*")
        .in("sablon_id", sablonIds)
        .gte("tarih", baslangic);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useKayitEkle() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (k: { sablon_id: string; tarih: string; miktar: number; not_metni?: string | null }) => {
      if (!user) throw new Error("Giriş gerekli");
      const { error } = await supabase.from("cetele_kayit").insert({
        user_id: user.id,
        sablon_id: k.sablon_id,
        tarih: k.tarih,
        miktar: k.miktar,
        not_metni: k.not_metni ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["kayitlar"] });
      qc.invalidateQueries({ queryKey: ["3aylik"] });
    },
  });
}

export function useKayitSil() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("cetele_kayit").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["kayitlar"] });
      qc.invalidateQueries({ queryKey: ["3aylik"] });
    },
  });
}

export function useSablonEkle() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (s: Omit<CeteleSablonEkle, "user_id">) => {
      if (!user) throw new Error("Giriş gerekli");
      const { error } = await supabase
        .from("cetele_sablon")
        .insert({ ...s, user_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sablonlar"] }),
  });
}

export function useSablonGuncelle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: CeteleSablonGuncelle & { id: string }) => {
      const { error } = await supabase
        .from("cetele_sablon")
        .update(patch)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sablonlar"] }),
  });
}

export function useSablonSil() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("cetele_sablon")
        .update({ aktif: false })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sablonlar"] });
    },
  });
}

export function useBaslangicYukle() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Giriş gerekli");
      const rows = BASLANGIC_PAKETI.map((s) => ({ ...s, user_id: user.id }));
      const { error } = await supabase.from("cetele_sablon").insert(rows);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sablonlar"] }),
  });
}

// === Yardımcılar ===
export function gunToplami(
  kayitlar: CeteleKayit[],
  sablonId: string,
  tarih: string,
): number {
  return kayitlar
    .filter((k) => k.sablon_id === sablonId && k.tarih === tarih)
    .reduce((acc, k) => acc + Number(k.miktar), 0);
}

export function haftaToplami(kayitlar: CeteleKayit[], sablonId: string): number {
  return kayitlar
    .filter((k) => k.sablon_id === sablonId)
    .reduce((acc, k) => acc + Number(k.miktar), 0);
}

export function haftaSablonOzet(
  sablonlar: CeteleSablon[],
  kayitlar: CeteleKayit[],
  haftaBas: Date,
): { tamamlanan: number; toplam: number } {
  const gunler = haftaGunleri(haftaBas).map(tarihFormat);
  let tamamlanan = 0;
  let toplam = 0;
  for (const s of sablonlar) {
    if (s.hedef_tipi === "haftalik") {
      toplam += 1;
      const sum = haftaToplami(kayitlar, s.id);
      if (sum >= Number(s.hedef_deger)) tamamlanan += 1;
    } else if (s.hedef_tipi === "gunluk") {
      for (const g of gunler) {
        toplam += 1;
        const sum = gunToplami(kayitlar, s.id, g);
        if (sum >= Number(s.hedef_deger)) tamamlanan += 1;
      }
    }
  }
  return { tamamlanan, toplam };
}