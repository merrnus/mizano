import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./auth-context";
import {
  type TakvimEtkinlik,
  type TakvimEtkinlikEkle,
  type TakvimEtkinlikGuncelle,
  type TakvimGorev,
  type TakvimGorevEkle,
  type TakvimGorevGuncelle,
} from "./takvim-tipleri";

function isoGun(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const g = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${g}`;
}

/* ---------------- Etkinlikler ---------------- */

export function useEtkinlikler(aralikBas: Date, aralikBitis: Date) {
  const { user } = useAuth();
  const basIso = aralikBas.toISOString();
  const bitIso = aralikBitis.toISOString();
  return useQuery({
    queryKey: ["takvim_etkinlik", user?.id, basIso, bitIso],
    enabled: !!user,
    queryFn: async (): Promise<TakvimEtkinlik[]> => {
      // Tek seferlik etkinlikler: aralıkla kesişenler
      // Tekrarlananlar: render tarafında genişletilecek; bu yüzden tekrarı 'yok' olmayan
      // tüm satırları da çekiyoruz (başlangıcı aralık bitiminden sonraysa bile,
      // tekrar_bitis aralık başlangıcından önce değilse).
      const { data, error } = await supabase
        .from("takvim_etkinlik")
        .select("*")
        .or(
          `and(baslangic.lte.${bitIso},baslangic.gte.${basIso}),tekrar.neq.yok`,
        )
        .order("baslangic", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useEtkinlikEkle() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (yeni: Omit<TakvimEtkinlikEkle, "user_id">) => {
      if (!user) throw new Error("Giriş gerekli");
      const { data, error } = await supabase
        .from("takvim_etkinlik")
        .insert({ ...yeni, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["takvim_etkinlik"] }),
  });
}

export function useEtkinlikGuncelle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (g: { id: string; degisiklikler: TakvimEtkinlikGuncelle }) => {
      const { data, error } = await supabase
        .from("takvim_etkinlik")
        .update(g.degisiklikler)
        .eq("id", g.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["takvim_etkinlik"] }),
  });
}

export function useEtkinlikSil() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("takvim_etkinlik").delete().eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["takvim_etkinlik"] }),
  });
}

/* ---------------- Görevler ---------------- */

export function useGorevler(aralikBas: Date, aralikBitis: Date) {
  const { user } = useAuth();
  const basIso = isoGun(aralikBas);
  const bitIso = isoGun(aralikBitis);
  return useQuery({
    queryKey: ["takvim_gorev", user?.id, basIso, bitIso],
    enabled: !!user,
    queryFn: async (): Promise<TakvimGorev[]> => {
      const { data, error } = await supabase
        .from("takvim_gorev")
        .select("*")
        .gte("vade", basIso)
        .lte("vade", bitIso)
        .order("vade", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useGorevEkle() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (yeni: Omit<TakvimGorevEkle, "user_id">) => {
      if (!user) throw new Error("Giriş gerekli");
      const { data, error } = await supabase
        .from("takvim_gorev")
        .insert({ ...yeni, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["takvim_gorev"] }),
  });
}

export function useGorevGuncelle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (g: { id: string; degisiklikler: TakvimGorevGuncelle }) => {
      const { data, error } = await supabase
        .from("takvim_gorev")
        .update(g.degisiklikler)
        .eq("id", g.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["takvim_gorev"] }),
  });
}

export function useGorevSil() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("takvim_gorev").delete().eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["takvim_gorev"] }),
  });
}

/* ---------------- Tekrar genişletme ---------------- */

export type EtkinlikOlay = TakvimEtkinlik & {
  /** Tekrarlardan üretilen örneğin başlangıcı (override). */
  olayBaslangic: Date;
  olayBitis: Date;
};

/** Aralık içinde, tekrarları genişleterek olayları üretir. */
export function genisletEtkinlikleri(
  etkinlikler: TakvimEtkinlik[],
  aralikBas: Date,
  aralikBitis: Date,
): EtkinlikOlay[] {
  const sonuc: EtkinlikOlay[] = [];
  for (const e of etkinlikler) {
    const bas = new Date(e.baslangic);
    const bit = e.bitis ? new Date(e.bitis) : new Date(bas.getTime() + 60 * 60 * 1000);
    const sureMs = bit.getTime() - bas.getTime();

    if (e.tekrar === "yok") {
      if (bit >= aralikBas && bas <= aralikBitis) {
        sonuc.push({ ...e, olayBaslangic: bas, olayBitis: bit });
      }
      continue;
    }

    const sonTekrar = e.tekrar_bitis ? new Date(e.tekrar_bitis) : aralikBitis;
    let imleç = new Date(bas);
    // İmleci aralık başlangıcına yaklaştır
    while (imleç < aralikBas && imleç <= sonTekrar) {
      if (e.tekrar === "haftalik") {
        imleç.setDate(imleç.getDate() + 7);
      } else {
        imleç.setMonth(imleç.getMonth() + 1);
      }
    }
    while (imleç <= aralikBitis && imleç <= sonTekrar) {
      const olayBit = new Date(imleç.getTime() + sureMs);
      sonuc.push({ ...e, olayBaslangic: new Date(imleç), olayBitis: olayBit });
      if (e.tekrar === "haftalik") {
        imleç.setDate(imleç.getDate() + 7);
      } else {
        imleç.setMonth(imleç.getMonth() + 1);
      }
    }
  }
  return sonuc.sort((a, b) => a.olayBaslangic.getTime() - b.olayBaslangic.getTime());
}