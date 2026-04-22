export function SayfaBasligi({
  baslik,
  aciklama,
  aksiyonlar,
}: {
  baslik: string;
  aciklama?: string;
  aksiyonlar?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-border px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">{baslik}</h1>
        {aciklama && <p className="mt-1 text-sm text-muted-foreground">{aciklama}</p>}
      </div>
      {aksiyonlar && <div className="flex items-center gap-2">{aksiyonlar}</div>}
    </div>
  );
}