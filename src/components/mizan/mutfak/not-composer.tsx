import * as React from "react";
import { Pin, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useNotEkle } from "@/lib/mutfak-hooks";
import { NOT_RENKLERI, type NotRenk } from "@/lib/mutfak-tipleri";
import { cn } from "@/lib/utils";

export function NotComposer() {
  const [acik, setAcik] = React.useState(false);
  const [baslik, setBaslik] = React.useState("");
  const [icerik, setIcerik] = React.useState("");
  const [renk, setRenk] = React.useState<NotRenk>("sari");
  const [pinned, setPinned] = React.useState(false);
  const ekle = useNotEkle();

  const kaydet = () => {
    if (!icerik.trim() && !baslik.trim()) {
      setAcik(false);
      return;
    }
    ekle.mutate(
      { baslik: baslik || null, icerik, renk, pinned },
      {
        onSuccess: () => {
          setBaslik("");
          setIcerik("");
          setRenk("sari");
          setPinned(false);
          setAcik(false);
        },
      },
    );
  };

  const renkBg = NOT_RENKLERI.find((r) => r.id === renk)?.bg ?? "";

  if (!acik) {
    return (
      <button
        onClick={() => setAcik(true)}
        className="mx-auto flex w-full max-w-xl items-center gap-3 rounded-2xl border border-border/60 bg-card px-4 py-3 text-left text-sm text-muted-foreground shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
      >
        <Plus className="h-4 w-4" />
        Hızlı not al…
      </button>
    );
  }

  return (
    <div
      className={cn(
        "mx-auto w-full max-w-xl rounded-2xl border border-border bg-card p-3 shadow-md transition-colors",
        renkBg,
      )}
    >
      <Input
        autoFocus
        placeholder="Başlık"
        value={baslik}
        onChange={(e) => setBaslik(e.target.value)}
        className="mb-2 h-8 border-0 bg-transparent px-1 text-sm font-semibold focus-visible:ring-0"
      />
      <Textarea
        placeholder="Notunu yaz…"
        value={icerik}
        onChange={(e) => setIcerik(e.target.value)}
        className="min-h-[80px] resize-none border-0 bg-transparent px-1 text-sm focus-visible:ring-0"
      />
      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {NOT_RENKLERI.map((r) => (
            <button
              key={r.id}
              onClick={() => setRenk(r.id)}
              className={cn(
                "h-5 w-5 rounded-full border border-border/60 transition-all",
                r.bg,
                renk === r.id && "ring-2 ring-offset-1 ring-offset-background",
                renk === r.id && r.ring,
              )}
              aria-label={r.label}
            />
          ))}
          <button
            onClick={() => setPinned((p) => !p)}
            className={cn(
              "ml-1 rounded-full p-1 text-muted-foreground transition-colors hover:text-foreground",
              pinned && "text-primary",
            )}
            aria-label="Sabitle"
          >
            <Pin className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="flex gap-1.5">
          <Button variant="ghost" size="sm" onClick={() => setAcik(false)}>
            Vazgeç
          </Button>
          <Button size="sm" onClick={kaydet}>
            Kaydet
          </Button>
        </div>
      </div>
    </div>
  );
}
