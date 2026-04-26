import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./auth-context";
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
  VARSAYILAN_KATEGORILER,
} from "./network-tipleri";

/* ---------------- KATEGORI ---------------- */

export function useKategoriler() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useQuery({
    queryKey: ["network", "kategoriler", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Kategori[]> => {
      const { data, error } = await supabase
        .from("gundem_kategori")
        .select("*")
        .order("siralama", { ascending: true });
      if (error) throw error;
      // Seed varsayılanlar
      if (!data || data.length === 0) {
        const rows = VARSAYILAN_KATEGORILER.map((k) => ({
          user_id: user!.id,
          ad: k.ad,
          renk: k.renk,
          siralama: k.siralama,
        }));
        const { data: yeni, error: e2 } = await supabase
          .from("gundem_kategori")
          .insert(rows)
          .select("*");
        if (e2) throw e2;
        qc.invalidateQueries({ queryKey: ["network", "kategoriler"] });
        return (yeni ?? []) as Kategori[];
      }
      return data as Kategori[];
    },
  });
}

export function useKategoriEkle() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (k: { ad: string; renk?: string | null; siralama?: number }) => {
      if (!user) throw new Error("Giriş gerekli");
      const { error } = await supabase.from("gundem_kategori").insert({
        user_id: user.id,
        ad: k.ad,
        renk: k.renk ?? null,
        siralama: k.siralama ?? 99,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["network", "kategoriler"] }),
  });
}

export function useKategoriGuncelle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (k: { id: string; ad?: string; renk?: string | null; siralama?: number }) => {
      const { id, ...patch } = k;
      const { error } = await supabase.from("gundem_kategori").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["network", "kategoriler"] }),
  });
}

export function useKategoriSil() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("gundem_kategori").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["network", "kategoriler"] });
      qc.invalidateQueries({ queryKey: ["network", "kisiler"] });
    },
  });
}

/* ---------------- KISI ---------------- */

export function useKisiler() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["network", "kisiler", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<KisiDetay[]> => {
      const [kisilerRes, baglantiRes] = await Promise.all([
        supabase.from("gundem_kisi").select("*").order("ad", { ascending: true }),
        supabase.from("gundem_kisi_kategori").select("kisi_id, kategori_id"),
      ]);
      if (kisilerRes.error) throw kisilerRes.error;
      if (baglantiRes.error) throw baglantiRes.error;
      const baglantilar = baglantiRes.data ?? [];
      return (kisilerRes.data ?? []).map((k) => ({
        ...(k as Kisi),
        kategori_ids: baglantilar.filter((b) => b.kisi_id === k.id).map((b) => b.kategori_id),
      }));
    },
  });
}

export function useKisiEkle() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (k: { ad: string; notlar?: string | null; kategori_ids?: string[] }) => {
      if (!user) throw new Error("Giriş gerekli");
      const { data, error } = await supabase
        .from("gundem_kisi")
        .insert({ user_id: user.id, ad: k.ad, notlar: k.notlar ?? null })
        .select("id")
        .single();
      if (error) throw error;
      if (k.kategori_ids && k.kategori_ids.length > 0) {
        const rows = k.kategori_ids.map((kid) => ({
          user_id: user.id,
          kisi_id: data!.id,
          kategori_id: kid,
        }));
        const { error: e2 } = await supabase.from("gundem_kisi_kategori").insert(rows);
        if (e2) throw e2;
      }
      return data!.id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["network", "kisiler"] }),
  });
}

export function useKisiGuncelle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (k: { id: string; ad?: string; notlar?: string | null }) => {
      const { id, ...patch } = k;
      const { error } = await supabase.from("gundem_kisi").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["network", "kisiler"] }),
  });
}

export function useKisiSil() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("gundem_kisi").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["network", "kisiler"] });
      qc.invalidateQueries({ queryKey: ["network", "gundemler"] });
    },
  });
}

export function useKisiKategoriAyarla() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (p: { kisi_id: string; kategori_ids: string[] }) => {
      if (!user) throw new Error("Giriş gerekli");
      // Mevcut bağlantıları sil
      const { error: e1 } = await supabase
        .from("gundem_kisi_kategori")
        .delete()
        .eq("kisi_id", p.kisi_id);
      if (e1) throw e1;
      if (p.kategori_ids.length > 0) {
        const rows = p.kategori_ids.map((kid) => ({
          user_id: user.id,
          kisi_id: p.kisi_id,
          kategori_id: kid,
        }));
        const { error: e2 } = await supabase.from("gundem_kisi_kategori").insert(rows);
        if (e2) throw e2;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["network", "kisiler"] }),
  });
}

