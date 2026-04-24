import * as React from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Plus, Target } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useHedefler, useTumAdimlar } from "@/lib/hedef-hooks";
import { hedefIlerleme } from "@/lib/hedef-tipleri";
import type { CeteleAlan } from "@/lib/cetele-tipleri";
import { ALAN_ETIKET, ALAN_RENK_VAR } from "@/lib/cetele-tipleri";
import { HedefKart } from "./hedef/hedef-kart";

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
  const { data: hedefler = [], isLoading } = useHedefler();
  const { data: adimlar = [] } = useTumAdimlar();

  const open = alan !== null;
  const aktifAlan = alan ?? "mana";
  const renk = `var(${ALAN_RENK_VAR[aktifAlan]})`;
  const route = ALAN_ROUTE[aktifAlan];

  const ilgili = React.useMemo(
    () =>
      hedefler
        .filter((h) => h.alan === aktifAlan && h.durum === "aktif")
        .sort((a, b) => {
          const ai = hedefIlerleme(a, adimlar);
          const bi = hedefIlerleme(b, adimlar);
          // bitmemiş ve yüksek ilerleme önce
          return bi - ai;
        }),
    [hedefler, adimlar, aktifAlan],
  );

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
          {/* 3 Aylık Hedefler bölümü */}
          <section>
            <div className="mb-3 flex items-center gap-2">
              <Target className="h-3.5 w-3.5" style={{ color: renk }} />
              <h3 className="text-sm font-medium">Aktif Hedefler</h3>
              <span className="ml-auto text-[11px] text-muted-foreground">
                {ilgili.length} adet
              </span>
            </div>

            {isLoading ? (
              <p className="py-6 text-center text-xs text-muted-foreground">
                Yükleniyor…
              </p>
            ) : ilgili.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-10 text-center">
                <p className="text-xs text-muted-foreground">
                  Bu alanda henüz aktif hedef yok.
                </p>
                <Button asChild size="sm" variant="outline" className="h-7 text-xs">
                  <Link to={route} onClick={() => onOpenChange(false)}>
                    <Plus className="mr-1 h-3 w-3" /> Hedef ekle
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="grid gap-3">
                {ilgili.map((h) => (
                  <div key={h.id} onClick={() => onOpenChange(false)}>
                    <HedefKart hedef={h} adimlar={adimlar} />
                  </div>
                ))}
              </div>
            )}
          </section>

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