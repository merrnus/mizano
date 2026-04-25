import * as React from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Search, StickyNote, Archive, Tag, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { NotComposer } from "@/components/mizan/mutfak/not-composer";
import { NotKart } from "@/components/mizan/mutfak/not-kart";
import { useNotlar } from "@/lib/mutfak-hooks";
import { cn } from "@/lib/utils";

type NotlarSearch = { arsiv?: boolean; etiket?: string };

export const Route = createFileRoute("/workspace/notlar")({
  validateSearch: (s: Record<string, unknown>): NotlarSearch => ({
    arsiv: s.arsiv === true || s.arsiv === "true" || s.arsiv === 1 ? true : undefined,
    etiket: typeof s.etiket === "string" && s.etiket ? s.etiket : undefined,
  }),
  component: NotlarPage,
});

function NotlarPage() {
  const navigate = useNavigate({ from: "/workspace/notlar" });
  const search = Route.useSearch();
  const arsiv = !!search.arsiv;
  const etiketFiltre = search.etiket;
  const [arama, setArama] = React.useState("");
  const { data: notlar, isLoading } = useNotlar(arsiv);

  const tumEtiketler = React.useMemo(() => {
    const m = new Map<string, number>();
    (notlar ?? []).forEach((n) => (n.etiketler ?? []).forEach((e) => m.set(e, (m.get(e) ?? 0) + 1)));
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
  }, [notlar]);

  const filtrelenmis = (notlar ?? []).filter((n) => {
    if (etiketFiltre && !(n.etiketler ?? []).includes(etiketFiltre)) return false;
    if (!arama) return true;
    const q = arama.toLowerCase();
    return (
      (n.baslik ?? "").toLowerCase().includes(q) ||
      n.icerik.toLowerCase().includes(q) ||
      (n.etiketler ?? []).some((e) => e.toLowerCase().includes(q))
    );
  });

  const sabitli = filtrelenmis.filter((n) => n.pinned);
  const digerleri = filtrelenmis.filter((n) => !n.pinned);

  return (
    <div className="mx-auto flex w-full max-w-6xl gap-6 px-4 py-6 sm:px-6">
      {/* Sidebar */}
      <aside className="hidden w-44 shrink-0 lg:block">
        <Link
          to="/workspace"
          className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" /> Mutfak
        </Link>
        <nav className="space-y-0.5 text-sm">
          <Link
            to="/workspace/notlar"
            search={{ arsiv: undefined, etiket: undefined }}
            className={cn(
              "flex items-center gap-2 rounded-lg px-2.5 py-1.5 transition-colors",
              !arsiv && !etiketFiltre ? "bg-amber-100/60 text-foreground dark:bg-amber-950/30" : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <StickyNote className="h-3.5 w-3.5" /> Notlar
          </Link>
          <Link
            to="/workspace/notlar"
            search={{ arsiv: true, etiket: undefined }}
            className={cn(
              "flex items-center gap-2 rounded-lg px-2.5 py-1.5 transition-colors",
              arsiv ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Archive className="h-3.5 w-3.5" /> Arşiv
          </Link>
          {tumEtiketler.length > 0 && (
            <>
              <div className="mt-4 mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Etiketler
              </div>
              {tumEtiketler.map(([e, sayi]) => (
                <Link
                  key={e}
                  to="/workspace/notlar"
                  search={{ arsiv: undefined, etiket: e }}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-2.5 py-1.5 transition-colors",
                    etiketFiltre === e ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Tag className="h-3 w-3" />
                  <span className="flex-1 truncate">{e}</span>
                  <span className="text-[10px]">{sayi}</span>
                </Link>
              ))}
            </>
          )}
        </nav>
      </aside>

      <div className="flex-1">
        <header className="mb-6 lg:hidden">
          <Link
            to="/workspace"
            className="mb-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3 w-3" /> Mutfak
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {arsiv ? "Arşiv" : etiketFiltre ? `#${etiketFiltre}` : "Notlar"}
          </h1>
        </header>

        <header className="mb-6 hidden items-end justify-between lg:flex">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {arsiv ? "Arşiv" : etiketFiltre ? `#${etiketFiltre}` : "Notlar"}
          </h1>
          {(arsiv || etiketFiltre) && (
            <button
              onClick={() => navigate({ search: { arsiv: undefined, etiket: undefined } })}
              className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" /> Filtreyi temizle
            </button>
          )}
        </header>

        {/* Mobil etiket çubuğu */}
        {tumEtiketler.length > 0 && (
          <div className="mb-4 -mx-1 flex gap-1.5 overflow-x-auto px-1 lg:hidden">
            <Link
              to="/workspace/notlar"
              search={{ arsiv: undefined, etiket: undefined }}
              className={cn(
                "shrink-0 rounded-full px-2.5 py-1 text-xs",
                !arsiv && !etiketFiltre ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
              )}
            >
              Tümü
            </Link>
            <Link
              to="/workspace/notlar"
              search={{ arsiv: true, etiket: undefined }}
              className={cn(
                "shrink-0 rounded-full px-2.5 py-1 text-xs",
                arsiv ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
              )}
            >
              Arşiv
            </Link>
            {tumEtiketler.map(([e]) => (
              <Link
                key={e}
                to="/workspace/notlar"
                search={{ arsiv: undefined, etiket: e }}
                className={cn(
                  "shrink-0 rounded-full px-2.5 py-1 text-xs",
                  etiketFiltre === e ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                )}
              >
                #{e}
              </Link>
            ))}
          </div>
        )}

        {!arsiv && (
          <div className="mb-6">
            <NotComposer />
          </div>
        )}

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
    </div>
  );
}
