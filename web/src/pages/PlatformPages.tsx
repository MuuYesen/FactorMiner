import { useState } from 'react';
import { Link, useParams, useSearchParams, useNavigate } from 'react-router-dom';
import {
  AlertTriangle, ArrowRight, Check, ChevronRight, Clipboard, GitBranch, Play, Plus,
  Search, Sparkles,
} from 'lucide-react';
import {
  datasets, experiments, factorLineage, factors, featureGroups, icSeries,
  operators, projects, reports, runs, targets, universes, validationChecks, validationResults, validationRuns,
  type Factor,
} from '../data/researchData';
import {
  minerRegistry, getMiner, formatMetric, defaultConfig, paradigmLabels, sharedMetrics,
} from '../registry/miners';
import { SchemaForm, DefinitionRenderer, definitionTypeLabels } from '../registry/renderers';
import {
  PageHead, Panel, PanelHead, Pill, Metrics, LineChart, DivergingBars, Waterfall, Gauge,
  ConclusionCard, Empty,
} from '../components/ui';
import { ProjectScope } from './WorkspacePages';

const minerName = (id: string) => getMiner(id)?.name ?? id;
const paradigmOf = (id: string) => getMiner(id)?.paradigm ?? '';

/* ============================ Experiments (unified research entry) ============================ */

export function Experiments() {
  const { id } = useParams();
  const [query, setQuery] = useState('');
  const scoped = id ? experiments.filter((e) => e.projectId === id) : experiments;
  const list = scoped.filter((e) => `${e.name}${minerName(e.minerId)}${e.status}`.toLowerCase().includes(query.toLowerCase()));
  const project = id ? projects.find((p) => p.id === id) : undefined;
  const newHref = project ? `/experiments/new?project=${project.id}` : '/experiments/new';

  const table = (
    <Panel>
      <div className="table-wrap">
        <table className="data">
          <thead><tr><th>Experiment</th><th>Miner</th><th>Paradigm</th><th>Status</th><th>Latest run</th><th className="num-cell">Runs</th><th className="num-cell">Candidates</th><th>Updated</th></tr></thead>
          <tbody>
            {list.map((e) => (
              <tr key={e.id}>
                <td><Link className="cell-main text-link" to={`/experiments/${e.id}`}>{e.name}</Link><span className="cell-sub">{e.researchQuestion || e.objective}</span></td>
                <td><span className="tag">{minerName(e.minerId)}</span></td>
                <td><span className="paradigm-tag">{paradigmOf(e.minerId)}</span></td>
                <td><Pill>{e.status}</Pill></td>
                <td><Pill>{e.latestRunStatus}</Pill></td>
                <td className="mono num-cell">{e.totalRuns}</td>
                <td className="mono num-cell">{e.candidates.toLocaleString()}</td>
                <td style={{ fontSize: 12, color: 'var(--text-4)' }}>{e.updated}</td>
              </tr>
            ))}
            {list.length === 0 && <tr><td colSpan={8}><Empty inline title="No experiments" text="创建一个 Experiment 开始研究。" /></td></tr>}
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
          <div className="scope-top"><div><h1>{project.name}</h1><p className="scope-desc">项目范围内的研究设计。</p></div><Link className="btn btn-primary" to={newHref}><Plus size={15} /> New Experiment</Link></div>
          <ProjectScope id={project.id} active="Experiments" />
        </div>
        <div className="toolbar"><div className="search"><Search size={15} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="搜索实验" /></div></div>
        {table}
      </div>
    );
  }

  return (
    <div className="page">
      <PageHead eyebrow="Workspace" title="Experiments" description="一个 Experiment 描述一次研究设计（我们在测试什么、如何测试），并可产生多个可复现的 Run。所有 Miner 共用同一入口。" actions={<Link className="btn btn-primary" to={newHref}><Plus size={15} /> New Experiment</Link>} />
      <div className="toolbar"><div className="search"><Search size={15} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="搜索实验、Miner 或状态" /></div><button className="btn">Status: All</button><button className="btn">Miner: All</button></div>
      {table}
    </div>
  );
}

/* ============================ Schema-driven Experiment Builder ============================ */

