/**
 * Miner Registry — the single source of truth the frontend uses to render any
 * miner. Core pages MUST NOT branch on miner identity; they read these schemas.
 *
 * Adding a future miner = registering a MinerDefinition here (config/metric/
 * artifact/definition schemas). No navigation, builder, run-workspace, library,
 * or validation React code should need to change.
 */

export type Paradigm = 'GP' | 'RL' | 'LLM' | 'NN';

export type FieldType =
  | 'text' | 'textarea' | 'integer' | 'float' | 'boolean' | 'enum'
  | 'multi-select' | 'range' | 'date' | 'date-range'
  | 'model-selector' | 'feature-selector' | 'operator-selector' | 'fitness-selector'
  | 'code' | 'json';

export interface SchemaField {
  key: string;
  label: string;
  type: FieldType;
  default?: unknown;
  min?: number;
  max?: number;
  step?: number;
  required?: boolean;
  help?: string;
  /** Section grouping for the form renderer, e.g. "Basic", "Search Strategy". */
  group?: string;
  advanced?: boolean;
  options?: string[];
  order?: number;
  placeholder?: string;
  /** Dependency: field only shows when another field equals a value. */
  visibleIf?: { key: string; equals: unknown };
}

export type MetricFormat = 'ratio' | 'percent' | 'decimal2' | 'decimal3' | 'integer';

export interface MetricDefinition {
  key: string;
  label: string;
  format: MetricFormat;
  higherIsBetter: boolean;
  description: string;
  category: 'predictive' | 'stability' | 'cost' | 'structure' | 'research';
}

export type DefinitionType = 'ast' | 'code' | 'model' | 'tensor' | 'composite';

export type ArtifactType =
  | 'text' | 'markdown' | 'code' | 'json' | 'table' | 'metrics'
  | 'timeseries' | 'tree' | 'graph' | 'image' | 'file' | 'key-value' | 'timeline';

export interface ArtifactSchema {
  type: ArtifactType;
  label: string;
  description?: string;
}

export interface MinerDefinition {
  id: string;
  name: string;
  description: string;
  version: string;
  paradigm: Paradigm;
  type: string;
  enabled: boolean;
  capabilities: string[];
  configSchema: SchemaField[];
  /** Miner-specific extension metrics (merged with the shared metric registry). */
  metricSchema: MetricDefinition[];
  artifactSchemas: ArtifactSchema[];
  definitionTypes: DefinitionType[];
  recentRuns: number;
  /** Stage label used by the unified progress contract, e.g. "Generation". */
  stageUnit: string;
}

/* -------------------------------------------------------------------------- */
/* Shared metric registry — every miner inherits these predictive/cost metrics */
/* -------------------------------------------------------------------------- */

export const sharedMetrics: MetricDefinition[] = [
  { key: 'fitness', label: 'Fitness', format: 'decimal3', higherIsBetter: true, description: '搜索期综合适应度（样本内），用于指导 Miner 搜索，不等于正式验证结论。', category: 'research' },
  { key: 'ic', label: 'IC', format: 'decimal3', higherIsBetter: true, description: '信息系数：因子值与未来收益的相关性。', category: 'predictive' },
  { key: 'rankIc', label: 'RankIC', format: 'decimal3', higherIsBetter: true, description: '基于排序的秩相关信息系数，对异常值更稳健。', category: 'predictive' },
  { key: 'icir', label: 'ICIR', format: 'decimal2', higherIsBetter: true, description: 'IC 的信息比率（IC 均值 / IC 标准差）。', category: 'stability' },
  { key: 'turnover', label: 'Turnover', format: 'percent', higherIsBetter: false, description: '组合换手率，越低交易成本越可控。', category: 'cost' },
  { key: 'coverage', label: 'Coverage', format: 'percent', higherIsBetter: true, description: '因子在标的池上的有效覆盖率。', category: 'structure' },
  { key: 'complexity', label: 'Complexity', format: 'decimal2', higherIsBetter: false, description: '定义复杂度，越低越可解释、越不易过拟合。', category: 'structure' },
];

/* -------------------------------------------------------------------------- */
/* Miner definitions                                                          */
/* -------------------------------------------------------------------------- */

