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
  const [inlineEdit, setInlineEdit] = React.useState<{ id: string; ad: string } | null>(null);
  const [silAdayi, setSilAdayi] = React.useState<KisiDetay | null>(null);
  const navigate = useNavigate();

  const kategorilerQ = useKategoriler();
  const kisilerQ = useKisiler();
  const kategoriler = kategorilerQ.data ?? [];
  const kisiler = kisilerQ.data ?? [];

  const ekleKisi = useKisiEkle();
  const guncelleKisi = useKisiGuncelle();
  const silKisi = useKisiSil();

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

  const inlineKaydet = async () => {
    if (!inlineEdit) return;
    const yeniAd = inlineEdit.ad.trim();
    if (!yeniAd) {
      setInlineEdit(null);
      return;
    }
    await guncelleKisi.mutateAsync({ id: inlineEdit.id, ad: yeniAd });
    setInlineEdit(null);
    toast.success("İsim güncellendi");
  };

  const silOnayla = async () => {
    if (!silAdayi) return;
    await silKisi.mutateAsync(silAdayi.id);
    toast.success(`"${silAdayi.ad}" silindi`);
    setSilAdayi(null);
  };

  return (
    <div className="space-y-3">
      {/* Üst: Kategori chip bar */}
      <KategoriChipBar
        aktif={aktif}
        setAktif={setAktif}
        kategoriler={kategoriler}
        kisiler={kisiler}
      />

      {/* Kişi listesi */}
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
            {filtreli.map((k) => {
              const isEditing = inlineEdit?.id === k.id;
              return (
                <div
                  key={k.id}
                  className="group/kisi relative flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:border-primary/40"
                >
                  <Avatar className="h-9 w-9 border border-border">
                    <AvatarFallback className="bg-muted text-xs">
                      {k.ad.split(" ").map((p) => p[0]).join("").slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  {isEditing ? (
                    <div className="flex min-w-0 flex-1 items-center gap-1">
                      <Input
                        autoFocus
                        value={inlineEdit.ad}
                        onChange={(e) =>
                          setInlineEdit({ id: inlineEdit.id, ad: e.target.value })
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            inlineKaydet();
                          }
                          if (e.key === "Escape") setInlineEdit(null);
                        }}
                        className="h-7 text-sm"
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        onClick={inlineKaydet}
                      >
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        onClick={() => setInlineEdit(null)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <button
                      type="button"
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
                      className="min-w-0 flex-1 text-left"
                    >
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
                    </button>
                  )}
                  {!isEditing && (
                    <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover/kisi:opacity-100 focus-within:opacity-100">
                      <button
                        type="button"
                        aria-label="İsmi düzenle"
                        onClick={() => setInlineEdit({ id: k.id, ad: k.ad })}
                        className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        aria-label="Kişiyi sil"
                        onClick={() => setSilAdayi(k)}
                        className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <KisiDetaySheet
        kisi={secili}
        kategoriler={kategoriler}
        onClose={() => setSecili(null)}
      />

      <AlertDialog open={!!silAdayi} onOpenChange={(o) => !o && setSilAdayi(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kişiyi sil?</AlertDialogTitle>
            <AlertDialogDescription>
              "{silAdayi?.ad}" silinecek. Atanmış olduğu gündemlerden de çıkarılır. Bu işlem
              geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={silOnayla}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function KategoriChipBar({
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
  const [yeniAcik, setYeniAcik] = React.useState(false);
  const [duzenle, setDuzenle] = React.useState<{ id: string; ad: string } | null>(null);

  const sayi = (id: string | "tumu" | "kategorisiz") => {
    if (id === "tumu") return kisiler.length;
    if (id === "kategorisiz") return kisiler.filter((k) => k.kategori_ids.length === 0).length;
    return kisiler.filter((k) => k.kategori_ids.includes(id as string)).length;
  };

  const yeniKaydet = () => {
    const v = yeni.trim();
    if (!v) return;
    ekle.mutate({ ad: v });
    setYeni("");
    setYeniAcik(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Chip
        aktif={aktif === "tumu"}
        onClick={() => setAktif("tumu")}
        ad="Tümü"
        sayi={sayi("tumu")}
      />
      <Chip
        aktif={aktif === "kategorisiz"}
        onClick={() => setAktif("kategorisiz")}
        ad="Kategorisiz"
        sayi={sayi("kategorisiz")}
      />
      <span className="mx-1 h-4 w-px bg-border" />
      {kategoriler.map((k) =>
        duzenle?.id === k.id ? (
          <div
            key={k.id}
            className="inline-flex items-center gap-1 rounded-full border border-primary/50 bg-card px-1.5 py-0.5"
          >
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
              className="h-6 w-24 border-0 px-1 text-xs shadow-none focus-visible:ring-0"
            />
            <button
              type="button"
              onClick={() => {
                if (duzenle.ad.trim())
                  guncelle.mutate({ id: duzenle.id, ad: duzenle.ad.trim() });
                setDuzenle(null);
              }}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Kaydet"
            >
              <Check className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={() => setDuzenle(null)}
              className="text-muted-foreground hover:text-foreground"
              aria-label="İptal"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <Chip
            key={k.id}
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
                  className="rounded text-muted-foreground hover:text-foreground"
                  aria-label="Düzenle"
                >
                  <Pencil className="h-2.5 w-2.5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`"${k.ad}" kategorisi silinsin mi?`)) sil.mutate(k.id);
                  }}
                  className="rounded text-muted-foreground hover:text-destructive"
                  aria-label="Sil"
                >
                  <Trash2 className="h-2.5 w-2.5" />
                </button>
              </>
            }
          />
        ),
      )}

      {yeniAcik ? (
        <div className="inline-flex items-center gap-1 rounded-full border border-primary/50 bg-card px-1.5 py-0.5">
          <Input
            autoFocus
            value={yeni}
            onChange={(e) => setYeni(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                yeniKaydet();
              }
              if (e.key === "Escape") {
                setYeni("");
                setYeniAcik(false);
              }
            }}
            placeholder="Yeni kategori"
            className="h-6 w-28 border-0 px-1 text-xs shadow-none focus-visible:ring-0"
          />
          <button
            type="button"
            onClick={yeniKaydet}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Ekle"
          >
            <Check className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={() => {
              setYeni("");
              setYeniAcik(false);
            }}
            className="text-muted-foreground hover:text-foreground"
            aria-label="İptal"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setYeniAcik(true)}
          className="inline-flex items-center gap-1 rounded-full border border-dashed border-border px-2 py-0.5 text-[11px] text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
        >
          <Plus className="h-3 w-3" /> Yeni
        </button>
      )}
    </div>
  );
}

function Chip({
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
    <div
      className={cn(
        "group/chip inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] transition-colors",
        aktif
          ? "border-primary/40 bg-primary/15 text-foreground"
          : "border-border bg-background text-muted-foreground hover:text-foreground",
      )}
    >
      <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center gap-1"
      >
        <span>{ad}</span>
        <span className="tabular-nums opacity-70">{sayi}</span>
      </button>
      {actions && (
        <span className="ml-0.5 hidden items-center gap-1 group-hover/chip:flex">{actions}</span>
      )}
    </div>
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
    onClose();
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