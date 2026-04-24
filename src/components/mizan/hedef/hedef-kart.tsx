import * as React from "react";
import { Link } from "@tanstack/react-router";
import { BookOpen, Flame, Target, Hammer, CheckCircle2, Calendar } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import type { Hedef, HedefAdim } from "@/lib/hedef-tipleri";
import { ALAN_ETIKET, ALAN_RENK_VAR } from "@/lib/cetele-tipleri";
import type { CeteleKayit } from "@/lib/cetele-tipleri";
import { streakHesapla } from "@/lib/hedef-hooks";

const TIP_IKON = {
  kurs: BookOpen,
  proje: Hammer,
  aliskanlik: Flame,
  sayisal: Target,
  tekil: CheckCircle2,
} as const;

function formatTarih(iso: string | null) {
  if (!iso) return null;
  try {
    return format(parseISO(iso), "d MMM", { locale: tr });
  } catch {
    return iso;
  }
}

export interface HedefKartProps {
  hedef: Hedef;
  adimlar?: HedefAdim[];
  kayitlar?: CeteleKayit[];
  birikim?: number;
}

export function HedefKart({ hedef, adimlar = [], kayitlar = [], birikim }: HedefKartProps) {
  const Ikon = TIP_IKON[hedef.tip];
  const renkVar = ALAN_RENK_VAR[hedef.alan];
  const alanRenk = `var(${renkVar})`;

  return (
    <Link
      to="/mizan/hedef/$id"
      params={{ id: hedef.id }}
      className="group relative block overflow-hidden rounded-xl border border-border bg-card p-4 transition-all hover:border-foreground/20 hover:shadow-sm"
    >
      <div
        className="absolute inset-y-0 left-0 w-1"
        style={{ background: alanRenk }}
        aria-hidden
      />
      <div className="ml-2">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="flex h-7 w-7 flex-none items-center justify-center rounded-md"
              style={{ background: `color-mix(in oklab, ${alanRenk} 15%, transparent)`, color: alanRenk }}
            >
              <Ikon className="h-3.5 w-3.5" />
            </div>
            <h3 className="truncate text-sm font-medium">{hedef.ad}</h3>
          </div>
          <Badge
            variant="outline"
            className="flex-none text-[10px] font-normal"
            style={{ borderColor: `color-mix(in oklab, ${alanRenk} 40%, transparent)`, color: alanRenk }}
          >
            {ALAN_ETIKET[hedef.alan]}
          </Badge>
        </div>

        <KartGovde hedef={hedef} adimlar={adimlar} kayitlar={kayitlar} birikim={birikim} alanRenk={alanRenk} />
      </div>
    </Link>
  );
}

function KartGovde({
  hedef,
  adimlar,
  kayitlar,
  birikim,
  alanRenk,
}: {
  hedef: Hedef;
  adimlar: HedefAdim[];
  kayitlar: CeteleKayit[];
  birikim?: number;
  alanRenk: string;
}) {
  const vade = formatTarih(hedef.bitis);

  if (hedef.tip === "kurs" || hedef.tip === "proje") {
    const ilgili = adimlar.filter((a) => a.hedef_id === hedef.id);
    const tamam = ilgili.filter((a) => a.tamamlandi).length;
    const toplam = ilgili.length;
    const yuzde = toplam > 0 ? Math.round((tamam / toplam) * 100) : 0;
    const sonraki = ilgili.find((a) => !a.tamamlandi);
    return (
      <div className="space-y-2">
        <Progress
          value={yuzde}
          className="h-1.5 bg-muted"
          style={{ "--progress-fg": alanRenk } as React.CSSProperties}
        />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="truncate">
            {sonraki ? `Sonraki: ${sonraki.baslik}` : toplam === 0 ? "Adım yok" : "Tamam"}
          </span>
          <span className="font-medium text-foreground">{tamam}/{toplam}</span>
        </div>
        {vade && (
          <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Calendar className="h-3 w-3" /> Vade: {vade}
          </p>
        )}
      </div>
    );
  }

  if (hedef.tip === "aliskanlik") {
    const { aktif, haftaSayim } = streakHesapla(kayitlar);
    return (
      <div className="space-y-2">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-semibold tracking-tight" style={{ color: alanRenk }}>
            {aktif}
          </span>
          <span className="text-xs text-muted-foreground">gün streak</span>
          {aktif >= 3 && <Flame className="h-3.5 w-3.5 text-orange-500" />}
        </div>
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Bu hafta: {haftaSayim}/7</span>
          {vade && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {vade}</span>}
        </div>
      </div>
    );
  }

  if (hedef.tip === "sayisal") {
    const hedefMiktar = Number(hedef.hedef_miktar ?? 0);
    const mevcut = birikim ?? 0;
    const yuzde = hedefMiktar > 0 ? Math.min(100, Math.round((mevcut / hedefMiktar) * 100)) : 0;
    return (
      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <span className="text-sm">
            <span className="text-base font-semibold tabular-nums" style={{ color: alanRenk }}>
              {mevcut.toLocaleString("tr-TR")}
            </span>
            <span className="text-muted-foreground"> / {hedefMiktar.toLocaleString("tr-TR")} {hedef.birim ?? ""}</span>
          </span>
          <span className="text-xs font-medium">{yuzde}%</span>
        </div>
        <Progress
          value={yuzde}
          className="h-1.5 bg-muted"
          style={{ "--progress-fg": alanRenk } as React.CSSProperties}
        />
        {vade && (
          <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Calendar className="h-3 w-3" /> Vade: {vade}
          </p>
        )}
      </div>
    );
  }

  // tekil
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-muted-foreground">
        {vade ? `Vade: ${vade}` : "Açık uçlu"}
      </span>
      {hedef.durum === "tamamlandi" ? (
        <Badge variant="secondary" className="text-[10px]">
          <CheckCircle2 className="mr-1 h-3 w-3" /> Tamamlandı
        </Badge>
      ) : (
        <span className="text-[11px] font-medium" style={{ color: alanRenk }}>
          Bekliyor
        </span>
      )}
    </div>
  );
}
