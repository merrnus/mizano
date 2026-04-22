import { createFileRoute } from "@tanstack/react-router";
import { GraduationCap, Heart } from "lucide-react";
import { SayfaBasligi } from "@/components/mizan/sayfa-basligi";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export const Route = createFileRoute("/kardesler")({
  head: () => ({
    meta: [
      { title: "Kardeşler — Mizan" },
      { name: "description", content: "Ev, GG, OMM ve Kuran/Online rehberlik kardeşleri." },
      { property: "og:title", content: "Kardeşler — Mizan" },
      {
        property: "og:description",
        content: "Profil, faaliyet ve maneviyat takibi tek bir yerden.",
      },
    ],
  }),
  component: KardeslerPage,
});

type Kardes = {
  ad: string;
  bolum: string;
  ilgi: string;
  faaliyet: string;
  maneviyat: number;
};

const gruplar: Record<string, Kardes[]> = {
  ev: [
    { ad: "Ahmet Y.", bolum: "Bilgisayar Müh. 2", ilgi: "Backend, futbol", faaliyet: "Haftalık sohbet", maneviyat: 80 },
    { ad: "Yusuf K.", bolum: "Endüstri Müh. 3", ilgi: "Kitap, satranç", faaliyet: "Bireysel istişare", maneviyat: 60 },
    { ad: "Mehmet T.", bolum: "Elektrik Müh. 1", ilgi: "Donanım", faaliyet: "Akşam programı", maneviyat: 45 },
  ],
  gg: [
    { ad: "Ömer S.", bolum: "Hukuk 2", ilgi: "Münazara", faaliyet: "Cuma sohbeti", maneviyat: 55 },
    { ad: "Ali R.", bolum: "Tıp 1", ilgi: "Spor, Kuran", faaliyet: "Kuran dersi", maneviyat: 70 },
  ],
  omm: [
    { ad: "Hasan B.", bolum: "İletişim 3", ilgi: "Video, tasarım", faaliyet: "Aylık görüşme", maneviyat: 30 },
    { ad: "İbrahim D.", bolum: "Mimarlık 2", ilgi: "Çizim", faaliyet: "Telefon takip", maneviyat: 25 },
  ],
  kuran: [
    { ad: "Bilal (Online)", bolum: "Lise 3", ilgi: "Kuran tilaveti", faaliyet: "Pazartesi 19:00", maneviyat: 65 },
    { ad: "Salih (Yüz yüze)", bolum: "Üniv. hazırlık", ilgi: "Tecvid", faaliyet: "Çarşamba 20:00", maneviyat: 50 },
  ],
};

function KardesGrid({ liste }: { liste: Kardes[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {liste.map((k) => (
        <div
          key={k.ad}
          className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
        >
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border border-border">
              <AvatarFallback className="bg-secondary text-xs">
                {k.ad
                  .split(" ")
                  .map((p) => p[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-sm font-medium text-foreground">{k.ad}</h3>
              <p className="text-xs text-muted-foreground">{k.bolum}</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            <GraduationCap className="mr-1 inline h-3 w-3" /> {k.ilgi}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Faaliyet: {k.faaliyet}</p>
          <div className="mt-3">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Heart className="h-3 w-3 text-[var(--maneviyat)]" /> Maneviyat takibi
              </span>
              <span>{k.maneviyat}%</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-[var(--maneviyat)]"
                style={{ width: `${k.maneviyat}%` }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function KardeslerPage() {
  return (
    <div>
      <SayfaBasligi
        baslik="Kardeşler"
        aciklama="Ev, GG (eve gelenler), OMM (eve gelmeyenler), Kuran/Online rehberlik."
      />
      <div className="px-6 py-5">
        <Tabs defaultValue="ev" className="w-full">
          <TabsList>
            <TabsTrigger value="ev">Ev</TabsTrigger>
            <TabsTrigger value="gg">GG</TabsTrigger>
            <TabsTrigger value="omm">OMM</TabsTrigger>
            <TabsTrigger value="kuran">Kuran / Online</TabsTrigger>
          </TabsList>
          {(["ev", "gg", "omm", "kuran"] as const).map((g) => (
            <TabsContent key={g} value={g} className="mt-4">
              <KardesGrid liste={gruplar[g]} />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}