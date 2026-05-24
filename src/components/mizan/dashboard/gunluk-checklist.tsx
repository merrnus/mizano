import * as React from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import {
  useSablonlar,
  useHaftaKayitlari,
  useKayitEkle,
  useKayitSil,
  gunToplami,
} from "@/lib/cetele-hooks";
import {
  useAmelKurslar,
  useTumAmelModuller,
  useAmelModulGuncelle,
} from "@/lib/amel-hooks";
import { haftaBaslangici, tarihFormat } from "@/lib/cetele-tarih";
import type { CeteleSablon, CeteleKayit } from "@/lib/cetele-tipleri";
import type { AmelKurs, AmelModul } from "@/lib/amel-tipleri";

/**
 * Bugünün birleşik checklist'i: İlim (aktif kurs modülleri) + Amel (mana evrâdı).
 * Tek tık toggle; tamamlananlar üstü çizili ve solgun.
 */
export function GunlukChecklist({ simdi }: { simdi: Date }) {
  const haftaBas = haftaBaslangici(simdi);
  const bugunStr = tarihFormat(simdi);

  const { data: sablonlar = [] } = useSablonlar();
  const { data: kayitlar = [] } = useHaftaKayitlari(haftaBas);
  const { data: kurslar = [] } = useAmelKurslar();
  const { data: tumModuller = [] } = useTumAmelModuller();

  const manaSablonlar = sablonlar.filter((s) => s.alan === "mana");

  const ilimOgeleri = React.useMemo(() => {
    return kurslar
      .filter((k) => k.durum === "aktif")
      .map((kurs) => {
        const modulSira = tumModuller
          .filter((m) => m.kurs_id === kurs.id)
          .sort((a, b) => a.siralama - b.siralama);
        const ilkEksik = modulSira.find((m) => !m.tamamlandi);
        return ilkEksik ? { kurs, modul: ilkEksik } : null;
      })
      .filter((x): x is { kurs: AmelKurs; modul: AmelModul } => x !== null);
  }, [kurslar, tumModuller]);

  if (manaSablonlar.length === 0 && ilimOgeleri.length === 0) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-border bg-card">
      <header className="border-b border-border px-5 py-4">
        <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          Bugünün Çetelesi
        </p>
        <h2 className="mt-0.5 text-lg font-semibold tracking-tight">
          İşaretle, ilerle
        </h2>
      </header>

      <div className="divide-y divide-border">
        {ilimOgeleri.length > 0 && (
          <IlimBolumu ogeler={ilimOgeleri} />
        )}
        {manaSablonlar.length > 0 && (
          <AmelBolumu
            sablonlar={manaSablonlar}
            kayitlar={kayitlar}
            bugunStr={bugunStr}
            simdi={simdi}
          />
        )}
      </div>
    </section>
  );
}

/* ============ İlim (kurs modülleri) ============ */

function IlimBolumu({
  ogeler,
}: {
  ogeler: Array<{ kurs: AmelKurs; modul: AmelModul }>;
}) {
  const guncelle = useAmelModulGuncelle();
  const renk = "var(--ilim)";

  return (
    <div className="px-5 py-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-base">📚</span>
          <span
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: renk }}
          >
            İlim
          </span>
        </div>
        <Link
          to="/mizan/amel"
          className="inline-flex items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
        >
          Tümü
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      <ul className="flex flex-col gap-1.5">
        {ogeler.map(({ kurs, modul }) => (
          <li
            key={modul.id}
            className={cn(
              "flex items-center gap-2.5 rounded-md border border-border bg-background/40 px-3 py-2 transition-opacity",
              modul.tamamlandi && "opacity-50",
            )}
          >
            <Checkbox
              checked={modul.tamamlandi}
              onCheckedChange={(v) =>
                guncelle.mutate({
                  id: modul.id,
                  tamamlandi: v === true,
                  tamamlanma: v === true ? new Date().toISOString().slice(0, 10) : null,
                })
              }
              aria-label={`${modul.baslik} tamamla`}
            />
            <div className="min-w-0 flex-1">
              <div
                className={cn(
                  "truncate text-sm font-medium",
                  modul.tamamlandi && "line-through",
                )}
              >
                <span style={{ color: renk }}>{kurs.kod ?? kurs.ad}</span>
                <span className="text-muted-foreground"> · </span>
                <span>{modul.baslik}</span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ============ Amel (mana evrâdı) ============ */

function AmelBolumu({
  sablonlar,
  kayitlar,
  bugunStr,
  simdi,
}: {
  sablonlar: CeteleSablon[];
  kayitlar: CeteleKayit[];
  bugunStr: string;
  simdi: Date;
}) {
  const renk = "var(--mana)";
  void simdi;

  return (
    <div className="px-5 py-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-base">🤲</span>
          <span
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: renk }}
          >
            Amel
          </span>
        </div>
        <Link
          to="/mizan/mana"
          className="inline-flex items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
        >
          Tümü
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      <ul className="flex flex-col gap-1.5">
        {sablonlar.map((s) => (
          <AmelSatir
            key={s.id}
            sablon={s}
            kayitlar={kayitlar}
            bugunStr={bugunStr}
          />
        ))}
      </ul>
    </div>
  );
}

function AmelSatir({
  sablon,
  kayitlar,
  bugunStr,
}: {
  sablon: CeteleSablon;
  kayitlar: CeteleKayit[];
  bugunStr: string;
}) {
  const ekle = useKayitEkle();
  const sil = useKayitSil();
  const toplam = gunToplami(kayitlar, sablon.id, bugunStr);
  const hedef = Number(sablon.hedef_deger);
  const tamam = toplam >= hedef && hedef > 0;

  const bugunkuKayitlar = kayitlar.filter(
    (k) => k.sablon_id === sablon.id && k.tarih === bugunStr,
  );

  const toggle = async () => {
    if (tamam) {
      // sıfırla
      for (const k of bugunkuKayitlar) await sil.mutateAsync(k.id);
    } else {
      const eksik = Math.max(1, hedef - toplam);
      await ekle.mutateAsync({
        sablon_id: sablon.id,
        tarih: bugunStr,
        miktar: eksik,
      });
    }
  };

  const busy = ekle.isPending || sil.isPending;

  return (
    <li
      className={cn(
        "flex items-center gap-2.5 rounded-md border border-border bg-background/40 px-3 py-2 transition-opacity",
        tamam && "opacity-50",
      )}
    >
      <Checkbox
        checked={tamam}
        disabled={busy}
        onCheckedChange={() => void toggle()}
        aria-label={`${sablon.ad} tamamla`}
      />
      <div className="min-w-0 flex-1">
        <div
          className={cn(
            "truncate text-sm font-medium",
            tamam && "line-through",
          )}
        >
          {sablon.ad}
        </div>
      </div>
      <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
        {toplam}/{hedef} {sablon.birim === "ikili" ? "" : sablon.birim}
      </span>
    </li>
  );
}