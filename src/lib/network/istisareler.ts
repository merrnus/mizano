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

export function useIstisareler() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["network", "istisareler", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<IstisareOzet[]> => {
      const [iRes, gRes] = await Promise.all([
        supabase.from("istisare").select("*").order("tarih", { ascending: false }),
        supabase.from("gundem").select("istisare_id, durum"),
      ]);
      if (iRes.error) throw iRes.error;
      if (gRes.error) throw gRes.error;
      const gundemler = gRes.data ?? [];
      return (iRes.data ?? []).map((i) => {
        const sg = gundemler.filter((g) => g.istisare_id === i.id);
        return {
          ...(i as Istisare),
          toplam_gundem: sg.length,
          tamamlanan: sg.filter((g) => g.durum === "yapildi").length,
        };
      });
    },
  });
}

export function useIstisare(id: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["network", "istisare", id],
    enabled: !!user && !!id,
    queryFn: async (): Promise<Istisare | null> => {
      const { data, error } = await supabase.from("istisare").select("*").eq("id", id!).maybeSingle();
      if (error) throw error;
      return (data as Istisare) ?? null;
    },
  });
}

export function useIstisareEkle() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (k: { tarih: string; baslik?: string; notlar?: string | null }) => {
      if (!user) throw new Error("Giriş gerekli");
      const { data, error } = await supabase
        .from("istisare")
        .insert({
          user_id: user.id,
          tarih: k.tarih,
          baslik: k.baslik || `${k.tarih} İstişaresi`,
          notlar: k.notlar ?? null,
        })
        .select("id")
        .single();
      if (error) throw error;
      return data!.id as string;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["network", "istisareler"] }),
  });
}

export function useIstisareGuncelle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (k: { id: string; tarih?: string; baslik?: string; notlar?: string | null }) => {
      const { id, ...patch } = k;
      const { error } = await supabase.from("istisare").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["network", "istisareler"] });
      qc.invalidateQueries({ queryKey: ["network", "istisare", v.id] });
    },
  });
}

export function useIstisareSil() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      // Önce gündemleri sil (FK olmadığı için manuel)
      const { data: gundemler } = await supabase.from("gundem").select("id").eq("istisare_id", id);
      const ids = (gundemler ?? []).map((g) => g.id);
      if (ids.length > 0) {
        await supabase.from("gundem_sorumlu").delete().in("gundem_id", ids);
        await supabase.from("gundem_yorum").delete().in("gundem_id", ids);
        await supabase.from("gundem").delete().in("id", ids);
      }
      const { error } = await supabase.from("istisare").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["network", "istisareler"] });
      qc.invalidateQueries({ queryKey: ["network", "gundemler"] });
    },
  });
}

