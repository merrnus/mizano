import { createFileRoute, Link } from "@tanstack/react-router";
import * as React from "react";
import {
  Calendar,
  CheckCircle2,
  ChevronRight,
  Circle,
  Clock,
  Flame,
  GraduationCap,
  Heart,
  Sparkles,
  Target,
  Plus,
  MapPin,
  CalendarPlus,
  ListTodo,
  Trophy,
} from "lucide-react";
import { DengeHalkalari } from "@/components/mizan/denge-halkalari";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  useSablonlar,
  useHaftaKayitlari,
  useKayitEkle,
  useKayitSil,
  haftaSablonOzet,
  gunToplami,
  haftaToplami,
} from "@/lib/cetele-hooks";
import { haftaBaslangici, haftaGunleri, tarihFormat } from "@/lib/cetele-tarih";
import {
  useEtkinlikler,
  useGorevler,
  genisletEtkinlikleri,
  type EtkinlikOlay,
} from "@/lib/takvim-hooks";
import { ALAN_ETIKET } from "@/lib/cetele-tipleri";
import { useHedefler, useTumAdimlar, hedefIlerleme } from "@/lib/hedef-hooks";
import { EtkinlikDialog } from "@/components/mizan/takvim/etkinlik-dialog";
import { GorevDialog } from "@/components/mizan/takvim/gorev-dialog";
import { format, isSameDay, isToday, isTomorrow, parseISO } from "date-fns";
import { tr } from "date-fns/locale";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Bugün — Mizan" },
      {
        name: "description",
        content: "Haftalık denge halkası, günün çetelesi ve bugünün programı.",
      },
      { property: "og:title", content: "Bugün — Mizan" },
      {
        property: "og:description",
        content: "Mana, ilim ve amel — üç alanın haftalık dengesi tek bakışta.",
      },
    ],
  }),
  component: Dashboard,
});

const alanRenk: Record<string, string> = {
  mana: "bg-[var(--mana)]",
  ilim: "bg-[var(--ilim)]",
  amel: "bg-[var(--amel)]",
};

