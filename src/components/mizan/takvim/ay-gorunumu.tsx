import * as React from "react";
import {
  addDays,
  endOfMonth,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { cn } from "@/lib/utils";
import { type EtkinlikOlay } from "@/lib/takvim-hooks";

const GUN_KISA = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

type Props = {
  ankara: Date;
  olaylar: EtkinlikOlay[];
  onGunClick: (gun: Date) => void;
  onOlayClick: (o: EtkinlikOlay) => void;
};

export function AyGorunumu({ ankara, olaylar, onGunClick, onOlayClick }: Props) {
  const ayBas = startOfMonth(ankara);
  const ayBit = endOfMonth(ankara);
  const gridBas = startOfWeek(ayBas, { weekStartsOn: 1 });
  const bugun = new Date();

  // 6 hafta x 7 gün = 42 hücre
  const hucreler = Array.from({ length: 42 }, (_, i) => addDays(gridBas, i));

  return (
    <div className="flex flex-col rounded-xl border border-border bg-card">
      <div className="grid grid-cols-7 border-b border-border">
        {GUN_KISA.map((g) => (
          <div
            key={g}
            className="border-l border-border py-2 text-center text-[10px] uppercase tracking-wider text-muted-foreground first:border-l-0"
          >
            {g}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 grid-rows-6">
        {hucreler.map((g, i) => {
          const buAy = isSameMonth(g, ankara);
          const aktif = isSameDay(g, bugun);
          const gunOlaylari = olaylar.filter((o) => isSameDay(o.olayBaslangic, g));
          return (
            <button
              type="button"
              key={i}
              onClick={() => onGunClick(g)}
              className={cn(
                "flex min-h-[5.5rem] flex-col gap-1 border-b border-l border-border p-1.5 text-left transition-colors hover:bg-accent/30",
                !buAy && "bg-muted/20 text-muted-foreground",
                i % 7 === 0 && "border-l-0",
              )}
            >
              <span
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-medium",
                  aktif && "bg-primary text-primary-foreground",
                )}
              >
                {format(g, "d")}
              </span>
              <div className="flex flex-col gap-0.5">
                {gunOlaylari.slice(0, 3).map((o, idx) => (
                  <span
                    key={`${o.id}-${idx}`}
                    role="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOlayClick(o);
                    }}
                    className="truncate rounded border-l-2 bg-muted/40 px-1 py-0.5 text-[10px] leading-tight"
                    style={{
                      borderLeftColor: `var(--${o.alan})`,
                      backgroundColor: `color-mix(in oklab, var(--${o.alan}) 12%, transparent)`,
                    }}
                  >
                    {!o.tum_gun && (
                      <span className="mr-1 text-muted-foreground">
                        {format(o.olayBaslangic, "HH:mm")}
                      </span>
                    )}
                    {o.baslik}
                  </span>
                ))}
                {gunOlaylari.length > 3 && (
                  <span className="text-[10px] text-muted-foreground">
                    +{gunOlaylari.length - 3} daha
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}