import * as React from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, GraduationCap, Plus, Sparkles, Layers } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useSablonlar, useUcAylikKayitlari } from "@/lib/cetele-hooks";
import { useDersler } from "@/lib/ilim-hooks";
import { DERS_DURUM_ETIKET } from "@/lib/ilim-tipleri";
import { useAmelKurslar, useTumAmelModuller } from "@/lib/amel-hooks";
import { kursIlerleme, KURS_DURUM_ETIKET } from "@/lib/amel-tipleri";
import type { CeteleAlan } from "@/lib/cetele-tipleri";
import { ALAN_ETIKET, ALAN_RENK_VAR } from "@/lib/cetele-tipleri";

const ALAN_ALTBASLIK: Record<CeteleAlan, string> = {
  mana: "Evrâd, çetele ve manevi hedefler",
  ilim: "Dersler, sınavlar ve akademik hedefler",
  amel: "Kurslar, projeler ve dünyevi hedefler",
  kisisel: "Kişisel hedefler",
};

const ALAN_ROUTE: Record<CeteleAlan, "/mizan/mana" | "/mizan/ilim" | "/mizan/amel"> = {
  mana: "/mizan/mana",
  ilim: "/mizan/ilim",
  amel: "/mizan/amel",
  kisisel: "/mizan/amel",
};

type Props = {
  alan: CeteleAlan | null;
  onOpenChange: (open: boolean) => void;
  yuzde: number;
};

/**
 * Ana sayfadaki alan kartına tıklayınca açılan yarım panel.
 * İçerik: alan özeti + 3 aylık aktif hedefler + tam sayfaya geçiş linki.
 */
