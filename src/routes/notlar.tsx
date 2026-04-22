import { createFileRoute } from "@tanstack/react-router";
import { Pin, Plus } from "lucide-react";
import { SayfaBasligi } from "@/components/mizan/sayfa-basligi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/notlar")({
  head: () => ({
    meta: [
      { title: "Notlar — Mizan" },
      { name: "description", content: "Hızlı not — Keep tarzı kart ızgarası." },
      { property: "og:title", content: "Notlar — Mizan" },
      { property: "og:description", content: "Aklındakini hızlıca yaz, sonra organize et." },
    ],
  }),
  component: NotlarPage,
});

const notlar = [
  { baslik: "Akşam programı planı", icerik: "Yusuf'a kardeşlik hukuku gündemini aç.", etiket: "kardeşler", sabit: true },
  { baslik: "CCNA — subnet alıştırması", icerik: "192.168.1.0/24 → 4 alt ağ", etiket: "hedef" },
  { baslik: "Lab raporu başlık", icerik: "Topology, configs, tests, conclusion.", etiket: "akademi" },
  { baslik: "Dua listesi", icerik: "Anne, baba, kardeşler, hocalar.", etiket: "maneviyat", sabit: true },
  { baslik: "Hafta özeti", icerik: "3 ders + 1 sohbet + 30 dk CCNA × 5 gün.", etiket: "genel" },
];

function NotlarPage() {
  return (
    <div>
      <SayfaBasligi
        baslik="Notlar"
        aciklama="Aklına geleni hemen yaz; etiketle, sabitle, ara."
        aksiyonlar={
          <Button size="sm" className="gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Yeni not
          </Button>
        }
      />
      <div className="px-6 py-5">
        <Input placeholder="Notlarda ara…" className="mb-4 h-8 max-w-md border-border bg-muted/40 text-sm" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {notlar.map((n) => (
            <div
              key={n.baslik}
              className="flex flex-col rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
            >
              <div className="flex items-start justify-between">
                <h3 className="text-sm font-medium text-foreground">{n.baslik}</h3>
                {n.sabit && <Pin className="h-3.5 w-3.5 text-primary" />}
              </div>
              <p className="mt-2 flex-1 text-xs text-muted-foreground">{n.icerik}</p>
              <span className="mt-3 self-start rounded-full bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground">
                #{n.etiket}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}