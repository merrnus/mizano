import * as React from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import {
  ArrowLeft,
  Calendar,
  Check,
  ChevronRight,
  FileText,
  MessageSquare,
  Plus,
  Trash2,
  Save,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  useIstisare,
  useIstisareler,
  useIstisareGuncelle,
  useIstisareSil,
  useGundemler,
  useGundemTopluEkle,
  useGundemGuncelle,
  useGundemTasi,
  useKisiler,
  useGundemSorumluAyarla,
} from "@/lib/network-hooks";
import { GUNDEM_DURUMLAR } from "@/lib/network-tipleri";
import type { GundemDetay, GundemDurum, GundemOncelik } from "@/lib/network-tipleri";
import { GundemDetaySheet } from "@/components/mizan/network/gundem-detay-sheet";
import { SorumluSecici } from "@/components/mizan/network/sorumlu-secici";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/network/istisare/$id")({
  head: () => ({
    meta: [{ title: "İstişare — Gündemler" }],
  }),
  component: IstisareDetay,
});

function IstisareDetay() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const istisareQ = useIstisare(id);
  const guncelle = useIstisareGuncelle();
  const sil = useIstisareSil();
  const gundemlerQ = useGundemler({ istisare_id: id });
  const topluEkle = useGundemTopluEkle();
  const tasi = useGundemTasi();
  const istisarelerQ = useIstisareler();

  const [topluMetin, setTopluMetin] = React.useState("");
  const [seciliGundem, setSeciliGundem] = React.useState<GundemDetay | null>(null);
  const [silAcik, setSilAcik] = React.useState(false);
  const [tasiAcik, setTasiAcik] = React.useState(false);
  const [hedefIstisare, setHedefIstisare] = React.useState<string>("");
  const [baslikDuzenle, setBaslikDuzenle] = React.useState(false);
  const [baslik, setBaslik] = React.useState("");
  const [notlar, setNotlar] = React.useState("");
  const [notlarKayitDurumu, setNotlarKayitDurumu] = React.useState<"idle" | "kaydediliyor" | "kaydedildi">("idle");

  React.useEffect(() => {
    if (istisareQ.data) {
      setBaslik(istisareQ.data.baslik);
      setNotlar(istisareQ.data.notlar ?? "");
    }
  }, [istisareQ.data?.id]);

  const notlarKaydet = async () => {
    setNotlarKayitDurumu("kaydediliyor");
    try {
      await guncelle.mutateAsync({ id, notlar });
      setNotlarKayitDurumu("kaydedildi");
      toast.success("Notlar kaydedildi");
      setTimeout(() => setNotlarKayitDurumu("idle"), 2000);
    } catch {
      setNotlarKayitDurumu("idle");
      toast.error("Kaydedilemedi");
    }
  };

  if (istisareQ.isLoading) {
    return <div className="p-6 text-center text-sm text-muted-foreground">Yükleniyor…</div>;
  }

  if (!istisareQ.data) {
    return (
      <div className="p-6 text-center text-sm text-muted-foreground">
        İstişare bulunamadı.
        <div className="mt-3">
          <Link to="/network" search={{ tab: "istisareler" }} className="text-primary underline">
            Geri dön
          </Link>
        </div>
      </div>
    );
  }

  const istisare = istisareQ.data;
  const gundemler = gundemlerQ.data ?? [];
  const bitmemis = gundemler.filter((g) => g.durum !== "yapildi");

  const topluKaydet = async () => {
    const satirlar = topluMetin
      .split("\n")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    if (satirlar.length === 0) return;
    const sayi = await topluEkle.mutateAsync({ istisare_id: id, satirlar });
    toast.success(`${sayi} gündem eklendi`);
    setTopluMetin("");
  };

  const tasimaKaydet = async () => {
    if (!hedefIstisare || bitmemis.length === 0) return;
    await tasi.mutateAsync({
      gundem_ids: bitmemis.map((g) => g.id),
      hedef_istisare_id: hedefIstisare,
    });
    toast.success(`${bitmemis.length} gündem taşındı`);
    setTasiAcik(false);
    setHedefIstisare("");
  };

  const baslikKaydet = async () => {
    await guncelle.mutateAsync({
      id,
      baslik: baslik.trim() || istisare.baslik,
      notlar,
    });
    setBaslikDuzenle(false);
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
      {/* Header */}
      <div className="mb-5">
        <Link
          to="/network"
          search={{ tab: "istisareler" }}
          className="mb-3 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> İstişareler
        </Link>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            {baslikDuzenle ? (
              <div className="flex items-center gap-2">
                <Input
                  value={baslik}
                  onChange={(e) => setBaslik(e.target.value)}
                  className="text-xl font-semibold"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") baslikKaydet();
                    if (e.key === "Escape") setBaslikDuzenle(false);
                  }}
                />
                <Button size="sm" onClick={baslikKaydet}>
                  <Check className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setBaslikDuzenle(true)}
                className="text-left text-2xl font-semibold tracking-tight text-foreground hover:opacity-80 sm:text-3xl"
              >
                {istisare.baslik}
              </button>
            )}
            <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              {format(new Date(istisare.tarih), "d MMMM yyyy, EEEE", { locale: tr })}
              <span>·</span>
              <span>
                {gundemler.length} gündem · {gundemler.filter((g) => g.durum === "yapildi").length} tamam
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            {bitmemis.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setTasiAcik(true)}
                className="gap-1.5"
              >
                <ChevronRight className="h-3.5 w-3.5" /> Bitmeyenleri Taşı
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              onClick={() => setSilAcik(true)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Genel notlar */}
      <div className="mb-5">
        <div className="mb-1.5 flex items-center justify-between">
          <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Toplantı Notları
          </label>
          <div className="flex items-center gap-2">
            {notlarKayitDurumu === "kaydedildi" && (
              <span className="flex items-center gap-1 text-[10px] text-[var(--maneviyat)]">
                <Check className="h-3 w-3" /> Kaydedildi
              </span>
            )}
            <Button
              size="sm"
              variant="outline"
              className="h-7 gap-1 text-xs"
              onClick={notlarKaydet}
              disabled={
                notlarKayitDurumu === "kaydediliyor" ||
                notlar === (istisare.notlar ?? "")
              }
            >
              <Save className="h-3 w-3" />
              {notlarKayitDurumu === "kaydediliyor" ? "Kaydediliyor…" : "Kaydet"}
            </Button>
          </div>
        </div>
        <Textarea
          value={notlar}
          onChange={(e) => setNotlar(e.target.value)}
          rows={3}
          placeholder="Genel toplantı notları, katılımcılar vb."
          className="resize-none"
        />
        {notlar !== (istisare.notlar ?? "") && notlarKayitDurumu !== "kaydedildi" && (
          <p className="mt-1 text-[10px] text-muted-foreground">
            Kaydedilmemiş değişiklikler var
          </p>
        )}
      </div>

      {/* Toplu yapıştırma */}
      <div className="mb-5 rounded-xl border border-dashed border-primary/40 bg-primary/5 p-4">
        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
          <FileText className="h-4 w-4 text-primary" /> Toplu Gündem Girişi
        </div>
        <p className="mb-2 text-xs text-muted-foreground">
          Her satır bir gündem maddesidir. Yapıştır veya yaz, ardından "İçe Aktar"a bas.
        </p>
        <Textarea
          value={topluMetin}
          onChange={(e) => setTopluMetin(e.target.value)}
          rows={5}
          placeholder={"Bahar pikniği planlaması\nYeni katılımcılarla 1-on-1\nKitap okuma grubu başlatma"}
          className="font-mono text-sm"
        />
        <div className="mt-2 flex justify-end">
          <Button size="sm" onClick={topluKaydet} disabled={!topluMetin.trim()}>
            <Plus className="h-3.5 w-3.5" /> İçe Aktar
          </Button>
        </div>
      </div>

      {/* Gündem tablosu */}
      <div className="rounded-xl border border-border bg-card/50 p-2">
        {gundemler.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Henüz gündem yok. Yukarıdaki kutudan toplu olarak ekle.
          </div>
        ) : (
          <div className="flex flex-col">
            {gundemler.map((g) => (
              <GundemSatir
                key={g.id}
                g={g}
                onAc={() => setSeciliGundem(g)}
              />
            ))}
          </div>
        )}
      </div>

      <GundemDetaySheet gundem={seciliGundem} onClose={() => setSeciliGundem(null)} />

      <AlertDialog open={silAcik} onOpenChange={setSilAcik}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>İstişareyi sil?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu istişare ve içindeki {gundemler.length} gündem silinecek. Geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Vazgeç</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                await sil.mutateAsync(id);
                toast.success("İstişare silindi");
                navigate({ to: "/network", search: { tab: "istisareler" } });
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={tasiAcik} onOpenChange={setTasiAcik}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bitmeyen gündemleri taşı</DialogTitle>
            <DialogDescription>
              {bitmemis.length} gündem hangi istişareye taşınsın?
            </DialogDescription>
          </DialogHeader>
          <Select value={hedefIstisare} onValueChange={setHedefIstisare}>
            <SelectTrigger>
              <SelectValue placeholder="İstişare seç…" />
            </SelectTrigger>
            <SelectContent>
              {(istisarelerQ.data ?? [])
                .filter((i) => i.id !== id)
                .map((i) => (
                  <SelectItem key={i.id} value={i.id}>
                    {format(new Date(i.tarih), "d MMM yyyy", { locale: tr })} — {i.baslik}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTasiAcik(false)}>
              İptal
            </Button>
            <Button onClick={tasimaKaydet} disabled={!hedefIstisare}>
              Taşı
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function GundemSatir({ g, onAc }: { g: GundemDetay; onAc: () => void }) {
  const guncelle = useGundemGuncelle();
  const kisilerQ = useKisiler();
  const kisiler = kisilerQ.data ?? [];
  const sorumluAyarlaM = useGundemSorumluAyarla();

  const durum = GUNDEM_DURUMLAR.find((d) => d.id === g.durum)!;
  const geciken =
    g.deadline && g.durum !== "yapildi" && new Date(g.deadline) < new Date();

  return (
    <div
      className={cn(
        "group/g grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-2 border-b border-border/50 px-2 py-2 transition-colors last:border-b-0 hover:bg-accent/30",
        geciken && "bg-destructive/5",
      )}
    >
      <button
        type="button"
        onClick={() =>
          guncelle.mutate({
            id: g.id,
            durum: g.durum === "yapildi" ? "bekliyor" : "yapildi",
          })
        }
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors",
          g.durum === "yapildi"
            ? "border-[var(--maneviyat)] bg-[var(--maneviyat)] text-white"
            : "border-border hover:border-primary",
        )}
      >
        {g.durum === "yapildi" && <Check className="h-3 w-3" />}
      </button>

      <button
        type="button"
        onClick={onAc}
        className="min-w-0 text-left"
      >
        <div
          className={cn(
            "truncate text-sm",
            g.durum === "yapildi" && "text-muted-foreground line-through",
            g.oncelik === "ana" && "font-medium",
          )}
        >
          {g.icerik}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
          {g.etiketler.map((e) => (
            <Badge key={e} variant="secondary" className="px-1 py-0 text-[9px]">
              {e}
            </Badge>
          ))}
          {g.yorum_sayisi > 0 && (
            <span className="flex items-center gap-0.5">
              <MessageSquare className="h-3 w-3" /> {g.yorum_sayisi}
            </span>
          )}
          {g.karar && <span className="italic">"karar var"</span>}
        </div>
      </button>

      {/* Öncelik toggle */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          guncelle.mutate({
            id: g.id,
            oncelik: g.oncelik === "ana" ? "yan" : "ana",
          });
        }}
        title={g.oncelik === "ana" ? "Ana gündem" : "Yan gündem"}
        className={cn(
          "rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors",
          g.oncelik === "ana"
            ? "bg-primary/15 text-primary hover:bg-primary/25"
            : "bg-muted text-muted-foreground hover:bg-muted/70",
        )}
      >
        {g.oncelik === "ana" ? "Ana" : "Yan"}
      </button>

      {/* Sorumlular */}
      <SorumluSecici
        secili={g.sorumlu_ids}
        onChange={(ids) => sorumluAyarlaM.mutate({ gundem_id: g.id, sorumlu_ids: ids })}
        align="end"
        trigger={
          <button
            type="button"
            className="flex items-center -space-x-1.5 rounded px-1 py-0.5 hover:bg-accent"
          >
            {g.sorumlu_ids.length === 0 ? (
              <span className="text-[10px] text-muted-foreground">+ Ata</span>
            ) : (
              g.sorumlu_ids.slice(0, 3).map((id) => {
                const k = kisiler.find((x) => x.id === id);
                if (!k) return null;
                return (
                  <Avatar key={id} className="h-5 w-5 border border-card">
                    <AvatarFallback className="bg-muted text-[8px]">
                      {k.ad.split(" ").map((p) => p[0]).join("").slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                );
              })
            )}
            {g.sorumlu_ids.length > 3 && (
              <span className="ml-1 text-[10px] text-muted-foreground">
                +{g.sorumlu_ids.length - 3}
              </span>
            )}
          </button>
        }
      />

      {/* Deadline */}
      <input
        type="date"
        value={g.deadline ?? ""}
        onChange={(e) =>
          guncelle.mutate({ id: g.id, deadline: e.target.value || null })
        }
        className={cn(
          "h-7 rounded border border-border bg-transparent px-1.5 text-[11px] tabular-nums",
          geciken && "border-destructive text-destructive",
        )}
      />

      {/* Durum */}
      <Select
        value={g.durum}
        onValueChange={(v) => guncelle.mutate({ id: g.id, durum: v as GundemDurum })}
      >
        <SelectTrigger className="h-7 w-28 px-2 text-[11px]">
          <span className="flex items-center gap-1.5">
            <span className={cn("h-1.5 w-1.5 rounded-full", durum.renk)} />
            {durum.ad}
          </span>
        </SelectTrigger>
        <SelectContent>
          {GUNDEM_DURUMLAR.map((d) => (
            <SelectItem key={d.id} value={d.id}>
              {d.ad}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}