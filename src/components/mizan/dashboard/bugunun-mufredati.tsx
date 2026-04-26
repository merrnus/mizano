import * as React from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Play, BookOpen, Check } from "lucide-react";
import {
  useAmelAlanlar,
  useAmelKurslar,
  useTumAmelModuller,
  useAmelModulGuncelle,
} from "@/lib/amel-hooks";
import { AmelAkisModu } from "@/components/mizan/dashboard/amel-akis-modu";
import { cn } from "@/lib/utils";
import type { AmelKurs, AmelModul, AmelAlan } from "@/lib/amel-tipleri";

export type GunlukModulOge = {
  modul: AmelModul;
  kurs: AmelKurs;
  alan: AmelAlan | undefined;
  toplamModul: number;
  tamamlanan: number;
};

/** Modül başlığı/açıklamasının uzunluğuna göre kabaca dakika tahmini. */
export function modulSureTahmini(m: AmelModul): number {
  const a = (m.aciklama ?? "").trim().length;
  if (a === 0) return 30;
  if (a < 120) return 30;
  if (a < 400) return 45;
  return 60;
}

function dakikayiYaz(toplamDk: number): string {
  if (toplamDk < 60) return `${toplamDk} dk`;
  const sa = Math.floor(toplamDk / 60);
  const dk = toplamDk % 60;
  return dk === 0 ? `${sa} sa` : `${sa} sa ${dk} dk`;
}

/**
 * Bugünün Müfredatı — izlenen her kursun ilk tamamlanmamış modülünü
 * kompakt bir liste hâlinde gösterir. Tek tık tamamla veya akış modu.
 */
