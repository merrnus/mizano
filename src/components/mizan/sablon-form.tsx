import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useSablonEkle } from "@/lib/cetele-hooks";
import type { CeteleAlan, CeteleBirim, CeteleHedefTipi } from "@/lib/cetele-tipleri";
import { toast } from "sonner";

export function SablonForm({
  varsayilanAlan = "maneviyat",
}: {
  varsayilanAlan?: CeteleAlan;
}) {
  const [acik, setAcik] = React.useState(false);
  const [ad, setAd] = React.useState("");
  const [birim, setBirim] = React.useState<CeteleBirim>("sayfa");
  const [hedefTipi, setHedefTipi] = React.useState<CeteleHedefTipi>("gunluk");
  const [hedefDeger, setHedefDeger] = React.useState("1");
  const [ucAylik, setUcAylik] = React.useState("");
  const ekle = useSablonEkle();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ad.trim()) return;
    try {
      await ekle.mutateAsync({
        ad: ad.trim(),
        birim,
        hedef_tipi: hedefTipi,
        hedef_deger: Number(hedefDeger) || 1,
        alan: varsayilanAlan,
        siralama: 100,
        uc_aylik_hedef: ucAylik ? Number(ucAylik) : null,
      });
      toast.success("Evrad eklendi");
      setAd("");
      setHedefDeger("1");
      setUcAylik("");
      setAcik(false);
    } catch (e) {
      toast.error("Eklenemedi");
    }
  };

  return (
    <Dialog open={acik} onOpenChange={setAcik}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-8 gap-1 text-xs">
          <Plus className="h-3.5 w-3.5" /> Evrad
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Yeni Evrad / Hedef</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Ad</Label>
            <Input value={ad} onChange={(e) => setAd(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Birim</Label>
              <Select value={birim} onValueChange={(v) => setBirim(v as CeteleBirim)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sayfa">sayfa</SelectItem>
                  <SelectItem value="adet">adet</SelectItem>
                  <SelectItem value="dakika">dakika</SelectItem>
                  <SelectItem value="ikili">ikili (yaptım/yapmadım)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Hedef tipi</Label>
              <Select value={hedefTipi} onValueChange={(v) => setHedefTipi(v as CeteleHedefTipi)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="gunluk">Günlük</SelectItem>
                  <SelectItem value="haftalik">Haftalık</SelectItem>
                  <SelectItem value="esnek">Esnek</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Hedef değer</Label>
              <Input
                type="number"
                value={hedefDeger}
                onChange={(e) => setHedefDeger(e.target.value)}
                min="0"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">3 aylık hedef (ops.)</Label>
              <Input
                type="number"
                value={ucAylik}
                onChange={(e) => setUcAylik(e.target.value)}
                placeholder="—"
              />
            </div>
          </div>
          <Button type="submit" disabled={ekle.isPending} className="mt-2">
            {ekle.isPending ? "..." : "Ekle"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}