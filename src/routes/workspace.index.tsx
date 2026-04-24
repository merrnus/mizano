import { createFileRoute, Link } from "@tanstack/react-router";
import {
  StickyNote,
  FileText,
  Sheet,
  HardDrive,
  Timer,
  Sparkles,
} from "lucide-react";
import { HubTile } from "@/components/mizan/mutfak/hub-tile";
import {
  useNotlar,
  useBelgeler,
  useTablolar,
  useDosyalar,
} from "@/lib/mutfak-hooks";

export const Route = createFileRoute("/workspace/")({
  component: HubPage,
});

function HubPage() {
  const notlar = useNotlar(false);
  const belgeler = useBelgeler();
  const tablolar = useTablolar();
  const dosyalar = useDosyalar("/");

  const notSayisi = notlar.data?.length ?? 0;
  const sabitli = notlar.data?.filter((n) => n.pinned).length ?? 0;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <header className="mb-8">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            Mutfak
          </p>
        </div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Hepsi tek mutfakta.
        </h1>
        <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">
          Notlar, belgeler, tablolar ve sürücün — odaklanmak için pomodoro.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <HubTile
          to="/workspace/notlar"
          icon={StickyNote}
          ad="Notlar"
          ozet="Hızlı fikirler ve kart notlar."
          sayac={notSayisi ? `${notSayisi} not${sabitli ? ` · ${sabitli} sabitli` : ""}` : undefined}
          gradient="bg-gradient-to-br from-amber-400 to-orange-500"
        />
        <HubTile
          to="/workspace/belge"
          icon={FileText}
          ad="Belge"
          ozet="Zengin metin, otomatik kaydet."
          sayac={belgeler.data?.length ? `${belgeler.data.length} belge` : undefined}
          gradient="bg-gradient-to-br from-sky-400 to-blue-600"
        />
        <HubTile
          to="/workspace/tablo"
          icon={Sheet}
          ad="Tablo"
          ozet="Esnek satır ve kolonlar."
          sayac={tablolar.data?.length ? `${tablolar.data.length} tablo` : undefined}
          gradient="bg-gradient-to-br from-emerald-400 to-teal-600"
        />
        <HubTile
          to="/workspace/surucu"
          icon={HardDrive}
          ad="Sürücü"
          ozet="Dosyalar ve klasörler."
          sayac={dosyalar.data?.length ? `${dosyalar.data.length} dosya` : undefined}
          gradient="bg-gradient-to-br from-violet-500 to-fuchsia-600"
        />
        <HubTile
          to="/workspace/pomodoro"
          icon={Timer}
          ad="Pomodoro"
          ozet="Odak süreleri ve mola."
          gradient="bg-gradient-to-br from-rose-500 to-red-600"
        />
        <Link
          to="/takvim"
          className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-dashed border-border/60 bg-muted/20 p-5 text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
        >
          <div className="text-xs uppercase tracking-wider">Yakında</div>
          <div className="mt-6 text-sm">Daha fazla araç bu alana eklenecek.</div>
        </Link>
      </div>
    </div>
  );
}
