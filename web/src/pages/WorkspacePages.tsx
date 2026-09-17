import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronRight, Play, Plus, RefreshCw, Search, Square } from 'lucide-react';
import { candidates, experiments, projects, runs } from '../data/researchData';
import { PageHead, Panel, PanelHead, Pill, Metrics, LineChart, Empty } from '../components/ui';
import { icSeries } from '../data/researchData';

/* ---------------- Projects list ---------------- */

export function Projects() {
  const [query, setQuery] = useState('');
  const list = projects.filter((p) => `${p.name}${p.researchGoal}${p.id}`.toLowerCase().includes(query.toLowerCase()));
  return (
    <div className="page">
      <PageHead
        eyebrow="Workspace"
        title="Projects"
        description="长期研究课题及其默认研究上下文。Experiment 创建时继承这些默认值，并可在设计时 override。"
        actions={<Link className="btn btn-primary" to="/idea"><Plus size={15} /> New project</Link>}
      />
      <div className="toolbar">
        <div className="search"><Search size={15} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="搜索项目、研究目标或 ID" /></div>
        <button className="btn">Status: All</button>
        <button className="btn">Dataset: All</button>
      </div>
      <Panel>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr><th>Project</th><th>Research goal</th><th>Default dataset</th><th>Universe</th><th className="num-cell">Experiments</th><th className="num-cell">Factors</th><th>Status</th><th>Updated</th></tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id}>
                  <td><Link className="cell-main text-link" to={`/projects/${p.id}`}>{p.name}</Link><span className="cell-sub mono">{p.id}</span></td>
                  <td style={{ maxWidth: 260 }}>{p.researchGoal}</td>
                  <td className="mono" style={{ fontSize: 12 }}>{p.defaultDataset}</td>
                  <td className="mono" style={{ fontSize: 12 }}>{p.defaultUniverse}</td>
                  <td className="mono num-cell">{p.experiments}<span className="cell-sub">{p.runs} runs</span></td>
                  <td className="mono num-cell">{p.factors}<span className="cell-sub">{p.promoted} promoted</span></td>
                  <td><Pill>{p.status}</Pill></td>
                  <td style={{ color: 'var(--text-4)', fontSize: 12 }}>{p.updated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

/* ---------------- Project scope shell ---------------- */

function ProjectScope({ id, active }: { id: string; active: string }) {
  const tabs = [
    ['Overview', `/projects/${id}`],
    ['Experiments', `/projects/${id}/experiments`],
    ['Runs', `/projects/${id}/runs`],
    ['Factors', `/projects/${id}/factors`],
    ['Validation', `/projects/${id}/validation`],
  ];
  return (
    <div className="tabs" role="tablist">
      {tabs.map(([label, to]) => (
        <Link key={label} to={to} className={active === label ? 'active' : ''}>{label}</Link>
      ))}
    </div>
  );
}

export function ProjectDetail() {
  const { id = 'PRJ-001' } = useParams();
  const project = projects.find((p) => p.id === id) || projects[0];
  const projectExperiments = experiments.filter((e) => e.projectId === project.id);
  const projectRuns = runs.filter((r) => r.projectId === project.id);

  const funnel = [
    ['Generated', '18,420', ''],
    ['Valid', '9,831', '53%'],
    ['IC Pass', '1,284', '13%'],
    ['Stable', '437', '34%'],
    ['OOS Pass', '34', '8%'],
    ['Accepted', '8', '24%'],
  ];

  return (
    <div className="page">
      <div className="scope-head">
        <div className="eyebrow">Project · {project.id}</div>
        <div className="scope-top">
          <div>
            <h1>{project.name}</h1>
            <p className="scope-desc">{project.description}</p>
          </div>
          <div className="head-actions">
            <Link className="btn" to={`/projects/${project.id}/validation`}>Validation policy</Link>
            <Link className="btn btn-primary" to="/mining"><Plus size={15} /> New experiment</Link>
          </div>
        </div>
        <dl className="scope-meta">
          <div><dt>Status</dt><dd><Pill>{project.status}</Pill></dd></div>
          <div><dt>Default dataset</dt><dd className="mono">{project.defaultDataset}</dd></div>
          <div><dt>Universe</dt><dd className="mono">{project.defaultUniverse}</dd></div>
          <div><dt>Timeframe</dt><dd className="mono">{project.defaultTimeframe}</dd></div>
          <div><dt>Default target</dt><dd>{project.defaultTarget}</dd></div>
          <div><dt>Transaction cost</dt><dd className="mono">{project.transactionCost}</dd></div>
          <div><dt>Validation policy</dt><dd>{project.validationPolicy}</dd></div>
        </dl>
        <ProjectScope id={project.id} active="Overview" />
      </div>

      <Panel>
        <PanelHead eyebrow="Project funnel" title="Factor lifecycle conversion" aside={<span className="eyebrow" style={{ textTransform: 'none', letterSpacing: 0, color: 'var(--text-3)' }}>Pipeline · {project.validationPolicy}</span>} />
        <div className="panel-body">
          <div className="funnel">
            {funnel.map(([label, value, rate], i) => (
              <div className="funnel-step" key={label}>
                <div className="funnel-cell">
                  <div className={`fn-value ${i === funnel.length - 1 ? 'term' : ''}`}>{value}</div>
                  <div className="fn-label">{label}</div>
                  {rate && <div className="fn-rate">{rate}</div>}
                </div>
                {i < funnel.length - 1 && <ChevronRight className="funnel-arrow" size={16} />}
              </div>
            ))}
          </div>
        </div>
        <div className="panel-note">转化率基于单一 Validation Policy（{project.validationPolicy}），不混合不同 Target 或策略的结果。</div>
      </Panel>

      <div className="split" style={{ marginTop: 16 }}>
        <Panel>
          <PanelHead eyebrow="Experiments" title="Research designs" aside={<Link className="text-link" to={`/projects/${project.id}/experiments`}>View all <ChevronRight size={13} /></Link>} />
          <div className="table-wrap">
            <table className="data">
              <thead><tr><th>Experiment</th><th>Miner</th><th>Status</th><th className="num-cell">Runs</th></tr></thead>
              <tbody>
                {projectExperiments.map((e) => (
                  <tr key={e.id}>
                    <td><Link className="cell-main text-link" to={`/experiments/${e.id}`}>{e.name}</Link><span className="cell-sub">{e.researchQuestion}</span></td>
                    <td><span className="tag">{e.miner}</span></td>
                    <td><Pill>{e.status}</Pill></td>
                    <td className="mono num-cell">{e.totalRuns}</td>
                  </tr>
                ))}
                {projectExperiments.length === 0 && <tr><td colSpan={4}><Empty inline title="No experiments yet" text="从研究想法或 Mining 创建第一个实验。" /></td></tr>}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel>
          <PanelHead eyebrow="Runs" title="Recent executions" aside={<Link className="text-link" to={`/projects/${project.id}/runs`}>View all <ChevronRight size={13} /></Link>} />
          <div className="table-wrap">
            <table className="data">
              <thead><tr><th>Run</th><th>Status</th><th className="num-cell">Factors</th></tr></thead>
              <tbody>
                {projectRuns.map((r) => (
                  <tr key={r.id}>
                    <td><Link className="cell-main text-link" to={`/runs/${r.id}`}>{r.id}</Link><span className="cell-sub mono">{r.stage}</span></td>
                    <td><Pill>{r.status}</Pill></td>
                    <td className="mono num-cell">{r.factors}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </div>
  );
}

/* ---------------- Runs list ---------------- */

export function RunsPage() {
  const { id } = useParams();
  const [query, setQuery] = useState('');
  const scoped = id ? runs.filter((r) => r.projectId === id) : runs;
  const list = scoped.filter((r) => `${r.id}${r.experimentId}${r.projectId}`.toLowerCase().includes(query.toLowerCase()));
  const project = id ? projects.find((p) => p.id === id) : undefined;

  const body = (
    <>
      <div className="toolbar">
        <div className="search"><Search size={15} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="搜索 Run、Experiment 或 Project" /></div>
        <button className="btn">Status: All</button>
        <button className="btn">Date: All</button>
      </div>
      <Panel>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr><th>Run</th><th>Experiment</th><th>Status</th><th>Progress</th><th className="num-cell">Candidates</th><th className="num-cell">Factors</th><th className="num-cell">Best IC</th><th>Compute</th></tr>
            </thead>
            <tbody>
              {list.map((r) => (
                <tr key={r.id}>
                  <td><Link className="cell-main text-link" to={`/runs/${r.id}`}>{r.id}</Link><span className="cell-sub mono">seed {r.seed} · {r.started}</span></td>
                  <td><Link className="text-link" to={`/experiments/${r.experimentId}`}>{r.experimentId}</Link></td>
                  <td><Pill>{r.status}</Pill></td>
                  <td><div className="table-progress"><div className="progress thin"><span style={{ width: `${r.progress}%` }} /></div><small>{r.progress}%</small></div></td>
                  <td className="mono num-cell">{r.candidates.toLocaleString()}</td>
                  <td className="mono num-cell">{r.factors}</td>
                  <td className="mono num-cell">{r.bestMetric}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-3)' }}>{r.compute}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );

  if (project) {
    return (
      <div className="page">
        <div className="scope-head">
          <div className="eyebrow">Project · {project.id}</div>
          <div className="scope-top"><div><h1>{project.name}</h1><p className="scope-desc">项目范围内的全部执行记录。</p></div></div>
          <ProjectScope id={project.id} active="Runs" />
        </div>
        {body}
      </div>
    );
  }

  return (
    <div className="page">
      <PageHead eyebrow="Workspace" title="Runs" description="Experiment 的不可变执行记录。Retry 会创建新的 Run，不会覆盖历史。" actions={<Link className="btn btn-primary" to="/experiments"><Play size={15} /> Run experiment</Link>} />
      {body}
    </div>
  );
}

/* ---------------- Run detail (scope workspace) ---------------- */

export function RunDetail() {
  const { id = 'RUN-184-03' } = useParams();
  const run = runs.find((r) => r.id === id) || runs[0];
  const experiment = experiments.find((e) => e.id === run.experimentId);
  const [tab, setTab] = useState('Overview');
  const runCandidates = candidates.filter((c: (typeof candidates)[number]) => c.runId === run.id);
  const tabs = ['Overview', 'Candidates', 'Factors', 'Logs', 'Config snapshot'];

  return (
    <div className="page">
      <div className="scope-head">
        <div className="eyebrow">Run · {run.id}</div>
        <div className="scope-top">
          <div>
            <h1 className="mono" style={{ fontSize: 20 }}>{run.id}</h1>
            <p className="scope-desc">{experiment?.name || run.experimentId} · <Link className="text-link" to={`/projects/${run.projectId}`}>{run.projectId}</Link> · seed {run.seed}</p>
          </div>
          <div className="head-actions">
            {run.status === 'Running' ? <button className="btn"><Square size={14} /> Stop</button> : null}
            <button className="btn btn-primary"><RefreshCw size={15} /> Retry as new run</button>
          </div>
        </div>
        <dl className="scope-meta">
          <div><dt>Status</dt><dd><Pill>{run.status}</Pill></dd></div>
          <div><dt>Stage</dt><dd className="mono" style={{ fontSize: 12 }}>{run.stage}</dd></div>
          <div><dt>Started</dt><dd>{run.started}</dd></div>
          <div><dt>Duration</dt><dd className="mono">{run.duration}</dd></div>
          <div><dt>Compute</dt><dd style={{ fontSize: 12 }}>{run.compute}</dd></div>
          <div><dt>Config snapshot</dt><dd className="mono">experiment v3</dd></div>
        </dl>
        <div className="tabs">{tabs.map((t) => <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>{t}</button>)}</div>
      </div>

      {tab === 'Overview' && (
        <>
          <Metrics items={[
            { label: 'Progress', value: `${run.progress}%` },
            { label: 'Candidates', value: run.candidates.toLocaleString() },
            { label: 'Factors saved', value: run.factors },
            { label: 'Best fitness', value: run.bestMetric, sub: 'IC · train' },
          ]} />
          <div className="split" style={{ marginTop: 16 }}>
            <Panel>
              <PanelHead eyebrow="Fitness progress" title="Best IC per generation" aside={<span className="eyebrow" style={{ textTransform: 'none', letterSpacing: 0, color: 'var(--text-3)' }}>Train · in-sample</span>} />
              <div className="panel-body"><LineChart series={icSeries(run.seed, 32)} /></div>
              <div className="panel-note">该曲线为搜索过程中的样本内适应度，尚未构成 OOS 结论。请在 Validation 中查看样本外表现。</div>
            </Panel>
            <Panel>
              <PanelHead eyebrow="Reproducibility" title="Run record" />
              <div className="panel-body">
                <dl className="kv">
                  <dt>Experiment</dt><dd><Link className="text-link" to={`/experiments/${run.experimentId}`}>{run.experimentId}</Link></dd>
                  <dt>Dataset snapshot</dt><dd className="mono">crypto-v3.2.1</dd>
                  <dt>Seed</dt><dd className="mono">{run.seed}</dd>
                  <dt>Config</dt><dd className="mono">immutable · v3</dd>
                </dl>
                <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 14 }}>该 Run 保留不可变配置快照，Experiment 后续修改不会影响此记录。</p>
              </div>
            </Panel>
          </div>
        </>
      )}

      {tab === 'Candidates' && (
        <Panel>
          <PanelHead eyebrow="Candidates" title={`${runCandidates.length} candidates from this run`} aside={<span style={{ fontSize: 12, color: 'var(--text-3)' }}>Kept 会保存为 Factor</span>} />
          <div className="table-wrap">
            <table className="data">
              <thead><tr><th>Candidate</th><th>Expression</th><th className="num-cell">IC</th><th className="num-cell">RankIC</th><th className="num-cell">ICIR</th><th className="num-cell">Turnover</th><th>Outcome</th></tr></thead>
              <tbody>
                {runCandidates.map((c: (typeof runCandidates)[number]) => (
                  <tr key={c.id}>
                    <td className="mono" style={{ fontSize: 12 }}>{c.id}</td>
                    <td className="mono" style={{ fontSize: 12, color: 'var(--text-2)' }}>{c.expression}</td>
                    <td className="mono num-cell">{c.ic.toFixed(3)}</td>
                    <td className="mono num-cell">{c.rankIc.toFixed(3)}</td>
                    <td className="mono num-cell">{c.icir.toFixed(2)}</td>
                    <td className="mono num-cell">{c.turnover.toFixed(1)}%</td>
                    <td>{c.kept ? <Link className="text-link" to={`/inspector?factor=${c.savedFactorId}`}>Saved factor</Link> : <span className="pill pill-neutral no-dot">Discarded</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      {tab === 'Factors' && (
        <Panel>
          <PanelHead eyebrow="Factors" title="Saved from this run" />
          <div className="table-wrap">
            <table className="data">
              <thead><tr><th>Factor</th><th>Lifecycle</th><th className="num-cell">IC</th></tr></thead>
              <tbody>
                {runCandidates.filter((c: (typeof runCandidates)[number]) => c.kept).map((c: (typeof runCandidates)[number]) => (
                  <tr key={c.id}><td><Link className="text-link mono" to={`/inspector?factor=${c.savedFactorId}`}>{c.savedFactorId}</Link></td><td><Pill>Reviewed</Pill></td><td className="mono num-cell">{c.ic.toFixed(3)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      {tab === 'Logs' && (
        <Panel><div className="panel-body"><pre className="code-block">{`[09:12:04] run ${run.id} started · seed ${run.seed}
[09:12:05] dataset crypto-v3.2.1 loaded · coverage 99.7%
[09:18:41] generation 12/40 · best IC .061
[09:41:22] generation 31/40 · best IC ${run.bestMetric}
[09:41:23] ${run.status === 'Failed' ? 'ERROR operator timeout after 180s' : 'checkpoint saved'}`}</pre></div></Panel>
      )}

      {tab === 'Config snapshot' && (
        <Panel><div className="panel-body"><pre className="code-block">{JSON.stringify({ experiment: run.experimentId, miner: experiment?.miner, seed: run.seed, dataset: 'crypto-v3.2.1', universe: 'Crypto Top50', timeframe: '1H', target: 'Forward Return +4H', validationPolicy: 'Standard Alpha Validation v3' }, null, 2)}</pre></div></Panel>
      )}
    </div>
  );
}
