import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import type { KardesEtkinlikTip } from "@/lib/network-tipleri";

export type AktiviteGrup = "aksiyon" | "manevi";

export type AktiviteTip = {
  id: string;
  user_id: string;
  ad: string;
  grup: AktiviteGrup;
  siralama: number;
  created_at: string;
  updated_at: string;
};

/** Yeni faaliyet adı → mevcut kardes_etkinlik enum eşlemesi (DB NOT NULL).
 *  Tip adı `kardes_etkinlik.baslik` alanında zaten görünür, enum sadece kategorize için. */
export function aktiviteAdiniEnumaCevir(ad: string): KardesEtkinlikTip {
  const a = ad.toLocaleLowerCase("tr");
  if (a.includes("kuran")) return "kuran";
  if (a.includes("zoom") || a.includes("online")) return "zoom";
  if (a.includes("spor") || a.includes("halı") || a.includes("hali") || a.includes("saha")) return "spor";
  if (a.includes("çay") || a.includes("cay") || a.includes("kahve") || a.includes("teke")) return "teke_tek";
  if (a.includes("sophia") || a.includes("ders")) return "sophia";
  if (a.includes("istişare") || a.includes("istisare")) return "istisare";
  if (a.includes("kandil")) return "kandil";
  if (a.includes("kamp")) return "kamp";
  return "sohbet";
}

const VARSAYILANLAR: { ad: string; grup: AktiviteGrup; siralama: number }[] = [
  { ad: "Halı Saha", grup: "aksiyon", siralama: 0 },
  { ad: "Çay/Kahve", grup: "aksiyon", siralama: 1 },
  { ad: "Sabah Namazı + Çorba", grup: "aksiyon", siralama: 2 },
  { ad: "Hasbihal", grup: "manevi", siralama: 3 },
  { ad: "Kuran Pratik", grup: "manevi", siralama: 4 },
  { ad: "Online Sohbet", grup: "manevi", siralama: 5 },
];

export function useAktiviteTipleri() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useQuery({
    queryKey: ["aktivite-tip", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<AktiviteTip[]> => {
      const { data, error } = await supabase
        .from("aktivite_tip")
        .select("*")
        .order("grup", { ascending: true })
        .order("siralama", { ascending: true });
      if (error) throw error;
      if (!data || data.length === 0) {
        const rows = VARSAYILANLAR.map((v) => ({ ...v, user_id: user!.id }));
        const { data: yeni, error: e2 } = await supabase
          .from("aktivite_tip")
          .insert(rows)
          .select("*");
        if (e2) throw e2;
        qc.invalidateQueries({ queryKey: ["aktivite-tip"] });
        return (yeni ?? []) as AktiviteTip[];
      }
      return data as AktiviteTip[];
    },
  });
}

export function useAktiviteTipEkle() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (p: { ad: string; grup: AktiviteGrup }) => {
      if (!user) throw new Error("Giriş gerekli");
      const { error } = await supabase.from("aktivite_tip").insert({
        user_id: user.id,
        ad: p.ad,
        grup: p.grup,
        siralama: 99,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aktivite-tip"] }),
  });
}