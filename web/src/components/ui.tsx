import type { ReactNode } from 'react';
import { Inbox } from 'lucide-react';
import { statusClass } from '../data/researchData';

/* ---------- Page + scope headers ---------- */

export function PageHead({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="page-head">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="head-actions">{actions}</div>}
    </div>
  );
}

export function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`panel ${className}`}>{children}</section>;
}

export function PanelHead({ eyebrow, title, aside }: { eyebrow?: string; title: string; aside?: ReactNode }) {
  return (
    <div className="panel-head">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h2>{title}</h2>
      </div>
      {aside}
    </div>
  );
}

/* ---------- Status pill ---------- */

export function Pill({ children, tone, noDot }: { children: ReactNode; tone?: string; noDot?: boolean }) {
  const cls = tone ? `pill-${tone}` : statusClass(String(children)).replace('status-', 'pill-');
  return <span className={`pill ${cls} ${noDot ? 'no-dot' : ''}`}>{children}</span>;
}

/* ---------- Metric strip ---------- */

export function Metrics({ items }: { items: { label: string; value: ReactNode; sub?: string }[] }) {
  return (
    <div className="metrics">
      {items.map((m) => (
        <div className="metric" key={m.label}>
          <div className="m-label">{m.label}</div>
          <div className="m-value">{m.value}</div>
          {m.sub && <div className="m-sub">{m.sub}</div>}
        </div>
      ))}
    </div>
  );
}

/* ---------- Empty / planned state ---------- */

export function Empty({ title, text, action, inline }: { title: string; text?: string; action?: ReactNode; inline?: boolean }) {
  return (
    <div className={`empty ${inline ? 'empty-inline' : ''}`}>
      <span className="empty-icon"><Inbox size={18} /></span>
      <h3>{title}</h3>
      {text && <p>{text}</p>}
      {action}
    </div>
  );
}

/* ---------- Progress ---------- */

export function Progress({ value, className = '' }: { value: number; className?: string }) {
  return <div className={`progress ${className}`}><span style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div>;
}

export function TableProgress({ value }: { value: number }) {
  return (
    <div className="table-progress">
      <Progress value={value} className="thin" />
      <small>{value}%</small>
    </div>
  );
}

/* ---------- Inline SVG charts ---------- */

export function LineChart({ series, oosFrom, height = 160, baseline = 0 }: { series: number[]; oosFrom?: number; height?: number; baseline?: number }) {
  const w = 640;
  const h = height;
  const pad = 24;
  const min = Math.min(...series, baseline);
  const max = Math.max(...series, baseline);
  const range = max - min || 1;
  const x = (i: number) => pad + (i / (series.length - 1)) * (w - pad * 2);
  const y = (v: number) => pad + (1 - (v - min) / range) * (h - pad * 2);
  const line = series.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const area = `${line} L${x(series.length - 1).toFixed(1)},${y(min).toFixed(1)} L${x(0).toFixed(1)},${y(min).toFixed(1)} Z`;
  return (
    <div className="chart-frame">
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" role="img" aria-label="IC time series">
        <line className="chart-baseline" x1={pad} x2={w - pad} y1={y(baseline)} y2={y(baseline)} />
        {oosFrom !== undefined && oosFrom < series.length && (
          <rect x={x(oosFrom)} y={pad} width={w - pad - x(oosFrom)} height={h - pad * 2} fill="var(--warn-soft)" opacity="0.5" />
        )}
        <path className="chart-area" d={area} />
        <path className="chart-line" d={line} />
      </svg>
    </div>
  );
}

export function BarChart({ series, height = 150 }: { series: { label: string; value: number; muted?: boolean }[]; height?: number }) {
  const w = 640;
  const h = height;
  const pad = 22;
  const max = Math.max(...series.map((s) => Math.abs(s.value))) || 1;
  const bw = (w - pad * 2) / series.length;
  const zero = h - pad;
  return (
    <div className="chart-frame">
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" role="img" aria-label="bar chart">
        <line className="chart-grid-line" x1={pad} x2={w - pad} y1={zero} y2={zero} />
        {series.map((s, i) => {
          const bh = (Math.abs(s.value) / max) * (h - pad * 2);
          return <rect key={s.label} className={`chart-bar ${s.muted ? 'muted' : ''}`} x={pad + i * bw + bw * 0.18} y={zero - bh} width={bw * 0.64} height={bh} rx="2" />;
        })}
      </svg>
    </div>
  );
}

export function Sparkline({ series, width = 96, height = 26 }: { series: number[]; width?: number; height?: number }) {
  const min = Math.min(...series);
  const max = Math.max(...series);
  const range = max - min || 1;
  const pts = series.map((v, i) => `${(i / (series.length - 1)) * width},${height - ((v - min) / range) * height}`).join(' ');
  return (
    <svg className="spark" width={width} height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true">
      <polyline points={pts} fill="none" stroke="var(--accent)" strokeWidth="1.5" />
    </svg>
  );
}
