import * as React from "react";
import { Pin, Trash2, Archive, Palette } from "lucide-react";
import { useNotGuncelle, useNotSil } from "@/lib/mutfak-hooks";
import { NOT_RENKLERI, type MutfakNot, type NotRenk } from "@/lib/mutfak-tipleri";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function NotKart({ not }: { not: MutfakNot }) {
  const guncelle = useNotGuncelle();
  const sil = useNotSil();
  const [duzenliyor, setDuzenliyor] = React.useState(false);
  const [baslik, setBaslik] = React.useState(not.baslik ?? "");
  const [icerik, setIcerik] = React.useState(not.icerik);

  const renkBg =
    NOT_RENKLERI.find((r) => r.id === (not.renk as NotRenk))?.bg ?? "";

  const kaydet = () => {
    if (baslik !== (not.baslik ?? "") || icerik !== not.icerik) {
      guncelle.mutate({
        id: not.id,
        patch: { baslik: baslik || null, icerik },
      });
    }
    setDuzenliyor(false);
  };

  return (
    <div
      className={cn(
        "group break-inside-avoid mb-3 rounded-2xl border border-border/40 p-3 shadow-sm transition-all hover:shadow-md",
        renkBg,
      )}
    >
      {duzenliyor ? (
        <>
          <input
            value={baslik}
            onChange={(e) => setBaslik(e.target.value)}
            placeholder="Başlık"
            className="mb-1 w-full bg-transparent text-sm font-semibold outline-none"
          />
          <textarea
            value={icerik}
            onChange={(e) => setIcerik(e.target.value)}
            onBlur={kaydet}
            autoFocus
            className="min-h-[60px] w-full resize-none bg-transparent text-sm outline-none"
          />
        </>
      ) : (
        <button
          onClick={() => setDuzenliyor(true)}
          className="block w-full cursor-text text-left"
        >
          {not.baslik && (
            <div className="mb-1 text-sm font-semibold text-foreground">
              {not.baslik}
            </div>
          )}
          {not.icerik && (
            <div className="whitespace-pre-wrap text-sm text-foreground/90">
              {not.icerik}
            </div>
          )}
          {!not.baslik && !not.icerik && (
            <div className="text-xs text-muted-foreground">Boş not</div>
          )}
        </button>
      )}
      <div className="mt-2 flex items-center justify-between opacity-0 transition-opacity group-hover:opacity-100">
        <div className="flex items-center gap-0.5">
          <button
            onClick={() =>
              guncelle.mutate({ id: not.id, patch: { pinned: !not.pinned } })
            }
            className={cn(
              "rounded p-1 text-muted-foreground hover:bg-background/40 hover:text-foreground",
              not.pinned && "text-primary",
            )}
            title="Sabitle"
          >
            <Pin className="h-3.5 w-3.5" />
          </button>
          <Popover>
            <PopoverTrigger asChild>
              <button
                className="rounded p-1 text-muted-foreground hover:bg-background/40 hover:text-foreground"
                title="Renk"
              >
                <Palette className="h-3.5 w-3.5" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2" align="start">
              <div className="flex gap-1">
                {NOT_RENKLERI.map((r) => (
                  <button
                    key={r.id}
                    onClick={() =>
                      guncelle.mutate({ id: not.id, patch: { renk: r.id } })
                    }
                    className={cn(
                      "h-6 w-6 rounded-full border border-border/60",
                      r.bg,
                      not.renk === r.id && "ring-2 ring-primary",
                    )}
                  />
                ))}
              </div>
            </PopoverContent>
          </Popover>
          <button
            onClick={() =>
              guncelle.mutate({ id: not.id, patch: { arsiv: true } })
            }
            className="rounded p-1 text-muted-foreground hover:bg-background/40 hover:text-foreground"
            title="Arşivle"
          >
            <Archive className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => sil.mutate(not.id)}
            className="rounded p-1 text-muted-foreground hover:bg-background/40 hover:text-destructive"
            title="Sil"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
        {not.pinned && (
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground">
            sabit
          </span>
        )}
      </div>
    </div>
  );
}
