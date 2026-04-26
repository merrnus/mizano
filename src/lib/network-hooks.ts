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
  type KardesEtkinlik,
  type KardesEtkinlikTip,
  type KardesMufredat,
  type KardesEvradMadde,
  type KardesEvradKayit,
  type MufredatMadde,
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

/** Tek kişi getir (detay sayfası için) */
export function useKisi(id: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["network", "kisi", id],
    enabled: !!user && !!id,
    queryFn: async (): Promise<KisiDetay | null> => {
      const [kisiRes, baglantiRes] = await Promise.all([
        supabase.from("gundem_kisi").select("*").eq("id", id!).maybeSingle(),
        supabase.from("gundem_kisi_kategori").select("kategori_id").eq("kisi_id", id!),
      ]);
      if (kisiRes.error) throw kisiRes.error;
      if (baglantiRes.error) throw baglantiRes.error;
      if (!kisiRes.data) return null;
      return {
        ...(kisiRes.data as Kisi),
        kategori_ids: (baglantiRes.data ?? []).map((b) => b.kategori_id),
      };
    },
  });
}

/** Genişletilmiş kişi alanlarını günceller (derin_takip + tüm yeni profil alanları). */
export function useKisiGuncelleDetay() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (k: {
      id: string;
      ad?: string;
      notlar?: string | null;
      derin_takip?: boolean;
      telefon?: string | null;
      dogum_tarihi?: string | null;
      foto_url?: string | null;
      universite?: string | null;
      bolum?: string | null;
      sinif?: string | null;
      gano?: number | null;
      akademik_durum?: string | null;
      ilgi_alanlari?: string[];
      sorumluluk_notu?: string | null;
    }) => {
      const { id, ...patch } = k;
      const { error } = await supabase.from("gundem_kisi").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["network", "kisiler"] });
      qc.invalidateQueries({ queryKey: ["network", "kisi", v.id] });
      qc.invalidateQueries({ queryKey: ["network", "evdekiler"] });
    },
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

/* ---------------- KARDEŞ ETKİNLİK ---------------- */

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

/** Ana sayfa "Bu hafta Evdekiler" widget'ı için özet. */
export type EvdekilerOzet = {
  dogumGunu: { kisi: Kisi; gun: number }[]; // bu hafta
  tekeTekBekleyen: { kisi: Kisi; sonTarih: string | null; gunGectiKi: number | null }[];
  yaklaşanProgram: { kisi: Kisi; tip: KardesEtkinlikTip; tarih: string; baslik: string }[];
};

