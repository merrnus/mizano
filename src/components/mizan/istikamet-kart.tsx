import * as React from "react";
import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";

type Props = {
  ad: string;
  yuzde: number;
  ikon: LucideIcon;
  renkVar: string; // "--mana" | "--ilim" | "--amel"
  to: "/mizan/mana" | "/mizan/ilim" | "/mizan/amel";
  rozet?: React.ReactNode;
};

/**
 * Glow-stilli alan kartı: ikon + isim + büyük yüzde + neon ilerleme barı.
 * Üstte opsiyonel rozet (ÖNDESİN / EL VER / DENGEDE).
 */
export function IstikametKart({ ad, yuzde, ikon: Ikon, renkVar, to, rozet }: Props) {
  const renk = `var(${renkVar})`;
  const yumusakBg = `color-mix(in oklab, ${renk} 14%, transparent)`;
  const dolgu = Math.max(0, Math.min(100, yuzde));

  return (
    <div className="relative">
      {rozet ? (
        <div className="absolute -top-3 left-1/2 z-10 -translate-x-1/2">{rozet}</div>
      ) : null}
      <Link
        to={to}
        className="group relative flex flex-col items-center gap-5 overflow-hidden rounded-2xl border border-border bg-card px-5 py-7 transition-all hover:border-[color:var(--border)]"
        style={{
          // hafif iç parıltı
          boxShadow: `inset 0 1px 0 0 color-mix(in oklab, ${renk} 8%, transparent)`,
        }}
      >
        {/* arka plan glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-16 h-32 opacity-60 transition-opacity group-hover:opacity-100"
          style={{
            background: `radial-gradient(60% 100% at 50% 100%, ${yumusakBg} 0%, transparent 70%)`,
          }}
        />

        {/* ikon */}
        <div
          className="relative flex h-14 w-14 items-center justify-center rounded-2xl"
          style={{
            backgroundColor: yumusakBg,
            color: renk,
            boxShadow: `0 0 24px -4px ${renk}, inset 0 0 0 1px color-mix(in oklab, ${renk} 30%, transparent)`,
          }}
        >
          <Ikon className="h-6 w-6" style={{ filter: `drop-shadow(0 0 6px ${renk})` }} />
        </div>

        {/* isim + yüzde */}
        <div className="flex flex-col items-center gap-1">
          <div className="text-sm font-medium tracking-wide text-muted-foreground">{ad}</div>
          <div
            className="text-4xl font-semibold tracking-tight"
            style={{ color: renk, textShadow: `0 0 18px color-mix(in oklab, ${renk} 35%, transparent)` }}
          >
            {Math.round(yuzde)}%
          </div>
        </div>

        {/* neon bar */}
        <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted/40">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${dolgu}%`,
              background: `linear-gradient(90deg, color-mix(in oklab, ${renk} 60%, transparent), ${renk})`,
              boxShadow: `0 0 12px ${renk}`,
            }}
          />
        </div>
      </Link>
    </div>
  );
}