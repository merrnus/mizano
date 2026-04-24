import * as React from "react";
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
import { useDersEkle, useDersGuncelle } from "@/lib/ilim-hooks";
import {
  DERS_DURUM_ETIKET,
  type Ders,
  type DersDurum,
} from "@/lib/ilim-tipleri";
import { toast } from "sonner";

const DURUMLAR: DersDurum[] = ["izliyor", "restant", "gecti", "birakti"];

export interface DersFormProps {
  ders?: Ders;
  onBitti?: () => void;
}

export function DersForm({ ders, onBitti }: DersFormProps) {
  const [ad, setAd] = React.useState(ders?.ad ?? "");
  const [donem, setDonem] = React.useState(ders?.donem ?? "");
  const [hoca, setHoca] = React.useState(ders?.hoca ?? "");
  const [kredi, setKredi] = React.useState<string>(String(ders?.kredi ?? ""));
  const [durum, setDurum] = React.useState<DersDurum>(ders?.durum ?? "izliyor");
  const [notlar, setNotlar] = React.useState(ders?.notlar ?? "");

  const ekle = useDersEkle();
  const guncelle = useDersGuncelle();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!ad.trim()) return;
    const payload = {
      ad: ad.trim(),
      kod: null,
      donem: donem.trim() || null,
      hoca: hoca.trim() || null,
      kredi: kredi ? Number(kredi) : 0,
      durum,
      restant: durum === "restant",
      etiketler: [],
      gecme_baraji: null,
      notlar: notlar.trim() || null,
    };
    try {
      if (ders) {
        await guncelle.mutateAsync({ id: ders.id, ...payload });
        toast.success("Ders güncellendi");
      } else {
        await ekle.mutateAsync(payload);
        toast.success("Ders eklendi");
      }
      onBitti?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Hata");
    }
  }

  const yukleniyor = ekle.isPending || guncelle.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="ders-ad" className="text-xs">Ders adı</Label>
          <Input id="ders-ad" value={ad} onChange={(e) => setAd(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ders-kredi" className="text-xs">Kredi</Label>
          <Input
            id="ders-kredi"
            type="number"
            min={0}
            step="0.5"
            value={kredi}
            onChange={(e) => setKredi(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ders-donem" className="text-xs">Dönem</Label>
          <Input id="ders-donem" placeholder="2024 Bahar" value={donem} onChange={(e) => setDonem(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ders-hoca" className="text-xs">Hoca</Label>
          <Input id="ders-hoca" value={hoca} onChange={(e) => setHoca(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Durum</Label>
          <Select value={durum} onValueChange={(v) => setDurum(v as DersDurum)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DURUMLAR.map((d) => (
                <SelectItem key={d} value={d}>
                  {DERS_DURUM_ETIKET[d]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="ders-not" className="text-xs">Notlar</Label>
        <Textarea
          id="ders-not"
          rows={2}
          value={notlar}
          onChange={(e) => setNotlar(e.target.value)}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={() => onBitti?.()}>
          İptal
        </Button>
        <Button type="submit" disabled={yukleniyor}>
          {yukleniyor ? "Kaydediliyor…" : ders ? "Güncelle" : "Ders ekle"}
        </Button>
      </div>
    </form>
  );
}