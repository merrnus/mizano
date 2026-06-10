import * as React from "react";
import {
  Plus,
  FileText,
  Image as ImageIcon,
  Link2,
  ExternalLink,
  Trash2,
  Upload,
  Loader2,
  Paperclip,
} from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  useEkler,
  useDosyaEkle,
  useLinkEkle,
  useEkSil,
  ekDosyaUrl,
} from "@/lib/ekler-hooks";
import { fetchOgMeta } from "@/lib/og.functions";
import type { Ek, EkBaglamTuru } from "@/lib/ekler-tipleri";
import { pdfThumbnailUret } from "@/lib/pdf-onizleme";
import { PdfOnizlemeDialog } from "@/components/ekler/pdf-onizleme-dialog";

function dosyaIkonu(mime?: string | null) {
  if (!mime) return FileText;
  if (mime.startsWith("image/")) return ImageIcon;
  return FileText;
}

function boyutFormat(b?: number | null): string {
  if (b == null) return "";
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

const MAX_BOYUT = 20 * 1024 * 1024;

export function EklerPaneli({
  baglamTuru,
  baglamId,
  baslik = "Ekler",
  kompakt = false,
}: {
  baglamTuru: EkBaglamTuru;
  baglamId: string;
  baslik?: string;
  kompakt?: boolean;
}) {
  const { data: ekler = [], isLoading } = useEkler(baglamTuru, baglamId);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
          {baslik}
          {ekler.length > 0 && (
            <span className="text-xs font-normal text-muted-foreground">
              ({ekler.length})
            </span>
          )}
        </h3>
        <EkEkleDialog baglamTuru={baglamTuru} baglamId={baglamId} />
      </div>

      {isLoading ? (
        <p className="text-xs text-muted-foreground">Yükleniyor…</p>
      ) : ekler.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border/60 bg-muted/20 px-4 py-6 text-center text-xs text-muted-foreground">
          Henüz ek yok. PDF, görsel veya link ekle.
        </p>
      ) : (
        <ul className={cn("grid gap-2", kompakt ? "" : "sm:grid-cols-2")}>
          {ekler.map((ek) => (
            <EkKart key={ek.id} ek={ek} />
          ))}
        </ul>
      )}
    </div>
  );
}

