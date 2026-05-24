import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./auth-context";
import { tarihFormat } from "./cetele-tarih";
import type { Database } from "@/integrations/supabase/types";

export type GunlukGorev = Database["public"]["Tables"]["gunluk_gorev"]["Row"];
export type GunlukGorevEkle = Database["public"]["Tables"]["gunluk_gorev"]["Insert"];
export type GunlukGorevGuncelle = Database["public"]["Tables"]["gunluk_gorev"]["Update"];

export function useBugunGorevler(simdi: Date) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const tarih = tarihFormat(simdi);
  const q = useQuery({
    queryKey: ["gunluk_gorev", user?.id, tarih],
    enabled: !!user,
    queryFn: async (): Promise<GunlukGorev[]> => {
      const { data, error } = await supabase
        .from("gunluk_gorev")
        .select("*")
        .eq("tarih", tarih)
        .order("siralama", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
  React.useEffect(() => {
    if (!user) return;
    const k = supabase
      .channel(`gunluk-gorev-${user.id}-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "gunluk_gorev" },
        () => qc.invalidateQueries({ queryKey: ["gunluk_gorev"] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(k);
    };
  }, [user, qc]);
  return q;
}

export function useGunlukGorevEkle() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: Omit<GunlukGorevEkle, "user_id">) => {
      if (!user) throw new Error("Giriş gerekli");
      const { error } = await supabase
        .from("gunluk_gorev")
        .insert({ ...input, user_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["gunluk_gorev"] }),
  });
}

export function useGunlukGorevTopluEkle() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (rows: Array<Omit<GunlukGorevEkle, "user_id">>) => {
      if (!user) throw new Error("Giriş gerekli");
      if (rows.length === 0) return;
      const payload = rows.map((r) => ({ ...r, user_id: user.id }));
      const { error } = await supabase.from("gunluk_gorev").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["gunluk_gorev"] }),
  });
}

export function useGunlukGorevGuncelle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: GunlukGorevGuncelle & { id: string }) => {
      const { error } = await supabase
        .from("gunluk_gorev")
        .update(patch)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["gunluk_gorev"] }),
  });
}

export function useGunlukGorevSil() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("gunluk_gorev").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["gunluk_gorev"] }),
  });
}

export function useGunSifirla() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (tarih: string) => {
      if (!user) throw new Error("Giriş gerekli");
      const { error } = await supabase
        .from("gunluk_gorev")
        .delete()
        .eq("user_id", user.id)
        .eq("tarih", tarih);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["gunluk_gorev"] }),
  });
}