export const minerRegistry: MinerDefinition[] = [
  {
    id: 'gp',
    name: 'GP Miner',
    description: '遗传编程符号回归，搜索可解释的表达式因子。',
    version: '2.4.0',
    paradigm: 'GP',
    type: 'Evolutionary Search',
    enabled: true,
    capabilities: ['symbolic_regression', 'mutation', 'crossover', 'ast_output'],
    definitionTypes: ['ast'],
    stageUnit: 'Generation',
    recentRuns: 9,
    metricSchema: [
      { key: 'depth', label: 'Depth', format: 'integer', higherIsBetter: false, description: '表达式树深度。', category: 'structure' },
    ],
    artifactSchemas: [
      { type: 'tree', label: 'Expression Tree', description: '最优候选的 AST 结构。' },
      { type: 'timeseries', label: 'Fitness Curve', description: '每代最优适应度。' },
      { type: 'table', label: 'Operator Usage', description: '算子使用频率统计。' },
    ],
    configSchema: [
      { key: 'population', label: 'Population', type: 'integer', default: 2000, min: 100, max: 20000, step: 100, group: 'Search Strategy', help: '每代种群规模。' },
      { key: 'generations', label: 'Generations', type: 'integer', default: 40, min: 5, max: 500, group: 'Search Strategy' },
      { key: 'mutationRate', label: 'Mutation rate', type: 'range', default: 0.2, min: 0, max: 1, step: 0.01, group: 'Search Strategy' },
      { key: 'crossoverRate', label: 'Crossover rate', type: 'range', default: 0.7, min: 0, max: 1, step: 0.01, group: 'Search Strategy' },
      { key: 'maxDepth', label: 'Max expression depth', type: 'integer', default: 8, min: 2, max: 20, group: 'Search Strategy' },
      { key: 'operators', label: 'Operators', type: 'operator-selector', default: ['横截面', '时间序列', '数学变换'], group: 'Operators' },
      { key: 'parsimony', label: 'Parsimony pressure', type: 'range', default: 0.1, min: 0, max: 1, step: 0.01, group: 'Advanced', advanced: true, help: '对复杂表达式的惩罚强度。' },
      { key: 'seed', label: 'Random seed', type: 'integer', default: 42, group: 'Advanced', advanced: true },
    ],
  },
  {
    id: 'rl',
    name: 'RL Miner',
    description: '基于策略的强化学习，在算子空间中搜索因子。',
    version: '1.6.2',
    paradigm: 'RL',
    type: 'Policy Search',
    enabled: true,
    capabilities: ['policy_search', 'reward_shaping', 'ast_output'],
    definitionTypes: ['ast'],
    stageUnit: 'Episode',
    recentRuns: 4,
    metricSchema: [
      { key: 'reward', label: 'Reward', format: 'decimal3', higherIsBetter: true, description: '策略累计奖励。', category: 'research' },
    ],
    artifactSchemas: [
      { type: 'timeseries', label: 'Reward Curve', description: '训练奖励曲线。' },
      { type: 'tree', label: 'Action-derived Expression', description: '动作序列还原的表达式。' },
    ],
    configSchema: [
      { key: 'algorithm', label: 'Algorithm', type: 'enum', options: ['PPO', 'A2C', 'DQN'], default: 'PPO', group: 'Search Strategy' },
      { key: 'episodes', label: 'Episodes', type: 'integer', default: 5000, min: 100, max: 100000, step: 100, group: 'Search Strategy' },
      { key: 'reward', label: 'Reward shaping', type: 'text', default: 'IC delta per step', group: 'Search Strategy' },
      { key: 'entropy', label: 'Entropy coefficient', type: 'range', default: 0.01, min: 0, max: 0.5, step: 0.001, group: 'Advanced', advanced: true },
      { key: 'seed', label: 'Random seed', type: 'integer', default: 7, group: 'Advanced', advanced: true },
    ],
  },
  {
    id: 'llm_standard',
    name: 'Standard LLM',
    description: '语言模型生成并反思因子表达式与代码。',
    version: '3.1.0',
    paradigm: 'LLM',
    type: 'Generative',
    enabled: true,
    capabilities: ['code_generation', 'reflection', 'diversity'],
    definitionTypes: ['code'],
    stageUnit: 'Round',
    recentRuns: 6,
    metricSchema: [
      { key: 'novelty', label: 'Novelty', format: 'decimal2', higherIsBetter: true, description: '相对已有因子库的新颖度。', category: 'research' },
    ],
    artifactSchemas: [
      { type: 'code', label: 'Generated Code', description: '模型生成的因子代码。' },
      { type: 'markdown', label: 'Reasoning', description: '生成与反思推理记录。' },
      { type: 'table', label: 'Round Summary', description: '每轮候选与筛选统计。' },
    ],
    configSchema: [
      { key: 'model', label: 'Model', type: 'model-selector', default: 'gpt-4.1', group: 'Model' },
      { key: 'candidateBudget', label: 'Candidate budget', type: 'integer', default: 400, min: 10, max: 10000, step: 10, group: 'Search Strategy' },
      { key: 'perRound', label: 'Candidates / round', type: 'integer', default: 20, min: 1, max: 200, group: 'Search Strategy' },
      { key: 'promptStrategy', label: 'Prompt strategy', type: 'enum', options: ['Zero-shot', 'Few-shot', 'Chain-of-thought'], default: 'Few-shot', group: 'Search Strategy' },
      { key: 'reflection', label: 'Reflection', type: 'boolean', default: true, group: 'Search Strategy', help: '每轮后基于反馈进行自我反思。' },
      { key: 'diversity', label: 'Diversity pressure', type: 'range', default: 0.4, min: 0, max: 1, step: 0.01, group: 'Advanced', advanced: true },
      { key: 'temperature', label: 'Temperature', type: 'range', default: 0.7, min: 0, max: 2, step: 0.05, group: 'Advanced', advanced: true },
    ],
  },
  {
    id: 'quanta_alpha',
    name: 'Quanta Alpha',
    description: 'LLM 范式下的自主多智能体研究 Miner：观察、假设、批判、反思、记忆与自主跟进。',
    version: '0.9.0',
    paradigm: 'LLM',
    type: 'Autonomous Multi-Agent',
    enabled: true,
    capabilities: [
      'hypothesis_generation', 'critique', 'evidence_feedback', 'reflection',
      'research_memory', 'autonomous_followup', 'multi_agent', 'code_generation',
    ],
    definitionTypes: ['code'],
    stageUnit: 'Research Iteration',
    recentRuns: 11,
    metricSchema: [
      { key: 'hypothesisConfidence', label: 'Hypothesis confidence', format: 'percent', higherIsBetter: true, description: '智能体对假设的置信度。', category: 'research' },
      { key: 'novelty', label: 'Novelty', format: 'decimal2', higherIsBetter: true, description: '相对研究记忆的新颖度。', category: 'research' },
    ],
    artifactSchemas: [
      { type: 'tree', label: 'Research Tree', description: '假设 → 批判 → 证据 → 跟进的研究树。' },
      { type: 'table', label: 'Hypotheses', description: '生成的研究假设与状态。' },
      { type: 'markdown', label: 'Agent Reflection', description: '智能体反思纪要。' },
      { type: 'timeline', label: 'Research Memory', description: '跨迭代的研究记忆时间线。' },
      { type: 'code', label: 'Generated Factor Code', description: '假设推导出的因子代码。' },
    ],
    configSchema: [
      { key: 'researchObjective', label: 'Research objective', type: 'textarea', default: '', required: true, group: 'Basic', placeholder: '例如：发现资金费率极端后的短周期反转信号', help: '自主研究的高层目标，驱动假设生成。' },
      { key: 'model', label: 'Reasoning model', type: 'model-selector', default: 'gpt-4.1', group: 'Model' },
      { key: 'researchIterations', label: 'Research iterations', type: 'integer', default: 10, min: 1, max: 100, group: 'Search Strategy' },
      { key: 'hypothesisBudget', label: 'Hypothesis budget', type: 'integer', default: 40, min: 1, max: 1000, group: 'Search Strategy' },
      { key: 'parallelBranches', label: 'Parallel branches', type: 'integer', default: 3, min: 1, max: 16, group: 'Search Strategy' },
      { key: 'candidateBudget', label: 'Candidate budget', type: 'integer', default: 600, min: 10, max: 20000, step: 10, group: 'Search Strategy' },
      { key: 'hypothesisGeneration', label: 'Hypothesis generation', type: 'boolean', default: true, group: 'Agents' },
      { key: 'hypothesisCritique', label: 'Hypothesis critique', type: 'boolean', default: true, group: 'Agents' },
      { key: 'evidenceFeedback', label: 'Evidence feedback', type: 'boolean', default: true, group: 'Agents' },
      { key: 'autonomousFollowup', label: 'Autonomous follow-up', type: 'boolean', default: true, group: 'Agents', help: '允许智能体基于证据自主提出后续假设。' },
      { key: 'researchMemory', label: 'Research memory', type: 'boolean', default: true, group: 'Memory' },
      { key: 'memoryScope', label: 'Memory scope', type: 'enum', options: ['Experiment', 'Project', 'Workspace'], default: 'Project', group: 'Memory', visibleIf: { key: 'researchMemory', equals: true } },
      { key: 'critiqueTemperature', label: 'Critique temperature', type: 'range', default: 0.3, min: 0, max: 2, step: 0.05, group: 'Advanced', advanced: true },
    ],
  },
  {
    id: 'nn',
    name: 'NN Miner',
    description: '端到端神经网络因子发现，输出模型/张量通道定义。',
    version: '0.5.1',
    paradigm: 'NN',
    type: 'Deep Learning',
    enabled: false,
    capabilities: ['representation_learning', 'model_output'],
    definitionTypes: ['model', 'tensor'],
    stageUnit: 'Epoch',
    recentRuns: 0,
    metricSchema: [
      { key: 'valLoss', label: 'Val loss', format: 'decimal3', higherIsBetter: false, description: '验证集损失。', category: 'research' },
    ],
    artifactSchemas: [
      { type: 'timeseries', label: 'Loss Curve', description: '训练 / 验证损失曲线。' },
      { type: 'image', label: 'Attention Map', description: '特征注意力可视化。' },
      { type: 'file', label: 'Checkpoint', description: '模型权重检查点。' },
    ],
    configSchema: [
      { key: 'architecture', label: 'Architecture', type: 'enum', options: ['MLP', 'LSTM', 'Transformer', 'TCN'], default: 'Transformer', group: 'Model' },
      { key: 'epochs', label: 'Epochs', type: 'integer', default: 100, min: 1, max: 1000, group: 'Search Strategy' },
      { key: 'batchSize', label: 'Batch size', type: 'integer', default: 512, min: 8, max: 8192, step: 8, group: 'Search Strategy' },
      { key: 'lr', label: 'Learning rate', type: 'float', default: 0.001, min: 0.00001, max: 1, step: 0.0001, group: 'Advanced', advanced: true },
    ],
  },
];

