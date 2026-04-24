import * as React from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { useTablo, useTabloKaydet } from "@/lib/mutfak-hooks";
import { TabloEditor } from "@/components/mizan/mutfak/tablo-editor";
import type { TabloKolon, TabloSatir } from "@/lib/mutfak-tipleri";

export const Route = createFileRoute("/workspace/tablo/$id")({
  component: TabloDetay,
  notFoundComponent: () => (
    <div className="mx-auto max-w-md p-10 text-center">
      <p className="mb-4 text-sm text-muted-foreground">Tablo bulunamadı.</p>
      <Link to="/workspace/tablo" className="text-sm text-primary underline">
        Tablolara dön
      </Link>
    </div>
  ),
});

function TabloDetay() {
  const { id } = Route.useParams();
  const { data: tablo, isLoading } = useTablo(id);
  const kaydet = useTabloKaydet();
  const navigate = useNavigate();
  const [baslik, setBaslik] = React.useState("");
  const [kolonlar, setKolonlar] = React.useState<TabloKolon[]>([]);
  const [satirlar, setSatirlar] = React.useState<TabloSatir[]>([]);
  const [durum, setDurum] = React.useState<"hazir" | "kaydediliyor" | "kaydedildi">(
    "hazir",
  );
  const yuklendiRef = React.useRef(false);

  React.useEffect(() => {
    if (tablo && !yuklendiRef.current) {
      setBaslik(tablo.baslik);
      setKolonlar(tablo.kolonlar);
      setSatirlar(tablo.satirlar);
      yuklendiRef.current = true;
    }
  }, [tablo]);

  React.useEffect(() => {
    if (!yuklendiRef.current || !tablo) return;
    if (
      baslik === tablo.baslik &&
      JSON.stringify(kolonlar) === JSON.stringify(tablo.kolonlar) &&
      JSON.stringify(satirlar) === JSON.stringify(tablo.satirlar)
    ) {
      return;
    }
    setDurum("kaydediliyor");
    const t = setTimeout(() => {
      kaydet.mutate(
        {
          id,
          patch: {
            baslik,
            kolonlar: kolonlar as never,
            satirlar: satirlar as never,
          },
        },
        {
          onSuccess: () => setDurum("kaydedildi"),
          onError: () => setDurum("hazir"),
        },
      );
    }, 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baslik, kolonlar, satirlar]);

  if (isLoading || !tablo) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 text-center text-sm text-muted-foreground">
        Yükleniyor…
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      <header className="mb-6 flex items-center justify-between gap-3">
        <button
          onClick={() => navigate({ to: "/workspace/tablo" })}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" /> Tablolar
        </button>
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          {durum === "kaydediliyor" && (
            <>
              <Loader2 className="h-3 w-3 animate-spin" /> Kaydediliyor…
            </>
          )}
          {durum === "kaydedildi" && (
            <>
              <Check className="h-3 w-3 text-emerald-500" /> Kaydedildi
            </>
          )}
        </div>
      </header>

      <input
        value={baslik}
        onChange={(e) => setBaslik(e.target.value)}
        placeholder="Adsız tablo"
        className="mb-4 w-full bg-transparent text-3xl font-semibold tracking-tight text-foreground outline-none placeholder:text-muted-foreground/50"
      />

      <TabloEditor
        kolonlar={kolonlar}
        satirlar={satirlar}
        onDegisim={(k, s) => {
          setKolonlar(k);
          setSatirlar(s);
        }}
      />
    </div>
  );
}