/* ---------------- ISTISARE ---------------- */

export function useIstisareler() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["network", "istisareler", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<IstisareOzet[]> => {
      const [iRes, gRes] = await Promise.all([
        supabase.from("istisare").select("*").order("tarih", { ascending: false }),
        supabase.from("gundem").select("istisare_id, durum"),
      ]);
      if (iRes.error) throw iRes.error;
      if (gRes.error) throw gRes.error;
      const gundemler = gRes.data ?? [];
      return (iRes.data ?? []).map((i) => {
        const sg = gundemler.filter((g) => g.istisare_id === i.id);
        return {
          ...(i as Istisare),
          toplam_gundem: sg.length,
          tamamlanan: sg.filter((g) => g.durum === "yapildi").length,
        };
      });
    },
  });
}

export function useIstisare(id: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["network", "istisare", id],
    enabled: !!user && !!id,
    queryFn: async (): Promise<Istisare | null> => {
      const { data, error } = await supabase.from("istisare").select("*").eq("id", id!).maybeSingle();
      if (error) throw error;
      return (data as Istisare) ?? null;
    },
  });
}

export function useIstisareEkle() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (k: { tarih: string; baslik?: string; notlar?: string | null }) => {
      if (!user) throw new Error("Giriş gerekli");
      const { data, error } = await supabase
        .from("istisare")
        .insert({
          user_id: user.id,
          tarih: k.tarih,
          baslik: k.baslik || `${k.tarih} İstişaresi`,
          notlar: k.notlar ?? null,
        })
        .select("id")
        .single();
      if (error) throw error;
      return data!.id as string;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["network", "istisareler"] }),
  });
}

export function useIstisareGuncelle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (k: { id: string; tarih?: string; baslik?: string; notlar?: string | null }) => {
      const { id, ...patch } = k;
      const { error } = await supabase.from("istisare").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["network", "istisareler"] });
      qc.invalidateQueries({ queryKey: ["network", "istisare", v.id] });
    },
  });
}

export function useIstisareSil() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      // Önce gündemleri sil (FK olmadığı için manuel)
      const { data: gundemler } = await supabase.from("gundem").select("id").eq("istisare_id", id);
      const ids = (gundemler ?? []).map((g) => g.id);
      if (ids.length > 0) {
        await supabase.from("gundem_sorumlu").delete().in("gundem_id", ids);
        await supabase.from("gundem_yorum").delete().in("gundem_id", ids);
        await supabase.from("gundem").delete().in("id", ids);
      }
      const { error } = await supabase.from("istisare").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["network", "istisareler"] });
      qc.invalidateQueries({ queryKey: ["network", "gundemler"] });
    },
  });
}

/* ---------------- GUNDEM ---------------- */

export function useGundemler(filtre?: { istisare_id?: string }) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["network", "gundemler", user?.id, filtre?.istisare_id ?? "all"],
    enabled: !!user,
    queryFn: async (): Promise<GundemDetay[]> => {
      let q = supabase
        .from("gundem")
        .select("*")
        .order("siralama", { ascending: true })
        .order("created_at", { ascending: false });
      if (filtre?.istisare_id) q = q.eq("istisare_id", filtre.istisare_id);
      const gRes = await q;
      if (gRes.error) throw gRes.error;
      const gundemler = (gRes.data ?? []) as Gundem[];
      if (gundemler.length === 0) return [];
      const ids = gundemler.map((g) => g.id);
      const [sRes, yRes] = await Promise.all([
        supabase.from("gundem_sorumlu").select("gundem_id, kisi_id").in("gundem_id", ids),
        supabase.from("gundem_yorum").select("gundem_id").in("gundem_id", ids),
      ]);
      if (sRes.error) throw sRes.error;
      if (yRes.error) throw yRes.error;
      const sorumlular = sRes.data ?? [];
      const yorumlar = yRes.data ?? [];
      return gundemler.map((g) => ({
        ...g,
        sorumlu_ids: sorumlular.filter((s) => s.gundem_id === g.id).map((s) => s.kisi_id),
        yorum_sayisi: yorumlar.filter((y) => y.gundem_id === g.id).length,
      }));
    },
  });
}

