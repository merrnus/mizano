import * as React from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Trash2, Archive, CheckCircle2, RotateCcw, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  useHedef,
  useHedefGuncelle,
  useHedefSil,
  useHedefAdimlari,
  useSablonKayitlari,
} from "@/lib/hedef-hooks";
import { useKayitEkle } from "@/lib/cetele-hooks";
import { ALAN_ETIKET, ALAN_RENK_VAR } from "@/lib/cetele-tipleri";
import type { CeteleAlan } from "@/lib/cetele-tipleri";
import { ALAN_LISTESI, TIP_ETIKET, DURUM_ETIKET } from "@/lib/hedef-tipleri";
import { AdimListesi } from "@/components/mizan/hedef/adim-listesi";
import { StreakIsiHaritasi } from "@/components/mizan/hedef/streak-isi-haritasi";
import { tarihFormat } from "@/lib/cetele-tarih";
import { toast } from "sonner";

export const Route = createFileRoute("/mizan/hedef/$id")({
  head: () => ({
    meta: [
      { title: "Hedef detay — Mizan" },
    ],
  }),
  component: HedefDetay,
});

function HedefDetay() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { data: hedef, isLoading } = useHedef(id);
  const guncelle = useHedefGuncelle();
  const sil = useHedefSil();

  if (isLoading) {
    return <div className="mx-auto max-w-3xl px-4 py-10 text-sm text-muted-foreground">Yükleniyor…</div>;
  }
  if (!hedef) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <p className="text-sm text-muted-foreground">Hedef bulunamadı.</p>
        <Button asChild variant="ghost" className="mt-2">
          <Link to="/mizan/amel"><ArrowLeft className="mr-1 h-3 w-3" /> Geri</Link>
        </Button>
      </div>
    );
  }

  const renkVar = `var(${ALAN_RENK_VAR[hedef.alan]})`;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">
      <header className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2 h-7 gap-1 text-xs text-muted-foreground">
          <Link to="/mizan/amel"><ArrowLeft className="h-3 w-3" /> Hedefler</Link>
        </Button>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              <span style={{ color: renkVar }}>{ALAN_ETIKET[hedef.alan]}</span>
              <span>•</span>
              <span>{TIP_ETIKET[hedef.tip]}</span>
              <Badge variant="outline" className="ml-1 text-[9px] uppercase tracking-wider">
                {DURUM_ETIKET[hedef.durum]}
              </Badge>
            </div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">{hedef.ad}</h1>
            {hedef.aciklama && (
              <p className="mt-1 text-sm text-muted-foreground">{hedef.aciklama}</p>
            )}
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Hedefi sil?</AlertDialogTitle>
                <AlertDialogDescription>
                  "{hedef.ad}" hedefi ve tüm adımları kalıcı olarak silinecek.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                <AlertDialogAction
                  onClick={async () => {
                    await sil.mutateAsync(hedef.id);
                    toast.success("Hedef silindi");
                    navigate({ to: "/mizan/amel" });
                  }}
                >
                  Sil
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </header>

      <div className="space-y-6">
        <TipBolumu hedef={hedef} />

        <section className="space-y-3 rounded-xl border border-border bg-card p-4">
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Düzenle</h2>
          <DuzenleForm hedef={hedef} />
        </section>

        <section className="flex flex-wrap gap-2">
          {hedef.durum !== "tamamlandi" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                guncelle.mutate({
                  id: hedef.id,
                  durum: "tamamlandi",
                  tamamlanma: tarihFormat(new Date()),
                })
              }
            >
              <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Tamamlandı işaretle
            </Button>
          )}
          {hedef.durum === "tamamlandi" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => guncelle.mutate({ id: hedef.id, durum: "aktif", tamamlanma: null })}
            >
              <RotateCcw className="mr-1 h-3.5 w-3.5" /> Aktife al
            </Button>
          )}
          {hedef.durum !== "arsiv" && (
            <Button size="sm" variant="ghost" onClick={() => guncelle.mutate({ id: hedef.id, durum: "arsiv" })}>
              <Archive className="mr-1 h-3.5 w-3.5" /> Arşivle
            </Button>
          )}
          {hedef.durum === "arsiv" && (
            <Button size="sm" variant="ghost" onClick={() => guncelle.mutate({ id: hedef.id, durum: "aktif" })}>
              <RotateCcw className="mr-1 h-3.5 w-3.5" /> Aktife al
            </Button>
          )}
        </section>
      </div>
    </div>
  );
}

