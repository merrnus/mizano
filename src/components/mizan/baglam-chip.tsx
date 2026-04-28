import * as React from "react";
import { cn } from "@/lib/utils";
import { BAGLAM_SINIF, type BaglamId, type BaglamTanim } from "@/lib/cetele-baglam";
import { useBaglamMap, useBaglamlar } from "@/lib/cetele-baglam-hooks";

type Boyut = "xs" | "sm";

/**
 * Tek bir bağlam chip'i. `secili` ise renk dolgulu, değilse soft outline.
 * `onClick` verilmezse salt görüntü, verilirse toggle butonu.
 */
export function BaglamChip({
  baglam,
  secili,
  onClick,
  boyut = "sm",
  emojiOnly = false,
}: {
  baglam: BaglamId;
  secili?: boolean;
  onClick?: () => void;
  boyut?: Boyut;
  emojiOnly?: boolean;
}) {
  const map = useBaglamMap();
  const tanim: BaglamTanim | undefined = map[baglam];
  // Bilinmeyen slug (silinmiş bağlam) — sade gri etiket
  const c = tanim ? BAGLAM_SINIF[tanim.renk] : null;
  const interaktif = !!onClick;
  const Tag = interaktif ? "button" : "span";

  return (
    <Tag
      type={interaktif ? "button" : undefined}
      onClick={onClick}
      aria-pressed={interaktif ? !!secili : undefined}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border whitespace-nowrap transition-colors",
        boyut === "xs" ? "h-5 px-1.5 text-[10px]" : "h-7 px-2.5 text-xs",
        secili && c
          ? cn(c.dolguBg, c.yumusakBorder, c.dolguMetin, "font-medium")
          : cn("bg-transparent border-border text-muted-foreground", interaktif && "hover:border-foreground/30 hover:text-foreground"),
      )}
      title={tanim?.etiket ?? baglam}
    >
      <span aria-hidden>{tanim?.emoji ?? "·"}</span>
      {!emojiOnly && <span>{tanim?.etiket ?? baglam}</span>}
    </Tag>
  );
}

/**
 * Çoklu seçim chip grubu (form içinde — şablonun bağlamlarını seç/kaldır).
 */
export function BaglamCokluSecici({
  secili,
  onChange,
}: {
  secili: BaglamId[];
  onChange: (yeni: BaglamId[]) => void;
}) {
  const { data: baglamlar = [] } = useBaglamlar();
  const toggle = (id: BaglamId) => {
    if (secili.includes(id)) onChange(secili.filter((x) => x !== id));
    else onChange([...secili, id]);
  };
  return (
    <div className="flex flex-wrap gap-1.5">
      {baglamlar.length === 0 && (
        <span className="text-[10px] text-muted-foreground">Henüz bağlam yok.</span>
      )}
      {baglamlar.map((b) => (
        <BaglamChip key={b.slug} baglam={b.slug} secili={secili.includes(b.slug)} onClick={() => toggle(b.slug)} />
      ))}
    </div>
  );
}
