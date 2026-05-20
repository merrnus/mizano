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

export function useKisiler() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["network", "kisiler", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<KisiDetay[]> => {
      const [kisilerRes, baglantiRes] = await Promise.all([
        supabase.from("gundem_kisi").select("*").order("ad", { ascending: true }),
        supabase.from("gundem_kisi_kategori").select("kisi_id, kategori_id"),
      ]);
      if (kisilerRes.error) throw kisilerRes.error;
      if (baglantiRes.error) throw baglantiRes.error;
      const baglantilar = baglantiRes.data ?? [];
      return (kisilerRes.data ?? []).map((k) => ({
        ...(k as Kisi),
        kategori_ids: baglantilar.filter((b) => b.kisi_id === k.id).map((b) => b.kategori_id),
      }));
    },
  });
}

export function useKisiEkle() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (k: { ad: string; notlar?: string | null; kategori_ids?: string[] }) => {
      if (!user) throw new Error("Giriş gerekli");
      const { data, error } = await supabase
        .from("gundem_kisi")
        .insert({ user_id: user.id, ad: k.ad, notlar: k.notlar ?? null })
        .select("id")
        .single();
      if (error) throw error;
      if (k.kategori_ids && k.kategori_ids.length > 0) {
        const rows = k.kategori_ids.map((kid) => ({
          user_id: user.id,
          kisi_id: data!.id,
          kategori_id: kid,
        }));
        const { error: e2 } = await supabase.from("gundem_kisi_kategori").insert(rows);
        if (e2) throw e2;
      }
      return data!.id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["network", "kisiler"] }),
  });
}

export function useKisiGuncelle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (k: { id: string; ad?: string; notlar?: string | null }) => {
      const { id, ...patch } = k;
      const { error } = await supabase.from("gundem_kisi").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["network", "kisiler"] }),
  });
}

/** Tek kişi getir (detay sayfası için) */
export function useKisi(id: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["network", "kisi", id],
    enabled: !!user && !!id,
    queryFn: async (): Promise<KisiDetay | null> => {
      const [kisiRes, baglantiRes] = await Promise.all([
        supabase.from("gundem_kisi").select("*").eq("id", id!).maybeSingle(),
        supabase.from("gundem_kisi_kategori").select("kategori_id").eq("kisi_id", id!),
      ]);
      if (kisiRes.error) throw kisiRes.error;
      if (baglantiRes.error) throw baglantiRes.error;
      if (!kisiRes.data) return null;
      return {
        ...(kisiRes.data as Kisi),
        kategori_ids: (baglantiRes.data ?? []).map((b) => b.kategori_id),
      };
    },
  });
}

/** Genişletilmiş kişi alanlarını günceller (derin_takip + tüm yeni profil alanları). */
export function useKisiGuncelleDetay() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (k: {
      id: string;
      ad?: string;
      notlar?: string | null;
      derin_takip?: boolean;
      telefon?: string | null;
      dogum_tarihi?: string | null;
      foto_url?: string | null;
      universite?: string | null;
      bolum?: string | null;
      sinif?: string | null;
      gano?: number | null;
      akademik_durum?: string | null;
      ilgi_alanlari?: string[];
      sorumluluk_notu?: string | null;
    }) => {
      const { id, ...patch } = k;
      const { error } = await supabase.from("gundem_kisi").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["network", "kisiler"] });
      qc.invalidateQueries({ queryKey: ["network", "kisi", v.id] });
      qc.invalidateQueries({ queryKey: ["network", "evdekiler"] });
    },
  });
}

export function useKisiSil() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("gundem_kisi").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["network", "kisiler"] });
      qc.invalidateQueries({ queryKey: ["network", "gundemler"] });
    },
  });
}

export function useKisiKategoriAyarla() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (p: { kisi_id: string; kategori_ids: string[] }) => {
      if (!user) throw new Error("Giriş gerekli");
      // Mevcut bağlantıları sil
      const { error: e1 } = await supabase
        .from("gundem_kisi_kategori")
        .delete()
        .eq("kisi_id", p.kisi_id);
      if (e1) throw e1;
      if (p.kategori_ids.length > 0) {
        const rows = p.kategori_ids.map((kid) => ({
          user_id: user.id,
          kisi_id: p.kisi_id,
          kategori_id: kid,
        }));
        const { error: e2 } = await supabase.from("gundem_kisi_kategori").insert(rows);
        if (e2) throw e2;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["network", "kisiler"] }),
  });
}

