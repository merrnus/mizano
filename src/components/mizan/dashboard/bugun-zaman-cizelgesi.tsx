import * as React from "react";
import { Link } from "@tanstack/react-router";
import { format, isSameDay, differenceInMinutes } from "date-fns";
import { tr } from "date-fns/locale";
import { MapPin, CalendarPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEtkinlikler, useGorevler, genisletEtkinlikleri } from "@/lib/takvim-hooks";
import { tarihFormat } from "@/lib/cetele-tarih";
import type { CeteleAlan } from "@/lib/cetele-tipleri";

type SatirEtkinlik = {
  id: string;
  baslik: string;
  baslangic: Date;
  bitis: Date;
  alan: CeteleAlan;
  konum: string | null;
  aciklama: string | null;
  tumGun: boolean;
};

function alanRengi(alan: CeteleAlan): string {
  return `var(--${alan})`;
}

/**
 * Bugünün etkinlikleri + tüm-gün görevleri timeline halinde.
 * - Geçmiş etkinlikler: üstü çizili & soluk
 * - Şimdiki / sıradaki etkinlik: vurgulu çerçeve + "SIRADAKİ" rozeti
 */
export function BugunZamanCizelgesi({ simdi }: { simdi: Date }) {
  const gunBas = new Date(simdi);
  gunBas.setHours(0, 0, 0, 0);
  const gunSon = new Date(simdi);
  gunSon.setHours(23, 59, 59, 999);

  const { data: etkinlikler = [] } = useEtkinlikler(gunBas, gunSon);
  const { data: gorevler = [] } = useGorevler(gunBas, gunSon);

  const olaylar = React.useMemo(
    () =>
      genisletEtkinlikleri(etkinlikler, gunBas, gunSon).filter((o) =>
        isSameDay(o.olayBaslangic, simdi),
      ),
    [etkinlikler, gunBas, gunSon, simdi],
  );

  const bugunStr = tarihFormat(simdi);
  const bugunGorevleri = gorevler.filter((g) => g.vade === bugunStr);

  const satirlar: SatirEtkinlik[] = olaylar
    .map<SatirEtkinlik>((o) => ({
      id: o.id,
      baslik: o.baslik,
      baslangic: o.olayBaslangic,
      bitis: o.olayBitis,
      alan: o.alan,
      konum: o.konum,
      aciklama: o.aciklama,
      tumGun: o.tum_gun,
    }))
    .sort((a, b) => a.baslangic.getTime() - b.baslangic.getTime());

  // Sıradaki etkinliği bul: şimdiden sonra başlayan ilk etkinlik (veya şu an sürmekte olan)
  const siradakiIdx = satirlar.findIndex(
    (s) => s.bitis.getTime() >= simdi.getTime(),
  );

  const bos = satirlar.length === 0 && bugunGorevleri.length === 0;

  return (
    <section className="rounded-2xl border border-border bg-card">
      <header className="flex items-end justify-between gap-3 border-b border-border px-5 py-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            Bugün
          </p>
          <h2 className="mt-0.5 text-lg font-semibold tracking-tight">
            {format(simdi, "d MMMM EEEE", { locale: tr })}
          </h2>
        </div>
        <Link
          to="/takvim"
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
        >
          <CalendarPlus className="h-3.5 w-3.5" />
          Takvime git
        </Link>
      </header>

      {bos ? (
        <div className="px-5 py-10 text-center text-sm text-muted-foreground">
          Bugün için planlı bir şey yok.{" "}
          <Link to="/takvim" className="text-foreground underline-offset-4 hover:underline">
            Bir şey ekle
          </Link>
          .
        </div>
      ) : (
        <div className="relative px-5 py-5">
          {/* dikey rail */}
          <div className="absolute left-[1.85rem] top-6 bottom-6 w-px bg-border" />

          <ul className="flex flex-col gap-3">
            {satirlar.map((s, i) => {
              const gecmis = s.bitis.getTime() < simdi.getTime();
              const sira = i === siradakiIdx && !gecmis;
              const renk = alanRengi(s.alan);
              const sureDk = Math.max(15, differenceInMinutes(s.bitis, s.baslangic));

              return (
                <li key={s.id} className="relative grid grid-cols-[2.5rem_minmax(0,1fr)] gap-3">
                  {/* nokta */}
                  <div className="relative flex items-start justify-center pt-3">
                    <span
                      className={cn(
                        "h-3 w-3 rounded-full border-2 transition-all",
                        sira ? "scale-110" : "",
                      )}
                      style={{
                        borderColor: renk,
                        backgroundColor: sira || !gecmis ? renk : "transparent",
                        boxShadow: sira ? `0 0 12px ${renk}` : undefined,
                        opacity: gecmis ? 0.5 : 1,
                      }}
                    />
                  </div>

                  {/* kart */}
                  <Link
                    to="/takvim"
                    className={cn(
                      "block rounded-xl border bg-background/50 px-4 py-3 transition-colors",
                      sira
                        ? "border-[color:var(--ring)]"
                        : "border-border hover:border-border/80",
                      gecmis ? "opacity-55" : "",
                    )}
                    style={
                      sira
                        ? {
                            boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${renk} 35%, transparent), 0 0 24px -10px ${renk}`,
                          }
                        : undefined
                    }
                  >
                    <div className="grid grid-cols-[3.5rem_minmax(0,1fr)_auto] items-baseline gap-3">
                      <div className="flex flex-col">
                        <span
                          className={cn(
                            "font-mono text-base tabular-nums",
                            gecmis ? "text-muted-foreground line-through" : "",
                          )}
                        >
                          {s.tumGun ? "tüm gün" : format(s.baslangic, "HH:mm")}
                        </span>
                        {!s.tumGun && (
                          <span className="text-[10px] text-muted-foreground">
                            {sureDk} dk
                          </span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div
                          className={cn(
                            "truncate text-sm font-medium",
                            gecmis ? "line-through" : "",
                          )}
                        >
                          {s.baslik}
                        </div>
                        {s.konum && (
                          <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">{s.konum}</span>
                          </div>
                        )}
                        {s.aciklama && !s.konum && (
                          <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
                            {s.aciklama}
                          </div>
                        )}
                      </div>

                      {sira && (
                        <span
                          className="rounded-md border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider"
                          style={{
                            color: renk,
                            borderColor: `color-mix(in oklab, ${renk} 45%, transparent)`,
                            backgroundColor: `color-mix(in oklab, ${renk} 12%, transparent)`,
                          }}
                        >
                          Sıradaki
                        </span>
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>

          {bugunGorevleri.length > 0 && (
            <div className="mt-5 border-t border-border pt-4">
              <div className="mb-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                Bugünkü görevler
              </div>
              <ul className="flex flex-col gap-1.5">
                {bugunGorevleri.map((g) => {
                  const renk = alanRengi(g.alan);
                  return (
                    <li
                      key={g.id}
                      className="flex items-center gap-2 rounded-md border border-border bg-background/40 px-3 py-1.5 text-xs"
                    >
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: renk }}
                      />
                      <span
                        className={cn(
                          "flex-1 truncate",
                          g.tamamlandi ? "text-muted-foreground line-through" : "",
                        )}
                      >
                        {g.baslik}
                      </span>
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        {g.oncelik}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}