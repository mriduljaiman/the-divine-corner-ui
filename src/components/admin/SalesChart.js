import { useMemo, useState } from 'react';
import { inr, inrShort } from '../../utils/format';

const ONLINE = '#7c6ff2';
const OFFLINE = '#f59e0b';

/** Stacked daily bars (online + counter) drawn as plain SVG, no chart library needed. */
export default function SalesChart({ data = [] }) {
  const [hover, setHover] = useState(null);
  const W = 720, H = 240, PAD_L = 58, PAD_B = 28, PAD_T = 10;

  const { max, bars } = useMemo(() => {
    const totals = data.map(d => Number(d.online) + Number(d.offline));
    const rawMax = Math.max(1, ...totals);
    // round the axis to a friendly number
    const mag = Math.pow(10, Math.floor(Math.log10(rawMax)));
    const niceMax = Math.ceil(rawMax / mag) * mag;
    const slot = (W - PAD_L) / Math.max(1, data.length);
    const bw = Math.max(4, slot * 0.62);
    const scale = (v) => (Number(v) / niceMax) * (H - PAD_B - PAD_T);
    return {
      max: niceMax,
      bars: data.map((d, i) => {
        const x = PAD_L + i * slot + (slot - bw) / 2;
        const hOff = scale(d.offline);
        const hOn = scale(d.online);
        return { d, x, bw, hOff, hOn, total: totals[i] };
      }),
    };
  }, [data]);

  const ticks = [0, 0.25, 0.5, 0.75, 1];
  const base = H - PAD_B;
  const hovered = hover != null ? bars[hover] : null;

  return (
    <div style={{ position: 'relative' }}>
      <svg viewBox={`0 0 ${W} ${H}`} className="adm-chart" role="img" aria-label="Daily sales for the last 30 days"
        onMouseLeave={() => setHover(null)}>
        {ticks.map(t => {
          const y = base - t * (H - PAD_B - PAD_T);
          return (
            <g key={t}>
              <line x1={PAD_L} x2={W} y1={y} y2={y} stroke="#eef0f6" />
              <text x={PAD_L - 8} y={y + 4} textAnchor="end" fontSize="13" fill="#94a3b8">{inrShort(max * t)}</text>
            </g>
          );
        })}
        {bars.map((b, i) => (
          <g key={b.d.date} onMouseEnter={() => setHover(i)} onClick={() => setHover(i)} style={{ cursor: 'pointer' }}>
            <rect x={b.x - 2} y={PAD_T} width={b.bw + 4} height={base - PAD_T} fill={hover === i ? '#f3f2ff' : 'transparent'} rx="4" />
            {b.hOff > 0 && <rect x={b.x} y={base - b.hOff} width={b.bw} height={b.hOff} fill={OFFLINE} rx="3" />}
            {b.hOn > 0 && <rect x={b.x} y={base - b.hOff - b.hOn} width={b.bw} height={b.hOn} fill={ONLINE} rx="3" />}
            {(i % 7 === 0 || i === bars.length - 1) && (
              <text x={b.x + b.bw / 2} y={H - 6} textAnchor="middle" fontSize="13" fill="#94a3b8">
                {new Date(b.d.date + 'T00:00:00').getDate()}/{new Date(b.d.date + 'T00:00:00').getMonth() + 1}
              </text>
            )}
          </g>
        ))}
      </svg>
      {hovered && (
        <div style={{
          position: 'absolute', top: 0, right: 0, background: '#0f172a', color: '#fff', borderRadius: 10,
          padding: '8px 12px', fontSize: '0.78rem', pointerEvents: 'none', boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
        }}>
          <div style={{ fontWeight: 700, marginBottom: 2 }}>
            {new Date(hovered.d.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
          </div>
          <div>Total: <b>{inr(hovered.total)}</b></div>
          <div style={{ color: '#c4bdfd' }}>Online: {inr(hovered.d.online)}</div>
          <div style={{ color: '#fcd34d' }}>Counter: {inr(hovered.d.offline)}</div>
        </div>
      )}
      <div className="adm-legend" style={{ marginTop: 8 }}>
        <span><i style={{ background: ONLINE }} /> Online orders</span>
        <span><i style={{ background: OFFLINE }} /> Counter bills</span>
      </div>
    </div>
  );
}
