export const TAKVIM_RENKLERI = [
  { id: "cal-1", ad: "Mavi", oklch: "oklch(0.62 0.18 250)" },
  { id: "cal-2", ad: "Yeşil", oklch: "oklch(0.7 0.16 150)" },
  { id: "cal-3", ad: "Kırmızı", oklch: "oklch(0.62 0.22 25)" },
  { id: "cal-4", ad: "Turuncu", oklch: "oklch(0.72 0.18 60)" },
  { id: "cal-5", ad: "Mor", oklch: "oklch(0.6 0.2 300)" },
  { id: "cal-6", ad: "Pembe", oklch: "oklch(0.7 0.18 0)" },
  { id: "cal-7", ad: "Camgöbeği", oklch: "oklch(0.7 0.15 200)" },
  { id: "cal-8", ad: "Sarı", oklch: "oklch(0.82 0.16 90)" },
] as const;

export type TakvimRenkId = (typeof TAKVIM_RENKLERI)[number]["id"];

export function rengiBul(id: string | null | undefined): string {
  const bulundu = TAKVIM_RENKLERI.find((r) => r.id === id);
  return (bulundu ?? TAKVIM_RENKLERI[0]).oklch;
}
