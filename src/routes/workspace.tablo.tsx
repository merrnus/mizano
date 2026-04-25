import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Plus, Sheet, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTablolar, useTabloEkle, useTabloSil } from "@/lib/mutfak-hooks";

export const Route = createFileRoute("/workspace/tablo")({
  component: TabloPage,
});

function TabloPage() {
  const { data: tablolar, isLoading } = useTablolar();
  const ekle = useTabloEkle();
  const sil = useTabloSil();
  const navigate = useNavigate();

  const yeniTablo = () => {
    ekle.mutate(
      {},
      {
        onSuccess: (t: { id: string } | null) => {
          if (t?.id) navigate({ to: "/workspace/tablo/$id", params: { id: t.id } });
        },
      },
    );
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
      <header className="mb-6 flex items-end justify-between gap-4">
        <div>
          <Link
            to="/workspace"
            className="mb-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3 w-3" /> Mutfak
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Tablolar
          </h1>
        </div>
        <Button onClick={yeniTablo} className="gap-1.5">
          <Plus className="h-4 w-4" /> Yeni tablo
        </Button>
      </header>

      {isLoading ? (
        <div className="text-center text-sm text-muted-foreground">Yükleniyor…</div>
      ) : !tablolar || tablolar.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 px-6 py-16 text-center">
          <Sheet className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">Henüz tablon yok.</p>
          <Button onClick={yeniTablo} className="mt-4 gap-1.5">
            <Plus className="h-4 w-4" /> İlk tablonu oluştur
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tablolar.map((t) => (
            <div key={t.id} className="group relative">
              <Link
                to="/workspace/tablo/$id"
                params={{ id: t.id }}
                className="block rounded-2xl border border-border/60 bg-card p-4 shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
              >
                <div className="flex items-start gap-3 pr-8">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                    <Sheet className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-foreground">
                      {t.baslik}
                    </div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground">
                      {t.satirlar.length} satır · {t.kolonlar.length} kolon
                    </div>
                  </div>
                </div>
              </Link>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (confirm("Tabloyu silmek istediğine emin misin?")) {
                    sil.mutate(t.id);
                  }
                }}
                className="absolute right-2 top-2 z-10 rounded-md bg-background/80 p-1.5 text-muted-foreground shadow-sm backdrop-blur transition-colors hover:bg-muted hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