export function getMiner(id: string): MinerDefinition | undefined {
  return minerRegistry.find((m) => m.id === id);
}

export function metricsForMiner(id: string): MetricDefinition[] {
  const miner = getMiner(id);
  return miner ? [...sharedMetrics, ...miner.metricSchema] : sharedMetrics;
}

export const metricByKey: Record<string, MetricDefinition> = Object.fromEntries(
  [...sharedMetrics, ...minerRegistry.flatMap((m) => m.metricSchema)].map((m) => [m.key, m]),
);

export function formatMetric(key: string, value: number | undefined): string {
  if (value === undefined || value === null || Number.isNaN(value)) return '—';
  const def = metricByKey[key];
  switch (def?.format) {
    case 'percent': return `${value.toFixed(1)}%`;
    case 'decimal2': return value.toFixed(2);
    case 'decimal3': return value.toFixed(3);
    case 'integer': return String(Math.round(value));
    case 'ratio': return value.toFixed(2);
    default: return String(value);
  }
}

/** Default config object derived from a miner's schema (used by the builder). */
export function defaultConfig(id: string): Record<string, unknown> {
  const miner = getMiner(id);
  if (!miner) return {};
  return Object.fromEntries(miner.configSchema.map((f) => [f.key, f.default]));
}

export const paradigmLabels: Record<Paradigm, string> = {
  GP: 'Genetic Programming',
  RL: 'Reinforcement Learning',
  LLM: 'Large Language Model',
  NN: 'Neural Network',
};
