import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import * as React from "react";
import { addDays, addMonths, isAfter, isBefore } from "date-fns";
import type {
  Etkinlik,
  EtkinlikEkle,
  EtkinlikGuncelle,
  EtkinlikOlay,
  Takvim,
  TakvimEkle,
  TakvimGuncelle,
} from "./tipler";
import { etkinlikBitisi } from "./tipler";

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
    const isim = `takvim-rt-${user.id}-${Math.random().toString(36).slice(2)}`;
    const kanal = supabase
      .channel(isim)
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

/**
 * Geri-uyum: dashboard widget'ları bu hooks'ları tek tek import ediyor.
 * useEtkinlikMutasyonlari'nin parçaları.
 */
export function useEtkinlikEkle() {
  const { ekle } = useEtkinlikMutasyonlari();
  return ekle;
}

export function useEtkinlikGuncelle() {
  const { guncelle } = useEtkinlikMutasyonlari();
  return guncelle;
}

export function useEtkinlikSil() {
  const { sil } = useEtkinlikMutasyonlari();
  return sil;
}

/**
 * Geri-uyum: dashboard'un eski tekrar genişletme fonksiyonu.
 * `takvim_etkinlik.tekrar` (yok|haftalik|aylik) alanına bakar.
 * Yeni takvim sayfası RRULE tabanlı `genisletListe` kullanır (tekrar.ts).
 */
export function genisletEtkinlikleri(
  etkinlikler: Etkinlik[],
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

export type { EtkinlikOlay } from "./tipler";
export { useGorevler, useGorevEkle, useGorevGuncelle, useGorevSil } from "./gorev";

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
    const isim = `etkinlik-rt-${user.id}-${Math.random().toString(36).slice(2)}`;
    const kanal = supabase
      .channel(isim)
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
