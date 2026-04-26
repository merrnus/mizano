import * as React from "react";
import { Link } from "@tanstack/react-router";
import { Trash2, ExternalLink } from "lucide-react";
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
  useEtkinlikGuncelle,
  useEtkinlikSil,
} from "@/lib/takvim-hooks";
import { toast } from "sonner";

const pad = (n: number) => String(n).padStart(2, "0");

function toDateInput(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function toTimeInput(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function birlestir(tarih: string, saat: string): Date {
  const [y, m, g] = tarih.split("-").map(Number);
  const [sa, dk] = (saat || "00:00").split(":").map(Number);
  return new Date(y, (m ?? 1) - 1, g ?? 1, sa ?? 0, dk ?? 0, 0, 0);
}

type Props = {
  etkinlik: TakvimEtkinlik | null;
  onOpenChange: (a: boolean) => void;
};

export function EtkinlikDetaySheet({ etkinlik, onOpenChange }: Props) {
  const guncelle = useEtkinlikGuncelle();
  const sil = useEtkinlikSil();

  const [baslik, setBaslik] = React.useState("");
  const [aciklama, setAciklama] = React.useState("");
  const [baslangicTarih, setBaslangicTarih] = React.useState("");
  const [baslangicSaat, setBaslangicSaat] = React.useState("");
  const [bitisTarih, setBitisTarih] = React.useState("");
  const [bitisSaat, setBitisSaat] = React.useState("");
  const [tumGun, setTumGun] = React.useState(false);
  const [alan, setAlan] = React.useState<CeteleAlan>("kisisel");
  const [konum, setKonum] = React.useState("");
  const [tekrar, setTekrar] = React.useState<TakvimTekrar>("yok");

  const acik = !!etkinlik;

  React.useEffect(() => {
    if (!etkinlik) return;
    const bas = new Date(etkinlik.baslangic);
    const bit = etkinlik.bitis
      ? new Date(etkinlik.bitis)
      : new Date(bas.getTime() + 60 * 60 * 1000);
    setBaslik(etkinlik.baslik);
    setAciklama(etkinlik.aciklama ?? "");
    setBaslangicTarih(toDateInput(bas));
    setBaslangicSaat(toTimeInput(bas));
    setBitisTarih(toDateInput(bit));
    setBitisSaat(toTimeInput(bit));
    setTumGun(etkinlik.tum_gun);
    setAlan(etkinlik.alan);
    setKonum(etkinlik.konum ?? "");
    setTekrar(etkinlik.tekrar);
  }, [etkinlik]);

  const baslangicDegisti = (yeniTarih: string, yeniSaat: string) => {
    setBaslangicTarih(yeniTarih);
    setBaslangicSaat(yeniSaat);
    if (!yeniTarih || !bitisTarih) return;
    const yeniBas = birlestir(yeniTarih, tumGun ? "00:00" : yeniSaat);
    const mevcutBit = birlestir(bitisTarih, tumGun ? "23:59" : bitisSaat);
    if (mevcutBit <= yeniBas) {
      const yeniBit = new Date(yeniBas.getTime() + 60 * 60 * 1000);
      setBitisTarih(toDateInput(yeniBit));
      setBitisSaat(toTimeInput(yeniBit));
    }
  };

  const tumGunDegisti = (yeni: boolean) => {
    setTumGun(yeni);
    if (yeni && baslangicTarih && !bitisTarih) {
      setBitisTarih(baslangicTarih);
    }
  };

  const kaydet = async () => {
    if (!etkinlik) return;
    if (!baslik.trim()) {
      toast.error("Başlık gerekli");
      return;
    }
    if (!baslangicTarih) {
      toast.error("Başlangıç tarihi gerekli");
      return;
    }
    const bas = birlestir(baslangicTarih, tumGun ? "00:00" : baslangicSaat || "00:00");
    const bit = bitisTarih
      ? birlestir(bitisTarih, tumGun ? "23:59" : bitisSaat || "00:00")
      : null;
    if (bit && bit <= bas) {
      toast.error("Bitiş, başlangıçtan sonra olmalı");
      return;
    }
    const payload: Omit<TakvimEtkinlikEkle, "user_id"> = {
      baslik: baslik.trim(),
      aciklama: aciklama.trim() || null,
      baslangic: bas.toISOString(),
      bitis: bit ? bit.toISOString() : null,
      tum_gun: tumGun,
      alan,
      konum: konum.trim() || null,
      tekrar,
    };
    try {
      await guncelle.mutateAsync({ id: etkinlik.id, degisiklikler: payload });
      toast.success("Etkinlik güncellendi");
      onOpenChange(false);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const silinecek = async () => {
    if (!etkinlik) return;
    try {
      await sil.mutateAsync(etkinlik.id);
      toast.success("Etkinlik silindi");
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
          <SheetTitle>Etkinlik</SheetTitle>
          <SheetDescription className="flex items-center gap-2">
            Detayları düzenle veya
            <Link
              to="/takvim"
              className="inline-flex items-center gap-1 text-foreground underline-offset-4 hover:underline"
            >
              takvime git <ExternalLink className="h-3 w-3" />
            </Link>
          </SheetDescription>
        </SheetHeader>

        <div className="mt-5 grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="es-baslik">Başlık</Label>
            <Input
              id="es-baslik"
              value={baslik}
              onChange={(e) => setBaslik(e.target.value)}
              autoFocus
            />
          </div>
          <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
            <Label htmlFor="es-tumgun" className="text-sm">Tüm gün</Label>
            <Switch id="es-tumgun" checked={tumGun} onCheckedChange={tumGunDegisti} />
          </div>
          {tumGun ? (
            <div className="grid grid-cols-2 gap-2">
              <div className="grid gap-1.5">
                <Label htmlFor="es-bas-tarih">Başlangıç</Label>
                <Input
                  id="es-bas-tarih"
                  type="date"
                  value={baslangicTarih}
                  onChange={(e) => baslangicDegisti(e.target.value, baslangicSaat)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="es-bit-tarih">Bitiş</Label>
                <Input
                  id="es-bit-tarih"
                  type="date"
                  value={bitisTarih}
                  min={baslangicTarih || undefined}
                  onChange={(e) => setBitisTarih(e.target.value)}
                />
              </div>
            </div>
          ) : (
            <div className="grid gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="es-bas-tarih">Başlangıç</Label>
                <div className="flex gap-2">
                  <Input
                    id="es-bas-tarih"
                    type="date"
                    className="flex-1"
                    value={baslangicTarih}
                    onChange={(e) => baslangicDegisti(e.target.value, baslangicSaat)}
                  />
                  <Input
                    id="es-bas-saat"
                    type="time"
                    className="w-[110px]"
                    value={baslangicSaat}
                    onChange={(e) => baslangicDegisti(baslangicTarih, e.target.value)}
                  />
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="es-bit-tarih">Bitiş</Label>
                <div className="flex gap-2">
                  <Input
                    id="es-bit-tarih"
                    type="date"
                    className="flex-1"
                    min={baslangicTarih || undefined}
                    value={bitisTarih}
                    onChange={(e) => setBitisTarih(e.target.value)}
                  />
                  <Input
                    id="es-bit-saat"
                    type="time"
                    className="w-[110px]"
                    value={bitisSaat}
                    onChange={(e) => setBitisSaat(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}
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
            <Label htmlFor="es-konum">Konum (opsiyonel)</Label>
            <Input
              id="es-konum"
              value={konum}
              onChange={(e) => setKonum(e.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="es-aciklama">Açıklama (opsiyonel)</Label>
            <Textarea
              id="es-aciklama"
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