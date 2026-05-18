import * as React from "react";
import { Edit, Copy, Trash2, Palette } from "lucide-react";
import {
  ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem,
  ContextMenuSeparator, ContextMenuSub, ContextMenuSubTrigger, ContextMenuSubContent,
} from "@/components/ui/context-menu";
import { TAKVIM_RENKLERI } from "@/lib/takvim/renkler";
import type { Etkinlik, EtkinlikOlay } from "@/lib/takvim/tipler";

/** Etkinlik üzerinde ortak sağ-tık (mobilde uzun-basma) menüsü. */
export function OlayMenu({ olay, onDuzenle, onCogalt, onSil, onRenk, children }: {
  olay: EtkinlikOlay;
  onDuzenle: (e: Etkinlik) => void;
  onCogalt: (e: Etkinlik) => void;
  onSil: (e: Etkinlik) => void;
  onRenk: (e: Etkinlik, r: string | null) => void;
  children: React.ReactNode;
}) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem onClick={() => onDuzenle(olay)}><Edit className="mr-2 h-4 w-4" />Düzenle</ContextMenuItem>
        <ContextMenuItem onClick={() => onCogalt(olay)}><Copy className="mr-2 h-4 w-4" />Çoğalt</ContextMenuItem>
        <ContextMenuSub>
          <ContextMenuSubTrigger><Palette className="mr-2 h-4 w-4" />Renk</ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuItem onClick={() => onRenk(olay, null)}>
              <span className="mr-2 h-3 w-3 rounded-full border border-border" />
              Varsayılan
            </ContextMenuItem>
            {TAKVIM_RENKLERI.map((r) => (
              <ContextMenuItem key={r.id} onClick={() => onRenk(olay, r.id)}>
                <span className="mr-2 h-3 w-3 rounded-full" style={{ background: r.oklch }} />
                {r.ad}
              </ContextMenuItem>
            ))}
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={() => onSil(olay)} className="text-destructive focus:text-destructive">
          <Trash2 className="mr-2 h-4 w-4" />Sil
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}