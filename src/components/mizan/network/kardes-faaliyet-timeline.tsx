import * as React from "react";
import { Plus, Trash2, Pencil, Check, X, Filter, CalendarPlus } from "lucide-react";
import { format, parseISO, isThisWeek, isThisMonth, isToday } from "date-fns";
import { tr } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useKardesEtkinlikler,
  useKardesEtkinlikEkle,
  useKardesEtkinlikGuncelle,
  useKardesEtkinlikSil,
  useKisi,
} from "@/lib/network-hooks";
import {
  ETKINLIK_TIP_LISTE,
  ETKINLIK_TIP_MAP,
  type KardesEtkinlik,
  type KardesEtkinlikTip,
} from "@/lib/network-tipleri";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const SONUC_GEREKEN: KardesEtkinlikTip[] = ["sinav", "yarisma"];

export function KardesFaaliyetTimeline({ kisiId }: { kisiId: string }) {
  const { data: etkinlikler = [], isLoading } = useKardesEtkinlikler(kisiId);
  const { data: kisi } = useKisi(kisiId);
  const ekle = useKardesEtkinlikEkle();
  const sil = useKardesEtkinlikSil();

  const [filtre, setFiltre] = React.useState<KardesEtkinlikTip | "tumu">("tumu");
  const [duzenle, setDuzenle] = React.useState<KardesEtkinlik | null>(null);

  // Yeni etkinlik formu
  const [tip, setTip] = React.useState<KardesEtkinlikTip>("sohbet");
  const [tarih, setTarih] = React.useState<string>(() => new Date().toISOString().slice(0, 10));
  const [baslik, setBaslik] = React.useState("");
  const [notlar, setNotlar] = React.useState("");
  const [sonuc, setSonuc] = React.useState("");
  const [baslangicSaati, setBaslangicSaati] = React.useState("");
  const [bitisSaati, setBitisSaati] = React.useState("");
  const [takvimeEkle, setTakvimeEkle] = React.useState(true);

  const ekleEtkinlik = async () => {
    if (!baslik.trim()) {
      toast.error("Başlık gerekli");
      return;
    }
    if (baslangicSaati && bitisSaati && bitisSaati <= baslangicSaati) {
      toast.error("Bitiş saati başlangıçtan sonra olmalı");
      return;
    }
    await ekle.mutateAsync({
      kisi_id: kisiId,
      tip,
      tarih,
      baslik: baslik.trim(),
      notlar: notlar.trim() || null,
      sonuc: sonuc.trim() || null,
      baslangic_saati: baslangicSaati || null,
      bitis_saati: bitisSaati || null,
      takvime_ekle: takvimeEkle,
      kisi_ad: kisi?.ad,
    });
    setBaslik("");
    setNotlar("");
    setSonuc("");
    setBaslangicSaati("");
    setBitisSaati("");
    toast.success("Etkinlik eklendi");
  };

  const filtreli = etkinlikler.filter((e) => filtre === "tumu" || e.tip === filtre);

  // Gruplama
  const gruplar: { ad: string; items: KardesEtkinlik[] }[] = [
    { ad: "Bu hafta", items: [] },
    { ad: "Bu ay", items: [] },
    { ad: "Daha önce", items: [] },
  ];
  filtreli.forEach((e) => {
    const d = parseISO(e.tarih);
    if (isThisWeek(d, { weekStartsOn: 1 })) gruplar[0].items.push(e);
    else if (isThisMonth(d)) gruplar[1].items.push(e);
    else gruplar[2].items.push(e);
  });

  return (
    <div className="space-y-6">
      {/* Yeni etkinlik */}
      <section className="rounded-xl border border-border bg-card/50 p-4 sm:p-5">
        <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          <Plus className="h-3.5 w-3.5" /> Yeni etkinlik
        </div>
        <div className="grid gap-3 sm:grid-cols-[160px_140px_1fr]">
          <Select value={tip} onValueChange={(v) => setTip(v as KardesEtkinlikTip)}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ETKINLIK_TIP_LISTE.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: `var(${t.renkVar})` }}
                    />
                    {t.ad}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input type="date" value={tarih} onChange={(e) => setTarih(e.target.value)} />
          <Input
            placeholder="Başlık (örn: Çay sohbeti, Doğum günü kutlaması…)"
            value={baslik}
            onChange={(e) => setBaslik(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && ekleEtkinlik()}
          />
        </div>
        <Textarea
          rows={2}
          placeholder="Notlar (opsiyonel) — neler konuşuldu, nasıl geçti…"
          value={notlar}
          onChange={(e) => setNotlar(e.target.value)}
          className="mt-3"
        />
        {SONUC_GEREKEN.includes(tip) && (
          <Input
            placeholder={tip === "sinav" ? "Puan / sonuç" : "Derece / sonuç"}
            value={sonuc}
            onChange={(e) => setSonuc(e.target.value)}
            className="mt-3"
          />
        )}
        <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
          <div className="grid gap-1">
            <Label htmlFor="bas-saat" className="text-[11px] text-muted-foreground">
              Başlangıç (ops.)
            </Label>
            <Input
              id="bas-saat"
              type="time"
              value={baslangicSaati}
              onChange={(e) => setBaslangicSaati(e.target.value)}
            />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="bit-saat" className="text-[11px] text-muted-foreground">
              Bitiş (ops.)
            </Label>
            <Input
              id="bit-saat"
              type="time"
              value={bitisSaati}
              onChange={(e) => setBitisSaati(e.target.value)}
            />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
            <Checkbox
              checked={takvimeEkle}
              onCheckedChange={(v) => setTakvimeEkle(v === true)}
            />
            <CalendarPlus className="h-3.5 w-3.5" />
            Mizan Takvim'e ekle
          </label>
          <Button size="sm" onClick={ekleEtkinlik} disabled={!baslik.trim() || ekle.isPending}>
            <Plus className="h-3.5 w-3.5" /> Ekle
          </Button>
        </div>
      </section>

      {/* Filtre */}
      <div className="flex flex-wrap items-center gap-1.5">
        <Filter className="mr-1 h-3.5 w-3.5 text-muted-foreground" />
        <FiltreChip
          aktif={filtre === "tumu"}
          onClick={() => setFiltre("tumu")}
          ad={`Tümü (${etkinlikler.length})`}
        />
        {ETKINLIK_TIP_LISTE.map((t) => {
          const sayi = etkinlikler.filter((e) => e.tip === t.id).length;
          if (sayi === 0) return null;
          return (
            <FiltreChip
              key={t.id}
              aktif={filtre === t.id}
              onClick={() => setFiltre(t.id)}
              ad={`${t.ad} (${sayi})`}
              renkVar={t.renkVar}
            />
          );
        })}
      </div>

      {/* Timeline */}
      {isLoading ? (
        <div className="rounded-xl border border-border bg-card/50 p-6 text-center text-sm text-muted-foreground">
          Yükleniyor…
        </div>
      ) : filtreli.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/30 p-8 text-center text-sm text-muted-foreground">
          {etkinlikler.length === 0
            ? "Henüz faaliyet yok. İlk kaydı yukarıdan ekle."
            : "Bu filtreye uyan kayıt yok."}
        </div>
      ) : (
        <div className="space-y-6">
          {gruplar.map((g) =>
            g.items.length === 0 ? null : (
              <div key={g.ad}>
                <div className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  {g.ad} · {g.items.length}
                </div>
                <div className="space-y-2">
                  {g.items.map((e) =>
                    duzenle?.id === e.id ? (
                      <DuzenleSatir
                        key={e.id}
                        etkinlik={e}
                        onClose={() => setDuzenle(null)}
                      />
                    ) : (
                      <EtkinlikSatir
                        key={e.id}
                        etkinlik={e}
                        onDuzenle={() => setDuzenle(e)}
                        onSil={async () => {
                          if (!confirm("Bu etkinlik silinsin mi?")) return;
                          await sil.mutateAsync({ id: e.id, kisi_id: kisiId });
                          toast.success("Silindi");
                        }}
                      />
                    ),
                  )}
                </div>
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}

function FiltreChip({
  aktif,
  onClick,
  ad,
  renkVar,
}: {
  aktif: boolean;
  onClick: () => void;
  ad: string;
  renkVar?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-2.5 py-0.5 text-[11px] transition-colors",
        aktif
          ? "border-primary bg-primary/15 text-foreground"
          : "border-border bg-background text-muted-foreground hover:text-foreground",
      )}
      style={
        aktif && renkVar
          ? {
              borderColor: `color-mix(in oklab, var(${renkVar}) 50%, transparent)`,
              backgroundColor: `color-mix(in oklab, var(${renkVar}) 14%, transparent)`,
            }
          : undefined
      }
    >
      {ad}
    </button>
  );
}

function EtkinlikSatir({
  etkinlik,
  onDuzenle,
  onSil,
}: {
  etkinlik: KardesEtkinlik;
  onDuzenle: () => void;
  onSil: () => void;
}) {
  const meta = ETKINLIK_TIP_MAP[etkinlik.tip];
  const d = parseISO(etkinlik.tarih);
  const tarihEt = isToday(d) ? "Bugün" : format(d, "d MMM yyyy", { locale: tr });
  const saatEt = etkinlik.baslangic_saati
    ? `${etkinlik.baslangic_saati.slice(0, 5)}${etkinlik.bitis_saati ? "–" + etkinlik.bitis_saati.slice(0, 5) : ""}`
    : null;
  return (
    <div
      className="group flex items-start gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:border-primary/40"
      style={{
        borderLeftColor: `var(${meta.renkVar})`,
        borderLeftWidth: 3,
      }}
    >
      <span
        className="mt-1 inline-flex h-6 shrink-0 items-center gap-1 rounded-full px-2 text-[10px] font-medium"
        style={{
          backgroundColor: `color-mix(in oklab, var(${meta.renkVar}) 14%, transparent)`,
          color: `var(${meta.renkVar})`,
        }}
      >
        {meta.ad}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            <div className="truncate text-sm font-medium text-foreground">{etkinlik.baslik}</div>
            {etkinlik.takvim_etkinlik_id ? (
              <CalendarPlus
                className="h-3 w-3 shrink-0 text-[var(--mana)]"
                aria-label="Mizan Takvim'de"
              />
            ) : null}
          </div>
          <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
            {saatEt ? `${tarihEt} · ${saatEt}` : tarihEt}
          </span>
        </div>
        {etkinlik.sonuc ? (
          <div className="mt-0.5 text-xs font-medium text-foreground/80">
            Sonuç: {etkinlik.sonuc}
          </div>
        ) : null}
        {etkinlik.notlar ? (
          <div className="mt-1 whitespace-pre-wrap text-xs text-muted-foreground">
            {etkinlik.notlar}
          </div>
        ) : null}
      </div>
      <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={onDuzenle}>
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
          onClick={onSil}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

function DuzenleSatir({
  etkinlik,
  onClose,
}: {
  etkinlik: KardesEtkinlik;
  onClose: () => void;
}) {
  const guncelle = useKardesEtkinlikGuncelle();
  const { data: kisi } = useKisi(etkinlik.kisi_id);
  const [tip, setTip] = React.useState<KardesEtkinlikTip>(etkinlik.tip);
  const [tarih, setTarih] = React.useState(etkinlik.tarih);
  const [baslik, setBaslik] = React.useState(etkinlik.baslik);
  const [notlar, setNotlar] = React.useState(etkinlik.notlar ?? "");
  const [sonuc, setSonuc] = React.useState(etkinlik.sonuc ?? "");
  const [baslangicSaati, setBaslangicSaati] = React.useState(etkinlik.baslangic_saati?.slice(0, 5) ?? "");
  const [bitisSaati, setBitisSaati] = React.useState(etkinlik.bitis_saati?.slice(0, 5) ?? "");
  const [takvimeEkle, setTakvimeEkle] = React.useState(!!etkinlik.takvim_etkinlik_id);

  const kaydet = async () => {
    if (!baslik.trim()) return;
    if (baslangicSaati && bitisSaati && bitisSaati <= baslangicSaati) {
      toast.error("Bitiş saati başlangıçtan sonra olmalı");
      return;
    }
    await guncelle.mutateAsync({
      id: etkinlik.id,
      kisi_id: etkinlik.kisi_id,
      tip,
      tarih,
      baslik: baslik.trim(),
      notlar: notlar.trim() || null,
      sonuc: sonuc.trim() || null,
      baslangic_saati: baslangicSaati || null,
      bitis_saati: bitisSaati || null,
      takvime_ekle: takvimeEkle,
      kisi_ad: kisi?.ad,
    });
    toast.success("Güncellendi");
    onClose();
  };

  return (
    <div className="rounded-xl border border-primary/40 bg-card p-3">
      <div className="grid gap-2 sm:grid-cols-[160px_140px_1fr]">
        <Select value={tip} onValueChange={(v) => setTip(v as KardesEtkinlikTip)}>
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ETKINLIK_TIP_LISTE.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.ad}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input type="date" value={tarih} onChange={(e) => setTarih(e.target.value)} />
        <Input value={baslik} onChange={(e) => setBaslik(e.target.value)} />
      </div>
      <Textarea
        rows={2}
        value={notlar}
        onChange={(e) => setNotlar(e.target.value)}
        className="mt-2"
        placeholder="Notlar"
      />
      {SONUC_GEREKEN.includes(tip) && (
        <Input
          value={sonuc}
          onChange={(e) => setSonuc(e.target.value)}
          className="mt-2"
          placeholder="Sonuç"
        />
      )}
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <Input
          type="time"
          value={baslangicSaati}
          onChange={(e) => setBaslangicSaati(e.target.value)}
          placeholder="Başlangıç"
        />
        <Input
          type="time"
          value={bitisSaati}
          onChange={(e) => setBitisSaati(e.target.value)}
          placeholder="Bitiş"
        />
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
          <Checkbox
            checked={takvimeEkle}
            onCheckedChange={(v) => setTakvimeEkle(v === true)}
          />
          <CalendarPlus className="h-3.5 w-3.5" />
          Mizan Takvim'e ekle
        </label>
        <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={onClose}>
          <X className="h-3.5 w-3.5" /> İptal
        </Button>
        <Button size="sm" onClick={kaydet} disabled={guncelle.isPending}>
          <Check className="h-3.5 w-3.5" /> Kaydet
        </Button>
        </div>
      </div>
    </div>
  );
}