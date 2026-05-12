import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  addDays, addMonths, addYears, endOfMonth, endOfWeek, format, isSameDay,
  isSameMonth, startOfDay, startOfMonth, startOfWeek, subMonths, subWeeks,
  getISOWeek, max as dMax, min as dMin,
} from "date-fns";
import { tr } from "date-fns/locale";
import {
  ChevronLeft, ChevronRight, Plus, Search, Settings, Calendar as CalIcon,
  Download, Upload, ArrowLeft, Menu, Edit, Copy, Trash2, Palette,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem,
  ContextMenuSeparator, ContextMenuSub, ContextMenuSubTrigger, ContextMenuSubContent,
} from "@/components/ui/context-menu";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useTakvimler, useTakvimMutasyonlari, useEtkinlikler, useEtkinlikMutasyonlari } from "@/lib/takvim/hooks";
import { genisletListe } from "@/lib/takvim/tekrar";
import { yerlestir } from "@/lib/takvim/cakisma";
import { TAKVIM_RENKLERI, rengiBul } from "@/lib/takvim/renkler";
import { disaAktar, indir, iceAktar } from "@/lib/takvim/ics";
import { useAuth } from "@/lib/auth-context";
import { EtkinlikDialog } from "@/components/takvim/etkinlik-dialog";
import type { Etkinlik, EtkinlikOlay, Gorunum, Takvim } from "@/lib/takvim/tipler";
import { toast } from "sonner";

export const Route = createFileRoute("/takvim")({ component: TakvimSayfa });

const SAAT_PX = 48;

function useMedya(q: string) {
  const [m, setM] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia(q);
    const h = () => setM(mq.matches);
    h();
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, [q]);
  return m;
}

