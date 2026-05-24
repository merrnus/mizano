import * as React from "react";
import { Link } from "@tanstack/react-router";
import { format, differenceInMinutes, isSameDay } from "date-fns";
import { ChevronRight, MapPin, CalendarPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEtkinlikler, genisletEtkinlikleri } from "@/lib/takvim/hooks";
import type { CeteleAlan } from "@/lib/cetele-tipleri";
import type { TakvimEtkinlik } from "@/lib/takvim/tipler";
import { EtkinlikDetaySheet } from "./etkinlik-detay-sheet";

type Props = {
  simdi: Date;
  onYeniEtkinlik: () => void;
};

type Resolved =
  | {
      kind: "ongoing" | "next";
      baslangic: Date;
      bitis: Date;
      alan: CeteleAlan;
      ham: TakvimEtkinlik;
      baslik: string;
      konum: string | null;
      tumGun: boolean;
    }
  | { kind: "empty" };

/**
 * Odak — "şu an ne oluyor?" sorusuna tek cevap.
 * Devam eden etkinlik varsa onu, yoksa bugünün sıradaki etkinliğini gösterir.
 * Etkinlik yoksa boş durum + yeni etkinlik aksiyonu.
 */
export function OdakKarti({ simdi, onYeniEtkinlik }: Props) {
  const yil = simdi.getFullYear();
  const ay = simdi.getMonth();
  const gun = simdi.getDate();
  const gunBas = React.useMemo(() => new Date(yil, ay, gun, 0, 0, 0, 0), [yil, ay, gun]);
  const gunSon = React.useMemo(() => new Date(yil, ay, gun, 23, 59, 59, 999), [yil, ay, gun]);

  const { data: etkinlikler = [] } = useEtkinlikler(gunBas, gunSon);
  const [acikEtkinlik, setAcikEtkinlik] = React.useState<TakvimEtkinlik | null>(null);

  const resolved: Resolved = React.useMemo(() => {
    const olaylar = genisletEtkinlikleri(etkinlikler, gunBas, gunSon)
      .filter((o) => isSameDay(o.olayBaslangic, simdi))
      .sort((a, b) => a.olayBaslangic.getTime() - b.olayBaslangic.getTime());

    const t = simdi.getTime();
    const ongoing = olaylar.find(
      (o) => o.olayBaslangic.getTime() <= t && o.olayBitis.getTime() > t,
    );
    if (ongoing) {
      return {
        kind: "ongoing",
        baslangic: ongoing.olayBaslangic,
        bitis: ongoing.olayBitis,
        alan: ongoing.alan,
        ham: ongoing,
        baslik: ongoing.baslik,
        konum: ongoing.konum,
        tumGun: ongoing.tum_gun,
      };
    }
    const next = olaylar.find((o) => o.olayBaslangic.getTime() > t);
    if (next) {
      return {
        kind: "next",
        baslangic: next.olayBaslangic,
        bitis: next.olayBitis,
        alan: next.alan,
        ham: next,
        baslik: next.baslik,
        konum: next.konum,
        tumGun: next.tum_gun,
      };
    }
    return { kind: "empty" };
  }, [etkinlikler, gunBas, gunSon, simdi]);

  return (
    <>
      <section
        className={cn(
          "relative overflow-hidden rounded-2xl border border-border bg-card",
          "px-5 py-5 sm:px-6 sm:py-6",
        )}
        style={
          resolved.kind === "empty"
            ? undefined
            : {
                boxShadow: `0 0 0 1px color-mix(in oklab, var(--${resolved.alan}) 18%, transparent), 0 18px 40px -22px color-mix(in oklab, var(--${resolved.alan}) 60%, transparent)`,
              }
        }
      >
        {resolved.kind !== "empty" && (
          <span
            aria-hidden
            className="absolute inset-x-0 top-0 h-[3px]"
            style={{
              background: `linear-gradient(90deg, color-mix(in oklab, var(--${resolved.alan}) 60%, transparent), color-mix(in oklab, var(--${resolved.alan}) 10%, transparent))`,
            }}
          />
        )}

        {resolved.kind === "empty" ? (
          <BosIcerik onYeniEtkinlik={onYeniEtkinlik} />
        ) : (
          <EtkinlikIcerik
            kind={resolved.kind}
            simdi={simdi}
            baslangic={resolved.baslangic}
            bitis={resolved.bitis}
            alan={resolved.alan}
            baslik={resolved.baslik}
            konum={resolved.konum}
            tumGun={resolved.tumGun}
            onAc={() => setAcikEtkinlik(resolved.ham)}
          />
        )}
      </section>

      <EtkinlikDetaySheet
        etkinlik={acikEtkinlik}
        onOpenChange={(o) => !o && setAcikEtkinlik(null)}
      />
    </>
  );
}

