import * as React from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { yerlestir } from "@/lib/takvim/cakisma";
import { rengiBul } from "@/lib/takvim/renkler";
import { OlayMenu } from "./olay-menu";
import type { Etkinlik, EtkinlikOlay, Takvim } from "@/lib/takvim/tipler";

export const SAAT_PX = 48;

export function pxToDk(y: number) {
  return Math.max(0, Math.min(24 * 60 - 15, Math.floor(y / SAAT_PX * 60 / 15) * 15));
}

export function GunSutun({ gun, olaylar, takvimler, now, isToday, onAralikSec, onOlayClick, onOlayDuzenle, onOlayCogalt, onOlaySil, onOlayRenk, onMove, onResize }: {
  gun: Date; olaylar: EtkinlikOlay[]; takvimler: Takvim[]; now: Date; isToday: boolean;
  onAralikSec: (b: Date, bi: Date) => void;
  onOlayClick: (o: EtkinlikOlay, ev: React.MouseEvent) => void;
  onOlayDuzenle: (e: Etkinlik) => void;
  onOlayCogalt: (e: Etkinlik) => void;
  onOlaySil: (e: Etkinlik) => void;
  onOlayRenk: (e: Etkinlik, r: string | null) => void;
  onMove: (o: EtkinlikOlay, yeniBas: Date) => void;
  onResize: (o: EtkinlikOlay, yeniBitis: Date) => void;
}) {
  const yerlesimler = yerlestir(olaylar);
  const ref = React.useRef<HTMLDivElement>(null);
  const [secim, setSecim] = React.useState<{ basDk: number; bitDk: number } | null>(null);
  const secimRef = React.useRef<{ basDk: number; startY: number } | null>(null);
  const [hayalet, setHayalet] = React.useState<{ basDk: number; sureDk: number; baslik: string; renk: string } | null>(null);

  const localY = (clientY: number) => {
    if (!ref.current) return 0;
    return clientY - ref.current.getBoundingClientRect().top;
  };

  const slotBasla = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("[data-olay]")) return;
    e.preventDefault();
    const y = localY(e.clientY);
    const basDk = pxToDk(y);
    secimRef.current = { basDk, startY: y };
    setSecim({ basDk, bitDk: basDk + 60 });
    const hareket = (ev: MouseEvent) => {
      if (!secimRef.current) return;
      const ny = localY(ev.clientY);
      const dk = pxToDk(ny);
      const a = Math.min(secimRef.current.basDk, dk);
      const b = Math.max(secimRef.current.basDk, dk) + 15;
      setSecim({ basDk: a, bitDk: b });
    };
    const bitir = () => {
      window.removeEventListener("mousemove", hareket);
      window.removeEventListener("mouseup", bitir);
      const s = secim ?? (secimRef.current ? { basDk: secimRef.current.basDk, bitDk: secimRef.current.basDk + 60 } : null);
      secimRef.current = null;
      setSecim(null);
      if (!s) return;
      const b = new Date(gun); b.setHours(0, 0, 0, 0); b.setMinutes(s.basDk);
      const bi = new Date(gun); bi.setHours(0, 0, 0, 0); bi.setMinutes(s.bitDk);
      onAralikSec(b, bi);
    };
    window.addEventListener("mousemove", hareket);
    window.addEventListener("mouseup", bitir);
  };

  const dragHandle = (o: EtkinlikOlay) => (e: React.DragEvent) => {
    const yuk = {
      ...o,
      olayBaslangic: o.olayBaslangic.toISOString(),
      olayBitis: o.olayBitis.toISOString(),
    };
    e.dataTransfer.setData("application/json", JSON.stringify(yuk));
    e.dataTransfer.setData("text/plain", o.id);
    e.dataTransfer.effectAllowed = "move";
    try {
      const img = new Image();
      img.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
      e.dataTransfer.setDragImage(img, 0, 0);
    } catch {}
  };
  const dragOver = (e: React.DragEvent) => {
    e.preventDefault();
    const json = e.dataTransfer.types.includes("application/json")
      ? e.dataTransfer.getData("application/json")
      : "";
    let veri: any = null;
    if (json) { try { veri = JSON.parse(json); } catch {} }
    const dk = pxToDk(localY(e.clientY));
    if (veri && veri.olayBaslangic && veri.olayBitis) {
      const sureDk = Math.max(15, Math.round((new Date(veri.olayBitis).getTime() - new Date(veri.olayBaslangic).getTime()) / 60_000));
      const renk = rengiBul(veri.renk ?? takvimler.find((t) => t.id === veri.takvim_id)?.renk);
      setHayalet({ basDk: dk, sureDk, baslik: veri.baslik ?? "", renk });
    } else {
      setHayalet({ basDk: dk, sureDk: 60, baslik: "", renk: "var(--primary)" });
    }
  };
  const dragLeave = () => setHayalet(null);
  const drop = (e: React.DragEvent) => {
    e.preventDefault();
    setHayalet(null);
    const json = e.dataTransfer.getData("application/json");
    if (!json || !ref.current) return;
    let veri: any;
    try { veri = JSON.parse(json); } catch { return; }
    const o: EtkinlikOlay = {
      ...veri,
      olayBaslangic: new Date(veri.olayBaslangic),
      olayBitis: new Date(veri.olayBitis),
    };
    const dk = pxToDk(localY(e.clientY));
    const d = new Date(gun); d.setHours(0, 0, 0, 0); d.setMinutes(dk);
    onMove(o, d);
  };

  const resizeBasla = (o: EtkinlikOlay) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const hareket = (ev: MouseEvent) => {
      if (!ref.current) return;
      const y = localY(ev.clientY);
      const dk = pxToDk(y);
      const yeniBitis = new Date(gun); yeniBitis.setHours(0, 0, 0, 0); yeniBitis.setMinutes(dk + 15);
      if (yeniBitis.getTime() <= o.olayBaslangic.getTime() + 15 * 60_000) return;
      (ev.target as HTMLElement).dispatchEvent(new Event("noop"));
    };
    const bitir = (ev: MouseEvent) => {
      window.removeEventListener("mousemove", hareket);
      window.removeEventListener("mouseup", bitir);
      if (!ref.current) return;
      const y = localY(ev.clientY);
      const dk = pxToDk(y);
      const yeniBitis = new Date(gun); yeniBitis.setHours(0, 0, 0, 0); yeniBitis.setMinutes(dk + 15);
      if (yeniBitis.getTime() > o.olayBaslangic.getTime() + 15 * 60_000) onResize(o, yeniBitis);
    };
    window.addEventListener("mousemove", hareket);
    window.addEventListener("mouseup", bitir);
  };

  return (
    <div ref={ref} className={cn("relative border-l border-border", isToday && "bg-primary/[0.02]")} onMouseDown={slotBasla} onDragOver={dragOver} onDragLeave={dragLeave} onDrop={drop} style={{ height: 24 * SAAT_PX }}>
      {Array.from({ length: 24 }, (_, h) => (
        <div key={h} className="border-b border-border" style={{ height: SAAT_PX }} />
      ))}
      {isToday && (
        <div className="pointer-events-none absolute left-0 right-0 z-10 border-t-2 border-destructive" style={{ top: ((now.getHours() * 60 + now.getMinutes()) / (24 * 60)) * (24 * SAAT_PX) }}>
          <div className="absolute -left-1 -top-1 h-2 w-2 rounded-full bg-destructive" />
        </div>
      )}
      {secim && (
        <div className="pointer-events-none absolute left-0 right-0 z-20 rounded bg-primary/20 ring-1 ring-primary" style={{ top: (secim.basDk / 60) * SAAT_PX, height: ((secim.bitDk - secim.basDk) / 60) * SAAT_PX }}>
          <div className="px-1 text-[10px] font-medium text-primary">{String(Math.floor(secim.basDk / 60)).padStart(2,"0")}:{String(secim.basDk % 60).padStart(2,"0")} – {String(Math.floor(secim.bitDk / 60)).padStart(2,"0")}:{String(secim.bitDk % 60).padStart(2,"0")}</div>
        </div>
      )}
      {hayalet && (
        <div
          className="pointer-events-none absolute left-0.5 right-0.5 z-30 overflow-hidden rounded border-2 border-dashed text-[10px] text-white shadow-lg"
          style={{
            top: (hayalet.basDk / 60) * SAAT_PX,
            height: Math.max(20, (hayalet.sureDk / 60) * SAAT_PX),
            background: hayalet.renk,
            opacity: 0.75,
            borderColor: "rgba(255,255,255,0.7)",
          }}
        >
          <div className="px-1 py-0.5">
            <div className="truncate font-medium">{hayalet.baslik || "Yeni konum"}</div>
            <div className="truncate opacity-90">
              {String(Math.floor(hayalet.basDk / 60)).padStart(2, "0")}:{String(hayalet.basDk % 60).padStart(2, "0")} – {String(Math.floor(((hayalet.basDk + hayalet.sureDk) % (24 * 60)) / 60)).padStart(2, "0")}:{String((hayalet.basDk + hayalet.sureDk) % 60).padStart(2, "0")}
            </div>
          </div>
        </div>
      )}
      {yerlesimler.map(({ olay, sutun, toplam }) => {
        const dakBas = olay.olayBaslangic.getHours() * 60 + olay.olayBaslangic.getMinutes();
        const dakBit = olay.olayBitis.getHours() * 60 + olay.olayBitis.getMinutes() || dakBas + 60;
        const top = (dakBas / 60) * SAAT_PX;
        const yuks = Math.max(20, ((dakBit - dakBas) / 60) * SAAT_PX);
        const w = 100 / toplam;
        return (
          <OlayMenu key={olay.id} olay={olay} onDuzenle={onOlayDuzenle} onCogalt={onOlayCogalt} onSil={onOlaySil} onRenk={onOlayRenk}>
            <div data-olay draggable onDragStart={dragHandle(olay)} onDragEnd={() => setHayalet(null)} onClick={(e) => { e.stopPropagation(); onOlayClick(olay, e); }} onMouseDown={(e) => e.stopPropagation()} className="absolute overflow-hidden rounded text-left text-[10px] text-white shadow-sm cursor-pointer" style={{ top, height: yuks, left: `${sutun * w}%`, width: `calc(${w}% - 2px)`, background: rengiBul(olay.renk ?? takvimler.find((t) => t.id === olay.takvim_id)?.renk) }}>
              <div className="px-1 py-0.5">
                <div className="truncate font-medium">{olay.baslik}</div>
                <div className="truncate opacity-80">{format(olay.olayBaslangic, "HH:mm")} – {format(olay.olayBitis, "HH:mm")}</div>
              </div>
              <div onMouseDown={resizeBasla(olay)} className="absolute inset-x-0 bottom-0 h-1.5 cursor-ns-resize bg-white/20 hover:bg-white/40" />
            </div>
          </OlayMenu>
        );
      })}
    </div>
  );
}