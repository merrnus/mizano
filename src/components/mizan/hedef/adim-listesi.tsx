import * as React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  useHedefAdimlari,
  useAdimEkle,
  useAdimGuncelle,
  useAdimSil,
} from "@/lib/hedef-hooks";
import { tarihFormat } from "@/lib/cetele-tarih";

export function AdimListesi({ hedefId }: { hedefId: string }) {
  const { data: adimlar = [] } = useHedefAdimlari(hedefId);
  const ekle = useAdimEkle();
  const guncelle = useAdimGuncelle();
  const sil = useAdimSil();
  const [yeni, setYeni] = React.useState("");

  async function ekleAdim(e: React.FormEvent) {
    e.preventDefault();
    if (!yeni.trim()) return;
    await ekle.mutateAsync({
      hedef_id: hedefId,
      baslik: yeni.trim(),
      siralama: adimlar.length,
    });
    setYeni("");
  }

  return (
    <div className="space-y-3">
      <ul className="space-y-1.5">
        {adimlar.map((a) => (
          <li
            key={a.id}
            className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2"
          >
            <Checkbox
              checked={a.tamamlandi}
              onCheckedChange={(v) =>
                guncelle.mutate({
                  id: a.id,
                  tamamlandi: !!v,
                  tamamlanma: v ? tarihFormat(new Date()) : null,
                })
              }
            />
            <span
              className={`flex-1 text-sm ${
                a.tamamlandi ? "text-muted-foreground line-through" : ""
              }`}
            >
              {a.baslik}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={() => sil.mutate(a.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </li>
        ))}
        {adimlar.length === 0 && (
          <li className="rounded-md border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
            Henüz adım yok. İlk adımı ekle.
          </li>
        )}
      </ul>
      <form onSubmit={ekleAdim} className="flex gap-2">
        <Input
          placeholder="Yeni adım…"
          value={yeni}
          onChange={(e) => setYeni(e.target.value)}
        />
        <Button type="submit" size="sm" disabled={!yeni.trim() || ekle.isPending}>
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </form>
    </div>
  );
}
