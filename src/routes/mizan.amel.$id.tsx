import * as React from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Check,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Link2,
  StickyNote,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  useAmelKurs,
  useAmelKursGuncelle,
  useAmelKursSil,
  useAmelModuller,
  useAmelModulEkle,
  useAmelModulGuncelle,
  useAmelModulSil,
  useAmelKaynaklar,
  useAmelKaynakEkle,
  useAmelKaynakSil,
  amelDosyaImzaliUrl,
  useAmelAlan,
} from "@/lib/amel-hooks";
import {
  KURS_DURUM_ETIKET,
  KAYNAK_TIP_ETIKET,
  kursIlerleme,
  type AmelKaynak,
  type AmelKaynakTip,
  type AmelKursDurum,
} from "@/lib/amel-tipleri";
import { toast } from "sonner";

export const Route = createFileRoute("/mizan/amel/$id")({
  head: () => ({ meta: [{ title: "Kurs — Mizan" }] }),
  component: KursDetay,
});

function KursDetay() {
  const { id } = Route.useParams();
  const { data: kurs, isLoading } = useAmelKurs(id);
  const { data: alan } = useAmelAlan(kurs?.alan_id);
  const { data: moduller = [] } = useAmelModuller(id);
  const router = useRouter();
  const guncelle = useAmelKursGuncelle();
  const sil = useAmelKursSil();
  const [acikDuzen, setAcikDuzen] = React.useState(false);

  if (isLoading) {
    return <div className="mx-auto max-w-5xl p-6 text-sm text-muted-foreground">Yükleniyor…</div>;
  }
  if (!kurs) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <p className="text-sm text-muted-foreground">Kurs bulunamadı.</p>
        <Button variant="link" onClick={() => router.navigate({ to: "/mizan/amel" })}>
          Müfredata dön
        </Button>
      </div>
    );
  }

  const ilerleme = kursIlerleme(moduller);
  const renk = alan?.renk || "var(--amel)";

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
      <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2 h-7 gap-1 text-xs text-muted-foreground">
        <Link to="/mizan/amel">
          <ArrowLeft className="h-3 w-3" /> Müfredat
        </Link>
      </Button>

      <header className="mb-6">
        <div className="flex items-center gap-2">
          {alan && (
            <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: renk }}
                aria-hidden
              />
              {alan.ad}
            </span>
          )}
          <Badge variant="outline" className="text-[10px]">
            {KURS_DURUM_ETIKET[kurs.durum]}
          </Badge>
        </div>
        <div className="mt-1 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-semibold tracking-tight">{kurs.ad}</h1>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {kurs.saglayici && <span>{kurs.saglayici}</span>}
              {kurs.kod && <span className="font-mono">{kurs.kod}</span>}
              {kurs.sertifika_tarihi && (
                <span>
                  Sertifika sınavı:{" "}
                  {new Date(kurs.sertifika_tarihi).toLocaleDateString("tr-TR", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-1">
            <Dialog open={acikDuzen} onOpenChange={setAcikDuzen}>
              <DialogTrigger asChild>
                <Button size="icon" variant="ghost" className="h-8 w-8">
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Kursu düzenle</DialogTitle>
                </DialogHeader>
                <KursDuzenleForm
                  kursId={kurs.id}
                  baslangic={{
                    ad: kurs.ad,
                    saglayici: kurs.saglayici ?? "",
                    kod: kurs.kod ?? "",
                    durum: kurs.durum,
                    sertifika_tarihi: kurs.sertifika_tarihi ?? "",
                    aciklama: kurs.aciklama ?? "",
                    notlar: kurs.notlar ?? "",
                  }}
                  onBitti={() => setAcikDuzen(false)}
                />
              </DialogContent>
            </Dialog>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-destructive"
              onClick={() => {
                if (confirm(`"${kurs.ad}" kursunu ve tüm modül/kaynaklarını silmek istediğine emin misin?`)) {
                  sil.mutate(kurs.id, {
                    onSuccess: () => router.navigate({ to: "/mizan/amel" }),
                  });
                }
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {kurs.aciklama && (
          <p className="mt-2 text-sm text-muted-foreground">{kurs.aciklama}</p>
        )}

        <div className="mt-3 flex items-center gap-3">
          <Progress value={ilerleme} className="h-1.5 flex-1" />
          <span className="text-xs text-muted-foreground">
            {moduller.filter((m) => m.tamamlandi).length}/{moduller.length} · %{ilerleme}
          </span>
        </div>

        <div className="mt-3">
          <Select
            value={kurs.durum}
            onValueChange={(v) =>
              guncelle.mutate({ id: kurs.id, durum: v as AmelKursDurum })
            }
          >
            <SelectTrigger className="h-8 w-[180px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(["planli", "izliyor", "beklemede", "tamam", "birakti"] as AmelKursDurum[]).map(
                (d) => (
                  <SelectItem key={d} value={d}>
                    {KURS_DURUM_ETIKET[d]}
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>
        </div>
      </header>

      <Tabs defaultValue="modul">
        <TabsList>
          <TabsTrigger value="modul">Modüller</TabsTrigger>
          <TabsTrigger value="kaynak">Kaynaklar</TabsTrigger>
          <TabsTrigger value="not">Notlar</TabsTrigger>
        </TabsList>
        <TabsContent value="modul" className="mt-4">
          <ModulSekmesi kursId={kurs.id} />
        </TabsContent>
        <TabsContent value="kaynak" className="mt-4">
          <KaynakSekmesi kursId={kurs.id} />
        </TabsContent>
        <TabsContent value="not" className="mt-4">
          <NotSekmesi kursId={kurs.id} mevcut={kurs.notlar ?? ""} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ---------------- Kurs düzenle ---------------- */

const KURS_DURUMLAR: AmelKursDurum[] = ["planli", "izliyor", "beklemede", "tamam", "birakti"];

function KursDuzenleForm({
  kursId,
  baslangic,
  onBitti,
}: {
  kursId: string;
  baslangic: {
    ad: string;
    saglayici: string;
    kod: string;
    durum: AmelKursDurum;
    sertifika_tarihi: string;
    aciklama: string;
    notlar: string;
  };
  onBitti: () => void;
}) {
  const guncelle = useAmelKursGuncelle();
  const [ad, setAd] = React.useState(baslangic.ad);
  const [saglayici, setSaglayici] = React.useState(baslangic.saglayici);
  const [kod, setKod] = React.useState(baslangic.kod);
  const [durum, setDurum] = React.useState<AmelKursDurum>(baslangic.durum);
  const [sertifikaTarihi, setSertifikaTarihi] = React.useState(baslangic.sertifika_tarihi);
  const [aciklama, setAciklama] = React.useState(baslangic.aciklama);

  async function kaydet(e: React.FormEvent) {
    e.preventDefault();
    try {
      await guncelle.mutateAsync({
        id: kursId,
        ad: ad.trim(),
        saglayici: saglayici.trim() || null,
        kod: kod.trim() || null,
        durum,
        sertifika_tarihi: sertifikaTarihi || null,
        aciklama: aciklama.trim() || null,
      });
      toast.success("Kurs güncellendi");
      onBitti();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Hata");
    }
  }

  return (
    <form onSubmit={kaydet} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="d-ad" className="text-xs">Kurs adı</Label>
        <Input id="d-ad" required value={ad} onChange={(e) => setAd(e.target.value)} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="d-saglayici" className="text-xs">Sağlayıcı</Label>
          <Input id="d-saglayici" value={saglayici} onChange={(e) => setSaglayici(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="d-kod" className="text-xs">Kod</Label>
          <Input id="d-kod" value={kod} onChange={(e) => setKod(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Durum</Label>
          <Select value={durum} onValueChange={(v) => setDurum(v as AmelKursDurum)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {KURS_DURUMLAR.map((d) => (
                <SelectItem key={d} value={d}>{KURS_DURUM_ETIKET[d]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="d-sertifika" className="text-xs">Sertifika tarihi</Label>
          <Input
            id="d-sertifika"
            type="date"
            value={sertifikaTarihi}
            onChange={(e) => setSertifikaTarihi(e.target.value)}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="d-aciklama" className="text-xs">Açıklama</Label>
        <Textarea id="d-aciklama" rows={2} value={aciklama} onChange={(e) => setAciklama(e.target.value)} />
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={guncelle.isPending}>Kaydet</Button>
      </div>
    </form>
  );
}

/* ---------------- Modüller ---------------- */

function ModulSekmesi({ kursId }: { kursId: string }) {
  const { data: moduller = [] } = useAmelModuller(kursId);
  const ekle = useAmelModulEkle();
  const guncelle = useAmelModulGuncelle();
  const sil = useAmelModulSil();
  const [yeniBaslik, setYeniBaslik] = React.useState("");
  const [acikNotlar, setAcikNotlar] = React.useState<Record<string, boolean>>({});

  async function ekleModul(e: React.FormEvent) {
    e.preventDefault();
    if (!yeniBaslik.trim()) return;
    try {
      await ekle.mutateAsync({
        kurs_id: kursId,
        baslik: yeniBaslik.trim(),
        siralama: moduller.length,
      });
      setYeniBaslik("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Hata");
    }
  }

  return (
    <div className="space-y-3">
      <form onSubmit={ekleModul} className="flex gap-2">
        <Input
          value={yeniBaslik}
          onChange={(e) => setYeniBaslik(e.target.value)}
          placeholder="Yeni modül başlığı… (örn. 1. Network Fundamentals)"
          className="flex-1"
        />
        <Button type="submit" size="sm" disabled={ekle.isPending} className="gap-1">
          <Plus className="h-3.5 w-3.5" /> Ekle
        </Button>
      </form>

      {moduller.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Henüz modül yok. İlk modülü ekleyerek başla.
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border">
          {moduller.map((m, i) => (
            <li key={m.id} className="p-3">
              <div className="flex items-start gap-3">
                <button
                  onClick={() =>
                    guncelle.mutate({
                      id: m.id,
                      tamamlandi: !m.tamamlandi,
                      tamamlanma: !m.tamamlandi ? new Date().toISOString().slice(0, 10) : null,
                    })
                  }
                  className={cn(
                    "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors",
                    m.tamamlandi
                      ? "border-[var(--amel)] bg-[var(--amel)]/20"
                      : "border-border hover:border-foreground/40",
                  )}
                >
                  {m.tamamlandi && <Check className="h-3 w-3" />}
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                      {i + 1}
                    </span>
                    <span
                      className={cn(
                        "text-sm",
                        m.tamamlandi && "text-muted-foreground line-through",
                      )}
                    >
                      {m.baslik}
                    </span>
                  </div>
                  {m.tamamlanma && (
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      Tamamlandı: {new Date(m.tamamlanma).toLocaleDateString("tr-TR")}
                    </p>
                  )}
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className={cn(
                    "h-7 w-7",
                    (m.notlar?.trim() || acikNotlar[m.id]) && "text-[var(--amel)]",
                  )}
                  title={m.notlar?.trim() ? "Notları göster" : "Not ekle"}
                  onClick={() =>
                    setAcikNotlar((s) => ({ ...s, [m.id]: !s[m.id] }))
                  }
                >
                  <StickyNote className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-destructive"
                  onClick={() => sil.mutate(m.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              {acikNotlar[m.id] && (
                <div className="mt-2 pl-8">
                  <ModulNot
                    modulId={m.id}
                    mevcut={m.notlar ?? ""}
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ModulNot({ modulId, mevcut }: { modulId: string; mevcut: string }) {
  const guncelle = useAmelModulGuncelle();
  const [deger, setDeger] = React.useState(mevcut);
  const [kaydedildi, setKaydedildi] = React.useState(false);
  const sonKayitliRef = React.useRef(mevcut);

  // mevcut değer dışarıdan değişirse senkronize et
  React.useEffect(() => {
    setDeger(mevcut);
    sonKayitliRef.current = mevcut;
  }, [mevcut]);

  // Debounced autosave
  React.useEffect(() => {
    if (deger === sonKayitliRef.current) return;
    const t = setTimeout(() => {
      guncelle.mutate(
        { id: modulId, notlar: deger.trim() ? deger : null },
        {
          onSuccess: () => {
            sonKayitliRef.current = deger;
            setKaydedildi(true);
            setTimeout(() => setKaydedildi(false), 1500);
          },
        },
      );
    }, 800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deger, modulId]);

  return (
    <div className="space-y-1">
      <Textarea
        value={deger}
        onChange={(e) => setDeger(e.target.value)}
        placeholder="Bu modülde anladıklarını, önemli noktaları, sorularını yaz…"
        rows={4}
        className="resize-y text-sm"
      />
      <div className="flex h-4 items-center justify-end text-[10px] text-muted-foreground">
        {guncelle.isPending ? "Kaydediliyor…" : kaydedildi ? "Kaydedildi ✓" : ""}
      </div>
    </div>
  );
}

/* ---------------- Kaynaklar ---------------- */

const KAYNAK_TIPLERI: AmelKaynakTip[] = ["link", "dosya", "resim", "not"];

function KaynakSekmesi({ kursId }: { kursId: string }) {
  const { user } = useAuth();
  const { data: kaynaklar = [] } = useAmelKaynaklar(kursId);
  const ekle = useAmelKaynakEkle();
  const sil = useAmelKaynakSil();
  const [acik, setAcik] = React.useState(false);
  const [tip, setTip] = React.useState<AmelKaynakTip>("link");
  const [baslik, setBaslik] = React.useState("");
  const [url, setUrl] = React.useState("");
  const [icerik, setIcerik] = React.useState("");
  const [dosya, setDosya] = React.useState<File | null>(null);
  const [yukleme, setYukleme] = React.useState(false);

  async function kaydet(e: React.FormEvent) {
    e.preventDefault();
    if (!baslik.trim() || !user) return;
    try {
      let storagePath: string | null = null;
      if ((tip === "dosya" || tip === "resim") && dosya) {
        setYukleme(true);
        const ext = dosya.name.split(".").pop() ?? "bin";
        storagePath = `${user.id}/${kursId}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("amel-dosya")
          .upload(storagePath, dosya, { upsert: false });
        if (upErr) throw upErr;
      }
      await ekle.mutateAsync({
        kurs_id: kursId,
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
      setYukleme(false);
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
                <Label htmlFor="ka-baslik" className="text-xs">Başlık</Label>
                <Input id="ka-baslik" required value={baslik} onChange={(e) => setBaslik(e.target.value)} />
              </div>
              {tip === "link" && (
                <div className="space-y-1.5">
                  <Label htmlFor="ka-url" className="text-xs">URL</Label>
                  <Input
                    id="ka-url"
                    type="url"
                    placeholder="https://…"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                  />
                </div>
              )}
              {(tip === "dosya" || tip === "resim") && (
                <div className="space-y-1.5">
                  <Label htmlFor="ka-dosya" className="text-xs">Dosya</Label>
                  <Input
                    id="ka-dosya"
                    type="file"
                    accept={tip === "resim" ? "image/*" : undefined}
                    onChange={(e) => setDosya(e.target.files?.[0] ?? null)}
                  />
                </div>
              )}
              {tip === "not" && (
                <div className="space-y-1.5">
                  <Label htmlFor="ka-icerik" className="text-xs">İçerik</Label>
                  <Textarea id="ka-icerik" rows={5} value={icerik} onChange={(e) => setIcerik(e.target.value)} />
                </div>
              )}
              <div className="flex justify-end">
                <Button type="submit" disabled={ekle.isPending || yukleme}>
                  {yukleme ? "Yükleniyor…" : ekle.isPending ? "Ekleniyor…" : "Kaydet"}
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
            <KaynakKart
              key={k.id}
              kaynak={k}
              onSil={() => sil.mutate({ id: k.id, storagePath: k.storage_path })}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function KaynakKart({ kaynak, onSil }: { kaynak: AmelKaynak; onSil: () => void }) {
  const [acTik, setAcTik] = React.useState(false);

  async function ac() {
    if (kaynak.tip === "link" && kaynak.url) {
      window.open(kaynak.url, "_blank", "noopener");
      return;
    }
    if ((kaynak.tip === "dosya" || kaynak.tip === "resim") && kaynak.storage_path) {
      setAcTik(true);
      const u = await amelDosyaImzaliUrl(kaynak.storage_path);
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
        <span className="truncate text-sm font-medium">{kaynak.baslik}</span>
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
            className="mt-1 inline-flex items-center gap-1 text-[11px] text-[var(--amel)] hover:underline"
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

/* ---------------- Notlar ---------------- */

function NotSekmesi({ kursId, mevcut }: { kursId: string; mevcut: string }) {
  const guncelle = useAmelKursGuncelle();
  const [notlar, setNotlar] = React.useState(mevcut);
  const [kaydedildi, setKaydedildi] = React.useState(false);

  React.useEffect(() => {
    setNotlar(mevcut);
  }, [mevcut]);

  async function kaydet() {
    try {
      await guncelle.mutateAsync({ id: kursId, notlar: notlar || null });
      setKaydedildi(true);
      setTimeout(() => setKaydedildi(false), 1500);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Hata");
    }
  }

  return (
    <div className="space-y-3">
      <Textarea
        rows={12}
        value={notlar}
        onChange={(e) => setNotlar(e.target.value)}
        placeholder="Bu kursla ilgili notların…"
      />
      <div className="flex items-center justify-end gap-2">
        {kaydedildi && <span className="text-xs text-muted-foreground">Kaydedildi ✓</span>}
        <Button size="sm" onClick={kaydet} disabled={guncelle.isPending}>
          Kaydet
        </Button>
      </div>
    </div>
  );
}