import * as React from "react";

/**
 * Scroll yönü + üstte olup olmadığını döner.
 * - direction: "up" | "down"
 * - atTop: scrollY < threshold
 *
 * Topbar gizleme/gösterme için kullanılır.
 */
export function useScrollDirection(threshold = 64) {
  const [direction, setDirection] = React.useState<"up" | "down">("up");
  const [atTop, setAtTop] = React.useState(true);

  React.useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        const y = window.scrollY;
        const delta = y - lastY;
        // Küçük titreşimleri görmezden gel
        if (Math.abs(delta) > 4) {
          setDirection(delta > 0 ? "down" : "up");
          lastY = y;
        }
        setAtTop(y < threshold);
        ticking = false;
      });
    };

    setAtTop(window.scrollY < threshold);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  return { direction, atTop };
}