function TipBolumu({ hedef }: { hedef: NonNullable<ReturnType<typeof useHedef>["data"]> }) {
  const guncelle = useHedefGuncelle();
  const kayitEkle = useKayitEkle();
  const { data: adimlar = [] } = useHedefAdimlari(hedef.id);
  const { data: kayitlar = [] } = useSablonKayitlari(hedef.sablon_id, 90);
  const [miktar, setMiktar] = React.useState("");

  if (hedef.tip === "kurs" || hedef.tip === "proje") {
    const tamam = adimlar.filter((a) => a.tamamlandi).length;
    const yuzde = adimlar.length > 0 ? Math.round((tamam / adimlar.length) * 100) : 0;
    return (
      <section className="space-y-3 rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {hedef.tip === "kurs" ? "Modüller" : "Aşamalar"}
          </h2>
          <span className="text-xs text-muted-foreground">{tamam}/{adimlar.length} • {yuzde}%</span>
        </div>
        <Progress value={yuzde} className="h-1.5" />
        <AdimListesi hedefId={hedef.id} />
      </section>
    );
  }

  if (hedef.tip === "aliskanlik") {
    return (
      <section className="space-y-3 rounded-xl border border-border bg-card p-4">
        <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Son 90 gün</h2>
        {hedef.sablon_id ? (
          <StreakIsiHaritasi kayitlar={kayitlar} alan={hedef.alan} gunSayisi={90} />
        ) : (
          <p className="text-xs text-muted-foreground">Bu alışkanlık bir çetele şablonuna bağlı değil.</p>
        )}
        <p className="text-[11px] text-muted-foreground">
          Çeteleyi günlük doldurdukça streak otomatik artar.
        </p>
      </section>
    );
  }

  if (hedef.tip === "sayisal") {
    const hedefMiktar = Number(hedef.hedef_miktar ?? 0);
    const birikim = kayitlar.reduce((acc, k) => acc + Number(k.miktar), 0);
    const yuzde = hedefMiktar > 0 ? Math.min(100, Math.round((birikim / hedefMiktar) * 100)) : 0;
    return (
      <section className="space-y-3 rounded-xl border border-border bg-card p-4">
        <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">İlerleme</h2>
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-semibold tabular-nums">
            {birikim.toLocaleString("tr-TR")}
            <span className="text-base font-normal text-muted-foreground"> / {hedefMiktar.toLocaleString("tr-TR")} {hedef.birim ?? ""}</span>
          </span>
          <span className="text-sm font-medium">{yuzde}%</span>
        </div>
        <Progress value={yuzde} className="h-2" />
        {hedef.sablon_id ? (
          <p className="text-[11px] text-muted-foreground">
            Bağlı çeteleden son 90 günün toplamı.
          </p>
        ) : (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const m = Number(miktar);
              if (!m) return;
              const yeni = birikim + m;
              await guncelle.mutateAsync({ id: hedef.id, hedef_miktar: hedef.hedef_miktar });
              // Manuel ekleme için: notlar alanına ekleme yapmak yerine basitçe hedef_miktar düşürelim mi? 
              // Daha doğru: ilerleme alanı yok; manuel için başka tablo gerekli. Şimdilik notlara tarih ekle.
              await guncelle.mutateAsync({
                id: hedef.id,
                notlar: `${hedef.notlar ?? ""}\n${tarihFormat(new Date())}: +${m}`.trim(),
              });
              setMiktar("");
              toast.success(`+${m} eklendi (notlara işlendi). Çeteleye bağlamak için düzenle.`);
            }}
            className="flex gap-2"
          >
            <Input
              type="number"
              step="any"
              placeholder="Miktar ekle"
              value={miktar}
              onChange={(e) => setMiktar(e.target.value)}
            />
            <Button type="submit" size="sm" disabled={!miktar}>
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </form>
        )}
        {hedef.sablon_id && (
          <ManuelKayitFormu sablonId={hedef.sablon_id} />
        )}
      </section>
    );
  }

  // tekil
  return (
    <section className="space-y-3 rounded-xl border border-border bg-card p-4">
      <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Durum</h2>
      {hedef.durum === "tamamlandi" ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CheckCircle2 className="h-4 w-4" /> {hedef.tamamlanma ?? "tamamlandı"} tarihinde tamamlandı.
        </div>
      ) : (
        <Button
          onClick={() =>
            guncelle.mutate({
              id: hedef.id,
              durum: "tamamlandi",
              tamamlanma: tarihFormat(new Date()),
            })
          }
        >
          <CheckCircle2 className="mr-1 h-4 w-4" /> Tamamla
        </Button>
      )}
    </section>
  );
}

