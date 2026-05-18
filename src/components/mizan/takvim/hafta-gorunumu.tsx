import * as React from "react";
import { format, isSameDay } from "date-fns";
import { tr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { rengiBul } from "@/lib/takvim/renkler";
import { OlayMenu } from "./olay-menu";
import { GunSutun, SAAT_PX } from "./gun-sutun";
import type { Etkinlik, EtkinlikOlay, Takvim } from "@/lib/takvim/tipler";

type HaftaProps = {
  gunler: Date[]; olaylar: EtkinlikOlay[]; takvimler: Takvim[];
  onAralikSec: (b: Date, bi: Date) => void;
  onOlayClick: (o: EtkinlikOlay, ev: React.MouseEvent) => void;
  onOlayDuzenle: (e: Etkinlik) => void;
  onOlayCogalt: (e: Etkinlik) => void;
  onOlaySil: (e: Etkinlik) => void;
  onOlayRenk: (e: Etkinlik, r: string | null) => void;
  onMove: (o: EtkinlikOlay, yeniBas: Date) => void;
  onResize: (o: EtkinlikOlay, yeniBitis: Date) => void;
};

export function HaftaGorunumu({ gunler, olaylar, takvimler, onAralikSec, onOlayClick, onOlayDuzenle, onOlayCogalt, onOlaySil, onOlayRenk, onMove, onResize }: HaftaProps) {
  const today = new Date();
  const [now, setNow] = React.useState(new Date());
  React.useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);
  const tumGunler = olaylar.filter((o) => o.tum_gun);
  const saatLi = olaylar.filter((o) => !o.tum_gun);

  const scrollRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (scrollRef.current) {
      const top = Math.max(0, ((now.getHours() - 1) * SAAT_PX));
      scrollRef.current.scrollTop = top;
    }
    // eslint-disable-next-line
  }, []);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border">
        <div className="grid" style={{ gridTemplateColumns: `3rem repeat(${gunler.length}, 1fr)` }}>
          <div />
          {gunler.map((g) => {
            const isToday = isSameDay(g, today);
            return (
              <div key={g.toISOString()} className="border-l border-border p-1.5 text-center">
                <div className="text-[10px] uppercase text-muted-foreground">{format(g, "EEE", { locale: tr })}</div>
                <div className={cn("mx-auto mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-sm", isToday && "bg-primary text-primary-foreground font-medium")}>{format(g, "d")}</div>
              </div>
            );
          })}
        </div>
        {tumGunler.length > 0 && (
          <div className="grid border-t border-border" style={{ gridTemplateColumns: `3rem repeat(${gunler.length}, 1fr)`, minHeight: "2rem" }}>
            <div className="border-r border-border py-1 pr-1 text-right text-[10px] text-muted-foreground">tüm gün</div>
            {gunler.map((g) => {
              const ogun = tumGunler.filter((o) => isSameDay(o.olayBaslangic, g));
              return (
                <div key={g.toISOString()} className="border-l border-border p-0.5">
                  {ogun.map((o, i) => (
                    <OlayMenu key={o.id + i} olay={o} onDuzenle={onOlayDuzenle} onCogalt={onOlayCogalt} onSil={onOlaySil} onRenk={onOlayRenk}>
                      <button onClick={(e) => onOlayClick(o, e)} className="mb-0.5 block w-full truncate rounded px-1 py-0.5 text-left text-[10px] text-white" style={{ background: rengiBul(o.renk ?? takvimler.find((t) => t.id === o.takvim_id)?.renk) }}>
                        {o.baslik}
                      </button>
                    </OlayMenu>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto"
        onDragOver={(e) => {
          const el = scrollRef.current;
          if (!el) return;
          const r = el.getBoundingClientRect();
          const esik = 60;
          if (e.clientY < r.top + esik) el.scrollTop -= 12;
          else if (e.clientY > r.bottom - esik) el.scrollTop += 12;
        }}
      >
        <div className="relative grid pb-24" style={{ gridTemplateColumns: `3rem repeat(${gunler.length}, 1fr)` }}>
          <div>
            {Array.from({ length: 24 }, (_, h) => (
              <div key={h} style={{ height: SAAT_PX }} className="border-b border-border pr-1 text-right text-[10px] text-muted-foreground">
                {`${String(h).padStart(2, "0")}:00`}
              </div>
            ))}
          </div>
          {gunler.map((g) => (
            <GunSutun
              key={g.toISOString()} gun={g}
              olaylar={saatLi.filter((o) => isSameDay(o.olayBaslangic, g))}
              takvimler={takvimler} now={now}
              isToday={isSameDay(g, today)}
              onAralikSec={onAralikSec}
              onOlayClick={onOlayClick}
              onOlayDuzenle={onOlayDuzenle}
              onOlayCogalt={onOlayCogalt}
              onOlaySil={onOlaySil}
              onOlayRenk={onOlayRenk}
              onMove={onMove}
              onResize={onResize}
            />
          ))}
        </div>
      </div>
    </div>
  );
}