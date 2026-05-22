import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  addDays, addMonths, addYears, endOfWeek, format, isSameDay,
  startOfDay, startOfMonth, startOfWeek, subMonths, subWeeks, endOfMonth,
} from "date-fns";
import { tr } from "date-fns/locale";
import {
  ChevronLeft, ChevronRight, Plus, Search, Calendar as CalIcon,
  Download, Upload, Menu, MoreHorizontal, ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useTakvimler, useTakvimMutasyonlari, useEtkinlikler, useEtkinlikMutasyonlari } from "@/lib/takvim/hooks";
import { genisletListe } from "@/lib/takvim/tekrar";
import { rengiBul } from "@/lib/takvim/renkler";
import { disaAktar, indir, iceAktar } from "@/lib/takvim/ics";
import { useAuth } from "@/lib/auth-context";
import { EtkinlikDialog } from "@/components/mizan/takvim/etkinlik-dialog";
import { EtkinlikHizliPopover } from "@/components/mizan/takvim/etkinlik-hizli-popover";
import { MiniTakvim } from "@/components/mizan/takvim/mini-takvim";
import { TakvimListesi } from "@/components/mizan/takvim/takvim-listesi";
import { YaklasanListesi } from "@/components/mizan/takvim/yaklasan-listesi";
import { AyGorunumu } from "@/components/mizan/takvim/ay-gorunumu";
import { HaftaGorunumu } from "@/components/mizan/takvim/hafta-gorunumu";
import { YilGorunumu } from "@/components/mizan/takvim/yil-gorunumu";
import type { Etkinlik, EtkinlikOlay, Gorunum, Takvim } from "@/lib/takvim/tipler";
import { toast } from "sonner";

