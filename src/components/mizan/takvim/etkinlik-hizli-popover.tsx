import * as React from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Popover, PopoverContent, PopoverAnchor } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Edit, Copy, Trash2, MapPin, Calendar as CalIcon, ExternalLink } from "lucide-react";
import { rengiBul } from "@/lib/takvim/renkler";
import type { Etkinlik, EtkinlikOlay, Takvim } from "@/lib/takvim/tipler";

type Props = {
  hizli: { olay: EtkinlikOlay; rect: { x: number; y: number; width: number; height: number } } | null;
  onOpenChange: (open: boolean) => void;
  takvimler: Takvim[];
  onDuzenle: (e: Etkinlik) => void;
  onCogalt: (e: Etkinlik) => void;
  onSil: (e: Etkinlik) => void;
};

export function EtkinlikHizliPopover({ hizli, onOpenChange, takvimler, onDuzenle, onCogalt, onSil }: Props) {
  const olay = hizli?.olay;
  const rect = hizli?.rect;
  const takvim = olay ? takvimler.find((t) => t.id === olay.takvim_id) : undefined;
  const renk = olay ? rengiBul(olay.renk ?? takvim?.renk) : undefined;

  return (
    <Popover open={!!hizli} onOpenChange={onOpenChange}>
      {rect && (
        <PopoverAnchor asChild>
          <div
            style={{
              position: "fixed",
              left: rect.x,
              top: rect.y,
              width: rect.width,
              height: rect.height,
              pointerEvents: "none",
            }}
          />
        </PopoverAnchor>
      )}
      <PopoverContent className="w-80 p-0" align="start" side="right" sideOffset={8} collisionPadding={12}>
        {olay && (
          <div className="flex flex-col">
            <div className="flex items-start gap-2 border-b border-border p-3">
              <span className="mt-1.5 h-3 w-3 shrink-0 rounded-sm" style={{ background: renk }} />
              <div className="min-w-0 flex-1">
                <div className="text-base font-medium leading-tight">{olay.baslik}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {olay.tum_gun ? (
                    <>{format(olay.olayBaslangic, "d MMMM yyyy", { locale: tr })} · Tüm gün</>
                  ) : (
                    <>
                      {format(olay.olayBaslangic, "EEEE, d MMMM", { locale: tr })}
                      <br />
                      {format(olay.olayBaslangic, "HH:mm")} – {format(olay.olayBitis, "HH:mm")}
                    </>
                  )}
                </div>
              </div>
            </div>
            {(olay.konum || olay.aciklama || takvim) && (
              <div className="space-y-2 px-3 py-2 text-sm">
                {olay.konum && (
                  <div className="flex items-start gap-2 text-muted-foreground">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span className="break-words">{olay.konum}</span>
                  </div>
                )}
                {olay.aciklama && (
                  <div className="line-clamp-3 whitespace-pre-wrap text-foreground/80">{olay.aciklama}</div>
                )}
                {takvim && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CalIcon className="h-3.5 w-3.5" />
                    <span className="h-2 w-2 rounded-full" style={{ background: rengiBul(takvim.renk) }} />
                    {takvim.ad}
                  </div>
                )}
              </div>
            )}
            <div className="flex items-center justify-between gap-1 border-t border-border p-2">
              <div className="flex gap-0.5">
                <Button variant="ghost" size="icon" className="h-8 w-8" title="Çoğalt" onClick={() => onCogalt(olay)}>
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" title="Sil" onClick={() => onSil(olay)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
              <Button size="sm" variant="outline" onClick={() => onDuzenle(olay)}>
                <ExternalLink className="mr-1 h-3.5 w-3.5" />
                Daha fazla seçenek
              </Button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}