function TakvimSayfa() {
  const { user } = useAuth();
  const { data: takvimler = [] } = useTakvimler();
  const { data: etkinlikler = [] } = useEtkinlikler();
  const m = useEtkinlikMutasyonlari();
  const mobil = useMedya("(max-width: 767px)");

  const [gorunum, setGorunum] = React.useState<Gorunum>("ay");
  const [ankara, setAnkara] = React.useState(new Date());
  const [arama, setArama] = React.useState("");
  const [yanSheet, setYanSheet] = React.useState(false);
  const [diyAcik, setDiyAcik] = React.useState(false);
  const [duzenle, setDuzenle] = React.useState<Etkinlik | null>(null);
  const [diyBas, setDiyBas] = React.useState<Date | undefined>();
  const [diyBit, setDiyBit] = React.useState<Date | undefined>();
  const [diyTumGun, setDiyTumGun] = React.useState(false);

  // Mobilde haftalık görünümü zorla güne düşürme — kullanıcı isterse görsün.

  const gorunurMap = React.useMemo(() => {
    const x: Record<string, boolean> = {};
    for (const t of takvimler) x[t.id] = t.gorunur;
    return x;
  }, [takvimler]);

  const tmu = useTakvimMutasyonlari();

  const [pencereBas, pencereBit] = React.useMemo<[Date, Date]>(() => {
    if (gorunum === "ay") {
      const ab = startOfMonth(ankara), ae = endOfMonth(ankara);
      return [startOfWeek(ab, { weekStartsOn: 1 }), endOfWeek(ae, { weekStartsOn: 1 })];
    }
    if (gorunum === "hafta") {
      const b = startOfWeek(ankara, { weekStartsOn: 1 });
      return [b, addDays(b, 6)];
    }
    if (gorunum === "gun") return [startOfDay(ankara), addDays(startOfDay(ankara), 1)];
    return [startOfMonth(ankara), endOfMonth(addMonths(ankara, 11))];
  }, [gorunum, ankara]);

  const olaylar = React.useMemo(() => {
    const filt = etkinlikler.filter((e) => e.takvim_id && gorunurMap[e.takvim_id]);
    return genisletListe(filt, pencereBas, addDays(pencereBit, 1));
  }, [etkinlikler, gorunurMap, pencereBas, pencereBit]);

  const aramaSonuc = React.useMemo(() => {
    if (!arama.trim()) return [];
    const q = arama.toLowerCase();
    return etkinlikler.filter(
      (e) => e.baslik.toLowerCase().includes(q) || (e.aciklama ?? "").toLowerCase().includes(q) || (e.konum ?? "").toLowerCase().includes(q),
    ).slice(0, 10);
  }, [arama, etkinlikler]);

  const baslikYazi = React.useMemo(() => {
    if (gorunum === "yil") return format(ankara, "yyyy");
    if (gorunum === "gun") return format(ankara, mobil ? "d MMM yyyy" : "d MMMM yyyy", { locale: tr });
    if (gorunum === "hafta") {
      const b = startOfWeek(ankara, { weekStartsOn: 1 });
      const s = endOfWeek(ankara, { weekStartsOn: 1 });
      return `${format(b, "d MMM", { locale: tr })} – ${format(s, "d MMM yyyy", { locale: tr })}`;
    }
    return format(ankara, mobil ? "MMM yyyy" : "MMMM yyyy", { locale: tr });
  }, [gorunum, ankara, mobil]);

  const ileri = () => setAnkara((d) => gorunum === "ay" ? addMonths(d, 1) : gorunum === "hafta" ? addDays(d, 7) : gorunum === "gun" ? addDays(d, 1) : addYears(d, 1));
  const geri = () => setAnkara((d) => gorunum === "ay" ? subMonths(d, 1) : gorunum === "hafta" ? subWeeks(d, 1) : gorunum === "gun" ? addDays(d, -1) : addYears(d, -1));
  const bugun = () => setAnkara(new Date());

  const yeniEtkinlik = (bas?: Date, bit?: Date, tg = false) => {
    setDuzenle(null);
    setDiyBas(bas ?? new Date());
    setDiyBit(bit ?? (bas ? new Date(bas.getTime() + 3600_000) : undefined));
    setDiyTumGun(tg);
    setDiyAcik(true);
  };

  const olayDuzenle = (e: Etkinlik) => {
    setDuzenle(e);
    setDiyBas(undefined); setDiyBit(undefined); setDiyTumGun(false);
    setDiyAcik(true);
  };

  const olayCogalt = async (e: Etkinlik) => {
    await m.ekle.mutateAsync({
      baslik: e.baslik + " (kopya)", aciklama: e.aciklama, konum: e.konum,
      baslangic: e.baslangic, bitis: e.bitis, tum_gun: e.tum_gun,
      tum_gun_bitis: e.tum_gun_bitis, takvim_id: e.takvim_id, renk: e.renk,
      tekrar: e.tekrar, tekrar_kural: e.tekrar_kural, hatirlatici_dk: e.hatirlatici_dk,
    });
    toast.success("Çoğaltıldı");
  };
  const olaySil = async (e: Etkinlik) => {
    await m.sil.mutateAsync(e.id);
    toast.success("Silindi");
  };
  const olayRenkDegistir = async (e: Etkinlik, renk: string | null) => {
    await m.guncelle.mutateAsync({ id: e.id, renk });
  };

  React.useEffect(() => {
    const f = (e: KeyboardEvent) => {
      if (diyAcik) return;
      const t = e.target as HTMLElement;
      if (t.tagName === "INPUT" || t.tagName === "TEXTAREA") return;
      if (e.key.toLowerCase() === "t") bugun();
      else if (e.key.toLowerCase() === "m") setGorunum("ay");
      else if (e.key.toLowerCase() === "w") setGorunum("hafta");
      else if (e.key.toLowerCase() === "d") setGorunum("gun");
      else if (e.key.toLowerCase() === "y") setGorunum("yil");
      else if (e.key === "ArrowLeft") geri();
      else if (e.key === "ArrowRight") ileri();
      else if (e.key.toLowerCase() === "n") yeniEtkinlik(ankara);
    };
    window.addEventListener("keydown", f);
    return () => window.removeEventListener("keydown", f);
  }, [diyAcik, gorunum, ankara]);

  React.useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
    const timers: ReturnType<typeof setTimeout>[] = [];
    const simdi = Date.now();
    for (const e of etkinlikler) {
      if (e.hatirlatici_dk == null) continue;
      const t = new Date(e.baslangic).getTime() - e.hatirlatici_dk * 60_000;
      const fark = t - simdi;
      if (fark > 0 && fark < 24 * 3600_000) {
        timers.push(setTimeout(() => {
          toast(e.baslik, { description: format(new Date(e.baslangic), "HH:mm") + (e.konum ? " · " + e.konum : "") });
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification(e.baslik, { body: format(new Date(e.baslangic), "HH:mm") });
          }
        }, fark));
      }
    }
    return () => { timers.forEach(clearTimeout); };
  }, [etkinlikler]);

  // Swipe gezinti (mobilde ana grid)
  const swipeRef = React.useRef<{ x: number; y: number; t: number } | null>(null);
  const swipeBaslat = (e: React.TouchEvent) => {
    if (!mobil) return;
    const t = e.touches[0];
    swipeRef.current = { x: t.clientX, y: t.clientY, t: Date.now() };
  };
  const swipeBitir = (e: React.TouchEvent) => {
    if (!mobil || !swipeRef.current) return;
    const s = swipeRef.current;
    const t = e.changedTouches[0];
    const dx = t.clientX - s.x, dy = t.clientY - s.y, dt = Date.now() - s.t;
    swipeRef.current = null;
    if (dt > 600 || Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    if (dx < 0) ileri(); else geri();
  };

  const bugunSayisi = etkinlikler.filter((e) => isSameDay(new Date(e.baslangic), new Date())).length;

  const ics = () => { indir(disaAktar(etkinlikler), "takvim.ics"); };
  const icsYukle = async (file: File) => {
    if (!takvimler[0]) return;
    const t = await file.text();
    const liste = iceAktar(t, takvimler[0].id, user!.id);
    for (const e of liste) {
      const { user_id: _u, ...rest } = e;
      await m.ekle.mutateAsync(rest);
    }
    toast.success(`${liste.length} etkinlik içe aktarıldı`);
  };

  const yaklaşan = React.useMemo(() => {
    const simdi = new Date();
    return genisletListe(etkinlikler, simdi, addDays(simdi, 7))
      .sort((a, b) => a.olayBaslangic.getTime() - b.olayBaslangic.getTime())
      .slice(0, 5);
  }, [etkinlikler]);

  const yanIcerik = (
    <div className="flex flex-col gap-4">
      <Button size="sm" className="self-start" onClick={() => { yeniEtkinlik(ankara); setYanSheet(false); }}><Plus className="mr-1 h-4 w-4" />Oluştur</Button>
      <MiniTakvim ankara={ankara} setAnkara={(d) => { setAnkara(d); if (mobil) setYanSheet(false); }} olaylar={olaylar} />
      <TakvimListesi takvimler={takvimler} onToggle={(t) => tmu.guncelle.mutate({ id: t.id, gorunur: !t.gorunur })} onYeni={(ad, renk) => tmu.ekle.mutate({ ad, renk })} onSil={(id) => tmu.sil.mutate(id)} />
      <YaklaşanListesi olaylar={yaklaşan} takvimler={takvimler} onClick={(o) => { olayDuzenle(o); setYanSheet(false); }} />
    </div>
  );

  return (
    <div className="flex h-svh flex-col bg-background">
      <header className="flex h-14 shrink-0 items-center gap-1.5 border-b border-border bg-card px-2 md:gap-2 md:px-3">
        <Link to="/" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /></Link>
        {/* Hamburger menü düğmesi sadece sidebar gizliyken (mobile + tablet) görünür */}
        <Button variant="ghost" size="icon" onClick={() => setYanSheet(true)} aria-label="Menü" className="md:hidden"><Menu className="h-5 w-5" /></Button>
        <CalIcon className="hidden h-5 w-5 text-primary md:block" />
        <Button variant="outline" size="sm" onClick={bugun} className="ml-0.5 px-2 text-xs md:px-3 md:text-sm">Bugün</Button>
        <Button variant="ghost" size="icon" onClick={geri}><ChevronLeft className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" onClick={ileri}><ChevronRight className="h-4 w-4" /></Button>
        <h1 className="ml-0.5 min-w-0 truncate text-sm font-medium tabular-nums md:text-lg">{baslikYazi}</h1>
        {bugunSayisi > 0 && !mobil && (
          <span className="ml-2 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary">{bugunSayisi} bugün</span>
        )}
        <div className="ml-auto flex items-center gap-1 md:gap-2">
          <Popover>
            <PopoverTrigger asChild><Button variant="ghost" size="icon"><Search className="h-4 w-4" /></Button></PopoverTrigger>
            <PopoverContent className="w-80 p-2" align="end">
              <Input placeholder="Etkinlik ara..." value={arama} onChange={(e) => setArama(e.target.value)} autoFocus />
              {aramaSonuc.length > 0 && (
                <div className="mt-2 max-h-72 overflow-y-auto">
                  {aramaSonuc.map((e) => (
                    <button key={e.id} onClick={() => { setAnkara(new Date(e.baslangic)); setGorunum("gun"); olayDuzenle(e); setArama(""); }} className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-accent">
                      <span className="h-2 w-2 rounded-full" style={{ background: rengiBul(e.renk ?? takvimler.find((t) => t.id === e.takvim_id)?.renk) }} />
                      <span className="flex-1 truncate">{e.baslik}</span>
                      <span className="text-xs text-muted-foreground">{format(new Date(e.baslangic), "d MMM", { locale: tr })}</span>
                    </button>
                  ))}
                </div>
              )}
            </PopoverContent>
          </Popover>
          <Select value={gorunum} onValueChange={(v) => setGorunum(v as Gorunum)}>
            <SelectTrigger className="h-8 w-20 md:w-24"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="gun">Gün</SelectItem>
              <SelectItem value="hafta">Hafta</SelectItem>
              <SelectItem value="ay">Ay</SelectItem>
              <SelectItem value="yil">Yıl</SelectItem>
            </SelectContent>
          </Select>
          {!mobil && <Button size="sm" onClick={() => yeniEtkinlik(ankara)}><Plus className="mr-1 h-4 w-4" />Oluştur</Button>}
          <Popover>
            <PopoverTrigger asChild><Button variant="ghost" size="icon"><Settings className="h-4 w-4" /></Button></PopoverTrigger>
            <PopoverContent align="end" className="w-52 p-2">
              <button className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent" onClick={ics}>
                <Download className="h-4 w-4" />.ics dışa aktar
              </button>
              <label className="flex w-full cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent">
                <Upload className="h-4 w-4" />.ics içe aktar
                <input type="file" accept=".ics" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) icsYukle(f); e.target.value = ""; }} />
              </label>
            </PopoverContent>
          </Popover>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-64 shrink-0 flex-col gap-4 overflow-y-auto border-r border-border p-3 md:flex">
          {yanIcerik}
        </aside>
        <Sheet open={yanSheet} onOpenChange={setYanSheet}>
          <SheetContent side="left" className="w-72 overflow-y-auto p-4">
            {yanIcerik}
          </SheetContent>
        </Sheet>

        <main className="min-w-0 flex-1 overflow-hidden" onTouchStart={swipeBaslat} onTouchEnd={swipeBitir}>
          {gorunum === "ay" && <AyGorunumu ankara={ankara} olaylar={olaylar} takvimler={takvimler} onGunClick={(g) => yeniEtkinlik(new Date(g.getFullYear(), g.getMonth(), g.getDate(), 9, 0), undefined, false)} onOlayClick={olayDuzenle} onOlayCogalt={olayCogalt} onOlaySil={olaySil} onOlayRenk={olayRenkDegistir} />}
          {(gorunum === "hafta" || gorunum === "gun") && (
            <HaftaGorunumu
              gunler={gorunum === "gun" ? [ankara] : Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(ankara, { weekStartsOn: 1 }), i))}
              olaylar={olaylar}
              takvimler={takvimler}
              onAralikSec={(b, bi) => yeniEtkinlik(b, bi, false)}
              onOlayClick={olayDuzenle}
              onOlayCogalt={olayCogalt}
              onOlaySil={olaySil}
              onOlayRenk={olayRenkDegistir}
              onMove={(o, yeniBas) => {
                const sure = o.olayBitis.getTime() - o.olayBaslangic.getTime();
                m.guncelle.mutate({ id: o.id, baslangic: yeniBas.toISOString(), bitis: new Date(yeniBas.getTime() + sure).toISOString() });
              }}
              onResize={(o, yeniBitis) => {
                m.guncelle.mutate({ id: o.id, bitis: yeniBitis.toISOString() });
              }}
            />
          )}
          {gorunum === "yil" && <YilGorunumu yil={ankara.getFullYear()} olaylar={genisletListe(etkinlikler.filter((e) => e.takvim_id && gorunurMap[e.takvim_id]), startOfMonth(new Date(ankara.getFullYear(), 0, 1)), endOfMonth(new Date(ankara.getFullYear(), 11, 1)))} onAyClick={(d) => { setAnkara(d); setGorunum("ay"); }} />}
        </main>
      </div>

      {mobil && (
        <nav className="grid shrink-0 grid-cols-6 border-t border-border bg-card">
          {([
            ["gun", "Gün"], ["hafta", "Hafta"], ["ay", "Ay"], ["yil", "Yıl"],
          ] as Array<[Gorunum, string]>).map(([v, e]) => (
            <button key={v} onClick={() => setGorunum(v)} className={cn("py-2 text-xs font-medium", gorunum === v ? "text-primary" : "text-muted-foreground")}>{e}</button>
          ))}
          <button onClick={bugun} className="py-2 text-xs font-medium text-muted-foreground">Bugün</button>
          <button onClick={() => yeniEtkinlik(ankara)} className="flex items-center justify-center bg-primary text-primary-foreground"><Plus className="h-5 w-5" /></button>
        </nav>
      )}

      <EtkinlikDialog acik={diyAcik} onOpenChange={setDiyAcik} duzenle={duzenle} baslangic={diyBas} bitis={diyBit} tumGun={diyTumGun} takvimler={takvimler} />
    </div>
  );
}

