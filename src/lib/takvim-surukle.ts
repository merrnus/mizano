import * as React from "react";

export type SurukleModu = "tasi" | "boyutla";

export type SurukleDurumu = {
  id: string;
  modu: SurukleModu;
  /** y ekseninde snap uygulanmış piksel ofseti (kaynak konuma göre) */
  dyPx: number;
  /** sütun değişimi (haftalık görünümde -n .. +n) */
  sutunDelta: number;
  baslangicSutunKey?: string;
  hedefSutunKey?: string;
  /** Sürükleme eşiği geçildi mi? Geçmediyse henüz drag değil, sadece tık. */
  aktif: boolean;
  /** Pointer'ın o anki client koordinatları (overlay önizleme için) */
  clientX: number;
  clientY: number;
};

type SurukleSecenek = {
  saatPx: number;
  snapDk?: number;
  surukleEsigi?: number;
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
  aktif: boolean;
  pointerId: number;
};

export function useTakvimSurukle({
  saatPx,
  snapDk = 15,
  surukleEsigi = 5,
  edge = 96,
  onTasimaBitti,
  scrollRef,
  sutunlar,
}: SurukleSecenek) {
  const [durum, setDurum] = React.useState<SurukleDurumu | null>(null);
  const stateRef = React.useRef<DahiliDurum | null>(null);
  const supressClickUntilRef = React.useRef<number>(0);
  // optionsları stable callbacklerden okumak için
  const optsRef = React.useRef({ onTasimaBitti, sutunlar, saatPx, snapDk, surukleEsigi, edge });
  optsRef.current = { onTasimaBitti, sutunlar, saatPx, snapDk, surukleEsigi, edge };

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
      const sutunlarCur = optsRef.current.sutunlar;
      let hedefSutunKey: string | undefined = s.baslangicSutunKey;
      if (sutunlarCur && sutunlarCur.length > 0 && s.modu === "tasi") {
        const baslangicIdx = sutunlarCur.findIndex((c) => c.key === s.baslangicSutunKey);
        let icindeIdx = baslangicIdx;
        // pointer'a en yakın sütunu bul
        let bestDist = Infinity;
        for (let i = 0; i < sutunlarCur.length; i++) {
          const r = sutunlarCur[i].getRect();
          if (!r) continue;
          if (clientX >= r.left && clientX <= r.right) {
            icindeIdx = i;
            bestDist = 0;
            break;
          }
          const center = (r.left + r.right) / 2;
          const d = Math.abs(clientX - center);
          if (d < bestDist) {
            bestDist = d;
            icindeIdx = i;
          }
        }
        if (baslangicIdx >= 0 && icindeIdx >= 0) {
          sutunDelta = icindeIdx - baslangicIdx;
          hedefSutunKey = sutunlarCur[icindeIdx].key;
        }
      }
      return { dyPx: snapped, sutunDelta, hedefSutunKey };
    },
    [scrollRef, snapPx],
  );

  const guncelle = React.useCallback(
    (clientX: number, clientY: number) => {
      const s = stateRef.current;
      if (!s) return;
      const h = hesapla(clientY, clientX);
      if (!h) return;
      setDurum({
        id: s.id,
        modu: s.modu,
        dyPx: h.dyPx,
        sutunDelta: h.sutunDelta,
        baslangicSutunKey: s.baslangicSutunKey,
        hedefSutunKey: h.hedefSutunKey,
        aktif: s.aktif,
        clientX,
        clientY,
      });
    },
    [hesapla],
  );

  const autoScrollTick = React.useCallback(() => {
    const s = stateRef.current;
    const sc = scrollRef.current;
    if (!s || !sc) return;
    if (s.aktif) {
      const rect = sc.getBoundingClientRect();
      const y = s.lastClientY;
      const eg = optsRef.current.edge;
      let dz = 0;
      // Pointer kenar bölgesinde veya container dışında ise otomatik kaydır.
      // Dışarı taştıkça hız artar; kenarda sabit dursa bile sürekli kayar.
      if (y < rect.top + eg) {
        const mesafe = rect.top + eg - y; // 0..(eg+∞)
        dz = -Math.max(4, Math.min(40, mesafe / 3));
      } else if (y > rect.bottom - eg) {
        const mesafe = y - (rect.bottom - eg);
        dz = Math.max(4, Math.min(40, mesafe / 3));
      }
      if (dz !== 0) {
        const before = sc.scrollTop;
        sc.scrollTop += dz;
        if (sc.scrollTop !== before) {
          guncelle(s.lastClientX, s.lastClientY);
        }
      }
    }
    s.rafId = requestAnimationFrame(autoScrollTick);
  }, [guncelle, scrollRef]);

  // Window listeners — yalnızca aktif sürükleme sırasında bağlanır
  React.useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const s = stateRef.current;
      if (!s) return;
      if (s.pointerId !== e.pointerId) return;
      s.lastClientX = e.clientX;
      s.lastClientY = e.clientY;
      if (!s.aktif) {
        const dx = Math.abs(e.clientX - s.startX);
        const dy = Math.abs(e.clientY - s.startY);
        if (dx < optsRef.current.surukleEsigi && dy < optsRef.current.surukleEsigi) return;
        s.aktif = true;
        document.body.style.userSelect = "none";
        document.body.style.cursor = s.modu === "boyutla" ? "ns-resize" : "grabbing";
        // Sayfanın kendi kendine kaymasını engelle (mobil + masaüstü)
        document.documentElement.style.overflow = "hidden";
        document.documentElement.style.touchAction = "none";
        document.body.style.overflow = "hidden";
        document.body.style.touchAction = "none";
      }
      e.preventDefault();
      guncelle(e.clientX, e.clientY);
    };
    const onUp = (e: PointerEvent) => {
      const s = stateRef.current;
      if (!s) return;
      if (s.pointerId !== e.pointerId) return;
      if (s.rafId != null) cancelAnimationFrame(s.rafId);
      const h = s.aktif ? hesapla(e.clientY, e.clientX) : null;
      const dakikaDelta = h ? Math.round((h.dyPx / optsRef.current.saatPx) * 60) : 0;
      const sutunDelta = h ? h.sutunDelta : 0;
      const hedefSutunKey = h?.hedefSutunKey;
      const surukleGerceklesti = s.aktif;
      stateRef.current = null;
      setDurum(null);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
      document.documentElement.style.overflow = "";
      document.documentElement.style.touchAction = "";
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
      if (surukleGerceklesti) {
        supressClickUntilRef.current = Date.now() + 400;
      }
      optsRef.current.onTasimaBitti({
        id: s.id,
        modu: s.modu,
        dakikaDelta,
        sutunDelta,
        baslangicSutunKey: s.baslangicSutunKey,
        hedefSutunKey,
        surukleGerceklesti,
      });
    };
    const onCancel = (e: PointerEvent) => {
      const s = stateRef.current;
      if (!s) return;
      if (s.pointerId !== e.pointerId) return;
      if (s.rafId != null) cancelAnimationFrame(s.rafId);
      stateRef.current = null;
      setDurum(null);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
      document.documentElement.style.overflow = "";
      document.documentElement.style.touchAction = "";
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    };
    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
    };
  }, [guncelle, hesapla]);

  const baslat = React.useCallback(
    (
      e: React.PointerEvent,
      id: string,
      modu: SurukleModu,
      baslangicSutunKey?: string,
    ) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      const sc = scrollRef.current;
      // Pointerdown anında touch scroll'u kilitle — kullanıcı kart üzerinde
      // parmağını hareket ettirmeye başladığı an sayfa kaymasın
      document.documentElement.style.touchAction = "none";
      document.body.style.touchAction = "none";
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
        pointerId: e.pointerId,
      };
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
          clientX: e.clientX,
          clientY: e.clientY,
        });
      }
      stateRef.current.rafId = requestAnimationFrame(autoScrollTick);
    },
    [autoScrollTick, scrollRef],
  );

  // Geriye dönük uyumluluk için no-op tasi/bitir/iptal: artık window dinliyor
  const noop = React.useCallback(() => {}, []);

  const tikiBastir = React.useCallback(() => {
    return Date.now() < supressClickUntilRef.current;
  }, []);

  React.useEffect(() => {
    return () => {
      const s = stateRef.current;
      if (s?.rafId != null) cancelAnimationFrame(s.rafId);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
      document.documentElement.style.overflow = "";
      document.documentElement.style.touchAction = "";
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    };
  }, []);

  return { durum, baslat, tasi: noop, bitir: noop, iptal: noop, tikiBastir };
}
