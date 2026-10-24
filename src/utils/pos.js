// Counter-billing helpers shared by the POS page, the /p/[code] page and bill pages.
import { inr, fmtDate } from './format';

const DRAFT_KEY = 'dc_pos_draft_v1';

/**
 * A scan can be our QR link (https://site/p/DC12345678), a bare barcode, or a SKU.
 * Returns the code to look up.
 */
export function extractCode(raw) {
  const text = String(raw || '').trim();
  if (!text) return '';
  const m = text.match(/\/p\/([^/?#\s]+)/i);
  if (m) return decodeURIComponent(m[1]);
  return text;
}

export function productToLine(p) {
  const listed = Number(p.discountPrice || p.price);
  return {
    productId: p.id,
    name: p.name,
    sku: p.sku,
    barcode: p.barcode,
    image: p.images?.[0] || null,
    mrp: listed,
    cost: p.purchasingPrice != null ? Number(p.purchasingPrice) : null,
    stock: Number(p.stockQuantity || 0),
    unitPrice: listed,
    qty: 1,
  };
}

/** Add one unit of a product (merging with an existing line). Pure function. */
export function addToLines(lines, product) {
  const idx = lines.findIndex(l => l.productId === product.id);
  if (idx === -1) return [productToLine(product), ...lines];
  const next = lines.slice();
  const line = next[idx];
  next[idx] = { ...line, qty: line.qty + 1, stock: Number(product.stockQuantity ?? line.stock) };
  // move the touched line to the top so the cashier sees it
  next.unshift(next.splice(idx, 1)[0]);
  return next;
}

export function billTotals(lines) {
  let total = 0, mrpTotal = 0, qty = 0, cost = 0, costKnown = true;
  for (const l of lines) {
    total += Number(l.unitPrice || 0) * l.qty;
    mrpTotal += Number(l.mrp || 0) * l.qty;
    qty += l.qty;
    if (l.cost == null) costKnown = false; else cost += l.cost * l.qty;
  }
  total = Math.round(total * 100) / 100;
  return { total, mrpTotal, qty, savings: Math.max(0, mrpTotal - total), profit: costKnown ? total - cost : null };
}

// ------------------------------------------------------------------ draft persistence

export function loadDraft() {
  try {
    const d = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
    if (d && Array.isArray(d.lines)) return d;
  } catch { /* ignore */ }
  return { lines: [], customer: {} };
}

export function saveDraft(draft) {
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify(draft)); } catch { /* storage full / private mode */ }
}

export function clearDraft() {
  try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
}

/** Used by /p/[code] when the admin scans with the phone camera. */
export function addProductToDraft(product) {
  const d = loadDraft();
  d.lines = addToLines(d.lines, product);
  saveDraft(d);
  return d;
}

// ------------------------------------------------------------------ feedback

let audioCtx;
export function beep(ok = true) {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = 'sine';
    o.frequency.value = ok ? 1250 : 220;
    g.gain.value = 0.08;
    o.connect(g); g.connect(audioCtx.destination);
    o.start();
    o.stop(audioCtx.currentTime + (ok ? 0.09 : 0.25));
    if (navigator.vibrate) navigator.vibrate(ok ? 40 : [60, 40, 60]);
  } catch { /* audio not available */ }
}

// ------------------------------------------------------------------ sharing

export function whatsappText(bill, siteUrl) {
  const lines = [
    '*The Divine Corner* 🙏',
    `Bill: ${bill.billNumber}`,
    `Date: ${fmtDate(bill.billDate, true)}`,
    bill.customerName ? `Customer: ${bill.customerName}` : null,
    '',
    ...bill.items.map(i => `• ${i.productName} × ${i.quantity} @ ${inr(i.unitPrice)} = ${inr(i.subtotal)}`),
    '',
    Number(bill.discount) > 0 ? `You saved: ${inr(bill.discount)}` : null,
    `*Total: ${inr(bill.total)}*`,
    `Paid: ${inr(bill.amountPaid)}`,
    Number(bill.amountDue) > 0 ? `*Due: ${inr(bill.amountDue)}*` : null,
    '',
    'Thank you for shopping with us! 🙏',
    siteUrl ? `Shop online: ${siteUrl}` : null,
  ];
  return lines.filter(l => l !== null).join('\n');
}

export function dueReminderText(name, amount, siteUrl) {
  return [
    `Namaste${name ? ' ' + name : ''} 🙏`,
    `This is a gentle reminder from *The Divine Corner* that ${inr(amount)} is pending on your account.`,
    'Please clear it at your convenience. Thank you!',
    siteUrl ? siteUrl : null,
  ].filter(Boolean).join('\n');
}

export function whatsappUrl(phone, text) {
  return `https://wa.me/91${phone}?text=${encodeURIComponent(text)}`;
}
