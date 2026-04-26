import * as React from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Download,
  FileText,
  Activity,
  Sparkles,
  AlertCircle,
  Calendar as CalendarIcon,
  Folder,
  SlidersHorizontal,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  useKategoriler,
  useKisiler,
  useRaporFaaliyetler,
  useRaporGundemler,
  useRaporManeviyat,
  type RaporFiltre,
  type RaporFaaliyetSatir,
  type RaporGundemSatir,
  type RaporManeviyatKisi,
} from "@/lib/network-hooks";
import type { Kategori, KisiDetay } from "@/lib/network-tipleri";
import { ETKINLIK_TIP_MAP } from "@/lib/network-tipleri";
import { raporPdfUret } from "@/lib/network-rapor-pdf";
import {
  format,
  parseISO,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
} from "date-fns";
import { tr } from "date-fns/locale";
import { toast } from "sonner";

type Kapsam = "gundem" | "faaliyet" | "maneviyat";

type Search = {
  from: string;
  to: string;
  kategoriIds: string[];
  kapsam: Kapsam[];
  sonucDurumu: "tumu" | "dolu" | "bos";
  gundemDurumu: "tumu" | "bekliyor" | "yapildi";
  bosGoster: boolean;
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
      {
        name: "description",
        content: "Kategori bazlı rehberlik raporu, PDF dışa aktarımı.",
      },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): Search => {
    const arr = (v: unknown): string[] =>
      Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
    const kapsamRaw = arr(s.kapsam) as Kapsam[];
    const kapsam: Kapsam[] = (
      kapsamRaw.length
        ? kapsamRaw.filter(
            (k) => k === "gundem" || k === "faaliyet" || k === "maneviyat",
          )
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
      kategoriIds: arr(s.kategoriIds),
      kapsam,
      sonucDurumu,
      gundemDurumu,
      bosGoster: s.bosGoster === true,
    };
  },
  component: RaporPage,
});

/* ============== Gruplama ============== */

type KisiBlok = {
  kisi_id: string;
  kisi_ad: string;
  gundemler: RaporGundemSatir[];
  faaliyetler: RaporFaaliyetSatir[];
  maneviyat: RaporManeviyatKisi | null;
};

type KategoriBlok = {
  kategori: { id: string; ad: string; renk: string | null } | null; // null = "Kategorisiz"
  kisiler: KisiBlok[];
};

function gruplandir(
  kisiler: KisiDetay[],
  kategoriler: Kategori[],
  seciliKategoriIds: string[],
  gundemler: RaporGundemSatir[],
  faaliyetler: RaporFaaliyetSatir[],
  maneviyat: RaporManeviyatKisi[],
): KategoriBlok[] {
  const aktifKategoriler = seciliKategoriIds.length
    ? kategoriler.filter((k) => seciliKategoriIds.includes(k.id))
    : kategoriler;

  const adMap = new Map<string, string>();
  kisiler.forEach((k) => adMap.set(k.id, k.ad));
  const maneviyatMap = new Map<string, RaporManeviyatKisi>();
  maneviyat.forEach((m) => maneviyatMap.set(m.kisi_id, m));

  // Bir kişi için gündem/faaliyet topla
  const kisiBloku = (kid: string): KisiBlok => ({
    kisi_id: kid,
    kisi_ad: adMap.get(kid) ?? "—",
    gundemler: gundemler.filter((g) => g.sorumlu_ids.includes(kid)),
    faaliyetler: faaliyetler.filter((f) => f.kisi_id === kid),
    maneviyat: maneviyatMap.get(kid) ?? null,
  });

  const sonuc: KategoriBlok[] = aktifKategoriler.map((kat) => {
    const katKisileri = kisiler.filter((k) => k.kategori_ids.includes(kat.id));
    return {
      kategori: { id: kat.id, ad: kat.ad, renk: kat.renk ?? null },
      kisiler: katKisileri
        .map((k) => kisiBloku(k.id))
        .sort((a, b) => a.kisi_ad.localeCompare(b.kisi_ad, "tr")),
    };
  });

  // Kategorisiz: hiçbir aktif kategoride olmayan ama gündem/faaliyet kaydı olan kişiler.
  // Sadece kullanıcı kategori filtresi YAPMAMIŞSA göster (filtre varsa zaten ilgisiz).
  if (seciliKategoriIds.length === 0) {
    const kategoride = new Set<string>();
    kisiler.forEach((k) => {
      if (k.kategori_ids.length > 0) kategoride.add(k.id);
    });
    const kategorisiz = kisiler
      .filter((k) => !kategoride.has(k.id))
      .map((k) => kisiBloku(k.id))
      .filter((b) => b.gundemler.length || b.faaliyetler.length || b.maneviyat);
    if (kategorisiz.length > 0) {
      sonuc.push({ kategori: null, kisiler: kategorisiz });
    }
  }

  return sonuc;
}

