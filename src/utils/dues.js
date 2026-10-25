// Due / reminder helpers shared by the dues list, the customer ledger and the admin shell.
import { useEffect, useState } from 'react';
import { adminService } from '../services/adminService';
import { inr, fmtDate } from './format';

export const DUE_STATUS = {
  OVERDUE: { label: 'Overdue', tone: 'danger', hint: 'Promise date has passed' },
  DUE_TODAY: { label: 'Due today', tone: 'pending', hint: 'Promised to pay today' },
  STALE: { label: '30+ days old', tone: 'shipped', hint: 'No promise date, pending for over a month' },
  UPCOMING: { label: 'Upcoming', tone: 'info', hint: 'Promise date is ahead' },
  NO_DATE: { label: 'No date', tone: 'neutral', hint: 'No promise date set' },
};

/** Customers that need a nudge today. */
export const needsReminder = (d) => d.status === 'OVERDUE' || d.status === 'DUE_TODAY' || d.status === 'STALE';

export function daysAgoText(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const days = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  return `${days} days ago`;
}

export function promiseText(date) {
  if (!date) return 'No promise date';
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d = new Date(date + 'T00:00:00');
  const diff = Math.round((d - today) / 86400000);
  if (diff === 0) return 'Promised today';
  if (diff < 0) return `${-diff} day${diff === -1 ? '' : 's'} overdue`;
  return `Promised ${fmtDate(date)} (in ${diff} day${diff === 1 ? '' : 's'})`;
}

export function statementText(ledger, siteUrl) {
  const lines = [
    '*The Divine Corner* 🙏',
    `Account statement — ${ledger.customerName || ledger.customerPhone}`,
    '',
    ...ledger.entries.map(e => {
      const when = fmtDate(e.date);
      if (e.type === 'BILL') return `${when}: Purchase ${inr(e.debit)} (${e.description})`;
      if (e.type === 'WRITE_OFF') return `${when}: Adjusted ${inr(e.credit)}`;
      return `${when}: Paid ${inr(e.credit)}`;
    }),
    '',
    `Total purchases: ${inr(ledger.totalPurchased)}`,
    `Total paid: ${inr(ledger.totalPaid)}`,
    Number(ledger.totalWrittenOff) > 0 ? `Adjusted: ${inr(ledger.totalWrittenOff)}` : null,
    Number(ledger.balance) > 0 ? `*Balance due: ${inr(ledger.balance)}*` : '*Account settled ✅ — thank you!*',
    siteUrl || null,
  ];
  return lines.filter(l => l !== null).join('\n');
}

// ---- reminder count for the admin menu badge (one request per minute at most)
let cache = { at: 0, data: null, promise: null };

export function invalidateDues() {
  cache = { at: 0, data: null, promise: null };
}

/** `refreshKey` (e.g. the route) controls when to re-check; results are cached for a minute. */
export function useDueReminders(enabled = true, refreshKey = '') {
  const [count, setCount] = useState(cache.data ? cache.data.filter(needsReminder).length : 0);
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    const fresh = cache.data && Date.now() - cache.at < 60000;
    const p = fresh ? Promise.resolve(cache.data)
      : (cache.promise || (cache.promise = adminService.dues().then(r => {
        cache = { at: Date.now(), data: r.data, promise: null };
        return r.data;
      }).catch(() => { cache.promise = null; return []; })));
    p.then(list => { if (alive) setCount((list || []).filter(needsReminder).length); });
    return () => { alive = false; };
  }, [enabled, refreshKey]);
  return count;
}
