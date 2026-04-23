import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import {
  type CeteleSablon,
  type CeteleKayit,
  BIRIM_ETIKET,
  ALAN_ETIKET,
} from "./cetele-tipleri";
import {
  GUN_KISA,
  haftaGunleri,
  haftaEtiketi,
  tarihFormat,
} from "./cetele-tarih";

type Args = {
  haftaBas: Date;
  sablonlar: CeteleSablon[];
  haftaKayitlari: CeteleKayit[];
  ucAylikKayitlari: CeteleKayit[];
  kullanici?: string | null;
};

// renkler — beyaz arka planda iyi görünen tonlar
const RENK = {
  metin: [30, 35, 50] as [number, number, number],
  soluk: [120, 125, 140] as [number, number, number],
  cizgi: [225, 225, 230] as [number, number, number],
  altin: [180, 140, 60] as [number, number, number],
  yesil: [210, 240, 220] as [number, number, number],
  yesilMetin: [40, 110, 70] as [number, number, number],
  sari: [254, 243, 199] as [number, number, number],
  sariMetin: [146, 92, 14] as [number, number, number],
  kirmizi: [254, 226, 226] as [number, number, number],
  kirmiziMetin: [153, 27, 27] as [number, number, number],
  bos: [248, 248, 250] as [number, number, number],
  bosMetin: [180, 185, 195] as [number, number, number],
};

function gunHucresi(
  s: CeteleSablon,
  kayitlar: CeteleKayit[],
  tarihStr: string,
  bugunOteyimi: boolean,
): { metin: string; bg: [number, number, number]; fg: [number, number, number] } {
  const toplam = kayitlar
    .filter((k) => k.sablon_id === s.id && k.tarih === tarihStr)
    .reduce((a, k) => a + Number(k.miktar), 0);
  const hedef = Number(s.hedef_deger);
  const ikili = s.birim === "ikili";

  if (ikili) {
    if (toplam > 0) return { metin: "✓", bg: RENK.yesil, fg: RENK.yesilMetin };
    if (bugunOteyimi) return { metin: "—", bg: RENK.kirmizi, fg: RENK.kirmiziMetin };
    return { metin: "·", bg: RENK.bos, fg: RENK.bosMetin };
  }
  if (toplam >= hedef && hedef > 0)
    return { metin: String(toplam), bg: RENK.yesil, fg: RENK.yesilMetin };
  if (toplam > 0)
    return { metin: String(toplam), bg: RENK.sari, fg: RENK.sariMetin };
  if (bugunOteyimi)
    return { metin: "—", bg: RENK.kirmizi, fg: RENK.kirmiziMetin };
  return { metin: "·", bg: RENK.bos, fg: RENK.bosMetin };
}

function ciz(doc: jsPDF, x: number, y: number, w: number, h: number) {
  doc.setDrawColor(...RENK.cizgi);
  doc.setLineWidth(0.3);
  doc.line(x, y, x + w, y + h);
}

function logo(doc: jsPDF, x: number, y: number, size: number) {
  doc.setDrawColor(...RENK.altin);
  doc.setLineWidth(0.6);
  const cx = x + size / 2;
  const ust = y + size * 0.18;
  const alt = y + size * 0.85;
  // direk
  doc.line(cx, ust, cx, alt);
  // taban
  doc.line(cx - size * 0.18, alt, cx + size * 0.18, alt);
  // kol
  const kolY = y + size * 0.34;
  doc.line(x + size * 0.08, kolY, x + size * 0.92, kolY);
  // sol kefe
  doc.line(x + size * 0.12, kolY, x + size * 0.12, kolY + size * 0.1);
  doc.line(x, kolY + size * 0.18, x + size * 0.24, kolY + size * 0.18);
  // sağ kefe
  doc.line(x + size * 0.88, kolY, x + size * 0.88, kolY + size * 0.1);
  doc.line(x + size * 0.76, kolY + size * 0.18, x + size, kolY + size * 0.18);
  // tepe
  doc.setFillColor(...RENK.altin);
  doc.circle(cx, ust, 0.7, "F");
}

