import * as React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import { Users, Plus, Trash2, CalendarPlus } from "lucide-react";
import { toast } from "sonner";
import {
  ETKINLIK_TIP_LISTE,
  ETKINLIK_TIP_MAP,
  type KardesEtkinlikTip,
  type KisiDetay,
} from "@/lib/network-tipleri";
import {
  useFaaliyetOzetleri,
  durumHesapla,
  type FaaliyetDurum,
} from "@/lib/network/sonraki-faaliyet";
import {
  useKardesEtkinlikler,
  useKardesEtkinlikEkle,
  useKardesEtkinlikSil,
} from "@/lib/network-hooks";

type Props = {
  kisiler: KisiDetay[];
  bos?: React.ReactNode;
};

const DURUM_RENK: Record<FaaliyetDurum, string> = {
  yesil: "bg-emerald-500",
  sari: "bg-amber-500",
  gri: "bg-muted-foreground/40",
};

const DURUM_ETIKET: Record<FaaliyetDurum, string> = {
  yesil: "Aktif (son 7 gün)",
  sari: "Görüşme zamanı (8–21 gün)",
  gri: "İhmal edilmiş",
};

export function RehberlikListesi({ kisiler, bos }: Props) {
  const ozetQ = useFaaliyetOzetleri();
  const ozetler = ozetQ.data ?? {};
  const [secili, setSecili] = React.useState<KisiDetay | null>(null);

  if (kisiler.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/30 px-6 py-16 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Users className="h-5 w-5" />
        </div>
        <p className="text-sm text-muted-foreground">{bos ?? "Bu kategoride kişi yok."}</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {kisiler.map((k, idx) => {
          const ozet = ozetler[k.id];
          const durum = durumHesapla(ozet?.son_tarih ?? null);
          const altYazi = ozet?.sonraki_tarih
            ? `Sonraki: ${format(parseISO(ozet.sonraki_tarih), "d MMM", { locale: tr })} · ${ozet.sonraki_baslik ?? ""}`
            : ozet?.son_tarih
              ? `Son: ${format(parseISO(ozet.son_tarih), "d MMM", { locale: tr })}`
              : "Henüz faaliyet yok";
          return (
            <button
              key={k.id}
              type="button"
              onClick={() => setSecili(k)}
              className={cn(
                "flex w-full items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-accent/40",
                idx > 0 && "border-t border-border/60",
              )}
            >
              <span
                className={cn("h-2.5 w-2.5 shrink-0 rounded-full", DURUM_RENK[durum])}
                title={DURUM_ETIKET[durum]}
                aria-label={DURUM_ETIKET[durum]}
              />
              <Avatar className="h-9 w-9 shrink-0">
                <AvatarFallback className="bg-muted text-xs">
                  {k.ad.split(" ").map((p) => p[0]).join("").slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-foreground">{k.ad}</div>
                <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
                  {altYazi}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <KisiHizliSheet kisi={secili} onClose={() => setSecili(null)} />
    </>
  );
}

function KisiHizliSheet({
  kisi,
  onClose,
}: {
  kisi: KisiDetay | null;
  onClose: () => void;
}) {
  const etkinliklerQ = useKardesEtkinlikler(kisi?.id);
  const ekle = useKardesEtkinlikEkle();
  const sil = useKardesEtkinlikSil();
  const etkinlikler = etkinliklerQ.data ?? [];

  const [tip, setTip] = React.useState<KardesEtkinlikTip>("sohbet");
  const [tarih, setTarih] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [saat, setSaat] = React.useState("");
  const [baslik, setBaslik] = React.useState("");
  const [notlar, setNotlar] = React.useState("");
  const [takvimeEkle, setTakvimeEkle] = React.useState(true);

  React.useEffect(() => {
    if (kisi) {
      setTip("sohbet");
      setTarih(new Date().toISOString().slice(0, 10));
      setSaat("");
      setBaslik("");
      setNotlar("");
      setTakvimeEkle(true);
    }
  }, [kisi?.id]);

  const kaydet = async () => {
    if (!kisi) return;
    const otomatik = `${ETKINLIK_TIP_MAP[tip].ad} — ${kisi.ad}`;
    await ekle.mutateAsync({
      kisi_id: kisi.id,
      tip,
      tarih,
      baslik: baslik.trim() || otomatik,
      notlar: notlar.trim() || null,
      baslangic_saati: saat || null,
      takvime_ekle: takvimeEkle,
      kisi_ad: kisi.ad,
    });
    toast.success("Faaliyet eklendi");
    setBaslik("");
    setNotlar("");
    setSaat("");
  };

  const silEt = async (id: string) => {
    if (!kisi) return;
    if (!confirm("Bu faaliyet silinsin mi?")) return;
    await sil.mutateAsync({ id, kisi_id: kisi.id });
    toast.success("Silindi");
  };

  return (
    <Sheet open={!!kisi} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="px-6 pt-6">{kisi?.ad ?? ""}</SheetTitle>
        </SheetHeader>
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 pb-6 pt-4">
          {/* Hızlı ekle */}
          <section className="rounded-lg border border-border bg-card/50 p-3">
            <div className="mb-2 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              <Plus className="h-3 w-3" /> Yeni faaliyet
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Select value={tip} onValueChange={(v) => setTip(v as KardesEtkinlikTip)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ETKINLIK_TIP_LISTE.map((t) => (
                    <SelectItem key={t.id} value={t.id} className="text-xs">{t.ad}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input type="date" value={tarih} onChange={(e) => setTarih(e.target.value)} className="h-8 text-xs" />
              <Input type="time" value={saat} onChange={(e) => setSaat(e.target.value)} placeholder="Saat (ops.)" className="h-8 text-xs" />
              <Input value={baslik} onChange={(e) => setBaslik(e.target.value)} placeholder="Başlık (ops.)" className="h-8 text-xs" />
            </div>
            <Textarea
              rows={2}
              value={notlar}
              onChange={(e) => setNotlar(e.target.value)}
              placeholder="Not (ops.)"
              className="mt-2 text-xs"
            />
            <div className="mt-2 flex items-center justify-between gap-2">
              <label className="flex cursor-pointer items-center gap-1.5 text-[11px] text-muted-foreground">
                <Checkbox
                  checked={takvimeEkle}
                  onCheckedChange={(v) => setTakvimeEkle(v === true)}
                />
                <CalendarPlus className="h-3 w-3" /> Takvime ekle
              </label>
              <Button size="sm" className="h-7 px-3 text-xs" onClick={kaydet} disabled={ekle.isPending}>
                {ekle.isPending ? "…" : "Ekle"}
              </Button>
            </div>
          </section>

          {/* Son faaliyetler */}
          <section>
            <div className="mb-2 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Faaliyetler ({etkinlikler.length})
            </div>
            {etkinlikler.length === 0 ? (
              <div className="rounded-md border border-dashed border-border bg-card/30 px-3 py-6 text-center text-xs text-muted-foreground">
                Henüz faaliyet yok
              </div>
            ) : (
              <div className="space-y-1.5">
                {etkinlikler.slice(0, 20).map((e) => {
                  const meta = ETKINLIK_TIP_MAP[e.tip];
                  return (
                    <div
                      key={e.id}
                      className="group flex items-start gap-2 rounded-md border border-border bg-card px-2.5 py-2 text-xs"
                      style={{ borderLeftColor: `var(${meta.renkVar})`, borderLeftWidth: 3 }}
                    >
                      <span
                        className="shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                        style={{
                          backgroundColor: `color-mix(in oklab, var(${meta.renkVar}) 14%, transparent)`,
                          color: `var(${meta.renkVar})`,
                        }}
                      >
                        {meta.ad}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">{e.baslik}</div>
                        <div className="text-[10px] text-muted-foreground">
                          {format(parseISO(e.tarih), "d MMM yyyy", { locale: tr })}
                          {e.baslangic_saati ? ` · ${e.baslangic_saati.slice(0, 5)}` : ""}
                          {e.takvim_etkinlik_id ? " · 📅" : ""}
                        </div>
                        {e.notlar && (
                          <div className="mt-0.5 line-clamp-2 text-[10px] text-muted-foreground">{e.notlar}</div>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 shrink-0 p-0 opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={() => silEt(e.id)}
                      >
                        <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}