import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useHedefler, useTumAdimlar } from "@/lib/hedef-hooks";
import { HedefKart } from "@/components/mizan/hedef/hedef-kart";
import { HedefForm } from "@/components/mizan/hedef/hedef-form";
import { ALAN_ETIKET, ALAN_LISTESI } from "@/lib/cetele-tipleri";
import type { CeteleAlan } from "@/lib/cetele-tipleri";
import type { HedefDurum } from "@/lib/hedef-tipleri";

export const Route = createFileRoute("/mizan/amel")({
  head: () => ({
    meta: [
      { title: "Hedefler — Mizan" },
      { name: "description", content: "Tüm alanlardaki hedeflerin: kurs, alışkanlık, proje, sayısal, tekil." },
    ],
  }),
  component: AmelSayfasi,
});

function AmelSayfasi() {
  const { data: hedefler = [], isLoading } = useHedefler();
  const { data: adimlar = [] } = useTumAdimlar();
  const [alanFiltre, setAlanFiltre] = React.useState<CeteleAlan | "tumu">("tumu");
  const [acikDialog, setAcikDialog] = React.useState(false);

  const filtreli = (durum: HedefDurum) =>
    hedefler.filter(
      (h) => h.durum === durum && (alanFiltre === "tumu" || h.alan === alanFiltre),
    );

  const aktif = filtreli("aktif");
  const tamam = filtreli("tamamlandi");
  const arsiv = filtreli("arsiv");

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      <header className="mb-6 flex items-end justify-between gap-3">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2 h-7 gap-1 text-xs text-muted-foreground">
            <Link to="/mizan"><ArrowLeft className="h-3 w-3" /> İstikamet</Link>
          </Button>
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Amel</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Hedefler</h1>
        </div>
        <Dialog open={acikDialog} onOpenChange={setAcikDialog}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-1 h-3.5 w-3.5" /> Yeni hedef
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Yeni hedef</DialogTitle>
            </DialogHeader>
            <HedefForm onBitti={() => setAcikDialog(false)} />
          </DialogContent>
        </Dialog>
      </header>

      <div className="mb-4 flex flex-wrap gap-1.5">
        <FiltreCip
          aktif={alanFiltre === "tumu"}
          onClick={() => setAlanFiltre("tumu")}
          label="Tümü"
        />
        {ALAN_LISTESI.map((a) => (
          <FiltreCip
            key={a}
            aktif={alanFiltre === a}
            onClick={() => setAlanFiltre(a)}
            label={ALAN_ETIKET[a]}
            alan={a}
          />
        ))}
      </div>

      <Tabs defaultValue="aktif">
        <TabsList>
          <TabsTrigger value="aktif">Aktif ({aktif.length})</TabsTrigger>
          <TabsTrigger value="tamamlandi">Tamamlanan ({tamam.length})</TabsTrigger>
          <TabsTrigger value="arsiv">Arşiv ({arsiv.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="aktif" className="mt-4">
          <HedefIzgara
            hedefler={aktif}
            adimlar={adimlar}
            bos="Henüz aktif hedefin yok. Sağ üstten ilkini ekle."
            isLoading={isLoading}
          />
        </TabsContent>
        <TabsContent value="tamamlandi" className="mt-4">
          <HedefIzgara
            hedefler={tamam}
            adimlar={adimlar}
            bos="Henüz tamamlanan hedef yok."
            isLoading={isLoading}
          />
        </TabsContent>
        <TabsContent value="arsiv" className="mt-4">
          <HedefIzgara
            hedefler={arsiv}
            adimlar={adimlar}
            bos="Arşivde hedef yok."
            isLoading={isLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function FiltreCip({
  aktif,
  onClick,
  label,
  alan,
}: {
  aktif: boolean;
  onClick: () => void;
  label: string;
  alan?: CeteleAlan;
}) {
  const renkVar = alan ? `var(--${alan})` : "var(--foreground)";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs transition-colors ${
        aktif
          ? "border-foreground bg-foreground text-background"
          : "border-border text-muted-foreground hover:text-foreground"
      }`}
      style={aktif && alan ? { borderColor: renkVar, background: renkVar, color: "var(--background)" } : undefined}
    >
      {label}
    </button>
  );
}

function HedefIzgara({
  hedefler,
  adimlar,
  bos,
  isLoading,
}: {
  hedefler: ReturnType<typeof useHedefler>["data"] extends infer T ? (T extends undefined ? never : T) : never;
  adimlar: ReturnType<typeof useTumAdimlar>["data"] extends infer T ? (T extends undefined ? never : T) : never;
  bos: string;
  isLoading: boolean;
}) {
  if (isLoading) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Yükleniyor…</p>;
  }
  if (!hedefler || hedefler.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
        {bos}
      </div>
    );
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {hedefler.map((h) => (
        <HedefKart key={h.id} hedef={h} adimlar={adimlar} />
      ))}
    </div>
  );
}