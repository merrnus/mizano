import {
  addDays, endOfMonth, endOfWeek, format, getISOWeek, isSameDay,
  isSameMonth, startOfDay, startOfMonth, startOfWeek,
  max as dMax, min as dMin,
} from "date-fns";
import * as React from "react";
import { cn } from "@/lib/utils";
import { rengiBul } from "@/lib/takvim/renkler";
import { OlayMenu } from "./olay-menu";
import type { Etkinlik, EtkinlikOlay, Takvim } from "@/lib/takvim/tipler";

type AyProps = {
  ankara: Date; olaylar: EtkinlikOlay[]; takvimler: Takvim[];
  onGunClick: (d: Date) => void;
  onOlayClick: (o: EtkinlikOlay, ev: React.MouseEvent) => void;
  onOlayDuzenle: (e: Etkinlik) => void;
  onOlayCogalt: (e: Etkinlik) => void;
  onOlaySil: (e: Etkinlik) => void;
  onOlayRenk: (e: Etkinlik, r: string | null) => void;
};

export function AyGorunumu({ ankara, olaylar, takvimler, onGunClick, onOlayClick, onOlayDuzenle, onOlayCogalt, onOlaySil, onOlayRenk }: AyProps) {
  const ab = startOfMonth(ankara), ae = endOfMonth(ankara);
  const gb = startOfWeek(ab, { weekStartsOn: 1 });
  const ge = endOfWeek(ae, { weekStartsOn: 1 });
  const gunler: Date[] = [];
  for (let d = gb; d <= ge; d = addDays(d, 1)) gunler.push(d);
  const haftalar: Date[][] = [];
  for (let i = 0; i < gunler.length; i += 7) haftalar.push(gunler.slice(i, i + 7));
  const today = new Date();
  const MAX_SATIR = 3;

  function haftaSegmentleri(haftaBas: Date): Array<{ olay: EtkinlikOlay; baslaCol: number; bitCol: number; satir: number; soldevam: boolean; sagdevam: boolean }> {
    const haftaBit = addDays(haftaBas, 7);
    const ilgili = olaylar
      .filter((o) => o.olayBaslangic < haftaBit && o.olayBitis >= haftaBas)
      .map((o) => {
        const b = dMax([o.olayBaslangic, haftaBas]);
        const s = dMin([o.olayBitis, addDays(haftaBit, -1)]);
        const baslaCol = Math.floor((startOfDay(b).getTime() - haftaBas.getTime()) / 86400_000);
        const bitCol = Math.floor((startOfDay(s).getTime() - haftaBas.getTime()) / 86400_000);
        return {
          olay: o,
          baslaCol: Math.max(0, baslaCol),
          bitCol: Math.min(6, bitCol),
          soldevam: o.olayBaslangic < haftaBas,
          sagdevam: o.olayBitis >= haftaBit,
        };
      })
      .sort((a, b) =>
        (b.bitCol - b.baslaCol) - (a.bitCol - a.baslaCol) ||
        a.olay.olayBaslangic.getTime() - b.olay.olayBaslangic.getTime(),
      );

    const satirKullanim: boolean[][] = [];
    const res: Array<{ olay: EtkinlikOlay; baslaCol: number; bitCol: number; satir: number; soldevam: boolean; sagdevam: boolean }> = [];
    for (const it of ilgili) {
      let satir = 0;
      while (true) {
        if (!satirKullanim[satir]) satirKullanim[satir] = Array(7).fill(false);
        let ok = true;
        for (let c = it.baslaCol; c <= it.bitCol; c++) if (satirKullanim[satir][c]) { ok = false; break; }
        if (ok) {
          for (let c = it.baslaCol; c <= it.bitCol; c++) satirKullanim[satir][c] = true;
          res.push({ ...it, satir });
          break;
        }
        satir++;
      }
    }
    return res;
  }

  return (
    <div className="flex h-full flex-col">
      <div className="grid grid-cols-[2rem_repeat(7,1fr)] border-b border-border text-[11px] uppercase text-muted-foreground">
        <div />
        {["Pzt","Sal","Çar","Per","Cum","Cmt","Paz"].map((g) => <div key={g} className="py-1.5 text-center">{g}</div>)}
      </div>
      <div className="grid flex-1 grid-rows-6">
        {haftalar.map((hafta, hi) => {
          const segs = haftaSegmentleri(hafta[0]);
          const fazla: Record<number, number> = {};
          for (const s of segs) if (s.satir >= MAX_SATIR) for (let c = s.baslaCol; c <= s.bitCol; c++) fazla[c] = (fazla[c] ?? 0) + 1;
          return (
            <div key={hi} className="relative grid grid-cols-[2rem_repeat(7,1fr)] border-b border-border last:border-b-0">
              <div className="flex items-start justify-center pt-1 text-[10px] text-muted-foreground">H{getISOWeek(hafta[0])}</div>
              {hafta.map((g) => {
                const buAy = isSameMonth(g, ankara);
                const isToday = isSameDay(g, today);
                const haftaSonu = g.getDay() === 0 || g.getDay() === 6;
                const f = fazla[Math.floor((startOfDay(g).getTime() - hafta[0].getTime()) / 86400_000)] ?? 0;
                return (
                  <button key={g.toISOString()} onClick={() => onGunClick(g)} className={cn("flex flex-col gap-0.5 border-l border-border p-1 pt-1 text-left transition-colors hover:bg-accent/30", !buAy && "bg-muted/20 text-muted-foreground", haftaSonu && buAy && "bg-muted/10")}>
                    <span className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px]", isToday && "bg-primary text-primary-foreground font-medium")}>{format(g, "d")}</span>
                    <div style={{ height: `${MAX_SATIR * 18 + (f > 0 ? 14 : 0)}px` }} />
                    {f > 0 && <span className="absolute bottom-0.5 text-[10px] text-muted-foreground">+{f} daha</span>}
                  </button>
                );
              })}
              <div className="pointer-events-none absolute inset-x-0 top-6" style={{ left: "2rem" }}>
                {segs.filter((s) => s.satir < MAX_SATIR).map((s, i) => {
                  const renk = rengiBul(s.olay.renk ?? takvimler.find((t) => t.id === s.olay.takvim_id)?.renk);
                  const w = (s.bitCol - s.baslaCol + 1) / 7;
                  const left = (s.baslaCol / 7) * 100;
                  return (
                    <OlayMenu key={i} olay={s.olay} onDuzenle={onOlayDuzenle} onCogalt={onOlayCogalt} onSil={onOlaySil} onRenk={onOlayRenk}>
                      <button
                        onClick={(e) => { e.stopPropagation(); onOlayClick(s.olay, e); }}
                        className={cn(
                          "pointer-events-auto absolute mx-0.5 truncate px-1.5 py-0.5 text-left text-[10px] text-white",
                          s.soldevam ? "rounded-l-none" : "rounded-l",
                          s.sagdevam ? "rounded-r-none" : "rounded-r",
                        )}
                        style={{ left: `${left}%`, width: `calc(${w * 100}% - 4px)`, top: s.satir * 18, height: 16, background: renk }}
                      >
                        {!s.olay.tum_gun && !s.soldevam && <span className="mr-1 opacity-80">{format(s.olay.olayBaslangic, "HH:mm")}</span>}
                        {s.olay.baslik}
                      </button>
                    </OlayMenu>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}