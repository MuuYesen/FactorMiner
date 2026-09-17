import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronRight, Play, Plus, RefreshCw, Search, Square } from 'lucide-react';
import {
  artifacts, candidates, experiments, factors, projectFunnels, projects, runs,
  type Candidate,
} from '../data/researchData';
import { getMiner, metricsForMiner, formatMetric } from '../registry/miners';
import { ArtifactRenderer } from '../registry/renderers';
import { PageHead, Panel, PanelHead, Pill, Metrics, LineChart, Empty, ProgressMonitor } from '../components/ui';
import { icSeries } from '../data/researchData';

const minerName = (id: string) => getMiner(id)?.name ?? id;
const minerParadigm = (id: string) => getMiner(id)?.paradigm ?? '';

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
        actions={<Link className="btn btn-primary" to="/experiments/new"><Plus size={15} /> New Experiment</Link>}
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
              <tr><th>Project</th><th>Research goal</th><th>Default context</th><th className="num-cell">Experiments</th><th className="num-cell">Factors</th><th>Status</th><th>Updated</th></tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id}>
                  <td><Link className="cell-main text-link" to={`/projects/${p.id}`}>{p.name}</Link><span className="cell-sub mono">{p.id}</span></td>
                  <td style={{ maxWidth: 240 }}>{p.researchGoal}</td>
                  <td className="mono" style={{ fontSize: 12 }}>{p.defaultUniverse}<span className="cell-sub">{p.defaultTimeframe} · {p.defaultTarget}</span></td>
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

