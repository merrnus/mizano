import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Calendar, Plus, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { useDersler, useDersSil, useSinavlar } from "@/lib/ilim-hooks";
import {
  DERS_DURUM_ETIKET,
  type Ders,
  type DersDurum,
  type DersSinav,
} from "@/lib/ilim-tipleri";
import { DersForm } from "@/components/mizan/ilim/ders-form";

export const Route = createFileRoute("/mizan/ilim")({
  head: () => ({
    meta: [
      { title: "İlim — Mizan" },
      { name: "description", content: "Akademik dersler, sınavlar, projeler ve kaynaklar." },
    ],
  }),
  component: IlimSayfasi,
});

const DURUM_RENK: Record<DersDurum, string> = {
  izliyor: "bg-[var(--ilim)]/15 text-foreground border-[var(--ilim)]/40",
  restant: "bg-destructive/15 text-foreground border-destructive/40",
  gecti: "bg-muted text-muted-foreground border-border",
  birakti: "bg-muted text-muted-foreground border-border opacity-60",
};

function tarihFmt(t: string | null): string {
  if (!t) return "—";
  const d = new Date(t);
  return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "short" });
}

function sonrakiSinav(sinavlar: DersSinav[], dersId: string): DersSinav | null {
  const simdi = Date.now();
  return (
    sinavlar
      .filter((s) => s.ders_id === dersId && s.tarih && new Date(s.tarih).getTime() >= simdi)
      .sort((a, b) => new Date(a.tarih!).getTime() - new Date(b.tarih!).getTime())[0] ?? null
  );
}

function IlimSayfasi() {
  const { data: dersler = [], isLoading } = useDersler();
  const { data: sinavlar = [] } = useSinavlar();
  const [ekleAcik, setEkleAcik] = React.useState(false);

  const aktifDersler = dersler.filter((d) => !d.restant && d.durum !== "restant");
  const restantDersler = dersler.filter((d) => d.restant || d.durum === "restant");

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      <header className="mb-6 flex items-end justify-between">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2 h-7 gap-1 text-xs text-muted-foreground">
            <Link to="/mizan">
              <ArrowLeft className="h-3 w-3" /> İstikamet
            </Link>
          </Button>
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">İlim</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Dersler</h1>
        </div>
        <Dialog open={ekleAcik} onOpenChange={setEkleAcik}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1">
              <Plus className="h-4 w-4" /> Ders ekle
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Yeni ders</DialogTitle>
            </DialogHeader>
            <DersForm onBitti={() => setEkleAcik(false)} />
          </DialogContent>
        </Dialog>
      </header>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Yükleniyor…</p>
      ) : dersler.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center">
          <p className="text-sm text-muted-foreground">Henüz ders yok. Yukarıdan ekleyebilirsin.</p>
        </div>
      ) : (
        <Tabs defaultValue="aktif" className="w-full">
          <TabsList>
            <TabsTrigger value="aktif">
              Aktif <span className="ml-1.5 text-[10px] text-muted-foreground">({aktifDersler.length})</span>
            </TabsTrigger>
            <TabsTrigger value="restant">
              Restant <span className="ml-1.5 text-[10px] text-muted-foreground">({restantDersler.length})</span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="aktif" className="mt-4">
            {aktifDersler.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aktif ders yok.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {aktifDersler.map((d) => (
                  <DersKart key={d.id} ders={d} sinav={sonrakiSinav(sinavlar, d.id)} />
                ))}
              </div>
            )}
          </TabsContent>
          <TabsContent value="restant" className="mt-4">
            {restantDersler.length === 0 ? (
              <p className="text-sm text-muted-foreground">Restant ders yok.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {restantDersler.map((d) => (
                  <DersKart key={d.id} ders={d} sinav={sonrakiSinav(sinavlar, d.id)} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function DersKart({ ders, sinav }: { ders: Ders; sinav: DersSinav | null }) {
  const sil = useDersSil();
  const [duzenleAcik, setDuzenleAcik] = React.useState(false);

  return (
    <div className="group rounded-xl border border-border bg-card p-4 transition-colors hover:border-[var(--ilim)]/40">
      <div className="flex items-start justify-between gap-2">
        <Link
          to="/mizan/ilim/$id"
          params={{ id: ders.id }}
          className="min-w-0 flex-1"
        >
          <h3 className="truncate text-sm font-medium">{ders.ad}</h3>
          {ders.hoca && <p className="mt-0.5 text-[11px] text-muted-foreground">{ders.hoca}</p>}
        </Link>
        <div className="flex shrink-0 items-center gap-1">
          <Badge variant="outline" className={cn("text-[10px]", DURUM_RENK[ders.durum])}>
            {DERS_DURUM_ETIKET[ders.durum]}
          </Badge>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Calendar className="h-3 w-3" /> {sinav ? `${tarihFmt(sinav.tarih)}` : "Sınav yok"}
        </span>
        {!!ders.kredi && <span>{ders.kredi} kredi</span>}
        {ders.donem && <span>{ders.donem}</span>}
      </div>

      <div className="mt-3 flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <Dialog open={duzenleAcik} onOpenChange={setDuzenleAcik}>
          <DialogTrigger asChild>
            <Button size="icon" variant="ghost" className="h-7 w-7">
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Ders düzenle</DialogTitle>
            </DialogHeader>
            <DersForm ders={ders} onBitti={() => setDuzenleAcik(false)} />
          </DialogContent>
        </Dialog>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Dersi silmek istediğinden emin misin?</AlertDialogTitle>
              <AlertDialogDescription>
                "{ders.ad}" ve buna bağlı tüm sınav, proje, kaynak ve saat kayıtları silinecek.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>İptal</AlertDialogCancel>
              <AlertDialogAction onClick={() => sil.mutate(ders.id)}>Sil</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}