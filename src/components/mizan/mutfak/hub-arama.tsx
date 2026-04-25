import * as React from "react";
import { Link } from "@tanstack/react-router";
import { Search, FileText, Sheet, StickyNote, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNotlar, useBelgeler, useTablolar } from "@/lib/mutfak-hooks";

type Sonuc =
  | { tip: "not"; id: string; baslik: string; renk: string }
  | { tip: "belge"; id: string; baslik: string; emoji: string | null }
  | { tip: "tablo"; id: string; baslik: string };

export function HubArama() {
  const [q, setQ] = React.useState("");
  const [acik, setAcik] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const notlar = useNotlar(false);
  const belgeler = useBelgeler();
  const tablolar = useTablolar();

  React.useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setAcik(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/" && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        (ref.current?.querySelector("input") as HTMLInputElement | null)?.focus();
      }
      if (e.key === "Escape") setAcik(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const sonuclar: Sonuc[] = React.useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return [];
    const r: Sonuc[] = [];
    (notlar.data ?? []).forEach((n) => {
      const t = (n.baslik ?? "") + " " + n.icerik;
      if (t.toLowerCase().includes(qq))
        r.push({ tip: "not", id: n.id, baslik: n.baslik || n.icerik.slice(0, 40) || "Boş not", renk: n.renk });
    });
    (belgeler.data ?? []).forEach((b) => {
      if (b.baslik.toLowerCase().includes(qq))
        r.push({ tip: "belge", id: b.id, baslik: b.baslik, emoji: b.emoji });
    });
    (tablolar.data ?? []).forEach((t) => {
      if (t.baslik.toLowerCase().includes(qq))
        r.push({ tip: "tablo", id: t.id, baslik: t.baslik });
    });
    return r.slice(0, 12);
  }, [q, notlar.data, belgeler.data, tablolar.data]);

  return (
    <div ref={ref} className="relative mx-auto w-full max-w-xl">
      <div
        className={cn(
          "flex items-center gap-2 rounded-full border border-border/60 bg-card px-4 py-2.5 shadow-sm transition-all",
          acik && "shadow-md ring-2 ring-primary/20",
        )}
      >
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setAcik(true);
          }}
          onFocus={() => setAcik(true)}
          placeholder="Mutfakta ara — notlar, belgeler, tablolar"
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        {q && (
          <button
            onClick={() => setQ("")}
            className="rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        <kbd className="hidden rounded border border-border bg-muted/50 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline">
          /
        </kbd>
      </div>
      {acik && q && (
        <div className="absolute left-0 right-0 top-full z-30 mt-2 max-h-[60vh] overflow-y-auto rounded-2xl border border-border bg-popover p-1.5 shadow-xl">
          {sonuclar.length === 0 ? (
            <div className="px-3 py-6 text-center text-xs text-muted-foreground">
              Sonuç yok
            </div>
          ) : (
            sonuclar.map((s) => (
              <SonucSatiri key={`${s.tip}-${s.id}`} sonuc={s} onSec={() => setAcik(false)} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

function SonucSatiri({ sonuc, onSec }: { sonuc: Sonuc; onSec: () => void }) {
  const ortak =
    "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors hover:bg-muted";
  if (sonuc.tip === "not") {
    return (
      <Link to="/workspace/notlar" onClick={onSec} className={ortak}>
        <StickyNote className="h-3.5 w-3.5 text-amber-500" />
        <span className="truncate text-foreground">{sonuc.baslik}</span>
        <span className="ml-auto text-[10px] uppercase tracking-wider text-muted-foreground">Not</span>
      </Link>
    );
  }
  if (sonuc.tip === "belge") {
    return (
      <Link
        to="/workspace/belge/$id"
        params={{ id: sonuc.id }}
        onClick={onSec}
        className={ortak}
      >
        <span className="text-base leading-none">{sonuc.emoji ?? <FileText className="h-3.5 w-3.5 text-sky-500" />}</span>
        <span className="truncate text-foreground">{sonuc.baslik}</span>
        <span className="ml-auto text-[10px] uppercase tracking-wider text-muted-foreground">Belge</span>
      </Link>
    );
  }
  return (
    <Link
      to="/workspace/tablo/$id"
      params={{ id: sonuc.id }}
      onClick={onSec}
      className={ortak}
    >
      <Sheet className="h-3.5 w-3.5 text-emerald-500" />
      <span className="truncate text-foreground">{sonuc.baslik}</span>
      <span className="ml-auto text-[10px] uppercase tracking-wider text-muted-foreground">Tablo</span>
    </Link>
  );
}