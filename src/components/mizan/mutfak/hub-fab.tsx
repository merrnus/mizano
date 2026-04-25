import { useNavigate } from "@tanstack/react-router";
import { Plus, FileText, Sheet, StickyNote } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useBelgeEkle, useTabloEkle } from "@/lib/mutfak-hooks";

export function HubFab() {
  const navigate = useNavigate();
  const ekleBelge = useBelgeEkle();
  const ekleTablo = useTabloEkle();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="Hızlı oluştur"
          className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg transition-all hover:scale-105 hover:shadow-xl active:scale-95 sm:bottom-6 sm:right-6"
        >
          <Plus className="h-6 w-6" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="top" className="w-48">
        <DropdownMenuItem onClick={() => navigate({ to: "/workspace/notlar" })}>
          <StickyNote className="mr-2 h-4 w-4 text-amber-500" /> Hızlı not
        </DropdownMenuItem>
        <DropdownMenuItem
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
        >
          <FileText className="mr-2 h-4 w-4 text-sky-500" /> Yeni belge
        </DropdownMenuItem>
        <DropdownMenuItem
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
        >
          <Sheet className="mr-2 h-4 w-4 text-emerald-500" /> Yeni tablo
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}