export function AlanDetaySheet({ alan, onOpenChange, yuzde }: Props) {
  const { data: sablonlar = [] } = useSablonlar();
  const { data: dersler = [] } = useDersler();
  const { data: amelKurslar = [] } = useAmelKurslar();
  const { data: amelModuller = [] } = useTumAmelModuller();

  const open = alan !== null;
  const aktifAlan = alan ?? "mana";
  const renk = `var(${ALAN_RENK_VAR[aktifAlan]})`;
  const route = ALAN_ROUTE[aktifAlan];

  // Mana: 3 aylık çetele hedefleri (uc_aylik_hedef tanımlı şablonlar)
  const ucAylikSablonlar = React.useMemo(
    () => sablonlar.filter((s) => s.alan === "mana" && s.uc_aylik_hedef),
    [sablonlar],
  );
  const ucAylikIds = ucAylikSablonlar.map((s) => s.id);
  const { data: ucAylikKayit = [] } = useUcAylikKayitlari(ucAylikIds);

  // İlim: aktif dersler (izliyor / restant)
  const aktifDersler = React.useMemo(
    () =>
      dersler.filter(
        (d) => d.durum === "izliyor" || d.durum === "restant",
      ),
    [dersler],
  );

  // Amel: aktif müfredat (durum = "aktif" kurslar) + ilerleme
  const aktifKurslar = React.useMemo(() => {
    return amelKurslar
      .filter((k) => k.durum === "aktif")
      .map((k) => {
        const km = amelModuller.filter((m) => m.kurs_id === k.id);
        return {
          kurs: k,
          toplam: km.length,
          tamam: km.filter((m) => m.tamamlandi).length,
          yuzde: kursIlerleme(km),
        };
      })
      .sort((a, b) => b.yuzde - a.yuzde);
  }, [amelKurslar, amelModuller]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto p-0 sm:max-w-xl"
      >
        {/* Renkli başlık şeridi */}
        <div
          className="border-b border-border px-6 py-5"
          style={{
            background: `linear-gradient(180deg, color-mix(in oklab, ${renk} 8%, transparent) 0%, transparent 100%)`,
            borderLeft: `3px solid ${renk}`,
          }}
        >
          <SheetHeader className="space-y-1.5 text-left">
            <div className="flex items-baseline justify-between gap-3">
              <SheetTitle className="text-xl font-semibold tracking-tight">
                {ALAN_ETIKET[aktifAlan]}
              </SheetTitle>
              <span
                className="text-2xl font-semibold tabular-nums"
                style={{ color: renk }}
              >
                {Math.round(yuzde)}%
              </span>
            </div>
            <SheetDescription className="text-xs text-muted-foreground">
              {ALAN_ALTBASLIK[aktifAlan]}
            </SheetDescription>
            <div className="pt-2">
              <Progress
                value={yuzde}
                className="h-1.5 bg-muted"
                style={{ ["--progress-fg" as string]: renk } as React.CSSProperties}
              />
            </div>
          </SheetHeader>
        </div>

        <div className="space-y-5 px-6 py-5">
          {/* MANA — 3 aylık çetele hedefleri */}
          {aktifAlan === "mana" && ucAylikSablonlar.length > 0 ? (
            <section>
              <div className="mb-3 flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5" style={{ color: renk }} />
                <h3 className="text-sm font-medium">3 Aylık Hedefler</h3>
                <span className="ml-auto text-[11px] text-muted-foreground">
                  {ucAylikSablonlar.length} adet
                </span>
              </div>
              <div className="flex flex-col gap-3 rounded-xl border border-border bg-card/40 p-4">
                {ucAylikSablonlar.map((s) => {
                  const toplam = ucAylikKayit
                    .filter((k) => k.sablon_id === s.id)
                    .reduce((a, k) => a + Number(k.miktar), 0);
                  const hedef = Number(s.uc_aylik_hedef ?? 0);
                  const yuzdeS =
                    hedef > 0 ? Math.min(100, (toplam / hedef) * 100) : 0;
                  return (
                    <div key={s.id}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="font-medium">{s.ad}</span>
                        <span className="tabular-nums text-muted-foreground">
                          {toplam} / {hedef} {s.birim}
                        </span>
                      </div>
                      {s.notlar ? (
                        <div className="mb-1 text-[10px] text-muted-foreground/80">
                          {s.notlar}
                        </div>
                      ) : null}
                      <Progress
                        value={yuzdeS}
                        className="h-1.5 bg-muted"
                        style={
                          { ["--progress-fg" as string]: renk } as React.CSSProperties
                        }
                      />
                    </div>
                  );
                })}
              </div>
            </section>
          ) : null}

          {/* İLİM — aktif dersler */}
          {aktifAlan === "ilim" ? (
            <section>
              <div className="mb-3 flex items-center gap-2">
                <GraduationCap className="h-3.5 w-3.5" style={{ color: renk }} />
                <h3 className="text-sm font-medium">Aktif Dersler</h3>
                <span className="ml-auto text-[11px] text-muted-foreground">
                  {aktifDersler.length} adet
                </span>
              </div>
              {aktifDersler.length === 0 ? (
                <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-10 text-center">
                  <p className="text-xs text-muted-foreground">
                    Henüz aktif ders yok.
                  </p>
                  <Button asChild size="sm" variant="outline" className="h-7 text-xs">
                    <Link to={route} onClick={() => onOpenChange(false)}>
                      <Plus className="mr-1 h-3 w-3" /> Ders ekle
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="grid gap-2">
                  {aktifDersler.map((d) => (
                    <Link
                      key={d.id}
                      to="/mizan/ilim/$id"
                      params={{ id: d.id }}
                      onClick={() => onOpenChange(false)}
                      className="group flex items-center justify-between rounded-xl border border-border bg-card/40 px-4 py-3 transition hover:border-border/70 hover:bg-card"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <BookOpen
                            className="h-3.5 w-3.5 shrink-0"
                            style={{ color: renk }}
                          />
                          <span className="truncate text-sm font-medium">
                            {d.ad}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-2 pl-5 text-[11px] text-muted-foreground">
                          <span>{DERS_DURUM_ETIKET[d.durum]}</span>
                          {d.donem ? <span>· {d.donem}</span> : null}
                          {d.kredi ? <span>· {d.kredi} kredi</span> : null}
                        </div>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground transition group-hover:translate-x-0.5" />
                    </Link>
                  ))}
                </div>
              )}
            </section>
          ) : null}

          {/* AMEL — aktif müfredat (kurslar + ilerleme) */}
          {aktifAlan === "amel" ? (
            <section>
              <div className="mb-3 flex items-center gap-2">
                <Layers className="h-3.5 w-3.5" style={{ color: renk }} />
                <h3 className="text-sm font-medium">Aktif Müfredat</h3>
                <span className="ml-auto text-[11px] text-muted-foreground">
                  {aktifKurslar.length} kurs
                </span>
              </div>
              {aktifKurslar.length === 0 ? (
                <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-10 text-center">
                  <p className="text-xs text-muted-foreground">
                    Henüz aktif kursun yok.
                  </p>
                  <Button asChild size="sm" variant="outline" className="h-7 text-xs">
                    <Link to={route} onClick={() => onOpenChange(false)}>
                      <ArrowRight className="mr-1 h-3 w-3" /> Müfredata git
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="grid gap-2">
                  {aktifKurslar.map(({ kurs, toplam, tamam, yuzde: ky }) => (
                    <Link
                      key={kurs.id}
                      to="/mizan/amel/$id"
                      params={{ id: kurs.id }}
                      onClick={() => onOpenChange(false)}
                      className="group flex flex-col gap-2 rounded-xl border border-border bg-card/40 px-4 py-3 transition hover:border-border/70 hover:bg-card"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <BookOpen
                              className="h-3.5 w-3.5 shrink-0"
                              style={{ color: renk }}
                            />
                            <span className="truncate text-sm font-medium">
                              {kurs.kod ?? kurs.ad}
                              {kurs.kod ? (
                                <span className="ml-1.5 text-muted-foreground font-normal">
                                  · {kurs.ad}
                                </span>
                              ) : null}
                            </span>
                          </div>
                          <div className="mt-1 flex items-center gap-2 pl-5 text-[11px] text-muted-foreground tabular-nums">
                            <span>{KURS_DURUM_ETIKET[kurs.durum]}</span>
                            <span aria-hidden="true">·</span>
                            <span>
                              {tamam}/{toplam} modül
                            </span>
                          </div>
                        </div>
                        <span
                          className="text-sm font-semibold tabular-nums"
                          style={{ color: renk }}
                        >
                          %{ky}
                        </span>
                      </div>
                      <Progress
                        value={ky}
                        className="h-1 bg-muted"
                        style={
                          { ["--progress-fg" as string]: renk } as React.CSSProperties
                        }
                      />
                    </Link>
                  ))}
                </div>
              )}
            </section>
          ) : null}

          {/* Alt aksiyon */}
          <div className="sticky bottom-0 -mx-6 border-t border-border bg-background/95 px-6 py-3 backdrop-blur">
            <Button
              asChild
              variant="ghost"
              className="w-full justify-between"
              onClick={() => onOpenChange(false)}
            >
              <Link to={route}>
                <span className="text-sm">{ALAN_ETIKET[aktifAlan]} sayfasını aç</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}