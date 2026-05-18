import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { rengiBul } from "@/lib/takvim/renkler";
import type { Etkinlik, EtkinlikOlay, Takvim } from "@/lib/takvim/tipler";

export function YaklasanListesi({ olaylar, takvimler, onClick }: { olaylar: EtkinlikOlay[]; takvimler: Takvim[]; onClick: (e: Etkinlik) => void }) {
  if (olaylar.length === 0) return null;
  return (
    <div className="space-y-1">
      <span className="text-xs font-semibold uppercase text-muted-foreground">Yaklaşan</span>
      {olaylar.map((o, i) => (
        <button key={o.id + i} onClick={() => onClick(o)} className="flex w-full items-center gap-2 rounded px-1 py-1 text-left text-xs hover:bg-accent">
          <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: rengiBul(o.renk ?? takvimler.find((t) => t.id === o.takvim_id)?.renk) }} />
          <div className="min-w-0 flex-1">
            <div className="truncate font-medium">{o.baslik}</div>
            <div className="text-muted-foreground">{format(o.olayBaslangic, "d MMM HH:mm", { locale: tr })}</div>
          </div>
        </button>
      ))}
    </div>
  );
}