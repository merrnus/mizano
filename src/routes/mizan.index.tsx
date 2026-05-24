import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import { BookOpen, Hammer, Sprout } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import {
  useSablonlar,
  useHaftaKayitlari,
  useUcAylikKayitlari,
  haftaSablonOzet,
} from "@/lib/cetele-hooks";
import { haftaBaslangici } from "@/lib/cetele-tarih";
import { IstikametKart } from "@/components/mizan/istikamet-kart";
import { IstikametRozeti, rozetiHesapla } from "@/components/mizan/istikamet-rozeti";
import { useAuth } from "@/lib/auth-context";
import { useAmelKurslar, useTumAmelModuller } from "@/lib/amel-hooks";
import { useDersler, useSinavlar } from "@/lib/ilim-hooks";
import { amelYuzdesi, ilimYuzdesi } from "@/lib/istikamet-yuzde";
import { StreakIsiHaritasi } from "@/components/mizan/hedef/streak-isi-haritasi";
import type { CeteleAlan } from "@/lib/cetele-tipleri";

export const Route = createFileRoute("/mizan/")({
  head: () => ({
    meta: [
      { title: "İstikamet — Mana, İlim, Amel" },
      { name: "description", content: "Üç alanın dengesi: kalbin, aklın ve elin yolu." },
    ],
  }),
  component: MizanHub,
});

