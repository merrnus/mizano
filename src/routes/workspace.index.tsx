import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  StickyNote,
  FileText,
  Sheet,
  HardDrive,
  Timer,
  Sparkles,
  Clock,
  ChevronRight,
  Plus,
  Paperclip,
} from "lucide-react";
import { HubArama } from "@/components/mizan/mutfak/hub-arama";
import {
  useNotlar,
  useBelgeler,
  useTablolar,
  useDosyalar,
  useBelgeEkle,
  useTabloEkle,
} from "@/lib/mutfak-hooks";
import { useTumEkler } from "@/lib/ekler-hooks";
import { icerikOzet } from "@/lib/mutfak-not-icerik";

export const Route = createFileRoute("/workspace/")({
  component: HubPage,
});

type Recent =
  | { tip: "not"; id: string; baslik: string; onizleme: string; updated: string }
  | { tip: "belge"; id: string; baslik: string; emoji: string | null; updated: string }
  | { tip: "tablo"; id: string; baslik: string; updated: string };

function HubPage() {
  const notlar = useNotlar(false);
  const belgeler = useBelgeler();
  const tablolar = useTablolar();
  const dosyalar = useDosyalar("/");
  const ekler = useTumEkler();
  const navigate = useNavigate();
  const ekleBelge = useBelgeEkle();
  const ekleTablo = useTabloEkle();

  const notSayisi = notlar.data?.length ?? 0;
  const sabitli = notlar.data?.filter((n) => n.pinned).length ?? 0;

  const recents: Recent[] = [
    ...(belgeler.data ?? []).map<Recent>((b) => ({
      tip: "belge",
      id: b.id,
      baslik: b.baslik,
      emoji: b.emoji,
      updated: b.updated_at,
    })),
    ...(tablolar.data ?? []).map<Recent>((t) => ({
      tip: "tablo",
      id: t.id,
      baslik: t.baslik,
      updated: t.updated_at,
    })),
    ...(notlar.data ?? []).slice(0, 8).map<Recent>((n) => ({
      tip: "not",
      id: n.id,
      baslik: n.baslik || icerikOzet(n.icerik).slice(0, 32) || "Boş not",
      onizleme: icerikOzet(n.icerik).slice(0, 80),
      updated: n.updated_at,
    })),
  ]
    .sort((a, b) => +new Date(b.updated) - +new Date(a.updated))
    .slice(0, 8);

  const aracKaynak = [
    {
      ad: "Notlar",
      ozet: "Hızlı fikirler ve kart notlar",
      to: "/workspace/notlar" as const,
      icon: StickyNote,
      renk: "text-amber-600 dark:text-amber-300",
      bg: "bg-amber-100/70 dark:bg-amber-950/40",
      sayac: notSayisi ? `${notSayisi} not${sabitli ? ` · ${sabitli} sabitli` : ""}` : "",
    },
    {
      ad: "Belge",
      ozet: "Zengin metin, otomatik kaydet",
      to: "/workspace/belge" as const,
      icon: FileText,
      renk: "text-sky-600 dark:text-sky-300",
      bg: "bg-sky-100/70 dark:bg-sky-950/40",
      sayac: belgeler.data?.length ? `${belgeler.data.length} belge` : "",
    },
    {
      ad: "Tablo",
      ozet: "Esnek satır ve kolonlar",
      to: "/workspace/tablo" as const,
      icon: Sheet,
      renk: "text-emerald-600 dark:text-emerald-300",
      bg: "bg-emerald-100/70 dark:bg-emerald-950/40",
      sayac: tablolar.data?.length ? `${tablolar.data.length} tablo` : "",
    },
    {
      ad: "Sürücü",
      ozet: "Dosyalar ve klasörler",
      to: "/workspace/surucu" as const,
      icon: HardDrive,
      renk: "text-violet-600 dark:text-violet-300",
      bg: "bg-violet-100/70 dark:bg-violet-950/40",
      sayac: dosyalar.data?.length ? `${dosyalar.data.length} dosya` : "",
    },
    {
      ad: "Kaynaklar",
      ozet: "Tüm ekler — dosya ve linkler",
      to: "/workspace/kaynaklar" as const,
      icon: Paperclip,
      renk: "text-indigo-600 dark:text-indigo-300",
      bg: "bg-indigo-100/70 dark:bg-indigo-950/40",
      sayac: ekler.data?.length ? `${ekler.data.length} ek` : "",
    },
    {
      ad: "Pomodoro",
      ozet: "Odak süreleri ve mola",
      to: "/workspace/pomodoro" as const,
      icon: Timer,
      renk: "text-rose-600 dark:text-rose-300",
      bg: "bg-rose-100/70 dark:bg-rose-950/40",
      sayac: "",
    },
  ];

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-12 pt-8 sm:px-6">
      <header className="mb-6">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            Mutfak
          </p>
        </div>
        <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Hepsi tek mutfakta.
        </h1>
      </header>

      <div className="mb-10">
        <HubArama big />
      </div>

      <section className="mb-10">
        <div className="mb-3 flex items-end justify-between">
          <h2 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" /> Son kullanılanlar
          </h2>
        </div>
        {recents.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 px-4 py-8 text-center text-xs text-muted-foreground">
            Henüz bir şey yok — aşağıdan başlayalım.
          </div>
        ) : (
          <div className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2">
            {recents.map((r) => (
              <RecentKart key={`${r.tip}-${r.id}`} recent={r} />
            ))}
          </div>
        )}
      </section>

      <section className="mb-10">
        <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Hızlı oluştur
        </h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => navigate({ to: "/workspace/notlar" })}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-2 text-sm font-medium text-foreground shadow-sm transition-all hover:-translate-y-px hover:border-amber-400 hover:shadow-md active:scale-95"
          >
            <Plus className="h-3.5 w-3.5 text-amber-500" /> Not
          </button>
          <button
            onClick={() =>
              ekleBelge.mutate(
                {},
                {
                  onSuccess: (b) => {
                    if (b?.id) navigate({ to: "/workspace/belge/$id", params: { id: b.id } });
                  },
                },
              )
            }
            disabled={ekleBelge.isPending}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-2 text-sm font-medium text-foreground shadow-sm transition-all hover:-translate-y-px hover:border-sky-400 hover:shadow-md active:scale-95 disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5 text-sky-500" /> Belge
          </button>
          <button
            onClick={() =>
              ekleTablo.mutate(
                {},
                {
                  onSuccess: (t) => {
                    if (t?.id) navigate({ to: "/workspace/tablo/$id", params: { id: t.id } });
                  },
                },
              )
            }
            disabled={ekleTablo.isPending}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-2 text-sm font-medium text-foreground shadow-sm transition-all hover:-translate-y-px hover:border-emerald-400 hover:shadow-md active:scale-95 disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5 text-emerald-500" /> Tablo
          </button>
        </div>
      </section>

      <section>
        <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Araçlar
        </h3>
        <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
          {aracKaynak.map((a, i) => (
            <Link
              key={a.ad}
              to={a.to}
              className={`group flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted/50 ${
                i > 0 ? "border-t border-border/50" : ""
              }`}
            >
              <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${a.bg} ${a.renk}`}>
                <a.icon className="h-4 w-4" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-sm font-medium text-foreground">{a.ad}</span>
                <span className="truncate text-xs text-muted-foreground">{a.ozet}</span>
              </span>
              {a.sayac && (
                <span className="hidden text-[11px] text-muted-foreground sm:inline">{a.sayac}</span>
              )}
              <ChevronRight className="h-4 w-4 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function RecentKart({ recent }: { recent: Recent }) {
  const meta =
    recent.tip === "not"
      ? {
          ikon: <StickyNote className="h-3.5 w-3.5" />,
          renk: "text-amber-600 dark:text-amber-300",
          bg: "bg-amber-100/60 dark:bg-amber-950/40",
          etiket: "Not",
        }
      : recent.tip === "belge"
        ? {
            ikon: <FileText className="h-3.5 w-3.5" />,
            renk: "text-sky-600 dark:text-sky-300",
            bg: "bg-sky-100/60 dark:bg-sky-950/40",
            etiket: "Belge",
          }
        : {
            ikon: <Sheet className="h-3.5 w-3.5" />,
            renk: "text-emerald-600 dark:text-emerald-300",
            bg: "bg-emerald-100/60 dark:bg-emerald-950/40",
            etiket: "Tablo",
          };

  const inner = (
    <div className="flex h-32 w-52 shrink-0 snap-start flex-col gap-2 rounded-xl border border-border/60 bg-card p-3.5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
      <div className={`flex h-7 w-7 items-center justify-center rounded-md ${meta.bg} ${meta.renk}`}>
        {recent.tip === "belge" && recent.emoji ? (
          <span className="text-sm leading-none">{recent.emoji}</span>
        ) : (
          meta.ikon
        )}
      </div>
      <div className="line-clamp-2 text-sm font-medium leading-snug text-foreground">
        {recent.baslik}
      </div>
      {recent.tip === "not" && recent.onizleme && (
        <div className="line-clamp-1 text-[11px] text-muted-foreground">{recent.onizleme}</div>
      )}
      <div className="mt-auto flex items-center justify-between text-[10px] text-muted-foreground">
        <span>{meta.etiket}</span>
        <span>
          {new Date(recent.updated).toLocaleDateString("tr-TR", {
            day: "numeric",
            month: "short",
          })}
        </span>
      </div>
    </div>
  );

  if (recent.tip === "belge") {
    return (
      <Link to="/workspace/belge/$id" params={{ id: recent.id }}>
        {inner}
      </Link>
    );
  }
  if (recent.tip === "tablo") {
    return (
      <Link to="/workspace/tablo/$id" params={{ id: recent.id }}>
        {inner}
      </Link>
    );
  }
  return <Link to="/workspace/notlar">{inner}</Link>;
}
