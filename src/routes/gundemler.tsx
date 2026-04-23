import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/gundemler")({
  beforeLoad: () => {
    throw redirect({ to: "/network", search: { tab: "gundemler" } });
  },
});

type Sutun = "fikir" | "planlama" | "aktif" | "tamam";

type Gundem = {
  id: string;
  ad: string;
  kategori: string;
  atanan: string[];
  durum: Sutun;
};

const baslangic: Gundem[] = [
  { id: "1", ad: "Yaz kampı planlama", kategori: "Etkinlik", atanan: ["Ahmet Y.", "Salih D."], durum: "planlama" },
  { id: "2", ad: "Haftalık sohbet — Risale", kategori: "Sohbet", atanan: ["Yusuf K.", "Ömer T.", "Ahmet Y."], durum: "aktif" },
  { id: "3", ad: "1-on-1 — Mehmet", kategori: "Görüşme", atanan: ["Mehmet S."], durum: "aktif" },
  { id: "4", ad: "Online ders — Akaid", kategori: "Ders", atanan: ["İbrahim M."], durum: "fikir" },
  { id: "5", ad: "Kitap okuma grubu", kategori: "Etkinlik", atanan: [], durum: "fikir" },
  { id: "6", ad: "Bahar pikniği", kategori: "Etkinlik", atanan: ["Hasan A.", "Bilal R."], durum: "tamam" },
];

const sutunlar: { id: Sutun; ad: string; renk: string }[] = [
  { id: "fikir", ad: "Fikir", renk: "bg-muted-foreground/30" },
  { id: "planlama", ad: "Planlama", renk: "bg-[var(--akademi)]" },
  { id: "aktif", ad: "Aktif", renk: "bg-primary" },
  { id: "tamam", ad: "Tamam", renk: "bg-[var(--maneviyat)]" },
];

const kisiHavuzu = [
  "Ahmet Y.",
  "Yusuf K.",
  "Mehmet S.",
  "Hasan A.",
  "Ömer T.",
  "İbrahim M.",
  "Bilal R.",
  "Salih D.",
];

function Gundemler() {
  const [gundemler] = React.useState(baslangic);
  const [gorunum, setGorunum] = React.useState<"kanban" | "liste">("kanban");
  const [bulkOpen, setBulkOpen] = React.useState(false);
  const [secili, setSecili] = React.useState<Set<string>>(new Set());

  const toggle = (ad: string) => {
    setSecili((p) => {
      const n = new Set(p);
      n.has(ad) ? n.delete(ad) : n.add(ad);
      return n;
    });
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      <header className="mb-6 flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Gündemler
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Konu Havuzu
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden rounded-md border border-border p-0.5 sm:flex">
            <Button
              size="sm"
              variant={gorunum === "kanban" ? "secondary" : "ghost"}
              className="h-7 gap-1 px-2 text-xs"
              onClick={() => setGorunum("kanban")}
            >
              <LayoutGrid className="h-3.5 w-3.5" /> Kanban
            </Button>
            <Button
              size="sm"
              variant={gorunum === "liste" ? "secondary" : "ghost"}
              className="h-7 gap-1 px-2 text-xs"
              onClick={() => setGorunum("liste")}
            >
              <List className="h-3.5 w-3.5" /> Liste
            </Button>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={() => setBulkOpen(true)}
          >
            <Users className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Toplu Ata</span>
            <kbd className="ml-1 hidden rounded bg-muted px-1 text-[10px] sm:inline">⌘K</kbd>
          </Button>
          <Button size="sm" className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Gündem</span>
          </Button>
        </div>
      </header>

      {/* Kanban (mobilde her zaman liste) */}
      {gorunum === "kanban" ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {sutunlar.map((s) => {
            const bunlar = gundemler.filter((g) => g.durum === s.id);
            return (
              <div
                key={s.id}
                className="rounded-xl border border-border bg-card/50 p-3"
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={cn("h-2 w-2 rounded-full", s.renk)} />
                    <h3 className="text-xs font-medium text-foreground">
                      {s.ad}
                    </h3>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {bunlar.length}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  {bunlar.map((g) => (
                    <GundemCard key={g.id} g={g} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {gundemler.map((g) => (
            <div
              key={g.id}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
            >
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  sutunlar.find((s) => s.id === g.durum)?.renk,
                )}
              />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-foreground">
                  {g.ad}
                </div>
                <div className="mt-0.5 text-[11px] text-muted-foreground">
                  {g.kategori} · {g.atanan.length} kişi
                </div>
              </div>
              <Badge variant="outline" className="text-[10px]">
                {sutunlar.find((s) => s.id === g.durum)?.ad}
              </Badge>
            </div>
          ))}
        </div>
      )}

      {/* Bulk assign — Command-K */}
      <CommandDialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <CommandInput placeholder="Kişi ara ve seç…" />
        <CommandList>
          <CommandEmpty>Kişi bulunamadı.</CommandEmpty>
          <CommandGroup heading={`${secili.size} kişi seçildi`}>
            {kisiHavuzu.map((k) => {
              const isSel = secili.has(k);
              return (
                <CommandItem key={k} onSelect={() => toggle(k)} className="gap-2">
                  <span
                    className={cn(
                      "flex h-4 w-4 items-center justify-center rounded border",
                      isSel
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border",
                    )}
                  >
                    {isSel && <Check className="h-3 w-3" />}
                  </span>
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="bg-muted text-[10px]">
                      {k.split(" ").map((p) => p[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <span>{k}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        </CommandList>
        {secili.size > 0 && (
          <div className="border-t border-border p-2">
            <Button size="sm" className="w-full" onClick={() => setBulkOpen(false)}>
              {secili.size} kişiye gündem ata
            </Button>
          </div>
        )}
      </CommandDialog>
    </div>
  );
}

function GundemCard({ g }: { g: Gundem }) {
  return (
    <div className="rounded-lg border border-border bg-background/60 p-3 transition-colors hover:border-primary/40">
      <div className="text-sm font-medium text-foreground">{g.ad}</div>
      <div className="mt-1 flex items-center justify-between">
        <Badge variant="outline" className="text-[9px]">
          {g.kategori}
        </Badge>
        {g.atanan.length > 0 && (
          <div className="flex -space-x-1.5">
            {g.atanan.slice(0, 3).map((a) => (
              <Avatar
                key={a}
                className="h-5 w-5 border border-card"
              >
                <AvatarFallback className="bg-muted text-[8px]">
                  {a.split(" ").map((p) => p[0]).join("")}
                </AvatarFallback>
              </Avatar>
            ))}
            {g.atanan.length > 3 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full border border-card bg-muted text-[8px] text-muted-foreground">
                +{g.atanan.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
