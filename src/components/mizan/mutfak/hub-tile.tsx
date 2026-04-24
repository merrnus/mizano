import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  to: string;
  icon: LucideIcon;
  ad: string;
  ozet: string;
  sayac?: string;
  gradient: string;
};

export function HubTile({ to, icon: Icon, ad, ozet, sayac, gradient }: Props) {
  return (
    <Link
      to={to}
      className={cn(
        "group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/60 bg-card p-5 shadow-sm transition-all hover:shadow-lg hover:-translate-y-0.5",
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full opacity-30 blur-2xl transition-opacity group-hover:opacity-60",
          gradient,
        )}
      />
      <div className="relative flex items-start justify-between">
        <div
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-sm",
            gradient,
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        {sayac && (
          <span className="rounded-full bg-muted/70 px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            {sayac}
          </span>
        )}
      </div>
      <div className="relative mt-6">
        <h3 className="text-lg font-semibold tracking-tight text-foreground">
          {ad}
        </h3>
        <p className="mt-0.5 text-xs text-muted-foreground">{ozet}</p>
      </div>
    </Link>
  );
}