function Dashboard() {
  const gunEtiket = ["P", "S", "Ç", "P", "C", "C", "P"];
  const [bugun, setBugun] = React.useState<string | null>(null);
  const [selam, setSelam] = React.useState<string>("");
  const [hizliAcik, setHizliAcik] = React.useState(false);
  const [etkAcik, setEtkAcik] = React.useState(false);
  const [gorevAcik, setGorevAcik] = React.useState(false);
  const haftaBas = React.useMemo(() => haftaBaslangici(new Date()), []);
  const haftaGunleriArr = React.useMemo(() => haftaGunleri(haftaBas), [haftaBas]);
  const { data: sablonlar = [] } = useSablonlar();
  const { data: kayitlar = [] } = useHaftaKayitlari(haftaBas);
  const { data: hedefler = [] } = useHedefler();
  const { data: tumAdimlar = [] } = useTumAdimlar();
  const ekle = useKayitEkle();
  const sil = useKayitSil();
  const bugunStr = tarihFormat(new Date());

  // Takvim — bugün ve sonraki 7 gün penceresi
  const { takvimBas, takvimBitis, bugunBas, bugunBitis } = React.useMemo(() => {
    const bb = new Date();
    bb.setHours(0, 0, 0, 0);
    const bs = new Date(bb);
    bs.setDate(bs.getDate() + 7);
    const tBitis = new Date(bb);
    tBitis.setHours(23, 59, 59, 999);
    return { takvimBas: bb, takvimBitis: bs, bugunBas: bb, bugunBitis: tBitis };
  }, []);
  const { data: etkinlikler = [] } = useEtkinlikler(takvimBas, takvimBitis);
  const { data: gorevler = [] } = useGorevler(takvimBas, takvimBitis);

  const bugunOlaylari: EtkinlikOlay[] = React.useMemo(() => {
    const tumu = genisletEtkinlikleri(etkinlikler, takvimBas, takvimBitis);
    return tumu
      .filter((o) => o.olayBaslangic <= bugunBitis && o.olayBitis >= bugunBas)
      .sort((a, b) => a.olayBaslangic.getTime() - b.olayBaslangic.getTime());
  }, [etkinlikler, takvimBas, takvimBitis, bugunBas, bugunBitis]);

  const bugunGorevleri = React.useMemo(
    () => gorevler.filter((g) => isToday(parseISO(g.vade)) && !g.tamamlandi),
    [gorevler],
  );

  const yaklasanOlaylar: EtkinlikOlay[] = React.useMemo(() => {
    const tumu = genisletEtkinlikleri(etkinlikler, takvimBas, takvimBitis);
    return tumu
      .filter((o) => o.olayBaslangic > bugunBitis)
      .sort((a, b) => a.olayBaslangic.getTime() - b.olayBaslangic.getTime())
      .slice(0, 4);
  }, [etkinlikler, takvimBas, takvimBitis, bugunBitis]);

  // Streak: bu haftada aktivite olan ardışık gün sayısı
  const streakSayi = React.useMemo(() => {
    if (kayitlar.length === 0) return 0;
    const aktifGunler = new Set(kayitlar.map((k) => k.tarih));
    let s = 0;
    const bg = new Date();
    bg.setHours(0, 0, 0, 0);
    for (let i = 0; i < 30; i++) {
      const d = new Date(bg);
      d.setDate(bg.getDate() - i);
      const iso = tarihFormat(d);
      if (aktifGunler.has(iso)) {
        s += 1;
      } else if (i === 0) {
        // bugün boşsa streak bozulmaz, dünden başla
        continue;
      } else {
        break;
      }
    }
    return s;
  }, [kayitlar]);

  // En yakın 2 aktif hedef (bitis tarihine göre)
  const yakinHedefler = React.useMemo(() => {
    return hedefler
      .filter((h) => h.durum === "aktif")
      .sort((a, b) => {
        const ab = a.bitis ? new Date(a.bitis).getTime() : Infinity;
        const bb = b.bitis ? new Date(b.bitis).getTime() : Infinity;
        return ab - bb;
      })
      .slice(0, 2);
  }, [hedefler]);

  const halkalar = React.useMemo(() => {
    const calc = (alan: "mana" | "ilim" | "amel") => {
      const sb = sablonlar.filter((s) => s.alan === alan);
      const o = haftaSablonOzet(sb, kayitlar, haftaBas);
      return o.toplam > 0 ? Math.round((o.tamamlanan / o.toplam) * 100) : 0;
    };
    return [
      { ad: "Mana", yuzde: calc("mana"), renkVar: "--mana", ikon: <Heart className="h-3 w-3" /> },
      { ad: "İlim", yuzde: 58, renkVar: "--ilim", ikon: <GraduationCap className="h-3 w-3" /> },
      { ad: "Amel", yuzde: 32, renkVar: "--amel", ikon: <Target className="h-3 w-3" /> },
    ] as const;
  }, [sablonlar, kayitlar, haftaBas]);

  const bugunSablonlar = React.useMemo(
    () =>
      sablonlar.filter(
        (s) =>
          s.alan === "mana" &&
          (s.hedef_tipi === "gunluk" || s.hedef_tipi === "haftalik"),
      ),
    [sablonlar],
  );

  React.useEffect(() => {
    const d = new Date();
    setBugun(
      `${d.toLocaleDateString("tr-TR", { weekday: "long" })} • ${d.toLocaleDateString("tr-TR", { day: "numeric", month: "long" })}`,
    );
    const h = d.getHours();
    setSelam(
      h < 5
        ? "İyi geceler"
        : h < 12
          ? "Günaydın"
          : h < 18
            ? "İyi günler"
            : "İyi akşamlar",
    );
  }, []);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-6">
      {/* Üst başlık — sosyal app tarzı selamlama */}
      <header className="mb-5 sm:mb-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            {bugun && (
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                {bugun}
              </p>
            )}
            <h1 className="mt-1 text-[26px] font-semibold leading-tight tracking-tight text-foreground sm:text-3xl">
              {selam ? `${selam},` : "Bugünün Dengesi"}
              <span className="block text-muted-foreground sm:inline sm:ml-2">
                bugünün dengesi
              </span>
            </h1>
          </div>
          {/* Hızlı ekleme */}
          <Popover open={hizliAcik} onOpenChange={setHizliAcik}>
            <PopoverTrigger asChild>
              <Button
                size="icon"
                className="h-11 w-11 shrink-0 rounded-full shadow-md transition-transform active:scale-95"
                aria-label="Hızlı ekle"
              >
                <Plus className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-56 p-1.5">
              <button
                type="button"
                onClick={() => {
                  setHizliAcik(false);
                  setGorevAcik(true);
                }}
                className="flex w-full items-center gap-3 rounded-md px-2.5 py-2.5 text-left text-sm transition-colors hover:bg-accent"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <ListTodo className="h-4 w-4" />
                </span>
                <div className="flex flex-col">
                  <span className="font-medium text-foreground">Görev</span>
                  <span className="text-[11px] text-muted-foreground">Bugün için yapılacak</span>
                </div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setHizliAcik(false);
                  setEtkAcik(true);
                }}
                className="flex w-full items-center gap-3 rounded-md px-2.5 py-2.5 text-left text-sm transition-colors hover:bg-accent"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <CalendarPlus className="h-4 w-4" />
                </span>
                <div className="flex flex-col">
                  <span className="font-medium text-foreground">Etkinlik</span>
                  <span className="text-[11px] text-muted-foreground">Takvime saatli ekle</span>
                </div>
              </button>
              <Link
                to="/mizan/mana"
                onClick={() => setHizliAcik(false)}
                className="flex w-full items-center gap-3 rounded-md px-2.5 py-2.5 text-left text-sm transition-colors hover:bg-accent"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Heart className="h-4 w-4" />
                </span>
                <div className="flex flex-col">
                  <span className="font-medium text-foreground">Evrad / Çetele</span>
                  <span className="text-[11px] text-muted-foreground">Yeni şablon</span>
                </div>
              </Link>
              <Link
                to="/mizan/hedef/$id"
                params={{ id: "yeni" }}
                onClick={() => setHizliAcik(false)}
                className="flex w-full items-center gap-3 rounded-md px-2.5 py-2.5 text-left text-sm transition-colors hover:bg-accent"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Target className="h-4 w-4" />
                </span>
                <div className="flex flex-col">
                  <span className="font-medium text-foreground">Hedef</span>
                  <span className="text-[11px] text-muted-foreground">Yeni hedef tanımla</span>
                </div>
              </Link>
            </PopoverContent>
          </Popover>
        </div>

        {streakSayi > 0 && (
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-orange-500/20 bg-orange-500/10 px-2.5 py-1 text-[12px] font-medium text-orange-500">
            <Flame className="h-3.5 w-3.5" />
            <span>{streakSayi} gün üst üste</span>
          </div>
        )}
      </header>

      {/* 1) Haftalık denge */}
      <section className="mb-5 rounded-2xl border border-border bg-card p-4 sm:mb-6 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-medium text-foreground">Haftalık Denge</h2>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/mizan" className="gap-1 text-xs">
              Detay <ChevronRight className="h-3 w-3" />
            </Link>
          </Button>
        </div>
        <div className="flex flex-col items-center gap-5 md:flex-row md:items-center md:justify-between md:gap-8">
          <div className="shrink-0">
            <DengeHalkalari halkalar={[halkalar[0], halkalar[1], halkalar[2]]} />
          </div>
          <div className="flex w-full flex-col gap-2 sm:grid sm:grid-cols-3 sm:gap-2.5 md:max-w-md md:flex-1">
            {[
              { ad: "Mana", yuzde: halkalar[0].yuzde, renkVar: "--mana", ikon: Heart, to: "/mizan/mana" as const },
              { ad: "İlim", yuzde: halkalar[1].yuzde, renkVar: "--ilim", ikon: GraduationCap, to: "/mizan/ilim" as const },
              { ad: "Amel", yuzde: halkalar[2].yuzde, renkVar: "--amel", ikon: Target, to: "/mizan/amel" as const },
            ].map((a) => (
              <Link
                key={a.ad}
                to={a.to}
                className="group flex items-center justify-between gap-3 rounded-xl border border-border bg-background/40 p-3.5 transition-all hover:border-[color:var(--border)] active:scale-[0.98] sm:flex-col sm:items-start sm:gap-2 sm:p-3"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-lg sm:h-7 sm:w-7"
                    style={{
                      backgroundColor: `color-mix(in oklab, var(${a.renkVar}) 18%, transparent)`,
                      color: `var(${a.renkVar})`,
                    }}
                  >
                    <a.ikon className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                  </span>
                  <span className="text-sm font-medium text-foreground sm:text-xs">{a.ad}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xl font-semibold tracking-tight text-foreground sm:text-lg">{a.yuzde}%</span>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 2) Günlük çetele — yatay scroll */}
      <section className="mb-5 sm:mb-6">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-medium text-foreground">
              Günün Çetelesi
            </h2>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/mizan/mana" className="gap-1 text-xs">
              Tümü <ChevronRight className="h-3 w-3" />
            </Link>
          </Button>
        </div>
        {bugunSablonlar.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card/40 p-6 text-center">
            <p className="text-sm">Henüz evrad eklenmemiş.</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Mana sayfasından başlangıç paketini yükleyebilirsin.
            </p>
            <Button size="sm" variant="outline" asChild className="mt-3">
              <Link to="/mizan/mana" className="gap-1 text-xs">
                <Plus className="h-3 w-3" /> Evrad ekle
              </Link>
            </Button>
          </div>
        ) : (
          <div className="-mx-4 overflow-x-auto overscroll-x-contain px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:px-0">
            <div className="flex snap-x snap-mandatory gap-3 pb-1 pr-4 sm:pr-0">
              {bugunSablonlar.map((s) => {
                const ikili = s.birim === "ikili";
                const haftalik = s.hedef_tipi === "haftalik";
                const bugunToplam = gunToplami(kayitlar, s.id, bugunStr);
                const haftaSum = haftaToplami(kayitlar, s.id);
                const hedef = Number(s.hedef_deger);
                const tamam = haftalik ? haftaSum >= hedef : bugunToplam >= hedef;
                const haftaGunleriDoluluk = haftaGunleriArr.map((g) =>
                  gunToplami(kayitlar, s.id, tarihFormat(g)) > 0 ? 1 : 0,
                );
                const seri = haftaGunleriDoluluk.filter((g) => g === 1).length;

                const tikla = async () => {
                  if (ikili) {
                    if (bugunToplam > 0) {
                      const k = kayitlar.find(
                        (kk) => kk.sablon_id === s.id && kk.tarih === bugunStr,
                      );
                      if (k) await sil.mutateAsync(k.id);
                    } else {
                      await ekle.mutateAsync({
                        sablon_id: s.id,
                        tarih: bugunStr,
                        miktar: 1,
                      });
                    }
                  } else {
                    await ekle.mutateAsync({
                      sablon_id: s.id,
                      tarih: bugunStr,
                      miktar: 1,
                    });
                  }
                };

                return (
                  <button
                    key={s.id}
                    onClick={tikla}
                    className="flex w-[200px] shrink-0 snap-start flex-col gap-2.5 rounded-xl border border-border bg-card p-3.5 text-left transition-all hover:border-[var(--mana)]/40 active:scale-[0.97] sm:w-[180px] sm:p-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate text-sm font-medium text-foreground sm:text-xs">
                        {s.ad}
                      </span>
                      {tamam ? (
                        <CheckCircle2 className="h-[18px] w-[18px] text-emerald-400 sm:h-4 sm:w-4" />
                      ) : (
                        <Circle className="h-[18px] w-[18px] text-muted-foreground/40 sm:h-4 sm:w-4" />
                      )}
                    </div>
                    <div className="flex gap-1">
                      {haftaGunleriDoluluk.map((g, i) => (
                        <div
                          key={i}
                          className={cn(
                            "flex h-6 flex-1 items-center justify-center rounded text-[10px] sm:h-5 sm:text-[9px]",
                            g
                              ? alanRenk["mana"] + " text-background"
                              : "bg-muted/40 text-muted-foreground/50",
                          )}
                        >
                          {gunEtiket[i]}
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground sm:text-[10px]">
                      <span>
                        {haftalik
                          ? `${haftaSum}/${hedef} hafta`
                          : ikili
                            ? bugunToplam > 0
                              ? "bugün ✓"
                              : "bugün —"
                            : `${bugunToplam}/${hedef} ${s.birim}`}
                      </span>
                      <span className="font-medium text-foreground">{seri}/7</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* 3) Bugünün programı */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-medium text-foreground">Bugünün Programı</h2>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/takvim" className="gap-1 text-xs">
              Takvim <ChevronRight className="h-3 w-3" />
            </Link>
          </Button>
        </div>

        {bugunOlaylari.length === 0 && bugunGorevleri.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card/40 p-6 text-center">
            <p className="text-sm">Bugün için planlanmış bir şey yok.</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Takvime etkinlik veya görev ekleyebilirsin.
            </p>
            <Button size="sm" variant="outline" asChild className="mt-3">
              <Link to="/takvim" className="gap-1 text-xs">
                <CalendarPlus className="h-3 w-3" /> Takvime git
              </Link>
            </Button>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {bugunOlaylari.map((o) => (
              <li
                key={`e-${o.id}-${o.olayBaslangic.getTime()}`}
                className="flex items-center gap-3 rounded-xl border border-border bg-card px-3.5 py-3 transition-all active:scale-[0.99]"
                style={{
                  borderLeftColor: `var(--${o.alan})`,
                  borderLeftWidth: 3,
                }}
              >
                <span className="flex w-14 shrink-0 flex-col text-[12px] font-medium text-foreground">
                  <span>
                    {o.tum_gun ? "Tüm gün" : format(o.olayBaslangic, "HH:mm")}
                  </span>
                  {!o.tum_gun && (
                    <span className="text-[10px] text-muted-foreground">
                      {format(o.olayBitis, "HH:mm")}
                    </span>
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px] font-medium text-foreground">
                    {o.baslik}
                  </div>
                  {(o.konum || o.aciklama) && (
                    <div className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-muted-foreground">
                      {o.konum && <MapPin className="h-3 w-3 shrink-0" />}
                      <span className="truncate">{o.konum ?? o.aciklama}</span>
                    </div>
                  )}
                </div>
                <span
                  className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium"
                  style={{
                    backgroundColor: `color-mix(in oklab, var(--${o.alan}) 18%, transparent)`,
                    color: `var(--${o.alan})`,
                  }}
                >
                  {ALAN_ETIKET[o.alan]}
                </span>
              </li>
            ))}
            {bugunGorevleri.map((g) => (
              <li
                key={`g-${g.id}`}
                className="flex items-center gap-3 rounded-xl border border-dashed border-border bg-card/60 px-3.5 py-3"
              >
                <Circle className="h-4 w-4 shrink-0 text-muted-foreground/60" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px] font-medium text-foreground">
                    {g.baslik}
                  </div>
                  <div className="text-[11px] text-muted-foreground">Görev · bugün</div>
                </div>
                <span
                  className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium"
                  style={{
                    backgroundColor: `color-mix(in oklab, var(--${g.alan}) 18%, transparent)`,
                    color: `var(--${g.alan})`,
                  }}
                >
                  {ALAN_ETIKET[g.alan]}
                </span>
              </li>
            ))}
          </ul>
        )}

        {yaklasanOlaylar.length > 0 && (
          <div className="mt-5">
            <h3 className="mb-2 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Yaklaşan
            </h3>
            <ul className="flex flex-col gap-1.5">
              {yaklasanOlaylar.map((o) => {
                const ne = isTomorrow(o.olayBaslangic)
                  ? "Yarın"
                  : format(o.olayBaslangic, "EEE d MMM", { locale: tr });
                return (
                  <li
                    key={`y-${o.id}-${o.olayBaslangic.getTime()}`}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-accent/40"
                  >
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: `var(--${o.alan})` }}
                    />
                    <span className="w-20 shrink-0 text-[12px] font-medium text-muted-foreground">
                      {ne}
                    </span>
                    <span className="w-12 shrink-0 text-[12px] text-muted-foreground">
                      {o.tum_gun ? "—" : format(o.olayBaslangic, "HH:mm")}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[13px] text-foreground">
                      {o.baslik}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
