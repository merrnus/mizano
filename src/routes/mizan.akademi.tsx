import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/mizan/akademi")({
  head: () => ({
    meta: [
      { title: "Akademi — Mizan" },
      { name: "description", content: "Aktif dersler ve borç dersleri." },
    ],
  }),
  component: AkademiSayfasi,
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

const durumRenk: Record<string, string> = {
  aktif: "bg-[var(--akademi)]/15 text-foreground border-[var(--akademi)]/40",
  borc: "bg-destructive/15 text-foreground border-destructive/40",
  gecti: "bg-muted text-muted-foreground border-border",
};
const durumEtiket: Record<string, string> = { aktif: "Aktif", borc: "Borç", gecti: "Geçti" };

function AkademiSayfasi() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2 h-7 gap-1 text-xs text-muted-foreground">
            <Link to="/mizan"><ArrowLeft className="h-3 w-3" /> Mizan</Link>
          </Button>
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Akademi</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Dersler</h1>
        </div>
      </header>
      <div className="grid gap-3 sm:grid-cols-2">
        {dersler.map((d) => (
          <div key={d.ad} className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-[var(--akademi)]/40">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-medium">{d.ad}</h3>
              <Badge variant="outline" className={cn("shrink-0 text-[10px]", durumRenk[d.durum])}>
                {durumEtiket[d.durum]}
              </Badge>
            </div>
            <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {d.sinav}</span>
              <span>{d.kredi} kredi</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}