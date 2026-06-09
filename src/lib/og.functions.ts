import { createServerFn } from "@tanstack/react-start";

export interface OgMeta {
  url: string;
  title: string | null;
  description: string | null;
  image: string | null;
  favicon: string | null;
  siteName: string | null;
}

function pickMeta(html: string, names: string[]): string | null {
  for (const n of names) {
    const re = new RegExp(
      `<meta[^>]+(?:property|name)=["']${n}["'][^>]*content=["']([^"']+)["']`,
      "i",
    );
    const m = html.match(re);
    if (m?.[1]) return decodeEntities(m[1].trim());
    const re2 = new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${n}["']`,
      "i",
    );
    const m2 = html.match(re2);
    if (m2?.[1]) return decodeEntities(m2[1].trim());
  }
  return null;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'");
}

function absoluteUrl(rawHref: string | null, baseUrl: string): string | null {
  if (!rawHref) return null;
  try {
    return new URL(rawHref, baseUrl).toString();
  } catch {
    return null;
  }
}

export const fetchOgMeta = createServerFn({ method: "POST" })
  .inputValidator((data: { url: string }) => data)
  .handler(async ({ data }): Promise<OgMeta> => {
    let target: URL;
    try {
      target = new URL(data.url);
    } catch {
      throw new Error("Geçersiz URL");
    }
    if (target.protocol !== "http:" && target.protocol !== "https:") {
      throw new Error("Sadece http/https desteklenir");
    }

    const empty: OgMeta = {
      url: data.url,
      title: null,
      description: null,
      image: null,
      favicon: null,
      siteName: null,
    };

    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 6000);
      const res = await fetch(target.toString(), {
        signal: ctrl.signal,
        redirect: "follow",
        headers: {
          "user-agent":
            "Mozilla/5.0 (compatible; MizanBot/1.0; +https://mizan.today)",
          accept: "text/html,application/xhtml+xml",
        },
      });
      clearTimeout(t);
      if (!res.ok) return empty;
      const ct = res.headers.get("content-type") ?? "";
      if (!ct.includes("text/html") && !ct.includes("xhtml")) return empty;
      const buf = await res.arrayBuffer();
      // Sadece ilk 256KB'ı parse et (head genelde başta)
      const html = new TextDecoder("utf-8", { fatal: false }).decode(
        buf.slice(0, 262144),
      );

      const title =
        pickMeta(html, ["og:title", "twitter:title"]) ??
        (html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() ?? null);
      const description = pickMeta(html, [
        "og:description",
        "twitter:description",
        "description",
      ]);
      const image = pickMeta(html, ["og:image", "twitter:image"]);
      const siteName = pickMeta(html, ["og:site_name"]);
      const iconMatch =
        html.match(/<link[^>]+rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']+)["']/i) ??
        html.match(/<link[^>]+href=["']([^"']+)["'][^>]*rel=["'](?:shortcut )?icon["']/i);
      const favicon = absoluteUrl(iconMatch?.[1] ?? "/favicon.ico", target.toString());

      return {
        url: target.toString(),
        title: title ? decodeEntities(title) : null,
        description: description ? decodeEntities(description) : null,
        image: absoluteUrl(image, target.toString()),
        favicon,
        siteName: siteName ?? target.hostname,
      };
    } catch {
      return empty;
    }
  });