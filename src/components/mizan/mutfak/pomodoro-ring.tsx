import * as React from "react";
import { Play, Pause, RotateCcw, Coffee, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Mod = "odak" | "mola";

const PRESETLER: { ad: string; odak: number; mola: number }[] = [
  { ad: "25/5", odak: 25, mola: 5 },
  { ad: "50/10", odak: 50, mola: 10 },
  { ad: "90/20", odak: 90, mola: 20 },
];

export function PomodoroRing() {
  const [preset, setPreset] = React.useState(0);
  const [mod, setMod] = React.useState<Mod>("odak");
  const sureMs = (mod === "odak" ? PRESETLER[preset].odak : PRESETLER[preset].mola) * 60;
  const [saniye, setSaniye] = React.useState(sureMs);
  const [calisiyor, setCalisiyor] = React.useState(false);
  const [tamamlananOdak, setTamamlananOdak] = React.useState(() => {
    if (typeof window === "undefined") return 0;
    const k = `mutfak-pomodoro-${new Date().toDateString()}`;
    return Number(localStorage.getItem(k) ?? 0);
  });

  React.useEffect(() => {
    setSaniye(sureMs);
    setCalisiyor(false);
  }, [preset, mod, sureMs]);

  React.useEffect(() => {
    if (!calisiyor) return;
    const t = setInterval(() => {
      setSaniye((s) => {
        if (s <= 1) {
          setCalisiyor(false);
          if (mod === "odak") {
            const k = `mutfak-pomodoro-${new Date().toDateString()}`;
            const yeni = tamamlananOdak + 1;
            setTamamlananOdak(yeni);
            if (typeof window !== "undefined") {
              localStorage.setItem(k, String(yeni));
              if ("Notification" in window && Notification.permission === "granted") {
                new Notification("Odak tamamlandı 🎯", { body: "Mola zamanı." });
              }
            }
            setMod("mola");
          } else {
            setMod("odak");
          }
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [calisiyor, mod, tamamlananOdak]);

  const dk = Math.floor(saniye / 60).toString().padStart(2, "0");
  const sn = (saniye % 60).toString().padStart(2, "0");
  const ilerleme = 1 - saniye / sureMs;

  const r = 96;
  const cevre = 2 * Math.PI * r;
  const offset = cevre * (1 - ilerleme);

  const renk = mod === "odak" ? "stroke-primary" : "stroke-emerald-500";

  return (
    <div className="mx-auto flex max-w-md flex-col items-center rounded-3xl border border-border/60 bg-card p-8 shadow-sm">
      <div className="mb-3 flex gap-1.5">
        <button
          onClick={() => setMod("odak")}
          className={cn(
            "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors",
            mod === "odak"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:text-foreground",
          )}
        >
          <Brain className="h-3 w-3" /> Odak
        </button>
        <button
          onClick={() => setMod("mola")}
          className={cn(
            "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors",
            mod === "mola"
              ? "bg-emerald-500 text-white"
              : "bg-muted text-muted-foreground hover:text-foreground",
          )}
        >
          <Coffee className="h-3 w-3" /> Mola
        </button>
      </div>

      <div className="relative my-4">
        <svg width="220" height="220" viewBox="0 0 220 220" className="-rotate-90">
          <circle
            cx="110"
            cy="110"
            r={r}
            fill="none"
            strokeWidth="10"
            className="stroke-muted"
          />
          <circle
            cx="110"
            cy="110"
            r={r}
            fill="none"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={cevre}
            strokeDashoffset={offset}
            className={cn(renk, "transition-all duration-1000 ease-linear")}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="font-mono text-5xl font-light tabular-nums tracking-wider text-foreground">
            {dk}:{sn}
          </div>
          <div className="mt-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            {mod === "odak" ? "Odaklan" : "Dinlen"}
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          size="lg"
          onClick={() => {
            if (
              typeof window !== "undefined" &&
              "Notification" in window &&
              Notification.permission === "default"
            ) {
              Notification.requestPermission();
            }
            setCalisiyor((c) => !c);
          }}
          className="min-w-28"
        >
          {calisiyor ? (
            <><Pause className="mr-1.5 h-4 w-4" /> Duraklat</>
          ) : (
            <><Play className="mr-1.5 h-4 w-4" /> Başlat</>
          )}
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={() => {
            setCalisiyor(false);
            setSaniye(sureMs);
          }}
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      <div className="mt-5 flex gap-1.5">
        {PRESETLER.map((p, i) => (
          <button
            key={p.ad}
            onClick={() => setPreset(i)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs transition-colors",
              preset === i
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {p.ad} dk
          </button>
        ))}
      </div>

      <div className="mt-5 flex items-center gap-2 rounded-full bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground">
        <span className="text-primary font-semibold">{tamamlananOdak}</span>
        bugünkü odak seansı tamamlandı
      </div>
    </div>
  );
}
