import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { NotComposer } from "@/components/mizan/mutfak/not-composer";
import { NotKart } from "@/components/mizan/mutfak/not-kart";
import { useNotlar } from "@/lib/mutfak-hooks";

export const Route = createFileRoute("/workspace/notlar")({
  component: NotlarPage,
});

function NotlarPage() {
  const [arama, setArama] = React.useState("");
  const { data: notlar, isLoading } = useNotlar(false);

  const filtrelenmis = (notlar ?? []).filter((n) => {
    if (!arama) return true;
    const q = arama.toLowerCase();
    return (
      (n.baslik ?? "").toLowerCase().includes(q) ||
      n.icerik.toLowerCase().includes(q)
    );
  });

  const sabitli = filtrelenmis.filter((n) => n.pinned);
  const digerleri = filtrelenmis.filter((n) => !n.pinned);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
      <header className="mb-6">
        <Link
          to="/workspace"
          className="mb-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" /> Mutfak
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Notlar
        </h1>
      </header>

      <div className="mb-6">
        <NotComposer />
      </div>

      <div className="relative mx-auto mb-6 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Notlarda ara…"
          value={arama}
          onChange={(e) => setArama(e.target.value)}
          className="h-9 pl-9 text-sm"
        />
      </div>

      {isLoading ? (
        <div className="text-center text-sm text-muted-foreground">Yükleniyor…</div>
      ) : filtrelenmis.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 px-6 py-16 text-center">
          <p className="text-sm text-muted-foreground">
            {arama ? "Sonuç yok." : "Henüz not yok. Yukarıdan ilk notunu ekle."}
          </p>
        </div>
      ) : (
        <>
          {sabitli.length > 0 && (
            <>
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Sabitlenmiş
              </div>
              <div className="mb-6 columns-1 gap-3 sm:columns-2 lg:columns-3">
                {sabitli.map((n) => (
                  <NotKart key={n.id} not={n} />
                ))}
              </div>
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Diğerleri
              </div>
            </>
          )}
          <div className="columns-1 gap-3 sm:columns-2 lg:columns-3">
            {digerleri.map((n) => (
              <NotKart key={n.id} not={n} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
