import * as React from "react";
import { createPortal } from "react-dom";
import { X, Check, SkipForward, Minus, Plus, Sparkles } from "lucide-react";
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
 * AkışModu — alan başına tam ekran, kart kart hızlı işaretleme.
 * Sadece bugüne ait, henüz hedefe ulaşmamış şablonları sırayla gösterir.
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

  // Mount + ESC + body scroll lock
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    if (!acik) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [acik, onClose]);

  // Alanın bugüne ait, hedefe ulaşmamış şablon listesini sabitle (oturum başında)
  const baslangictakiSira = React.useMemo(() => {
    if (!alan) return [];
    return sablonlar
      .filter((s) => s.alan === alan)
      .filter((s) => {
        const toplam = kayitlar
          .filter((k) => k.sablon_id === s.id && k.tarih === tarihStr)
          .reduce((a, k) => a + Number(k.miktar), 0);
        return toplam < Number(s.hedef_deger);
      });
    // Önemli: kayitlar değiştiğinde sırayı kaydırmamak için sadece açılışta hesapla
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [acik, alan]);

  const [idx, setIdx] = React.useState(0);
  const [tamamlananIds, setTamamlananIds] = React.useState<Set<string>>(
    () => new Set(),
  );
  const [atlananIds, setAtlananIds] = React.useState<Set<string>>(
    () => new Set(),
  );
  const [yeniMiktar, setYeniMiktar] = React.useState("");
  const [flash, setFlash] = React.useState(false);
  const baslangicZamani = React.useRef<number>(Date.now());

  React.useEffect(() => {
    if (acik) {
      setIdx(0);
      setTamamlananIds(new Set());
      setAtlananIds(new Set());
      setYeniMiktar("");
      baslangicZamani.current = Date.now();
    }
  }, [acik, alan]);

  if (!mounted || !acik || !alan) return null;

  const renkVar = `var(--${alan})`;
  const aktif = baslangictakiSira[idx];
  const ikili = aktif?.birim === "ikili";
  const adim = aktif?.birim === "dakika" ? 5 : 1;

  // Bu kartın anlık toplamı (canlı kayıtlardan)
  const aktifToplam = aktif
    ? kayitlar
        .filter((k) => k.sablon_id === aktif.id && k.tarih === tarihStr)
        .reduce((a, k) => a + Number(k.miktar), 0)
    : 0;

  const tumuBitti = baslangictakiSira.length === 0 || idx >= baslangictakiSira.length;
  const sureSn = Math.max(1, Math.round((Date.now() - baslangicZamani.current) / 1000));
  const sureMetin =
    sureSn < 60 ? `${sureSn} sn` : `${Math.round(sureSn / 60)} dk`;

  const sonrakiKart = () => {
    setYeniMiktar("");
    setIdx((i) => i + 1);
  };

  const flashGoster = () => {
    setFlash(true);
    window.setTimeout(() => setFlash(false), 700);
  };

  const tamamla = async () => {
    if (!aktif) return;
    const eksik = Math.max(1, Number(aktif.hedef_deger) - aktifToplam);
    const miktar = ikili ? 1 : eksik;
    try {
      await ekle.mutateAsync({
        sablon_id: aktif.id,
        tarih: tarihStr,
        miktar,
      });
      setTamamlananIds((s) => new Set(s).add(aktif.id));
      flashGoster();
      window.setTimeout(sonrakiKart, 250);
    } catch (_e) {
      // sessizce bırak; CeteleHucre'deki hata flow'unu burada da basit tutuyoruz
    }
  };

  const ozelEkle = async () => {
    if (!aktif) return;
    const m = Number(yeniMiktar);
    if (!Number.isFinite(m) || m <= 0) return;
    try {
      await ekle.mutateAsync({
        sablon_id: aktif.id,
        tarih: tarihStr,
        miktar: m,
      });
      const yeniToplam = aktifToplam + m;
      if (yeniToplam >= Number(aktif.hedef_deger)) {
        setTamamlananIds((s) => new Set(s).add(aktif.id));
        flashGoster();
        window.setTimeout(sonrakiKart, 250);
      } else {
        setYeniMiktar("");
      }
    } catch (_e) {
      /* no-op */
    }
  };

  const atla = () => {
    if (!aktif) return;
    setAtlananIds((s) => new Set(s).add(aktif.id));
    sonrakiKart();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{
        // Hafif tonlu zemin — alanın renginden krem/koyuya doğru
        background: `radial-gradient(120% 80% at 50% 0%, color-mix(in oklab, ${renkVar} 14%, var(--background)) 0%, var(--background) 60%)`,
        // pill-glow renk değişkeni: flash ve nefes efektleri burada okur
        ["--pill-glow" as string]: renkVar,
      }}
      role="dialog"
      aria-modal="true"
      aria-label={`${ALAN_ETIKET[alan]} akış modu`}
    >
      {/* Üst bar */}
      <header className="flex items-center justify-between gap-3 px-5 py-4 sm:px-8 sm:py-5">
        <div className="flex items-center gap-2">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: renkVar, boxShadow: `0 0 10px ${renkVar}` }}
          />
          <span
            className="text-xs font-semibold uppercase tracking-[0.22em]"
            style={{ color: renkVar }}
          >
            {ALAN_ETIKET[alan]} akışı
          </span>
          {!tumuBitti && baslangictakiSira.length > 0 && (
            <span className="ml-2 text-xs text-muted-foreground tabular-nums">
              {Math.min(idx + 1, baslangictakiSira.length)} / {baslangictakiSira.length}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card/80 text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Kapat"
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      {/* İlerleme noktaları */}
      {!tumuBitti && baslangictakiSira.length > 0 && (
        <div className="flex items-center justify-center gap-1.5 px-5 pb-2">
          {baslangictakiSira.map((s, i) => {
            const tamam = tamamlananIds.has(s.id);
            const atlandi = atlananIds.has(s.id);
            const aktifMi = i === idx;
            return (
              <span
                key={s.id}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  aktifMi ? "w-6" : "w-1.5",
                )}
                style={{
                  backgroundColor: tamam
                    ? renkVar
                    : atlandi
                      ? "color-mix(in oklab, var(--muted-foreground) 50%, transparent)"
                      : aktifMi
                        ? `color-mix(in oklab, ${renkVar} 60%, transparent)`
                        : "color-mix(in oklab, var(--muted-foreground) 25%, transparent)",
                }}
              />
            );
          })}
        </div>
      )}

      {/* Gövde */}
      <main className="flex flex-1 items-center justify-center px-5 py-6 sm:px-8">
        {tumuBitti ? (
          <div className="mx-auto flex w-full max-w-md flex-col items-center text-center animate-fade-in">
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
              {tamamlananIds.size > 0 ? "Akış tamamlandı" : "Bugün için hepsi tamam"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {tamamlananIds.size > 0 ? (
                <>
                  {tamamlananIds.size} öğe işaretlendi
                  {atlananIds.size > 0 ? `, ${atlananIds.size} atlandı` : ""}.
                  <span className="ml-1 text-foreground/80">{sureMetin} sürdü.</span>
                </>
              ) : (
                <>{ALAN_ETIKET[alan]} alanında bugün için işaretlenecek bir şey kalmamış.</>
              )}
            </p>
            <Button onClick={onClose} className="mt-6 h-10 px-6">
              Kapat
            </Button>
          </div>
        ) : aktif ? (
          <div
            key={aktif.id}
            className={cn(
              "mx-auto flex w-full max-w-md flex-col rounded-2xl border border-border bg-card p-7 sm:p-9 animate-fade-in",
              flash && "mizan-flow-flash",
            )}
          >
            <p
              className="text-[11px] font-medium uppercase tracking-[0.22em]"
              style={{ color: renkVar }}
            >
              {ALAN_ETIKET[alan]}
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-[2rem]">
              {aktif.ad}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Hedef <span className="font-medium text-foreground">{Number(aktif.hedef_deger)}</span>{" "}
              {aktif.birim === "ikili" ? "" : aktif.birim}
              {aktifToplam > 0 && !ikili && (
                <>
                  {" • "}şu an{" "}
                  <span className="font-medium text-foreground">{aktifToplam}</span>
                </>
              )}
            </p>

            {!ikili && (
              <div className="mt-5 flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  disabled={aktifToplam <= 0 || ekle.isPending}
                  onClick={() => {
                    const azalt = Math.min(adim, aktifToplam);
                    if (azalt <= 0) return;
                    ekle.mutate({
                      sablon_id: aktif.id,
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
                      sablon_id: aktif.id,
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
                    placeholder={aktif.birim}
                    value={yeniMiktar}
                    onChange={(e) => setYeniMiktar(e.target.value)}
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
                    onClick={ozelEkle}
                  >
                    Ekle
                  </Button>
                </div>
              </div>
            )}

            <Button
              onClick={tamamla}
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
                : aktifToplam > 0
                  ? `Hedefi tamamla (+${Math.max(1, Number(aktif.hedef_deger) - aktifToplam)})`
                  : `Hedefi tamamla (+${Number(aktif.hedef_deger)})`}
            </Button>

            <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
              <button
                onClick={atla}
                className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
              >
                <SkipForward className="h-3.5 w-3.5" />
                Atla
              </button>
              <span className="tabular-nums">{sureMetin}</span>
            </div>
          </div>
        ) : null}
      </main>
    </div>,
    document.body,
  );
}