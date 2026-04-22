import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, Plus, Users } from "lucide-react";
import { SayfaBasligi } from "@/components/mizan/sayfa-basligi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/gundemler")({
  head: () => ({
    meta: [
      { title: "Gündemler — Mizan" },
      { name: "description", content: "Gündem havuzu: kişilere ve gruplara uygulanabilir." },
      { property: "og:title", content: "Gündemler — Mizan" },
      { property: "og:description", content: "Hafta hafta kardeşlerin gelişim gündemleri." },
    ],
  }),
  component: GundemlerPage,
});

const gundemler = [
  { baslik: "Sabah evradının önemi", grup: "Ev + GG", durum: "Bu hafta", ozet: "Risale-i Nur'dan kısa bir bahis ile aç." },
  { baslik: "Vakit yönetimi", grup: "OMM", durum: "Sıradaki", ozet: "Pomodoro ve günlük plan üzerinden örnek." },
  { baslik: "Kardeşlik hukuku", grup: "Tüm gruplar", durum: "Bu hafta", ozet: "Kısa metin + 2 soru ile teke tek." },
  { baslik: "İlim niyeti", grup: "Kuran dersi", durum: "Sıradaki", ozet: "Niyet hadisi etrafında kısa sohbet." },
];

function GundemlerPage() {
  return (
    <div>
      <SayfaBasligi
        baslik="Gündemler"
        aciklama="Gündem havuzu — kardeşlere ve gruplara uygula."
        aksiyonlar={
          <Button size="sm" className="gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Yeni gündem
          </Button>
        }
      />
      <div className="px-6 py-5">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Input placeholder="Gündem ara…" className="h-8 max-w-xs border-border bg-muted/40 text-sm" />
          <Button size="sm" variant="outline">
            Bu hafta
          </Button>
          <Button size="sm" variant="ghost">
            Tüm gruplar
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {gundemler.map((g) => (
            <div
              key={g.baslik}
              className="flex flex-col rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary">
                  {g.durum}
                </span>
                <span className="text-[10px] text-muted-foreground">{g.grup}</span>
              </div>
              <h3 className="text-sm font-medium text-foreground">
                <BookOpen className="mr-1 inline h-3.5 w-3.5 text-primary" />
                {g.baslik}
              </h3>
              <p className="mt-2 flex-1 text-xs text-muted-foreground">{g.ozet}</p>
              <Button size="sm" variant="outline" className="mt-3 gap-1.5">
                <Users className="h-3.5 w-3.5" /> Kişilere uygula
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}