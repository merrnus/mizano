import * as React from "react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Copy } from "lucide-react";
import type { Etkinlik, Takvim } from "@/lib/takvim/tipler";
import { TEKRAR_SECENEK, kuraldanId } from "@/lib/takvim/tekrar";
import { TAKVIM_RENKLERI, rengiBul } from "@/lib/takvim/renkler";
import { useEtkinlikMutasyonlari } from "@/lib/takvim/hooks";

type Props = {
  acik: boolean;
  onOpenChange: (o: boolean) => void;
  duzenle?: Etkinlik | null;
  baslangic?: Date;
  bitis?: Date;
  tumGun?: boolean;
  takvimler: Takvim[];
};

const HATIRLATICI = [
  { v: "yok", e: "Yok" },
  { v: "5", e: "5 dk önce" },
  { v: "15", e: "15 dk önce" },
  { v: "30", e: "30 dk önce" },
  { v: "60", e: "1 saat önce" },
  { v: "1440", e: "1 gün önce" },
];

export function EtkinlikDialog({ acik, onOpenChange, duzenle, baslangic, bitis, tumGun, takvimler }: Props) {
  const m = useEtkinlikMutasyonlari();
  const [baslik, setBaslik] = React.useState("");
  const [aciklama, setAciklama] = React.useState("");
  const [konum, setKonum] = React.useState("");
  const [tg, setTg] = React.useState(false);
  const [tarihBas, setTarihBas] = React.useState("");
  const [saatBas, setSaatBas] = React.useState("09:00");
  const [tarihBit, setTarihBit] = React.useState("");
  const [saatBit, setSaatBit] = React.useState("10:00");
  const [takvimId, setTakvimId] = React.useState("");
  const [renk, setRenk] = React.useState<string | null>(null);
  const [tekrarId, setTekrarId] = React.useState("yok");
  const [hatirlatici, setHatirlatici] = React.useState("yok");
  const [silOnay, setSilOnay] = React.useState(false);

  React.useEffect(() => {
    if (!acik) return;
    if (duzenle) {
      const b = new Date(duzenle.baslangic);
      const bi = duzenle.bitis ? new Date(duzenle.bitis) : new Date(b.getTime() + 3600_000);
      setBaslik(duzenle.baslik); setAciklama(duzenle.aciklama ?? ""); setKonum(duzenle.konum ?? "");
      setTg(duzenle.tum_gun); setTarihBas(format(b, "yyyy-MM-dd")); setSaatBas(format(b, "HH:mm"));
      setTarihBit(format(bi, "yyyy-MM-dd")); setSaatBit(format(bi, "HH:mm"));
      setTakvimId(duzenle.takvim_id ?? takvimler[0]?.id ?? "");
      setRenk(duzenle.renk); setTekrarId(kuraldanId(duzenle.tekrar_kural));
      setHatirlatici(duzenle.hatirlatici_dk == null ? "yok" : String(duzenle.hatirlatici_dk));
    } else {
      const b = baslangic ?? new Date();
      const bi = bitis ?? new Date(b.getTime() + 3600_000);
      setBaslik(""); setAciklama(""); setKonum(""); setTg(!!tumGun);
      setTarihBas(format(b, "yyyy-MM-dd")); setSaatBas(format(b, "HH:mm"));
      setTarihBit(format(bi, "yyyy-MM-dd")); setSaatBit(format(bi, "HH:mm"));
      setTakvimId(takvimler.find((t) => t.is_default)?.id ?? takvimler[0]?.id ?? "");
      setRenk(null); setTekrarId("yok"); setHatirlatici("yok");
    }
  }, [acik, duzenle, baslangic, bitis, tumGun, takvimler]);

  const kaydet = async () => {
    if (!baslik.trim() || !takvimId) return;
    const b = tg ? new Date(`${tarihBas}T00:00:00`) : new Date(`${tarihBas}T${saatBas}:00`);
    const bi = tg ? new Date(`${tarihBit}T23:59:59`) : new Date(`${tarihBit}T${saatBit}:00`);
    const kural = TEKRAR_SECENEK.find((s) => s.id === tekrarId)?.kural ?? null;
    const payload = {
      baslik: baslik.trim(),
      aciklama: aciklama || null,
      konum: konum || null,
      baslangic: b.toISOString(),
      bitis: tg ? null : bi.toISOString(),
      tum_gun: tg,
      tum_gun_bitis: tg ? tarihBit : null,
      takvim_id: takvimId,
      renk,
      tekrar: "yok" as const,
      tekrar_kural: kural,
      hatirlatici_dk: hatirlatici === "yok" ? null : parseInt(hatirlatici, 10),
    };
    if (duzenle) await m.guncelle.mutateAsync({ id: duzenle.id, ...payload });
    else await m.ekle.mutateAsync(payload);
    onOpenChange(false);
  };

  const cogalt = async () => {
    if (!duzenle) return;
    await m.ekle.mutateAsync({
      baslik: duzenle.baslik + " (kopya)", aciklama: duzenle.aciklama, konum: duzenle.konum,
      baslangic: duzenle.baslangic, bitis: duzenle.bitis, tum_gun: duzenle.tum_gun,
      tum_gun_bitis: duzenle.tum_gun_bitis, takvim_id: duzenle.takvim_id, renk: duzenle.renk,
      tekrar: duzenle.tekrar, tekrar_kural: duzenle.tekrar_kural, hatirlatici_dk: duzenle.hatirlatici_dk,
    });
    onOpenChange(false);
  };

  const sil = async () => {
    if (!duzenle) return;
    await m.sil.mutateAsync(duzenle.id);
    setSilOnay(false);
    onOpenChange(false);
  };

  const aktifRenk = renk ?? takvimler.find((t) => t.id === takvimId)?.renk ?? "cal-1";

  return (
    <>
      <Dialog open={acik} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{duzenle ? "Etkinliği düzenle" : "Yeni etkinlik"}</DialogTitle></DialogHeader>
          <div className="grid gap-3 max-h-[70vh] overflow-y-auto pr-1">
            <Input placeholder="Başlık" value={baslik} onChange={(e) => setBaslik(e.target.value)} className="text-base font-medium" />
            <div className="flex items-center gap-2">
              <Switch checked={tg} onCheckedChange={setTg} id="tg" />
              <Label htmlFor="tg">Tüm gün</Label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label className="text-xs">Başlangıç</Label><Input type="date" value={tarihBas} onChange={(e) => setTarihBas(e.target.value)} /></div>
              {!tg && <div><Label className="text-xs">&nbsp;</Label><Input type="time" value={saatBas} onChange={(e) => setSaatBas(e.target.value)} /></div>}
              <div><Label className="text-xs">Bitiş</Label><Input type="date" value={tarihBit} onChange={(e) => setTarihBit(e.target.value)} /></div>
              {!tg && <div><Label className="text-xs">&nbsp;</Label><Input type="time" value={saatBit} onChange={(e) => setSaatBit(e.target.value)} /></div>}
            </div>
            <div>
              <Label className="text-xs">Takvim</Label>
              <Select value={takvimId} onValueChange={setTakvimId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {takvimler.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      <span className="inline-flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: rengiBul(t.renk) }} />
                        {t.ad}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Renk</Label>
              <div className="flex flex-wrap gap-1.5 pt-1">
                <button type="button" onClick={() => setRenk(null)} className={`h-7 w-7 rounded-full border-2 ${renk == null ? "border-foreground" : "border-transparent"}`} title="Takvim rengi">
                  <span className="block h-full w-full rounded-full" style={{ background: rengiBul(takvimler.find((t) => t.id === takvimId)?.renk) }} />
                </button>
                {TAKVIM_RENKLERI.map((r) => (
                  <button type="button" key={r.id} onClick={() => setRenk(r.id)} className={`h-7 w-7 rounded-full border-2 ${renk === r.id ? "border-foreground" : "border-transparent"}`} title={r.ad}>
                    <span className="block h-full w-full rounded-full" style={{ background: r.oklch }} />
                  </button>
                ))}
              </div>
            </div>
            <div><Label className="text-xs">Konum</Label><Input value={konum} onChange={(e) => setKonum(e.target.value)} /></div>
            <div><Label className="text-xs">Açıklama</Label><Textarea value={aciklama} onChange={(e) => setAciklama(e.target.value)} rows={2} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Tekrar</Label>
                <Select value={tekrarId} onValueChange={setTekrarId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TEKRAR_SECENEK.map((s) => <SelectItem key={s.id} value={s.id}>{s.etiket}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Hatırlatıcı</Label>
                <Select value={hatirlatici} onValueChange={setHatirlatici}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {HATIRLATICI.map((h) => <SelectItem key={h.v} value={h.v}>{h.e}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter className="flex !justify-between gap-2">
            <div className="flex gap-1">
              {duzenle && <>
                <Button variant="ghost" size="icon" onClick={cogalt} title="Çoğalt"><Copy className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => setSilOnay(true)} title="Sil"><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </>}
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => onOpenChange(false)}>İptal</Button>
              <Button onClick={kaydet} disabled={!baslik.trim()} style={{ background: rengiBul(aktifRenk) }}>Kaydet</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog open={silOnay} onOpenChange={setSilOnay}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Etkinlik silinsin mi?</AlertDialogTitle>
            <AlertDialogDescription>Bu işlem geri alınamaz.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={sil}>Sil</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