export function EkKart({ ek, gosterBaglam = false }: { ek: Ek; gosterBaglam?: boolean }) {
  const sil = useEkSil();
  const [aciliyor, setAciliyor] = React.useState(false);
  const [pdfAcik, setPdfAcik] = React.useState(false);
  const [thumb, setThumb] = React.useState<string | null>(null);
  const isPdf = ek.tur === "dosya" && (ek.mime_type ?? "").includes("pdf");
  const isImage = ek.tur === "dosya" && (ek.mime_type ?? "").startsWith("image/");
  const Ikon = ek.tur === "link" ? Link2 : dosyaIkonu(ek.mime_type);

  // PDF/Görsel için signed URL'den küçük resim üret
  React.useEffect(() => {
    if (!ek.storage_path) return;
    if (!isPdf && !isImage) return;
    let iptal = false;
    (async () => {
      const u = await ekDosyaUrl(ek.storage_path!, 3600);
      if (!u || iptal) return;
      if (isImage) {
        if (!iptal) setThumb(u);
        return;
      }
      if (isPdf) {
        const t = await pdfThumbnailUret(ek.storage_path!, u, ek.boyut);
        if (!iptal) setThumb(t);
      }
    })();
    return () => {
      iptal = true;
    };
  }, [ek.storage_path, ek.boyut, isPdf, isImage]);

  async function ac() {
    if (ek.tur === "link" && ek.url) {
      window.open(ek.url, "_blank", "noopener");
      return;
    }
    if (isPdf) {
      setPdfAcik(true);
      return;
    }
    if (ek.tur === "dosya" && ek.storage_path) {
      setAciliyor(true);
      const u = await ekDosyaUrl(ek.storage_path);
      setAciliyor(false);
      if (u) window.open(u, "_blank", "noopener");
      else toast.error("Dosya açılamadı");
    }
  }

  return (
    <>
    <li className="group flex items-start gap-3 rounded-lg border border-border bg-card p-3">
      {(ek.tur === "link" && ek.onizleme_url) || thumb ? (
        <img
          src={thumb ?? ek.onizleme_url!}
          alt=""
          loading="lazy"
          className="h-14 w-14 shrink-0 rounded border border-border object-cover"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
      ) : (
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded bg-muted text-muted-foreground">
          {ek.tur === "link" && ek.favicon_url ? (
            <img src={ek.favicon_url} alt="" className="h-4 w-4 rounded" />
          ) : (
            <Ikon className="h-4 w-4" />
          )}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <button
          onClick={ac}
          disabled={aciliyor}
          className="block w-full truncate text-left text-sm font-medium hover:underline"
        >
          {ek.baslik || ek.url || "Adsız"}
        </button>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
          {ek.tur === "link" ? (
            <span className="truncate">{ek.site_adi || ek.url}</span>
          ) : (
            <>
              {ek.mime_type && <span className="truncate">{ek.mime_type}</span>}
              {ek.boyut != null && <span>{boyutFormat(ek.boyut)}</span>}
            </>
          )}
          {gosterBaglam && ek.baglam_turu && (
            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px]">
              {ek.baglam_turu}
            </span>
          )}
        </div>
        {ek.aciklama && (
          <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">
            {ek.aciklama}
          </p>
        )}
      </div>
      <div className="flex shrink-0 flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          onClick={ac}
          disabled={aciliyor}
          className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          title="Aç"
        >
          {aciliyor ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <ExternalLink className="h-3.5 w-3.5" />
          )}
        </button>
        <button
          onClick={() => {
            if (confirm("Ek silinsin mi?")) sil.mutate(ek);
          }}
          className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-destructive"
          title="Sil"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </li>
    {isPdf && ek.storage_path && (
      <PdfOnizlemeDialog
        storagePath={ek.storage_path}
        baslik={ek.baslik}
        acik={pdfAcik}
        onOpenChange={setPdfAcik}
      />
    )}
    </>
  );
}

