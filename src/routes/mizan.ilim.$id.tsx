import * as React from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Check,
  Calendar,
  Clock,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Link2,
  StickyNote,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import {
  useDers,
  useSinavlar,
  useSinavEkle,
  useSinavSil,
  useProjeler,
  useProjeEkle,
  useProjeGuncelle,
  useProjeSil,
  useKaynaklar,
  useKaynakEkle,
  useKaynakSil,
  useDersSaatleri,
  useDersSaatEkle,
  useDersSaatSil,
  dosyaImzalıUrl,
} from "@/lib/ilim-hooks";
import {
  DERS_DURUM_ETIKET,
  HAFTA_GUN_LISTESI,
  HAFTA_GUN_TAM,
  KAYNAK_TIP_ETIKET,
  SINAV_TIP_ETIKET,
  type DersKaynakTip,
  type DersSinavTip,
  type HaftaGun,
} from "@/lib/ilim-tipleri";
import { toast } from "sonner";

export const Route = createFileRoute("/mizan/ilim/$id")({
  head: () => ({
    meta: [{ title: "Ders — Mizan" }],
  }),
  component: DersDetay,
});

function DersDetay() {
  const { id } = Route.useParams();
  const { data: ders, isLoading } = useDers(id);
  const router = useRouter();

  if (isLoading) {
    return <div className="mx-auto max-w-5xl p-6 text-sm text-muted-foreground">Yükleniyor…</div>;
  }
  if (!ders) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <p className="text-sm text-muted-foreground">Ders bulunamadı.</p>
        <Button variant="link" onClick={() => router.navigate({ to: "/mizan/ilim" })}>
          Dersler
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
      <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2 h-7 gap-1 text-xs text-muted-foreground">
        <Link to="/mizan/ilim">
          <ArrowLeft className="h-3 w-3" /> Dersler
        </Link>
      </Button>

      <header className="mb-6">
        <div className="flex items-center gap-2">
          {ders.kod && <span className="text-xs font-mono text-muted-foreground">{ders.kod}</span>}
          <Badge variant="outline" className="text-[10px]">
            {DERS_DURUM_ETIKET[ders.durum]}
          </Badge>
          {ders.restant && (
            <Badge variant="outline" className="border-destructive/40 bg-destructive/10 text-[10px]">
              Restant
            </Badge>
          )}
        </div>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{ders.ad}</h1>
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {ders.hoca && <span>{ders.hoca}</span>}
          {ders.donem && <span>{ders.donem}</span>}
          {!!ders.kredi && <span>{ders.kredi} kredi</span>}
        </div>
      </header>

      <Tabs defaultValue="sinav">
        <TabsList>
          <TabsTrigger value="sinav">Sınavlar</TabsTrigger>
          <TabsTrigger value="proje">Projeler</TabsTrigger>
          <TabsTrigger value="kaynak">Kaynaklar</TabsTrigger>
          <TabsTrigger value="saat">Saatler</TabsTrigger>
        </TabsList>
        <TabsContent value="sinav" className="mt-4">
          <SinavSekmesi dersId={ders.id} />
        </TabsContent>
        <TabsContent value="proje" className="mt-4">
          <ProjeSekmesi dersId={ders.id} />
        </TabsContent>
        <TabsContent value="kaynak" className="mt-4">
          <KaynakSekmesi dersId={ders.id} />
        </TabsContent>
        <TabsContent value="saat" className="mt-4">
          <SaatSekmesi dersId={ders.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ---------------- Sınav ---------------- */

const SINAV_TIPLERI: DersSinavTip[] = ["vize", "final", "quiz", "odev", "proje", "butunleme"];

function SinavSekmesi({ dersId }: { dersId: string }) {
  const { data: sinavlar = [] } = useSinavlar(dersId);
  const ekle = useSinavEkle();
  const sil = useSinavSil();
  const [acik, setAcik] = React.useState(false);
  const [tip, setTip] = React.useState<DersSinavTip>("vize");
  const [baslik, setBaslik] = React.useState("");
  const [tarih, setTarih] = React.useState("");
  const [agirlik, setAgirlik] = React.useState("");
  const [alinanNot, setAlinanNot] = React.useState("");

  async function kaydet(e: React.FormEvent) {
    e.preventDefault();
    try {
      await ekle.mutateAsync({
        ders_id: dersId,
        tip,
        baslik: baslik.trim() || null,
        tarih: tarih ? new Date(tarih).toISOString() : null,
        agirlik: agirlik ? Number(agirlik) : null,
        alinan_not: alinanNot ? Number(alinanNot) : null,
      });
      setBaslik("");
      setTarih("");
      setAgirlik("");
      setAlinanNot("");
      setTip("vize");
      setAcik(false);
      toast.success("Sınav eklendi");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Hata");
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Dialog open={acik} onOpenChange={setAcik}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="gap-1">
              <Plus className="h-4 w-4" /> Sınav/Ödev
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yeni sınav/ödev</DialogTitle>
            </DialogHeader>
            <form onSubmit={kaydet} className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Tip</Label>
                  <Select value={tip} onValueChange={(v) => setTip(v as DersSinavTip)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SINAV_TIPLERI.map((t) => (
                        <SelectItem key={t} value={t}>
                          {SINAV_TIP_ETIKET[t]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sinav-baslik" className="text-xs">Başlık (opsiyonel)</Label>
                  <Input id="sinav-baslik" value={baslik} onChange={(e) => setBaslik(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sinav-tarih" className="text-xs">Tarih</Label>
                  <Input
                    id="sinav-tarih"
                    type="datetime-local"
                    value={tarih}
                    onChange={(e) => setTarih(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sinav-agirlik" className="text-xs">Ağırlık (%)</Label>
                  <Input
                    id="sinav-agirlik"
                    type="number"
                    min={0}
                    max={100}
                    value={agirlik}
                    onChange={(e) => setAgirlik(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="sinav-not" className="text-xs">Alınan not</Label>
                  <Input
                    id="sinav-not"
                    type="number"
                    min={0}
                    max={100}
                    value={alinanNot}
                    onChange={(e) => setAlinanNot(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={ekle.isPending}>
                  {ekle.isPending ? "Ekleniyor…" : "Kaydet"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {sinavlar.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Henüz sınav yok.
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border">
          {sinavlar.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-3 p-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">
                    {SINAV_TIP_ETIKET[s.tip]}
                  </Badge>
                  {s.baslik && <span className="truncate text-sm">{s.baslik}</span>}
                </div>
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                  {s.tarih && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(s.tarih).toLocaleString("tr-TR", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  )}
                  {s.agirlik != null && <span>%{s.agirlik}</span>}
                  {s.alinan_not != null && <span className="font-medium text-foreground">Not: {s.alinan_not}</span>}
                </div>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-destructive"
                onClick={() => sil.mutate(s.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ---------------- Proje ---------------- */

function ProjeSekmesi({ dersId }: { dersId: string }) {
  const { data: projeler = [] } = useProjeler(dersId);
  const ekle = useProjeEkle();
  const guncelle = useProjeGuncelle();
  const sil = useProjeSil();
  const [acik, setAcik] = React.useState(false);
  const [baslik, setBaslik] = React.useState("");
  const [aciklama, setAciklama] = React.useState("");
  const [modulNo, setModulNo] = React.useState("");
  const [deadline, setDeadline] = React.useState("");

  async function kaydet(e: React.FormEvent) {
    e.preventDefault();
    if (!baslik.trim()) return;
    try {
      await ekle.mutateAsync({
        ders_id: dersId,
        baslik: baslik.trim(),
        aciklama: aciklama.trim() || null,
        modul_no: modulNo ? Number(modulNo) : null,
        deadline: deadline || null,
      });
      setBaslik("");
      setAciklama("");
      setModulNo("");
      setDeadline("");
      setAcik(false);
      toast.success("Proje eklendi");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Hata");
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Dialog open={acik} onOpenChange={setAcik}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="gap-1">
              <Plus className="h-4 w-4" /> Proje
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yeni proje</DialogTitle>
            </DialogHeader>
            <form onSubmit={kaydet} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="p-baslik" className="text-xs">Başlık</Label>
                <Input id="p-baslik" required value={baslik} onChange={(e) => setBaslik(e.target.value)} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="p-modul" className="text-xs">Modül no</Label>
                  <Input
                    id="p-modul"
                    type="number"
                    min={0}
                    value={modulNo}
                    onChange={(e) => setModulNo(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="p-deadline" className="text-xs">Deadline</Label>
                  <Input
                    id="p-deadline"
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-aciklama" className="text-xs">Açıklama</Label>
                <Textarea
                  id="p-aciklama"
                  rows={2}
                  value={aciklama}
                  onChange={(e) => setAciklama(e.target.value)}
                />
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={ekle.isPending}>
                  {ekle.isPending ? "Ekleniyor…" : "Kaydet"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {projeler.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Henüz proje yok.
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border">
          {projeler.map((p) => {
            const gecmis = p.deadline && !p.tamamlandi && new Date(p.deadline) < new Date();
            return (
              <li key={p.id} className="flex items-start gap-3 p-3">
                <button
                  onClick={() =>
                    guncelle.mutate({
                      id: p.id,
                      tamamlandi: !p.tamamlandi,
                      tamamlanma: !p.tamamlandi ? new Date().toISOString().slice(0, 10) : null,
                    })
                  }
                  className={cn(
                    "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border",
                    p.tamamlandi
                      ? "border-[var(--ilim)] bg-[var(--ilim)]/20"
                      : "border-border hover:border-foreground/40",
                  )}
                >
                  {p.tamamlandi && <Check className="h-3 w-3" />}
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {p.modul_no != null && (
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        M{p.modul_no}
                      </span>
                    )}
                    <span
                      className={cn(
                        "text-sm",
                        p.tamamlandi && "text-muted-foreground line-through",
                      )}
                    >
                      {p.baslik}
                    </span>
                  </div>
                  {p.aciklama && (
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{p.aciklama}</p>
                  )}
                  {p.deadline && (
                    <p
                      className={cn(
                        "mt-1 text-[11px]",
                        gecmis ? "text-destructive" : "text-muted-foreground",
                      )}
                    >
                      <Clock className="mr-1 inline h-3 w-3" />
                      {new Date(p.deadline).toLocaleDateString("tr-TR", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </p>
                  )}
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-destructive"
                  onClick={() => sil.mutate(p.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* ---------------- Kaynak ---------------- */

const KAYNAK_TIPLERI: DersKaynakTip[] = ["link", "dosya", "resim", "not"];

function KaynakSekmesi({ dersId }: { dersId: string }) {
  const { user } = useAuth();
  const { data: kaynaklar = [] } = useKaynaklar(dersId);
  const ekle = useKaynakEkle();
  const sil = useKaynakSil();
  const [acik, setAcik] = React.useState(false);
  const [tip, setTip] = React.useState<DersKaynakTip>("link");
  const [baslik, setBaslik] = React.useState("");
  const [url, setUrl] = React.useState("");
  const [icerik, setIcerik] = React.useState("");
  const [dosya, setDosya] = React.useState<File | null>(null);
  const [yuklemeIlerleme, setYuklemeIlerleme] = React.useState(false);

  async function kaydet(e: React.FormEvent) {
    e.preventDefault();
    if (!baslik.trim()) return;
    if (!user) return;
    try {
      let storagePath: string | null = null;
      if ((tip === "dosya" || tip === "resim") && dosya) {
        setYuklemeIlerleme(true);
        const ext = dosya.name.split(".").pop() ?? "bin";
        storagePath = `${user.id}/${dersId}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("ders-dosya")
          .upload(storagePath, dosya, { upsert: false });
        if (upErr) throw upErr;
      }
      await ekle.mutateAsync({
        ders_id: dersId,
        tip,
        baslik: baslik.trim(),
        url: tip === "link" ? url.trim() || null : null,
        storage_path: storagePath,
        icerik: tip === "not" ? icerik.trim() || null : null,
      });
      setBaslik("");
      setUrl("");
      setIcerik("");
      setDosya(null);
      setTip("link");
      setAcik(false);
      toast.success("Kaynak eklendi");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Hata");
    } finally {
      setYuklemeIlerleme(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Dialog open={acik} onOpenChange={setAcik}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="gap-1">
              <Plus className="h-4 w-4" /> Kaynak
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yeni kaynak</DialogTitle>
            </DialogHeader>
            <form onSubmit={kaydet} className="space-y-3">
              <div className="grid grid-cols-4 gap-1.5">
                {KAYNAK_TIPLERI.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTip(t)}
                    className={cn(
                      "rounded-lg border p-2 text-xs transition-colors",
                      tip === t
                        ? "border-foreground bg-accent"
                        : "border-border hover:border-foreground/40",
                    )}
                  >
                    {KAYNAK_TIP_ETIKET[t]}
                  </button>
                ))}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="k-baslik" className="text-xs">Başlık</Label>
                <Input id="k-baslik" required value={baslik} onChange={(e) => setBaslik(e.target.value)} />
              </div>
              {tip === "link" && (
                <div className="space-y-1.5">
                  <Label htmlFor="k-url" className="text-xs">URL</Label>
                  <Input
                    id="k-url"
                    type="url"
                    placeholder="https://…"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                  />
                </div>
              )}
              {(tip === "dosya" || tip === "resim") && (
                <div className="space-y-1.5">
                  <Label htmlFor="k-dosya" className="text-xs">Dosya</Label>
                  <Input
                    id="k-dosya"
                    type="file"
                    accept={tip === "resim" ? "image/*" : undefined}
                    onChange={(e) => setDosya(e.target.files?.[0] ?? null)}
                  />
                </div>
              )}
              {tip === "not" && (
                <div className="space-y-1.5">
                  <Label htmlFor="k-icerik" className="text-xs">İçerik</Label>
                  <Textarea
                    id="k-icerik"
                    rows={5}
                    value={icerik}
                    onChange={(e) => setIcerik(e.target.value)}
                  />
                </div>
              )}
              <div className="flex justify-end">
                <Button type="submit" disabled={ekle.isPending || yuklemeIlerleme}>
                  {yuklemeIlerleme ? "Yükleniyor…" : ekle.isPending ? "Ekleniyor…" : "Kaydet"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {kaynaklar.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Henüz kaynak yok.
        </p>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {kaynaklar.map((k) => (
            <KaynakKart key={k.id} kaynak={k} onSil={() => sil.mutate({ id: k.id, storagePath: k.storage_path })} />
          ))}
        </ul>
      )}
    </div>
  );
}

function KaynakKart({
  kaynak,
  onSil,
}: {
  kaynak: import("@/lib/ilim-tipleri").DersKaynak;
  onSil: () => void;
}) {
  const [acTik, setAcTik] = React.useState(false);

  async function ac() {
    if (kaynak.tip === "link" && kaynak.url) {
      window.open(kaynak.url, "_blank", "noopener");
      return;
    }
    if ((kaynak.tip === "dosya" || kaynak.tip === "resim") && kaynak.storage_path) {
      setAcTik(true);
      const u = await dosyaImzalıUrl(kaynak.storage_path);
      setAcTik(false);
      if (u) window.open(u, "_blank", "noopener");
      else toast.error("Dosya açılamadı");
    }
  }

  const Ikon =
    kaynak.tip === "link"
      ? Link2
      : kaynak.tip === "dosya"
        ? FileText
        : kaynak.tip === "resim"
          ? ImageIcon
          : StickyNote;

  return (
    <li className="group flex items-start gap-3 rounded-lg border border-border bg-card p-3">
      <Ikon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-medium">{kaynak.baslik}</span>
        </div>
        {kaynak.tip === "not" && kaynak.icerik && (
          <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-[11px] text-muted-foreground">
            {kaynak.icerik}
          </p>
        )}
        {kaynak.tip === "link" && kaynak.url && (
          <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{kaynak.url}</p>
        )}
        {(kaynak.tip === "link" || kaynak.tip === "dosya" || kaynak.tip === "resim") && (
          <button
            onClick={ac}
            disabled={acTik}
            className="mt-1 inline-flex items-center gap-1 text-[11px] text-[var(--ilim)] hover:underline"
          >
            <ExternalLink className="h-3 w-3" /> {acTik ? "Açılıyor…" : "Aç"}
          </button>
        )}
      </div>
      <Button
        size="icon"
        variant="ghost"
        className="h-7 w-7 shrink-0 text-destructive opacity-0 transition-opacity group-hover:opacity-100"
        onClick={onSil}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </li>
  );
}

/* ---------------- Saat ---------------- */

function SaatSekmesi({ dersId }: { dersId: string }) {
  const { data: saatler = [] } = useDersSaatleri(dersId);
  const ekle = useDersSaatEkle();
  const sil = useDersSaatSil();
  const [gun, setGun] = React.useState<HaftaGun>("pazartesi");
  const [bas, setBas] = React.useState("09:00");
  const [bit, setBit] = React.useState("11:00");
  const [konum, setKonum] = React.useState("");

  const dersinSaatleri = saatler.filter((s) => s.ders_id === dersId);

  async function kaydet(e: React.FormEvent) {
    e.preventDefault();
    try {
      await ekle.mutateAsync({
        ders_id: dersId,
        gun,
        baslangic: bas,
        bitis: bit,
        konum: konum.trim() || null,
      });
      setKonum("");
      toast.success("Saat eklendi");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Hata");
    }
  }

  return (
    <div className="space-y-3">
      <form onSubmit={kaydet} className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-5 sm:items-end">
        <div className="space-y-1.5">
          <Label className="text-xs">Gün</Label>
          <Select value={gun} onValueChange={(v) => setGun(v as HaftaGun)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {HAFTA_GUN_LISTESI.map((g) => (
                <SelectItem key={g} value={g}>
                  {HAFTA_GUN_TAM[g]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Başlangıç</Label>
          <Input type="time" value={bas} onChange={(e) => setBas(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Bitiş</Label>
          <Input type="time" value={bit} onChange={(e) => setBit(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Konum</Label>
          <Input value={konum} onChange={(e) => setKonum(e.target.value)} placeholder="Sınıf / link" />
        </div>
        <Button type="submit" disabled={ekle.isPending} className="gap-1">
          <Plus className="h-4 w-4" /> Ekle
        </Button>
      </form>

      {dersinSaatleri.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Henüz haftalık saat yok. Eklediklerin takvime otomatik gelir.
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border">
          {dersinSaatleri.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-3 p-3 text-sm">
              <span className="flex items-center gap-3">
                <span className="w-24 font-medium">{HAFTA_GUN_TAM[s.gun]}</span>
                <span className="text-muted-foreground">
                  {s.baslangic.slice(0, 5)} – {s.bitis.slice(0, 5)}
                </span>
                {s.konum && <span className="text-xs text-muted-foreground">· {s.konum}</span>}
              </span>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-destructive"
                onClick={() => sil.mutate(s.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}