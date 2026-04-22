import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BosDurum({
  baslik,
  aciklama,
  cta,
}: {
  baslik: string;
  aciklama: string;
  cta?: { label: string; onClick?: () => void };
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/40 px-6 py-16 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Sparkles className="h-6 w-6" />
      </div>
      <h3 className="text-base font-medium text-foreground">{baslik}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{aciklama}</p>
      {cta && (
        <Button className="mt-5" size="sm" onClick={cta.onClick}>
          {cta.label}
        </Button>
      )}
    </div>
  );
}