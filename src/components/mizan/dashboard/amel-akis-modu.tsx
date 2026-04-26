import * as React from "react";
import { createPortal } from "react-dom";
import {
  X,
  Check,
  Play,
  Pause,
  RotateCcw,
  ArrowRight,
  Coffee,
  Brain,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  useAmelKaynaklar,
  useAmelModulGuncelle,
} from "@/lib/amel-hooks";
import type { GunlukModulOge } from "@/components/mizan/dashboard/bugunun-mufredati";

const PRESETLER = [15, 25, 50] as const;

/**
 * Amel Akış Modu — modül kartı + Pomodoro.
 * Mana'nın Shorts'undan farklı: dikey scroll yok, manuel "Sonraki" / "Tamamla".
 */
export function AmelAkisModu({
  acik,
  ogeler,
  baslangicId,
  onClose,
}: {
  acik: boolean;
  ogeler: GunlukModulOge[];
  baslangicId: string | null;
  onClose: () => void;
}) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const modulGuncelle = useAmelModulGuncelle();

  // Açılışta sırayı sabitle — listeyi kilitle ki tamamlama sonrası index kaymasın
  const sira = React.useMemo(() => ogeler, [acik]);
  const baslangicIdx = React.useMemo(() => {
    if (!baslangicId) return 0;
    const i = sira.findIndex((o) => o.modul.id === baslangicId);
    return i === -1 ? 0 : i;
  }, [acik, baslangicId, sira]);

  const [aktifIdx, setAktifIdx] = React.useState(0);
  const [tamamlanan, setTamamlanan] = React.useState<Set<string>>(() => new Set());

  // Pomodoro state
  const [presetIdx, setPresetIdx] = React.useState(1); // 25 dk varsayılan
  const [mod, setMod] = React.useState<"odak" | "mola">("odak");
  const odakDk = PRESETLER[presetIdx];
  const molaDk = Math.max(5, Math.round(odakDk / 5));
  const toplamSn = (mod === "odak" ? odakDk : molaDk) * 60;
  const [kalanSn, setKalanSn] = React.useState(toplamSn);
  const [calisiyor, setCalisiyor] = React.useState(false);

  // Açılış reset
  React.useEffect(() => {
    if (acik) {
      setAktifIdx(baslangicIdx);
      setTamamlanan(new Set());
      setMod("odak");
      setCalisiyor(false);
      setPresetIdx(1);
    }
  }, [acik, baslangicIdx]);

  // Mod / preset değişince saati sıfırla
  React.useEffect(() => {
    setKalanSn(toplamSn);
    setCalisiyor(false);
  }, [presetIdx, mod, toplamSn]);

  // Aktif modül değişince Pomodoro'yu sıfırla (yeni iş, taze süre)
  React.useEffect(() => {
    setMod("odak");
    setCalisiyor(false);
    setKalanSn(odakDk * 60);
  }, [aktifIdx, odakDk]);

  // Saniye sayacı
  React.useEffect(() => {
    if (!acik || !calisiyor) return;
    const id = setInterval(() => {
      setKalanSn((s) => {
        if (s <= 1) {
          setCalisiyor(false);
          if (typeof window !== "undefined") {
            if ("vibrate" in navigator) navigator.vibrate?.(200);
            if ("Notification" in window && Notification.permission === "granted") {
              new Notification(
                mod === "odak" ? "Odak tamamlandı 🎯" : "Mola bitti",
                { body: mod === "odak" ? "Mola zamanı." : "Çalışmaya dönelim." },
              );
            }
          }
          setMod((m) => (m === "odak" ? "mola" : "odak"));
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [acik, calisiyor, mod]);

  const aktif = sira[aktifIdx];

  // Aktif kursa ait kaynaklar
  const { data: kaynaklar = [] } = useAmelKaynaklar(aktif?.kurs.id);

  const sonrakineGec = React.useCallback(() => {
    setAktifIdx((i) => Math.min(i + 1, sira.length));
  }, [sira.length]);

  const oncekineGec = React.useCallback(() => {
    setAktifIdx((i) => Math.max(i - 1, 0));
  }, []);

  const tamamla = React.useCallback(() => {
    if (!aktif) return;
    modulGuncelle.mutate(
      {
        id: aktif.modul.id,
        tamamlandi: true,
        tamamlanma: new Date().toISOString().slice(0, 10),
      },
      {
        onSuccess: () => {
          setTamamlanan((s) => {
            const ns = new Set(s);
            ns.add(aktif.modul.id);
            return ns;
          });
          window.setTimeout(() => sonrakineGec(), 200);
        },
      },
    );
  }, [aktif, modulGuncelle, sonrakineGec]);

  // Klavye: Space = play/pause, Enter = tamamla, → sonraki, ← önceki, Esc kapat
  React.useEffect(() => {
    if (!acik) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === " ") {
        e.preventDefault();
        setCalisiyor((c) => !c);
      } else if (e.key === "Enter") {
        e.preventDefault();
        tamamla();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        sonrakineGec();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        oncekineGec();
      }
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [acik, onClose, tamamla, sonrakineGec, oncekineGec]);

  if (!mounted || !acik) return null;
  if (sira.length === 0) {
    return createPortal(
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground">Bugün için modül yok.</p>
          <Button onClick={onClose} className="mt-4" variant="outline">
            Kapat
          </Button>
        </div>
      </div>,
      document.body,
    );
  }

  const renkVar = aktif?.alan?.renk ?? "var(--amel)";
  const tumuBitti = aktifIdx >= sira.length;

  const dk = Math.floor(kalanSn / 60).toString().padStart(2, "0");
  const sn = (kalanSn % 60).toString().padStart(2, "0");
  const ilerleme = 1 - kalanSn / toplamSn;
  const r = 110;
  const cevre = 2 * Math.PI * r;
  const offset = cevre * (1 - ilerleme);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{
        background: `radial-gradient(120% 80% at 50% 0%, color-mix(in oklab, ${renkVar} 14%, var(--background)) 0%, var(--background) 60%)`,
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Amel akış modu"
    >
      {/* Üst bar */}
      <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-3 px-5 py-4 sm:px-8 sm:py-5">
        <div className="flex items-center gap-2 rounded-full border border-border/60 bg-card/70 px-3 py-1.5 backdrop-blur">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: renkVar, boxShadow: `0 0 10px ${renkVar}` }}
          />
          <span
            className="text-[11px] font-semibold uppercase tracking-[0.22em]"
            style={{ color: renkVar }}
          >
            Amel
          </span>
          <span className="ml-1 text-[11px] text-muted-foreground tabular-nums">
            {Math.min(aktifIdx + 1, sira.length)} / {sira.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Modül noktaları */}
          <div className="hidden items-center gap-1 rounded-full border border-border/60 bg-card/70 px-2 py-1.5 backdrop-blur sm:flex">
            {sira.map((o, i) => {
              const tamam = tamamlanan.has(o.modul.id);
              const aktifMi = i === aktifIdx;
              return (
                <button
                  key={o.modul.id}
                  type="button"
                  onClick={() => setAktifIdx(i)}
                  className={cn(
                    "h-2 w-2 rounded-full transition-all",
                    aktifMi && "scale-150",
                  )}
                  style={{
                    backgroundColor: tamam
                      ? renkVar
                      : aktifMi
                        ? `color-mix(in oklab, ${renkVar} 70%, transparent)`
                        : "color-mix(in oklab, var(--muted-foreground) 25%, transparent)",
                    boxShadow: aktifMi ? `0 0 8px ${renkVar}` : undefined,
                  }}
                  aria-label={`${o.modul.baslik} kartına git`}
                  title={`${o.kurs.kod ?? o.kurs.ad} · ${o.modul.baslik}`}
                />
              );
            })}
          </div>
          <button
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card/80 text-muted-foreground backdrop-blur transition-colors hover:text-foreground"
            aria-label="Kapat"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* İçerik */}
      <div className="flex flex-1 items-center justify-center overflow-y-auto px-5 pb-8 pt-24 sm:px-8 sm:pt-28">
        {tumuBitti ? (
          <div className="mx-auto flex w-full max-w-md flex-col items-center text-center">
            <div
              className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-full"
              style={{
                backgroundColor: `color-mix(in oklab, ${renkVar} 18%, transparent)`,
                boxShadow: `0 0 24px color-mix(in oklab, ${renkVar} 35%, transparent)`,
              }}
            >
              <Check
                className="h-8 w-8"
                style={{ color: renkVar }}
                strokeWidth={3}
              />
            </div>
            <h2 className="text-2xl font-semibold tracking-tight">
              Bugünün müfredatı tamam
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {tamamlanan.size} modül işaretlendi.
            </p>
            <Button onClick={onClose} className="mt-6" size="lg">
              Bitir
            </Button>
          </div>
        ) : aktif ? (
          <div className="grid w-full max-w-3xl gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            {/* Sol: Modül bilgisi */}
            <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
              <div className="flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{
                    backgroundColor: renkVar,
                    boxShadow: `0 0 8px ${renkVar}`,
                  }}
                />
                <span
                  className="text-[11px] font-semibold uppercase tracking-[0.22em]"
                  style={{ color: renkVar }}
                >
                  {aktif.kurs.kod ?? aktif.kurs.ad}
                </span>
                <span className="text-[11px] text-muted-foreground tabular-nums">
                  · Modül {aktif.tamamlanan + 1}/{aktif.toplamModul}
                </span>
              </div>
              <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
                {aktif.modul.baslik}
              </h1>
              {aktif.modul.aciklama && (
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                  {aktif.modul.aciklama}
                </p>
              )}

              {kaynaklar.length > 0 && (
                <div className="mt-5">
                  <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                    Kaynaklar
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {kaynaklar.slice(0, 5).map((k) => (
                      <a
                        key={k.id}
                        href={k.url ?? "#"}
                        target={k.url ? "_blank" : undefined}
                        rel={k.url ? "noopener noreferrer" : undefined}
                        className="inline-flex items-center gap-1 rounded-md border border-border bg-background/40 px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
                      >
                        <ExternalLink className="h-2.5 w-2.5" />
                        <span className="max-w-[14ch] truncate">{k.baslik}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sağ: Pomodoro */}
            <div className="flex flex-col items-center rounded-2xl border border-border bg-card p-6 sm:p-7">
              <div className="mb-3 flex gap-1.5">
                <button
                  onClick={() => setMod("odak")}
                  className={cn(
                    "flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-medium transition-colors",
                    mod === "odak"
                      ? "text-background"
                      : "bg-muted text-muted-foreground hover:text-foreground",
                  )}
                  style={
                    mod === "odak" ? { backgroundColor: renkVar } : undefined
                  }
                >
                  <Brain className="h-3 w-3" /> Odak
                </button>
                <button
                  onClick={() => setMod("mola")}
                  className={cn(
                    "flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-medium transition-colors",
                    mod === "mola"
                      ? "bg-emerald-500 text-white"
                      : "bg-muted text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Coffee className="h-3 w-3" /> Mola
                </button>
              </div>

              <div className="relative my-2">
                <svg width="240" height="240" viewBox="0 0 240 240" className="-rotate-90">
                  <circle
                    cx="120"
                    cy="120"
                    r={r}
                    fill="none"
                    strokeWidth="10"
                    className="stroke-muted"
                  />
                  <circle
                    cx="120"
                    cy="120"
                    r={r}
                    fill="none"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={cevre}
                    strokeDashoffset={offset}
                    style={{
                      stroke: mod === "odak" ? renkVar : "rgb(16,185,129)",
                      transition: "stroke-dashoffset 1s linear",
                    }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="font-mono text-5xl font-light tabular-nums tracking-wider text-foreground">
                    {dk}:{sn}
                  </div>
                  <div className="mt-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    {mod === "odak" ? "Odaklan" : "Dinlen"}
                  </div>
                </div>
              </div>

              <div className="mt-2 flex gap-2">
                <Button
                  size="lg"
                  onClick={() => {
                    if (
                      typeof window !== "undefined" &&
                      "Notification" in window &&
                      Notification.permission === "default"
                    ) {
                      Notification.requestPermission();
                    }
                    setCalisiyor((c) => !c);
                  }}
                  className="min-w-28"
                  style={{
                    backgroundColor: calisiyor ? undefined : renkVar,
                    color: calisiyor ? undefined : "var(--background)",
                  }}
                  variant={calisiyor ? "outline" : "default"}
                >
                  {calisiyor ? (
                    <>
                      <Pause className="mr-1.5 h-4 w-4" /> Duraklat
                    </>
                  ) : (
                    <>
                      <Play className="mr-1.5 h-4 w-4 fill-current" /> Başlat
                    </>
                  )}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => {
                    setCalisiyor(false);
                    setKalanSn(toplamSn);
                  }}
                  aria-label="Sıfırla"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>

              <div className="mt-4 flex gap-1.5">
                {PRESETLER.map((p, i) => (
                  <button
                    key={p}
                    onClick={() => setPresetIdx(i)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-[11px] transition-colors",
                      presetIdx === i
                        ? "text-foreground"
                        : "border-border text-muted-foreground hover:text-foreground",
                    )}
                    style={
                      presetIdx === i
                        ? {
                            borderColor: `color-mix(in oklab, ${renkVar} 50%, transparent)`,
                            backgroundColor: `color-mix(in oklab, ${renkVar} 12%, transparent)`,
                          }
                        : undefined
                    }
                  >
                    {p} dk
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Alt aksiyon barı */}
      {!tumuBitti && aktif && (
        <footer className="border-t border-border/60 bg-card/60 px-5 py-3 backdrop-blur sm:px-8 sm:py-4">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
            <Button
              variant="outline"
              onClick={oncekineGec}
              disabled={aktifIdx === 0}
              size="sm"
            >
              ← Önceki
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={sonrakineGec}
                size="sm"
                aria-label="Bu modülü atla"
              >
                Atla
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
              <Button
                onClick={tamamla}
                disabled={modulGuncelle.isPending}
                size="sm"
                style={{
                  backgroundColor: renkVar,
                  color: "var(--background)",
                }}
              >
                <Check className="mr-1 h-4 w-4" />
                Tamamlandı
              </Button>
            </div>
          </div>
        </footer>
      )}
    </div>,
    document.body,
  );
}
