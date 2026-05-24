import * as React from "react";
import { Link } from "@tanstack/react-router";
import { X, Plus, RotateCcw, Settings2, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  useBugunGorevler,
  useGunlukGorevEkle,
  useGunlukGorevGuncelle,
  useGunlukGorevSil,
  useGunSifirla,
  type GunlukGorev,
} from "@/lib/gunluk-gorev";
import { tarihFormat } from "@/lib/cetele-tarih";
import { toast } from "sonner";

type Props = {
  simdi: Date;
  onHavuzAc: () => void;
};

/**
 * Esnek Görevler — Google Tasks tarzı tek düz liste.
 * Tamamlanmayanlar üstte (saat varsa kronolojik, yoksa siralama), tamamlananlar altta.
 */
export function GunlukChecklist({ simdi, onHavuzAc }: Props) {
  const tarih = tarihFormat(simdi);
  const { data: gorevler = [] } = useBugunGorevler(simdi);
  const guncelle = useGunlukGorevGuncelle();
  const sil = useGunlukGorevSil();
  const sifirla = useGunSifirla();

  const { aktif, biten } = React.useMemo(() => {
    const a: GunlukGorev[] = [];
    const b: GunlukGorev[] = [];
    for (const g of gorevler) (g.tamamlandi ? b : a).push(g);
    a.sort((x, y) => {
      // saatli görevler üstte, kronolojik
      if (x.saat && y.saat) return x.saat.localeCompare(y.saat);
      if (x.saat) return -1;
      if (y.saat) return 1;
      return (x.siralama ?? 0) - (y.siralama ?? 0);
    });
    b.sort((x, y) => (y.tamamlanma_at ?? "").localeCompare(x.tamamlanma_at ?? ""));
    return { aktif: a, biten: b };
  }, [gorevler]);

  return (
    <section className="rounded-2xl border border-border bg-card">
      <header className="flex items-center justify-between gap-2 border-b border-border px-5 py-4">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            Esnek Görevler
          </p>
          <h2 className="mt-0.5 text-lg font-semibold tracking-tight">
            Bugün ne yapacağım?
          </h2>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onHavuzAc}
            className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
          >
            <LayoutGrid className="h-3 w-3" />
            Havuzdan ekle
          </button>
          <Link
            to="/mizan/mana"
            title="Şablonları yönet"
            aria-label="Şablonları yönet"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            <Settings2 className="h-3.5 w-3.5" />
          </Link>
          {gorevler.length > 0 && (
            <button
              type="button"
              title="Sıfırla"
              aria-label="Sıfırla"
              onClick={() => {
                if (confirm("Bugünün tüm görevleri silinsin mi?")) {
                  sifirla.mutate(tarih, {
                    onSuccess: () => toast.success("Sıfırlandı"),
                  });
                }
              }}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </header>

      {gorevler.length === 0 ? (
        <div className="flex flex-col items-start gap-3 px-5 py-6">
          <p className="text-sm text-muted-foreground">
            Bugün için görev seçmedin.
          </p>
          <button
            type="button"
            onClick={onHavuzAc}
            className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-3.5 py-1.5 text-xs font-medium text-background transition-transform hover:scale-[1.03] active:scale-[0.97]"
          >
            <Plus className="h-3.5 w-3.5" />
            Havuzdan ekle
          </button>
        </div>
      ) : (
        <ul className="flex flex-col gap-0 px-2 py-2">
          {aktif.map((g) => (
            <Satir
              key={g.id}
              gorev={g}
              onToggle={(v) =>
                guncelle.mutate({
                  id: g.id,
                  tamamlandi: v,
                  tamamlanma_at: v ? new Date().toISOString() : null,
                })
              }
              onSil={() => sil.mutate(g.id)}
            />
          ))}
          {biten.length > 0 && aktif.length > 0 && (
            <li className="my-1 border-t border-border/60" aria-hidden />
          )}
          {biten.map((g) => (
            <Satir
              key={g.id}
              gorev={g}
              onToggle={(v) =>
                guncelle.mutate({
                  id: g.id,
                  tamamlandi: v,
                  tamamlanma_at: v ? new Date().toISOString() : null,
                })
              }
              onSil={() => sil.mutate(g.id)}
            />
          ))}
        </ul>
      )}

      <HizliEkleSatiri simdi={simdi} />
    </section>
  );
}

function Satir({
  gorev,
  onToggle,
  onSil,
}: {
  gorev: GunlukGorev;
  onToggle: (v: boolean) => void;
  onSil: () => void;
}) {
  return (
    <li
      className={cn(
        "group flex items-center gap-2.5 rounded-md px-3 py-2 transition-opacity hover:bg-muted/40",
        gorev.tamamlandi && "opacity-50",
      )}
    >
      <Checkbox
        checked={gorev.tamamlandi}
        onCheckedChange={(v) => onToggle(v === true)}
        aria-label={`${gorev.baslik} tamamla`}
      />
      {gorev.saat && (
        <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">
          {gorev.saat.slice(0, 5)}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div
          className={cn(
            "truncate text-sm font-medium",
            gorev.tamamlandi && "line-through",
          )}
        >
          {gorev.baslik}
        </div>
      </div>
      {gorev.tahmini_sure_dk != null && (
        <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] tabular-nums text-muted-foreground">
          {gorev.tahmini_sure_dk} dk
        </span>
      )}
      <button
        type="button"
        onClick={onSil}
        className="text-muted-foreground/40 opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
        aria-label="Sil"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </li>
  );
}

function HizliEkleSatiri({ simdi }: { simdi: Date }) {
  const tarih = tarihFormat(simdi);
  const ekle = useGunlukGorevEkle();
  const [ad, setAd] = React.useState("");
  const [saat, setSaat] = React.useState("");
  const [dk, setDk] = React.useState("");

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
    } catch {
      toast.error("Eklenemedi");
    }
  };

  return (
    <div className="flex items-center gap-2 border-t border-border bg-card/50 px-5 py-3">
      <Input
        value={ad}
        onChange={(e) => setAd(e.target.value)}
        placeholder="Hızlı görev ekle…"
        onKeyDown={(e) => e.key === "Enter" && onEkle()}
        className="h-9 flex-1"
      />
      <Input
        type="time"
        value={saat}
        onChange={(e) => setSaat(e.target.value)}
        className="h-9 w-[110px]"
        aria-label="Saat (ops.)"
      />
      <Input
        type="number"
        value={dk}
        onChange={(e) => setDk(e.target.value)}
        placeholder="dk"
        className="h-9 w-16"
        aria-label="Süre (dk)"
      />
      <button
        type="button"
        onClick={onEkle}
        disabled={!ad.trim() || ekle.isPending}
        className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-foreground text-background disabled:opacity-40"
        aria-label="Ekle"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}