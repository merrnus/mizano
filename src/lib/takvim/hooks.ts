import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import * as React from "react";
import type {
  Etkinlik,
  EtkinlikEkle,
  EtkinlikGuncelle,
  Takvim,
  TakvimEkle,
  TakvimGuncelle,
} from "./tipler";

export function useTakvimler() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ["takvimler", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Takvim[]> => {
      const { data, error } = await supabase
        .from("takvim")
        .select("*")
        .order("siralama", { ascending: true });
      if (error) throw error;
      // Hiç yoksa varsayılan oluştur
      if (!data || data.length === 0) {
        const ins: TakvimEkle = {
          user_id: user!.id,
          ad: "Kişisel",
          renk: "cal-1",
          is_default: true,
          siralama: 0,
        };
        const { data: yeni, error: e2 } = await supabase
          .from("takvim")
          .insert(ins)
          .select()
          .single();
        if (e2) throw e2;
        return [yeni];
      }
      return data;
    },
  });

  React.useEffect(() => {
    if (!user) return;
    const kanal = supabase
      .channel("takvim-rt")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "takvim" },
        () => qc.invalidateQueries({ queryKey: ["takvimler"] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(kanal);
    };
  }, [user, qc]);

  return q;
}

export function useTakvimMutasyonlari() {
  const qc = useQueryClient();
  const { user } = useAuth();

  const ekle = useMutation({
    mutationFn: async (
      input: Omit<TakvimEkle, "user_id">,
    ): Promise<Takvim> => {
      const { data, error } = await supabase
        .from("takvim")
        .insert({ ...input, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["takvimler"] }),
  });

  const guncelle = useMutation({
    mutationFn: async ({ id, ...patch }: TakvimGuncelle & { id: string }) => {
      const { error } = await supabase.from("takvim").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["takvimler"] }),
  });

  const sil = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("takvim").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["takvimler"] });
      qc.invalidateQueries({ queryKey: ["etkinlikler"] });
    },
  });

  return { ekle, guncelle, sil };
}

export function useEtkinlikler() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ["etkinlikler", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Etkinlik[]> => {
      const { data, error } = await supabase
        .from("takvim_etkinlik")
        .select("*")
        .order("baslangic", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  React.useEffect(() => {
    if (!user) return;
    const kanal = supabase
      .channel("etkinlik-rt")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "takvim_etkinlik" },
        () => qc.invalidateQueries({ queryKey: ["etkinlikler"] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(kanal);
    };
  }, [user, qc]);

  return q;
}

export function useEtkinlikMutasyonlari() {
  const qc = useQueryClient();
  const { user } = useAuth();

  const ekle = useMutation({
    mutationFn: async (
      input: Omit<EtkinlikEkle, "user_id">,
    ): Promise<Etkinlik> => {
      const { data, error } = await supabase
        .from("takvim_etkinlik")
        .insert({ ...input, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["etkinlikler"] }),
  });

  const guncelle = useMutation({
    mutationFn: async ({ id, ...patch }: EtkinlikGuncelle & { id: string }) => {
      const { error } = await supabase
        .from("takvim_etkinlik")
        .update(patch)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["etkinlikler"] }),
  });

  const sil = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("takvim_etkinlik")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["etkinlikler"] }),
  });

  return { ekle, guncelle, sil };
}
