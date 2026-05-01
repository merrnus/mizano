import * as React from "react";

export type SurukleModu = "tasi" | "boyutla";

export type SurukleDurumu = {
  id: string;
  modu: SurukleModu;
  /** y ekseninde snap uygulanmış piksel ofseti */
  dyPx: number;
  /** sütun değişimi (haftalık görünümde -n .. +n) */
  sutunDelta: number;
  baslangicSutunKey?: string;
  hedefSutunKey?: string;
  /** Sürükleme eşiği geçildi mi? Geçmediyse henüz drag değil, sadece tık. */
  aktif: boolean;
};

type SurukleSecenek = {
  saatPx: number;
  snapDk?: number;
  /** Drag eşiği (piksel). Bu mesafenin altında click sayılır. */
  surukleEsigi?: number;
  /** Auto-scroll için kenar bölgesi (px) */
  edge?: number;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  sutunlar?: Array<{ key: string; getRect: () => DOMRect | null }>;
  onTasimaBitti: (arg: {
    id: string;
    modu: SurukleModu;
    dakikaDelta: number;
    sutunDelta: number;
    baslangicSutunKey?: string;
    hedefSutunKey?: string;
    /** Eşik aşıldı mı? false ise click olarak yorumlanmalı. */
    surukleGerceklesti: boolean;
  }) => void;
};

type DahiliDurum = {
  id: string;
  modu: SurukleModu;
  startX: number;
  startY: number;
  startScroll: number;
  rafId: number | null;
  lastClientY: number;
  lastClientX: number;
  baslangicSutunKey?: string;
  aktif: boolean; // eşik aşıldı mı
};

export function useTakvimSurukle({
  saatPx,
  snapDk = 15,
  surukleEsigi = 5,
  edge = 56,
  onTasimaBitti,
  scrollRef,
  sutunlar,
}: SurukleSecenek) {
  const [durum, setDurum] = React.useState<SurukleDurumu | null>(null);
  const stateRef = React.useRef<DahiliDurum | null>(null);
  /** drag bittikten sonra kısa süre click'i bastır */
  const supressClickUntilRef = React.useRef<number>(0);

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
    if (s.aktif) {
      const rect = sc.getBoundingClientRect();
      const y = s.lastClientY;
      let dz = 0;
      if (y < rect.top + edge) {
        dz = -Math.max(3, (rect.top + edge - y) / 6);
      } else if (y > rect.bottom - edge) {
        dz = Math.max(3, (y - (rect.bottom - edge)) / 6);
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
            aktif: true,
          });
        }
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
      // sadece sol tık
      if (e.button !== 0) return;
      e.stopPropagation();
      const sc = scrollRef.current;
      stateRef.current = {
        id,
        modu,
        startX: e.clientX,
        startY: e.clientY,
        startScroll: sc ? sc.scrollTop : 0,
        rafId: null,
        lastClientY: e.clientY,
        lastClientX: e.clientX,
        baslangicSutunKey,
        aktif: false,
      };
      // pointer capture: pointer kart dışına çıksa bile event almaya devam et
      try {
        (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
      } catch {
        // ignore
      }
      // resize ise hemen aktif say (zaten kullanıcı handle'a bastı)
      if (modu === "boyutla") {
        stateRef.current.aktif = true;
        document.body.style.userSelect = "none";
        document.body.style.cursor = "ns-resize";
        setDurum({
          id,
          modu,
          dyPx: 0,
          sutunDelta: 0,
          baslangicSutunKey,
          hedefSutunKey: baslangicSutunKey,
          aktif: true,
        });
      }
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
      // eşik kontrolü
      if (!s.aktif) {
        const dx = Math.abs(e.clientX - s.startX);
        const dy = Math.abs(e.clientY - s.startY);
        if (dx < surukleEsigi && dy < surukleEsigi) {
          return; // henüz drag sayılmıyor
        }
        s.aktif = true;
        document.body.style.userSelect = "none";
        document.body.style.cursor = s.modu === "boyutla" ? "ns-resize" : "grabbing";
      }
      // aktifken default'ları engelle (sayfa kaydırma vs.)
      e.preventDefault();
      const h = hesapla(e.clientY, e.clientX);
      if (!h) return;
      setDurum({
        id: s.id,
        modu: s.modu,
        dyPx: h.dyPx,
        sutunDelta: h.sutunDelta,
        baslangicSutunKey: s.baslangicSutunKey,
        hedefSutunKey: h.hedefSutunKey,
        aktif: true,
      });
    },
    [hesapla, surukleEsigi],
  );

  const bitir = React.useCallback(
    (e: React.PointerEvent) => {
      const s = stateRef.current;
      if (!s) return;
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
      } catch {
        // ignore
      }
      if (s.rafId != null) cancelAnimationFrame(s.rafId);
      const h = s.aktif ? hesapla(e.clientY, e.clientX) : null;
      const dakikaDelta = h ? Math.round((h.dyPx / saatPx) * 60) : 0;
      const sutunDelta = h ? h.sutunDelta : 0;
      const hedefSutunKey = h?.hedefSutunKey;
      const surukleGerceklesti = s.aktif;
      stateRef.current = null;
      setDurum(null);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
      if (surukleGerceklesti) {
        // 350ms boyunca click'leri yut
        supressClickUntilRef.current = Date.now() + 350;
      }
      onTasimaBitti({
        id: s.id,
        modu: s.modu,
        dakikaDelta,
        sutunDelta,
        baslangicSutunKey: s.baslangicSutunKey,
        hedefSutunKey,
        surukleGerceklesti,
      });
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

  /** Drag sonrası açılan click'i bastırmak için kullan. */
  const tikiBastir = React.useCallback(() => {
    return Date.now() < supressClickUntilRef.current;
  }, []);

  React.useEffect(() => {
    return () => {
      const s = stateRef.current;
      if (s?.rafId != null) cancelAnimationFrame(s.rafId);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
  }, []);

  return { durum, baslat, tasi, bitir, iptal, tikiBastir };
}