export function useEvdekilerOzet() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["network", "evdekiler", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<EvdekilerOzet> => {
      const { data: kisilerRaw, error: e1 } = await supabase
        .from("gundem_kisi")
        .select("*")
        .eq("derin_takip", true);
      if (e1) throw e1;
      const kisiler = (kisilerRaw ?? []) as Kisi[];
      if (kisiler.length === 0) {
        return { dogumGunu: [], tekeTekBekleyen: [], yaklaşanProgram: [] };
      }
      const ids = kisiler.map((k) => k.id);

      const { data: etkinliklerRaw, error: e2 } = await supabase
        .from("kardes_etkinlik")
        .select("*")
        .in("kisi_id", ids);
      if (e2) throw e2;
      const etkinlikler = (etkinliklerRaw ?? []) as KardesEtkinlik[];

      const bugun = new Date();
      const yedi = new Date();
      yedi.setDate(bugun.getDate() + 7);

      // Doğum günü — bu hafta (önümüzdeki 7 gün)
      const dogumGunu: EvdekilerOzet["dogumGunu"] = [];
      kisiler.forEach((k) => {
        if (!k.dogum_tarihi) return;
        const d = new Date(k.dogum_tarihi);
        // Bu yıl içindeki doğum günü
        const buYil = new Date(bugun.getFullYear(), d.getMonth(), d.getDate());
        const fark = Math.floor(
          (buYil.getTime() - new Date(bugun.getFullYear(), bugun.getMonth(), bugun.getDate()).getTime()) /
            (1000 * 60 * 60 * 24),
        );
        if (fark >= 0 && fark <= 7) {
          dogumGunu.push({ kisi: k, gun: fark });
        }
      });
      dogumGunu.sort((a, b) => a.gun - b.gun);

      // Teke-tek bekleyen: son teke_tek 14+ gün önce ya da hiç yok
      const tekeTekBekleyen: EvdekilerOzet["tekeTekBekleyen"] = [];
      kisiler.forEach((k) => {
        const son = etkinlikler
          .filter((e) => e.kisi_id === k.id && e.tip === "teke_tek")
          .sort((a, b) => b.tarih.localeCompare(a.tarih))[0];
        if (!son) {
          tekeTekBekleyen.push({ kisi: k, sonTarih: null, gunGectiKi: null });
        } else {
          const gun = Math.floor((bugun.getTime() - new Date(son.tarih).getTime()) / (1000 * 60 * 60 * 24));
          if (gun >= 14) tekeTekBekleyen.push({ kisi: k, sonTarih: son.tarih, gunGectiKi: gun });
        }
      });
      tekeTekBekleyen.sort((a, b) => (b.gunGectiKi ?? 9999) - (a.gunGectiKi ?? 9999));

      // Yaklaşan kandil/kamp/sohbet — sonraki 7 gün
      const bugunStr = bugun.toISOString().slice(0, 10);
      const yediStr = yedi.toISOString().slice(0, 10);
      const yaklaşanProgram: EvdekilerOzet["yaklaşanProgram"] = etkinlikler
        .filter(
          (e) =>
            e.tarih >= bugunStr &&
            e.tarih <= yediStr &&
            (e.tip === "kandil" || e.tip === "kamp" || e.tip === "sohbet" || e.tip === "sophia"),
        )
        .sort((a, b) => a.tarih.localeCompare(b.tarih))
        .map((e) => {
          const k = kisiler.find((x) => x.id === e.kisi_id)!;
          return { kisi: k, tip: e.tip, tarih: e.tarih, baslik: e.baslik };
        });

      return { dogumGunu, tekeTekBekleyen, yaklaşanProgram };
    },
  });
}
/* ---------------- MANEVİYAT: 3 Aylık Müfredat ---------------- */

export function useKardesMufredatAktif(kisi_id: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["network", "mufredat", kisi_id],
    enabled: !!user && !!kisi_id,
    queryFn: async (): Promise<KardesMufredat | null> => {
      const { data, error } = await supabase
        .from("kardes_mufredat")
        .select("*")
        .eq("kisi_id", kisi_id!)
        .eq("arsiv", false)
        .order("created_at", { ascending: false })
        .limit(1);
      if (error) throw error;
      const row = (data ?? [])[0];
      if (!row) return null;
      return {
        ...row,
        maddeler: Array.isArray(row.maddeler) ? (row.maddeler as MufredatMadde[]) : [],
      } as KardesMufredat;
    },
  });
}

export function useKardesMufredatKaydet() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (m: {
      id?: string;
      kisi_id: string;
      baslik?: string;
      baslangic?: string | null;
      bitis?: string | null;
      maddeler?: MufredatMadde[];
    }) => {
      if (!user) throw new Error("Giriş gerekli");
      if (m.id) {
        const patch: {
          baslik?: string;
          baslangic?: string | null;
          bitis?: string | null;
          maddeler?: MufredatMadde[];
        } = {};
        if (m.baslik !== undefined) patch.baslik = m.baslik;
        if (m.baslangic !== undefined) patch.baslangic = m.baslangic;
        if (m.bitis !== undefined) patch.bitis = m.bitis;
        if (m.maddeler !== undefined) patch.maddeler = m.maddeler;
        const { error } = await supabase.from("kardes_mufredat").update(patch).eq("id", m.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("kardes_mufredat").insert({
          user_id: user.id,
          kisi_id: m.kisi_id,
          baslik: m.baslik ?? "3 Aylık Hedef",
          baslangic: m.baslangic ?? null,
          bitis: m.bitis ?? null,
          maddeler: m.maddeler ?? [],
        });
        if (error) throw error;
      }
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["network", "mufredat", v.kisi_id] });
    },
  });
}

