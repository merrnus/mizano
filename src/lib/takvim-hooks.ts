/**
 * Geri-uyum shim: dashboard widget'ları bu API'yi kullanıyor. Yeni /takvim
 * sayfası için src/lib/takvim/* modüllerine bakın.
 */
import * as React from "react";
import { addDays, addMonths, isAfter, isBefore } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { etkinlikBitisi, type TakvimEtkinlik, type TakvimEtkinlikEkle, type TakvimEtkinlikGuncelle, type TakvimGorev, type TakvimGorevEkle, type TakvimGorevGuncelle } from "./takvim-tipleri";

export type EtkinlikOlay = TakvimEtkinlik & {
  olayBaslangic: Date;
  olayBitis: Date;
};

export function useEtkinlikler(_from?: Date, _to?: Date) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["etkinlikler", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("takvim_etkinlik")
        .select("*")
        .order("baslangic", { ascending: true });
      if (error) throw error;
      return (data ?? []) as TakvimEtkinlik[];
    },
  });
  React.useEffect(() => {
    if (!user) return;
    const k = supabase
      .channel("etkinlikler-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "takvim_etkinlik" }, () =>
        qc.invalidateQueries({ queryKey: ["etkinlikler"] }),
      )
      .subscribe();
    return () => { supabase.removeChannel(k); };
  }, [user, qc]);
  return q;
}

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
    const k = supabase
      .channel("gorevler-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "takvim_gorev" }, () =>
        qc.invalidateQueries({ queryKey: ["gorevler"] }),
      )
      .subscribe();
    return () => { supabase.removeChannel(k); };
  }, [user, qc]);
  return q;
}

export function useEtkinlikEkle() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: Omit<TakvimEtkinlikEkle, "user_id">) => {
      const { error } = await supabase
        .from("takvim_etkinlik")
        .insert({ ...input, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["etkinlikler"] }),
  });
}

export function useEtkinlikGuncelle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      args: (TakvimEtkinlikGuncelle & { id: string }) | { id: string; degisiklikler: TakvimEtkinlikGuncelle },
    ) => {
      const id = args.id;
      const patch = "degisiklikler" in args ? args.degisiklikler : (() => { const { id: _i, ...r } = args; return r; })();
      const { error } = await supabase.from("takvim_etkinlik").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["etkinlikler"] }),
  });
}

export function useEtkinlikSil() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("takvim_etkinlik").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["etkinlikler"] }),
  });
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

/** Eski API ile uyumlu: tekrar (haftalik/aylik) genişletme. */
export function genisletEtkinlikleri(
  etkinlikler: TakvimEtkinlik[],
  pencereBas: Date,
  pencereBit: Date,
): EtkinlikOlay[] {
  const sonuc: EtkinlikOlay[] = [];
  for (const e of etkinlikler) {
    const bas0 = new Date(e.baslangic);
    const bit0 = etkinlikBitisi(e);
    const sure = bit0.getTime() - bas0.getTime();
    const tekrarBitis = e.tekrar_bitis ? new Date(e.tekrar_bitis) : null;

    const ilerlet = (d: Date): Date => {
      if (e.tekrar === "haftalik") return addDays(d, 7);
      if (e.tekrar === "aylik") return addMonths(d, 1);
      return new Date(d.getTime() + 365 * 24 * 3600_000);
    };

    let cur = bas0;
    let safety = 0;
    while (safety++ < 500) {
      if (isAfter(cur, pencereBit)) break;
      if (tekrarBitis && isAfter(cur, tekrarBitis)) break;
      const olayBit = new Date(cur.getTime() + sure);
      if (!isBefore(olayBit, pencereBas)) {
        sonuc.push({ ...e, olayBaslangic: cur, olayBitis: olayBit });
      }
      if (e.tekrar === "yok") break;
      cur = ilerlet(cur);
    }
  }
  return sonuc;
}
