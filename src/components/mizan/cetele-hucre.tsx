import * as React from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Minus, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CeteleSablon, CeteleKayit, HucreDurum } from "@/lib/cetele-tipleri";
import { useKayitEkle, useKayitSil } from "@/lib/cetele-hooks";
import { gecmisMi, gelecekMi } from "@/lib/cetele-tarih";

function durumHesapla(
  toplam: number,
  hedef: number,
  ikili: boolean,
  tarih: Date,
): HucreDurum {
  if (ikili) {
    return toplam > 0 ? "yesil" : "bos";
  }
  if (toplam >= hedef && hedef > 0) return "yesil";
  if (toplam > 0) return "sari";
  if (gecmisMi(tarih)) return "kirmizi";
  if (gelecekMi(tarih)) return "bos";
  return "bos";
}

const DURUM_BG: Record<HucreDurum, string> = {
  yesil: "bg-emerald-500/25 text-emerald-200 border-emerald-500/40",
  sari: "bg-amber-500/20 text-amber-200 border-amber-500/40",
  kirmizi: "bg-rose-500/15 text-rose-300/70 border-rose-500/30",
  bos: "bg-muted/30 text-muted-foreground/40 border-border",
};

export function CeteleHucre({
  sablon,
  tarih,
  tarihStr,
  kayitlar,
}: {
  sablon: CeteleSablon;
  tarih: Date;
  tarihStr: string;
  kayitlar: CeteleKayit[];
}) {
  const ekle = useKayitEkle();
  const sil = useKayitSil();
  const [acik, setAcik] = React.useState(false);
  const [yeniMiktar, setYeniMiktar] = React.useState<string>("");
  const [not, setNot] = React.useState("");

  const ikili = sablon.birim === "ikili";
  const hucreKayitlari = kayitlar.filter(
    (k) => k.sablon_id === sablon.id && k.tarih === tarihStr,
  );
  const toplam = hucreKayitlari.reduce((a, k) => a + Number(k.miktar), 0);
  const hedef = Number(sablon.hedef_deger);
  const durum = durumHesapla(toplam, hedef, ikili, tarih);

  const ikiliToggle = async () => {
    if (toplam > 0) {
      // sıfırla
      for (const k of hucreKayitlari) await sil.mutateAsync(k.id);
    } else {
      await ekle.mutateAsync({ sablon_id: sablon.id, tarih: tarihStr, miktar: 1 });
    }
  };

  if (ikili) {
    return (
      <button
        onClick={ikiliToggle}
        disabled={ekle.isPending || sil.isPending}
        className={cn(
          "flex h-8 w-full min-w-[2.25rem] items-center justify-center rounded border text-xs font-medium transition-colors hover:opacity-90",
          DURUM_BG[durum],
        )}
        title={tarihStr}
      >
        {toplam > 0 ? <Check className="h-3.5 w-3.5" /> : null}
      </button>
    );
  }

  const adim = sablon.birim === "dakika" ? 5 : 1;

  return (
    <Popover open={acik} onOpenChange={setAcik}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "flex h-8 w-full min-w-[2.25rem] items-center justify-center rounded border text-xs font-medium transition-colors hover:opacity-90",
            DURUM_BG[durum],
          )}
          title={tarihStr}
        >
          {toplam > 0 ? toplam : "—"}
        </button>
      </PopoverTrigger>
      <PopoverContent align="center" className="w-64 p-3">
        <div className="mb-2 text-xs font-medium">{sablon.ad}</div>
        <div className="mb-3 text-[10px] text-muted-foreground">
          {tarihStr} • Hedef {hedef} {sablon.birim} • Toplam{" "}
          <span className="font-medium text-foreground">{toplam}</span>
        </div>

        <div className="mb-2 flex items-center gap-2">
          <Button
            size="icon"
            variant="outline"
            className="h-7 w-7"
            onClick={() =>
              ekle.mutate({ sablon_id: sablon.id, tarih: tarihStr, miktar: -adim })
            }
            disabled={toplam <= 0}
          >
            <Minus className="h-3 w-3" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            className="h-7 w-7"
            onClick={() =>
              ekle.mutate({ sablon_id: sablon.id, tarih: tarihStr, miktar: adim })
            }
          >
            <Plus className="h-3 w-3" />
          </Button>
          <span className="text-xs text-muted-foreground">+/- {adim}</span>
        </div>

        <div className="mb-2 flex flex-col gap-1.5">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Yeni giriş
          </div>
          <div className="flex gap-1.5">
            <Input
              type="number"
              placeholder={`Miktar (${sablon.birim})`}
              value={yeniMiktar}
              onChange={(e) => setYeniMiktar(e.target.value)}
              className="h-7 text-xs"
            />
            <Button
              size="sm"
              className="h-7 px-2 text-xs"
              disabled={!yeniMiktar || isNaN(Number(yeniMiktar))}
              onClick={async () => {
                await ekle.mutateAsync({
                  sablon_id: sablon.id,
                  tarih: tarihStr,
                  miktar: Number(yeniMiktar),
                  not_metni: not || null,
                });
                setYeniMiktar("");
                setNot("");
              }}
            >
              Ekle
            </Button>
          </div>
          <Input
            placeholder="Not (opsiyonel)"
            value={not}
            onChange={(e) => setNot(e.target.value)}
            className="h-7 text-xs"
          />
        </div>

        {hucreKayitlari.length > 0 && (
          <div className="mt-3 border-t border-border pt-2">
            <div className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">
              Bu günkü girişler
            </div>
            <ul className="flex flex-col gap-1">
              {hucreKayitlari.map((k) => (
                <li
                  key={k.id}
                  className="flex items-center justify-between rounded bg-muted/40 px-2 py-1 text-[11px]"
                >
                  <span>
                    {Number(k.miktar) > 0 ? "+" : ""}
                    {Number(k.miktar)} {sablon.birim}
                    {k.not_metni && (
                      <span className="ml-1 text-muted-foreground">— {k.not_metni}</span>
                    )}
                  </span>
                  <button
                    onClick={() => sil.mutate(k.id)}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label="Sil"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}