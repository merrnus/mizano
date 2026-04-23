import * as React from "react";
import { format, isSameDay } from "date-fns";
import { tr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { type EtkinlikOlay } from "@/lib/takvim-hooks";

const SAATLER = Array.from({ length: 18 }, (_, i) => i + 6);
const SAAT_PX = 64;

function dakika(d: Date): number {
  return d.getHours() * 60 + d.getMinutes();
}

type Props = {
  ankara: Date;
  olaylar: EtkinlikOlay[];
  onSlotClick: (saat: Date) => void;
  onOlayClick: (o: EtkinlikOlay) => void;
};

export function GunGorunumu({ ankara, olaylar, onSlotClick, onOlayClick }: Props) {
  const gunOlaylari = olaylar.filter((o) => isSameDay(o.olayBaslangic, ankara));

  return (
    <div className="flex flex-col rounded-xl border border-border bg-card">
      <div className="border-b border-border px-4 py-3">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">
          {format(ankara, "EEEE", { locale: tr })}
        </div>
        <div className="text-lg font-semibold">
          {format(ankara, "d MMMM yyyy", { locale: tr })}
        </div>
      </div>
      <div className="relative grid grid-cols-[3.5rem_minmax(0,1fr)]">
        <div className="flex flex-col">
          {SAATLER.map((s) => (
            <div
              key={s}
              className="flex justify-end pr-2 text-[11px] text-muted-foreground"
              style={{ height: SAAT_PX }}
            >
              <span className="-translate-y-1.5">{String(s).padStart(2, "0")}:00</span>
            </div>
          ))}
        </div>
        <div className="relative border-l border-border" style={{ height: SAATLER.length * SAAT_PX }}>
          {SAATLER.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                const slot = new Date(ankara);
                slot.setHours(s, 0, 0, 0);
                onSlotClick(slot);
              }}
              className="block w-full border-b border-border/60 hover:bg-accent/40"
              style={{ height: SAAT_PX }}
              aria-label={`${s}:00 yeni etkinlik`}
            />
          ))}
          {gunOlaylari.map((o, idx) => {
            const basDk = dakika(o.olayBaslangic);
            const bitDk = dakika(o.olayBitis);
            const top = ((basDk - SAATLER[0] * 60) / 60) * SAAT_PX;
            const yukseklik = Math.max(((bitDk - basDk) / 60) * SAAT_PX, 24);
            return (
              <button
                key={`${o.id}-${idx}`}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOlayClick(o);
                }}
                className="absolute left-2 right-2 overflow-hidden rounded-lg border-l-4 px-2.5 py-1.5 text-left text-xs leading-tight transition-colors hover:opacity-90"
                style={{
                  top,
                  height: yukseklik,
                  backgroundColor: `color-mix(in oklab, var(--${o.alan}) 18%, transparent)`,
                  borderLeftColor: `var(--${o.alan})`,
                }}
              >
                <div className="font-semibold text-foreground">{o.baslik}</div>
                <div className="text-[11px] text-muted-foreground">
                  {format(o.olayBaslangic, "HH:mm")} – {format(o.olayBitis, "HH:mm")}
                  {o.konum ? ` · ${o.konum}` : ""}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}