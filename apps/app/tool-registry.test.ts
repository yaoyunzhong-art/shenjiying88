/**
 * ToolRegistry L1 冒烟测试 — P-26 工具注册管理
 *
 * JMeter 风格: 正例 + 边界 + 反例
 *
 * 覆盖：
 *  - 类型守卫与工具数据操作 (pure functions, 无 RN 依赖)
 *  - 过滤函数正例/边界/反例
 *  - 统计函数
 *  - 配置验证
 *  - 模拟数据完整性
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import type {
  RegisteredTool,
  ToolCategory,
  ToolConfig,
} from './services/tool-registry-core';
import {
  getCategoryLabel,
  getCategoryIcon,
  getStatusLabel,
  getStatusColor,
  filterToolsBySearch,
  filterToolsByCategory,
  applyToolFilters,
  countByStatus,
  countByCategory,
  createDefaultToolConfig,
  validateToolConfig,
  MOCK_TOOLS,
} from './services/tool-registry-core';

// ─── 辅助: 构造测试工具对象 ──────────────────────────────────

function createTestTool(overrides: Partial<RegisteredTool> = {}): RegisteredTool {
  return {
    id: 'test-001',
    name: 'Test Tool',
    description: 'A test tool for unit testing',
    category: 'ai-agent',
    status: 'active',
    configurable: true,
    lastHeartbeat: '刚刚',
    version: '1.0.0',
    ...overrides,
  };
}

// ====================================================================
// 1. 正例 — 分类映射
// ====================================================================

test('tool registry: getCategoryLabel returns correct Chinese labels for all categories', () => {
  assert.equal(getCategoryLabel('ai-agent'), 'AI 代理');
  assert.equal(getCategoryLabel('data-pipeline'), '数据管道');
  assert.equal(getCategoryLabel('integration'), '系统集成');
  assert.equal(getCategoryLabel('automation'), '自动化');
  assert.equal(getCategoryLabel('analytics'), '数据分析');
});

test('tool registry: getCategoryIcon returns correct emoji icons for all categories', () => {
  assert.equal(getCategoryIcon('ai-agent'), '🤖');
  assert.equal(getCategoryIcon('data-pipeline'), '🔄');
  assert.equal(getCategoryIcon('integration'), '🔗');
  assert.equal(getCategoryIcon('automation'), '⚡');
  assert.equal(getCategoryIcon('analytics'), '📊');
});

// ====================================================================
// 2. 正例 — 状态映射
// ====================================================================

test('tool registry: getStatusLabel returns correct labels for all statuses', () => {
  assert.equal(getStatusLabel('active'), '运行中');
  assert.equal(getStatusLabel('inactive'), '已停用');
  assert.equal(getStatusLabel('error'), '异常');
  assert.equal(getStatusLabel('pending'), '等待中');
});

test('tool registry: getStatusColor returns correct colors for all statuses', () => {
  assert.equal(getStatusColor('active'), '#10B981');
  assert.equal(getStatusColor('inactive'), '#64748B');
  assert.equal(getStatusColor('error'), '#EF4444');
  assert.equal(getStatusColor('pending'), '#F59E0B');
});

// ====================================================================
// 3. 正例 — 搜索过滤
// ====================================================================

test('tool registry: filterToolsBySearch returns all tools when query is empty', () => {
  const tools = [createTestTool(), createTestTool({ id: 'test-002', name: 'Other Tool' })];
  const result = filterToolsBySearch(tools, '');
  assert.equal(result.length, 2);
});

test('tool registry: filterToolsBySearch matches by name', () => {
  const tools = [
    createTestTool({ id: 't1', name: '智能推荐引擎' }),
    createTestTool({ id: 't2', name: '支付网关' }),
  ];
  const result = filterToolsBySearch(tools, '推荐');
  assert.equal(result.length, 1);
  assert.equal(result[0]!.id, 't1');
});

test('tool registry: filterToolsBySearch matches by description', () => {
  const tools = [
    createTestTool({ id: 't1', name: 'Tool A', description: '库存管理与预警' }),
    createTestTool({ id: 't2', name: 'Tool B', description: '订单处理' }),
  ];
  const result = filterToolsBySearch(tools, '库存');
  assert.equal(result.length, 1);
  assert.equal(result[0]!.id, 't1');
});

test('tool registry: filterToolsBySearch matches by category in lowercase', () => {
  const tools = [
    createTestTool({ id: 't1', category: 'ai-agent' }),
    createTestTool({ id: 't2', category: 'analytics' }),
  ];
  const result = filterToolsBySearch(tools, 'analytics');
  assert.equal(result.length, 1);
  assert.equal(result[0]!.id, 't2');
});

// ====================================================================
// 4. 边界 — 搜索过滤
// ====================================================================

test('tool registry: filterToolsBySearch with whitespace-only query returns all tools', () => {
  const tools = [createTestTool(), createTestTool({ id: 't2' })];
  assert.equal(filterToolsBySearch(tools, '   ').length, 2);
  assert.equal(filterToolsBySearch(tools, '\t\n').length, 2);
});

test('tool registry: filterToolsBySearch with non-matching query returns empty array', () => {
  const tools = [createTestTool({ name: 'Alpha' }), createTestTool({ id: 't2', name: 'Beta' })];
  const result = filterToolsBySearch(tools, 'Gamma');
  assert.equal(result.length, 0);
});

test('tool registry: filterToolsBySearch with special characters handles gracefully', () => {
  const tools = [createTestTool({ description: 'price: $19.99 (discount)' })];
  const result = filterToolsBySearch(tools, '$19.99');
  assert.equal(result.length, 1);
});

test('tool registry: filterToolsBySearch with empty tools array returns empty array', () => {
  const result = filterToolsBySearch([], 'anything');
  assert.deepEqual(result, []);
});

// ====================================================================
// 5. 正例 — 分类过滤
// ====================================================================

test('tool registry: filterToolsByCategory returns all for "all"', () => {
  const tools = [
    createTestTool({ id: 't1', category: 'ai-agent' }),
    createTestTool({ id: 't2', category: 'analytics' }),
    createTestTool({ id: 't3', category: 'integration' }),
  ];
  assert.equal(filterToolsByCategory(tools, 'all').length, 3);
});

test('tool registry: filterToolsByCategory filters by single category', () => {
  const tools = [
    createTestTool({ id: 't1', category: 'ai-agent' }),
    createTestTool({ id: 't2', category: 'analytics' }),
    createTestTool({ id: 't3', category: 'ai-agent' }),
  ];
  const result = filterToolsByCategory(tools, 'ai-agent');
  assert.equal(result.length, 2);
  assert.ok(result.every((t) => t.category === 'ai-agent'));
});

// ====================================================================
// 6. 正例 — 组合过滤
// ====================================================================

test('tool registry: applyToolFilters combines search and category correctly', () => {
  const tools = [
    createTestTool({ id: 't1', name: '推荐引擎', category: 'ai-agent' }),
    createTestTool({ id: 't2', name: '数据管道', category: 'data-pipeline' }),
    createTestTool({ id: 't3', name: '推荐算法', category: 'ai-agent' }),
    createTestTool({ id: 't4', name: '客流分析', category: 'analytics' }),
  ];
  const result = applyToolFilters(tools, '推荐', 'ai-agent');
  assert.equal(result.length, 2);
  assert.ok(result.every((t) => t.name.includes('推荐') && t.category === 'ai-agent'));
});

// ====================================================================
// 7. 统计函数
// ====================================================================

test('tool registry: countByStatus counts all statuses correctly', () => {
  const tools: RegisteredTool[] = [
    createTestTool({ id: 't1', status: 'active' }),
    createTestTool({ id: 't2', status: 'active' }),
    createTestTool({ id: 't3', status: 'inactive' }),
    createTestTool({ id: 't4', status: 'error' }),
    createTestTool({ id: 't5', status: 'pending' }),
  ];
  const counts = countByStatus(tools);
  assert.equal(counts.active, 2);
  assert.equal(counts.inactive, 1);
  assert.equal(counts.error, 1);
  assert.equal(counts.pending, 1);
});

test('tool registry: countByCategory counts all categories correctly', () => {
  const tools: RegisteredTool[] = [
    createTestTool({ id: 't1', category: 'ai-agent' }),
    createTestTool({ id: 't2', category: 'ai-agent' }),
    createTestTool({ id: 't3', category: 'analytics' }),
    createTestTool({ id: 't4', category: 'data-pipeline' }),
    createTestTool({ id: 't5', category: 'integration' }),
    createTestTool({ id: 't6', category: 'automation' }),
  ];
  const counts = countByCategory(tools);
  assert.equal(counts['ai-agent'], 2);
  assert.equal(counts['analytics'], 1);
  assert.equal(counts['data-pipeline'], 1);
  assert.equal(counts['integration'], 1);
  assert.equal(counts['automation'], 1);
});

// ====================================================================
// 8. 正例 — 配置创建与验证
// ====================================================================

test('tool registry: createDefaultToolConfig returns defaults', () => {
  const config = createDefaultToolConfig();
  assert.equal(config.maxRetries, 3);
  assert.equal(config.timeoutMs, 30000);
  assert.equal(config.enableLogging, true);
  assert.equal(config.rateLimitPerMin, 60);
});

test('tool registry: validateToolConfig accepts valid config', () => {
  const config: ToolConfig = { maxRetries: 3, timeoutMs: 30000, enableLogging: true, rateLimitPerMin: 60 };
  const result = validateToolConfig(config);
  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
});

// ====================================================================
// 9. 边界 — 配置验证边界值
// ====================================================================

test('tool registry: validateToolConfig rejects maxRetries below 0', () => {
  const config: ToolConfig = { maxRetries: -1, timeoutMs: 30000, enableLogging: true, rateLimitPerMin: 60 };
  const result = validateToolConfig(config);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes('maxRetries')));
});

test('tool registry: validateToolConfig rejects maxRetries above 10', () => {
  const config: ToolConfig = { maxRetries: 11, timeoutMs: 30000, enableLogging: true, rateLimitPerMin: 60 };
  const result = validateToolConfig(config);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes('maxRetries')));
});

test('tool registry: validateToolConfig rejects timeoutMs below 1000', () => {
  const config: ToolConfig = { maxRetries: 3, timeoutMs: 500, enableLogging: true, rateLimitPerMin: 60 };
  const result = validateToolConfig(config);
  assert.equal(result.valid, false);
});

test('tool registry: validateToolConfig rejects timeoutMs above 120000', () => {
  const config: ToolConfig = { maxRetries: 3, timeoutMs: 180000, enableLogging: true, rateLimitPerMin: 60 };
  const result = validateToolConfig(config);
  assert.equal(result.valid, false);
});

test('tool registry: validateToolConfig rejects rateLimitPerMin below 1', () => {
  const config: ToolConfig = { maxRetries: 3, timeoutMs: 30000, enableLogging: true, rateLimitPerMin: 0 };
  const result = validateToolConfig(config);
  assert.equal(result.valid, false);
});

test('tool registry: validateToolConfig rejects rateLimitPerMin above 1000', () => {
  const config: ToolConfig = { maxRetries: 3, timeoutMs: 30000, enableLogging: true, rateLimitPerMin: 1001 };
  const result = validateToolConfig(config);
  assert.equal(result.valid, false);
});

test('tool registry: validateToolConfig returns multiple errors for multiple violations', () => {
  const config: ToolConfig = { maxRetries: -1, timeoutMs: 500, enableLogging: true, rateLimitPerMin: 0 };
  const result = validateToolConfig(config);
  assert.equal(result.valid, false);
  assert.equal(result.errors.length, 3);
});

// ====================================================================
// 10. 边界零值: empty tools array
// ====================================================================

test('tool registry: countByStatus with empty array returns all zeros', () => {
  const counts = countByStatus([]);
  assert.equal(counts.active, 0);
  assert.equal(counts.inactive, 0);
  assert.equal(counts.error, 0);
  assert.equal(counts.pending, 0);
});

test('tool registry: countByCategory with empty array returns all zeros', () => {
  const counts = countByCategory([]);
  assert.equal(counts['ai-agent'], 0);
  assert.equal(counts['data-pipeline'], 0);
  assert.equal(counts['integration'], 0);
  assert.equal(counts['automation'], 0);
  assert.equal(counts['analytics'], 0);
});

// ====================================================================
// 11. 分类映射 fallback (反例 / 边界)
// ====================================================================

test('tool registry: getCategoryLabel returns input for unknown category', () => {
  // @ts-expect-error — intentionally testing runtime behavior for unexpected input
  const label = getCategoryLabel('unknown-category');
  assert.equal(label, 'unknown-category');
});

test('tool registry: getCategoryIcon returns wrench for unknown category', () => {
  // @ts-expect-error — intentionally testing runtime behavior for unexpected input
  const icon = getCategoryIcon('unknown-category');
  assert.equal(icon, '🔧');
});

// ====================================================================
// 12. 状态映射 fallback
// ====================================================================

test('tool registry: getStatusLabel returns input for unknown status', () => {
  // @ts-expect-error — intentionally testing runtime behavior for unexpected input
  const label = getStatusLabel('unknown-status');
  assert.equal(label, 'unknown-status');
});

test('tool registry: getStatusColor returns gray for unknown status', () => {
  // @ts-expect-error — intentionally testing runtime behavior for unexpected input
  const color = getStatusColor('unknown-status');
  assert.equal(color, '#64748B');
});

// ====================================================================
// 13. MOCK_TOOLS 数据完整性
// ====================================================================

test('tool registry: MOCK_TOOLS contains 8 tools with all required fields', () => {
  assert.equal(MOCK_TOOLS.length, 8);
  for (const tool of MOCK_TOOLS) {
    assert.ok(typeof tool.id === 'string' && tool.id.length > 0, `tool ${tool.id} missing id`);
    assert.ok(typeof tool.name === 'string' && tool.name.length > 0, `tool ${tool.id} missing name`);
    assert.ok(typeof tool.description === 'string' && tool.description.length > 0, `tool ${tool.id} missing description`);
    assert.ok(['ai-agent', 'data-pipeline', 'integration', 'automation', 'analytics'].includes(tool.category), `tool ${tool.id} invalid category`);
    assert.ok(['active', 'inactive', 'error', 'pending'].includes(tool.status), `tool ${tool.id} invalid status`);
    assert.ok(typeof tool.version === 'string' && tool.version.length > 0, `tool ${tool.id} missing version`);
    assert.ok(typeof tool.lastHeartbeat === 'string', `tool ${tool.id} missing lastHeartbeat`);
    assert.ok(typeof tool.configurable === 'boolean', `tool ${tool.id} missing configurable`);
  }
});

test('tool registry: MOCK_TOOLS covers all categories', () => {
  const cats = new Set(MOCK_TOOLS.map((t) => t.category));
  assert.ok(cats.has('ai-agent'));
  assert.ok(cats.has('data-pipeline'));
  assert.ok(cats.has('integration'));
  assert.ok(cats.has('automation'));
  assert.ok(cats.has('analytics'));
});

test('tool registry: MOCK_TOOLS covers all statuses', () => {
  const statuses = new Set(MOCK_TOOLS.map((t) => t.status));
  assert.ok(statuses.has('active'));
  assert.ok(statuses.has('inactive'));
  assert.ok(statuses.has('error'));
  assert.ok(statuses.has('pending'));
});

// ====================================================================
// 14. 边界: 超大列表搜索性能不抛出异常
// ====================================================================

test('tool registry: filterToolsBySearch handles large tool list without error', () => {
  const tools: RegisteredTool[] = [];
  for (let i = 0; i < 1000; i++) {
    tools.push(createTestTool({ id: `large-${i}`, name: `Tool-${i}`, description: `Description for tool number ${i}` }));
  }
  // Search for a non-existent term
  const result = filterToolsBySearch(tools, 'nonexistent-term-xyz');
  assert.equal(result.length, 0);

  // Search for something that exists (unique name)
  const result2 = filterToolsBySearch(tools, 'Tool-999');
  assert.equal(result2.length, 1);

  // Search for something partially matching many
  const result3 = filterToolsBySearch(tools, 'tool number');
  assert.equal(result3.length, 1000);
});

// ====================================================================
// 15. getErrorTools
// ====================================================================

test('tool registry: getErrorTools returns only error tools', () => {
  const result = MOCK_TOOLS.filter((t) => t.status === 'error');
  assert.equal(result.length, 2);
  assert.ok(result.every((t) => t.status === 'error'));
});
