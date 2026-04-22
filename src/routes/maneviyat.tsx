import { createFileRoute } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { SayfaBasligi } from "@/components/mizan/sayfa-basligi";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/maneviyat")({
  head: () => ({
    meta: [
      { title: "Maneviyat — Mizan" },
      { name: "description", content: "3 aylık müfredat ve haftalık evrad-ı ezkâr çetelesi." },
      { property: "og:title", content: "Maneviyat — Mizan" },
      {
        property: "og:description",
        content: "Manevi beslenmeyi ve hedefleri sade bir takip ile yürüt.",
      },
    ],
  }),
  component: ManeviyatPage,
});

const mufredat = [
  { ad: "Risale-i Nur — Sözler", tip: "Kitap", ilerleme: 45 },
  { ad: "Hatim (Kuran)", tip: "Hatim", ilerleme: 30 },
  { ad: "Hıfz — Bakara 1-50", tip: "Hıfz", ilerleme: 20 },
  { ad: "Tefsir okuması", tip: "Kitap", ilerleme: 60 },
];

const ezkarlar = [
  "Sabah evradı",
  "Akşam evradı",
  "Cevşen",
  "Risale dersi",
  "Kuran (1 cüz)",
  "Tesbihat",
];

const gunler = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
const cetelMock: boolean[][] = ezkarlar.map(() =>
  Array.from({ length: 7 }, () => Math.random() > 0.4),
);

function ManeviyatPage() {
  return (
    <div>
      <SayfaBasligi
        baslik="Maneviyat"
        aciklama="3 aylık müfredat + haftalık çetele birlikte yürür."
      />
      <div className="px-6 py-5">
        <Tabs defaultValue="mufredat" className="w-full">
          <TabsList>
            <TabsTrigger value="mufredat">3 Aylık Müfredat</TabsTrigger>
            <TabsTrigger value="cetele">Haftalık Çetele</TabsTrigger>
          </TabsList>

          <TabsContent value="mufredat" className="mt-4">
            <div className="grid gap-4 md:grid-cols-2">
              {mufredat.map((m) => (
                <div
                  key={m.ad}
                  className="rounded-xl border border-border bg-card p-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-foreground">{m.ad}</h3>
                    <span className="rounded-full bg-[var(--maneviyat)]/15 px-2 py-0.5 text-[10px] text-foreground">
                      {m.tip}
                    </span>
                  </div>
                  <div className="mt-3">
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>İlerleme</span>
                      <span>{m.ilerleme}%</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-[var(--maneviyat)]"
                        style={{ width: `${m.ilerleme}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="cetele" className="mt-4">
            <div className="overflow-x-auto rounded-xl border border-border bg-card p-4">
              <table className="w-full min-w-[520px] border-separate border-spacing-1">
                <thead>
                  <tr>
                    <th className="text-left text-xs font-normal text-muted-foreground" />
                    {gunler.map((g) => (
                      <th
                        key={g}
                        className="text-center text-[11px] font-normal text-muted-foreground"
                      >
                        {g}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ezkarlar.map((ez, i) => (
                    <tr key={ez}>
                      <td className="pr-3 text-xs text-foreground">
                        <Heart className="mr-1 inline h-3 w-3 text-[var(--maneviyat)]" />
                        {ez}
                      </td>
                      {cetelMock[i].map((v, j) => (
                        <td key={j} className="text-center">
                          <button
                            className={cn(
                              "h-7 w-full rounded-md border transition-colors",
                              v
                                ? "border-[var(--maneviyat)]/40 bg-[var(--maneviyat)]/30"
                                : "border-border bg-background/40 hover:border-[var(--maneviyat)]/40",
                            )}
                            aria-label={`${ez} — ${gunler[j]}`}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}