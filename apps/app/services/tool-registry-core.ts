/**
 * 工具注册管理 — 纯数据层 (P-26 ToolRegistry)
 *
 * 包含所有与 React/React Native 无关的纯函数操作，
 * 可被测试和屏幕组件共享。
 */

// ─── 类型定义 ─────────────────────────────────────────────────

export type ToolCategory = 'ai-agent' | 'data-pipeline' | 'integration' | 'automation' | 'analytics';

export type ToolStatus = 'active' | 'inactive' | 'error' | 'pending';

export interface RegisteredTool {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  status: ToolStatus;
  configurable: boolean;
  lastHeartbeat: string;
  endpointUrl?: string;
  version: string;
  errorMessage?: string;
}

export interface ToolConfig {
  maxRetries: number;
  timeoutMs: number;
  enableLogging: boolean;
  rateLimitPerMin: number;
}

export type ToolFilter = 'all' | ToolCategory;

// ─── 常量映射 ─────────────────────────────────────────────────

const CATEGORY_LABELS: Record<ToolCategory, string> = {
  'ai-agent': 'AI 代理',
  'data-pipeline': '数据管道',
  'integration': '系统集成',
  'automation': '自动化',
  'analytics': '数据分析',
};

const CATEGORY_ICONS: Record<ToolCategory, string> = {
  'ai-agent': '🤖',
  'data-pipeline': '🔄',
  'integration': '🔗',
  'automation': '⚡',
  'analytics': '📊',
};

const STATUS_LABELS: Record<ToolStatus, string> = {
  active: '运行中',
  inactive: '已停用',
  error: '异常',
  pending: '等待中',
};

const STATUS_COLORS: Record<ToolStatus, string> = {
  active: '#10B981',
  inactive: '#64748B',
  error: '#EF4444',
  pending: '#F59E0B',
};

// ─── 工具函数 ─────────────────────────────────────────────────

/** 获取分类标签 */
export function getCategoryLabel(category: ToolCategory): string {
  return CATEGORY_LABELS[category] ?? category;
}

/** 获取分类图标 */
export function getCategoryIcon(category: ToolCategory): string {
  return CATEGORY_ICONS[category] ?? '🔧';
}

/** 获取状态标签 */
export function getStatusLabel(status: ToolStatus): string {
  return STATUS_LABELS[status] ?? status;
}

/** 获取状态颜色 */
export function getStatusColor(status: ToolStatus): string {
  return STATUS_COLORS[status] ?? '#64748B';
}

/** 按搜索词过滤工具列表 */
export function filterToolsBySearch(tools: RegisteredTool[], query: string): RegisteredTool[] {
  if (!query.trim()) return tools;
  const lowerQuery = query.toLowerCase();
  return tools.filter(
    (t) =>
      t.name.toLowerCase().includes(lowerQuery) ||
      t.description.toLowerCase().includes(lowerQuery) ||
      t.category.toLowerCase().includes(lowerQuery)
  );
}

/** 按分类过滤工具列表 */
export function filterToolsByCategory(tools: RegisteredTool[], filter: ToolFilter): RegisteredTool[] {
  if (filter === 'all') return tools;
  return tools.filter((t) => t.category === filter);
}

/** 应用所有过滤条件 */
export function applyToolFilters(
  tools: RegisteredTool[],
  searchQuery: string,
  categoryFilter: ToolFilter
): RegisteredTool[] {
  let result = filterToolsBySearch(tools, searchQuery);
  result = filterToolsByCategory(result, categoryFilter);
  return result;
}

/** 统计各状态数量 */
export function countByStatus(tools: RegisteredTool[]): Record<ToolStatus, number> {
  const counts: Record<ToolStatus, number> = {
    active: 0,
    inactive: 0,
    error: 0,
    pending: 0,
  };
  for (const tool of tools) {
    counts[tool.status] = (counts[tool.status] ?? 0) + 1;
  }
  return counts;
}

/** 统计各分类数量 */
export function countByCategory(tools: RegisteredTool[]): Record<ToolCategory, number> {
  const counts: Record<ToolCategory, number> = {
    'ai-agent': 0,
    'data-pipeline': 0,
    'integration': 0,
    'automation': 0,
    'analytics': 0,
  };
  for (const tool of tools) {
    counts[tool.category] = (counts[tool.category] ?? 0) + 1;
  }
  return counts;
}

