import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import {
  type Kategori,
  type Kisi,
  type KisiDetay,
  type Istisare,
  type IstisareOzet,
  type Gundem,
  type GundemDetay,
  type GundemYorum,
  type GundemDurum,
  type GundemOncelik,
  type KardesEtkinlik,
  type KardesEtkinlikTip,
  type KardesMufredat,
  type KardesEvradMadde,
  type KardesEvradKayit,
  type MufredatMadde,
  VARSAYILAN_KATEGORILER,
} from "@/lib/network-tipleri";

export type BuHaftaOzet = {
  programlar: { kisi: Kisi; etkinlik: KardesEtkinlik }[]; // istisare + sohbet
  faaliyetler: { kisi: Kisi; etkinlik: KardesEtkinlik }[]; // diğerleri
  haftaBas: string; // YYYY-MM-DD
  haftaSon: string; // YYYY-MM-DD
};

function haftaSinirlari(now: Date): { bas: string; son: string } {
  const d = new Date(now);
  const gun = d.getDay(); // 0 Paz, 1 Pzt ...
  const offsetPzt = gun === 0 ? -6 : 1 - gun;
  const bas = new Date(d.getFullYear(), d.getMonth(), d.getDate() + offsetPzt);
  const son = new Date(bas);
  son.setDate(bas.getDate() + 6);
  const fmt = (x: Date) =>
    `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
  return { bas: fmt(bas), son: fmt(son) };
}

export function useBuHaftaOzet() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["network", "bu-hafta", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<BuHaftaOzet> => {
      const { bas, son } = haftaSinirlari(new Date());

      const { data: kisilerRaw, error: e1 } = await supabase.from("gundem_kisi").select("*");
      if (e1) throw e1;
      const kisiler = (kisilerRaw ?? []) as Kisi[];
      const kisiMap = new Map(kisiler.map((k) => [k.id, k] as const));

      const { data: etkinliklerRaw, error: e2 } = await supabase
        .from("kardes_etkinlik")
        .select("*")
        .gte("tarih", bas)
        .lte("tarih", son);
      if (e2) throw e2;
      const etkinlikler = (etkinliklerRaw ?? []) as KardesEtkinlik[];

      const sirala = (a: KardesEtkinlik, b: KardesEtkinlik) => {
        const t = a.tarih.localeCompare(b.tarih);
        if (t !== 0) return t;
        return (a.baslangic_saati ?? "").localeCompare(b.baslangic_saati ?? "");
      };

      const programlar: BuHaftaOzet["programlar"] = [];
      const faaliyetler: BuHaftaOzet["faaliyetler"] = [];

      etkinlikler.sort(sirala).forEach((e) => {
        const k = kisiMap.get(e.kisi_id);
        if (!k) return;
        if (e.tip === "istisare" || e.tip === "sohbet") {
          programlar.push({ kisi: k, etkinlik: e });
        } else {
          faaliyetler.push({ kisi: k, etkinlik: e });
        }
      });

      return { programlar, faaliyetler, haftaBas: bas, haftaSon: son };
    },
  });
}
/* ---------------- MANEVİYAT: 3 Aylık Müfredat ---------------- */
