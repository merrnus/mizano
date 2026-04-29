import { createFileRoute, Link } from "@tanstack/react-router";
import * as React from "react";
import { addWeeks } from "date-fns";
import { ArrowLeft, ChevronLeft, ChevronRight, Download, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  GUN_KISA,
  haftaBaslangici,
  haftaEtiketi,
  haftaGunleri,
  tarihFormat,
} from "@/lib/cetele-tarih";
import {
  useSablonlar,
  useHaftaKayitlari,
  useUcAylikKayitlari,
  useBaslangicYukle,
  useSablonSil,
  haftaToplami,
} from "@/lib/cetele-hooks";
import { CeteleHucre } from "@/components/mizan/cetele-hucre";
import { SablonForm } from "@/components/mizan/sablon-form";
import { UcAylikIlerleme } from "@/components/mizan/uc-aylik-ilerleme";
import { ceteleyiPdfeAktar } from "@/lib/cetele-pdf";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { BAGLAM_SINIF, type BaglamId, type BaglamRenk } from "@/lib/cetele-baglam";
import { useBaglamlar } from "@/lib/cetele-baglam-hooks";
import { HaftalikHedefNoktalar } from "@/components/mizan/haftalik-hedef-noktalar";
import { BaglamAtaPopover } from "@/components/mizan/baglam-ata-popover";
import type { CeteleSablon } from "@/lib/cetele-tipleri";

export const Route = createFileRoute("/mizan/mana")({
  head: () => ({
    meta: [
      { title: "Mana — Çetele" },
      { name: "description", content: "Haftalık evrad çetelesi ve 3 aylık manevi hedefler." },
    ],
  }),
  component: ManaSayfasi,
});

