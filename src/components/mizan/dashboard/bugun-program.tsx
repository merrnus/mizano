import * as React from "react";
import { Link } from "@tanstack/react-router";
import { Check, Clock, MapPin, Plus, Sparkles } from "lucide-react";
import { format, isSameDay } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  useBugunGorevler,
  useGunlukGorevGuncelle,
  useGunlukGorevEkle,
} from "@/lib/gunluk-gorev";
import {
  useSablonlar,
  useHaftaKayitlari,
  useKayitEkle,
} from "@/lib/cetele-hooks";
import { useEtkinlikler } from "@/lib/takvim/hooks";
import { genisletListe } from "@/lib/takvim/tekrar";
import { haftaBaslangici, tarihFormat } from "@/lib/cetele-tarih";
import { BIRIM_ETIKET, type CeteleSablon } from "@/lib/cetele-tipleri";
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
  const haftaBas = haftaBaslangici(simdi);

  const { data: etkinlikler = [] } = useEtkinlikler(gunBas, gunSon);
  const { data: gorevler = [] } = useBugunGorevler(simdi);
  const { data: sablonlar = [] } = useSablonlar();
  const { data: kayitlar = [] } = useHaftaKayitlari(haftaBas);

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

  const tumGunOlaylar = olaylar.filter((o) => o.tum_gun);
  const saatliOlaylar = olaylar.filter((o) => !o.tum_gun);

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
          <div className="relative">
            {Array.from({ length: toplamSaat }, (_, i) => {
              const saat = basSaat + i;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => slotTikla(saat, 0)}
                  style={{ height: SAAT_PX }}
                  className="block w-full border-b border-border/40 text-left transition-colors hover:bg-muted/30"
                  aria-label={`${saatDiziGoster(i)} slotuna etkinlik ekle`}
                />
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
              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setAcikEtkinlik(o);
                  }}
                  className={cn(
                    "absolute left-1 right-1 z-10 overflow-hidden rounded-md px-1.5 py-1 text-left text-[11px] shadow-sm ring-1 transition-all hover:z-30 hover:shadow-md",
                    bitmis && "opacity-60",
                  )}
                  style={{
                    top,
                    height: h,
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

      {/* Saat dışı: görev + ritüel */}
      <SaatDisi
        tarihStr={tarihStr}
        gorevler={gorevler}
        sablonlar={sablonlar}
        kayitlar={kayitlar}
      />

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
  sablonlar,
  kayitlar,
}: {
  tarihStr: string;
  gorevler: ReturnType<typeof useBugunGorevler>["data"];
  sablonlar: CeteleSablon[];
  kayitlar: ReturnType<typeof useHaftaKayitlari>["data"];
}) {
  const saatsizGorevler = (gorevler ?? []).filter((g) => !g.saat);
  const rituelSablonlar = sablonlar.filter(
    (s) =>
      s.alan === "mana" &&
      (s.hedef_tipi === "gunluk" || s.hedef_tipi === "esnek"),
  );
  if (saatsizGorevler.length === 0 && rituelSablonlar.length === 0) return null;

  return (
    <div className="mt-2 border-t border-border/50 pt-2">
      <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Saat dışı
      </p>
      <ul className="flex flex-col divide-y divide-border/30">
        {saatsizGorevler.map((g) => (
          <SaatsizGorev key={g.id} gorev={g} />
        ))}
        {rituelSablonlar.map((s) => {
          const bugunMiktar = (kayitlar ?? [])
            .filter((k) => k.sablon_id === s.id && k.tarih === tarihStr)
            .reduce((a, k) => a + Number(k.miktar), 0);
          return (
            <RitualMini
              key={s.id}
              sablon={s}
              bugunMiktar={bugunMiktar}
              tarihStr={tarihStr}
            />
          );
        })}
      </ul>
    </div>
  );
}

function SaatsizGorev({
  gorev,
}: {
  gorev: NonNullable<ReturnType<typeof useBugunGorevler>["data"]>[number];
}) {
  const guncelle = useGunlukGorevGuncelle();
  return (
    <li className="flex items-center gap-2 px-2 py-2">
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
          "truncate text-sm",
          gorev.tamamlandi && "text-muted-foreground line-through",
        )}
      >
        {gorev.baslik}
      </span>
    </li>
  );
}

function RitualMini({
  sablon,
  bugunMiktar,
  tarihStr,
}: {
  sablon: CeteleSablon;
  bugunMiktar: number;
  tarihStr: string;
}) {
  const kayitEkle = useKayitEkle();
  const renk = `var(--mana)`;
  const ikili = sablon.birim === "ikili";
  const varsayilan = sablon.birim === "dakika" ? 5 : 1;
  const [miktarStr, setMiktarStr] = React.useState("");

  const ekle = (m: number) => {
    if (!Number.isFinite(m) || m <= 0) return;
    kayitEkle.mutate({ sablon_id: sablon.id, tarih: tarihStr, miktar: m });
    setMiktarStr("");
  };

  return (
    <li className="flex items-center gap-2 px-2 py-2">
      <span
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
        style={{
          background: `color-mix(in oklab, ${renk} 12%, transparent)`,
        }}
      >
        <Sparkles className="h-3.5 w-3.5" style={{ color: renk }} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{sablon.ad}</span>
        {bugunMiktar > 0 && (
          <span className="text-[10px] tabular-nums text-muted-foreground">
            bugün: {bugunMiktar} {BIRIM_ETIKET[sablon.birim]}
          </span>
        )}
      </span>
      {ikili ? (
        <button
          type="button"
          onClick={() => {
            if (bugunMiktar > 0) {
              toast.message("Bugün zaten işaretli");
              return;
            }
            ekle(1);
          }}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-full border-2",
            bugunMiktar > 0 && "opacity-60",
          )}
          style={{
            borderColor: `color-mix(in oklab, ${renk} 55%, transparent)`,
            color: renk,
          }}
        >
          <Check className="h-3.5 w-3.5" strokeWidth={3} />
        </button>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            ekle(Number(miktarStr) || varsayilan);
          }}
          className="flex shrink-0 items-center gap-1"
        >
          <Input
            type="number"
            inputMode="numeric"
            min={1}
            value={miktarStr}
            onChange={(e) => setMiktarStr(e.target.value)}
            placeholder={String(varsayilan)}
            className="h-7 w-12 px-1 text-center text-xs tabular-nums"
          />
          <button
            type="submit"
            className="flex h-7 w-7 items-center justify-center rounded-full border-2"
            style={{
              borderColor: `color-mix(in oklab, ${renk} 55%, transparent)`,
              color: renk,
            }}
          >
            <Plus className="h-3 w-3" strokeWidth={3} />
          </button>
        </form>
      )}
    </li>
  );
}