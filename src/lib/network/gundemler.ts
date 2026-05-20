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

export function useGundemler(filtre?: { istisare_id?: string }) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["network", "gundemler", user?.id, filtre?.istisare_id ?? "all"],
    enabled: !!user,
    queryFn: async (): Promise<GundemDetay[]> => {
      let q = supabase
        .from("gundem")
        .select("*")
        .order("siralama", { ascending: true })
        .order("created_at", { ascending: false });
      if (filtre?.istisare_id) q = q.eq("istisare_id", filtre.istisare_id);
      const gRes = await q;
      if (gRes.error) throw gRes.error;
      const gundemler = (gRes.data ?? []) as Gundem[];
      if (gundemler.length === 0) return [];
      const ids = gundemler.map((g) => g.id);
      const [sRes, yRes] = await Promise.all([
        supabase.from("gundem_sorumlu").select("gundem_id, kisi_id").in("gundem_id", ids),
        supabase.from("gundem_yorum").select("gundem_id").in("gundem_id", ids),
      ]);
      if (sRes.error) throw sRes.error;
      if (yRes.error) throw yRes.error;
      const sorumlular = sRes.data ?? [];
      const yorumlar = yRes.data ?? [];
      return gundemler.map((g) => ({
        ...g,
        sorumlu_ids: sorumlular.filter((s) => s.gundem_id === g.id).map((s) => s.kisi_id),
        yorum_sayisi: yorumlar.filter((y) => y.gundem_id === g.id).length,
      }));
    },
  });
}

export function useGundemEkle() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (k: {
      istisare_id: string;
      icerik: string;
      oncelik?: GundemOncelik;
      durum?: GundemDurum;
      deadline?: string | null;
      sorumlu_ids?: string[];
      etiketler?: string[];
    }) => {
      if (!user) throw new Error("Giriş gerekli");
      const { data, error } = await supabase
        .from("gundem")
        .insert({
          user_id: user.id,
          istisare_id: k.istisare_id,
          icerik: k.icerik,
          oncelik: k.oncelik ?? "ana",
          durum: k.durum ?? "bekliyor",
          deadline: k.deadline ?? null,
          etiketler: k.etiketler ?? [],
        })
        .select("id")
        .single();
      if (error) throw error;
      if (k.sorumlu_ids && k.sorumlu_ids.length > 0) {
        const rows = k.sorumlu_ids.map((kid) => ({
          user_id: user.id,
          gundem_id: data!.id,
          kisi_id: kid,
        }));
        await supabase.from("gundem_sorumlu").insert(rows);
      }
      return data!.id as string;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["network", "gundemler"] });
      qc.invalidateQueries({ queryKey: ["network", "istisareler"] });
    },
  });
}

export function useGundemTopluEkle() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (p: { istisare_id: string; satirlar: string[] }) => {
      if (!user) throw new Error("Giriş gerekli");
      const rows = p.satirlar
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
        .map((s, i) => ({
          user_id: user.id,
          istisare_id: p.istisare_id,
          icerik: s,
          siralama: i,
        }));
      if (rows.length === 0) return 0;
      const { error } = await supabase.from("gundem").insert(rows);
      if (error) throw error;
      return rows.length;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["network", "gundemler"] });
      qc.invalidateQueries({ queryKey: ["network", "istisareler"] });
    },
  });
}

export function useGundemGuncelle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (k: {
      id: string;
      icerik?: string;
      karar?: string | null;
      deadline?: string | null;
      sonuc?: string | null;
      durum?: GundemDurum;
      oncelik?: GundemOncelik;
      etiketler?: string[];
      tamamlanma?: string | null;
    }) => {
      const { id, ...patch } = k;
      // Durum yapıldı'ya çekilirse otomatik tamamlanma
      if (patch.durum === "yapildi" && !("tamamlanma" in patch)) {
        patch.tamamlanma = new Date().toISOString().slice(0, 10);
      }
      if (patch.durum && patch.durum !== "yapildi") {
        patch.tamamlanma = null;
      }
      const { error } = await supabase.from("gundem").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["network", "gundemler"] });
      qc.invalidateQueries({ queryKey: ["network", "istisareler"] });
    },
  });
}

export function useGundemSil() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("gundem_sorumlu").delete().eq("gundem_id", id);
      await supabase.from("gundem_yorum").delete().eq("gundem_id", id);
      const { error } = await supabase.from("gundem").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["network", "gundemler"] });
      qc.invalidateQueries({ queryKey: ["network", "istisareler"] });
    },
  });
}

export function useGundemSorumluAyarla() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (p: { gundem_id: string; sorumlu_ids: string[] }) => {
      if (!user) throw new Error("Giriş gerekli");
      await supabase.from("gundem_sorumlu").delete().eq("gundem_id", p.gundem_id);
      if (p.sorumlu_ids.length > 0) {
        const rows = p.sorumlu_ids.map((kid) => ({
          user_id: user.id,
          gundem_id: p.gundem_id,
          kisi_id: kid,
        }));
        const { error } = await supabase.from("gundem_sorumlu").insert(rows);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["network", "gundemler"] }),
  });
}

export function useGundemTasi() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: { gundem_ids: string[]; hedef_istisare_id: string }) => {
      const { error } = await supabase
        .from("gundem")
        .update({ istisare_id: p.hedef_istisare_id })
        .in("id", p.gundem_ids);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["network", "gundemler"] });
      qc.invalidateQueries({ queryKey: ["network", "istisareler"] });
    },
  });
}

/* ---------------- YORUM ---------------- */

export function useGundemYorumlar(gundem_id: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["network", "yorumlar", gundem_id],
    enabled: !!user && !!gundem_id,
    queryFn: async (): Promise<GundemYorum[]> => {
      const { data, error } = await supabase
        .from("gundem_yorum")
        .select("*")
        .eq("gundem_id", gundem_id!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as GundemYorum[];
    },
  });
}

export function useGundemYorumEkle() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (k: { gundem_id: string; metin: string }) => {
      if (!user) throw new Error("Giriş gerekli");
      const { error } = await supabase.from("gundem_yorum").insert({
        user_id: user.id,
        gundem_id: k.gundem_id,
        metin: k.metin,
      });
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["network", "yorumlar", v.gundem_id] });
      qc.invalidateQueries({ queryKey: ["network", "gundemler"] });
    },
  });
}

export function useGundemYorumSil() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("gundem_yorum").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["network", "yorumlar"] });
      qc.invalidateQueries({ queryKey: ["network", "gundemler"] });
    },
  });
}

