import * as React from "react";
import {
  createFileRoute,
  useNavigate,
  useSearch,
  Outlet,
  useMatchRoute,
} from "@tanstack/react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileText, MoreHorizontal, Search } from "lucide-react";
import { KisilerTab } from "@/components/mizan/network/kisiler-tab";
import { IstisarelerTab } from "@/components/mizan/network/istisareler-tab";
import { Fab } from "@/components/mizan/network/fab";

type TabKey = "kisiler" | "istisareler";
type NetworkSearch = { tab?: TabKey };

export const Route = createFileRoute("/network")({
  head: () => ({
    meta: [
      { title: "Rehberlik — İnsanlar ve Gündemler" },
      {
        name: "description",
        content: "Kişiler, istişareler, gündemler — istişare odaklı yönetim.",
      },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): NetworkSearch => {
    const t = s.tab;
    if (t === "istisareler" || t === "kisiler") {
      return { tab: t };
    }
    return { tab: "istisareler" };
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

  const tab: TabKey = search.tab ?? "istisareler";
  const setTab = (v: TabKey) => {
    navigate({ to: "/network", search: { tab: v }, replace: true });
  };

  const [arama, setArama] = React.useState("");
  const [fabTetik, setFabTetik] = React.useState(0);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-5 pb-28 sm:px-6">
      {/* Gmail-vari tek satır üst bar */}
      <header className="mb-4 flex items-center gap-2 sm:gap-3">
        <h1 className="shrink-0 text-base font-semibold tracking-tight text-foreground sm:text-lg">
          Rehberlik
        </h1>
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={arama}
            onChange={(e) => setArama(e.target.value)}
            placeholder="Kişi, istişare veya gündem ara…"
            className="h-10 rounded-full border-transparent bg-muted/60 pl-9 text-sm shadow-none focus-visible:bg-background focus-visible:ring-1"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="h-9 w-9 shrink-0 rounded-full"
              aria-label="Daha fazla"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
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

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
        <TabsList className="mb-4 h-auto rounded-none border-b border-border bg-transparent p-0">
          <SegTab value="kisiler" active={tab === "kisiler"}>
            Kişiler
          </SegTab>
          <SegTab value="istisareler" active={tab === "istisareler"}>
            İstişareler
          </SegTab>
        </TabsList>

        <TabsContent value="kisiler" className="mt-0">
          <KisilerTab arama={arama} fabTetik={fabTetik} />
        </TabsContent>
        <TabsContent value="istisareler" className="mt-0">
          <IstisarelerTab arama={arama} fabTetik={fabTetik} />
        </TabsContent>
      </Tabs>

      <Fab
        onClick={() => setFabTetik((n) => n + 1)}
        label={tab === "kisiler" ? "Yeni kişi" : "Yeni istişare"}
      />
    </div>
  );
}

/** Material 3 segmented tab — alt çizgili, sade. */
function SegTab({
  value,
  active,
  children,
}: {
  value: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <TabsTrigger
      value={value}
      className={
        "relative h-10 rounded-none border-0 bg-transparent px-4 text-sm font-medium shadow-none data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none " +
        (active
          ? "text-foreground after:absolute after:inset-x-2 after:-bottom-px after:h-[2px] after:rounded-full after:bg-primary"
          : "text-muted-foreground hover:text-foreground")
      }
    >
      {children}
    </TabsTrigger>
  );
}
