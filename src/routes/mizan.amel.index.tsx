import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Plus, BookOpen, Hammer, FolderOpen, GraduationCap, ChevronRight, Trash2, Pencil, Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useAmelAlanlar,
  useAmelAlanEkle,
  useAmelAlanGuncelle,
  useAmelAlanSil,
  useAmelKurslar,
  useAmelKursEkle,
  useTumAmelModuller,
  useAmelProjeler,
  useAmelProjeEkle,
  useAmelProjeGuncelle,
  useAmelProjeSil,
  useTumAmelProjeAdimlar,
} from "@/lib/amel-hooks";
import {
  KURS_DURUM_ETIKET,
  PROJE_DURUM_ETIKET,
  kursIlerleme,
  projeIlerleme,
  type AmelAlan,
  type AmelKurs,
  type AmelKursDurum,
  type AmelProje,
  type AmelProjeDurum,
} from "@/lib/amel-tipleri";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/mizan/amel/")({
  head: () => ({
    meta: [
      { title: "Müfredat — Mizan" },
      { name: "description", content: "Kendi öğrenme müfredatın: alanlar, kurslar, modüller, projeler." },
    ],
  }),
  component: AmelSayfasi,
});

function AmelSayfasi() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      <header className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2 h-7 gap-1 text-xs text-muted-foreground">
          <Link to="/mizan"><ArrowLeft className="h-3 w-3" /> İstikamet</Link>
        </Button>
        <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--amel)]">Amel</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Müfredat</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Kendi öğrenme yol haritan — alanlar, kurslar, projeler.
        </p>
      </header>

      <Tabs defaultValue="mufredat">
        <TabsList>
          <TabsTrigger value="mufredat" className="gap-1.5">
            <GraduationCap className="h-3.5 w-3.5" /> Müfredat
          </TabsTrigger>
          <TabsTrigger value="proje" className="gap-1.5">
            <Hammer className="h-3.5 w-3.5" /> Projeler
          </TabsTrigger>
        </TabsList>

        <TabsContent value="mufredat" className="mt-4">
          <MufredatSekmesi />
        </TabsContent>
        <TabsContent value="proje" className="mt-4">
          <ProjelerSekmesi />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ---------------- Müfredat (Alanlar + Kurslar) ---------------- */