function ManuelKayitFormu({ sablonId }: { sablonId: string }) {
  const ekle = useKayitEkle();
  const [miktar, setMiktar] = React.useState("");
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const m = Number(miktar);
        if (!m) return;
        await ekle.mutateAsync({
          sablon_id: sablonId,
          tarih: tarihFormat(new Date()),
          miktar: m,
        });
        setMiktar("");
        toast.success(`+${m} çeteleye işlendi`);
      }}
      className="flex gap-2 pt-1"
    >
      <Input
        type="number"
        step="any"
        placeholder="Bugüne miktar ekle"
        value={miktar}
        onChange={(e) => setMiktar(e.target.value)}
      />
      <Button type="submit" size="sm" disabled={!miktar || ekle.isPending}>
        <Plus className="h-3.5 w-3.5" />
      </Button>
    </form>
  );
}

function DuzenleForm({ hedef }: { hedef: NonNullable<ReturnType<typeof useHedef>["data"]> }) {
  const guncelle = useHedefGuncelle();
  const [ad, setAd] = React.useState(hedef.ad);
  const [alan, setAlan] = React.useState<CeteleAlan>(hedef.alan);
  const [bitis, setBitis] = React.useState(hedef.bitis ?? "");
  const [notlar, setNotlar] = React.useState(hedef.notlar ?? "");

  React.useEffect(() => {
    setAd(hedef.ad);
    setAlan(hedef.alan);
    setBitis(hedef.bitis ?? "");
    setNotlar(hedef.notlar ?? "");
  }, [hedef.id, hedef.ad, hedef.alan, hedef.bitis, hedef.notlar]);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        await guncelle.mutateAsync({
          id: hedef.id,
          ad,
          alan,
          bitis: bitis || null,
          notlar: notlar || null,
        });
        toast.success("Güncellendi");
      }}
      className="grid gap-3 sm:grid-cols-2"
    >
      <div className="space-y-1.5 sm:col-span-2">
        <Label className="text-xs">Ad</Label>
        <Input value={ad} onChange={(e) => setAd(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Alan</Label>
        <Select value={alan} onValueChange={(v) => setAlan(v as CeteleAlan)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {ALAN_LISTESI.map((a) => (
              <SelectItem key={a} value={a}>{ALAN_ETIKET[a]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Bitiş tarihi</Label>
        <Input type="date" value={bitis} onChange={(e) => setBitis(e.target.value)} />
      </div>
      <div className="space-y-1.5 sm:col-span-2">
        <Label className="text-xs">Notlar</Label>
        <Textarea rows={2} value={notlar} onChange={(e) => setNotlar(e.target.value)} />
      </div>
      <div className="sm:col-span-2 flex justify-end">
        <Button type="submit" size="sm" disabled={guncelle.isPending}>Kaydet</Button>
      </div>
    </form>
  );
}
