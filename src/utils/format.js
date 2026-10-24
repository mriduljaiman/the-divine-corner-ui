// Shared formatting helpers (money is always Indian Rupees, dates are shop-local).

const inrFmt = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 0 });
const inrFmt2 = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 2 });

export function inr(value, { decimals = false } = {}) {
  const n = Number(value || 0);
  return `₹${(decimals ? inrFmt2 : inrFmt).format(n)}`;
}

/** 1.2L / 3.4K style for chart axes and KPI tiles. */
export function inrShort(value) {
  const n = Number(value || 0);
  if (Math.abs(n) >= 1e7) return `₹${(n / 1e7).toFixed(1)}Cr`;
  if (Math.abs(n) >= 1e5) return `₹${(n / 1e5).toFixed(1)}L`;
  if (Math.abs(n) >= 1e3) return `₹${(n / 1e3).toFixed(1)}K`;
  return `₹${Math.round(n)}`;
}

export function fmtDate(value, withTime = false) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('en-IN', withTime
    ? { day: '2-digit', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }
    : { day: '2-digit', month: 'short', year: 'numeric' });
}

export function todayIso() {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}

export function initials(name) {
  return (name || '?').trim().split(/\s+/).slice(0, 2).map(s => s[0]).join('').toUpperCase() || '?';
}

/** Indian 10-digit mobile, accepts +91 / 0 prefixes and spaces. Returns '' when invalid. */
export function normalizePhone(raw) {
  let d = String(raw || '').replace(/\D/g, '');
  if (d.length === 12 && d.startsWith('91')) d = d.slice(2);
  if (d.length === 11 && d.startsWith('0')) d = d.slice(1);
  return /^[6-9]\d{9}$/.test(d) ? d : '';
}

export function apiError(err, fallback = 'Something went wrong') {
  return err?.response?.data?.message || fallback;
}
