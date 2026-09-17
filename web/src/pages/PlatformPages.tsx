import { useMemo, useState } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import {
  ArrowRight, AlertTriangle, Check, Clipboard, Download, FlaskConical, GitCompareArrows, Play, Plus, RefreshCw, Search, Sparkles, Target, TrendingDown, TrendingUp,
} from 'lucide-react';
import {
  candidates, datasets, experiments, factorLineage, factors, featureGroups, icSeries, miners, operators, projects,
  reports, researchContext, researchIdeas, runs, targets, tasks, universes, validationChecks, validationResults,
} from '../data/researchData';
import { PageHead, Panel, PanelHead, Pill, Metrics, LineChart, BarChart, DivergingBars, Waterfall, Gauge, ConclusionCard, Empty } from '../components/ui';

/* ============================ Research Idea ============================ */

export function Ideas() {
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem('fm-ideas') || 'null') || researchIdeas; } catch { return researchIdeas; }
  });
  const [selected, setSelected] = useState<string>(items[0]?.id);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ title: '', hypothesis: '', tag: '均值回归' });

  const active = items.find((i: any) => i.id === selected) || items[0];
  const save = () => {
    if (!draft.title.trim() || !draft.hypothesis.trim()) return;
    const next = [{ id: `idea-${Date.now()}`, title: draft.title, hypothesis: draft.hypothesis, status: '草稿', updated: '刚刚', experiments: [], tags: [draft.tag] }, ...items];
    setItems(next); localStorage.setItem('fm-ideas', JSON.stringify(next)); setEditing(false); setSelected(next[0].id); setDraft({ title: '', hypothesis: '', tag: '均值回归' });
  };

  return (
    <div className="page">
      <PageHead eyebrow="Research" title="Research Ideas" description="把研究问题、假设与验证标准记录为可追踪的研究起点，并据此创建 Project 或 Experiment。" actions={<button className="btn btn-primary" onClick={() => setEditing(true)}><Plus size={15} /> New idea</button>} />
      <div className="split-l">
        <Panel>
          <PanelHead eyebrow="Ideas" title={`${items.length} hypotheses`} />
          <div className="option-list" style={{ padding: 12 }}>
            {items.map((idea: any) => (
              <button key={idea.id} className={`option ${active?.id === idea.id ? 'active' : ''}`} onClick={() => { setSelected(idea.id); setEditing(false); }}>
                <span style={{ flex: 1 }}>
                  <b>{idea.title}</b>
                  <small>{idea.hypothesis}</small>
                  <span className="tag-row" style={{ marginTop: 8 }}>
                    <span className="pill pill-neutral no-dot">{idea.status}</span>
                    {idea.experiments.length > 0 && <span className="tag">{idea.experiments.length} experiments</span>}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </Panel>

        {editing ? (
          <Panel>
            <PanelHead eyebrow="New idea" title="Record a research hypothesis" />
            <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <label className="field"><span>研究问题 / 标题</span><input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="例如：极端资金费率后的短周期反转" /></label>
              <label className="field"><span>假设 (Hypothesis)</span><textarea rows={4} value={draft.hypothesis} onChange={(e) => setDraft({ ...draft, hypothesis: e.target.value })} placeholder="描述可验证的市场假设与预期方向" /></label>
              <label className="field"><span>研究主题标签</span><select value={draft.tag} onChange={(e) => setDraft({ ...draft, tag: e.target.value })}><option>均值回归</option><option>资金费率</option><option>横截面</option><option>波动率</option></select></label>
              <div style={{ display: 'flex', gap: 8 }}><button className="btn btn-primary" onClick={save}><Check size={15} /> Save idea</button><button className="btn" onClick={() => setEditing(false)}>Cancel</button></div>
            </div>
          </Panel>
        ) : active ? (
          <div>
            <Panel>
              <PanelHead eyebrow="Hypothesis" title={active.title} aside={<Pill>{active.status}</Pill>} />
              <div className="panel-body">
                <p style={{ margin: 0, fontSize: 14, color: 'var(--text)', lineHeight: 1.6 }}>{active.hypothesis}</p>
                <div className="tag-row" style={{ marginTop: 14 }}>{active.tags?.map((t: string) => <span key={t} className="tag">{t}</span>)}</div>
              </div>
              <div className="panel-note">Updated {active.updated}</div>
            </Panel>
            <Panel>
              <PanelHead eyebrow="Turn into research" title="Create experiment from idea" />
              <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <label className="field"><span>Target project</span><select defaultValue={projects[0].id}>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
                <div style={{ display: 'flex', gap: 8 }}><Link className="btn btn-primary" to="/mining"><FlaskConical size={15} /> Configure experiment</Link><button className="btn">Attach existing experiment</button></div>
              </div>
            </Panel>
            {active.experiments.length > 0 && (
              <Panel>
                <PanelHead eyebrow="Linked" title="Experiments from this idea" />
                <div className="table-wrap"><table className="data"><tbody>{active.experiments.map((eid: string) => { const e = experiments.find((x) => x.id === eid); return <tr key={eid}><td><Link className="text-link" to={`/experiments/${eid}`}>{e?.name || eid}</Link></td><td><Pill>{e?.status}</Pill></td></tr>; })}</tbody></table></div>
              </Panel>
            )}
          </div>
        ) : <Empty title="No idea selected" />}
      </div>
    </div>
  );
}

/* ============================ Experiments ============================ */

export function Experiments() {
  const { id } = useParams();
  const [query, setQuery] = useState('');
  const scoped = id ? experiments.filter((e) => e.projectId === id) : experiments;
  const list = scoped.filter((e) => `${e.name}${e.miner}${e.status}`.toLowerCase().includes(query.toLowerCase()));
  const project = id ? projects.find((p) => p.id === id) : undefined;

  const table = (
    <Panel>
      <div className="table-wrap">
        <table className="data">
          <thead><tr><th>Experiment</th><th>Miner</th><th>Status</th><th>Latest run</th><th className="num-cell">Runs</th><th className="num-cell">Candidates</th><th>Updated</th></tr></thead>
          <tbody>
            {list.map((e) => (
              <tr key={e.id}>
                <td><Link className="cell-main text-link" to={`/experiments/${e.id}`}>{e.name}</Link><span className="cell-sub">{e.researchQuestion}</span></td>
                <td><span className="tag">{e.miner}</span></td>
                <td><Pill>{e.status}</Pill></td>
                <td><Pill>{e.latestRunStatus}</Pill></td>
                <td className="mono num-cell">{e.totalRuns}</td>
                <td className="mono num-cell">{e.candidates.toLocaleString()}</td>
                <td style={{ fontSize: 12, color: 'var(--text-4)' }}>{e.updated}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );

  if (project) {
    return (
      <div className="page">
        <div className="scope-head">
          <div className="eyebrow">Project · {project.id}</div>
          <div className="scope-top"><div><h1>{project.name}</h1><p className="scope-desc">项目范围内���研究设计。</p></div><Link className="btn btn-primary" to="/mining"><Plus size={15} /> New experiment</Link></div>
          <div className="tabs">{[['Overview', `/projects/${project.id}`], ['Experiments', `/projects/${project.id}/experiments`], ['Runs', `/projects/${project.id}/runs`], ['Factors', `/projects/${project.id}/factors`], ['Validation', `/projects/${project.id}/validation`]].map(([l, t]) => <Link key={l} to={t} className={l === 'Experiments' ? 'active' : ''}>{l}</Link>)}</div>
        </div>
        <div className="toolbar"><div className="search"><Search size={15} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="搜索实验" /></div></div>
        {table}
      </div>
    );
  }

  return (
    <div className="page">
      <PageHead eyebrow="Workspace" title="Experiments" description="一个 Experiment 描述一次研究设计（我们在测试什么），并可产生多个可复现的 Run。" actions={<Link className="btn btn-primary" to="/mining"><Plus size={15} /> New experiment</Link>} />
      <div className="toolbar"><div className="search"><Search size={15} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="搜索实验、Miner 或状态" /><span /></div><button className="btn">Status: All</button><button className="btn">Miner: All</button></div>
      {table}
    </div>
  );
}

export function ExperimentDetail() {
  const { id = 'exp-184' } = useParams();
  const experiment = experiments.find((e) => e.id === id) || experiments[0];
  const project = projects.find((p) => p.id === experiment.projectId);
  const expRuns = runs.filter((r) => r.experimentId === experiment.id);
  const [tab, setTab] = useState('Overview');
  const tabs = ['Overview', 'Configuration', 'Runs', 'Candidates', 'Factors', 'Artifacts'];

  return (
    <div className="page">
      <div className="scope-head">
        <div className="eyebrow">Experiment · {experiment.id}</div>
        <div className="scope-top">
          <div><h1>{experiment.name}</h1><p className="scope-desc">{experiment.researchQuestion}</p></div>
          <div className="head-actions"><button className="btn"><Clipboard size={14} /> Duplicate config</button><button className="btn btn-primary"><Play size={15} /> New run</button></div>
        </div>
        <dl className="scope-meta">
          <div><dt>Status</dt><dd><Pill>{experiment.status}</Pill></dd></div>
          <div><dt>Project</dt><dd><Link className="text-link" to={`/projects/${experiment.projectId}`}>{project?.name}</Link></dd></div>
          <div><dt>Miner</dt><dd>{experiment.miner}</dd></div>
          <div><dt>Total runs</dt><dd className="mono">{experiment.totalRuns}</dd></div>
          <div><dt>Active runs</dt><dd className="mono">{experiment.activeRuns}</dd></div>
          <div><dt>Search space</dt><dd style={{ fontSize: 12 }}>{experiment.searchSpace}</dd></div>
        </dl>
        <div className="tabs">{tabs.map((t) => <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>{t}</button>)}</div>
      </div>

      {tab === 'Overview' && (
        <div className="split">
          <Panel>
            <PanelHead eyebrow="Runs" title="Execution history" />
            <div className="table-wrap"><table className="data"><thead><tr><th>Run</th><th>Status</th><th>Progress</th><th className="num-cell">Factors</th></tr></thead><tbody>{expRuns.map((r) => <tr key={r.id}><td><Link className="cell-main text-link" to={`/runs/${r.id}`}>{r.id}</Link><span className="cell-sub mono">seed {r.seed}</span></td><td><Pill>{r.status}</Pill></td><td><div className="table-progress"><div className="progress thin"><span style={{ width: `${r.progress}%` }} /></div><small>{r.progress}%</small></div></td><td className="mono num-cell">{r.factors}</td></tr>)}</tbody></table></div>
          </Panel>
          <Panel>
            <PanelHead eyebrow="Design" title="Research question" />
            <div className="panel-body">
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6 }}>{experiment.researchQuestion}</p>
              <dl className="kv" style={{ marginTop: 16 }}>
                <dt>Universe</dt><dd className="mono">{project?.defaultUniverse}</dd>
                <dt>Target</dt><dd>{project?.defaultTarget}</dd>
                <dt>Validation</dt><dd>{project?.validationPolicy}</dd>
              </dl>
            </div>
          </Panel>
        </div>
      )}

      {tab === 'Configuration' && (
        <Panel><div className="panel-body"><pre className="code-block">{JSON.stringify({ miner: experiment.miner, universe: project?.defaultUniverse, timeframe: project?.defaultTimeframe, target: project?.defaultTarget, features: featureGroups, operators, fitness: 'RankIC - λ·turnover', split: { train: '2022.01—2024.12', validation: '2025.01—2025.06', oos: '2025.07—2026.08' }, validationPolicy: project?.validationPolicy, seed: 42 }, null, 2)}</pre></div></Panel>
      )}
      {tab === 'Runs' && <Panel><div className="table-wrap"><table className="data"><thead><tr><th>Run</th><th>Status</th><th>Started</th><th className="num-cell">Candidates</th><th className="num-cell">Factors</th></tr></thead><tbody>{expRuns.map((r) => <tr key={r.id}><td><Link className="text-link mono" to={`/runs/${r.id}`}>{r.id}</Link></td><td><Pill>{r.status}</Pill></td><td>{r.started}</td><td className="mono num-cell">{r.candidates.toLocaleString()}</td><td className="mono num-cell">{r.factors}</td></tr>)}</tbody></table></div></Panel>}
      {tab === 'Candidates' && <Panel><div className="table-wrap"><table className="data"><thead><tr><th>Candidate</th><th>Expression</th><th className="num-cell">IC</th><th>Outcome</th></tr></thead><tbody>{candidates.map((c) => <tr key={c.id}><td className="mono" style={{ fontSize: 12 }}>{c.id}</td><td className="mono" style={{ fontSize: 12 }}>{c.expression}</td><td className="mono num-cell">{c.ic.toFixed(3)}</td><td>{c.kept ? <Link className="text-link" to={`/inspector?factor=${c.savedFactorId}`}>Saved</Link> : <span className="pill pill-neutral no-dot">Discarded</span>}</td></tr>)}</tbody></table></div></Panel>}
      {tab === 'Factors' && <Panel><div className="table-wrap"><table className="data"><thead><tr><th>Factor</th><th>Lifecycle</th><th className="num-cell">IC</th><th className="num-cell">OOS IC</th></tr></thead><tbody>{factors.filter((f) => f.experimentId === experiment.id).map((f) => <tr key={f.id}><td><Link className="text-link" to={`/inspector?factor=${f.id}`}>{f.name}</Link></td><td><Pill>{f.lifecycle}</Pill></td><td className="mono num-cell">{f.ic.toFixed(3)}</td><td className="mono num-cell">{f.oosIc.toFixed(3)}</td></tr>)}</tbody></table></div></Panel>}
      {tab === 'Artifacts' && <Panel><div className="panel-body"><Empty inline title={`${experiment.miner} artifacts`} text={`该实验使用 ${experiment.miner} miner。Artifact（表达式树 / 生成代码 / 动作序列 / 模型）在每个 Run 完成后生成，可在具体 Run 或 Factor Inspector 中查看。`} action={expRuns[0] ? <Link className="btn" to={`/runs/${expRuns[0].id}`}>Open latest run</Link> : undefined} /></div></Panel>}
    </div>
  );
}

/* ============================ Mining / Experiment Builder ============================ */

export function MiningFlow() {
  const [miner, setMiner] = useState('GP');
  const [selectedFeatures, setSelectedFeatures] = useState(featureGroups.slice(0, 4));
  const [selectedOps, setSelectedOps] = useState(operators.slice(0, 3));

  const minerMeta = miners.find((m) => m.code === miner)!;

  return (
    <div className="page page-wide">
      <PageHead eyebrow="Research · Experiment Builder" title="Mining Experiment" description="配置一次可复现的因子搜索。保存为 Experiment，或直接保存并执行一个 Run。" actions={<><button className="btn"><Clipboard size={15} /> Save experiment</button><button className="btn btn-primary"><Play size={15} /> Save & run</button></>} />
      <div className="split">
        <div>
          <Panel>
            <PanelHead eyebrow="Method" title="Miner" />
            <div className="panel-body">
              <div className="segmented" style={{ marginBottom: 14 }}>{miners.map((m) => <button key={m.code} className={miner === m.code ? 'active' : ''} onClick={() => setMiner(m.code)} disabled={m.status === 'Not connected'}>{m.code}</button>)}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--text-2)' }}>
                <b style={{ color: 'var(--text)' }}>{minerMeta.name}</b>
                <Pill tone={minerMeta.status === 'Ready' ? 'success' : 'neutral'}>{minerMeta.status}</Pill>
              </div>
              <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--text-3)' }}>{minerMeta.note} · Artifact: <span className="mono">{minerMeta.artifact}</span></p>
            </div>
          </Panel>

          <Panel>
            <PanelHead eyebrow="Research context" title="Data & target" aside={<span style={{ fontSize: 12, color: 'var(--text-3)' }}>继承自 Project 默认，可 override</span>} />
            <div className="panel-body">
              <div className="field-grid">
                <label className="field"><span>Dataset</span><select><option>Crypto Perpetual 1H v12</option><option>Orderbook Features v4</option></select></label>
                <label className="field"><span>Universe</span><select>{universes.map((u) => <option key={u.name}>{u.name}</option>)}</select></label>
                <label className="field"><span>Timeframe</span><select><option>1H</option><option>4H</option><option>5m</option></select></label>
                <label className="field"><span>Target</span><select>{targets.map((t) => <option key={t.name}>{t.name}</option>)}</select></label>
                <label className="field"><span>Transaction cost</span><input defaultValue="5 bps" /></label>
                <label className="field"><span>Validation policy</span><select><option>Standard Alpha Validation v3</option><option>Microstructure Validation v2</option></select></label>
              </div>
            </div>
          </Panel>

          <Panel>
            <PanelHead eyebrow="Search space" title="Features" aside={<span style={{ fontSize: 12, color: 'var(--text-3)' }}>{selectedFeatures.length} selected</span>} />
            <div className="panel-body"><div className="tag-row">{featureGroups.map((f) => <button key={f} className={`chip-toggle ${selectedFeatures.includes(f) ? 'on' : ''}`} onClick={() => setSelectedFeatures((s) => s.includes(f) ? s.filter((x) => x !== f) : [...s, f])}>{selectedFeatures.includes(f) && <Check size={13} />}{f}</button>)}</div></div>
          </Panel>

          <Panel>
            <PanelHead eyebrow="Search space" title="Operators" aside={<span style={{ fontSize: 12, color: 'var(--text-3)' }}>{selectedOps.length} selected</span>} />
            <div className="panel-body"><div className="tag-row">{operators.map((o) => <button key={o} className={`chip-toggle ${selectedOps.includes(o) ? 'on' : ''}`} onClick={() => setSelectedOps((s) => s.includes(o) ? s.filter((x) => x !== o) : [...s, o])}>{selectedOps.includes(o) && <Check size={13} />}{o}</button>)}</div></div>
          </Panel>
        </div>

        <div>
          <Panel>
            <PanelHead eyebrow="Data split" title="Train / Validation / OOS" />
            <div className="panel-body">
              <dl className="kv">
                <dt>Train</dt><dd className="mono">2022.01 — 2024.12</dd>
                <dt>Validation</dt><dd className="mono">2025.01 — 2025.06</dd>
                <dt>OOS</dt><dd className="mono">2025.07 — 2026.08</dd>
              </dl>
              <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 12 }}>使用 Purging / Embargo 的时序切分以降低前视泄漏。</p>
            </div>
          </Panel>
          <Panel>
            <PanelHead eyebrow="Objective" title="Fitness" />
            <div className="panel-body">
              <label className="field"><span>Fitness function</span><select><option>RankIC - λ·turnover</option><option>IC</option><option>ICIR</option></select></label>
              {miner === 'GP' && <label className="field" style={{ marginTop: 12 }}><span>Max expression depth</span><input defaultValue="8" /></label>}
              {miner === 'RL' && <label className="field" style={{ marginTop: 12 }}><span>Reward shaping</span><input defaultValue="IC delta per step" /></label>}
              {miner === 'LLM' && <label className="field" style={{ marginTop: 12 }}><span>Reflection rounds</span><input defaultValue="3" /></label>}
            </div>
          </Panel>
          <Panel>
            <div className="panel-body">
              <div className="banner banner-info"><Sparkles size={15} /> 当前为 Demo 引擎，保存后将创建确定性演示 Run。</div>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

/* ============================ Factor Library ============================ */

export function FactorLibrary() {
  const { id } = useParams();
  const [query, setQuery] = useState('');
  const [chosen, setChosen] = useState<string[]>([]);
  const list = useMemo(() => factors.filter((f) => `${f.name}${f.expression}${f.tags.join(' ')}`.toLowerCase().includes(query.toLowerCase())), [query]);
  const project = id ? projects.find((p) => p.id === id) : undefined;

  const table = (
    <Panel>
      <div className="table-wrap">
        <table className="data">
          <thead><tr><th style={{ width: 32 }} /><th>Factor</th><th>Lifecycle</th><th>Miner</th><th className="num-cell">IC</th><th className="num-cell">RankIC</th><th className="num-cell">ICIR</th><th className="num-cell">OOS IC</th><th className="num-cell">Turnover</th><th>Origin</th></tr></thead>
          <tbody>
            {list.map((f) => (
              <tr key={f.id}>
                <td><input type="checkbox" checked={chosen.includes(f.id)} disabled={!chosen.includes(f.id) && chosen.length >= 4} onChange={() => setChosen((s) => s.includes(f.id) ? s.filter((x) => x !== f.id) : [...s, f.id])} /></td>
                <td><Link className="cell-main text-link" to={`/inspector?factor=${f.id}`}>{f.name}</Link><span className="cell-expr">{f.expression}</span></td>
                <td><Pill>{f.lifecycle}</Pill></td>
                <td><span className="tag">{f.miner}</span></td>
                <td className="mono num-cell">{f.ic.toFixed(3)}</td>
                <td className="mono num-cell">{f.rankIc.toFixed(3)}</td>
                <td className="mono num-cell">{f.icir.toFixed(2)}</td>
                <td className="mono num-cell">{f.oosIc.toFixed(3)}</td>
                <td className="mono num-cell">{f.turnover.toFixed(1)}%</td>
                <td><Link className="text-link mono" style={{ fontSize: 12 }} to={`/experiments/${f.experimentId}`}>{f.experimentId}</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );

  const toolbar = (
    <div className="toolbar">
      <div className="search"><Search size={15} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="搜索名称、表达式或标签" /></div>
      <button className="btn">Lifecycle: All</button>
      <button className="btn">Sort: OOS IC</button>
      <div className="toolbar-spacer" />
      {chosen.length > 0 && <Link className="btn btn-primary" to="/compare"><GitCompareArrows size={15} /> Compare ({chosen.length}/4)</Link>}
      <button className="btn"><Download size={15} /> Export</button>
    </div>
  );

  if (project) {
    return (
      <div className="page">
        <div className="scope-head">
          <div className="eyebrow">Project · {project.id}</div>
          <div className="scope-top"><div><h1>{project.name}</h1><p className="scope-desc">项目内产生或使用的因子。Origin 表示来源，不代表所有权。</p></div></div>
          <div className="tabs">{[['Overview', `/projects/${project.id}`], ['Experiments', `/projects/${project.id}/experiments`], ['Runs', `/projects/${project.id}/runs`], ['Factors', `/projects/${project.id}/factors`], ['Validation', `/projects/${project.id}/validation`]].map(([l, t]) => <Link key={l} to={t} className={l === 'Factors' ? 'active' : ''}>{l}</Link>)}</div>
        </div>
        {toolbar}{table}
      </div>
    );
  }

  return (
    <div className="page">
      <PageHead eyebrow="Factors" title="Factor Library" description="Workspace 级研究资产。因子可被多个 Project 复用、重新验证并进入组合。指标始终绑定验证上下文。" />
      {toolbar}{table}
    </div>
  );
}

/* ============================ Factor Inspector ============================ */

export function InspectorPage() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const factor = factors.find((f) => f.id === params.get('factor')) || factors[0];
  const [tab, setTab] = useState('Overview');
  const [ctx, setCtx] = useState('+4H');
  const validation = validationResults.find((r) => r.factorId === factor.id && r.target === ctx);
  const lineage = factorLineage[factor.id] || [];
  const tabs = ['Overview', 'Validation', 'IC Analysis', 'Stability', 'Regime', 'Lineage', 'Artifact'];

  return (
    <div className="page">
      <div className="scope-head">
        <div className="eyebrow">Factor · {factor.id}</div>
        <div className="scope-top">
          <div><h1 className="mono" style={{ fontSize: 20 }}>{factor.name}</h1><p className="scope-desc mono" style={{ fontSize: 13 }}>{factor.expression}</p></div>
          <div className="head-actions"><button className="btn"><GitCompareArrows size={14} /> Compare</button><button className="btn btn-primary"><Play size={15} /> Run validation</button></div>
        </div>
        <dl className="scope-meta">
          <div><dt>Lifecycle</dt><dd><Pill>{factor.lifecycle}</Pill></dd></div>
          <div><dt>Miner</dt><dd>{factor.miner}</dd></div>
          <div><dt>Origin project</dt><dd><Link className="text-link" to={`/projects/${factor.originProjectId}`}>{factor.originProjectId}</Link></dd></div>
          <div><dt>Origin experiment</dt><dd><Link className="text-link mono" to={`/experiments/${factor.experimentId}`}>{factor.experimentId}</Link></dd></div>
          <div><dt>Origin run</dt><dd><Link className="text-link mono" to={`/runs/${factor.runId}`}>{factor.runId}</Link></dd></div>
          <div><dt>Complexity</dt><dd className="mono">{factor.complexity.toFixed(2)}</dd></div>
        </dl>
        <div className="tabs">{tabs.map((t) => <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>{t}</button>)}</div>
      </div>

      <div className="banner banner-info" style={{ marginBottom: 16 }}>
        <span style={{ fontWeight: 600 }}>Validation context</span>
        <select value={ctx} onChange={(e) => setCtx(e.target.value)} className="input" style={{ height: 30, background: 'var(--surface)', marginLeft: 4 }}>
          <option value="+4H">Project default · Target +4H · Policy v3</option>
          <option value="+24H">Target +24H · Policy v3</option>
        </select>
        <span style={{ marginLeft: 'auto' }}>Decision: <Pill>{validation?.decision || 'Pending'}</Pill></span>
      </div>

      <Metrics items={[
        { label: `IC · ${ctx}`, value: (validation?.ic ?? factor.ic).toFixed(3) },
        { label: 'RankIC', value: (validation?.rankIc ?? factor.rankIc).toFixed(3) },
        { label: 'ICIR', value: (validation?.icir ?? factor.icir).toFixed(2) },
        { label: 'OOS IC', value: (validation?.oosIc ?? factor.oosIc).toFixed(3) },
        { label: 'Turnover', value: `${factor.turnover.toFixed(1)}%` },
      ]} />

      <div style={{ marginTop: 16 }}>
        {tab === 'Overview' && (
          <>
          <ConclusionCard
            title={`验证结论 · Target ${ctx}`}
            status={validation?.decision || 'Pending'}
            statusTone={validation?.decision === 'Accepted' ? 'success' : validation?.decision === 'Rejected' ? 'danger' : 'warn'}
            points={[
              { label: 'Mean IC', icon: <Target size={13} />, value: (validation?.ic ?? factor.ic).toFixed(3), tone: (validation?.ic ?? factor.ic) >= 0 ? 'pos' : 'neg' },
              { label: '样本外 (OOS IC)', icon: <TrendingUp size={13} />, value: `${(validation?.oosIc ?? factor.oosIc).toFixed(3)} · ICIR ${(validation?.icir ?? factor.icir).toFixed(2)}` },
              { label: '主要风险', icon: <TrendingDown size={13} />, value: '高波动区间 IC 衰减明显', tone: 'neg' },
              { label: 'Policy', icon: <AlertTriangle size={13} />, value: validation?.policy || 'Standard Alpha Validation v3' },
            ]}
            highlights={validation?.decision === 'Accepted' ? ['换手率接近上限', 'OOS 窗口需持续跟踪'] : ['高波动 regime 未通过', '建议缩短持有周期', '样本外 IC 偏低']}
          />
          <div className="split">
            <div>
              <Panel>
                <PanelHead eyebrow="Expression" title="Factor definition" />
                <div className="panel-body"><div className="expr"><code>{factor.expression}</code><button className="btn btn-sm"><Clipboard size={13} /> Copy</button></div></div>
              </Panel>
              <Panel>
                <PanelHead eyebrow="Research origin" title="Provenance" aside={<span style={{ fontSize: 12, color: 'var(--text-3)' }}>Origin ≠ ownership</span>} />
                <div className="panel-body">
                  <div className="origin-chain">
                    <span className="oc-node"><small>Project</small> {factor.originProjectId}</span><ArrowRight size={14} />
                    <span className="oc-node"><small>Experiment</small> {factor.experimentId}</span><ArrowRight size={14} />
                    <span className="oc-node"><small>Run</small> {factor.runId}</span><ArrowRight size={14} />
                    <span className="oc-node"><small>Factor</small> {factor.id}</span>
                  </div>
                </div>
              </Panel>
            </div>
            <Panel>
              <PanelHead eyebrow="Context" title="Validation decisions" />
              <div className="table-wrap"><table className="data"><thead><tr><th>Context</th><th>Decision</th><th className="num-cell">IC</th></tr></thead><tbody>{validationResults.filter((r) => r.factorId === factor.id).map((r) => <tr key={r.id}><td>Target {r.target}<span className="cell-sub">{r.policy}</span></td><td><Pill>{r.decision}</Pill></td><td className="mono num-cell">{r.ic.toFixed(3)}</td></tr>)}</tbody></table></div>
              <div className="panel-note">同一因子在不同 Target / Policy 下可得到不同结论。</div>
            </Panel>
          </div>
          </>
        )}

        {tab === 'Validation' && (
          <Panel>
            <PanelHead eyebrow={`Context · Target ${ctx}`} title="Validation checklist" aside={<Pill>{validation?.decision || 'Pending'}</Pill>} />
            <div className="panel-body">
              <div className="checks">
                {validationChecks.map((c) => (
                  <div className="check-row" key={c.key}>
                    <span className={`check-icon ${c.passed ? 'ok' : 'no'}`}>{c.passed ? <Check size={13} /> : <span style={{ fontWeight: 700 }}>!</span>}</span>
                    <b>{c.key}</b><span className="check-metric">{c.metric}</span>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 14 }}>决策基于 {validation?.policy || 'Standard Alpha Validation v3'}，作用于 Target {ctx}。</p>
            </div>
          </Panel>
        )}

        {tab === 'IC Analysis' && (
          <Panel>
            <PanelHead eyebrow={`Context · Target ${ctx}`} title="Rolling IC (train → OOS)" aside={<span style={{ fontSize: 12, color: 'var(--text-3)' }}>悬停查看每期取值</span>} />
            <div className="panel-body">
              <LineChart
                series={icSeries(factor.turnover, 40)}
                benchmark={icSeries(factor.turnover + 6, 40).map((v) => v * 0.6)}
                seriesLabel="Rolling IC" benchmarkLabel="Universe 平均"
                labels={Array.from({ length: 40 }, (_, i) => `W${i + 1}`)}
                oosFrom={28} height={210}
              />
              <div className="chart-legend"><span><i />Rolling IC</span><span><i className="bench" />Universe 平均</span><span><i className="oos" />OOS window</span><span>Baseline IC = 0</span></div>
            </div>
            <div className="panel-note">IC 对应 Dataset crypto-v3.2.1 · Universe Crypto Top50 · Target {ctx}。</div>
          </Panel>
        )}

        {tab === 'Stability' && (
          <Panel>
            <PanelHead eyebrow={`Context · Target ${ctx}`} title="Yearly IC" />
            <div className="panel-body"><BarChart series={[{ label: '2022', value: 0.058 }, { label: '2023', value: 0.064 }, { label: '2024', value: 0.049 }, { label: '2025', value: 0.041 }, { label: 'OOS', value: 0.031, muted: true }]} /><div className="chart-legend"><span>数值为各期平均 IC</span></div></div>
          </Panel>
        )}

        {tab === 'Regime' && (
          <Panel>
            <PanelHead eyebrow={`Context · Target ${ctx}`} title="Regime breakdown" />
            <div className="panel-body"><BarChart series={[{ label: 'Low vol', value: 0.072 }, { label: 'Mid vol', value: 0.055 }, { label: 'High vol', value: 0.021, muted: true }, { label: 'Trend', value: 0.061 }, { label: 'Range', value: 0.048 }]} /><div className="chart-legend"><span>高波动区间 IC 明显衰减，是当前 context 未通过的主要原因。</span></div></div>
          </Panel>
        )}

        {tab === 'Lineage' && (
          <Panel>
            <PanelHead eyebrow="Evolution" title="Factor lineage" aside={<span style={{ fontSize: 12, color: 'var(--text-3)' }}>Mutation / Crossover</span>} />
            <div className="panel-body">
              {lineage.length === 0 ? <Empty inline title="No lineage" text="该因子没有记录的演化关系。" /> : (
                <div className="lineage">{lineage.map((n) => <div className="lineage-row" key={n.id + n.relation}><div className="lineage-rel"><span className="pill pill-neutral no-dot">{n.relation}</span></div><div className="lineage-node"><span className="lineage-dot" /><div><Link className="text-link mono" to={`/inspector?factor=${n.id}`}>{n.name}</Link><small style={{ display: 'block', color: 'var(--text-4)', fontSize: 11 }}>{n.note}</small></div></div></div>)}</div>
              )}
            </div>
            <div className="panel-note">Lineage 表示因子间的演化关系，与 Research Origin（Project → Experiment → Run）是不同概念。</div>
          </Panel>
        )}

        {tab === 'Artifact' && (
          <Panel>
            <PanelHead eyebrow={`${factor.miner} artifact`} title="Generated artifact" />
            <div className="panel-body">
              {factor.miner === 'GP' && <pre className="code-block">{`decay(
  rank(
    ts_stddev(ret, 24)
  ),
  8
)

# AST depth: 3 · nodes: 5
# parent: vol_rank_011 (mutation: add decay)`}</pre>}
              {factor.miner === 'RL' && <pre className="code-block">{`actions = [
  rank(volatility),
  ts_op(stddev, 24),
  decay(8),
]
# reward: cumulative IC delta = .054`}</pre>}
              {factor.miner === 'LLM' && <pre className="code-block">{`# hypothesis: realized vol rank mean-reverts
def factor(df):
    return decay(rank(ts_stddev(df.ret, 24)), 8)
# reflection rounds: 3`}</pre>}
            </div>
          </Panel>
        )}
      </div>
    </div>
  );
}

/* ============================ Validation, Portfolio, Data, Engine, misc ============================ */

export function Validation({ kind = 'Validation Center' }: { kind?: string }) {
  const { id } = useParams();
  const project = id ? projects.find((p) => p.id === id) : undefined;

  const inner = (
    <>
      <div className="toolbar">
        <button className="btn">Factor: vol_rank_decay_042</button>
        <button className="btn">Target: +4H</button>
        <button className="btn">Policy: Standard Alpha v3</button>
        <div className="toolbar-spacer" />
        <button className="btn btn-primary"><Play size={15} /> Run analysis</button>
      </div>
      <Metrics items={[
        { label: 'Mean IC', value: '0.061', sub: 'Target +4H' },
        { label: 'ICIR', value: '1.42' },
        { label: 'OOS IC', value: '0.054' },
        { label: 'Coverage', value: '99.7%' },
        { label: 'Decision', value: <Pill>Accepted</Pill> },
      ]} />
      <div className="grid-2" style={{ marginTop: 16 }}>
        <Panel>
          <PanelHead eyebrow="IC time series" title="Rolling IC" aside={<span style={{ fontSize: 12, color: 'var(--text-3)' }}>悬停查看每期取值</span>} />
          <div className="panel-body"><LineChart series={icSeries(18, 40)} benchmark={icSeries(24, 40).map((v) => v * 0.6)} seriesLabel="Rolling IC" benchmarkLabel="Universe 平均" labels={Array.from({ length: 40 }, (_, i) => `W${i + 1}`)} oosFrom={28} height={210} /><div className="chart-legend"><span><i />Rolling IC</span><span><i className="bench" />Universe 平均</span><span><i className="oos" />OOS</span></div></div>
        </Panel>
        <Panel>
          <PanelHead eyebrow="Decay" title="IC by horizon" />
          <div className="panel-body"><BarChart series={[{ label: '+1H', value: 0.071 }, { label: '+4H', value: 0.061 }, { label: '+8H', value: 0.043 }, { label: '+24H', value: 0.018, muted: true }]} /><div className="chart-legend"><span>预测能力随周期衰减</span></div></div>
        </Panel>
      </div>
      <Panel>
        <PanelHead eyebrow="Regime" title="各市场状态 IC 贡献" aside={<span style={{ fontSize: 12, color: 'var(--text-3)' }}>相对全样本均值的偏离</span>} />
        <div className="panel-body"><DivergingBars items={[{ label: 'Low vol', value: 0.011 }, { label: 'Mid vol', value: -0.006 }, { label: 'High vol', value: -0.040 }, { label: 'Trend', value: 0.000 }, { label: 'Range', value: -0.013 }]} valueFormat={(v) => `${v >= 0 ? '+' : ''}${v.toFixed(3)}`} /></div>
        <div className="panel-note">高波动区间对整体 IC 的拖累最明显，是 context 决策的关键依据。</div>
      </Panel>
      <Panel>
        <PanelHead eyebrow="Diagnostics" title="Validation checklist" />
        <div className="panel-body"><div className="checks">{validationChecks.map((c) => <div className="check-row" key={c.key}><span className={`check-icon ${c.passed ? 'ok' : 'no'}`}>{c.passed ? <Check size={13} /> : <span style={{ fontWeight: 700 }}>!</span>}</span><b>{c.key}</b><span className="check-metric">{c.metric}</span></div>)}</div></div>
        <div className="panel-note">结果仅作为研究证据，绑定明确的 Target 与 Policy，不构成最终策略有效性结论。</div>
      </Panel>
    </>
  );

  if (project) {
    return (
      <div className="page">
        <div className="scope-head">
          <div className="eyebrow">Project · {project.id}</div>
          <div className="scope-top"><div><h1>{project.name}</h1><p className="scope-desc">项目验证策略：{project.validationPolicy}</p></div></div>
          <div className="tabs">{[['Overview', `/projects/${project.id}`], ['Experiments', `/projects/${project.id}/experiments`], ['Runs', `/projects/${project.id}/runs`], ['Factors', `/projects/${project.id}/factors`], ['Validation', `/projects/${project.id}/validation`]].map(([l, t]) => <Link key={l} to={t} className={l === 'Validation' ? 'active' : ''}>{l}</Link>)}</div>
        </div>
        {inner}
      </div>
    );
  }

  return (
    <div className="page">
      <PageHead eyebrow="Validation" title={kind} description="每个指标都属于明确的验证上下文（Dataset / Universe / Target / Period / Policy）。" />
      {inner}
    </div>
  );
}

export function Backtest() {
  const [running, setRunning] = useState(false);
  return (
    <div className="page">
      <PageHead eyebrow="Portfolio" title="Backtest" description="仅用于研究评估，不连接实盘。无真实引擎时明确标注为 Demo 结果。" actions={<Pill tone="neutral">Demo engine</Pill>} />
      <div className="split">
        <Panel>
          <PanelHead eyebrow="Configuration" title="Portfolio setup" />
          <div className="panel-body">
            <div className="field-grid">
              {[['Factor combination', 'vol_rank_decay_042 + funding_mean_rev'], ['Weighting', 'Equal weight'], ['Rebalance', '4H'], ['Direction', 'Long / Short'], ['Holdings', '20'], ['Cost / slippage', '5bps / 2bps'], ['Period', '2025.07 — 2026.08'], ['Benchmark', 'BTC Buy & Hold']].map(([l, v]) => <label className="field" key={l}><span>{l}</span><select defaultValue={v}><option>{v}</option><option>Custom</option></select></label>)}
            </div>
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setRunning(true)}><Play size={15} /> {running ? 'Backtest queued' : 'Run backtest'}</button>
          </div>
        </Panel>
        <Panel>
          <PanelHead eyebrow="Result" title="Preview" />
          <div className="panel-body">
            {running ? (
              <>
                <Metrics items={[{ label: 'Annual return', value: '18.4%' }, { label: 'Sharpe', value: '1.32' }, { label: 'Max DD', value: '-12.8%' }]} />
                <div style={{ marginTop: 16 }}>
                  <div className="eyebrow" style={{ marginBottom: 8 }}>Net value · 组合 vs 基准</div>
                  <LineChart
                    series={icSeries(9, 36).map((v, i) => 1 + v * 4 + i * 0.02)}
                    benchmark={icSeries(15, 36).map((v, i) => 1 + v * 2 + i * 0.012)}
                    seriesLabel="组合净值" benchmarkLabel="BTC Buy & Hold"
                    labels={Array.from({ length: 36 }, (_, i) => `M${i + 1}`)}
                    baseline={1} height={200} valueFormat={(v) => v.toFixed(3)}
                  />
                  <div className="chart-legend"><span><i />组合净值</span><span><i className="bench" />BTC Buy &amp; Hold</span></div>
                </div>
                <div style={{ marginTop: 18 }}>
                  <div className="eyebrow" style={{ marginBottom: 10 }}>成本结构分解 (bps)</div>
                  <Gauge segments={[{ label: '手续费', value: 5, color: 'var(--accent)' }, { label: '滑点', value: 2, color: 'var(--warn)' }, { label: '冲击成本', value: 1.4, color: 'var(--neg)' }]} />
                </div>
                <div style={{ marginTop: 18 }}>
                  <div className="eyebrow" style={{ marginBottom: 10 }}>收益归因 (年化 %)</div>
                  <Waterfall items={[{ label: '基准', value: 6.2, kind: 'base' }, { label: '选股 alpha', value: 9.4 }, { label: '择时', value: 3.1 }, { label: '成本', value: -2.8 }, { label: '组合', value: 18.4, kind: 'total' }]} />
                </div>
              </>
            ) : <Empty title="Run to compute" text="没有可靠估算时不预填结果。" />}
          </div>
        </Panel>
      </div>
    </div>
  );
}

export function DataCenter({ kind = 'Datasets' }: { kind?: string }) {
  if (kind === 'Universes') return <SimpleTable eyebrow="Data" title="Universes" desc="研究可选的资产池。" cols={['Universe', 'Assets', 'Timeframe', 'Note']} rows={universes.map((u) => [u.name, String(u.assets), u.timeframe, u.note])} />;
  if (kind === 'Targets') return <SimpleTable eyebrow="Data" title="Targets" desc="预测目标定义。所有 IC 指标都绑定具体 Target。" cols={['Target', 'Horizon', 'Note']} rows={targets.map((t) => [t.name, t.horizon, t.note])} />;
  if (kind === 'Features') return (
    <div className="page"><PageHead eyebrow="Data" title="Features" description="特征分组构成搜索空间。" />
      <div className="card-grid">{featureGroups.map((f) => <div className="mini-card" key={f}><h3>{f}</h3><p>可用于 Miner 搜索空间</p></div>)}</div>
    </div>
  );
  return (
    <div className="page">
      <PageHead eyebrow="Data" title="Datasets" description="数据连接状态、覆盖率与版本。真实密钥由后端安全存储，不在前端显示。" actions={<button className="btn"><RefreshCw size={15} /> Refresh</button>} />
      <Panel>
        <div className="table-wrap"><table className="data"><thead><tr><th>Dataset</th><th>Status</th><th className="num-cell">Coverage</th><th className="num-cell">Assets</th><th>Range</th></tr></thead><tbody>{datasets.map((d) => <tr key={d.name}><td className="cell-main">{d.name}</td><td><Pill>{d.status}</Pill></td><td className="mono num-cell">{d.coverage}</td><td className="mono num-cell">{d.assets || '—'}</td><td style={{ fontSize: 12, color: 'var(--text-3)' }}>{d.range}</td></tr>)}</tbody></table></div>
        <div className="panel-note">当前研究上下文数据版本：<span className="mono">{researchContext.dataVersion}</span></div>
      </Panel>
    </div>
  );
}

export function EnginePage({ kind = 'Miners' }: { kind?: string }) {
  if (kind === 'Operators') return (
    <div className="page"><PageHead eyebrow="Engine" title="Operators" description="搜索空间中可组合的算子分组。" />
      <div className="card-grid">{operators.map((o) => <div className="mini-card" key={o}><h3>{o}</h3><p>算子分组</p></div>)}</div>
    </div>
  );
  if (kind === 'Fitness') return <SimpleTable eyebrow="Engine" title="Fitness functions" desc="用于评估候选的目标函数。" cols={['Function', 'Definition']} rows={[['RankIC - λ·turnover', '排序相关性扣减换手惩罚'], ['IC', 'Pearson 相关'], ['ICIR', 'IC 均值 / IC 标准差']]} />;
  return (
    <div className="page">
      <PageHead eyebrow="Engine" title="Miners" description="因子搜索方法。不同 Miner 产生不同 Artifact。" />
      <Panel>
        <div className="table-wrap"><table className="data"><thead><tr><th>Miner</th><th>Code</th><th>Status</th><th>Artifact</th><th>Note</th></tr></thead><tbody>{miners.map((m) => <tr key={m.id}><td className="cell-main">{m.name}</td><td><span className="tag">{m.code}</span></td><td><Pill tone={m.status === 'Ready' ? 'success' : 'neutral'}>{m.status}</Pill></td><td className="mono" style={{ fontSize: 12 }}>{m.artifact}</td><td style={{ fontSize: 12, color: 'var(--text-3)' }}>{m.note}</td></tr>)}</tbody></table></div>
      </Panel>
    </div>
  );
}

function SimpleTable({ eyebrow, title, desc, cols, rows }: { eyebrow: string; title: string; desc: string; cols: string[]; rows: string[][] }) {
  return (
    <div className="page">
      <PageHead eyebrow={eyebrow} title={title} description={desc} />
      <Panel>
        <div className="table-wrap"><table className="data"><thead><tr>{cols.map((c) => <th key={c}>{c}</th>)}</tr></thead><tbody>{rows.map((r, i) => <tr key={i}>{r.map((cell, j) => <td key={j} className={j === 0 ? 'cell-main' : ''}>{cell}</td>)}</tr>)}</tbody></table></div>
      </Panel>
    </div>
  );
}

export function Reports() {
  const [generated, setGenerated] = useState(false);
  return (
    <div className="page">
      <PageHead eyebrow="Workspace" title="Research Reports" description="报告保留来源快照，并区分自动摘要与人工结论。" actions={<button className="btn btn-primary" onClick={() => setGenerated(true)}><Plus size={15} /> Generate report</button>} />
      {generated && <div className="banner banner-ok" style={{ marginBottom: 16 }}><Check size={15} /> 报告已创建：Funding Reversal v3 验证报告</div>}
      <div className="card-grid">
        {reports.map((r) => (
          <div className="mini-card" key={r.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}><span className="tag">{r.type}</span><span style={{ fontSize: 11, color: 'var(--text-4)' }}>{r.updated}</span></div>
            <h3>{r.title}</h3>
            <p>来源快照：{r.source}</p>
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}><button className="btn btn-sm" onClick={() => window.print()}><Download size={13} /> Export</button><button className="btn btn-sm">Preview <ArrowRight size={13} /></button></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SettingsPage() {
  const [saved, setSaved] = useState(false);
  return (
    <div className="page">
      <PageHead eyebrow="Workspace" title="Settings" description="工作区默认上下文、显示偏好与引擎连接。" actions={saved ? <Pill tone="success">Saved</Pill> : undefined} />
      <div className="grid-2">
        <Panel>
          <PanelHead eyebrow="Defaults" title="Default research context" />
          <div className="panel-body">
            <div className="field-grid">
              <label className="field"><span>Universe</span><input defaultValue={researchContext.universe} /></label>
              <label className="field"><span>Timeframe</span><input defaultValue={researchContext.frequency} /></label>
              <label className="field"><span>Target</span><input defaultValue={researchContext.target} /></label>
              <label className="field"><span>Timezone</span><select><option>UTC</option><option>Asia/Shanghai</option></select></label>
            </div>
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setSaved(true)}>Save changes</button>
          </div>
        </Panel>
        <Panel>
          <PanelHead eyebrow="Engine" title="Compute connection" />
          <div className="panel-body">
            <div className="banner banner-warn" style={{ marginBottom: 14 }}>当前为 Demo 引擎，未连接真实计算后端。</div>
            <dl className="kv"><dt>Adapter</dt><dd className="mono">local-demo</dd><dt>Status</dt><dd>Not configured</dd><dt>Data version</dt><dd className="mono">{researchContext.dataVersion}</dd></dl>
          </div>
        </Panel>
      </div>
    </div>
  );
}

export function Help() {
  return (
    <div className="page">
      <PageHead eyebrow="Help" title="Research workflow guide" description="从研究想法到报告的最短路径。" />
      <div className="card-grid">
        {[['研究生命周期', 'Idea → Project → Experiment → Run → Candidate → Factor → Validation → Portfolio。'], ['Experiment vs Run', 'Experiment 是研究设计；Run 是一次可复现执行。Retry 创建新 Run。'], ['Candidate vs Factor', 'Candidate 是 Run 产出，Factor 是持久化研究资产。'], ['指标与上下文', '每个 IC / RankIC / OOS 都绑定 Dataset / Target / Period / Policy。'], ['快捷键', '⌘K 打开命令面板，快速跳转页面与操作。'], ['Demo 数据', '预览使用确定性演示数据；分析缺失时显示 Empty / Planned。']].map(([t, d]) => <div className="mini-card" key={t}><h3>{t}</h3><p>{d}</p></div>)}
      </div>
    </div>
  );
}

export function NotFound() {
  const location = useLocation();
  return (
    <div className="page">
      <PageHead eyebrow="404" title="页面不存在" description="该地址没有对应的研究视图。可能是链接过期或路径拼写有误。" />
      <Panel>
        <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'flex-start' }}>
          <div className="banner banner-warn" style={{ margin: 0 }}><AlertTriangle size={15} /> 未找到路径 <span className="mono">{location.pathname}</span></div>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-3)' }}>从这里回到常用的研究入口：</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Link className="btn btn-primary" to="/"><ArrowRight size={15} /> Research Overview</Link>
            <Link className="btn" to="/library"><Target size={15} /> Factor Library</Link>
            <Link className="btn" to="/validation"><Play size={15} /> Validation Center</Link>
            <Link className="btn" to="/help"><Clipboard size={15} /> Workflow guide</Link>
          </div>
        </div>
      </Panel>
    </div>
  );
}

export function TasksPage() {
  return (
    <div className="page">
      <PageHead eyebrow="Engine" title="Compute / Tasks" description="后台计算任务。Task 是执行系统，与研究 Run 语义相关但不等同。" />
      <Panel>
        <div className="table-wrap"><table className="data"><thead><tr><th>Task</th><th>Type</th><th>Status</th><th>Progress</th></tr></thead><tbody>{tasks.map((t: any) => <tr key={t.id}><td className="cell-main">{t.name}<span className="cell-sub">{t.detail}</span></td><td><span className="tag">{t.type}</span></td><td><Pill>{t.status}</Pill></td><td><div className="table-progress"><div className="progress thin"><span style={{ width: `${t.progress}%` }} /></div><small>{t.progress}%</small></div></td></tr>)}</tbody></table></div>
      </Panel>
    </div>
  );
}