export function ProjectScope({ id, active }: { id: string; active: string }) {
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
  const funnel = projectFunnels[project.id] ?? projectFunnels['PRJ-001'];
  const maxFunnel = funnel.steps[0].value;

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
            <Link className="btn btn-primary" to={`/experiments/new?project=${project.id}`}><Plus size={15} /> New Experiment</Link>
          </div>
        </div>
        <dl className="scope-meta">
          <div><dt>Status</dt><dd><Pill>{project.status}</Pill></dd></div>
          <div><dt>Default dataset</dt><dd className="mono">{project.defaultDataset}</dd></div>
          <div><dt>Universe</dt><dd className="mono">{project.defaultUniverse}</dd></div>
          <div><dt>Timeframe</dt><dd className="mono">{project.defaultTimeframe}</dd></div>
          <div><dt>Default target</dt><dd>{project.defaultTarget}</dd></div>
          <div><dt>Cost</dt><dd className="mono">{project.transactionCost}</dd></div>
          <div><dt>Validation policy</dt><dd>{project.validationPolicy}</dd></div>
        </dl>
        <ProjectScope id={project.id} active="Overview" />
      </div>

      <Metrics items={[
        { label: 'Experiments', value: project.experiments },
        { label: 'Active runs', value: projectRuns.filter((r) => r.status === 'Running').length, sub: `${project.runs} total` },
        { label: 'Factors', value: project.factors },
        { label: 'Promoted', value: project.promoted },
        { label: 'Last activity', value: <span style={{ fontSize: 13 }}>{project.updated}</span> },
      ]} />

      <Panel>
        <PanelHead eyebrow="Research funnel" title="Factor lifecycle conversion" aside={<span className="policy-chip">Pipeline · {funnel.policy}</span>} />
        <div className="panel-body">
          <div className="funnel">
            {funnel.steps.map((step, i) => (
              <div className="funnel-step" key={step.label}>
                <div className="funnel-cell">
                  <div className={`fn-value ${i === funnel.steps.length - 1 ? 'term' : ''}`}>{step.value.toLocaleString()}</div>
                  <div className="fn-label">{step.label}</div>
                  {step.rate && <div className="fn-rate">{step.rate}</div>}
                  <div className="fn-bar"><span style={{ width: `${Math.max(4, (step.value / maxFunnel) * 100)}%` }} /></div>
                </div>
                {i < funnel.steps.length - 1 && <ChevronRight className="funnel-arrow" size={15} />}
              </div>
            ))}
          </div>
        </div>
        <div className="panel-note">转化率基于单一 Validation Policy（{funnel.policy}），不混合不同 Target 或策略的结果。</div>
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
                    <td><span className="tag">{minerName(e.minerId)}</span></td>
                    <td><Pill>{e.status}</Pill></td>
                    <td className="mono num-cell">{e.totalRuns}</td>
                  </tr>
                ))}
                {projectExperiments.length === 0 && <tr><td colSpan={4}><Empty inline title="No experiments yet" text="创建第一个 Experiment 开始研究。" /></td></tr>}
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
                    <td><Link className="cell-main text-link" to={`/runs/${r.id}`}>{r.id}</Link><span className="cell-sub mono">{r.progress.stageUnit} {r.progress.current}/{r.progress.total}</span></td>
                    <td><Pill>{r.status}</Pill></td>
                    <td className="mono num-cell">{r.persisted}</td>
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
        <button className="btn">Miner: All</button>
      </div>
      <Panel>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr><th>Run</th><th>Experiment</th><th>Miner</th><th>Status</th><th>Progress</th><th className="num-cell">Candidates</th><th className="num-cell">Factors</th><th className="num-cell">Best fitness</th></tr>
            </thead>
            <tbody>
              {list.map((r) => (
                <tr key={r.id}>
                  <td><Link className="cell-main text-link mono" to={`/runs/${r.id}`}>{r.id}</Link><span className="cell-sub">seed {r.seed} · {r.started}</span></td>
                  <td><Link className="text-link" to={`/experiments/${r.experimentId}`}>{r.experimentId}</Link></td>
                  <td><span className="tag">{minerName(r.minerId)}</span></td>
                  <td><Pill>{r.status}</Pill></td>
                  <td><div className="table-progress"><div className="progress thin"><span style={{ width: `${r.percentage}%` }} /></div><small>{r.progress.stageUnit} {r.progress.current}/{r.progress.total}</small></div></td>
                  <td className="mono num-cell">{r.generated.toLocaleString()}</td>
                  <td className="mono num-cell">{r.persisted}</td>
                  <td className="mono num-cell">{r.bestFitness}</td>
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
      <PageHead eyebrow="Workspace" title="Runs" description="Experiment 的不可变执行记录。Retry 会创建新的 Run，不会覆盖历史。" actions={<Link className="btn btn-primary" to="/experiments"><Play size={15} /> Start a run</Link>} />
      {body}
    </div>
  );
}

/* ---------------- Unified Run Workspace ---------------- */

export function RunDetail() {
  const { id = 'RUN-184-03' } = useParams();
  const run = runs.find((r) => r.id === id) || runs[0];
  const experiment = experiments.find((e) => e.id === run.experimentId);
  const miner = getMiner(run.minerId);
  const [tab, setTab] = useState('Overview');
  const runCandidates = candidates.filter((c) => c.runId === run.id);
  const runArtifacts = artifacts.filter((a) => a.runId === run.id);
  const runFactors = factors.filter((f) => f.originRunId === run.id);
  const tabs = ['Overview', 'Candidates', 'Factors', 'Artifacts', 'Logs', 'Snapshot'];

  return (
    <div className="page">
      <div className="scope-head">
        <div className="eyebrow">Run · {run.id}</div>
        <div className="scope-top">
          <div>
            <h1 className="mono" style={{ fontSize: 20 }}>{run.id}</h1>
            <p className="scope-desc">{experiment?.name || run.experimentId} · <span className="tag">{minerName(run.minerId)}</span> <span className="paradigm-tag">{minerParadigm(run.minerId)}</span> · <Link className="text-link" to={`/projects/${run.projectId}`}>{run.projectId}</Link></p>
          </div>
          <div className="head-actions">
            {run.status === 'Running' ? <button className="btn"><Square size={14} /> Stop</button> : null}
            <button className="btn btn-primary"><RefreshCw size={15} /> Retry as new run</button>
          </div>
        </div>
        <dl className="scope-meta">
          <div><dt>Status</dt><dd><Pill>{run.status}</Pill></dd></div>
          <div><dt>Stage</dt><dd className="mono" style={{ fontSize: 12 }}>{run.progress.stageUnit} {run.progress.current}/{run.progress.total}</dd></div>
          <div><dt>Started</dt><dd>{run.started}</dd></div>
          <div><dt>Duration</dt><dd className="mono">{run.duration}</dd></div>
          <div><dt>Compute</dt><dd style={{ fontSize: 12 }}>{run.compute}</dd></div>
          <div><dt>Seed</dt><dd className="mono">{run.seed}</dd></div>
        </dl>
        <div className="tabs">{tabs.map((t) => <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>{t}{t === 'Artifacts' && runArtifacts.length ? <span className="tab-count">{runArtifacts.length}</span> : null}</button>)}</div>
      </div>

      {tab === 'Overview' && (
        <>
          <Metrics items={[
            { label: 'Generated', value: run.generated.toLocaleString(), sub: 'candidates' },
            { label: 'Valid', value: run.valid.toLocaleString(), sub: `${Math.round((run.valid / Math.max(run.generated, 1)) * 100)}%` },
            { label: 'Persisted factors', value: run.persisted },
            { label: 'Best fitness', value: run.bestFitness, sub: 'in-sample' },
          ]} />
          <div className="split" style={{ marginTop: 16 }}>
            <Panel>
              <PanelHead eyebrow="Progress monitor" title="Unified run progress" aside={<Pill>{run.status}</Pill>} />
              <div className="panel-body">
                <ProgressMonitor stageUnit={run.progress.stageUnit} current={run.progress.current} total={run.progress.total} percentage={run.percentage} message={run.progress.message} />
                <div className="panel-note" style={{ padding: '12px 0 0', border: 0 }}>该进度契约与具体 Miner 无关：{miner?.name} 报告 <span className="mono">{run.progress.stageUnit}</span>，前端统一渲染标准 Progress。</div>
              </div>
            </Panel>
            <Panel>
              <PanelHead eyebrow="Fitness progress" title="Best fitness per stage" aside={<span className="policy-chip">In-sample</span>} />
              <div className="panel-body"><LineChart series={icSeries(run.seed, 32)} /></div>
              <div className="panel-note">该曲线为搜索过程中的样本内适应度，不构成 OOS 结论。请在 Validation 中查看样本外表现。</div>
            </Panel>
          </div>
        </>
      )}

      {tab === 'Candidates' && <CandidateBrowser runCandidates={runCandidates} minerId={run.minerId} />}

      {tab === 'Factors' && (
        <Panel>
          <PanelHead eyebrow="Factors" title={`${runFactors.length} persisted from this run`} aside={<span className="policy-chip">仅持久化因子进入 Library</span>} />
          <div className="table-wrap">
            <table className="data">
              <thead><tr><th>Factor</th><th>Lifecycle</th><th className="num-cell">IC</th><th className="num-cell">OOS IC</th></tr></thead>
              <tbody>
                {runFactors.map((f) => (
                  <tr key={f.id}><td><Link className="text-link mono" to={`/factors/${f.id}`}>{f.id}</Link><span className="cell-sub">{f.name}</span></td><td><Pill>{f.lifecycle}</Pill></td><td className="mono num-cell">{f.metrics.ic?.toFixed(3)}</td><td className="mono num-cell">{f.metrics.oosIc?.toFixed(3)}</td></tr>
                ))}
                {runFactors.length === 0 && <tr><td colSpan={4}><Empty inline title="No factors persisted" text="该 Run 未产生持久化因子。" /></td></tr>}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      {tab === 'Artifacts' && (
        <div className="artifact-stack">
          {runArtifacts.length === 0 && <Panel><div className="panel-body"><Empty inline title="No artifacts" text="该 Run 尚未产生 artifact。" /></div></Panel>}
          {runArtifacts.map((a) => (
            <Panel key={a.id}>
              <PanelHead eyebrow={`Artifact · ${a.type}`} title={a.label} />
              <div className="panel-body"><ArtifactRenderer artifact={a} /></div>
            </Panel>
          ))}
        </div>
      )}

      {tab === 'Logs' && (
        <Panel><div className="panel-body"><pre className="code-block">{`[09:12:04] run ${run.id} started · seed ${run.seed} · miner ${miner?.id}
[09:12:05] dataset crypto-v3.2.1 loaded · coverage 99.7%
[09:18:41] ${run.progress.stageUnit} 12/${run.progress.total} · best fitness .061
[09:41:22] ${run.progress.stageUnit} ${run.progress.current}/${run.progress.total} · best fitness ${run.bestFitness}
[09:41:23] ${run.status === 'Failed' ? 'ERROR ' + (run.progress.message ?? 'run failed') : 'checkpoint saved'}`}</pre></div></Panel>
      )}

      {tab === 'Snapshot' && (
        <Panel>
          <PanelHead eyebrow="Reproducibility" title="Immutable config snapshot" />
          <div className="panel-body"><pre className="code-block">{JSON.stringify({ experiment: run.experimentId, miner: miner?.id, minerVersion: miner?.version, seed: run.seed, dataset: 'crypto-v3.2.1', universe: experiment?.universe, timeframe: experiment?.timeframe, target: experiment?.target, cost: '5 bps', validationPolicy: 'Standard Alpha Validation v3', code: 'factorminer@2.4.0' }, null, 2)}</pre></div>
          <div className="panel-note">该 Run 保留不可变配置快照，Experiment 后续修改不会影响此记录。</div>
        </Panel>
      )}
    </div>
  );
}

/* ---------------- Unified Candidate Browser (miner-agnostic) ---------------- */

function CandidateBrowser({ runCandidates, minerId }: { runCandidates: Candidate[]; minerId: string }) {
  const [sortKey, setSortKey] = useState('fitness');
  const [keptOnly, setKeptOnly] = useState(false);

  // Derive metric columns from the miner's metric schema — no hard-coded columns.
  const metricCols = useMemo(() => {
    const present = new Set<string>();
    runCandidates.forEach((c) => Object.keys(c.metrics).forEach((k) => present.add(k)));
    return metricsForMiner(minerId).filter((m) => present.has(m.key)).slice(0, 6);
  }, [runCandidates, minerId]);

  const rows = useMemo(() => {
    let r = keptOnly ? runCandidates.filter((c) => c.persisted) : runCandidates;
    r = [...r].sort((a, b) => {
      const av = sortKey === 'fitness' ? a.fitness : (a.metrics[sortKey] ?? 0);
      const bv = sortKey === 'fitness' ? b.fitness : (b.metrics[sortKey] ?? 0);
      return bv - av;
    });
    return r;
  }, [runCandidates, keptOnly, sortKey]);

  return (
    <Panel>
      <PanelHead eyebrow="Candidates" title={`${runCandidates.length} candidates`} aside={<span className="policy-chip">Persisted 会进入 Factor Library</span>} />
      <div className="toolbar toolbar-inset">
        <label className="field-inline"><span>Sort by</span>
          <select value={sortKey} onChange={(e) => setSortKey(e.target.value)}>
            <option value="fitness">Fitness</option>
            {metricCols.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
          </select>
        </label>
        <button className={`btn ${keptOnly ? 'btn-active' : ''}`} onClick={() => setKeptOnly((v) => !v)}>Persisted only</button>
      </div>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Candidate</th><th>Definition</th>
              <th className="num-cell">Fitness</th>
              {metricCols.map((m) => <th key={m.key} className="num-cell" title={m.description}>{m.label}</th>)}
              <th>Status</th><th>Outcome</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.candidateId}>
                <td className="mono" style={{ fontSize: 12 }}>{c.candidateId}</td>
                <td className="mono" style={{ fontSize: 12, color: 'var(--text-2)', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.definitionRef}</td>
                <td className="mono num-cell strong">{c.fitness.toFixed(3)}</td>
                {metricCols.map((m) => <td key={m.key} className="mono num-cell">{formatMetric(m.key, c.metrics[m.key])}</td>)}
                <td><Pill tone={c.status === 'valid' ? 'success' : 'danger'} noDot>{c.status}</Pill></td>
                <td>{c.persisted ? <Link className="text-link" to={`/factors/${c.savedFactorId}`}>Saved factor</Link> : <span className="pill pill-neutral no-dot">Discarded</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="panel-note">候选浏览器对所有 Miner 使用同一契约与同一张表；列由 Miner 的 Metric Schema 动态生成，特殊内容通过 Definition / Artifact Renderer 查看。</div>
    </Panel>
  );
}
