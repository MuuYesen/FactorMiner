/**
 * Generic renderers driven by schema — the ONLY place miner-specific shapes are
 * turned into UI. Core pages compose these; they never branch on miner id.
 *
 *  - SchemaForm         : renders a miner configSchema into a grouped form
 *  - ArtifactRenderer   : maps artifactType -> visual renderer (registry)
 *  - DefinitionRenderer : maps factor definitionType -> renderer (registry)
 */
import { useMemo, useState, type ReactNode } from 'react';
import { ChevronDown, ChevronRight, Check, FileDown, Image as ImageIcon } from 'lucide-react';
import type { SchemaField, DefinitionType, ArtifactType } from './miners';
import { featureGroups, operators as operatorList } from '../data/researchData';
import { LineChart } from '../components/ui';

const modelOptions = ['gpt-4.1', 'gpt-4o', 'claude-3.7-sonnet', 'o3', 'deepseek-r1'];
const fitnessOptions = ['RankIC - λ·turnover', 'IC', 'ICIR', 'Sharpe'];

/* ============================ Schema Form ============================ */

type FormValue = Record<string, unknown>;

function visible(field: SchemaField, values: FormValue): boolean {
  if (!field.visibleIf) return true;
  return values[field.visibleIf.key] === field.visibleIf.equals;
}

