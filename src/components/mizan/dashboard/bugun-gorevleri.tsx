import * as React from "react";
import { addDays, isToday, parseISO, format, differenceInCalendarDays } from "date-fns";
import { tr } from "date-fns/locale";
import { Plus, Check } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { ALAN_ETIKET } from "@/lib/cetele-tipleri";
import { haftaBaslangici, tarihFormat } from "@/lib/cetele-tarih";
import { useGorevler, useGorevEkle, useGorevGuncelle } from "@/lib/takvim-hooks";
import type { TakvimGorev } from "@/lib/takvim-tipleri";

type Props = {
  simdi: Date;
  onYeni: () => void;
  onDuzenle: (g: TakvimGorev) => void;
};

/**
 * Bugün + gecikmiş görevler — kompakt yan kart.
 * Inline hızlı ekleme + tam dialog için "Detay" linki sağlar.
 */
export function BugunGorevleri({ simdi, onYeni, onDuzenle }: Props) {
  // Geniş aralık: gecikmiş görevleri de yakalamak için 60 gün geriye, hafta sonuna kadar
  const aralikBas = addDays(simdi, -60);
  const aralikBitis = addDays(haftaBaslangici(simdi), 6);
  const { data: gorevler = [] } = useGorevler(aralikBas, aralikBitis);
  const ekle = useGorevEkle();
  const guncelle = useGorevGuncelle();

  const [hizliMetin, setHizliMetin] = React.useState("");
  const bugunIso = tarihFormat(simdi);

  const acik = gorevler.filter((g) => !g.tamamlandi);
  const gecikmis = acik
    .filter((g) => {
      const d = parseISO(g.vade);
      return !isToday(d) && d < simdi;
    })
    .sort((a, b) => a.vade.localeCompare(b.vade));
  const bugunler = acik
    .filter((g) => isToday(parseISO(g.vade)))
    .sort((a, b) => {
      const oncelikSira = { yuksek: 0, orta: 1, dusuk: 2 } as const;
      return oncelikSira[a.oncelik] - oncelikSira[b.oncelik];
    });
  const bugunBitenSayisi = gorevler.filter(
    (g) => g.tamamlandi && isToday(parseISO(g.vade)),
  ).length;
  const bugunToplam = bugunler.length + bugunBitenSayisi;

  const hizliEkle = async () => {
    const baslik = hizliMetin.trim();
    if (!baslik) return;
    setHizliMetin("");
    try {
      await ekle.mutateAsync({
        baslik,
        vade: bugunIso,
        oncelik: "orta",
        alan: "kisisel",
      });
    } catch {
      setHizliMetin(baslik); // hata olursa metni koru
    }
  };

  return (
    <section className="flex flex-col rounded-2xl border border-border bg-card">
      <header className="flex items-end justify-between gap-3 border-b border-border px-5 py-4">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            Görevler
          </p>
          <h2 className="mt-0.5 text-lg font-semibold tracking-tight tabular-nums">
            {bugunBitenSayisi}/{bugunToplam}
            <span className="ml-1.5 text-sm font-normal text-muted-foreground">
              · bugün
            </span>
            {gecikmis.length > 0 && (
              <span className="ml-1.5 text-sm font-normal text-destructive">
                · {gecikmis.length} gecikmiş
              </span>
            )}
          </h2>
        </div>
        <button
          type="button"
          onClick={onYeni}
          className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted-foreground transition-all hover:scale-105 hover:text-foreground active:scale-95"
          aria-label="Yeni görev ekle"
          title="Detaylı görev ekle"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto">
        {gecikmis.length === 0 && bugunler.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <Check className="mx-auto mb-2 h-6 w-6 text-muted-foreground/40" />
            <p className="text-xs text-muted-foreground">
              Bugün için görev yok.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {gecikmis.map((g) => (
              <GorevSatir
                key={g.id}
                gorev={g}
                gecikmis
                simdi={simdi}
                onToggle={() =>
                  guncelle.mutate({
                    id: g.id,
                    degisiklikler: { tamamlandi: !g.tamamlandi },
                  })
                }
                onDuzenle={() => onDuzenle(g)}
              />
            ))}
            {bugunler.map((g) => (
              <GorevSatir
                key={g.id}
                gorev={g}
                simdi={simdi}
                onToggle={() =>
                  guncelle.mutate({
                    id: g.id,
                    degisiklikler: { tamamlandi: !g.tamamlandi },
                  })
                }
                onDuzenle={() => onDuzenle(g)}
              />
            ))}
          </ul>
        )}
      </div>

      {/* Hızlı ekleme */}
      <div className="border-t border-border px-3 py-2">
        <div className="flex items-center gap-1.5">
          <Plus className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <input
            type="text"
            value={hizliMetin}
            onChange={(e) => setHizliMetin(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                hizliEkle();
              }
            }}
            placeholder="Hızlı görev ekle..."
            className="min-w-0 flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
            aria-label="Hızlı görev ekle"
          />
          <button
            type="button"
            onClick={onYeni}
            className="shrink-0 text-[10px] text-muted-foreground transition-colors hover:text-foreground"
          >
            Detay
          </button>
        </div>
      </div>
    </section>
  );
}

function GorevSatir({
  gorev,
  gecikmis,
  simdi,
  onToggle,
  onDuzenle,
}: {
  gorev: TakvimGorev;
  gecikmis?: boolean;
  simdi: Date;
  onToggle: () => void;
  onDuzenle: () => void;
}) {
  const renk = `var(--${gorev.alan})`;
  const vadeTarih = parseISO(gorev.vade);
  const gunFark = gecikmis ? differenceInCalendarDays(simdi, vadeTarih) : 0;
  const gecikmeMetni =
    gunFark === 1 ? "dün" : gunFark > 1 ? `${gunFark}g önce` : format(vadeTarih, "d MMM", { locale: tr });

  return (
    <li
      className={cn(
        "group flex items-start gap-2.5 px-4 py-2.5 transition-colors hover:bg-accent/30",
        gecikmis && "border-l-2 border-l-destructive",
      )}
    >
      <Checkbox
        checked={gorev.tamamlandi}
        onCheckedChange={onToggle}
        className="mt-0.5"
        aria-label={`${gorev.baslik} tamamla`}
      />
      <button
        type="button"
        onClick={onDuzenle}
        className="min-w-0 flex-1 text-left"
      >
        <div className="truncate text-xs font-medium text-foreground">
          {gorev.baslik}
        </div>
        <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <span
            className="h-1.5 w-1.5 rounded-full shrink-0"
            style={{ backgroundColor: renk }}
          />
          <span className="truncate">{ALAN_ETIKET[gorev.alan]}</span>
          {gecikmis && (
            <>
              <span aria-hidden="true">·</span>
              <span className="text-destructive">{gecikmeMetni}</span>
            </>
          )}
          {gorev.oncelik === "yuksek" && (
            <>
              <span aria-hidden="true">·</span>
              <span className="text-destructive font-semibold">!</span>
            </>
          )}
        </div>
      </button>
    </li>
  );
}