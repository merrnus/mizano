import * as React from "react";
import { Link } from "@tanstack/react-router";
import { format, differenceInMinutes, isSameDay } from "date-fns";
import { tr } from "date-fns/locale";
import {
  CalendarPlus,
  Check,
  ChevronRight,
  ListTodo,
  MapPin,
  Play,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useEtkinlikler,
  useGorevler,
  useGorevGuncelle,
  genisletEtkinlikleri,
} from "@/lib/takvim/hooks";
import { useAmelKurslar, useTumAmelModuller, useAmelModulGuncelle } from "@/lib/amel-hooks";
import { tarihFormat } from "@/lib/cetele-tarih";
import type { CeteleAlan } from "@/lib/cetele-tipleri";
import type { TakvimEtkinlik, TakvimGorev } from "@/lib/takvim/tipler";
import type { AmelKurs, AmelModul } from "@/lib/amel-tipleri";
import { EtkinlikDetaySheet } from "./etkinlik-detay-sheet";
import { GorevDetaySheet } from "./gorev-detay-sheet";

type Props = {
  simdi: Date;
  onYeniEtkinlik: () => void;
  onYeniGorev: () => void;
};

type Resolved =
  | { kind: "ongoing"; baslangic: Date; bitis: Date; alan: CeteleAlan; ham: TakvimEtkinlik; baslik: string; konum: string | null }
  | { kind: "next"; baslangic: Date; bitis: Date; alan: CeteleAlan; ham: TakvimEtkinlik; baslik: string; konum: string | null }
  | { kind: "task"; ham: TakvimGorev; alan: CeteleAlan; baslik: string }
  | { kind: "modul"; modul: AmelModul; kurs: AmelKurs; alan: CeteleAlan }
  | { kind: "empty" };

/**
 * Sayfanın "şu an ne yapayım?" sorusuna tek bir net cevap veren spotlight.
 * Öncelik: devam eden etkinlik → sıradaki etkinlik → bugünün ilk açık görevi
 * (yüksek > orta > düşük) → bugünün ilk eksik amel modülü → boş.
 */
export function NowCard({ simdi, onYeniEtkinlik, onYeniGorev }: Props) {
  const yil = simdi.getFullYear();
  const ay = simdi.getMonth();
  const gun = simdi.getDate();
  const gunBas = React.useMemo(() => new Date(yil, ay, gun, 0, 0, 0, 0), [yil, ay, gun]);
  const gunSon = React.useMemo(() => new Date(yil, ay, gun, 23, 59, 59, 999), [yil, ay, gun]);

  const { data: etkinlikler = [] } = useEtkinlikler(gunBas, gunSon);
  const { data: gorevler = [] } = useGorevler(gunBas, gunSon);
  const { data: kurslar = [] } = useAmelKurslar();
  const { data: tumModuller = [] } = useTumAmelModuller();
  const guncelleGorev = useGorevGuncelle();
  const guncelleModul = useAmelModulGuncelle();

  const [acikEtkinlik, setAcikEtkinlik] = React.useState<TakvimEtkinlik | null>(null);
  const [acikGorev, setAcikGorev] = React.useState<TakvimGorev | null>(null);

  const resolved: Resolved = React.useMemo(() => {
    // 1) ongoing or next event today
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
      };
    }

    // 2) first open task today (priority order)
    const bugunStr = tarihFormat(simdi);
    const oncelikPuan: Record<string, number> = { yuksek: 0, orta: 1, dusuk: 2 };
    const acikGorevler = gorevler
      .filter((g) => g.vade === bugunStr && !g.tamamlandi)
      .sort((a, b) => (oncelikPuan[a.oncelik] ?? 9) - (oncelikPuan[b.oncelik] ?? 9));
    if (acikGorevler.length > 0) {
      const g = acikGorevler[0]!;
      return { kind: "task", ham: g, alan: g.alan, baslik: g.baslik };
    }

    // 3) first incomplete module from active kurs
    const aktifKurslar = kurslar.filter((k) => k.durum === "aktif");
    for (const k of aktifKurslar) {
      const m = tumModuller
        .filter((mm) => mm.kurs_id === k.id)
        .sort((a, b) => a.siralama - b.siralama)
        .find((mm) => !mm.tamamlandi);
      if (m) {
        return { kind: "modul", modul: m, kurs: k, alan: "amel" };
      }
    }

    return { kind: "empty" };
  }, [etkinlikler, gorevler, kurslar, tumModuller, gunBas, gunSon, simdi]);

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
                boxShadow: `0 0 0 1px color-mix(in oklab, var(--${(resolved as { alan: CeteleAlan }).alan}) 18%, transparent), 0 18px 40px -22px color-mix(in oklab, var(--${(resolved as { alan: CeteleAlan }).alan}) 60%, transparent)`,
              }
        }
      >
        {/* alan rengi ince üst şerit */}
        {resolved.kind !== "empty" && (
          <span
            aria-hidden
            className="absolute inset-x-0 top-0 h-[3px]"
            style={{
              background: `linear-gradient(90deg, color-mix(in oklab, var(--${(resolved as { alan: CeteleAlan }).alan}) 60%, transparent), color-mix(in oklab, var(--${(resolved as { alan: CeteleAlan }).alan}) 10%, transparent))`,
            }}
          />
        )}

        {resolved.kind === "ongoing" || resolved.kind === "next" ? (
          <EtkinlikIcerik
            kind={resolved.kind}
            simdi={simdi}
            baslangic={resolved.baslangic}
            bitis={resolved.bitis}
            alan={resolved.alan}
            baslik={resolved.baslik}
            konum={resolved.konum}
            onAc={() => setAcikEtkinlik(resolved.ham)}
          />
        ) : resolved.kind === "task" ? (
          <GorevIcerik
            gorev={resolved.ham}
            alan={resolved.alan}
            baslik={resolved.baslik}
            onAc={() => setAcikGorev(resolved.ham)}
            onTamamla={() =>
              guncelleGorev.mutate({
                id: resolved.ham.id,
                degisiklikler: { tamamlandi: true },
              })
            }
          />
        ) : resolved.kind === "modul" ? (
          <ModulIcerik
            modul={resolved.modul}
            kurs={resolved.kurs}
            onTamamla={() =>
              guncelleModul.mutate({
                id: resolved.modul.id,
                tamamlandi: true,
                tamamlanma: new Date().toISOString().slice(0, 10),
              })
            }
          />
        ) : (
          <BosIcerik onYeniEtkinlik={onYeniEtkinlik} onYeniGorev={onYeniGorev} />
        )}
      </section>

      <EtkinlikDetaySheet
        etkinlik={acikEtkinlik}
        onOpenChange={(o) => !o && setAcikEtkinlik(null)}
      />
      <GorevDetaySheet
        gorev={acikGorev}
        onOpenChange={(o) => !o && setAcikGorev(null)}
      />
    </>
  );
}