function basliklar(doc: jsPDF, alt: string) {
  const w = doc.internal.pageSize.getWidth();
  logo(doc, 14, 14, 8);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...RENK.metin);
  doc.text("MİZAN", 24.5, 19);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...RENK.soluk);
  doc.text(alt, 24.5, 23);
  // ince çizgi
  doc.setDrawColor(...RENK.cizgi);
  doc.setLineWidth(0.3);
  doc.line(14, 28, w - 14, 28);
}

function altbilgi(doc: jsPDF, kullanici?: string | null) {
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  doc.setDrawColor(...RENK.cizgi);
  doc.setLineWidth(0.3);
  doc.line(14, h - 14, w - 14, h - 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...RENK.soluk);
  const tarih = format(new Date(), "d MMMM yyyy, HH:mm", { locale: tr });
  doc.text(`Olusturuldu: ${tarih}`, 14, h - 9);
  if (kullanici) {
    doc.text(kullanici, w - 14, h - 9, { align: "right" });
  }
  doc.text("mizan.app", w / 2, h - 9, { align: "center" });
}

function maxKayitTarihi(kayitlar: CeteleKayit[]): Date {
  if (kayitlar.length === 0) return new Date();
  const sorted = [...kayitlar].sort((a, b) => a.tarih.localeCompare(b.tarih));
  return new Date(sorted[0].tarih);
}

