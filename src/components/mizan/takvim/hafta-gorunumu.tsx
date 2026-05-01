import * as React from "react";
import { addDays, format, isSameDay, startOfDay } from "date-fns";
import { tr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { GUN_KISA, haftaBaslangici, haftaGunleri } from "@/lib/cetele-tarih";
import {
  type EtkinlikOlay,
} from "@/lib/takvim-hooks";
import { cakismayiYerlestir } from "@/lib/takvim-cakisma";
import { useTakvimSurukle } from "@/lib/takvim-surukle";

const SAATLER = Array.from({ length: 24 }, (_, i) => i); // 00..23
const SAAT_PX = 32; // her saat satırı yüksekliği — daha kompakt
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
  onOlayClick: (olay: EtkinlikOlay) => void;
  onOlayTasi?: (id: string, yeniBaslangic: Date) => void;
  onOlayBoyutla?: (id: string, yeniBitis: Date) => void;
};

export function HaftaGorunumu({
  ankara,
  olaylar,
  onSlotClick,
  onOlayClick,
  onOlayTasi,
  onOlayBoyutla,
}: Props) {
  const haftaBas = haftaBaslangici(ankara);
  const gunler = haftaGunleri(haftaBas);
  const bugun = startOfDay(new Date());
  const scrollRef = React.useRef<HTMLDivElement | null>(null);
  const [simdi, setSimdi] = React.useState<Date>(() => new Date());
  const sutunRefs = React.useRef<Map<string, HTMLDivElement | null>>(new Map());

  const sutunlar = React.useMemo(
    () =>
      gunler.map((g) => ({
        key: g.toISOString(),
        getRect: () => sutunRefs.current.get(g.toISOString())?.getBoundingClientRect() ?? null,
      })),
    [gunler],
  );

  const surukle = useTakvimSurukle({
    saatPx: SAAT_PX,
    snapDk: SNAP_DK,
    scrollRef,
    sutunlar,
    onTasimaBitti: ({ id, modu, dakikaDelta, sutunDelta, surukleGerceklesti }) => {
      if (!surukleGerceklesti) return;
      const olay = olaylar.find((o) => o.id === id);
      if (!olay) return;
      if (modu === "tasi" && onOlayTasi) {
        if (dakikaDelta === 0 && sutunDelta === 0) return;
        const yeni = new Date(olay.olayBaslangic.getTime() + dakikaDelta * 60_000);
        const yeniGun = addDays(yeni, sutunDelta);
        onOlayTasi(id, yeniGun);
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
        className="relative grid min-h-0 flex-1 grid-cols-[3rem_repeat(7,minmax(0,1fr))] overflow-y-auto overscroll-contain"
        style={{ maxHeight: "calc(100dvh - 12rem)" }}
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
          const yerlesim = cakismayiYerlestir(gunOlaylari);
          const isToday = isSameDay(g, simdi);
          return (
            <div
              key={g.toISOString()}
              ref={(el) => {
                sutunRefs.current.set(g.toISOString(), el);
              }}
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
                  className="block w-full border-b border-border/60 hover:bg-accent/40"
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
              {yerlesim.map(({ olay: o, sutun, sutunSayisi }, idx) => {
                const basDk = dakika(o.olayBaslangic);
                const bitDk = dakika(o.olayBitis);
                const tasinabilir = !!onOlayTasi && tasinabilirMi(o);
                const aktif =
                  surukle.durum?.id === o.id &&
                  surukle.durum.baslangicSutunKey === g.toISOString();
                const dragGoruluyor = aktif && surukle.durum?.aktif === true;
                const farkliSutunaSurukleniyor =
                  dragGoruluyor &&
                  surukle.durum?.modu === "tasi" &&
                  surukle.durum.hedefSutunKey !== g.toISOString();
                const dy =
                  dragGoruluyor && surukle.durum ? surukle.durum.dyPx : 0;
                const bMinTop = ((basDk - SAATLER[0] * 60) / 60) * SAAT_PX;
                const baseH = Math.max(((bitDk - basDk) / 60) * SAAT_PX, 18);
                const top =
                  dragGoruluyor && surukle.durum?.modu === "tasi"
                    ? bMinTop // canlı önizleme overlay olarak çiziliyor
                    : bMinTop;
                const yukseklik =
                  dragGoruluyor && surukle.durum?.modu === "boyutla"
                    ? Math.max(baseH + dy, 18)
                    : baseH;
                const sutunGenislikYuzde = 100 / sutunSayisi;
                return (
                  <button
                    key={`${o.id}-${idx}`}
                    type="button"
                    onPointerDown={(e) => {
                      if (!tasinabilir) return;
                      if (e.button !== 0) return;
                      surukle.baslat(e, o.id, "tasi", g.toISOString());
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (surukle.tikiBastir()) return;
                      onOlayClick(o);
                    }}
                    className={cn(
                      "absolute overflow-hidden rounded-md border-l-2 px-1.5 py-1 text-left text-[11px] leading-tight transition-colors hover:opacity-90",
                      tasinabilir && "cursor-grab touch-none active:cursor-grabbing",
                      dragGoruluyor && surukle.durum?.modu === "tasi" && "opacity-30",
                      dragGoruluyor && surukle.durum?.modu === "boyutla" && "z-30 shadow-lg ring-2 ring-primary/40",
                    )}
                    style={{
                      top,
                      height: yukseklik,
                      left: `calc(${sutun * sutunGenislikYuzde}% + 0.25rem)`,
                      width: `calc(${sutunGenislikYuzde}% - 0.5rem)`,
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
                    {tasinabilir && onOlayBoyutla && (
                      <span
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          surukle.baslat(e, o.id, "boyutla", g.toISOString());
                        }}
                        className="absolute inset-x-0 bottom-0 h-1.5 cursor-ns-resize touch-none hover:bg-foreground/20"
                        aria-hidden
                      />
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
        {(() => {
          const d = surukle.durum;
          if (!d || !d.aktif || d.modu !== "tasi") return null;
          const o = olaylar.find((x) => x.id === d.id);
          if (!o) return null;
          const hedef = sutunRefs.current.get(d.hedefSutunKey ?? "");
          const sc = scrollRef.current;
          if (!hedef || !sc) return null;
          const colRect = hedef.getBoundingClientRect();
          const scRect = sc.getBoundingClientRect();
          const baseH = Math.max(
            ((dakika(o.olayBitis) - dakika(o.olayBaslangic)) / 60) * SAAT_PX,
            18,
          );
          // pointer'ı kart ortasına al, snap'le
          const yIcinde = d.clientY - colRect.top - baseH / 2;
          const snap = (SAAT_PX * SNAP_DK) / 60;
          const top = Math.max(0, Math.min(SAATLER.length * SAAT_PX - baseH, Math.round(yIcinde / snap) * snap));
          // scroll container'a göre offset
          const left = colRect.left - scRect.left + sc.scrollLeft + 2;
          const absTop = colRect.top - scRect.top + sc.scrollTop + top;
          const dakikaIcerisi = (top / SAAT_PX) * 60;
          const yeniBas = new Date(0);
          yeniBas.setHours(Math.floor(dakikaIcerisi / 60), Math.round(dakikaIcerisi % 60), 0, 0);
          return (
            <div
              className="pointer-events-none absolute z-50 overflow-hidden rounded-md border-l-2 px-1.5 py-1 text-[11px] leading-tight shadow-2xl ring-2 ring-primary/60"
              style={{
                top: absTop,
                left,
                width: colRect.width - 4,
                height: baseH,
                backgroundColor: `color-mix(in oklab, var(--${o.alan}) 40%, transparent)`,
                borderLeftColor: `var(--${o.alan})`,
                color: "var(--foreground)",
              }}
            >
              <div className="truncate font-medium">{o.baslik}</div>
              <div className="truncate text-[10px] text-muted-foreground">
                {format(yeniBas, "HH:mm")}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}