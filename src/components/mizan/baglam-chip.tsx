import * as React from "react";
import { cn } from "@/lib/utils";
import { BAGLAM_MAP, BAGLAM_SINIF, type BaglamId } from "@/lib/cetele-baglam";

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
  const tanim = BAGLAM_MAP[baglam];
  const c = BAGLAM_SINIF[tanim.renk];
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
        secili
          ? cn(c.dolguBg, c.yumusakBorder, c.dolguMetin, "font-medium")
          : cn("bg-transparent border-border text-muted-foreground", interaktif && "hover:border-foreground/30 hover:text-foreground"),
      )}
      title={tanim.etiket}
    >
      <span aria-hidden>{tanim.emoji}</span>
      {!emojiOnly && <span>{tanim.etiket}</span>}
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
  const toggle = (id: BaglamId) => {
    if (secili.includes(id)) onChange(secili.filter((x) => x !== id));
    else onChange([...secili, id]);
  };
  return (
    <div className="flex flex-wrap gap-1.5">
      {(Object.keys(BAGLAM_MAP) as BaglamId[]).map((id) => (
        <BaglamChip key={id} baglam={id} secili={secili.includes(id)} onClick={() => toggle(id)} />
      ))}
    </div>
  );
}
