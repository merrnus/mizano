import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Search, Paperclip } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTumEkler } from "@/lib/ekler-hooks";
import { EkKart, EkEkleDialog } from "@/components/ekler/ekler-paneli";
import { BAGLAM_ETIKET } from "@/lib/ekler-tipleri";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/workspace/kaynaklar")({
  head: () => ({
    meta: [
      { title: "Kaynaklar — Mutfak" },
      {
        name: "description",
        content:
          "Tüm dosyalar ve linkler tek yerde. Mizan kayıtlarına bağlı veya serbest.",
      },
    ],
  }),
  component: KaynaklarPage,
});

type Filtre = "tum" | "dosya" | "link";

function KaynaklarPage() {
  const { data: ekler = [], isLoading } = useTumEkler();
  const [arama, setArama] = React.useState("");
  const [filtre, setFiltre] = React.useState<Filtre>("tum");
  const [baglamFiltre, setBaglamFiltre] = React.useState<string>("hepsi");

  const baglamlar = React.useMemo(() => {
    const set = new Set<string>();
    ekler.forEach((e) => e.baglam_turu && set.add(e.baglam_turu));
    return Array.from(set).sort();
  }, [ekler]);

  const filtrelenmis = ekler.filter((e) => {
    if (filtre !== "tum" && e.tur !== filtre) return false;
    if (baglamFiltre !== "hepsi" && e.baglam_turu !== baglamFiltre) return false;
    if (arama) {
      const q = arama.toLowerCase();
      return (
        (e.baslik ?? "").toLowerCase().includes(q) ||
        (e.url ?? "").toLowerCase().includes(q) ||
        (e.aciklama ?? "").toLowerCase().includes(q) ||
        (e.site_adi ?? "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
      <header className="mb-6 flex items-end justify-between gap-4">
        <div>
          <Link
            to="/workspace"
            className="mb-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3 w-3" /> Mutfak
          </Link>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-foreground">
            <Paperclip className="h-5 w-5 text-muted-foreground" /> Kaynaklar
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Tüm dosyalar ve linkler — Mizan kayıtlarına bağlı veya serbest.
          </p>
        </div>
        <EkEkleDialog
          baglamTuru="serbest"
          trigger={
            <Button size="sm" className="gap-1.5">
              <Paperclip className="h-3.5 w-3.5" /> Serbest ek
            </Button>
          }
        />
      </header>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Ara…"
            value={arama}
            onChange={(e) => setArama(e.target.value)}
            className="h-9 pl-9 text-sm"
          />
        </div>
        <div className="flex gap-1">
          {(["tum", "dosya", "link"] as Filtre[]).map((f) => (
            <button
              key={f}
              onClick={() => setFiltre(f)}
              className={cn(
                "rounded-full px-3 py-1 text-xs",
                filtre === f
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground",
              )}
            >
              {f === "tum" ? "Tümü" : f === "dosya" ? "Dosyalar" : "Linkler"}
            </button>
          ))}
        </div>
      </div>

      {baglamlar.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1">
          <button
            onClick={() => setBaglamFiltre("hepsi")}
            className={cn(
              "rounded-full px-2.5 py-1 text-[11px]",
              baglamFiltre === "hepsi"
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground hover:text-foreground",
            )}
          >
            Hepsi
          </button>
          {baglamlar.map((b) => (
            <button
              key={b}
              onClick={() => setBaglamFiltre(b)}
              className={cn(
                "rounded-full px-2.5 py-1 text-[11px]",
                baglamFiltre === b
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:text-foreground",
              )}
            >
              {BAGLAM_ETIKET[b] ?? b}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Yükleniyor…</p>
      ) : filtrelenmis.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 px-6 py-16 text-center">
          <Paperclip className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            {arama || filtre !== "tum" || baglamFiltre !== "hepsi"
              ? "Bu filtreyle eşleşen kayıt yok."
              : "Henüz kaynak yok. Sağ üstten ilk eki ekle."}
          </p>
        </div>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {filtrelenmis.map((e) => (
            <EkKart key={e.id} ek={e} gosterBaglam />
          ))}
        </ul>
      )}
    </div>
  );
}