/* ============== Sayfa ============== */

function RaporPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();

  const filtre: RaporFiltre = {
    from: search.from,
    to: search.to,
    kategoriIds: search.kategoriIds.length ? search.kategoriIds : undefined,
    sonucDurumu: search.sonucDurumu,
    gundemDurumu: search.gundemDurumu,
  };

  const setSearch = (patch: Partial<Search>) =>
    navigate({
      to: "/network/rapor",
      search: (prev) => ({ ...(prev as Search), ...patch }),
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

  const seciliKategoriler = kategoriler.filter((k) =>
    search.kategoriIds.includes(k.id),
  );

  const yukleniyor =
    (aktifGundem && gundemQ.isLoading) ||
    (aktifFaaliyet && faaliyetQ.isLoading) ||
    (aktifManeviyat && maneviyatQ.isLoading);

  const gundemler = gundemQ.data ?? [];
  const faaliyetler = faaliyetQ.data ?? [];
  const maneviyat = maneviyatQ.data ?? [];

  const gruplar = React.useMemo(
    () =>
      gruplandir(
        kisiler,
        kategoriler,
        search.kategoriIds,
        gundemler,
        faaliyetler,
        maneviyat,
      ),
    [kisiler, kategoriler, search.kategoriIds, gundemler, faaliyetler, maneviyat],
  );

  const goruntulenecekGruplar = search.bosGoster
    ? gruplar
    : gruplar.filter((g) =>
        g.kisiler.some(
          (k) =>
            (aktifGundem && k.gundemler.length) ||
            (aktifFaaliyet && k.faaliyetler.length) ||
            (aktifManeviyat && k.maneviyat),
        ),
      );

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
        kategoriAdlar: seciliKategoriler.map((k) => k.ad),
        gruplar: goruntulenecekGruplar,
        kapsam: { gundem: aktifGundem, faaliyet: aktifFaaliyet, maneviyat: aktifManeviyat },
      });
      toast.success("PDF indirildi");
    } catch (e) {
      console.error(e);
      toast.error("PDF üretilemedi");
    }
  };

  /* ÖZET KARTLARI */
  const gTamam = gundemler.filter((g) => g.durum === "yapildi").length;
  const gSonuclu = gundemler.filter((g) => (g.karar ?? "").trim().length > 0).length;
  const fSonuclu = faaliyetler.filter((f) => (f.sonuc ?? "").trim().length > 0).length;

  /* Filtre çubuğu özet metinleri */
  const tarihEtiket = (() => {
    const bh = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
    const ba = format(startOfMonth(new Date()), "yyyy-MM-dd");
    if (search.from === bh && search.to === bugun()) return "Bu hafta";
    if (search.from === ba && search.to === bugun()) return "Bu ay";
    if (search.from === gunlerOnce(30) && search.to === bugun()) return "Son 30 gün";
    if (
      search.from === format(subMonths(new Date(), 3), "yyyy-MM-dd") &&
      search.to === bugun()
    )
      return "Son 3 ay";
    return `${format(parseISO(search.from), "d MMM", { locale: tr })} – ${format(parseISO(search.to), "d MMM", { locale: tr })}`;
  })();
  const kategoriEtiket = seciliKategoriler.length
    ? seciliKategoriler.length === 1
      ? seciliKategoriler[0].ad
      : `${seciliKategoriler.length} kategori`
    : "Tüm kategoriler";
  const ekFiltreAktif =
    search.sonucDurumu !== "tumu" ||
    search.gundemDurumu !== "tumu" ||
    search.bosGoster;

  const toplamKayit =
    (aktifGundem ? gundemler.length : 0) +
    (aktifFaaliyet ? faaliyetler.length : 0);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
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

      {/* BAŞLIK */}
      <header className="mb-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Rehberlik
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            Rapor
          </h1>
        </div>
        <Button onClick={pdfIndir} disabled={yukleniyor} size="sm">
          <Download className="h-4 w-4" /> PDF
        </Button>
      </header>

      {/* TEK SATIR FİLTRE ÇUBUĞU */}
      <div className="sticky top-0 z-10 -mx-4 mb-3 border-b border-border bg-background/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Tarih popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1.5">
                <CalendarIcon className="h-3.5 w-3.5" />
                <span className="text-xs">{tarihEtiket}</span>
                <ChevronDown className="h-3 w-3 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-72 space-y-3">
              <div className="grid grid-cols-2 gap-1.5">
                {hizli(
                  "Bu hafta",
                  format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd"),
                  bugun(),
                )}
                {hizli("Bu ay", format(startOfMonth(new Date()), "yyyy-MM-dd"), bugun())}
                {hizli("Son 30 gün", gunlerOnce(30), bugun())}
                {hizli(
                  "Son 3 ay",
                  format(subMonths(new Date(), 3), "yyyy-MM-dd"),
                  bugun(),
                )}
              </div>
              <div className="space-y-1.5">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Özel aralık
                </p>
                <div className="flex items-center gap-1.5">
                  <Input
                    type="date"
                    value={search.from}
                    onChange={(e) => setSearch({ from: e.target.value })}
                    className="h-8 text-xs"
                  />
                  <span className="text-muted-foreground">—</span>
                  <Input
                    type="date"
                    value={search.to}
                    onChange={(e) => setSearch({ to: e.target.value })}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Kategori popover */}
          {kategoriler.length > 0 && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1.5">
                  <Folder className="h-3.5 w-3.5" />
                  <span className="text-xs">{kategoriEtiket}</span>
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-72">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    Kategoriler
                  </p>
                  {search.kategoriIds.length > 0 && (
                    <button
                      onClick={() => setSearch({ kategoriIds: [] })}
                      className="text-[10px] text-muted-foreground hover:text-foreground"
                    >
                      Temizle
                    </button>
                  )}
                </div>
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
                        className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
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
              </PopoverContent>
            </Popover>
          )}

          {/* Kapsam segmenti */}
          <ToggleGroup
            type="multiple"
            size="sm"
            value={search.kapsam}
            onValueChange={(v) => {
              const arr = (v as Kapsam[]).filter(
                (x) => x === "gundem" || x === "faaliyet" || x === "maneviyat",
              );
              setSearch({ kapsam: arr.length ? arr : ["gundem"] });
            }}
            className="h-8"
          >
            <ToggleGroupItem value="gundem" className="h-8 px-2 text-xs">
              <FileText className="h-3.5 w-3.5" /> Gündem
            </ToggleGroupItem>
            <ToggleGroupItem value="faaliyet" className="h-8 px-2 text-xs">
              <Activity className="h-3.5 w-3.5" /> Faaliyet
            </ToggleGroupItem>
            <ToggleGroupItem value="maneviyat" className="h-8 px-2 text-xs">
              <Sparkles className="h-3.5 w-3.5" /> Maneviyat
            </ToggleGroupItem>
          </ToggleGroup>

          {/* Daha fazla filtre */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1.5">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                {ekFiltreAktif && (
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64 space-y-3">
              <div>
                <p className="mb-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                  Sonuç doluluğu
                </p>
                <ToggleGroup
                  type="single"
                  size="sm"
                  value={search.sonucDurumu}
                  onValueChange={(v) =>
                    v && setSearch({ sonucDurumu: v as Search["sonucDurumu"] })
                  }
                  className="justify-start"
                >
                  <ToggleGroupItem value="tumu" className="text-xs">
                    Tümü
                  </ToggleGroupItem>
                  <ToggleGroupItem value="dolu" className="text-xs">
                    Dolu
                  </ToggleGroupItem>
                  <ToggleGroupItem value="bos" className="text-xs">
                    Boş
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
              <div>
                <p className="mb-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                  Gündem durumu
                </p>
                <ToggleGroup
                  type="single"
                  size="sm"
                  value={search.gundemDurumu}
                  onValueChange={(v) =>
                    v && setSearch({ gundemDurumu: v as Search["gundemDurumu"] })
                  }
                  className="justify-start"
                >
                  <ToggleGroupItem value="tumu" className="text-xs">
                    Tümü
                  </ToggleGroupItem>
                  <ToggleGroupItem value="bekliyor" className="text-xs">
                    Bekliyor
                  </ToggleGroupItem>
                  <ToggleGroupItem value="yapildi" className="text-xs">
                    Yapıldı
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
              <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={search.bosGoster}
                  onChange={(e) => setSearch({ bosGoster: e.target.checked })}
                  className="h-3.5 w-3.5 rounded border-border"
                />
                Boş kategorileri göster
              </label>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* TEK SATIR ÖZET */}
      <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>
          <strong className="text-foreground">{toplamKayit}</strong> kayıt ·{" "}
          <strong className="text-foreground">{goruntulenecekGruplar.length}</strong>{" "}
          kategori
        </span>
        {aktifGundem && (
          <span className="flex items-center gap-1">
            <FileText className="h-3 w-3" />
            <strong className="text-foreground">{gundemler.length}</strong> gündem
            {gundemler.length > 0 && (
              <span className="text-muted-foreground/80">
                ({gTamam} yapıldı, %
                {Math.round((gSonuclu / gundemler.length) * 100)} sonuçlu)
              </span>
            )}
          </span>
        )}
        {aktifFaaliyet && (
          <span className="flex items-center gap-1">
            <Activity className="h-3 w-3" />
            <strong className="text-foreground">{faaliyetler.length}</strong> faaliyet
            {faaliyetler.length > 0 && (
              <span className="text-muted-foreground/80">
                (%{Math.round((fSonuclu / faaliyetler.length) * 100)} sonuçlu)
              </span>
            )}
          </span>
        )}
        {aktifManeviyat && maneviyat.length > 0 && (
          <span className="flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            müfredat %
            {Math.round(
              maneviyat.reduce((a, b) => a + b.mufredat_ilerleme_yuzde, 0) /
                maneviyat.length,
            )}{" "}
            · evrad %
            {Math.round(
              maneviyat.reduce((a, b) => a + b.evrad_doluluk_yuzde, 0) /
                maneviyat.length,
            )}
          </span>
        )}
      </div>

      {/* KATEGORİ → KİŞİ AKORDİYON LİSTESİ */}
      <section>
        {yukleniyor ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-10 animate-pulse rounded-md bg-muted/40"
              />
            ))}
          </div>
        ) : goruntulenecekGruplar.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Bu kriterlerle kayıt bulunamadı.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {goruntulenecekGruplar.map((g, i) => (
              <KategoriBolum
                key={g.kategori?.id ?? `_kategorisiz_${i}`}
                blok={g}
                aktifGundem={aktifGundem}
                aktifFaaliyet={aktifFaaliyet}
                aktifManeviyat={aktifManeviyat}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

/* ============== Alt bileşenler ============== */

function KategoriBolum({
  blok,
  aktifGundem,
  aktifFaaliyet,
  aktifManeviyat,
}: {
  blok: KategoriBlok;
  aktifGundem: boolean;
  aktifFaaliyet: boolean;
  aktifManeviyat: boolean;
}) {
  const { kategori, kisiler } = blok;
  const toplamKayit = kisiler.reduce(
    (a, k) =>
      a +
      (aktifGundem ? k.gundemler.length : 0) +
      (aktifFaaliyet ? k.faaliyetler.length : 0),
    0,
  );
  const aktifKisiler = kisiler.filter(
    (k) =>
      (aktifGundem && k.gundemler.length) ||
      (aktifFaaliyet && k.faaliyetler.length) ||
      (aktifManeviyat && k.maneviyat),
  );
  const [acik, setAcik] = React.useState(true);

  return (
    <Collapsible open={acik} onOpenChange={setAcik}>
      <CollapsibleTrigger className="group flex w-full items-center justify-between gap-3 py-3 text-left">
        <div className="flex items-center gap-2.5">
          <ChevronDown
            className={`h-4 w-4 text-muted-foreground transition-transform ${
              acik ? "" : "-rotate-90"
            }`}
          />
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: kategori?.renk ?? "hsl(var(--muted-foreground))" }}
          />
          <h2 className="text-sm font-semibold tracking-tight">
            {kategori?.ad ?? "Kategorisiz"}
          </h2>
        </div>
        <span className="text-[11px] text-muted-foreground">
          {aktifKisiler.length}/{kisiler.length} kardeş · {toplamKayit} kayıt
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent>
        {kisiler.length === 0 ? (
          <p className="pb-3 pl-7 text-xs text-muted-foreground">
            Bu kategoride kayıtlı kardeş yok.
          </p>
        ) : (
          <div className="divide-y divide-border/50 border-t border-border/50">
            {kisiler.map((k) => (
              <KisiSatir
                key={k.kisi_id}
                blok={k}
                aktifGundem={aktifGundem}
                aktifFaaliyet={aktifFaaliyet}
                aktifManeviyat={aktifManeviyat}
              />
            ))}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

/** Birleşik kronolojik öğe — gündem ve faaliyetleri tek listede. */
type ZamanOgesi = {
  id: string;
  tarih: string;
  tip: "gundem" | "faaliyet";
  baslik: string;
  sonuc: string | null;
  durum?: string;
};

function KisiSatir({
  blok,
  aktifGundem,
  aktifFaaliyet,
  aktifManeviyat,
}: {
  blok: KisiBlok;
  aktifGundem: boolean;
  aktifFaaliyet: boolean;
  aktifManeviyat: boolean;
}) {
  const [acik, setAcik] = React.useState(false);
  const gSayi = aktifGundem ? blok.gundemler.length : 0;
  const fSayi = aktifFaaliyet ? blok.faaliyetler.length : 0;
  const bos =
    gSayi === 0 && fSayi === 0 && (!aktifManeviyat || !blok.maneviyat);

  // Birleşik kronolojik liste
  const ogeler: ZamanOgesi[] = React.useMemo(() => {
    const r: ZamanOgesi[] = [];
    if (aktifGundem) {
      blok.gundemler.forEach((g) =>
        r.push({
          id: `g-${g.id}`,
          tarih: g.istisare_tarih,
          tip: "gundem",
          baslik: g.icerik,
          sonuc: g.karar,
          durum: g.durum,
        }),
      );
    }
    if (aktifFaaliyet) {
      blok.faaliyetler.forEach((f) =>
        r.push({
          id: `f-${f.id}`,
          tarih: f.tarih,
          tip: "faaliyet",
          baslik: `${ETKINLIK_TIP_MAP[f.tip]?.ad ?? f.tip} · ${f.baslik}`,
          sonuc: f.sonuc,
        }),
      );
    }
    return r.sort((a, b) => b.tarih.localeCompare(a.tarih));
  }, [blok.gundemler, blok.faaliyetler, aktifGundem, aktifFaaliyet]);

  return (
    <div className="pl-7">
      <button
        onClick={() => !bos && setAcik((v) => !v)}
        disabled={bos}
        className="flex w-full items-center justify-between gap-3 py-2.5 text-left disabled:cursor-default"
      >
        <div className="flex items-center gap-2 min-w-0">
          {!bos && (
            <ChevronDown
              className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform ${
                acik ? "" : "-rotate-90"
              }`}
            />
          )}
          {bos && <span className="w-3.5 shrink-0" />}
          <span className="truncate text-sm text-foreground">{blok.kisi_ad}</span>
        </div>
        <div className="flex shrink-0 items-center gap-2 text-[11px] text-muted-foreground">
          {aktifGundem && gSayi > 0 && <span>{gSayi} gündem</span>}
          {aktifFaaliyet && fSayi > 0 && <span>{fSayi} faaliyet</span>}
          {aktifManeviyat && blok.maneviyat && (
            <span className="inline-flex items-center gap-0.5 text-foreground/80">
              <Sparkles className="h-3 w-3" />%
              {blok.maneviyat.mufredat_ilerleme_yuzde}
            </span>
          )}
          {bos && <span className="italic">kayıt yok</span>}
        </div>
      </button>

      {!bos && acik && (
        <div className="space-y-1 pb-3 pl-5">
          {ogeler.map((o) => (
            <ZamanSatiri key={o.id} oge={o} />
          ))}
          {aktifManeviyat && blok.maneviyat && (
            <div className="flex flex-wrap gap-3 pt-1 text-[11px] text-muted-foreground">
              <span>
                Müfredat{" "}
                <strong className="text-foreground">
                  %{blok.maneviyat.mufredat_ilerleme_yuzde}
                </strong>{" "}
                ({blok.maneviyat.aktif_mufredat_sayisi} aktif)
              </span>
              <span>
                Evrad{" "}
                <strong className="text-foreground">
                  %{blok.maneviyat.evrad_doluluk_yuzde}
                </strong>{" "}
                ({blok.maneviyat.evrad_kayit_sayisi}/{blok.maneviyat.evrad_madde_sayisi})
              </span>
            </div>
          )}
          <div className="pt-1">
            <Link
              to="/network/kisi/$id"
              params={{ id: blok.kisi_id }}
              search={{ kt: "profil" }}
              className="text-[11px] text-muted-foreground hover:text-primary"
            >
              Profile git →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function ZamanSatiri({ oge }: { oge: ZamanOgesi }) {
  const Ikon = oge.tip === "gundem" ? FileText : Activity;
  const dolu = (oge.sonuc ?? "").trim().length > 0;
  return (
    <div className="flex items-start gap-2 py-1 text-xs">
      <Ikon className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />
      <span className="w-12 shrink-0 text-muted-foreground">
        {format(parseISO(oge.tarih), "d MMM", { locale: tr })}
      </span>
      <div className="min-w-0 flex-1">
        <span className="text-foreground">{oge.baslik}</span>
        {dolu ? (
          <span className="text-foreground/70"> → {oge.sonuc}</span>
        ) : (
          <span className="ml-1 inline-flex items-center gap-0.5 text-destructive/80">
            <AlertCircle className="h-3 w-3" /> sonuç eksik
          </span>
        )}
        {oge.tip === "gundem" && oge.durum === "bekliyor" && (
          <Badge variant="outline" className="ml-1.5 h-4 px-1 text-[9px]">
            bekliyor
          </Badge>
        )}
      </div>
    </div>
  );
}

export type { KategoriBlok, KisiBlok };