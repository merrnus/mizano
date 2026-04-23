import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, GraduationCap, Heart, MessageSquare, StickyNote } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/kardesler/$kisiId")({
  head: ({ params }) => ({
    meta: [
      { title: `${decodeURIComponent(params.kisiId)} — Kardeşler — Mizan` },
      { name: "description", content: "Kardeş profili: faaliyet, maneviyat ve notlar." },
    ],
  }),
  component: KardesDetay,
});

function KardesDetay() {
  const { kisiId } = Route.useParams();
  const ad = decodeURIComponent(kisiId);

  return (
    <div>
      <div className="border-b border-border px-4 py-5 md:px-6">
        <Link
          to="/kardesler"
          className="mb-3 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" /> Kardeşler
        </Link>
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14 border border-border">
            <AvatarFallback className="bg-secondary text-sm">
              {ad.split(" ").map((p) => p[0]).join("").slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-xl font-semibold text-foreground">{ad}</h1>
            <p className="text-sm text-muted-foreground">Profil — düzenle ve takibi yürüt</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-5 md:px-6">
        <Tabs defaultValue="profil" className="w-full">
          <TabsList className="flex flex-wrap h-auto">
            <TabsTrigger value="profil"><GraduationCap className="mr-1 h-3.5 w-3.5" />Profil</TabsTrigger>
            <TabsTrigger value="faaliyet"><MessageSquare className="mr-1 h-3.5 w-3.5" />Faaliyet</TabsTrigger>
            <TabsTrigger value="maneviyat"><Heart className="mr-1 h-3.5 w-3.5" />Maneviyat</TabsTrigger>
            <TabsTrigger value="notlar"><StickyNote className="mr-1 h-3.5 w-3.5" />Notlar</TabsTrigger>
          </TabsList>

          <TabsContent value="profil" className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="mb-2 text-sm font-medium text-foreground">Akademik durum</h3>
              <p className="text-xs text-muted-foreground">Bölüm, sınıf, GPA, not ortalaması burada.</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="mb-2 text-sm font-medium text-foreground">İlgi alanları</h3>
              <p className="text-xs text-muted-foreground">Hobiler, sevdiği konular, hassasiyetler.</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 md:col-span-2">
              <h3 className="mb-2 text-sm font-medium text-foreground">İnsani notlar</h3>
              <p className="text-xs text-muted-foreground">Karakteri, ailesi, son dönemde dikkat edilmesi gerekenler.</p>
            </div>
          </TabsContent>

          <TabsContent value="faaliyet" className="mt-4">
            <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
              Sohbetler, istişareler, görüşmeler, doğum günü, spor — kronolojik liste yakında.
            </div>
          </TabsContent>

          <TabsContent value="maneviyat" className="mt-4">
            <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
              3 aylık müfredat ilerleme + haftalık çetele özeti yakında.
            </div>
          </TabsContent>

          <TabsContent value="notlar" className="mt-4 space-y-3">
            <Textarea
              placeholder={`${ad} hakkında bir not bırak…`}
              className="min-h-24 border-border bg-background/40 text-sm"
            />
            <Button size="sm">Notu kaydet</Button>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}