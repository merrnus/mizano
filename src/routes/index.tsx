import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { useSablonlar, useHaftaKayitlari, haftaSablonOzet } from "@/lib/cetele-hooks";
import { haftaBaslangici } from "@/lib/cetele-tarih";
import { BugunCetelesi } from "@/components/mizan/dashboard/bugun-cetelesi";
import { BugunZamanCizelgesi } from "@/components/mizan/dashboard/bugun-zaman-cizelgesi";
import { GelecekGunler } from "@/components/mizan/dashboard/gelecek-gunler";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Bugün — Mizan" },
      {
        name: "description",
        content: "Haftalık denge, günün çetelesi, bugünün programı ve gelecek günler.",
      },
      { property: "og:title", content: "Bugün — Mizan" },
      {
        property: "og:description",
        content: "Mana, ilim ve amel — üç alanın haftalık dengesi tek bakışta.",
      },
    ],
  }),
  component: AnaDashboard,
});

function AnaDashboard() {
  const { user } = useAuth();
  const [simdi, setSimdi] = React.useState(() => new Date());
  React.useEffect(() => {
    const id = setInterval(() => setSimdi(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const haftaBas = haftaBaslangici(simdi);
  const { data: sablonlar = [] } = useSablonlar();
  const { data: kayitlar = [] } = useHaftaKayitlari(haftaBas);

  const yuzdeHesapla = (alan: "mana" | "ilim" | "amel"): number => {
    const sb = sablonlar.filter((s) => s.alan === alan);
    if (sb.length === 0) return 0;
    const o = haftaSablonOzet(sb, kayitlar, haftaBas);
    return o.toplam > 0 ? Math.round((o.tamamlanan / o.toplam) * 100) : 0;
  };

  const manaYuzde = yuzdeHesapla("mana");
  const ilimYuzde = 58;
  const amelYuzde = 32;

  const rozetler = [
    { ad: "Mana", yuzde: manaYuzde, renkVar: "--mana", to: "/mizan/mana" as const },
    { ad: "İlim", yuzde: ilimYuzde, renkVar: "--ilim", to: "/mizan/ilim" as const },
    { ad: "Amel", yuzde: amelYuzde, renkVar: "--amel", to: "/mizan/amel" as const },
  ];

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
      {/* Selamlama + kompakt denge rozetleri */}
      <header className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            {format(simdi, "EEEE, d MMMM yyyy", { locale: tr })}
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            {selamlama}
            {isim ? <span className="text-muted-foreground">, {isim}</span> : null}
          </h1>
        </div>
        <Link
          to="/mizan"
          className="group inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-card px-1 py-1 text-xs transition-colors hover:border-border/80"
          aria-label="İstikamet detayına git"
        >
          {rozetler.map((r) => (
            <span
              key={r.ad}
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1"
              style={{
                backgroundColor: `color-mix(in oklab, var(${r.renkVar}) 12%, transparent)`,
              }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: `var(${r.renkVar})` }}
              />
              <span className="text-muted-foreground">{r.ad}</span>
              <span
                className="font-semibold tabular-nums"
                style={{ color: `var(${r.renkVar})` }}
              >
                {r.yuzde}%
              </span>
            </span>
          ))}
        </Link>
      </header>

      {/* Bugünün çetelesi + zaman çizelgesi */}
      <div className="mb-6 grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <BugunCetelesi simdi={simdi} />
        <BugunZamanCizelgesi simdi={simdi} />
      </div>

      {/* Gelecek günler */}
      <GelecekGunler simdi={simdi} />
    </div>
  );
}
