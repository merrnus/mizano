import * as React from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Eye, EyeOff, Star, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  useKategoriler,
  useKisi,
  useKisiGuncelleDetay,
  useKisiSil,
} from "@/lib/network-hooks";
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
import { KardesProfilForm } from "@/components/mizan/network/kardes-profil-form";
import { KardesFaaliyetTimeline } from "@/components/mizan/network/kardes-faaliyet-timeline";
import { ManeviyatTab } from "@/components/mizan/network/maneviyat-tab";
import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import { toast } from "sonner";

type TabId = "profil" | "faaliyetler" | "maneviyat";
type Search = { kt: TabId };

export const Route = createFileRoute("/network/kisi/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Kişi · ${params.id} — Mizan` },
      { name: "description", content: "Kardeş profili ve faaliyet geçmişi." },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): Search => {
    const t = s.kt;
    if (t === "faaliyetler" || t === "maneviyat" || t === "profil") {
      return { kt: t };
    }
    return { kt: "profil" };
  },
  component: KisiDetay,
  notFoundComponent: () => (
    <div className="mx-auto max-w-md py-12 text-center">
      <p className="text-sm text-muted-foreground">Bu kişi bulunamadı.</p>
      <Link to="/network" search={{ tab: "kisiler" }} className="mt-3 inline-block underline">
        Kişilere dön
      </Link>
    </div>
  ),
});

function KisiDetay() {
  const { id } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const tab = search.kt;

  const { data: kisi, isLoading } = useKisi(id);
  const { data: kategoriler = [] } = useKategoriler();
  const guncelle = useKisiGuncelleDetay();
  const sil = useKisiSil();
  const [silAcik, setSilAcik] = React.useState(false);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 text-sm text-muted-foreground">Yükleniyor…</div>
    );
  }
  if (!kisi) {
    return (
      <div className="mx-auto max-w-md px-4 py-12 text-center">
        <p className="text-sm text-muted-foreground">Bu kişi bulunamadı.</p>
        <Link
          to="/network"
          search={{ tab: "kisiler" }}
          className="mt-3 inline-block text-sm underline"
        >
          Kişilere dön
        </Link>
      </div>
    );
  }

  const initials = kisi.ad
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const kisiKategoriler = kategoriler.filter((k) => kisi.kategori_ids.includes(k.id));

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      {/* Üst nav */}
      <Button
        asChild
        variant="ghost"
        size="sm"
        className="mb-4 -ml-2 h-8 text-muted-foreground hover:text-foreground"
      >
        <Link to="/network" search={{ tab: "kisiler" }}>
          <ArrowLeft className="h-3.5 w-3.5" /> Kişilere dön
        </Link>
      </Button>

      {/* Üst kart */}
      <header className="mb-6 flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:gap-5">
        <Avatar className="h-16 w-16 border border-border sm:h-20 sm:w-20">
          {kisi.foto_url ? <AvatarImage src={kisi.foto_url} alt={kisi.ad} /> : null}
          <AvatarFallback className="bg-muted text-base">{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-xl font-semibold tracking-tight sm:text-2xl">{kisi.ad}</h1>
            {kisi.derin_takip && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary">
                <Star className="h-3 w-3" /> Derin takip
              </span>
            )}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            {kisi.universite && <span>{kisi.universite}</span>}
            {kisi.bolum && <span>· {kisi.bolum}</span>}
            {kisi.sinif && <span>· {kisi.sinif}</span>}
            {kisi.dogum_tarihi && (
              <span>· 🎂 {format(parseISO(kisi.dogum_tarihi), "d MMMM", { locale: tr })}</span>
            )}
          </div>
          {kisiKategoriler.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {kisiKategoriler.map((k) => (
                <Badge key={k.id} variant="outline" className="text-[10px]">
                  {k.ad}
                </Badge>
              ))}
            </div>
          )}
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={async () => {
            await guncelle.mutateAsync({ id: kisi.id, derin_takip: !kisi.derin_takip });
            toast.success(kisi.derin_takip ? "Derin takip kapatıldı" : "Derin takibe alındı");
          }}
        >
          {kisi.derin_takip ? (
            <>
              <EyeOff className="h-3.5 w-3.5" /> Derin takibi kapat
            </>
          ) : (
            <>
              <Eye className="h-3.5 w-3.5" /> Derin takibe al
            </>
          )}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => setSilAcik(true)}
        >
          <Trash2 className="h-3.5 w-3.5" /> Sil
        </Button>
      </header>

      {/* Tabs */}
      <Tabs
        value={tab}
        onValueChange={(v) => {
          const next = v as TabId;
          navigate({
            to: "/network/kisi/$id",
            params: { id },
            search: (prev: Search) => ({ ...prev, kt: next }),
            replace: true,
          });
        }}
      >
        <TabsList className="mb-4">
          <TabsTrigger value="profil">Profil</TabsTrigger>
          <TabsTrigger value="faaliyetler">Faaliyetler</TabsTrigger>
          <TabsTrigger value="maneviyat">Maneviyat</TabsTrigger>
        </TabsList>
        <TabsContent value="profil">
          <KardesProfilForm kisi={kisi} />
        </TabsContent>
        <TabsContent value="faaliyetler">
          <KardesFaaliyetTimeline kisiId={kisi.id} />
        </TabsContent>
        <TabsContent value="maneviyat">
          <ManeviyatTab kisiId={kisi.id} />
        </TabsContent>
      </Tabs>

      <AlertDialog open={silAcik} onOpenChange={setSilAcik}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kişiyi sil?</AlertDialogTitle>
            <AlertDialogDescription>
              "{kisi.ad}" silinecek. Atanmış olduğu gündemlerden de çıkarılır. Bu işlem geri
              alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                await sil.mutateAsync(kisi.id);
                toast.success(`"${kisi.ad}" silindi`);
                navigate({ to: "/network", search: { tab: "kisiler" } as never });
              }}
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