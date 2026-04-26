import * as React from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Download,
  FileText,
  Activity,
  Sparkles,
  AlertCircle,
  Users,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
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
              {hizli(
                "Bu hafta",
                format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd"),
                bugun(),
              )}
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

          {/* Sonuç + gündem durum */}
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
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
            </div>
            <label className="mt-2 flex cursor-pointer items-center gap-2 pt-1 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={search.bosGoster}
                onChange={(e) => setSearch({ bosGoster: e.target.checked })}
                className="h-3.5 w-3.5 rounded border-border"
              />
              Boş kategorileri göster
            </label>
          </div>
        </div>

        {/* Kategoriler */}
        {kategoriler.length > 0 && (
          <div className="mt-4 space-y-2">
            <label className="text-xs font-medium text-muted-foreground">
              Kategori (boşsa hepsi)
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
              `${gSonuclu} sonuç yazılı (${
                gundemler.length ? Math.round((gSonuclu / gundemler.length) * 100) : 0
              }%)`,
            ]}
            yukleniyor={gundemQ.isLoading}
          />
        )}
        {aktifFaaliyet && (
          <OzetKart
            baslik="Faaliyetler"
            ana={`${faaliyetler.length}`}
            altSatirlar={[
              `${fSonuclu} sonuç yazılı (${
                faaliyetler.length
                  ? Math.round((fSonuclu / faaliyetler.length) * 100)
                  : 0
              }%)`,
              `${goruntulenecekGruplar.reduce(
                (a, g) => a + g.kisiler.length,
                0,
              )} kardeş kapsamda`,
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

      {/* KATEGORİ → KİŞİ HİYERARŞİSİ */}
      <section className="space-y-6">
        {yukleniyor ? (
          <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
            Yükleniyor…
          </div>
        ) : goruntulenecekGruplar.length === 0 ? (
          <BosKutu mesaj="Bu kriterlerle kayıt bulunamadı." />
        ) : (
          goruntulenecekGruplar.map((g, i) => (
            <KategoriKart
              key={g.kategori?.id ?? `_kategorisiz_${i}`}
              blok={g}
              aktifGundem={aktifGundem}
              aktifFaaliyet={aktifFaaliyet}
              aktifManeviyat={aktifManeviyat}
            />
          ))
        )}
      </section>
    </div>
  );
}

/* ============== Alt bileşenler ============== */

function KategoriKart({
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
  const dolu = kisiler.filter(
    (k) =>
      (aktifGundem && k.gundemler.length) ||
      (aktifFaaliyet && k.faaliyetler.length) ||
      (aktifManeviyat && k.maneviyat),
  );
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <header className="flex items-center justify-between gap-3 border-b border-border bg-muted/30 px-5 py-3">
        <div className="flex items-center gap-2.5">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ background: kategori?.renk ?? "hsl(var(--muted-foreground))" }}
          />
          <h2 className="text-base font-semibold tracking-tight">
            {kategori?.ad ?? "Kategorisiz"}
          </h2>
          <Badge variant="outline" className="text-[10px]">
            <Users className="h-3 w-3" /> {kisiler.length}
          </Badge>
        </div>
        <span className="text-[11px] text-muted-foreground">
          {dolu.length} aktif kardeş
        </span>
      </header>

      {kisiler.length === 0 ? (
        <div className="px-5 py-6 text-sm text-muted-foreground">
          Bu kategoride kayıtlı kardeş yok.
        </div>
      ) : (
        <div className="divide-y divide-border">
          {kisiler.map((k) => (
            <KisiBlokSatir
              key={k.kisi_id}
              blok={k}
              aktifGundem={aktifGundem}
              aktifFaaliyet={aktifFaaliyet}
              aktifManeviyat={aktifManeviyat}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function KisiBlokSatir({
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
  const bos =
    (!aktifGundem || blok.gundemler.length === 0) &&
    (!aktifFaaliyet || blok.faaliyetler.length === 0) &&
    (!aktifManeviyat || !blok.maneviyat);

  return (
    <div className="px-5 py-4">
      <div className="mb-2 flex items-center justify-between">
        <Link
          to="/network/kisi/$id"
          params={{ id: blok.kisi_id }}
          search={{ kt: "profil" }}
          className="group flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-primary"
        >
          {blok.kisi_ad}
          <ChevronRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
        </Link>
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          {aktifGundem && (
            <Badge variant="secondary" className="text-[10px]">
              {blok.gundemler.length} gündem
            </Badge>
          )}
          {aktifFaaliyet && (
            <Badge variant="secondary" className="text-[10px]">
              {blok.faaliyetler.length} faaliyet
            </Badge>
          )}
        </div>
      </div>

      {bos ? (
        <p className="text-xs text-muted-foreground">
          Bu aralıkta kayıt yok.
        </p>
      ) : (
        <div className="space-y-3">
          {aktifGundem && blok.gundemler.length > 0 && (
            <MiniListe
              icon={<FileText className="h-3 w-3" />}
              baslik="Gündem kararları"
              satirlar={blok.gundemler.map((g) => ({
                id: g.id,
                tarih: g.istisare_tarih,
                sol: g.icerik,
                sag: g.karar,
                rozetler: [
                  <Badge
                    key="d"
                    variant={g.durum === "yapildi" ? "default" : "outline"}
                    className="text-[10px]"
                  >
                    {g.durum}
                  </Badge>,
                ],
              }))}
            />
          )}
          {aktifFaaliyet && blok.faaliyetler.length > 0 && (
            <MiniListe
              icon={<Activity className="h-3 w-3" />}
              baslik="Faaliyetler & sonuçlar"
              satirlar={blok.faaliyetler.map((f) => ({
                id: f.id,
                tarih: f.tarih,
                sol: `${ETKINLIK_TIP_MAP[f.tip]?.ad ?? f.tip} · ${f.baslik}`,
                sag: f.sonuc,
              }))}
            />
          )}
          {aktifManeviyat && blok.maneviyat && (
            <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-background/60 px-3 py-2 text-xs">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Sparkles className="h-3 w-3" /> Maneviyat
              </span>
              <span>
                Müfredat:{" "}
                <strong className="text-foreground">
                  {blok.maneviyat.mufredat_ilerleme_yuzde}%
                </strong>{" "}
                ({blok.maneviyat.aktif_mufredat_sayisi} aktif)
              </span>
              <span>
                Evrad:{" "}
                <strong className="text-foreground">
                  {blok.maneviyat.evrad_doluluk_yuzde}%
                </strong>{" "}
                ({blok.maneviyat.evrad_kayit_sayisi}/{blok.maneviyat.evrad_madde_sayisi}{" "}
                madde)
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MiniListe({
  icon,
  baslik,
  satirlar,
}: {
  icon: React.ReactNode;
  baslik: string;
  satirlar: Array<{
    id: string;
    tarih: string;
    sol: string;
    sag: string | null;
    rozetler?: React.ReactNode[];
  }>;
}) {
  return (
    <div>
      <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {icon} {baslik}
      </p>
      <ul className="space-y-1.5">
        {satirlar.map((s) => (
          <li
            key={s.id}
            className="grid grid-cols-[60px_1fr_1.4fr_auto] items-start gap-2 rounded-md border border-border/60 bg-background/40 px-2.5 py-1.5 text-xs"
          >
            <span className="text-muted-foreground">
              {format(parseISO(s.tarih), "d MMM", { locale: tr })}
            </span>
            <span className="text-foreground">{s.sol}</span>
            <span className="text-foreground/90">
              {s.sag?.trim() ? (
                s.sag
              ) : (
                <span className="inline-flex items-center gap-1 text-destructive">
                  <AlertCircle className="h-3 w-3" /> Sonuç eksik
                </span>
              )}
            </span>
            <span className="flex items-center gap-1">{s.rozetler}</span>
          </li>
        ))}
      </ul>
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

export type { KategoriBlok, KisiBlok };