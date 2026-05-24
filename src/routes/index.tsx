import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Sun, Sunset, Moon } from "lucide-react";
import { useSablonlar, useHaftaKayitlari, haftaSablonOzet } from "@/lib/cetele-hooks";
import { haftaBaslangici } from "@/lib/cetele-tarih";
import { OdakKarti } from "@/components/mizan/dashboard/odak-karti";
import { GunlukChecklist } from "@/components/mizan/dashboard/gunluk-checklist";
import { BriefRings } from "@/components/mizan/dashboard/brief-rings";
import { BugunFab } from "@/components/mizan/dashboard/bugun-fab";
import { HavuzSheet } from "@/components/mizan/dashboard/havuz-sheet";
import { AlanDetaySheet } from "@/components/mizan/alan-detay-sheet";
import { EtkinlikHizliDialog } from "@/components/mizan/takvim/etkinlik-hizli-dialog";
import type { CeteleAlan } from "@/lib/cetele-tipleri";
import { useAmelKurslar, useTumAmelModuller } from "@/lib/amel-hooks";
import { useDersler, useSinavlar } from "@/lib/ilim-hooks";
import { amelYuzdesi, ilimYuzdesi } from "@/lib/istikamet-yuzde";
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

  // "bugun" referansı yalnızca tarih (gün) değiştiğinde yenilensin — "simdi"
  // her dakika yeni bir Date referansı oluyor, bu da prop drilling sırasında
  // child component'lerde gereksiz re-init'lere yol açıyor (özellikle dialog
  // formlarının sıfırlanması). Aşağıdaki memo, gün boyu aynı referansı tutar.
  const bugun = React.useMemo(() => {
    const d = new Date(simdi);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [
    simdi.getFullYear(),
    simdi.getMonth(),
    simdi.getDate(),
  ]);

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

  const [acikAlan, setAcikAlan] = React.useState<CeteleAlan | null>(null);
  const acikYuzde =
    acikAlan === "mana" ? manaYuzde : acikAlan === "ilim" ? ilimYuzde : amelYuzde;

  const [etkinlikDialogAcik, setEtkinlikDialogAcik] = React.useState(false);
  const [havuzAcik, setHavuzAcik] = React.useState(false);

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
    <div className="mx-auto w-full max-w-6xl px-4 py-5 pb-28 sm:px-6 sm:py-8">
      {/* App-bar: tek satır selamlama + mini halkalar */}
      <header className="mb-5 flex items-center justify-between gap-3 sm:mb-6">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            {format(simdi, "EEEE, d MMMM", { locale: tr })}
          </p>
          <h1 className="mt-1 inline-flex items-center gap-2 text-xl font-semibold tracking-tight sm:text-2xl">
            <ZamanIkon
              className="h-5 w-5 shrink-0 sm:h-6 sm:w-6"
              style={{ color: zamanIkonRenk }}
              aria-hidden="true"
            />
            <span className="truncate">
              {selamlama}
              {isim ? <span className="text-muted-foreground">, {isim}</span> : null}
            </span>
          </h1>
        </div>
        <BriefRings ogeler={rozetler} onAc={(a) => setAcikAlan(a)} />
      </header>

      {/* Odak — tek kart, şu an / sıradaki etkinlik */}
      <div className="mb-6">
        <OdakKarti simdi={simdi} />
      </div>

      {/* Bugünün Çetelesi — birleşik checklist */}
      <GunlukChecklist simdi={simdi} onHavuzAc={() => setHavuzAcik(true)} />

      <AlanDetaySheet
        alan={acikAlan}
        onOpenChange={(o) => !o && setAcikAlan(null)}
        yuzde={acikYuzde}
      />

      <EtkinlikHizliDialog
        acik={etkinlikDialogAcik}
        onOpenChange={setEtkinlikDialogAcik}
        varsayilanBaslangic={bugun}
      />

      <HavuzSheet
        acik={havuzAcik}
        onOpenChange={setHavuzAcik}
        simdi={simdi}
      />

      <BugunFab
        onEtkinlik={() => setEtkinlikDialogAcik(true)}
        onHavuz={() => setHavuzAcik(true)}
      />
    </div>
  );
}