function MufredatSekmesi() {
  const { data: alanlar = [], isLoading } = useAmelAlanlar();
  const { data: kurslar = [] } = useAmelKurslar();
  const { data: moduller = [] } = useTumAmelModuller();
  const [acikAlan, setAcikAlan] = React.useState(false);

  const aktifAlanlar = alanlar.filter((a) => !a.arsiv);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {aktifAlanlar.length} alan · {kurslar.length} kurs
        </p>
        <Dialog open={acikAlan} onOpenChange={setAcikAlan}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1">
              <Plus className="h-3.5 w-3.5" /> Yeni alan
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yeni alan</DialogTitle>
            </DialogHeader>
            <AlanForm onBitti={() => setAcikAlan(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Yükleniyor…</p>
      ) : aktifAlanlar.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-4 py-12 text-center">
          <GraduationCap className="mx-auto h-8 w-8 text-muted-foreground/40" />
          <p className="mt-3 text-sm text-muted-foreground">
            Henüz alan yok. İlk alanı ekleyerek müfredatını oluştur.
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground/70">
            Örn: Networking, DevOps, Web, Sistem, Güvenlik…
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {aktifAlanlar.map((alan) => (
            <AlanBolumu
              key={alan.id}
              alan={alan}
              kurslar={kurslar.filter((k) => k.alan_id === alan.id)}
              moduller={moduller}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AlanBolumu({
  alan,
  kurslar,
  moduller,
}: {
  alan: AmelAlan;
  kurslar: AmelKurs[];
  moduller: ReturnType<typeof useTumAmelModuller>["data"] extends infer T ? (T extends undefined ? never : T) : never;
}) {
  const [acikKurs, setAcikKurs] = React.useState(false);
  const [acikDuzen, setAcikDuzen] = React.useState(false);
  const sil = useAmelAlanSil();
  const renk = alan.renk || "var(--amel)";

  return (
    <section className="rounded-2xl border border-border bg-card p-4 sm:p-5">
      <header className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: renk }}
              aria-hidden
            />
            <h3 className="text-sm font-semibold">{alan.ad}</h3>
            <Badge variant="outline" className="text-[10px]">
              {kurslar.length} kurs
            </Badge>
          </div>
          {alan.aciklama && (
            <p className="mt-1 text-[11px] text-muted-foreground">{alan.aciklama}</p>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Dialog open={acikDuzen} onOpenChange={setAcikDuzen}>
            <DialogTrigger asChild>
              <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground">
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Alanı düzenle</DialogTitle>
              </DialogHeader>
              <AlanForm alan={alan} onBitti={() => setAcikDuzen(false)} />
            </DialogContent>
          </Dialog>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-destructive"
            onClick={() => {
              if (confirm(`"${alan.ad}" alanını ve içindeki tüm kursları silmek istediğine emin misin?`)) {
                sil.mutate(alan.id);
              }
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
          <Dialog open={acikKurs} onOpenChange={setAcikKurs}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="ml-1 h-7 gap-1 text-xs">
                <Plus className="h-3 w-3" /> Kurs
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Yeni kurs · {alan.ad}</DialogTitle>
              </DialogHeader>
              <KursForm alanId={alan.id} onBitti={() => setAcikKurs(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {kurslar.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-6 text-center text-[11px] text-muted-foreground">
          Bu alanda henüz kurs yok.
        </div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {kurslar.map((kurs) => {
            const km = moduller.filter((m) => m.kurs_id === kurs.id);
            const ilerleme = kursIlerleme(km);
            const tamamlanan = km.filter((m) => m.tamamlandi).length;
            return (
              <Link
                key={kurs.id}
                to="/mizan/amel/$id"
                params={{ id: kurs.id }}
                className="group rounded-xl border border-border bg-background p-3 transition-colors hover:border-foreground/30"
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="h-3 w-3 text-muted-foreground" />
                      <span className="truncate text-sm font-medium">{kurs.ad}</span>
                    </div>
                    {kurs.saglayici && (
                      <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                        {kurs.saglayici}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
                </div>
                <div className="mb-1.5 flex items-center justify-between text-[10px]">
                  <KursDurumRozet durum={kurs.durum} />
                  {km.length > 0 && (
                    <span className="text-muted-foreground">
                      {tamamlanan}/{km.length} · %{ilerleme}
                    </span>
                  )}
                </div>
                <Progress value={ilerleme} className="h-1" />
                {kurs.sertifika_tarihi && (
                  <p className="mt-2 text-[10px] text-muted-foreground">
                    Sertifika: {new Date(kurs.sertifika_tarihi).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" })}
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}

function KursDurumRozet({ durum }: { durum: AmelKursDurum }) {
  const renk: Record<AmelKursDurum, string> = {
    planli: "border-border text-muted-foreground",
    aktif: "border-[var(--amel)]/40 bg-[var(--amel)]/10 text-[var(--amel)]",
    tamam: "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  };
  return (
    <span className={cn("rounded-full border px-1.5 py-0.5", renk[durum])}>
      {KURS_DURUM_ETIKET[durum]}
    </span>
  );
}

/* ---------------- Alan formu ---------------- */

function AlanForm({ alan, onBitti }: { alan?: AmelAlan; onBitti: () => void }) {
  const ekle = useAmelAlanEkle();
  const guncelle = useAmelAlanGuncelle();
  const [ad, setAd] = React.useState(alan?.ad ?? "");
  const [aciklama, setAciklama] = React.useState(alan?.aciklama ?? "");
  const [renk, setRenk] = React.useState(alan?.renk ?? "");

  async function kaydet(e: React.FormEvent) {
    e.preventDefault();
    if (!ad.trim()) return;
    try {
      if (alan) {
        await guncelle.mutateAsync({
          id: alan.id,
          ad: ad.trim(),
          aciklama: aciklama.trim() || null,
          renk: renk.trim() || null,
        });
        toast.success("Alan güncellendi");
      } else {
        await ekle.mutateAsync({
          ad: ad.trim(),
          aciklama: aciklama.trim() || null,
          renk: renk.trim() || null,
        });
        toast.success("Alan eklendi");
      }
      onBitti();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Hata");
    }
  }

  return (
    <form onSubmit={kaydet} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="alan-ad" className="text-xs">Ad</Label>
        <Input id="alan-ad" required value={ad} onChange={(e) => setAd(e.target.value)} placeholder="Örn: Networking" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="alan-aciklama" className="text-xs">Açıklama (opsiyonel)</Label>
        <Textarea id="alan-aciklama" rows={2} value={aciklama} onChange={(e) => setAciklama(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="alan-renk" className="text-xs">Renk (CSS, opsiyonel)</Label>
        <Input
          id="alan-renk"
          value={renk}
          onChange={(e) => setRenk(e.target.value)}
          placeholder="örn: #f59e0b veya oklch(0.7 0.15 60)"
        />
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={ekle.isPending || guncelle.isPending}>
          {alan ? "Güncelle" : "Ekle"}
        </Button>
      </div>
    </form>
  );
}

/* ---------------- Kurs formu ---------------- */

const KURS_DURUMLAR: AmelKursDurum[] = ["planli", "aktif", "tamam"];

function KursForm({ alanId, onBitti }: { alanId: string; onBitti: () => void }) {
  const ekle = useAmelKursEkle();
  const [ad, setAd] = React.useState("");
  const [saglayici, setSaglayici] = React.useState("");
  const [durum, setDurum] = React.useState<AmelKursDurum>("planli");
  const [sertifikaTarihi, setSertifikaTarihi] = React.useState("");
  const [aciklama, setAciklama] = React.useState("");

  async function kaydet(e: React.FormEvent) {
    e.preventDefault();
    if (!ad.trim()) return;
    try {
      await ekle.mutateAsync({
        alan_id: alanId,
        ad: ad.trim(),
        saglayici: saglayici.trim() || null,
        durum,
        sertifika_tarihi: sertifikaTarihi || null,
        aciklama: aciklama.trim() || null,
      });
      toast.success("Kurs eklendi");
      onBitti();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Hata");
    }
  }

  return (
    <form onSubmit={kaydet} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="kurs-ad" className="text-xs">Kurs adı</Label>
        <Input id="kurs-ad" required value={ad} onChange={(e) => setAd(e.target.value)} placeholder="Örn: CCNA 200-301" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="kurs-saglayici" className="text-xs">Sağlayıcı</Label>
          <Input
            id="kurs-saglayici"
            value={saglayici}
            onChange={(e) => setSaglayici(e.target.value)}
            placeholder="Cisco, Udemy…"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Durum</Label>
          <Select value={durum} onValueChange={(v) => setDurum(v as AmelKursDurum)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {KURS_DURUMLAR.map((d) => (
                <SelectItem key={d} value={d}>
                  {KURS_DURUM_ETIKET[d]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="kurs-sertifika" className="text-xs">Sertifika sınavı tarihi (opsiyonel)</Label>
        <Input
          id="kurs-sertifika"
          type="date"
          value={sertifikaTarihi}
          onChange={(e) => setSertifikaTarihi(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="kurs-aciklama" className="text-xs">Açıklama (opsiyonel)</Label>
        <Textarea id="kurs-aciklama" rows={2} value={aciklama} onChange={(e) => setAciklama(e.target.value)} />
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={ekle.isPending}>
          {ekle.isPending ? "Ekleniyor…" : "Ekle"}
        </Button>
      </div>
    </form>
  );
}

/* ---------------- Projeler ---------------- */

const PROJE_DURUMLAR: AmelProjeDurum[] = ["planli", "devam", "beklemede", "tamam", "iptal"];

function ProjelerSekmesi() {
  const { data: projeler = [], isLoading } = useAmelProjeler();
  const { data: alanlar = [] } = useAmelAlanlar();
  const { data: kurslar = [] } = useAmelKurslar();
  const { data: tumAdimlar = [] } = useTumAmelProjeAdimlar();
  const [acik, setAcik] = React.useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{projeler.length} proje</p>
        <Dialog open={acik} onOpenChange={setAcik}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1">
              <Plus className="h-3.5 w-3.5" /> Yeni proje
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yeni proje</DialogTitle>
            </DialogHeader>
            <ProjeForm
              alanlar={alanlar}
              kurslar={kurslar}
              onBitti={() => setAcik(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Yükleniyor…</p>
      ) : projeler.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-4 py-12 text-center">
          <FolderOpen className="mx-auto h-8 w-8 text-muted-foreground/40" />
          <p className="mt-3 text-sm text-muted-foreground">
            Henüz proje yok. İlk projeni ekle.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {projeler.map((p) => (
            <ProjeKart
              key={p.id}
              proje={p}
              kurs={kurslar.find((k) => k.id === p.kurs_id) ?? null}
              ilerleme={projeIlerleme(tumAdimlar.filter((a) => a.proje_id === p.id))}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ProjeKart({
  proje,
  kurs,
  ilerleme,
}: {
  proje: AmelProje;
  kurs: AmelKurs | null;
  ilerleme: number;
}) {
  const sil = useAmelProjeSil();
  const guncelle = useAmelProjeGuncelle();
  const gecmis =
    proje.deadline &&
    proje.durum !== "tamam" &&
    proje.durum !== "iptal" &&
    new Date(proje.deadline) < new Date();

  return (
    <article className="group rounded-xl border border-border bg-card p-3">
      <header className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h4 className="truncate text-sm font-medium">{proje.ad}</h4>
          {kurs && (
            <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
              ↳ {kurs.ad}
            </p>
          )}
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6 shrink-0 text-destructive opacity-0 transition-opacity group-hover:opacity-100"
          onClick={() => {
            if (confirm("Bu projeyi silmek istediğine emin misin?")) sil.mutate(proje.id);
          }}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </header>

      {proje.aciklama && (
        <p className="mb-2 line-clamp-2 text-[11px] text-muted-foreground">{proje.aciklama}</p>
      )}

      <div className="mb-1.5 flex items-center justify-between text-[10px]">
        <Select
          value={proje.durum}
          onValueChange={(v) => guncelle.mutate({ id: proje.id, durum: v as AmelProjeDurum })}
        >
          <SelectTrigger className="h-6 w-auto border-0 bg-muted px-2 text-[10px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PROJE_DURUMLAR.map((d) => (
              <SelectItem key={d} value={d}>
                {PROJE_DURUM_ETIKET[d]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {ilerleme > 0 && <span className="text-muted-foreground">%{ilerleme}</span>}
      </div>
      <Progress value={ilerleme} className="h-1" />

      {proje.deadline && (
        <p className={cn("mt-2 text-[10px]", gecmis ? "text-destructive" : "text-muted-foreground")}>
          Deadline: {new Date(proje.deadline).toLocaleDateString("tr-TR", { day: "2-digit", month: "short" })}
        </p>
      )}

      {proje.repo_url && (
        <a
          href={proje.repo_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground"
          onClick={(e) => e.stopPropagation()}
        >
          <Github className="h-2.5 w-2.5" /> GitHub
        </a>
      )}
    </article>
  );
}

function ProjeForm({
  alanlar,
  kurslar,
  onBitti,
}: {
  alanlar: AmelAlan[];
  kurslar: AmelKurs[];
  onBitti: () => void;
}) {
  const ekle = useAmelProjeEkle();
  const [ad, setAd] = React.useState("");
  const [aciklama, setAciklama] = React.useState("");
  const [alanId, setAlanId] = React.useState<string>("");
  const [kursId, setKursId] = React.useState<string>("");
  const [durum, setDurum] = React.useState<AmelProjeDurum>("planli");
  const [deadline, setDeadline] = React.useState("");
  const [repoUrl, setRepoUrl] = React.useState("");

  const ilgiliKurslar = alanId ? kurslar.filter((k) => k.alan_id === alanId) : kurslar;

  async function kaydet(e: React.FormEvent) {
    e.preventDefault();
    if (!ad.trim()) return;
    try {
      await ekle.mutateAsync({
        ad: ad.trim(),
        aciklama: aciklama.trim() || null,
        alan_id: alanId || null,
        kurs_id: kursId || null,
        durum,
        deadline: deadline || null,
        repo_url: repoUrl.trim() || null,
      });
      toast.success("Proje eklendi");
      onBitti();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Hata");
    }
  }

  return (
    <form onSubmit={kaydet} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="proje-ad" className="text-xs">Proje adı</Label>
        <Input id="proje-ad" required value={ad} onChange={(e) => setAd(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="proje-aciklama" className="text-xs">Açıklama</Label>
        <Textarea id="proje-aciklama" rows={2} value={aciklama} onChange={(e) => setAciklama(e.target.value)} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs">Alan (opsiyonel)</Label>
          <Select value={alanId || "yok"} onValueChange={(v) => { setAlanId(v === "yok" ? "" : v); setKursId(""); }}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yok">— Yok —</SelectItem>
              {alanlar.map((a) => (
                <SelectItem key={a.id} value={a.id}>{a.ad}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Kurs (opsiyonel)</Label>
          <Select value={kursId || "yok"} onValueChange={(v) => setKursId(v === "yok" ? "" : v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yok">— Yok —</SelectItem>
              {ilgiliKurslar.map((k) => (
                <SelectItem key={k.id} value={k.id}>{k.ad}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Durum</Label>
          <Select value={durum} onValueChange={(v) => setDurum(v as AmelProjeDurum)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROJE_DURUMLAR.map((d) => (
                <SelectItem key={d} value={d}>{PROJE_DURUM_ETIKET[d]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="proje-deadline" className="text-xs">Deadline (opsiyonel)</Label>
          <Input
            id="proje-deadline"
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="proje-repo" className="text-xs">GitHub bağlantısı (opsiyonel)</Label>
        <Input
          id="proje-repo"
          type="url"
          placeholder="https://github.com/kullanici/repo"
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
        />
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={ekle.isPending}>
          {ekle.isPending ? "Ekleniyor…" : "Ekle"}
        </Button>
      </div>
    </form>
  );
}