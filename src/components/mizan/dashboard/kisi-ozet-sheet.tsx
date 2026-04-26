import * as React from "react";
import { Link } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import { Phone, GraduationCap, ArrowRight } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useKisi, useKardesEtkinlikler, useKategoriler } from "@/lib/network-hooks";
import { ETKINLIK_TIP_MAP } from "@/lib/network-tipleri";

function initials(ad: string) {
  return ad
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function KisiOzetSheet({
  kisiId,
  haftaBas,
  haftaSon,
  onOpenChange,
}: {
  kisiId: string | null;
  haftaBas?: string;
  haftaSon?: string;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: kisi } = useKisi(kisiId ?? undefined);
  const { data: etkinlikler } = useKardesEtkinlikler(kisiId ?? undefined);
  const { data: kategoriler } = useKategoriler();

  const haftaEtkinlikleri = React.useMemo(() => {
    if (!etkinlikler || !haftaBas || !haftaSon) return [];
    return etkinlikler
      .filter((e) => e.tarih >= haftaBas && e.tarih <= haftaSon)
      .sort((a, b) => a.tarih.localeCompare(b.tarih));
  }, [etkinlikler, haftaBas, haftaSon]);

  const kisiKategoriler = React.useMemo(() => {
    if (!kisi || !kategoriler) return [];
    return kategoriler.filter((k) => kisi.kategori_ids.includes(k.id));
  }, [kisi, kategoriler]);

  return (
    <Sheet open={!!kisiId} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto sm:max-w-md"
      >
        {kisi ? (
          <>
            <SheetHeader>
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 border border-border">
                  {kisi.foto_url ? <AvatarImage src={kisi.foto_url} alt={kisi.ad} /> : null}
                  <AvatarFallback className="bg-muted text-sm">
                    {initials(kisi.ad)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1 text-left">
                  <SheetTitle className="truncate">{kisi.ad}</SheetTitle>
                  {kisiKategoriler.length > 0 ? (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {kisiKategoriler.map((k) => (
                        <span
                          key={k.id}
                          className="rounded-full border border-border px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground"
                        >
                          {k.ad}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </SheetHeader>

            {/* Bilgiler */}
            {(kisi.telefon || kisi.universite || kisi.bolum) && (
              <div className="mt-4 space-y-1.5 text-xs text-muted-foreground">
                {kisi.telefon ? (
                  <div className="flex items-center gap-2">
                    <Phone className="h-3 w-3" />
                    <span>{kisi.telefon}</span>
                  </div>
                ) : null}
                {(kisi.universite || kisi.bolum) ? (
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-3 w-3" />
                    <span>
                      {[kisi.universite, kisi.bolum, kisi.sinif].filter(Boolean).join(" · ")}
                    </span>
                  </div>
                ) : null}
              </div>
            )}

            {/* Bu hafta */}
            <div className="mt-6">
              <div className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Bu hafta
              </div>
              {haftaEtkinlikleri.length === 0 ? (
                <p className="text-xs text-muted-foreground">Bu hafta kayıt yok.</p>
              ) : (
                <ul className="space-y-1.5">
                  {haftaEtkinlikleri.map((e) => {
                    const meta = ETKINLIK_TIP_MAP[e.tip];
                    return (
                      <li
                        key={e.id}
                        className="flex items-center gap-2 rounded-md border border-border px-2 py-1.5"
                      >
                        <span
                          className="h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ backgroundColor: `var(${meta.renkVar})` }}
                        />
                        <span className="min-w-0 flex-1 truncate text-xs">
                          <span className="text-muted-foreground">{meta.ad} · </span>
                          <span className="text-foreground">{e.baslik}</span>
                        </span>
                        <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
                          {format(parseISO(e.tarih), "d MMM", { locale: tr })}
                          {e.baslangic_saati ? ` · ${e.baslangic_saati.slice(0, 5)}` : ""}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Footer link */}
            <div className="mt-6 border-t border-border pt-4">
              <Link
                to="/network/kisi/$id"
                params={{ id: kisi.id }}
                search={{ tab: "profil" } as never}
                onClick={() => onOpenChange(false)}
                className="inline-flex items-center gap-1 text-xs text-foreground hover:text-primary"
              >
                Tüm profili aç
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}