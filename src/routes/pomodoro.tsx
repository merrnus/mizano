import { createFileRoute } from "@tanstack/react-router";
import { SayfaBasligi } from "@/components/mizan/sayfa-basligi";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/pomodoro")({
  head: () => ({
    meta: [
      { title: "Pomodoro — Mizan" },
      { name: "description", content: "Tam ekran pomodoro ve günlük seans sayacı." },
      { property: "og:title", content: "Pomodoro — Mizan" },
      { property: "og:description", content: "Odaklan: 25/5 dakikalık seanslar." },
    ],
  }),
  component: PomodoroPage,
});

function PomodoroPage() {
  return (
    <div>
      <SayfaBasligi baslik="Pomodoro" aciklama="25 dakika odak, 5 dakika mola." />
      <div className="flex flex-col items-center justify-center px-6 py-16">
        <div className="rounded-full border border-border bg-card px-12 py-10 text-center">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Odak</p>
          <div className="mt-4 font-mono text-7xl tracking-wider text-foreground">25:00</div>
          <div className="mt-6 flex justify-center gap-2">
            <Button>Başlat</Button>
            <Button variant="outline">Sıfırla</Button>
          </div>
        </div>
        <p className="mt-6 text-xs text-muted-foreground">Bugün tamamlanan seans: 3</p>
      </div>
    </div>
  );
}