import * as React from "react";
import type { CeteleKayit } from "@/lib/cetele-tipleri";
import { ALAN_RENK_VAR } from "@/lib/cetele-tipleri";
import type { CeteleAlan } from "@/lib/cetele-tipleri";

export function StreakIsiHaritasi({
  kayitlar,
  alan,
  gunSayisi = 90,
}: {
  kayitlar: CeteleKayit[];
  alan: CeteleAlan;
  gunSayisi?: number;
}) {
  const renkVar = `var(${ALAN_RENK_VAR[alan]})`;
  const set = React.useMemo(
    () => new Set(kayitlar.map((k) => k.tarih)),
    [kayitlar],
  );
  const gunler = React.useMemo(() => {
    const list: { iso: string; aktif: boolean }[] = [];
    const bugun = new Date();
    for (let i = gunSayisi - 1; i >= 0; i--) {
      const d = new Date(bugun);
      d.setDate(bugun.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      list.push({ iso, aktif: set.has(iso) });
    }
    return list;
  }, [set, gunSayisi]);

  return (
    <div className="flex flex-wrap gap-1">
      {gunler.map((g) => (
        <div
          key={g.iso}
          title={g.iso}
          className="h-3 w-3 rounded-sm transition-colors"
          style={{
            background: g.aktif
              ? renkVar
              : "color-mix(in oklab, var(--muted) 80%, transparent)",
            opacity: g.aktif ? 1 : 0.6,
          }}
        />
      ))}
    </div>
  );
}
