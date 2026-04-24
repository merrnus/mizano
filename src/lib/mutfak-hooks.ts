import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import type {
  MutfakBelge,
  MutfakDosya,
  MutfakNot,
  MutfakTablo,
  NotRenk,
  TabloKolon,
  TabloSatir,
} from "./mutfak-tipleri";

// ============ NOTLAR ============
export function useNotlar(arsivli = false) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["mutfak", "notlar", user?.id, arsivli],
    enabled: !!user,
    queryFn: async (): Promise<MutfakNot[]> => {
      const { data, error } = await supabase
        .from("mutfak_not")
        .select("*")
        .eq("arsiv", arsivli)
        .order("pinned", { ascending: false })
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as MutfakNot[];
    },
  });
}

export function useNotEkle() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: Partial<MutfakNot> & { icerik: string }) => {
      if (!user) throw new Error("oturum yok");
      const { data, error } = await supabase
        .from("mutfak_not")
        .insert({
          user_id: user.id,
          baslik: input.baslik ?? null,
          icerik: input.icerik,
          renk: input.renk ?? "sari",
          pinned: input.pinned ?? false,
          etiketler: input.etiketler ?? [],
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mutfak", "notlar"] }),
  });
}

export function useNotGuncelle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; patch: Partial<MutfakNot> }) => {
      const { data, error } = await supabase
        .from("mutfak_not")
        .update(input.patch as never)
        .eq("id", input.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mutfak", "notlar"] }),
  });
}

export function useNotSil() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("mutfak_not").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mutfak", "notlar"] }),
  });
}

// ============ BELGELER ============
export function useBelgeler() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["mutfak", "belgeler", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<MutfakBelge[]> => {
      const { data, error } = await supabase
        .from("mutfak_belge")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as MutfakBelge[];
    },
  });
}

export function useBelge(id: string | undefined) {
  return useQuery({
    queryKey: ["mutfak", "belge", id],
    enabled: !!id,
    queryFn: async (): Promise<MutfakBelge | null> => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("mutfak_belge")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as MutfakBelge | null;
    },
  });
}

export function useBelgeEkle() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: { baslik?: string; emoji?: string }) => {
      if (!user) throw new Error("oturum yok");
      const { data, error } = await supabase
        .from("mutfak_belge")
        .insert({
          user_id: user.id,
          baslik: input.baslik ?? "Adsız belge",
          emoji: input.emoji ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mutfak", "belgeler"] }),
  });
}

export function useBelgeKaydet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; patch: Partial<MutfakBelge> }) => {
      const { error } = await supabase
        .from("mutfak_belge")
        .update(input.patch as never)
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["mutfak", "belge", vars.id] });
      qc.invalidateQueries({ queryKey: ["mutfak", "belgeler"] });
    },
  });
}

export function useBelgeSil() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("mutfak_belge").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mutfak", "belgeler"] }),
  });
}

// ============ TABLOLAR ============
export function useTablolar() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["mutfak", "tablolar", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<MutfakTablo[]> => {
      const { data, error } = await supabase
        .from("mutfak_tablo")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as MutfakTablo[];
    },
  });
}

export function useTablo(id: string | undefined) {
  return useQuery({
    queryKey: ["mutfak", "tablo", id],
    enabled: !!id,
    queryFn: async (): Promise<MutfakTablo | null> => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("mutfak_tablo")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as MutfakTablo | null;
    },
  });
}

export function useTabloEkle() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: { baslik?: string }) => {
      if (!user) throw new Error("oturum yok");
      const yeniKolonlar: TabloKolon[] = [
        { id: crypto.randomUUID(), ad: "Başlık", tip: "metin" },
        { id: crypto.randomUUID(), ad: "Notlar", tip: "metin" },
        { id: crypto.randomUUID(), ad: "Tamam", tip: "checkbox" },
      ];
      const yeniSatirlar: TabloSatir[] = Array.from({ length: 3 }, () => ({
        id: crypto.randomUUID(),
        hucreler: {},
      }));
      const { data, error } = await supabase
        .from("mutfak_tablo")
        .insert({
          user_id: user.id,
          baslik: input.baslik ?? "Adsız tablo",
          kolonlar: yeniKolonlar as never,
          satirlar: yeniSatirlar as never,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mutfak", "tablolar"] }),
  });
}

export function useTabloKaydet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; patch: Partial<MutfakTablo> }) => {
      const { error } = await supabase
        .from("mutfak_tablo")
        .update(input.patch as never)
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["mutfak", "tablo", vars.id] });
      qc.invalidateQueries({ queryKey: ["mutfak", "tablolar"] });
    },
  });
}

export function useTabloSil() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("mutfak_tablo").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mutfak", "tablolar"] }),
  });
}

// ============ DOSYALAR ============
export function useDosyalar(klasor: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["mutfak", "dosyalar", user?.id, klasor],
    enabled: !!user,
    queryFn: async (): Promise<MutfakDosya[]> => {
      const { data, error } = await supabase
        .from("mutfak_dosya")
        .select("*")
        .eq("klasor", klasor)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as MutfakDosya[];
    },
  });
}

export function useTumKlasorler() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["mutfak", "klasorler", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase
        .from("mutfak_dosya")
        .select("klasor");
      if (error) throw error;
      const set = new Set<string>(["/"]);
      (data ?? []).forEach((r) => set.add((r as { klasor: string }).klasor));
      return Array.from(set).sort();
    },
  });
}

export function useDosyaYukle() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: { file: File; klasor: string }) => {
      if (!user) throw new Error("oturum yok");
      const ext = input.file.name.split(".").pop() || "bin";
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("mutfak-dosya")
        .upload(path, input.file, { contentType: input.file.type });
      if (upErr) throw upErr;
      const { error: dbErr } = await supabase.from("mutfak_dosya").insert({
        user_id: user.id,
        ad: input.file.name,
        mime_type: input.file.type || null,
        boyut: input.file.size,
        klasor: input.klasor,
        storage_path: path,
      });
      if (dbErr) throw dbErr;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mutfak", "dosyalar"] });
      qc.invalidateQueries({ queryKey: ["mutfak", "klasorler"] });
    },
  });
}

export function useDosyaSil() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; storage_path: string }) => {
      await supabase.storage.from("mutfak-dosya").remove([input.storage_path]);
      const { error } = await supabase.from("mutfak_dosya").delete().eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mutfak", "dosyalar"] }),
  });
}

export function useKlasorEkle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (_klasor: string) => {
      // Sanal klasör — boş değil; ilk dosya yüklenince var olur.
      // Burada hiçbir şey yapmıyoruz, sadece UI listesine ekleneceği için cache'i bozmuyoruz.
      return _klasor;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mutfak", "klasorler"] }),
  });
}

export async function dosyaIndirmeUrl(storage_path: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from("mutfak-dosya")
    .createSignedUrl(storage_path, 60 * 10);
  if (error) return null;
  return data?.signedUrl ?? null;
}

// Re-export
export type { NotRenk };
