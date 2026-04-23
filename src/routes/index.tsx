import { createFileRoute, Link } from "@tanstack/react-router";
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
} from "lucide-react";
import { DengeHalkalari, DengeLegend } from "@/components/mizan/denge-halkalari";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Mizan — Komuta Merkezi" },
      {
        name: "description",
        content: "Haftalık denge halkası, günün çetelesi ve bugünün programı.",
      },
      { property: "og:title", content: "Mizan Komuta Merkezi" },
      {
        property: "og:description",
        content: "Maneviyat, akademi ve dünyevi alanların haftalık dengesi tek bakışta.",
      },
    ],
  }),
  component: Dashboard,
});

const halkalar = [
  { ad: "Maneviyat", yuzde: 72, renkVar: "--maneviyat", ikon: <Heart className="h-3 w-3" /> },
  { ad: "Akademi", yuzde: 58, renkVar: "--akademi", ikon: <GraduationCap className="h-3 w-3" /> },
  { ad: "Dünyevi", yuzde: 40, renkVar: "--dunyevi", ikon: <Target className="h-3 w-3" /> },
] as const;

const cetele = [
  { ad: "Sabah evradı", alan: "maneviyat", gunler: [1, 1, 1, 1, 0, 1, 1] },
  { ad: "Akşam evradı", alan: "maneviyat", gunler: [1, 1, 0, 1, 1, 1, 0] },
  { ad: "Cüz okuma", alan: "maneviyat", gunler: [1, 0, 1, 1, 1, 0, 1] },
  { ad: "CCNA — 30dk", alan: "dunyevi", gunler: [1, 1, 0, 0, 1, 1, 0] },
  { ad: "Linux pratik", alan: "dunyevi", gunler: [0, 1, 1, 0, 1, 0, 0] },
  { ad: "Spor", alan: "dunyevi", gunler: [1, 0, 1, 1, 0, 1, 1] },
  { ad: "Ders tekrarı", alan: "akademi", gunler: [1, 1, 1, 0, 1, 0, 1] },
];

const program = [
  {
    bolum: "Gündüz — Üniversite",
    ikon: GraduationCap,
    renkVar: "--akademi",
    olaylar: [
      { saat: "09:00", ad: "BIL 305 — Ağ Yönetimi" },
      { saat: "11:00", ad: "BIL 412 — İşletim Sistemleri (borç)" },
      { saat: "14:00", ad: "Lab raporu" },
    ],
  },
  {
    bolum: "Akşam — Sohbet & Görüşmeler",
    ikon: Heart,
    renkVar: "--maneviyat",
    olaylar: [
      { saat: "18:30", ad: "Akşam evradı" },
      { saat: "20:00", ad: "Risale dersi — Lem'alar" },
      { saat: "21:30", ad: "Ahmet Y. — teke tek görüşme" },
    ],
  },
];

const alanRenk: Record<string, string> = {
  maneviyat: "bg-[var(--maneviyat)]",
  akademi: "bg-[var(--akademi)]",
  dunyevi: "bg-[var(--dunyevi)]",
};

function Dashboard() {
  const gunEtiket = ["P", "S", "Ç", "P", "C", "C", "P"];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      {/* Üst başlık */}
      <header className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Komuta Merkezi
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Bugünün Dengesi
          </h1>
        </div>
        <div className="hidden text-right text-xs text-muted-foreground sm:block">
          <div>{new Date().toLocaleDateString("tr-TR", { weekday: "long" })}</div>
          <div className="font-medium text-foreground">
            {new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long" })}
          </div>
        </div>
      </header>

      {/* 1) Haftalık denge */}
      <section className="mb-6 rounded-2xl border border-border bg-card p-5 sm:p-6">
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
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-around">
          <DengeHalkalari halkalar={[halkalar[0], halkalar[1], halkalar[2]]} />
          <div className="flex flex-col gap-3 sm:max-w-xs">
            <DengeLegend halkalar={[...halkalar]} />
            <p className="text-center text-xs leading-relaxed text-muted-foreground sm:text-left">
              Bu hafta maneviyat tarafın güçlü. Dünyevi adımlarda biraz daha
              tutarlı olmak dengeyi tamamlar.
            </p>
          </div>
        </div>
      </section>

      {/* 2) Günlük çetele — yatay scroll */}
      <section className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-medium text-foreground">
              Günlük Çetele & Evrad
            </h2>
          </div>
          <span className="text-xs text-muted-foreground">Son 7 gün</span>
        </div>
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <div className="flex gap-3 pb-1">
            {cetele.map((c) => {
              const bugun = c.gunler[c.gunler.length - 1] === 1;
              const seri = c.gunler.filter((g) => g === 1).length;
              return (
                <div
                  key={c.ad}
                  className="flex w-[180px] shrink-0 flex-col gap-2 rounded-xl border border-border bg-card p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate text-xs font-medium text-foreground">
                      {c.ad}
                    </span>
                    {bugun ? (
                      <CheckCircle2
                        className="h-4 w-4"
                        style={{ color: `var(--${c.alan})` }}
                      />
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground/40" />
                    )}
                  </div>
                  <div className="flex gap-1">
                    {c.gunler.map((g, i) => (
                      <div
                        key={i}
                        className={cn(
                          "flex h-5 flex-1 items-center justify-center rounded text-[9px]",
                          g
                            ? alanRenk[c.alan] + " text-background"
                            : "bg-muted/40 text-muted-foreground/50",
                        )}
                      >
                        {gunEtiket[i]}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>Seri</span>
                    <span className="font-medium text-foreground">{seri}/7</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3) Bugünün programı */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-medium text-foreground">Bugünün Programı</h2>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {program.map((p) => (
            <div
              key={p.bolum}
              className="rounded-xl border border-border bg-card p-4"
            >
              <div className="mb-3 flex items-center gap-2">
                <span
                  className="flex h-6 w-6 items-center justify-center rounded-md"
                  style={{
                    backgroundColor: `color-mix(in oklab, var(${p.renkVar}) 18%, transparent)`,
                    color: `var(${p.renkVar})`,
                  }}
                >
                  <p.ikon className="h-3.5 w-3.5" />
                </span>
                <h3 className="text-sm font-medium text-foreground">{p.bolum}</h3>
              </div>
              <ul className="flex flex-col gap-2">
                {p.olaylar.map((o) => (
                  <li
                    key={o.ad}
                    className="flex items-center gap-3 rounded-lg border border-border/60 bg-background/40 px-3 py-2"
                  >
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="w-12 text-xs font-medium text-foreground">
                      {o.saat}
                    </span>
                    <span className="flex-1 truncate text-xs text-muted-foreground">
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
