import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./auth-context";
import type {
  Ders,
  DersEkle,
  DersGuncelle,
  DersSinav,
  DersSinavEkle,
  DersSinavGuncelle,
  DersProje,
  DersProjeEkle,
  DersProjeGuncelle,
  DersKaynak,
  DersKaynakEkle,
  DersKaynakGuncelle,
  DersSaat,
  DersSaatEkle,
  DersSaatGuncelle,
} from "./ilim-tipleri";

/* -------- Dersler -------- */

export function useDersler() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["ders", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Ders[]> => {
      const { data, error } = await supabase
        .from("ders")
        .select("*")
        .order("siralama", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useDers(id: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["ders-tek", user?.id, id],
    enabled: !!user && !!id,
    queryFn: async (): Promise<Ders | null> => {
      if (!id) return null;
      const { data, error } = await supabase.from("ders").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useDersEkle() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (d: Omit<DersEkle, "user_id">): Promise<Ders> => {
      if (!user) throw new Error("Giriş gerekli");
      const { data, error } = await supabase.from("ders").insert({ ...d, user_id: user.id }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ders"] }),
  });
}

export function useDersGuncelle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: DersGuncelle & { id: string }) => {
      const { error } = await supabase.from("ders").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ders"] });
      qc.invalidateQueries({ queryKey: ["ders-tek"] });
    },
  });
}

export function useDersSil() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ders").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ders"] }),
  });
}

/* -------- Sınavlar -------- */

export function useSinavlar(dersId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["ders-sinav", user?.id, dersId ?? "tum"],
    enabled: !!user,
    queryFn: async (): Promise<DersSinav[]> => {
      let q = supabase.from("ders_sinav").select("*").order("tarih", { ascending: true });
      if (dersId) q = q.eq("ders_id", dersId);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSinavEkle() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (s: Omit<DersSinavEkle, "user_id">) => {
      if (!user) throw new Error("Giriş gerekli");
      const { error } = await supabase.from("ders_sinav").insert({ ...s, user_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ders-sinav"] }),
  });
}

export function useSinavGuncelle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: DersSinavGuncelle & { id: string }) => {
      const { error } = await supabase.from("ders_sinav").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ders-sinav"] }),
  });
}

export function useSinavSil() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ders_sinav").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ders-sinav"] }),
  });
}

/* -------- Projeler -------- */

export function useProjeler(dersId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["ders-proje", user?.id, dersId ?? "tum"],
    enabled: !!user,
    queryFn: async (): Promise<DersProje[]> => {
      let q = supabase
        .from("ders_proje")
        .select("*")
        .order("modul_no", { ascending: true, nullsFirst: false })
        .order("deadline", { ascending: true });
      if (dersId) q = q.eq("ders_id", dersId);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useProjeEkle() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (p: Omit<DersProjeEkle, "user_id">) => {
      if (!user) throw new Error("Giriş gerekli");
      const { error } = await supabase.from("ders_proje").insert({ ...p, user_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ders-proje"] }),
  });
}

export function useProjeGuncelle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: DersProjeGuncelle & { id: string }) => {
      const { error } = await supabase.from("ders_proje").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ders-proje"] }),
  });
}

export function useProjeSil() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ders_proje").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ders-proje"] }),
  });
}

/* -------- Kaynaklar -------- */

export function useKaynaklar(dersId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["ders-kaynak", user?.id, dersId],
    enabled: !!user && !!dersId,
    queryFn: async (): Promise<DersKaynak[]> => {
      if (!dersId) return [];
      const { data, error } = await supabase
        .from("ders_kaynak")
        .select("*")
        .eq("ders_id", dersId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useKaynakEkle() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (k: Omit<DersKaynakEkle, "user_id">) => {
      if (!user) throw new Error("Giriş gerekli");
      const { error } = await supabase.from("ders_kaynak").insert({ ...k, user_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ders-kaynak"] }),
  });
}

export function useKaynakGuncelle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: DersKaynakGuncelle & { id: string }) => {
      const { error } = await supabase.from("ders_kaynak").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ders-kaynak"] }),
  });
}

export function useKaynakSil() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, storagePath }: { id: string; storagePath?: string | null }) => {
      if (storagePath) {
        await supabase.storage.from("ders-dosya").remove([storagePath]);
      }
      const { error } = await supabase.from("ders_kaynak").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ders-kaynak"] }),
  });
}

export async function dosyaImzalıUrl(storagePath: string, saniye = 3600): Promise<string | null> {
  const { data, error } = await supabase.storage.from("ders-dosya").createSignedUrl(storagePath, saniye);
  if (error) return null;
  return data?.signedUrl ?? null;
}

/* -------- Haftalık Saatler -------- */

export function useDersSaatleri(dersId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["ders-saat", user?.id, dersId ?? "tum"],
    enabled: !!user,
    queryFn: async (): Promise<DersSaat[]> => {
      let q = supabase.from("ders_saat").select("*").order("baslangic", { ascending: true });
      if (dersId) q = q.eq("ders_id", dersId);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useDersSaatEkle() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (s: Omit<DersSaatEkle, "user_id">) => {
      if (!user) throw new Error("Giriş gerekli");
      const { error } = await supabase.from("ders_saat").insert({ ...s, user_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ders-saat"] }),
  });
}

export function useDersSaatGuncelle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: DersSaatGuncelle & { id: string }) => {
      const { error } = await supabase.from("ders_saat").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ders-saat"] }),
  });
}

export function useDersSaatSil() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ders_saat").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ders-saat"] }),
  });
}