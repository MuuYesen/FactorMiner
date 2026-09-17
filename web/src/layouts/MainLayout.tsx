import { useEffect, useMemo, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Activity, BarChart3, Boxes, Brain, Briefcase, ChevronDown, ChevronRight, CircleHelp, Cpu, Database,
  FlaskConical, GitBranch, GitCompareArrows, Gauge, Layers3, LayoutGrid, LineChart, Network, Plus,
  Search, Settings2, ShieldAlert, SlidersHorizontal, Target, TerminalSquare, TestTubes, Workflow, X,
} from 'lucide-react';
import { tasks } from '../data/researchData';

const sections = [
  { label: 'Workspace', items: [
    { name: 'Overview', path: '/', icon: LayoutGrid },
    { name: 'Projects', path: '/projects', icon: Boxes },
    { name: 'Experiments', path: '/experiments', icon: Workflow },
    { name: 'Runs', path: '/runs', icon: Activity },
  ] },
  { label: 'Factors', items: [
    { name: 'Library', path: '/library', icon: Layers3 },
    { name: 'Compare', path: '/compare', icon: GitCompareArrows },
    { name: 'Correlation', path: '/correlation', icon: Network },
    { name: 'Lineage', path: '/lineage', icon: GitBranch },
  ] },
  { label: 'Validation', items: [
    { name: 'Validation Center', path: '/validation', icon: TestTubes },
    { name: 'IC Analysis', path: '/validation/ic', icon: LineChart },
    { name: 'Stability', path: '/stability', icon: Activity },
    { name: 'Regime', path: '/regime', icon: BarChart3 },
    { name: 'Walk Forward', path: '/walk-forward', icon: GitCompareArrows },
    { name: 'Overfit', path: '/overfit', icon: SlidersHorizontal },
  ] },
  { label: 'Portfolio', items: [
    { name: 'Portfolios', path: '/portfolios', icon: Briefcase },
    { name: 'Backtests', path: '/backtests', icon: LineChart },
    { name: 'Risk', path: '/risk', icon: ShieldAlert },
  ] },
  { label: 'Data', items: [
    { name: 'Datasets', path: '/data', icon: Database },
    { name: 'Universes', path: '/universes', icon: Boxes },
    { name: 'Features', path: '/features', icon: Layers3 },
    { name: 'Targets', path: '/targets', icon: Target },
  ] },
  { label: 'Engine', items: [
    { name: 'Miners', path: '/miners', icon: FlaskConical },
    { name: 'Operators', path: '/operators', icon: Settings2 },
    { name: 'Fitness', path: '/fitness', icon: Gauge },
    { name: 'Models', path: '/models', icon: Brain },
    { name: 'Compute', path: '/compute', icon: Cpu },
    { name: 'Tasks', path: '/tasks', icon: TerminalSquare },
  ] },
];

const crumbLabels: Record<string, string> = {
  projects: 'Projects', experiments: 'Experiments', new: 'New Experiment', runs: 'Runs',
  library: 'Factor Library', compare: 'Compare', correlation: 'Correlation', lineage: 'Lineage',
  factors: 'Factor', validation: 'Validation', ic: 'IC Analysis', stability: 'Stability', regime: 'Regime',
  'walk-forward': 'Walk Forward', overfit: 'Overfit', portfolios: 'Portfolios', backtests: 'Backtests',
  risk: 'Risk', data: 'Datasets', universes: 'Universes', features: 'Features', targets: 'Targets',
  miners: 'Miners', operators: 'Operators', fitness: 'Fitness', models: 'Models', compute: 'Compute',
  tasks: 'Tasks', reports: 'Reports', settings: 'Settings', help: 'Help',
};

const paletteItems = [
  { group: 'Create', label: 'New Experiment', path: '/experiments/new', icon: Plus },
  { group: 'Go to', label: 'Workspace Overview', path: '/', icon: LayoutGrid },
  { group: 'Go to', label: 'Projects', path: '/projects', icon: Boxes },
  { group: 'Go to', label: 'Experiments', path: '/experiments', icon: Workflow },
  { group: 'Go to', label: 'Runs', path: '/runs', icon: Activity },
  { group: 'Go to', label: 'Factor Library', path: '/library', icon: Layers3 },
  { group: 'Go to', label: 'Validation Center', path: '/validation', icon: TestTubes },
  { group: 'Go to', label: 'Backtests', path: '/backtests', icon: LineChart },
  { group: 'Go to', label: 'Engine · Miners', path: '/miners', icon: FlaskConical },
];

