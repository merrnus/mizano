import * as React from "react";
import { CalendarDays, Check, Sparkles } from "lucide-react";
import { format, parseISO, isToday, isPast } from "date-fns";
import { tr } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useBuHaftaOzet } from "@/lib/network-hooks";
import { ETKINLIK_TIP_MAP, type KardesEtkinlik, type Kisi } from "@/lib/network-tipleri";
import { KisiOzetSheet } from "./kisi-ozet-sheet";

function initials(ad: string) {
  return ad
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function BuHaftaWidget() {
  const { data, isLoading } = useBuHaftaOzet();
  const [secilenKisiId, setSecilenKisiId] = React.useState<string | null>(null);

  if (isLoading) return null;
  if (!data) return null;
  if (data.programlar.length === 0 && data.faaliyetler.length === 0) return null;

  return (
    <>
      <section className="mt-6 rounded-2xl border border-border bg-card p-4 sm:p-5">
        <div className="mb-3 flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold tracking-tight">Bu hafta</h2>
          <span className="ml-auto text-[10px] uppercase tracking-wider text-muted-foreground">
            {format(parseISO(data.haftaBas), "d MMM", { locale: tr })} –{" "}
            {format(parseISO(data.haftaSon), "d MMM", { locale: tr })}
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Bolum ikon={CalendarDays} baslik="Programlar" sayi={data.programlar.length}>
            {data.programlar.length === 0 ? (
              <Bos>Bu hafta program yok</Bos>
            ) : (
              data.programlar.map(({ kisi, etkinlik }) => (
                <EtkinlikSatir
                  key={etkinlik.id}
                  kisi={kisi}
                  etkinlik={etkinlik}
                  onClick={() => setSecilenKisiId(kisi.id)}
                />
              ))
            )}
          </Bolum>

          <Bolum ikon={Sparkles} baslik="Faaliyetler" sayi={data.faaliyetler.length}>
            {data.faaliyetler.length === 0 ? (
              <Bos>Bu hafta faaliyet yok</Bos>
            ) : (
              data.faaliyetler.map(({ kisi, etkinlik }) => (
                <EtkinlikSatir
                  key={etkinlik.id}
                  kisi={kisi}
                  etkinlik={etkinlik}
                  onClick={() => setSecilenKisiId(kisi.id)}
                />
              ))
            )}
          </Bolum>
        </div>
      </section>

      <KisiOzetSheet
        kisiId={secilenKisiId}
        haftaBas={data.haftaBas}
        haftaSon={data.haftaSon}
        onOpenChange={(open) => {
          if (!open) setSecilenKisiId(null);
        }}
      />
    </>
  );
}

function Bolum({
  ikon: Ikon,
  baslik,
  sayi,
  children,
}: {
  ikon: React.ComponentType<{ className?: string }>;
  baslik: string;
  sayi: number;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        <Ikon className="h-3 w-3" />
        {baslik}
        <span className="ml-auto tabular-nums">{sayi}</span>
      </div>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function Bos({ children }: { children: React.ReactNode }) {
  return <div className="px-1.5 py-1 text-xs text-muted-foreground">{children}</div>;
}

function EtkinlikSatir({
  kisi,
  etkinlik,
  onClick,
}: {
  kisi: Kisi;
  etkinlik: KardesEtkinlik;
  onClick: () => void;
}) {
  const meta = ETKINLIK_TIP_MAP[etkinlik.tip];
  const tarih = parseISO(etkinlik.tarih);
  const gecmis = isPast(tarih) && !isToday(tarih);

  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "group flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left transition-colors hover:bg-accent/50 " +
        (gecmis ? "opacity-60" : "")
      }
    >
      <Avatar className="h-6 w-6 border border-border">
        {kisi.foto_url ? <AvatarImage src={kisi.foto_url} alt={kisi.ad} /> : null}
        <AvatarFallback className="bg-muted text-[9px]">{initials(kisi.ad)}</AvatarFallback>
      </Avatar>
      <span
        className="h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: `var(${meta.renkVar})` }}
      />
      <span className="min-w-0 flex-1 truncate text-xs">
        <span className="text-foreground">{kisi.ad}</span>
        <span className="text-muted-foreground"> · {etkinlik.baslik}</span>
      </span>
      <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
        {gecmis ? <Check className="inline h-3 w-3" /> : null}{" "}
        {format(tarih, "d MMM", { locale: tr })}
        {etkinlik.baslangic_saati ? ` · ${etkinlik.baslangic_saati.slice(0, 5)}` : ""}
      </span>
    </button>
  );
}