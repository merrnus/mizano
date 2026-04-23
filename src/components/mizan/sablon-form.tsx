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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil } from "lucide-react";
import { useSablonEkle, useSablonGuncelle } from "@/lib/cetele-hooks";
import type {
  CeteleAlan,
  CeteleBirim,
  CeteleHedefTipi,
  CeteleSablon,
} from "@/lib/cetele-tipleri";
import { toast } from "sonner";

export function SablonForm({
  varsayilanAlan = "maneviyat",
  duzenle,
}: {
  varsayilanAlan?: CeteleAlan;
  duzenle?: CeteleSablon;
}) {
  const [acik, setAcik] = React.useState(false);
  const [ad, setAd] = React.useState(duzenle?.ad ?? "");
  const [birim, setBirim] = React.useState<CeteleBirim>(duzenle?.birim ?? "sayfa");
  const [hedefTipi, setHedefTipi] = React.useState<CeteleHedefTipi>(duzenle?.hedef_tipi ?? "gunluk");
  const [hedefDeger, setHedefDeger] = React.useState(String(duzenle?.hedef_deger ?? 1));
  const [ucAylik, setUcAylik] = React.useState(
    duzenle?.uc_aylik_hedef != null ? String(duzenle.uc_aylik_hedef) : "",
  );
  const [notlar, setNotlar] = React.useState(duzenle?.notlar ?? "");
  const ekle = useSablonEkle();
  const guncelle = useSablonGuncelle();
  const isEdit = !!duzenle;

  // Dialog her açıldığında düzenle değerleriyle senkronize et
  React.useEffect(() => {
    if (acik && duzenle) {
      setAd(duzenle.ad);
      setBirim(duzenle.birim);
      setHedefTipi(duzenle.hedef_tipi);
      setHedefDeger(String(duzenle.hedef_deger));
      setUcAylik(duzenle.uc_aylik_hedef != null ? String(duzenle.uc_aylik_hedef) : "");
      setNotlar(duzenle.notlar ?? "");
    }
  }, [acik, duzenle]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ad.trim()) return;
    try {
      const payload = {
        ad: ad.trim(),
        birim,
        hedef_tipi: hedefTipi,
        hedef_deger: Number(hedefDeger) || 1,
        uc_aylik_hedef: ucAylik ? Number(ucAylik) : null,
        notlar: notlar.trim() || null,
      };
      if (isEdit && duzenle) {
        await guncelle.mutateAsync({ id: duzenle.id, ...payload });
        toast.success("Evrad güncellendi");
      } else {
        await ekle.mutateAsync({
          ...payload,
          alan: varsayilanAlan,
          siralama: 100,
        });
        toast.success("Evrad eklendi");
        setAd("");
        setHedefDeger("1");
        setUcAylik("");
        setNotlar("");
      }
      setAcik(false);
    } catch (e) {
      toast.error(isEdit ? "Güncellenemedi" : "Eklenemedi");
    }
  };

  const pending = ekle.isPending || guncelle.isPending;

  return (
    <Dialog open={acik} onOpenChange={setAcik}>
      <DialogTrigger asChild>
        {isEdit ? (
          <button
            className="text-muted-foreground/40 hover:text-foreground"
            aria-label="Düzenle"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        ) : (
          <Button size="sm" variant="outline" className="h-8 gap-1 text-xs">
            <Plus className="h-3.5 w-3.5" /> Evrad
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Evradı Düzenle" : "Yeni Evrad / Hedef"}</DialogTitle>
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
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">
              Spesifik içerik / kaynak (ops.)
            </Label>
            <Textarea
              value={notlar}
              onChange={(e) => setNotlar(e.target.value)}
              placeholder="Örn. Risale: Mektubat 2. cilt — şu an 84. sayfa"
              rows={2}
              className="text-sm"
            />
            <p className="text-[10px] text-muted-foreground">
              "Risale" gibi genel başlıklar için hangi kitap / cilt / sayfa olduğunu yazabilirsin.
            </p>
          </div>
          <Button type="submit" disabled={pending} className="mt-2">
            {pending ? "..." : isEdit ? "Kaydet" : "Ekle"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}