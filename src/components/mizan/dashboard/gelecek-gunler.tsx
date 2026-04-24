import * as React from "react";
import { Link } from "@tanstack/react-router";
import { addDays, format, isSameDay } from "date-fns";
import { tr } from "date-fns/locale";
import { ArrowRight } from "lucide-react";
import { useEtkinlikler, useGorevler, genisletEtkinlikleri } from "@/lib/takvim-hooks";
import { tarihFormat } from "@/lib/cetele-tarih";
import type { CeteleAlan } from "@/lib/cetele-tipleri";

const GUN_KISA_UPPER: Record<number, string> = {
  0: "PAZ",
  1: "PZT",
  2: "SAL",
  3: "ÇAR",
  4: "PER",
  5: "CUM",
  6: "CMT",
};

function alanRengi(alan: CeteleAlan): string {
  return `var(--${alan})`;
}

/**
 * Bugünden sonraki 4 günün özet kartları.
 * Her kart: gün başlığı + ilk 3 etkinlik + bekleyen görev sayısı.
 */
export function GelecekGunler({ simdi }: { simdi: Date }) {
  const aralikBas = addDays(simdi, 1);
  aralikBas.setHours(0, 0, 0, 0);
  const aralikSon = addDays(simdi, 4);
  aralikSon.setHours(23, 59, 59, 999);

  const { data: etkinlikler = [] } = useEtkinlikler(aralikBas, aralikSon);
  const { data: gorevler = [] } = useGorevler(aralikBas, aralikSon);

  const olaylar = React.useMemo(
    () => genisletEtkinlikleri(etkinlikler, aralikBas, aralikSon),
    [etkinlikler, aralikBas, aralikSon],
  );

  const gunler = Array.from({ length: 4 }, (_, i) => addDays(aralikBas, i));

  return (
    <section className="rounded-2xl border border-border bg-card">
      <header className="flex items-end justify-between gap-3 border-b border-border px-5 py-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            Gelecek Günler
          </p>
          <h2 className="mt-0.5 text-lg font-semibold tracking-tight">
            4 gün ileri bakış
          </h2>
        </div>
        <Link
          to="/takvim"
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
        >
          Takvime git
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </header>

      <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
        {gunler.map((gun) => {
          const gunOlaylari = olaylar
            .filter((o) => isSameDay(o.olayBaslangic, gun))
            .sort((a, b) => a.olayBaslangic.getTime() - b.olayBaslangic.getTime());
          const gunGorev = gorevler.filter(
            (g) => g.vade === tarihFormat(gun) && !g.tamamlandi,
          );
          const ilkUc = gunOlaylari.slice(0, 3);
          const fazla = gunOlaylari.length - ilkUc.length;

          return (
            <div
              key={gun.toISOString()}
              className="flex flex-col gap-2 rounded-xl border border-border bg-background/40 p-3"
            >
              <div className="flex items-baseline justify-between">
                <div>
                  <div className="text-2xl font-semibold tabular-nums leading-none">
                    {format(gun, "d")}
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    {format(gun, "EEEE", { locale: tr })}
                  </div>
                </div>
                <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  {GUN_KISA_UPPER[gun.getDay()]}
                </span>
              </div>

              <ul className="mt-1 flex flex-col gap-1.5">
                {ilkUc.length === 0 && gunGorev.length === 0 && (
                  <li className="text-[11px] text-muted-foreground/60">— planlı şey yok</li>
                )}
                {ilkUc.map((o) => {
                  const renk = alanRengi(o.alan);
                  return (
                    <li key={o.id} className="flex items-start gap-1.5 text-[11px]">
                      <span
                        className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ backgroundColor: renk }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate">{o.baslik}</div>
                        {!o.tum_gun && (
                          <div className="text-[10px] text-muted-foreground">
                            {format(o.olayBaslangic, "HH:mm")}
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
                {fazla > 0 && (
                  <li className="text-[10px] text-muted-foreground">+{fazla} daha</li>
                )}
                {gunGorev.length > 0 && (
                  <li className="mt-1 text-[10px] text-muted-foreground">
                    {gunGorev.length} görev bekliyor
                  </li>
                )}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}