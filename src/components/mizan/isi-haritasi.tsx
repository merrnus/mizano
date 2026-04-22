import { cn } from "@/lib/utils";

type IsiHaritasiProps = {
  alanlar: { ad: string; renkVar: string; degerler: number[] }[]; // degerler: 0-4
  gunler?: string[];
};

const VARSAYILAN_GUNLER = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

function yogunlukSinifi(d: number) {
  if (d <= 0) return "opacity-15";
  if (d === 1) return "opacity-35";
  if (d === 2) return "opacity-55";
  if (d === 3) return "opacity-75";
  return "opacity-100";
}

export function IsiHaritasi({ alanlar, gunler = VARSAYILAN_GUNLER }: IsiHaritasiProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="grid grid-cols-[88px_repeat(7,minmax(0,1fr))] gap-2">
        <div />
        {gunler.map((g) => (
          <div key={g} className="text-center text-xs text-muted-foreground">
            {g}
          </div>
        ))}
        {alanlar.map((alan) => (
          <div key={alan.ad} className="contents">
            <div className="flex items-center text-xs text-muted-foreground">{alan.ad}</div>
            {alan.degerler.map((d, i) => (
              <div
                key={i}
                title={`${alan.ad} — ${gunler[i]}: ${d}/4`}
                className={cn("h-8 rounded-md", yogunlukSinifi(d))}
                style={{ backgroundColor: `var(${alan.renkVar})` }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}