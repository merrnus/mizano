import * as React from "react";
import { format, isSameDay, isToday, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { ALAN_ETIKET } from "@/lib/cetele-tipleri";
import { type TakvimGorev } from "@/lib/takvim-tipleri";
import { useGorevGuncelle } from "@/lib/takvim-hooks";
import { GUN_KISA, haftaBaslangici, haftaGunleri } from "@/lib/cetele-tarih";

type Props = {
  ankara: Date;
  gorevler: TakvimGorev[];
  onYeni: () => void;
  onDuzenle: (g: TakvimGorev) => void;
};

export function GorevPaneli({ ankara, gorevler, onYeni, onDuzenle }: Props) {
  const guncelle = useGorevGuncelle();
  const haftaBas = haftaBaslangici(ankara);
  const haftaGun = haftaGunleri(haftaBas);

  const bugunGorevleri = gorevler.filter((g) => isToday(parseISO(g.vade)));
  const haftaGorevleri = gorevler.filter((g) => {
    const d = parseISO(g.vade);
    return haftaGun.some((hg) => isSameDay(hg, d)) && !isToday(d);
  });

  const tamamSayisi = gorevler.filter((g) => g.tamamlandi).length;

  return (
    <aside className="flex w-full shrink-0 flex-col rounded-xl border border-border bg-card xl:w-72 xl:max-h-full xl:overflow-y-auto">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Görevler</h3>
          <p className="text-[11px] text-muted-foreground">
            {tamamSayisi}/{gorevler.length} · bu hafta
          </p>
        </div>
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onYeni}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex flex-col gap-4 px-3 py-3">
        <Grup
          baslik="Bugün"
          sayi={bugunGorevleri.length}
          gorevler={bugunGorevleri}
          onDuzenle={onDuzenle}
          onToggle={(g) =>
            guncelle.mutate({ id: g.id, degisiklikler: { tamamlandi: !g.tamamlandi } })
          }
        />
        <Grup
          baslik="Bu Hafta"
          sayi={haftaGorevleri.length}
          gorevler={haftaGorevleri}
          gunGoster
          onDuzenle={onDuzenle}
          onToggle={(g) =>
            guncelle.mutate({ id: g.id, degisiklikler: { tamamlandi: !g.tamamlandi } })
          }
        />
        {gorevler.length === 0 && (
          <p className="px-2 py-6 text-center text-xs text-muted-foreground">
            Bu hafta için görev yok. <br />
            <button onClick={onYeni} className="text-primary underline-offset-2 hover:underline">
              Bir tane ekle
            </button>
          </p>
        )}
      </div>
    </aside>
  );
}

function Grup({
  baslik,
  sayi,
  gorevler,
  gunGoster,
  onToggle,
  onDuzenle,
}: {
  baslik: string;
  sayi: number;
  gorevler: TakvimGorev[];
  gunGoster?: boolean;
  onToggle: (g: TakvimGorev) => void;
  onDuzenle: (g: TakvimGorev) => void;
}) {
  if (gorevler.length === 0) return null;
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between px-2">
        <h4 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {baslik}
        </h4>
        <span className="text-[10px] text-muted-foreground">{sayi}</span>
      </div>
      <ul className="flex flex-col gap-0.5">
        {gorevler.map((g) => {
          const d = parseISO(g.vade);
          const gunIdx = (d.getDay() + 6) % 7;
          return (
            <li
              key={g.id}
              className="group flex items-start gap-2 rounded-md px-2 py-1.5 hover:bg-accent/40"
            >
              <Checkbox
                checked={g.tamamlandi}
                onCheckedChange={() => onToggle(g)}
                className="mt-0.5"
              />
              <button
                type="button"
                onClick={() => onDuzenle(g)}
                className="min-w-0 flex-1 text-left"
              >
                <div
                  className={cn(
                    "truncate text-sm",
                    g.tamamlandi ? "text-muted-foreground line-through" : "text-foreground",
                  )}
                >
                  {g.baslik}
                </div>
                <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: `var(--${g.alan})` }}
                  />
                  <span>{ALAN_ETIKET[g.alan]}</span>
                  {gunGoster && (
                    <>
                      <span>·</span>
                      <span>{GUN_KISA[gunIdx]}</span>
                    </>
                  )}
                  {g.oncelik === "yuksek" && (
                    <>
                      <span>·</span>
                      <span className="text-destructive">!</span>
                    </>
                  )}
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}