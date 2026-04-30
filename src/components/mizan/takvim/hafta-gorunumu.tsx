import * as React from "react";
import { format, isSameDay, isWithinInterval, startOfDay } from "date-fns";
import { tr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { GUN_KISA, haftaBaslangici, haftaGunleri } from "@/lib/cetele-tarih";
import {
  type EtkinlikOlay,
} from "@/lib/takvim-hooks";

const SAATLER = Array.from({ length: 24 }, (_, i) => i); // 00..23
const SAAT_PX = 40; // her saat satırı yüksekliği

function dakika(d: Date): number {
  return d.getHours() * 60 + d.getMinutes();
}

type Props = {
  ankara: Date;
  olaylar: EtkinlikOlay[];
  onSlotClick: (saat: Date) => void;
  onOlayClick: (olay: EtkinlikOlay) => void;
  onOlayTasi?: (id: string, yeniBaslangic: Date) => void;
};

export function HaftaGorunumu({ ankara, olaylar, onSlotClick, onOlayClick, onOlayTasi }: Props) {
  const haftaBas = haftaBaslangici(ankara);
  const gunler = haftaGunleri(haftaBas);
  const bugun = startOfDay(new Date());
  const scrollRef = React.useRef<HTMLDivElement | null>(null);
  const [simdi, setSimdi] = React.useState<Date>(() => new Date());
  const [hover, setHover] = React.useState<string | null>(null);

  React.useEffect(() => {
    const t = setInterval(() => setSimdi(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  // Mount + ankara değiştiğinde gündüz saatine kaydır
  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const hedefSaat = isSameDay(ankara, bugun) ? new Date().getHours() : 7;
    el.scrollTop = Math.max(0, (hedefSaat - 1) * SAAT_PX);
  }, [ankara, bugun]);

  const haftaIcindeBugun = gunler.some((g) => isSameDay(g, simdi));
  const simdiTop = ((simdi.getHours() * 60 + simdi.getMinutes()) / 60) * SAAT_PX;

  return (
    <div className="flex flex-col rounded-xl border border-border bg-card">
      {/* Başlık satırı */}
      <div className="grid grid-cols-[3rem_repeat(7,minmax(0,1fr))] border-b border-border">
        <div />
        {gunler.map((g, i) => {
          const aktif = isSameDay(g, bugun);
          return (
            <div
              key={g.toISOString()}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 border-l border-border py-2 text-xs",
                aktif && "bg-primary/5",
              )}
            >
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {GUN_KISA[i]}
              </span>
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-sm font-medium",
                  aktif ? "bg-primary text-primary-foreground" : "text-foreground",
                )}
              >
                {format(g, "d")}
              </span>
            </div>
          );
        })}
      </div>

      {/* Saat ızgarası */}
      <div
        ref={scrollRef}
        className="relative grid max-h-[70vh] grid-cols-[3rem_repeat(7,minmax(0,1fr))] overflow-y-auto"
      >
        {/* Saat etiketleri */}
        <div className="flex flex-col">
          {SAATLER.map((s) => (
            <div
              key={s}
              className="flex justify-end pr-2 text-[10px] text-muted-foreground"
              style={{ height: SAAT_PX }}
            >
              <span className="-translate-y-1.5">{String(s).padStart(2, "0")}:00</span>
            </div>
          ))}
        </div>
        {gunler.map((g) => {
          const gunOlaylari = olaylar.filter((o) => isSameDay(o.olayBaslangic, g));
          const isToday = isSameDay(g, simdi);
          return (
            <div
              key={g.toISOString()}
              className="relative border-l border-border"
              style={{ height: SAATLER.length * SAAT_PX }}
            >
              {SAATLER.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    const slot = new Date(g);
                    slot.setHours(s, 0, 0, 0);
                    onSlotClick(slot);
                  }}
                  onDragOver={(e) => {
                    if (!onOlayTasi) return;
                    e.preventDefault();
                    setHover(`${g.toISOString()}-${s}`);
                  }}
                  onDragLeave={() => setHover(null)}
                  onDrop={(e) => {
                    if (!onOlayTasi) return;
                    e.preventDefault();
                    setHover(null);
                    const id = e.dataTransfer.getData("text/plain");
                    if (!id) return;
                    const yeni = new Date(g);
                    yeni.setHours(s, 0, 0, 0);
                    onOlayTasi(id, yeni);
                  }}
                  className={cn(
                    "block w-full border-b border-border/60 hover:bg-accent/40",
                    hover === `${g.toISOString()}-${s}` && "bg-primary/10",
                  )}
                  style={{ height: SAAT_PX }}
                  aria-label={`${format(g, "d MMM", { locale: tr })} ${s}:00 yeni etkinlik`}
                />
              ))}
              {isToday && haftaIcindeBugun && (
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
                const yukseklik = Math.max(
                  ((bitDk - basDk) / 60) * SAAT_PX,
                  18,
                );
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
                      "absolute left-1 right-1 overflow-hidden rounded-md border-l-2 px-1.5 py-1 text-left text-[11px] leading-tight transition-colors hover:opacity-90",
                      tasinabilir && "cursor-grab active:cursor-grabbing",
                    )}
                    style={{
                      top,
                      height: yukseklik,
                      backgroundColor: `color-mix(in oklab, var(--${o.alan}) 18%, transparent)`,
                      borderLeftColor: `var(--${o.alan})`,
                      color: "var(--foreground)",
                    }}
                  >
                    <div className="truncate font-medium">{o.baslik}</div>
                    {yukseklik > 28 && (
                      <div className="truncate text-[10px] text-muted-foreground">
                        {format(o.olayBaslangic, "HH:mm")}
                        {o.konum ? ` · ${o.konum}` : ""}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}