export function EkEkleDialog({
  baglamTuru,
  baglamId,
  trigger,
}: {
  baglamTuru?: EkBaglamTuru;
  baglamId?: string | null;
  trigger?: React.ReactNode;
}) {
  const [acik, setAcik] = React.useState(false);
  const dosyaEkle = useDosyaEkle();
  const linkEkle = useLinkEkle();
  const ogFn = useServerFn(fetchOgMeta);

  // file state
  const [file, setFile] = React.useState<File | null>(null);
  const [fileBaslik, setFileBaslik] = React.useState("");

  // link state
  const [url, setUrl] = React.useState("");
  const [linkBaslik, setLinkBaslik] = React.useState("");
  const [aciklama, setAciklama] = React.useState("");
  const [ogYukleniyor, setOgYukleniyor] = React.useState(false);
  const [ogMeta, setOgMeta] = React.useState<{
    image?: string;
    favicon?: string;
    siteName?: string;
  }>({});

  const reset = () => {
    setFile(null);
    setFileBaslik("");
    setUrl("");
    setLinkBaslik("");
    setAciklama("");
    setOgMeta({});
  };

  async function urlBlur() {
    if (!url.trim()) return;
    let normalized = url.trim();
    if (!/^https?:\/\//i.test(normalized)) {
      normalized = "https://" + normalized;
      setUrl(normalized);
    }
    setOgYukleniyor(true);
    try {
      const meta = await ogFn({ data: { url: normalized } });
      if (meta.title && !linkBaslik) setLinkBaslik(meta.title);
      if (meta.description && !aciklama) setAciklama(meta.description);
      setOgMeta({
        image: meta.image ?? undefined,
        favicon: meta.favicon ?? undefined,
        siteName: meta.siteName ?? undefined,
      });
    } catch {
      // sessizce yut
    } finally {
      setOgYukleniyor(false);
    }
  }

  // URL değişince debounce'lu otomatik OG çek
  const sonCekilenRef = React.useRef<string>("");
  React.useEffect(() => {
    const v = url.trim();
    if (!v) return;
    if (!/^https?:\/\//i.test(v)) return;
    if (v === sonCekilenRef.current) return;
    const t = setTimeout(() => {
      sonCekilenRef.current = v;
      void urlBlur();
    }, 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  async function dosyaKaydet(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    if (file.size > MAX_BOYUT) {
      toast.error("Dosya 20MB'tan büyük olamaz");
      return;
    }
    try {
      await dosyaEkle.mutateAsync({
        file,
        baglamTuru,
        baglamId,
        baslik: fileBaslik,
      });
      toast.success("Dosya eklendi");
      reset();
      setAcik(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Yükleme hatası");
    }
  }

  async function linkKaydet(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    try {
      await linkEkle.mutateAsync({
        url: url.trim(),
        baglamTuru,
        baglamId,
        baslik: linkBaslik,
        aciklama,
        onizleme_url: ogMeta.image,
        favicon_url: ogMeta.favicon,
        site_adi: ogMeta.siteName,
      });
      toast.success("Link eklendi");
      reset();
      setAcik(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Hata");
    }
  }

  return (
    <Dialog
      open={acik}
      onOpenChange={(o) => {
        setAcik(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" variant="outline" className="h-7 gap-1 text-xs">
            <Plus className="h-3.5 w-3.5" /> Ek
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ek ekle</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="dosya">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="dosya" className="gap-1.5">
              <Upload className="h-3.5 w-3.5" /> Dosya
            </TabsTrigger>
            <TabsTrigger value="link" className="gap-1.5">
              <Link2 className="h-3.5 w-3.5" /> Link
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dosya" className="mt-4">
            <form onSubmit={dosyaKaydet} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="ek-file" className="text-xs">
                  Dosya (PDF, görsel, doc — en fazla 20MB)
                </Label>
                <Input
                  id="ek-file"
                  type="file"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
                {file && (
                  <p className="text-[11px] text-muted-foreground">
                    {file.name} · {boyutFormat(file.size)}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ek-file-baslik" className="text-xs">
                  Başlık (opsiyonel)
                </Label>
                <Input
                  id="ek-file-baslik"
                  value={fileBaslik}
                  onChange={(e) => setFileBaslik(e.target.value)}
                  placeholder={file?.name ?? "Dosya adı kullanılacak"}
                />
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={!file || dosyaEkle.isPending}>
                  {dosyaEkle.isPending ? "Yükleniyor…" : "Yükle"}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="link" className="mt-4">
            <form onSubmit={linkKaydet} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="ek-url" className="text-xs">
                  URL
                </Label>
                <div className="relative">
                  <Input
                    id="ek-url"
                    type="url"
                    placeholder="https://…"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onBlur={urlBlur}
                  />
                  {ogYukleniyor && (
                    <Loader2 className="absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-muted-foreground" />
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Yapıştır, başlık ve önizleme otomatik gelir.
                </p>
              </div>
              {ogMeta.image && (
                <img
                  src={ogMeta.image}
                  alt=""
                  className="h-24 w-full rounded border border-border object-cover"
                />
              )}
              <div className="space-y-1.5">
                <Label htmlFor="ek-link-baslik" className="text-xs">
                  Başlık
                </Label>
                <Input
                  id="ek-link-baslik"
                  value={linkBaslik}
                  onChange={(e) => setLinkBaslik(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ek-aciklama" className="text-xs">
                  Açıklama (opsiyonel)
                </Label>
                <Textarea
                  id="ek-aciklama"
                  rows={2}
                  value={aciklama}
                  onChange={(e) => setAciklama(e.target.value)}
                />
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={!url.trim() || linkEkle.isPending}>
                  {linkEkle.isPending ? "Ekleniyor…" : "Ekle"}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}