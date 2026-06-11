import * as React from "react";
import { Link } from "@tanstack/react-router";
import {
  Check,
  ChevronRight,
  Clock,
  MapPin,
  Plus,
  RotateCcw,
  Sparkles,
  X,
} from "lucide-react";
import { differenceInMinutes, format, isSameDay } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

import {
  useBugunGorevler,
  useGunlukGorevEkle,
  useGunlukGorevGuncelle,
  useGunlukGorevSil,
  useGunSifirla,
  type GunlukGorev,
} from "@/lib/gunluk-gorev";
import {
  useSablonlar,
  useHaftaKayitlari,
  useKayitEkle,
} from "@/lib/cetele-hooks";
import { useEtkinlikler, genisletEtkinlikleri } from "@/lib/takvim/hooks";
import { haftaBaslangici, tarihFormat } from "@/lib/cetele-tarih";
import { BIRIM_ETIKET, type CeteleAlan, type CeteleSablon } from "@/lib/cetele-tipleri";
import type { TakvimEtkinlik } from "@/lib/takvim/tipler";
import { EtkinlikDetaySheet } from "./etkinlik-detay-sheet";

/* -------------------------------------------------------------------------- */
/*  Birleşik akış öğesi                                                       */
/* -------------------------------------------------------------------------- */

type EtkinlikOge = {
  tip: "etkinlik";
  id: string;
  saat: Date;
  bitis: Date;
  tumGun: boolean;
  baslik: string;
  alan: CeteleAlan;
  konum: string | null;
  durum: "gecmis" | "simdi" | "gelecek";
  ham: TakvimEtkinlik;
};

type GorevOge = {
  tip: "gorev";
  id: string;
  saatStr: string | null; // HH:MM:SS
  baslik: string;
  tamamlandi: boolean;
  sureDk: number | null;
  ham: GunlukGorev;
};

type RitualOge = {
  tip: "ritual";
  id: string; // sablon.id
  baslik: string;
  alan: CeteleAlan;
  hedef: number;
  toplam: number;
  birim: CeteleSablon["birim"];
  ham: CeteleSablon;
};

type AkisOge = EtkinlikOge | GorevOge | RitualOge;

function dakikadanSaat(s: string | null): number | null {
  if (!s) return null;
  const [hh, mm] = s.split(":");
  return Number(hh) * 60 + Number(mm);
}

/* -------------------------------------------------------------------------- */
/*  Ana component                                                             */
/* -------------------------------------------------------------------------- */

