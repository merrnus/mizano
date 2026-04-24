import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import { BookOpen, Hammer, Sprout } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { useSablonlar, useHaftaKayitlari, haftaSablonOzet } from "@/lib/cetele-hooks";
import { haftaBaslangici } from "@/lib/cetele-tarih";
import { IstikametKart } from "@/components/mizan/istikamet-kart";
import { IstikametRozeti, rozetiHesapla } from "@/components/mizan/istikamet-rozeti";
import { useAuth } from "@/lib/auth-context";

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

  const yuzdeHesapla = (alan: "mana" | "ilim" | "amel"): number => {
    const sb = sablonlar.filter((s) => s.alan === alan);
    if (sb.length === 0) return 0;
    const o = haftaSablonOzet(sb, kayitlar, haftaBas);
    return o.toplam > 0 ? Math.round((o.tamamlanan / o.toplam) * 100) : 0;
  };

  // Mana gerçek veri; İlim & Amel henüz placeholder (statik hedefler)
  const manaYuzde = yuzdeHesapla("mana");
  const ilimYuzde = 58;
  const amelYuzde = 32;

  const veriler = [
    { ad: "Mana", yuzde: manaYuzde, renkVar: "--mana" },
    { ad: "İlim", yuzde: ilimYuzde, renkVar: "--ilim" },
    { ad: "Amel", yuzde: amelYuzde, renkVar: "--amel" },
  ];

  const rozet = rozetiHesapla(veriler);

  const kartlar = [
    { ad: "Mana", yuzde: manaYuzde, ikon: Sprout, renkVar: "--mana", to: "/mizan/mana" as const },
    { ad: "İlim", yuzde: ilimYuzde, ikon: BookOpen, renkVar: "--ilim", to: "/mizan/ilim" as const },
    { ad: "Amel", yuzde: amelYuzde, ikon: Hammer, renkVar: "--amel", to: "/mizan/amel" as const },
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
      {/* Selamlama */}
      <header className="mb-8 sm:mb-10">
        <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          {format(simdi, "EEEE, d MMMM yyyy", { locale: tr })}
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
          {selamlama}
          {isim ? <span className="text-muted-foreground">, {isim}</span> : null}
        </h1>
        <p className="mt-1.5 text-xs text-muted-foreground">
          Kalbin, aklın ve elin — bu hafta neredesin?
        </p>
      </header>

      {/* Denge halkaları */}
      <div className="mb-8 grid gap-4 sm:gap-5 md:grid-cols-3">
        {kartlar.map((k, i) => (
          <IstikametKart
            key={k.ad}
            ad={k.ad}
            yuzde={k.yuzde}
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
    </div>
  );
}