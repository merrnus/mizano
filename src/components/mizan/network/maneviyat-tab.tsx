import * as React from "react";
import { Plus, Trash2, Check, X, Sparkles, BookOpen, Calendar, ChevronLeft, ChevronRight, RotateCw } from "lucide-react";
import { format, startOfWeek, addDays, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  useKardesMufredatAktif,
  useKardesMufredatKaydet,
  useKardesMufredatYeniDonem,
  useKardesEvradMaddeler,
  useKardesEvradMaddeEkle,
  useKardesEvradMaddeSil,
  useKardesEvradKayitlari,
  useKardesEvradToggle,
  useKardesEtkinlikler,
} from "@/lib/network-hooks";
import {
  ETKINLIK_TIP_MAP,
  MANEVIYAT_ETKINLIK_TIPLERI,
  type MufredatMadde,
} from "@/lib/network-tipleri";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function ManeviyatTab({ kisiId }: { kisiId: string }) {
  return (
    <div className="space-y-6">
      <MufredatKart kisiId={kisiId} />
      <EvradHaftalikKart kisiId={kisiId} />
      <ManeviyatEtkinlikOzet kisiId={kisiId} />
    </div>
  );
}

/* ---------------- 3 Aylık Müfredat ---------------- */

function MufredatKart({ kisiId }: { kisiId: string }) {
  const { data: mufredat, isLoading } = useKardesMufredatAktif(kisiId);
  const kaydet = useKardesMufredatKaydet();
  const yeniDonem = useKardesMufredatYeniDonem();
  const [yeniMadde, setYeniMadde] = React.useState("");

  const maddeler = mufredat?.maddeler ?? [];
  const tamamlanan = maddeler.filter((m) => m.tamamlandi).length;
  const yuzde = maddeler.length === 0 ? 0 : Math.round((tamamlanan / maddeler.length) * 100);

  const ekleMadde = async () => {
    const v = yeniMadde.trim();
    if (!v) return;
    const yeni: MufredatMadde = {
      id: crypto.randomUUID(),
      metin: v,
      tamamlandi: false,
    };
    if (mufredat) {
      await kaydet.mutateAsync({
        id: mufredat.id,
        kisi_id: kisiId,
        maddeler: [...maddeler, yeni],
      });
    } else {
      const bugun = new Date();
      const bitis = new Date();
      bitis.setMonth(bitis.getMonth() + 3);
      await kaydet.mutateAsync({
        kisi_id: kisiId,
        baslangic: bugun.toISOString().slice(0, 10),
        bitis: bitis.toISOString().slice(0, 10),
        maddeler: [yeni],
      });
    }
    setYeniMadde("");
  };

  const toggleMadde = async (id: string) => {
    if (!mufredat) return;
    await kaydet.mutateAsync({
      id: mufredat.id,
      kisi_id: kisiId,
      maddeler: maddeler.map((m) => (m.id === id ? { ...m, tamamlandi: !m.tamamlandi } : m)),
    });
  };

  const silMadde = async (id: string) => {
    if (!mufredat) return;
    await kaydet.mutateAsync({
      id: mufredat.id,
      kisi_id: kisiId,
      maddeler: maddeler.filter((m) => m.id !== id),
    });
  };

  const yeniDonemBaslat = async () => {
    if (mufredat && !confirm("Mevcut dönem arşivlenip yeni 3 aylık dönem başlatılacak. Devam edilsin mi?")) return;
    await yeniDonem.mutateAsync({ kisi_id: kisiId, eskiId: mufredat?.id });
    toast.success("Yeni dönem başlatıldı");
  };

  return (
    <section className="rounded-xl border border-border bg-card/50 p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          <BookOpen className="h-3.5 w-3.5" /> 3 Aylık Müfredat
        </div>
        {mufredat && (
          <Button size="sm" variant="ghost" onClick={yeniDonemBaslat} className="h-7 text-xs">
            <RotateCw className="h-3 w-3" /> Yeni dönem
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Yükleniyor…</div>
      ) : (
        <>
          {mufredat && (
            <div className="mb-3 flex items-center gap-3">
              <div className="text-xs text-muted-foreground">
                {mufredat.baslangic && mufredat.bitis
                  ? `${format(parseISO(mufredat.baslangic), "d MMM", { locale: tr })} – ${format(
                      parseISO(mufredat.bitis),
                      "d MMM yyyy",
                      { locale: tr },
                    )}`
                  : "Tarih ayarlanmamış"}
              </div>
              <div className="ml-auto flex items-center gap-2">
                <span className="text-[11px] tabular-nums text-muted-foreground">
                  {tamamlanan}/{maddeler.length}
                </span>
                <Progress value={yuzde} className="h-1.5 w-24" />
                <span className="text-[11px] font-medium tabular-nums text-foreground">{yuzde}%</span>
              </div>
            </div>
          )}

          <div className="space-y-1">
            {maddeler.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-card/30 p-4 text-center text-xs text-muted-foreground">
                Henüz hedef yok. Aşağıdan ekle.
              </div>
            ) : (
              maddeler.map((m) => (
                <div
                  key={m.id}
                  className="group flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent/40"
                >
                  <button
                    type="button"
                    onClick={() => toggleMadde(m.id)}
                    className={cn(
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                      m.tamamlandi
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background hover:border-primary",
                    )}
                    aria-label={m.tamamlandi ? "Tamamlandı işaretini kaldır" : "Tamamlandı olarak işaretle"}
                  >
                    {m.tamamlandi && <Check className="h-3 w-3" />}
                  </button>
                  <span
                    className={cn(
                      "flex-1 text-sm",
                      m.tamamlandi && "text-muted-foreground line-through",
                    )}
                  >
                    {m.metin}
                  </span>
                  <button
                    type="button"
                    onClick={() => silMadde(m.id)}
                    className="opacity-0 transition-opacity group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                    aria-label="Sil"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="mt-3 flex gap-2">
            <Input
              value={yeniMadde}
              onChange={(e) => setYeniMadde(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  ekleMadde();
                }
              }}
              placeholder="Yeni hedef (Enter)"
              className="h-8 text-sm"
            />
            <Button size="sm" onClick={ekleMadde} disabled={!yeniMadde.trim()}>
              <Plus className="h-3.5 w-3.5" /> Ekle
            </Button>
          </div>
        </>
      )}
    </section>
  );
}

/* ---------------- Haftalık Evrâd-u Ezkâr ---------------- */

function EvradHaftalikKart({ kisiId }: { kisiId: string }) {
  const [haftaOfset, setHaftaOfset] = React.useState(0);
  const haftaBas = React.useMemo(() => {
    const d = startOfWeek(new Date(), { weekStartsOn: 1 });
    d.setDate(d.getDate() + haftaOfset * 7);
    return d;
  }, [haftaOfset]);
  const gunler = React.useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(haftaBas, i)),
    [haftaBas],
  );
  const baslangicStr = format(haftaBas, "yyyy-MM-dd");
  const bitisStr = format(addDays(haftaBas, 6), "yyyy-MM-dd");

  const { data: maddeler = [] } = useKardesEvradMaddeler(kisiId);
  const { data: kayitlar = [] } = useKardesEvradKayitlari(kisiId, baslangicStr, bitisStr);
  const ekleMadde = useKardesEvradMaddeEkle();
  const silMadde = useKardesEvradMaddeSil();
  const toggle = useKardesEvradToggle();

  const [yeniMadde, setYeniMadde] = React.useState("");

  const kayitMap = React.useMemo(() => {
    const m = new Map<string, string>();
    kayitlar.forEach((k) => m.set(`${k.madde_id}|${k.tarih}`, k.id));
    return m;
  }, [kayitlar]);

  const handleToggle = async (madde_id: string, tarih: string) => {
    const mevcutId = kayitMap.get(`${madde_id}|${tarih}`) ?? null;
    await toggle.mutateAsync({ kisi_id: kisiId, madde_id, tarih, mevcutId });
  };

  const handleEkle = async () => {
    const v = yeniMadde.trim();
    if (!v) return;
    await ekleMadde.mutateAsync({ kisi_id: kisiId, metin: v, siralama: maddeler.length });
    setYeniMadde("");
  };

  const haftaEt =
    haftaOfset === 0
      ? "Bu hafta"
      : haftaOfset === -1
        ? "Geçen hafta"
        : `${format(haftaBas, "d MMM", { locale: tr })} – ${format(addDays(haftaBas, 6), "d MMM", { locale: tr })}`;

  return (
    <section className="rounded-xl border border-border bg-card/50 p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5" /> Haftalık Evrâd-u Ezkâr
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0"
            onClick={() => setHaftaOfset((o) => o - 1)}
            aria-label="Önceki hafta"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <span className="min-w-[120px] text-center text-xs text-muted-foreground">{haftaEt}</span>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0"
            onClick={() => setHaftaOfset((o) => o + 1)}
            disabled={haftaOfset >= 0}
            aria-label="Sonraki hafta"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {maddeler.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card/30 p-4 text-center text-xs text-muted-foreground">
          Henüz evrâd maddesi yok. Aşağıdan ekle (örn: günlük Kuran, sünnet ibadetler…).
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                <th className="w-1/3 py-1.5 text-left font-medium text-muted-foreground">Madde</th>
                {gunler.map((g) => (
                  <th key={g.toISOString()} className="px-1 py-1.5 text-center font-medium text-muted-foreground">
                    <div>{format(g, "EEE", { locale: tr }).slice(0, 2)}</div>
                    <div className="text-[10px] tabular-nums">{format(g, "d")}</div>
                  </th>
                ))}
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {maddeler.map((m) => {
                const yapilan = gunler.filter((g) =>
                  kayitMap.has(`${m.id}|${format(g, "yyyy-MM-dd")}`),
                ).length;
                return (
                  <tr key={m.id} className="group border-t border-border/60">
                    <td className="py-1.5 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-foreground">{m.metin}</span>
                        <span className="text-[10px] tabular-nums text-muted-foreground">
                          {yapilan}/7
                        </span>
                      </div>
                    </td>
                    {gunler.map((g) => {
                      const tarih = format(g, "yyyy-MM-dd");
                      const mevcut = kayitMap.has(`${m.id}|${tarih}`);
                      return (
                        <td key={tarih} className="px-1 py-1 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggle(m.id, tarih)}
                            className={cn(
                              "mx-auto flex h-6 w-6 items-center justify-center rounded-md border transition-colors",
                              mevcut
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border bg-background hover:border-primary/60",
                            )}
                            aria-label={`${m.metin} – ${tarih}`}
                          >
                            {mevcut && <Check className="h-3 w-3" />}
                          </button>
                        </td>
                      );
                    })}
                    <td className="text-right">
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`"${m.metin}" maddesi silinsin mi? (Geçmiş kayıtlar da silinir)`))
                            silMadde.mutate({ id: m.id, kisi_id: kisiId });
                        }}
                        className="opacity-0 transition-opacity group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                        aria-label="Sil"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-3 flex gap-2">
        <Input
          value={yeniMadde}
          onChange={(e) => setYeniMadde(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleEkle();
            }
          }}
          placeholder="Yeni evrâd maddesi (örn: Sabah duası)"
          className="h-8 text-sm"
        />
        <Button size="sm" onClick={handleEkle} disabled={!yeniMadde.trim()}>
          <Plus className="h-3.5 w-3.5" /> Ekle
        </Button>
      </div>
    </section>
  );
}