export function BugunAkisi({ simdi }: { simdi: Date }) {
  const tarihStr = tarihFormat(simdi);
  const gunBas = React.useMemo(() => {
    const d = new Date(simdi);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [simdi.getFullYear(), simdi.getMonth(), simdi.getDate()]);
  const gunSon = React.useMemo(() => {
    const d = new Date(gunBas);
    d.setHours(23, 59, 59, 999);
    return d;
  }, [gunBas]);
  const haftaBas = haftaBaslangici(simdi);

  const { data: gorevler = [] } = useBugunGorevler(simdi);
  const { data: etkinlikler = [] } = useEtkinlikler(gunBas, gunSon);
  const { data: sablonlar = [] } = useSablonlar();
  const { data: kayitlar = [] } = useHaftaKayitlari(haftaBas);

  const gorevGuncelle = useGunlukGorevGuncelle();
  const gorevSil = useGunlukGorevSil();
  const sifirla = useGunSifirla();
  const kayitEkle = useKayitEkle();

  const [acikEtkinlik, setAcikEtkinlik] = React.useState<TakvimEtkinlik | null>(null);
  const [bitenAcik, setBitenAcik] = React.useState(false);

  /* -------- veri normalize -------- */

  const etkinlikOgeleri: EtkinlikOge[] = React.useMemo(() => {
    const olaylar = genisletEtkinlikleri(etkinlikler, gunBas, gunSon).filter((o) =>
      isSameDay(o.olayBaslangic, simdi),
    );
    const t = simdi.getTime();
    return olaylar.map((o) => {
      const baslangic = o.olayBaslangic;
      const bitis = o.olayBitis;
      const durum: EtkinlikOge["durum"] =
        bitis.getTime() <= t
          ? "gecmis"
          : baslangic.getTime() <= t
            ? "simdi"
            : "gelecek";
      return {
        tip: "etkinlik" as const,
        id: o.id,
        saat: baslangic,
        bitis,
        tumGun: o.tum_gun,
        baslik: o.baslik,
        alan: o.alan,
        konum: o.konum,
        durum,
        ham: o,
      };
    });
  }, [etkinlikler, gunBas, gunSon, simdi]);

  const gorevOgeleri: GorevOge[] = React.useMemo(
    () =>
      gorevler.map((g) => ({
        tip: "gorev" as const,
        id: g.id,
        saatStr: g.saat,
        baslik: g.baslik,
        tamamlandi: g.tamamlandi,
        sureDk: g.tahmini_sure_dk,
        ham: g,
      })),
    [gorevler],
  );

  const ritualOgeleri: RitualOge[] = React.useMemo(() => {
    return sablonlar
      .filter((s) => s.alan === "mana" && s.hedef_tipi === "gunluk")
      .map((s) => {
        const toplam = kayitlar
          .filter((k) => k.sablon_id === s.id && k.tarih === tarihStr)
          .reduce((a, k) => a + Number(k.miktar), 0);
        return {
          tip: "ritual" as const,
          id: s.id,
          baslik: s.ad,
          alan: "mana" as CeteleAlan,
          hedef: Number(s.hedef_deger),
          toplam,
          birim: s.birim,
          ham: s,
        };
      })
      .filter((r) => r.toplam < r.hedef);
  }, [sablonlar, kayitlar, tarihStr]);

  /* -------- gruplandırma & sıralama -------- */

  const { aktifSirali, bitenler } = React.useMemo(() => {
    const biten: AkisOge[] = [];
    const aktif: AkisOge[] = [];

    for (const g of gorevOgeleri) (g.tamamlandi ? biten : aktif).push(g);
    for (const e of etkinlikOgeleri) (e.durum === "gecmis" ? biten : aktif).push(e);
    for (const r of ritualOgeleri) aktif.push(r);

    // Aktifleri sırala: "şimdi" en üstte, sonra saatliler kronolojik,
    // sonra saatsiz görevler (manuel sıra), sonra ritüeller (mana sırası).
    aktif.sort((a, b) => {
      const aRank = rank(a);
      const bRank = rank(b);
      if (aRank !== bRank) return aRank - bRank;
      const aDk = saatDk(a);
      const bDk = saatDk(b);
      if (aDk != null && bDk != null) return aDk - bDk;
      if (aDk != null) return -1;
      if (bDk != null) return 1;
      return manualSira(a) - manualSira(b);
    });
    biten.sort((a, b) => bitenAt(b).localeCompare(bitenAt(a)));
    return { aktifSirali: aktif, bitenler: biten };
  }, [etkinlikOgeleri, gorevOgeleri, ritualOgeleri]);

  const bos = aktifSirali.length === 0 && bitenler.length === 0;

  /* -------- aksiyonlar -------- */

  const tamamla = (o: AkisOge) => {
    if (o.tip === "gorev") {
      gorevGuncelle.mutate({
        id: o.id,
        tamamlandi: !o.tamamlandi,
        tamamlanma_at: !o.tamamlandi ? new Date().toISOString() : null,
      });
    } else if (o.tip === "ritual") {
      kayitEkle.mutate({
        sablon_id: o.id,
        tarih: tarihStr,
        miktar: o.hedef - o.toplam,
      });
    }
  };

  /* -------- render -------- */

  return (
    <>
      <section className="rounded-2xl border border-border/60 bg-card/40 p-2 sm:p-3">
        <header className="flex items-center justify-between gap-2 px-2 pb-2 pt-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
              Bugün
            </span>
            <h2 className="text-sm font-semibold tracking-tight">Akış</h2>
          </div>
          {gorevler.length > 0 && (
            <button
              type="button"
              title="Bugünün görevlerini sıfırla"
              aria-label="Sıfırla"
              onClick={() => {
                if (confirm("Bugünün tüm görevleri silinsin mi?")) {
                  sifirla.mutate(tarihStr, {
                    onSuccess: () => toast.success("Sıfırlandı"),
                  });
                }
              }}
              className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          )}
        </header>

        <HizliEkle tarih={tarihStr} />

        {bos ? (
          <BosDurum />
        ) : (
          <ul className="flex flex-col divide-y divide-border/40">
            {aktifSirali.map((o) => (
              <Satir
                key={`${o.tip}:${o.id}`}
                oge={o}
                simdi={simdi}
                onTamamla={() => tamamla(o)}
                onAc={() => o.tip === "etkinlik" && setAcikEtkinlik(o.ham)}
                onSil={() => o.tip === "gorev" && gorevSil.mutate(o.id)}
              />
            ))}
          </ul>
        )}

        {bitenler.length > 0 && (
          <div className="mt-2 border-t border-border/60 pt-1">
            <button
              type="button"
              onClick={() => setBitenAcik((v) => !v)}
              className="flex w-full items-center gap-1.5 rounded-md px-2 py-2 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground/80 transition-colors hover:bg-muted/40 hover:text-foreground"
            >
              <ChevronRight
                className={cn(
                  "h-3 w-3 transition-transform",
                  bitenAcik && "rotate-90",
                )}
              />
              Tamamlananlar · {bitenler.length}
            </button>
            {bitenAcik && (
              <ul className="flex flex-col divide-y divide-border/30">
                {bitenler.map((o) => (
                  <Satir
                    key={`${o.tip}:${o.id}`}
                    oge={o}
                    simdi={simdi}
                    onTamamla={() => tamamla(o)}
                    onAc={() => o.tip === "etkinlik" && setAcikEtkinlik(o.ham)}
                    onSil={() => o.tip === "gorev" && gorevSil.mutate(o.id)}
                  />
                ))}
              </ul>
            )}
          </div>
        )}
      </section>

      <EtkinlikDetaySheet
        etkinlik={acikEtkinlik}
        onOpenChange={(o) => !o && setAcikEtkinlik(null)}
      />
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  Sıralama yardımcıları                                                     */
/* -------------------------------------------------------------------------- */

function rank(o: AkisOge): number {
  // 0: şu anki etkinlik · 1: zamanlı şeyler (etkinlik+saatli görev)
  // 2: saatsiz görev · 3: ritüeller (en sona)
  if (o.tip === "etkinlik" && o.durum === "simdi") return 0;
  if (o.tip === "etkinlik") return 1;
  if (o.tip === "gorev" && o.saatStr) return 1;
  if (o.tip === "gorev") return 2;
  return 3;
}

function saatDk(o: AkisOge): number | null {
  if (o.tip === "etkinlik") {
    if (o.tumGun) return -1; // tüm gün etkinliklerini en başa
    return o.saat.getHours() * 60 + o.saat.getMinutes();
  }
  if (o.tip === "gorev") return dakikadanSaat(o.saatStr);
  return null;
}

function manualSira(o: AkisOge): number {
  if (o.tip === "gorev") return o.ham.siralama ?? 0;
  if (o.tip === "ritual") return o.ham.siralama ?? 0;
  return 0;
}

function bitenAt(o: AkisOge): string {
  if (o.tip === "gorev") return o.ham.tamamlanma_at ?? "";
  if (o.tip === "etkinlik") return o.bitis.toISOString();
  return "";
}

/* -------------------------------------------------------------------------- */
/*  Satır                                                                      */
/* -------------------------------------------------------------------------- */

function Satir({
  oge,
  simdi,
  onTamamla,
  onAc,
  onSil,
}: {
  oge: AkisOge;
  simdi: Date;
  onTamamla: () => void;
  onAc: () => void;
  onSil: () => void;
}) {
  if (oge.tip === "etkinlik") return <EtkinlikSatir oge={oge} simdi={simdi} onAc={onAc} />;
  if (oge.tip === "ritual") return <RitualSatir oge={oge} onTamamla={onTamamla} />;
  return <GorevSatir oge={oge} onTamamla={onTamamla} onSil={onSil} />;
}

/* -------- Etkinlik satırı -------- */

function EtkinlikSatir({
  oge,
  simdi,
  onAc,
}: {
  oge: EtkinlikOge;
  simdi: Date;
  onAc: () => void;
}) {
  const renk = `var(--${oge.alan})`;
  const saatMetin = oge.tumGun ? "tüm gün" : format(oge.saat, "HH:mm");
  const zamanRel =
    oge.durum === "simdi"
      ? `${Math.max(0, differenceInMinutes(oge.bitis, simdi))} dk kaldı`
      : oge.durum === "gelecek"
        ? `${Math.max(0, differenceInMinutes(oge.saat, simdi))} dk sonra`
        : null;

  return (
    <li className="group">
      <button
        type="button"
        onClick={onAc}
        className={cn(
          "flex w-full items-center gap-2 rounded-md px-2 py-2.5 text-left transition-colors hover:bg-muted/40",
          oge.durum === "simdi" && "bg-muted/30",
        )}
      >
        {/* Sol rozet: zaman bloğu */}
        <span
          className="flex h-9 w-12 shrink-0 flex-col items-center justify-center rounded-md text-[10px] font-medium tabular-nums leading-none"
          style={{
            color: renk,
            backgroundColor: `color-mix(in oklab, ${renk} 12%, transparent)`,
            boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${renk} 22%, transparent)`,
          }}
        >
          {oge.tumGun ? (
            <span className="text-[9px] uppercase">Tüm gün</span>
          ) : (
            <>
              <span className="text-xs font-semibold">{saatMetin}</span>
              {oge.durum === "simdi" && (
                <span
                  className="mt-0.5 h-1 w-1 animate-pulse rounded-full"
                  style={{ backgroundColor: renk, boxShadow: `0 0 4px ${renk}` }}
                />
              )}
            </>
          )}
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            {oge.durum === "simdi" && (
              <span
                className="rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider"
                style={{
                  color: renk,
                  backgroundColor: `color-mix(in oklab, ${renk} 18%, transparent)`,
                }}
              >
                Şu an
              </span>
            )}
            <span className="truncate text-sm font-medium">{oge.baslik}</span>
          </span>
          <span className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
            {zamanRel && <span className="tabular-nums">{zamanRel}</span>}
            {oge.konum && (
              <span className="flex items-center gap-0.5 truncate">
                <MapPin className="h-2.5 w-2.5" />
                <span className="truncate">{oge.konum}</span>
              </span>
            )}
          </span>
        </span>
        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40 group-hover:text-muted-foreground" />
      </button>
    </li>
  );
}

/* -------- Ritüel satırı (mana evradı) -------- */

function RitualSatir({
  oge,
  onTamamla,
}: {
  oge: RitualOge;
  onTamamla: () => void;
}) {
  const renk = `var(--${oge.alan})`;
  return (
    <li className="group">
      <button
        type="button"
        onClick={onTamamla}
        className="flex w-full items-center gap-2 rounded-md px-2 py-2.5 text-left transition-colors hover:bg-muted/40"
      >
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md"
          style={{
            backgroundColor: `color-mix(in oklab, ${renk} 12%, transparent)`,
            boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${renk} 22%, transparent)`,
          }}
        >
          <Sparkles className="h-4 w-4" style={{ color: renk }} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="truncate text-sm font-medium">{oge.baslik}</span>
          <span className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
            <span
              className="rounded-full px-1.5 py-0 text-[9px] font-semibold uppercase tracking-wider"
              style={{
                color: renk,
                backgroundColor: `color-mix(in oklab, ${renk} 12%, transparent)`,
              }}
            >
              Ritüel
            </span>
            <span className="tabular-nums">
              {oge.toplam}/{oge.hedef} {BIRIM_ETIKET[oge.birim]}
            </span>
          </span>
        </span>
        <span
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors group-hover:scale-110"
          style={{ borderColor: `color-mix(in oklab, ${renk} 55%, transparent)` }}
          aria-hidden
        >
          <Check
            className="h-3 w-3 opacity-0 group-hover:opacity-100"
            strokeWidth={3}
            style={{ color: renk }}
          />
        </span>
      </button>
    </li>
  );
}

/* -------- Görev satırı -------- */

function GorevSatir({
  oge,
  onTamamla,
  onSil,
}: {
  oge: GorevOge;
  onTamamla: () => void;
  onSil: () => void;
}) {
  return (
    <li className="group">
      <div
        className={cn(
          "flex items-center gap-2 rounded-md px-2 py-2.5 transition-colors hover:bg-muted/40",
        )}
      >
        <button
          type="button"
          role="checkbox"
          aria-checked={oge.tamamlandi}
          aria-label={`${oge.baslik} tamamla`}
          onClick={onTamamla}
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-md border transition-colors",
            oge.tamamlandi
              ? "border-foreground/60 bg-foreground/60 text-background"
              : "border-border bg-background hover:border-foreground",
          )}
        >
          {oge.tamamlandi ? (
            <Check className="h-4 w-4" strokeWidth={3} />
          ) : (
            <span className="h-2 w-2 rounded-full bg-muted-foreground/50" />
          )}
        </button>
        <span className="min-w-0 flex-1">
          <span
            className={cn(
              "block truncate text-sm",
              oge.tamamlandi
                ? "text-muted-foreground line-through"
                : "text-foreground",
            )}
          >
            {oge.baslik}
          </span>
          {(oge.saatStr || oge.sureDk != null) && (
            <span className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
              {oge.saatStr && (
                <span className="tabular-nums">{oge.saatStr.slice(0, 5)}</span>
              )}
              {oge.sureDk != null && (
                <span className="tabular-nums">{oge.sureDk} dk</span>
              )}
            </span>
          )}
        </span>
        <button
          type="button"
          onClick={onSil}
          aria-label="Sil"
          title="Sil"
          className="shrink-0 rounded-full p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </li>
  );
}

