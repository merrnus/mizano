import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Sun, Sunset, Moon } from "lucide-react";
import { GorunumSegment } from "@/components/mizan/dashboard/gorunum-segment";
import { useSablonlar, useHaftaKayitlari, haftaSablonOzet } from "@/lib/cetele-hooks";
import { haftaBaslangici } from "@/lib/cetele-tarih";
import { BugunAkisi } from "@/components/mizan/dashboard/bugun-akisi";
import { BugunProgram } from "@/components/mizan/dashboard/bugun-program";
import { BriefRings } from "@/components/mizan/dashboard/brief-rings";
import { BugunFab } from "@/components/mizan/dashboard/bugun-fab";
import { EtkinlikHizliDialog } from "@/components/mizan/takvim/etkinlik-hizli-dialog";
import type { CeteleAlan } from "@/lib/cetele-tipleri";
import { useAmelKurslar, useTumAmelModuller } from "@/lib/amel-hooks";
import { useDersler, useSinavlar } from "@/lib/ilim-hooks";
import { amelYuzdesi, ilimYuzdesi } from "@/lib/istikamet-yuzde";
import { useAuth } from "@/lib/auth-context";
import { useNavigate } from "@tanstack/react-router";
import { useNow, useBugunBasi } from "@/lib/use-now";

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
  const navigate = useNavigate();
  const simdi = useNow();
  const bugun = useBugunBasi(simdi);

  const haftaBas = haftaBaslangici(simdi);
  const { data: sablonlar = [] } = useSablonlar();
  const { data: kayitlar = [] } = useHaftaKayitlari(haftaBas);
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

  const rozetler: Array<{
    ad: string;
    yuzde: number;
    metin: string;
    renkVar: string;
    alan: CeteleAlan;
  }> = [
    { ad: "Mana", yuzde: manaYuzde, metin: `${manaYuzde}%`, renkVar: "--mana", alan: "mana" },
    {
      ad: "İlim",
      yuzde: ilimYuzde,
      metin: ilimYuzdeRaw === null ? "—" : `${ilimYuzde}%`,
      renkVar: "--ilim",
      alan: "ilim",
    },
    { ad: "Amel", yuzde: amelYuzde, metin: `${amelYuzde}%`, renkVar: "--amel", alan: "amel" },
  ];

  const [etkinlikDialogAcik, setEtkinlikDialogAcik] = React.useState(false);
  const [gorunum, setGorunum] = React.useState<"program" | "akis">(() => {
    if (typeof window === "undefined") return "program";
    return (localStorage.getItem("bugun-gorunum") as "program" | "akis") ?? "program";
  });
  React.useEffect(() => {
    try {
      localStorage.setItem("bugun-gorunum", gorunum);
    } catch {}
  }, [gorunum]);

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
  // Saate göre yumuşak ikon
  const ZamanIkon =
    saat >= 5 && saat < 17 ? Sun : saat >= 17 && saat < 21 ? Sunset : Moon;
  const zamanIkonRenk =
    saat >= 5 && saat < 12
      ? "var(--amel)" // sabah ışığı — sıcak altın
      : saat >= 12 && saat < 17
        ? "var(--amel)"
        : saat >= 17 && saat < 21
          ? "var(--amel)" // gün batımı
          : "var(--mana)"; // gece — sapphire
  const isim =
    (user?.user_metadata?.full_name as string | undefined) ??
    user?.email?.split("@")[0] ??
    null;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-5 pb-40 sm:px-6 sm:py-8 sm:pb-28">
      {/* App-bar: selamlama — mobilde halkalar alta düşer, lg+ ayrı bölümde büyür */}
      <header className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            {format(simdi, "EEEE, d MMMM", { locale: tr })}
          </p>
          <h1 className="mt-0.5 inline-flex items-center gap-2 text-lg font-semibold tracking-tight sm:text-xl">
            <ZamanIkon
              className="h-4 w-4 shrink-0 sm:h-5 sm:w-5"
              style={{ color: zamanIkonRenk }}
              aria-hidden="true"
            />
            <span className="truncate">
              {selamlama}
              {isim ? <span className="text-muted-foreground">, {isim}</span> : null}
            </span>
          </h1>
        </div>
        <BriefRings
          ogeler={rozetler}
          onAc={(a) =>
            navigate({
              to: a === "mana" ? "/mizan/mana" : a === "ilim" ? "/mizan/ilim" : "/mizan/amel",
            })
          }
          className="inline-flex shrink-0 items-center gap-0.5"
          kompakt
        />
      </header>

      {gorunum === "program" ? (
        <BugunProgram simdi={simdi} gorunum={gorunum} onGorunumDegis={setGorunum} />
      ) : (
        <>
          <GorunumSegment gorunum={gorunum} onDegis={setGorunum} />
          <BugunAkisi simdi={simdi} />
        </>
      )}

      <EtkinlikHizliDialog
        acik={etkinlikDialogAcik}
        onOpenChange={setEtkinlikDialogAcik}
        varsayilanBaslangic={bugun}
      />

      <BugunFab onEtkinlik={() => setEtkinlikDialogAcik(true)} />
    </div>
  );
}

