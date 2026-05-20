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

export type RaporFiltre = {
  from: string; // YYYY-MM-DD
  to: string;   // YYYY-MM-DD
  kategoriIds?: string[];
  sonucDurumu?: "tumu" | "dolu" | "bos";
  gundemDurumu?: "tumu" | "bekliyor" | "yapildi";
};

export type RaporGundemSatir = {
  id: string;
  istisare_id: string;
  istisare_baslik: string;
  istisare_tarih: string;
  icerik: string;
  karar: string | null;
  durum: GundemDurum;
  deadline: string | null;
  tamamlanma: string | null;
  sorumlu_ids: string[];
  sorumlu_adlar: string[];
  created_at: string;
};

export type RaporFaaliyetSatir = {
  id: string;
  kisi_id: string;
  kisi_ad: string;
  tip: KardesEtkinlikTip;
  tarih: string;
  baslik: string;
  sonuc: string | null;
  notlar: string | null;
};

export type RaporManeviyatKisi = {
  kisi_id: string;
  kisi_ad: string;
  aktif_mufredat_sayisi: number;
  mufredat_ilerleme_yuzde: number; // 0-100
  evrad_madde_sayisi: number;
  evrad_kayit_sayisi: number; // toplam tik (madde x gün)
  evrad_doluluk_yuzde: number; // 0-100, aralıkta beklenen tik üzerinden
};

function _kisiUygunMu(
  kisi: KisiDetay,
  filtre: RaporFiltre,
): boolean {
  if (filtre.kategoriIds && filtre.kategoriIds.length > 0) {
    const kesisim = kisi.kategori_ids.some((kid) => filtre.kategoriIds!.includes(kid));
    if (!kesisim) return false;
  }
  return true;
}

export function useRaporGundemler(filtre: RaporFiltre, aktif: boolean) {
  const { user } = useAuth();
  return useQuery({
    queryKey: [
      "network",
      "rapor",
      "gundemler",
      user?.id,
      filtre.from,
      filtre.to,
      (filtre.kategoriIds ?? []).join(","),
      filtre.sonucDurumu ?? "tumu",
      filtre.gundemDurumu ?? "tumu",
    ],
    enabled: !!user && aktif,
    queryFn: async (): Promise<RaporGundemSatir[]> => {
      // İstişareleri tarih aralığında çek
      const { data: istisareler, error: e1 } = await supabase
        .from("istisare")
        .select("id, baslik, tarih")
        .gte("tarih", filtre.from)
        .lte("tarih", filtre.to);
      if (e1) throw e1;
      const istIdMap = new Map<string, { baslik: string; tarih: string }>();
      (istisareler ?? []).forEach((i) =>
        istIdMap.set(i.id, { baslik: i.baslik, tarih: i.tarih }),
      );
      if (istIdMap.size === 0) return [];

      let q = supabase
        .from("gundem")
        .select("*")
        .in("istisare_id", Array.from(istIdMap.keys()));
      if (filtre.gundemDurumu && filtre.gundemDurumu !== "tumu") {
        q = q.eq("durum", filtre.gundemDurumu);
      }
      const { data: gundemler, error: e2 } = await q;
      if (e2) throw e2;
      const gs = (gundemler ?? []) as Gundem[];
      if (gs.length === 0) return [];

      const ids = gs.map((g) => g.id);
      const [sRes, kRes] = await Promise.all([
        supabase
          .from("gundem_sorumlu")
          .select("gundem_id, kisi_id")
          .in("gundem_id", ids),
        supabase.from("gundem_kisi").select("id, ad"),
      ]);
      if (sRes.error) throw sRes.error;
      if (kRes.error) throw kRes.error;
      const sorumlular = sRes.data ?? [];
      const adMap = new Map<string, string>();
      (kRes.data ?? []).forEach((k) => adMap.set(k.id, k.ad));

      let satirlar: RaporGundemSatir[] = gs.map((g) => {
        const ist = istIdMap.get(g.istisare_id)!;
        const sorumluIds = sorumlular
          .filter((s) => s.gundem_id === g.id)
          .map((s) => s.kisi_id);
        return {
          id: g.id,
          istisare_id: g.istisare_id,
          istisare_baslik: ist.baslik,
          istisare_tarih: ist.tarih,
          icerik: g.icerik,
          karar: g.karar,
          durum: g.durum,
          deadline: g.deadline,
          tamamlanma: g.tamamlanma,
          sorumlu_ids: sorumluIds,
          sorumlu_adlar: sorumluIds
            .map((id) => adMap.get(id) ?? "")
            .filter(Boolean),
          created_at: g.created_at,
        };
      });

      // Sonuç doluluğu
      if (filtre.sonucDurumu === "dolu") {
        satirlar = satirlar.filter((s) => (s.karar ?? "").trim().length > 0);
      } else if (filtre.sonucDurumu === "bos") {
        satirlar = satirlar.filter((s) => !(s.karar ?? "").trim().length);
      }

      // Kategori filtresi: sorumluların kategorilere üyeliği
      if (filtre.kategoriIds && filtre.kategoriIds.length > 0) {
        const { data: bag } = await supabase
          .from("gundem_kisi_kategori")
          .select("kisi_id, kategori_id")
          .in("kategori_id", filtre.kategoriIds);
        const uygunKisi = new Set((bag ?? []).map((b) => b.kisi_id));
        satirlar = satirlar.filter((s) =>
          s.sorumlu_ids.some((id) => uygunKisi.has(id)),
        );
      }

      satirlar.sort((a, b) => (a.istisare_tarih < b.istisare_tarih ? 1 : -1));
      return satirlar;
    },
  });
}

