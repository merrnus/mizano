import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, FileText, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBelgeler, useBelgeEkle, useBelgeSil } from "@/lib/mutfak-hooks";

export const Route = createFileRoute("/workspace/belge")({
  component: BelgePage,
});

function BelgePage() {
  const { data: belgeler, isLoading } = useBelgeler();
  const ekle = useBelgeEkle();
  const sil = useBelgeSil();
  const navigate = useNavigate();

  const yeniBelge = () => {
    ekle.mutate(
      {},
      {
        onSuccess: (b: { id: string } | null) => {
          if (b?.id) navigate({ to: "/workspace/belge/$id", params: { id: b.id } });
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
            Belgeler
          </h1>
        </div>
        <Button onClick={yeniBelge} className="gap-1.5">
          <Plus className="h-4 w-4" /> Yeni belge
        </Button>
      </header>

      {isLoading ? (
        <div className="text-center text-sm text-muted-foreground">Yükleniyor…</div>
      ) : !belgeler || belgeler.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 px-6 py-16 text-center">
          <FileText className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">Henüz belgen yok.</p>
          <Button onClick={yeniBelge} className="mt-4 gap-1.5">
            <Plus className="h-4 w-4" /> İlk belgeni oluştur
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {belgeler.map((b) => (
            <div
              key={b.id}
              className="group relative rounded-2xl border border-border/60 bg-card p-4 shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
            >
              <Link
                to="/workspace/belge/$id"
                params={{ id: b.id }}
                className="block"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300">
                    {b.emoji ?? <FileText className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-foreground">
                      {b.baslik}
                    </div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground">
                      {new Date(b.updated_at).toLocaleDateString("tr-TR", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
              </Link>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (confirm("Belgeyi silmek istediğine emin misin?")) {
                    sil.mutate(b.id);
                  }
                }}
                className="absolute right-2 top-2 rounded p-1 text-muted-foreground opacity-70 transition-opacity hover:bg-muted hover:text-destructive sm:opacity-0 sm:group-hover:opacity-100"
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
