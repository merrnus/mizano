import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { TAKVIM_RENKLERI, rengiBul } from "@/lib/takvim/renkler";
import type { Takvim } from "@/lib/takvim/tipler";

export function TakvimListesi({ takvimler, onToggle, onYeni, onSil }: { takvimler: Takvim[]; onToggle: (t: Takvim) => void; onYeni: (ad: string, renk: string) => void; onSil: (id: string) => void }) {
  const [acik, setAcik] = React.useState(false);
  const [ad, setAd] = React.useState("");
  const [renk, setRenk] = React.useState("cal-2");
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase text-muted-foreground">Takvimlerim</span>
        <button className="text-xs text-primary hover:underline" onClick={() => setAcik(true)}>+ Yeni</button>
      </div>
      {takvimler.map((t) => (
        <div key={t.id} className="group flex items-center gap-2 rounded px-1 py-0.5 text-sm hover:bg-accent">
          <Checkbox checked={t.gorunur} onCheckedChange={() => onToggle(t)} className="h-4 w-4" style={{ background: t.gorunur ? rengiBul(t.renk) : undefined, borderColor: rengiBul(t.renk) }} />
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: rengiBul(t.renk) }} />
          <span className="flex-1 truncate">{t.ad}</span>
          {!t.is_default && (
            <button className="invisible text-xs text-muted-foreground hover:text-destructive group-hover:visible" onClick={() => onSil(t.id)}>×</button>
          )}
        </div>
      ))}
      <Dialog open={acik} onOpenChange={setAcik}>
        <DialogContent>
          <DialogHeader><DialogTitle>Yeni takvim</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div><Label>Ad</Label><Input value={ad} onChange={(e) => setAd(e.target.value)} /></div>
            <div>
              <Label>Renk</Label>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {TAKVIM_RENKLERI.map((r) => (
                  <button key={r.id} onClick={() => setRenk(r.id)} className={`h-7 w-7 rounded-full border-2 ${renk === r.id ? "border-foreground" : "border-transparent"}`}>
                    <span className="block h-full w-full rounded-full" style={{ background: r.oklch }} />
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAcik(false)}>İptal</Button>
            <Button onClick={() => { if (ad.trim()) { onYeni(ad.trim(), renk); setAd(""); setAcik(false); } }}>Oluştur</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}