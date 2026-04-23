import * as React from "react";

type Halka = {
  ad: string;
  yuzde: number; // 0-100
  renkVar: string; // CSS var name e.g. "--maneviyat"
  ikon?: React.ReactNode;
};

type Props = {
  halkalar: [Halka, Halka, Halka];
  boyut?: number; // px
};

/**
 * 3 eş merkezli yarım daire ilerleme halkası (üstten dolar).
 * En dış: ilk halka, en iç: son halka.
 */
export function DengeHalkalari({ halkalar, boyut = 280 }: Props) {
  const strokeW = 14;
  const gap = 6;
  const cx = boyut / 2;
  const cy = boyut / 2;

  // Her halka için yarıçap (en dıştan içe)
  const radii = halkalar.map((_, i) => (boyut - strokeW) / 2 - i * (strokeW + gap));

  return (
    <div className="relative" style={{ width: boyut, height: boyut / 2 + 24 }}>
      <svg
        width={boyut}
        height={boyut}
        viewBox={`0 0 ${boyut} ${boyut}`}
        className="absolute left-0 top-0"
        style={{ transform: "translateY(0)" }}
      >
        {halkalar.map((h, i) => {
          const r = radii[i];
          // Yarım daire perimetresi = π·r
          const length = Math.PI * r;
          const dash = (h.yuzde / 100) * length;
          // Üst yarım daire için path: sol → üst → sağ
          const d = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;
          return (
            <g key={h.ad}>
              <path
                d={d}
                fill="none"
                stroke="currentColor"
                strokeWidth={strokeW}
                strokeLinecap="round"
                className="text-muted/40"
              />
              <path
                d={d}
                fill="none"
                stroke={`var(${h.renkVar})`}
                strokeWidth={strokeW}
                strokeLinecap="round"
                strokeDasharray={`${dash} ${length}`}
                style={{ transition: "stroke-dasharray 600ms ease" }}
              />
            </g>
          );
        })}
      </svg>
      {/* Orta — toplam ortalama */}
      <div
        className="absolute left-1/2 -translate-x-1/2 text-center"
        style={{ top: cy - 28 }}
      >
        <div className="text-2xl font-semibold text-foreground">
          {Math.round(halkalar.reduce((a, h) => a + h.yuzde, 0) / 3)}%
        </div>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Bu hafta
        </div>
      </div>
    </div>
  );
}

export function DengeLegend({
  halkalar,
}: {
  halkalar: { ad: string; yuzde: number; renkVar: string }[];
}) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-4">
      {halkalar.map((h) => (
        <div key={h.ad} className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: `var(${h.renkVar})` }}
          />
          <span className="text-xs text-muted-foreground">{h.ad}</span>
          <span className="text-xs font-medium text-foreground">{h.yuzde}%</span>
        </div>
      ))}
    </div>
  );
}