export function useGundemEkle() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (k: {
      istisare_id: string;
      icerik: string;
      oncelik?: GundemOncelik;
      durum?: GundemDurum;
      deadline?: string | null;
      sorumlu_ids?: string[];
      etiketler?: string[];
    }) => {
      if (!user) throw new Error("Giriş gerekli");
      const { data, error } = await supabase
        .from("gundem")
        .insert({
          user_id: user.id,
          istisare_id: k.istisare_id,
          icerik: k.icerik,
          oncelik: k.oncelik ?? "ana",
          durum: k.durum ?? "bekliyor",
          deadline: k.deadline ?? null,
          etiketler: k.etiketler ?? [],
        })
        .select("id")
        .single();
      if (error) throw error;
      if (k.sorumlu_ids && k.sorumlu_ids.length > 0) {
        const rows = k.sorumlu_ids.map((kid) => ({
          user_id: user.id,
          gundem_id: data!.id,
          kisi_id: kid,
        }));
        await supabase.from("gundem_sorumlu").insert(rows);
      }
      return data!.id as string;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["network", "gundemler"] });
      qc.invalidateQueries({ queryKey: ["network", "istisareler"] });
    },
  });
}

export function useGundemTopluEkle() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (p: { istisare_id: string; satirlar: string[] }) => {
      if (!user) throw new Error("Giriş gerekli");
      const rows = p.satirlar
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
        .map((s, i) => ({
          user_id: user.id,
          istisare_id: p.istisare_id,
          icerik: s,
          siralama: i,
        }));
      if (rows.length === 0) return 0;
      const { error } = await supabase.from("gundem").insert(rows);
      if (error) throw error;
      return rows.length;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["network", "gundemler"] });
      qc.invalidateQueries({ queryKey: ["network", "istisareler"] });
    },
  });
}

export function useGundemGuncelle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (k: {
      id: string;
      icerik?: string;
      karar?: string | null;
      deadline?: string | null;
      durum?: GundemDurum;
      oncelik?: GundemOncelik;
      etiketler?: string[];
      tamamlanma?: string | null;
    }) => {
      const { id, ...patch } = k;
      // Durum yapıldı'ya çekilirse otomatik tamamlanma
      if (patch.durum === "yapildi" && !("tamamlanma" in patch)) {
        patch.tamamlanma = new Date().toISOString().slice(0, 10);
      }
      if (patch.durum && patch.durum !== "yapildi") {
        patch.tamamlanma = null;
      }
      const { error } = await supabase.from("gundem").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["network", "gundemler"] });
      qc.invalidateQueries({ queryKey: ["network", "istisareler"] });
    },
  });
}

export function useGundemSil() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("gundem_sorumlu").delete().eq("gundem_id", id);
      await supabase.from("gundem_yorum").delete().eq("gundem_id", id);
      const { error } = await supabase.from("gundem").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["network", "gundemler"] });
      qc.invalidateQueries({ queryKey: ["network", "istisareler"] });
    },
  });
}

export function useGundemSorumluAyarla() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (p: { gundem_id: string; sorumlu_ids: string[] }) => {
      if (!user) throw new Error("Giriş gerekli");
      await supabase.from("gundem_sorumlu").delete().eq("gundem_id", p.gundem_id);
      if (p.sorumlu_ids.length > 0) {
        const rows = p.sorumlu_ids.map((kid) => ({
          user_id: user.id,
          gundem_id: p.gundem_id,
          kisi_id: kid,
        }));
        const { error } = await supabase.from("gundem_sorumlu").insert(rows);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["network", "gundemler"] }),
  });
}

export function useGundemTasi() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: { gundem_ids: string[]; hedef_istisare_id: string }) => {
      const { error } = await supabase
        .from("gundem")
        .update({ istisare_id: p.hedef_istisare_id })
        .in("id", p.gundem_ids);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["network", "gundemler"] });
      qc.invalidateQueries({ queryKey: ["network", "istisareler"] });
    },
  });
}

/* ---------------- YORUM ---------------- */

export function useGundemYorumlar(gundem_id: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["network", "yorumlar", gundem_id],
    enabled: !!user && !!gundem_id,
    queryFn: async (): Promise<GundemYorum[]> => {
      const { data, error } = await supabase
        .from("gundem_yorum")
        .select("*")
        .eq("gundem_id", gundem_id!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as GundemYorum[];
    },
  });
}

export function useGundemYorumEkle() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (k: { gundem_id: string; metin: string }) => {
      if (!user) throw new Error("Giriş gerekli");
      const { error } = await supabase.from("gundem_yorum").insert({
        user_id: user.id,
        gundem_id: k.gundem_id,
        metin: k.metin,
      });
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["network", "yorumlar", v.gundem_id] });
      qc.invalidateQueries({ queryKey: ["network", "gundemler"] });
    },
  });
}

export function useGundemYorumSil() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("gundem_yorum").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["network", "yorumlar"] });
      qc.invalidateQueries({ queryKey: ["network", "gundemler"] });
    },
  });
}