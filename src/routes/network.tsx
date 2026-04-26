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
import { FileText } from "lucide-react";
import { GundemlerTab } from "@/components/mizan/network/gundemler-tab";
import { KisilerTab } from "@/components/mizan/network/kisiler-tab";
import { IstisarelerTab } from "@/components/mizan/network/istisareler-tab";

type TabKey = "kisiler" | "istisareler" | "gundemler";
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
    if (
      t === "gundemler" ||
      t === "istisareler" ||
      t === "kisiler"
    ) {
      return { tab: t };
    }
    return { tab: "gundemler" };
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

  const tab: TabKey = search.tab ?? "gundemler";
  const setTab = (v: TabKey) => {
    navigate({ to: "/network", search: { tab: v }, replace: true });
  };

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
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5"
          onClick={() =>
            navigate({
              to: "/network/rapor",
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              search: (() => ({})) as any,
            })
          }
        >
          <FileText className="h-3.5 w-3.5" />
          Rapor
        </Button>
      </header>

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
        <TabsList className="mb-4">
          <TabsTrigger value="kisiler">Kişiler</TabsTrigger>
          <TabsTrigger value="istisareler">İstişareler</TabsTrigger>
          <TabsTrigger value="gundemler">Gündemler</TabsTrigger>
        </TabsList>

        <TabsContent value="kisiler">
          <KisilerTab />
        </TabsContent>
        <TabsContent value="istisareler">
          <IstisarelerTab />
        </TabsContent>
        <TabsContent value="gundemler">
          <GundemlerTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
