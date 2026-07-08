import * as React from "react";
import { cn } from "@/lib/utils";

export type BugunGorunum = "program" | "akis";

export function GorunumSegment({
  gorunum,
  onDegis,
  className,
}: {
  gorunum: BugunGorunum;
  onDegis: (g: BugunGorunum) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border border-border/60 bg-card/40 p-0.5 text-[11px]",
        className,
      )}
    >
      {(["program", "akis"] as const).map((g) => (
        <button
          key={g}
          type="button"
          onClick={() => onDegis(g)}
          className={
            "rounded-full px-2.5 py-0.5 font-medium transition-colors " +
            (gorunum === g
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:text-foreground")
          }
        >
          {g === "program" ? "Program" : "Akış"}
        </button>
      ))}
    </div>
  );
}