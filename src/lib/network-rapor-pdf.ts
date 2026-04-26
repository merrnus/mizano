import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import { ETKINLIK_TIP_MAP } from "./network-tipleri";
import type { RaporFiltre } from "./network-hooks";
import type { KategoriBlok } from "@/routes/network.rapor";

function fmt(d: string) {
  try {
    return format(parseISO(d), "d MMM yyyy", { locale: tr });
  } catch {
    return d;
  }
}

/**
 * Türkçe karakterleri jsPDF varsayılan Helvetica'nın desteklediği
 * latin-1 eşdeğerlerine düşürür.
 */
function trText(s: string | null | undefined): string {
  if (!s) return "";
  return s
    .replace(/İ/g, "I")
    .replace(/ı/g, "i")
    .replace(/Ğ/g, "G")
    .replace(/ğ/g, "g")
    .replace(/Ş/g, "S")
    .replace(/ş/g, "s")
    .replace(/Ç/g, "C")
    .replace(/ç/g, "c")
    .replace(/Ö/g, "O")
    .replace(/ö/g, "o")
    .replace(/Ü/g, "U")
    .replace(/ü/g, "u");
}

export type RaporPdfGirdi = {
  filtre: RaporFiltre;
  kategoriAdlar?: string[];
  gruplar: KategoriBlok[];
  kapsam: { gundem: boolean; faaliyet: boolean; maneviyat: boolean };
};

function getY(doc: jsPDF): number {
  const t = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable;
  return t ? t.finalY : 0;
}

