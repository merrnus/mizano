import * as React from "react";
import { Plus, Tags } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useBaglamlar } from "@/lib/cetele-baglam-hooks";
import { useSablonGuncelle } from "@/lib/cetele-hooks";
import { BaglamChip } from "@/components/mizan/baglam-chip";
import type { BaglamId } from "@/lib/cetele-baglam";
import { BaglamYonetimDialog } from "@/components/mizan/baglam-yonetim-dialog";
import { toast } from "sonner";

/**
 * Şablon satırının yanında küçük "+ etiket" butonu — popover içinde mevcut
 * tüm bağlamlar listelenir, tıklayarak şablonun baglamlar[] array'ine eklenir
 * veya çıkarılır. Detay sayfasına gitmeden hızlı bağlam ataması yapılır.
 */
export function BaglamAtaPopover({
  sablonId,
  mevcut,
  className,
}: {
  sablonId: string;
  mevcut: BaglamId[];
  className?: string;
}) {
  const { data: baglamlar = [] } = useBaglamlar();
  const guncelle = useSablonGuncelle();
  const [acik, setAcik] = React.useState(false);
  const [yonetimAcik, setYonetimAcik] = React.useState(false);

  const toggle = async (slug: BaglamId) => {
    const yeni = mevcut.includes(slug)
      ? mevcut.filter((x) => x !== slug)
      : [...mevcut, slug];
    try {
      await guncelle.mutateAsync({ id: sablonId, baglamlar: yeni });
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <>
      <Popover open={acik} onOpenChange={setAcik}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label="Bağlam ata"
            className={cn(
              "inline-flex h-5 items-center gap-0.5 rounded-full border border-dashed border-border px-1.5 text-[10px] text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground",
              className,
            )}
          >
            <Plus className="h-2.5 w-2.5" />
            etiket
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-60 p-3">
          <div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            <Tags className="h-3 w-3" />
            Bağlam ata
          </div>
          {baglamlar.length === 0 ? (
            <p className="text-xs text-muted-foreground">Henüz bağlam yok.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {baglamlar.map((b) => (
                <BaglamChip
                  key={b.slug}
                  baglam={b.slug}
                  secili={mevcut.includes(b.slug)}
                  onClick={() => toggle(b.slug)}
                />
              ))}
            </div>
          )}
          <div className="mt-3 border-t border-border pt-2">
            <button
              type="button"
              onClick={() => {
                setAcik(false);
                setYonetimAcik(true);
              }}
              className="text-[11px] text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Bağlamları yönet…
            </button>
          </div>
        </PopoverContent>
      </Popover>
      <BaglamYonetimDialog acik={yonetimAcik} onOpenChange={setYonetimAcik} />
    </>
  );
}