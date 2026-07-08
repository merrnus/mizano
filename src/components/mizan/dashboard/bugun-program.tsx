import * as React from "react";
import { Link } from "@tanstack/react-router";
import { Check, Clock, LocateFixed, MapPin, Plus, X } from "lucide-react";
import { format, isSameDay } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  useBugunGorevler,
  useGunlukGorevGuncelle,
  useGunlukGorevEkle,
  useGunlukGorevSil,
} from "@/lib/gunluk-gorev";
import { useEtkinlikler, useEtkinlikGuncelle } from "@/lib/takvim/hooks";
import { genisletListe } from "@/lib/takvim/tekrar";
import { tarihFormat } from "@/lib/cetele-tarih";
import type { EtkinlikOlay, TakvimEtkinlik } from "@/lib/takvim/tipler";
import { EtkinlikDetaySheet } from "./etkinlik-detay-sheet";
import { EtkinlikHizliDialog } from "@/components/mizan/takvim/etkinlik-hizli-dialog";

const SAAT_PX = 52;
const MIN_SAAT = 5; // varsayılan pencere: 05:00 - 24:00
const MAX_SAAT = 24;

function dkToTop(dk: number, basSaat: number) {
  return ((dk - basSaat * 60) / 60) * SAAT_PX;
}

export function BugunProgram({ simdi }: { simdi: Date }) {
  const tarihStr = tarihFormat(simdi);
  const gunBas = React.useMemo(() => {
    const d = new Date(simdi);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [tarihStr]);
  const gunSon = React.useMemo(() => {
    const d = new Date(gunBas);
    d.setHours(23, 59, 59, 999);
    return d;
  }, [gunBas]);
  const { data: etkinlikler = [] } = useEtkinlikler(gunBas, gunSon);
  const { data: gorevler = [] } = useBugunGorevler(simdi);

  const olaylar: EtkinlikOlay[] = React.useMemo(
    () =>
      genisletListe(etkinlikler, gunBas, gunSon).filter((o) =>
        isSameDay(o.olayBaslangic, simdi),
      ),
    [etkinlikler, gunBas, gunSon, simdi],
  );

  // Zaman penceresi: erken/gece etkinlikleri de kapsa
  const [basSaat, bitSaat] = React.useMemo(() => {
    let bas = MIN_SAAT;
    let bit = MAX_SAAT;
    for (const o of olaylar) {
      if (o.tum_gun) continue;
      const s = o.olayBaslangic.getHours();
      const e = o.olayBitis.getHours() + (o.olayBitis.getMinutes() > 0 ? 1 : 0);
      if (s < bas) bas = Math.max(0, s);
      if (e > bit) bit = Math.min(24, e);
    }
    return [bas, bit];
  }, [olaylar]);
  const toplamSaat = bitSaat - basSaat;

  const [acikEtkinlik, setAcikEtkinlik] =
    React.useState<TakvimEtkinlik | null>(null);
  const [hizliAcik, setHizliAcik] = React.useState(false);
  const [hizliSaat, setHizliSaat] = React.useState<Date | undefined>(undefined);

  // Şimdi çizgisi
  const nowDk = simdi.getHours() * 60 + simdi.getMinutes();
  const nowGorunur = nowDk >= basSaat * 60 && nowDk <= bitSaat * 60;

  // İlk render: şimdi satırına scroll
  const scrollRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el || !nowGorunur) return;
    el.scrollTop = Math.max(0, dkToTop(nowDk, basSaat) - 120);
    // yalnızca ilk mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Klavye: "T" → şimdiye kaydır
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.key === "t" || e.key === "T") {
        const el = scrollRef.current;
        if (el && nowGorunur) {
          el.scrollTo({ top: Math.max(0, dkToTop(nowDk, basSaat) - 120), behavior: "smooth" });
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [nowDk, basSaat, nowGorunur]);

  const tumGunOlaylar = olaylar.filter((o) => o.tum_gun);
  const saatliOlaylar = olaylar.filter((o) => !o.tum_gun);

  // Çakışma sütunlama: her olay için column index ve toplam column sayısı
  const yerlesim = React.useMemo(() => {
    const items = [...saatliOlaylar]
      .map((o) => {
        const bas = o.olayBaslangic.getHours() * 60 + o.olayBaslangic.getMinutes();
        const bit =
          o.olayBitis.getHours() * 60 + o.olayBitis.getMinutes() || bas + 60;
        return { o, bas, bit };
      })
      .sort((a, b) => a.bas - b.bas || a.bit - b.bit);

    const map = new Map<string, { col: number; toplam: number }>();
    let grup: typeof items = [];
    let grupBit = -1;

    const flush = () => {
      if (grup.length === 0) return;
      const kolonlar: number[] = []; // her sütunun son bitiş dk'sı
      const cols: number[] = [];
      for (const it of grup) {
        let placed = -1;
        for (let i = 0; i < kolonlar.length; i++) {
          if (kolonlar[i] <= it.bas) {
            placed = i;
            kolonlar[i] = it.bit;
            break;
          }
        }
        if (placed === -1) {
          placed = kolonlar.length;
          kolonlar.push(it.bit);
        }
        cols.push(placed);
      }
      const toplam = kolonlar.length;
      grup.forEach((it, i) => map.set(it.o.id, { col: cols[i], toplam }));
      grup = [];
      grupBit = -1;
    };

    for (const it of items) {
      if (grup.length === 0 || it.bas < grupBit) {
        grup.push(it);
        grupBit = Math.max(grupBit, it.bit);
      } else {
        flush();
        grup.push(it);
        grupBit = it.bit;
      }
    }
    flush();
    return map;
  }, [saatliOlaylar]);

  const guncelleEtkinlik = useEtkinlikGuncelle();
  const [surukleId, setSurukleId] = React.useState<string | null>(null);
  const slotRef = React.useRef<HTMLDivElement>(null);

  const dropDakika = (clientY: number) => {
    const el = slotRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const y = clientY - rect.top;
    const dkFromBas = Math.max(0, (y / SAAT_PX) * 60);
    const snap = Math.round(dkFromBas / 15) * 15;
    return basSaat * 60 + snap;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain") || surukleId;
    setSurukleId(null);
    if (!id) return;
    const olay = saatliOlaylar.find((o) => o.id === id);
    if (!olay) return;
    const yeniBasDk = dropDakika(e.clientY);
    if (yeniBasDk == null) return;
    const eskiBas = new Date(olay.baslangic);
    const eskiBit = olay.bitis ? new Date(olay.bitis) : null;
    const sureMs = eskiBit ? eskiBit.getTime() - eskiBas.getTime() : 60 * 60 * 1000;
    const yeniBas = new Date(gunBas);
    yeniBas.setMinutes(yeniBasDk);
    if (yeniBas.getTime() === eskiBas.getTime()) return;
    const tekrarli =
      (olay.tekrar && olay.tekrar !== "yok") || !!olay.tekrar_kural;
    if (tekrarli) {
      toast.error("Tekrarlı etkinlik sürüklenemez", {
        description: "Takvim sayfasından düzenleyebilirsin.",
      });
      return;
    }
    const yeniBit = new Date(yeniBas.getTime() + sureMs);
    guncelleEtkinlik.mutate(
      {
        id: olay.id,
        baslangic: yeniBas.toISOString(),
        bitis: yeniBit.toISOString(),
      },
      {
        onSuccess: () => toast.success(`${format(yeniBas, "HH:mm")}'e taşındı`),
        onError: (err: any) => toast.error(err?.message ?? "Güncellenemedi"),
      },
    );
  };

  const saatDiziGoster = (offset: number) => {
    const s = basSaat + offset;
    return `${String(s).padStart(2, "0")}:00`;
  };

  const slotTikla = (saat: number, dk: number) => {
    const d = new Date(gunBas);
    d.setHours(saat, dk, 0, 0);
    setHizliSaat(d);
    setHizliAcik(true);
  };

  const yuksek = toplamSaat * SAAT_PX;

  return (
    <section className="rounded-2xl border border-border/60 bg-card/40 p-2 sm:p-3">
      <header className="flex items-center justify-between gap-2 px-2 pb-2 pt-1">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
            Bugün
          </span>
          <h2 className="text-sm font-semibold tracking-tight">Program</h2>
        </div>
        <div className="flex items-center gap-1">
          <Link
            to="/takvim"
            className="rounded-full px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Takvim →
          </Link>
          {nowGorunur && (
            <button
              type="button"
              onClick={() => {
                const el = scrollRef.current;
                if (el) el.scrollTo({ top: Math.max(0, dkToTop(nowDk, basSaat) - 120), behavior: "smooth" });
              }}
              className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Şimdiye kaydır"
            >
              <LocateFixed className="h-3 w-3" />
              Şimdi
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setHizliSaat(undefined);
              setHizliAcik(true);
            }}
            className="inline-flex items-center gap-1 rounded-full bg-foreground px-2.5 py-1 text-[11px] font-medium text-background transition-transform hover:scale-105"
          >
            <Plus className="h-3 w-3" />
            Ekle
          </button>
        </div>
      </header>

      {tumGunOlaylar.length > 0 && (
        <div className="mb-1 flex flex-wrap gap-1 border-b border-border/40 px-2 pb-2">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            tüm gün
          </span>
          {tumGunOlaylar.map((o) => {
            const renk = `var(--${o.alan})`;
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => setAcikEtkinlik(o)}
                className="rounded px-1.5 py-0.5 text-[11px] font-medium text-white"
                style={{ background: renk }}
              >
                {o.baslik}
              </button>
            );
          })}
        </div>
      )}

      {/* Zaman şeridi */}
      <div
        ref={scrollRef}
        className="relative max-h-[540px] overflow-y-auto rounded-lg"
      >
        <div
          className="relative grid"
          style={{ gridTemplateColumns: "3rem 1fr", height: yuksek }}
        >
          {/* Saat rail */}
          <div className="border-r border-border/50">
            {Array.from({ length: toplamSaat }, (_, i) => (
              <div
                key={i}
                style={{ height: SAAT_PX }}
                className="border-b border-border/40 pr-1.5 pt-0.5 text-right text-[10px] tabular-nums text-muted-foreground"
              >
                {saatDiziGoster(i)}
              </div>
            ))}
          </div>

          {/* Slot alanı */}
          <div
            className="relative"
            ref={slotRef}
            onDragOver={(e) => {
              if (surukleId) e.preventDefault();
            }}
            onDrop={handleDrop}
          >
            {Array.from({ length: toplamSaat }, (_, i) => {
              const saat = basSaat + i;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => slotTikla(saat, 0)}
                  style={{ height: SAAT_PX }}
                  className="group block w-full border-b border-border/40 text-left transition-colors hover:bg-muted/30"
                  aria-label={`${saatDiziGoster(i)} slotuna etkinlik ekle`}
                >
                  <span className="pointer-events-none ml-2 mt-1 inline-flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground/50 opacity-0 transition-opacity group-hover:opacity-100">
                    <Plus className="h-3 w-3" />
                  </span>
                </button>
              );
            })}

            {/* Şimdi çizgisi */}
            {nowGorunur && (
              <div
                className="pointer-events-none absolute left-0 right-0 z-20 border-t-2 border-destructive"
                style={{ top: dkToTop(nowDk, basSaat) }}
              >
                <div className="absolute -left-1 -top-1 h-2 w-2 rounded-full bg-destructive shadow-[0_0_6px_currentColor]" />
                <span className="absolute right-1 -top-2 rounded bg-destructive px-1 py-0.5 text-[9px] font-semibold text-destructive-foreground">
                  {format(simdi, "HH:mm")}
                </span>
              </div>
            )}

            {/* Etkinlik blokları */}
            {saatliOlaylar.map((o) => {
              const dakBas =
                o.olayBaslangic.getHours() * 60 + o.olayBaslangic.getMinutes();
              const dakBit =
                o.olayBitis.getHours() * 60 + o.olayBitis.getMinutes() ||
                dakBas + 60;
              const top = dkToTop(dakBas, basSaat);
              const h = Math.max(24, ((dakBit - dakBas) / 60) * SAAT_PX);
              const renk = `var(--${o.alan})`;
              const bitmis = o.olayBitis.getTime() <= simdi.getTime();
              const suan =
                o.olayBaslangic.getTime() <= simdi.getTime() && !bitmis;
              const y = yerlesim.get(o.id) ?? { col: 0, toplam: 1 };
              const gap = 2;
              const genislikPct = 100 / y.toplam;
              const leftPct = y.col * genislikPct;
              const tekrarli =
                (o.tekrar && o.tekrar !== "yok") || !!o.tekrar_kural;
              return (
                <button
                  key={o.id}
                  type="button"
                  draggable={!tekrarli}
                  onDragStart={(e) => {
                    setSurukleId(o.id);
                    e.dataTransfer.setData("text/plain", o.id);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  onDragEnd={() => setSurukleId(null)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setAcikEtkinlik(o);
                  }}
                  className={cn(
                    "absolute z-10 overflow-hidden rounded-md px-1.5 py-1 text-left text-[11px] shadow-sm ring-1 transition-all hover:z-30 hover:shadow-md",
                    bitmis && "opacity-60",
                    surukleId === o.id && "opacity-40",
                    !tekrarli && "cursor-grab active:cursor-grabbing",
                  )}
                  style={{
                    top,
                    height: h,
                    left: `calc(${leftPct}% + 4px)`,
                    width: `calc(${genislikPct}% - ${gap + 4}px)`,
                    background: `color-mix(in oklab, ${renk} 18%, transparent)`,
                    boxShadow: `inset 3px 0 0 ${renk}`,
                    color: `color-mix(in oklab, ${renk} 92%, var(--foreground))`,
                  }}
                >
                  <div className="flex items-center gap-1">
                    {suan && (
                      <span
                        className="h-1.5 w-1.5 animate-pulse rounded-full"
                        style={{ background: renk }}
                      />
                    )}
                    <span className="truncate text-[12px] font-semibold">
                      {o.baslik}
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-[10px] tabular-nums opacity-80">
                    <Clock className="h-2.5 w-2.5" />
                    {format(o.olayBaslangic, "HH:mm")}–
                    {format(o.olayBitis, "HH:mm")}
                    {o.konum && (
                      <span className="ml-1 flex items-center gap-0.5 truncate">
                        <MapPin className="h-2.5 w-2.5" />
                        <span className="truncate">{o.konum}</span>
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Saat dışı: sadece manuel görevler */}
      <SaatDisi tarihStr={tarihStr} gorevler={gorevler} />

      <EtkinlikDetaySheet
        etkinlik={acikEtkinlik}
        onOpenChange={(o) => !o && setAcikEtkinlik(null)}
      />
      <EtkinlikHizliDialog
        acik={hizliAcik}
        onOpenChange={setHizliAcik}
        varsayilanBaslangic={hizliSaat}
      />
    </section>
  );
}

/* -------- Saat dışı grubu -------- */

function SaatDisi({
  tarihStr,
  gorevler,
}: {
  tarihStr: string;
  gorevler: ReturnType<typeof useBugunGorevler>["data"];
}) {
  const saatsizGorevler = (gorevler ?? []).filter((g) => !g.saat);
  return (
    <div className="mt-2 border-t border-border/50 pt-2">
      <div className="mb-1 flex items-center justify-between px-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Saat dışı
        </p>
        {saatsizGorevler.length > 0 && (
          <span className="text-[10px] tabular-nums text-muted-foreground">
            {saatsizGorevler.filter((g) => g.tamamlandi).length}/
            {saatsizGorevler.length}
          </span>
        )}
      </div>
      <HizliGorevEkle tarihStr={tarihStr} />
      <ul className="flex flex-col divide-y divide-border/30">
        {saatsizGorevler.map((g) => (
          <SaatsizGorev key={g.id} gorev={g} />
        ))}
      </ul>
      {saatsizGorevler.length === 0 && (
        <p className="px-2 py-2 text-[11px] text-muted-foreground/70">
          Saat dışı görev yok.
        </p>
      )}
    </div>
  );
}

function HizliGorevEkle({ tarihStr }: { tarihStr: string }) {
  const ekle = useGunlukGorevEkle();
  const [baslik, setBaslik] = React.useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const b = baslik.trim();
        if (!b) return;
        ekle.mutate(
          { baslik: b, tarih: tarihStr, saat: null },
          {
            onSuccess: () => setBaslik(""),
            onError: (err: any) => toast.error(err?.message ?? "Eklenemedi"),
          },
        );
      }}
      className="mb-1 flex items-center gap-1 px-2"
    >
      <Plus className="h-3.5 w-3.5 text-muted-foreground" />
      <Input
        value={baslik}
        onChange={(e) => setBaslik(e.target.value)}
        placeholder="Hızlı görev ekle…"
        className="h-7 border-0 bg-transparent px-1 text-xs shadow-none focus-visible:ring-0"
      />
    </form>
  );
}

function SaatsizGorev({
  gorev,
}: {
  gorev: NonNullable<ReturnType<typeof useBugunGorevler>["data"]>[number];
}) {
  const guncelle = useGunlukGorevGuncelle();
  const sil = useGunlukGorevSil();
  return (
    <li className="group flex items-center gap-2 px-2 py-2">
      <button
        type="button"
        role="checkbox"
        aria-checked={gorev.tamamlandi}
        onClick={() =>
          guncelle.mutate({
            id: gorev.id,
            tamamlandi: !gorev.tamamlandi,
            tamamlanma_at: !gorev.tamamlandi ? new Date().toISOString() : null,
          })
        }
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-md border transition-colors",
          gorev.tamamlandi
            ? "border-foreground/60 bg-foreground/60 text-background"
            : "border-border hover:border-foreground",
        )}
      >
        {gorev.tamamlandi && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
      </button>
      <span
        className={cn(
          "flex-1 truncate text-sm",
          gorev.tamamlandi && "text-muted-foreground line-through",
        )}
      >
        {gorev.baslik}
      </span>
      <button
        type="button"
        onClick={() => sil.mutate(gorev.id)}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-destructive group-hover:opacity-100"
        aria-label="Görevi sil"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </li>
  );
}