export function raporPdfUret(g: RaporPdfGirdi): void {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const sayfaGenis = doc.internal.pageSize.getWidth();
  const sayfaYuk = doc.internal.pageSize.getHeight();
  const sol = 40;
  let y = 48;

  // ------- Başlık -------
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(trText("Mizan — Rehberlik Raporu"), sol, y);
  y += 22;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(110);
  doc.text(
    trText(`Tarih araligi: ${fmt(g.filtre.from)} — ${fmt(g.filtre.to)}`),
    sol,
    y,
  );
  y += 14;
  const filtreSatirlari: string[] = [];
  if (g.kategoriAdlar && g.kategoriAdlar.length)
    filtreSatirlari.push(`Kategori: ${g.kategoriAdlar.join(", ")}`);
  if (g.filtre.sonucDurumu && g.filtre.sonucDurumu !== "tumu")
    filtreSatirlari.push(
      `Sonuc: ${g.filtre.sonucDurumu === "dolu" ? "Dolu" : "Bos"}`,
    );
  if (g.filtre.gundemDurumu && g.filtre.gundemDurumu !== "tumu")
    filtreSatirlari.push(`Gundem durumu: ${g.filtre.gundemDurumu}`);
  const kapsamLabels = [
    g.kapsam.gundem && "Gundemler",
    g.kapsam.faaliyet && "Faaliyetler",
    g.kapsam.maneviyat && "Maneviyat",
  ].filter(Boolean) as string[];
  filtreSatirlari.push(`Kapsam: ${kapsamLabels.join(" + ")}`);
  if (filtreSatirlari.length) {
    doc.text(trText(filtreSatirlari.join("  ·  ")), sol, y);
    y += 14;
  }
  doc.text(
    trText(
      `Olusturulma: ${format(new Date(), "d MMMM yyyy HH:mm", { locale: tr })}`,
    ),
    sol,
    y,
  );
  y += 18;
  doc.setTextColor(0);

  // ------- Üst özet -------
  let toplamGundem = 0;
  let sonucluGundem = 0;
  let toplamFaaliyet = 0;
  let sonucluFaaliyet = 0;
  let toplamKisi = 0;
  for (const grp of g.gruplar) {
    toplamKisi += grp.kisiler.length;
    for (const k of grp.kisiler) {
      toplamGundem += k.gundemler.length;
      sonucluGundem += k.gundemler.filter(
        (gg) => (gg.karar ?? "").trim().length > 0,
      ).length;
      toplamFaaliyet += k.faaliyetler.length;
      sonucluFaaliyet += k.faaliyetler.filter(
        (ff) => (ff.sonuc ?? "").trim().length > 0,
      ).length;
    }
  }

  const ozetSatir: string[][] = [];
  ozetSatir.push([
    trText("Kategori"),
    String(g.gruplar.length),
    `${toplamKisi} kardes`,
    "",
  ]);
  if (g.kapsam.gundem) {
    ozetSatir.push([
      trText("Gundemler"),
      String(toplamGundem),
      `${sonucluGundem} sonuclu`,
      toplamGundem
        ? `${Math.round((sonucluGundem / toplamGundem) * 100)}%`
        : "—",
    ]);
  }
  if (g.kapsam.faaliyet) {
    ozetSatir.push([
      trText("Faaliyetler"),
      String(toplamFaaliyet),
      `${sonucluFaaliyet} sonuclu`,
      toplamFaaliyet
        ? `${Math.round((sonucluFaaliyet / toplamFaaliyet) * 100)}%`
        : "—",
    ]);
  }

  autoTable(doc, {
    startY: y,
    head: [["Kapsam", "Toplam", "Detay", "Oran"].map(trText)],
    body: ozetSatir,
    styles: { font: "helvetica", fontSize: 10, cellPadding: 6 },
    headStyles: { fillColor: [40, 40, 40], textColor: 255 },
    margin: { left: sol, right: sol },
  });
  y = getY(doc) + 22;

  // ------- Kategori → Kişi blokları -------
  const yenISayfaGerekiyorMu = (gerekenBoslik: number) => {
    if (y + gerekenBoslik > sayfaYuk - 60) {
      doc.addPage();
      y = 48;
    }
  };

  for (const grp of g.gruplar) {
    yenISayfaGerekiyorMu(60);
    // Kategori başlığı
    doc.setDrawColor(180);
    doc.setFillColor(245, 245, 245);
    doc.rect(sol, y, sayfaGenis - sol * 2, 22, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(30);
    doc.text(
      trText(
        `${grp.kategori?.ad ?? "Kategorisiz"}  (${grp.kisiler.length} kardes)`,
      ),
      sol + 8,
      y + 15,
    );
    y += 30;

    if (grp.kisiler.length === 0) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(10);
      doc.setTextColor(140);
      doc.text(trText("Bu kategoride kayitli kardes yok."), sol + 8, y);
      y += 18;
      continue;
    }

    for (const k of grp.kisiler) {
      yenISayfaGerekiyorMu(70);

      // Kişi başlığı
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(40);
      doc.text(trText(`• ${k.kisi_ad}`), sol + 6, y);
      y += 12;

      const bos =
        (!g.kapsam.gundem || k.gundemler.length === 0) &&
        (!g.kapsam.faaliyet || k.faaliyetler.length === 0) &&
        (!g.kapsam.maneviyat || !k.maneviyat);

      if (bos) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(9);
        doc.setTextColor(150);
        doc.text(trText("Bu aralikta kayit yok."), sol + 16, y);
        y += 16;
        continue;
      }

      // Gündemler
      if (g.kapsam.gundem && k.gundemler.length > 0) {
        autoTable(doc, {
          startY: y,
          head: [["Tarih", "Gundem", "Karar / Sonuc", "Durum"].map(trText)],
          body: k.gundemler.map((gg) => [
            fmt(gg.istisare_tarih),
            trText(gg.icerik),
            trText(gg.karar ?? "—"),
            trText(gg.durum),
          ]),
          styles: {
            font: "helvetica",
            fontSize: 9,
            cellPadding: 4,
            valign: "top",
            overflow: "linebreak",
          },
          headStyles: {
            fillColor: [70, 70, 70],
            textColor: 255,
            fontSize: 8,
          },
          columnStyles: {
            0: { cellWidth: 60 },
            1: { cellWidth: 180 },
            2: { cellWidth: 200 },
            3: { cellWidth: 60 },
          },
          margin: { left: sol + 14, right: sol },
        });
        y = getY(doc) + 6;
      }

      // Faaliyetler
      if (g.kapsam.faaliyet && k.faaliyetler.length > 0) {
        yenISayfaGerekiyorMu(60);
        autoTable(doc, {
          startY: y,
          head: [["Tarih", "Tip", "Baslik", "Sonuc"].map(trText)],
          body: k.faaliyetler.map((ff) => [
            fmt(ff.tarih),
            trText(ETKINLIK_TIP_MAP[ff.tip]?.ad ?? ff.tip),
            trText(ff.baslik),
            trText(ff.sonuc ?? "—"),
          ]),
          styles: {
            font: "helvetica",
            fontSize: 9,
            cellPadding: 4,
            valign: "top",
            overflow: "linebreak",
          },
          headStyles: {
            fillColor: [110, 110, 110],
            textColor: 255,
            fontSize: 8,
          },
          columnStyles: {
            0: { cellWidth: 60 },
            1: { cellWidth: 70 },
            2: { cellWidth: 170 },
            3: { cellWidth: 200 },
          },
          margin: { left: sol + 14, right: sol },
        });
        y = getY(doc) + 6;
      }

      // Maneviyat
      if (g.kapsam.maneviyat && k.maneviyat) {
        yenISayfaGerekiyorMu(24);
        const m = k.maneviyat;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(80);
        doc.text(
          trText(
            `Maneviyat: Mufredat ${m.mufredat_ilerleme_yuzde}% (${m.aktif_mufredat_sayisi} aktif)  ·  Evrad ${m.evrad_doluluk_yuzde}% (${m.evrad_kayit_sayisi}/${m.evrad_madde_sayisi} madde)`,
          ),
          sol + 16,
          y + 10,
        );
        y += 18;
      }

      y += 6;
    }

    y += 8;
  }

  // ------- Footer -------
  const sayfaSayisi = doc.getNumberOfPages();
  for (let i = 1; i <= sayfaSayisi; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(140);
    doc.text(
      trText(`Mizan Rapor — sayfa ${i}/${sayfaSayisi}`),
      sayfaGenis - sol,
      doc.internal.pageSize.getHeight() - 20,
      { align: "right" },
    );
  }

  doc.save(`mizan-rapor-${g.filtre.from}_${g.filtre.to}.pdf`);
}