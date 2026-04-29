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
import {
  type GorevOncelik,
  type TakvimGorev,
  type TakvimGorevEkle,
} from "@/lib/takvim-tipleri";
import { ALAN_ETIKET, type CeteleAlan } from "@/lib/cetele-tipleri";
import { useGorevEkle, useGorevGuncelle, useGorevSil } from "@/lib/takvim-hooks";
import { toast } from "sonner";

function isoGun(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const g = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${g}`;
}

type Props = {
  acik: boolean;
  onOpenChange: (a: boolean) => void;
  varsayilanVade?: Date;
  duzenle?: TakvimGorev | null;
};

export function GorevDialog({ acik, onOpenChange, varsayilanVade, duzenle }: Props) {
  const ekle = useGorevEkle();
  const guncelle = useGorevGuncelle();
  const sil = useGorevSil();

  const [baslik, setBaslik] = React.useState("");
  const [aciklama, setAciklama] = React.useState("");
  const [vade, setVade] = React.useState("");
  const [oncelik, setOncelik] = React.useState<GorevOncelik>("orta");
  const [alan, setAlan] = React.useState<CeteleAlan>("kisisel");

  React.useEffect(() => {
    if (!acik) return;
    if (duzenle) {
      setBaslik(duzenle.baslik);
      setAciklama(duzenle.aciklama ?? "");
      setVade(duzenle.vade);
      setOncelik(duzenle.oncelik);
      setAlan(duzenle.alan);
    } else {
      setBaslik("");
      setAciklama("");
      setVade(isoGun(varsayilanVade ?? new Date()));
      setOncelik("orta");
      setAlan("kisisel");
    }
    // Sadece dialog ilk açıldığında initialize et — varsayilanVade her dakika
    // yeni Date referansı olduğu için dependency'e koymamak gerekiyor; yoksa
    // kullanıcı yazarken form sıfırlanıyor.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [acik, duzenle?.id]);

  const kaydet = async () => {
    if (!baslik.trim()) {
      toast.error("Başlık gerekli");
      return;
    }
    const payload: Omit<TakvimGorevEkle, "user_id"> = {
      baslik: baslik.trim(),
      aciklama: aciklama.trim() || null,
      vade,
      oncelik,
      alan,
    };
    try {
      if (duzenle) {
        await guncelle.mutateAsync({ id: duzenle.id, degisiklikler: payload });
        toast.success("Görev güncellendi");
      } else {
        await ekle.mutateAsync(payload);
        toast.success("Görev eklendi");
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
      toast.success("Görev silindi");
      onOpenChange(false);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <Dialog open={acik} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{duzenle ? "Görevi düzenle" : "Yeni görev"}</DialogTitle>
          <DialogDescription>Saatsiz to-do — bir gün için.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="g-baslik">Başlık</Label>
            <Input
              id="g-baslik"
              value={baslik}
              onChange={(e) => setBaslik(e.target.value)}
              placeholder="Örn. Lab raporu teslim"
              autoFocus
            />
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <div className="grid gap-1.5">
              <Label htmlFor="g-vade">Vade</Label>
              <Input
                id="g-vade"
                type="date"
                value={vade}
                onChange={(e) => setVade(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Öncelik</Label>
              <Select value={oncelik} onValueChange={(v) => setOncelik(v as GorevOncelik)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dusuk">Düşük</SelectItem>
                  <SelectItem value="orta">Orta</SelectItem>
                  <SelectItem value="yuksek">Yüksek</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="g-aciklama">Not (opsiyonel)</Label>
            <Textarea
              id="g-aciklama"
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