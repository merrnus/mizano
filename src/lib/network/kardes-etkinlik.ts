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

export function useKardesEtkinlikler(kisi_id: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["network", "etkinlikler", kisi_id],
    enabled: !!user && !!kisi_id,
    queryFn: async (): Promise<KardesEtkinlik[]> => {
      const { data, error } = await supabase
        .from("kardes_etkinlik")
        .select("*")
        .eq("kisi_id", kisi_id!)
        .order("tarih", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as KardesEtkinlik[];
    },
  });
}

export function useKardesEtkinlikEkle() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (k: {
      kisi_id: string;
      tip: KardesEtkinlikTip;
      tarih: string;
      baslik: string;
      notlar?: string | null;
      sonuc?: string | null;
      baslangic_saati?: string | null;
      bitis_saati?: string | null;
      takvime_ekle?: boolean;
      kisi_ad?: string;
    }) => {
      if (!user) throw new Error("Giriş gerekli");
      let takvim_etkinlik_id: string | null = null;
      if (k.takvime_ekle) {
        takvim_etkinlik_id = await takvimeYansit({
          user_id: user.id,
          baslik: k.kisi_ad ? `${k.baslik} — ${k.kisi_ad}` : k.baslik,
          tarih: k.tarih,
          baslangic_saati: k.baslangic_saati ?? null,
          bitis_saati: k.bitis_saati ?? null,
          aciklama: k.notlar ?? null,
        });
      }
      const { error } = await supabase.from("kardes_etkinlik").insert({
        user_id: user.id,
        kisi_id: k.kisi_id,
        tip: k.tip,
        tarih: k.tarih,
        baslik: k.baslik,
        notlar: k.notlar ?? null,
        sonuc: k.sonuc ?? null,
        baslangic_saati: k.baslangic_saati ?? null,
        bitis_saati: k.bitis_saati ?? null,
        takvim_etkinlik_id,
      });
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["network", "etkinlikler", v.kisi_id] });
      qc.invalidateQueries({ queryKey: ["network", "evdekiler"] });
      qc.invalidateQueries({ queryKey: ["takvim"] });
    },
  });
}

export function useKardesEtkinlikGuncelle() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (k: {
      id: string;
      kisi_id: string;
      tip?: KardesEtkinlikTip;
      tarih?: string;
      baslik?: string;
      notlar?: string | null;
      sonuc?: string | null;
      baslangic_saati?: string | null;
      bitis_saati?: string | null;
      takvime_ekle?: boolean;
      kisi_ad?: string;
    }) => {
      if (!user) throw new Error("Giriş gerekli");
      const { id, kisi_id: _k, takvime_ekle, kisi_ad, ...patch } = k;
      // Mevcut kaydı oku (takvim_etkinlik_id için)
      const { data: mevcut } = await supabase
        .from("kardes_etkinlik")
        .select("takvim_etkinlik_id, baslik, tarih, baslangic_saati, bitis_saati, notlar")
        .eq("id", id)
        .single();
      const eskiTakvimId = (mevcut as { takvim_etkinlik_id: string | null } | null)?.takvim_etkinlik_id ?? null;

      let yeniTakvimId: string | null | undefined = undefined;
      if (takvime_ekle === true) {
        // Takvim'e yansıt — yoksa oluştur, varsa güncelle
        const baslik = (patch.baslik ?? mevcut?.baslik ?? "");
        const tarih = (patch.tarih ?? mevcut?.tarih ?? "");
        const bsaat = patch.baslangic_saati !== undefined ? patch.baslangic_saati : (mevcut?.baslangic_saati ?? null);
        const esaat = patch.bitis_saati !== undefined ? patch.bitis_saati : (mevcut?.bitis_saati ?? null);
        const aciklama = patch.notlar !== undefined ? patch.notlar : (mevcut?.notlar ?? null);
        if (eskiTakvimId) {
          await takvimiGuncelle(eskiTakvimId, {
            baslik: kisi_ad ? `${baslik} — ${kisi_ad}` : baslik,
            tarih,
            baslangic_saati: bsaat,
            bitis_saati: esaat,
            aciklama,
          });
          yeniTakvimId = eskiTakvimId;
        } else {
          yeniTakvimId = await takvimeYansit({
            user_id: user.id,
            baslik: kisi_ad ? `${baslik} — ${kisi_ad}` : baslik,
            tarih,
            baslangic_saati: bsaat,
            bitis_saati: esaat,
            aciklama,
          });
        }
      } else if (takvime_ekle === false && eskiTakvimId) {
        // Takvimden kaldır
        await supabase.from("takvim_etkinlik").delete().eq("id", eskiTakvimId);
        yeniTakvimId = null;
      }

      const finalPatch = {
        ...patch,
        ...(yeniTakvimId !== undefined ? { takvim_etkinlik_id: yeniTakvimId } : {}),
      };
      const { error } = await supabase.from("kardes_etkinlik").update(finalPatch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["network", "etkinlikler", v.kisi_id] });
      qc.invalidateQueries({ queryKey: ["network", "evdekiler"] });
      qc.invalidateQueries({ queryKey: ["takvim"] });
    },
  });
}

