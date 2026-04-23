import * as React from "react";
import { createFileRoute, useSearch } from "@tanstack/react-router";
import { Filter, Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GundemlerTab } from "@/components/mizan/network/gundemler-tab";
import { cn } from "@/lib/utils";

type NetworkSearch = { tab?: "kisiler" | "gundemler" };

export const Route = createFileRoute("/network")({
  head: () => ({
    meta: [
      { title: "Rehberlik — İnsanlar ve Gündemler" },
      {
        name: "description",
        content: "Kardeşlerin profilleri, ilerleme çubukları ve atanmış gündemler.",
      },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): NetworkSearch => ({
    tab: s.tab === "gundemler" ? "gundemler" : "kisiler",
  }),
  component: Network,
});

type Etiket = "Evdekiler" | "GG" | "OMM" | "Kuran" | "Online";

type Kisi = {
  ad: string;
  etiketler: Etiket[];
  akademi: number;
  maneviyat: number;
  sosyal: number;
  hobiler: string[];
  gundemler: string[];
};

const kisiler: Kisi[] = [
  {
    ad: "Ahmet Y.",
    etiketler: ["Evdekiler", "Kuran"],
    akademi: 70,
    maneviyat: 85,
    sosyal: 60,
    hobiler: ["Kitap", "Yürüyüş"],
    gundemler: ["Kamp planlama", "Haftalık sohbet"],
  },
  {
    ad: "Yusuf K.",
    etiketler: ["Evdekiler"],
    akademi: 55,
    maneviyat: 70,
    sosyal: 75,
    hobiler: ["Futbol", "Tarih"],
    gundemler: ["Haftalık sohbet"],
  },
  {
    ad: "Mehmet S.",
    etiketler: ["GG", "Kuran"],
    akademi: 80,
    maneviyat: 65,
    sosyal: 50,
    hobiler: ["Kod yazmak"],
    gundemler: ["1-on-1 görüşme"],
  },
  {
    ad: "Hasan A.",
    etiketler: ["OMM"],
    akademi: 40,
    maneviyat: 60,
    sosyal: 80,
    hobiler: ["Bisiklet"],
    gundemler: ["Kamp planlama"],
  },
  {
    ad: "Ömer T.",
    etiketler: ["GG"],
    akademi: 65,
    maneviyat: 75,
    sosyal: 65,
    hobiler: ["Kahve", "Felsefe"],
    gundemler: ["Haftalık sohbet"],
  },
  {
    ad: "İbrahim M.",
    etiketler: ["Online", "Kuran"],
    akademi: 75,
    maneviyat: 80,
    sosyal: 45,
    hobiler: ["Hat sanatı"],
    gundemler: ["Online ders"],
  },
  {
    ad: "Bilal R.",
    etiketler: ["OMM", "Online"],
    akademi: 50,
    maneviyat: 55,
    sosyal: 70,
    hobiler: ["Müzik"],
    gundemler: [],
  },
  {
    ad: "Salih D.",
    etiketler: ["Evdekiler"],
    akademi: 85,
    maneviyat: 90,
    sosyal: 55,
    hobiler: ["Yazma"],
    gundemler: ["Kamp planlama", "1-on-1 görüşme"],
  },
];

const tumEtiketler: Etiket[] = ["Evdekiler", "GG", "OMM", "Kuran", "Online"];

const etiketRenk: Record<Etiket, string> = {
  Evdekiler: "bg-[var(--maneviyat)]/15 text-foreground border-[var(--maneviyat)]/40",
  GG: "bg-[var(--dunyevi)]/15 text-foreground border-[var(--dunyevi)]/40",
  OMM: "bg-muted text-muted-foreground border-border",
  Kuran: "bg-primary/15 text-foreground border-primary/40",
  Online: "bg-[var(--akademi)]/15 text-foreground border-[var(--akademi)]/40",
};

function Network() {
  const search = useSearch({ from: "/network" });
  const [tab, setTab] = React.useState<"kisiler" | "gundemler">(
    search.tab ?? "kisiler",
  );
  React.useEffect(() => {
    if (search.tab && search.tab !== tab) setTab(search.tab);
    // sadece URL değişimini dinler
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search.tab]);

  const [aktif, setAktif] = React.useState<Etiket | "tumu">("tumu");
  const [arama, setArama] = React.useState("");
  const [secili, setSecili] = React.useState<Kisi | null>(null);

  const filtreli = kisiler.filter((k) => {
    const etiketUygun = aktif === "tumu" || k.etiketler.includes(aktif);
    const aramaUygun = k.ad.toLowerCase().includes(arama.toLowerCase());
    return etiketUygun && aramaUygun;
  });

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      <header className="mb-6 flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Rehberlik
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Yol Arkadaşları
          </h1>
        </div>
        <Button size="sm" className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">
            {tab === "kisiler" ? "Kişi ekle" : "Gündem ekle"}
          </span>
        </Button>
      </header>

      <Tabs value={tab} onValueChange={(v) => setTab(v as "kisiler" | "gundemler")}>
        <TabsList className="mb-4">
          <TabsTrigger value="kisiler">Kişiler</TabsTrigger>
          <TabsTrigger value="gundemler">Gündemler</TabsTrigger>
        </TabsList>

        <TabsContent value="kisiler">
          <KisilerIcerigi
            aktif={aktif}
            setAktif={setAktif}
            arama={arama}
            setArama={setArama}
            filtreli={filtreli}
            setSecili={setSecili}
          />
        </TabsContent>
        <TabsContent value="gundemler">
          <GundemlerTab />
        </TabsContent>
      </Tabs>

      {/* Detay drawer (mobile + desktop) */}
      <Drawer open={!!secili} onOpenChange={(o) => !o && setSecili(null)}>
        <DrawerContent>
          {secili && (
            <div className="mx-auto w-full max-w-2xl px-4 pb-6">
              <DrawerHeader className="px-0">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 border border-border">
                    <AvatarFallback className="bg-muted">
                      {secili.ad.split(" ").map((p) => p[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <DrawerTitle className="text-left">{secili.ad}</DrawerTitle>
                    <DrawerDescription className="text-left">
                      {secili.etiketler.join(" · ")}
                    </DrawerDescription>
                  </div>
                </div>
              </DrawerHeader>
              <div className="mt-2 space-y-4">
                <MiniBars
                  items={[
                    { ad: "Akademi", val: secili.akademi, renk: "--akademi" },
                    { ad: "Maneviyat", val: secili.maneviyat, renk: "--maneviyat" },
                    { ad: "Sosyal", val: secili.sosyal, renk: "--dunyevi" },
                  ]}
                  detayli
                />
                <div>
                  <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Hobiler
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {secili.hobiler.map((h) => (
                      <Badge key={h} variant="secondary" className="text-xs">
                        {h}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Atanmış Gündemler
                  </h4>
                  {secili.gundemler.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Atanmış gündem yok.</p>
                  ) : (
                    <ul className="flex flex-col gap-1.5">
                      {secili.gundemler.map((g) => (
                        <li
                          key={g}
                          className="rounded-lg border border-border bg-background/40 px-3 py-2 text-xs text-foreground"
                        >
                          {g}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
}

function KisilerIcerigi({
  aktif,
  setAktif,
  arama,
  setArama,
  filtreli,
  setSecili,
}: {
  aktif: Etiket | "tumu";
  setAktif: (a: Etiket | "tumu") => void;
  arama: string;
  setArama: (a: string) => void;
  filtreli: Kisi[];
  setSecili: (k: Kisi) => void;
}) {
  return (
    <>
      {/* Arama + filtre */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Kişi ara…"
            value={arama}
            onChange={(e) => setArama(e.target.value)}
            className="h-9 pl-8 text-sm"
          />
        </div>
      </div>

      <div className="-mx-4 mb-5 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="flex items-center gap-2 pb-1">
          <Filter className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          {tumEtiketler.map((e) => {
            const sayi = kisiler.filter((k) => k.etiketler.includes(e)).length;
            return (
              <button
                key={e}
                onClick={() => setAktif(aktif === e ? "tumu" : e)}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1 text-xs transition-colors",
                  aktif === e
                    ? "border-primary/60 bg-primary/15 text-foreground"
                    : "border-border bg-background text-muted-foreground hover:text-foreground",
                )}
              >
                {e} ({sayi})
              </button>
            );
          })}
        </div>
      </div>

      {/* Kart grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtreli.map((k) => (
          <button
            key={k.ad}
            onClick={() => setSecili(k)}
            className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/40"
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border border-border">
                <AvatarFallback className="bg-muted text-xs">
                  {k.ad.split(" ").map((p) => p[0]).join("")}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-foreground">
                  {k.ad}
                </div>
                <div className="mt-0.5 flex flex-wrap gap-1">
                  {k.etiketler.map((e) => (
                    <Badge
                      key={e}
                      variant="outline"
                      className={cn("text-[9px]", etiketRenk[e])}
                    >
                      {e}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            <MiniBars
              items={[
                { ad: "Akd", val: k.akademi, renk: "--akademi" },
                { ad: "Mnv", val: k.maneviyat, renk: "--maneviyat" },
                { ad: "Sos", val: k.sosyal, renk: "--dunyevi" },
              ]}
            />
          </button>
        ))}
      </div>
    </>
  );
}

function MiniBars({
  items,
  detayli = false,
}: {
  items: { ad: string; val: number; renk: string }[];
  detayli?: boolean;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", detayli && "gap-2.5")}>
      {items.map((i) => (
        <div key={i.ad} className="flex items-center gap-2">
          <span
            className={cn(
              "shrink-0 text-muted-foreground",
              detayli ? "w-20 text-xs" : "w-8 text-[10px]",
            )}
          >
            {i.ad}
          </span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted/50">
            <div
              className="h-full rounded-full"
              style={{
                width: `${i.val}%`,
                backgroundColor: `var(${i.renk})`,
              }}
            />
          </div>
          <span
            className={cn(
              "shrink-0 text-right font-medium text-foreground",
              detayli ? "w-10 text-xs" : "w-7 text-[10px]",
            )}
          >
            {i.val}
          </span>
        </div>
      ))}
    </div>
  );
}
