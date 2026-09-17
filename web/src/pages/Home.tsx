import { Link } from 'react-router-dom';
import { ArrowUpRight, FlaskConical, Play, Plus, Sparkles } from 'lucide-react';
import { experiments, projects, researchActivity, runs, workspaceStats } from '../data/researchData';
import { PageHead, Panel, PanelHead, Pill, Metrics, Sparkline } from '../components/ui';

export function Home() {
  const activeRuns = runs.filter((r) => r.status === 'Running' || r.status === 'Queued');
  const recentExperiments = experiments.slice(0, 3);

  return (
    <div className="page">
      <PageHead
        eyebrow="Workspace"
        title="Research Overview"
        description="从研究想法到验证与组合的整体研究进展。所有指标均绑定明确的研究上下文。"
        actions={
          <>
            <Link className="btn" to="/idea"><Sparkles size={15} /> New idea</Link>
            <Link className="btn btn-primary" to="/mining"><Plus size={15} /> New experiment</Link>
          </>
        }
      />

      <Metrics
        items={[
          { label: 'Active projects', value: workspaceStats.activeProjects, sub: `共 ${workspaceStats.totalProjects} 个项目` },
          { label: 'Running runs', value: workspaceStats.runningRuns, sub: '实时执行中' },
          { label: 'Experiments', value: workspaceStats.experiments, sub: '全部研究设计' },
          { label: 'Library factors', value: workspaceStats.libraryFactors, sub: `${workspaceStats.promotedFactors} 已晋升` },
          { label: 'Pending validation', value: workspaceStats.pendingValidation, sub: '待决策' },
        ]}
      />

      <div className="split" style={{ marginTop: 16 }}>
        <div>
          <Panel>
            <PanelHead eyebrow="In progress" title="Active runs" aside={<Link className="text-link" to="/runs">All runs <ArrowUpRight size={13} /></Link>} />
            {activeRuns.length === 0 ? (
              <div style={{ padding: 16 }}><em style={{ color: 'var(--text-4)', fontSize: 13 }}>当前没有执行中的 Run。</em></div>
            ) : (
              <div className="table-wrap">
                <table className="data">
                  <thead><tr><th>Run</th><th>Experiment</th><th>Stage</th><th>Progress</th><th className="num-cell">Best IC</th></tr></thead>
                  <tbody>
                    {activeRuns.map((r) => (
                      <tr key={r.id}>
                        <td><Link className="cell-main text-link" to={`/runs/${r.id}`}>{r.id}</Link><span className="cell-sub mono">seed {r.seed} · {r.compute}</span></td>
                        <td><Link className="text-link" to={`/experiments/${r.experimentId}`}>{r.experimentId}</Link></td>
                        <td className="mono" style={{ fontSize: 12 }}>{r.stage}</td>
                        <td><div className="table-progress"><div className="progress thin"><span style={{ width: `${r.progress}%` }} /></div><small>{r.progress}%</small></div></td>
                        <td className="mono num-cell">{r.bestMetric}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>

          <Panel>
            <PanelHead eyebrow="Research designs" title="Recent experiments" aside={<Link className="text-link" to="/experiments">All experiments <ArrowUpRight size={13} /></Link>} />
            <div className="table-wrap">
              <table className="data">
                <thead><tr><th>Experiment</th><th>Miner</th><th>Status</th><th className="num-cell">Runs</th><th className="num-cell">Candidates</th><th>Updated</th></tr></thead>
                <tbody>
                  {recentExperiments.map((e) => (
                    <tr key={e.id}>
                      <td><Link className="cell-main text-link" to={`/experiments/${e.id}`}>{e.name}</Link><span className="cell-sub">{e.researchQuestion}</span></td>
                      <td><span className="tag">{e.miner}</span></td>
                      <td><Pill>{e.status}</Pill></td>
                      <td className="mono num-cell">{e.totalRuns}</td>
                      <td className="mono num-cell">{e.candidates.toLocaleString()}</td>
                      <td style={{ color: 'var(--text-4)', fontSize: 12 }}>{e.updated}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>

        <div>
          <Panel>
            <PanelHead eyebrow="Projects" title="Research projects" />
            <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {projects.map((p) => (
                <Link key={p.id} to={`/projects/${p.id}`} style={{ display: 'block', padding: 12, border: '1px solid var(--line)', borderRadius: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <b style={{ color: 'var(--text)', fontSize: 13 }}>{p.name}</b>
                    <Pill>{p.status}</Pill>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8, fontSize: 12, color: 'var(--text-3)' }}>
                    <span className="mono">{p.experiments} exp</span>
                    <span className="mono">{p.factors} factors</span>
                    <span className="mono">{p.promoted} promoted</span>
                    <Sparkline series={[3, 5, 4, 7, 6, 9, 8, p.promoted + 4]} width={64} height={20} />
                  </div>
                </Link>
              ))}
            </div>
          </Panel>

          <Panel>
            <PanelHead eyebrow="Activity" title="Recent activity" />
            <div className="panel-body">
              <div className="timeline">
                {researchActivity.map(([kind, subject, time]) => (
                  <div className="tl-item" key={subject}>
                    <span className={`tl-dot ${kind.includes('failed') ? 'fail' : kind.includes('promoted') || kind.includes('completed') ? 'done' : 'active'}`} />
                    <div>
                      <b style={{ fontSize: 12, textTransform: 'capitalize' }}>{kind}</b>
                      <small>{subject} · {time}</small>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Panel>

          <Panel>
            <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Link className="btn" to="/mining" style={{ justifyContent: 'flex-start' }}><FlaskConical size={15} /> Configure a mining experiment</Link>
              <Link className="btn" to="/validation" style={{ justifyContent: 'flex-start' }}><Play size={15} /> Open Validation Center</Link>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

export default Home;
