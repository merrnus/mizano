import * as React from "react";
import { Calendar, Plus, FileText, CheckCircle2 } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useIstisareler, useIstisareEkle } from "@/lib/network-hooks";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { toast } from "sonner";

export function IstisarelerTab() {
  const istisarelerQ = useIstisareler();
  const ekle = useIstisareEkle();
  const navigate = useNavigate();

  const [acik, setAcik] = React.useState(false);
  const [tarih, setTarih] = React.useState(new Date().toISOString().slice(0, 10));
  const [baslik, setBaslik] = React.useState("");

  const olustur = async () => {
    const id = await ekle.mutateAsync({
      tarih,
      baslik: baslik || `${format(new Date(tarih), "d MMM yyyy", { locale: tr })} İstişaresi`,
    });
    toast.success("İstişare oluşturuldu");
    setAcik(false);
    setBaslik("");
    navigate({ to: "/network/istisare/$id", params: { id } });
  };

  const istisareler = istisarelerQ.data ?? [];

  return (
    <div>
      <div className="mb-3 flex items-center justify-end">
        <Dialog open={acik} onOpenChange={setAcik}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Yeni İstişare
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yeni İstişare</DialogTitle>
              <DialogDescription>Tarih ve başlık seç, ardından gündemleri ekle.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Tarih
                </label>
                <Input type="date" value={tarih} onChange={(e) => setTarih(e.target.value)} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Başlık (opsiyonel)
                </label>
                <Input
                  placeholder="Örn. Kasım Ayı İstişaresi"
                  value={baslik}
                  onChange={(e) => setBaslik(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAcik(false)}>
                İptal
              </Button>
              <Button onClick={olustur}>Oluştur ve Aç</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {istisarelerQ.isLoading ? (
        <div className="rounded-xl border border-border bg-card/50 p-6 text-center text-sm text-muted-foreground">
          Yükleniyor…
        </div>
      ) : istisareler.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/30 p-8 text-center text-sm text-muted-foreground">
          Henüz istişare yok. İlkini oluşturup gündemleri ekle.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {istisareler.map((i) => {
            const oran = i.toplam_gundem > 0 ? Math.round((i.tamamlanan / i.toplam_gundem) * 100) : 0;
            return (
              <Link
                key={i.id}
                to="/network/istisare/$id"
                params={{ id: i.id }}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:border-primary/40"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Calendar className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-foreground">
                    {i.baslik}
                  </div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">
                    {format(new Date(i.tarih), "d MMMM yyyy, EEEE", { locale: tr })}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5" /> {i.toplam_gundem}
                  </span>
                  <span className="flex items-center gap-1 text-[var(--maneviyat)]">
                    <CheckCircle2 className="h-3.5 w-3.5" /> {i.tamamlanan}
                  </span>
                  {i.toplam_gundem > 0 && (
                    <span className="hidden tabular-nums sm:inline">%{oran}</span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}