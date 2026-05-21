import * as React from "react";
import {
  createFileRoute,
  useNavigate,
  useSearch,
  Outlet,
  useMatchRoute,
} from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CalendarPlus,
  FileText,
  MessageSquare,
  MoreHorizontal,
  Search,
  Star,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { RehberlikListesi } from "@/components/mizan/network/rehberlik-listesi";
import { FaaliyetPlanlaDialog } from "@/components/mizan/network/faaliyet-planla-dialog";
import { useKategoriler, useKisiler } from "@/lib/network-hooks";

type AktifKat = string | "tumu" | "yildizli";
type NetworkSearch = { kat?: string; tab?: "kisiler" | "istisareler" };

export const Route = createFileRoute("/network")({
  head: () => ({
    meta: [
      { title: "Rehberlik — Faaliyet odaklı kişi takibi" },
      {
        name: "description",
        content: "Kategoriler, kişiler ve faaliyet planlama tek bir yerde.",
      },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): NetworkSearch => {
    const out: NetworkSearch = {};
    if (typeof s.kat === "string") out.kat = s.kat;
    if (s.tab === "kisiler" || s.tab === "istisareler") out.tab = s.tab;
    return out;
  },
  component: Network,
});

function Network() {
  const search = useSearch({ from: "/network" });
  const navigate = useNavigate();
  const matchRoute = useMatchRoute();
  const childActive = !!matchRoute({ to: "/network/istisare/$id" });
  const kisiDetayActive = !!matchRoute({ to: "/network/kisi/$id" });
  const raporActive = !!matchRoute({ to: "/network/rapor" });

  if (childActive || kisiDetayActive || raporActive) {
    return <Outlet />;
  }

  const [arama, setArama] = React.useState("");
  const [planlaAcik, setPlanlaAcik] = React.useState(false);

  const kategorilerQ = useKategoriler();
  const kisilerQ = useKisiler();
  const kategoriler = kategorilerQ.data ?? [];
  const kisiler = kisilerQ.data ?? [];

  const aktif: AktifKat = search.kat ?? "tumu";
  const setAktif = (v: AktifKat) => {
    navigate({
      to: "/network",
      search: { kat: v === "tumu" ? undefined : v },
      replace: true,
    });
  };

  const filtreli = kisiler.filter((k) => {
    const aramaUygun = arama ? k.ad.toLowerCase().includes(arama.toLowerCase()) : true;
    if (!aramaUygun) return false;
    if (aktif === "tumu") return true;
    if (aktif === "yildizli") return k.derin_takip;
    return k.kategori_ids.includes(aktif);
  });

  const aktifKategoriId =
    aktif !== "tumu" && aktif !== "yildizli" ? aktif : null;
  const aktifKategori = aktifKategoriId
    ? kategoriler.find((k) => k.id === aktifKategoriId)
    : null;
  const baslik =
    aktif === "tumu"
      ? "Tüm kişiler"
      : aktif === "yildizli"
        ? "Yıldızlılar"
        : (aktifKategori?.ad ?? "");

  const sayi = (id: AktifKat) => {
    if (id === "tumu") return kisiler.length;
    if (id === "yildizli") return kisiler.filter((k) => k.derin_takip).length;
    return kisiler.filter((k) => k.kategori_ids.includes(id as string)).length;
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-5 pb-28 sm:px-6">
      <header className="mb-5 flex items-center gap-2 sm:gap-3">
        <h1 className="shrink-0 text-base font-semibold tracking-tight text-foreground sm:text-lg">
          Rehberlik
        </h1>
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={arama}
            onChange={(e) => setArama(e.target.value)}
            placeholder="Kişi ara…"
            className="h-10 rounded-full border-transparent bg-muted/60 pl-9 text-sm shadow-none focus-visible:bg-background focus-visible:ring-1"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="h-9 w-9 shrink-0 rounded-full"
              aria-label="Derin"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() =>
                navigate({
                  to: "/network",
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  search: { tab: "istisareler" } as any,
                })
              }
            >
              <MessageSquare className="mr-2 h-3.5 w-3.5" />
              İstişareler
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                navigate({
                  to: "/network/rapor",
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  search: (() => ({})) as any,
                })
              }
            >
              <FileText className="mr-2 h-3.5 w-3.5" />
              Rapor
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <div className="md:grid md:grid-cols-[200px_1fr] md:gap-6">
        {/* Sol: kategori sidebar */}
        <KategoriSidebar
          aktif={aktif}
          setAktif={setAktif}
          kategoriler={kategoriler}
          sayi={sayi}
        />

        {/* Sağ: liste + plan butonu */}
        <div className="min-w-0">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-foreground">{baslik}</div>
              <div className="text-[11px] text-muted-foreground">
                {filtreli.length} kişi
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => setPlanlaAcik(true)}
              className="gap-1.5 rounded-full"
            >
              <CalendarPlus className="h-3.5 w-3.5" />
              Faaliyet Planla
            </Button>
          </div>

          {kisilerQ.isLoading ? (
            <div className="rounded-xl border border-border bg-card/50 p-6 text-center text-sm text-muted-foreground">
              Yükleniyor…
            </div>
          ) : (
            <RehberlikListesi
              kisiler={filtreli}
              bos={
                arama
                  ? "Bu aramayla eşleşen kişi yok."
                  : aktif === "tumu"
                    ? "Henüz kişi yok."
                    : "Bu kategoride kişi yok."
              }
            />
          )}
        </div>
      </div>

      <FaaliyetPlanlaDialog
        acik={planlaAcik}
        onClose={() => setPlanlaAcik(false)}
        kategoriId={aktifKategoriId}
      />
    </div>
  );
}