export function ceteleyiPdfeAktar({
  haftaBas,
  sablonlar,
  haftaKayitlari,
  ucAylikKayitlari,
  kullanici,
}: Args) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const sayfaW = doc.internal.pageSize.getWidth();
  const margin = 14;

  basliklar(doc, "Çetele Raporu");

  // === Üst meta blok ===
  let y = 36;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...RENK.metin);
  doc.text("Haftalık Çetele", margin, y);

  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...RENK.soluk);
  doc.text(haftaEtiketi(haftaBas), margin, y);

  // === Üst sağ özet kutusu (fatura tarzı) ===
  const ozet = [
    ["Toplam evrad", String(sablonlar.length)],
    ["Aktif gün", String(7)],
  ];
  const ozetX = sayfaW - margin - 60;
  let ozetY = 36;
  doc.setFontSize(8);
  for (const [k, v] of ozet) {
    doc.setTextColor(...RENK.soluk);
    doc.text(k, ozetX, ozetY);
    doc.setTextColor(...RENK.metin);
    doc.setFont("helvetica", "bold");
    doc.text(v, ozetX + 60, ozetY, { align: "right" });
    doc.setFont("helvetica", "normal");
    ozetY += 5;
  }

  y = 56;

  // === Haftalık tablo ===
  const gunler = haftaGunleri(haftaBas);
  const bugun = new Date();
  bugun.setHours(0, 0, 0, 0);

  // Alanlara göre grupla
  const alanlar: Array<"maneviyat" | "akademi" | "dunyevi"> = [
    "maneviyat",
    "akademi",
    "dunyevi",
  ];

  for (const alan of alanlar) {
    const grup = sablonlar.filter((s) => s.alan === alan);
    if (grup.length === 0) continue;

    if (y > 240) {
      altbilgi(doc, kullanici);
      doc.addPage();
      basliklar(doc, "Çetele Raporu (devam)");
      y = 36;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...RENK.metin);
    doc.text(ALAN_ETIKET[alan].toUpperCase(), margin, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...RENK.soluk);
    doc.text(`${grup.length} evrad`, sayfaW - margin, y, { align: "right" });
    y += 2;

    const head = [
      [
        "Evrad",
        ...gunler.map((g, i) => `${GUN_KISA[i]}\n${g.getDate()}`),
        "Hedef",
      ],
    ];

    const body = grup.map((s) => {
      const haftaSum = haftaKayitlari
        .filter((k) => k.sablon_id === s.id)
        .reduce((a, k) => a + Number(k.miktar), 0);
      const hedef = Number(s.hedef_deger);
      const hedefMetin =
        s.hedef_tipi === "haftalik"
          ? `${haftaSum}/${hedef}/h`
          : s.hedef_tipi === "gunluk"
            ? `${hedef}/g`
            : "esnek";

      const adWithNot = s.notlar ? `${s.ad}\n${s.notlar}` : s.ad;

      const hucreler = gunler.map((g) => {
        const ts = tarihFormat(g);
        const oteyimi = g < bugun;
        return gunHucresi(s, haftaKayitlari, ts, oteyimi);
      });

      return [adWithNot, ...hucreler.map((h) => h.metin), hedefMetin];
    });

    autoTable(doc, {
      startY: y,
      head,
      body,
      theme: "plain",
      styles: {
        font: "helvetica",
        fontSize: 8,
        cellPadding: { top: 1.8, bottom: 1.8, left: 2, right: 2 },
        textColor: RENK.metin,
        lineColor: RENK.cizgi,
        lineWidth: 0.2,
      },
      headStyles: {
        fontSize: 7,
        textColor: RENK.soluk,
        fontStyle: "normal",
        halign: "center",
        valign: "middle",
        lineWidth: 0,
      },
      columnStyles: {
        0: { cellWidth: 50, halign: "left", fontStyle: "bold" },
        8: { cellWidth: 18, halign: "right", textColor: RENK.soluk, fontSize: 7 },
      },
      bodyStyles: { halign: "center", valign: "middle" },
      margin: { left: margin, right: margin },
      didParseCell: (data) => {
        if (data.section === "body" && data.column.index >= 1 && data.column.index <= 7) {
          const s = grup[data.row.index];
          const g = gunler[data.column.index - 1];
          const ts = tarihFormat(g);
          const oteyimi = g < bugun;
          const h = gunHucresi(s, haftaKayitlari, ts, oteyimi);
          data.cell.styles.fillColor = h.bg;
          data.cell.styles.textColor = h.fg;
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.fontSize = 9;
        }
        if (data.section === "body" && data.column.index === 0) {
          const s = grup[data.row.index];
          if (s.notlar) {
            // alt satırı soluk göster
          }
        }
      },
    });

    // @ts-ignore
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // === 3 Aylık Hedefler ===
  const ucAyliklar = sablonlar.filter((s) => s.uc_aylik_hedef);
  if (ucAyliklar.length > 0) {
    if (y > 220) {
      altbilgi(doc, kullanici);
      doc.addPage();
      basliklar(doc, "Çetele Raporu (devam)");
      y = 36;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...RENK.metin);
    doc.text("3 Aylık İlerleme", margin, y);
    y += 4;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...RENK.soluk);
    doc.text(
      `Bağlı hedefler — ${format(maxKayitTarihi(ucAylikKayitlari), "d MMM", { locale: tr })} sonrası`,
      margin,
      y,
    );
    y += 8;

    for (const s of ucAyliklar) {
      if (y > 270) {
        altbilgi(doc, kullanici);
        doc.addPage();
        basliklar(doc, "Çetele Raporu (devam)");
        y = 36;
      }
      const toplam = ucAylikKayitlari
        .filter((k) => k.sablon_id === s.id)
        .reduce((a, k) => a + Number(k.miktar), 0);
      const hedef = Number(s.uc_aylik_hedef ?? 0);
      const yuzde = hedef > 0 ? Math.min(100, (toplam / hedef) * 100) : 0;
      const birim = BIRIM_ETIKET[s.birim] || s.birim;

      // başlık
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...RENK.metin);
      doc.text(s.ad, margin, y);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...RENK.soluk);
      doc.text(
        `${toplam} / ${hedef} ${birim}   •   %${yuzde.toFixed(0)}`,
        sayfaW - margin,
        y,
        { align: "right" },
      );

      // not
      if (s.notlar) {
        y += 4;
        doc.setFontSize(7);
        doc.setTextColor(...RENK.soluk);
        doc.text(s.notlar, margin, y);
      }

      y += 3;

      // ilerleme çubuğu
      const cW = sayfaW - margin * 2;
      doc.setFillColor(245, 245, 248);
      doc.roundedRect(margin, y, cW, 2.5, 1.25, 1.25, "F");
      doc.setFillColor(...RENK.altin);
      doc.roundedRect(margin, y, (cW * yuzde) / 100, 2.5, 1.25, 1.25, "F");
      y += 9;
    }
  }

  altbilgi(doc, kullanici);

  const dosyaAd = `mizan-cetele-${tarihFormat(haftaBas)}.pdf`;
  doc.save(dosyaAd);
}