export const Route = createFileRoute("/takvim")({ component: TakvimSayfa });

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

  const [gorunum, setGorunum] = React.useState<Gorunum>("hafta");
  const [ankara, setAnkara] = React.useState(new Date());
  const [arama, setArama] = React.useState("");
  const [yanSheet, setYanSheet] = React.useState(false);
  const [diyAcik, setDiyAcik] = React.useState(false);
  const [duzenle, setDuzenle] = React.useState<Etkinlik | null>(null);
  const [diyBas, setDiyBas] = React.useState<Date | undefined>();
  const [diyBit, setDiyBit] = React.useState<Date | undefined>();
  const [diyTumGun, setDiyTumGun] = React.useState(false);
  const [hizli, setHizli] = React.useState<{ olay: EtkinlikOlay; rect: { x: number; y: number; width: number; height: number } } | null>(null);
  const aramaRef = React.useRef<HTMLInputElement>(null);
  const [aramaAcik, setAramaAcik] = React.useState(false);
  const [baslikPop, setBaslikPop] = React.useState(false);

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
    // Salt-okunur mod: yeni etkinlik takvimden eklenmez.
    // Faaliyetler /network (Rehberlik) üzerinden planlanır.
    void bas; void bit; void tg;
  };

  const olayDuzenle = (e: Etkinlik) => {
    setDuzenle(e);
    setDiyBas(undefined); setDiyBit(undefined); setDiyTumGun(false);
    setDiyAcik(true);
  };

  const olayHizli = (o: EtkinlikOlay, ev: React.MouseEvent) => {
    const el = ev.currentTarget as HTMLElement;
    const r = el.getBoundingClientRect();
    setHizli({ olay: o, rect: { x: r.left, y: r.top, width: r.width, height: r.height } });
  };
  const hizliKapatVeDuzenle = (e: Etkinlik) => { setHizli(null); olayDuzenle(e); };
  const hizliKapatVeCogalt = async (e: Etkinlik) => { setHizli(null); await olayCogalt(e); };
  const hizliKapatVeSil = async (e: Etkinlik) => { setHizli(null); await olaySil(e); };

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
      else if (e.key.toLowerCase() === "c") yeniEtkinlik(ankara);
      else if (e.key.toLowerCase() === "g") setGorunum("gun");
      else if (e.key === "/") { e.preventDefault(); aramaRef.current?.focus(); }
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
      <Link
        to="/network"
        onClick={() => setYanSheet(false)}
        className="inline-flex items-center gap-1.5 self-start rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-sm hover:opacity-90"
      >
        <Plus className="h-3.5 w-3.5" />Faaliyet planla
      </Link>
      <p className="rounded-md border border-dashed border-border bg-muted/30 px-2.5 py-2 text-[11px] leading-snug text-muted-foreground">
        Planlama salt-okunurdur. Yeni faaliyet eklemek için Rehberlik'i kullanın.
      </p>
      <MiniTakvim ankara={ankara} setAnkara={(d) => { setAnkara(d); if (mobil) setYanSheet(false); }} olaylar={olaylar} />
      <TakvimListesi takvimler={takvimler} onToggle={(t) => tmu.guncelle.mutate({ id: t.id, gorunur: !t.gorunur })} onYeni={(ad, renk) => tmu.ekle.mutate({ ad, renk })} onSil={(id) => tmu.sil.mutate(id)} />
      <YaklasanListesi olaylar={yaklaşan} takvimler={takvimler} onClick={(o) => { olayDuzenle(o); setYanSheet(false); }} />
    </div>
  );

  return (
    <div className="flex h-svh flex-col bg-background">
      <header className="flex h-14 shrink-0 items-center gap-1.5 border-b border-border bg-card px-2 md:gap-2 md:px-3">
        <Button variant="ghost" size="icon" onClick={() => setYanSheet(true)} aria-label="Menü" className="md:hidden"><Menu className="h-5 w-5" /></Button>
        <Link to="/" className="hidden md:block text-primary hover:opacity-80" aria-label="Ana sayfa"><CalIcon className="h-5 w-5" /></Link>
        <Button variant="outline" size="sm" onClick={bugun} className="ml-0.5 px-2 text-xs md:px-3 md:text-sm">Bugün</Button>
        <Button variant="ghost" size="icon" onClick={geri} aria-label="Önceki"><ChevronLeft className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" onClick={ileri} aria-label="Sonraki"><ChevronRight className="h-4 w-4" /></Button>
        <Popover open={baslikPop} onOpenChange={setBaslikPop}>
          <PopoverTrigger asChild>
            <button className="ml-0.5 flex min-w-0 items-center gap-1 truncate rounded px-1.5 py-1 text-sm font-medium tabular-nums hover:bg-accent md:text-lg">
              <span className="truncate">{baslikYazi}</span>
              <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-60" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" align="start">
            <MiniTakvim ankara={ankara} setAnkara={(d) => { setAnkara(d); setBaslikPop(false); }} olaylar={olaylar} />
          </PopoverContent>
        </Popover>
        <div className="ml-auto flex items-center gap-1 md:gap-2">
          {/* Desktop inline arama */}
          <Popover open={aramaAcik && aramaSonuc.length > 0} onOpenChange={setAramaAcik}>
            <PopoverTrigger asChild>
              <div className="relative hidden md:block">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  ref={aramaRef}
                  placeholder="Ara…  /"
                  value={arama}
                  onChange={(e) => { setArama(e.target.value); setAramaAcik(true); }}
                  onFocus={() => setAramaAcik(true)}
                  className="h-8 w-44 pl-7 text-sm transition-all focus:w-64"
                />
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-1" align="end" onOpenAutoFocus={(e) => e.preventDefault()}>
              {aramaSonuc.length > 0 && (
                <div className="max-h-72 overflow-y-auto">
                  {aramaSonuc.map((e) => (
                    <button key={e.id} onClick={() => { setAnkara(new Date(e.baslangic)); setGorunum("gun"); olayDuzenle(e); setArama(""); setAramaAcik(false); }} className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-accent">
                      <span className="h-2 w-2 rounded-full" style={{ background: rengiBul(e.renk ?? takvimler.find((t) => t.id === e.takvim_id)?.renk) }} />
                      <span className="flex-1 truncate">{e.baslik}</span>
                      <span className="text-xs text-muted-foreground">{format(new Date(e.baslangic), "d MMM", { locale: tr })}</span>
                    </button>
                  ))}
                </div>
              )}
            </PopoverContent>
          </Popover>
          {/* Mobil arama */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden"><Search className="h-4 w-4" /></Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-2" align="end">
              <Input placeholder="Etkinlik ara…" value={arama} onChange={(e) => setArama(e.target.value)} autoFocus />
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
          {/* Desktop görünüm segmented control */}
          <div className="hidden items-center gap-0.5 rounded-md border border-border p-0.5 md:flex">
            {(["gun","hafta","ay","yil"] as Gorunum[]).map((v) => (
              <button
                key={v}
                onClick={() => setGorunum(v)}
                className={cn(
                  "rounded px-2.5 py-1 text-xs font-medium transition-colors",
                  gorunum === v ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {v === "gun" ? "Gün" : v === "hafta" ? "Hafta" : v === "ay" ? "Ay" : "Yıl"}
              </button>
            ))}
          </div>
          {!mobil && (
            <Link
              to="/network"
              className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90"
            >
              <Plus className="mr-0.5 h-4 w-4" />Faaliyet planla
            </Link>
          )}
          <Popover>
            <PopoverTrigger asChild><Button variant="ghost" size="icon" aria-label="Daha fazla"><MoreHorizontal className="h-4 w-4" /></Button></PopoverTrigger>
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
          {gorunum === "ay" && <AyGorunumu ankara={ankara} olaylar={olaylar} takvimler={takvimler} onGunClick={(g) => yeniEtkinlik(new Date(g.getFullYear(), g.getMonth(), g.getDate(), 9, 0), undefined, false)} onOlayClick={olayHizli} onOlayDuzenle={olayDuzenle} onOlayCogalt={olayCogalt} onOlaySil={olaySil} onOlayRenk={olayRenkDegistir} />}
          {(gorunum === "hafta" || gorunum === "gun") && (
            <HaftaGorunumu
              gunler={gorunum === "gun" ? [ankara] : Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(ankara, { weekStartsOn: 1 }), i))}
              olaylar={olaylar}
              takvimler={takvimler}
              onAralikSec={(b, bi) => yeniEtkinlik(b, bi, false)}
              onOlayClick={olayHizli}
              onOlayDuzenle={olayDuzenle}
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
        <>
          <nav className="grid shrink-0 grid-cols-4 border-t border-border bg-card">
            {([
              ["gun", "Gün"], ["hafta", "Hafta"], ["ay", "Ay"], ["yil", "Yıl"],
            ] as Array<[Gorunum, string]>).map(([v, e]) => (
              <button key={v} onClick={() => setGorunum(v)} className={cn("py-2.5 text-xs font-medium transition-colors", gorunum === v ? "text-primary" : "text-muted-foreground")}>{e}</button>
            ))}
          </nav>
        </>
      )}

      <EtkinlikDialog acik={diyAcik} onOpenChange={setDiyAcik} duzenle={duzenle} baslangic={diyBas} bitis={diyBit} tumGun={diyTumGun} takvimler={takvimler} />
      <EtkinlikHizliPopover
        hizli={hizli}
        onOpenChange={(o) => { if (!o) setHizli(null); }}
        takvimler={takvimler}
        onDuzenle={hizliKapatVeDuzenle}
        onCogalt={hizliKapatVeCogalt}
        onSil={hizliKapatVeSil}
      />
    </div>
  );
}
