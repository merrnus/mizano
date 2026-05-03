import * as React from "react";
import { format, isSameDay } from "date-fns";
import { tr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { type EtkinlikOlay } from "@/lib/takvim-hooks";
import { cakismayiYerlestir } from "@/lib/takvim-cakisma";
import { useTakvimSurukle } from "@/lib/takvim-surukle";

const SAATLER = Array.from({ length: 24 }, (_, i) => i);
const SAAT_PX_MIN = 44;
const SNAP_DK = 15;

function dakika(d: Date): number {
  return d.getHours() * 60 + d.getMinutes();
}

function tasinabilirMi(o: EtkinlikOlay): boolean {
  return !o.id.startsWith("ilim:") && !o.id.startsWith("amel:");
}

type Props = {
  ankara: Date;
  olaylar: EtkinlikOlay[];
  onSlotClick: (saat: Date) => void;
  onOlayClick: (o: EtkinlikOlay) => void;
  onOlayTasi?: (id: string, yeniBaslangic: Date) => void;
  onOlayBoyutla?: (id: string, yeniBitis: Date) => void;
};

export function GunGorunumu({
  ankara,
  olaylar,
  onSlotClick,
  onOlayClick,
  onOlayTasi,
  onOlayBoyutla,
}: Props) {
  const gunOlaylari = olaylar.filter((o) => isSameDay(o.olayBaslangic, ankara));
  const yerlesim = React.useMemo(() => cakismayiYerlestir(gunOlaylari), [gunOlaylari]);
  const scrollRef = React.useRef<HTMLDivElement | null>(null);
  const gridRef = React.useRef<HTMLDivElement | null>(null);
  const [simdi, setSimdi] = React.useState<Date>(() => new Date());
  const [SAAT_PX, setSaatPx] = React.useState<number>(SAAT_PX_MIN);

  React.useEffect(() => {
    const calc = () => {
      const el = scrollRef.current;
      if (!el) return;
      const h = el.clientHeight;
      const px = Math.max(SAAT_PX_MIN, Math.floor(h / 14));
      setSaatPx(px);
    };
    calc();
    const ro = new ResizeObserver(calc);
    if (scrollRef.current) ro.observe(scrollRef.current);
    return () => ro.disconnect();
  }, []);

  const surukle = useTakvimSurukle({
    saatPx: SAAT_PX,
    snapDk: SNAP_DK,
    scrollRef,
    onTasimaBitti: ({ id, modu, dakikaDelta, surukleGerceklesti }) => {
      if (!surukleGerceklesti) return; // click ile karıştırma
      const olay = gunOlaylari.find((o) => o.id === id);
      if (!olay) return;
      if (modu === "tasi" && onOlayTasi) {
        if (dakikaDelta === 0) return;
        const yeni = new Date(olay.olayBaslangic.getTime() + dakikaDelta * 60_000);
        onOlayTasi(id, yeni);
      } else if (modu === "boyutla" && onOlayBoyutla) {
        if (dakikaDelta === 0) return;
        const yeni = new Date(olay.olayBitis.getTime() + dakikaDelta * 60_000);
        if (yeni.getTime() - olay.olayBaslangic.getTime() >= 15 * 60_000) {
          onOlayBoyutla(id, yeni);
        }
      }
    },
  });

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

  // Sürüklenen etkinliğin canlı önizlemesi (Google Calendar tarzı)
  const aktifDurum = surukle.durum;
  let onizleme: { o: EtkinlikOlay; top: number; height: number } | null = null;
  if (aktifDurum && aktifDurum.aktif && aktifDurum.modu === "tasi") {
    const o = gunOlaylari.find((x) => x.id === aktifDurum.id);
    if (o) {
      const baseH = Math.max(
        ((dakika(o.olayBitis) - dakika(o.olayBaslangic)) / 60) * SAAT_PX,
        24,
      );
      const basDk = dakika(o.olayBaslangic);
      const orjTop = ((basDk - SAATLER[0] * 60) / 60) * SAAT_PX;
      const top = Math.max(
        0,
        Math.min(SAATLER.length * SAAT_PX - baseH, orjTop + aktifDurum.dyPx),
      );
      onizleme = { o, top, height: baseH };
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-xl border border-border bg-card">
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
        className="relative grid min-h-0 flex-1 grid-cols-[3.5rem_minmax(0,1fr)] overflow-y-auto overscroll-contain"
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
        <div
          ref={gridRef}
          className="relative border-l border-border"
          style={{ height: SAATLER.length * SAAT_PX }}
        >
          {SAATLER.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                const slot = new Date(ankara);
                slot.setHours(s, 0, 0, 0);
                onSlotClick(slot);
              }}
              className="block w-full border-b border-border/60 hover:bg-accent/40"
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
          {yerlesim.map(({ olay: o, sutun, sutunSayisi }, idx) => {
            const basDk = dakika(o.olayBaslangic);
            const bitDk = dakika(o.olayBitis);
            const tasinabilir = !!onOlayTasi && tasinabilirMi(o);
            const aktif = surukle.durum?.id === o.id;
            const dragGoruluyor = aktif && surukle.durum!.aktif;
            const bMinTop = ((basDk - SAATLER[0] * 60) / 60) * SAAT_PX;
            const baseH = Math.max(((bitDk - basDk) / 60) * SAAT_PX, 24);
            const top = bMinTop;
            const yukseklik =
              dragGoruluyor && surukle.durum!.modu === "boyutla"
                ? Math.max(baseH + surukle.durum!.dyPx, 24)
                : baseH;
            const sutunGenislikYuzde = 100 / sutunSayisi;
            return (
              <button
                key={`${o.id}-${idx}`}
                type="button"
                onPointerDown={(e) => {
                  if (!tasinabilir) return;
                  if (e.button !== 0) return;
                  surukle.baslat(e, o.id, "tasi");
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (surukle.tikiBastir()) return;
                  onOlayClick(o);
                }}
                className={cn(
                  "absolute overflow-hidden rounded-lg border-l-4 px-2.5 py-1.5 text-left text-xs leading-tight transition-colors hover:opacity-90",
                  tasinabilir && "cursor-grab touch-none active:cursor-grabbing",
                  dragGoruluyor && surukle.durum!.modu === "tasi" && "opacity-30",
                  dragGoruluyor && surukle.durum!.modu === "boyutla" && "z-30 shadow-lg ring-2 ring-primary/40",
                )}
                style={{
                  top,
                  height: yukseklik,
                  left: `calc(${sutun * sutunGenislikYuzde}% + 0.5rem)`,
                  width: `calc(${sutunGenislikYuzde}% - 0.75rem)`,
                  backgroundColor: `color-mix(in oklab, var(--${o.alan}) 18%, transparent)`,
                  borderLeftColor: `var(--${o.alan})`,
                }}
              >
                <div className="font-semibold text-foreground">{o.baslik}</div>
                <div className="text-[11px] text-muted-foreground">
                  {format(o.olayBaslangic, "HH:mm")} – {format(o.olayBitis, "HH:mm")}
                  {o.konum ? ` · ${o.konum}` : ""}
                </div>
                {tasinabilir && onOlayBoyutla && (
                  <span
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      surukle.baslat(e, o.id, "boyutla");
                    }}
                    className="absolute inset-x-0 bottom-0 h-1.5 cursor-ns-resize touch-none bg-foreground/0 hover:bg-foreground/20"
                    aria-hidden
                  />
                )}
              </button>
            );
          })}
          {onizleme && (
            <div
              className="pointer-events-none absolute z-40 overflow-hidden rounded-lg border-l-4 px-2.5 py-1.5 text-xs leading-tight shadow-xl ring-2 ring-primary/60"
              style={{
                top: onizleme.top,
                height: onizleme.height,
                left: "0.5rem",
                right: "0.75rem",
                backgroundColor: `color-mix(in oklab, var(--${onizleme.o.alan}) 35%, transparent)`,
                borderLeftColor: `var(--${onizleme.o.alan})`,
              }}
            >
              <div className="font-semibold text-foreground">{onizleme.o.baslik}</div>
              <div className="text-[11px] text-muted-foreground">
                {format(
                  new Date(onizleme.o.olayBaslangic.getTime() + (onizleme.top - ((dakika(onizleme.o.olayBaslangic) - SAATLER[0] * 60) / 60) * SAAT_PX) / SAAT_PX * 60 * 60_000),
                  "HH:mm",
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}