import * as React from "react";
import { cn } from "@/lib/utils";
import type { CeteleAlan } from "@/lib/cetele-tipleri";

type RingItem = {
  alan: CeteleAlan;
  ad: string;
  yuzde: number;
  metin: string;
  renkVar: string;
};

type Props = {
  ogeler: RingItem[];
  onAc: (alan: CeteleAlan) => void;
  className?: string;
};

/**
 * Material 3 "at-a-glance" — 3 mini halka (mana/ilim/amel).
 * Header'da pill yerine bunlar durur; tıkla → AlanDetaySheet.
 */
export function BriefRings({ ogeler, onAc, className }: Props) {
  return (
    <div
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 sm:gap-2",
        className,
      )}
    >
      {ogeler.map((o) => (
        <Ring key={o.alan} o={o} onClick={() => onAc(o.alan)} />
      ))}
    </div>
  );
}

function Ring({ o, onClick }: { o: RingItem; onClick: () => void }) {
  const renk = `var(${o.renkVar})`;
  const yuzde = Math.max(0, Math.min(100, o.yuzde));
  const tam = yuzde >= 100;
  const r = 16;
  const c = 2 * Math.PI * r;
  const dash = (yuzde / 100) * c;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${o.ad} ${o.metin}`}
      className={cn(
        "group inline-flex flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-1.5",
        "transition-all hover:bg-accent/40 active:scale-95",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
      )}
    >
      <span className="relative inline-flex h-9 w-9 items-center justify-center">
        <svg viewBox="0 0 40 40" className="h-9 w-9 -rotate-90">
          {/* track */}
          <circle
            cx="20"
            cy="20"
            r={r}
            fill="none"
            strokeWidth="3"
            stroke="color-mix(in oklab, var(--foreground) 10%, transparent)"
          />
          {/* progress */}
          <circle
            cx="20"
            cy="20"
            r={r}
            fill="none"
            strokeWidth="3"
            stroke={renk}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${c}`}
            style={{
              filter: tam ? `drop-shadow(0 0 4px ${renk})` : undefined,
              transition: "stroke-dasharray 320ms ease-out",
            }}
          />
        </svg>
        <span
          className="absolute inset-0 inline-flex items-center justify-center text-[10px] font-semibold tabular-nums"
          style={{ color: renk }}
        >
          {o.metin.replace("%", "")}
        </span>
      </span>
      <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground group-hover:text-foreground">
        {o.ad}
      </span>
    </button>
  );
}