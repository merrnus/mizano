import * as React from "react";
import { X, Plus, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useBugunGorevler,
  useGunlukGorevEkle,
  useGunlukGorevGuncelle,
  useGunlukGorevSil,
  useGunSifirla,
  type GunlukGorev,
} from "@/lib/gunluk-gorev";
import { useKategoriler } from "@/lib/gorev-kategori";
import { tarihFormat } from "@/lib/cetele-tarih";
import { toast } from "sonner";

type Props = {
  simdi: Date;
  onHavuzAc: () => void;
};

/**
 * Esnek Görevler — kullanıcının havuzdan çektiği veya ad-hoc eklediği
 * günlük checklist. Veriler `gunluk_gorev` tablosundan gelir.
 */
export function GunlukChecklist({ simdi, onHavuzAc }: Props) {
  const tarih = tarihFormat(simdi);
  const { data: gorevler = [] } = useBugunGorevler(simdi);
  const { data: kategoriler = [] } = useKategoriler();
  const guncelle = useGunlukGorevGuncelle();
  const sil = useGunlukGorevSil();
  const sifirla = useGunSifirla();

  const gruplar = React.useMemo(() => {
    const map = new Map<string | null, GunlukGorev[]>();
    for (const g of gorevler) {
      const k = g.kategori_id ?? null;
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(g);
    }
    const dizi = Array.from(map.entries()).map(([kategoriId, items]) => ({
      kategoriId,
      items,
    }));
    dizi.sort((a, b) => {
      const ka = kategoriler.find((k) => k.id === a.kategoriId);
      const kb = kategoriler.find((k) => k.id === b.kategoriId);
      return (ka?.siralama ?? 999) - (kb?.siralama ?? 999);
    });
    return dizi;
  }, [gorevler, kategoriler]);

  return (
    <section className="rounded-2xl border border-border bg-card">
      <header className="flex items-center justify-between gap-2 border-b border-border px-5 py-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            Esnek Görevler
          </p>
          <h2 className="mt-0.5 text-lg font-semibold tracking-tight">
            Bugün ne yapacağım?
          </h2>
        </div>
        {gorevler.length > 0 && (
          <button
            type="button"
            onClick={() => {
              if (confirm("Bugünün tüm görevleri silinsin mi?")) {
                sifirla.mutate(tarih, {
                  onSuccess: () => toast.success("Sıfırlandı"),
                });
              }
            }}
            className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-3 w-3" />
            Sıfırla
          </button>
        )}
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
        <div className="divide-y divide-border">
          {gruplar.map(({ kategoriId, items }) => {
            const k = kategoriler.find((x) => x.id === kategoriId);
            const baslik = k
              ? `${k.emoji ?? ""} ${k.ad}`.trim()
              : "Kategorisiz";
            const renk = k?.renk ?? "kisisel";
            return (
              <div key={kategoriId ?? "none"} className="px-5 py-4">
                <p
                  className="mb-2 text-[11px] font-semibold uppercase tracking-wider"
                  style={{ color: `var(--${renk})` }}
                >
                  {baslik}
                </p>
                <ul className="flex flex-col gap-1.5">
                  {items.map((g) => (
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
              </div>
            );
          })}
        </div>
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
        "group flex items-center gap-2.5 rounded-md border border-border bg-background/40 px-3 py-2 transition-opacity",
        gorev.tamamlandi && "opacity-50",
      )}
    >
      <Checkbox
        checked={gorev.tamamlandi}
        onCheckedChange={(v) => onToggle(v === true)}
        aria-label={`${gorev.baslik} tamamla`}
      />
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
  const { data: kategoriler = [] } = useKategoriler();
  const [ad, setAd] = React.useState("");
  const [dk, setDk] = React.useState("");
  const [kategoriId, setKategoriId] = React.useState<string>("");

  const onEkle = async () => {
    if (!ad.trim()) return;
    try {
      await ekle.mutateAsync({
        tarih,
        baslik: ad.trim(),
        tahmini_sure_dk: dk ? Number(dk) : null,
        kategori_id: kategoriId || null,
        sablon_id: null,
      });
      setAd("");
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
        type="number"
        value={dk}
        onChange={(e) => setDk(e.target.value)}
        placeholder="dk"
        className="h-9 w-16"
      />
      <Select
        value={kategoriId || "none"}
        onValueChange={(v) => setKategoriId(v === "none" ? "" : v)}
      >
        <SelectTrigger className="h-9 w-28">
          <SelectValue placeholder="—" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">—</SelectItem>
          {kategoriler.map((k) => (
            <SelectItem key={k.id} value={k.id}>
              {k.emoji ?? ""} {k.ad}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
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