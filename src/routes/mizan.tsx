import { createFileRoute } from "@tanstack/react-router";
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Circle,
  GraduationCap,
  Heart,
  Target,
  TrendingUp,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/mizan")({
  head: () => ({
    meta: [
      { title: "Kişisel Mizan — Akademi, Dünyevi, Maneviyat" },
      {
        name: "description",
        content: "Üç hayat alanının ayrıntılı takibi: dersler, hedefler, evrad.",
      },
    ],
  }),
  component: KisiselMizan,
});

const dersler = [
  { ad: "BIL 305 — Ağ Yönetimi", durum: "aktif", sinav: "12 Mayıs", kredi: 4 },
  { ad: "BIL 412 — İşletim Sistemleri", durum: "borc", sinav: "18 Mayıs", kredi: 3 },
  { ad: "BIL 320 — Veri Tabanı", durum: "aktif", sinav: "10 Mayıs", kredi: 4 },
  { ad: "BIL 211 — Algoritmalar", durum: "gecti", sinav: "—", kredi: 4 },
  { ad: "MAT 201 — Lineer Cebir", durum: "gecti", sinav: "—", kredi: 3 },
  { ad: "BIL 410 — Yazılım Müh.", durum: "aktif", sinav: "20 Mayıs", kredi: 3 },
  { ad: "ENG 201 — Teknik İng.", durum: "aktif", sinav: "08 Mayıs", kredi: 2 },
];

const hedefler = [
  { ad: "CCNA Sertifikası", ay: 3, ilerleme: 45, son: "Modül 4 / 6" },
  { ad: "Linux LFCS", ay: 3, ilerleme: 25, son: "Disk yönetimi" },
  { ad: "AWS Cloud Practitioner", ay: 3, ilerleme: 10, son: "Başlangıç" },
  { ad: "Docker & K8s temelleri", ay: 2, ilerleme: 60, son: "Compose tamam" },
];

const mufredat = [
  { ad: "Sözler — 10. Söz", tip: "kitap", tamam: true },
  { ad: "Mektubat — 1-10", tip: "kitap", tamam: true },
  { ad: "Lem'alar — 17. Lem'a", tip: "kitap", tamam: false },
  { ad: "Şualar — 7. Şua", tip: "kitap", tamam: false },
  { ad: "Hadis ezberi — 40 hadis", tip: "ezber", tamam: false },
];

const evrad = [
  { ad: "Sabah evradı", gun: 6 },
  { ad: "Akşam evradı", gun: 5 },
  { ad: "Cevşen", gun: 4 },
  { ad: "Cüz okuma", gun: 5 },
  { ad: "Cuma — Kehf", gun: 1 },
];

const durumRenk: Record<string, string> = {
  aktif: "bg-[var(--akademi)]/15 text-foreground border-[var(--akademi)]/40",
  borc: "bg-destructive/15 text-foreground border-destructive/40",
  gecti: "bg-muted text-muted-foreground border-border",
};

const durumEtiket: Record<string, string> = {
  aktif: "Aktif",
  borc: "Borç",
  gecti: "Geçti",
};

function KisiselMizan() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      <header className="mb-6">
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          Kişisel Mizan
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Üç Alanın Dengesi
        </h1>
      </header>

      <Tabs defaultValue="akademi" className="w-full">
        <TabsList className="grid h-auto w-full grid-cols-3 gap-1 bg-muted/40 p-1">
          <TabsTrigger value="akademi" className="gap-1.5 py-2 text-xs sm:text-sm">
            <GraduationCap className="h-3.5 w-3.5" />
            <span>Akademi</span>
          </TabsTrigger>
          <TabsTrigger value="dunyevi" className="gap-1.5 py-2 text-xs sm:text-sm">
            <Target className="h-3.5 w-3.5" />
            <span>Dünyevi</span>
          </TabsTrigger>
          <TabsTrigger value="maneviyat" className="gap-1.5 py-2 text-xs sm:text-sm">
            <Heart className="h-3.5 w-3.5" />
            <span>Maneviyat</span>
          </TabsTrigger>
        </TabsList>

        {/* Akademi */}
        <TabsContent value="akademi" className="mt-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {dersler.map((d) => (
              <div
                key={d.ad}
                className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-[var(--akademi)]/40"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-medium text-foreground">{d.ad}</h3>
                  <Badge
                    variant="outline"
                    className={cn("shrink-0 text-[10px]", durumRenk[d.durum])}
                  >
                    {durumEtiket[d.durum]}
                  </Badge>
                </div>
                <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> {d.sinav}
                  </span>
                  <span>{d.kredi} kredi</span>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Dünyevi */}
        <TabsContent value="dunyevi" className="mt-4">
          <div className="grid gap-3">
            {hedefler.map((h) => (
              <div
                key={h.ad}
                className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-[var(--dunyevi)]/40"
              >
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-medium text-foreground">{h.ad}</h3>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <TrendingUp className="h-3 w-3" /> {h.ay} ay hedefi
                  </span>
                </div>
                <Progress
                  value={h.ilerleme}
                  className="h-1.5 bg-muted [&>div]:bg-[var(--dunyevi)]"
                />
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{h.son}</span>
                  <span className="font-medium text-foreground">{h.ilerleme}%</span>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Maneviyat */}
        <TabsContent value="maneviyat" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="mb-3 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-[var(--maneviyat)]" />
                <h3 className="text-sm font-medium text-foreground">
                  3 Aylık Müfredat
                </h3>
              </div>
              <ul className="flex flex-col gap-2">
                {mufredat.map((m) => (
                  <li
                    key={m.ad}
                    className="flex items-center gap-3 rounded-lg border border-border/60 bg-background/40 px-3 py-2"
                  >
                    {m.tamam ? (
                      <CheckCircle2 className="h-4 w-4 text-[var(--maneviyat)]" />
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground/40" />
                    )}
                    <span
                      className={cn(
                        "flex-1 text-xs",
                        m.tamam
                          ? "text-muted-foreground line-through"
                          : "text-foreground",
                      )}
                    >
                      {m.ad}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="mb-3 flex items-center gap-2">
                <Heart className="h-4 w-4 text-[var(--maneviyat)]" />
                <h3 className="text-sm font-medium text-foreground">
                  Haftalık Evrâd-ı Ezkâr
                </h3>
              </div>
              <ul className="flex flex-col gap-2">
                {evrad.map((e) => (
                  <li
                    key={e.ad}
                    className="flex items-center justify-between rounded-lg border border-border/60 bg-background/40 px-3 py-2"
                  >
                    <span className="text-xs text-foreground">{e.ad}</span>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">
                        {Array.from({ length: 7 }).map((_, i) => (
                          <span
                            key={i}
                            className={cn(
                              "h-1.5 w-3 rounded-sm",
                              i < e.gun
                                ? "bg-[var(--maneviyat)]"
                                : "bg-muted/50",
                            )}
                          />
                        ))}
                      </div>
                      <span className="w-8 text-right text-xs font-medium text-foreground">
                        {e.gun}/7
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
