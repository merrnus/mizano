import { cn } from "@/lib/utils";

/**
 * Haftalık hedef için mini nokta göstergesi: "● ● ○ ○" tarzı.
 * Hedef sayısı kadar nokta, doluluk kadarı dolu.
 * Çok büyük hedefler (>10) için sadece sayı gösterir.
 */
export function HaftalikHedefNoktalar({
  toplam,
  hedef,
}: {
  toplam: number;
  hedef: number;
}) {
  const tamam = toplam >= hedef;
  if (hedef <= 0 || hedef > 10) {
    return (
      <span className="tabular-nums">
        {toplam}/{hedef}
      </span>
    );
  }
  const dolu = Math.min(Math.max(0, Math.floor(toplam)), hedef);
  return (
    <span className="inline-flex flex-col items-end gap-0.5">
      <span className="flex gap-0.5" aria-label={`${toplam} / ${hedef}`}>
        {Array.from({ length: hedef }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              i < dolu ? (tamam ? "bg-emerald-500" : "bg-amber-500") : "bg-muted-foreground/25",
            )}
          />
        ))}
      </span>
      <span className="text-[10px] tabular-nums text-muted-foreground">
        {toplam}/{hedef}
      </span>
    </span>
  );
}
