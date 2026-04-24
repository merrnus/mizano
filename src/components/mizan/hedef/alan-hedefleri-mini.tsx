import { Link } from "@tanstack/react-router";
import { ArrowRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHedefler, useTumAdimlar } from "@/lib/hedef-hooks";
import { HedefForm } from "./hedef-form";
import { HedefKart } from "./hedef-kart";
import type { CeteleAlan } from "@/lib/cetele-tipleri";
import { ALAN_ETIKET } from "@/lib/cetele-tipleri";

const ALAN_ROUTE: Record<CeteleAlan, "/mizan/mana" | "/mizan/ilim" | "/mizan/amel" | "/mizan"> = {
  mana: "/mizan/mana",
  ilim: "/mizan/ilim",
  amel: "/mizan/amel",
  kisisel: "/mizan",
};

export function AlanHedefleriMini({ alan }: { alan: CeteleAlan }) {
  const { data: hedefler = [], isLoading } = useHedefler();
  const { data: adimlar = [] } = useTumAdimlar();

  const ilgili = hedefler
    .filter((h) => h.alan === alan && h.durum === "aktif")
    .slice(0, 6);

  const tumuRoute = ALAN_ROUTE[alan];

  return (
    <section className="mt-6 rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-medium">{ALAN_ETIKET[alan]} hedefleri</h2>
          <p className="text-[11px] text-muted-foreground">Aktif hedefler — son adım buradan görünür.</p>
        </div>
        <div className="flex items-center gap-1">
          <HedefForm varsayilanAlan={alan} />
          <Button variant="ghost" size="sm" asChild className="h-7 gap-1 text-xs">
            <Link to={tumuRoute}>
              Tümü <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <p className="py-6 text-center text-xs text-muted-foreground">Yükleniyor…</p>
      ) : ilgili.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-8 text-center">
          <p className="text-xs text-muted-foreground">Bu alanda henüz hedef yok.</p>
          <HedefForm varsayilanAlan={alan} />
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ilgili.map((h) => (
            <HedefKart key={h.id} hedef={h} adimlar={adimlar} />
          ))}
        </div>
      )}
    </section>
  );
}
