import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./auth-context";
import { type BaglamTanim, type BaglamRenk, siradakiRenk, BAGLAM_RENKLERI } from "./cetele-baglam";

const DEFAULT_SEED: Array<Omit<BaglamTanim, "id">> = [
  { slug: "masa", etiket: "Masa Başı", emoji: "🏠", renk: "sky", siralama: 0 },
  { slug: "yol", etiket: "Yolda", emoji: "🚌", renk: "emerald", siralama: 1 },
  { slug: "cami", etiket: "Camide", emoji: "🕌", renk: "amber", siralama: 2 },
  { slug: "dinlenme", etiket: "Dinlenme", emoji: "🛋️", renk: "violet", siralama: 3 },
];

function rastgeleSlug() {
  return "b" + Math.random().toString(36).slice(2, 8);
}

/** Kullanıcının bağlamlarını döner. Hiç yoksa default 4'ü idempotent ekler. */
export function useBaglamlar() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const seedRunRef = React.useRef(false);

  const q = useQuery({
    queryKey: ["baglamlar", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<BaglamTanim[]> => {
      const { data, error } = await supabase
        .from("cetele_baglam")
        .select("*")
        .order("siralama", { ascending: true });
      if (error) throw error;
      return (data ?? []) as BaglamTanim[];
    },
  });

  // Hiç bağlam yoksa default seed (idempotent — sadece 1 kez denenir).
  React.useEffect(() => {
    if (!user || !q.data || q.isLoading) return;
    if (q.data.length > 0) return;
    if (seedRunRef.current) return;
    seedRunRef.current = true;
    (async () => {
      const rows = DEFAULT_SEED.map((b) => ({ ...b, user_id: user.id }));
      await supabase.from("cetele_baglam").insert(rows);
      qc.invalidateQueries({ queryKey: ["baglamlar", user.id] });
    })();
  }, [user, q.data, q.isLoading, qc]);

  return q;
}

/** Slug → tanım map (chip render için kolay erişim). */
export function useBaglamMap() {
  const { data = [] } = useBaglamlar();
  return React.useMemo(() => {
    const m: Record<string, BaglamTanim> = {};
    for (const b of data) m[b.slug] = b;
    return m;
  }, [data]);
}

export function useBaglamEkle() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { etiket: string; emoji: string }) => {
      if (!user) throw new Error("auth gerekli");
      const mevcut = (qc.getQueryData<BaglamTanim[]>(["baglamlar", user.id]) ?? []);
      const renk: BaglamRenk = siradakiRenk(mevcut.length);
      const siralama = mevcut.reduce((m, b) => Math.max(m, b.siralama), -1) + 1;
      const slug = rastgeleSlug();
      const { data, error } = await supabase
        .from("cetele_baglam")
        .insert({
          user_id: user.id,
          slug,
          etiket: input.etiket.trim() || "Yeni",
          emoji: input.emoji || "📌",
          renk,
          siralama,
        })
        .select()
        .single();
      if (error) throw error;
      return data as BaglamTanim;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["baglamlar", user?.id] }),
  });
}

export function useBaglamGuncelle() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; etiket?: string; emoji?: string; renk?: BaglamRenk }) => {
      const patch: Record<string, unknown> = {};
      if (input.etiket !== undefined) patch.etiket = input.etiket.trim() || "Yeni";
      if (input.emoji !== undefined) patch.emoji = input.emoji || "📌";
      if (input.renk !== undefined) patch.renk = input.renk;
      const { error } = await supabase.from("cetele_baglam").update(patch).eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["baglamlar", user?.id] }),
  });
}

/** Bağlamı siler ve tüm sablonların baglamlar[] array'inden slug'ı çıkarır. */
export function useBaglamSil() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; slug: string }) => {
      if (!user) throw new Error("auth gerekli");
      // 1) İlgili sablonları al
      const { data: sablonlar, error: e1 } = await supabase
        .from("cetele_sablon")
        .select("id, baglamlar")
        .contains("baglamlar", [input.slug]);
      if (e1) throw e1;
      // 2) Her birinden slug'ı çıkar
      for (const s of sablonlar ?? []) {
        const yeni = (s.baglamlar ?? []).filter((x: string) => x !== input.slug);
        const { error: e2 } = await supabase
          .from("cetele_sablon")
          .update({ baglamlar: yeni })
          .eq("id", s.id);
        if (e2) throw e2;
      }
      // 3) Bağlamı sil
      const { error: e3 } = await supabase.from("cetele_baglam").delete().eq("id", input.id);
      if (e3) throw e3;
      return { etkilenen: sablonlar?.length ?? 0 };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["baglamlar", user?.id] });
      qc.invalidateQueries({ queryKey: ["sablonlar", user?.id] });
    },
  });
}

export { BAGLAM_RENKLERI };