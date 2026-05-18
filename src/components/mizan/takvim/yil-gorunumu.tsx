import { addDays, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, startOfMonth, startOfWeek } from "date-fns";
import { tr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { EtkinlikOlay } from "@/lib/takvim/tipler";

export function YilGorunumu({ yil, olaylar, onAyClick }: { yil: number; olaylar: EtkinlikOlay[]; onAyClick: (d: Date) => void }) {
  const dolu = new Set(olaylar.map((o) => format(o.olayBaslangic, "yyyy-MM-dd")));
  const aylar = Array.from({ length: 12 }, (_, i) => new Date(yil, i, 1));
  return (
    <div className="grid h-full grid-cols-2 gap-3 overflow-y-auto p-4 sm:grid-cols-3 lg:grid-cols-4">
      {aylar.map((m) => {
        const ab = startOfMonth(m), ae = endOfMonth(m);
        const gb = startOfWeek(ab, { weekStartsOn: 1 });
        const ge = endOfWeek(ae, { weekStartsOn: 1 });
        const gunler: Date[] = [];
        for (let d = gb; d <= ge; d = addDays(d, 1)) gunler.push(d);
        return (
          <button key={m.toISOString()} onClick={() => onAyClick(m)} className="rounded-lg border border-border p-2 text-left transition-colors hover:bg-accent">
            <div className="mb-1 text-sm font-medium">{format(m, "MMMM", { locale: tr })}</div>
            <div className="grid grid-cols-7 text-[9px] text-muted-foreground">
              {["P","S","Ç","P","C","C","P"].map((g, i) => <div key={i} className="text-center">{g}</div>)}
            </div>
            <div className="grid grid-cols-7">
              {gunler.map((g) => {
                const buAy = isSameMonth(g, m);
                const today = isSameDay(g, new Date());
                return (
                  <div key={g.toISOString()} className={cn("relative aspect-square text-center text-[10px] leading-[1.6]", !buAy && "text-muted-foreground/30", today && "rounded-full bg-primary text-primary-foreground")}>
                    {format(g, "d")}
                    {buAy && dolu.has(format(g, "yyyy-MM-dd")) && !today && <span className="absolute bottom-0 left-1/2 h-0.5 w-0.5 -translate-x-1/2 rounded-full bg-primary" />}
                  </div>
                );
              })}
            </div>
          </button>
        );
      })}
    </div>
  );
}