import * as React from "react";
import { Check, Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useKategoriler, useKisiler, useKisiEkle } from "@/lib/network-hooks";
import { cn } from "@/lib/utils";

export function SorumluSecici({
  secili,
  onChange,
  trigger,
  align = "start",
}: {
  secili: string[];
  onChange: (ids: string[]) => void;
  trigger?: React.ReactNode;
  align?: "start" | "center" | "end";
}) {
  const [open, setOpen] = React.useState(false);
  const [arama, setArama] = React.useState("");
  const [aktifKategori, setAktifKategori] = React.useState<string | "tumu">("tumu");
  const [yeniMod, setYeniMod] = React.useState(false);
  const [yeniAd, setYeniAd] = React.useState("");

  const kisilerQ = useKisiler();
  const kategorilerQ = useKategoriler();
  const ekle = useKisiEkle();

  const kisiler = kisilerQ.data ?? [];
  const kategoriler = kategorilerQ.data ?? [];

  const filtreli = kisiler.filter((k) => {
    const aramaUygun = k.ad.toLowerCase().includes(arama.toLowerCase());
    const kategoriUygun =
      aktifKategori === "tumu" || k.kategori_ids.includes(aktifKategori);
    return aramaUygun && kategoriUygun;
  });

  const toggle = (id: string) => {
    onChange(secili.includes(id) ? secili.filter((s) => s !== id) : [...secili, id]);
  };

  const yeniKaydet = async () => {
    if (!yeniAd.trim()) return;
    const id = await ekle.mutateAsync({
      ad: yeniAd.trim(),
      kategori_ids: aktifKategori !== "tumu" ? [aktifKategori] : [],
    });
    onChange([...secili, id]);
    setYeniAd("");
    setYeniMod(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {trigger ?? (
          <Button size="sm" variant="outline" className="h-7 gap-1 text-xs">
            Sorumlu seç
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align={align}>
        <div className="border-b border-border p-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              placeholder="Kişi ara…"
              value={arama}
              onChange={(e) => setArama(e.target.value)}
              className="h-8 pl-7 text-sm"
            />
          </div>
        </div>
        <div className="flex gap-1 overflow-x-auto border-b border-border p-2">
          <Chip
            aktif={aktifKategori === "tumu"}
            onClick={() => setAktifKategori("tumu")}
          >
            Tümü
          </Chip>
          {kategoriler.map((k) => (
            <Chip
              key={k.id}
              aktif={aktifKategori === k.id}
              onClick={() => setAktifKategori(k.id)}
            >
              {k.ad}
            </Chip>
          ))}
        </div>
        <ScrollArea className="max-h-64">
          <div className="p-1">
            {filtreli.length === 0 ? (
              <div className="p-4 text-center text-xs text-muted-foreground">
                Kişi bulunamadı.
              </div>
            ) : (
              filtreli.map((k) => {
                const sel = secili.includes(k.id);
                return (
                  <button
                    key={k.id}
                    type="button"
                    onClick={() => toggle(k.id)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent",
                      sel && "bg-accent/50",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                        sel
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border",
                      )}
                    >
                      {sel && <Check className="h-3 w-3" />}
                    </span>
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="bg-muted text-[10px]">
                        {k.ad.split(" ").map((p) => p[0]).join("").slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate">{k.ad}</span>
                  </button>
                );
              })
            )}
          </div>
        </ScrollArea>
        <div className="border-t border-border p-2">
          {yeniMod ? (
            <div className="flex gap-1">
              <Input
                autoFocus
                placeholder="Yeni kişi adı"
                value={yeniAd}
                onChange={(e) => setYeniAd(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") yeniKaydet();
                  if (e.key === "Escape") {
                    setYeniMod(false);
                    setYeniAd("");
                  }
                }}
                className="h-8 text-sm"
              />
              <Button size="sm" onClick={yeniKaydet} disabled={!yeniAd.trim()}>
                Ekle
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setYeniMod(false);
                  setYeniAd("");
                }}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-full justify-start gap-1.5 text-xs"
              onClick={() => setYeniMod(true)}
            >
              <Plus className="h-3.5 w-3.5" /> Yeni kişi ekle
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function Chip({
  aktif,
  onClick,
  children,
}: {
  aktif: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] transition-colors",
        aktif
          ? "border-primary/60 bg-primary/15 text-foreground"
          : "border-border bg-background text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}