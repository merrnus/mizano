import { createFileRoute } from "@tanstack/react-router";
import { SayfaBasligi } from "@/components/mizan/sayfa-basligi";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/takvim")({
  head: () => ({
    meta: [
      { title: "Takvim — Mizan" },
      { name: "description", content: "Aylık ve haftalık görünüm, kategorili olaylar." },
      { property: "og:title", content: "Takvim — Mizan" },
      { property: "og:description", content: "Üniversite, sohbet, kandil, spor — hepsi tek takvimde." },
    ],
  }),
  component: TakvimPage,
});

const kategoriler = [
  { ad: "Üniversite", renk: "bg-[var(--akademi)]" },
  { ad: "Akşam programı", renk: "bg-[var(--maneviyat)]" },
  { ad: "Sohbet", renk: "bg-[var(--turquoise)]" },
  { ad: "İstişare", renk: "bg-[var(--gold)]" },
  { ad: "Kandil", renk: "bg-amber-400" },
  { ad: "Spor", renk: "bg-emerald-500" },
  { ad: "Doğum günü", renk: "bg-pink-400" },
  { ad: "Kamp", renk: "bg-indigo-400" },
];

const haftaGunleri = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

const yaklasanGunler = [
  {
    gun: "Bugün — 23 Nis Per",
    olaylar: [
      { ad: "BIL 305 — Ağ Yönetimi", tip: "akademi", saat: "10:00" },
      { ad: "Akşam programı — Risale", tip: "maneviyat", saat: "20:00" },
    ],
  },
  {
    gun: "Yarın — 24 Nis Cum",
    olaylar: [
      { ad: "BIL 311 — Veri Tabanı", tip: "akademi", saat: "13:00" },
      { ad: "Cuma sohbeti", tip: "sohbet", saat: "19:00" },
    ],
  },
  {
    gun: "25 Nis Cmt",
    olaylar: [
      { ad: "Spor — futbol", tip: "spor", saat: "11:00" },
      { ad: "Ahmet ile teke tek", tip: "istisare", saat: "16:00" },
    ],
  },
  {
    gun: "26 Nis Paz",
    olaylar: [{ ad: "Kandil programı", tip: "kandil", saat: "20:30" }],
  },
];

const olayRengi: Record<string, string> = {
  akademi: "border-l-[var(--akademi)]",
  maneviyat: "border-l-[var(--maneviyat)]",
  sohbet: "border-l-[var(--turquoise)]",
  istisare: "border-l-[var(--gold)]",
  spor: "border-l-emerald-500",
  kandil: "border-l-amber-400",
};

function TakvimPage() {
  return (
    <div>
      <SayfaBasligi baslik="Takvim" aciklama="Aylık + haftalık görünüm, renkli kategoriler." />
      <div className="px-4 py-5 md:px-6">
        <div className="mb-4 flex flex-wrap gap-2">
          {kategoriler.map((k) => (
            <span
              key={k.ad}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-[11px] text-muted-foreground"
            >
              <span className={cn("h-2 w-2 rounded-full", k.renk)} />
              {k.ad}
            </span>
          ))}
        </div>

        {/* Mobil — yaklaşan günler listesi */}
        <div className="md:hidden">
          <div className="space-y-4">
            {yaklasanGunler.map((g) => (
              <div key={g.gun} className="rounded-xl border border-border bg-card p-4">
                <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {g.gun}
                </h3>
                <ul className="space-y-2">
                  {g.olaylar.map((o) => (
                    <li
                      key={o.ad}
                      className={cn(
                        "flex items-center justify-between rounded-md border-l-2 bg-background/40 px-3 py-2 text-sm",
                        olayRengi[o.tip] ?? "border-l-border",
                      )}
                    >
                      <span className="text-foreground">{o.ad}</span>
                      <span className="text-xs text-muted-foreground">{o.saat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Desktop / tablet — sekmeli aylık + haftalık */}
        <Tabs defaultValue="ay" className="hidden w-full md:block">
          <TabsList>
            <TabsTrigger value="ay">Aylık</TabsTrigger>
            <TabsTrigger value="hafta">Haftalık</TabsTrigger>
          </TabsList>
          <TabsContent value="ay" className="mt-4">
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-muted-foreground">
                {haftaGunleri.map((g) => (
                  <div key={g} className="py-1">
                    {g}
                  </div>
                ))}
              </div>
              <div className="mt-1 grid grid-cols-7 gap-1">
                {Array.from({ length: 35 }).map((_, i) => {
                  const day = i - 2;
                  const has = [3, 7, 12, 18, 21, 26].includes(day);
                  const has2 = [5, 14, 22].includes(day);
                  return (
                    <div
                      key={i}
                      className="min-h-20 rounded-md border border-border bg-background/40 p-1.5 text-left"
                    >
                      <div className="text-[10px] text-muted-foreground">
                        {day > 0 && day <= 31 ? day : ""}
                      </div>
                      <div className="mt-1 space-y-1">
                        {has && (
                          <div className="truncate rounded bg-[var(--akademi)]/25 px-1 text-[10px] text-foreground">
                            BIL 305
                          </div>
                        )}
                        {has2 && (
                          <div className="truncate rounded bg-[var(--maneviyat)]/25 px-1 text-[10px] text-foreground">
                            Sohbet
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </TabsContent>
          <TabsContent value="hafta" className="mt-4">
            <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
              Haftalık görünüm yakında — şimdilik aylıktan günlere tıklayabilirsin.
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}