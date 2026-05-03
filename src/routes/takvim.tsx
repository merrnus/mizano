import * as React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { tr } from "date-fns/locale";
import { ArrowLeft, ChevronLeft, ChevronRight, PanelRightClose, PanelRightOpen, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  useEtkinlikler,
  useGorevler,
  useEtkinlikGuncelle,
  genisletEtkinlikleri,
  type EtkinlikOlay,
} from "@/lib/takvim-hooks";
import {
  useDersler,
  useDersSaatleri,
  useSinavlar,
  useProjeler,
} from "@/lib/ilim-hooks";
import { ilimOlayDersId, ilimOlaylari, isIlimOlay } from "@/lib/ilim-takvim";
import { useAmelKurslar, useAmelProjeler } from "@/lib/amel-hooks";
import { amelOlaylari, amelOlayKursId, amelOlayProjeId, isAmelOlay } from "@/lib/amel-takvim";
import {
  type TakvimEtkinlik,
  type TakvimGorev,
  type TakvimGorunum,
} from "@/lib/takvim-tipleri";
import { HaftaGorunumu } from "@/components/mizan/takvim/hafta-gorunumu";
import { AyGorunumu } from "@/components/mizan/takvim/ay-gorunumu";
import { GunGorunumu } from "@/components/mizan/takvim/gun-gorunumu";
import { GorevPaneli } from "@/components/mizan/takvim/gorev-paneli";
import { EtkinlikDialog } from "@/components/mizan/takvim/etkinlik-dialog";
import { GorevDialog } from "@/components/mizan/takvim/gorev-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/takvim")({
  head: () => ({
    meta: [
      { title: "Planlama — Mizan" },
      {
        name: "description",
        content: "Etkinlikler, dersler ve günlük görevler tek ekranda.",
      },
    ],
  }),
  component: TakvimSayfasi,
});