export function useKardesMufredatYeniDonem() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (v: { kisi_id: string; eskiId?: string }) => {
      if (!user) throw new Error("Giriş gerekli");
      if (v.eskiId) {
        await supabase.from("kardes_mufredat").update({ arsiv: true }).eq("id", v.eskiId);
      }
      const bugun = new Date();
      const bitis = new Date();
      bitis.setMonth(bitis.getMonth() + 3);
      const { error } = await supabase.from("kardes_mufredat").insert({
        user_id: user.id,
        kisi_id: v.kisi_id,
        baslik: "3 Aylık Hedef",
        baslangic: bugun.toISOString().slice(0, 10),
        bitis: bitis.toISOString().slice(0, 10),
        maddeler: [],
      });
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["network", "mufredat", v.kisi_id] });
    },
  });
}

/* ---------------- MANEVİYAT: Evrâd-u Ezkâr ---------------- */

export function useKardesEvradMaddeler(kisi_id: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["network", "evrad-madde", kisi_id],
    enabled: !!user && !!kisi_id,
    queryFn: async (): Promise<KardesEvradMadde[]> => {
      const { data, error } = await supabase
        .from("kardes_evrad_madde")
        .select("*")
        .eq("kisi_id", kisi_id!)
        .eq("aktif", true)
        .order("siralama", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as KardesEvradMadde[];
    },
  });
}

export function useKardesEvradMaddeEkle() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (v: { kisi_id: string; metin: string; siralama?: number }) => {
      if (!user) throw new Error("Giriş gerekli");
      const { error } = await supabase.from("kardes_evrad_madde").insert({
        user_id: user.id,
        kisi_id: v.kisi_id,
        metin: v.metin,
        siralama: v.siralama ?? 0,
      });
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["network", "evrad-madde", v.kisi_id] });
    },
  });
}

export function useKardesEvradMaddeGuncelle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { id: string; kisi_id: string; metin?: string; aktif?: boolean }) => {
      const { id, kisi_id: _k, ...patch } = v;
      const { error } = await supabase.from("kardes_evrad_madde").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["network", "evrad-madde", v.kisi_id] });
    },
  });
}

export function useKardesEvradMaddeSil() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { id: string; kisi_id: string }) => {
      const { error } = await supabase.from("kardes_evrad_madde").delete().eq("id", v.id);
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["network", "evrad-madde", v.kisi_id] });
      qc.invalidateQueries({ queryKey: ["network", "evrad-kayit", v.kisi_id] });
    },
  });
}

export function useKardesEvradKayitlari(
  kisi_id: string | undefined,
  baslangic: string | undefined,
  bitis: string | undefined,
) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["network", "evrad-kayit", kisi_id, baslangic, bitis],
    enabled: !!user && !!kisi_id && !!baslangic && !!bitis,
    queryFn: async (): Promise<KardesEvradKayit[]> => {
      const { data, error } = await supabase
        .from("kardes_evrad_kayit")
        .select("*")
        .eq("kisi_id", kisi_id!)
        .gte("tarih", baslangic!)
        .lte("tarih", bitis!);
      if (error) throw error;
      return (data ?? []) as KardesEvradKayit[];
    },
  });
}

export function useKardesEvradToggle() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (v: {
      kisi_id: string;
      madde_id: string;
      tarih: string;
      mevcutId: string | null;
    }) => {
      if (!user) throw new Error("Giriş gerekli");
      if (v.mevcutId) {
        const { error } = await supabase
          .from("kardes_evrad_kayit")
          .delete()
          .eq("id", v.mevcutId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("kardes_evrad_kayit").insert({
          user_id: user.id,
          kisi_id: v.kisi_id,
          madde_id: v.madde_id,
          tarih: v.tarih,
        });
        if (error) throw error;
      }
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["network", "evrad-kayit", v.kisi_id] });
    },
  });
}

/* ---------------- RAPOR ---------------- */

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
  if (filtre.kisiId && kisi.id !== filtre.kisiId) return false;
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
