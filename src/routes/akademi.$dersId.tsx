import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, CalendarClock, CheckSquare, FileText, Square } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/akademi/$dersId")({
  head: ({ params }) => ({
    meta: [
      { title: `${decodeURIComponent(params.dersId)} — Akademi — Mizan` },
      { name: "description", content: "Ders detay: notlar, sınav takvimi, proje görevleri." },
    ],
  }),
  component: DersDetay,
});

const projeGorevleri = [
  { ad: "Topology diyagramı", bitti: true },
  { ad: "Router config örnekleri", bitti: true },
  { ad: "Test senaryoları", bitti: false },
  { ad: "Sonuç + rapor PDF", bitti: false },
];

function DersDetay() {
  const { dersId } = Route.useParams();
  const ad = decodeURIComponent(dersId);

  return (
    <div>
      <div className="border-b border-border px-4 py-5 md:px-6">
        <Link
          to="/akademi"
          className="mb-3 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" /> Akademi
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-foreground">{ad}</h1>
            <p className="mt-1 text-sm text-muted-foreground">Notlar, sınav takvimi ve proje görevleri</p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background/40 px-2.5 py-1 text-xs text-muted-foreground">
            <CalendarClock className="h-3 w-3" /> Sınav: 12 May
          </span>
        </div>
      </div>

      <div className="px-4 py-5 md:px-6">
        <Tabs defaultValue="notlar" className="w-full">
          <TabsList>
            <TabsTrigger value="notlar"><FileText className="mr-1 h-3.5 w-3.5" />Notlar</TabsTrigger>
            <TabsTrigger value="sinav"><CalendarClock className="mr-1 h-3.5 w-3.5" />Sınav takvimi</TabsTrigger>
            <TabsTrigger value="proje"><CheckSquare className="mr-1 h-3.5 w-3.5" />Proje</TabsTrigger>
          </TabsList>

          <TabsContent value="notlar" className="mt-4 space-y-3">
            <Textarea
              placeholder="Ders notları, hocaya soracakların, kaynaklar…"
              className="min-h-40 border-border bg-background/40 text-sm"
            />
            <Button size="sm">Notları kaydet</Button>
          </TabsContent>

          <TabsContent value="sinav" className="mt-4">
            <div className="space-y-2">
              {[
                { ad: "Vize", tarih: "12 May 2026 — 10:00", yer: "B-201" },
                { ad: "Final", tarih: "20 Haz 2026 — 13:00", yer: "B-310" },
              ].map((s) => (
                <div
                  key={s.ad}
                  className="flex items-center justify-between rounded-xl border border-border bg-card p-3"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{s.ad}</p>
                    <p className="text-xs text-muted-foreground">{s.yer}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{s.tarih}</span>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="proje" className="mt-4">
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              {projeGorevleri.map((g, i) => (
                <div
                  key={g.ad}
                  className={`flex items-center gap-3 px-4 py-3 ${
                    i !== projeGorevleri.length - 1 ? "border-b border-border" : ""
                  }`}
                >
                  {g.bitti ? (
                    <CheckSquare className="h-4 w-4 text-primary" />
                  ) : (
                    <Square className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span
                    className={`flex-1 text-sm ${
                      g.bitti ? "text-muted-foreground line-through" : "text-foreground"
                    }`}
                  >
                    {g.ad}
                  </span>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}