export function ExperimentBuilder() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const fromFactorId = params.get('from');
  const fromFactor = fromFactorId ? factors.find((f) => f.id === fromFactorId) : undefined;
  const initialProject = projects.find((p) => p.id === params.get('project')) || projects[0];

  const [projectId, setProjectId] = useState(initialProject.id);
  const project = projects.find((p) => p.id === projectId) || projects[0];
  const [name, setName] = useState(fromFactor ? `Evolve · ${fromFactor.name}` : '');
  const [meta, setMeta] = useState({ objective: '', question: '', hypothesis: '', notes: '' });
  const [context, setContext] = useState({ dataset: project.defaultDataset, universe: project.defaultUniverse, timeframe: project.defaultTimeframe, target: project.defaultTarget, cost: project.transactionCost, policy: project.validationPolicy });
  const [selectedFeatures, setSelectedFeatures] = useState(featureGroups.slice(0, 4));
  const [minerId, setMinerId] = useState(fromFactor?.originMinerId || 'quanta_alpha');
  const [config, setConfig] = useState<Record<string, unknown>>(() => defaultConfig(minerId));

  const miner = getMiner(minerId)!;
  const availableMiners = minerRegistry.filter((m) => m.enabled);

  const pickMiner = (id: string) => { setMinerId(id); setConfig(defaultConfig(id)); };
  const setContextField = (k: string, v: string) => setContext((c) => ({ ...c, [k]: v }));

  return (
    <div className="page page-wide">
      <PageHead
        eyebrow={fromFactor ? 'Evolve · Create Experiment from Factor' : 'Workspace · New Experiment'}
        title={fromFactor ? `Evolve ${fromFactor.name}` : 'New Experiment'}
        description="配置一次可复现的研究。公共部分由 FactorMiner 定义，Miner 特有配置由所选 Miner 的 Schema 动态生成。"
        actions={<>
          <button className="btn" onClick={() => navigate('/experiments')}><Clipboard size={15} /> Save Experiment</button>
          <button className="btn btn-primary" onClick={() => navigate('/runs/RUN-184-03')}><Play size={15} /> Save &amp; Start Run</button>
        </>}
      />

      {fromFactor && (
        <div className="banner banner-info">
          <GitBranch size={15} />
          <span>正在从因子 <Link className="text-link mono" to={`/factors/${fromFactor.id}`}>{fromFactor.id}</Link> 演化。父因子将记录为 <span className="mono">parentFactorId = {fromFactor.id}</span>，随后进入正常 Experiment → Run 流程。</span>
        </div>
      )}

      <div className="split">
        <div>
          <Panel>
            <PanelHead eyebrow="Basic" title="Project & name" aside={<span className="policy-chip">继承 Project 默认，可 override</span>} />
            <div className="panel-body">
              <div className="field-grid">
                <label className="field"><span className="field-label">Project</span>
                  <select value={projectId} onChange={(e) => { const p = projects.find((x) => x.id === e.target.value)!; setProjectId(p.id); setContext({ dataset: p.defaultDataset, universe: p.defaultUniverse, timeframe: p.defaultTimeframe, target: p.defaultTarget, cost: p.transactionCost, policy: p.validationPolicy }); }}>
                    {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </label>
                <label className="field"><span className="field-label">Experiment name</span><input value={name} onChange={(e) => setName(e.target.value)} placeholder="例如：Funding Reversal · Autonomous Research" /></label>
              </div>
            </div>
          </Panel>

          <Panel>
            <PanelHead eyebrow="Research context" title="Objective & hypothesis" aside={<span className="policy-chip">Optional metadata</span>} />
            <div className="panel-body">
              <div className="schema-form">
                <div className="field-grid">
                  <label className="field field-wide"><span className="field-label">Research objective</span><textarea rows={2} value={meta.objective} onChange={(e) => setMeta({ ...meta, objective: e.target.value })} placeholder="这次研究要回答的高层目标" /></label>
                  <label className="field field-wide"><span className="field-label">Research question</span><input value={meta.question} onChange={(e) => setMeta({ ...meta, question: e.target.value })} placeholder="具体、可验证的研究问题" /></label>
                  <label className="field field-wide"><span className="field-label">Hypothesis</span><textarea rows={2} value={meta.hypothesis} onChange={(e) => setMeta({ ...meta, hypothesis: e.target.value })} placeholder="可验证的市场假设与预期方向" /></label>
                  <label className="field field-wide"><span className="field-label">Notes</span><input value={meta.notes} onChange={(e) => setMeta({ ...meta, notes: e.target.value })} placeholder="补充说明" /></label>
                </div>
              </div>
            </div>
          </Panel>

          <Panel>
            <PanelHead eyebrow="Data & target" title="Research configuration" />
            <div className="panel-body">
              <div className="field-grid">
                <label className="field"><span className="field-label">Dataset</span><select value={context.dataset} onChange={(e) => setContextField('dataset', e.target.value)}>{[project.defaultDataset, 'Orderbook Features v4', 'US Equity Daily v8'].map((d) => <option key={d}>{d}</option>)}</select></label>
                <label className="field"><span className="field-label">Universe</span><select value={context.universe} onChange={(e) => setContextField('universe', e.target.value)}>{universes.map((u) => <option key={u.name}>{u.name}</option>)}</select></label>
                <label className="field"><span className="field-label">Timeframe</span><select value={context.timeframe} onChange={(e) => setContextField('timeframe', e.target.value)}>{['1H', '4H', '5m', '1D'].map((t) => <option key={t}>{t}</option>)}</select></label>
                <label className="field"><span className="field-label">Target</span><select value={context.target} onChange={(e) => setContextField('target', e.target.value)}>{targets.map((t) => <option key={t.name}>{t.name}</option>)}</select></label>
                <label className="field"><span className="field-label">Transaction cost</span><input value={context.cost} onChange={(e) => setContextField('cost', e.target.value)} /></label>
                <label className="field"><span className="field-label">Validation policy</span><select value={context.policy} onChange={(e) => setContextField('policy', e.target.value)}>{['Standard Alpha Validation v3', 'Microstructure Validation v2', 'Equity Validation v1'].map((p) => <option key={p}>{p}</option>)}</select></label>
              </div>
              <label className="field field-wide" style={{ marginTop: 14 }}>
                <span className="field-label">Feature space</span>
                <div className="tag-row">{featureGroups.map((f) => { const on = selectedFeatures.includes(f); return <button type="button" key={f} className={`chip-toggle ${on ? 'on' : ''}`} onClick={() => setSelectedFeatures((s) => on ? s.filter((x) => x !== f) : [...s, f])}>{on && <Check size={13} />}{f}</button>; })}</div>
              </label>
            </div>
          </Panel>

          <Panel>
            <PanelHead eyebrow="Method" title="Choose Miner" aside={<span className="policy-chip">用户直接选择 Miner</span>} />
            <div className="panel-body">
              <div className="miner-grid">
                {availableMiners.map((m) => (
                  <button key={m.id} className={`miner-card ${minerId === m.id ? 'active' : ''}`} onClick={() => pickMiner(m.id)}>
                    <div className="miner-card-head"><b>{m.name}</b>{minerId === m.id && <Check size={15} />}</div>
                    <span className="paradigm-tag">{paradigmLabels[m.paradigm]}{m.type ? ` · ${m.type}` : ''}</span>
                    <p>{m.description}</p>
                  </button>
                ))}
              </div>
            </div>
          </Panel>

          <Panel>
            <PanelHead eyebrow={`${miner.name} · ${paradigmLabels[miner.paradigm]}`} title="Miner configuration" aside={<span className="policy-chip mono">schema v{miner.version}</span>} />
            <div className="panel-body">
              <SchemaForm schema={miner.configSchema} values={config} onChange={(k, v) => setConfig((c) => ({ ...c, [k]: v }))} />
            </div>
            <div className="panel-note">此表单由 <span className="mono">{miner.id}.configSchema</span> 动态生成。新增/删除参数只需修改 Schema，无需改动 Experiment Builder。</div>
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
              <label className="field"><span className="field-label">Fitness function</span><select><option>RankIC - λ·turnover</option><option>IC</option><option>ICIR</option><option>Sharpe</option></select></label>
            </div>
          </Panel>
          <Panel>
            <PanelHead eyebrow="Summary" title="Experiment preview" />
            <div className="panel-body">
              <dl className="kv">
                <dt>Project</dt><dd>{project.name}</dd>
                <dt>Miner</dt><dd>{miner.name}</dd>
                <dt>Paradigm</dt><dd>{paradigmLabels[miner.paradigm]}</dd>
                <dt>Universe</dt><dd className="mono">{context.universe}</dd>
                <dt>Target</dt><dd>{context.target}</dd>
                <dt>Features</dt><dd className="mono">{selectedFeatures.length} groups</dd>
                <dt>Policy</dt><dd>{context.policy}</dd>
              </dl>
            </div>
            <div className="panel-note">保存后生成不可变 Run 快照。所有 Miner 遵循同一 Experiment → Run 流程。</div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

/* ============================ Experiment Detail ============================ */

export function ExperimentDetail() {
  const { id = 'EXP-184' } = useParams();
  const experiment = experiments.find((e) => e.id === id) || experiments[0];
  const project = projects.find((p) => p.id === experiment.projectId);
  const miner = getMiner(experiment.minerId)!;
  const [tab, setTab] = useState('Overview');
  const tabs = ['Overview', 'Configuration', 'Runs', 'Results'];

  // runs of this experiment
  const expRunList = experimentRuns(experiment.id);
  const expFactors = factors.filter((f) => f.originExperimentId === experiment.id);
  const latest = expRunList[0];

  return (
    <div className="page">
      <div className="scope-head">
        <div className="eyebrow">Experiment · {experiment.id}</div>
        <div className="scope-top">
          <div><h1>{experiment.name}</h1><p className="scope-desc">{experiment.researchQuestion || experiment.objective}</p></div>
          <div className="head-actions"><Link className="btn" to={`/experiments/new?project=${experiment.projectId}`}><Clipboard size={14} /> Duplicate</Link><Link className="btn btn-primary" to="/runs/RUN-184-03"><Play size={15} /> Start New Run</Link></div>
        </div>
        <dl className="scope-meta">
          <div><dt>Status</dt><dd><Pill>{experiment.status}</Pill></dd></div>
          <div><dt>Project</dt><dd><Link className="text-link" to={`/projects/${experiment.projectId}`}>{project?.name}</Link></dd></div>
          <div><dt>Miner</dt><dd>{miner.name}</dd></div>
          <div><dt>Paradigm</dt><dd><span className="paradigm-tag">{paradigmLabels[miner.paradigm]}</span></dd></div>
          <div><dt>Total runs</dt><dd className="mono">{experiment.totalRuns}</dd></div>
          <div><dt>Active runs</dt><dd className="mono">{experiment.activeRuns}</dd></div>
        </dl>
        <div className="tabs">{tabs.map((t) => <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>{t}</button>)}</div>
      </div>

      {tab === 'Overview' && (
        <div className="split">
          <div>
            {(experiment.objective || experiment.hypothesis) && (
              <Panel>
                <PanelHead eyebrow="Research context" title="Objective, question & hypothesis" />
                <div className="panel-body">
                  <dl className="kv">
                    {experiment.objective && <><dt>Objective</dt><dd>{experiment.objective}</dd></>}
                    {experiment.researchQuestion && <><dt>Question</dt><dd>{experiment.researchQuestion}</dd></>}
                    {experiment.hypothesis && <><dt>Hypothesis</dt><dd>{experiment.hypothesis}</dd></>}
                    {experiment.notes && <><dt>Notes</dt><dd>{experiment.notes}</dd></>}
                  </dl>
                </div>
              </Panel>
            )}
            <Panel>
              <PanelHead eyebrow="Runs" title="Execution history" aside={<Link className="text-link" to="/runs">All runs <ChevronRight size={13} /></Link>} />
              <div className="table-wrap"><table className="data"><thead><tr><th>Run</th><th>Status</th><th>Progress</th><th className="num-cell">Factors</th></tr></thead><tbody>{expRunList.map((r) => <tr key={r.id}><td><Link className="cell-main text-link mono" to={`/runs/${r.id}`}>{r.id}</Link><span className="cell-sub">seed {r.seed}</span></td><td><Pill>{r.status}</Pill></td><td><div className="table-progress"><div className="progress thin"><span style={{ width: `${r.percentage}%` }} /></div><small>{r.percentage}%</small></div></td><td className="mono num-cell">{r.persisted}</td></tr>)}{expRunList.length === 0 && <tr><td colSpan={4}><Empty inline title="No runs yet" text="启动第一个 Run。" /></td></tr>}</tbody></table></div>
            </Panel>
          </div>
          <Panel>
            <PanelHead eyebrow="Latest run" title="Summary" />
            <div className="panel-body">
              {latest ? (
                <dl className="kv">
                  <dt>Run</dt><dd><Link className="text-link mono" to={`/runs/${latest.id}`}>{latest.id}</Link></dd>
                  <dt>Status</dt><dd><Pill>{latest.status}</Pill></dd>
                  <dt>Stage</dt><dd className="mono">{latest.progress.stageUnit} {latest.progress.current}/{latest.progress.total}</dd>
                  <dt>Candidates</dt><dd className="mono">{latest.generated.toLocaleString()}</dd>
                  <dt>Persisted</dt><dd className="mono">{latest.persisted}</dd>
                  <dt>Universe</dt><dd className="mono">{experiment.universe}</dd>
                  <dt>Target</dt><dd>{experiment.target}</dd>
                </dl>
              ) : <Empty inline title="No runs" />}
            </div>
          </Panel>
        </div>
      )}

      {tab === 'Configuration' && (
        <Panel>
          <PanelHead eyebrow="Configuration" title="Full experiment configuration" aside={<span className="policy-chip mono">{miner.id} · v{miner.version}</span>} />
          <div className="panel-body"><pre className="code-block">{JSON.stringify({ project: experiment.projectId, name: experiment.name, context: { dataset: experiment.dataset, universe: experiment.universe, timeframe: experiment.timeframe, target: experiment.target }, features: featureGroups.slice(0, 4), miner: miner.id, paradigm: miner.paradigm, minerConfig: defaultConfig(miner.id), fitness: 'RankIC - λ·turnover', split: { train: '2022.01—2024.12', validation: '2025.01—2025.06', oos: '2025.07—2026.08' }, validationPolicy: 'Standard Alpha Validation v3' }, null, 2)}</pre></div>
        </Panel>
      )}

      {tab === 'Runs' && (
        <Panel><div className="table-wrap"><table className="data"><thead><tr><th>Run</th><th>Status</th><th>Started</th><th className="num-cell">Candidates</th><th className="num-cell">Factors</th></tr></thead><tbody>{expRunList.map((r) => <tr key={r.id}><td><Link className="text-link mono" to={`/runs/${r.id}`}>{r.id}</Link></td><td><Pill>{r.status}</Pill></td><td>{r.started}</td><td className="mono num-cell">{r.generated.toLocaleString()}</td><td className="mono num-cell">{r.persisted}</td></tr>)}</tbody></table></div></Panel>
      )}

      {tab === 'Results' && (
        <div className="split">
          <Panel>
            <PanelHead eyebrow="Results · Factors" title="Persisted factors" />
            <div className="table-wrap"><table className="data"><thead><tr><th>Factor</th><th>Lifecycle</th><th className="num-cell">IC</th><th className="num-cell">OOS IC</th></tr></thead><tbody>{expFactors.map((f) => <tr key={f.id}><td><Link className="text-link" to={`/factors/${f.id}`}>{f.name}</Link><span className="cell-sub mono">{f.id}</span></td><td><Pill>{f.lifecycle}</Pill></td><td className="mono num-cell">{f.metrics.ic?.toFixed(3)}</td><td className="mono num-cell">{f.metrics.oosIc?.toFixed(3)}</td></tr>)}{expFactors.length === 0 && <tr><td colSpan={4}><Empty inline title="No persisted factors" /></td></tr>}</tbody></table></div>
          </Panel>
          <Panel>
            <PanelHead eyebrow="Results · Validation" title="Formal validation" aside={<Link className="text-link" to="/validation">Validation Center <ChevronRight size={13} /></Link>} />
            <div className="panel-body">
              <p style={{ fontSize: 13, color: 'var(--text-2)', margin: '0 0 12px' }}>正式验证在因子持久化之后进行，独立于 Run 内的挖掘评估。</p>
              <dl className="kv">
                <dt>Validation runs</dt><dd className="mono">{validationRuns.filter((v) => v.factorIds.some((fid) => expFactors.some((f) => f.id === fid))).length}</dd>
                <dt>Latest outcome</dt><dd><Pill tone="success" noDot>PASS</Pill> / <Pill tone="danger" noDot>FAIL</Pill></dd>
              </dl>
            </div>
          </Panel>
        </div>
      )}
    </div>
  );
}

function experimentRuns(expId: string) {
  return runs.filter((r) => r.experimentId === expId);
}

/* ============================ Factor Library ============================ */

export function FactorLibrary({ kind }: { kind?: string }) {
  const { id } = useParams();
  const [params] = useSearchParams();
  const project = id ? projects.find((p) => p.id === id) : undefined;
  const experimentScope = params.get('experiment');
  const [query, setQuery] = useState('');
  const [minerFilter, setMinerFilter] = useState('All');
  const [lifecycleFilter, setLifecycleFilter] = useState('All');

  let scoped = factors;
  if (project) scoped = scoped.filter((f) => f.originProjectId === project.id);
  if (experimentScope) scoped = scoped.filter((f) => f.originExperimentId === experimentScope);

  const list = scoped.filter((f) =>
    `${f.name}${f.id}`.toLowerCase().includes(query.toLowerCase())
    && (minerFilter === 'All' || f.originMinerId === minerFilter)
    && (lifecycleFilter === 'All' || f.lifecycle === lifecycleFilter));

  if (kind === 'Compare') return <FactorCompare pool={scoped} />;

  const toolbar = (
    <div className="toolbar">
      <div className="search"><Search size={15} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="搜索因子名或 ID" /></div>
      <label className="field-inline"><span>Miner</span><select value={minerFilter} onChange={(e) => setMinerFilter(e.target.value)}><option value="All">All</option>{minerRegistry.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select></label>
      <label className="field-inline"><span>Lifecycle</span><select value={lifecycleFilter} onChange={(e) => setLifecycleFilter(e.target.value)}><option>All</option><option>Discovered</option><option>Reviewed</option><option>Validated</option><option>Promoted</option><option>Retired</option></select></label>
    </div>
  );

  const table = (
    <Panel>
      <div className="table-wrap">
        <table className="data">
          <thead><tr><th>Factor</th><th>Origin</th><th>Lifecycle</th><th className="num-cell">IC</th><th className="num-cell">RankIC</th><th className="num-cell">ICIR</th><th className="num-cell">OOS IC</th><th>Validation</th><th>Created</th></tr></thead>
          <tbody>
            {list.map((f) => (
              <tr key={f.id}>
                <td><Link className="cell-main text-link" to={`/factors/${f.id}`}>{f.name}</Link><span className="cell-sub mono">{f.id}</span></td>
                <td><span className="tag">{minerName(f.originMinerId)}</span><span className="cell-sub">{f.paradigm} · {f.originExperimentId}</span></td>
                <td><Pill>{f.lifecycle}</Pill></td>
                <td className="mono num-cell strong">{f.metrics.ic?.toFixed(3)}</td>
                <td className="mono num-cell">{f.metrics.rankIc?.toFixed(3)}</td>
                <td className="mono num-cell">{f.metrics.icir?.toFixed(2)}</td>
                <td className="mono num-cell">{f.metrics.oosIc?.toFixed(3)}</td>
                <td><OutcomePill outcome={f.latestOutcome} /></td>
                <td style={{ fontSize: 12, color: 'var(--text-4)' }}>{f.created}</td>
              </tr>
            ))}
            {list.length === 0 && <tr><td colSpan={9}><Empty inline title="No factors" text="仅持久化因子会出现在库中。" /></td></tr>}
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
          <div className="scope-top"><div><h1>{project.name}</h1><p className="scope-desc">项目范围内的持久化因子。</p></div></div>
          <ProjectScope id={project.id} active="Factors" />
        </div>
        {toolbar}{table}
      </div>
    );
  }

  return (
    <div className="page">
      <PageHead eyebrow="Factors" title="Global Factor Library" description="所有 Miner 产生的持久化因子进入同一个库。Miner 只作为来源元数据与筛选维度；入库之后所有因子共用同一套 Inspector / Validation / Portfolio。" />
      {toolbar}{table}
    </div>
  );
}

function OutcomePill({ outcome }: { outcome: Factor['latestOutcome'] }) {
  if (outcome === 'PASS') return <Pill tone="success" noDot>PASS</Pill>;
  if (outcome === 'FAIL') return <Pill tone="danger" noDot>FAIL</Pill>;
  if (outcome === 'INCONCLUSIVE') return <Pill tone="running" noDot>INCONCLUSIVE</Pill>;
  return <span className="pill pill-neutral no-dot">Not validated</span>;
}

function FactorCompare({ pool }: { pool: Factor[] }) {
  const [picked, setPicked] = useState<string[]>(pool.slice(0, 3).map((f) => f.id));
  const chosen = pool.filter((f) => picked.includes(f.id));
  const rows = sharedMetrics.filter((m) => m.category !== 'research');
  return (
    <div className="page">
      <PageHead eyebrow="Factors" title="Compare factors" description="并排比较已入库因子的核心指标。所有因子共用同一指标口径。" />
      <div className="toolbar">
        <div className="tag-row">{pool.map((f) => { const on = picked.includes(f.id); return <button key={f.id} className={`chip-toggle ${on ? 'on' : ''}`} onClick={() => setPicked((s) => on ? s.filter((x) => x !== f.id) : [...s, f.id].slice(-4))}>{on && <Check size={13} />}{f.name}</button>; })}</div>
      </div>
      <Panel>
        <div className="table-wrap">
          <table className="data compare-table">
            <thead><tr><th>Metric</th>{chosen.map((f) => <th key={f.id} className="num-cell">{f.id}</th>)}</tr></thead>
            <tbody>
              {rows.map((m) => (
                <tr key={m.key}><td>{m.label}<span className="cell-sub">{m.higherIsBetter ? '↑ better' : '↓ better'}</span></td>{chosen.map((f) => <td key={f.id} className="mono num-cell">{formatMetric(m.key, f.metrics[m.key])}</td>)}</tr>
              ))}
              <tr><td>Validation</td>{chosen.map((f) => <td key={f.id} className="num-cell"><OutcomePill outcome={f.latestOutcome} /></td>)}</tr>
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

/* ============================ Factor Inspector (simplified) ============================ */

export function InspectorPage({ tab: initialTab }: { tab?: string }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const factor = factors.find((f) => f.id === id) || factors[0];
  const [tab, setTab] = useState(initialTab || 'Overview');
  const tabs = ['Overview', 'Definition', 'Validation', 'Lineage', 'History'];
  const project = projects.find((p) => p.id === factor.originProjectId);
  const results = validationResults.filter((r) => r.factorId === factor.id);
  const lineage = factorLineage[factor.id] || [];

  return (
    <div className="page">
      <div className="scope-head">
        <div className="eyebrow">Factor · {factor.id}</div>
        <div className="scope-top">
          <div><h1>{factor.name}</h1><p className="scope-desc">{definitionTypeLabels[factor.definition.type]} · from <span className="tag">{minerName(factor.originMinerId)}</span> <span className="paradigm-tag">{factor.paradigm}</span></p></div>
          <div className="head-actions">
            <button className="btn" onClick={() => navigate(`/experiments/new?from=${factor.id}`)}><GitBranch size={14} /> Evolve</button>
            {factor.lifecycle === 'Validated' && <button className="btn btn-primary"><Check size={15} /> Promote</button>}
          </div>
        </div>
        <dl className="scope-meta">
          <div><dt>Lifecycle</dt><dd><Pill>{factor.lifecycle}</Pill></dd></div>
          <div><dt>Validation</dt><dd><OutcomePill outcome={factor.latestOutcome} /></dd></div>
          <div><dt>IC</dt><dd className="mono">{factor.metrics.ic?.toFixed(3)}</dd></div>
          <div><dt>OOS IC</dt><dd className="mono">{factor.metrics.oosIc?.toFixed(3)}</dd></div>
          <div><dt>ICIR</dt><dd className="mono">{factor.metrics.icir?.toFixed(2)}</dd></div>
          <div><dt>Turnover</dt><dd className="mono">{factor.metrics.turnover?.toFixed(1)}%</dd></div>
        </dl>
        <div className="tabs">{tabs.map((t) => <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>{t}</button>)}</div>
      </div>

      {tab === 'Overview' && (
        <>
          <ConclusionCard
            statusTone={factor.latestOutcome === 'PASS' ? 'success' : factor.latestOutcome === 'FAIL' ? 'danger' : 'running'}
            status={factor.latestOutcome === 'Not validated' ? 'Not validated' : String(factor.latestOutcome)}
            title={`${factor.name} · validation summary`}
            points={[
              { label: 'Mean IC', value: factor.metrics.ic?.toFixed(3), tone: 'pos' },
              { label: 'OOS IC', value: factor.metrics.oosIc?.toFixed(3), tone: 'pos' },
              { label: 'ICIR', value: factor.metrics.icir?.toFixed(2) },
              { label: 'Turnover', value: `${factor.metrics.turnover?.toFixed(1)}%` },
            ]}
            highlights={['高波动状态下稳健性需关注', `来源 ${factor.originExperimentId}`]}
          />
          <div className="split" style={{ marginTop: 16 }}>
            <Panel>
              <PanelHead eyebrow="Research origin" title="Provenance" aside={<span className="policy-chip">Project → Experiment → Run</span>} />
              <div className="panel-body">
                <dl className="kv">
                  <dt>Project</dt><dd><Link className="text-link" to={`/projects/${factor.originProjectId}`}>{project?.name}</Link></dd>
                  <dt>Experiment</dt><dd><Link className="text-link" to={`/experiments/${factor.originExperimentId}`}>{factor.originExperimentId}</Link></dd>
                  <dt>Run</dt><dd><Link className="text-link mono" to={`/runs/${factor.originRunId}`}>{factor.originRunId}</Link></dd>
                  <dt>Miner</dt><dd>{minerName(factor.originMinerId)} <span className="paradigm-tag">{factor.paradigm}</span></dd>
                </dl>
              </div>
            </Panel>
            <Panel>
              <PanelHead eyebrow="Rolling IC" title="Factor IC vs universe" aside={<span className="policy-chip">OOS shaded</span>} />
              <div className="panel-body"><LineChart series={icSeries(42, 40)} benchmark={icSeries(9, 40).map((v) => v * 0.5)} seriesLabel="Factor IC" benchmarkLabel="Universe avg" oosFrom={28} labels={Array.from({ length: 40 }, (_, i) => `T${i + 1}`)} /></div>
            </Panel>
          </div>
        </>
      )}

      {tab === 'Definition' && (
        <Panel>
          <PanelHead eyebrow={`Definition · ${factor.definition.type}`} title={definitionTypeLabels[factor.definition.type]} aside={<span className="policy-chip">Renderer registry</span>} />
          <div className="panel-body"><DefinitionRenderer definition={factor.definition} /></div>
          <div className="panel-note">定义通过 Definition Renderer Registry 按 <span className="mono">definitionType</span> 渲染；新增已有类型的因子无需修改 Inspector。</div>
        </Panel>
      )}

      {tab === 'Validation' && (
        <Panel>
          <PanelHead eyebrow="Formal validation" title="Validation results by context" aside={<Link className="text-link" to="/validation">Validation Center <ChevronRight size={13} /></Link>} />
          <div className="table-wrap">
            <table className="data">
              <thead><tr><th>Context</th><th>Target</th><th>Policy</th><th className="num-cell">OOS IC</th><th className="num-cell">ICIR</th><th>Outcome</th></tr></thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.id}><td className="mono" style={{ fontSize: 12 }}>{r.context.universe}<span className="cell-sub">{r.context.period}</span></td><td>{r.context.target}</td><td style={{ fontSize: 12 }}>{r.context.policy}</td><td className="mono num-cell">{r.metrics.oosIc?.toFixed(3)}</td><td className="mono num-cell">{r.metrics.icir?.toFixed(2)}</td><td><OutcomePill outcome={r.outcome} /></td></tr>
                ))}
                {results.length === 0 && <tr><td colSpan={6}><Empty inline title="Not validated yet" text="尚未在任何 Context 下进行正式验证。" /></td></tr>}
              </tbody>
            </table>
          </div>
          <div className="panel-note">正式验证独立于 Run 内挖掘评估；同一因子在不同 Context 下可以有不同 Outcome（PASS / FAIL / INCONCLUSIVE）。</div>
        </Panel>
      )}

      {tab === 'Lineage' && (
        <Panel>
          <PanelHead eyebrow="Factor lineage" title="Derivation graph" aside={<span className="policy-chip">Parent · Mutation · Child</span>} />
          <div className="panel-body">
            <div className="lineage-chain">
              {lineage.map((n) => (
                <div key={n.id + n.relation} className={`lineage-node ${n.id === factor.id ? 'current' : ''}`}>
                  <span className="lineage-rel">{n.relation}</span>
                  <Link className="text-link mono" to={`/factors/${n.id}`}>{n.name}</Link>
                  <p>{n.note}</p>
                </div>
              ))}
              {lineage.length === 0 && <Empty inline title="No lineage" text="该因子没有记录的派生关系。" />}
            </div>
          </div>
          <div className="panel-note">Lineage 只展示因子间派生关系（父/变异/交叉/子），研究来源（Project/Experiment/Run）在 Overview 的 Provenance 中。</div>
        </Panel>
      )}

      {tab === 'History' && (
        <Panel>
          <PanelHead eyebrow="Lifecycle" title="Factor history" />
          <div className="panel-body">
            <ol className="timeline">
              <li><span className="timeline-dot" /><div className="timeline-body"><div className="timeline-head"><b>Discovered</b><span className="mono">{factor.created}</span></div><p>由 {minerName(factor.originMinerId)} 在 {factor.originRunId} 持久化。</p></div></li>
              <li><span className="timeline-dot" /><div className="timeline-body"><div className="timeline-head"><b>Reviewed</b><span className="mono">今天 09:40</span></div><p>人工评审通过，进入正式验证。</p></div></li>
              {factor.latestOutcome === 'PASS' && <li><span className="timeline-dot" /><div className="timeline-body"><div className="timeline-head"><b>Validated</b><span className="mono">今天 08:46</span></div><p>正式验证 PASS（Standard Alpha Validation v3）。</p></div></li>}
              {factor.lifecycle === 'Promoted' && <li><span className="timeline-dot" /><div className="timeline-body"><div className="timeline-head"><b>Promoted</b><span className="mono">昨天 16:40</span></div><p>人工晋升，可用于组合与回测。</p></div></li>}
            </ol>
          </div>
        </Panel>
      )}
    </div>
  );
}

