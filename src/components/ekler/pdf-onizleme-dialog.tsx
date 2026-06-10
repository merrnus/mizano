import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ekDosyaUrl } from "@/lib/ekler-hooks";
import { Loader2, ExternalLink } from "lucide-react";

export function PdfOnizlemeDialog({
  storagePath,
  baslik,
  acik,
  onOpenChange,
}: {
  storagePath: string;
  baslik?: string | null;
  acik: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const [url, setUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!acik) {
      setUrl(null);
      return;
    }
    let iptal = false;
    (async () => {
      const u = await ekDosyaUrl(storagePath, 3600);
      if (!iptal) setUrl(u);
    })();
    return () => {
      iptal = true;
    };
  }, [acik, storagePath]);

  return (
    <Dialog open={acik} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl p-0 sm:h-[85vh] overflow-hidden">
        <DialogHeader className="border-b border-border px-4 py-3">
          <DialogTitle className="flex items-center justify-between gap-2 text-sm">
            <span className="truncate">{baslik || "PDF"}</span>
            {url && (
              <a
                href={url}
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-1 text-xs font-normal text-muted-foreground hover:text-foreground"
              >
                <ExternalLink className="h-3 w-3" /> Yeni sekmede aç
              </a>
            )}
          </DialogTitle>
        </DialogHeader>
        <div className="h-full min-h-[60vh] w-full bg-muted">
          {url ? (
            <iframe src={url} title={baslik ?? "PDF"} className="h-full min-h-[60vh] w-full" />
          ) : (
            <div className="flex h-[60vh] items-center justify-center text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Yükleniyor…
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}