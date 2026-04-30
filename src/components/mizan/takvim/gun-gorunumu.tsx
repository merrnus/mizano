import * as React from "react";
import { format, isSameDay } from "date-fns";
import { tr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { type EtkinlikOlay } from "@/lib/takvim-hooks";

const SAATLER = Array.from({ length: 24 }, (_, i) => i);
const SAAT_PX = 56;

function dakika(d: Date): number {
  return d.getHours() * 60 + d.getMinutes();
}

type Props = {
  ankara: Date;
  olaylar: EtkinlikOlay[];
  onSlotClick: (saat: Date) => void;
  onOlayClick: (o: EtkinlikOlay) => void;
  onOlayTasi?: (id: string, yeniBaslangic: Date) => void;
};

export function GunGorunumu({ ankara, olaylar, onSlotClick, onOlayClick, onOlayTasi }: Props) {
  const gunOlaylari = olaylar.filter((o) => isSameDay(o.olayBaslangic, ankara));
  const scrollRef = React.useRef<HTMLDivElement | null>(null);
  const [simdi, setSimdi] = React.useState<Date>(() => new Date());
  const [hoverSaat, setHoverSaat] = React.useState<number | null>(null);

  React.useEffect(() => {
    const t = setInterval(() => setSimdi(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const hedef = isSameDay(ankara, new Date()) ? new Date().getHours() : 7;
    el.scrollTop = Math.max(0, (hedef - 1) * SAAT_PX);
  }, [ankara]);

  const bugun = isSameDay(ankara, simdi);
  const simdiTop = ((simdi.getHours() * 60 + simdi.getMinutes()) / 60) * SAAT_PX;

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
      <div
        ref={scrollRef}
        className="relative grid max-h-[70vh] grid-cols-[3.5rem_minmax(0,1fr)] overflow-y-auto"
      >
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
              onDragOver={(e) => {
                if (!onOlayTasi) return;
                e.preventDefault();
                setHoverSaat(s);
              }}
              onDragLeave={() => setHoverSaat(null)}
              onDrop={(e) => {
                if (!onOlayTasi) return;
                e.preventDefault();
                setHoverSaat(null);
                const id = e.dataTransfer.getData("text/plain");
                if (!id) return;
                const yeni = new Date(ankara);
                yeni.setHours(s, 0, 0, 0);
                onOlayTasi(id, yeni);
              }}
              className={cn(
                "block w-full border-b border-border/60 hover:bg-accent/40",
                hoverSaat === s && "bg-primary/10",
              )}
              style={{ height: SAAT_PX }}
              aria-label={`${s}:00 yeni etkinlik`}
            />
          ))}
          {bugun && (
            <div
              className="pointer-events-none absolute left-0 right-0 z-10 flex items-center"
              style={{ top: simdiTop }}
            >
              <span className="-ml-1 h-2 w-2 rounded-full bg-destructive" />
              <span className="h-px flex-1 bg-destructive" />
            </div>
          )}
          {gunOlaylari.map((o, idx) => {
            const basDk = dakika(o.olayBaslangic);
            const bitDk = dakika(o.olayBitis);
            const top = ((basDk - SAATLER[0] * 60) / 60) * SAAT_PX;
            const yukseklik = Math.max(((bitDk - basDk) / 60) * SAAT_PX, 24);
            const tasinabilir =
              !!onOlayTasi &&
              !o.id.startsWith("ilim:") &&
              !o.id.startsWith("amel:") &&
              (o.tekrar ?? "yok") === "yok";
            return (
              <button
                key={`${o.id}-${idx}`}
                type="button"
                draggable={tasinabilir}
                onDragStart={(e) => {
                  if (!tasinabilir) return;
                  e.dataTransfer.setData("text/plain", o.id);
                  e.dataTransfer.effectAllowed = "move";
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onOlayClick(o);
                }}
                className={cn(
                  "absolute left-2 right-2 overflow-hidden rounded-lg border-l-4 px-2.5 py-1.5 text-left text-xs leading-tight transition-colors hover:opacity-90",
                  tasinabilir && "cursor-grab active:cursor-grabbing",
                )}
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