import * as React from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";
import {
  useSablonlar,
  useHaftaKayitlari,
  useKayitEkle,
} from "@/lib/cetele-hooks";
import { haftaBaslangici, tarihFormat } from "@/lib/cetele-tarih";
import { BIRIM_ETIKET } from "@/lib/cetele-tipleri";
import { cn } from "@/lib/utils";

type Props = { simdi: Date };

/**
 * Bugünün çetelesinden mini köprü — esnek görevlerin altında durur.
 * Sadece tamamlanmamış günlük mana evrâdı (max 3). Tıklayınca hedefe doldurur.
 */
export function CeteleBugunMini({ simdi }: Props) {
  const haftaBas = haftaBaslangici(simdi);
  const bugunStr = tarihFormat(simdi);
  const { data: sablonlar = [] } = useSablonlar();
  const { data: kayitlar = [] } = useHaftaKayitlari(haftaBas);
  const ekle = useKayitEkle();

  const aday = React.useMemo(() => {
    return sablonlar
      .filter((s) => s.alan === "mana" && s.hedef_tipi === "gunluk")
      .map((s) => {
        const toplam = kayitlar
          .filter((k) => k.sablon_id === s.id && k.tarih === bugunStr)
          .reduce((a, k) => a + Number(k.miktar), 0);
        return { sablon: s, toplam, hedef: Number(s.hedef_deger) };
      })
      .filter((x) => x.toplam < x.hedef)
      .slice(0, 3);
  }, [sablonlar, kayitlar, bugunStr]);

  // Hiç şablon yoksa hiç gösterme — kullanıcı henüz çeteleyi kurmamış.
  const hicSablonYok = sablonlar.filter((s) => s.alan === "mana").length === 0;
  if (hicSablonYok) return null;

  const tamamiBitti = aday.length === 0;

  return (
    <section className="mt-3 rounded-2xl border border-border/60 bg-card/40 p-3">
      <header className="mb-2 flex items-center justify-between gap-2 px-1">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold tracking-tight">
            Bugünün çetelesinden
          </h3>
          <p className="text-[10px] text-muted-foreground">
            Tekrar eden ritüeller · esnek görevlerden ayrı
          </p>
        </div>
        <Link
          to="/mizan/mana"
          className="inline-flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
        >
          Tümü
          <ArrowRight className="h-3 w-3" />
        </Link>
      </header>

      {tamamiBitti ? (
        <p className="px-2 py-3 text-center text-xs text-muted-foreground/70">
          Bugünün evrâdı tamam ✓
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-border/40">
          {aday.map(({ sablon, hedef, toplam }) => {
            const kalan = hedef - toplam;
            return (
              <li key={sablon.id} className="group">
                <button
                  type="button"
                  onClick={() =>
                    ekle.mutate({
                      sablon_id: sablon.id,
                      tarih: bugunStr,
                      miktar: kalan,
                    })
                  }
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2 py-2.5 text-left transition-colors hover:bg-muted/40",
                  )}
                >
                  <span
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors group-hover:border-foreground"
                    style={{
                      borderColor: "color-mix(in oklab, var(--mana) 55%, transparent)",
                    }}
                    aria-hidden
                  >
                    <Check className="h-3 w-3 opacity-0 group-hover:opacity-100" strokeWidth={3} />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm">
                    {sablon.ad}
                  </span>
                  <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                    {toplam}/{hedef} {BIRIM_ETIKET[sablon.birim]}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}