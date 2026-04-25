import * as React from "react";

type Heading = { level: 1 | 2 | 3; text: string; id: string };

/** Belge JSON'unu tarayıp H1/H2/H3 başlık listesi çıkarır. */
function basliklariTopla(node: unknown, out: Heading[] = [], i = { v: 0 }): Heading[] {
  if (!node || typeof node !== "object") return out;
  const n = node as { type?: string; attrs?: { level?: number }; content?: unknown[] };
  if (n.type === "heading" && n.attrs && [1, 2, 3].includes(n.attrs.level ?? 0)) {
    const text = textIc(n);
    if (text.trim()) {
      i.v += 1;
      out.push({ level: n.attrs.level as 1 | 2 | 3, text, id: `h-${i.v}` });
    }
  }
  if (Array.isArray(n.content)) {
    n.content.forEach((c) => basliklariTopla(c, out, i));
  }
  return out;
}

function textIc(node: unknown): string {
  if (!node || typeof node !== "object") return "";
  const n = node as { type?: string; text?: string; content?: unknown[] };
  if (typeof n.text === "string") return n.text;
  if (Array.isArray(n.content)) return n.content.map(textIc).join("");
  return "";
}

export function BelgeOutline({ icerik }: { icerik: unknown }) {
  const basliklar = React.useMemo(() => basliklariTopla(icerik), [icerik]);

  if (basliklar.length < 2) {
    return (
      <div className="text-[11px] text-muted-foreground">
        Başlık ekledikçe burada gözükecek.
      </div>
    );
  }

  const onClick = (text: string) => {
    const tum = document.querySelectorAll<HTMLElement>(".ProseMirror h1, .ProseMirror h2, .ProseMirror h3");
    for (const el of Array.from(tum)) {
      if (el.textContent?.trim() === text.trim()) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
    }
  };

  return (
    <nav className="space-y-0.5 text-sm">
      {basliklar.map((h, i) => (
        <button
          key={`${h.id}-${i}`}
          onClick={() => onClick(h.text)}
          className="block w-full truncate rounded px-2 py-1 text-left text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          style={{ paddingLeft: `${0.5 + (h.level - 1) * 0.75}rem` }}
        >
          {h.text}
        </button>
      ))}
    </nav>
  );
}