import * as React from "react";
import { cn } from "@/lib/utils";
import { BAGLAMLAR, BAGLAM_SINIF, type BaglamId } from "@/lib/cetele-baglam";

const STORAGE_KEY = "cetele-baglam";

/** Dashboard üstünde "şu an buradayım" filtre çubuğu. */
export function BaglamFiltre({
  deger,
  onChange,
}: {
  deger: BaglamId | null;
  onChange: (yeni: BaglamId | null) => void;
}) {
  return (
    <div className="-mx-1 flex items-center gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <FiltreButon
        secili={deger === null}
        onClick={() => onChange(null)}
        etiket="Hepsi"
      />
      {BAGLAMLAR.map((b) => {
        const c = BAGLAM_SINIF[b.renk];
        const secili = deger === b.id;
        return (
          <button
            key={b.id}
            type="button"
            onClick={() => onChange(b.id)}
            aria-pressed={secili}
            className={cn(
              "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs whitespace-nowrap transition-all snap-start",
              secili
                ? cn(c.dolguBg, c.yumusakBorder, c.dolguMetin, "font-medium")
                : "bg-transparent border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground",
            )}
          >
            <span aria-hidden>{b.emoji}</span>
            <span>{b.etiket}</span>
          </button>
        );
      })}
    </div>
  );
}

function FiltreButon({
  secili,
  onClick,
  etiket,
}: {
  secili: boolean;
  onClick: () => void;
  etiket: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={secili}
      className={cn(
        "inline-flex h-8 shrink-0 items-center rounded-full border px-3 text-xs whitespace-nowrap transition-all snap-start",
        secili
          ? "bg-foreground text-background border-foreground font-medium"
          : "bg-transparent border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground",
      )}
    >
      {etiket}
    </button>
  );
}

/** localStorage ile kalıcı filtre state'i. */
export function useBaglamFiltresi(): [BaglamId | null, (v: BaglamId | null) => void] {
  const [deger, setDeger] = React.useState<BaglamId | null>(null);
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw && raw !== "null") {
        const v = raw as BaglamId;
        if (["masa", "yol", "cami", "dinlenme"].includes(v)) setDeger(v);
      }
    } catch {}
  }, []);
  const setKalici = React.useCallback((v: BaglamId | null) => {
    setDeger(v);
    try {
      if (v === null) localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, v);
    } catch {}
  }, []);
  return [deger, setKalici];
}
