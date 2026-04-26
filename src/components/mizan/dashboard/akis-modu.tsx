import * as React from "react";
import { createPortal } from "react-dom";
import {
  X,
  Check,
  Minus,
  Plus,
  Sparkles,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  ALAN_ETIKET,
  type CeteleAlan,
  type CeteleSablon,
  type CeteleKayit,
} from "@/lib/cetele-tipleri";
import { useKayitEkle } from "@/lib/cetele-hooks";

/**
 * AkışModu — YouTube Shorts tarzı dikey kaydırmalı tam ekran çetele akışı.
 * Her şablon kendi viewport-yüksekliğinde slide; native scroll-snap ile geçiş.
 * Kontroller: dikey swipe (mobil), wheel/trackpad (desktop), ↑↓ + Space (klavye), ESC kapatır.
 */
export function AkisModu({
  acik,
  alan,
  sablonlar,
  kayitlar,
  tarihStr,
  onClose,
}: {
  acik: boolean;
  alan: CeteleAlan | null;
  sablonlar: CeteleSablon[];
  kayitlar: CeteleKayit[];
  tarihStr: string;
  onClose: () => void;
}) {
  const ekle = useKayitEkle();

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  // Oturumun sırası — açılışta sabitlenir, canlı kayıt değişikliğinde kart kaymasın
  const baslangictakiSira = React.useMemo(() => {
    if (!alan) return [] as CeteleSablon[];
    return sablonlar
      .filter((s) => s.alan === alan)
      .filter((s) => {
        const toplam = kayitlar
          .filter((k) => k.sablon_id === s.id && k.tarih === tarihStr)
          .reduce((a, k) => a + Number(k.miktar), 0);
        return toplam < Number(s.hedef_deger);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [acik, alan]);

  // Kart sayısı + 1 (sondaki "tamamlandı" ekranı). Hiç kart yoksa direkt tamamlandı.
  const toplamKart = baslangictakiSira.length;
  const sonIdx = toplamKart; // tamamlandı ekranının indexi

  const [aktifIdx, setAktifIdx] = React.useState(0);
  const [tamamlananIds, setTamamlananIds] = React.useState<Set<string>>(() => new Set());
  const [atlananIds, setAtlananIds] = React.useState<Set<string>>(() => new Set());
  const [yeniMiktarlar, setYeniMiktarlar] = React.useState<Record<string, string>>({});
  const [flashId, setFlashId] = React.useState<string | null>(null);
  const [tikSn, setTikSn] = React.useState(0);
  const baslangicZamani = React.useRef<number>(Date.now());

  const scrollerRef = React.useRef<HTMLDivElement | null>(null);
  const cardRefs = React.useRef<Array<HTMLElement | null>>([]);

  // Açılış reset
  React.useEffect(() => {
    if (acik) {
      setAktifIdx(0);
      setTamamlananIds(new Set());
      setAtlananIds(new Set());
      setYeniMiktarlar({});
      setFlashId(null);
      baslangicZamani.current = Date.now();
      // İlk karta scroll
      requestAnimationFrame(() => {
        scrollerRef.current?.scrollTo({ top: 0, behavior: "auto" });
      });
    }
  }, [acik]);

  // Süre tiki
  React.useEffect(() => {
    if (!acik) return;
    const id = setInterval(() => setTikSn((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [acik]);

  // Belirli karta yumuşak scroll
  const kartaGit = React.useCallback((idx: number) => {
    const el = cardRefs.current[idx];
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  // Klavye + body scroll lock + ESC
  React.useEffect(() => {
    if (!acik) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      // Form içindeyken ↑↓/space ele alma — kullanıcı miktar yazıyor olabilir
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) {
        return;
      }
      if (e.key === "ArrowDown" || e.key === "PageDown" || (e.key === " " && !e.shiftKey)) {
        e.preventDefault();
        kartaGit(Math.min(aktifIdx + 1, sonIdx));
      } else if (e.key === "ArrowUp" || e.key === "PageUp" || (e.key === " " && e.shiftKey)) {
        e.preventDefault();
        kartaGit(Math.max(aktifIdx - 1, 0));
      } else if (e.key === "Home") {
        e.preventDefault();
        kartaGit(0);
      } else if (e.key === "End") {
        e.preventDefault();
        kartaGit(sonIdx);
      }
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [acik, onClose, kartaGit, aktifIdx, sonIdx]);

  // IntersectionObserver — hangi kart görünür?
  React.useEffect(() => {
    if (!acik) return;
    const root = scrollerRef.current;
    if (!root) return;
    const obs = new IntersectionObserver(
      (entries) => {
        // En çok görünen kartı seç
        let enIyi: { idx: number; oran: number } | null = null;
        entries.forEach((en) => {
          const idxStr = (en.target as HTMLElement).dataset.idx;
          if (idxStr == null) return;
          const i = Number(idxStr);
          if (en.isIntersecting && (!enIyi || en.intersectionRatio > enIyi.oran)) {
            enIyi = { idx: i, oran: en.intersectionRatio };
          }
        });
        if (enIyi && enIyi.oran > 0.6) {
          setAktifIdx((prev) => {
            if (prev === enIyi!.idx) return prev;
            // İleri kaydırıldıysa ve önceki kart tamamlanmadıysa "atlandı" işaretle
            if (enIyi!.idx > prev) {
              const oncekiSablon = baslangictakiSira[prev];
              if (oncekiSablon && !tamamlananIds.has(oncekiSablon.id)) {
                setAtlananIds((s) => {
                  if (s.has(oncekiSablon.id)) return s;
                  const ns = new Set(s);
                  ns.add(oncekiSablon.id);
                  return ns;
                });
              }
            } else {
              // Geri kaydırıldıysa hedef kartı atlananlardan çıkar
              const hedefSablon = baslangictakiSira[enIyi!.idx];
              if (hedefSablon && atlananIds.has(hedefSablon.id)) {
                setAtlananIds((s) => {
                  const ns = new Set(s);
                  ns.delete(hedefSablon.id);
                  return ns;
                });
              }
            }
            return enIyi!.idx;
          });
        }
      },
      { root, threshold: [0.3, 0.6, 0.9] },
    );
    cardRefs.current.forEach((el) => el && obs.observe(el));
    return () => obs.disconnect();
  }, [acik, baslangictakiSira, tamamlananIds, atlananIds]);

  if (!mounted || !acik || !alan) return null;

  const renkVar = `var(--${alan})`;
  const tumuBitti = toplamKart === 0 || aktifIdx >= sonIdx;

  // Aktif kart bilgisi (tamamlandı ekranında null)
  const aktif = aktifIdx < toplamKart ? baslangictakiSira[aktifIdx] : null;

  const sureSn = Math.max(1, Math.round((Date.now() - baslangicZamani.current) / 1000));
  const sureMetin = sureSn < 60 ? `${sureSn} sn` : `${Math.round(sureSn / 60)} dk`;
  // tikSn dependency placeholder — yeniden render tetikler
  void tikSn;

  const flashGoster = (id: string) => {
    setFlashId(id);
    window.setTimeout(() => setFlashId((cur) => (cur === id ? null : cur)), 700);
  };

  const sonrakineGec = (mevcutIdx: number) => {
    window.setTimeout(() => kartaGit(Math.min(mevcutIdx + 1, sonIdx)), 250);
  };

  const tamamla = async (s: CeteleSablon, idx: number) => {
    const ikili = s.birim === "ikili";
    const toplam = kayitlar
      .filter((k) => k.sablon_id === s.id && k.tarih === tarihStr)
      .reduce((a, k) => a + Number(k.miktar), 0);
    const eksik = Math.max(1, Number(s.hedef_deger) - toplam);
    const miktar = ikili ? 1 : eksik;
    try {
      await ekle.mutateAsync({ sablon_id: s.id, tarih: tarihStr, miktar });
      setTamamlananIds((set) => {
        const ns = new Set(set);
        ns.add(s.id);
        return ns;
      });
      // Tamamlanınca atlanmışsa kaldır
      setAtlananIds((set) => {
        if (!set.has(s.id)) return set;
        const ns = new Set(set);
        ns.delete(s.id);
        return ns;
      });
      flashGoster(s.id);
      sonrakineGec(idx);
    } catch (_e) {
      /* sessizce yut */
    }
  };

  const ozelEkle = async (s: CeteleSablon, idx: number) => {
    const m = Number(yeniMiktarlar[s.id] ?? "");
    if (!Number.isFinite(m) || m <= 0) return;
    const toplamSimdi = kayitlar
      .filter((k) => k.sablon_id === s.id && k.tarih === tarihStr)
      .reduce((a, k) => a + Number(k.miktar), 0);
    try {
      await ekle.mutateAsync({ sablon_id: s.id, tarih: tarihStr, miktar: m });
      const yeniToplam = toplamSimdi + m;
      if (yeniToplam >= Number(s.hedef_deger)) {
        setTamamlananIds((set) => {
          const ns = new Set(set);
          ns.add(s.id);
          return ns;
        });
        setAtlananIds((set) => {
          if (!set.has(s.id)) return set;
          const ns = new Set(set);
          ns.delete(s.id);
          return ns;
        });
        flashGoster(s.id);
        sonrakineGec(idx);
      } else {
        setYeniMiktarlar((m) => ({ ...m, [s.id]: "" }));
      }
    } catch (_e) {
      /* no-op */
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{
        background: `radial-gradient(120% 80% at 50% 0%, color-mix(in oklab, ${renkVar} 14%, var(--background)) 0%, var(--background) 60%)`,
        ["--pill-glow" as string]: renkVar,
      }}
      role="dialog"
      aria-modal="true"
      aria-label={`${ALAN_ETIKET[alan]} akış modu`}
    >
      {/* Sabit üst bar */}
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
            {ALAN_ETIKET[alan]}
          </span>
          {toplamKart > 0 && (
            <span className="ml-1 text-[11px] text-muted-foreground tabular-nums">
              {Math.min(aktifIdx + 1, toplamKart)} / {toplamKart}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden rounded-full border border-border/60 bg-card/70 px-3 py-1.5 text-[11px] tabular-nums text-muted-foreground backdrop-blur sm:inline-block">
            {sureMetin}
          </span>
          <button
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card/80 text-muted-foreground backdrop-blur transition-colors hover:text-foreground"
            aria-label="Kapat"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Sağ dikey ilerleme şeridi (Shorts tarzı) */}
      {toplamKart > 0 && (
        <div className="pointer-events-none absolute right-2 top-1/2 z-20 hidden -translate-y-1/2 sm:block">
          <div className="pointer-events-auto flex flex-col items-center gap-1.5 rounded-full border border-border/60 bg-card/70 p-1.5 backdrop-blur">
            {baslangictakiSira.map((s, i) => {
              const tamam = tamamlananIds.has(s.id);
              const atlandi = atlananIds.has(s.id);
              const aktifMi = i === aktifIdx;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => kartaGit(i)}
                  className={cn(
                    "flex h-3 w-3 items-center justify-center rounded-full transition-all",
                    aktifMi && "scale-125",
                  )}
                  style={{
                    backgroundColor: tamam
                      ? renkVar
                      : aktifMi
                        ? `color-mix(in oklab, ${renkVar} 70%, transparent)`
                        : atlandi
                          ? "color-mix(in oklab, var(--muted-foreground) 35%, transparent)"
                          : "color-mix(in oklab, var(--muted-foreground) 22%, transparent)",
                    boxShadow: aktifMi ? `0 0 10px ${renkVar}` : undefined,
                  }}
                  aria-label={`${s.ad} kartına git`}
                  title={s.ad}
                >
                  {tamam && <Check className="h-2 w-2 text-background" strokeWidth={4} />}
                </button>
              );
            })}
            {/* Bitiş noktası */}
            <button
              type="button"
              onClick={() => kartaGit(sonIdx)}
              className={cn(
                "mt-0.5 flex h-3 w-3 items-center justify-center rounded-full transition-all",
                aktifIdx === sonIdx && "scale-125",
              )}
              style={{
                backgroundColor:
                  aktifIdx === sonIdx
                    ? renkVar
                    : "color-mix(in oklab, var(--muted-foreground) 22%, transparent)",
                boxShadow: aktifIdx === sonIdx ? `0 0 10px ${renkVar}` : undefined,
              }}
              aria-label="Bitir"
            >
              <Sparkles className="h-2 w-2 text-background" />
            </button>
          </div>
        </div>
      )}

      {/* Kaydırıcı — tüm kartlar dikey snap içinde */}
      <div
        ref={scrollerRef}
        className="h-[100dvh] flex-1 snap-y snap-mandatory overflow-y-auto overscroll-contain scroll-smooth"
        style={{ scrollbarWidth: "none" }}
      >
        <style>{`
          .mizan-shorts-scroller::-webkit-scrollbar { display: none; }
        `}</style>

        {/* Kartlar */}
        {baslangictakiSira.map((s, i) => {
          const ikili = s.birim === "ikili";
          const adim = s.birim === "dakika" ? 5 : 1;
          const toplam = kayitlar
            .filter((k) => k.sablon_id === s.id && k.tarih === tarihStr)
            .reduce((a, k) => a + Number(k.miktar), 0);
          const yeniMiktar = yeniMiktarlar[s.id] ?? "";

          return (
            <section
              key={s.id}
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              data-idx={i}
              className="flex h-[100dvh] w-full snap-start snap-always items-center justify-center px-5 pb-20 pt-24 sm:px-8"
            >
              <div
                className={cn(
                  "mx-auto flex w-full max-w-md flex-col rounded-2xl border border-border bg-card p-7 sm:p-9",
                  flashId === s.id && "mizan-flow-flash",
                )}
              >
                <p
                  className="text-[11px] font-medium uppercase tracking-[0.22em]"
                  style={{ color: renkVar }}
                >
                  {ALAN_ETIKET[alan]}
                </p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-[2rem]">
                  {s.ad}
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Hedef{" "}
                  <span className="font-medium text-foreground">
                    {Number(s.hedef_deger)}
                  </span>{" "}
                  {s.birim === "ikili" ? "" : s.birim}
                  {toplam > 0 && !ikili && (
                    <>
                      {" • "}şu an{" "}
                      <span className="font-medium text-foreground">{toplam}</span>
                    </>
                  )}
                </p>

                {!ikili && (
                  <div className="mt-5 flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9"
                      disabled={toplam <= 0 || ekle.isPending}
                      onClick={() => {
                        const azalt = Math.min(adim, toplam);
                        if (azalt <= 0) return;
                        ekle.mutate({
                          sablon_id: s.id,
                          tarih: tarihStr,
                          miktar: -azalt,
                        });
                      }}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9"
                      disabled={ekle.isPending}
                      onClick={() => {
                        ekle.mutate({
                          sablon_id: s.id,
                          tarih: tarihStr,
                          miktar: adim,
                        });
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <span className="text-xs text-muted-foreground">+/- {adim}</span>
                    <div className="ml-auto flex items-center gap-1.5">
                      <Input
                        type="number"
                        min={0}
                        placeholder={s.birim}
                        value={yeniMiktar}
                        onChange={(e) =>
                          setYeniMiktarlar((m) => ({ ...m, [s.id]: e.target.value }))
                        }
                        className="h-9 w-20 text-sm"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-9 px-3 text-xs"
                        disabled={
                          !yeniMiktar ||
                          isNaN(Number(yeniMiktar)) ||
                          Number(yeniMiktar) <= 0 ||
                          ekle.isPending
                        }
                        onClick={() => ozelEkle(s, i)}
                      >
                        Ekle
                      </Button>
                    </div>
                  </div>
                )}

                <Button
                  onClick={() => tamamla(s, i)}
                  disabled={ekle.isPending}
                  className="mt-6 h-12 w-full text-base font-semibold"
                  style={{
                    backgroundColor: renkVar,
                    color: "var(--background)",
                  }}
                >
                  <Check className="mr-2 h-5 w-5" />
                  {ikili
                    ? "Tamamlandı"
                    : toplam > 0
                      ? `Hedefi tamamla (+${Math.max(1, Number(s.hedef_deger) - toplam)})`
                      : `Hedefi tamamla (+${Number(s.hedef_deger)})`}
                </Button>

                {/* İpucu: ilk kart ise swipe işareti */}
                {i === 0 && (
                  <div className="mt-5 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
                    <ChevronUp className="h-3.5 w-3.5 animate-bounce" />
                    <span>Atlamak için yukarı kaydır</span>
                  </div>
                )}
              </div>
            </section>
          );
        })}

        {/* Bitiş ekranı (her zaman var — kart yoksa direkt burada) */}
        <section
          ref={(el) => {
            cardRefs.current[sonIdx] = el;
          }}
          data-idx={sonIdx}
          className="flex h-[100dvh] w-full snap-start snap-always items-center justify-center px-5 pb-20 pt-24 sm:px-8"
        >
          <div className="mx-auto flex w-full max-w-md flex-col items-center text-center">
            <div
              className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-full"
              style={{
                backgroundColor: `color-mix(in oklab, ${renkVar} 16%, transparent)`,
                boxShadow: `0 0 32px color-mix(in oklab, ${renkVar} 35%, transparent)`,
              }}
            >
              <Sparkles className="h-7 w-7" style={{ color: renkVar }} />
            </div>
            <h2 className="text-2xl font-semibold tracking-tight">
              {tamamlananIds.size > 0
                ? "Akış tamamlandı"
                : toplamKart === 0
                  ? "Bugün için hepsi tamam"
                  : "Akışın sonuna geldin"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {toplamKart === 0 ? (
                <>{ALAN_ETIKET[alan]} alanında bugün için işaretlenecek bir şey kalmamış.</>
              ) : (
                <>
                  {tamamlananIds.size} öğe işaretlendi
                  {atlananIds.size > 0 ? `, ${atlananIds.size} atlandı` : ""}.
                  <span className="ml-1 text-foreground/80">{sureMetin} sürdü.</span>
                </>
              )}
            </p>
            <Button onClick={onClose} className="mt-6 h-10 px-6">
              Kapat
            </Button>
            {tumuBitti && atlananIds.size > 0 && (
              <button
                onClick={() => {
                  // İlk atlanan karta dön
                  const ilkAtlananIdx = baslangictakiSira.findIndex((s) =>
                    atlananIds.has(s.id),
                  );
                  if (ilkAtlananIdx >= 0) kartaGit(ilkAtlananIdx);
                }}
                className="mt-3 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                Atlananlara dön ({atlananIds.size})
              </button>
            )}
          </div>
        </section>
      </div>
    </div>,
    document.body,
  );
}
