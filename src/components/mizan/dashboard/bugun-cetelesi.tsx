import * as React from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Play, Check } from "lucide-react";
import { useSablonlar, useHaftaKayitlari } from "@/lib/cetele-hooks";
import { CeteleHucre } from "@/components/mizan/cetele-hucre";
import { haftaBaslangici, tarihFormat } from "@/lib/cetele-tarih";
import { ALAN_ETIKET, type CeteleAlan } from "@/lib/cetele-tipleri";
import { AkisModu } from "@/components/mizan/dashboard/akis-modu";

const ALAN_ROTA: Record<CeteleAlan, "/mizan/mana" | "/mizan/ilim" | "/mizan/amel"> = {
  mana: "/mizan/mana",
  ilim: "/mizan/ilim",
  amel: "/mizan/amel",
  kisisel: "/mizan/mana", // fallback — şu an dashboardda gösterilmiyor
};

/**
 * Bugüne ait çetele hücreleri — alan başına gruplanmış kompakt görünüm.
 */
export function BugunCetelesi({ simdi }: { simdi: Date }) {
  const haftaBas = haftaBaslangici(simdi);
  const bugunStr = tarihFormat(simdi);

  const { data: sablonlar = [] } = useSablonlar();
  const { data: kayitlar = [] } = useHaftaKayitlari(haftaBas);

  // Amel artık modüllerden besleniyor → "Bugünün Müfredatı" kartında gösteriliyor
  const alanlar: CeteleAlan[] = ["mana", "ilim"];
  const gruplu = alanlar
    .map((alan) => ({
      alan,
      sablonlar: sablonlar.filter((s) => s.alan === alan),
    }))
    .filter((g) => g.sablonlar.length > 0);

  const [akisAlan, setAkisAlan] = React.useState<CeteleAlan | null>(null);

  // Bir alanda bugün için hedefe ulaşmamış şablon kalmış mı?
  const eksikSayisi = (alanSablonlar: typeof sablonlar) =>
    alanSablonlar.filter((s) => {
      const toplam = kayitlar
        .filter((k) => k.sablon_id === s.id && k.tarih === bugunStr)
        .reduce((a, k) => a + Number(k.miktar), 0);
      return toplam < Number(s.hedef_deger);
    }).length;

  if (gruplu.length === 0) {
    return (
      <section className="rounded-2xl border border-border bg-card px-5 py-8 text-center">
        <p className="text-sm text-muted-foreground">
          Henüz çetele şablonun yok.{" "}
          <Link to="/mizan/mana" className="text-foreground underline-offset-4 hover:underline">
            Mana panelinden başla
          </Link>
          .
        </p>
      </section>
    );
  }

  return (
    <>
    <section className="rounded-2xl border border-border bg-card">
      <header className="flex items-end justify-between gap-3 border-b border-border px-5 py-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            Bugünün Çetelesi
          </p>
          <h2 className="mt-0.5 text-lg font-semibold tracking-tight">
            Hızlı işaretle
          </h2>
        </div>
      </header>

      <div className="divide-y divide-border">
        {gruplu.map(({ alan, sablonlar: alanSablonlar }) => {
          const renk = `var(--${alan})`;
          const eksik = eksikSayisi(alanSablonlar);
          const tumuTamam = eksik === 0;
          return (
            <div key={alan} className="px-5 py-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{
                      backgroundColor: renk,
                      boxShadow: `0 0 8px ${renk}`,
                    }}
                  />
                  <span
                    className="text-xs font-semibold uppercase tracking-wider"
                    style={{ color: renk }}
                  >
                    {ALAN_ETIKET[alan]}
                  </span>
                  {tumuTamam ? (
                    <span
                      className="ml-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
                      style={{
                        color: renk,
                        backgroundColor: `color-mix(in oklab, ${renk} 14%, transparent)`,
                      }}
                      aria-label="Bugün için tamamlandı"
                    >
                      <Check className="h-2.5 w-2.5" />
                      Tamam
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setAkisAlan(alan)}
                      className="ml-1 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-medium transition-all hover:scale-[1.04] active:scale-[0.97]"
                      style={{
                        color: renk,
                        backgroundColor: `color-mix(in oklab, ${renk} 12%, transparent)`,
                        boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${renk} 22%, transparent)`,
                      }}
                      aria-label={`${ALAN_ETIKET[alan]} akışını başlat (${eksik} kalan)`}
                    >
                      <Play className="h-2.5 w-2.5 fill-current" />
                      Akış
                      <span className="opacity-70 tabular-nums">· {eksik}</span>
                    </button>
                  )}
                </div>
                <Link
                  to={ALAN_ROTA[alan]}
                  className="inline-flex items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
                >
                  Detay
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {alanSablonlar.map((s) => (
                  <li
                    key={s.id}
                    className="grid grid-cols-[minmax(0,1fr)_5rem] items-center gap-2 rounded-md border border-border bg-background/40 px-3 py-1.5"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-xs font-medium">{s.ad}</div>
                      <div className="text-[10px] text-muted-foreground">
                        Hedef {Number(s.hedef_deger)} {s.birim}
                      </div>
                    </div>
                    <CeteleHucre
                      sablon={s}
                      tarih={simdi}
                      tarihStr={bugunStr}
                      kayitlar={kayitlar}
                    />
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
    <AkisModu
      acik={akisAlan !== null}
      alan={akisAlan}
      sablonlar={sablonlar}
      kayitlar={kayitlar}
      tarihStr={bugunStr}
      onClose={() => setAkisAlan(null)}
    />
    </>
  );
}