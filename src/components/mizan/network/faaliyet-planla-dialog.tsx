import * as React from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { toast } from "sonner";
import { useKisiler } from "@/lib/network-hooks";
import { useKardesEtkinlikEkle } from "@/lib/network/kardes-etkinlik";
import {
  useAktiviteTipleri,
  useAktiviteTipEkle,
  aktiviteAdiniEnumaCevir,
  type AktiviteGrup,
} from "@/lib/network/aktivite-tip";

type Props = {
  acik: boolean;
  onClose: () => void;
  /** Önceden seçili kategori (sidebar'dan gelir). */
  kategoriId?: string | null;
};

export function FaaliyetPlanlaDialog({ acik, onClose, kategoriId }: Props) {
  const tiplerQ = useAktiviteTipleri();
  const tipEkle = useAktiviteTipEkle();
  const kisilerQ = useKisiler();
  const ekle = useKardesEtkinlikEkle();

  const [tipId, setTipId] = React.useState<string | null>(null);
  const [tarih, setTarih] = React.useState<Date>(new Date());
  const [saat, setSaat] = React.useState<string>("20:00");
  const [seciliKisiler, setSeciliKisiler] = React.useState<Set<string>>(new Set());
  const [yeniTipAcik, setYeniTipAcik] = React.useState(false);
  const [yeniTipAd, setYeniTipAd] = React.useState("");
  const [yeniTipGrup, setYeniTipGrup] = React.useState<AktiviteGrup>("aksiyon");

  // Dialog açıldığında sıfırla
  React.useEffect(() => {
    if (acik) {
      setSeciliKisiler(new Set());
      setTarih(new Date());
      setSaat("20:00");
    }
  }, [acik]);

  const tipler = tiplerQ.data ?? [];
  const seciliTip = tipler.find((t) => t.id === tipId) ?? null;

  // Kategoriye göre filtrelenmiş kişiler
  const tumKisiler = kisilerQ.data ?? [];
  const kategoriKisileri = kategoriId
    ? tumKisiler.filter((k) => k.kategori_ids.includes(kategoriId))
    : tumKisiler;

  const aksiyonTipler = tipler.filter((t) => t.grup === "aksiyon");
  const maneviTipler = tipler.filter((t) => t.grup === "manevi");

  const toggleKisi = (id: string) => {
    setSeciliKisiler((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const yeniTipKaydet = async () => {
    const ad = yeniTipAd.trim();
    if (!ad) return;
    await tipEkle.mutateAsync({ ad, grup: yeniTipGrup });
    setYeniTipAd("");
    setYeniTipAcik(false);
    toast.success("Tip eklendi");
  };

  const kaydet = async () => {
    if (!seciliTip) {
      toast.error("Faaliyet tipi seç");
      return;
    }
    if (seciliKisiler.size === 0) {
      toast.error("En az bir kişi seç");
      return;
    }
    const tarihStr = format(tarih, "yyyy-MM-dd");
    const enumTip = aktiviteAdiniEnumaCevir(seciliTip.ad);
    const tasks = Array.from(seciliKisiler).map(async (kid) => {
      const kisi = tumKisiler.find((k) => k.id === kid);
      await ekle.mutateAsync({
        kisi_id: kid,
        tip: enumTip,
        tarih: tarihStr,
        baslik: seciliTip.ad,
        baslangic_saati: saat ? `${saat}:00` : null,
        takvime_ekle: true,
        kisi_ad: kisi?.ad,
      });
    });
    await Promise.all(tasks);
    toast.success(`${seciliKisiler.size} faaliyet planlandı — Planlama'da görünür`);
    onClose();
  };

  return (
    <Dialog open={acik} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Faaliyet Planla</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Aktivite tipi */}
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              Faaliyet
            </Label>
            <div className="space-y-2.5">
              {aksiyonTipler.length > 0 && (
                <TipGrubu
                  baslik="Aksiyon"
                  tipler={aksiyonTipler}
                  seciliId={tipId}
                  onSec={setTipId}
                />
              )}
              {maneviTipler.length > 0 && (
                <TipGrubu
                  baslik="Manevi"
                  tipler={maneviTipler}
                  seciliId={tipId}
                  onSec={setTipId}
                />
              )}
            </div>
            {!yeniTipAcik ? (
              <button
                type="button"
                onClick={() => setYeniTipAcik(true)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <Plus className="h-3 w-3" /> Yeni tip ekle
              </button>
            ) : (
              <div className="flex items-center gap-1.5 rounded-md border border-border bg-muted/40 p-1.5">
                <select
                  value={yeniTipGrup}
                  onChange={(e) => setYeniTipGrup(e.target.value as AktiviteGrup)}
                  className="h-7 rounded border border-border bg-background px-1 text-xs"
                >
                  <option value="aksiyon">Aksiyon</option>
                  <option value="manevi">Manevi</option>
                </select>
                <Input
                  autoFocus
                  value={yeniTipAd}
                  onChange={(e) => setYeniTipAd(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") yeniTipKaydet();
                    if (e.key === "Escape") setYeniTipAcik(false);
                  }}
                  placeholder="Tip adı"
                  className="h-7 flex-1 text-xs"
                />
                <Button size="sm" className="h-7 px-2 text-xs" onClick={yeniTipKaydet}>
                  Ekle
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0"
                  onClick={() => setYeniTipAcik(false)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>

          {/* Tarih + Saat */}
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Tarih
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(tarih, "d MMMM yyyy, EEEE", { locale: tr })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={tarih}
                    onSelect={(d) => d && setTarih(d)}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Saat
              </Label>
              <Input
                type="time"
                value={saat}
                onChange={(e) => setSaat(e.target.value)}
                className="w-28"
              />
            </div>
          </div>

          {/* Kişi(ler) */}
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              Kişiler ({seciliKisiler.size})
            </Label>
            <div className="max-h-48 overflow-y-auto rounded-md border border-border">
              {kategoriKisileri.length === 0 ? (
                <div className="px-3 py-6 text-center text-xs text-muted-foreground">
                  Bu kategoride kişi yok
                </div>
              ) : (
                kategoriKisileri.map((k) => (
                  <label
                    key={k.id}
                    className="flex cursor-pointer items-center gap-2.5 px-3 py-2 text-sm hover:bg-accent/40"
                  >
                    <Checkbox
                      checked={seciliKisiler.has(k.id)}
                      onCheckedChange={() => toggleKisi(k.id)}
                    />
                    <span className="flex-1 truncate">{k.ad}</span>
                  </label>
                ))
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            İptal
          </Button>
          <Button onClick={kaydet} disabled={ekle.isPending}>
            {ekle.isPending ? "Kaydediliyor…" : "Kaydet"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TipGrubu({
  baslik,
  tipler,
  seciliId,
  onSec,
}: {
  baslik: string;
  tipler: { id: string; ad: string }[];
  seciliId: string | null;
  onSec: (id: string) => void;
}) {
  return (
    <div>
      <div className="mb-1 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
        {baslik}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {tipler.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onSec(t.id)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs transition-colors",
              seciliId === t.id
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card hover:bg-accent",
            )}
          >
            {t.ad}
          </button>
        ))}
      </div>
    </div>
  );
}