import * as React from "react";
import { Link } from "@tanstack/react-router";
import { Cake, Coffee, Sparkles, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEvdekilerOzet } from "@/lib/network-hooks";
import { ETKINLIK_TIP_MAP } from "@/lib/network-tipleri";
import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";

export function EvdekilerWidget() {
  const { data, isLoading } = useEvdekilerOzet();

  if (isLoading) return null;
  if (!data) return null;

  const toplam =
    data.dogumGunu.length + data.tekeTekBekleyen.length + data.yaklaşanProgram.length;
  if (toplam === 0) return null;

  return (
    <section className="mt-6 rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold tracking-tight">Bu hafta Evdekiler</h2>
        </div>
        <Link
          to="/network"
          search={{ tab: "kisiler" }}
          className="text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
        >
          Tümü →
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Doğum günleri */}
        <Bolum ikon={Cake} baslik="Doğum günü" sayi={data.dogumGunu.length}>
          {data.dogumGunu.length === 0 ? (
            <Bos>Bu hafta yok</Bos>
          ) : (
            data.dogumGunu.map((d) => (
              <KisiSatir
                key={d.kisi.id}
                id={d.kisi.id}
                ad={d.kisi.ad}
                foto={d.kisi.foto_url}
                alt={d.gun === 0 ? "🎂 Bugün!" : d.gun === 1 ? "Yarın" : `${d.gun} gün sonra`}
              />
            ))
          )}
        </Bolum>

        {/* Teke tek bekleyenler */}
        <Bolum ikon={Coffee} baslik="Teke tek bekleyen" sayi={data.tekeTekBekleyen.length}>
          {data.tekeTekBekleyen.length === 0 ? (
            <Bos>Hepsi güncel</Bos>
          ) : (
            data.tekeTekBekleyen.slice(0, 5).map((t) => (
              <KisiSatir
                key={t.kisi.id}
                id={t.kisi.id}
                ad={t.kisi.ad}
                foto={t.kisi.foto_url}
                alt={t.sonTarih ? `${t.gunGectiKi} gün önce` : "Hiç yapılmadı"}
                vurgu={!!t.sonTarih && (t.gunGectiKi ?? 0) >= 30}
              />
            ))
          )}
        </Bolum>

        {/* Yaklaşan programlar */}
        <Bolum ikon={Sparkles} baslik="Yaklaşan program" sayi={data.yaklaşanProgram.length}>
          {data.yaklaşanProgram.length === 0 ? (
            <Bos>Plan yok</Bos>
          ) : (
            data.yaklaşanProgram.slice(0, 5).map((p, i) => {
              const meta = ETKINLIK_TIP_MAP[p.tip];
              return (
                <Link
                  key={`${p.kisi.id}-${i}`}
                  to="/network/kisi/$id"
                  params={{ id: p.kisi.id }}
                  search={{ tab: "faaliyetler" } as never}
                  className="group flex items-center gap-2 rounded-md px-1.5 py-1 hover:bg-accent/50"
                >
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: `var(${meta.renkVar})` }}
                  />
                  <span className="min-w-0 flex-1 truncate text-xs">
                    <span className="text-foreground">{p.kisi.ad}</span>
                    <span className="text-muted-foreground"> · {p.baslik}</span>
                  </span>
                  <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
                    {format(parseISO(p.tarih), "d MMM", { locale: tr })}
                  </span>
                </Link>
              );
            })
          )}
        </Bolum>
      </div>
    </section>
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

function KisiSatir({
  id,
  ad,
  foto,
  alt,
  vurgu,
}: {
  id: string;
  ad: string;
  foto: string | null;
  alt: string;
  vurgu?: boolean;
}) {
  const initials = ad
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <Link
      to="/network/kisi/$id"
      params={{ id }}
      search={{ tab: "profil" } as never}
      className="group flex items-center gap-2 rounded-md px-1.5 py-1 hover:bg-accent/50"
    >
      <Avatar className="h-6 w-6 border border-border">
        {foto ? <AvatarImage src={foto} alt={ad} /> : null}
        <AvatarFallback className="bg-muted text-[9px]">{initials}</AvatarFallback>
      </Avatar>
      <span className="min-w-0 flex-1 truncate text-xs text-foreground">{ad}</span>
      <span
        className={
          "shrink-0 text-[10px] tabular-nums " +
          (vurgu ? "text-destructive" : "text-muted-foreground")
        }
      >
        {alt}
      </span>
    </Link>
  );
}