import * as React from "react";
import { Trash2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
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
import { useGorevGuncelle, useGorevSil } from "@/lib/takvim-hooks";
import { toast } from "sonner";

type Props = {
  gorev: TakvimGorev | null;
  onOpenChange: (a: boolean) => void;
};

export function GorevDetaySheet({ gorev, onOpenChange }: Props) {
  const guncelle = useGorevGuncelle();
  const sil = useGorevSil();

  const [baslik, setBaslik] = React.useState("");
  const [aciklama, setAciklama] = React.useState("");
  const [vade, setVade] = React.useState("");
  const [oncelik, setOncelik] = React.useState<GorevOncelik>("orta");
  const [alan, setAlan] = React.useState<CeteleAlan>("kisisel");
  const [tamamlandi, setTamamlandi] = React.useState(false);

  const acik = !!gorev;

  React.useEffect(() => {
    if (!gorev) return;
    setBaslik(gorev.baslik);
    setAciklama(gorev.aciklama ?? "");
    setVade(gorev.vade);
    setOncelik(gorev.oncelik);
    setAlan(gorev.alan);
    setTamamlandi(gorev.tamamlandi);
  }, [gorev]);

  const kaydet = async () => {
    if (!gorev) return;
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
      tamamlandi,
    };
    try {
      await guncelle.mutateAsync({ id: gorev.id, degisiklikler: payload });
      toast.success("Görev güncellendi");
      onOpenChange(false);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const silinecek = async () => {
    if (!gorev) return;
    try {
      await sil.mutateAsync(gorev.id);
      toast.success("Görev silindi");
      onOpenChange(false);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <Sheet open={acik} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-md"
      >
        <SheetHeader>
          <SheetTitle>Görev</SheetTitle>
          <SheetDescription>Detayları düzenle ya da görevi sil.</SheetDescription>
        </SheetHeader>

        <div className="mt-5 grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="gs-baslik">Başlık</Label>
            <Input
              id="gs-baslik"
              value={baslik}
              onChange={(e) => setBaslik(e.target.value)}
              autoFocus
            />
          </div>
          <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
            <Label htmlFor="gs-tamamlandi" className="text-sm">Tamamlandı</Label>
            <Switch id="gs-tamamlandi" checked={tamamlandi} onCheckedChange={setTamamlandi} />
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <div className="grid gap-1.5">
              <Label htmlFor="gs-vade">Vade</Label>
              <Input
                id="gs-vade"
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
            <Label htmlFor="gs-aciklama">Not (opsiyonel)</Label>
            <Textarea
              id="gs-aciklama"
              value={aciklama}
              onChange={(e) => setAciklama(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <SheetFooter className="mt-6 flex-row items-center justify-between sm:justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={silinecek}
            className="gap-1.5 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" /> Sil
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              İptal
            </Button>
            <Button size="sm" onClick={kaydet}>
              Güncelle
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}