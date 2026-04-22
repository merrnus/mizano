import { createFileRoute } from "@tanstack/react-router";
import { SayfaBasligi } from "@/components/mizan/sayfa-basligi";
import { IsiHaritasi } from "@/components/mizan/isi-haritasi";

export const Route = createFileRoute("/istatistik")({
  head: () => ({
    meta: [
      { title: "İstatistik — Mizan" },
      { name: "description", content: "Haftalık ve aylık denge grafikleri." },
      { property: "og:title", content: "İstatistik — Mizan" },
      { property: "og:description", content: "Maneviyat, akademi ve dünyevi denge görsel olarak." },
    ],
  }),
  component: IstatistikPage,
});

function IstatistikPage() {
  return (
    <div>
      <SayfaBasligi baslik="İstatistik" aciklama="Dengen nasıl gidiyor — bir bakışta gör." />
      <div className="space-y-6 px-6 py-5">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { ad: "Maneviyat", deger: "%72", aciklama: "Bu hafta", renk: "var(--maneviyat)" },
            { ad: "Dünyevi", deger: "%58", aciklama: "Bu hafta", renk: "var(--dunyevi)" },
            { ad: "Akademi", deger: "%64", aciklama: "Bu hafta", renk: "var(--akademi)" },
          ].map((k) => (
            <div key={k.ad} className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">{k.ad}</p>
              <p className="mt-2 text-2xl font-semibold text-foreground" style={{ color: k.renk }}>
                {k.deger}
              </p>
              <p className="text-[11px] text-muted-foreground">{k.aciklama}</p>
            </div>
          ))}
        </div>

        <IsiHaritasi
          alanlar={[
            { ad: "Maneviyat", renkVar: "--maneviyat", degerler: [3, 4, 2, 4, 3, 1, 2] },
            { ad: "Dünyevi", renkVar: "--dunyevi", degerler: [2, 3, 3, 1, 2, 4, 0] },
            { ad: "Akademi", renkVar: "--akademi", degerler: [4, 2, 3, 2, 4, 0, 1] },
          ]}
        />
      </div>
    </div>
  );
}