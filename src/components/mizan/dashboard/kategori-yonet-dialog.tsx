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
import { Trash2, Plus } from "lucide-react";
import {
  useKategoriler,
  useKategoriEkle,
  useKategoriSil,
} from "@/lib/gorev-kategori";
import { toast } from "sonner";

type Props = {
  trigger: React.ReactNode;
};

const RENK_SECENEK = [
  { id: "mana", etk: "Mana" },
  { id: "ilim", etk: "İlim" },
  { id: "amel", etk: "Amel" },
  { id: "kisisel", etk: "Kişisel" },
];

export function KategoriYonetDialog({ trigger }: Props) {
  const [acik, setAcik] = React.useState(false);
  const { data: kategoriler = [] } = useKategoriler();
  const ekle = useKategoriEkle();
  const sil = useKategoriSil();

  const [ad, setAd] = React.useState("");
  const [emoji, setEmoji] = React.useState("📁");
  const [renk, setRenk] = React.useState("kisisel");

  const onEkle = async () => {
    if (!ad.trim()) return;
    try {
      await ekle.mutateAsync({
        ad: ad.trim(),
        emoji: emoji.trim() || null,
        renk,
        siralama: kategoriler.length + 1,
      });
      setAd("");
      setEmoji("📁");
    } catch {
      toast.error("Kategori eklenemedi");
    }
  };

  return (
    <Dialog open={acik} onOpenChange={setAcik}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Kategoriler</DialogTitle>
        </DialogHeader>

        <ul className="flex flex-col gap-1.5">
          {kategoriler.map((k) => (
            <li
              key={k.id}
              className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2"
            >
              <span className="flex items-center gap-2 text-sm">
                <span className="text-base">{k.emoji ?? "•"}</span>
                <span>{k.ad}</span>
                {k.renk && (
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: `var(--${k.renk})` }}
                    aria-hidden
                  />
                )}
              </span>
              <button
                type="button"
                onClick={() => {
                  if (confirm(`"${k.ad}" silinsin mi?`)) sil.mutate(k.id);
                }}
                className="text-muted-foreground/60 hover:text-destructive"
                aria-label="Sil"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
          {kategoriler.length === 0 && (
            <li className="text-xs text-muted-foreground">Henüz kategori yok.</li>
          )}
        </ul>

        <div className="mt-3 flex flex-col gap-2 rounded-md border border-dashed border-border p-3">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Yeni kategori
          </p>
          <div className="flex gap-2">
            <Input
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              className="w-14 text-center"
              maxLength={2}
            />
            <Input
              value={ad}
              onChange={(e) => setAd(e.target.value)}
              placeholder="Kategori adı"
              onKeyDown={(e) => e.key === "Enter" && onEkle()}
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {RENK_SECENEK.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRenk(r.id)}
                className={`rounded-full border px-2.5 py-0.5 text-[11px] transition-colors ${
                  renk === r.id
                    ? "border-foreground text-foreground"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
                style={{ color: renk === r.id ? `var(--${r.id})` : undefined }}
              >
                {r.etk}
              </button>
            ))}
          </div>
          <Button
            type="button"
            size="sm"
            onClick={onEkle}
            disabled={!ad.trim() || ekle.isPending}
            className="self-end"
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            Ekle
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}