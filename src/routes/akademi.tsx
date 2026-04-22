import { createFileRoute } from "@tanstack/react-router";
import { CalendarClock, GraduationCap } from "lucide-react";
import { SayfaBasligi } from "@/components/mizan/sayfa-basligi";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/akademi")({
  head: () => ({
    meta: [
      { title: "Akademi — Mizan" },
      { name: "description", content: "Aktif dönem dersleri ve borç dersler." },
      { property: "og:title", content: "Akademi — Mizan" },
      { property: "og:description", content: "Üniversite dersleri, sınavlar ve projeler." },
    ],
  }),
  component: AkademiPage,
});

const aktifDersler = [
  { ad: "BIL 305 — Ağ Yönetimi", hoca: "Dr. Yılmaz", sinav: "12 May", proje: "Lab raporu", ilerleme: 60 },
  { ad: "BIL 311 — Veri Tabanı", hoca: "Dr. Aydın", sinav: "18 May", proje: "Mini app", ilerleme: 35 },
  { ad: "BIL 320 — Yazılım Müh.", hoca: "Dr. Kaya", sinav: "21 May", proje: "Sprint 2", ilerleme: 50 },
];

const borcDersler = [
  { ad: "BIL 207 — Algoritma", hoca: "—", sinav: "—", proje: "—", ilerleme: 10 },
  { ad: "BIL 215 — Diferansiyel Denk.", hoca: "—", sinav: "—", proje: "—", ilerleme: 0 },
  { ad: "BIL 224 — Lineer Cebir", hoca: "—", sinav: "—", proje: "—", ilerleme: 0 },
  { ad: "BIL 305 — Mantık Devreleri", hoca: "—", sinav: "—", proje: "—", ilerleme: 0 },
  { ad: "BIL 308 — Mikroişlemciler", hoca: "—", sinav: "—", proje: "—", ilerleme: 0 },
  { ad: "BIL 314 — Otomata", hoca: "—", sinav: "—", proje: "—", ilerleme: 0 },
  { ad: "BIL 401 — Derleyici", hoca: "—", sinav: "—", proje: "—", ilerleme: 0 },
];

function DersKart({ d }: { d: (typeof aktifDersler)[number] }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-medium text-foreground">{d.ad}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{d.hoca}</p>
        </div>
        <span className="flex items-center gap-1 rounded-full border border-border bg-background/40 px-2 py-0.5 text-[10px] text-muted-foreground">
          <CalendarClock className="h-3 w-3" /> {d.sinav}
        </span>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Proje: <span className="text-foreground">{d.proje}</span>
      </p>
      <div className="mt-3">
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>İlerleme</span>
          <span>{d.ilerleme}%</span>
        </div>
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-[var(--akademi)]"
            style={{ width: `${d.ilerleme}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function AkademiPage() {
  return (
    <div>
      <SayfaBasligi
        baslik="Akademi"
        aciklama="Aktif dönem dersleri ve 7 borç dersi tek yerde."
        aksiyonlar={
          <Button size="sm" variant="outline" className="gap-1.5">
            <GraduationCap className="h-3.5 w-3.5" /> Ders ekle
          </Button>
        }
      />
      <div className="px-6 py-5">
        <Tabs defaultValue="aktif" className="w-full">
          <TabsList>
            <TabsTrigger value="aktif">Aktif Dönem</TabsTrigger>
            <TabsTrigger value="borc">Borç Dersler ({borcDersler.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="aktif" className="mt-4">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {aktifDersler.map((d) => (
                <DersKart key={d.ad} d={d} />
              ))}
            </div>
          </TabsContent>
          <TabsContent value="borc" className="mt-4">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {borcDersler.map((d) => (
                <DersKart key={d.ad} d={d} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}