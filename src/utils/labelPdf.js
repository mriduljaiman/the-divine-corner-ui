// Barcode label sheets as a downloadable PDF.
// Layout: one section per product (its labels = quantity), sections flow down the page and
// continue on as many A4 pages as needed. A thermal-roll mode puts one label per page.
import { inr } from './format';

export const SHEETS = {
  // compact labels, 4 per row; the column gap keeps the Code128 quiet zone (10 modules) on both sides
  a4: { label: 'A4 sheet · 4 per row', page: [210, 297], margin: 10, cols: 4, gapX: 7 },
  roll: { label: 'Thermal roll · 50 × 25 mm', page: [50, 25], margin: 1.5, cols: 1, gapX: 0 },
};

const BAR_H = 10;        // mm, bar height on A4
const CODE_H = 4;        // mm, human-readable code under the bars
const INFO_H = 7.5;      // mm, name + price above the bars (optional)
const ROW_GAP = 4;       // mm between label rows
const HEADER_H = 7;      // mm, section title
const SECTION_GAP = 4;   // mm after each section

function cellHeight(opts) {
  return (opts.showInfo ? INFO_H : 0) + BAR_H + CODE_H;
}

/**
 * Pure layout planner (no drawing): returns pages of positioned items.
 * sections: [{ product, copies }]. Keeps a section title together with at least one row,
 * and repeats the title as "(contd.)" when a section spills onto the next page.
 */
export function planA4(sections, opts = {}) {
  const s = SHEETS.a4;
  const [pw, ph] = s.page;
  const cols = s.cols;
  const usableW = pw - 2 * s.margin;
  const cellW = (usableW - (cols - 1) * s.gapX) / cols;
  const cellH = cellHeight(opts);
  const bottom = ph - s.margin;
  const pages = [[]];
  let y = s.margin;
  const page = () => pages[pages.length - 1];
  const newPage = () => { pages.push([]); y = s.margin; };

  for (const { product, copies } of sections) {
    if (copies <= 0) continue;
    if (y + HEADER_H + cellH > bottom) newPage();
    page().push({ type: 'header', x: s.margin, y, text: `${product.name}  ·  ${product.barcode}  ·  ${copies} label${copies === 1 ? '' : 's'}` });
    y += HEADER_H;
    let left = copies;
    while (left > 0) {
      if (y + cellH > bottom) {
        newPage();
        page().push({ type: 'header', x: s.margin, y, text: `${product.name} (contd.)` });
        y += HEADER_H;
      }
      const n = Math.min(cols, left);
      for (let c = 0; c < n; c++) {
        page().push({ type: 'label', x: s.margin + c * (cellW + s.gapX), y, w: cellW, h: cellH, product });
      }
      left -= n;
      y += cellH + ROW_GAP;
    }
    y += SECTION_GAP - ROW_GAP;
  }
  if (page().length === 0 && pages.length > 1) pages.pop();
  return pages;
}

export function countPages(sections, sheet, opts) {
  const total = sections.reduce((n, s) => n + Math.max(0, s.copies), 0);
  if (!total) return 0;
  return sheet === 'roll' ? total : planA4(sections, opts).length;
}

/** Bars only (text is drawn by the PDF so it stays sharp). Cached per code. */
async function barcodePng(code, cache) {
  if (cache.has(code)) return cache.get(code);
  const { default: JsBarcode } = await import('jsbarcode');
  const canvas = document.createElement('canvas');
  JsBarcode(canvas, code, { format: 'CODE128', displayValue: false, margin: 0, width: 6, height: 160, background: '#ffffff', lineColor: '#000000' });
  const png = { data: canvas.toDataURL('image/png'), ratio: canvas.width / canvas.height };
  cache.set(code, png);
  return png;
}

function truncate(doc, text, maxW) {
  if (doc.getTextWidth(text) <= maxW) return text;
  let t = text;
  while (t.length > 1 && doc.getTextWidth(t + '…') > maxW) t = t.slice(0, -1);
  return t + '…';
}

/** Draw one label inside the box (x, y, w, h). */
async function drawLabel(doc, product, box, opts, cache) {
  const { x, w } = box;
  let { y } = box;
  const barH = box.barH ?? BAR_H;
  const codeH = box.codeH ?? CODE_H;
  if (opts.showInfo) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(truncate(doc, product.name, w), x, y + 2.8);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(inr(product.discountPrice || product.price).replace('₹', 'Rs. '), x, y + 6.5);
    y += INFO_H;
  }
  const png = await barcodePng(product.barcode, cache);
  doc.addImage(png.data, 'PNG', x, y, w, barH, undefined, 'FAST');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(barH < 9 ? 7.5 : 8.5);
  doc.text(product.barcode, x, y + barH + codeH - 1.2, { charSpace: 0.35 });
}

/**
 * Build the PDF. sections: [{ product, copies }] (product needs name, barcode, price/discountPrice).
 * Returns a jsPDF document; call .save(name) or .output('bloburl').
 */
export async function buildLabelPdf(sections, { sheet = 'a4', showInfo = false } = {}) {
  const { jsPDF } = await import('jspdf');
  const opts = { showInfo };
  const cache = new Map();
  const cfg = SHEETS[sheet];
  const [pw, ph] = cfg.page;
  const doc = new jsPDF({ unit: 'mm', format: [pw, ph], orientation: pw > ph ? 'landscape' : 'portrait', compress: true });
  doc.setProperties({ title: 'The Divine Corner - barcode labels' });

  if (sheet === 'roll') {
    let first = true;
    for (const { product, copies } of sections) {
      for (let i = 0; i < copies; i++) {
        if (!first) doc.addPage([pw, ph], pw > ph ? 'landscape' : 'portrait');
        first = false;
        const m = cfg.margin;
        const codeH = 3.6;
        const barH = ph - 2 * m - codeH - (showInfo ? INFO_H : 0);
        await drawLabel(doc, product, { x: m + 1, y: m, w: pw - 2 * m - 2, barH, codeH }, opts, cache);
      }
    }
    return doc;
  }

  const pages = planA4(sections, opts);
  for (let p = 0; p < pages.length; p++) {
    if (p > 0) doc.addPage();
    for (const item of pages[p]) {
      if (item.type === 'header') {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(60);
        doc.text(truncate(doc, item.text, pw - 2 * cfg.margin), item.x, item.y + 4.2);
        doc.setDrawColor(210);
        doc.line(item.x, item.y + 5.6, pw - cfg.margin, item.y + 5.6);
        doc.setTextColor(0);
      } else {
        await drawLabel(doc, item.product, item, opts, cache);
      }
    }
    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.text(`The Divine Corner · page ${p + 1} of ${pages.length}`, pw / 2, ph - 4, { align: 'center' });
    doc.setTextColor(0);
  }
  return doc;
}
