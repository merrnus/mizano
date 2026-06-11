import * as React from "react";

/**
 * Tek bir tick kaynağı — dakikada bir güncellenen `now`.
 * Faz #6 — birden çok sayfada setInterval(60_000) yerine ortak hook.
 */
export function useNow(intervalMs = 60_000): Date {
  const [now, setNow] = React.useState(() => new Date());
  React.useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

/**
 * Saat/dakika yerine sadece gün değiştiğinde yeni referans veren
 * "bugün başı" (00:00) Date.
 */
export function useBugunBasi(now: Date): Date {
  return React.useMemo(() => {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [now.getFullYear(), now.getMonth(), now.getDate()]);
}