function KategoriSidebar({
  aktif,
  setAktif,
  kategoriler,
  sayi,
}: {
  aktif: AktifKat;
  setAktif: (v: AktifKat) => void;
  kategoriler: { id: string; ad: string; renk: string | null }[];
  sayi: (id: AktifKat) => number;
}) {
  const ozeller: { id: AktifKat; ad: string; icon?: React.ReactNode }[] = [
    { id: "tumu", ad: "Tümü", icon: <Users className="h-3 w-3" /> },
    { id: "yildizli", ad: "Yıldızlı", icon: <Star className="h-3 w-3 fill-primary text-primary" /> },
  ];

  return (
    <>
      {/* Mobil: yatay chip bar */}
      <div className="mb-4 flex flex-wrap items-center gap-1.5 md:hidden">
        {ozeller.map((o) => (
          <Chip
            key={String(o.id)}
            aktif={aktif === o.id}
            onClick={() => setAktif(o.id)}
            ad={o.ad}
            sayi={sayi(o.id)}
            icon={o.icon}
          />
        ))}
        <span className="mx-0.5 h-4 w-px bg-border" />
        {kategoriler.map((k) => (
          <Chip
            key={k.id}
            aktif={aktif === k.id}
            onClick={() => setAktif(k.id)}
            ad={k.ad}
            sayi={sayi(k.id)}
            renk={k.renk}
          />
        ))}
      </div>

      {/* md+: dikey */}
      <aside className="hidden md:block">
        <nav className="flex flex-col gap-0.5">
          {ozeller.map((o) => (
            <RailItem
              key={String(o.id)}
              aktif={aktif === o.id}
              onClick={() => setAktif(o.id)}
              ad={o.ad}
              sayi={sayi(o.id)}
              icon={o.icon}
            />
          ))}
        </nav>
        <div className="my-3 h-px bg-border" />
        <div className="mb-1.5 px-2 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Kategoriler
        </div>
        <nav className="flex flex-col gap-0.5">
          {kategoriler.map((k) => (
            <RailItem
              key={k.id}
              aktif={aktif === k.id}
              onClick={() => setAktif(k.id)}
              ad={k.ad}
              sayi={sayi(k.id)}
              renk={k.renk}
            />
          ))}
        </nav>
      </aside>
    </>
  );
}

function Chip({
  aktif,
  onClick,
  ad,
  sayi,
  renk,
  icon,
}: {
  aktif: boolean;
  onClick: () => void;
  ad: string;
  sayi: number;
  renk?: string | null;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors",
        aktif
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground",
      )}
    >
      {renk && (
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: `var(${renk})` }}
        />
      )}
      {icon}
      <span>{ad}</span>
      <span className={cn("text-[10px] tabular-nums", !aktif && "opacity-60")}>{sayi}</span>
    </button>
  );
}

function RailItem({
  aktif,
  onClick,
  ad,
  sayi,
  renk,
  icon,
}: {
  aktif: boolean;
  onClick: () => void;
  ad: string;
  sayi: number;
  renk?: string | null;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
        aktif
          ? "bg-accent text-foreground"
          : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
      )}
    >
      {renk ? (
        <span
          className="h-2 w-2 shrink-0 rounded-full"
          style={{ backgroundColor: `var(${renk})` }}
        />
      ) : (
        <span className="grid h-3 w-3 shrink-0 place-items-center text-muted-foreground">
          {icon}
        </span>
      )}
      <span className="flex-1 truncate">{ad}</span>
      <span className="text-[10px] tabular-nums text-muted-foreground">{sayi}</span>
    </button>
  );
}