/* ============================ Validation Center ============================ */

const validationKinds = ['IC Analysis', 'Stability', 'Regime', 'Walk Forward', 'Overfit'];

export function Validation({ kind }: { kind?: string }) {
  const { id } = useParams();
  const project = id ? projects.find((p) => p.id === id) : undefined;

  if (kind === 'Correlation') return <CorrelationView />;
  if (kind && validationKinds.includes(kind)) return <ValidationAnalysis kind={kind} />;

  const results = project ? validationResults.filter((r) => factors.find((f) => f.id === r.factorId)?.originProjectId === project.id) : validationResults;

  const center = (
    <>
      <Metrics items={[
        { label: 'Validation runs', value: validationRuns.length },
        { label: 'PASS', value: validationResults.filter((r) => r.outcome === 'PASS').length },
        { label: 'FAIL', value: validationResults.filter((r) => r.outcome === 'FAIL').length },
        { label: 'INCONCLUSIVE', value: validationResults.filter((r) => r.outcome === 'INCONCLUSIVE').length },
      ]} />
      <div className="analysis-nav">
        {validationKinds.map((k) => <Link key={k} to={`/${k === 'IC Analysis' ? 'validation/ic' : k.toLowerCase().replace(' ', '-')}`} className="analysis-chip">{k}<ArrowRight size={13} /></Link>)}
      </div>
      <div className="split">
        <Panel>
          <PanelHead eyebrow="Validation runs" title="Recent formal validation" aside={<button className="btn btn-primary btn-sm"><Play size={13} /> Start validation</button>} />
          <div className="table-wrap"><table className="data"><thead><tr><th>Validation run</th><th>Scope</th><th>Status</th><th className="num-cell">P / F / I</th></tr></thead><tbody>{validationRuns.map((v) => <tr key={v.id}><td className="mono">{v.id}<span className="cell-sub">{v.policy}</span></td><td style={{ fontSize: 12 }}>{v.scope}</td><td><Pill>{v.status}</Pill></td><td className="mono num-cell">{v.pass} / {v.fail} / {v.inconclusive}</td></tr>)}</tbody></table></div>
        </Panel>
        <Panel>
          <PanelHead eyebrow="Validation policy" title="Standard Alpha Validation v3" />
          <div className="panel-body">
            <ul className="check-list">
              {validationChecks.map((c) => (
                <li key={c.key} className={c.passed ? 'ok' : 'bad'}>
                  {c.passed ? <Check size={14} /> : <AlertTriangle size={14} />}
                  <span>{c.key}</span><span className="mono">{c.metric}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="panel-note">正式验证（Formal Validation）在因子入库后进行，与 Run 内挖掘评估（Mining Evaluation）分离：搜索期 Fitness 高不等于验证 PASS。</div>
        </Panel>
      </div>
      <Panel>
        <PanelHead eyebrow="Results" title="Validation results by context" />
        <div className="table-wrap"><table className="data"><thead><tr><th>Factor</th><th>Context</th><th>Target</th><th className="num-cell">OOS IC</th><th>Stability</th><th>Outcome</th></tr></thead><tbody>{results.map((r) => { const f = factors.find((x) => x.id === r.factorId); return <tr key={r.id}><td><Link className="text-link" to={`/factors/${r.factorId}`}>{f?.name || r.factorId}</Link></td><td className="mono" style={{ fontSize: 12 }}>{r.context.universe}</td><td>{r.context.target}</td><td className="mono num-cell">{r.metrics.oosIc?.toFixed(3)}</td><td style={{ fontSize: 12 }}>{r.stability}</td><td><OutcomePill outcome={r.outcome} /></td></tr>; })}</tbody></table></div>
      </Panel>
    </>
  );

  if (project) {
    return (
      <div className="page">
        <div className="scope-head">
          <div className="eyebrow">Project · {project.id}</div>
          <div className="scope-top"><div><h1>{project.name}</h1><p className="scope-desc">项目范围内的正式验证。</p></div></div>
          <ProjectScope id={project.id} active="Validation" />
        </div>
        {center}
      </div>
    );
  }

  return (
    <div className="page">
      <PageHead eyebrow="Validation" title="Validation Center" description="因子入库后的正式验证：在明确研究 Context 下判断因子是否可靠。与 Run 内挖掘评估严格分离。" />
      {center}
    </div>
  );
}

function ValidationAnalysis({ kind }: { kind: string }) {
  const factor = factors[0];
  return (
    <div className="page">
      <PageHead eyebrow={`Validation · ${kind}`} title={`${kind} analysis`} description={`对已入库因子进行 ${kind} 分析，作为正式验证的组成部分。`} actions={<Link className="btn" to="/validation"><ChevronRight size={15} /> Validation Center</Link>} />
      <div className="analysis-nav">
        {validationKinds.map((k) => <Link key={k} to={`/${k === 'IC Analysis' ? 'validation/ic' : k.toLowerCase().replace(' ', '-')}`} className={`analysis-chip ${k === kind ? 'active' : ''}`}>{k}</Link>)}
      </div>
      {kind === 'IC Analysis' && (
        <Panel><PanelHead eyebrow="IC Analysis" title="Rolling IC · factor vs universe" aside={<span className="policy-chip">OOS shaded</span>} /><div className="panel-body"><LineChart series={icSeries(42, 40)} benchmark={icSeries(9, 40).map((v) => v * 0.5)} seriesLabel="Factor IC" benchmarkLabel="Universe avg" oosFrom={28} labels={Array.from({ length: 40 }, (_, i) => `T${i + 1}`)} /></div></Panel>
      )}
      {kind === 'Stability' && (
        <Panel><PanelHead eyebrow="Stability" title="IC stability across sub-periods" /><div className="panel-body"><DivergingBars items={[{ label: '2025 Q1', value: 0.052 }, { label: '2025 Q2', value: 0.041 }, { label: '2025 Q3', value: 0.033 }, { label: '2025 Q4', value: -0.008 }, { label: '2026 Q1', value: 0.047 }]} valueFormat={(v) => v.toFixed(3)} /></div></Panel>
      )}
      {kind === 'Regime' && (
        <Panel><PanelHead eyebrow="Regime" title="IC contribution by market regime" /><div className="panel-body"><DivergingBars items={[{ label: 'Low volatility', value: 0.061 }, { label: 'Trending', value: 0.048 }, { label: 'Range-bound', value: 0.022 }, { label: 'High volatility', value: -0.012 }]} valueFormat={(v) => v.toFixed(3)} /></div><div className="panel-note">高波动状态下 IC 转负，需在正式验证结论中标注 regime robustness 风险。</div></Panel>
      )}
      {kind === 'Walk Forward' && (
        <Panel><PanelHead eyebrow="Walk Forward" title="Out-of-sample walk-forward IC" /><div className="panel-body"><LineChart series={icSeries(15, 36)} baseline={0} labels={Array.from({ length: 36 }, (_, i) => `W${i + 1}`)} /></div></Panel>
      )}
      {kind === 'Overfit' && (
        <Panel><PanelHead eyebrow="Overfit" title="In-sample vs out-of-sample" /><div className="panel-body"><LineChart series={icSeries(42, 40)} benchmark={icSeries(42, 40).map((v, i) => v - 0.01 - i * 0.0004)} seriesLabel="In-sample" benchmarkLabel="Out-of-sample" labels={Array.from({ length: 40 }, (_, i) => `T${i + 1}`)} /></div><div className="panel-note">样本内外差距用于评估过拟合程度；差距越大越可能过拟合。Factor: {factor.name}。</div></Panel>
      )}
    </div>
  );
}

function CorrelationView() {
  const list = factors.slice(0, 4);
  return (
    <div className="page">
      <PageHead eyebrow="Factors" title="Correlation" description="已入库因子之间的相关性矩阵，用于控制组合内冗余。" />
      <Panel>
        <div className="table-wrap">
          <table className="data corr-table">
            <thead><tr><th>Factor</th>{list.map((f) => <th key={f.id} className="num-cell">{f.id}</th>)}</tr></thead>
            <tbody>
              {list.map((f, i) => (
                <tr key={f.id}><td className="mono">{f.id}</td>{list.map((g, j) => { const v = i === j ? 1 : Number((Math.sin((i + 1) * (j + 2)) * 0.4).toFixed(2)); return <td key={g.id} className="mono num-cell corr-cell" style={{ background: `color-mix(in oklch, var(--accent) ${Math.abs(v) * 55}%, transparent)` }}>{v.toFixed(2)}</td>; })}</tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

/* ============================ Portfolio / Backtest ============================ */

export function Backtest({ kind }: { kind?: string }) {
  const [running, setRunning] = useState(false);

  if (kind === 'Portfolios') {
    return (
      <div className="page">
        <PageHead eyebrow="Portfolio" title="Portfolios" description="由已晋升因子组合而成的投资组合。" actions={<button className="btn btn-primary"><Plus size={15} /> New portfolio</button>} />
        <Panel><div className="table-wrap"><table className="data"><thead><tr><th>Portfolio</th><th>Factors</th><th className="num-cell">Sharpe</th><th className="num-cell">Ann. return</th><th className="num-cell">Max DD</th><th>Status</th></tr></thead><tbody>
          <tr><td className="cell-main">Crypto Alpha Blend</td><td className="mono">5 promoted</td><td className="mono num-cell strong">1.84</td><td className="mono num-cell pos">+38.2%</td><td className="mono num-cell neg">-12.4%</td><td><Pill>Active</Pill></td></tr>
          <tr><td className="cell-main">Funding Reversal Only</td><td className="mono">2 promoted</td><td className="mono num-cell strong">1.32</td><td className="mono num-cell pos">+24.1%</td><td className="mono num-cell neg">-9.8%</td><td><Pill>Paused</Pill></td></tr>
        </tbody></table></div></Panel>
      </div>
    );
  }

  if (kind === 'Risk') {
    return (
      <div className="page">
        <PageHead eyebrow="Portfolio" title="Risk" description="组合层面的风险暴露与约束。" />
        <div className="split">
          <Panel><PanelHead eyebrow="Factor exposure" title="Active exposure vs limit ±5%" /><div className="panel-body"><DivergingBars items={[{ label: 'Momentum', value: 3.2 }, { label: 'Volatility', value: -2.1 }, { label: 'Liquidity', value: 1.4 }, { label: 'Funding', value: 4.6 }, { label: 'Size', value: -1.2 }]} valueFormat={(v) => `${v > 0 ? '+' : ''}${v.toFixed(1)}%`} /></div></Panel>
          <Panel><PanelHead eyebrow="Risk decomposition" title="Contribution to variance" /><div className="panel-body"><Gauge segments={[{ label: 'Idiosyncratic', value: 62, color: 'var(--accent)' }, { label: 'Factor', value: 28, color: 'var(--pos)' }, { label: 'Market', value: 10, color: 'var(--warn)' }]} /></div></Panel>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <PageHead eyebrow="Portfolio" title="Backtests" description="用已晋升因子构建组合并回测。仅通过正式验证并人工晋升的因子可用于此。" actions={<button className="btn btn-primary" onClick={() => setRunning(true)}><Play size={15} /> Run backtest</button>} />
      {!running ? (
        <Panel><div className="panel-body"><Empty title="No backtest yet" text="选择已晋升因子并运行一次回测以查看净值、归因与成本。" action={<button className="btn btn-primary" onClick={() => setRunning(true)}><Play size={15} /> Run backtest</button>} /></div></Panel>
      ) : (
        <>
          <Metrics items={[
            { label: 'Ann. return', value: '+38.2%' }, { label: 'Sharpe', value: '1.84' },
            { label: 'Max drawdown', value: '-12.4%' }, { label: 'Turnover', value: '18.3%' },
          ]} />
          <div className="split" style={{ marginTop: 16 }}>
            <Panel><PanelHead eyebrow="Net value" title="Portfolio vs benchmark" aside={<span className="policy-chip">vs BTC Buy&amp;Hold</span>} /><div className="panel-body"><LineChart series={icSeries(3, 40).map((v, i) => 1 + i * 0.02 + v)} benchmark={icSeries(8, 40).map((v, i) => 1 + i * 0.012 + v * 0.5)} seriesLabel="Portfolio" benchmarkLabel="Benchmark" labels={Array.from({ length: 40 }, (_, i) => `M${i + 1}`)} valueFormat={(v) => v.toFixed(2)} /></div></Panel>
            <Panel><PanelHead eyebrow="Cost structure" title="Execution cost breakdown" /><div className="panel-body"><Gauge segments={[{ label: 'Spread', value: 45, color: 'var(--accent)' }, { label: 'Impact', value: 32, color: 'var(--warn)' }, { label: 'Fees', value: 23, color: 'var(--pos)' }]} /></div></Panel>
          </div>
          <Panel><PanelHead eyebrow="Attribution" title="Return attribution" /><div className="panel-body"><Waterfall items={[{ label: 'Benchmark', value: 12, kind: 'base' }, { label: 'Selection', value: 14 }, { label: 'Timing', value: 8 }, { label: 'Cost', value: -4 }, { label: 'Portfolio', value: 30, kind: 'total' }]} /></div></Panel>
        </>
      )}
    </div>
  );
}

/* ============================ Data Center ============================ */

export function DataCenter({ kind }: { kind: string }) {
  const config: Record<string, { title: string; desc: string }> = {
    Datasets: { title: 'Datasets', desc: '已连接的数据源及其覆盖率与时间范围。' },
    Universes: { title: 'Universes', desc: '可选的标的池定义。' },
    Features: { title: 'Features', desc: '特征分组，用于构成搜索空间。' },
    Targets: { title: 'Targets', desc: '预测目标定义。' },
  };
  const c = config[kind];
  return (
    <div className="page">
      <PageHead eyebrow="Data" title={c.title} description={c.desc} />
      <Panel>
        <div className="table-wrap">
          {kind === 'Datasets' && <table className="data"><thead><tr><th>Dataset</th><th>Status</th><th className="num-cell">Coverage</th><th className="num-cell">Assets</th><th>Range</th></tr></thead><tbody>{datasets.map((d) => <tr key={d.name}><td className="cell-main">{d.name}</td><td><Pill>{d.status}</Pill></td><td className="mono num-cell">{d.coverage}</td><td className="mono num-cell">{d.assets}</td><td style={{ fontSize: 12 }}>{d.range}</td></tr>)}</tbody></table>}
          {kind === 'Universes' && <table className="data"><thead><tr><th>Universe</th><th className="num-cell">Assets</th><th>Timeframe</th><th>Note</th></tr></thead><tbody>{universes.map((u) => <tr key={u.name}><td className="cell-main">{u.name}</td><td className="mono num-cell">{u.assets}</td><td className="mono">{u.timeframe}</td><td style={{ fontSize: 12 }}>{u.note}</td></tr>)}</tbody></table>}
          {kind === 'Features' && <table className="data"><thead><tr><th>Feature group</th><th>Type</th></tr></thead><tbody>{featureGroups.map((f) => <tr key={f}><td className="cell-main">{f}</td><td><span className="tag">group</span></td></tr>)}</tbody></table>}
          {kind === 'Targets' && <table className="data"><thead><tr><th>Target</th><th>Horizon</th><th>Note</th></tr></thead><tbody>{targets.map((t) => <tr key={t.name}><td className="cell-main">{t.name}</td><td className="mono">{t.horizon}</td><td style={{ fontSize: 12 }}>{t.note}</td></tr>)}</tbody></table>}
        </div>
      </Panel>
    </div>
  );
}

/* ============================ Engine ============================ */

export function EnginePage({ kind }: { kind: string }) {
  if (kind === 'Miners') return <MinersView />;
  const titles: Record<string, { title: string; desc: string }> = {
    Operators: { title: 'Operators', desc: '搜索空间中可用的算子。' },
    Fitness: { title: 'Fitness', desc: '搜索期使用的适应度函数。' },
    Models: { title: 'Models', desc: '可供 LLM / NN Miner 使用的模型。' },
  };
  const c = titles[kind];
  return (
    <div className="page">
      <PageHead eyebrow="Engine" title={c.title} description={c.desc} />
      <Panel>
        <div className="table-wrap">
          {kind === 'Operators' && <table className="data"><thead><tr><th>Operator group</th><th>Kind</th></tr></thead><tbody>{operators.map((o) => <tr key={o}><td className="cell-main">{o}</td><td><span className="tag">operator</span></td></tr>)}</tbody></table>}
          {kind === 'Fitness' && <table className="data"><thead><tr><th>Fitness function</th><th>Note</th></tr></thead><tbody>{['RankIC - λ·turnover', 'IC', 'ICIR', 'Sharpe'].map((f) => <tr key={f}><td className="cell-main mono">{f}</td><td style={{ fontSize: 12 }}>搜索期综合适应度</td></tr>)}</tbody></table>}
          {kind === 'Models' && <table className="data"><thead><tr><th>Model</th><th>Provider</th></tr></thead><tbody>{['gpt-4.1', 'gpt-4o', 'claude-3.7-sonnet', 'o3', 'deepseek-r1'].map((m) => <tr key={m}><td className="cell-main mono">{m}</td><td><span className="tag">gateway</span></td></tr>)}</tbody></table>}
        </div>
      </Panel>
    </div>
  );
}

function MinersView() {
  return (
    <div className="page">
      <PageHead eyebrow="Engine" title="Miners" description="Miner 列表由 Miner Registry 动态生成。新增 Miner 只需注册定义，即自动出现在此处与 New Experiment，无需修改导航或页面。" />
      <Panel>
        <div className="table-wrap">
          <table className="data">
            <thead><tr><th>Miner</th><th>Paradigm</th><th>Type</th><th>Capabilities</th><th>Version</th><th>Enabled</th><th className="num-cell">Recent runs</th></tr></thead>
            <tbody>
              {minerRegistry.map((m) => (
                <tr key={m.id}>
                  <td><span className="cell-main">{m.name}</span><span className="cell-sub mono">{m.id}</span></td>
                  <td><span className="paradigm-tag">{paradigmLabels[m.paradigm]}</span></td>
                  <td style={{ fontSize: 12 }}>{m.type}</td>
                  <td><div className="cap-row">{m.capabilities.slice(0, 3).map((c) => <span key={c} className="cap-chip">{c}</span>)}{m.capabilities.length > 3 && <span className="cap-chip more">+{m.capabilities.length - 3}</span>}</div></td>
                  <td className="mono" style={{ fontSize: 12 }}>{m.version}</td>
                  <td>{m.enabled ? <Pill tone="success" noDot>Enabled</Pill> : <span className="pill pill-neutral no-dot">Disabled</span>}</td>
                  <td className="mono num-cell">{m.recentRuns}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="panel-note">Quanta Alpha 是 LLM 范式下的一个自主多智能体 Miner 实现，而非独立范式；它与其它 Miner 共用同一研究流程。</div>
      </Panel>
    </div>
  );
}

/* ============================ Task Center (full page) ============================ */

export function TasksPage() {
  return (
    <div className="page">
      <PageHead eyebrow="Engine" title="Compute & Tasks" description="基础设施任务监控。Task 是计算任务，不承担研究 Provenance —— 研究记录以 Run 为准。" />
      <Metrics items={[
        { label: 'CPU', value: '62%' }, { label: 'GPU', value: '4 / 4' },
        { label: 'Workers', value: '8' }, { label: 'Queue', value: '1' },
      ]} />
      <Panel>
        <PanelHead eyebrow="Tasks" title="Infrastructure activity" />
        <div className="table-wrap"><table className="data"><thead><tr><th>Task</th><th>Type</th><th>Detail</th><th>Progress</th><th>Status</th></tr></thead><tbody>
          {[
            { id: 'task-001', name: '候选因子搜索', type: 'Run', detail: 'RUN-184-03 · Quanta Alpha', status: '运行中', progress: 68 },
            { id: 'task-002', name: '数据质量检查', type: 'Dataset', detail: 'Orderbook Features', status: '已完成', progress: 100 },
            { id: 'task-003', name: 'OOS 指标计算', type: 'Validation', detail: 'VAL-002 · FAC-037', status: '排队中', progress: 0 },
          ].map((t) => (
            <tr key={t.id}><td className="cell-main">{t.name}</td><td><span className="tag">{t.type}</span></td><td style={{ fontSize: 12 }}>{t.detail}</td><td><div className="table-progress"><div className="progress thin"><span style={{ width: `${t.progress}%` }} /></div><small>{t.progress}%</small></div></td><td><Pill>{t.status}</Pill></td></tr>
          ))}
        </tbody></table></div>
      </Panel>
    </div>
  );
}

/* ============================ Reports / Settings / Help / NotFound ============================ */

export function Reports() {
  return (
    <div className="page">
      <PageHead eyebrow="Workspace" title="Reports" description="实验与验证生成的研究报告。" />
      <Panel><div className="table-wrap"><table className="data"><thead><tr><th>Report</th><th>Type</th><th>Source</th><th>Updated</th></tr></thead><tbody>{reports.map((r) => <tr key={r.id}><td className="cell-main">{r.title}</td><td><span className="tag">{r.type}</span></td><td className="mono" style={{ fontSize: 12 }}>{r.source}</td><td style={{ fontSize: 12, color: 'var(--text-4)' }}>{r.updated}</td></tr>)}</tbody></table></div></Panel>
    </div>
  );
}

export function SettingsPage() {
  return (
    <div className="page">
      <PageHead eyebrow="Workspace" title="Settings" description="工作区、引擎与验证策略设置。" />
      <div className="split">
        <Panel><PanelHead eyebrow="Engine" title="Compute engine" /><div className="panel-body"><dl className="kv"><dt>Adapter</dt><dd>Demo (local deterministic)</dd><dt>Connection</dt><dd>Not configured</dd><dt>Data version</dt><dd className="mono">crypto-v3.2.1</dd></dl><button className="btn" style={{ marginTop: 12 }}>Configure engine</button></div></Panel>
        <Panel><PanelHead eyebrow="Validation" title="Validation policies" /><div className="panel-body"><dl className="kv"><dt>Default</dt><dd>Standard Alpha Validation v3</dd><dt>Microstructure</dt><dd>Microstructure Validation v2</dd><dt>Equity</dt><dd>Equity Validation v1</dd></dl></div></Panel>
      </div>
    </div>
  );
}

export function Help() {
  return (
    <div className="page">
      <PageHead eyebrow="Help" title="Help & docs" description="FactorMiner 研究工作台使用说明。" />
      <Panel><div className="panel-body"><dl className="kv">
        <dt>核心流程</dt><dd>Project → New Experiment → Choose Miner → Run → Candidates → Persist Factors → Factor Library → Formal Validation → Promote → Portfolio</dd>
        <dt>Miner 无关</dt><dd>核心页面不区分具体 Miner；差异通过 Schema / Artifact / Renderer 表达。</dd>
        <dt>因子入库后</dt><dd>所有 Miner 的因子共用同一 Library / Inspector / Validation / Portfolio。</dd>
      </dl></div></Panel>
    </div>
  );
}

export function NotFound() {
  return (
    <div className="page">
      <PageHead eyebrow="404" title="Page not found" description="该页面不存在或已迁移到新的信息架构。" />
      <Panel><div className="panel-body"><Empty title="Nothing here" text="使用左侧导航或命令面板（⌘K）跳转。" action={<Link className="btn btn-primary" to="/"><Sparkles size={15} /> Back to Overview</Link>} /></div></Panel>
    </div>
  );
}
