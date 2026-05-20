import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import {
  type Kategori,
  type Kisi,
  type KisiDetay,
  type Istisare,
  type IstisareOzet,
  type Gundem,
  type GundemDetay,
  type GundemYorum,
  type GundemDurum,
  type GundemOncelik,
  type KardesEtkinlik,
  type KardesEtkinlikTip,
  type KardesMufredat,
  type KardesEvradMadde,
  type KardesEvradKayit,
  type MufredatMadde,
  VARSAYILAN_KATEGORILER,
} from "@/lib/network-tipleri";

/* ---------------- KATEGORI ---------------- */

export function useKategoriler() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useQuery({
    queryKey: ["network", "kategoriler", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Kategori[]> => {
      const { data, error } = await supabase
        .from("gundem_kategori")
        .select("*")
        .order("siralama", { ascending: true });
      if (error) throw error;
      // Seed varsayılanlar
      if (!data || data.length === 0) {
        const rows = VARSAYILAN_KATEGORILER.map((k) => ({
          user_id: user!.id,
          ad: k.ad,
          renk: k.renk,
          siralama: k.siralama,
        }));
        const { data: yeni, error: e2 } = await supabase
          .from("gundem_kategori")
          .insert(rows)
          .select("*");
        if (e2) throw e2;
        qc.invalidateQueries({ queryKey: ["network", "kategoriler"] });
        return (yeni ?? []) as Kategori[];
      }
      return data as Kategori[];
    },
  });
}

export function useKategoriEkle() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (k: { ad: string; renk?: string | null; siralama?: number }) => {
      if (!user) throw new Error("Giriş gerekli");
      const { error } = await supabase.from("gundem_kategori").insert({
        user_id: user.id,
        ad: k.ad,
        renk: k.renk ?? null,
        siralama: k.siralama ?? 99,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["network", "kategoriler"] }),
  });
}

export function useKategoriGuncelle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (k: { id: string; ad?: string; renk?: string | null; siralama?: number }) => {
      const { id, ...patch } = k;
      const { error } = await supabase.from("gundem_kategori").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["network", "kategoriler"] }),
  });
}

export function useKategoriSil() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("gundem_kategori").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["network", "kategoriler"] });
      qc.invalidateQueries({ queryKey: ["network", "kisiler"] });
    },
  });
}

/* ---------------- KISI ---------------- */
