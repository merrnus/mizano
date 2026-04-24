import * as React from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { useBelge, useBelgeKaydet } from "@/lib/mutfak-hooks";
import { BelgeEditor } from "@/components/mizan/mutfak/belge-editor";

export const Route = createFileRoute("/workspace/belge/$id")({
  component: BelgeDetay,
  notFoundComponent: () => (
    <div className="mx-auto max-w-md p-10 text-center">
      <p className="mb-4 text-sm text-muted-foreground">Belge bulunamadı.</p>
      <Link to="/workspace/belge" className="text-sm text-primary underline">
        Belgelere dön
      </Link>
    </div>
  ),
});

function BelgeDetay() {
  const { id } = Route.useParams();
  const { data: belge, isLoading } = useBelge(id);
  const kaydet = useBelgeKaydet();
  const navigate = useNavigate();
  const [baslik, setBaslik] = React.useState("");
  const [emoji, setEmoji] = React.useState<string>("");
  const [icerik, setIcerik] = React.useState<unknown>(null);
  const [durum, setDurum] = React.useState<"hazir" | "kaydediliyor" | "kaydedildi">(
    "hazir",
  );
  const yuklendiRef = React.useRef(false);

  React.useEffect(() => {
    if (belge && !yuklendiRef.current) {
      setBaslik(belge.baslik);
      setEmoji(belge.emoji ?? "");
      setIcerik(belge.icerik);
      yuklendiRef.current = true;
    }
  }, [belge]);

  // Debounce kaydetme
  React.useEffect(() => {
    if (!yuklendiRef.current || !belge) return;
    if (
      baslik === belge.baslik &&
      emoji === (belge.emoji ?? "") &&
      JSON.stringify(icerik) === JSON.stringify(belge.icerik)
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
            emoji: emoji || null,
            icerik: icerik as never,
          },
        },
        {
          onSuccess: () => setDurum("kaydedildi"),
          onError: () => setDurum("hazir"),
        },
      );
    }, 800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baslik, emoji, icerik]);

  if (isLoading || !belge) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 text-center text-sm text-muted-foreground">
        Yükleniyor…
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">
      <header className="mb-6 flex items-center justify-between gap-3">
        <button
          onClick={() => navigate({ to: "/workspace/belge" })}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" /> Belgeler
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

      <div className="mb-4 flex items-center gap-2">
        <input
          value={emoji}
          onChange={(e) => setEmoji(e.target.value.slice(0, 2))}
          placeholder="😀"
          className="w-10 rounded-lg border border-transparent bg-transparent text-center text-2xl outline-none hover:border-border focus:border-primary"
        />
        <input
          value={baslik}
          onChange={(e) => setBaslik(e.target.value)}
          placeholder="Adsız belge"
          className="flex-1 bg-transparent text-3xl font-semibold tracking-tight text-foreground outline-none placeholder:text-muted-foreground/50"
        />
      </div>

      {icerik !== null && (
        <BelgeEditor icerik={icerik} onDegisim={setIcerik} />
      )}
    </div>
  );
}