/* -------- Boş durum -------- */

function BosDurum() {
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
      <Clock className="h-6 w-6 text-muted-foreground/40" />
      <p className="text-sm text-muted-foreground/80">
        Bugün için bir şey yok. Üstteki kutudan ilk görevini ekle ya da{" "}
        <Link to="/takvim" className="underline-offset-4 hover:underline">
          takvime
        </Link>{" "}
        bir etkinlik koy.
      </p>
    </div>
  );
}

/* -------- Hızlı ekleme -------- */

function HizliEkle({ tarih }: { tarih: string }) {
  const ekle = useGunlukGorevEkle();
  const [ad, setAd] = React.useState("");
  const [saat, setSaat] = React.useState("");
  const [dk, setDk] = React.useState("");
  const [extraAcik, setExtraAcik] = React.useState(false);

  const onEkle = async () => {
    if (!ad.trim()) return;
    try {
      await ekle.mutateAsync({
        tarih,
        baslik: ad.trim(),
        tahmini_sure_dk: dk ? Number(dk) : null,
        saat: saat || null,
        sablon_id: null,
      });
      setAd("");
      setSaat("");
      setDk("");
      setExtraAcik(false);
    } catch {
      toast.error("Eklenemedi");
    }
  };

  return (
    <div className="mb-1 flex flex-col gap-1 rounded-lg px-2 py-1 transition-colors focus-within:bg-muted/30">
      <div className="flex items-center gap-2">
        <Plus className="h-4 w-4 shrink-0 text-primary" />
        <Input
          value={ad}
          onChange={(e) => setAd(e.target.value)}
          placeholder="Bir görev ekle"
          onKeyDown={(e) => e.key === "Enter" && onEkle()}
          className={cn(
            "h-9 border-0 bg-transparent px-0 text-sm shadow-none focus-visible:ring-0",
            !ad && "placeholder:text-primary/80 placeholder:font-medium",
          )}
        />
        <button
          type="button"
          onClick={() => setExtraAcik((v) => !v)}
          className={cn(
            "shrink-0 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground",
            extraAcik && "bg-muted text-foreground",
          )}
          title="Saat / süre"
          aria-label="Saat / süre"
        >
          <Clock className="h-3.5 w-3.5" />
        </button>
      </div>
      {extraAcik && (
        <div className="flex items-center gap-2 pl-6">
          <Input
            type="time"
            value={saat}
            onChange={(e) => setSaat(e.target.value)}
            className="h-8 w-[110px] text-xs"
            aria-label="Saat (ops.)"
          />
          <Input
            type="number"
            value={dk}
            onChange={(e) => setDk(e.target.value)}
            placeholder="dk"
            className="h-8 w-16 text-xs"
            aria-label="Süre (dk)"
          />
        </div>
      )}
    </div>
  );
}