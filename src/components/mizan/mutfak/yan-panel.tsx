import * as React from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { FileText, Sheet, StickyNote, Plus } from "lucide-react";
import { useNotlar, useBelgeler, useTablolar } from "@/lib/mutfak-hooks";
import { icerikOzet } from "@/lib/mutfak-not-icerik";
import { HubArama } from "./hub-arama";
import { cn } from "@/lib/utils";

type Item =
  | { tip: "belge"; id: string; baslik: string; emoji: string | null; updated: string }
  | { tip: "tablo"; id: string; baslik: string; updated: string }
  | { tip: "not"; id: string; baslik: string; updated: string };

/**
 * Mutfak sol yan paneli — alt sayfalarda her zaman görünür.
 * Arama + son kullanılanlar (belge/tablo/not karışık).
 * Mobilde gizli (xl: üstü).
 */
export function MutfakYanPanel() {
  const { pathname } = useLocation();
  const notlar = useNotlar(false);
  const belgeler = useBelgeler();
  const tablolar = useTablolar();

  const items: Item[] = React.useMemo(() => {
    const list: Item[] = [
      ...(belgeler.data ?? []).map<Item>((b) => ({
        tip: "belge",
        id: b.id,
        baslik: b.baslik || "Adsız belge",
        emoji: b.emoji,
        updated: b.updated_at,
      })),
      ...(tablolar.data ?? []).map<Item>((t) => ({
        tip: "tablo",
        id: t.id,
        baslik: t.baslik || "Adsız tablo",
        updated: t.updated_at,
      })),
      ...(notlar.data ?? []).map<Item>((n) => ({
        tip: "not",
        id: n.id,
        baslik: n.baslik || icerikOzet(n.icerik).slice(0, 40) || "Boş not",
        updated: n.updated_at,
      })),
    ];
    return list
      .sort((a, b) => +new Date(b.updated) - +new Date(a.updated))
      .slice(0, 12);
  }, [belgeler.data, tablolar.data, notlar.data]);

  return (
    <aside className="hidden w-64 shrink-0 border-r border-border/60 bg-card/30 xl:flex xl:flex-col">
      <div className="border-b border-border/60 p-3">
        <Link
          to="/workspace"
          className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground"
        >
          ← Mutfak
        </Link>
        <HubArama />
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        <p className="px-2 pb-1.5 pt-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Son kullanılanlar
        </p>
        {items.length === 0 ? (
          <p className="px-2 py-4 text-xs text-muted-foreground/70">
            Henüz bir şey yok.
          </p>
        ) : (
          <ul className="flex flex-col gap-0.5">
            {items.map((it) => (
              <YanPanelSatir key={`${it.tip}-${it.id}`} it={it} pathname={pathname} />
            ))}
          </ul>
        )}
      </div>

      <div className="border-t border-border/60 p-2">
        <div className="grid grid-cols-3 gap-1">
          <Link
            to="/workspace/notlar"
            className="flex flex-col items-center gap-1 rounded-md p-2 text-[10px] text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
          >
            <Plus className="h-3.5 w-3.5" />
            Not
          </Link>
          <Link
            to="/workspace/belge"
            className="flex flex-col items-center gap-1 rounded-md p-2 text-[10px] text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
          >
            <Plus className="h-3.5 w-3.5" />
            Belge
          </Link>
          <Link
            to="/workspace/tablo"
            className="flex flex-col items-center gap-1 rounded-md p-2 text-[10px] text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
          >
            <Plus className="h-3.5 w-3.5" />
            Tablo
          </Link>
        </div>
      </div>
    </aside>
  );
}

function YanPanelSatir({ it, pathname }: { it: Item; pathname: string }) {
  const ikon =
    it.tip === "belge" ? (
      it.emoji ? (
        <span className="text-sm leading-none">{it.emoji}</span>
      ) : (
        <FileText className="h-3.5 w-3.5 text-sky-500" />
      )
    ) : it.tip === "tablo" ? (
      <Sheet className="h-3.5 w-3.5 text-emerald-500" />
    ) : (
      <StickyNote className="h-3.5 w-3.5 text-amber-500" />
    );

  const inner = (active: boolean) => (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
        active ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
      )}
    >
      <span className="flex h-5 w-5 shrink-0 items-center justify-center">{ikon}</span>
      <span className="min-w-0 flex-1 truncate">{it.baslik}</span>
    </div>
  );

  if (it.tip === "belge") {
    const active = pathname === `/workspace/belge/${it.id}`;
    return (
      <li>
        <Link to="/workspace/belge/$id" params={{ id: it.id }}>
          {inner(active)}
        </Link>
      </li>
    );
  }
  if (it.tip === "tablo") {
    const active = pathname === `/workspace/tablo/${it.id}`;
    return (
      <li>
        <Link to="/workspace/tablo/$id" params={{ id: it.id }}>
          {inner(active)}
        </Link>
      </li>
    );
  }
  return (
    <li>
      <Link to="/workspace/notlar">{inner(pathname === "/workspace/notlar")}</Link>
    </li>
  );
}