/* ============ İçerik varyantları ============ */

function Etiket({ alan, kind }: { alan: CeteleAlan; kind: "ongoing" | "next" | "task" | "modul" }) {
  const renk = `var(--${alan})`;
  const metin =
    kind === "ongoing" ? "Şu an" : kind === "next" ? "Sıradaki" : kind === "task" ? "Önce bunu" : "Müfredat";
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
  onAc: () => void;
}) {
  const { kind, simdi, baslangic, bitis, alan, baslik, konum, onAc } = props;
  const sureDk = Math.max(1, differenceInMinutes(bitis, baslangic));
  const zamanMetin =
    kind === "ongoing"
      ? `${Math.max(0, differenceInMinutes(bitis, simdi))} dk kaldı`
      : `${Math.max(0, differenceInMinutes(baslangic, simdi))} dk sonra`;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Etiket alan={alan} kind={kind} />
        <span className="text-[11px] text-muted-foreground tabular-nums">{zamanMetin}</span>
      </div>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
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

function GorevIcerik(props: {
  gorev: TakvimGorev;
  alan: CeteleAlan;
  baslik: string;
  onAc: () => void;
  onTamamla: () => void;
}) {
  const { gorev, alan, baslik, onAc, onTamamla } = props;
  const renk = `var(--${alan})`;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Etiket alan={alan} kind="task" />
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
          Öncelik: {gorev.oncelik}
        </span>
      </div>
      <div className="flex items-start gap-3">
        <ListTodo className="mt-1 h-5 w-5 shrink-0" style={{ color: renk }} />
        <h2 className="min-w-0 truncate text-lg font-semibold tracking-tight sm:text-xl">
          {baslik}
        </h2>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onTamamla}
          className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-3.5 py-1.5 text-xs font-medium text-background transition-transform hover:scale-[1.03] active:scale-[0.97]"
        >
          <Check className="h-3 w-3" />
          Tamamla
        </button>
        <button
          type="button"
          onClick={onAc}
          className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
        >
          Detay
        </button>
      </div>
    </div>
  );
}

function ModulIcerik(props: { modul: AmelModul; kurs: AmelKurs; onTamamla: () => void }) {
  const { modul, kurs, onTamamla } = props;
  const renk = "var(--amel)";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Etiket alan="amel" kind="modul" />
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
          {kurs.kod ?? kurs.ad}
        </span>
      </div>
      <div className="flex items-start gap-3">
        <Sparkles className="mt-1 h-5 w-5 shrink-0" style={{ color: renk }} />
        <h2 className="min-w-0 truncate text-lg font-semibold tracking-tight sm:text-xl">
          {modul.baslik}
        </h2>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Link
          to="/mizan/amel/$id"
          params={{ id: kurs.id }}
          className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-3.5 py-1.5 text-xs font-medium text-background transition-transform hover:scale-[1.03] active:scale-[0.97]"
        >
          <Play className="h-3 w-3 fill-current" />
          Çalış
        </Link>
        <button
          type="button"
          onClick={onTamamla}
          className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
        >
          <Check className="h-3 w-3" />
          Tamamla
        </button>
      </div>
    </div>
  );
}

function BosIcerik({
  onYeniEtkinlik,
  onYeniGorev,
}: {
  onYeniEtkinlik: () => void;
  onYeniGorev: () => void;
}) {
  return (
    <div className="flex flex-col items-start gap-3">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Bugün boş
      </span>
      <h2 className="text-lg font-semibold tracking-tight sm:text-xl">
        Planına bir şey ekle
      </h2>
      <p className="text-xs text-muted-foreground">
        Sıradaki adımın için bir etkinlik ya da görev oluştur.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onYeniEtkinlik}
          className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-3.5 py-1.5 text-xs font-medium text-background transition-transform hover:scale-[1.03] active:scale-[0.97]"
        >
          <CalendarPlus className="h-3 w-3" />
          Etkinlik
        </button>
        <button
          type="button"
          onClick={onYeniGorev}
          className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ListTodo className="h-3 w-3" />
          Görev
        </button>
      </div>
    </div>
  );
}

// Suppress unused import lint when tr locale not directly used here
void tr;