import * as React from "react";
import {
  Calendar,
  FileText,
  CheckCircle2,
  Users as UsersIcon,
} from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useIstisareler,
  useIstisareEkle,
  useGundemler,
  useKisiler,
} from "@/lib/network-hooks";
import { format, isAfter, isBefore, startOfMonth, subMonths } from "date-fns";
import { tr } from "date-fns/locale";
import { toast } from "sonner";

type Props = {
  arama?: string;
  fabTetik?: number;
};

type Filtre = "hepsi" | "ay" | "acik" | "tamam";

export function IstisarelerTab({ arama = "", fabTetik = 0 }: Props) {
  const istisarelerQ = useIstisareler();
  const gundemlerQ = useGundemler();
  const kisilerQ = useKisiler();
  const ekle = useIstisareEkle();
  const navigate = useNavigate();

  const [acik, setAcik] = React.useState(false);
  const [tarih, setTarih] = React.useState(new Date().toISOString().slice(0, 10));
  const [baslik, setBaslik] = React.useState("");
  const [filtre, setFiltre] = React.useState<Filtre>("hepsi");

  // FAB'dan tetiklendiğinde dialogu aç
  const ilkRef = React.useRef(true);
  React.useEffect(() => {
    if (ilkRef.current) {
      ilkRef.current = false;
      return;
    }
    setAcik(true);
  }, [fabTetik]);

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

  const tumIstisareler = istisarelerQ.data ?? [];
  const gundemler = gundemlerQ.data ?? [];
  const kisiler = kisilerQ.data ?? [];

  // Sorumlu avatar yığını için gündemdeki sorumlu kişiler
  const istisareSorumlulari = React.useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const g of gundemler) {
      if (!map.has(g.istisare_id)) map.set(g.istisare_id, new Set());
      for (const sid of g.sorumlu_ids) map.get(g.istisare_id)!.add(sid);
    }
    return map;
  }, [gundemler]);

  const buAyBas = startOfMonth(new Date());
  const istisareler = tumIstisareler.filter((i) => {
    const aramaUygun = arama
      ? i.baslik.toLowerCase().includes(arama.toLowerCase())
      : true;
    if (!aramaUygun) return false;
    if (filtre === "ay") return isAfter(new Date(i.tarih), subMonths(buAyBas, 0));
    if (filtre === "acik") return i.tamamlanan < i.toplam_gundem;
    if (filtre === "tamam") return i.toplam_gundem > 0 && i.tamamlanan === i.toplam_gundem;
    return true;
  });

  // Zaman şeridi: son 6 ay
  const seritNoktalari = React.useMemo(() => {
    const aylar: { etiket: string; ay: Date; sayi: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const ay = startOfMonth(subMonths(new Date(), i));
      const sonrakiAy = startOfMonth(subMonths(new Date(), i - 1));
      const sayi = tumIstisareler.filter((it) => {
        const t = new Date(it.tarih);
        return !isBefore(t, ay) && isBefore(t, sonrakiAy);
      }).length;
      aylar.push({
        etiket: format(ay, "MMM", { locale: tr }),
        ay,
        sayi,
      });
    }
    return aylar;
  }, [tumIstisareler]);

  const enYuksek = Math.max(1, ...seritNoktalari.map((s) => s.sayi));

  return (
    <div>
      {/* Zaman şeridi — son 6 ay */}
      {tumIstisareler.length > 0 && (
        <div className="mb-4 rounded-2xl border border-border bg-card/40 px-4 py-3">
          <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            <span>Son 6 ay</span>
            <span className="tabular-nums">{tumIstisareler.length} istişare</span>
          </div>
          <div className="flex items-end gap-2 h-12">
            {seritNoktalari.map((s) => (
              <div key={s.etiket} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-t bg-primary/70 transition-all"
                  style={{
                    height: `${(s.sayi / enYuksek) * 100}%`,
                    minHeight: s.sayi > 0 ? 4 : 1,
                    opacity: s.sayi > 0 ? 1 : 0.25,
                  }}
                />
                <span className="text-[10px] text-muted-foreground">{s.etiket}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filtre chip'leri */}
      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        {(
          [
            { id: "hepsi", ad: "Tümü" },
            { id: "ay", ad: "Bu ay" },
            { id: "acik", ad: "Açık" },
            { id: "tamam", ad: "Tamamlanan" },
          ] as { id: Filtre; ad: string }[]
        ).map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFiltre(f.id)}
            className={cn(
              "rounded-full border px-2.5 py-1 text-[11px] transition-colors",
              filtre === f.id
                ? "border-primary/50 bg-primary/15 text-foreground"
                : "border-border bg-background text-muted-foreground hover:text-foreground",
            )}
          >
            {f.ad}
          </button>
        ))}
      </div>

      <Dialog open={acik} onOpenChange={setAcik}>
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

      {istisarelerQ.isLoading ? (
        <div className="rounded-xl border border-border bg-card/50 p-6 text-center text-sm text-muted-foreground">
          Yükleniyor…
        </div>
      ) : istisareler.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/30 p-8 text-center text-sm text-muted-foreground">
          {tumIstisareler.length === 0
            ? "Henüz istişare yok. Sağ alttaki + ile başla."
            : "Bu filtreye uyan istişare yok."}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {istisareler.map((i) => {
            const oran = i.toplam_gundem > 0 ? Math.round((i.tamamlanan / i.toplam_gundem) * 100) : 0;
            const sorumluIds = Array.from(istisareSorumlulari.get(i.id) ?? []);
            const sorumluKisiler = sorumluIds
              .map((sid) => kisiler.find((k) => k.id === sid))
              .filter(Boolean) as { id: string; ad: string }[];
            return (
              <Link
                key={i.id}
                to="/network/istisare/$id"
                params={{ id: i.id }}
                className="group flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition-all hover:-translate-y-px hover:border-primary/40 hover:shadow-md"
              >
                <IlerlemeHalkasi oran={oran} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="truncate text-sm font-medium text-foreground">
                      {i.baslik}
                    </div>
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(i.tarih), "d MMM yyyy", { locale: tr })}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {i.toplam_gundem} gündem
                    </span>
                    {i.tamamlanan > 0 && (
                      <span className="inline-flex items-center gap-1 text-[var(--maneviyat)]">
                        <CheckCircle2 className="h-3 w-3" />
                        {i.tamamlanan} tamam
                      </span>
                    )}
                  </div>
                </div>
                {sorumluKisiler.length > 0 && (
                  <div className="hidden shrink-0 items-center sm:flex">
                    {sorumluKisiler.slice(0, 3).map((k, idx) => (
                      <Avatar
                        key={k.id}
                        className={cn(
                          "h-6 w-6 border-2 border-card",
                          idx > 0 && "-ml-2",
                        )}
                      >
                        <AvatarFallback className="bg-muted text-[9px]">
                          {k.ad.split(" ").map((p) => p[0]).join("").slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {sorumluKisiler.length > 3 && (
                      <span className="-ml-2 inline-flex h-6 w-6 items-center justify-center rounded-full border-2 border-card bg-muted text-[9px] text-muted-foreground">
                        +{sorumluKisiler.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Küçük dairesel ilerleme göstergesi (Material). */
function IlerlemeHalkasi({ oran }: { oran: number }) {
  const r = 16;
  const c = 2 * Math.PI * r;
  const dash = (oran / 100) * c;
  return (
    <div className="relative flex h-10 w-10 shrink-0 items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r={r} fill="none" stroke="currentColor" strokeWidth="3" className="text-muted/40" />
        <circle
          cx="20"
          cy="20"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
          className="text-primary transition-all"
        />
      </svg>
      <span className="text-[10px] font-medium tabular-nums text-foreground">
        {oran === 0 ? <UsersIcon className="h-3.5 w-3.5 text-muted-foreground" /> : `%${oran}`}
      </span>
    </div>
  );
}