function ManaSayfasi() {
  const [haftaBas, setHaftaBas] = React.useState<Date>(() => haftaBaslangici(new Date()));
  const gunler = haftaGunleri(haftaBas);
  const { data: sablonlar = [], isLoading } = useSablonlar();
  const { data: kayitlar = [] } = useHaftaKayitlari(haftaBas);
  const baslangicYukle = useBaslangicYukle();
  const sil = useSablonSil();
  const { user } = useAuth();

  const mana = sablonlar.filter((s) => s.alan === "mana");
  const bos = !isLoading && mana.length === 0;
  const { data: baglamlar = [] } = useBaglamlar();

  // Bağlama göre gruplama: bir madde birden fazla bağlamdaysa her grupta bir kez görünür.
  // Etiketsiz (boş baglamlar) en altta ayrı grup.
  type Grup = { id: BaglamId | "etiketsiz"; etiket: string; emoji: string; renk: BaglamRenk | "muted"; sablonlar: CeteleSablon[] };
  const gruplar: Grup[] = React.useMemo(() => {
    const out: Grup[] = baglamlar
      .map((b) => ({
        id: b.slug,
        etiket: b.etiket,
        emoji: b.emoji,
        renk: b.renk as BaglamRenk | "muted",
        sablonlar: mana.filter((s) => (s.baglamlar ?? []).includes(b.slug)),
      }))
      .filter((g) => g.sablonlar.length > 0);

    const etiketsiz = mana.filter((s) => !s.baglamlar || s.baglamlar.length === 0);
    if (etiketsiz.length > 0) {
      out.push({ id: "etiketsiz", etiket: "Etiketsiz", emoji: "·", renk: "muted", sablonlar: etiketsiz });
    }
    return out;
  }, [mana, baglamlar]);

  const ucAyliklar = sablonlar.filter((s) => s.uc_aylik_hedef);
  const { data: ucAylikKayitlari = [] } = useUcAylikKayitlari(
    ucAyliklar.map((s) => s.id),
  );

  const pdfIndir = () => {
    try {
      ceteleyiPdfeAktar({
        haftaBas,
        sablonlar,
        haftaKayitlari: kayitlar,
        ucAylikKayitlari,
        kullanici: user?.email ?? null,
      });
    } catch (e) {
      toast.error("PDF oluşturulamadı");
    }
  };

  const bugunStr = tarihFormat(new Date());

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      <header className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2 h-7 gap-1 text-xs text-muted-foreground">
          <Link to="/mizan"><ArrowLeft className="h-3 w-3" /> İstikamet</Link>
        </Button>
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Mana</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Haftalık Çetele</h1>
      </header>

      <section className="mb-6 rounded-2xl border border-border bg-card p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={() => setHaftaBas((d) => addWeeks(d, -1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-[8rem] text-center text-sm font-medium">
              {haftaEtiketi(haftaBas)}
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={() => setHaftaBas((d) => addWeeks(d, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="ml-2 h-7 px-2 text-xs"
              onClick={() => setHaftaBas(haftaBaslangici(new Date()))}
            >
              Bugün
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1 text-xs"
              onClick={pdfIndir}
              disabled={mana.length === 0}
            >
              <Download className="h-3.5 w-3.5" /> PDF
            </Button>
            <SablonForm varsayilanAlan="mana" />
          </div>
        </div>

        {bos ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-10 text-center">
            <Sparkles className="h-6 w-6 text-primary" />
            <p className="text-sm text-foreground">Henüz evrad eklenmemiş.</p>
            <p className="max-w-md text-xs text-muted-foreground">
              Tek tıkla başlangıç paketini yükleyebilir veya yeni evrad ekleyebilirsin.
            </p>
            <Button
              size="sm"
              onClick={async () => {
                try {
                  await baslangicYukle.mutateAsync();
                  toast.success("Başlangıç paketi yüklendi");
                } catch {
                  toast.error("Yüklenemedi");
                }
              }}
              disabled={baslangicYukle.isPending}
            >
              {baslangicYukle.isPending ? "..." : "Başlangıç paketini yükle"}
            </Button>
          </div>
        ) : (
          <div className="-mx-4 overflow-x-auto sm:-mx-5">
            <table className="w-full min-w-[640px] border-separate border-spacing-y-1">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  <th className="sticky left-0 z-20 w-[160px] bg-card px-2 pl-4 text-left font-normal sm:pl-5">Evrad</th>
                  {gunler.map((g, i) => (
                    <th key={i} className="px-1 text-center font-normal">
                      {tarihFormat(g) === bugunStr ? (
                        <div className="mx-auto inline-flex flex-col items-center rounded-md bg-primary/15 px-1.5 py-0.5 text-primary">
                          <span>{GUN_KISA[i]}</span>
                          <span className="text-[9px]">{g.getDate()}</span>
                        </div>
                      ) : (
                        <>
                          <div>{GUN_KISA[i]}</div>
                          <div className="text-[9px] text-muted-foreground/60">{g.getDate()}</div>
                        </>
                      )}
                    </th>
                  ))}
                  <th className="w-[80px] px-2 text-right font-normal">Hedef</th>
                  <th className="w-[56px]"></th>
                </tr>
              </thead>
              <tbody>
                {gruplar.map((grup) => {
                  const c = grup.renk === "muted" ? null : BAGLAM_SINIF[grup.renk];
                  const totalCols = 1 + gunler.length + 2;
                  return (
                    <React.Fragment key={grup.id}>
                      <tr>
                        <td colSpan={totalCols} className="px-0 pt-3 pb-1">
                          <div
                            className={cn(
                              "flex items-center gap-2 rounded-md border px-3 py-1.5",
                              c ? cn(c.yumusakBg, c.yumusakBorder) : "bg-muted/30 border-border",
                            )}
                          >
                            <span className={cn("h-3 w-1 rounded-full", c ? c.serit : "bg-muted-foreground/30")} aria-hidden />
                            <span aria-hidden className="text-sm">{grup.emoji}</span>
                            <span className={cn("text-xs font-semibold tracking-wide", c ? c.metin : "text-muted-foreground")}>
                              {grup.etiket}
                            </span>
                            <span className="text-[10px] text-muted-foreground">· {grup.sablonlar.length} madde</span>
                          </div>
                        </td>
                      </tr>
                      {grup.sablonlar.map((s) => {
                        const haftaSum = haftaToplami(kayitlar, s.id);
                        return (
                          <tr key={`${grup.id}-${s.id}`} className="text-xs">
                      <td className="sticky left-0 z-10 w-[160px] border-r border-border bg-card px-2 pl-4 align-middle sm:pl-5">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate font-medium">{s.ad}</span>
                          <BaglamAtaPopover
                            sablonId={s.id}
                            mevcut={(s.baglamlar ?? []) as BaglamId[]}
                          />
                        </div>
                        {s.notlar ? (
                          <div className="text-[10px] text-muted-foreground line-clamp-2">
                            {s.notlar}
                          </div>
                        ) : (
                          <div className="text-[10px] text-muted-foreground/60">
                            {s.birim !== "ikili" && s.birim}
                          </div>
                        )}
                      </td>
                      {gunler.map((g) => {
                        const ts = tarihFormat(g);
                        return (
                          <td key={ts} className="px-0.5 align-middle">
                            <CeteleHucre
                              sablon={s}
                              tarih={g}
                              tarihStr={ts}
                              kayitlar={kayitlar}
                            />
                          </td>
                        );
                      })}
                      <td className="px-2 text-right align-middle">
                        <div className="text-[11px] font-medium text-foreground">
                          {s.hedef_tipi === "haftalik" ? (
                            <HaftalikHedefNoktalar toplam={haftaSum} hedef={Number(s.hedef_deger)} />
                          ) : s.hedef_tipi === "gunluk" ? (
                            <>
                              {Number(s.hedef_deger)} <span className="text-muted-foreground">/g</span>
                            </>
                          ) : (
                            <span className="text-muted-foreground">esnek</span>
                          )}
                        </div>
                      </td>
                      <td className="align-middle">
                        <div className="flex items-center justify-end gap-2 pr-1">
                          <SablonForm duzenle={s} />
                          <button
                            onClick={() => {
                              if (confirm(`"${s.ad}" şablonunu kaldır?`)) sil.mutate(s.id);
                            }}
                            className="text-muted-foreground/40 hover:text-destructive"
                            aria-label="Sil"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <UcAylikIlerleme />
    </div>
  );
}