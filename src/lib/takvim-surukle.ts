import * as React from "react";

export type SurukleModu = "tasi" | "boyutla";

export type SurukleDurumu = {
  id: string;
  modu: SurukleModu;
  // ekran üstü piksel ofseti (pointer Y - başlangıç Y), snap uygulanmış
  dyPx: number;
  // tarih sütun değişimi (sadece çoklu sütunlu görünümde): -n .. +n
  sutunDelta: number;
  // başlangıçtaki sütun anahtarı (ISO gün) — sadece haftalık görünüm için
  baslangicSutunKey?: string;
  // hedef sütun anahtarı
  hedefSutunKey?: string;
};

type SurukleSecenek = {
  /** Bir saatin piksel yüksekliği (40 hafta, 56 gün). */
  saatPx: number;
  /** Snap aralığı dakika cinsinden (15 önerilir). */
  snapDk?: number;
  /** Otomatik kaydırma için tetikleme bölgesi (px) */
  edge?: number;
  /** Sürükleme bittiğinde çağrılır. dakika cinsinden delta + sütun delta verilir. */
  onTasimaBitti: (arg: {
    id: string;
    modu: SurukleModu;
    dakikaDelta: number;
    sutunDelta: number;
    baslangicSutunKey?: string;
    hedefSutunKey?: string;
  }) => void;
  /** Scroll konteyneri ref'i (auto-scroll için). */
  scrollRef: React.RefObject<HTMLDivElement | null>;
  /** Hafta görünümünde sütun genişliğini hesaplamak için elemanlar. Yoksa sadece dikey taşıma. */
  sutunlar?: Array<{ key: string; getRect: () => DOMRect | null }>;
};

export function useTakvimSurukle({
  saatPx,
  snapDk = 15,
  edge = 48,
  onTasimaBitti,
  scrollRef,
  sutunlar,
}: SurukleSecenek) {
  const [durum, setDurum] = React.useState<SurukleDurumu | null>(null);
  const stateRef = React.useRef<{
    id: string;
    modu: SurukleModu;
    startY: number;
    startScroll: number;
    rafId: number | null;
    lastClientY: number;
    lastClientX: number;
    baslangicSutunKey?: string;
  } | null>(null);

  const snapPx = (saatPx * snapDk) / 60;

  const hesapla = React.useCallback(
    (clientY: number, clientX: number) => {
      const s = stateRef.current;
      if (!s) return null;
      const sc = scrollRef.current;
      const scrollDelta = sc ? sc.scrollTop - s.startScroll : 0;
      const rawDy = clientY - s.startY + scrollDelta;
      const snapped = Math.round(rawDy / snapPx) * snapPx;

      let sutunDelta = 0;
      let hedefSutunKey: string | undefined = s.baslangicSutunKey;
      if (sutunlar && sutunlar.length > 0 && s.modu === "tasi") {
        // hangi sütunun içindeyiz?
        const baslangicIdx = sutunlar.findIndex((c) => c.key === s.baslangicSutunKey);
        let icindeIdx = baslangicIdx;
        for (let i = 0; i < sutunlar.length; i++) {
          const r = sutunlar[i].getRect();
          if (!r) continue;
          if (clientX >= r.left && clientX <= r.right) {
            icindeIdx = i;
            break;
          }
        }
        if (baslangicIdx >= 0 && icindeIdx >= 0) {
          sutunDelta = icindeIdx - baslangicIdx;
          hedefSutunKey = sutunlar[icindeIdx].key;
        }
      }
      return { dyPx: snapped, sutunDelta, hedefSutunKey };
    },
    [scrollRef, snapPx, sutunlar],
  );

  const autoScrollTick = React.useCallback(() => {
    const s = stateRef.current;
    const sc = scrollRef.current;
    if (!s || !sc) return;
    const rect = sc.getBoundingClientRect();
    const y = s.lastClientY;
    let dz = 0;
    if (y < rect.top + edge) {
      dz = -Math.max(4, (rect.top + edge - y) / 4);
    } else if (y > rect.bottom - edge) {
      dz = Math.max(4, (y - (rect.bottom - edge)) / 4);
    }
    if (dz !== 0) {
      sc.scrollTop += dz;
      const h = hesapla(s.lastClientY, s.lastClientX);
      if (h) {
        setDurum({
          id: s.id,
          modu: s.modu,
          dyPx: h.dyPx,
          sutunDelta: h.sutunDelta,
          baslangicSutunKey: s.baslangicSutunKey,
          hedefSutunKey: h.hedefSutunKey,
        });
      }
    }
    s.rafId = requestAnimationFrame(autoScrollTick);
  }, [edge, hesapla, scrollRef]);

  const baslat = React.useCallback(
    (
      e: React.PointerEvent,
      id: string,
      modu: SurukleModu,
      baslangicSutunKey?: string,
    ) => {
      e.preventDefault();
      e.stopPropagation();
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
      const sc = scrollRef.current;
      stateRef.current = {
        id,
        modu,
        startY: e.clientY,
        startScroll: sc ? sc.scrollTop : 0,
        rafId: null,
        lastClientY: e.clientY,
        lastClientX: e.clientX,
        baslangicSutunKey,
      };
      setDurum({
        id,
        modu,
        dyPx: 0,
        sutunDelta: 0,
        baslangicSutunKey,
        hedefSutunKey: baslangicSutunKey,
      });
      document.body.style.userSelect = "none";
      document.body.style.cursor = modu === "boyutla" ? "ns-resize" : "grabbing";
      stateRef.current.rafId = requestAnimationFrame(autoScrollTick);
    },
    [autoScrollTick, scrollRef],
  );

  const tasi = React.useCallback(
    (e: React.PointerEvent) => {
      const s = stateRef.current;
      if (!s) return;
      s.lastClientY = e.clientY;
      s.lastClientX = e.clientX;
      const h = hesapla(e.clientY, e.clientX);
      if (!h) return;
      setDurum({
        id: s.id,
        modu: s.modu,
        dyPx: h.dyPx,
        sutunDelta: h.sutunDelta,
        baslangicSutunKey: s.baslangicSutunKey,
        hedefSutunKey: h.hedefSutunKey,
      });
    },
    [hesapla],
  );

  const bitir = React.useCallback(
    (e: React.PointerEvent) => {
      const s = stateRef.current;
      if (!s) return;
      (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
      if (s.rafId != null) cancelAnimationFrame(s.rafId);
      const h = hesapla(e.clientY, e.clientX);
      const dakikaDelta = h ? Math.round((h.dyPx / saatPx) * 60) : 0;
      const sutunDelta = h ? h.sutunDelta : 0;
      const hedefSutunKey = h?.hedefSutunKey;
      stateRef.current = null;
      setDurum(null);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
      if (dakikaDelta !== 0 || sutunDelta !== 0) {
        onTasimaBitti({
          id: s.id,
          modu: s.modu,
          dakikaDelta,
          sutunDelta,
          baslangicSutunKey: s.baslangicSutunKey,
          hedefSutunKey,
        });
      }
    },
    [hesapla, onTasimaBitti, saatPx],
  );

  const iptal = React.useCallback(() => {
    const s = stateRef.current;
    if (!s) return;
    if (s.rafId != null) cancelAnimationFrame(s.rafId);
    stateRef.current = null;
    setDurum(null);
    document.body.style.userSelect = "";
    document.body.style.cursor = "";
  }, []);

  React.useEffect(() => {
    return () => {
      const s = stateRef.current;
      if (s?.rafId != null) cancelAnimationFrame(s.rafId);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
  }, []);

  return { durum, baslat, tasi, bitir, iptal };
}