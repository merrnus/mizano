import * as React from "react";
import { Link } from "@tanstack/react-router";
import {
  X,
  Plus,
  RotateCcw,
  Settings2,
  LayoutGrid,
  ChevronRight,
  Check,
  Clock,
  Timer,
  GripVertical,
} from "lucide-react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  useBugunGorevler,
  useGunlukGorevEkle,
  useGunlukGorevGuncelle,
  useGunlukGorevSil,
  useGunlukGorevYenidenSirala,
  useGunSifirla,
  type GunlukGorev,
} from "@/lib/gunluk-gorev";
import { tarihFormat } from "@/lib/cetele-tarih";
import { toast } from "sonner";

type Props = {
  simdi: Date;
  onHavuzAc: () => void;
};

/**
 * Esnek Görevler — Google Tasks tarzı liste.
 * - Üstte tek satır hızlı ekleme (Enter ile)
 * - Daire checkbox'lar; tamamlanan: üstü çizili + %50 opak
 * - Aktif görevler sürüklenebilir (saatsiz olanlar için sıralama; saatliler kronolojik üstte)
 * - Tamamlananlar açılır-kapanır bölümde
 */
export function GunlukChecklist({ simdi, onHavuzAc }: Props) {
  const tarih = tarihFormat(simdi);
  const { data: gorevler = [] } = useBugunGorevler(simdi);
  const guncelle = useGunlukGorevGuncelle();
  const sil = useGunlukGorevSil();
  const sifirla = useGunSifirla();
  const yenidenSirala = useGunlukGorevYenidenSirala();

  const { aktif, biten } = React.useMemo(() => {
    const a: GunlukGorev[] = [];
    const b: GunlukGorev[] = [];
    for (const g of gorevler) (g.tamamlandi ? b : a).push(g);
    a.sort((x, y) => {
      if (x.saat && y.saat) return x.saat.localeCompare(y.saat);
      if (x.saat) return -1;
      if (y.saat) return 1;
      return (x.siralama ?? 0) - (y.siralama ?? 0);
    });
    b.sort((x, y) => (y.tamamlanma_at ?? "").localeCompare(x.tamamlanma_at ?? ""));
    return { aktif: a, biten: b };
  }, [gorevler]);

  const [bitenAcik, setBitenAcik] = React.useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = aktif.findIndex((g) => g.id === active.id);
    const newIndex = aktif.findIndex((g) => g.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const yeni = arrayMove(aktif, oldIndex, newIndex);
    yenidenSirala.mutate(yeni.map((g, i) => ({ id: g.id, siralama: i })));
  };

  return (
    <section className="flex flex-col">
      {/* Başlık */}
      <header className="flex items-center justify-between gap-2 px-1 pb-3">
        <h2 className="text-base font-semibold tracking-tight">Görevlerim</h2>
        <div className="flex items-center gap-1 text-muted-foreground">
          <button
            type="button"
            onClick={onHavuzAc}
            title="Havuzdan ekle"
            aria-label="Havuzdan ekle"
            className="rounded-full p-1.5 transition-colors hover:bg-muted hover:text-foreground"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <Link
            to="/mizan/mana"
            title="Şablonları yönet"
            aria-label="Şablonları yönet"
            className="rounded-full p-1.5 transition-colors hover:bg-muted hover:text-foreground"
          >
            <Settings2 className="h-4 w-4" />
          </Link>
          {gorevler.length > 0 && (
            <button
              type="button"
              title="Sıfırla"
              aria-label="Sıfırla"
              onClick={() => {
                if (confirm("Bugünün tüm görevleri silinsin mi?")) {
                  sifirla.mutate(tarih, { onSuccess: () => toast.success("Sıfırlandı") });
                }
              }}
              className="rounded-full p-1.5 transition-colors hover:bg-muted hover:text-foreground"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          )}
        </div>
      </header>

      {/* Hızlı ekleme — listenin başında */}
      <HizliEkleSatiri tarih={tarih} />

      {/* Aktif görevler */}
      {aktif.length === 0 && biten.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
          <p className="text-sm text-muted-foreground">
            Bugün için görev yok. Yukarıdan ekleyebilirsin.
          </p>
          <button
            type="button"
            onClick={onHavuzAc}
            className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-3.5 py-1.5 text-xs font-medium text-background transition-transform hover:scale-[1.03] active:scale-[0.97]"
          >
            <LayoutGrid className="h-3.5 w-3.5" /> Havuzdan ekle
          </button>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={aktif.map((g) => g.id)} strategy={verticalListSortingStrategy}>
            <ul className="flex flex-col">
              {aktif.map((g) => (
                <SatirSortable
                  key={g.id}
                  gorev={g}
                  onToggle={(v) =>
                    guncelle.mutate({
                      id: g.id,
                      tamamlandi: v,
                      tamamlanma_at: v ? new Date().toISOString() : null,
                    })
                  }
                  onSaat={(saat) => guncelle.mutate({ id: g.id, saat })}
                  onSure={(dk) => guncelle.mutate({ id: g.id, tahmini_sure_dk: dk })}
                  onSil={() => sil.mutate(g.id)}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      {/* Tamamlananlar */}
      {biten.length > 0 && (
        <div className="mt-2">
          <button
            type="button"
            onClick={() => setBitenAcik((v) => !v)}
            className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
          >
            <ChevronRight
              className={cn(
                "h-3.5 w-3.5 transition-transform",
                bitenAcik && "rotate-90",
              )}
            />
            Tamamlananlar ({biten.length})
          </button>
          {bitenAcik && (
            <ul className="flex flex-col">
              {biten.map((g) => (
                <Satir
                  key={g.id}
                  gorev={g}
                  onToggle={(v) =>
                    guncelle.mutate({
                      id: g.id,
                      tamamlandi: v,
                      tamamlanma_at: v ? new Date().toISOString() : null,
                    })
                  }
                  onSaat={(saat) => guncelle.mutate({ id: g.id, saat })}
                  onSure={(dk) => guncelle.mutate({ id: g.id, tahmini_sure_dk: dk })}
                  onSil={() => sil.mutate(g.id)}
                />
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}

/* ---------- Satır (sortable wrapper) ---------- */

function SatirSortable(props: SatirProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props.gorev.id,
  });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };
  return (
    <div ref={setNodeRef} style={style}>
      <Satir {...props} dragHandle={{ attributes, listeners }} />
    </div>
  );
}

type SatirProps = {
  gorev: GunlukGorev;
  onToggle: (v: boolean) => void;
  onSaat: (s: string | null) => void;
  onSure: (dk: number | null) => void;
  onSil: () => void;
  dragHandle?: {
    attributes: React.HTMLAttributes<HTMLButtonElement>;
    listeners: React.HTMLAttributes<HTMLButtonElement> | undefined;
  };
};

function Satir({ gorev, onToggle, onSaat, onSure, onSil, dragHandle }: SatirProps) {
  const [saatAcik, setSaatAcik] = React.useState(false);
  const [sureAcik, setSureAcik] = React.useState(false);

  return (
    <li
      className={cn(
        "group flex items-center gap-2 rounded-md px-2 py-2.5 transition-colors hover:bg-muted/40",
      )}
    >
      {dragHandle ? (
        <button
          type="button"
          {...dragHandle.attributes}
          {...dragHandle.listeners}
          className="-ml-1 cursor-grab text-muted-foreground/30 opacity-0 transition-opacity hover:text-muted-foreground active:cursor-grabbing group-hover:opacity-100"
          aria-label="Taşı"
          tabIndex={-1}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      ) : (
        <span className="-ml-1 w-4" aria-hidden />
      )}

      {/* Daire checkbox */}
      <button
        type="button"
        role="checkbox"
        aria-checked={gorev.tamamlandi}
        aria-label={`${gorev.baslik} tamamla`}
        onClick={() => onToggle(!gorev.tamamlandi)}
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
          gorev.tamamlandi
            ? "border-foreground/60 bg-foreground/60 text-background"
            : "border-muted-foreground/40 hover:border-foreground",
        )}
      >
        {gorev.tamamlandi && <Check className="h-3 w-3" strokeWidth={3} />}
      </button>

      {/* Başlık */}
      <div className="min-w-0 flex-1">
        <div
          className={cn(
            "truncate text-sm",
            gorev.tamamlandi
              ? "text-muted-foreground line-through"
              : "text-foreground",
          )}
        >
          {gorev.baslik}
        </div>
      </div>

      {/* Saat */}
      {saatAcik ? (
        <input
          type="time"
          autoFocus
          defaultValue={gorev.saat?.slice(0, 5) ?? ""}
          onBlur={(e) => {
            onSaat(e.target.value || null);
            setSaatAcik(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
            if (e.key === "Escape") setSaatAcik(false);
          }}
          className="h-7 rounded-md border border-border bg-background px-1.5 text-[11px] tabular-nums"
        />
      ) : gorev.saat ? (
        <button
          type="button"
          onClick={() => setSaatAcik(true)}
          className="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground hover:text-foreground"
          title="Saati düzenle"
        >
          {gorev.saat.slice(0, 5)}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setSaatAcik(true)}
          className="shrink-0 text-muted-foreground/40 opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
          title="Saat ekle"
          aria-label="Saat ekle"
        >
          <Clock className="h-3.5 w-3.5" />
        </button>
      )}

      {/* Süre */}
      {sureAcik ? (
        <SurePopover
          mevcut={gorev.tahmini_sure_dk}
          onSec={(dk) => {
            onSure(dk);
            setSureAcik(false);
          }}
          onKapat={() => setSureAcik(false)}
        />
      ) : gorev.tahmini_sure_dk != null ? (
        <button
          type="button"
          onClick={() => setSureAcik(true)}
          className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] tabular-nums text-muted-foreground hover:bg-muted/80 hover:text-foreground"
          title="Süreyi düzenle"
        >
          {gorev.tahmini_sure_dk} dk
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setSureAcik(true)}
          className="shrink-0 text-muted-foreground/40 opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
          title="Süre ekle"
          aria-label="Süre ekle"
        >
          <Timer className="h-3.5 w-3.5" />
        </button>
      )}

      {/* Sil */}
      <button
        type="button"
        onClick={onSil}
        className="text-muted-foreground/40 opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
        aria-label="Sil"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </li>
  );
}

/* ---------- Süre popover ---------- */

function SurePopover({
  mevcut,
  onSec,
  onKapat,
}: {
  mevcut: number | null;
  onSec: (dk: number | null) => void;
  onKapat: () => void;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [ozel, setOzel] = React.useState(mevcut?.toString() ?? "");
  React.useEffect(() => {
    const f = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) onKapat();
    };
    document.addEventListener("mousedown", f);
    return () => document.removeEventListener("mousedown", f);
  }, [onKapat]);
  return (
    <div
      ref={ref}
      className="relative flex items-center gap-1 rounded-full border border-border bg-popover px-1.5 py-0.5 shadow-sm"
    >
      {[5, 10, 15, 30, 45, 60].map((dk) => (
        <button
          key={dk}
          type="button"
          onClick={() => onSec(dk)}
          className={cn(
            "rounded-full px-1.5 py-0.5 text-[10px] tabular-nums hover:bg-muted",
            mevcut === dk && "bg-foreground text-background hover:bg-foreground",
          )}
        >
          {dk}
        </button>
      ))}
      <input
        type="number"
        min={1}
        value={ozel}
        onChange={(e) => setOzel(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSec(ozel ? Number(ozel) : null);
          if (e.key === "Escape") onKapat();
        }}
        placeholder="dk"
        className="h-6 w-12 rounded-md border border-border bg-background px-1 text-[10px] tabular-nums"
      />
      {mevcut != null && (
        <button
          type="button"
          onClick={() => onSec(null)}
          className="rounded-full p-0.5 text-muted-foreground hover:text-destructive"
          title="Temizle"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

/* ---------- Hızlı ekleme ---------- */

function HizliEkleSatiri({ tarih }: { tarih: string }) {
  const ekle = useGunlukGorevEkle();
  const [ad, setAd] = React.useState("");
  const [saat, setSaat] = React.useState<string>("");
  const [dk, setDk] = React.useState<string>("");
  const [extraAcik, setExtraAcik] = React.useState(false);

  const onEkle = async () => {
    if (!ad.trim()) return;
    try {
      await ekle.mutateAsync({
        tarih,
        baslik: ad.trim(),
        tahmini_sure_dk: dk ? Number(dk) : null,
        saat: saat || null,
        sablon_id: null,
      });
      setAd("");
      setSaat("");
      setDk("");
      setExtraAcik(false);
    } catch {
      toast.error("Eklenemedi");
    }
  };

  return (
    <div className="mb-1 flex flex-col gap-1 rounded-md px-2 py-1.5">
      <div className="flex items-center gap-2">
        <Plus className="h-4 w-4 shrink-0 text-muted-foreground" />
        <Input
          value={ad}
          onChange={(e) => setAd(e.target.value)}
          placeholder="Bir görev ekleyin"
          onKeyDown={(e) => e.key === "Enter" && onEkle()}
          className="h-8 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
        />
        <button
          type="button"
          onClick={() => setExtraAcik((v) => !v)}
          className={cn(
            "shrink-0 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground",
            extraAcik && "bg-muted text-foreground",
          )}
          title="Saat / süre"
          aria-label="Saat / süre"
        >
          <Clock className="h-3.5 w-3.5" />
        </button>
      </div>
      {extraAcik && (
        <div className="flex items-center gap-2 pl-6">
          <Input
            type="time"
            value={saat}
            onChange={(e) => setSaat(e.target.value)}
            className="h-8 w-[110px] text-xs"
            aria-label="Saat (ops.)"
          />
          <Input
            type="number"
            value={dk}
            onChange={(e) => setDk(e.target.value)}
            placeholder="dk"
            className="h-8 w-16 text-xs"
            aria-label="Süre (dk)"
          />
        </div>
      )}
    </div>
  );
}