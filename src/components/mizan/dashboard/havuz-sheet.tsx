import * as React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSablonlar } from "@/lib/cetele-hooks";
import { ALAN_ETIKET, type CeteleAlan } from "@/lib/cetele-tipleri";
import {
  useBugunGorevler,
  useGunlukGorevTopluEkle,
  useGunlukGorevEkle,
} from "@/lib/gunluk-gorev";
import { tarihFormat } from "@/lib/cetele-tarih";
import { toast } from "sonner";

type Props = {
  acik: boolean;
  onOpenChange: (v: boolean) => void;
  simdi: Date;
};

export function HavuzSheet({ acik, onOpenChange, simdi }: Props) {
  const tarih = tarihFormat(simdi);
  const { data: sablonlar = [] } = useSablonlar();
  const { data: bugunGorevler = [] } = useBugunGorevler(simdi);
  const topluEkle = useGunlukGorevTopluEkle();
  const tekEkle = useGunlukGorevEkle();

  const [arama, setArama] = React.useState("");
  const [secili, setSecili] = React.useState<Set<string>>(new Set());
  const [ozelAd, setOzelAd] = React.useState("");
  const [ozelSaat, setOzelSaat] = React.useState("");
  const [ozelDk, setOzelDk] = React.useState("");

  React.useEffect(() => {
    if (!acik) {
      setArama("");
      setSecili(new Set());
      setOzelAd("");
      setOzelSaat("");
      setOzelDk("");
    }
  }, [acik]);

  const eklenenSablonIds = React.useMemo(
    () => new Set(bugunGorevler.map((g) => g.sablon_id).filter(Boolean) as string[]),
    [bugunGorevler],
  );

  const gruplanmis = React.useMemo(() => {
    const q = arama.trim().toLowerCase();
    const liste = q
      ? sablonlar.filter((s) => s.ad.toLowerCase().includes(q))
      : sablonlar;
    const sirali = [...liste].sort(
      (a, b) => (a.siralama ?? 0) - (b.siralama ?? 0),
    );
    const alanSira: CeteleAlan[] = ["mana", "ilim", "amel", "kisisel"];
    const map = new Map<CeteleAlan, typeof sirali>();
    for (const a of alanSira) map.set(a, []);
    for (const s of sirali) {
      const a = (s.alan ?? "kisisel") as CeteleAlan;
      if (!map.has(a)) map.set(a, []);
      map.get(a)!.push(s);
    }
    return Array.from(map.entries()).filter(([, v]) => v.length > 0);
  }, [sablonlar, arama]);

  const toggle = (id: string) => {
    setSecili((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const onEkle = async () => {
    const rows = sablonlar
      .filter((s) => secili.has(s.id) && !eklenenSablonIds.has(s.id))
      .map((s, i) => ({
        tarih,
        baslik: s.ad,
        tahmini_sure_dk:
          (s as { tahmini_sure_dk: number | null }).tahmini_sure_dk ?? null,
        sablon_id: s.id,
        siralama: bugunGorevler.length + i,
      }));
    if (rows.length === 0) {
      toast("Seçilen öğeler zaten bugüne eklenmiş");
      return;
    }
    try {
      await topluEkle.mutateAsync(rows);
      toast.success(`${rows.length} görev eklendi`);
      onOpenChange(false);
    } catch {
      toast.error("Eklenemedi");
    }
  };

  const onOzelEkle = async () => {
    if (!ozelAd.trim()) return;
    try {
      await tekEkle.mutateAsync({
        tarih,
        baslik: ozelAd.trim(),
        tahmini_sure_dk: ozelDk ? Number(ozelDk) : null,
        saat: ozelSaat || null,
        sablon_id: null,
        siralama: bugunGorevler.length + 100,
      });
      toast.success("Özel görev eklendi");
      setOzelAd("");
      setOzelSaat("");
      setOzelDk("");
    } catch {
      toast.error("Eklenemedi");
    }
  };

  return (
    <Sheet open={acik} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-md"
      >
        <SheetHeader className="border-b border-border px-5 py-4">
          <SheetTitle>Görev Havuzu</SheetTitle>
        </SheetHeader>

        <div className="border-b border-border px-5 py-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={arama}
              onChange={(e) => setArama(e.target.value)}
              placeholder="Şablon ara…"
              className="pl-8"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {sablonlar.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Havuz boş. Mana sayfasından şablon ekleyebilirsin.
            </p>
          ) : (
            <div className="flex flex-col gap-5">
              {gruplanmis.map(([alan, items]) => (
                <section key={alan} className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 px-1">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: `hsl(var(--${alan}))` }}
                    />
                    <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {ALAN_ETIKET[alan]}
                    </h3>
                    <span className="text-[10px] text-muted-foreground/70">
                      {items.length}
                    </span>
                  </div>
                  <ul className="flex flex-col gap-1">
                    {items.map((s) => {
                      const sure = (s as { tahmini_sure_dk: number | null })
                        .tahmini_sure_dk;
                      const eklenmis = eklenenSablonIds.has(s.id);
                      return (
                        <li
                          key={s.id}
                          className={cn(
                            "flex items-center gap-2.5 rounded-md border border-border px-3 py-2",
                            eklenmis && "opacity-50",
                          )}
                        >
                          <Checkbox
                            checked={secili.has(s.id)}
                            disabled={eklenmis}
                            onCheckedChange={() => toggle(s.id)}
                            aria-label={s.ad}
                          />
                          <span className="flex-1 truncate text-sm">{s.ad}</span>
                          {sure != null && (
                            <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] tabular-nums text-muted-foreground">
                              {sure} dk
                            </span>
                          )}
                          {eklenmis && (
                            <span className="text-[10px] text-muted-foreground">
                              eklendi
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))}
            </div>
          )}

          {/* Özel görev */}
          <div className="mt-6 rounded-md border border-dashed border-border p-3">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Özel görev (sadece bugün)
            </p>
            <div className="flex flex-col gap-2">
              <Input
                value={ozelAd}
                onChange={(e) => setOzelAd(e.target.value)}
                placeholder="Görev adı"
                onKeyDown={(e) => e.key === "Enter" && onOzelEkle()}
              />
              <div className="flex gap-2">
                <Input
                  type="time"
                  value={ozelSaat}
                  onChange={(e) => setOzelSaat(e.target.value)}
                  className="flex-1"
                  aria-label="Saat (ops.)"
                />
                <Input
                  type="number"
                  value={ozelDk}
                  onChange={(e) => setOzelDk(e.target.value)}
                  placeholder="dk"
                  className="w-20"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={onOzelEkle}
                  disabled={!ozelAd.trim() || tekEkle.isPending}
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border bg-card px-5 py-3">
          <Button
            type="button"
            className="w-full"
            onClick={onEkle}
            disabled={secili.size === 0 || topluEkle.isPending}
          >
            Seçilenleri ekle ({secili.size})
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}