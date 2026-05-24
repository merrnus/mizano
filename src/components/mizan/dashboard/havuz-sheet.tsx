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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Settings2, Search, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSablonlar } from "@/lib/cetele-hooks";
import {
  useKategoriler,
  useVarsayilanKategorileriOlustur,
} from "@/lib/gorev-kategori";
import {
  useBugunGorevler,
  useGunlukGorevTopluEkle,
  useGunlukGorevEkle,
} from "@/lib/gunluk-gorev";
import { tarihFormat } from "@/lib/cetele-tarih";
import { KategoriYonetDialog } from "./kategori-yonet-dialog";
import { toast } from "sonner";

type Props = {
  acik: boolean;
  onOpenChange: (v: boolean) => void;
  simdi: Date;
};

export function HavuzSheet({ acik, onOpenChange, simdi }: Props) {
  const tarih = tarihFormat(simdi);
  const { data: sablonlar = [] } = useSablonlar();
  const { data: kategoriler = [] } = useKategoriler();
  const { data: bugunGorevler = [] } = useBugunGorevler(simdi);
  const topluEkle = useGunlukGorevTopluEkle();
  const tekEkle = useGunlukGorevEkle();
  const varsayilanOlustur = useVarsayilanKategorileriOlustur();

  const [arama, setArama] = React.useState("");
  const [secili, setSecili] = React.useState<Set<string>>(new Set());

  // Reset on close
  React.useEffect(() => {
    if (!acik) {
      setArama("");
      setSecili(new Set());
      setOzelAd("");
      setOzelDk("");
      setOzelKategori("");
    }
  }, [acik]);

  // Bugün zaten eklenmiş sablon id'leri
  const eklenenSablonIds = React.useMemo(
    () => new Set(bugunGorevler.map((g) => g.sablon_id).filter(Boolean) as string[]),
    [bugunGorevler],
  );

  const filtreliSablonlar = React.useMemo(() => {
    const q = arama.trim().toLowerCase();
    return sablonlar.filter((s) =>
      q ? s.ad.toLowerCase().includes(q) : true,
    );
  }, [sablonlar, arama]);

  const gruplar = React.useMemo(() => {
    const map = new Map<
      string | null,
      { kategoriId: string | null; sablonlar: typeof sablonlar }
    >();
    for (const s of filtreliSablonlar) {
      const k = (s as { kategori_id: string | null }).kategori_id ?? null;
      if (!map.has(k)) map.set(k, { kategoriId: k, sablonlar: [] });
      map.get(k)!.sablonlar.push(s);
    }
    const dizi = Array.from(map.values());
    dizi.sort((a, b) => {
      const ka = kategoriler.find((k) => k.id === a.kategoriId);
      const kb = kategoriler.find((k) => k.id === b.kategoriId);
      return (ka?.siralama ?? 999) - (kb?.siralama ?? 999);
    });
    return dizi;
  }, [filtreliSablonlar, kategoriler]);

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
        kategori_id:
          (s as { kategori_id: string | null }).kategori_id ?? null,
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

  // Özel görev satırı
  const [ozelAd, setOzelAd] = React.useState("");
  const [ozelDk, setOzelDk] = React.useState("");
  const [ozelKategori, setOzelKategori] = React.useState<string>("");

  const onOzelEkle = async () => {
    if (!ozelAd.trim()) return;
    try {
      await tekEkle.mutateAsync({
        tarih,
        baslik: ozelAd.trim(),
        tahmini_sure_dk: ozelDk ? Number(ozelDk) : null,
        kategori_id: ozelKategori || null,
        sablon_id: null,
        siralama: bugunGorevler.length + 100,
      });
      toast.success("Özel görev eklendi");
      setOzelAd("");
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
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={arama}
                onChange={(e) => setArama(e.target.value)}
                placeholder="Ara…"
                className="pl-8"
              />
            </div>
            <KategoriYonetDialog
              trigger={
                <button
                  type="button"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground"
                  aria-label="Kategorileri yönet"
                >
                  <Settings2 className="h-4 w-4" />
                </button>
              }
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {kategoriler.length === 0 && (
            <div className="mb-4 rounded-md border border-dashed border-border p-3 text-xs">
              <p className="mb-2 text-muted-foreground">
                Henüz kategori yok. Hızlıca varsayılanları oluşturabilirsin:
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => varsayilanOlustur.mutate()}
                disabled={varsayilanOlustur.isPending}
              >
                Varsayılanları oluştur
              </Button>
            </div>
          )}

          {sablonlar.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Havuz boş. Mana sayfasından şablon ekleyebilirsin.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {gruplar.map((g) => {
                const k = kategoriler.find((x) => x.id === g.kategoriId);
                const baslik = k ? `${k.emoji ?? ""} ${k.ad}` : "Kategorisiz";
                const renk = k?.renk ?? "kisisel";
                return (
                  <div key={g.kategoriId ?? "none"}>
                    <p
                      className="mb-2 text-[11px] font-semibold uppercase tracking-wider"
                      style={{ color: `var(--${renk})` }}
                    >
                      {baslik}
                    </p>
                    <ul className="flex flex-col gap-1">
                      {g.sablonlar.map((s) => {
                        const sure =
                          (s as { tahmini_sure_dk: number | null })
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
                            <span className="flex-1 truncate text-sm">
                              {s.ad}
                            </span>
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
                  </div>
                );
              })}
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
                  type="number"
                  value={ozelDk}
                  onChange={(e) => setOzelDk(e.target.value)}
                  placeholder="dk"
                  className="w-20"
                />
                <Select
                  value={ozelKategori || "none"}
                  onValueChange={(v) => setOzelKategori(v === "none" ? "" : v)}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Kategorisiz</SelectItem>
                    {kategoriler.map((k) => (
                      <SelectItem key={k.id} value={k.id}>
                        {k.emoji ?? ""} {k.ad}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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