export function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [tasksOpen, setTasksOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [engineOpen, setEngineOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState(0);

  const results = useMemo(() => paletteItems.filter((i) => i.label.toLowerCase().includes(query.toLowerCase())), [query]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setQuery(''); setIndex(0); setPaletteOpen((v) => !v); }
      if (e.key === 'Escape') { setPaletteOpen(false); setEngineOpen(false); setTasksOpen(false); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!paletteOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); setIndex((i) => Math.min(i + 1, results.length - 1)); }
      if (e.key === 'ArrowUp') { e.preventDefault(); setIndex((i) => Math.max(i - 1, 0)); }
      if (e.key === 'Enter' && results[index]) { navigate(results[index].path); setPaletteOpen(false); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [paletteOpen, index, results, navigate]);

  const segments = location.pathname.split('/').filter(Boolean);
  const runningTasks = tasks.filter((t) => t.status === '运行中').length;

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    if (path === '/validation') return location.pathname === '/validation';
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <div className="app">
      <header className="app-header">
        <Link to="/" className="brand"><span className="brand-glyph">f</span>FactorMiner</Link>
        <div className="header-sep" />
        <nav className="breadcrumb" aria-label="Breadcrumb">
          {segments.length === 0 ? (
            <span className="crumb-current">Workspace Overview</span>
          ) : (
            <>
              <Link to="/">Workspace</Link>
              {segments.map((seg, i) => {
                const to = `/${segments.slice(0, i + 1).join('/')}`;
                const label = crumbLabels[seg] || (seg.match(/[A-Z]{2,}-|-\d/) ? seg.toUpperCase() : seg);
                const last = i === segments.length - 1;
                return (
                  <span key={to} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <ChevronRight size={13} />
                    {last ? <span className="crumb-current">{label}</span> : <Link to={to}>{label}</Link>}
                  </span>
                );
              })}
            </>
          )}
        </nav>
        <div className="header-right">
          <button className="header-search" onClick={() => { setQuery(''); setIndex(0); setPaletteOpen(true); }}>
            <Search size={15} /><span>Search projects, factors, runs</span><kbd>⌘K</kbd>
          </button>
          <div className="engine-chip">
            <button onClick={() => setEngineOpen((v) => !v)} aria-expanded={engineOpen}><span className="dot live" /> Demo engine <ChevronDown size={13} /></button>
            {engineOpen && (
              <div className="popover">
                <b>Demo engine</b>
                <p>当前使用本地确定性演示数据适配器，未连接真实计算引擎。</p>
                <div className="row"><span>Connection</span><span>Not configured</span></div>
                <div className="row"><span>Last check</span><span>刚刚</span></div>
                <div style={{ marginTop: 10 }}><Link to="/settings" onClick={() => setEngineOpen(false)}>Open engine settings</Link></div>
              </div>
            )}
          </div>
          <button className="icon-btn" title="Workspace settings" onClick={() => navigate('/settings')}><Settings2 size={17} /></button>
        </div>
      </header>

      <div className="app-body">
        <aside className="app-nav">
          <div className="nav-cta">
            <Link to="/experiments/new" className="btn btn-primary btn-block"><Plus size={15} /> New Experiment</Link>
          </div>
          <div className="nav-scroll">
            {sections.map((section) => (
              <div className="nav-group" key={section.label}>
                <div className="nav-group-label">{section.label}</div>
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link key={item.path + item.name} to={item.path} className={`nav-item ${isActive(item.path) ? 'active' : ''}`}>
                      <Icon size={16} />{item.name}
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>
          <div className="nav-foot">
            <Link to="/settings" className={`nav-item ${isActive('/settings') ? 'active' : ''}`}><Settings2 size={16} />Settings</Link>
            <Link to="/help" className="nav-item"><CircleHelp size={16} />Help & docs</Link>
            <div className="nav-user">
              <span className="avatar">MR</span>
              <span><b>Market Research</b><small>Local workspace</small></span>
              <ChevronRight size={15} />
            </div>
          </div>
        </aside>

        <main className="app-main"><Outlet /></main>
      </div>

      <div className="app-status">
        <span className="st-item"><span className="st-pulse" /><b>{runningTasks}</b> running</span>
        <span className="st-item">Engine <b>Demo</b></span>
        <span className="st-item">Queue <b>Local</b></span>
        <span className="st-item">Data <b className="mono">crypto-v3.2.1</b></span>
        <button onClick={() => setTasksOpen(true)}><TerminalSquare size={13} /> Task Center <ChevronRight size={13} /></button>
      </div>

      {tasksOpen && (
        <div className="scrim" onClick={() => setTasksOpen(false)}>
          <section className="drawer" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-head">
              <div><div className="eyebrow">Task Center</div><h2>Compute activity</h2></div>
              <button className="icon-btn" onClick={() => setTasksOpen(false)} aria-label="Close"><X size={17} /></button>
            </div>
            <div className="drawer-body">
              <div className="task-resources">
                <div><span>CPU</span><b>62%</b></div>
                <div><span>GPU</span><b>4 / 4</b></div>
                <div><span>Workers</span><b>8</b></div>
                <div><span>Queue</span><b>1</b></div>
              </div>
              {tasks.map((t) => (
                <div className="task-card" key={t.id}>
                  <div className="task-card-head"><b>{t.name}</b><span className="mono">{t.progress}%</span></div>
                  <div className="progress thin"><span style={{ width: `${t.progress}%` }} /></div>
                  <div className="task-meta"><span>{t.type} · {t.detail}</span><span>{t.status}</span></div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {paletteOpen && (
        <div className="palette-wrap" onClick={() => setPaletteOpen(false)}>
          <section className="palette" onClick={(e) => e.stopPropagation()}>
            <div className="palette-input">
              <Search size={18} />
              <input autoFocus value={query} onChange={(e) => { setQuery(e.target.value); setIndex(0); }} placeholder="Jump to a page, project, or action" />
              <kbd className="kbd">ESC</kbd>
            </div>
            <div className="palette-list">
              {results.length === 0 ? (
                <div className="palette-empty">No matches</div>
              ) : (
                results.map((item, i) => {
                  const Icon = item.icon;
                  const showGroup = i === 0 || results[i - 1].group !== item.group;
                  return (
                    <div key={item.path + item.label}>
                      {showGroup && <div className="palette-group">{item.group}</div>}
                      <button className={`palette-item ${i === index ? 'active' : ''}`} onMouseEnter={() => setIndex(i)} onClick={() => { navigate(item.path); setPaletteOpen(false); }}>
                        <Icon size={16} />{item.label}<kbd className="kbd">↵</kbd>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default MainLayout;
