import * as React from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Calendar as CalIcon, MessageSquare, Trash2, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useGundemGuncelle,
  useGundemSil,
  useGundemSorumluAyarla,
  useGundemYorumlar,
  useGundemYorumEkle,
  useGundemYorumSil,
  useKisiler,
} from "@/lib/network-hooks";
import { GUNDEM_DURUMLAR } from "@/lib/network-tipleri";
import type { GundemDetay } from "@/lib/network-tipleri";
import { SorumluSecici } from "./sorumlu-secici";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function GundemDetaySheet({
  gundem,
  onClose,
}: {
  gundem: GundemDetay | null;
  onClose: () => void;
}) {
  const [silAcik, setSilAcik] = React.useState(false);
  const [icerik, setIcerik] = React.useState("");
  const [karar, setKarar] = React.useState("");
  const [deadline, setDeadline] = React.useState("");
  const [etiketGiris, setEtiketGiris] = React.useState("");
  const [etiketler, setEtiketler] = React.useState<string[]>([]);
  const [sorumlu_ids, setSorumluIds] = React.useState<string[]>([]);

  const guncelle = useGundemGuncelle();
  const sorumluAyarla = useGundemSorumluAyarla();
  const sil = useGundemSil();
  const kisilerQ = useKisiler();
  const kisiler = kisilerQ.data ?? [];

  React.useEffect(() => {
    if (gundem) {
      setIcerik(gundem.icerik);
      setKarar(gundem.karar ?? "");
      setDeadline(gundem.deadline ?? "");
      setEtiketler(gundem.etiketler);
      setSorumluIds(gundem.sorumlu_ids);
    }
  }, [gundem?.id]);

  if (!gundem) return null;

  const kaydet = async () => {
    await Promise.all([
      guncelle.mutateAsync({
        id: gundem.id,
        icerik: icerik.trim() || gundem.icerik,
        karar: karar || null,
        deadline: deadline || null,
        etiketler,
      }),
      sorumluAyarla.mutateAsync({ gundem_id: gundem.id, sorumlu_ids }),
    ]);
    toast.success("Kaydedildi");
    onClose();
  };

  const etiketEkle = () => {
    const t = etiketGiris.trim();
    if (t && !etiketler.includes(t)) setEtiketler([...etiketler, t]);
    setEtiketGiris("");
  };

  return (
    <>
      <Sheet open={!!gundem} onOpenChange={(o) => !o && onClose()}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Gündem</SheetTitle>
            <SheetDescription className="line-clamp-2">{gundem.icerik}</SheetDescription>
          </SheetHeader>

          <Tabs defaultValue="detay" className="mt-4">
            <TabsList className="w-full">
              <TabsTrigger value="detay" className="flex-1">
                Detay
              </TabsTrigger>
              <TabsTrigger value="ilerleme" className="flex-1 gap-1">
                <MessageSquare className="h-3.5 w-3.5" /> İlerleme ({gundem.yorum_sayisi})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="detay" className="mt-4 space-y-4">
              <Field label="İçerik">
                <Textarea value={icerik} onChange={(e) => setIcerik(e.target.value)} rows={3} />
              </Field>

              <Field label="Karar">
                <Textarea
                  value={karar}
                  onChange={(e) => setKarar(e.target.value)}
                  rows={2}
                  placeholder="Alınan karar / sonuç…"
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Deadline">
                  <Input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                  />
                </Field>
                <Field label="Durum">
                  <Select
                    value={gundem.durum}
                    onValueChange={(v) =>
                      guncelle.mutate({ id: gundem.id, durum: v as GundemDetay["durum"] })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GUNDEM_DURUMLAR.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.ad}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Öncelik">
                  <Select
                    value={gundem.oncelik}
                    onValueChange={(v) =>
                      guncelle.mutate({ id: gundem.id, oncelik: v as "ana" | "yan" })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ana">Ana gündem</SelectItem>
                      <SelectItem value="yan">Yan gündem</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <Field label="Sorumlular">
                <div className="flex flex-wrap items-center gap-1.5">
                  {sorumlu_ids.map((id) => {
                    const k = kisiler.find((x) => x.id === id);
                    if (!k) return null;
                    return (
                      <span
                        key={id}
                        className="flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-xs"
                      >
                        <Avatar className="h-4 w-4">
                          <AvatarFallback className="bg-muted text-[8px]">
                            {k.ad.split(" ").map((p) => p[0]).join("").slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        {k.ad}
                        <button
                          type="button"
                          onClick={() => setSorumluIds(sorumlu_ids.filter((s) => s !== id))}
                          className="ml-0.5 text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    );
                  })}
                  <SorumluSecici
                    secili={sorumlu_ids}
                    onChange={setSorumluIds}
                    trigger={
                      <Button size="sm" variant="outline" className="h-7 gap-1 text-xs">
                        + Sorumlu
                      </Button>
                    }
                  />
                </div>
              </Field>

              <Field label="Etiketler">
                <div className="flex flex-wrap items-center gap-1.5">
                  {etiketler.map((e) => (
                    <Badge key={e} variant="secondary" className="gap-1">
                      {e}
                      <button
                        type="button"
                        onClick={() => setEtiketler(etiketler.filter((x) => x !== e))}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  <Input
                    value={etiketGiris}
                    onChange={(e) => setEtiketGiris(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        etiketEkle();
                      }
                    }}
                    placeholder="Etiket + Enter"
                    className="h-7 w-32 text-xs"
                  />
                </div>
              </Field>

              <div className="flex items-center gap-1.5 rounded-md bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                <CalIcon className="h-3.5 w-3.5" />
                Eklendi: {format(new Date(gundem.created_at), "d MMM yyyy", { locale: tr })}
              </div>

              <div className="flex justify-between gap-2 border-t border-border pt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setSilAcik(true)}
                >
                  <Trash2 className="h-3.5 w-3.5" /> Sil
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={onClose}>
                    İptal
                  </Button>
                  <Button size="sm" onClick={kaydet}>
                    Kaydet
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="ilerleme" className="mt-4">
              <YorumlarSekme gundem_id={gundem.id} />
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>

      <AlertDialog open={silAcik} onOpenChange={setSilAcik}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Gündemi sil?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu gündem ve tüm yorumları silinecek. Geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Vazgeç</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                await sil.mutateAsync(gundem.id);
                toast.success("Silindi");
                setSilAcik(false);
                onClose();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}

function YorumlarSekme({ gundem_id }: { gundem_id: string }) {
  const yorumlarQ = useGundemYorumlar(gundem_id);
  const ekle = useGundemYorumEkle();
  const sil = useGundemYorumSil();
  const [metin, setMetin] = React.useState("");

  const gonder = async () => {
    if (!metin.trim()) return;
    await ekle.mutateAsync({ gundem_id, metin: metin.trim() });
    setMetin("");
  };

  const yorumlar = yorumlarQ.data ?? [];

  return (
    <div className="space-y-3">
      {yorumlar.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card/30 p-6 text-center text-xs text-muted-foreground">
          Henüz ilerleme notu yok.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {yorumlar.map((y) => (
            <div
              key={y.id}
              className={cn(
                "group/y rounded-lg border border-border bg-card p-3",
              )}
            >
              <div className="mb-1 flex items-center justify-between text-[10px] text-muted-foreground">
                <span>{format(new Date(y.created_at), "d MMM yyyy HH:mm", { locale: tr })}</span>
                <button
                  type="button"
                  onClick={() => sil.mutate(y.id)}
                  className="opacity-0 transition-opacity hover:text-destructive group-hover/y:opacity-100"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
              <p className="whitespace-pre-wrap text-sm text-foreground">{y.metin}</p>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-1.5">
        <Textarea
          value={metin}
          onChange={(e) => setMetin(e.target.value)}
          rows={2}
          placeholder="Yeni ilerleme notu…"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) gonder();
          }}
        />
        <Button size="sm" onClick={gonder} disabled={!metin.trim()}>
          <Send className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}