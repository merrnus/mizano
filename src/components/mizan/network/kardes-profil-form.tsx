import * as React from "react";
import { Check, X, User, GraduationCap, Heart } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useKisiGuncelleDetay } from "@/lib/network-hooks";
import type { KisiDetay } from "@/lib/network-tipleri";
import { toast } from "sonner";

export function KardesProfilForm({ kisi }: { kisi: KisiDetay }) {
  const guncelle = useKisiGuncelleDetay();

  const [ad, setAd] = React.useState(kisi.ad);
  const [foto_url, setFoto] = React.useState(kisi.foto_url ?? "");
  const [telefon, setTelefon] = React.useState(kisi.telefon ?? "");
  const [dogum_tarihi, setDogum] = React.useState(kisi.dogum_tarihi ?? "");
  const [sorumluluk_notu, setSorumluluk] = React.useState(kisi.sorumluluk_notu ?? "");
  const [universite, setUni] = React.useState(kisi.universite ?? "");
  const [bolum, setBolum] = React.useState(kisi.bolum ?? "");
  const [sinif, setSinif] = React.useState(kisi.sinif ?? "");
  const [gano, setGano] = React.useState(kisi.gano?.toString() ?? "");
  const [akademik_durum, setAkademik] = React.useState(kisi.akademik_durum ?? "");
  const [ilgi, setIlgi] = React.useState<string[]>(kisi.ilgi_alanlari ?? []);
  const [yeniIlgi, setYeniIlgi] = React.useState("");

  React.useEffect(() => {
    setAd(kisi.ad);
    setFoto(kisi.foto_url ?? "");
    setTelefon(kisi.telefon ?? "");
    setDogum(kisi.dogum_tarihi ?? "");
    setSorumluluk(kisi.sorumluluk_notu ?? "");
    setUni(kisi.universite ?? "");
    setBolum(kisi.bolum ?? "");
    setSinif(kisi.sinif ?? "");
    setGano(kisi.gano?.toString() ?? "");
    setAkademik(kisi.akademik_durum ?? "");
    setIlgi(kisi.ilgi_alanlari ?? []);
  }, [kisi.id]);

  const ilgiEkle = () => {
    const v = yeniIlgi.trim();
    if (!v) return;
    if (!ilgi.includes(v)) setIlgi([...ilgi, v]);
    setYeniIlgi("");
  };

  const kaydet = async () => {
    const ganoNum = gano.trim() === "" ? null : Number(gano);
    if (ganoNum !== null && Number.isNaN(ganoNum)) {
      toast.error("GANO geçerli bir sayı olmalı");
      return;
    }
    await guncelle.mutateAsync({
      id: kisi.id,
      ad: ad.trim() || kisi.ad,
      foto_url: foto_url.trim() || null,
      telefon: telefon.trim() || null,
      dogum_tarihi: dogum_tarihi || null,
      sorumluluk_notu: sorumluluk_notu || null,
      universite: universite.trim() || null,
      bolum: bolum.trim() || null,
      sinif: sinif.trim() || null,
      gano: ganoNum,
      akademik_durum: akademik_durum.trim() || null,
      ilgi_alanlari: ilgi,
    });
    toast.success("Profil kaydedildi");
  };

  const initials = ad
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-6">
      {/* Künye */}
      <Bolum ikon={User} baslik="Künye">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <Avatar className="h-20 w-20 border border-border">
            {foto_url ? <AvatarImage src={foto_url} alt={ad} /> : null}
            <AvatarFallback className="bg-muted text-base">{initials}</AvatarFallback>
          </Avatar>
          <div className="grid flex-1 gap-3 sm:grid-cols-2">
            <Alan label="Ad">
              <Input value={ad} onChange={(e) => setAd(e.target.value)} />
            </Alan>
            <Alan label="Foto URL (ops.)">
              <Input
                value={foto_url}
                onChange={(e) => setFoto(e.target.value)}
                placeholder="https://…"
              />
            </Alan>
            <Alan label="Telefon">
              <Input
                value={telefon}
                onChange={(e) => setTelefon(e.target.value)}
                placeholder="05xx…"
              />
            </Alan>
            <Alan label="Doğum tarihi">
              <Input
                type="date"
                value={dogum_tarihi}
                onChange={(e) => setDogum(e.target.value)}
              />
            </Alan>
          </div>
        </div>
        <Alan label="Bana ait sorumluluklar / hassasiyetler">
          <Textarea
            rows={3}
            value={sorumluluk_notu}
            onChange={(e) => setSorumluluk(e.target.value)}
            placeholder="Bu kardeş için seninle ilgili olan özel noktalar…"
          />
        </Alan>
      </Bolum>

      {/* Akademik */}
      <Bolum ikon={GraduationCap} baslik="Akademik">
        <div className="grid gap-3 sm:grid-cols-2">
          <Alan label="Üniversite">
            <Input value={universite} onChange={(e) => setUni(e.target.value)} />
          </Alan>
          <Alan label="Bölüm">
            <Input value={bolum} onChange={(e) => setBolum(e.target.value)} />
          </Alan>
          <Alan label="Sınıf / dönem">
            <Input
              value={sinif}
              onChange={(e) => setSinif(e.target.value)}
              placeholder="Hazırlık · 3. sınıf · Mezun…"
            />
          </Alan>
          <Alan label="GANO">
            <Input
              value={gano}
              onChange={(e) => setGano(e.target.value)}
              placeholder="3.45"
              inputMode="decimal"
            />
          </Alan>
          <Alan label="Akademik durum">
            <Input
              value={akademik_durum}
              onChange={(e) => setAkademik(e.target.value)}
              placeholder="aktif · ara verdi · mezun…"
            />
          </Alan>
        </div>
      </Bolum>

      {/* İlgi Alanları */}
      <Bolum ikon={Heart} baslik="İlgi alanları">
        <div className="flex flex-wrap gap-1.5">
          {ilgi.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 text-xs"
            >
              {t}
              <button
                type="button"
                onClick={() => setIlgi(ilgi.filter((x) => x !== t))}
                className="text-muted-foreground hover:text-destructive"
                aria-label={`${t} sil`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          {ilgi.length === 0 && (
            <span className="text-xs text-muted-foreground">Henüz etiket yok</span>
          )}
        </div>
        <div className="mt-3 flex gap-2">
          <Input
            value={yeniIlgi}
            onChange={(e) => setYeniIlgi(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                ilgiEkle();
              }
            }}
            placeholder="Yeni etiket (Enter)"
            className="h-9 max-w-xs"
          />
          <Button size="sm" variant="outline" onClick={ilgiEkle} disabled={!yeniIlgi.trim()}>
            Ekle
          </Button>
        </div>
      </Bolum>

      <div className="sticky bottom-0 -mx-1 flex justify-end gap-2 border-t border-border bg-background/90 px-1 py-3 backdrop-blur">
        <Button onClick={kaydet} disabled={guncelle.isPending}>
          <Check className="h-3.5 w-3.5" /> Kaydet
        </Button>
      </div>
    </div>
  );
}

function Bolum({
  ikon: Ikon,
  baslik,
  children,
}: {
  ikon: React.ComponentType<{ className?: string }>;
  baslik: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card/50 p-4 sm:p-5">
      <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        <Ikon className="h-3.5 w-3.5" />
        {baslik}
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Alan({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}