function MizanHub() {
  const { user } = useAuth();
  const [simdi, setSimdi] = React.useState(() => new Date());
  React.useEffect(() => {
    const id = setInterval(() => setSimdi(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  const haftaBas = haftaBaslangici(simdi);
  const { data: sablonlar = [] } = useSablonlar();
  const { data: kayitlar = [] } = useHaftaKayitlari(haftaBas);
  const sablonIds = React.useMemo(() => sablonlar.map((s) => s.id), [sablonlar]);
  const { data: ucAylik = [] } = useUcAylikKayitlari(sablonIds);
  const { data: amelKurslar = [] } = useAmelKurslar();
  const { data: amelModuller = [] } = useTumAmelModuller();
  const { data: dersler = [] } = useDersler();
  const { data: sinavlar = [] } = useSinavlar();

  const yuzdeHesapla = (alan: "mana" | "ilim" | "amel"): number => {
    const sb = sablonlar.filter((s) => s.alan === alan);
    if (sb.length === 0) return 0;
    const o = haftaSablonOzet(sb, kayitlar, haftaBas);
    return o.toplam > 0 ? Math.round((o.tamamlanan / o.toplam) * 100) : 0;
  };

  const manaYuzde = yuzdeHesapla("mana");
  const ilimYuzdeRaw = React.useMemo(
    () => ilimYuzdesi(dersler, sinavlar),
    [dersler, sinavlar],
  );
  const ilimYuzde = ilimYuzdeRaw ?? 0;
  const amelYuzde = React.useMemo(
    () => amelYuzdesi(amelKurslar, amelModuller),
    [amelKurslar, amelModuller],
  );

  const veriler = [
    { ad: "Mana", yuzde: manaYuzde, renkVar: "--mana" },
    { ad: "İlim", yuzde: ilimYuzde, renkVar: "--ilim" },
    { ad: "Amel", yuzde: amelYuzde, renkVar: "--amel" },
  ];

  const rozet = rozetiHesapla(veriler);

  const kartlar = [
    { ad: "Mana", yuzde: manaYuzde, metin: `${manaYuzde}%`, ikon: Sprout, renkVar: "--mana", to: "/mizan/mana" as const },
    {
      ad: "İlim",
      yuzde: ilimYuzde,
      metin: ilimYuzdeRaw === null ? "—" : `${ilimYuzde}%`,
      ikon: BookOpen,
      renkVar: "--ilim",
      to: "/mizan/ilim" as const,
    },
    { ad: "Amel", yuzde: amelYuzde, metin: `${amelYuzde}%`, ikon: Hammer, renkVar: "--amel", to: "/mizan/amel" as const },
  ];

  // Haftalık özet — tamamlanan / toplam per alan
  const haftalikOzetler = (["mana", "ilim", "amel"] as CeteleAlan[]).map((alan) => {
    const sb = sablonlar.filter((s) => s.alan === alan);
    const o = haftaSablonOzet(sb, kayitlar, haftaBas);
    return { alan, ad: alan === "mana" ? "Mana" : alan === "ilim" ? "İlim" : "Amel", ...o };
  });
  const toplamTamamlanan = haftalikOzetler.reduce((a, b) => a + b.tamamlanan, 0);
  const toplamHedef = haftalikOzetler.reduce((a, b) => a + b.toplam, 0);
  const enGuclu = [...haftalikOzetler]
    .filter((o) => o.toplam > 0)
    .sort(
      (a, b) =>
        b.tamamlanan / Math.max(1, b.toplam) - a.tamamlanan / Math.max(1, a.toplam),
    )[0];
  const enZayif = [...haftalikOzetler]
    .filter((o) => o.toplam > 0)
    .sort(
      (a, b) =>
        a.tamamlanan / Math.max(1, a.toplam) - b.tamamlanan / Math.max(1, b.toplam),
    )[0];

  const saat = simdi.getHours();
  const selamlama =
    saat < 5
      ? "Hayırlı geceler"
      : saat < 12
      ? "Günaydın"
      : saat < 17
      ? "Hayırlı günler"
      : saat < 21
      ? "İyi akşamlar"
      : "Hayırlı akşamlar";
  const isim =
    (user?.user_metadata?.full_name as string | undefined) ??
    user?.email?.split("@")[0] ??
    null;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      {/* Selamlama */}
      <header className="mb-8 sm:mb-10">
        <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          {format(simdi, "EEEE, d MMMM yyyy", { locale: tr })}
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
          Haftalık Denge Raporu
        </h1>
        <p className="mt-1.5 text-xs text-muted-foreground">
          {selamlama}
          {isim ? `, ${isim}` : ""} — kalbin, aklın ve elin bu hafta nerede?
        </p>
      </header>

      {/* Denge halkaları */}
      <div className="mb-8 grid gap-4 sm:gap-5 md:grid-cols-3">
        {kartlar.map((k, i) => (
          <IstikametKart
            key={k.ad}
            ad={k.ad}
            yuzde={k.yuzde}
            metin={k.metin}
            ikon={k.ikon}
            renkVar={k.renkVar}
            to={k.to}
            rozet={
              i === rozet.index ? (
                <IstikametRozeti metin={rozet.metin} renk={rozet.renk} />
              ) : undefined
            }
          />
        ))}
      </div>

      {/* Bu haftanın özeti */}
      <section className="mb-10">
        <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          Bu Haftanın Özeti
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Toplam
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">
              {toplamTamamlanan}
              <span className="text-base text-muted-foreground">/{toplamHedef}</span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {toplamHedef === 0
                ? "Şablon yok"
                : `${Math.round((toplamTamamlanan / toplamHedef) * 100)}% tamamlandı`}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              En güçlü alan
            </p>
            <p
              className="mt-1 text-2xl font-semibold"
              style={{
                color: enGuclu
                  ? `var(--${enGuclu.alan})`
                  : "var(--muted-foreground)",
              }}
            >
              {enGuclu?.ad ?? "—"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {enGuclu
                ? `${enGuclu.tamamlanan}/${enGuclu.toplam}`
                : "Veri yok"}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Dikkat
            </p>
            <p
              className="mt-1 text-2xl font-semibold"
              style={{
                color: enZayif
                  ? `var(--${enZayif.alan})`
                  : "var(--muted-foreground)",
              }}
            >
              {enZayif?.ad ?? "—"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {enZayif
                ? `${enZayif.tamamlanan}/${enZayif.toplam}`
                : "Veri yok"}
            </p>
          </div>
        </div>
      </section>

      {/* Streak ısı haritası */}
      <section className="mb-6">
        <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          Son 90 Gün
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {(["mana", "ilim", "amel"] as CeteleAlan[]).map((alan) => {
            const alanSablonIds = new Set(
              sablonlar.filter((s) => s.alan === alan).map((s) => s.id),
            );
            const alanKayitlar = ucAylik.filter((k) =>
              alanSablonIds.has(k.sablon_id),
            );
            return (
              <div
                key={alan}
                className="rounded-2xl border border-border bg-card p-4"
              >
                <p
                  className="mb-3 text-xs font-semibold uppercase tracking-wider"
                  style={{ color: `var(--${alan})` }}
                >
                  {alan === "mana" ? "Mana" : alan === "ilim" ? "İlim" : "Amel"}
                </p>
                <StreakIsiHaritasi
                  kayitlar={alanKayitlar}
                  alan={alan}
                  gunSayisi={84}
                />
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}