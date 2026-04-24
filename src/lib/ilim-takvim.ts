import { addDays } from "date-fns";
import type { EtkinlikOlay } from "./takvim-hooks";
import type {
  Ders,
  DersProje,
  DersSaat,
  DersSinav,
  HaftaGun,
} from "./ilim-tipleri";

/** Bizim enum sırasına göre, Pazartesi=0..Pazar=6 */
const ENUM_INDEX: Record<HaftaGun, number> = {
  pazartesi: 0,
  sali: 1,
  carsamba: 2,
  persembe: 3,
  cuma: 4,
  cumartesi: 5,
  pazar: 6,
};

function setSaat(d: Date, hhmm: string): Date {
  const [h, m] = hhmm.split(":").map(Number);
  const x = new Date(d);
  x.setHours(h, m ?? 0, 0, 0);
  return x;
}

/**
 * Ders saatleri + sınavlar + proje deadline'larını sentetik EtkinlikOlay'lara çevirir.
 * id alanı `ders-...` öneki taşır, tıklanınca ders detayına yönlendirilebilsin diye.
 */
export function ilimOlaylari(
  dersler: Ders[],
  saatler: DersSaat[],
  sinavlar: DersSinav[],
  projeler: DersProje[],
  aralikBas: Date,
  aralikBitis: Date,
): EtkinlikOlay[] {
  const dersAdi = new Map(dersler.map((d) => [d.id, d]));
  const sonuc: EtkinlikOlay[] = [];

  // 1) Haftalık ders saatleri — aralıktaki her hafta için bir örnek üret
  for (const s of saatler) {
    const ders = dersAdi.get(s.ders_id);
    if (!ders) continue;
    if (ders.durum === "gecti" || ders.durum === "birakti") continue;
    const hedefIdx = ENUM_INDEX[s.gun];
    // İmleci aralık başlangıcına çek
    const imleç = new Date(aralikBas);
    imleç.setHours(0, 0, 0, 0);
    while (((imleç.getDay() + 6) % 7) !== hedefIdx) {
      imleç.setDate(imleç.getDate() + 1);
      if (imleç > aralikBitis) break;
    }
    while (imleç <= aralikBitis) {
      const bas = setSaat(imleç, s.baslangic);
      const bit = setSaat(imleç, s.bitis);
      sonuc.push({
        id: `ders-saat-${s.id}-${bas.toISOString()}`,
        user_id: ders.user_id,
        baslik: ders.kod ? `${ders.kod} · ${ders.ad}` : ders.ad,
        baslangic: bas.toISOString(),
        bitis: bit.toISOString(),
        alan: "ilim",
        tum_gun: false,
        tekrar: "haftalik",
        tekrar_bitis: null,
        konum: s.konum,
        aciklama: null,
        created_at: s.created_at,
        updated_at: s.updated_at,
        olayBaslangic: bas,
        olayBitis: bit,
      });
      imleç.setDate(imleç.getDate() + 7);
    }
  }

  // 2) Sınavlar — tek seferlik
  for (const sn of sinavlar) {
    if (!sn.tarih) continue;
    const bas = new Date(sn.tarih);
    if (bas < aralikBas || bas > aralikBitis) continue;
    const bit = new Date(bas.getTime() + 90 * 60 * 1000);
    const ders = dersAdi.get(sn.ders_id);
    if (!ders) continue;
    sonuc.push({
      id: `ders-sinav-${sn.id}`,
      user_id: ders.user_id,
      baslik: `${sn.tip.toUpperCase()} · ${ders.ad}${sn.baslik ? ` (${sn.baslik})` : ""}`,
      baslangic: bas.toISOString(),
      bitis: bit.toISOString(),
      alan: "ilim",
      tum_gun: false,
      tekrar: "yok",
      tekrar_bitis: null,
      konum: null,
      aciklama: null,
      created_at: sn.created_at,
      updated_at: sn.updated_at,
      olayBaslangic: bas,
      olayBitis: bit,
    });
  }

  // 3) Proje deadline'ları — tüm gün
  for (const p of projeler) {
    if (!p.deadline || p.tamamlandi) continue;
    const bas = new Date(p.deadline + "T00:00:00");
    if (bas < aralikBas || bas > aralikBitis) continue;
    const bit = addDays(bas, 1);
    const ders = dersAdi.get(p.ders_id);
    if (!ders) continue;
    sonuc.push({
      id: `ders-proje-${p.id}`,
      user_id: ders.user_id,
      baslik: `⏰ ${p.baslik} · ${ders.ad}`,
      baslangic: bas.toISOString(),
      bitis: bit.toISOString(),
      alan: "ilim",
      tum_gun: true,
      tekrar: "yok",
      tekrar_bitis: null,
      konum: null,
      aciklama: null,
      created_at: p.created_at,
      updated_at: p.updated_at,
      olayBaslangic: bas,
      olayBitis: bit,
    });
  }

  return sonuc;
}

/** ID önekiyle sentetik (ilim) olayları ayırt et. */
export function isIlimOlay(id: string): boolean {
  return id.startsWith("ders-saat-") || id.startsWith("ders-sinav-") || id.startsWith("ders-proje-");
}

/** Sentetik olaydan ders id'sini çıkar (kart tıklamasında detaya gitmek için). */
export function ilimOlayDersId(
  id: string,
  saatler: DersSaat[],
  sinavlar: DersSinav[],
  projeler: DersProje[],
): string | null {
  if (id.startsWith("ders-saat-")) {
    const saatId = id.replace("ders-saat-", "").split("-").slice(0, 5).join("-");
    return saatler.find((s) => s.id === saatId)?.ders_id ?? null;
  }
  if (id.startsWith("ders-sinav-")) {
    const x = id.replace("ders-sinav-", "");
    return sinavlar.find((s) => s.id === x)?.ders_id ?? null;
  }
  if (id.startsWith("ders-proje-")) {
    const x = id.replace("ders-proje-", "");
    return projeler.find((p) => p.id === x)?.ders_id ?? null;
  }
  return null;
}