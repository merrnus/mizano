import { Progress } from "@/components/ui/progress";
import { useSablonlar, useUcAylikKayitlari } from "@/lib/cetele-hooks";
import { Sparkles } from "lucide-react";

export function UcAylikIlerleme() {
  const { data: sablonlar = [] } = useSablonlar();
  const ucAyliklar = sablonlar.filter((s) => s.uc_aylik_hedef);
  const ids = ucAyliklar.map((s) => s.id);
  const { data: kayitlar = [] } = useUcAylikKayitlari(ids);

  if (ucAyliklar.length === 0) return null;

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-medium">3 Aylık Bağlı Hedefler</h2>
      </div>
      <div className="flex flex-col gap-3">
        {ucAyliklar.map((s) => {
          const toplam = kayitlar
            .filter((k) => k.sablon_id === s.id)
            .reduce((a, k) => a + Number(k.miktar), 0);
          const hedef = Number(s.uc_aylik_hedef ?? 0);
          const yuzde = hedef > 0 ? Math.min(100, (toplam / hedef) * 100) : 0;
          return (
            <div key={s.id}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-medium">{s.ad}</span>
                <span className="text-muted-foreground">
                  {toplam} / {hedef} {s.birim}
                </span>
              </div>
              {s.notlar ? (
                <div className="mb-1 text-[10px] text-muted-foreground/80">
                  {s.notlar}
                </div>
              ) : null}
              <Progress
                value={yuzde}
                className="h-1.5 bg-muted [&>div]:bg-[var(--mana)]"
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}