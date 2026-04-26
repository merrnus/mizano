import * as React from "react";
import { LayoutGrid, List, Search, Calendar, MessageSquare } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useGundemler,
  useIstisareler,
  useKisiler,
  useKategoriler,
} from "@/lib/network-hooks";
import { GUNDEM_DURUMLAR } from "@/lib/network-tipleri";
import type { GundemDetay, GundemDurum } from "@/lib/network-tipleri";
import { GundemDetaySheet } from "./gundem-detay-sheet";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { cn } from "@/lib/utils";

type DeadlineFiltre = "tumu" | "geciken" | "haftalik" | "ileride";

export function GundemlerTab() {
  const [gorunum, setGorunum] = React.useState<"kanban" | "liste">("kanban");
  const [arama, setArama] = React.useState("");
  const [durumFiltre, setDurumFiltre] = React.useState<GundemDurum | "tumu">("tumu");
  const [sorumluFiltre, setSorumluFiltre] = React.useState<string>("tumu");
  const [deadlineFiltre, setDeadlineFiltre] = React.useState<DeadlineFiltre>("tumu");
  const [secili, setSecili] = React.useState<GundemDetay | null>(null);

  const gundemlerQ = useGundemler();
  const istisarelerQ = useIstisareler();
  const kisilerQ = useKisiler();

  const gundemler = gundemlerQ.data ?? [];
  const istisareler = istisarelerQ.data ?? [];
  const kisiler = kisilerQ.data ?? [];

  const bugun = new Date();
  bugun.setHours(0, 0, 0, 0);
  const haftaSonu = new Date(bugun);
  haftaSonu.setDate(bugun.getDate() + 7);

  const filtreli = gundemler.filter((g) => {
    if (arama && !g.icerik.toLowerCase().includes(arama.toLowerCase())) return false;
    if (durumFiltre !== "tumu" && g.durum !== durumFiltre) return false;
    if (sorumluFiltre !== "tumu" && !g.sorumlu_ids.includes(sorumluFiltre)) return false;
    if (deadlineFiltre !== "tumu") {
      if (!g.deadline) return false;
      const d = new Date(g.deadline);
      if (deadlineFiltre === "geciken" && (d >= bugun || g.durum === "yapildi")) return false;
      if (deadlineFiltre === "haftalik" && (d < bugun || d > haftaSonu)) return false;
      if (deadlineFiltre === "ileride" && d <= haftaSonu) return false;
    }
    return true;
  });

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Gündem ara…"
            value={arama}
            onChange={(e) => setArama(e.target.value)}
            className="h-9 pl-8 text-sm"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Select value={durumFiltre} onValueChange={(v) => setDurumFiltre(v as GundemDurum | "tumu")}>
            <SelectTrigger className="h-9 w-32 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tumu">Tüm durumlar</SelectItem>
              {GUNDEM_DURUMLAR.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.ad}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sorumluFiltre} onValueChange={setSorumluFiltre}>
            <SelectTrigger className="h-9 w-36 text-xs">
              <SelectValue placeholder="Sorumlu" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tumu">Tüm sorumlular</SelectItem>
              {kisiler.map((k) => (
                <SelectItem key={k.id} value={k.id}>
                  {k.ad}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={deadlineFiltre} onValueChange={(v) => setDeadlineFiltre(v as DeadlineFiltre)}>
            <SelectTrigger className="h-9 w-32 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tumu">Tüm tarihler</SelectItem>
              <SelectItem value="geciken">Geciken</SelectItem>
              <SelectItem value="haftalik">Bu hafta</SelectItem>
              <SelectItem value="ileride">İleride</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex rounded-md border border-border p-0.5">
            <Button
              size="sm"
              variant={gorunum === "kanban" ? "secondary" : "ghost"}
              className="h-7 px-2"
              onClick={() => setGorunum("kanban")}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm"
              variant={gorunum === "liste" ? "secondary" : "ghost"}
              className="h-7 px-2"
              onClick={() => setGorunum("liste")}
            >
              <List className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {gundemlerQ.isLoading ? (
        <div className="rounded-xl border border-border bg-card/50 p-6 text-center text-sm text-muted-foreground">
          Yükleniyor…
        </div>
      ) : gundemler.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/30 p-8 text-center text-sm text-muted-foreground">
          Henüz gündem yok. <Link to="/network" search={{ tab: "istisareler" }} className="text-primary underline">İstişareler</Link> sekmesinden bir istişare oluşturup gündem ekle.
        </div>
      ) : gorunum === "kanban" ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {GUNDEM_DURUMLAR.map((s) => {
            const bunlar = filtreli.filter((g) => g.durum === s.id);
            return (
              <div
                key={s.id}
                className="rounded-xl border border-border bg-card/50 p-3"
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={cn("h-2 w-2 rounded-full", s.renk)} />
                    <h3 className="text-xs font-medium text-foreground">{s.ad}</h3>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{bunlar.length}</span>
                </div>
                <div className="flex flex-col gap-2">
                  {bunlar.map((g) => (
                    <GundemKart
                      key={g.id}
                      g={g}
                      kisiler={kisiler}
                      istisareler={istisareler}
                      onClick={() => setSecili(g)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {filtreli.map((g) => (
            <GundemListeSatir
              key={g.id}
              g={g}
              kisiler={kisiler}
              istisareler={istisareler}
              onClick={() => setSecili(g)}
            />
          ))}
        </div>
      )}

      <GundemDetaySheet gundem={secili} onClose={() => setSecili(null)} />
    </div>
  );
}

function isGeciken(g: GundemDetay) {
  if (!g.deadline || g.durum === "yapildi") return false;
  const d = new Date(g.deadline);
  const bugun = new Date();
  bugun.setHours(0, 0, 0, 0);
  return d < bugun;
}

function GundemKart({
  g,
  kisiler,
  istisareler,
  onClick,
}: {
  g: GundemDetay;
  kisiler: { id: string; ad: string }[];
  istisareler: { id: string; tarih: string }[];
  onClick: () => void;
}) {
  const geciken = isGeciken(g);
  const istisare = istisareler.find((i) => i.id === g.istisare_id);
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-lg border bg-background/60 p-2.5 text-left transition-colors hover:border-primary/40",
        geciken ? "border-destructive/40" : "border-border",
      )}
    >
      <div className="text-xs text-foreground">{g.icerik}</div>
      <div className="mt-1.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          {g.oncelik === "yan" && (
            <Badge variant="outline" className="px-1 py-0 text-[9px]">
              Yan
            </Badge>
          )}
          {g.deadline && (
            <span className={cn("flex items-center gap-0.5", geciken && "text-destructive")}>
              <Calendar className="h-3 w-3" />
              {format(new Date(g.deadline), "d MMM", { locale: tr })}
            </span>
          )}
          {g.yorum_sayisi > 0 && (
            <span className="flex items-center gap-0.5">
              <MessageSquare className="h-3 w-3" /> {g.yorum_sayisi}
            </span>
          )}
        </div>
        {g.sorumlu_ids.length > 0 && (
          <div className="flex -space-x-1.5">
            {g.sorumlu_ids.slice(0, 3).map((id) => {
              const k = kisiler.find((x) => x.id === id);
              if (!k) return null;
              return (
                <Avatar key={id} className="h-5 w-5 border border-card">
                  <AvatarFallback className="bg-muted text-[8px]">
                    {k.ad.split(" ").map((p) => p[0]).join("").slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
              );
            })}
          </div>
        )}
      </div>
      {istisare && (
        <div className="mt-1 text-[9px] text-muted-foreground">
          {format(new Date(istisare.tarih), "d MMM yyyy", { locale: tr })}
        </div>
      )}
    </button>
  );
}

function GundemListeSatir({
  g,
  kisiler,
  istisareler,
  onClick,
}: {
  g: GundemDetay;
  kisiler: { id: string; ad: string }[];
  istisareler: { id: string; tarih: string }[];
  onClick: () => void;
}) {
  const geciken = isGeciken(g);
  const durum = GUNDEM_DURUMLAR.find((d) => d.id === g.durum)!;
  const istisare = istisareler.find((i) => i.id === g.istisare_id);
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-xl border bg-card p-3 text-left transition-colors hover:border-primary/40",
        geciken ? "border-destructive/40 bg-destructive/5" : "border-border",
      )}
    >
      <span className={cn("h-2 w-2 shrink-0 rounded-full", durum.renk)} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm text-foreground">{g.icerik}</div>
        <div className="mt-0.5 flex items-center gap-2 text-[10px] text-muted-foreground">
          {istisare && <span>{format(new Date(istisare.tarih), "d MMM", { locale: tr })}</span>}
          {g.deadline && (
            <span className={cn(geciken && "text-destructive")}>
              ⏱ {format(new Date(g.deadline), "d MMM", { locale: tr })}
            </span>
          )}
          {g.yorum_sayisi > 0 && <span>💬 {g.yorum_sayisi}</span>}
        </div>
      </div>
      {g.sorumlu_ids.length > 0 && (
        <div className="flex -space-x-1.5">
          {g.sorumlu_ids.slice(0, 3).map((id) => {
            const k = kisiler.find((x) => x.id === id);
            if (!k) return null;
            return (
              <Avatar key={id} className="h-5 w-5 border border-card">
                <AvatarFallback className="bg-muted text-[8px]">
                  {k.ad.split(" ").map((p) => p[0]).join("").slice(0, 2)}
                </AvatarFallback>
              </Avatar>
            );
          })}
        </div>
      )}
      <Badge variant="outline" className="shrink-0 text-[10px]">
        {durum.ad}
      </Badge>
    </button>
  );
}