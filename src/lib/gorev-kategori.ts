import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./auth-context";
import type { Database } from "@/integrations/supabase/types";

export type GorevKategori = Database["public"]["Tables"]["gorev_kategori"]["Row"];
export type GorevKategoriEkle = Database["public"]["Tables"]["gorev_kategori"]["Insert"];

export function useKategoriler() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["gorev_kategori", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<GorevKategori[]> => {
      const { data, error } = await supabase
        .from("gorev_kategori")
        .select("*")
        .order("siralama", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useKategoriEkle() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (k: Omit<GorevKategoriEkle, "user_id">) => {
      if (!user) throw new Error("Giriş gerekli");
      const { data, error } = await supabase
        .from("gorev_kategori")
        .insert({ ...k, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data as GorevKategori;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["gorev_kategori"] }),
  });
}

export function useKategoriGuncelle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...patch
    }: Partial<GorevKategori> & { id: string }) => {
      const { error } = await supabase
        .from("gorev_kategori")
        .update(patch)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["gorev_kategori"] }),
  });
}

export function useKategoriSil() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("gorev_kategori").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gorev_kategori"] });
      qc.invalidateQueries({ queryKey: ["gunluk_gorev"] });
      qc.invalidateQueries({ queryKey: ["sablonlar"] });
    },
  });
}

export const VARSAYILAN_KATEGORILER: Array<Omit<GorevKategoriEkle, "user_id">> = [
  { ad: "Maneviyat", emoji: "🤲", renk: "mana", siralama: 1 },
  { ad: "Okumalar", emoji: "📖", renk: "mana", siralama: 2 },
  { ad: "İletişim & Rehberlik", emoji: "💬", renk: "kisisel", siralama: 3 },
  { ad: "Diğer", emoji: "•", renk: "kisisel", siralama: 99 },
];

export function useVarsayilanKategorileriOlustur() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Giriş gerekli");
      const rows = VARSAYILAN_KATEGORILER.map((k) => ({ ...k, user_id: user.id }));
      const { error } = await supabase.from("gorev_kategori").insert(rows);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["gorev_kategori"] }),
  });
}