import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  Activity, BarChart3, Boxes, ChevronDown, ChevronRight, CircleHelp, Database,
  FlaskConical, Gauge, GitBranch, GitCompareArrows, Layers3, Menu, PanelRight,
  Search, Settings2, Sparkles, TerminalSquare, Workflow, X,
} from 'lucide-react';
import { useI18n } from '../i18n';

const sections = [
  { label: 'OVERVIEW', items: [{ name: 'Overview', path: '/', icon: Gauge }] },
  { label: 'RESEARCH', items: [
    { name: 'Research Idea', path: '/idea', icon: Sparkles }, { name: 'Mining', path: '/launchpad', icon: FlaskConical },
    { name: 'Experiments', path: '/experiments', icon: Workflow }, { name: 'Evolution', path: '/evolution', icon: GitBranch },
  ] },
  { label: 'FACTORS', items: [
    { name: 'Library', path: '/inspector', icon: Layers3 }, { name: 'Inspector', path: '/inspector', icon: TerminalSquare },
    { name: 'Compare', path: '/compare', icon: GitCompareArrows }, { name: 'Lineage', path: '/lineage', icon: GitBranch },
  ] },
  { label: 'VALIDATION', items: [
    { name: 'IC Analysis', path: '/validation', icon: BarChart3 }, { name: 'Stability', path: '/validation', icon: Activity },
  ] },
  { label: 'DATA & ENGINE', items: [
    { name: 'Datasets', path: '/data', icon: Database }, { name: 'Universe', path: '/data', icon: Boxes },
  ] },
];

export function MainLayout() {
  const location = useLocation();
  const { language, setLanguage } = useI18n();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [tasksOpen, setTasksOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const toggle = (label: string) => setCollapsed((current) => ({ ...current, [label]: !current[label] }));

  return (
    <div className="research-shell">
      <header className="top-context-bar">
        <Link to="/" className="brand-mark"><span className="brand-glyph">ƒ</span><span>FactorMiner <b>V4</b></span></Link>
        <div className="context-divider" />
        <div className="research-context"><span className="context-label">RESEARCH CONTEXT</span><span>Crypto Top50</span><i /> <span>1H</span><i /> <span>Target +4H</span><i /> <span>Data v2026.09</span><i /> <span>OOS 2026</span><i /> <span>Cost 5bps</span></div>
        <div className="top-actions">
          <button className="icon-button" onClick={() => setPaletteOpen(true)} aria-label="Open command palette"><Search size={15} /><kbd>⌘ K</kbd></button>
          <span className="engine-status"><span className="status-dot" /> Engine healthy</span>
          <select value={language} onChange={(event) => setLanguage(event.target.value as typeof language)} aria-label="Language"><option value="zh">中</option><option value="en">EN</option></select>
          <button className="icon-button" aria-label="Settings"><Settings2 size={16} /></button>
        </div>
      </header>

      <div className="workstation-body">
        <aside className="sidebar">
          <div className="sidebar-head"><span>WORKSPACE</span><button className="icon-button" aria-label="Collapse sidebar"><Menu size={15} /></button></div>
          <div className="sidebar-scroll">
            {sections.map((section) => <div className="nav-section" key={section.label}>
              <button className="section-label" onClick={() => toggle(section.label)}>{section.label}<ChevronDown size={12} className={collapsed[section.label] ? 'rotate-[-90deg]' : ''} /></button>
              {!collapsed[section.label] && section.items.map((item) => {
                const active = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
                const Icon = item.icon;
                return <Link key={`${section.label}-${item.name}`} to={item.path} className={`nav-item ${active ? 'active' : ''}`}><Icon size={15} />{item.name}{item.name === 'Mining' && <span className="nav-badge">3</span>}</Link>;
              })}
            </div>)}
          </div>
          <div className="sidebar-bottom"><Link to="/data" className="nav-item"><CircleHelp size={15} />Documentation</Link><div className="user-row"><span className="avatar">MR</span><span><b>Market Research</b><small>Local workspace</small></span><ChevronRight size={14} /></div></div>
        </aside>

        <main className="workspace"><Outlet /></main>
        <aside className="right-rail"><div className="rail-header"><span>CONTEXT</span><PanelRight size={14} /></div><div className="rail-block"><span className="rail-kicker">ACTIVE DATASET</span><b>Crypto_Perpetual_1H_v12</b><span>83 assets · 17 features</span></div><div className="rail-block"><span className="rail-kicker">CURRENT TARGET</span><b>Forward Return +4H</b><span>Cross-sectional · cost adjusted</span></div><div className="rail-block"><span className="rail-kicker">RESEARCH SESSION</span><div className="session-line"><span className="status-dot" />Session synced</div><span>Last saved 2 minutes ago</span></div><button className="rail-link">Open session details <ChevronRight size={13} /></button></aside>
      </div>

      <button className="task-status-bar" onClick={() => setTasksOpen(true)}><span className="task-pulse" /><b>3 Running</b><span>18,420 Candidates</span><span>47 Accepted</span><span>GPU 38%</span><span>CPU 22%</span><span className="task-open">Open Task Center <ChevronRight size={13} /></span></button>

      {tasksOpen && <div className="drawer-backdrop" onClick={() => setTasksOpen(false)}><section className="task-drawer" onClick={(event) => event.stopPropagation()}><div className="drawer-title"><div><span className="rail-kicker">TASK CENTER</span><h2>Compute activity</h2></div><button className="icon-button" onClick={() => setTasksOpen(false)} aria-label="Close task center"><X size={16} /></button></div>{[['GP Mining #184',78,'Generation 31 / 40','Best fitness .083'],['LLM Mining #185',54,'Candidate 81 / 150','Best OOS IC .054'],['Dataset Update',100,'Coverage validation','Completed']].map(([name, progress, detail, note]) => <div className="task-card" key={name as string}><div className="task-card-head"><b>{name as string}</b><span>{progress as number}%</span></div><div className="progress-track"><span style={{ width: `${progress}%` }} /></div><div className="task-meta"><span>{detail as string}</span><span>{note as string}</span></div></div>)}</section></div>}
      {paletteOpen && <div className="drawer-backdrop" onClick={() => setPaletteOpen(false)}><section className="command-palette" onClick={(event) => event.stopPropagation()}><div className="command-input"><Search size={17} /><input autoFocus placeholder="Search factors, experiments, commands..." /><kbd>ESC</kbd></div><div className="command-list"><span className="rail-kicker">QUICK ACTIONS</span>{['Search Factor','Launch Mining','Open Experiment','Compare Factors','Run Walk Forward','Open Dataset'].map((command, index) => <button key={command} onClick={() => setPaletteOpen(false)}><span className="command-key">{index + 1}</span>{command}<kbd>↵</kbd></button>)}</div></section></div>}
    </div>
  );
}

export default MainLayout;
