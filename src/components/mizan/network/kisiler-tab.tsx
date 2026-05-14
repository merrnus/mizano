import * as React from "react";
import { Pencil, Plus, Trash2, X, Check, Star, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  Dialog,
  DialogContent,
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
import type { Kategori, KisiDetay } from "@/lib/network-tipleri";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Props = {
  arama?: string;
  fabTetik?: number;
};

type AktifKat = string | "tumu" | "kategorisiz" | "yildizli";

export function KisilerTab({ arama = "", fabTetik = 0 }: Props) {
  const [aktif, setAktif] = React.useState<AktifKat>("tumu");
  const [secili, setSecili] = React.useState<KisiDetay | null>(null);
  const [inlineEdit, setInlineEdit] = React.useState<{ id: string; ad: string } | null>(null);
  const [silAdayi, setSilAdayi] = React.useState<KisiDetay | null>(null);
  const [yeniKisiAcik, setYeniKisiAcik] = React.useState(false);
  const [yeniKisiAd, setYeniKisiAd] = React.useState("");
  const navigate = useNavigate();

  const kategorilerQ = useKategoriler();
  const kisilerQ = useKisiler();
  const kategoriler = kategorilerQ.data ?? [];
  const kisiler = kisilerQ.data ?? [];

  const ekleKisi = useKisiEkle();
  const guncelleKisi = useKisiGuncelle();
  const silKisi = useKisiSil();

  // FAB tetiği
  const ilkRef = React.useRef(true);
  React.useEffect(() => {
    if (ilkRef.current) {
      ilkRef.current = false;
      return;
    }
    setYeniKisiAcik(true);
  }, [fabTetik]);

  const filtreli = kisiler.filter((k) => {
    const aramaUygun = arama ? k.ad.toLowerCase().includes(arama.toLowerCase()) : true;
    if (!aramaUygun) return false;
    if (aktif === "tumu") return true;
    if (aktif === "kategorisiz") return k.kategori_ids.length === 0;
    if (aktif === "yildizli") return k.derin_takip;
    return k.kategori_ids.includes(aktif);
  });

  const kisiEkleHizli = async () => {
    if (!yeniKisiAd.trim()) return;
    await ekleKisi.mutateAsync({
      ad: yeniKisiAd.trim(),
      kategori_ids:
        aktif !== "tumu" && aktif !== "kategorisiz" && aktif !== "yildizli" ? [aktif] : [],
    });
    setYeniKisiAd("");
    setYeniKisiAcik(false);
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
    <div className="md:grid md:grid-cols-[200px_1fr] md:gap-6">
      {/* Sol: Kategori rail (md+) — mobilde chip bar */}
      <KategoriRail
        aktif={aktif}
        setAktif={setAktif}
        kategoriler={kategoriler}
        kisiler={kisiler}
      />

      {/* Sağ: Kişi listesi */}
      <div className="min-w-0">
        {kisilerQ.isLoading ? (
          <div className="rounded-xl border border-border bg-card/50 p-6 text-center text-sm text-muted-foreground">
            Yükleniyor…
          </div>
        ) : filtreli.length === 0 ? (
          <BosDurum
            kategoriYok={kisiler.length === 0}
            onYeni={() => setYeniKisiAcik(true)}
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            {filtreli.map((k, idx) => {
              const isEditing = inlineEdit?.id === k.id;
              const ilkKategori = kategoriler.find((kat) => kat.id === k.kategori_ids[0]);
              return (
                <div
                  key={k.id}
                  className={cn(
                    "group/kisi flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-accent/40",
                    idx > 0 && "border-t border-border/60",
                  )}
                >
                  {/* Avatar — kategori rengi halka olarak */}
                  <div className="relative shrink-0">
                    <Avatar
                      className="h-9 w-9 border-2"
                      style={{
                        borderColor: ilkKategori?.renk
                          ? `color-mix(in oklab, var(${ilkKategori.renk}) 60%, transparent)`
                          : "transparent",
                      }}
                    >
                      <AvatarFallback className="bg-muted text-xs">
                        {k.ad.split(" ").map((p) => p[0]).join("").slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    {k.derin_takip && (
                      <Star className="absolute -right-0.5 -top-0.5 h-3 w-3 fill-primary text-primary drop-shadow-sm" />
                    )}
                  </div>

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
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={inlineKaydet}>
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
                      <div className="truncate text-sm font-medium text-foreground">
                        {k.ad}
                      </div>
                      <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
                        {k.kategori_ids.length === 0
                          ? "Kategorisiz"
                          : k.kategori_ids
                              .map((kid) => kategoriler.find((x) => x.id === kid)?.ad)
                              .filter(Boolean)
                              .join(" · ")}
                      </div>
                    </button>
                  )}

                  {!isEditing && (
                    <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover/kisi:opacity-100 focus-within:opacity-100">
                      <button
                        type="button"
                        aria-label="İsmi düzenle"
                        onClick={() => setInlineEdit({ id: k.id, ad: k.ad })}
                        className="rounded-full p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        aria-label="Kişiyi sil"
                        onClick={() => setSilAdayi(k)}
                        className="rounded-full p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
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

      {/* Yeni kişi dialog (FAB tetikli) */}
      <Dialog open={yeniKisiAcik} onOpenChange={setYeniKisiAcik}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yeni Kişi</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Input
              autoFocus
              placeholder="Ad Soyad"
              value={yeniKisiAd}
              onChange={(e) => setYeniKisiAd(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && kisiEkleHizli()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setYeniKisiAcik(false)}>
              İptal
            </Button>
            <Button onClick={kisiEkleHizli} disabled={!yeniKisiAd.trim()}>
              Ekle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

function BosDurum({ kategoriYok, onYeni }: { kategoriYok: boolean; onYeni: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/30 px-6 py-12 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Users className="h-5 w-5" />
      </div>
      <p className="text-sm text-muted-foreground">
        {kategoriYok
          ? "Henüz kişi yok. İlk yol arkadaşını ekle."
          : "Bu filtreye uyan kişi yok."}
      </p>
      {kategoriYok && (
        <Button size="sm" className="mt-3 gap-1.5" onClick={onYeni}>
          <Plus className="h-3.5 w-3.5" /> Yeni kişi
        </Button>
      )}
    </div>
  );
}

/** Sol kategori rail — md+ dikey, mobilde yatay scroll chip bar. */
function KategoriRail({
  aktif,
  setAktif,
  kategoriler,
  kisiler,
}: {
  aktif: AktifKat;
  setAktif: (v: AktifKat) => void;
  kategoriler: Kategori[];
  kisiler: KisiDetay[];
}) {
  const ekle = useKategoriEkle();
  const guncelle = useKategoriGuncelle();
  const sil = useKategoriSil();
  const [yeni, setYeni] = React.useState("");
  const [yeniAcik, setYeniAcik] = React.useState(false);
  const [duzenle, setDuzenle] = React.useState<{ id: string; ad: string } | null>(null);

  const sayi = (id: AktifKat) => {
    if (id === "tumu") return kisiler.length;
    if (id === "kategorisiz") return kisiler.filter((k) => k.kategori_ids.length === 0).length;
    if (id === "yildizli") return kisiler.filter((k) => k.derin_takip).length;
    return kisiler.filter((k) => k.kategori_ids.includes(id as string)).length;
  };

  const yeniKaydet = () => {
    const v = yeni.trim();
    if (!v) return;
    ekle.mutate({ ad: v });
    setYeni("");
    setYeniAcik(false);
  };

  const ozeller: { id: AktifKat; ad: string; icon?: React.ReactNode }[] = [
    { id: "tumu", ad: "Tümü" },
    { id: "yildizli", ad: "Yıldızlı", icon: <Star className="h-3 w-3 fill-primary text-primary" /> },
    { id: "kategorisiz", ad: "Kategorisiz" },
  ];

  return (
    <>
      {/* Mobil: yatay chip bar */}
      <div className="mb-3 flex flex-wrap items-center gap-1.5 md:hidden">
        {ozeller.map((o) => (
          <RailChip
            key={String(o.id)}
            aktif={aktif === o.id}
            onClick={() => setAktif(o.id)}
            ad={o.ad}
            sayi={sayi(o.id)}
            icon={o.icon}
          />
        ))}
        <span className="mx-0.5 h-4 w-px bg-border" />
        {kategoriler.map((k) => (
          <RailChip
            key={k.id}
            aktif={aktif === k.id}
            onClick={() => setAktif(k.id)}
            ad={k.ad}
            sayi={sayi(k.id)}
            renk={k.renk}
          />
        ))}
      </div>

      {/* md+: dikey rail */}
      <aside className="hidden md:block">
        <nav className="flex flex-col gap-0.5">
          {ozeller.map((o) => (
            <RailItem
              key={String(o.id)}
              aktif={aktif === o.id}
              onClick={() => setAktif(o.id)}
              ad={o.ad}
              sayi={sayi(o.id)}
              icon={o.icon}
            />
          ))}
        </nav>
        <div className="my-3 h-px bg-border" />
        <div className="mb-1.5 px-2 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Kategoriler
        </div>
        <nav className="flex flex-col gap-0.5">
          {kategoriler.map((k) =>
            duzenle?.id === k.id ? (
              <div
                key={k.id}
                className="flex items-center gap-1 rounded-full border border-primary/50 bg-card px-2 py-1"
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
                  className="h-6 border-0 px-1 text-xs shadow-none focus-visible:ring-0"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (duzenle.ad.trim())
                      guncelle.mutate({ id: duzenle.id, ad: duzenle.ad.trim() });
                    setDuzenle(null);
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Check className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => setDuzenle(null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <RailItem
                key={k.id}
                aktif={aktif === k.id}
                onClick={() => setAktif(k.id)}
                ad={k.ad}
                sayi={sayi(k.id)}
                renk={k.renk}
                actions={
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDuzenle({ id: k.id, ad: k.ad });
                      }}
                      className="rounded p-0.5 text-muted-foreground hover:text-foreground"
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
                      className="rounded p-0.5 text-muted-foreground hover:text-destructive"
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
            <div className="mt-1 flex items-center gap-1 rounded-full border border-primary/50 bg-card px-2 py-1">
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
                className="h-6 border-0 px-1 text-xs shadow-none focus-visible:ring-0"
              />
              <button
                type="button"
                onClick={yeniKaydet}
                className="text-muted-foreground hover:text-foreground"
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
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setYeniAcik(true)}
              className="mt-1 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <Plus className="h-3 w-3" /> Yeni kategori
            </button>
          )}
        </nav>
      </aside>
    </>
  );
}

function RailItem({
  aktif,
  onClick,
  ad,
  sayi,
  renk,
  icon,
  actions,
}: {
  aktif: boolean;
  onClick: () => void;
  ad: string;
  sayi: number;
  renk?: string | null;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "group/rail flex items-center gap-2 rounded-full px-3 py-1.5 text-sm transition-colors",
        aktif
          ? "bg-primary/15 font-medium text-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-foreground",
      )}
    >
      <button type="button" onClick={onClick} className="flex min-w-0 flex-1 items-center gap-2">
        {renk && (
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: `var(${renk})` }}
          />
        )}
        {icon}
        <span className="truncate">{ad}</span>
        <span className="ml-auto text-[11px] tabular-nums opacity-70">{sayi}</span>
      </button>
      {actions && (
        <span className="hidden items-center gap-0.5 group-hover/rail:flex">{actions}</span>
      )}
    </div>
  );
}

function RailChip({
  aktif,
  onClick,
  ad,
  sayi,
  renk,
  icon,
}: {
  aktif: boolean;
  onClick: () => void;
  ad: string;
  sayi: number;
  renk?: string | null;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] transition-colors",
        aktif
          ? "border-primary/40 bg-primary/15 text-foreground"
          : "border-border bg-background text-muted-foreground hover:text-foreground",
      )}
    >
      {renk && (
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: `var(${renk})` }}
        />
      )}
      {icon}
      <span>{ad}</span>
      <span className="tabular-nums opacity-70">{sayi}</span>
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
