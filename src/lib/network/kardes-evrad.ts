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

export function useKardesEvradMaddeler(kisi_id: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["network", "evrad-madde", kisi_id],
    enabled: !!user && !!kisi_id,
    queryFn: async (): Promise<KardesEvradMadde[]> => {
      const { data, error } = await supabase
        .from("kardes_evrad_madde")
        .select("*")
        .eq("kisi_id", kisi_id!)
        .eq("aktif", true)
        .order("siralama", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as KardesEvradMadde[];
    },
  });
}

export function useKardesEvradMaddeEkle() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (v: { kisi_id: string; metin: string; siralama?: number }) => {
      if (!user) throw new Error("Giriş gerekli");
      const { error } = await supabase.from("kardes_evrad_madde").insert({
        user_id: user.id,
        kisi_id: v.kisi_id,
        metin: v.metin,
        siralama: v.siralama ?? 0,
      });
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["network", "evrad-madde", v.kisi_id] });
    },
  });
}

export function useKardesEvradMaddeGuncelle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { id: string; kisi_id: string; metin?: string; aktif?: boolean }) => {
      const { id, kisi_id: _k, ...patch } = v;
      const { error } = await supabase.from("kardes_evrad_madde").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["network", "evrad-madde", v.kisi_id] });
    },
  });
}

export function useKardesEvradMaddeSil() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { id: string; kisi_id: string }) => {
      const { error } = await supabase.from("kardes_evrad_madde").delete().eq("id", v.id);
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["network", "evrad-madde", v.kisi_id] });
      qc.invalidateQueries({ queryKey: ["network", "evrad-kayit", v.kisi_id] });
    },
  });
}

export function useKardesEvradKayitlari(
  kisi_id: string | undefined,
  baslangic: string | undefined,
  bitis: string | undefined,
) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["network", "evrad-kayit", kisi_id, baslangic, bitis],
    enabled: !!user && !!kisi_id && !!baslangic && !!bitis,
    queryFn: async (): Promise<KardesEvradKayit[]> => {
      const { data, error } = await supabase
        .from("kardes_evrad_kayit")
        .select("*")
        .eq("kisi_id", kisi_id!)
        .gte("tarih", baslangic!)
        .lte("tarih", bitis!);
      if (error) throw error;
      return (data ?? []) as KardesEvradKayit[];
    },
  });
}

export function useKardesEvradToggle() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (v: {
      kisi_id: string;
      madde_id: string;
      tarih: string;
      mevcutId: string | null;
    }) => {
      if (!user) throw new Error("Giriş gerekli");
      if (v.mevcutId) {
        const { error } = await supabase
          .from("kardes_evrad_kayit")
          .delete()
          .eq("id", v.mevcutId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("kardes_evrad_kayit").insert({
          user_id: user.id,
          kisi_id: v.kisi_id,
          madde_id: v.madde_id,
          tarih: v.tarih,
        });
        if (error) throw error;
      }
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["network", "evrad-kayit", v.kisi_id] });
    },
  });
}

/* ---------------- RAPOR ---------------- */
