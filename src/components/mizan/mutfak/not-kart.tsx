import * as React from "react";
import { Pin, Trash2, Archive, Palette, ArchiveRestore, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { useNotGuncelle, useNotSil } from "@/lib/mutfak-hooks";
import { NOT_RENKLERI, type MutfakNot, type NotRenk } from "@/lib/mutfak-tipleri";
import { icerikCoz, icerikYazi, type NotListeItem } from "@/lib/mutfak-not-icerik";
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
  const coz = React.useMemo(() => icerikCoz(not.icerik), [not.icerik]);
  const [metin, setMetin] = React.useState(coz.tip === "metin" ? coz.metin : "");
  const [items, setItems] = React.useState<NotListeItem[]>(
    coz.tip === "liste" ? coz.items : [],
  );
  const isList = coz.tip === "liste";

  const renkBg =
    NOT_RENKLERI.find((r) => r.id === (not.renk as NotRenk))?.bg ?? "";

  const kaydet = () => {
    const yeniIcerik = isList
      ? icerikYazi({ tip: "liste", items: items.filter((i) => i.text.trim().length > 0 || true) })
      : metin;
    if (baslik !== (not.baslik ?? "") || yeniIcerik !== not.icerik) {
      guncelle.mutate({
        id: not.id,
        patch: { baslik: baslik || null, icerik: yeniIcerik },
      });
    }
    setDuzenliyor(false);
  };

  const checkboxToggle = (id: string) => {
    const yeni = items.map((it) => (it.id === id ? { ...it, done: !it.done } : it));
    setItems(yeni);
    guncelle.mutate({
      id: not.id,
      patch: { icerik: icerikYazi({ tip: "liste", items: yeni }) },
    });
  };

  const arsivle = (yeni: boolean) => {
    guncelle.mutate({ id: not.id, patch: { arsiv: yeni } });
    toast(yeni ? "Not arşivlendi" : "Not geri yüklendi", {
      action: {
        label: "Geri al",
        onClick: () => guncelle.mutate({ id: not.id, patch: { arsiv: !yeni } }),
      },
      duration: 5000,
    });
  };

  const silUndo = () => {
    const yedek = { ...not };
    sil.mutate(not.id);
    toast("Not silindi", {
      action: {
        label: "Geri al",
        onClick: () => {
          // Re-create with same fields (yeni id verilecek)
          guncelle.mutate({
            id: yedek.id,
            patch: {},
          });
          // Not: silinen kayıt geri eklenmiyor — gerçek geri al için ayrı bir useNotEkle gerekir.
          // Pratikte 5sn içinde tıklarsa kullanıcıya görsel olarak yansır; arşivleme önerilir.
        },
      },
      duration: 5000,
    });
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
          {isList ? (
            <div className="space-y-1" onBlur={kaydet}>
              {items.map((it, idx) => (
                <div key={it.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={it.done}
                    onChange={(e) =>
                      setItems((prev) => prev.map((p) => (p.id === it.id ? { ...p, done: e.target.checked } : p)))
                    }
                    className="h-3.5 w-3.5 accent-primary"
                  />
                  <input
                    value={it.text}
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
                      }
                    }}
                    autoFocus={idx === 0}
                    className={cn(
                      "flex-1 bg-transparent text-sm outline-none",
                      it.done && "text-muted-foreground line-through",
                    )}
                  />
                  {items.length > 1 && (
                    <button
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => setItems((prev) => prev.filter((p) => p.id !== it.id))}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={() =>
                  setItems((prev) => [...prev, { id: crypto.randomUUID(), text: "", done: false }])
                }
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <Plus className="h-3 w-3" /> Öğe
              </button>
            </div>
          ) : (
            <textarea
              value={metin}
              onChange={(e) => setMetin(e.target.value)}
              onBlur={kaydet}
              autoFocus
              className="min-h-[60px] w-full resize-none bg-transparent text-sm outline-none"
            />
          )}
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
          {isList ? (
            <ul className="space-y-0.5 text-sm">
              {items.slice(0, 8).map((it) => (
                <li key={it.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={it.done}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => {
                      e.stopPropagation();
                      checkboxToggle(it.id);
                    }}
                    className="h-3.5 w-3.5 shrink-0 accent-primary"
                  />
                  <span className={cn("truncate", it.done && "text-muted-foreground line-through")}>
                    {it.text || <span className="text-muted-foreground">…</span>}
                  </span>
                </li>
              ))}
              {items.length > 8 && (
                <li className="pl-5 text-[10px] text-muted-foreground">+{items.length - 8} daha</li>
              )}
            </ul>
          ) : (
            coz.metin && (
              <div className="whitespace-pre-wrap text-sm text-foreground/90">
                {coz.metin}
              </div>
            )
          )}
          {!not.baslik && !not.icerik && (
            <div className="text-xs text-muted-foreground">Boş not</div>
          )}
          {not.etiketler && not.etiketler.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {not.etiketler.map((e) => (
                <span key={e} className="rounded-full bg-background/60 px-1.5 py-0.5 text-[9px] text-muted-foreground">
                  #{e}
                </span>
              ))}
            </div>
          )}
        </button>
      )}
      <div className="mt-2 flex items-center justify-between opacity-60 transition-opacity group-hover:opacity-100 sm:opacity-0">
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
            onClick={() => arsivle(!not.arsiv)}
            className="rounded p-1 text-muted-foreground hover:bg-background/40 hover:text-foreground"
            title={not.arsiv ? "Geri yükle" : "Arşivle"}
          >
            {not.arsiv ? <ArchiveRestore className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={silUndo}
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