function TakvimSayfasi() {
  const [ankara, setAnkara] = React.useState<Date>(new Date());
  const [gorunum, setGorunum] = React.useState<TakvimGorunum>("hafta");
  const [etkAcik, setEtkAcik] = React.useState(false);
  const [etkSlot, setEtkSlot] = React.useState<Date | undefined>(undefined);
  const [etkDuzenle, setEtkDuzenle] = React.useState<TakvimEtkinlik | null>(null);
  const [gorevAcik, setGorevAcik] = React.useState(false);
  const [gorevSlot, setGorevSlot] = React.useState<Date | undefined>(undefined);
  const [gorevDuzenle, setGorevDuzenle] = React.useState<TakvimGorev | null>(null);
  const [panelAcik, setPanelAcik] = React.useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("takvim-panel") !== "kapali";
  });
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("takvim-panel", panelAcik ? "acik" : "kapali");
  }, [panelAcik]);
  const navigate = useNavigate();
  const etkGuncelle = useEtkinlikGuncelle();

  // Aralık hesabı
  const [aralikBas, aralikBitis] = React.useMemo<[Date, Date]>(() => {
    if (gorunum === "ay") {
      return [
        startOfWeek(startOfMonth(ankara), { weekStartsOn: 1 }),
        endOfWeek(endOfMonth(ankara), { weekStartsOn: 1 }),
      ];
    }
    if (gorunum === "hafta") {
      return [
        startOfWeek(ankara, { weekStartsOn: 1 }),
        endOfWeek(ankara, { weekStartsOn: 1 }),
      ];
    }
    return [
      new Date(ankara.getFullYear(), ankara.getMonth(), ankara.getDate()),
      new Date(ankara.getFullYear(), ankara.getMonth(), ankara.getDate(), 23, 59, 59),
    ];
  }, [ankara, gorunum]);

  const haftaBas = startOfWeek(ankara, { weekStartsOn: 1 });
  const haftaBit = endOfWeek(ankara, { weekStartsOn: 1 });

  const etkSorgu = useEtkinlikler(aralikBas, aralikBitis);
  const olayTasi = React.useCallback(
    (id: string, yeniBaslangic: Date) => {
      const eski = (etkSorgu.data ?? []).find((e) => e.id === id);
      if (!eski) return;
      const basT = new Date(eski.baslangic).getTime();
      const bitT = eski.bitis ? new Date(eski.bitis).getTime() : basT + 60 * 60 * 1000;
      const sure = bitT - basT;
      const yeniBitis = new Date(yeniBaslangic.getTime() + sure);
      etkGuncelle.mutate({
        id,
        degisiklikler: {
          baslangic: yeniBaslangic.toISOString(),
          bitis: yeniBitis.toISOString(),
        },
      });
    },
    [etkSorgu.data, etkGuncelle],
  );
  const olayBoyutla = React.useCallback(
    (id: string, yeniBitis: Date) => {
      etkGuncelle.mutate({
        id,
        degisiklikler: { bitis: yeniBitis.toISOString() },
      });
    },
    [etkGuncelle],
  );
  const gorevSorgu = useGorevler(haftaBas, haftaBit);
  const derslerSorgu = useDersler();
  const saatSorgu = useDersSaatleri();
  const sinavSorgu = useSinavlar();
  const projeSorgu = useProjeler();
  const amelKursSorgu = useAmelKurslar();
  const amelProjeSorgu = useAmelProjeler();

  const olaylar: EtkinlikOlay[] = React.useMemo(
    () => [
      ...genisletEtkinlikleri(etkSorgu.data ?? [], aralikBas, aralikBitis),
      ...ilimOlaylari(
        derslerSorgu.data ?? [],
        saatSorgu.data ?? [],
        sinavSorgu.data ?? [],
        projeSorgu.data ?? [],
        aralikBas,
        aralikBitis,
      ),
      ...amelOlaylari(
        amelKursSorgu.data ?? [],
        amelProjeSorgu.data ?? [],
        aralikBas,
        aralikBitis,
      ),
    ],
    [
      etkSorgu.data,
      derslerSorgu.data,
      saatSorgu.data,
      sinavSorgu.data,
      projeSorgu.data,
      amelKursSorgu.data,
      amelProjeSorgu.data,
      aralikBas,
      aralikBitis,
    ],
  );

  const baslikMetni = React.useMemo(() => {
    if (gorunum === "ay") return format(ankara, "MMMM yyyy", { locale: tr });
    if (gorunum === "gun") return format(ankara, "d MMMM yyyy", { locale: tr });
    const son = endOfWeek(ankara, { weekStartsOn: 1 });
    return `${format(haftaBas, "d MMM", { locale: tr })} – ${format(son, "d MMM yyyy", { locale: tr })}`;
  }, [ankara, gorunum, haftaBas]);

  const ileri = () => {
    if (gorunum === "ay") setAnkara(addMonths(ankara, 1));
    else if (gorunum === "hafta") setAnkara(addDays(ankara, 7));
    else setAnkara(addDays(ankara, 1));
  };
  const geri = () => {
    if (gorunum === "ay") setAnkara(subMonths(ankara, 1));
    else if (gorunum === "hafta") setAnkara(addDays(ankara, -7));
    else setAnkara(addDays(ankara, -1));
  };

  const slotAc = (saat: Date) => {
    setEtkDuzenle(null);
    setEtkSlot(saat);
    setEtkAcik(true);
  };
  const olayAc = (o: EtkinlikOlay) => {
    if (isIlimOlay(o.id)) {
      const dersId = ilimOlayDersId(
        o.id,
        saatSorgu.data ?? [],
        sinavSorgu.data ?? [],
        projeSorgu.data ?? [],
      );
      if (dersId) {
        navigate({ to: "/mizan/ilim/$id", params: { id: dersId } });
        return;
      }
    }
    if (isAmelOlay(o.id)) {
      const kursId = amelOlayKursId(o.id);
      if (kursId) {
        navigate({ to: "/mizan/amel/$id", params: { id: kursId } });
        return;
      }
      const projeId = amelOlayProjeId(o.id);
      if (projeId) {
        navigate({ to: "/mizan/amel" });
        return;
      }
    }
    setEtkDuzenle(o);
    setEtkSlot(undefined);
    setEtkAcik(true);
  };
  const gunAc = (g: Date) => {
    // Aydan gün hücresine tıklayınca: ya hızlı etkinlik ekle, ya gün görünümüne geç
    setAnkara(g);
    setGorunum("gun");
  };

  return (
    <div className="flex h-svh w-full flex-col">
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-2 sm:px-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={() => navigate({ to: "/" })}
          aria-label="Ana sayfaya dön"
          title="Ana sayfa"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="min-w-0 flex-1 truncate text-sm font-semibold tracking-tight text-foreground sm:text-base">
          {baslikMetni}
        </h1>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <div className="flex items-center rounded-md border border-border">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-r-none" onClick={geri}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 rounded-none px-2 text-xs"
              onClick={() => setAnkara(new Date())}
            >
              Bugün
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-l-none" onClick={ileri}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex rounded-md border border-border p-0.5">
            {(["ay", "hafta", "gun"] as const).map((g) => (
              <button
                key={g}
                onClick={() => setGorunum(g)}
                className={cn(
                  "rounded px-2.5 py-1 text-xs capitalize transition-colors",
                  gorunum === g
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {g === "gun" ? "Gün" : g === "ay" ? "Ay" : "Hafta"}
              </button>
            ))}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="hidden h-8 w-8 xl:inline-flex"
            onClick={() => setPanelAcik((v) => !v)}
            aria-label={panelAcik ? "Görev panelini gizle" : "Görev panelini göster"}
            title={panelAcik ? "Paneli gizle" : "Paneli göster"}
          >
            {panelAcik ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" className="gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Yeni</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  setEtkDuzenle(null);
                  setEtkSlot(new Date());
                  setEtkAcik(true);
                }}
              >
                Etkinlik
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setGorevDuzenle(null);
                  setGorevSlot(ankara);
                  setGorevAcik(true);
                }}
              >
                Görev
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-2 p-2 sm:p-3 lg:flex-row lg:gap-3">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          {gorunum === "hafta" && (
            <HaftaGorunumu
              ankara={ankara}
              olaylar={olaylar}
              onSlotClick={slotAc}
              onOlayClick={olayAc}
              onOlayTasi={olayTasi}
              onOlayBoyutla={olayBoyutla}
            />
          )}
          {gorunum === "ay" && (
            <AyGorunumu
              ankara={ankara}
              olaylar={olaylar}
              onGunClick={gunAc}
              onOlayClick={olayAc}
            />
          )}
          {gorunum === "gun" && (
            <GunGorunumu
              ankara={ankara}
              olaylar={olaylar}
              onSlotClick={slotAc}
              onOlayClick={olayAc}
              onOlayTasi={olayTasi}
              onOlayBoyutla={olayBoyutla}
            />
          )}
        </div>
        {panelAcik && (
          <GorevPaneli
            ankara={ankara}
            gorevler={gorevSorgu.data ?? []}
            onYeni={() => {
              setGorevDuzenle(null);
              setGorevSlot(ankara);
              setGorevAcik(true);
            }}
            onDuzenle={(g) => {
              setGorevDuzenle(g);
              setGorevAcik(true);
            }}
          />
        )}
      </div>

      <EtkinlikDialog
        acik={etkAcik}
        onOpenChange={setEtkAcik}
        varsayilanBaslangic={etkSlot}
        duzenle={etkDuzenle}
      />
      <GorevDialog
        acik={gorevAcik}
        onOpenChange={setGorevAcik}
        varsayilanVade={gorevSlot}
        duzenle={gorevDuzenle}
      />
    </div>
  );
}