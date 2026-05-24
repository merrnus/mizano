import * as React from "react";
import { CalendarPlus, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  onEtkinlik: () => void;
};

/**
 * Material 3 speed-dial FAB. Mobilde alt-bar üstünde (bottom-20), masaüstünde
 * sağ-altta (bottom-6). Açıkken iki mini-FAB üste doğru yelpazelenir.
 */
export function BugunFab({ onEtkinlik }: Props) {
  const [acik, setAcik] = React.useState(false);

  // Esc → kapat
  React.useEffect(() => {
    if (!acik) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAcik(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [acik]);

  const sec = (fn: () => void) => {
    setAcik(false);
    // hafif gecikme → animasyon bitsin
    setTimeout(fn, 60);
  };

  return (
    <>
      {/* arka plan dim — açıkken dışarı tıkla kapatsın */}
      {acik && (
        <button
          type="button"
          aria-label="Kapat"
          onClick={() => setAcik(false)}
          className="fixed inset-0 z-30 bg-background/40 backdrop-blur-[2px] transition-opacity"
        />
      )}

      <div className="pointer-events-none fixed bottom-20 right-4 z-40 sm:bottom-6 sm:right-6">
        {/* mini-FAB'lar */}
        <div
          className={cn(
            "pointer-events-auto flex flex-col items-end gap-3 transition-all duration-200",
            acik
              ? "translate-y-0 opacity-100"
              : "pointer-events-none translate-y-2 opacity-0",
          )}
        >
          <MiniFab
            label="Etkinlik"
            ikon={<CalendarPlus className="h-4 w-4" />}
            onClick={() => sec(onEtkinlik)}
            renkVar="--mana"
            delay={0}
            acik={acik}
          />
        </div>

        {/* ana FAB */}
        <button
          type="button"
          aria-label={acik ? "Kapat" : "Hızlı ekle"}
          aria-expanded={acik}
          onClick={() => setAcik((v) => !v)}
          className={cn(
            "pointer-events-auto mt-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl",
            "bg-primary text-primary-foreground shadow-lg shadow-primary/25 ring-1 ring-primary/20",
            "transition-all duration-200 hover:shadow-xl hover:shadow-primary/30",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            acik && "rotate-45",
          )}
        >
          {acik ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
        </button>
      </div>
    </>
  );
}

function MiniFab({
  label,
  ikon,
  onClick,
  renkVar,
  delay,
  acik,
}: {
  label: string;
  ikon: React.ReactNode;
  onClick: () => void;
  renkVar: string;
  delay: number;
  acik: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 transition-all",
        acik ? "translate-x-0 opacity-100" : "translate-x-3 opacity-0",
      )}
      style={{ transitionDelay: `${delay}ms`, transitionDuration: "180ms" }}
    >
      <span className="hidden rounded-md border border-border bg-card px-2 py-1 text-[11px] font-medium shadow-sm sm:inline">
        {label}
      </span>
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        className={cn(
          "inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-card",
          "text-foreground shadow-md transition-transform hover:scale-110 active:scale-95",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        )}
        style={{ color: `var(${renkVar})` }}
      >
        {ikon}
      </button>
    </div>
  );
}