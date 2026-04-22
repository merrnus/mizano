import { createFileRoute } from "@tanstack/react-router";
import { Plus, Table2 } from "lucide-react";
import { SayfaBasligi } from "@/components/mizan/sayfa-basligi";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/tablolar")({
  head: () => ({
    meta: [
      { title: "Tablolar — Mizan" },
      { name: "description", content: "Esnek tablo aracı — Sheets tarzı sade." },
      { property: "og:title", content: "Tablolar — Mizan" },
      { property: "og:description", content: "Hızlıca tablo oluştur, sütun ve satır ekle." },
    ],
  }),
  component: TablolarPage,
});

const tablolar = [
  { ad: "Kardeşler — iletişim", sutun: 5, satir: 12 },
  { ad: "Akşam programı planı", sutun: 4, satir: 8 },
  { ad: "Sınav takvimi", sutun: 3, satir: 10 },
];

function TablolarPage() {
  return (
    <div>
      <SayfaBasligi
        baslik="Tablolar"
        aciklama="Hızlı, esnek, sade — Sheets tarzı."
        aksiyonlar={
          <Button size="sm" className="gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Yeni tablo
          </Button>
        }
      />
      <div className="px-6 py-5">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {tablolar.map((t) => (
            <div
              key={t.ad}
              className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
            >
              <div className="flex items-center gap-2">
                <Table2 className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-medium text-foreground">{t.ad}</h3>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {t.sutun} sütun × {t.satir} satır
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}