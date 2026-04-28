import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Settings2, Plus, Trash2, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBaglamlar, useBaglamEkle, useBaglamGuncelle, useBaglamSil } from "@/lib/cetele-baglam-hooks";
import { BAGLAM_SINIF, type BaglamTanim } from "@/lib/cetele-baglam";
import { toast } from "sonner";

const EMOJI_ONERI = ["🏠", "🚌", "🕌", "🛋️", "💻", "📚", "🌅", "🌙", "🏃", "🍽️", "👨‍👩‍👧", "✈️", "🌳", "🛏️", "📌"];

export function BaglamYonetimDialog() {
  const [acik, setAcik] = React.useState(false);
  return (
    <Dialog open={acik} onOpenChange={setAcik}>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label="Bağlamları yönet"
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
        >
          <Settings2 className="h-3.5 w-3.5" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] w-[calc(100vw-1.5rem)] max-w-md overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Bağlamları Yönet</DialogTitle>
        </DialogHeader>
        <BaglamYonetimIcerik />
      </DialogContent>
    </Dialog>
  );
}

function BaglamYonetimIcerik() {
  const { data: baglamlar = [], isLoading } = useBaglamlar();
  const ekle = useBaglamEkle();
  const [yeniAd, setYeniAd] = React.useState("");
  const [yeniEmoji, setYeniEmoji] = React.useState("📌");

  const onEkle = async () => {
    if (!yeniAd.trim()) return;
    try {
      await ekle.mutateAsync({ etiket: yeniAd.trim(), emoji: yeniEmoji });
      setYeniAd("");
      setYeniEmoji("📌");
      toast.success("Bağlam eklendi");
    } catch {
      toast.error("Eklenemedi");
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <ul className="flex flex-col gap-1.5">
          {isLoading && (
            <li className="text-xs text-muted-foreground">Yükleniyor...</li>
          )}
          {baglamlar.map((b) => (
            <BaglamSatir key={b.id} baglam={b} />
          ))}
          {!isLoading && baglamlar.length === 0 && (
            <li className="text-xs text-muted-foreground">Henüz bağlam yok. Aşağıdan ekleyebilirsin.</li>
          )}
        </ul>
      </div>

      <div className="rounded-lg border border-dashed border-border p-3">
        <p className="mb-2 text-[11px] uppercase tracking-wider text-muted-foreground">Yeni bağlam</p>
        <div className="flex flex-wrap items-center gap-2">
          <EmojiSecici deger={yeniEmoji} onChange={setYeniEmoji} />
          <Input
            value={yeniAd}
            onChange={(e) => setYeniAd(e.target.value)}
            placeholder="Örn. Spor salonunda"
            className="h-9 min-w-0 flex-1"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onEkle();
              }
            }}
          />
          <Button
            size="sm"
            onClick={onEkle}
            disabled={ekle.isPending || !yeniAd.trim()}
            className="h-9 w-full gap-1 sm:w-auto"
          >
            <Plus className="h-3.5 w-3.5" /> Ekle
          </Button>
        </div>
      </div>
    </div>
  );
}

function BaglamSatir({ baglam }: { baglam: BaglamTanim }) {
  const guncelle = useBaglamGuncelle();
  const sil = useBaglamSil();
  const [duzenle, setDuzenle] = React.useState(false);
  const [ad, setAd] = React.useState(baglam.etiket);
  const [emoji, setEmoji] = React.useState(baglam.emoji);
  const [silOnay, setSilOnay] = React.useState(false);

  React.useEffect(() => {
    setAd(baglam.etiket);
    setEmoji(baglam.emoji);
  }, [baglam.etiket, baglam.emoji]);

  const c = BAGLAM_SINIF[baglam.renk];

  const kaydet = async () => {
    try {
      await guncelle.mutateAsync({ id: baglam.id, etiket: ad, emoji });
      setDuzenle(false);
      toast.success("Güncellendi");
    } catch {
      toast.error("Kaydedilemedi");
    }
  };

  const siliver = async () => {
    try {
      const r = await sil.mutateAsync({ id: baglam.id, slug: baglam.slug });
      toast.success(
        r.etkilenen > 0
          ? `Bağlam silindi (${r.etkilenen} maddeden çıkarıldı)`
          : "Bağlam silindi",
      );
    } catch {
      toast.error("Silinemedi");
    }
  };

  if (silOnay) {
    return (
      <li className={cn("rounded-md border px-3 py-2", c.yumusakBg, c.yumusakBorder)}>
        <p className="text-xs">
          <span className="font-medium">{baglam.etiket}</span> silinecek. Bu bağlama atanmış maddelerden etiket otomatik kaldırılır (maddeler silinmez).
        </p>
        <div className="mt-2 flex justify-end gap-2">
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setSilOnay(false)}>
            Vazgeç
          </Button>
          <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={siliver} disabled={sil.isPending}>
            Sil
          </Button>
        </div>
      </li>
    );
  }

  return (
    <li className={cn("flex items-center gap-1.5 rounded-md border px-2 py-1.5", c.yumusakBg, c.yumusakBorder)}>
      {duzenle ? (
        <>
          <EmojiSecici deger={emoji} onChange={setEmoji} />
          <Input
            value={ad}
            onChange={(e) => setAd(e.target.value)}
            className="h-8 min-w-0 flex-1 text-xs"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); kaydet(); }
              if (e.key === "Escape") { setDuzenle(false); setAd(baglam.etiket); setEmoji(baglam.emoji); }
            }}
          />
          <button
            type="button"
            onClick={kaydet}
            disabled={guncelle.isPending}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-emerald-600 hover:bg-emerald-500/10"
            aria-label="Kaydet"
          >
            <Check className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => { setDuzenle(false); setAd(baglam.etiket); setEmoji(baglam.emoji); }}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
            aria-label="İptal"
          >
            <X className="h-4 w-4" />
          </button>
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={() => setDuzenle(true)}
            className="flex min-w-0 flex-1 items-center gap-2 text-left"
          >
            <span aria-hidden className="text-base leading-none">{baglam.emoji}</span>
            <span className={cn("truncate text-sm font-medium", c.metin)}>{baglam.etiket}</span>
          </button>
          <button
            type="button"
            onClick={() => setSilOnay(true)}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            aria-label="Sil"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </>
      )}
    </li>
  );
}

function EmojiSecici({ deger, onChange }: { deger: string; onChange: (v: string) => void }) {
  const [acik, setAcik] = React.useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setAcik((v) => !v)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-base hover:border-foreground/30"
        aria-label="Emoji seç"
      >
        {deger || "📌"}
      </button>
      {acik && (
        <>
          <button
            type="button"
            aria-hidden
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setAcik(false)}
          />
          <div className="absolute left-0 top-full z-50 mt-1 grid w-56 grid-cols-5 gap-1 rounded-lg border border-border bg-popover p-2 shadow-lg">
            {EMOJI_ONERI.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => { onChange(e); setAcik(false); }}
                className={cn(
                  "inline-flex h-8 w-8 items-center justify-center rounded text-base hover:bg-muted",
                  deger === e && "bg-muted",
                )}
              >
                {e}
              </button>
            ))}
            <Input
              value={deger}
              onChange={(e) => onChange(e.target.value.slice(0, 4))}
              className="col-span-5 mt-1 h-7 text-xs"
              placeholder="Veya yapıştır"
            />
          </div>
        </>
      )}
    </div>
  );
}