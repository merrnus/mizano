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
} from "lucide-react";
import { DengeHalkalari } from "@/components/mizan/denge-halkalari";
import { Button } from "@/components/ui/button";
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

const program = [
  {
    bolum: "Gündüz — Üniversite",
    ikon: GraduationCap,
    renkVar: "--ilim",
    olaylar: [
      { saat: "09:00", ad: "BIL 305 — Ağ Yönetimi" },
      { saat: "11:00", ad: "BIL 412 — İşletim Sistemleri (borç)" },
      { saat: "14:00", ad: "Lab raporu" },
    ],
  },
  {
    bolum: "Akşam — Sohbet & Görüşmeler",
    ikon: Heart,
    renkVar: "--mana",
    olaylar: [
      { saat: "18:30", ad: "Akşam evradı" },
      { saat: "20:00", ad: "Risale dersi — Lem'alar" },
      { saat: "21:30", ad: "Ahmet Y. — teke tek görüşme" },
    ],
  },
];

const alanRenk: Record<string, string> = {
  mana: "bg-[var(--mana)]",
  ilim: "bg-[var(--ilim)]",
  amel: "bg-[var(--amel)]",
};

function Dashboard() {
  const gunEtiket = ["P", "S", "Ç", "P", "C", "C", "P"];
  const [bugun, setBugun] = React.useState<string | null>(null);
  const [selam, setSelam] = React.useState<string>("");
  const haftaBas = React.useMemo(() => haftaBaslangici(new Date()), []);
  const haftaGunleriArr = React.useMemo(() => haftaGunleri(haftaBas), [haftaBas]);
  const { data: sablonlar = [] } = useSablonlar();
  const { data: kayitlar = [] } = useHaftaKayitlari(haftaBas);
  const ekle = useKayitEkle();
  const sil = useKayitSil();
  const bugunStr = tarihFormat(new Date());

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
        </div>
        <div className="flex flex-col gap-3 sm:grid sm:grid-cols-2">
          {program.map((p) => (
            <div
              key={p.bolum}
              className="rounded-xl border border-border bg-card p-4 sm:p-4"
            >
              <div className="mb-3 flex items-center gap-2.5">
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-md sm:h-6 sm:w-6"
                  style={{
                    backgroundColor: `color-mix(in oklab, var(${p.renkVar}) 18%, transparent)`,
                    color: `var(${p.renkVar})`,
                  }}
                >
                  <p.ikon className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                </span>
                <h3 className="text-sm font-medium text-foreground sm:text-sm">{p.bolum}</h3>
              </div>
              <ul className="flex flex-col gap-2">
                {p.olaylar.map((o) => (
                  <li
                    key={o.ad}
                    className="flex items-center gap-3 rounded-lg border border-border/60 bg-background/40 px-3 py-2.5 sm:py-2"
                  >
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="w-12 text-[13px] font-medium text-foreground sm:text-xs">
                      {o.saat}
                    </span>
                    <span className="flex-1 truncate text-[13px] text-muted-foreground sm:text-xs">
                      {o.ad}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
