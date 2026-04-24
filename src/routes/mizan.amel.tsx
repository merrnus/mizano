import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/mizan/dunyevi")({
  head: () => ({
    meta: [
      { title: "Dünyevi Hedefler — Mizan" },
      { name: "description", content: "Sertifikalar ve dünyevi gelişim hedefleri." },
    ],
  }),
  component: DunyeviSayfasi,
});

const hedefler = [
  { ad: "CCNA Sertifikası", ay: 3, ilerleme: 45, son: "Modül 4 / 6" },
  { ad: "Linux LFCS", ay: 3, ilerleme: 25, son: "Disk yönetimi" },
  { ad: "AWS Cloud Practitioner", ay: 3, ilerleme: 10, son: "Başlangıç" },
  { ad: "Docker & K8s temelleri", ay: 2, ilerleme: 60, son: "Compose tamam" },
];

function DunyeviSayfasi() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      <header className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2 h-7 gap-1 text-xs text-muted-foreground">
          <Link to="/mizan"><ArrowLeft className="h-3 w-3" /> Mizan</Link>
        </Button>
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Dünyevi</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Hedefler</h1>
      </header>
      <div className="grid gap-3">
        {hedefler.map((h) => (
          <div key={h.ad} className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-[var(--dunyevi)]/40">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-medium">{h.ad}</h3>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3" /> {h.ay} ay hedefi
              </span>
            </div>
            <Progress value={h.ilerleme} className="h-1.5 bg-muted [&>div]:bg-[var(--dunyevi)]" />
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{h.son}</span>
              <span className="font-medium">{h.ilerleme}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}