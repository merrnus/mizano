import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, GraduationCap, Heart, Target } from "lucide-react";
import { useSablonlar, useHaftaKayitlari, haftaSablonOzet, gunToplami } from "@/lib/cetele-hooks";
import { haftaBaslangici, tarihFormat } from "@/lib/cetele-tarih";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/mizan/")({
  head: () => ({
    meta: [
      { title: "İstikamet — Üç Alanın Dengesi" },
      { name: "description", content: "Akademi, Dünyevi ve Maneviyat alanlarının özeti." },
    ],
  }),
  component: MizanHub,
});

function ManeviyatKart() {
  const haftaBas = haftaBaslangici(new Date());
  const { data: sablonlar = [] } = useSablonlar();
  const { data: kayitlar = [] } = useHaftaKayitlari(haftaBas);
  const maneviyat = sablonlar.filter((s) => s.alan === "maneviyat");
  const ozet = haftaSablonOzet(maneviyat, kayitlar, haftaBas);
  const yuzde = ozet.toplam > 0 ? Math.round((ozet.tamamlanan / ozet.toplam) * 100) : 0;

  const bugunStr = tarihFormat(new Date());
  const bugunGiris = maneviyat
    .filter((s) => s.hedef_tipi === "gunluk")
    .slice(0, 3)
    .map((s) => ({
      ad: s.ad,
      toplam: gunToplami(kayitlar, s.id, bugunStr),
      hedef: Number(s.hedef_deger),
      birim: s.birim,
    }));

  return (
    <Link
      to="/mizan/maneviyat"
      className="group flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-[var(--maneviyat)]/50"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{
              backgroundColor: "color-mix(in oklab, var(--maneviyat) 18%, transparent)",
              color: "var(--maneviyat)",
            }}
          >
            <Heart className="h-4 w-4" />
          </span>
          <h3 className="text-sm font-medium">Maneviyat</h3>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </div>
      <div>
        <div className="text-3xl font-semibold tracking-tight">{yuzde}%</div>
        <div className="text-[11px] text-muted-foreground">
          Bu hafta {ozet.tamamlanan}/{ozet.toplam} hedef
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        {bugunGiris.length === 0 ? (
          <div className="text-[11px] text-muted-foreground">Henüz evrad yok — eklemeye başla.</div>
        ) : (
          bugunGiris.map((g) => (
            <div key={g.ad} className="flex items-center justify-between text-[11px]">
              <span className="truncate text-muted-foreground">{g.ad}</span>
              <span
                className={
                  g.toplam >= g.hedef
                    ? "font-medium text-emerald-400"
                    : "text-muted-foreground"
                }
              >
                {g.toplam}/{g.hedef} {g.birim !== "ikili" && g.birim}
              </span>
            </div>
          ))
        )}
      </div>
    </Link>
  );
}

function StatikKart({
  alan,
  baslik,
  yuzde,
  alt,
  detay,
  to,
  ikon: Ikon,
  renkVar,
}: {
  alan: string;
  baslik: string;
  yuzde: number;
  alt: string;
  detay: { ad: string; deger: string }[];
  to: "/mizan/akademi" | "/mizan/dunyevi";
  ikon: typeof GraduationCap;
  renkVar: string;
}) {
  return (
    <Link
      to={to}
      className="group flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-[color:var(--border)]"
      style={{ ["--hover" as string]: `var(${renkVar})` }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{
              backgroundColor: `color-mix(in oklab, var(${renkVar}) 18%, transparent)`,
              color: `var(${renkVar})`,
            }}
          >
            <Ikon className="h-4 w-4" />
          </span>
          <h3 className="text-sm font-medium">{baslik}</h3>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </div>
      <div>
        <div className="text-3xl font-semibold tracking-tight">{yuzde}%</div>
        <div className="text-[11px] text-muted-foreground">{alt}</div>
      </div>
      <div className="flex flex-col gap-1.5">
        {detay.map((d) => (
          <div key={d.ad} className="flex items-center justify-between text-[11px]">
            <span className="truncate text-muted-foreground">{d.ad}</span>
            <span className="text-foreground">{d.deger}</span>
          </div>
        ))}
      </div>
    </Link>
  );
}

function MizanHub() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      <header className="mb-6">
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">İstikamet</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
          Üç Alanın Dengesi
        </h1>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <ManeviyatKart />
        <StatikKart
          alan="akademi"
          baslik="Akademi"
          yuzde={58}
          alt="3 aktif ders, 1 borç"
          detay={[
            { ad: "BIL 305", deger: "12 May" },
            { ad: "BIL 412 (borç)", deger: "18 May" },
            { ad: "BIL 320", deger: "10 May" },
          ]}
          to="/mizan/akademi"
          ikon={GraduationCap}
          renkVar="--akademi"
        />
        <StatikKart
          alan="dunyevi"
          baslik="Dünyevi"
          yuzde={40}
          alt="4 aktif hedef"
          detay={[
            { ad: "CCNA", deger: "45%" },
            { ad: "Linux LFCS", deger: "25%" },
            { ad: "Docker & K8s", deger: "60%" },
          ]}
          to="/mizan/dunyevi"
          ikon={Target}
          renkVar="--dunyevi"
        />
      </div>
    </div>
  );
}