/* ---------------- Maneviyat Etkinlik Özeti ---------------- */

function ManeviyatEtkinlikOzet({ kisiId }: { kisiId: string }) {
  const { data: etkinlikler = [] } = useKardesEtkinlikler(kisiId);
  const filtreli = etkinlikler
    .filter((e) => MANEVIYAT_ETKINLIK_TIPLERI.includes(e.tip))
    .slice(0, 8);

  return (
    <section className="rounded-xl border border-border bg-card/50 p-4 sm:p-5">
      <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        <Calendar className="h-3.5 w-3.5" /> Maneviyat etkinlikleri (son 8)
      </div>

      {filtreli.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card/30 p-4 text-center text-xs text-muted-foreground">
          Henüz maneviyat etkinliği kaydı yok. "Faaliyetler" sekmesinden ekleyebilirsin.
        </div>
      ) : (
        <div className="space-y-1.5">
          {filtreli.map((e) => {
            const meta = ETKINLIK_TIP_MAP[e.tip];
            return (
              <div
                key={e.id}
                className="flex items-center gap-2 rounded-md border border-border/60 bg-card px-2.5 py-1.5"
                style={{ borderLeftColor: `var(${meta.renkVar})`, borderLeftWidth: 3 }}
              >
                <span
                  className="rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                  style={{
                    backgroundColor: `color-mix(in oklab, var(${meta.renkVar}) 14%, transparent)`,
                    color: `var(${meta.renkVar})`,
                  }}
                >
                  {meta.ad}
                </span>
                <span className="min-w-0 flex-1 truncate text-xs text-foreground">{e.baslik}</span>
                <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
                  {format(parseISO(e.tarih), "d MMM", { locale: tr })}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}