export function useRaporFaaliyetler(filtre: RaporFiltre, aktif: boolean) {
  const { user } = useAuth();
  return useQuery({
    queryKey: [
      "network",
      "rapor",
      "faaliyetler",
      user?.id,
      filtre.from,
      filtre.to,
      (filtre.kategoriIds ?? []).join(","),
      filtre.sonucDurumu ?? "tumu",
    ],
    enabled: !!user && aktif,
    queryFn: async (): Promise<RaporFaaliyetSatir[]> => {
      const q = supabase
        .from("kardes_etkinlik")
        .select("*")
        .gte("tarih", filtre.from)
        .lte("tarih", filtre.to);
      const { data, error } = await q;
      if (error) throw error;
      const etk = (data ?? []) as KardesEtkinlik[];
      if (etk.length === 0) return [];

      const kisiIds = Array.from(new Set(etk.map((e) => e.kisi_id)));
      const [adRes, bagRes] = await Promise.all([
        supabase.from("gundem_kisi").select("id, ad").in("id", kisiIds),
        filtre.kategoriIds && filtre.kategoriIds.length > 0
          ? supabase
              .from("gundem_kisi_kategori")
              .select("kisi_id, kategori_id")
              .in("kisi_id", kisiIds)
              .in("kategori_id", filtre.kategoriIds)
          : Promise.resolve({ data: null as null | { kisi_id: string }[], error: null }),
      ]);
      if (adRes.error) throw adRes.error;
      const adMap = new Map<string, string>();
      (adRes.data ?? []).forEach((k) => adMap.set(k.id, k.ad));

      let satirlar: RaporFaaliyetSatir[] = etk.map((e) => ({
        id: e.id,
        kisi_id: e.kisi_id,
        kisi_ad: adMap.get(e.kisi_id) ?? "—",
        tip: e.tip,
        tarih: e.tarih,
        baslik: e.baslik,
        sonuc: e.sonuc,
        notlar: e.notlar,
      }));

      if (filtre.kategoriIds && filtre.kategoriIds.length > 0) {
        const uygun = new Set((bagRes.data ?? []).map((b) => b.kisi_id));
        satirlar = satirlar.filter((s) => uygun.has(s.kisi_id));
      }
      if (filtre.sonucDurumu === "dolu") {
        satirlar = satirlar.filter((s) => (s.sonuc ?? "").trim().length > 0);
      } else if (filtre.sonucDurumu === "bos") {
        satirlar = satirlar.filter((s) => !(s.sonuc ?? "").trim().length);
      }

      satirlar.sort((a, b) => (a.tarih < b.tarih ? 1 : -1));
      return satirlar;
    },
  });
}

