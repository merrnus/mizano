import * as React from "react";
import { Pin, Plus, ListChecks, Type as TypeIcon, Tag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useNotEkle } from "@/lib/mutfak-hooks";
import { NOT_RENKLERI, type NotRenk } from "@/lib/mutfak-tipleri";
import { icerikYazi, type NotListeItem } from "@/lib/mutfak-not-icerik";
import { cn } from "@/lib/utils";

export function NotComposer() {
  const [acik, setAcik] = React.useState(false);
  const [baslik, setBaslik] = React.useState("");
  const [metin, setMetin] = React.useState("");
  const [tip, setTip] = React.useState<"metin" | "liste">("metin");
  const [items, setItems] = React.useState<NotListeItem[]>([
    { id: crypto.randomUUID(), text: "", done: false },
  ]);
  const [renk, setRenk] = React.useState<NotRenk>("sari");
  const [pinned, setPinned] = React.useState(false);
  const [etiketler, setEtiketler] = React.useState<string[]>([]);
  const [yeniEtiket, setYeniEtiket] = React.useState("");
  const ekle = useNotEkle();

  const sifirla = () => {
    setBaslik("");
    setMetin("");
    setItems([{ id: crypto.randomUUID(), text: "", done: false }]);
    setRenk("sari");
    setPinned(false);
    setTip("metin");
    setEtiketler([]);
    setYeniEtiket("");
    setAcik(false);
  };

  const kaydet = () => {
    const temiz =
      tip === "liste"
        ? items.filter((it) => it.text.trim().length > 0)
        : [];
    const dolu = tip === "metin" ? !!metin.trim() : temiz.length > 0;
    if (!dolu && !baslik.trim()) {
      setAcik(false);
      return;
    }
    const icerikStr =
      tip === "liste"
        ? icerikYazi({ tip: "liste", items: temiz })
        : metin;
    ekle.mutate(
      { baslik: baslik || null, icerik: icerikStr, renk, pinned, etiketler },
      { onSuccess: sifirla },
    );
  };

  const etiketEkle = () => {
    const v = yeniEtiket.trim();
    if (!v || etiketler.includes(v)) return;
    setEtiketler((p) => [...p, v]);
    setYeniEtiket("");
  };

  const renkBg = NOT_RENKLERI.find((r) => r.id === renk)?.bg ?? "";

  if (!acik) {
    return (
      <div className="mx-auto flex w-full max-w-xl items-center gap-1 rounded-2xl border border-border/60 bg-card pr-2 shadow-sm transition-all hover:border-primary/40 hover:shadow-md">
        <button
          onClick={() => {
            setTip("metin");
            setAcik(true);
          }}
          className="flex flex-1 items-center gap-3 px-4 py-3 text-left text-sm text-muted-foreground"
        >
          <Plus className="h-4 w-4" />
          Hızlı not al…
        </button>
        <button
          onClick={() => {
            setTip("liste");
            setAcik(true);
          }}
          title="Liste"
          className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <ListChecks className="h-4 w-4" />
        </button>
      </div>
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
      {tip === "metin" ? (
        <Textarea
          placeholder="Notunu yaz…"
          value={metin}
          onChange={(e) => setMetin(e.target.value)}
          className="min-h-[80px] resize-none border-0 bg-transparent px-1 text-sm focus-visible:ring-0"
        />
      ) : (
        <div className="space-y-1">
          {items.map((it, idx) => (
            <div key={it.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={it.done}
                onChange={(e) =>
                  setItems((prev) => prev.map((p) => (p.id === it.id ? { ...p, done: e.target.checked } : p)))
                }
                className="h-4 w-4 accent-primary"
              />
              <input
                value={it.text}
                placeholder="Liste öğesi"
                onChange={(e) =>
                  setItems((prev) => prev.map((p) => (p.id === it.id ? { ...p, text: e.target.value } : p)))
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    setItems((prev) => {
                      const yeni = [...prev];
                      yeni.splice(idx + 1, 0, { id: crypto.randomUUID(), text: "", done: false });
                      return yeni;
                    });
                    setTimeout(() => {
                      const inputs = document.querySelectorAll<HTMLInputElement>("[data-not-liste-input]");
                      inputs[idx + 1]?.focus();
                    }, 0);
                  }
                  if (e.key === "Backspace" && it.text === "" && items.length > 1) {
                    e.preventDefault();
                    setItems((prev) => prev.filter((p) => p.id !== it.id));
                  }
                }}
                data-not-liste-input
                className={cn(
                  "flex-1 bg-transparent px-1 py-0.5 text-sm outline-none",
                  it.done && "text-muted-foreground line-through",
                )}
              />
              {items.length > 1 && (
                <button
                  onClick={() => setItems((prev) => prev.filter((p) => p.id !== it.id))}
                  className="rounded p-0.5 text-muted-foreground hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
          <button
            onClick={() =>
              setItems((prev) => [...prev, { id: crypto.randomUUID(), text: "", done: false }])
            }
            className="flex items-center gap-1.5 rounded px-1 py-0.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <Plus className="h-3 w-3" /> Öğe ekle
          </button>
        </div>
      )}

      {/* Etiketler */}
      <div className="mt-2 flex flex-wrap items-center gap-1">
        {etiketler.map((e) => (
          <span key={e} className="inline-flex items-center gap-1 rounded-full bg-background/60 px-2 py-0.5 text-[10px] text-foreground">
            {e}
            <button
              onClick={() => setEtiketler((p) => p.filter((x) => x !== e))}
              className="text-muted-foreground hover:text-destructive"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </span>
        ))}
        <div className="flex items-center gap-1">
          <Tag className="h-3 w-3 text-muted-foreground" />
          <input
            value={yeniEtiket}
            onChange={(e) => setYeniEtiket(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                etiketEkle();
              }
            }}
            placeholder="etiket ekle"
            className="w-24 bg-transparent text-[11px] outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>
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
            onClick={() => setTip((t) => (t === "metin" ? "liste" : "metin"))}
            className="ml-1 rounded-full p-1 text-muted-foreground transition-colors hover:text-foreground"
            aria-label={tip === "metin" ? "Listeye çevir" : "Metne çevir"}
            title={tip === "metin" ? "Listeye çevir" : "Metne çevir"}
          >
            {tip === "metin" ? <ListChecks className="h-3.5 w-3.5" /> : <TypeIcon className="h-3.5 w-3.5" />}
          </button>
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
          <Button variant="ghost" size="sm" onClick={sifirla}>
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