export function SchemaForm({ schema, values, onChange }: {
  schema: SchemaField[];
  values: FormValue;
  onChange: (key: string, value: unknown) => void;
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const groups = useMemo(() => {
    const order: string[] = [];
    const map: Record<string, SchemaField[]> = {};
    for (const f of schema) {
      const g = f.group || 'Configuration';
      if (!map[g]) { map[g] = []; order.push(g); }
      map[g].push(f);
    }
    return order.map((g) => ({ name: g, fields: map[g] }));
  }, [schema]);

  const hasAdvanced = schema.some((f) => f.advanced);

  return (
    <div className="schema-form">
      {groups.map((group) => {
        const base = group.fields.filter((f) => !f.advanced && visible(f, values));
        const adv = group.fields.filter((f) => f.advanced && visible(f, values));
        if (base.length === 0 && (adv.length === 0 || !showAdvanced)) {
          if (base.length === 0) return null;
        }
        return (
          <fieldset className="form-section" key={group.name}>
            <legend>{group.name}</legend>
            <div className="field-grid">
              {base.map((f) => <FieldRenderer key={f.key} field={f} value={values[f.key]} onChange={(v) => onChange(f.key, v)} />)}
              {showAdvanced && adv.map((f) => <FieldRenderer key={f.key} field={f} value={values[f.key]} onChange={(v) => onChange(f.key, v)} />)}
            </div>
          </fieldset>
        );
      })}
      {hasAdvanced && (
        <button type="button" className="advanced-toggle" onClick={() => setShowAdvanced((v) => !v)}>
          {showAdvanced ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          {showAdvanced ? 'Hide advanced parameters' : 'Show advanced parameters'}
        </button>
      )}
    </div>
  );
}

function FieldRenderer({ field, value, onChange }: { field: SchemaField; value: unknown; onChange: (v: unknown) => void }) {
  const wide = field.type === 'textarea' || field.type === 'code' || field.type === 'json'
    || field.type === 'feature-selector' || field.type === 'operator-selector' || field.type === 'multi-select';

  const label = (
    <span className="field-label">
      {field.label}{field.required && <i className="req" title="Required">*</i>}
    </span>
  );

  let control: ReactNode;
  switch (field.type) {
    case 'textarea':
      control = <textarea rows={3} value={String(value ?? '')} placeholder={field.placeholder} onChange={(e) => onChange(e.target.value)} />;
      break;
    case 'code':
      control = <textarea className="mono" rows={5} value={String(value ?? '')} placeholder={field.placeholder} onChange={(e) => onChange(e.target.value)} />;
      break;
    case 'json':
      control = <textarea className="mono" rows={5} value={typeof value === 'string' ? value : JSON.stringify(value ?? {}, null, 2)} onChange={(e) => onChange(e.target.value)} />;
      break;
    case 'integer':
    case 'float':
      control = <input type="number" value={value === undefined ? '' : Number(value)} min={field.min} max={field.max} step={field.step ?? (field.type === 'integer' ? 1 : 'any')} onChange={(e) => onChange(field.type === 'integer' ? parseInt(e.target.value, 10) : parseFloat(e.target.value))} />;
      break;
    case 'boolean':
      control = (
        <button type="button" role="switch" aria-checked={Boolean(value)} className={`switch ${value ? 'on' : ''}`} onClick={() => onChange(!value)}>
          <span className="switch-knob" />
        </button>
      );
      break;
    case 'range':
      control = (
        <div className="range-row">
          <input type="range" min={field.min ?? 0} max={field.max ?? 1} step={field.step ?? 0.01} value={Number(value ?? 0)} onChange={(e) => onChange(parseFloat(e.target.value))} />
          <span className="mono range-val">{Number(value ?? 0).toFixed(2)}</span>
        </div>
      );
      break;
    case 'enum':
      control = <select value={String(value ?? '')} onChange={(e) => onChange(e.target.value)}>{field.options?.map((o) => <option key={o} value={o}>{o}</option>)}</select>;
      break;
    case 'model-selector':
      control = <select value={String(value ?? '')} onChange={(e) => onChange(e.target.value)}>{modelOptions.map((o) => <option key={o} value={o}>{o}</option>)}</select>;
      break;
    case 'fitness-selector':
      control = <select value={String(value ?? '')} onChange={(e) => onChange(e.target.value)}>{fitnessOptions.map((o) => <option key={o} value={o}>{o}</option>)}</select>;
      break;
    case 'feature-selector':
    case 'operator-selector':
    case 'multi-select': {
      const opts = field.type === 'feature-selector' ? featureGroups : field.type === 'operator-selector' ? operatorList : (field.options ?? []);
      const arr = Array.isArray(value) ? (value as string[]) : [];
      control = (
        <div className="tag-row">
          {opts.map((o) => {
            const on = arr.includes(o);
            return (
              <button type="button" key={o} className={`chip-toggle ${on ? 'on' : ''}`} onClick={() => onChange(on ? arr.filter((x) => x !== o) : [...arr, o])}>
                {on && <Check size={13} />}{o}
              </button>
            );
          })}
        </div>
      );
      break;
    }
    case 'date':
      control = <input type="date" value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} />;
      break;
    default:
      control = <input value={String(value ?? '')} placeholder={field.placeholder} onChange={(e) => onChange(e.target.value)} />;
  }

  return (
    <label className={`field ${wide ? 'field-wide' : ''} ${field.type === 'boolean' ? 'field-switch' : ''}`}>
      {label}
      {control}
      {field.help && <small className="field-help">{field.help}</small>}
    </label>
  );
}

/* ============================ Artifact Renderer Registry ============================ */

export interface Artifact {
  id: string;
  runId: string;
  type: ArtifactType;
  label: string;
  data: unknown;
}

type TreeNode = { label: string; detail?: string; status?: string; children?: TreeNode[] };
type TimelineEntry = { time: string; title: string; detail?: string };
type TableData = { columns: string[]; rows: (string | number)[][] };

export function ArtifactRenderer({ artifact }: { artifact: Artifact }) {
  const { type, data } = artifact;
  switch (type) {
    case 'text':
      return <p className="artifact-text">{String(data)}</p>;
    case 'markdown':
      return <MarkdownView source={String(data)} />;
    case 'code':
      return <pre className="code-block">{String(data)}</pre>;
    case 'json':
      return <pre className="code-block">{JSON.stringify(data, null, 2)}</pre>;
    case 'key-value':
      return (
        <dl className="kv">
          {Object.entries(data as Record<string, ReactNode>).map(([k, v]) => (<><dt key={`${k}-k`}>{k}</dt><dd key={`${k}-v`} className="mono">{v}</dd></>))}
        </dl>
      );
    case 'table':
      return <ArtifactTable data={data as TableData} />;
    case 'timeseries':
      return <LineChart series={data as number[]} />;
    case 'tree':
      return <TreeView node={data as TreeNode} />;
    case 'timeline':
      return <TimelineView entries={data as TimelineEntry[]} />;
    case 'image':
      return <div className="artifact-image"><ImageIcon size={18} /><span>{String(data)}</span></div>;
    case 'file':
      return <a className="artifact-file" href="#" onClick={(e) => e.preventDefault()}><FileDown size={16} />{String(data)}</a>;
    case 'graph':
      return <div className="artifact-graph"><span>Graph artifact · {Array.isArray(data) ? (data as unknown[]).length : 0} nodes</span></div>;
    default:
      return <pre className="code-block">{JSON.stringify(data, null, 2)}</pre>;
  }
}

function MarkdownView({ source }: { source: string }) {
  // Lightweight markdown: headings, bold, list items, paragraphs.
  const blocks = source.trim().split(/\n{2,}/);
  return (
    <div className="markdown">
      {blocks.map((block, i) => {
        if (block.startsWith('### ')) return <h4 key={i}>{block.slice(4)}</h4>;
        if (block.startsWith('## ')) return <h3 key={i}>{block.slice(3)}</h3>;
        if (block.split('\n').every((l) => l.startsWith('- '))) {
          return <ul key={i}>{block.split('\n').map((l, j) => <li key={j}>{inline(l.slice(2))}</li>)}</ul>;
        }
        return <p key={i}>{inline(block)}</p>;
      })}
    </div>
  );
}

function inline(text: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**')) return <b key={i}>{p.slice(2, -2)}</b>;
    if (p.startsWith('`') && p.endsWith('`')) return <code key={i}>{p.slice(1, -1)}</code>;
    return <span key={i}>{p}</span>;
  });
}

