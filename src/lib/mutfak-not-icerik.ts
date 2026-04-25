export type NotListeItem = { id: string; text: string; done: boolean };
export type NotIcerik =
  | { tip: "metin"; metin: string }
  | { tip: "liste"; items: NotListeItem[] };

export function icerikCoz(raw: string): NotIcerik {
  if (!raw) return { tip: "metin", metin: "" };
  if (raw.trim().startsWith("{")) {
    try {
      const j = JSON.parse(raw);
      if (j && j.tip === "liste" && Array.isArray(j.items)) {
        return {
          tip: "liste",
          items: j.items.map((it: { id?: string; text?: string; done?: boolean }, i: number) => ({
            id: it.id ?? `i${i}`,
            text: it.text ?? "",
            done: !!it.done,
          })),
        };
      }
    } catch {
      /* düz metin olarak değerlendir */
    }
  }
  return { tip: "metin", metin: raw };
}

export function icerikYazi(icerik: NotIcerik): string {
  if (icerik.tip === "metin") return icerik.metin;
  return JSON.stringify({ tip: "liste", items: icerik.items });
}

export function icerikOzet(raw: string): string {
  const i = icerikCoz(raw);
  if (i.tip === "metin") return i.metin;
  return i.items.map((it) => `${it.done ? "✓" : "•"} ${it.text}`).join("\n");
}