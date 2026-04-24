import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./auth-context";
import type {
  AmelAlan,
  AmelAlanEkle,
  AmelAlanGuncelle,
  AmelKurs,
  AmelKursEkle,
  AmelKursGuncelle,
  AmelModul,
  AmelModulEkle,
  AmelModulGuncelle,
  AmelKaynak,
  AmelKaynakEkle,
  AmelKaynakGuncelle,
  AmelProje,
  AmelProjeEkle,
  AmelProjeGuncelle,
  AmelProjeAdim,
  AmelProjeAdimEkle,
  AmelProjeAdimGuncelle,
} from "./amel-tipleri";

/* -------- Alanlar -------- */

export function useAmelAlanlar() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["amel-alan", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<AmelAlan[]> => {
      const { data, error } = await supabase
        .from("amel_alan")
        .select("*")
        .order("siralama", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAmelAlan(id: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["amel-alan-tek", user?.id, id],
    enabled: !!user && !!id,
    queryFn: async (): Promise<AmelAlan | null> => {
      if (!id) return null;
      const { data, error } = await supabase.from("amel_alan").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useAmelAlanEkle() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (a: Omit<AmelAlanEkle, "user_id">): Promise<AmelAlan> => {
      if (!user) throw new Error("Giriş gerekli");
      const { data, error } = await supabase
        .from("amel_alan")
        .insert({ ...a, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["amel-alan"] }),
  });
}

export function useAmelAlanGuncelle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: AmelAlanGuncelle & { id: string }) => {
      const { error } = await supabase.from("amel_alan").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["amel-alan"] });
      qc.invalidateQueries({ queryKey: ["amel-alan-tek"] });
    },
  });
}

export function useAmelAlanSil() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("amel_alan").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["amel-alan"] }),
  });
}

/* -------- Kurslar -------- */

export function useAmelKurslar(alanId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["amel-kurs", user?.id, alanId ?? "tum"],
    enabled: !!user,
    queryFn: async (): Promise<AmelKurs[]> => {
      let q = supabase
        .from("amel_kurs")
        .select("*")
        .order("siralama", { ascending: true })
        .order("created_at", { ascending: false });
      if (alanId) q = q.eq("alan_id", alanId);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAmelKurs(id: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["amel-kurs-tek", user?.id, id],
    enabled: !!user && !!id,
    queryFn: async (): Promise<AmelKurs | null> => {
      if (!id) return null;
      const { data, error } = await supabase.from("amel_kurs").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useAmelKursEkle() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (k: Omit<AmelKursEkle, "user_id">): Promise<AmelKurs> => {
      if (!user) throw new Error("Giriş gerekli");
      const { data, error } = await supabase
        .from("amel_kurs")
        .insert({ ...k, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["amel-kurs"] }),
  });
}

export function useAmelKursGuncelle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: AmelKursGuncelle & { id: string }) => {
      const { error } = await supabase.from("amel_kurs").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["amel-kurs"] });
      qc.invalidateQueries({ queryKey: ["amel-kurs-tek"] });
    },
  });
}

export function useAmelKursSil() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("amel_kurs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["amel-kurs"] }),
  });
}

/* -------- Modüller -------- */

export function useAmelModuller(kursId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["amel-modul", user?.id, kursId],
    enabled: !!user && !!kursId,
    queryFn: async (): Promise<AmelModul[]> => {
      if (!kursId) return [];
      const { data, error } = await supabase
        .from("amel_modul")
        .select("*")
        .eq("kurs_id", kursId)
        .order("siralama", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useTumAmelModuller() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["amel-modul", user?.id, "tum"],
    enabled: !!user,
    queryFn: async (): Promise<AmelModul[]> => {
      const { data, error } = await supabase
        .from("amel_modul")
        .select("*")
        .order("siralama", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAmelModulEkle() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (m: Omit<AmelModulEkle, "user_id">) => {
      if (!user) throw new Error("Giriş gerekli");
      const { error } = await supabase.from("amel_modul").insert({ ...m, user_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["amel-modul"] }),
  });
}

export function useAmelModulGuncelle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: AmelModulGuncelle & { id: string }) => {
      const { error } = await supabase.from("amel_modul").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["amel-modul"] }),
  });
}

export function useAmelModulSil() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("amel_modul").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["amel-modul"] }),
  });
}

