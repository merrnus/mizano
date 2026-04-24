import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useHedefEkle } from "@/lib/hedef-hooks";
import {
  TIP_ETIKET,
  TIP_ACIKLAMA,
  ALAN_LISTESI,
  type HedefTip,
} from "@/lib/hedef-tipleri";
import type { CeteleAlan } from "@/lib/cetele-tipleri";
import { ALAN_ETIKET } from "@/lib/cetele-tipleri";
import { useSablonlar } from "@/lib/cetele-hooks";
import { toast } from "sonner";

const TIPLER: HedefTip[] = ["kurs", "aliskanlik", "proje", "sayisal", "tekil"];

export interface HedefFormProps {
  varsayilanAlan?: CeteleAlan;
  onBitti?: () => void;
}

export function HedefForm({ varsayilanAlan = "amel", onBitti }: HedefFormProps) {
  const [tip, setTip] = React.useState<HedefTip>("kurs");
  const [ad, setAd] = React.useState("");
  const [aciklama, setAciklama] = React.useState("");
  const [alan, setAlan] = React.useState<CeteleAlan>(varsayilanAlan);
  const [bitis, setBitis] = React.useState<string>("");
  const [hedefMiktar, setHedefMiktar] = React.useState<string>("");
  const [birim, setBirim] = React.useState<string>("");
  const [sablonId, setSablonId] = React.useState<string>("");
  const [streakBirim, setStreakBirim] = React.useState<"gunluk" | "haftalik">("gunluk");

  const { data: sablonlar = [] } = useSablonlar();
  const ekle = useHedefEkle();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!ad.trim()) return;
    if (tip === "aliskanlik" && !sablonId) {
      toast.error("Alışkanlık için bir çetele şablonu seçmelisin.");
      return;
    }
    if (tip === "sayisal" && !hedefMiktar) {
      toast.error("Sayısal hedef için miktar gerekli.");
      return;
    }
    try {
      await ekle.mutateAsync({
        ad: ad.trim(),
        aciklama: aciklama.trim() || null,
        alan,
        tip,
        bitis: bitis || null,
        hedef_miktar: tip === "sayisal" ? Number(hedefMiktar) : null,
        birim: tip === "sayisal" ? (birim.trim() || null) : null,
        sablon_id: (tip === "sayisal" || tip === "aliskanlik") && sablonId ? sablonId : null,
        streak_birim: tip === "aliskanlik" ? streakBirim : null,
      });
      toast.success("Hedef eklendi");
      onBitti?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Hata");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-xs">Tip</Label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {TIPLER.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTip(t)}
              className={`rounded-lg border p-2 text-left transition-colors ${
                tip === t
                  ? "border-foreground bg-accent"
                  : "border-border hover:border-foreground/40"
              }`}
            >
              <div className="text-xs font-medium">{TIP_ETIKET[t]}</div>
              <div className="mt-0.5 text-[10px] leading-tight text-muted-foreground">
                {TIP_ACIKLAMA[t]}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="hedef-ad" className="text-xs">Ad</Label>
          <Input id="hedef-ad" value={ad} onChange={(e) => setAd(e.target.value)} required />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Alan</Label>
          <Select value={alan} onValueChange={(v) => setAlan(v as CeteleAlan)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {ALAN_LISTESI.map((a) => (
                <SelectItem key={a} value={a}>{ALAN_ETIKET[a]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="hedef-bitis" className="text-xs">Bitiş tarihi (opsiyonel)</Label>
          <Input
            id="hedef-bitis"
            type="date"
            value={bitis}
            onChange={(e) => setBitis(e.target.value)}
          />
        </div>
      </div>

      {tip === "sayisal" && (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="hedef-miktar" className="text-xs">Hedef miktar</Label>
            <Input
              id="hedef-miktar"
              type="number"
              min={0}
              step="any"
              value={hedefMiktar}
              onChange={(e) => setHedefMiktar(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="hedef-birim" className="text-xs">Birim</Label>
            <Input
              id="hedef-birim"
              placeholder="kg, km, sayfa…"
              value={birim}
              onChange={(e) => setBirim(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Çetele bağı (opsiyonel)</Label>
            <Select value={sablonId || "__yok__"} onValueChange={(v) => setSablonId(v === "__yok__" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="Yok" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__yok__">Yok</SelectItem>
                {sablonlar.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.ad}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {tip === "aliskanlik" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Çetele şablonu (zorunlu)</Label>
            <Select value={sablonId} onValueChange={setSablonId}>
              <SelectTrigger><SelectValue placeholder="Şablon seç" /></SelectTrigger>
              <SelectContent>
                {sablonlar.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.ad}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Streak birimi</Label>
            <Select value={streakBirim} onValueChange={(v) => setStreakBirim(v as "gunluk" | "haftalik")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="gunluk">Günlük</SelectItem>
                <SelectItem value="haftalik">Haftalık</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="hedef-aciklama" className="text-xs">Açıklama (opsiyonel)</Label>
        <Textarea
          id="hedef-aciklama"
          rows={2}
          value={aciklama}
          onChange={(e) => setAciklama(e.target.value)}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={() => onBitti?.()}>İptal</Button>
        <Button type="submit" disabled={ekle.isPending}>
          {ekle.isPending ? "Ekleniyor…" : "Hedef ekle"}
        </Button>
      </div>
    </form>
  );
}
