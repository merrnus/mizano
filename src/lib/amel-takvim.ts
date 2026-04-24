import { addDays } from "date-fns";
import type { EtkinlikOlay } from "./takvim-hooks";
import type { AmelKurs, AmelProje } from "./amel-tipleri";

/**
 * Kurs sertifika tarihleri + proje deadline'larını sentetik EtkinlikOlay'lara çevirir.
 * id alanı `amel-...` öneki taşır.
 */
export function amelOlaylari(
  kurslar: AmelKurs[],
  projeler: AmelProje[],
  aralikBas: Date,
  aralikBitis: Date,
): EtkinlikOlay[] {
  const sonuc: EtkinlikOlay[] = [];

  // 1) Kurs sertifika sınavları — tüm gün
  for (const k of kurslar) {
    if (!k.sertifika_tarihi) continue;
    if (k.durum === "tamam" || k.durum === "birakti") continue;
    const bas = new Date(k.sertifika_tarihi + "T00:00:00");
    if (bas < aralikBas || bas > aralikBitis) continue;
    const bit = addDays(bas, 1);
    sonuc.push({
      id: `amel-kurs-${k.id}`,
      user_id: k.user_id,
      baslik: `🎓 Sertifika: ${k.ad}`,
      baslangic: bas.toISOString(),
      bitis: bit.toISOString(),
      alan: "amel",
      tum_gun: true,
      tekrar: "yok",
      tekrar_bitis: null,
      konum: k.sertifika_konum,
      aciklama: null,
      created_at: k.created_at,
      updated_at: k.updated_at,
      olayBaslangic: bas,
      olayBitis: bit,
    });
  }

  // 2) Proje deadline'ları — tüm gün
  for (const p of projeler) {
    if (!p.deadline) continue;
    if (p.durum === "tamam" || p.durum === "iptal") continue;
    const bas = new Date(p.deadline + "T00:00:00");
    if (bas < aralikBas || bas > aralikBitis) continue;
    const bit = addDays(bas, 1);
    sonuc.push({
      id: `amel-proje-${p.id}`,
      user_id: p.user_id,
      baslik: `⏰ ${p.ad}`,
      baslangic: bas.toISOString(),
      bitis: bit.toISOString(),
      alan: "amel",
      tum_gun: true,
      tekrar: "yok",
      tekrar_bitis: null,
      konum: null,
      aciklama: p.aciklama,
      created_at: p.created_at,
      updated_at: p.updated_at,
      olayBaslangic: bas,
      olayBitis: bit,
    });
  }

  return sonuc;
}

export function isAmelOlay(id: string): boolean {
  return id.startsWith("amel-kurs-") || id.startsWith("amel-proje-");
}

export function amelOlayKursId(id: string): string | null {
  if (id.startsWith("amel-kurs-")) return id.replace("amel-kurs-", "");
  return null;
}

export function amelOlayProjeId(id: string): string | null {
  if (id.startsWith("amel-proje-")) return id.replace("amel-proje-", "");
  return null;
}