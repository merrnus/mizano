import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  ChevronRight,
  Download,
  File as FileIcon,
  FileText,
  Folder,
  FolderPlus,
  Image as ImageIcon,
  Loader2,
  Trash2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useDosyalar,
  useDosyaSil,
  useDosyaYukle,
  useTumKlasorler,
  dosyaIndirmeUrl,
} from "@/lib/mutfak-hooks";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/workspace/surucu")({
  component: SurucuPage,
});

function dosyaIkonu(mime?: string | null) {
  if (!mime) return FileIcon;
  if (mime.startsWith("image/")) return ImageIcon;
  if (mime.includes("pdf") || mime.includes("text") || mime.includes("doc"))
    return FileText;
  return FileIcon;
}

function boyutFormat(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

function SurucuPage() {
  const [klasor, setKlasor] = React.useState("/");
  const [yerelKlasorler, setYerelKlasorler] = React.useState<string[]>([]);
  const [dragOver, setDragOver] = React.useState(false);
  const { data: dosyalar, isLoading } = useDosyalar(klasor);
  const { data: kalsorlerDb } = useTumKlasorler();
  const yukle = useDosyaYukle();
  const sil = useDosyaSil();
  const inputRef = React.useRef<HTMLInputElement>(null);

  const tumKlasorler = React.useMemo(() => {
    const set = new Set<string>(["/"]);
    (kalsorlerDb ?? []).forEach((k) => set.add(k));
    yerelKlasorler.forEach((k) => set.add(k));
    return Array.from(set).sort();
  }, [kalsorlerDb, yerelKlasorler]);

  const altKlasorler = tumKlasorler.filter((k) => {
    if (k === klasor) return false;
    if (klasor === "/") return k !== "/" && !k.slice(1).includes("/");
    return k.startsWith(klasor + "/") && !k.slice(klasor.length + 1).includes("/");
  });

  const dosyaYukle = async (dosyalar: FileList | File[]) => {
    for (const f of Array.from(dosyalar)) {
      await yukle.mutateAsync({ file: f, klasor });
    }
  };

  const indir = async (storage_path: string) => {
    const url = await dosyaIndirmeUrl(storage_path);
    if (url) window.open(url, "_blank");
  };

  const yeniKlasor = () => {
    const ad = prompt("Klasör adı");
    if (!ad) return;
    const yeni = klasor === "/" ? `/${ad}` : `${klasor}/${ad}`;
    setYerelKlasorler((p) => [...p, yeni]);
    setKlasor(yeni);
  };

  const breadcrumb = klasor === "/" ? [] : klasor.split("/").filter(Boolean);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
      <header className="mb-4">
        <Link
          to="/workspace"
          className="mb-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" /> Mutfak
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Sürücü
        </h1>
      </header>

      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
          <button
            onClick={() => setKlasor("/")}
            className="rounded px-1.5 py-0.5 hover:bg-muted hover:text-foreground"
          >
            Ana
          </button>
          {breadcrumb.map((seg, i) => {
            const path = "/" + breadcrumb.slice(0, i + 1).join("/");
            return (
              <React.Fragment key={path}>
                <ChevronRight className="h-3 w-3" />
                <button
                  onClick={() => setKlasor(path)}
                  className="rounded px-1.5 py-0.5 hover:bg-muted hover:text-foreground"
                >
                  {seg}
                </button>
              </React.Fragment>
            );
          })}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={yeniKlasor} className="gap-1.5">
            <FolderPlus className="h-3.5 w-3.5" /> Klasör
          </Button>
          <Button
            size="sm"
            onClick={() => inputRef.current?.click()}
            className="gap-1.5"
            disabled={yukle.isPending}
          >
            {yukle.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Upload className="h-3.5 w-3.5" />
            )}
            Yükle
          </Button>
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) dosyaYukle(e.target.files);
              e.target.value = "";
            }}
          />
        </div>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files.length > 0) dosyaYukle(e.dataTransfer.files);
        }}
        className={cn(
          "rounded-2xl border-2 border-dashed bg-card p-4 transition-colors",
          dragOver ? "border-primary bg-primary/5" : "border-border/60",
        )}
      >
        {altKlasorler.length === 0 && (!dosyalar || dosyalar.length === 0) && !isLoading ? (
          <div className="py-12 text-center">
            <Upload className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              Buraya dosya sürükle veya yukarıdan yükle.
            </p>
          </div>
        ) : (
          <>
            {altKlasorler.length > 0 && (
              <div className="mb-3">
                <div className="mb-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                  Klasörler
                </div>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {altKlasorler.map((k) => (
                    <button
                      key={k}
                      onClick={() => setKlasor(k)}
                      className="flex items-center gap-2 rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-left text-sm hover:border-primary/40"
                    >
                      <Folder className="h-4 w-4 text-amber-500" />
                      <span className="truncate">{k.split("/").pop()}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {dosyalar && dosyalar.length > 0 && (
              <>
                <div className="mb-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                  Dosyalar
                </div>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {dosyalar.map((d) => {
                    const Ikon = dosyaIkonu(d.mime_type);
                    return (
                      <div
                        key={d.id}
                        className="group flex items-center gap-2 rounded-lg border border-border/60 bg-background/40 px-3 py-2"
                      >
                        <Ikon className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm">{d.ad}</div>
                          <div className="text-[10px] text-muted-foreground">
                            {boyutFormat(d.boyut)}
                          </div>
                        </div>
                        <div className="flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                          <button
                            onClick={() => indir(d.storage_path)}
                            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                            title="İndir"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm("Dosya silinsin mi?")) {
                                sil.mutate({ id: d.id, storage_path: d.storage_path });
                              }
                            }}
                            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-destructive"
                            title="Sil"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
