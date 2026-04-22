import { createFileRoute } from "@tanstack/react-router";
import { CheckSquare, Square } from "lucide-react";
import { SayfaBasligi } from "@/components/mizan/sayfa-basligi";

export const Route = createFileRoute("/tasks")({
  head: () => ({
    meta: [
      { title: "Tasks — Mizan" },
      { name: "description", content: "Bağlam atanabilir görev listesi." },
      { property: "og:title", content: "Tasks — Mizan" },
      { property: "og:description", content: "Akademi/maneviyat/kardeş/gündem bağlamlı görevler." },
    ],
  }),
  component: TasksPage,
});

const tasks = [
  { ad: "Ağ Yönetimi lab raporunu bitir", baglam: "akademi", bitti: false },
  { ad: "Akşam evradı", baglam: "maneviyat", bitti: true },
  { ad: "Yusuf ile teke tek görüşme planla", baglam: "kardeş", bitti: false },
  { ad: "CCNA modül 3 — 30 dk", baglam: "hedef", bitti: false },
  { ad: "Cuma sohbeti gündemini hazırla", baglam: "gündem", bitti: false },
];

const baglamRenk: Record<string, string> = {
  akademi: "bg-[var(--akademi)]/15 text-foreground",
  maneviyat: "bg-[var(--maneviyat)]/15 text-foreground",
  hedef: "bg-[var(--dunyevi)]/15 text-foreground",
  kardeş: "bg-secondary text-foreground",
  gündem: "bg-primary/15 text-foreground",
};

function TasksPage() {
  return (
    <div>
      <SayfaBasligi baslik="Tasks" aciklama="Görevler — bağlam ile organize." />
      <div className="px-6 py-5">
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          {tasks.map((t, i) => (
            <div
              key={t.ad}
              className={`flex items-center gap-3 px-4 py-3 ${i !== tasks.length - 1 ? "border-b border-border" : ""}`}
            >
              {t.bitti ? (
                <CheckSquare className="h-4 w-4 text-primary" />
              ) : (
                <Square className="h-4 w-4 text-muted-foreground" />
              )}
              <span
                className={`flex-1 text-sm ${t.bitti ? "text-muted-foreground line-through" : "text-foreground"}`}
              >
                {t.ad}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] ${baglamRenk[t.baglam]}`}
              >
                {t.baglam}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}