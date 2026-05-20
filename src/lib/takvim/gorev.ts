import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import type {
  TakvimGorev,
  TakvimGorevEkle,
  TakvimGorevGuncelle,
} from "./tipler";

export function useGorevler(_from?: Date, _to?: Date) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["gorevler", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("takvim_gorev")
        .select("*")
        .order("vade", { ascending: true });
      if (error) throw error;
      return (data ?? []) as TakvimGorev[];
    },
  });
  React.useEffect(() => {
    if (!user) return;
    const isim = `gorevler-rt-${user.id}-${Math.random().toString(36).slice(2)}`;
    const k = supabase
      .channel(isim)
      .on("postgres_changes", { event: "*", schema: "public", table: "takvim_gorev" }, () =>
        qc.invalidateQueries({ queryKey: ["gorevler"] }),
      )
      .subscribe();
    return () => { supabase.removeChannel(k); };
  }, [user, qc]);
  return q;
}

export function useGorevEkle() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: Omit<TakvimGorevEkle, "user_id">) => {
      const { error } = await supabase
        .from("takvim_gorev")
        .insert({ ...input, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["gorevler"] }),
  });
}

export function useGorevGuncelle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      args: (TakvimGorevGuncelle & { id: string }) | { id: string; degisiklikler: TakvimGorevGuncelle },
    ) => {
      const id = args.id;
      const patch = "degisiklikler" in args ? args.degisiklikler : (() => { const { id: _i, ...r } = args; return r; })();
      const { error } = await supabase.from("takvim_gorev").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["gorevler"] }),
  });
}

export function useGorevSil() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("takvim_gorev").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["gorevler"] }),
  });
}