function MiniTakvim({ ankara, setAnkara, olaylar }: { ankara: Date; setAnkara: (d: Date) => void; olaylar: EtkinlikOlay[] }) {
  const [m, setM] = React.useState(ankara);
  React.useEffect(() => setM(ankara), [ankara]);
  const ab = startOfMonth(m), ae = endOfMonth(m);
  const gb = startOfWeek(ab, { weekStartsOn: 1 });
  const ge = endOfWeek(ae, { weekStartsOn: 1 });
  const gunler: Date[] = [];
  for (let d = gb; d <= ge; d = addDays(d, 1)) gunler.push(d);
  const dolu = new Set(olaylar.map((o) => format(o.olayBaslangic, "yyyy-MM-dd")));
  return (
    <div className="text-xs">
      <div className="flex items-center justify-between pb-1">
        <button onClick={() => setM(subMonths(m, 1))}><ChevronLeft className="h-3 w-3" /></button>
        <span className="font-medium">{format(m, "MMMM yyyy", { locale: tr })}</span>
        <button onClick={() => setM(addMonths(m, 1))}><ChevronRight className="h-3 w-3" /></button>
      </div>
      <div className="grid grid-cols-7 text-[10px] text-muted-foreground">
        {["P","S","Ç","P","C","C","P"].map((g, i) => <div key={i} className="py-0.5 text-center">{g}</div>)}
      </div>
      <div className="grid grid-cols-7">
        {gunler.map((g) => {
          const buAy = isSameMonth(g, m);
          const aktif = isSameDay(g, ankara);
          const today = isSameDay(g, new Date());
          return (
            <button key={g.toISOString()} onClick={() => setAnkara(g)} className={cn("relative aspect-square rounded text-[11px]", !buAy && "text-muted-foreground/40", aktif && "bg-primary text-primary-foreground", !aktif && today && "font-bold text-primary", !aktif && "hover:bg-accent")}>
              {format(g, "d")}
              {dolu.has(format(g, "yyyy-MM-dd")) && !aktif && <span className="absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TakvimListesi({ takvimler, onToggle, onYeni, onSil }: { takvimler: Takvim[]; onToggle: (t: Takvim) => void; onYeni: (ad: string, renk: string) => void; onSil: (id: string) => void }) {
  const [acik, setAcik] = React.useState(false);
  const [ad, setAd] = React.useState("");
  const [renk, setRenk] = React.useState("cal-2");
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase text-muted-foreground">Takvimlerim</span>
        <button className="text-xs text-primary hover:underline" onClick={() => setAcik(true)}>+ Yeni</button>
      </div>
      {takvimler.map((t) => (
        <div key={t.id} className="group flex items-center gap-2 rounded px-1 py-0.5 text-sm hover:bg-accent">
          <Checkbox checked={t.gorunur} onCheckedChange={() => onToggle(t)} className="h-4 w-4" style={{ background: t.gorunur ? rengiBul(t.renk) : undefined, borderColor: rengiBul(t.renk) }} />
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: rengiBul(t.renk) }} />
          <span className="flex-1 truncate">{t.ad}</span>
          {!t.is_default && (
            <button className="invisible text-xs text-muted-foreground hover:text-destructive group-hover:visible" onClick={() => onSil(t.id)}>×</button>
          )}
        </div>
      ))}
      <Dialog open={acik} onOpenChange={setAcik}>
        <DialogContent>
          <DialogHeader><DialogTitle>Yeni takvim</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div><Label>Ad</Label><Input value={ad} onChange={(e) => setAd(e.target.value)} /></div>
            <div>
              <Label>Renk</Label>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {TAKVIM_RENKLERI.map((r) => (
                  <button key={r.id} onClick={() => setRenk(r.id)} className={`h-7 w-7 rounded-full border-2 ${renk === r.id ? "border-foreground" : "border-transparent"}`}>
                    <span className="block h-full w-full rounded-full" style={{ background: r.oklch }} />
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAcik(false)}>İptal</Button>
            <Button onClick={() => { if (ad.trim()) { onYeni(ad.trim(), renk); setAd(""); setAcik(false); } }}>Oluştur</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function YaklaşanListesi({ olaylar, takvimler, onClick }: { olaylar: EtkinlikOlay[]; takvimler: Takvim[]; onClick: (e: Etkinlik) => void }) {
  if (olaylar.length === 0) return null;
  return (
    <div className="space-y-1">
      <span className="text-xs font-semibold uppercase text-muted-foreground">Yaklaşan</span>
      {olaylar.map((o, i) => (
        <button key={o.id + i} onClick={() => onClick(o)} className="flex w-full items-center gap-2 rounded px-1 py-1 text-left text-xs hover:bg-accent">
          <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: rengiBul(o.renk ?? takvimler.find((t) => t.id === o.takvim_id)?.renk) }} />
          <div className="min-w-0 flex-1">
            <div className="truncate font-medium">{o.baslik}</div>
            <div className="text-muted-foreground">{format(o.olayBaslangic, "d MMM HH:mm", { locale: tr })}</div>
          </div>
        </button>
      ))}
    </div>
  );
}

/** Etkinlik üzerinde ortak sağ-tık (mobilde uzun-basma) menüsü. */
function OlayMenu({ olay, onDuzenle, onCogalt, onSil, onRenk, children }: {
  olay: EtkinlikOlay;
  onDuzenle: (e: Etkinlik) => void;
  onCogalt: (e: Etkinlik) => void;
  onSil: (e: Etkinlik) => void;
  onRenk: (e: Etkinlik, r: string | null) => void;
  children: React.ReactNode;
}) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem onClick={() => onDuzenle(olay)}><Edit className="mr-2 h-4 w-4" />Düzenle</ContextMenuItem>
        <ContextMenuItem onClick={() => onCogalt(olay)}><Copy className="mr-2 h-4 w-4" />Çoğalt</ContextMenuItem>
        <ContextMenuSub>
          <ContextMenuSubTrigger><Palette className="mr-2 h-4 w-4" />Renk</ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuItem onClick={() => onRenk(olay, null)}>
              <span className="mr-2 h-3 w-3 rounded-full border border-border" />
              Varsayılan
            </ContextMenuItem>
            {TAKVIM_RENKLERI.map((r) => (
              <ContextMenuItem key={r.id} onClick={() => onRenk(olay, r.id)}>
                <span className="mr-2 h-3 w-3 rounded-full" style={{ background: r.oklch }} />
                {r.ad}
              </ContextMenuItem>
            ))}
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={() => onSil(olay)} className="text-destructive focus:text-destructive">
          <Trash2 className="mr-2 h-4 w-4" />Sil
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

type AyProps = {
  ankara: Date; olaylar: EtkinlikOlay[]; takvimler: Takvim[];
  onGunClick: (d: Date) => void;
  onOlayClick: (e: Etkinlik) => void;
  onOlayCogalt: (e: Etkinlik) => void;
  onOlaySil: (e: Etkinlik) => void;
  onOlayRenk: (e: Etkinlik, r: string | null) => void;
};

function AyGorunumu({ ankara, olaylar, takvimler, onGunClick, onOlayClick, onOlayCogalt, onOlaySil, onOlayRenk }: AyProps) {
  const ab = startOfMonth(ankara), ae = endOfMonth(ankara);
  const gb = startOfWeek(ab, { weekStartsOn: 1 });
  const ge = endOfWeek(ae, { weekStartsOn: 1 });
  const gunler: Date[] = [];
  for (let d = gb; d <= ge; d = addDays(d, 1)) gunler.push(d);
  const haftalar: Date[][] = [];
  for (let i = 0; i < gunler.length; i += 7) haftalar.push(gunler.slice(i, i + 7));
  const today = new Date();
  const MAX_SATIR = 3; // her gün hücresinde gösterilecek max etkinlik

  // Her hafta için: bu haftayla kesişen olayları çıkar ve satır ataması yap
  function haftaSegmentleri(haftaBas: Date): Array<{ olay: EtkinlikOlay; baslaCol: number; bitCol: number; satir: number; soldevam: boolean; sagdevam: boolean }> {
    const haftaBit = addDays(haftaBas, 7);
    const ilgili = olaylar
      .filter((o) => o.olayBaslangic < haftaBit && o.olayBitis >= haftaBas)
      .map((o) => {
        const b = dMax([o.olayBaslangic, haftaBas]);
        const s = dMin([o.olayBitis, addDays(haftaBit, -1)]);
        const baslaCol = Math.floor((startOfDay(b).getTime() - haftaBas.getTime()) / 86400_000);
        const bitCol = Math.floor((startOfDay(s).getTime() - haftaBas.getTime()) / 86400_000);
        return {
          olay: o,
          baslaCol: Math.max(0, baslaCol),
          bitCol: Math.min(6, bitCol),
          soldevam: o.olayBaslangic < haftaBas,
          sagdevam: o.olayBitis >= haftaBit,
        };
      })
      .sort((a, b) =>
        (b.bitCol - b.baslaCol) - (a.bitCol - a.baslaCol) ||
        a.olay.olayBaslangic.getTime() - b.olay.olayBaslangic.getTime(),
      );

    // satır ataması (greedy)
    const satirKullanim: boolean[][] = []; // [satir][col]
    const res: Array<{ olay: EtkinlikOlay; baslaCol: number; bitCol: number; satir: number; soldevam: boolean; sagdevam: boolean }> = [];
    for (const it of ilgili) {
      let satir = 0;
      while (true) {
        if (!satirKullanim[satir]) satirKullanim[satir] = Array(7).fill(false);
        let ok = true;
        for (let c = it.baslaCol; c <= it.bitCol; c++) if (satirKullanim[satir][c]) { ok = false; break; }
        if (ok) {
          for (let c = it.baslaCol; c <= it.bitCol; c++) satirKullanim[satir][c] = true;
          res.push({ ...it, satir });
          break;
        }
        satir++;
      }
    }
    return res;
  }

  return (
    <div className="flex h-full flex-col">
      <div className="grid grid-cols-[2rem_repeat(7,1fr)] border-b border-border text-[11px] uppercase text-muted-foreground">
        <div />
        {["Pzt","Sal","Çar","Per","Cum","Cmt","Paz"].map((g) => <div key={g} className="py-1.5 text-center">{g}</div>)}
      </div>
      <div className="grid flex-1 grid-rows-6">
        {haftalar.map((hafta, hi) => {
          const segs = haftaSegmentleri(hafta[0]);
          const fazla: Record<number, number> = {}; // col -> kaç tane MAX_SATIR üstünde
          for (const s of segs) if (s.satir >= MAX_SATIR) for (let c = s.baslaCol; c <= s.bitCol; c++) fazla[c] = (fazla[c] ?? 0) + 1;
          return (
            <div key={hi} className="relative grid grid-cols-[2rem_repeat(7,1fr)] border-b border-border last:border-b-0">
              <div className="flex items-start justify-center pt-1 text-[10px] text-muted-foreground">H{getISOWeek(hafta[0])}</div>
              {hafta.map((g) => {
                const buAy = isSameMonth(g, ankara);
                const isToday = isSameDay(g, today);
                const haftaSonu = g.getDay() === 0 || g.getDay() === 6;
                const f = fazla[Math.floor((startOfDay(g).getTime() - hafta[0].getTime()) / 86400_000)] ?? 0;
                return (
                  <button key={g.toISOString()} onClick={() => onGunClick(g)} className={cn("flex flex-col gap-0.5 border-l border-border p-1 pt-1 text-left transition-colors hover:bg-accent/30", !buAy && "bg-muted/20 text-muted-foreground", haftaSonu && buAy && "bg-muted/10")}>
                    <span className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px]", isToday && "bg-primary text-primary-foreground font-medium")}>{format(g, "d")}</span>
                    <div style={{ height: `${MAX_SATIR * 18 + (f > 0 ? 14 : 0)}px` }} />
                    {f > 0 && <span className="absolute bottom-0.5 text-[10px] text-muted-foreground">+{f} daha</span>}
                  </button>
                );
              })}
              {/* Bantlar */}
              <div className="pointer-events-none absolute inset-x-0 top-6" style={{ left: "2rem" }}>
                {segs.filter((s) => s.satir < MAX_SATIR).map((s, i) => {
                  const renk = rengiBul(s.olay.renk ?? takvimler.find((t) => t.id === s.olay.takvim_id)?.renk);
                  const w = (s.bitCol - s.baslaCol + 1) / 7;
                  const left = (s.baslaCol / 7) * 100;
                  return (
                    <OlayMenu key={i} olay={s.olay} onDuzenle={onOlayClick} onCogalt={onOlayCogalt} onSil={onOlaySil} onRenk={onOlayRenk}>
                      <button
                        onClick={(e) => { e.stopPropagation(); onOlayClick(s.olay); }}
                        className={cn(
                          "pointer-events-auto absolute mx-0.5 truncate px-1.5 py-0.5 text-left text-[10px] text-white",
                          s.soldevam ? "rounded-l-none" : "rounded-l",
                          s.sagdevam ? "rounded-r-none" : "rounded-r",
                        )}
                        style={{ left: `${left}%`, width: `calc(${w * 100}% - 4px)`, top: s.satir * 18, height: 16, background: renk }}
                      >
                        {!s.olay.tum_gun && !s.soldevam && <span className="mr-1 opacity-80">{format(s.olay.olayBaslangic, "HH:mm")}</span>}
                        {s.olay.baslik}
                      </button>
                    </OlayMenu>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

type HaftaProps = {
  gunler: Date[]; olaylar: EtkinlikOlay[]; takvimler: Takvim[];
  onAralikSec: (b: Date, bi: Date) => void;
  onOlayClick: (e: Etkinlik) => void;
  onOlayCogalt: (e: Etkinlik) => void;
  onOlaySil: (e: Etkinlik) => void;
  onOlayRenk: (e: Etkinlik, r: string | null) => void;
  onMove: (o: EtkinlikOlay, yeniBas: Date) => void;
  onResize: (o: EtkinlikOlay, yeniBitis: Date) => void;
};

function HaftaGorunumu({ gunler, olaylar, takvimler, onAralikSec, onOlayClick, onOlayCogalt, onOlaySil, onOlayRenk, onMove, onResize }: HaftaProps) {
  const today = new Date();
  const [now, setNow] = React.useState(new Date());
  React.useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);
  const tumGunler = olaylar.filter((o) => o.tum_gun);
  const saatLi = olaylar.filter((o) => !o.tum_gun);

  // Şu anki saate scroll
  const scrollRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (scrollRef.current) {
      const top = Math.max(0, ((now.getHours() - 1) * SAAT_PX));
      scrollRef.current.scrollTop = top;
    }
    // eslint-disable-next-line
  }, []);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border">
        <div className="grid" style={{ gridTemplateColumns: `3rem repeat(${gunler.length}, 1fr)` }}>
          <div />
          {gunler.map((g) => {
            const isToday = isSameDay(g, today);
            return (
              <div key={g.toISOString()} className="border-l border-border p-1.5 text-center">
                <div className="text-[10px] uppercase text-muted-foreground">{format(g, "EEE", { locale: tr })}</div>
                <div className={cn("mx-auto mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-sm", isToday && "bg-primary text-primary-foreground font-medium")}>{format(g, "d")}</div>
              </div>
            );
          })}
        </div>
        {tumGunler.length > 0 && (
          <div className="grid border-t border-border" style={{ gridTemplateColumns: `3rem repeat(${gunler.length}, 1fr)`, minHeight: "2rem" }}>
            <div className="border-r border-border py-1 pr-1 text-right text-[10px] text-muted-foreground">tüm gün</div>
            {gunler.map((g) => {
              const ogun = tumGunler.filter((o) => isSameDay(o.olayBaslangic, g));
              return (
                <div key={g.toISOString()} className="border-l border-border p-0.5">
                  {ogun.map((o, i) => (
                    <OlayMenu key={o.id + i} olay={o} onDuzenle={onOlayClick} onCogalt={onOlayCogalt} onSil={onOlaySil} onRenk={onOlayRenk}>
                      <button onClick={() => onOlayClick(o)} className="mb-0.5 block w-full truncate rounded px-1 py-0.5 text-left text-[10px] text-white" style={{ background: rengiBul(o.renk ?? takvimler.find((t) => t.id === o.takvim_id)?.renk) }}>
                        {o.baslik}
                      </button>
                    </OlayMenu>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto"
        onDragOver={(e) => {
          // Otomatik dikey scroll: kullanıcı üst/alt kenara yaklaşınca kaydır
          const el = scrollRef.current;
          if (!el) return;
          const r = el.getBoundingClientRect();
          const esik = 60;
          if (e.clientY < r.top + esik) el.scrollTop -= 12;
          else if (e.clientY > r.bottom - esik) el.scrollTop += 12;
        }}
      >
        <div className="relative grid" style={{ gridTemplateColumns: `3rem repeat(${gunler.length}, 1fr)` }}>
          <div>
            {Array.from({ length: 24 }, (_, h) => (
              <div key={h} style={{ height: SAAT_PX }} className="border-b border-border pr-1 text-right text-[10px] text-muted-foreground">
                {h > 0 && `${String(h).padStart(2, "0")}:00`}
              </div>
            ))}
          </div>
          {gunler.map((g) => (
            <GunSutun
              key={g.toISOString()} gun={g}
              olaylar={saatLi.filter((o) => isSameDay(o.olayBaslangic, g))}
              takvimler={takvimler} now={now}
              isToday={isSameDay(g, today)}
              onAralikSec={onAralikSec}
              onOlayClick={onOlayClick}
              onOlayCogalt={onOlayCogalt}
              onOlaySil={onOlaySil}
              onOlayRenk={onOlayRenk}
              onMove={onMove}
              onResize={onResize}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function pxToDk(y: number) {
  return Math.max(0, Math.min(24 * 60 - 15, Math.floor(y / SAAT_PX * 60 / 15) * 15));
}

function GunSutun({ gun, olaylar, takvimler, now, isToday, onAralikSec, onOlayClick, onOlayCogalt, onOlaySil, onOlayRenk, onMove, onResize }: {
  gun: Date; olaylar: EtkinlikOlay[]; takvimler: Takvim[]; now: Date; isToday: boolean;
  onAralikSec: (b: Date, bi: Date) => void;
  onOlayClick: (e: Etkinlik) => void;
  onOlayCogalt: (e: Etkinlik) => void;
  onOlaySil: (e: Etkinlik) => void;
  onOlayRenk: (e: Etkinlik, r: string | null) => void;
  onMove: (o: EtkinlikOlay, yeniBas: Date) => void;
  onResize: (o: EtkinlikOlay, yeniBitis: Date) => void;
}) {
  const yerlesimler = yerlestir(olaylar);
  const ref = React.useRef<HTMLDivElement>(null);
  const [secim, setSecim] = React.useState<{ basDk: number; bitDk: number } | null>(null);
  const secimRef = React.useRef<{ basDk: number; startY: number } | null>(null);

  const localY = (clientY: number) => {
    if (!ref.current) return 0;
    return clientY - ref.current.getBoundingClientRect().top;
  };

  const slotBasla = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("[data-olay]")) return;
    e.preventDefault();
    const y = localY(e.clientY);
    const basDk = pxToDk(y);
    secimRef.current = { basDk, startY: y };
    setSecim({ basDk, bitDk: basDk + 60 });
    const hareket = (ev: MouseEvent) => {
      if (!secimRef.current) return;
      const ny = localY(ev.clientY);
      const dk = pxToDk(ny);
      const a = Math.min(secimRef.current.basDk, dk);
      const b = Math.max(secimRef.current.basDk, dk) + 15;
      setSecim({ basDk: a, bitDk: b });
    };
    const bitir = () => {
      window.removeEventListener("mousemove", hareket);
      window.removeEventListener("mouseup", bitir);
      const s = secim ?? (secimRef.current ? { basDk: secimRef.current.basDk, bitDk: secimRef.current.basDk + 60 } : null);
      secimRef.current = null;
      setSecim(null);
      if (!s) return;
      const b = new Date(gun); b.setHours(0, 0, 0, 0); b.setMinutes(s.basDk);
      const bi = new Date(gun); bi.setHours(0, 0, 0, 0); bi.setMinutes(s.bitDk);
      onAralikSec(b, bi);
    };
    window.addEventListener("mousemove", hareket);
    window.addEventListener("mouseup", bitir);
  };

  const dragHandle = (o: EtkinlikOlay) => (e: React.DragEvent) => {
    // Olayın tüm bilgisini taşıyoruz; günler arası taşımada hedef sütun
    // kaynak olayı kendi filtrelenmiş listesinde bulamıyordu.
    const yuk = {
      ...o,
      olayBaslangic: o.olayBaslangic.toISOString(),
      olayBitis: o.olayBitis.toISOString(),
    };
    e.dataTransfer.setData("application/json", JSON.stringify(yuk));
    e.dataTransfer.setData("text/plain", o.id);
    e.dataTransfer.effectAllowed = "move";
  };
  const drop = (e: React.DragEvent) => {
    e.preventDefault();
    const json = e.dataTransfer.getData("application/json");
    if (!json || !ref.current) return;
    let veri: any;
    try { veri = JSON.parse(json); } catch { return; }
    const o: EtkinlikOlay = {
      ...veri,
      olayBaslangic: new Date(veri.olayBaslangic),
      olayBitis: new Date(veri.olayBitis),
    };
    const dk = pxToDk(localY(e.clientY));
    const d = new Date(gun); d.setHours(0, 0, 0, 0); d.setMinutes(dk);
    onMove(o, d);
  };

  // resize
  const resizeBasla = (o: EtkinlikOlay) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const hareket = (ev: MouseEvent) => {
      if (!ref.current) return;
      const y = localY(ev.clientY);
      const dk = pxToDk(y);
      const yeniBitis = new Date(gun); yeniBitis.setHours(0, 0, 0, 0); yeniBitis.setMinutes(dk + 15);
      if (yeniBitis.getTime() <= o.olayBaslangic.getTime() + 15 * 60_000) return;
      // canlı önizleme: width=fixed; sadece yükseklik değişimi DOM'a yansıtılır via key
      (ev.target as HTMLElement).dispatchEvent(new Event("noop"));
    };
    const bitir = (ev: MouseEvent) => {
      window.removeEventListener("mousemove", hareket);
      window.removeEventListener("mouseup", bitir);
      if (!ref.current) return;
      const y = localY(ev.clientY);
      const dk = pxToDk(y);
      const yeniBitis = new Date(gun); yeniBitis.setHours(0, 0, 0, 0); yeniBitis.setMinutes(dk + 15);
      if (yeniBitis.getTime() > o.olayBaslangic.getTime() + 15 * 60_000) onResize(o, yeniBitis);
    };
    window.addEventListener("mousemove", hareket);
    window.addEventListener("mouseup", bitir);
  };

  return (
    <div ref={ref} className={cn("relative border-l border-border", isToday && "bg-primary/[0.02]")} onMouseDown={slotBasla} onDragOver={(e) => e.preventDefault()} onDrop={drop} style={{ height: 24 * SAAT_PX }}>
      {Array.from({ length: 24 }, (_, h) => (
        <div key={h} className={cn("border-b border-border", h >= 9 && h < 17 && "bg-accent/10")} style={{ height: SAAT_PX }} />
      ))}
      {isToday && (
        <div className="pointer-events-none absolute left-0 right-0 z-10 border-t-2 border-destructive" style={{ top: ((now.getHours() * 60 + now.getMinutes()) / (24 * 60)) * (24 * SAAT_PX) }}>
          <div className="absolute -left-1 -top-1 h-2 w-2 rounded-full bg-destructive" />
        </div>
      )}
      {secim && (
        <div className="pointer-events-none absolute left-0 right-0 z-20 rounded bg-primary/20 ring-1 ring-primary" style={{ top: (secim.basDk / 60) * SAAT_PX, height: ((secim.bitDk - secim.basDk) / 60) * SAAT_PX }}>
          <div className="px-1 text-[10px] font-medium text-primary">{String(Math.floor(secim.basDk / 60)).padStart(2,"0")}:{String(secim.basDk % 60).padStart(2,"0")} – {String(Math.floor(secim.bitDk / 60)).padStart(2,"0")}:{String(secim.bitDk % 60).padStart(2,"0")}</div>
        </div>
      )}
      {yerlesimler.map(({ olay, sutun, toplam }) => {
        const dakBas = olay.olayBaslangic.getHours() * 60 + olay.olayBaslangic.getMinutes();
        const dakBit = olay.olayBitis.getHours() * 60 + olay.olayBitis.getMinutes() || dakBas + 60;
        const top = (dakBas / 60) * SAAT_PX;
        const yuks = Math.max(20, ((dakBit - dakBas) / 60) * SAAT_PX);
        const w = 100 / toplam;
        return (
          <OlayMenu key={olay.id} olay={olay} onDuzenle={onOlayClick} onCogalt={onOlayCogalt} onSil={onOlaySil} onRenk={onOlayRenk}>
            <div data-olay draggable onDragStart={dragHandle(olay)} onClick={(e) => { e.stopPropagation(); onOlayClick(olay); }} onMouseDown={(e) => e.stopPropagation()} className="absolute overflow-hidden rounded text-left text-[10px] text-white shadow-sm cursor-pointer" style={{ top, height: yuks, left: `${sutun * w}%`, width: `calc(${w}% - 2px)`, background: rengiBul(olay.renk ?? takvimler.find((t) => t.id === olay.takvim_id)?.renk) }}>
              <div className="px-1 py-0.5">
                <div className="truncate font-medium">{olay.baslik}</div>
                <div className="truncate opacity-80">{format(olay.olayBaslangic, "HH:mm")} – {format(olay.olayBitis, "HH:mm")}</div>
              </div>
              <div onMouseDown={resizeBasla(olay)} className="absolute inset-x-0 bottom-0 h-1.5 cursor-ns-resize bg-white/20 hover:bg-white/40" />
            </div>
          </OlayMenu>
        );
      })}
    </div>
  );
}

function YilGorunumu({ yil, olaylar, onAyClick }: { yil: number; olaylar: EtkinlikOlay[]; onAyClick: (d: Date) => void }) {
  const dolu = new Set(olaylar.map((o) => format(o.olayBaslangic, "yyyy-MM-dd")));
  const aylar = Array.from({ length: 12 }, (_, i) => new Date(yil, i, 1));
  return (
    <div className="grid h-full grid-cols-2 gap-3 overflow-y-auto p-4 sm:grid-cols-3 lg:grid-cols-4">
      {aylar.map((m) => {
        const ab = startOfMonth(m), ae = endOfMonth(m);
        const gb = startOfWeek(ab, { weekStartsOn: 1 });
        const ge = endOfWeek(ae, { weekStartsOn: 1 });
        const gunler: Date[] = [];
        for (let d = gb; d <= ge; d = addDays(d, 1)) gunler.push(d);
        return (
          <button key={m.toISOString()} onClick={() => onAyClick(m)} className="rounded-lg border border-border p-2 text-left transition-colors hover:bg-accent">
            <div className="mb-1 text-sm font-medium">{format(m, "MMMM", { locale: tr })}</div>
            <div className="grid grid-cols-7 text-[9px] text-muted-foreground">
              {["P","S","Ç","P","C","C","P"].map((g, i) => <div key={i} className="text-center">{g}</div>)}
            </div>
            <div className="grid grid-cols-7">
              {gunler.map((g) => {
                const buAy = isSameMonth(g, m);
                const today = isSameDay(g, new Date());
                return (
                  <div key={g.toISOString()} className={cn("relative aspect-square text-center text-[10px] leading-[1.6]", !buAy && "text-muted-foreground/30", today && "rounded-full bg-primary text-primary-foreground")}>
                    {format(g, "d")}
                    {buAy && dolu.has(format(g, "yyyy-MM-dd")) && !today && <span className="absolute bottom-0 left-1/2 h-0.5 w-0.5 -translate-x-1/2 rounded-full bg-primary" />}
                  </div>
                );
              })}
            </div>
          </button>
        );
      })}
    </div>
  );
}
