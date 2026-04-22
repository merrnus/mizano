import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, GraduationCap, Heart, Plus, StickyNote, Target, Timer } from "lucide-react";
import { DengeKarti } from "@/components/mizan/denge-karti";
import { IsiHaritasi } from "@/components/mizan/isi-haritasi";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Mizan Merkez — Bugünün Dengesi" },
      {
        name: "description",
        content: "Bugünün zaman çizelgesi, denge kartları ve haftalık ısı haritası.",
      },
      { property: "og:title", content: "Mizan Merkez" },
      {
        property: "og:description",
        content: "Akademi, maneviyat ve dünyevi hedefler tek bakışta.",
      },
    ],
  }),
  component: Index,
});

const zamanDilimleri = [
  {
    etiket: "Sabah",
    saat: "07:00 — 12:00",
    olaylar: [
      { ad: "Sabah evradı", tip: "maneviyat" },
      { ad: "BIL 305 — Ağ Yönetimi", tip: "akademi" },
    ],
  },
  {
    etiket: "Öğle",
    saat: "12:00 — 17:00",
    olaylar: [
      { ad: "BIL 412 — İşletim Sistemleri (borç)", tip: "akademi" },
      { ad: "CCNA modül 3 — 30 dk", tip: "dunyevi" },
    ],
  },
  {
    etiket: "Akşam",
    saat: "17:00 — 23:00",
    olaylar: [
      { ad: "Akşam programı — Risale dersi", tip: "maneviyat" },
      { ad: "Ahmet ile teke tek görüşme", tip: "kardes" },
    ],
  },
] as const;

const tipRenk: Record<string, string> = {
  akademi: "bg-[var(--akademi)]/15 text-foreground border-[var(--akademi)]/30",
  maneviyat: "bg-[var(--maneviyat)]/15 text-foreground border-[var(--maneviyat)]/30",
  dunyevi: "bg-[var(--dunyevi)]/15 text-foreground border-[var(--dunyevi)]/30",
  kardes: "bg-secondary text-foreground border-border",
};

function Index() {
  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-6">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Mizan Merkez</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
            Bugünün Dengesi
          </h1>
        </div>
        <Button size="sm" variant="outline" className="gap-1.5">
          <Plus className="h-3.5 w-3.5" /> Hızlı ekle
        </Button>
      </div>

      {/* Üst şerit — bugünün zaman çizelgesi */}
      <section className="mb-6 rounded-xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-medium text-foreground">Bugünün zaman çizelgesi</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {zamanDilimleri.map((dilim) => (
            <div key={dilim.etiket} className="rounded-lg border border-border bg-background/40 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wide text-foreground">
                  {dilim.etiket}
                </span>
                <span className="text-xs text-muted-foreground">{dilim.saat}</span>
              </div>
              <ul className="flex flex-col gap-1.5">
                {dilim.olaylar.map((o) => (
                  <li
                    key={o.ad}
                    className={cn(
                      "rounded-md border px-2 py-1.5 text-xs",
                      tipRenk[o.tip],
                    )}
                  >
                    {o.ad}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="flex flex-col gap-6">
          {/* Orta blok — 3 denge kartı */}
          <section className="grid gap-4 md:grid-cols-3">
            <DengeKarti
              alan="akademi"
              baslik="Bugünkü ders: Ağ Yönetimi"
              ozet="Lab raporu hazırla — 1 saat"
              ilerleme={40}
            />
            <DengeKarti
              alan="maneviyat"
              baslik="Sabah & akşam evradı"
              ozet="Çetele üzerinden işaretle"
              ilerleme={70}
              tamamlandi
            />
            <DengeKarti
              alan="dunyevi"
              baslik="CCNA — Modül 3"
              ozet="30 dakikalık adım"
              ilerleme={25}
            />
          </section>

          {/* Alt blok — haftalık ısı haritası */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-medium text-foreground">Haftalık denge ısı haritası</h2>
              <span className="text-xs text-muted-foreground">Bu hafta</span>
            </div>
            <IsiHaritasi
              alanlar={[
                { ad: "Maneviyat", renkVar: "--maneviyat", degerler: [3, 4, 2, 4, 3, 1, 2] },
                { ad: "Dünyevi", renkVar: "--dunyevi", degerler: [2, 3, 3, 1, 2, 4, 0] },
                { ad: "Akademi", renkVar: "--akademi", degerler: [4, 2, 3, 2, 4, 0, 1] },
              ]}
            />
          </section>
        </div>

        {/* Yan kolon */}
        <aside className="flex flex-col gap-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="mb-2 flex items-center gap-2">
              <StickyNote className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-medium text-foreground">Hızlı not</h3>
            </div>
            <Textarea
              placeholder="Aklındaki bir şeyi şuraya bırak…"
              className="min-h-24 resize-none border-border bg-background/40 text-sm"
            />
            <Button size="sm" className="mt-2 w-full">
              Kaydet
            </Button>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <div className="mb-2 flex items-center gap-2">
              <Timer className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-medium text-foreground">Pomodoro</h3>
            </div>
            <div className="my-3 text-center font-mono text-3xl tracking-wider text-foreground">
              25:00
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="flex-1">
                Başlat
              </Button>
              <Button size="sm" variant="ghost" className="flex-1">
                Sıfırla
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <div className="mb-2 flex items-center gap-2">
              <Heart className="h-4 w-4 text-[var(--maneviyat)]" />
              <Target className="h-4 w-4 text-[var(--dunyevi)]" />
              <GraduationCap className="h-4 w-4 text-[var(--akademi)]" />
              <h3 className="ml-1 text-sm font-medium text-foreground">Bugünün hatırlatması</h3>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              "Akşam programında <span className="text-foreground">Yusuf</span> ile gündem
              paylaşmayı unutma. Hafta hedefi: 3 ders + 1 sohbet."
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
