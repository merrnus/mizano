import { createFileRoute } from "@tanstack/react-router";
import { Target } from "lucide-react";
import { SayfaBasligi } from "@/components/mizan/sayfa-basligi";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/hedefler")({
  head: () => ({
    meta: [
      { title: "Hedefler — Mizan" },
      { name: "description", content: "Dünyevi hedefler: networking, Linux, sertifikalar." },
      { property: "og:title", content: "Hedefler — Mizan" },
      { property: "og:description", content: "3 aylık ve haftalık takip ile dünyevi hedefler." },
    ],
  }),
  component: HedeflerPage,
});

const ucAylik = [
  { ad: "CCNA sertifikası", ilerleme: 40, adim: "Modül 3 — Subnetting" },
  { ad: "Linux temel komutlar", ilerleme: 65, adim: "Bash scripting" },
  { ad: "Docker temelleri", ilerleme: 20, adim: "Compose örnekleri" },
];

const haftalik = [
  { ad: "Her gün 30 dk CCNA", ilerleme: 70 },
  { ad: "Haftada 3 Linux lab", ilerleme: 50 },
  { ad: "1 küçük proje commit", ilerleme: 80 },
];

function HedeflerPage() {
  return (
    <div>
      <SayfaBasligi
        baslik="Hedefler"
        aciklama="Dünyevi hedefler — 3 aylık + haftalık birlikte."
      />
      <div className="px-6 py-5">
        <Tabs defaultValue="uc" className="w-full">
          <TabsList>
            <TabsTrigger value="uc">3 Aylık</TabsTrigger>
            <TabsTrigger value="hafta">Haftalık</TabsTrigger>
          </TabsList>
          <TabsContent value="uc" className="mt-4 grid gap-4 md:grid-cols-2">
            {ucAylik.map((h) => (
              <div key={h.ad} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-[var(--dunyevi)]" />
                  <h3 className="text-sm font-medium text-foreground">{h.ad}</h3>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Bugünkü adım: <span className="text-foreground">{h.adim}</span>
                </p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-[var(--dunyevi)]"
                    style={{ width: `${h.ilerleme}%` }}
                  />
                </div>
              </div>
            ))}
          </TabsContent>
          <TabsContent value="hafta" className="mt-4 grid gap-4 md:grid-cols-2">
            {haftalik.map((h) => (
              <div key={h.ad} className="rounded-xl border border-border bg-card p-4">
                <h3 className="text-sm font-medium text-foreground">{h.ad}</h3>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-[var(--dunyevi)]"
                    style={{ width: `${h.ilerleme}%` }}
                  />
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">{h.ilerleme}% bu hafta</p>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}