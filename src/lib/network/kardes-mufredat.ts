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

export function useKardesMufredatAktif(kisi_id: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["network", "mufredat", kisi_id],
    enabled: !!user && !!kisi_id,
    queryFn: async (): Promise<KardesMufredat | null> => {
      const { data, error } = await supabase
        .from("kardes_mufredat")
        .select("*")
        .eq("kisi_id", kisi_id!)
        .eq("arsiv", false)
        .order("created_at", { ascending: false })
        .limit(1);
      if (error) throw error;
      const row = (data ?? [])[0];
      if (!row) return null;
      return {
        ...row,
        maddeler: Array.isArray(row.maddeler) ? (row.maddeler as MufredatMadde[]) : [],
      } as KardesMufredat;
    },
  });
}

export function useKardesMufredatKaydet() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (m: {
      id?: string;
      kisi_id: string;
      baslik?: string;
      baslangic?: string | null;
      bitis?: string | null;
      maddeler?: MufredatMadde[];
    }) => {
      if (!user) throw new Error("Giriş gerekli");
      if (m.id) {
        const patch: {
          baslik?: string;
          baslangic?: string | null;
          bitis?: string | null;
          maddeler?: MufredatMadde[];
        } = {};
        if (m.baslik !== undefined) patch.baslik = m.baslik;
        if (m.baslangic !== undefined) patch.baslangic = m.baslangic;
        if (m.bitis !== undefined) patch.bitis = m.bitis;
        if (m.maddeler !== undefined) patch.maddeler = m.maddeler;
        const { error } = await supabase.from("kardes_mufredat").update(patch).eq("id", m.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("kardes_mufredat").insert({
          user_id: user.id,
          kisi_id: m.kisi_id,
          baslik: m.baslik ?? "3 Aylık Hedef",
          baslangic: m.baslangic ?? null,
          bitis: m.bitis ?? null,
          maddeler: m.maddeler ?? [],
        });
        if (error) throw error;
      }
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["network", "mufredat", v.kisi_id] });
    },
  });
}

export function useKardesMufredatYeniDonem() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (v: { kisi_id: string; eskiId?: string }) => {
      if (!user) throw new Error("Giriş gerekli");
      if (v.eskiId) {
        await supabase.from("kardes_mufredat").update({ arsiv: true }).eq("id", v.eskiId);
      }
      const bugun = new Date();
      const bitis = new Date();
      bitis.setMonth(bitis.getMonth() + 3);
      const { error } = await supabase.from("kardes_mufredat").insert({
        user_id: user.id,
        kisi_id: v.kisi_id,
        baslik: "3 Aylık Hedef",
        baslangic: bugun.toISOString().slice(0, 10),
        bitis: bitis.toISOString().slice(0, 10),
        maddeler: [],
      });
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["network", "mufredat", v.kisi_id] });
    },
  });
}

/* ---------------- MANEVİYAT: Evrâd-u Ezkâr ---------------- */
