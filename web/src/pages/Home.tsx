import { Link } from 'react-router-dom';
import { Activity, ArrowRight, Boxes, GitBranch, Play, Plus, TestTubes } from 'lucide-react';
import {
  experiments, factors, projects, researchActivity, runs, validationResults, workspaceStats,
} from '../data/researchData';
import { getMiner, paradigmLabels } from '../registry/miners';
import { PageHead, Panel, PanelHead, Pill, Metrics, Empty } from '../components/ui';

const minerName = (id: string) => getMiner(id)?.name ?? id;

export function Home() {
  const activeRuns = runs.filter((r) => r.status === 'Running');
  const recentFactors = [...factors].slice(0, 5);
  const openExperiments = experiments.filter((e) => e.status === 'Active' || e.status === 'Ready');

  return (
    <div className="page">
      <PageHead
        eyebrow="Workspace"
        title="Research Overview"
        description="因子研究工作台。以 Project 组织长期研究，通过 Experiment 设计并运行任意 Miner，将有效因子沉淀到统一因子库，再经正式验证晋升到组合。"
        actions={<>
          <Link className="btn" to="/projects"><Boxes size={15} /> Projects</Link>
          <Link className="btn btn-primary" to="/experiments/new"><Plus size={15} /> New Experiment</Link>
        </>}
      />

      <Metrics items={[
        { label: 'Active projects', value: workspaceStats.activeProjects, sub: `${workspaceStats.totalProjects} total` },
        { label: 'Running runs', value: workspaceStats.runningRuns, sub: 'across experiments' },
        { label: 'Experiments', value: workspaceStats.experiments },
        { label: 'Library factors', value: workspaceStats.libraryFactors, sub: `${workspaceStats.promotedFactors} promoted` },
        { label: 'Validation runs', value: workspaceStats.validationRuns },
      ]} />

      <div className="split" style={{ marginTop: 16 }}>
        <Panel>
          <PanelHead eyebrow="Pipeline" title="Research flow" aside={<span className="policy-chip">Project → Experiment → Run → Factor → Validation → Portfolio</span>} />
          <div className="panel-body">
            <div className="flow-strip">
              {[
                { icon: Boxes, label: 'Project', to: '/projects', note: '研究课题与默认上下文' },
                { icon: Play, label: 'Experiment', to: '/experiments', note: '选择 Miner 设计研究' },
                { icon: Activity, label: 'Run', to: '/runs', note: '可复现执行与候选' },
                { icon: GitBranch, label: 'Factor', to: '/library', note: '统一因子库' },
                { icon: TestTubes, label: 'Validation', to: '/validation', note: '正式验证与晋升' },
              ].map((s, i, arr) => {
                const Icon = s.icon;
                return (
                  <div className="flow-item" key={s.label}>
                    <Link to={s.to} className="flow-node"><span className="flow-ic"><Icon size={16} /></span><b>{s.label}</b><small>{s.note}</small></Link>
                    {i < arr.length - 1 && <ArrowRight className="flow-arrow" size={15} />}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="panel-note">核心流程与具体 Miner 无关：无论 GP、RL、LLM、NN 还是 Quanta Alpha，都遵循同一条研究链路。</div>
        </Panel>

        <Panel>
          <PanelHead eyebrow="Live" title="Active runs" aside={<Link className="text-link" to="/runs">All runs <ArrowRight size={13} /></Link>} />
          <div className="panel-body pad-0">
            {activeRuns.length === 0 ? <div style={{ padding: 16 }}><Empty inline title="No active runs" text="启动一个 Experiment 的 Run。" /></div> : activeRuns.map((r) => (
              <Link to={`/runs/${r.id}`} className="live-run" key={r.id}>
                <div className="live-run-top"><b className="mono">{r.id}</b><Pill>{r.status}</Pill></div>
                <div className="live-run-meta"><span className="tag">{minerName(r.minerId)}</span><span>{r.progress.stageUnit} {r.progress.current}/{r.progress.total}</span></div>
                <div className="progress thin"><span style={{ width: `${r.percentage}%` }} /></div>
              </Link>
            ))}
          </div>
        </Panel>
      </div>

      <div className="split" style={{ marginTop: 16 }}>
        <Panel>
          <PanelHead eyebrow="Projects" title="Active research" aside={<Link className="text-link" to="/projects">View all <ArrowRight size={13} /></Link>} />
          <div className="table-wrap">
            <table className="data">
              <thead><tr><th>Project</th><th className="num-cell">Experiments</th><th className="num-cell">Factors</th><th>Status</th></tr></thead>
              <tbody>
                {projects.map((p) => (
                  <tr key={p.id}>
                    <td><Link className="cell-main text-link" to={`/projects/${p.id}`}>{p.name}</Link><span className="cell-sub">{p.lastActivity}</span></td>
                    <td className="mono num-cell">{p.experiments}</td>
                    <td className="mono num-cell">{p.factors}<span className="cell-sub">{p.promoted} promoted</span></td>
                    <td><Pill>{p.status}</Pill></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel>
          <PanelHead eyebrow="Factors" title="Recently persisted" aside={<Link className="text-link" to="/library">Factor Library <ArrowRight size={13} /></Link>} />
          <div className="table-wrap">
            <table className="data">
              <thead><tr><th>Factor</th><th>Origin</th><th className="num-cell">IC</th><th>Lifecycle</th></tr></thead>
              <tbody>
                {recentFactors.map((f) => (
                  <tr key={f.id}>
                    <td><Link className="cell-main text-link" to={`/factors/${f.id}`}>{f.name}</Link><span className="cell-sub mono">{f.id}</span></td>
                    <td><span className="paradigm-tag">{paradigmLabels[getMiner(f.originMinerId)?.paradigm ?? 'GP']}</span></td>
                    <td className="mono num-cell strong">{f.metrics.ic?.toFixed(3)}</td>
                    <td><Pill>{f.lifecycle}</Pill></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      <div className="split" style={{ marginTop: 16 }}>
        <Panel>
          <PanelHead eyebrow="Open experiments" title="In progress & ready" aside={<Link className="text-link" to="/experiments">All experiments <ArrowRight size={13} /></Link>} />
          <div className="table-wrap">
            <table className="data">
              <thead><tr><th>Experiment</th><th>Miner</th><th>Status</th><th>Latest run</th></tr></thead>
              <tbody>
                {openExperiments.map((e) => (
                  <tr key={e.id}>
                    <td><Link className="cell-main text-link" to={`/experiments/${e.id}`}>{e.name}</Link><span className="cell-sub">{e.researchQuestion}</span></td>
                    <td><span className="tag">{minerName(e.minerId)}</span></td>
                    <td><Pill>{e.status}</Pill></td>
                    <td><Pill>{e.latestRunStatus}</Pill></td>
                  </tr>
                ))}
                {openExperiments.length === 0 && <tr><td colSpan={4}><Empty inline title="No open experiments" /></td></tr>}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel>
          <PanelHead eyebrow="Activity" title="Research pulse" />
          <div className="panel-body pad-0">
            <ul className="activity-feed">
              {researchActivity.map(([action, detail, time]) => (
                <li key={action + time}>
                  <span className="activity-dot" />
                  <div><b>{action}</b><span>{detail}</span></div>
                  <time>{time}</time>
                </li>
              ))}
            </ul>
          </div>
          <div className="panel-note">最近验证：{validationResults.length} 条结果，涵盖 PASS / FAIL / INCONCLUSIVE 三种结论。</div>
        </Panel>
      </div>
    </div>
  );
}

export default Home;
