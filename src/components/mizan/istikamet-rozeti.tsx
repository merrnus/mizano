import * as React from "react";

export type RozetTuru = "ondesin" | "elver" | "dengede";

type Veri = { ad: string; yuzde: number; renkVar: string };

/**
 * Üç alanın yüzdelerine bakarak hangi karta hangi rozetin yapışacağını döndürür.
 * - max - min ≤ 15  → "DENGEDE", ortadaki karta
 * - max - others > 15 → "ÖNDESİN", en yüksek karta
 * - aksi → "EL VER", en düşüğe
 */
export function rozetiHesapla(
  veriler: Veri[],
): { tur: RozetTuru; index: number; metin: string; renk: string } {
  const max = Math.max(...veriler.map((v) => v.yuzde));
  const min = Math.min(...veriler.map((v) => v.yuzde));
  const fark = max - min;

  if (fark <= 15) {
    // ortadaki kart (sıralanan dizide ortanca)
    const sirali = [...veriler].map((v, i) => ({ ...v, i }))
      .sort((a, b) => a.yuzde - b.yuzde);
    const orta = sirali[1];
    return {
      tur: "dengede",
      index: orta.i,
      metin: "Dengede",
      renk: "var(--primary)",
    };
  }

  // belirgin önde olan var mı? (en yüksek, ortalamadan belirgin yukarıda)
  const others = veriler.filter((v) => v.yuzde !== max);
  const ortalamaDigerler = others.reduce((a, v) => a + v.yuzde, 0) / others.length;
  if (max - ortalamaDigerler > 15) {
    const idx = veriler.findIndex((v) => v.yuzde === max);
    return {
      tur: "ondesin",
      index: idx,
      metin: "Öndesin",
      renk: `var(${veriler[idx].renkVar})`,
    };
  }

  // belirgin geride
  const idx = veriler.findIndex((v) => v.yuzde === min);
  return {
    tur: "elver",
    index: idx,
    metin: "El ver",
    renk: "var(--destructive)",
  };
}

export function IstikametRozeti({
  metin,
  renk,
}: {
  metin: string;
  renk: string;
}) {
  return (
    <span
      className="inline-flex items-center rounded-full border bg-background/80 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.22em] backdrop-blur-sm"
      style={{
        color: renk,
        borderColor: `color-mix(in oklab, ${renk} 50%, transparent)`,
        boxShadow: `0 0 16px -4px ${renk}`,
      }}
    >
      {metin}
    </span>
  );
}