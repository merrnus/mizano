import { createFileRoute, Link } from "@tanstack/react-router";
import {
  StickyNote,
  FileText,
  Sheet,
  HardDrive,
  Timer,
  Sparkles,
  Clock,
} from "lucide-react";
import { HubTile } from "@/components/mizan/mutfak/hub-tile";
import { HubArama } from "@/components/mizan/mutfak/hub-arama";
import { HubFab } from "@/components/mizan/mutfak/hub-fab";
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

  type Recent =
    | { tip: "not"; id: string; baslik: string; updated: string }
    | { tip: "belge"; id: string; baslik: string; emoji: string | null; updated: string }
    | { tip: "tablo"; id: string; baslik: string; updated: string };

  const recents: Recent[] = [
    ...(belgeler.data ?? []).map<Recent>((b) => ({
      tip: "belge", id: b.id, baslik: b.baslik, emoji: b.emoji, updated: b.updated_at,
    })),
    ...(tablolar.data ?? []).map<Recent>((t) => ({
      tip: "tablo", id: t.id, baslik: t.baslik, updated: t.updated_at,
    })),
    ...(notlar.data ?? []).slice(0, 6).map<Recent>((n) => ({
      tip: "not", id: n.id, baslik: n.baslik || n.icerik.slice(0, 32) || "Boş not", updated: n.updated_at,
    })),
  ]
    .sort((a, b) => +new Date(b.updated) - +new Date(a.updated))
    .slice(0, 6);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <header className="mb-6">
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

      <div className="mb-8">
        <HubArama />
      </div>

      {recents.length > 0 && (
        <section className="mb-8">
          <div className="mb-2 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            <Clock className="h-3 w-3" /> Son kullanılanlar
          </div>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
            {recents.map((r) => (
              <RecentKart key={`${r.tip}-${r.id}`} recent={r} />
            ))}
          </div>
        </section>
      )}

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

      <HubFab />
    </div>
  );
}

function RecentKart({
  recent,
}: {
  recent:
    | { tip: "not"; id: string; baslik: string; updated: string }
    | { tip: "belge"; id: string; baslik: string; emoji: string | null; updated: string }
    | { tip: "tablo"; id: string; baslik: string; updated: string };
}) {
  const meta =
    recent.tip === "not"
      ? { ikon: <StickyNote className="h-3.5 w-3.5" />, renk: "text-amber-600 dark:text-amber-300", bg: "bg-amber-100/60 dark:bg-amber-950/40", etiket: "Not" }
      : recent.tip === "belge"
        ? { ikon: <FileText className="h-3.5 w-3.5" />, renk: "text-sky-600 dark:text-sky-300", bg: "bg-sky-100/60 dark:bg-sky-950/40", etiket: "Belge" }
        : { ikon: <Sheet className="h-3.5 w-3.5" />, renk: "text-emerald-600 dark:text-emerald-300", bg: "bg-emerald-100/60 dark:bg-emerald-950/40", etiket: "Tablo" };

  const inner = (
    <div className="flex w-44 shrink-0 flex-col gap-2 rounded-xl border border-border/60 bg-card p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className={`flex h-7 w-7 items-center justify-center rounded-md ${meta.bg} ${meta.renk}`}>
        {recent.tip === "belge" && recent.emoji ? <span className="text-sm leading-none">{recent.emoji}</span> : meta.ikon}
      </div>
      <div className="line-clamp-2 text-xs font-medium text-foreground">{recent.baslik}</div>
      <div className="mt-auto flex items-center justify-between text-[10px] text-muted-foreground">
        <span>{meta.etiket}</span>
        <span>{new Date(recent.updated).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}</span>
      </div>
    </div>
  );

  if (recent.tip === "belge") {
    return <Link to="/workspace/belge/$id" params={{ id: recent.id }}>{inner}</Link>;
  }
  if (recent.tip === "tablo") {
    return <Link to="/workspace/tablo/$id" params={{ id: recent.id }}>{inner}</Link>;
  }
  return <Link to="/workspace/notlar">{inner}</Link>;
}
