import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./auth-context";
import type {
  Hedef,
  HedefEkle,
  HedefGuncelle,
  HedefAdim,
  HedefAdimEkle,
} from "./hedef-tipleri";
import type { CeteleKayit } from "./cetele-tipleri";

export function useHedefler() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["hedefler", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Hedef[]> => {
      const { data, error } = await supabase
        .from("hedef")
        .select("*")
        .order("siralama", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useHedef(id: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["hedef", user?.id, id],
    enabled: !!user && !!id,
    queryFn: async (): Promise<Hedef | null> => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("hedef")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useHedefAdimlari(hedefId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["hedef-adim", user?.id, hedefId],
    enabled: !!user && !!hedefId,
    queryFn: async (): Promise<HedefAdim[]> => {
      if (!hedefId) return [];
      const { data, error } = await supabase
        .from("hedef_adim")
        .select("*")
        .eq("hedef_id", hedefId)
        .order("siralama", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useTumAdimlar() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["hedef-adim-tum", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<HedefAdim[]> => {
      const { data, error } = await supabase
        .from("hedef_adim")
        .select("*");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useHedefEkle() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (h: Omit<HedefEkle, "user_id">): Promise<Hedef> => {
      if (!user) throw new Error("Giriş gerekli");
      const { data, error } = await supabase
        .from("hedef")
        .insert({ ...h, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hedefler"] }),
  });
}

export function useHedefGuncelle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: HedefGuncelle & { id: string }) => {
      const { error } = await supabase.from("hedef").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["hedefler"] });
      qc.invalidateQueries({ queryKey: ["hedef", undefined, vars.id] });
      qc.invalidateQueries({ queryKey: ["hedef"] });
    },
  });
}

export function useHedefSil() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("hedef").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hedefler"] }),
  });
}

export function useAdimEkle() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (a: Omit<HedefAdimEkle, "user_id">) => {
      if (!user) throw new Error("Giriş gerekli");
      const { error } = await supabase
        .from("hedef_adim")
        .insert({ ...a, user_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hedef-adim"] });
      qc.invalidateQueries({ queryKey: ["hedef-adim-tum"] });
    },
  });
}

export function useAdimGuncelle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...patch
    }: { id: string } & Partial<Omit<HedefAdim, "id" | "user_id">>) => {
      const { error } = await supabase
        .from("hedef_adim")
        .update(patch)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hedef-adim"] });
      qc.invalidateQueries({ queryKey: ["hedef-adim-tum"] });
    },
  });
}

export function useAdimSil() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("hedef_adim").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hedef-adim"] });
      qc.invalidateQueries({ queryKey: ["hedef-adim-tum"] });
    },
  });
}

// Sayısal hedef için: bağlı çetele kayıtlarından son 90 gün birikim
export function useSablonKayitlari(sablonId: string | null | undefined, gunSayisi = 90) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["sablon-kayit", user?.id, sablonId, gunSayisi],
    enabled: !!user && !!sablonId,
    queryFn: async (): Promise<CeteleKayit[]> => {
      if (!sablonId) return [];
      const baslangic = new Date();
      baslangic.setDate(baslangic.getDate() - gunSayisi);
      const iso = baslangic.toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from("cetele_kayit")
        .select("*")
        .eq("sablon_id", sablonId)
        .gte("tarih", iso);
      if (error) throw error;
      return data ?? [];
    },
  });
}

// Streak hesabı: ardışık gün sayısı (son aktif gün dahil bugünden geriye)
export function streakHesapla(kayitlar: CeteleKayit[]): { aktif: number; haftaSayim: number } {
  const set = new Set(kayitlar.map((k) => k.tarih));
  let aktif = 0;
  const bugun = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(bugun);
    d.setDate(bugun.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    if (set.has(iso)) aktif += 1;
    else if (i > 0) break;
    else continue; // bugün boşsa streak kırılmaz, dün'e bakılır
  }
  // Son 7 gün sayımı
  let haftaSayim = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(bugun);
    d.setDate(bugun.getDate() - i);
    if (set.has(d.toISOString().slice(0, 10))) haftaSayim += 1;
  }
  return { aktif, haftaSayim };
}