/* -------- Kaynaklar -------- */

export function useAmelKaynaklar(kursId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["amel-kaynak", user?.id, kursId],
    enabled: !!user && !!kursId,
    queryFn: async (): Promise<AmelKaynak[]> => {
      if (!kursId) return [];
      const { data, error } = await supabase
        .from("amel_kaynak")
        .select("*")
        .eq("kurs_id", kursId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAmelKaynakEkle() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (k: Omit<AmelKaynakEkle, "user_id">) => {
      if (!user) throw new Error("Giriş gerekli");
      const { error } = await supabase.from("amel_kaynak").insert({ ...k, user_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["amel-kaynak"] }),
  });
}

export function useAmelKaynakGuncelle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: AmelKaynakGuncelle & { id: string }) => {
      const { error } = await supabase.from("amel_kaynak").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["amel-kaynak"] }),
  });
}

export function useAmelKaynakSil() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, storagePath }: { id: string; storagePath?: string | null }) => {
      if (storagePath) {
        await supabase.storage.from("amel-dosya").remove([storagePath]);
      }
      const { error } = await supabase.from("amel_kaynak").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["amel-kaynak"] }),
  });
}

export async function amelDosyaImzaliUrl(storagePath: string, saniye = 3600): Promise<string | null> {
  const { data, error } = await supabase.storage.from("amel-dosya").createSignedUrl(storagePath, saniye);
  if (error) return null;
  return data?.signedUrl ?? null;
}

/* -------- Projeler -------- */

export function useAmelProjeler(opts?: { alanId?: string; kursId?: string }) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["amel-proje", user?.id, opts?.alanId ?? "tum", opts?.kursId ?? "tum"],
    enabled: !!user,
    queryFn: async (): Promise<AmelProje[]> => {
      let q = supabase
        .from("amel_proje")
        .select("*")
        .order("deadline", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false });
      if (opts?.alanId) q = q.eq("alan_id", opts.alanId);
      if (opts?.kursId) q = q.eq("kurs_id", opts.kursId);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAmelProje(id: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["amel-proje-tek", user?.id, id],
    enabled: !!user && !!id,
    queryFn: async (): Promise<AmelProje | null> => {
      if (!id) return null;
      const { data, error } = await supabase.from("amel_proje").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useAmelProjeEkle() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (p: Omit<AmelProjeEkle, "user_id">): Promise<AmelProje> => {
      if (!user) throw new Error("Giriş gerekli");
      const { data, error } = await supabase
        .from("amel_proje")
        .insert({ ...p, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["amel-proje"] }),
  });
}

export function useAmelProjeGuncelle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: AmelProjeGuncelle & { id: string }) => {
      const { error } = await supabase.from("amel_proje").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["amel-proje"] });
      qc.invalidateQueries({ queryKey: ["amel-proje-tek"] });
    },
  });
}

export function useAmelProjeSil() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("amel_proje").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["amel-proje"] }),
  });
}

/* -------- Proje adımları -------- */

export function useAmelProjeAdimlar(projeId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["amel-proje-adim", user?.id, projeId],
    enabled: !!user && !!projeId,
    queryFn: async (): Promise<AmelProjeAdim[]> => {
      if (!projeId) return [];
      const { data, error } = await supabase
        .from("amel_proje_adim")
        .select("*")
        .eq("proje_id", projeId)
        .order("siralama", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useTumAmelProjeAdimlar() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["amel-proje-adim", user?.id, "tum"],
    enabled: !!user,
    queryFn: async (): Promise<AmelProjeAdim[]> => {
      const { data, error } = await supabase
        .from("amel_proje_adim")
        .select("*")
        .order("siralama", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAmelProjeAdimEkle() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (a: Omit<AmelProjeAdimEkle, "user_id">) => {
      if (!user) throw new Error("Giriş gerekli");
      const { error } = await supabase.from("amel_proje_adim").insert({ ...a, user_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["amel-proje-adim"] }),
  });
}

export function useAmelProjeAdimGuncelle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: AmelProjeAdimGuncelle & { id: string }) => {
      const { error } = await supabase.from("amel_proje_adim").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["amel-proje-adim"] }),
  });
}

export function useAmelProjeAdimSil() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("amel_proje_adim").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["amel-proje-adim"] }),
  });
}