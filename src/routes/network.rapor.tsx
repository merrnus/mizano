import * as React from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Download, FileText, Activity, Sparkles, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useKategoriler,
  useKisiler,
  useRaporFaaliyetler,
  useRaporGundemler,
  useRaporManeviyat,
  type RaporFiltre,
} from "@/lib/network-hooks";
import { ETKINLIK_TIP_MAP } from "@/lib/network-tipleri";
import { raporPdfUret } from "@/lib/network-rapor-pdf";
import { format, parseISO, startOfMonth, startOfWeek, subDays, subMonths } from "date-fns";
import { tr } from "date-fns/locale";
import { toast } from "sonner";

type Kapsam = "gundem" | "faaliyet" | "maneviyat";

type Search = {
  from: string;
  to: string;
  kisiId?: string;
  kategoriIds: string[];
  kapsam: Kapsam[];
  sonucDurumu: "tumu" | "dolu" | "bos";
  gundemDurumu: "tumu" | "bekliyor" | "yapildi";
};

function bugun(): string {
  return format(new Date(), "yyyy-MM-dd");
}
function gunlerOnce(g: number): string {
  return format(subDays(new Date(), g), "yyyy-MM-dd");
}

export const Route = createFileRoute("/network/rapor")({
  head: () => ({
    meta: [
      { title: "Rapor — Rehberlik" },
      { name: "description", content: "Gündem ve faaliyet raporu, PDF dışa aktarımı." },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): Search => {
    const arr = (v: unknown): string[] =>
      Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
    const kapsamRaw = arr(s.kapsam) as Kapsam[];
    const kapsam: Kapsam[] = (
      kapsamRaw.length
        ? kapsamRaw.filter((k) => k === "gundem" || k === "faaliyet" || k === "maneviyat")
        : ["gundem", "faaliyet"]
    ) as Kapsam[];
    const sonucDurumu =
      s.sonucDurumu === "dolu" || s.sonucDurumu === "bos" ? s.sonucDurumu : "tumu";
    const gundemDurumu =
      s.gundemDurumu === "bekliyor" || s.gundemDurumu === "yapildi"
        ? s.gundemDurumu
        : "tumu";
    return {
      from: typeof s.from === "string" ? s.from : gunlerOnce(30),
      to: typeof s.to === "string" ? s.to : bugun(),
      kisiId: typeof s.kisiId === "string" && s.kisiId ? s.kisiId : undefined,
      kategoriIds: arr(s.kategoriIds),
      kapsam,
      sonucDurumu,
      gundemDurumu,
    };
  },
  component: RaporPage,
});

function RaporPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();

  const filtre: RaporFiltre = {
    from: search.from,
    to: search.to,
    kisiId: search.kisiId,
    kategoriIds: search.kategoriIds.length ? search.kategoriIds : undefined,
    sonucDurumu: search.sonucDurumu,
    gundemDurumu: search.gundemDurumu,
  };

  const setSearch = (patch: Partial<Search>) =>
    navigate({
      to: "/network/rapor",
      search: (prev: Search) => ({ ...prev, ...patch }),
      replace: true,
    });

  const { data: kisiler = [] } = useKisiler();
  const { data: kategoriler = [] } = useKategoriler();

  const aktifGundem = search.kapsam.includes("gundem");
  const aktifFaaliyet = search.kapsam.includes("faaliyet");
  const aktifManeviyat = search.kapsam.includes("maneviyat");

  const gundemQ = useRaporGundemler(filtre, aktifGundem);
  const faaliyetQ = useRaporFaaliyetler(filtre, aktifFaaliyet);
  const maneviyatQ = useRaporManeviyat(filtre, aktifManeviyat);

  const kisi = kisiler.find((k) => k.id === search.kisiId);
  const seciliKategoriler = kategoriler.filter((k) =>
    search.kategoriIds.includes(k.id),
  );

  const yukleniyor =
    (aktifGundem && gundemQ.isLoading) ||
    (aktifFaaliyet && faaliyetQ.isLoading) ||
    (aktifManeviyat && maneviyatQ.isLoading);

  const hizli = (etiket: string, from: string, to: string) => (
    <Button
      key={etiket}
      size="sm"
      variant={search.from === from && search.to === to ? "default" : "outline"}
      onClick={() => setSearch({ from, to })}
    >
      {etiket}
    </Button>
  );

  const pdfIndir = () => {
    try {
      raporPdfUret({
        filtre,
        kisiAd: kisi?.ad ?? null,
        kategoriAdlar: seciliKategoriler.map((k) => k.ad),
        gundemler: aktifGundem ? gundemQ.data ?? [] : undefined,
        faaliyetler: aktifFaaliyet ? faaliyetQ.data ?? [] : undefined,
        maneviyat: aktifManeviyat ? maneviyatQ.data ?? [] : undefined,
      });
      toast.success("PDF indirildi");
    } catch (e) {
      console.error(e);
      toast.error("PDF üretilemedi");
    }
  };

  /* ---- ÖZET ---- */
  const gundemler = gundemQ.data ?? [];
  const faaliyetler = faaliyetQ.data ?? [];
  const maneviyat = maneviyatQ.data ?? [];
  const gTamam = gundemler.filter((g) => g.durum === "yapildi").length;
  const gSonuclu = gundemler.filter((g) => (g.karar ?? "").trim().length > 0).length;
  const fSonuclu = faaliyetler.filter((f) => (f.sonuc ?? "").trim().length > 0).length;
  const enAktif = (() => {
    if (!faaliyetler.length) return null;
    const sayim = new Map<string, { ad: string; n: number }>();
    for (const f of faaliyetler) {
      const cur = sayim.get(f.kisi_id) ?? { ad: f.kisi_ad, n: 0 };
      cur.n += 1;
      sayim.set(f.kisi_id, cur);
    }
    let m: { ad: string; n: number } | null = null;
    for (const v of sayim.values()) if (!m || v.n > m.n) m = v;
    return m;
  })();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <Button
        asChild
        variant="ghost"
        size="sm"
        className="mb-4 -ml-2 h-8 text-muted-foreground hover:text-foreground"
      >
        <Link to="/network" search={{ tab: "gundemler" }}>
          <ArrowLeft className="h-3.5 w-3.5" /> Rehberliğe dön
        </Link>
      </Button>

      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Rehberlik
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            Rapor
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {format(parseISO(search.from), "d MMM", { locale: tr })} —{" "}
            {format(parseISO(search.to), "d MMM yyyy", { locale: tr })}
          </p>
        </div>
        <Button onClick={pdfIndir} disabled={yukleniyor}>
          <Download className="h-4 w-4" /> PDF indir
        </Button>
      </header>

      {/* FİLTRELER */}
      <section className="mb-6 rounded-2xl border border-border bg-card p-4">
        <div className="grid gap-4 md:grid-cols-2">
          {/* Tarih */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">
              Tarih aralığı
            </label>
            <div className="flex flex-wrap gap-1.5">
              {hizli("Bu hafta", format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd"), bugun())}
              {hizli("Bu ay", format(startOfMonth(new Date()), "yyyy-MM-dd"), bugun())}
              {hizli("Son 30 gün", gunlerOnce(30), bugun())}
              {hizli("Son 3 ay", format(subMonths(new Date(), 3), "yyyy-MM-dd"), bugun())}
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={search.from}
                onChange={(e) => setSearch({ from: e.target.value })}
                className="h-9"
              />
              <span className="text-muted-foreground">—</span>
              <Input
                type="date"
                value={search.to}
                onChange={(e) => setSearch({ to: e.target.value })}
                className="h-9"
              />
            </div>
          </div>

          {/* Kişi + sonuç */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Kişi</label>
            <Select
              value={search.kisiId ?? "__all__"}
              onValueChange={(v) =>
                setSearch({ kisiId: v === "__all__" ? undefined : v })
              }
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Tüm kişiler" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Tüm kişiler</SelectItem>
                {kisiler.map((k) => (
                  <SelectItem key={k.id} value={k.id}>
                    {k.ad}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <label className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Sonuç doluluğu
                </label>
                <ToggleGroup
                  type="single"
                  size="sm"
                  value={search.sonucDurumu}
                  onValueChange={(v) =>
                    v && setSearch({ sonucDurumu: v as Search["sonucDurumu"] })
                  }
                  className="mt-1 justify-start"
                >
                  <ToggleGroupItem value="tumu" className="text-xs">Tümü</ToggleGroupItem>
                  <ToggleGroupItem value="dolu" className="text-xs">Dolu</ToggleGroupItem>
                  <ToggleGroupItem value="bos" className="text-xs">Boş</ToggleGroupItem>
                </ToggleGroup>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Gündem durumu
                </label>
                <ToggleGroup
                  type="single"
                  size="sm"
                  value={search.gundemDurumu}
                  onValueChange={(v) =>
                    v && setSearch({ gundemDurumu: v as Search["gundemDurumu"] })
                  }
                  className="mt-1 justify-start"
                >
                  <ToggleGroupItem value="tumu" className="text-xs">Tümü</ToggleGroupItem>
                  <ToggleGroupItem value="bekliyor" className="text-xs">Bekliyor</ToggleGroupItem>
                  <ToggleGroupItem value="yapildi" className="text-xs">Yapıldı</ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>
          </div>
        </div>

        {/* Kategoriler */}
        {kategoriler.length > 0 && (
          <div className="mt-4 space-y-2">
            <label className="text-xs font-medium text-muted-foreground">
              Kategori
            </label>
            <div className="flex flex-wrap gap-1.5">
              {kategoriler.map((k) => {
                const aktif = search.kategoriIds.includes(k.id);
                return (
                  <button
                    key={k.id}
                    onClick={() => {
                      const next = aktif
                        ? search.kategoriIds.filter((id: string) => id !== k.id)
                        : [...search.kategoriIds, k.id];
                      setSearch({ kategoriIds: next });
                    }}
                    className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                      aktif
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {k.ad}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Kapsam */}
        <div className="mt-4 space-y-2">
          <label className="text-xs font-medium text-muted-foreground">
            Rapor kapsamı
          </label>
          <ToggleGroup
            type="multiple"
            value={search.kapsam}
            onValueChange={(v) => {
              const arr = (v as Kapsam[]).filter(
                (x) => x === "gundem" || x === "faaliyet" || x === "maneviyat",
              );
              setSearch({ kapsam: arr.length ? arr : ["gundem"] });
            }}
            className="justify-start"
          >
            <ToggleGroupItem value="gundem">
              <FileText className="h-3.5 w-3.5" /> Gündemler
            </ToggleGroupItem>
            <ToggleGroupItem value="faaliyet">
              <Activity className="h-3.5 w-3.5" /> Faaliyetler
            </ToggleGroupItem>
            <ToggleGroupItem value="maneviyat">
              <Sparkles className="h-3.5 w-3.5" /> Maneviyat
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </section>

      {/* ÖZET KARTLAR */}
      <section className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {aktifGundem && (
          <OzetKart
            baslik="Gündemler"
            ana={`${gundemler.length}`}
            altSatirlar={[
              `${gTamam} tamamlandı`,
              `${gSonuclu} sonuç yazılı (${gundemler.length ? Math.round((gSonuclu / gundemler.length) * 100) : 0}%)`,
            ]}
            yukleniyor={gundemQ.isLoading}
          />
        )}
        {aktifFaaliyet && (
          <OzetKart
            baslik="Faaliyetler"
            ana={`${faaliyetler.length}`}
            altSatirlar={[
              `${fSonuclu} sonuç yazılı (${faaliyetler.length ? Math.round((fSonuclu / faaliyetler.length) * 100) : 0}%)`,
              enAktif ? `En aktif: ${enAktif.ad} (${enAktif.n})` : "—",
            ]}
            yukleniyor={faaliyetQ.isLoading}
          />
        )}
        {aktifManeviyat && (
          <OzetKart
            baslik="Maneviyat"
            ana={`${maneviyat.length} kişi`}
            altSatirlar={[
              `Müfredat ortalaması ${
                maneviyat.length
                  ? Math.round(
                      maneviyat.reduce((a, b) => a + b.mufredat_ilerleme_yuzde, 0) /
                        maneviyat.length,
                    )
                  : 0
              }%`,
              `Evrad doluluk ${
                maneviyat.length
                  ? Math.round(
                      maneviyat.reduce((a, b) => a + b.evrad_doluluk_yuzde, 0) /
                        maneviyat.length,
                    )
                  : 0
              }%`,
            ]}
            yukleniyor={maneviyatQ.isLoading}
          />
        )}
      </section>

      {/* GÜNDEMLER */}
      {aktifGundem && (
        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold tracking-tight">
            Gündemler ve Kararlar
          </h2>
          {gundemQ.isLoading ? (
            <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
              Yükleniyor…
            </div>
          ) : gundemler.length === 0 ? (
            <BosKutu mesaj="Bu kriterlerle gündem bulunamadı." />
          ) : (
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[90px]">Tarih</TableHead>
                    <TableHead>İstişare</TableHead>
                    <TableHead>Gündem</TableHead>
                    <TableHead>Karar</TableHead>
                    <TableHead className="w-[140px]">Sorumlu</TableHead>
                    <TableHead className="w-[90px]">Durum</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {gundemler.map((g) => (
                    <TableRow key={g.id}>
                      <TableCell className="text-xs text-muted-foreground">
                        {format(parseISO(g.istisare_tarih), "d MMM", { locale: tr })}
                      </TableCell>
                      <TableCell className="text-xs">{g.istisare_baslik}</TableCell>
                      <TableCell className="max-w-[280px] text-sm">{g.icerik}</TableCell>
                      <TableCell className="max-w-[280px] text-sm">
                        {g.karar?.trim() ? (
                          g.karar
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-destructive">
                            <AlertCircle className="h-3 w-3" /> Sonuç eksik
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        {g.sorumlu_adlar.join(", ") || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={g.durum === "yapildi" ? "default" : "outline"}
                          className="text-[10px]"
                        >
                          {g.durum}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </section>
      )}

      {/* FAALİYETLER */}
      {aktifFaaliyet && (
        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold tracking-tight">
            Kardeş Faaliyetleri
          </h2>
          {faaliyetQ.isLoading ? (
            <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
              Yükleniyor…
            </div>
          ) : faaliyetler.length === 0 ? (
            <BosKutu mesaj="Bu kriterlerle faaliyet bulunamadı." />
          ) : (
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[90px]">Tarih</TableHead>
                    <TableHead className="w-[140px]">Kişi</TableHead>
                    <TableHead className="w-[110px]">Tip</TableHead>
                    <TableHead>Başlık</TableHead>
                    <TableHead>Sonuç</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {faaliyetler.map((f) => (
                    <TableRow key={f.id}>
                      <TableCell className="text-xs text-muted-foreground">
                        {format(parseISO(f.tarih), "d MMM", { locale: tr })}
                      </TableCell>
                      <TableCell className="text-sm">{f.kisi_ad}</TableCell>
                      <TableCell className="text-xs">
                        {ETKINLIK_TIP_MAP[f.tip]?.ad ?? f.tip}
                      </TableCell>
                      <TableCell className="max-w-[260px] text-sm">{f.baslik}</TableCell>
                      <TableCell className="max-w-[320px] text-sm">
                        {f.sonuc?.trim() ? (
                          f.sonuc
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-destructive">
                            <AlertCircle className="h-3 w-3" /> Sonuç eksik
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </section>
      )}

      {/* MANEVİYAT */}
      {aktifManeviyat && (
        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold tracking-tight">Maneviyat</h2>
          {maneviyatQ.isLoading ? (
            <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
              Yükleniyor…
            </div>
          ) : maneviyat.length === 0 ? (
            <BosKutu mesaj="Bu kriterlerle maneviyat verisi bulunamadı." />
          ) : (
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kişi</TableHead>
                    <TableHead className="w-[120px]">Aktif müfredat</TableHead>
                    <TableHead className="w-[140px]">Müfredat ilerleme</TableHead>
                    <TableHead className="w-[120px]">Evrad madde</TableHead>
                    <TableHead className="w-[120px]">Tik sayısı</TableHead>
                    <TableHead className="w-[140px]">Doluluk</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {maneviyat.map((m) => (
                    <TableRow key={m.kisi_id}>
                      <TableCell className="text-sm">{m.kisi_ad}</TableCell>
                      <TableCell className="text-sm">{m.aktif_mufredat_sayisi}</TableCell>
                      <TableCell>
                        <Yuzde deger={m.mufredat_ilerleme_yuzde} />
                      </TableCell>
                      <TableCell className="text-sm">{m.evrad_madde_sayisi}</TableCell>
                      <TableCell className="text-sm">{m.evrad_kayit_sayisi}</TableCell>
                      <TableCell>
                        <Yuzde deger={m.evrad_doluluk_yuzde} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function OzetKart({
  baslik,
  ana,
  altSatirlar,
  yukleniyor,
}: {
  baslik: string;
  ana: string;
  altSatirlar: string[];
  yukleniyor?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
        {baslik}
      </p>
      <p className="mt-1 text-2xl font-semibold tracking-tight">
        {yukleniyor ? "…" : ana}
      </p>
      <ul className="mt-2 space-y-0.5 text-xs text-muted-foreground">
        {altSatirlar.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ul>
    </div>
  );
}

function BosKutu({ mesaj }: { mesaj: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground">
      {mesaj}
    </div>
  );
}

function Yuzde({ deger }: { deger: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-primary"
          style={{ width: `${Math.min(100, Math.max(0, deger))}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground">{deger}%</span>
    </div>
  );
}