function ArtifactTable({ data }: { data: TableData }) {
  return (
    <div className="table-wrap">
      <table className="data">
        <thead><tr>{data.columns.map((c, i) => <th key={c} className={i > 0 ? 'num-cell' : ''}>{c}</th>)}</tr></thead>
        <tbody>{data.rows.map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j} className={j > 0 ? 'mono num-cell' : ''}>{cell}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

function TreeView({ node, depth = 0 }: { node: TreeNode; depth?: number }) {
  const [open, setOpen] = useState(depth < 2);
  const hasChildren = node.children && node.children.length > 0;
  return (
    <div className="tree-node" style={{ marginLeft: depth === 0 ? 0 : 16 }}>
      <div className="tree-row">
        {hasChildren ? (
          <button className="tree-toggle" onClick={() => setOpen((v) => !v)} aria-label={open ? 'Collapse' : 'Expand'}>
            {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          </button>
        ) : <span className="tree-leaf-dot" />}
        <span className="tree-label">{node.label}</span>
        {node.status && <span className={`pill pill-${node.status === 'confirmed' ? 'success' : node.status === 'rejected' ? 'danger' : 'neutral'} no-dot`}>{node.status}</span>}
        {node.detail && <span className="tree-detail">{node.detail}</span>}
      </div>
      {open && hasChildren && node.children!.map((c, i) => <TreeView key={i} node={c} depth={depth + 1} />)}
    </div>
  );
}

function TimelineView({ entries }: { entries: TimelineEntry[] }) {
  return (
    <ol className="timeline">
      {entries.map((e, i) => (
        <li key={i}>
          <span className="timeline-dot" />
          <div className="timeline-body">
            <div className="timeline-head"><b>{e.title}</b><span className="mono">{e.time}</span></div>
            {e.detail && <p>{e.detail}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}

/* ============================ Definition Renderer Registry ============================ */

export interface FactorDefinition {
  type: DefinitionType;
  /** Human-facing representation: expression string, code, model ref, etc. */
  value: string;
  /** Optional structured AST for tree rendering. */
  ast?: TreeNode;
  language?: string;
}

export function DefinitionRenderer({ definition }: { definition: FactorDefinition }) {
  switch (definition.type) {
    case 'ast':
      return (
        <div className="definition-ast">
          <div className="def-expression"><code>{definition.value}</code></div>
          {definition.ast && <div className="def-tree"><TreeView node={definition.ast} /></div>}
        </div>
      );
    case 'code':
      return <pre className="code-block">{definition.value}</pre>;
    case 'model':
      return (
        <div className="definition-model">
          <div className="def-badge">MODEL</div>
          <code>{definition.value}</code>
          <p>模型型因子：定义为已训练模型的引用与输入通道，通过统一 Model Renderer 展示。</p>
        </div>
      );
    case 'tensor':
      return (
        <div className="definition-model">
          <div className="def-badge">TENSOR</div>
          <code>{definition.value}</code>
          <p>张量/通道型因子：定义为模型内部特征通道。</p>
        </div>
      );
    case 'composite':
      return (
        <div className="definition-composite">
          <div className="def-badge">COMPOSITE</div>
          <code>{definition.value}</code>
        </div>
      );
    default:
      return <pre className="code-block">{definition.value}</pre>;
  }
}

export const definitionTypeLabels: Record<DefinitionType, string> = {
  ast: 'Expression / AST',
  code: 'Generated Code',
  model: 'Model Reference',
  tensor: 'Tensor Channel',
  composite: 'Composite',
};
