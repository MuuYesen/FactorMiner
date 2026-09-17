import { useState, type ReactNode, type MouseEvent } from 'react';
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

/* ---------- Conclusion card (period summary) ---------- */

export function ConclusionCard({ status, statusTone = 'success', title, points, highlights, highlightsLabel = '重点复盘项' }: {
  status?: string; statusTone?: string; title: string;
  points: { label: string; value: ReactNode; icon?: ReactNode; tone?: 'pos' | 'neg' }[];
  highlights?: string[]; highlightsLabel?: string;
}) {
  return (
    <section className="conclusion">
      <div className="conclusion-head">
        <span className={`conclusion-dot dot-${statusTone}`} />
        <h2>{title}</h2>
        {status && <span className={`pill pill-${statusTone} no-dot`}>{status}</span>}
      </div>
      <div className="conclusion-grid">
        {points.map((p) => (
          <div className="conclusion-item" key={p.label}>
            <div className="ci-label">{p.icon}{p.label}</div>
            <div className={`ci-value ${p.tone || ''}`}>{p.value}</div>
          </div>
        ))}
      </div>
      {highlights && highlights.length > 0 && (
        <div className="conclusion-foot">
          <span className="cf-label">{highlightsLabel}</span>
          <div className="tag-row">{highlights.map((h) => <span className="chip-warn" key={h}>{h}</span>)}</div>
        </div>
      )}
    </section>
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

/* ---------- Line chart (hover tooltip + optional benchmark series) ---------- */

export function LineChart({ series, benchmark, benchmarkLabel = 'Benchmark', seriesLabel = 'Series', labels, oosFrom, height = 200, baseline = 0, valueFormat }: {
  series: number[]; benchmark?: number[]; benchmarkLabel?: string; seriesLabel?: string;
  labels?: string[]; oosFrom?: number; height?: number; baseline?: number; valueFormat?: (v: number) => string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const w = 1000;
  const h = height;
  const padX = 10;
  const padTop = 16;
  const padBottom = labels ? 26 : 16;
  const all = benchmark ? [...series, ...benchmark, baseline] : [...series, baseline];
  const min = Math.min(...all);
  const max = Math.max(...all);
  const range = max - min || 1;
  const n = series.length;
  const x = (i: number) => padX + (i / (n - 1)) * (w - padX * 2);
  const y = (v: number) => padTop + (1 - (v - min) / range) * (h - padTop - padBottom);
  const toPath = (s: number[]) => s.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const line = toPath(series);
  const area = `${line} L${x(n - 1).toFixed(1)},${y(min).toFixed(1)} L${x(0).toFixed(1)},${y(min).toFixed(1)} Z`;
  const fmt = valueFormat || ((v: number) => v.toFixed(3));
  const pctX = (i: number) => (x(i) / w) * 100;
  const pctY = (v: number) => (y(v) / h) * 100;

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const rel = (e.clientX - rect.left) / rect.width;
    setHover(Math.max(0, Math.min(n - 1, Math.round(rel * (n - 1)))));
  };

  return (
    <div className="chart-frame chart-interactive" onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" role="img" aria-label="time series" style={{ height }}>
        {oosFrom !== undefined && oosFrom < n && (
          <rect x={x(oosFrom)} y={padTop} width={w - padX - x(oosFrom)} height={h - padTop - padBottom} fill="var(--warn-soft)" opacity="0.55" />
        )}
        <line className="chart-baseline" x1={padX} x2={w - padX} y1={y(baseline)} y2={y(baseline)} vectorEffect="non-scaling-stroke" />
        <path className="chart-area" d={area} />
        {benchmark && <path className="chart-line-bench" d={toPath(benchmark)} fill="none" vectorEffect="non-scaling-stroke" />}
        <path className="chart-line" d={line} fill="none" vectorEffect="non-scaling-stroke" />
        {hover !== null && <line className="chart-cursor" x1={x(hover)} x2={x(hover)} y1={padTop} y2={h - padBottom} vectorEffect="non-scaling-stroke" />}
      </svg>
      {hover !== null && (
        <>
          {benchmark && <span className="chart-dot bench" style={{ left: `${pctX(hover)}%`, top: `${pctY(benchmark[hover])}%` }} />}
          <span className="chart-dot" style={{ left: `${pctX(hover)}%`, top: `${pctY(series[hover])}%` }} />
          <div className={`chart-tip ${pctX(hover) > 62 ? 'flip' : ''}`} style={{ left: `${pctX(hover)}%` }}>
            {labels?.[hover] && <b>{labels[hover]}</b>}
            <span><i className="dot-accent" />{seriesLabel} · {fmt(series[hover])}</span>
            {benchmark && <span><i className="dot-bench" />{benchmarkLabel} · {fmt(benchmark[hover])}</span>}
          </div>
        </>
      )}
      {labels && (
        <div className="chart-xaxis">
          {labels.map((l, i) => (i % Math.ceil(n / 8) === 0 || i === n - 1 ? <span key={l + i} style={{ left: `${pctX(i)}%` }}>{l}</span> : null))}
        </div>
      )}
    </div>
  );
}

/* ---------- Bar chart (vertical, +/- aware) ---------- */

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

/* ---------- Diverging horizontal bars (contribution breakdown) ---------- */

export function DivergingBars({ items, valueFormat }: { items: { label: string; value: number }[]; valueFormat?: (v: number) => string }) {
  const max = Math.max(...items.map((i) => Math.abs(i.value))) || 1;
  const fmt = valueFormat || ((v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}`);
  return (
    <div className="dbars">
      {items.map((it) => {
        const w = (Math.abs(it.value) / max) * 50;
        const pos = it.value >= 0;
        return (
          <div className="dbar-row" key={it.label}>
            <div className="dbar-label">{it.label}</div>
            <div className="dbar-track">
              <span className="dbar-mid" />
              <span className={`dbar-fill ${pos ? 'pos' : 'neg'}`} style={{ width: `${w}%`, left: pos ? '50%' : `${50 - w}%` }} />
            </div>
            <div className={`dbar-val ${pos ? 'pos' : 'neg'}`}>{fmt(it.value)}</div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- Waterfall (attribution: base -> deltas -> total) ---------- */

export function Waterfall({ items, height = 220 }: { items: { label: string; value: number; kind?: 'base' | 'total' }[]; height?: number }) {
  const w = 1000;
  const h = height;
  const padTop = 16;
  const padBottom = 30;
  const padX = 10;
  let running = 0;
  const bars = items.map((it) => {
    if (it.kind === 'base' || it.kind === 'total') { running = it.value; return { ...it, start: 0, end: it.value }; }
    const start = running; const end = running + it.value; running = end;
    return { ...it, start, end };
  });
  const vals = bars.flatMap((b) => [b.start, b.end]);
  const min = Math.min(0, ...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;
  const y = (v: number) => padTop + (1 - (v - min) / range) * (h - padTop - padBottom);
  const bw = (w - padX * 2) / items.length;
  return (
    <div className="chart-frame">
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" role="img" aria-label="waterfall">
        <line className="chart-grid-line" x1={padX} x2={w - padX} y1={y(0)} y2={y(0)} vectorEffect="non-scaling-stroke" />
        {bars.map((b, i) => {
          const top = Math.min(y(b.start), y(b.end));
          const bh = Math.max(2, Math.abs(y(b.start) - y(b.end)));
          const cls = b.kind ? 'total' : b.value >= 0 ? 'pos' : 'neg';
          return <rect key={b.label} className={`wf-bar ${cls}`} x={padX + i * bw + bw * 0.22} y={top} width={bw * 0.56} height={bh} rx="1.5" />;
        })}
      </svg>
      <div className="wf-labels">{items.map((it) => <span key={it.label}>{it.label}</span>)}</div>
    </div>
  );
}

/* ---------- Gauge (semicircle segmented donut) ---------- */

export function Gauge({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const r = 62;
  const cx = 80;
  const cy = 78;
  let angle = 180;
  const arcs = segments.map((seg) => {
    const sweep = (seg.value / total) * 180;
    const a0 = (angle * Math.PI) / 180;
    const a1 = ((angle - sweep) * Math.PI) / 180;
    const x0 = cx + r * Math.cos(a0);
    const y0 = cy - r * Math.sin(a0);
    const x1 = cx + r * Math.cos(a1);
    const y1 = cy - r * Math.sin(a1);
    angle -= sweep;
    return { d: `M${x0.toFixed(1)},${y0.toFixed(1)} A${r},${r} 0 0 1 ${x1.toFixed(1)},${y1.toFixed(1)}`, color: seg.color };
  });
  return (
    <div className="gauge">
      <svg viewBox="0 0 160 90" width="150" height="84" aria-hidden="true">
        {arcs.map((a, i) => <path key={i} d={a.d} fill="none" stroke={a.color} strokeWidth={20} />)}
      </svg>
      <ul className="gauge-legend">
        {segments.map((s) => (
          <li key={s.label}><i style={{ background: s.color }} /><span>{s.label}</span><b>{Math.round((s.value / total) * 100)}%</b></li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- Sparkline ---------- */

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