export function BugununMufredati() {
  const { data: alanlar = [] } = useAmelAlanlar();
  const { data: kurslar = [] } = useAmelKurslar();
  const { data: tumModuller = [] } = useTumAmelModuller();
  const modulGuncelle = useAmelModulGuncelle();

  const [akisAcik, setAkisAcik] = React.useState(false);
  const [akisBaslangicId, setAkisBaslangicId] = React.useState<string | null>(null);

  const bugunModulleri: GunlukModulOge[] = React.useMemo(() => {
    const izlenen = kurslar.filter((k) => k.durum === "aktif");
    return izlenen
      .map<GunlukModulOge | null>((kurs) => {
        const kursModulleri = tumModuller
          .filter((m) => m.kurs_id === kurs.id)
          .sort((a, b) => a.siralama - b.siralama);
        const ilkEksik = kursModulleri.find((m) => !m.tamamlandi);
        if (!ilkEksik) return null;
        return {
          modul: ilkEksik,
          kurs,
          alan: alanlar.find((a) => a.id === kurs.alan_id),
          toplamModul: kursModulleri.length,
          tamamlanan: kursModulleri.filter((m) => m.tamamlandi).length,
        };
      })
      .filter((x): x is GunlukModulOge => x !== null);
  }, [kurslar, tumModuller, alanlar]);

  const toplamDakika = bugunModulleri.reduce(
    (acc, o) => acc + modulSureTahmini(o.modul),
    0,
  );

  const amelRenk = "var(--amel)";

  // Boş durum
  if (kurslar.length === 0 || bugunModulleri.length === 0) {
    return (
      <section className="rounded-2xl border border-border bg-card">
        <header className="flex items-end justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              Bugünün Müfredatı
            </p>
            <h2 className="mt-0.5 text-lg font-semibold tracking-tight">
              Çalışma sırası
            </h2>
          </div>
        </header>
        <div className="px-5 py-8 text-center">
          <BookOpen
            className="mx-auto mb-3 h-7 w-7 opacity-40"
            style={{ color: amelRenk }}
          />
          <p className="text-sm text-muted-foreground">
            {kurslar.length === 0
              ? "Henüz kursun yok."
              : "Aktif izlediğin kurs yok."}{" "}
            <Link
              to="/mizan/amel"
              className="text-foreground underline-offset-4 hover:underline"
            >
              Müfredata git
            </Link>
            .
          </p>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="rounded-2xl border border-border bg-card">
        <header className="flex items-end justify-between gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              Bugünün Müfredatı
            </p>
            <h2 className="mt-0.5 text-lg font-semibold tracking-tight">
              {bugunModulleri.length} modül
              <span className="ml-1.5 text-sm font-normal text-muted-foreground tabular-nums">
                · ~{dakikayiYaz(toplamDakika)}
              </span>
            </h2>
          </div>
          <button
            type="button"
            onClick={() => {
              setAkisBaslangicId(bugunModulleri[0]?.modul.id ?? null);
              setAkisAcik(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all hover:scale-[1.04] active:scale-[0.97]"
            style={{
              color: amelRenk,
              backgroundColor: `color-mix(in oklab, ${amelRenk} 12%, transparent)`,
              boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${amelRenk} 22%, transparent)`,
            }}
            aria-label="Akış modunu başlat"
          >
            <Play className="h-3 w-3 fill-current" />
            Akış
          </button>
        </header>

        <ul className="grid grid-cols-1 md:grid-cols-2">
          {bugunModulleri.map((oge) => {
            const renk = oge.alan?.renk ?? amelRenk;
            const ilerlemeMetin = `${oge.tamamlanan + 1}/${oge.toplamModul}`;
            const sure = modulSureTahmini(oge.modul);
            return (
              <li
                key={oge.modul.id}
                className="grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-3 border-b border-border px-5 py-3 md:[&:nth-last-child(-n+2)]:border-b-0 md:[&:nth-child(odd)]:border-r md:[&:nth-child(odd)]:border-r-border md:[&:last-child:nth-child(odd)]:border-r-0"
              >
                {/* Renkli nokta */}
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{
                    backgroundColor: renk,
                    boxShadow: `0 0 8px ${renk}`,
                  }}
                  aria-hidden="true"
                />

                {/* Kurs · Modül başlığı + alt satır */}
                <div className="min-w-0">
                  <Link
                    to="/mizan/amel/$id"
                    params={{ id: oge.kurs.id }}
                    className="block truncate text-sm font-medium hover:underline"
                  >
                    <span style={{ color: renk }}>
                      {oge.kurs.kod ?? oge.kurs.ad}
                    </span>
                    <span className="text-muted-foreground"> · </span>
                    <span>{oge.modul.baslik}</span>
                  </Link>
                  <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground tabular-nums">
                    <span>Modül {ilerlemeMetin}</span>
                    <span aria-hidden="true">·</span>
                    <span>~{sure} dk</span>
                  </div>
                </div>

                {/* Tamamla checkbox */}
                <button
                  type="button"
                  onClick={() =>
                    modulGuncelle.mutate({
                      id: oge.modul.id,
                      tamamlandi: true,
                      tamamlanma: new Date().toISOString().slice(0, 10),
                    })
                  }
                  disabled={modulGuncelle.isPending}
                  className={cn(
                    "inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-background/40 text-muted-foreground transition-all hover:scale-105 hover:text-foreground active:scale-95",
                    modulGuncelle.isPending && "opacity-50",
                  )}
                  aria-label={`${oge.modul.baslik} modülünü tamamla`}
                  title="Tamamlandı olarak işaretle"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>

                {/* Çalış (akış modunu bu modülden başlat) */}
                <button
                  type="button"
                  onClick={() => {
                    setAkisBaslangicId(oge.modul.id);
                    setAkisAcik(true);
                  }}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-all hover:scale-[1.04] active:scale-[0.97]"
                  style={{
                    color: renk,
                    backgroundColor: `color-mix(in oklab, ${renk} 10%, transparent)`,
                    boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${renk} 22%, transparent)`,
                  }}
                  aria-label={`${oge.modul.baslik} için çalışmaya başla`}
                >
                  <Play className="h-2.5 w-2.5 fill-current" />
                  Çalış
                </button>
              </li>
            );
          })}
        </ul>

        <div className="border-t border-border px-5 py-3">
          <Link
            to="/mizan/amel"
            className="inline-flex items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
          >
            Tüm müfredat
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </section>

      <AmelAkisModu
        acik={akisAcik}
        ogeler={bugunModulleri}
        baslangicId={akisBaslangicId}
        onClose={() => setAkisAcik(false)}
      />
    </>
  );
}