function Etiket({ alan, kind }: { alan: CeteleAlan; kind: "ongoing" | "next" }) {
  const renk = `var(--${alan})`;
  const metin = kind === "ongoing" ? "Şu an" : "Sıradaki";
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
      style={{
        color: renk,
        backgroundColor: `color-mix(in oklab, ${renk} 14%, transparent)`,
        boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${renk} 28%, transparent)`,
      }}
    >
      {kind === "ongoing" && (
        <span
          className="h-1.5 w-1.5 animate-pulse rounded-full"
          style={{ backgroundColor: renk, boxShadow: `0 0 6px ${renk}` }}
        />
      )}
      {metin}
    </span>
  );
}

function EtkinlikIcerik(props: {
  kind: "ongoing" | "next";
  simdi: Date;
  baslangic: Date;
  bitis: Date;
  alan: CeteleAlan;
  baslik: string;
  konum: string | null;
  tumGun: boolean;
  onAc: () => void;
}) {
  const { kind, simdi, baslangic, bitis, alan, baslik, konum, tumGun, onAc } = props;
  const sureDk = Math.max(1, differenceInMinutes(bitis, baslangic));
  const zamanMetin = tumGun
    ? "tüm gün"
    : kind === "ongoing"
      ? `${Math.max(0, differenceInMinutes(bitis, simdi))} dk kaldı`
      : `${Math.max(0, differenceInMinutes(baslangic, simdi))} dk sonra`;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Etiket alan={alan} kind={kind} />
        <span className="text-[11px] text-muted-foreground tabular-nums">{zamanMetin}</span>
      </div>
      <div className="min-w-0">
        {!tumGun && (
          <div className="flex items-baseline gap-3">
            <span
              className="font-mono text-2xl font-semibold tabular-nums sm:text-3xl"
              style={{ color: `var(--${alan})` }}
            >
              {format(baslangic, "HH:mm")}
            </span>
            <span className="text-[11px] text-muted-foreground tabular-nums">
              {sureDk} dk
            </span>
          </div>
        )}
        <h2 className="mt-1 truncate text-lg font-semibold tracking-tight sm:text-xl">
          {baslik}
        </h2>
        {konum && (
          <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span className="truncate">{konum}</span>
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onAc}
          className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-3.5 py-1.5 text-xs font-medium text-background transition-transform hover:scale-[1.03] active:scale-[0.97]"
        >
          Detay <ChevronRight className="h-3 w-3" />
        </button>
        <Link
          to="/takvim"
          className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
        >
          Takvimde gör
        </Link>
      </div>
    </div>
  );
}

function BosIcerik({ onYeniEtkinlik }: { onYeniEtkinlik: () => void }) {
  return (
    <div className="flex flex-col items-start gap-3">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Odak
      </span>
      <h2 className="text-lg font-semibold tracking-tight sm:text-xl">
        Bugün için planlı etkinlik yok
      </h2>
      <p className="text-xs text-muted-foreground">
        Yeni bir etkinlik ekle ya da takvime göz at.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onYeniEtkinlik}
          className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-3.5 py-1.5 text-xs font-medium text-background transition-transform hover:scale-[1.03] active:scale-[0.97]"
        >
          <CalendarPlus className="h-3 w-3" />
          Etkinlik ekle
        </button>
        <Link
          to="/takvim"
          className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
        >
          Takvime git
        </Link>
      </div>
    </div>
  );
}