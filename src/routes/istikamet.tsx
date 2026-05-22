import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import { ArrowRight, CheckCircle2, Target, Users, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useKategoriler, useKisiler } from "@/lib/network-hooks";
import { useBuHaftaOzet } from "@/lib/network/bu-hafta";
import { useFaaliyetOzetleri, durumHesapla } from "@/lib/network/sonraki-faaliyet";

export const Route = createFileRoute("/istikamet")({
  head: () => ({
    meta: [
      { title: "İstikamet — Haftalık özet" },
      { name: "description", content: "Bu hafta tamamlanan ve planlanan faaliyetler, ihmal edilen kardeşler." },
    ],
  }),
  component: IstikametSayfa,
});

function IstikametSayfa() {
  const buHaftaQ = useBuHaftaOzet();
  const kisilerQ = useKisiler();
  const katQ = useKategoriler();
  const ozetQ = useFaaliyetOzetleri();

  const bugun = new Date().toISOString().slice(0, 10);
  const tumEtkinlikler = React.useMemo(() => {
    const a = buHaftaQ.data;
    if (!a) return [];
    return [...a.programlar, ...a.faaliyetler];
  }, [buHaftaQ.data]);

  const toplam = tumEtkinlikler.length;
  const tamamlanan = tumEtkinlikler.filter((x) => x.etkinlik.tarih <= bugun).length;
  const planlanan = toplam - tamamlanan;
  const yuzde = toplam === 0 ? 0 : Math.round((tamamlanan / toplam) * 100);

  // Kategori bazlı ilerleme: kişi kategorisi üzerinden gruplar
  const kategoriler = katQ.data ?? [];
  const kisiler = kisilerQ.data ?? [];
  const kisiKatMap = React.useMemo(() => {
    const m = new Map<string, string[]>();
    for (const k of kisiler) m.set(k.id, k.kategori_ids);
    return m;
  }, [kisiler]);

  const katIlerleme = React.useMemo(() => {
    return kategoriler.map((kat) => {
      let tplam = 0, tmm = 0;
      for (const e of tumEtkinlikler) {
        const kats = kisiKatMap.get(e.kisi.id) ?? [];
        if (!kats.includes(kat.id)) continue;
        tplam++;
        if (e.etkinlik.tarih <= bugun) tmm++;
      }
      return { kat, tplam, tmm };
    }).filter((x) => x.tplam > 0);
  }, [kategoriler, tumEtkinlikler, kisiKatMap, bugun]);

  const ihmalEdilenler = React.useMemo(() => {
    const ozetler = ozetQ.data ?? {};
    return kisiler
      .map((k) => ({ k, ozet: ozetler[k.id], durum: durumHesapla(ozetler[k.id]?.son_tarih ?? null) }))
      .filter((x) => x.durum === "gri")
      .sort((a, b) => {
        const at = a.ozet?.son_tarih ?? "0000-00-00";
        const bt = b.ozet?.son_tarih ?? "0000-00-00";
        return at.localeCompare(bt);
      })
      .slice(0, 12);
  }, [kisiler, ozetQ.data]);

  return (
    <div className="mx-auto flex min-h-svh max-w-4xl flex-col gap-6 px-4 py-6 md:py-10">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">İstikamet</h1>
          <p className="text-sm text-muted-foreground">Bu haftanın özeti</p>
        </div>
        <Link
          to="/network"
          className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-accent"
        >
          Rehberlik <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </header>

      {/* Büyük sayı */}
      <section className="rounded-2xl border border-border bg-card p-6 md:p-8">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
          <CheckCircle2 className="h-3.5 w-3.5" /> Bu hafta
        </div>
        <div className="mt-2 flex items-baseline gap-3">
          <span className="text-5xl font-semibold tabular-nums md:text-6xl">{tamamlanan}</span>
          <span className="text-lg text-muted-foreground">/ {toplam} faaliyet</span>
          <span className="ml-auto text-sm font-medium text-muted-foreground tabular-nums">%{yuzde}</span>
        </div>
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-primary transition-all" style={{ width: `${yuzde}%` }} />
        </div>
        <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
          <span>✓ {tamamlanan} tamamlandı</span>
          <span>○ {planlanan} planlı</span>
        </div>
      </section>

      {/* Kategori ilerleme */}
      <section className="rounded-2xl border border-border bg-card p-5 md:p-6">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-medium">
          <Target className="h-4 w-4 text-muted-foreground" /> Gruplara göre
        </h2>
        {katIlerleme.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Bu hafta hiçbir grupta faaliyet yok.</p>
        ) : (
          <ul className="space-y-3">
            {katIlerleme.map(({ kat, tplam, tmm }) => {
              const p = Math.round((tmm / tplam) * 100);
              return (
                <li key={kat.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
                  <span className="w-20 truncate text-sm font-medium">{kat.ad}</span>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-foreground/70 transition-all" style={{ width: `${p}%` }} />
                  </div>
                  <span className="w-14 text-right text-xs tabular-nums text-muted-foreground">{tmm}/{tplam}</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* İhmal edilenler */}
      <section className="rounded-2xl border border-border bg-card p-5 md:p-6">
        <h2 className="mb-1 flex items-center gap-2 text-sm font-medium">
          <AlertCircle className="h-4 w-4 text-muted-foreground" /> Unutulan kardeşler
        </h2>
        <p className="mb-4 text-xs text-muted-foreground">21+ gündür hiçbir faaliyet yapılmamış.</p>
        {ihmalEdilenler.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
            <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500" /> Harika — herkesle iletişim güncel.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {ihmalEdilenler.map(({ k, ozet }) => (
              <li key={k.id}>
                <Link
                  to="/network/kisi/$id"
                  params={{ id: k.id }}
                  className="flex items-center gap-3 py-2.5 hover:bg-accent/40 rounded-md px-2 -mx-2"
                >
                  <span className="h-2 w-2 shrink-0 rounded-full bg-muted-foreground/40" />
                  <span className="flex-1 truncate text-sm">{k.ad}</span>
                  <span className="text-xs text-muted-foreground">
                    {ozet?.son_tarih
                      ? `son ${format(parseISO(ozet.son_tarih), "d MMM", { locale: tr })}`
                      : "hiç faaliyet yok"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <footer className="pb-6 text-center">
        <Link
          to="/network"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          <Users className="h-4 w-4" /> Rehberlik'e git ve faaliyet planla
        </Link>
      </footer>
    </div>
  );
}