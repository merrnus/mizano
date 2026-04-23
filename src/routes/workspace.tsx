import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Calendar as CalendarIcon,
  Plus,
  Search,
  StickyNote,
  Table2,
  Timer,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/workspace")({
  head: () => ({
    meta: [
      { title: "Mutfak — Notlar, Takvim, Pomodoro" },
      {
        name: "description",
        content: "Notlar, takvim, tablolar ve pomodoro tek alanda.",
      },
    ],
  }),
  component: Workspace,
});

const notlar = [
  { ad: "Lab raporu — taslak", tag: "Akademi", zaman: "Dün" },
  { ad: "CCNA modül 4 özet", tag: "Dünyevi", zaman: "2 gün" },
  { ad: "Sohbet konusu — sabır", tag: "Maneviyat", zaman: "3 gün" },
  { ad: "Kamp lojistik listesi", tag: "Etkinlik", zaman: "1 hafta" },
];

const olaylar = [
  { gun: "Bugün", saat: "20:00", ad: "Risale dersi" },
  { gun: "Yarın", saat: "09:00", ad: "BIL 305 dersi" },
  { gun: "Yarın", saat: "21:00", ad: "Ahmet — görüşme" },
  { gun: "Çar", saat: "11:00", ad: "BIL 412 sınavı" },
  { gun: "Cum", saat: "18:30", ad: "Haftalık sohbet" },
];

const tableData = [
  { kim: "Ahmet Y.", konu: "Risale", durum: "Devam", son: "Bu hafta" },
  { kim: "Yusuf K.", konu: "Sohbet", durum: "Tamam", son: "Geçen hafta" },
  { kim: "Mehmet S.", konu: "1-on-1", durum: "Bekliyor", son: "—" },
];

function Workspace() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      <header className="mb-6">
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          Mutfak
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Mutfak
        </h1>
      </header>

      <Tabs defaultValue="notlar" className="w-full">
        <TabsList className="grid h-auto w-full grid-cols-4 gap-1 bg-muted/40 p-1">
          <TabsTrigger value="notlar" className="gap-1.5 py-2 text-xs sm:text-sm">
            <StickyNote className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Notlar</span>
          </TabsTrigger>
          <TabsTrigger value="takvim" className="gap-1.5 py-2 text-xs sm:text-sm">
            <CalendarIcon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Takvim</span>
          </TabsTrigger>
          <TabsTrigger value="tablolar" className="gap-1.5 py-2 text-xs sm:text-sm">
            <Table2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Tablolar</span>
          </TabsTrigger>
          <TabsTrigger value="pomodoro" className="gap-1.5 py-2 text-xs sm:text-sm">
            <Timer className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Pomodoro</span>
          </TabsTrigger>
        </TabsList>

        {/* Notlar */}
        <TabsContent value="notlar" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="mb-3 flex items-center gap-2">
                <Plus className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-medium text-foreground">Yeni not</h3>
              </div>
              <Input placeholder="Başlık" className="mb-2 h-9" />
              <Textarea
                placeholder="Notunu yaz…"
                className="min-h-[200px] resize-none border-border bg-background/40 text-sm"
              />
              <div className="mt-3 flex justify-end gap-2">
                <Button variant="ghost" size="sm">
                  Temizle
                </Button>
                <Button size="sm">Kaydet</Button>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-medium text-foreground">Son notlar</h3>
                <span className="text-[10px] text-muted-foreground">
                  {notlar.length}
                </span>
              </div>
              <div className="relative mb-3">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Notlarda ara…" className="h-8 pl-8 text-xs" />
              </div>
              <ul className="flex flex-col gap-1.5">
                {notlar.map((n) => (
                  <li
                    key={n.ad}
                    className="flex cursor-pointer flex-col gap-1 rounded-lg border border-border/60 bg-background/40 px-3 py-2 hover:border-primary/40"
                  >
                    <div className="text-xs font-medium text-foreground">
                      {n.ad}
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-[9px]">
                        {n.tag}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {n.zaman}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </TabsContent>

        {/* Takvim */}
        <TabsContent value="takvim" className="mt-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="mb-3 text-sm font-medium text-foreground">
              Yaklaşan olaylar
            </h3>
            <ul className="flex flex-col gap-2">
              {olaylar.map((o, i) => (
                <li
                  key={i}
                  className="flex items-center gap-3 rounded-lg border border-border/60 bg-background/40 px-3 py-2.5"
                >
                  <div className="flex w-14 flex-col">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {o.gun}
                    </span>
                    <span className="text-xs font-medium text-foreground">
                      {o.saat}
                    </span>
                  </div>
                  <span className="flex-1 text-sm text-foreground">{o.ad}</span>
                </li>
              ))}
            </ul>
          </div>
        </TabsContent>

        {/* Tablolar */}
        <TabsContent value="tablolar" className="mt-4">
          <div className="rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border p-4">
              <h3 className="text-sm font-medium text-foreground">
                Takip tablosu
              </h3>
              <Button size="sm" variant="outline" className="gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Satır
              </Button>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kim</TableHead>
                    <TableHead>Konu</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>Son temas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tableData.map((t) => (
                    <TableRow key={t.kim}>
                      <TableCell className="font-medium">{t.kim}</TableCell>
                      <TableCell>{t.konu}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">
                          {t.durum}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {t.son}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        {/* Pomodoro */}
        <TabsContent value="pomodoro" className="mt-4">
          <Pomodoro />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Pomodoro() {
  const [saniye, setSaniye] = React.useState(25 * 60);
  const [calisiyor, setCalisiyor] = React.useState(false);

  React.useEffect(() => {
    if (!calisiyor) return;
    const t = setInterval(() => {
      setSaniye((s) => {
        if (s <= 1) {
          setCalisiyor(false);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [calisiyor]);

  const dk = Math.floor(saniye / 60).toString().padStart(2, "0");
  const sn = (saniye % 60).toString().padStart(2, "0");

  return (
    <div className="mx-auto max-w-md rounded-xl border border-border bg-card p-8 text-center">
      <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
        Odak
      </div>
      <div
        className={cn(
          "my-4 font-mono text-6xl tracking-wider tabular-nums",
          calisiyor ? "text-primary" : "text-foreground",
        )}
      >
        {dk}:{sn}
      </div>
      <div className="flex justify-center gap-2">
        <Button
          onClick={() => setCalisiyor((c) => !c)}
          className="min-w-24"
        >
          {calisiyor ? "Duraklat" : "Başlat"}
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setCalisiyor(false);
            setSaniye(25 * 60);
          }}
        >
          Sıfırla
        </Button>
      </div>
      <div className="mt-4 flex justify-center gap-1.5">
        {[15, 25, 50].map((m) => (
          <button
            key={m}
            onClick={() => {
              setCalisiyor(false);
              setSaniye(m * 60);
            }}
            className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground"
          >
            {m} dk
          </button>
        ))}
      </div>
    </div>
  );
}
