import * as React from "react";
import { addDays, addMonths, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, startOfMonth, startOfWeek, subMonths } from "date-fns";
import { tr } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EtkinlikOlay } from "@/lib/takvim/tipler";

export function MiniTakvim({ ankara, setAnkara, olaylar }: { ankara: Date; setAnkara: (d: Date) => void; olaylar: EtkinlikOlay[] }) {
  const [m, setM] = React.useState(ankara);
  React.useEffect(() => setM(ankara), [ankara]);
  const ab = startOfMonth(m), ae = endOfMonth(m);
  const gb = startOfWeek(ab, { weekStartsOn: 1 });
  const ge = endOfWeek(ae, { weekStartsOn: 1 });
  const gunler: Date[] = [];
  for (let d = gb; d <= ge; d = addDays(d, 1)) gunler.push(d);
  const dolu = new Set(olaylar.map((o) => format(o.olayBaslangic, "yyyy-MM-dd")));
  return (
    <div className="text-xs">
      <div className="flex items-center justify-between pb-1">
        <button onClick={() => setM(subMonths(m, 1))}><ChevronLeft className="h-3 w-3" /></button>
        <span className="font-medium">{format(m, "MMMM yyyy", { locale: tr })}</span>
        <button onClick={() => setM(addMonths(m, 1))}><ChevronRight className="h-3 w-3" /></button>
      </div>
      <div className="grid grid-cols-7 text-[10px] text-muted-foreground">
        {["P","S","Ç","P","C","C","P"].map((g, i) => <div key={i} className="py-0.5 text-center">{g}</div>)}
      </div>
      <div className="grid grid-cols-7">
        {gunler.map((g) => {
          const buAy = isSameMonth(g, m);
          const aktif = isSameDay(g, ankara);
          const today = isSameDay(g, new Date());
          return (
            <button key={g.toISOString()} onClick={() => setAnkara(g)} className={cn("relative aspect-square rounded text-[11px]", !buAy && "text-muted-foreground/40", aktif && "bg-primary text-primary-foreground", !aktif && today && "font-bold text-primary", !aktif && "hover:bg-accent")}>
              {format(g, "d")}
              {dolu.has(format(g, "yyyy-MM-dd")) && !aktif && <span className="absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}