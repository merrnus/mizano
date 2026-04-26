import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Sun, Sunset, Moon } from "lucide-react";
import { useSablonlar, useHaftaKayitlari, haftaSablonOzet } from "@/lib/cetele-hooks";
import { haftaBaslangici } from "@/lib/cetele-tarih";
import { BugunCetelesi } from "@/components/mizan/dashboard/bugun-cetelesi";
import { BugunZamanCizelgesi } from "@/components/mizan/dashboard/bugun-zaman-cizelgesi";
import { BugunGorevleri } from "@/components/mizan/dashboard/bugun-gorevleri";
import { GelecekGunler } from "@/components/mizan/dashboard/gelecek-gunler";
import { EvdekilerWidget } from "@/components/mizan/dashboard/evdekiler-widget";
import { BugununMufredati } from "@/components/mizan/dashboard/bugunun-mufredati";
import { AlanDetaySheet } from "@/components/mizan/alan-detay-sheet";
import { GorevDialog } from "@/components/mizan/takvim/gorev-dialog";
import type { CeteleAlan } from "@/lib/cetele-tipleri";
import { useAmelKurslar, useTumAmelModuller } from "@/lib/amel-hooks";
import { kursIlerleme } from "@/lib/amel-tipleri";
import type { TakvimGorev } from "@/lib/takvim-tipleri";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

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
  const { data: amelKurslar = [] } = useAmelKurslar();
  const { data: amelModuller = [] } = useTumAmelModuller();

  const yuzdeHesapla = (alan: "mana" | "ilim" | "amel"): number => {
    const sb = sablonlar.filter((s) => s.alan === alan);
    if (sb.length === 0) return 0;
    const o = haftaSablonOzet(sb, kayitlar, haftaBas);
    return o.toplam > 0 ? Math.round((o.tamamlanan / o.toplam) * 100) : 0;
  };

  const manaYuzde = yuzdeHesapla("mana");
  const ilimYuzde = 58;

  // Amel: izlenen kursların ortalama ilerleme yüzdesi
  const amelYuzde = React.useMemo(() => {
    const izlenen = amelKurslar.filter((k) => k.durum === "aktif");
    if (izlenen.length === 0) return 0;
    const toplam = izlenen.reduce((acc, k) => {
      const km = amelModuller.filter((m) => m.kurs_id === k.id);
      return acc + kursIlerleme(km);
    }, 0);
    return Math.round(toplam / izlenen.length);
  }, [amelKurslar, amelModuller]);

  const rozetler: Array<{ ad: string; yuzde: number; renkVar: string; alan: CeteleAlan }> = [
    { ad: "Mana", yuzde: manaYuzde, renkVar: "--mana", alan: "mana" },
    { ad: "İlim", yuzde: ilimYuzde, renkVar: "--ilim", alan: "ilim" },
    { ad: "Amel", yuzde: amelYuzde, renkVar: "--amel", alan: "amel" },
  ];

  const [acikAlan, setAcikAlan] = React.useState<CeteleAlan | null>(null);
  const acikYuzde =
    acikAlan === "mana" ? manaYuzde : acikAlan === "ilim" ? ilimYuzde : amelYuzde;

  const [gorevDialogAcik, setGorevDialogAcik] = React.useState(false);
  const [duzenlenenGorev, setDuzenlenenGorev] = React.useState<TakvimGorev | null>(null);

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
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      {/* Selamlama + kompakt denge rozetleri */}
      <header className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            {format(simdi, "EEEE, d MMMM yyyy", { locale: tr })}
          </p>
          <h1 className="mt-2 inline-flex items-center gap-2.5 text-2xl font-semibold tracking-tight sm:text-3xl">
            <ZamanIkon
              className="h-6 w-6 shrink-0 sm:h-7 sm:w-7"
              style={{ color: zamanIkonRenk }}
              aria-hidden="true"
            />
            <span>
              {selamlama}
              {isim ? <span className="text-muted-foreground">, {isim}</span> : null}
            </span>
          </h1>
        </div>
        <div className="inline-flex shrink-0 items-center gap-2 rounded-full border border-border bg-card p-1.5">
          {rozetler.map((r) => (
            <button
              key={r.ad}
              type="button"
              onClick={() => setAcikAlan(r.alan)}
              className={cn(
                "group inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm transition-all hover:scale-[1.03] hover:brightness-110 active:scale-[0.98]",
                r.yuzde >= 100 && "mizan-pill-complete",
              )}
              style={{
                backgroundColor: `color-mix(in oklab, var(${r.renkVar}) 14%, transparent)`,
                boxShadow: `inset 0 0 0 1px color-mix(in oklab, var(${r.renkVar}) 22%, transparent)`,
                ["--pill-glow" as string]: `var(${r.renkVar})`,
              }}
              aria-label={`${r.ad} detayını aç`}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{
                  backgroundColor: `var(${r.renkVar})`,
                  boxShadow: `0 0 8px var(${r.renkVar})`,
                }}
              />
              <span className="text-muted-foreground">{r.ad}</span>
              <span
                className="font-semibold tabular-nums"
                style={{ color: `var(${r.renkVar})` }}
              >
                {r.yuzde}%
              </span>
            </button>
          ))}
        </div>
      </header>

      {/* Bugünün çetelesi + zaman çizelgesi */}
      <div className="mb-6 grid gap-6 lg:grid-cols-[minmax(0,4fr)_minmax(0,5fr)_minmax(0,3fr)]">
        <BugunCetelesi simdi={simdi} />
        <BugunZamanCizelgesi simdi={simdi} />
        <BugunGorevleri
          simdi={simdi}
          onYeni={() => {
            setDuzenlenenGorev(null);
            setGorevDialogAcik(true);
          }}
          onDuzenle={(g) => {
            setDuzenlenenGorev(g);
            setGorevDialogAcik(true);
          }}
        />
      </div>

      {/* Bugünün Müfredatı (Amel) */}
      <div className="mb-6">
        <BugununMufredati />
      </div>

      {/* Gelecek günler */}
      <GelecekGunler simdi={simdi} />

      {/* Bu hafta Evdekiler */}
      <EvdekilerWidget />

      <AlanDetaySheet
        alan={acikAlan}
        onOpenChange={(o) => !o && setAcikAlan(null)}
        yuzde={acikYuzde}
      />

      <GorevDialog
        acik={gorevDialogAcik}
        onOpenChange={(o) => {
          setGorevDialogAcik(o);
          if (!o) setDuzenlenenGorev(null);
        }}
        varsayilanVade={simdi}
        duzenle={duzenlenenGorev}
      />
    </div>
  );
}
