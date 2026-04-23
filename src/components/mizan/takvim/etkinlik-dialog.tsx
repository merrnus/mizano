import * as React from "react";
import { Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  type TakvimEtkinlik,
  type TakvimEtkinlikEkle,
  type TakvimTekrar,
} from "@/lib/takvim-tipleri";
import { ALAN_ETIKET, type CeteleAlan } from "@/lib/cetele-tipleri";
import {
  useEtkinlikEkle,
  useEtkinlikGuncelle,
  useEtkinlikSil,
} from "@/lib/takvim-hooks";
import { toast } from "sonner";

function toLocalInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInput(s: string): Date {
  return new Date(s);
}

type Props = {
  acik: boolean;
  onOpenChange: (a: boolean) => void;
  varsayilanBaslangic?: Date;
  duzenle?: TakvimEtkinlik | null;
};

export function EtkinlikDialog({ acik, onOpenChange, varsayilanBaslangic, duzenle }: Props) {
  const ekle = useEtkinlikEkle();
  const guncelle = useEtkinlikGuncelle();
  const sil = useEtkinlikSil();

  const [baslik, setBaslik] = React.useState("");
  const [aciklama, setAciklama] = React.useState("");
  const [baslangic, setBaslangic] = React.useState("");
  const [bitis, setBitis] = React.useState("");
  const [tumGun, setTumGun] = React.useState(false);
  const [alan, setAlan] = React.useState<CeteleAlan>("kisisel");
  const [konum, setKonum] = React.useState("");
  const [tekrar, setTekrar] = React.useState<TakvimTekrar>("yok");

  React.useEffect(() => {
    if (!acik) return;
    if (duzenle) {
      setBaslik(duzenle.baslik);
      setAciklama(duzenle.aciklama ?? "");
      setBaslangic(toLocalInput(new Date(duzenle.baslangic)));
      setBitis(duzenle.bitis ? toLocalInput(new Date(duzenle.bitis)) : "");
      setTumGun(duzenle.tum_gun);
      setAlan(duzenle.alan);
      setKonum(duzenle.konum ?? "");
      setTekrar(duzenle.tekrar);
    } else {
      const bas = varsayilanBaslangic ?? new Date();
      const bit = new Date(bas.getTime() + 60 * 60 * 1000);
      setBaslik("");
      setAciklama("");
      setBaslangic(toLocalInput(bas));
      setBitis(toLocalInput(bit));
      setTumGun(false);
      setAlan("kisisel");
      setKonum("");
      setTekrar("yok");
    }
  }, [acik, duzenle, varsayilanBaslangic]);

  const kaydet = async () => {
    if (!baslik.trim()) {
      toast.error("Başlık gerekli");
      return;
    }
    const payload: Omit<TakvimEtkinlikEkle, "user_id"> = {
      baslik: baslik.trim(),
      aciklama: aciklama.trim() || null,
      baslangic: fromLocalInput(baslangic).toISOString(),
      bitis: bitis ? fromLocalInput(bitis).toISOString() : null,
      tum_gun: tumGun,
      alan,
      konum: konum.trim() || null,
      tekrar,
    };
    try {
      if (duzenle) {
        await guncelle.mutateAsync({ id: duzenle.id, degisiklikler: payload });
        toast.success("Etkinlik güncellendi");
      } else {
        await ekle.mutateAsync(payload);
        toast.success("Etkinlik eklendi");
      }
      onOpenChange(false);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const silinecek = async () => {
    if (!duzenle) return;
    try {
      await sil.mutateAsync(duzenle.id);
      toast.success("Etkinlik silindi");
      onOpenChange(false);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <Dialog open={acik} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{duzenle ? "Etkinliği düzenle" : "Yeni etkinlik"}</DialogTitle>
          <DialogDescription>
            Ders, sohbet veya randevu — alan rengiyle takvime düşer.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="baslik">Başlık</Label>
            <Input
              id="baslik"
              value={baslik}
              onChange={(e) => setBaslik(e.target.value)}
              placeholder="Örn. Hadis Usulü"
              autoFocus
            />
          </div>
          <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
            <Label htmlFor="tumgun" className="text-sm">Tüm gün</Label>
            <Switch id="tumgun" checked={tumGun} onCheckedChange={setTumGun} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="grid gap-1.5">
              <Label htmlFor="bas">Başlangıç</Label>
              <Input
                id="bas"
                type={tumGun ? "date" : "datetime-local"}
                value={tumGun ? baslangic.slice(0, 10) : baslangic}
                onChange={(e) =>
                  setBaslangic(tumGun ? `${e.target.value}T00:00` : e.target.value)
                }
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="bit">Bitiş</Label>
              <Input
                id="bit"
                type={tumGun ? "date" : "datetime-local"}
                value={tumGun ? bitis.slice(0, 10) : bitis}
                onChange={(e) =>
                  setBitis(tumGun ? `${e.target.value}T23:59` : e.target.value)
                }
                disabled={tumGun}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="grid gap-1.5">
              <Label>Alan</Label>
              <Select value={alan} onValueChange={(v) => setAlan(v as CeteleAlan)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(ALAN_ETIKET) as CeteleAlan[]).map((a) => (
                    <SelectItem key={a} value={a}>
                      <span className="flex items-center gap-2">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: `var(--${a})` }}
                        />
                        {ALAN_ETIKET[a]}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Tekrar</Label>
              <Select value={tekrar} onValueChange={(v) => setTekrar(v as TakvimTekrar)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yok">Tekrar yok</SelectItem>
                  <SelectItem value="haftalik">Her hafta</SelectItem>
                  <SelectItem value="aylik">Her ay</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="konum">Konum (opsiyonel)</Label>
            <Input
              id="konum"
              value={konum}
              onChange={(e) => setKonum(e.target.value)}
              placeholder="Z-12 / Online"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="aciklama">Açıklama (opsiyonel)</Label>
            <Textarea
              id="aciklama"
              value={aciklama}
              onChange={(e) => setAciklama(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter className="flex-row items-center justify-between sm:justify-between">
          {duzenle ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={silinecek}
              className="gap-1.5 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" /> Sil
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              İptal
            </Button>
            <Button size="sm" onClick={kaydet}>
              {duzenle ? "Güncelle" : "Ekle"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}