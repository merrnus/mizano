import * as React from "react";
import { Link } from "@tanstack/react-router";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import { Users, ArrowRight } from "lucide-react";
import type { KisiDetay } from "@/lib/network-tipleri";
import {
  useFaaliyetOzetleri,
  durumHesapla,
  type FaaliyetDurum,
} from "@/lib/network/sonraki-faaliyet";
import { useKardesEtkinlikler } from "@/lib/network/kardes-etkinlik";

type Props = {
  kisiler: KisiDetay[];
  bos?: React.ReactNode;
};

const DURUM_RENK: Record<FaaliyetDurum, string> = {
  yesil: "bg-emerald-500",
  sari: "bg-amber-500",
  gri: "bg-muted-foreground/40",
};

const DURUM_ETIKET: Record<FaaliyetDurum, string> = {
  yesil: "Aktif (son 7 gün)",
  sari: "Görüşme zamanı (8–21 gün)",
  gri: "İhmal edilmiş",
};

export function RehberlikListesi({ kisiler, bos }: Props) {
  const ozetQ = useFaaliyetOzetleri();
  const ozetler = ozetQ.data ?? {};
  const [secili, setSecili] = React.useState<KisiDetay | null>(null);

  if (kisiler.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/30 px-6 py-16 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Users className="h-5 w-5" />
        </div>
        <p className="text-sm text-muted-foreground">{bos ?? "Bu kategoride kişi yok."}</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {kisiler.map((k, idx) => {
          const ozet = ozetler[k.id];
          const durum = durumHesapla(ozet?.son_tarih ?? null);
          const altYazi = ozet?.sonraki_tarih
            ? `Sonraki: ${format(parseISO(ozet.sonraki_tarih), "d MMM", { locale: tr })} · ${ozet.sonraki_baslik ?? ""}`
            : ozet?.son_tarih
              ? `Son: ${format(parseISO(ozet.son_tarih), "d MMM", { locale: tr })}`
              : "Henüz faaliyet yok";
          return (
            <button
              key={k.id}
              type="button"
              onClick={() => setSecili(k)}
              className={cn(
                "flex w-full items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-accent/40",
                idx > 0 && "border-t border-border/60",
              )}
            >
              <span
                className={cn("h-2.5 w-2.5 shrink-0 rounded-full", DURUM_RENK[durum])}
                title={DURUM_ETIKET[durum]}
                aria-label={DURUM_ETIKET[durum]}
              />
              <Avatar className="h-9 w-9 shrink-0">
                <AvatarFallback className="bg-muted text-xs">
                  {k.ad.split(" ").map((p) => p[0]).join("").slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-foreground">{k.ad}</div>
                <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
                  {altYazi}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <KisiHizliSheet kisi={secili} onClose={() => setSecili(null)} />
    </>
  );
}

function KisiHizliSheet({
  kisi,
  onClose,
}: {
  kisi: KisiDetay | null;
  onClose: () => void;
}) {
  const etkinliklerQ = useKardesEtkinlikler(kisi?.id);
  const [haftalik, setHaftalik] = React.useState(false);
  const etkinlikler = etkinliklerQ.data ?? [];
  const son = etkinlikler[0];

  return (
    <Sheet open={!!kisi} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{kisi?.ad ?? ""}</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-5">
          <div>
            <div className="mb-1 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Son faaliyet
            </div>
            {son ? (
              <div className="rounded-md border border-border bg-card/40 px-3 py-2 text-sm">
                <div className="font-medium">{son.baslik}</div>
                <div className="text-xs text-muted-foreground">
                  {format(parseISO(son.tarih), "d MMMM yyyy, EEEE", { locale: tr })}
                  {son.baslangic_saati ? ` · ${son.baslangic_saati.slice(0, 5)}` : ""}
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">Henüz faaliyet yok</div>
            )}
          </div>

          <label className="flex cursor-pointer items-center gap-2.5 rounded-md border border-border bg-card/40 px-3 py-2.5">
            <Checkbox
              checked={haftalik}
              onCheckedChange={(v) => setHaftalik(!!v)}
            />
            <span className="text-sm">Bu hafta okumasını yaptı</span>
          </label>

          {kisi && (
            <Link
              to="/network/kisi/$id"
              params={{ id: kisi.id }}
              search={{ kt: "faaliyetler" }}
              onClick={onClose}
              className="flex items-center justify-between rounded-md border border-border bg-primary/5 px-3 py-2.5 text-sm font-medium text-primary hover:bg-primary/10"
            >
              <span>Profili aç · Faaliyetleri düzenle</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}