import * as React from "react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEtkinlikEkle } from "@/lib/takvim/hooks";
import { ALAN_ETIKET, type CeteleAlan } from "@/lib/cetele-tipleri";
import { TEKRAR_SECENEK } from "@/lib/takvim/tekrar";

type Props = {
  acik: boolean;
  onOpenChange: (o: boolean) => void;
  varsayilanBaslangic?: Date;
};

export function EtkinlikHizliDialog({ acik, onOpenChange, varsayilanBaslangic }: Props) {
  const ekle = useEtkinlikEkle();
  const ref = varsayilanBaslangic ?? new Date();
  const [baslik, setBaslik] = React.useState("");
  const [aciklama, setAciklama] = React.useState("");
  const [tumGun, setTumGun] = React.useState(false);
  const [tarih, setTarih] = React.useState(format(ref, "yyyy-MM-dd"));
  const [bas, setBas] = React.useState("09:00");
  const [bit, setBit] = React.useState("10:00");
  const [konum, setKonum] = React.useState("");
  const [alan, setAlan] = React.useState<CeteleAlan>("kisisel");
  const [tekrarId, setTekrarId] = React.useState<string>("yok");

  React.useEffect(() => {
    if (acik) {
      const r = varsayilanBaslangic ?? new Date();
      setBaslik(""); setAciklama(""); setTumGun(false);
      setTarih(format(r, "yyyy-MM-dd")); setBas("09:00"); setBit("10:00");
      setKonum(""); setAlan("kisisel");
      setTekrarId("yok");
    }
  }, [acik, varsayilanBaslangic]);

  const kaydet = async () => {
    if (!baslik.trim()) return;
    const baslangic = tumGun ? new Date(`${tarih}T00:00:00`).toISOString() : new Date(`${tarih}T${bas}:00`).toISOString();
    const bitis = tumGun ? null : new Date(`${tarih}T${bit}:00`).toISOString();
    const kural = TEKRAR_SECENEK.find((s) => s.id === tekrarId)?.kural ?? null;
    await ekle.mutateAsync({
      baslik, aciklama: aciklama || null, baslangic, bitis, tum_gun: tumGun,
      konum: konum || null, alan, tekrar: "yok", tekrar_kural: kural,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={acik} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Yeni etkinlik</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div><Label>Başlık</Label><Input value={baslik} onChange={(e) => setBaslik(e.target.value)} /></div>
          <div><Label>Açıklama</Label><Textarea value={aciklama} onChange={(e) => setAciklama(e.target.value)} /></div>
          <div className="flex items-center gap-2">
            <Switch checked={tumGun} onCheckedChange={setTumGun} id="tg" />
            <Label htmlFor="tg">Tüm gün</Label>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><Label>Tarih</Label><Input type="date" value={tarih} onChange={(e) => setTarih(e.target.value)} /></div>
            {!tumGun && <div><Label>Başlangıç</Label><Input type="time" value={bas} onChange={(e) => setBas(e.target.value)} /></div>}
            {!tumGun && <div><Label>Bitiş</Label><Input type="time" value={bit} onChange={(e) => setBit(e.target.value)} /></div>}
          </div>
          <div><Label>Konum</Label><Input value={konum} onChange={(e) => setKonum(e.target.value)} /></div>
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
          <div>
            <Label>Tekrar</Label>
            <Select value={tekrarId} onValueChange={setTekrarId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TEKRAR_SECENEK.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.etiket}</SelectItem>
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
