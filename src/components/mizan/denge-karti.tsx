import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type DengeKartiProps = {
  alan: "akademi" | "maneviyat" | "dunyevi";
  baslik: string;
  ozet: string;
  ilerleme: number; // 0-100
  tamamlandi?: boolean;
  onToggle?: () => void;
};

const alanRenkleri: Record<DengeKartiProps["alan"], string> = {
  akademi: "bg-[var(--akademi)]",
  maneviyat: "bg-[var(--maneviyat)]",
  dunyevi: "bg-[var(--dunyevi)]",
};

const alanEtiketleri: Record<DengeKartiProps["alan"], string> = {
  akademi: "Akademi",
  maneviyat: "Maneviyat",
  dunyevi: "Dünyevi Hedef",
};

export function DengeKarti({ alan, baslik, ozet, ilerleme, tamamlandi, onToggle }: DengeKartiProps) {
  return (
    <div className="group relative flex flex-col rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/40">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={cn("h-2 w-2 rounded-full", alanRenkleri[alan])} />
          <span className="text-xs uppercase tracking-wider text-muted-foreground">
            {alanEtiketleri[alan]}
          </span>
        </div>
        <button
          onClick={onToggle}
          aria-label="Tamamlandı işaretle"
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded-full border transition-colors",
            tamamlandi
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-transparent text-transparent hover:border-primary/60",
          )}
        >
          <Check className="h-3.5 w-3.5" />
        </button>
      </div>
      <h3 className="mt-4 text-base font-medium text-foreground">{baslik}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{ozet}</p>
      <div className="mt-5">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>İlerleme</span>
          <span className="font-medium text-foreground">{ilerleme}%</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className={cn("h-full rounded-full", alanRenkleri[alan])}
            style={{ width: `${ilerleme}%` }}
          />
        </div>
      </div>
    </div>
  );
}