export function useRaporManeviyat(filtre: RaporFiltre, aktif: boolean) {
  const { user } = useAuth();
  return useQuery({
    queryKey: [
      "network",
      "rapor",
      "maneviyat",
      user?.id,
      filtre.from,
      filtre.to,
      (filtre.kategoriIds ?? []).join(","),
    ],
    enabled: !!user && aktif,
    queryFn: async (): Promise<RaporManeviyatKisi[]> => {
      // Kişileri filtrele
      const [kisilerRes, bagRes] = await Promise.all([
        supabase.from("gundem_kisi").select("id, ad"),
        supabase.from("gundem_kisi_kategori").select("kisi_id, kategori_id"),
      ]);
      if (kisilerRes.error) throw kisilerRes.error;
      if (bagRes.error) throw bagRes.error;
      const adMap = new Map<string, string>();
      (kisilerRes.data ?? []).forEach((k) => adMap.set(k.id, k.ad));
      const kisiKategoriMap = new Map<string, string[]>();
      (bagRes.data ?? []).forEach((b) => {
        const arr = kisiKategoriMap.get(b.kisi_id) ?? [];
        arr.push(b.kategori_id);
        kisiKategoriMap.set(b.kisi_id, arr);
      });

      let kisiIds = (kisilerRes.data ?? []).map((k) => k.id);
      if (filtre.kategoriIds && filtre.kategoriIds.length > 0) {
        kisiIds = kisiIds.filter((id) =>
          (kisiKategoriMap.get(id) ?? []).some((k) => filtre.kategoriIds!.includes(k)),
        );
      }
      if (kisiIds.length === 0) return [];

      const [mufRes, evMaddeRes, evKayitRes] = await Promise.all([
        supabase
          .from("kardes_mufredat")
          .select("*")
          .in("kisi_id", kisiIds)
          .eq("arsiv", false),
        supabase
          .from("kardes_evrad_madde")
          .select("*")
          .in("kisi_id", kisiIds)
          .eq("aktif", true),
        supabase
          .from("kardes_evrad_kayit")
          .select("*")
          .in("kisi_id", kisiIds)
          .gte("tarih", filtre.from)
          .lte("tarih", filtre.to),
      ]);
      if (mufRes.error) throw mufRes.error;
      if (evMaddeRes.error) throw evMaddeRes.error;
      if (evKayitRes.error) throw evKayitRes.error;

      const mufler = (mufRes.data ?? []) as KardesMufredat[];
      const evMaddeler = (evMaddeRes.data ?? []) as KardesEvradMadde[];
      const evKayitlar = (evKayitRes.data ?? []) as KardesEvradKayit[];

      // Aralık gün sayısı
      const fromD = new Date(filtre.from);
      const toD = new Date(filtre.to);
      const gunSayisi = Math.max(
        1,
        Math.floor((toD.getTime() - fromD.getTime()) / 86400000) + 1,
      );

      return kisiIds.map((kid) => {
        const benimMufler = mufler.filter((m) => m.kisi_id === kid);
        const tumMaddeler = benimMufler.flatMap(
          (m) => (m.maddeler as MufredatMadde[]) ?? [],
        );
        const tamam = tumMaddeler.filter((md) => md.tamamlandi).length;
        const yuzde = tumMaddeler.length
          ? Math.round((tamam / tumMaddeler.length) * 100)
          : 0;
        const benimMaddeler = evMaddeler.filter((e) => e.kisi_id === kid);
        const benimKayit = evKayitlar.filter((k) => k.kisi_id === kid);
        const beklenen = benimMaddeler.length * gunSayisi;
        const dolulukYuzde = beklenen
          ? Math.min(100, Math.round((benimKayit.length / beklenen) * 100))
          : 0;
        return {
          kisi_id: kid,
          kisi_ad: adMap.get(kid) ?? "—",
          aktif_mufredat_sayisi: benimMufler.length,
          mufredat_ilerleme_yuzde: yuzde,
          evrad_madde_sayisi: benimMaddeler.length,
          evrad_kayit_sayisi: benimKayit.length,
          evrad_doluluk_yuzde: dolulukYuzde,
        };
      });
    },
  });
}
