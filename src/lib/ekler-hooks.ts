import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./auth-context";
import type { Ek, EkBaglamTuru } from "./ekler-tipleri";

const BUCKET = "ekler-dosya";

export function useEkler(baglamTuru?: EkBaglamTuru, baglamId?: string | null) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["ekler", user?.id, baglamTuru ?? "tum", baglamId ?? "tum"],
    enabled: !!user,
    queryFn: async (): Promise<Ek[]> => {
      let q = supabase
        .from("ekler")
        .select("*")
        .order("siralama", { ascending: true })
        .order("created_at", { ascending: false });
      if (baglamTuru) q = q.eq("baglam_turu", baglamTuru);
      if (baglamId) q = q.eq("baglam_id", baglamId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as Ek[];
    },
  });
}

export function useTumEkler() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["ekler", user?.id, "hepsi"],
    enabled: !!user,
    queryFn: async (): Promise<Ek[]> => {
      const { data, error } = await supabase
        .from("ekler")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Ek[];
    },
  });
}

export function useDosyaEkle() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: {
      file: File;
      baglamTuru?: EkBaglamTuru;
      baglamId?: string | null;
      baslik?: string;
    }) => {
      if (!user) throw new Error("Giriş gerekli");
      const ext = input.file.name.split(".").pop() || "bin";
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, input.file, {
          contentType: input.file.type || undefined,
          upsert: false,
        });
      if (upErr) throw upErr;
      const { data, error } = await supabase
        .from("ekler")
        .insert({
          user_id: user.id,
          baglam_turu: input.baglamTuru ?? "serbest",
          baglam_id: input.baglamId ?? null,
          tur: "dosya",
          baslik: input.baslik?.trim() || input.file.name,
          storage_path: path,
          mime_type: input.file.type || null,
          boyut: input.file.size,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ekler"] }),
  });
}

export function useLinkEkle() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: {
      url: string;
      baglamTuru?: EkBaglamTuru;
      baglamId?: string | null;
      baslik?: string;
      aciklama?: string;
      onizleme_url?: string;
      favicon_url?: string;
      site_adi?: string;
    }) => {
      if (!user) throw new Error("Giriş gerekli");
      const { data, error } = await supabase
        .from("ekler")
        .insert({
          user_id: user.id,
          baglam_turu: input.baglamTuru ?? "serbest",
          baglam_id: input.baglamId ?? null,
          tur: "link",
          baslik: input.baslik?.trim() || input.url,
          url: input.url,
          aciklama: input.aciklama || null,
          onizleme_url: input.onizleme_url || null,
          favicon_url: input.favicon_url || null,
          site_adi: input.site_adi || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ekler"] }),
  });
}

export function useEkSil() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ek: Ek) => {
      if (ek.storage_path) {
        await supabase.storage.from(BUCKET).remove([ek.storage_path]);
      }
      const { error } = await supabase.from("ekler").delete().eq("id", ek.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ekler"] }),
  });
}

export async function ekDosyaUrl(storage_path: string, saniye = 3600): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storage_path, saniye);
  if (error) return null;
  return data?.signedUrl ?? null;
}