import * as React from "react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGorevEkle, useGorevGuncelle } from "@/lib/takvim-hooks";
import { ONCELIK_ETIKET, type GorevOncelik, type TakvimGorev } from "@/lib/takvim-tipleri";
import { ALAN_ETIKET, type CeteleAlan } from "@/lib/cetele-tipleri";

type Props = {
  acik: boolean;
  onOpenChange: (o: boolean) => void;
  varsayilanVade?: Date;
  duzenle?: TakvimGorev | null;
};

export function GorevDialog({ acik, onOpenChange, varsayilanVade, duzenle }: Props) {
  const ekle = useGorevEkle();
  const guncelle = useGorevGuncelle();
  const [baslik, setBaslik] = React.useState("");
  const [aciklama, setAciklama] = React.useState("");
  const [vade, setVade] = React.useState(format(varsayilanVade ?? new Date(), "yyyy-MM-dd"));
  const [oncelik, setOncelik] = React.useState<GorevOncelik>("orta");
  const [alan, setAlan] = React.useState<CeteleAlan>("kisisel");

  React.useEffect(() => {
    if (duzenle) {
      setBaslik(duzenle.baslik);
      setAciklama(duzenle.aciklama ?? "");
      setVade(duzenle.vade);
      setOncelik(duzenle.oncelik);
      setAlan(duzenle.alan);
    } else {
      setBaslik(""); setAciklama("");
      setVade(format(varsayilanVade ?? new Date(), "yyyy-MM-dd"));
      setOncelik("orta"); setAlan("kisisel");
    }
  }, [duzenle, varsayilanVade, acik]);

  const kaydet = async () => {
    if (!baslik.trim()) return;
    if (duzenle) {
      await guncelle.mutateAsync({ id: duzenle.id, baslik, aciklama: aciklama || null, vade, oncelik, alan });
    } else {
      await ekle.mutateAsync({ baslik, aciklama: aciklama || null, vade, oncelik, alan });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={acik} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{duzenle ? "Görevi düzenle" : "Yeni görev"}</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div><Label>Başlık</Label><Input value={baslik} onChange={(e) => setBaslik(e.target.value)} /></div>
          <div><Label>Açıklama</Label><Textarea value={aciklama} onChange={(e) => setAciklama(e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Vade</Label><Input type="date" value={vade} onChange={(e) => setVade(e.target.value)} /></div>
            <div>
              <Label>Öncelik</Label>
              <Select value={oncelik} onValueChange={(v) => setOncelik(v as GorevOncelik)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(ONCELIK_ETIKET) as GorevOncelik[]).map((k) => (
                    <SelectItem key={k} value={k}>{ONCELIK_ETIKET[k]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Alan</Label>
            <Select value={alan} onValueChange={(v) => setAlan(v as CeteleAlan)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(ALAN_ETIKET) as CeteleAlan[]).map((k) => (
                  <SelectItem key={k} value={k}>{ALAN_ETIKET[k]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>İptal</Button>
          <Button onClick={kaydet} disabled={!baslik.trim()}>Kaydet</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
