import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import { ETKINLIK_TIP_MAP } from "./network-tipleri";
import type {
  RaporFiltre,
  RaporGundemSatir,
  RaporFaaliyetSatir,
  RaporManeviyatKisi,
} from "./network-hooks";

function fmt(d: string) {
  try {
    return format(parseISO(d), "d MMM yyyy", { locale: tr });
  } catch {
    return d;
  }
}

/**
 * Türkçe karakterleri jsPDF varsayılan Helvetica'nın desteklediği latin-1
 * eşdeğerlerine düşürür. (Font embed maliyeti olmadan okunabilir çıktı.)
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
  kisiAd?: string | null;
  kategoriAdlar?: string[];
  gundemler?: RaporGundemSatir[];
  faaliyetler?: RaporFaaliyetSatir[];
  maneviyat?: RaporManeviyatKisi[];
};

export function raporPdfUret(g: RaporPdfGirdi): void {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const sayfaGenis = doc.internal.pageSize.getWidth();
  const sol = 40;
  let y = 48;

  // Başlık
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(trText("Mizan — Rehberlik Raporu"), sol, y);
  y += 22;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(110);
  doc.text(
    trText(
      `Tarih araligi: ${fmt(g.filtre.from)} — ${fmt(g.filtre.to)}`,
    ),
    sol,
    y,
  );
  y += 14;
  const filtreSatirlari: string[] = [];
  if (g.kisiAd) filtreSatirlari.push(`Kisi: ${g.kisiAd}`);
  if (g.kategoriAdlar && g.kategoriAdlar.length)
    filtreSatirlari.push(`Kategori: ${g.kategoriAdlar.join(", ")}`);
  if (g.filtre.sonucDurumu && g.filtre.sonucDurumu !== "tumu")
    filtreSatirlari.push(
      `Sonuc: ${g.filtre.sonucDurumu === "dolu" ? "Dolu" : "Bos"}`,
    );
  if (g.filtre.gundemDurumu && g.filtre.gundemDurumu !== "tumu")
    filtreSatirlari.push(`Gundem durumu: ${g.filtre.gundemDurumu}`);
  if (filtreSatirlari.length) {
    doc.text(trText(filtreSatirlari.join("  ·  ")), sol, y);
    y += 14;
  }
  doc.text(
    trText(`Olusturulma: ${format(new Date(), "d MMMM yyyy HH:mm", { locale: tr })}`),
    sol,
    y,
  );
  y += 18;
  doc.setTextColor(0);

  // ÖZET
  const ozetSatir: string[][] = [];
  if (g.gundemler) {
    const tamam = g.gundemler.filter((s) => s.durum === "yapildi").length;
    const sonuclu = g.gundemler.filter((s) => (s.karar ?? "").trim()).length;
    ozetSatir.push([
      trText("Gundemler"),
      String(g.gundemler.length),
      `${tamam} tamam`,
      `${sonuclu} sonuclu`,
    ]);
  }
  if (g.faaliyetler) {
    const sonuclu = g.faaliyetler.filter((s) => (s.sonuc ?? "").trim()).length;
    ozetSatir.push([
      trText("Faaliyetler"),
      String(g.faaliyetler.length),
      "—",
      `${sonuclu} sonuclu`,
    ]);
  }
  if (g.maneviyat) {
    const ortIlerleme = g.maneviyat.length
      ? Math.round(
          g.maneviyat.reduce((a, b) => a + b.mufredat_ilerleme_yuzde, 0) /
            g.maneviyat.length,
        )
      : 0;
    const ortDoluluk = g.maneviyat.length
      ? Math.round(
          g.maneviyat.reduce((a, b) => a + b.evrad_doluluk_yuzde, 0) /
            g.maneviyat.length,
        )
      : 0;
    ozetSatir.push([
      trText("Maneviyat"),
      `${g.maneviyat.length} kisi`,
      `${ortIlerleme}% mufredat`,
      `${ortDoluluk}% evrad`,
    ]);
  }
  if (ozetSatir.length) {
    autoTable(doc, {
      startY: y,
      head: [["Kapsam", "Toplam", "Durum", "Sonuc/Doluluk"].map(trText)],
      body: ozetSatir,
      styles: { font: "helvetica", fontSize: 10, cellPadding: 6 },
      headStyles: { fillColor: [40, 40, 40], textColor: 255 },
      margin: { left: sol, right: sol },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 18;
  }

  // GÜNDEMLER
  if (g.gundemler && g.gundemler.length) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(trText("Gundemler ve Kararlar"), sol, y);
    y += 8;
    autoTable(doc, {
      startY: y,
      head: [
        ["Tarih", "Istisare", "Gundem", "Karar / Sonuc", "Sorumlu", "Durum"].map(trText),
      ],
      body: g.gundemler.map((s) => [
        fmt(s.istisare_tarih),
        trText(s.istisare_baslik),
        trText(s.icerik),
        trText(s.karar ?? "—"),
        trText(s.sorumlu_adlar.join(", ")),
        trText(s.durum),
      ]),
      styles: {
        font: "helvetica",
        fontSize: 9,
        cellPadding: 5,
        valign: "top",
        overflow: "linebreak",
      },
      headStyles: { fillColor: [40, 40, 40], textColor: 255 },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 80 },
        2: { cellWidth: 130 },
        3: { cellWidth: 130 },
        4: { cellWidth: 80 },
        5: { cellWidth: 50 },
      },
      margin: { left: sol, right: sol },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 18;
  }

  // FAALİYETLER
  if (g.faaliyetler && g.faaliyetler.length) {
    if (y > 720) {
      doc.addPage();
      y = 48;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(trText("Kardes Faaliyetleri"), sol, y);
    y += 8;
    autoTable(doc, {
      startY: y,
      head: [["Tarih", "Kisi", "Tip", "Baslik", "Sonuc"].map(trText)],
      body: g.faaliyetler.map((s) => [
        fmt(s.tarih),
        trText(s.kisi_ad),
        trText(ETKINLIK_TIP_MAP[s.tip]?.ad ?? s.tip),
        trText(s.baslik),
        trText(s.sonuc ?? "—"),
      ]),
      styles: {
        font: "helvetica",
        fontSize: 9,
        cellPadding: 5,
        valign: "top",
        overflow: "linebreak",
      },
      headStyles: { fillColor: [40, 40, 40], textColor: 255 },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 90 },
        2: { cellWidth: 60 },
        3: { cellWidth: 160 },
        4: { cellWidth: 160 },
      },
      margin: { left: sol, right: sol },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 18;
  }

  // MANEVİYAT
  if (g.maneviyat && g.maneviyat.length) {
    if (y > 720) {
      doc.addPage();
      y = 48;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(trText("Maneviyat Ozeti"), sol, y);
    y += 8;
    autoTable(doc, {
      startY: y,
      head: [
        [
          "Kisi",
          "Aktif mufredat",
          "Ilerleme",
          "Evrad madde",
          "Tik sayisi",
          "Doluluk",
        ].map(trText),
      ],
      body: g.maneviyat.map((m) => [
        trText(m.kisi_ad),
        String(m.aktif_mufredat_sayisi),
        `${m.mufredat_ilerleme_yuzde}%`,
        String(m.evrad_madde_sayisi),
        String(m.evrad_kayit_sayisi),
        `${m.evrad_doluluk_yuzde}%`,
      ]),
      styles: { font: "helvetica", fontSize: 9, cellPadding: 5 },
      headStyles: { fillColor: [40, 40, 40], textColor: 255 },
      margin: { left: sol, right: sol },
    });
  }

  // Footer (sayfa no)
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