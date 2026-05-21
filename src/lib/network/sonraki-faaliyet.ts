import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export type FaaliyetOzet = {
  kisi_id: string;
  son_tarih: string | null; // YYYY-MM-DD
  sonraki_tarih: string | null;
  sonraki_baslik: string | null;
};

export type FaaliyetDurum = "yesil" | "sari" | "gri";

export function durumHesapla(sonTarih: string | null): FaaliyetDurum {
  if (!sonTarih) return "gri";
  const d = new Date(sonTarih + "T00:00:00");
  const gun = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  if (gun <= 7) return "yesil";
  if (gun <= 21) return "sari";
  return "gri";
}

/** Tüm kişiler için tek seferde son/sonraki faaliyet özetini getirir. */
export function useFaaliyetOzetleri() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["network", "faaliyet-ozet", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Record<string, FaaliyetOzet>> => {
      const bugun = new Date().toISOString().slice(0, 10);
      const [gecmis, gelecek] = await Promise.all([
        supabase
          .from("kardes_etkinlik")
          .select("kisi_id, tarih")
          .lte("tarih", bugun)
          .order("tarih", { ascending: false }),
        supabase
          .from("kardes_etkinlik")
          .select("kisi_id, tarih, baslik")
          .gt("tarih", bugun)
          .order("tarih", { ascending: true }),
      ]);
      if (gecmis.error) throw gecmis.error;
      if (gelecek.error) throw gelecek.error;
      const out: Record<string, FaaliyetOzet> = {};
      for (const r of gecmis.data ?? []) {
        if (!out[r.kisi_id]) {
          out[r.kisi_id] = {
            kisi_id: r.kisi_id,
            son_tarih: r.tarih,
            sonraki_tarih: null,
            sonraki_baslik: null,
          };
        }
      }
      for (const r of gelecek.data ?? []) {
        if (!out[r.kisi_id]) {
          out[r.kisi_id] = {
            kisi_id: r.kisi_id,
            son_tarih: null,
            sonraki_tarih: r.tarih,
            sonraki_baslik: r.baslik,
          };
        } else if (!out[r.kisi_id].sonraki_tarih) {
          out[r.kisi_id].sonraki_tarih = r.tarih;
          out[r.kisi_id].sonraki_baslik = r.baslik;
        }
      }
      return out;
    },
  });
}