import * as React from "react";
import { Plus, Trash2, Type, Hash, Calendar as Cal, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import type { TabloKolon, TabloKolonTip, TabloSatir } from "@/lib/mutfak-tipleri";
import { cn } from "@/lib/utils";

type Props = {
  kolonlar: TabloKolon[];
  satirlar: TabloSatir[];
  onDegisim: (k: TabloKolon[], s: TabloSatir[]) => void;
};

const KOLON_TIPLERI: { id: TabloKolonTip; ad: string; ikon: typeof Type }[] = [
  { id: "metin", ad: "Metin", ikon: Type },
  { id: "sayi", ad: "Sayı", ikon: Hash },
  { id: "tarih", ad: "Tarih", ikon: Cal },
  { id: "checkbox", ad: "Onay", ikon: CheckSquare },
];

export function TabloEditor({ kolonlar, satirlar, onDegisim }: Props) {
  const setKolonAd = (id: string, ad: string) => {
    onDegisim(kolonlar.map((k) => (k.id === id ? { ...k, ad } : k)), satirlar);
  };

  const setKolonTip = (id: string, tip: TabloKolonTip) => {
    onDegisim(kolonlar.map((k) => (k.id === id ? { ...k, tip } : k)), satirlar);
  };

  const kolonSil = (id: string) => {
    onDegisim(
      kolonlar.filter((k) => k.id !== id),
      satirlar.map((s) => {
        const yeni = { ...s.hucreler };
        delete yeni[id];
        return { ...s, hucreler: yeni };
      }),
    );
  };

  const kolonEkle = () => {
    onDegisim(
      [...kolonlar, { id: crypto.randomUUID(), ad: "Yeni kolon", tip: "metin" }],
      satirlar,
    );
  };

  const satirEkle = () => {
    onDegisim(kolonlar, [...satirlar, { id: crypto.randomUUID(), hucreler: {} }]);
  };

  const satirSil = (id: string) => {
    onDegisim(kolonlar, satirlar.filter((s) => s.id !== id));
  };

  const setHucre = (
    satirId: string,
    kolonId: string,
    deger: string | number | boolean | null,
  ) => {
    onDegisim(
      kolonlar,
      satirlar.map((s) =>
        s.id === satirId
          ? { ...s, hucreler: { ...s.hucreler, [kolonId]: deger } }
          : s,
      ),
    );
  };

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            <th className="w-8 border-r border-border px-2 py-2 text-[10px] uppercase tracking-wider text-muted-foreground">
              #
            </th>
            {kolonlar.map((k, i) => {
              const tipMeta = KOLON_TIPLERI.find((t) => t.id === k.tip)!;
              const Ikon = tipMeta.ikon;
              return (
                <th
                  key={k.id}
                  className="group min-w-[140px] border-r border-border px-3 py-1.5 text-left"
                >
                  <div className="flex items-center gap-1.5">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="rounded p-1 text-muted-foreground hover:bg-background hover:text-foreground">
                        <Ikon className="h-3 w-3" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        {KOLON_TIPLERI.map((t) => (
                          <DropdownMenuItem
                            key={t.id}
                            onClick={() => setKolonTip(k.id, t.id)}
                          >
                            <t.ikon className="mr-2 h-3 w-3" /> {t.ad}
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => kolonSil(k.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-3 w-3" /> Kolonu sil
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <input
                      value={k.ad}
                      onChange={(e) => setKolonAd(k.id, e.target.value)}
                      className="flex-1 bg-transparent text-xs font-medium text-foreground outline-none"
                    />
                  </div>
                </th>
              );
            })}
            <th className="w-10 px-2">
              <button
                onClick={kolonEkle}
                className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-background hover:text-foreground"
                title="Kolon ekle"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          {satirlar.map((s, i) => (
            <tr key={s.id} className="group border-b border-border/40 last:border-b-0">
              <td className="border-r border-border/40 px-2 py-1 text-center text-[11px] text-muted-foreground">
                {i + 1}
              </td>
              {kolonlar.map((k) => (
                <td
                  key={k.id}
                  className={cn(
                    "border-r border-border/40 px-2 py-0.5",
                    k.tip === "checkbox" && "text-center",
                  )}
                >
                  <Hucre
                    tip={k.tip}
                    deger={s.hucreler[k.id] ?? null}
                    onDegis={(d) => setHucre(s.id, k.id, d)}
                  />
                </td>
              ))}
              <td className="px-1">
                <button
                  onClick={() => satirSil(s.id)}
                  className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-destructive group-hover:opacity-100"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex items-center border-t border-border bg-muted/20 p-1.5">
        <Button variant="ghost" size="sm" onClick={satirEkle} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" /> Satır ekle
        </Button>
      </div>
    </div>
  );
}

function Hucre({
  tip,
  deger,
  onDegis,
}: {
  tip: TabloKolonTip;
  deger: string | number | boolean | null;
  onDegis: (d: string | number | boolean | null) => void;
}) {
  if (tip === "checkbox") {
    return (
      <input
        type="checkbox"
        checked={!!deger}
        onChange={(e) => onDegis(e.target.checked)}
        className="h-4 w-4 cursor-pointer accent-primary"
      />
    );
  }
  if (tip === "sayi") {
    return (
      <input
        type="number"
        value={deger == null ? "" : String(deger)}
        onChange={(e) => onDegis(e.target.value === "" ? null : Number(e.target.value))}
        className="w-full bg-transparent py-1 text-sm tabular-nums outline-none"
      />
    );
  }
  if (tip === "tarih") {
    return (
      <input
        type="date"
        value={deger == null ? "" : String(deger)}
        onChange={(e) => onDegis(e.target.value || null)}
        className="w-full bg-transparent py-1 text-sm outline-none"
      />
    );
  }
  return (
    <input
      value={deger == null ? "" : String(deger)}
      onChange={(e) => onDegis(e.target.value)}
      className="w-full bg-transparent py-1 text-sm outline-none"
    />
  );
}
