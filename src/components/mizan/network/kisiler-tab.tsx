import * as React from "react";
import { Pencil, Plus, Search, Trash2, X, Check, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useNavigate } from "@tanstack/react-router";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
  useKategoriler,
  useKategoriEkle,
  useKategoriGuncelle,
  useKategoriSil,
  useKisiler,
  useKisiEkle,
  useKisiGuncelle,
  useKisiSil,
  useKisiKategoriAyarla,
  useKisiGuncelleDetay,
} from "@/lib/network-hooks";
import type { KisiDetay } from "@/lib/network-tipleri";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function KisilerTab() {
  const [aktif, setAktif] = React.useState<string | "tumu" | "kategorisiz">("tumu");
  const [arama, setArama] = React.useState("");
  const [secili, setSecili] = React.useState<KisiDetay | null>(null);
  const [yeniKisiAd, setYeniKisiAd] = React.useState("");
  const navigate = useNavigate();

  const kategorilerQ = useKategoriler();
  const kisilerQ = useKisiler();
  const kategoriler = kategorilerQ.data ?? [];
  const kisiler = kisilerQ.data ?? [];

  const ekleKisi = useKisiEkle();

  const filtreli = kisiler.filter((k) => {
    const aramaUygun = k.ad.toLowerCase().includes(arama.toLowerCase());
    const katUygun =
      aktif === "tumu"
        ? true
        : aktif === "kategorisiz"
          ? k.kategori_ids.length === 0
          : k.kategori_ids.includes(aktif);
    return aramaUygun && katUygun;
  });

  const kisiEkleHizli = async () => {
    if (!yeniKisiAd.trim()) return;
    await ekleKisi.mutateAsync({
      ad: yeniKisiAd.trim(),
      kategori_ids:
        aktif !== "tumu" && aktif !== "kategorisiz" ? [aktif] : [],
    });
    setYeniKisiAd("");
    toast.success("Kişi eklendi");
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
      {/* Sol: Kategori paneli */}
      <KategoriPaneli
        aktif={aktif}
        setAktif={setAktif}
        kategoriler={kategoriler}
        kisiler={kisiler}
      />

      {/* Sağ: Kişi listesi */}
      <div>
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Kişi ara…"
              value={arama}
              onChange={(e) => setArama(e.target.value)}
              className="h-9 pl-8 text-sm"
            />
          </div>
          <div className="flex gap-1.5">
            <Input
              placeholder="Hızlı kişi ekle…"
              value={yeniKisiAd}
              onChange={(e) => setYeniKisiAd(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && kisiEkleHizli()}
              className="h-9 w-44 text-sm"
            />
            <Button size="sm" onClick={kisiEkleHizli} disabled={!yeniKisiAd.trim()}>
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {kisilerQ.isLoading ? (
          <div className="rounded-xl border border-border bg-card/50 p-6 text-center text-sm text-muted-foreground">
            Yükleniyor…
          </div>
        ) : filtreli.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card/30 p-8 text-center text-sm text-muted-foreground">
            {kisiler.length === 0
              ? "Henüz kişi yok. Yukarıdan ilk kişiyi ekle."
              : "Bu filtreye uyan kişi yok."}
          </div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {filtreli.map((k) => (
              <button
                key={k.id}
                onClick={() => {
                  if (k.derin_takip) {
                    navigate({
                      to: "/network/kisi/$id",
                      params: { id: k.id },
                      search: { tab: "profil" } as never,
                    });
                  } else {
                    setSecili(k);
                  }
                }}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 text-left transition-colors hover:border-primary/40"
              >
                <Avatar className="h-9 w-9 border border-border">
                  <AvatarFallback className="bg-muted text-xs">
                    {k.ad.split(" ").map((p) => p[0]).join("").slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <div className="truncate text-sm font-medium text-foreground">
                      {k.ad}
                    </div>
                    {k.derin_takip && (
                      <Star className="h-3 w-3 shrink-0 fill-primary text-primary" />
                    )}
                  </div>
                  <div className="mt-0.5 flex flex-wrap gap-1">
                    {k.kategori_ids.length === 0 ? (
                      <span className="text-[10px] text-muted-foreground">—</span>
                    ) : (
                      k.kategori_ids.slice(0, 3).map((kid) => {
                        const kat = kategoriler.find((x) => x.id === kid);
                        if (!kat) return null;
                        return (
                          <Badge
                            key={kid}
                            variant="outline"
                            className="text-[9px]"
                          >
                            {kat.ad}
                          </Badge>
                        );
                      })
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <KisiDetaySheet
        kisi={secili}
        kategoriler={kategoriler}
        onClose={() => setSecili(null)}
      />
    </div>
  );
}

function KategoriPaneli({
  aktif,
  setAktif,
  kategoriler,
  kisiler,
}: {
  aktif: string | "tumu" | "kategorisiz";
  setAktif: (v: string | "tumu" | "kategorisiz") => void;
  kategoriler: { id: string; ad: string }[];
  kisiler: KisiDetay[];
}) {
  const ekle = useKategoriEkle();
  const guncelle = useKategoriGuncelle();
  const sil = useKategoriSil();
  const [yeni, setYeni] = React.useState("");
  const [duzenle, setDuzenle] = React.useState<{ id: string; ad: string } | null>(null);

  const sayi = (id: string | "tumu" | "kategorisiz") => {
    if (id === "tumu") return kisiler.length;
    if (id === "kategorisiz") return kisiler.filter((k) => k.kategori_ids.length === 0).length;
    return kisiler.filter((k) => k.kategori_ids.includes(id as string)).length;
  };

  return (
    <div className="rounded-xl border border-border bg-card/50 p-2">
      <div className="mb-1 px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        Kategoriler
      </div>
      <KategoriSatir
        aktif={aktif === "tumu"}
        onClick={() => setAktif("tumu")}
        ad="Tümü"
        sayi={sayi("tumu")}
      />
      <KategoriSatir
        aktif={aktif === "kategorisiz"}
        onClick={() => setAktif("kategorisiz")}
        ad="Kategorisiz"
        sayi={sayi("kategorisiz")}
      />
      <div className="my-1 border-t border-border" />
      {kategoriler.map((k) => (
        <div key={k.id} className="group/kat relative">
          {duzenle?.id === k.id ? (
            <div className="flex items-center gap-1 px-1 py-1">
              <Input
                autoFocus
                value={duzenle.ad}
                onChange={(e) => setDuzenle({ ...duzenle, ad: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && duzenle.ad.trim()) {
                    guncelle.mutate({ id: duzenle.id, ad: duzenle.ad.trim() });
                    setDuzenle(null);
                  }
                  if (e.key === "Escape") setDuzenle(null);
                }}
                className="h-7 text-xs"
              />
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0"
                onClick={() => {
                  if (duzenle.ad.trim())
                    guncelle.mutate({ id: duzenle.id, ad: duzenle.ad.trim() });
                  setDuzenle(null);
                }}
              >
                <Check className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <KategoriSatir
              aktif={aktif === k.id}
              onClick={() => setAktif(k.id)}
              ad={k.ad}
              sayi={sayi(k.id)}
              actions={
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDuzenle({ id: k.id, ad: k.ad });
                    }}
                    className="rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`"${k.ad}" kategorisi silinsin mi?`)) sil.mutate(k.id);
                    }}
                    className="rounded p-0.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </>
              }
            />
          )}
        </div>
      ))}
      <div className="mt-1 flex items-center gap-1 px-1 py-1">
        <Input
          placeholder="Yeni kategori"
          value={yeni}
          onChange={(e) => setYeni(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && yeni.trim()) {
              ekle.mutate({ ad: yeni.trim() });
              setYeni("");
            }
          }}
          className="h-7 text-xs"
        />
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0"
          disabled={!yeni.trim()}
          onClick={() => {
            ekle.mutate({ ad: yeni.trim() });
            setYeni("");
          }}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

function KategoriSatir({
  aktif,
  onClick,
  ad,
  sayi,
  actions,
}: {
  aktif: boolean;
  onClick: () => void;
  ad: string;
  sayi: number;
  actions?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors",
        aktif ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
      )}
    >
      <span className="flex-1 truncate">{ad}</span>
      {actions && (
        <span className="hidden items-center gap-0.5 group-hover:flex">{actions}</span>
      )}
      <span className="text-[10px] tabular-nums text-muted-foreground">{sayi}</span>
    </button>
  );
}

function KisiDetaySheet({
  kisi,
  kategoriler,
  onClose,
}: {
  kisi: KisiDetay | null;
  kategoriler: { id: string; ad: string }[];
  onClose: () => void;
}) {
  const guncelle = useKisiGuncelle();
  const guncelleDetay = useKisiGuncelleDetay();
  const navigate = useNavigate();
  const ayarla = useKisiKategoriAyarla();
  const sil = useKisiSil();
  const [silAcik, setSilAcik] = React.useState(false);
  const [ad, setAd] = React.useState("");
  const [notlar, setNotlar] = React.useState("");
  const [secKategoriler, setSecKategoriler] = React.useState<string[]>([]);
  const [derin, setDerin] = React.useState(false);

  React.useEffect(() => {
    if (kisi) {
      setAd(kisi.ad);
      setNotlar(kisi.notlar ?? "");
      setSecKategoriler(kisi.kategori_ids);
      setDerin(kisi.derin_takip);
    }
  }, [kisi?.id]);

  const kaydet = async () => {
    if (!kisi) return;
    const derinDegisti = derin !== kisi.derin_takip;
    await Promise.all([
      guncelle.mutateAsync({ id: kisi.id, ad: ad.trim() || kisi.ad, notlar: notlar || null }),
      ayarla.mutateAsync({ kisi_id: kisi.id, kategori_ids: secKategoriler }),
      derinDegisti
        ? guncelleDetay.mutateAsync({ id: kisi.id, derin_takip: derin })
        : Promise.resolve(),
    ]);
    toast.success("Kaydedildi");
    if (derinDegisti && derin) {
      // Yeni derin takibe alındı → tam profil sayfasına yönlendir
      onClose();
      navigate({
        to: "/network/kisi/$id",
        params: { id: kisi.id },
        search: { tab: "profil" } as never,
      });
    } else {
      onClose();
    }
  };

  const toggleKat = (id: string) => {
    setSecKategoriler((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  };

  return (
    <>
      <Sheet open={!!kisi} onOpenChange={(o) => !o && onClose()}>
        <SheetContent className="w-full sm:max-w-md">
          {kisi && (
            <>
              <SheetHeader>
                <SheetTitle>Kişi Düzenle</SheetTitle>
                <SheetDescription>{kisi.ad}</SheetDescription>
              </SheetHeader>
              <div className="mt-4 space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Ad
                  </label>
                  <Input value={ad} onChange={(e) => setAd(e.target.value)} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Kategoriler
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {kategoriler.map((k) => {
                      const sel = secKategoriler.includes(k.id);
                      return (
                        <button
                          key={k.id}
                          type="button"
                          onClick={() => toggleKat(k.id)}
                          className={cn(
                            "rounded-full border px-2.5 py-1 text-xs transition-colors",
                            sel
                              ? "border-primary bg-primary/15 text-foreground"
                              : "border-border bg-background text-muted-foreground hover:text-foreground",
                          )}
                        >
                          {k.ad}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Notlar
                  </label>
                  <Textarea
                    value={notlar}
                    onChange={(e) => setNotlar(e.target.value)}
                    rows={4}
                    placeholder="Bu kişiyle ilgili notlar…"
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border bg-card/50 p-3">
                  <div className="min-w-0">
                    <Label className="text-sm font-medium">Derin takip</Label>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Açıkken kişi tam profil sayfasında açılır (akademik, faaliyetler, etkinlik geçmişi).
                    </p>
                  </div>
                  <Switch checked={derin} onCheckedChange={setDerin} />
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
                      <X className="h-3.5 w-3.5" /> İptal
                    </Button>
                    <Button size="sm" onClick={kaydet}>
                      <Check className="h-3.5 w-3.5" /> Kaydet
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={silAcik} onOpenChange={setSilAcik}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kişiyi sil?</AlertDialogTitle>
            <AlertDialogDescription>
              "{kisi?.ad}" silinecek. Atanmış olduğu gündemlerden de çıkarılır. Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Vazgeç</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!kisi) return;
                await sil.mutateAsync(kisi.id);
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