/** 创建默认工具配置 */
export function createDefaultToolConfig(): ToolConfig {
  return {
    maxRetries: 3,
    timeoutMs: 30000,
    enableLogging: true,
    rateLimitPerMin: 60,
  };
}

/** 验证工具配置 */
export function validateToolConfig(config: ToolConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (config.maxRetries < 0 || config.maxRetries > 10) {
    errors.push('maxRetries 必须在 0~10 之间');
  }
  if (config.timeoutMs < 1000 || config.timeoutMs > 120000) {
    errors.push('timeoutMs 必须在 1000~120000 之间');
  }
  if (config.rateLimitPerMin < 1 || config.rateLimitPerMin > 1000) {
    errors.push('rateLimitPerMin 必须在 1~1000 之间');
  }
  return { valid: errors.length === 0, errors };
}

// ─── 模拟数据 ─────────────────────────────────────────────────

export const MOCK_TOOLS: RegisteredTool[] = [
  {
    id: 'tool-001',
    name: '智能推荐引擎',
    description: '基于用户行为的商品推荐算法，支持实时个性化推荐',
    category: 'ai-agent',
    status: 'active',
    configurable: true,
    lastHeartbeat: '刚刚',
    endpointUrl: 'https://ai-api.m5.local/recommend',
    version: '2.3.1',
  },
  {
    id: 'tool-002',
    name: '数据同步管道',
    description: '门店数据与云端实时同步，支持离线队列',
    category: 'data-pipeline',
    status: 'active',
    configurable: true,
    lastHeartbeat: '1分钟前',
    endpointUrl: 'wss://sync.m5.local/pipeline',
    version: '1.8.0',
  },
  {
    id: 'tool-003',
    name: '支付网关',
    description: '多平台支付集成，支持微信/支付宝/银行卡',
    category: 'integration',
    status: 'active',
    configurable: false,
    lastHeartbeat: '2分钟前',
    version: '3.0.2',
  },
  {
    id: 'tool-004',
    name: '库存预警规则引擎',
    description: '自动检测低库存并生成补货建议',
    category: 'automation',
    status: 'error',
    configurable: true,
    lastHeartbeat: '30分钟前',
    endpointUrl: 'https://automation.m5.local/inventory-alert',
    version: '1.2.0',
    errorMessage: '数据库连接超时: 连接池耗尽',
  },
  {
    id: 'tool-005',
    name: '客流热度分析',
    description: '基于摄像头数据的实时客流统计与热力图',
    category: 'analytics',
    status: 'active',
    configurable: true,
    lastHeartbeat: '刚刚',
    endpointUrl: 'https://analytics.m5.local/traffic',
    version: '2.0.1',
  },
  {
    id: 'tool-006',
    name: '智能客服代理',
    description: 'AI 自动回复常见客户咨询，支持多轮对话',
    category: 'ai-agent',
    status: 'inactive',
    configurable: true,
    lastHeartbeat: '1天前',
    endpointUrl: 'https://ai-api.m5.local/chatbot',
    version: '1.5.3',
  },
  {
    id: 'tool-007',
    name: '短信通知服务',
    description: '交易确认、促销活动等短信推送',
    category: 'integration',
    status: 'pending',
    configurable: false,
    lastHeartbeat: '5分钟前',
    version: '1.0.0',
  },
  {
    id: 'tool-008',
    name: '会员标签计算器',
    description: '基于消费行为的会员标签自动生成',
    category: 'analytics',
    status: 'error',
    configurable: true,
    lastHeartbeat: '1小时前',
    endpointUrl: 'https://analytics.m5.local/member-tag',
    version: '1.4.0',
    errorMessage: '数据源接口返回 503',
  },
];

/** 按分类分组工具列表 */
export function groupToolsByCategory(tools: RegisteredTool[]): Record<ToolCategory, RegisteredTool[]> {
  const groups: Record<ToolCategory, RegisteredTool[]> = {
    'ai-agent': [],
    'data-pipeline': [],
    'integration': [],
    'automation': [],
    'analytics': [],
  };
  for (const tool of tools) {
    const list = groups[tool.category];
    if (list) list.push(tool);
  }
  return groups;
}

/** 获取异常工具列表 */
export function getErrorTools(tools: RegisteredTool[]): RegisteredTool[] {
  return tools.filter((t) => t.status === 'error');
}