export function useKardesEtkinlikSil() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (k: { id: string; kisi_id: string }) => {
      // Bağlı takvim kaydını da sil
      const { data: mevcut } = await supabase
        .from("kardes_etkinlik")
        .select("takvim_etkinlik_id")
        .eq("id", k.id)
        .single();
      const tid = (mevcut as { takvim_etkinlik_id: string | null } | null)?.takvim_etkinlik_id;
      if (tid) {
        await supabase.from("takvim_etkinlik").delete().eq("id", tid);
      }
      const { error } = await supabase.from("kardes_etkinlik").delete().eq("id", k.id);
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["network", "etkinlikler", v.kisi_id] });
      qc.invalidateQueries({ queryKey: ["network", "evdekiler"] });
      qc.invalidateQueries({ queryKey: ["takvim"] });
    },
  });
}

/* ---------------- TAKVİM YANSITMA YARDIMCILARI ---------------- */

/** YYYY-MM-DD + HH:mm:ss → ISO string (yerel saat). */
function birlestirISO(tarih: string, saat: string | null): string {
  const [y, m, g] = tarih.split("-").map(Number);
  if (saat) {
    const [sa, dk] = saat.split(":").map(Number);
    return new Date(y, (m ?? 1) - 1, g ?? 1, sa ?? 0, dk ?? 0, 0, 0).toISOString();
  }
  return new Date(y, (m ?? 1) - 1, g ?? 1, 0, 0, 0, 0).toISOString();
}

async function takvimeYansit(p: {
  user_id: string;
  baslik: string;
  tarih: string;
  baslangic_saati: string | null;
  bitis_saati: string | null;
  aciklama: string | null;
}): Promise<string | null> {
  const tum_gun = !p.baslangic_saati;
  const baslangic = birlestirISO(p.tarih, p.baslangic_saati);
  const bitis = p.bitis_saati
    ? birlestirISO(p.tarih, p.bitis_saati)
    : (p.baslangic_saati
        ? birlestirISO(p.tarih, addMinutes(p.baslangic_saati, 60))
        : null);
  const { data, error } = await supabase
    .from("takvim_etkinlik")
    .insert({
      user_id: p.user_id,
      baslik: p.baslik,
      aciklama: p.aciklama,
      baslangic,
      bitis,
      tum_gun,
      alan: "mana" as const,
      tekrar: "yok" as const,
    })
    .select("id")
    .single();
  if (error || !data) return null;
  return data.id;
}

async function takvimiGuncelle(
  id: string,
  p: {
    baslik: string;
    tarih: string;
    baslangic_saati: string | null;
    bitis_saati: string | null;
    aciklama: string | null;
  },
) {
  const tum_gun = !p.baslangic_saati;
  const baslangic = birlestirISO(p.tarih, p.baslangic_saati);
  const bitis = p.bitis_saati
    ? birlestirISO(p.tarih, p.bitis_saati)
    : (p.baslangic_saati ? birlestirISO(p.tarih, addMinutes(p.baslangic_saati, 60)) : null);
  await supabase
    .from("takvim_etkinlik")
    .update({
      baslik: p.baslik,
      aciklama: p.aciklama,
      baslangic,
      bitis,
      tum_gun,
    })
    .eq("id", id);
}

function addMinutes(saat: string, dk: number): string {
  const [s, d] = saat.split(":").map(Number);
  const total = (s ?? 0) * 60 + (d ?? 0) + dk;
  const sa = Math.floor(total / 60) % 24;
  const dkk = total % 60;
  return `${String(sa).padStart(2, "0")}:${String(dkk).padStart(2, "0")}`;
}

