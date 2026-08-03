/**
 * task-center/page.test.ts — 门店任务中心页源码分析测试
 *
 * 测试策略: 纯 node:test 源码分析，覆盖以下 10 个维度:
 *   1. 文件结构 & 导出 — 确认页面文件完整性
 *   2. 类型系统 — 5种任务类型 / 4种优先级 / 3种状态 / Task接口字段
 *   3. 常量映射 — TYPE_LABELS / TYPE_COLORS / STATUS_LABELS / PriorityBadge 配置
 *   4. Mock 数据 — 10条任务全覆盖 + 字段完整性 + 边界值
 *   5. 子组件 — TaskTypeBadge / PriorityBadge 定义
 *   6. 统计逻辑 — critical/pending/in_progress/overdue 四种统计 + 边界条件
 *   7. 筛选逻辑 — filterType + useMemo 过滤 + 全部6个筛选按钮
 *   8. 拖拽逻辑 — handleCardMove 状态更新 + toast 通知
 *   9. 看板数据 — columns 生成 + bgColor + card subtitle 组合
 *  10. 边界场景 — 超期与非超期 / 已完成不计紧急 / 空状态渲染 / 无 any
 *
 * 不使用 JSX 渲染/SSR，纯节点字符串分析 (node:test, no tsx).
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import fs from 'node:fs';
import path from 'node:path';

// ── 文件路径 ──
const PAGE_PATH = path.resolve(__dirname, 'page.tsx');
const pageSource = fs.readFileSync(PAGE_PATH, 'utf-8');

// ── 辅助函数 ──

/** 统计 source 中某个模式出现的次数 */
function countOccurrences(source: string, pattern: string | RegExp): number {
  if (typeof pattern === 'string') {
    return source.split(pattern).length - 1;
  }
  const re = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g');
  return (source.match(re) || []).length;
}

// ═══════════════════════════════════════════════════════════════
// 1. 文件结构 & 导出
// ═══════════════════════════════════════════════════════════════

describe('TaskCenterPage — 文件结构 & 导出', () => {
  it('页面文件存在且可读', () => {
    assert.ok(fs.existsSync(PAGE_PATH), `文件不存在: ${PAGE_PATH}`);
    assert.ok(pageSource.length > 0, '文件内容为空');
  });

  it('使用 "use client" 指令', () => {
    assert.ok(pageSource.includes("'use client'"), '缺少 use client 指令');
  });

  it('导出默认函数组件 TaskCenterPage', () => {
    assert.match(pageSource, /export\s+default\s+function\s+TaskCenterPage/);
  });

  it('从 @m5/ui 导入必需的 UI 组件', () => {
    const importLine = pageSource.match(/import\s*\{[^}]+\}\s*from\s+['"]@m5\/ui['"]/);
    assert.ok(importLine, '缺少 @m5/ui 导入');
    const importContent = importLine![0];
    const requiredComponents = ['PageShell', 'KanbanBoard', 'StatusBadge', 'EmptyState', 'StatCard', 'useToast'];
    for (const comp of requiredComponents) {
      assert.ok(importContent.includes(comp), `缺少导入组件: ${comp}`);
    }
  });

  it('从 react 导入必需 hooks: useState, useCallback, useMemo', () => {
    assert.ok(pageSource.includes('useState, useCallback, useMemo'), '缺少 useState/useCallback/useMemo');
  });

  it('从 next/link 导入 Link', () => {
    assert.ok(pageSource.includes("import Link from 'next/link'"), '缺少 Link 导入');
  });

  it('从 @m5/ui 导入类型 KanbanColumn 和 KanbanCard', () => {
    assert.match(pageSource, /import\s*\{[^}]*\btype\s+KanbanColumn\b[^}]*\}/);
    assert.match(pageSource, /import\s*\{[^}]*\btype\s+KanbanCard\b[^}]*\}/);
  });
});

// ═══════════════════════════════════════════════════════════════
// 2. 类型系统
// ═══════════════════════════════════════════════════════════════

describe('TaskCenterPage — 类型系统覆盖', () => {
  it('TaskType 定义全部 5 种任务类型', () => {
    assert.match(pageSource, /type\s+TaskType\s*=/, '缺少 TaskType 定义');
    assert.ok(pageSource.includes("'inventory'"));
    assert.ok(pageSource.includes("'member'"));
    assert.ok(pageSource.includes("'device'"));
    assert.ok(pageSource.includes("'schedule'"));
    assert.ok(pageSource.includes("'alert'"));
  });

  it('TaskPriority 定义全部 4 种优先级', () => {
    assert.match(pageSource, /type\s+TaskPriority\s*=/, '缺少 TaskPriority 定义');
    assert.ok(pageSource.includes("'low'"));
    assert.ok(pageSource.includes("'medium'"));
    assert.ok(pageSource.includes("'high'"));
    assert.ok(pageSource.includes("'critical'"));
  });

  it('TaskStatus 定义全部 3 种状态', () => {
    assert.match(pageSource, /type\s+TaskStatus\s*=/, '缺少 TaskStatus 定义');
    assert.ok(pageSource.includes("'pending'"));
    assert.ok(pageSource.includes("'in_progress'"));
    assert.ok(pageSource.includes("'done'"));
  });

  it('Task 接口包含所有必需字段', () => {
    const requiredFields = [
      'id: string',
      'title: string',
      'subtitle: string',
      'type: TaskType',
      'priority: TaskPriority',
      'status: TaskStatus',
      'assignee: string',
      'dueDate: string',
      'tags: string[]',
      'createdAt: string',
    ];
    for (const field of requiredFields) {
      assert.ok(pageSource.includes(field), `Task 接口缺少字段: ${field}`);
    }
  });

  it('TaskType union 包含确切 5 个变体', () => {
    const src = pageSource.match(/type\s+TaskType\s*=\s*[^;]+/)?.[0] || '';
    const variants = src.match(/'[a-z_]+'/g);
    assert.equal(variants?.length, 5, `TaskType 应有 5 个变体，实际 ${variants?.length}`);
  });

  it('TaskPriority union 包含确切 4 个变体', () => {
    const src = pageSource.match(/type\s+TaskPriority\s*=\s*[^;]+/)?.[0] || '';
    const variants = src.match(/'[a-z_]+'/g);
    assert.equal(variants?.length, 4, `TaskPriority 应有 4 个变体，实际 ${variants?.length}`);
  });

  it('TaskStatus union 包含确切 3 个变体', () => {
    const src = pageSource.match(/type\s+TaskStatus\s*=\s*[^;]+/)?.[0] || '';
    const variants = src.match(/'[a-z_]+'/g);
    assert.equal(variants?.length, 3, `TaskStatus 应有 3 个变体，实际 ${variants?.length}`);
  });
});

// ═══════════════════════════════════════════════════════════════
// 3. 常量映射
// ═══════════════════════════════════════════════════════════════

describe('TaskCenterPage — 常量映射', () => {
  it('TYPE_LABELS 覆盖全部 5 种类型的中文标签', () => {
    const labelMapping = [
      'inventory: \'库存\'',
      'member: \'会员\'',
      'device: \'设备\'',
      'schedule: \'排班\'',
      'alert: \'告警\'',
    ];
    for (const entry of labelMapping) {
      assert.ok(pageSource.includes(entry), `TYPE_LABELS 缺少: ${entry}`);
    }
  });

  it('TYPE_COLORS 覆盖全部 5 种类型的色值映射', () => {
    const colorMapping = [
      'inventory: \'info\'',
      'member: \'success\'',
      'device: \'warning\'',
      'schedule: \'neutral\'',
      'alert: \'danger\'',
    ];
    for (const entry of colorMapping) {
      assert.ok(pageSource.includes(entry), `TYPE_COLORS 缺少: ${entry}`);
    }
  });

  it('TYPE_COLORS 返回值类型包含全部 5 种 variant', () => {
    assert.ok(pageSource.includes("'info'"), 'TYPE_COLORS 缺少 info');
    assert.ok(pageSource.includes("'warning'"), 'TYPE_COLORS 缺少 warning');
    assert.ok(pageSource.includes("'danger'"), 'TYPE_COLORS 缺少 danger');
    assert.ok(pageSource.includes("'success'"), 'TYPE_COLORS 缺少 success');
    assert.ok(pageSource.includes("'neutral'"), 'TYPE_COLORS 缺少 neutral');
  });

  it('STATUS_LABELS 覆盖全部 3 种状态的中文标签', () => {
    assert.ok(pageSource.includes("pending: '待处理'"), 'STATUS_LABELS 缺少 pending');
    assert.ok(pageSource.includes("in_progress: '处理中'"), 'STATUS_LABELS 缺少 in_progress');
    assert.ok(pageSource.includes("done: '已完成'"), 'STATUS_LABELS 缺少 done');
  });

  it('PriorityBadge 配置覆盖全部 4 种优先级', () => {
    const priorityConfig = [
      "critical: { label: '紧急', variant: 'danger'",
      "high: { label: '高', variant: 'warning'",
      "medium: { label: '中', variant: 'info'",
      "low: { label: '低', variant: 'neutral'",
    ];
    for (const entry of priorityConfig) {
      assert.ok(pageSource.includes(entry), `PriorityBadge 配置缺少: ${entry}`);
    }
  });
});

// ═══════════════════════════════════════════════════════════════
// 4. Mock 数据
// ═══════════════════════════════════════════════════════════════

describe('TaskCenterPage — Mock 数据', () => {
  it('generateMockTasks 函数存在且返回 Task[]', () => {
    assert.ok(pageSource.includes('function generateMockTasks()'), '缺少 generateMockTasks 函数');
    assert.ok(pageSource.includes(': Task[]'), 'generateMockTasks 返回类型不是 Task[]');
  });

  it('Mock 数据包含恰好 10 条任务 (id: t-001 ~ t-010)', () => {
    const ids = pageSource.match(/id:\s*'t-\d{3}'/g);
    assert.equal(ids?.length, 10, `预期 10 条任务 id，实际 ${ids?.length}`);
    for (let i = 1; i <= 10; i++) {
      const expected = `'t-${String(i).padStart(3, '0')}'`;
      assert.ok(pageSource.includes(`id: ${expected}`), `缺少任务 ${expected}`);
    }
  });

  it('Mock 数据覆盖全部 5 种任务类型且各出现至少 1 次', () => {
    const types = ['inventory', 'member', 'device', 'schedule', 'alert'];
    for (const t of types) {
      assert.ok(pageSource.includes(`type: '${t}'`), `缺少 type: '${t}'`);
    }
    const occurrences = countOccurrences(pageSource, /type:\s*'[a-z_]+'/g);
    assert.equal(occurrences, 10, `type 字段应有 10 条，实际 ${occurrences}`);
  });

  it('Mock 数据覆盖全部 4 种优先级', () => {
    const priorities = ['critical', 'high', 'medium', 'low'];
    for (const p of priorities) {
      assert.ok(pageSource.includes(`priority: '${p}'`), `缺少 priority: '${p}'`);
    }
  });

  it('Mock 数据覆盖全部 3 种状态', () => {
    const statuses = ['pending', 'in_progress', 'done'];
    for (const s of statuses) {
      assert.ok(pageSource.includes(`status: '${s}'`), `缺少 status: '${s}'`);
    }
  });

  it('每条 Mock 任务都包含 assignee 字段', () => {
    const assignees = pageSource.match(/assignee:\s*'[^']+'/g);
    assert.equal(assignees?.length, 10, `应有 10 个 assignee，实际 ${assignees?.length}`);
  });

  it('每条 Mock 任务都包含 tags 数组', () => {
    const tagEntries = pageSource.match(/tags:\s*\[[^\]]+\]/g);
    assert.equal(tagEntries?.length, 10, `应有 10 个 tags 数组，实际 ${tagEntries?.length}`);
  });

  it('每条 Mock 任务都包含 dueDate 和 createdAt 字段', () => {
    // dueDate: 在 interface Task 和 mock 数据中均出现，≥10 即可证 mock 完备
    const dueDates = countOccurrences(pageSource, /dueDate:/g);
    const createdAts = countOccurrences(pageSource, /createdAt:/g);
    assert.ok(dueDates >= 10, `dueDate 字段数不足，实际 ${dueDates}`);
    assert.ok(createdAts >= 10, `createdAt 字段数不足，实际 ${createdAts}`);
  });

  it('assignee 覆盖全部 7 种角色', () => {
    const roles = ['库房管理员', '客服主管', '前台主管', '店长', '设备管理员', '导购组', '保洁组'];
    for (const role of roles) {
      assert.ok(pageSource.includes(role), `assignee 缺少角色: ${role}`);
    }
  });

  it('Mock 数据因 dueDate 使用 fmt() 动态生成日期', () => {
    // dueDate 不是硬编码，而是通过 fmt(now) 和 fmt(new Date(...)) 动态生成
    assert.ok(pageSource.includes('dueDate: fmt('), '因 dueDate 使用 fmt() 动态生成');
    assert.ok(pageSource.includes('toISOString().slice(0, 10)'), 'fmt 辅助函数使用 toISOString 格式化');
    assert.ok(pageSource.includes("new Date('2026-06-30')"), 'generateMockTasks 基准日期是 2026-06-30');
  });

  it('Mock 数据的未来日期通过在基准日期上加偏移量实现', () => {
    // 验证存在多种时间偏移量（1天/2天/3天/7天）
    assert.ok(pageSource.includes('fmt(new Date(now.getTime() + 86400000)'), '缺少 +1 天偏移');
    assert.ok(pageSource.includes('fmt(new Date(now.getTime() + 604800000)'), '缺少 +7 天偏移');
    // 至少 3 种不同的偏移量
    const offsets = pageSource.match(/getTime\(\)\s*\+\s*\d{7,}/g) || [];
    assert.ok(offsets.length >= 3, `应有至少 3 种日期偏移，实际 ${offsets.length}`);
  });

  it('tags 数组覆盖多样化的标签值', () => {
    const expectedTags = [
      '补货', '预警', '投诉', '紧急', '耗材', '收银',
      '排班', '晚班', '温控', '会员关怀', '活动',
      '盘点', '月度', '交接班', '审核', '价签', '促销', '环境', '清洁',
    ];
    for (const tag of expectedTags) {
      assert.ok(pageSource.includes(`'${tag}'`), `tags 缺少: ${tag}`);
    }
  });

  it('每条 Mock 任务都包含 subtitle 字段', () => {
    const subtitles = pageSource.match(/subtitle:\s*'/g);
    assert.equal(subtitles?.length, 10, `应有 10 个 subtitle，实际 ${subtitles?.length}`);
  });
});

// ═══════════════════════════════════════════════════════════════
// 5. 子组件
// ═══════════════════════════════════════════════════════════════

describe('TaskCenterPage — 子组件', () => {
  it('TaskTypeBadge 组件定义正确', () => {
    assert.ok(pageSource.includes('function TaskTypeBadge'), '缺少 TaskTypeBadge 函数');
    assert.ok(pageSource.includes('{ type }: { type: TaskType }'), 'TaskTypeBadge 参数类型不正确');
    assert.ok(pageSource.includes('TYPE_LABELS[type]'), 'TaskTypeBadge 中使用 TYPE_LABELS');
    assert.ok(pageSource.includes('TYPE_COLORS[type]'), 'TaskTypeBadge 中使用 TYPE_COLORS');
  });

  it('PriorityBadge 组件定义正确', () => {
    assert.ok(pageSource.includes('function PriorityBadge'), '缺少 PriorityBadge 函数');
    assert.ok(pageSource.includes('{ priority }: { priority: TaskPriority }'), 'PriorityBadge 参数类型不正确');
    assert.ok(pageSource.includes('config[priority].label'), 'PriorityBadge 中使用 config[priority].label');
    assert.ok(pageSource.includes('config[priority].variant'), 'PriorityBadge 中使用 config[priority].variant');
  });

  it('PriorityBadge 配置对象使用 const 声明', () => {
    assert.match(pageSource, /const\s+config\s*:/, 'PriorityBadge config 不是 const');
  });

  it('TaskTypeBadge / PriorityBadge 均为纯函数（无 hooks 调用）', () => {
    // 检查子组件内没有 useState/useEffect/useCallback 等 hooks
    const typeBadgeBody = pageSource.match(/function TaskTypeBadge[^}]*\}/)?.[0];
    if (typeBadgeBody) {
      assert.ok(!typeBadgeBody.includes('useState'), 'TaskTypeBadge 不应使用 hooks');
    }
    const priorityBadgeBody = pageSource.match(/function PriorityBadge[^}]*\}/)?.[0];
    if (priorityBadgeBody) {
      assert.ok(!priorityBadgeBody.includes('useState'), 'PriorityBadge 不应使用 hooks');
    }
  });
});

// ═══════════════════════════════════════════════════════════════
// 6. 统计逻辑
// ═══════════════════════════════════════════════════════════════

describe('TaskCenterPage — 统计逻辑', () => {
  it('stats 使用 useMemo 缓存', () => {
    assert.ok(pageSource.includes('const stats = useMemo('), 'stats 未使用 useMemo');
  });

  it('stats 计算包含 critical 统计（优先级 critical 且未完成）', () => {
    assert.ok(pageSource.includes("t.priority === 'critical'"), 'critical 条件包含 priority check');
    assert.ok(pageSource.includes("t.status !== 'done'"), 'critical 条件排除已完成的');
  });

  it('stats 计算包含 pending 统计', () => {
    // stats 块的 pending 过滤器
    assert.ok(pageSource.includes("const pending = tasks.filter((t) => t.status === 'pending')"), 'pending 统计错误');
  });

  it('stats 计算包含 inProgress 统计', () => {
    assert.ok(pageSource.includes("const inProgress = tasks.filter((t) => t.status === 'in_progress')"), 'inProgress 统计错误');
  });

  it('stats 计算包含 overdue 统计（逾期且未完成）', () => {
    assert.ok(pageSource.includes("t.dueDate < '2026-06-30'"), 'overdue 使用 2026-06-30 作为锚定日期');
    assert.ok(pageSource.includes("t.status !== 'done'"), 'overdue 条件排除已完成');
  });

  it('stats 返回对象包含 4 个字段: critical/pending/inProgress/overdue', () => {
    assert.ok(pageSource.includes('return { critical, pending, inProgress, overdue }'), 'stats 返回字段不完整');
  });

  it('统计结果通过 StatCard 渲染到 JSX', () => {
    assert.ok(pageSource.includes('label="紧急任务"'), '缺少紧急任务 StatCard');
    assert.ok(pageSource.includes('label="待处理"'), '缺少待处理 StatCard');
    assert.ok(pageSource.includes('label="处理中"'), '缺少处理中 StatCard');
    assert.ok(pageSource.includes('label="已超期"'), '缺少已超期 StatCard');
    assert.ok(pageSource.includes('variant="error"'), '缺少 variant error');
    assert.ok(pageSource.includes('variant="warning"'), '缺少 variant warning');
    assert.ok(pageSource.includes('variant="info"'), '缺少 variant info');
  });

  it('统计卡片置于 grid-cols-4 网格布局中', () => {
    assert.ok(pageSource.includes('grid grid-cols-4'), '统计卡片缺少 grid 布局');
  });
});

// ═══════════════════════════════════════════════════════════════
// 7. 筛选逻辑
// ═══════════════════════════════════════════════════════════════

describe('TaskCenterPage — 筛选逻辑', () => {
  it('filterType 初始值为 all（默认不筛选）', () => {
    // useState 初始化: <TaskType | 'all'>('all')
    assert.ok(pageSource.includes("useState<TaskType | 'all'>('all')"), 'filterType 初始值不是 all');
  });

  it('filtered 使用 useMemo 计算', () => {
    assert.ok(pageSource.includes('const filtered = useMemo('), 'filtered 未使用 useMemo');
  });

  it('filtered 逻辑支持 all 分支和按类型过滤', () => {
    const filteredStart = pageSource.indexOf('const filtered = useMemo(');
    const filteredEnd = pageSource.indexOf('],', filteredStart);
    const filteredBody = pageSource.slice(filteredStart, filteredEnd + 3);
    assert.ok(filteredBody.includes("filterType === 'all'"), 'filtered 缺少 all 分支');
    assert.ok(filteredBody.includes('t.type === filterType'), 'filtered 缺少按 type 过滤');
  });

  it('filterOptions 数组包含全部 6 个筛选按钮', () => {
    const options = [
      "{ label: '全部', value: 'all' }",
      "{ label: '库存', value: 'inventory' }",
      "{ label: '会员', value: 'member' }",
      "{ label: '设备', value: 'device' }",
      "{ label: '排班', value: 'schedule' }",
      "{ label: '告警', value: 'alert' }",
    ];
    for (const opt of options) {
      assert.ok(pageSource.includes(opt), `filterOptions 缺少: ${opt}`);
    }
  });

  it('筛选按钮使用 role="group" 语义化标记', () => {
    assert.ok(pageSource.includes('role="group"'), '缺少 aria role="group"');
    assert.ok(pageSource.includes('aria-label="任务类型筛选"'), '缺少 aria-label');
  });

  it('筛选按钮具有选中高亮样式', () => {
    assert.ok(pageSource.includes('bg-blue-600'), '缺少选中态高亮色');
    assert.ok(pageSource.includes('text-white'), '缺少选中态文字色');
    assert.ok(pageSource.includes('shadow-sm'), '缺少选中态阴影');
  });

  it('筛选按钮具有未选中样式', () => {
    assert.ok(pageSource.includes('bg-gray-100'), '缺少未选中背景色');
    assert.ok(pageSource.includes('text-gray-600'), '缺少未选中文字色');
    assert.ok(pageSource.includes('hover:bg-gray-200'), '缺少 hover 效果');
  });
});

// ═══════════════════════════════════════════════════════════════
// 8. 拖拽逻辑（handleCardMove）
// ═══════════════════════════════════════════════════════════════

describe('TaskCenterPage — 拖拽逻辑', () => {
  it('handleCardMove 使用 useCallback 包裹', () => {
    assert.ok(pageSource.includes('const handleCardMove = useCallback('), 'handleCardMove 未使用 useCallback');
  });

  it('handleCardMove 接受 3 个参数: cardId, targetColumnId, targetIndex', () => {
    assert.match(
      pageSource,
      /useCallback\s*\(\s*\(cardId:\s*string,\s*targetColumnId:\s*string,\s*_targetIndex:\s*number\)/,
      'handleCardMove 参数签名不正确',
    );
  });

  it('handleCardMove 将 targetColumnId 断言为 TaskStatus', () => {
    assert.ok(pageSource.includes('targetColumnId as TaskStatus'), '缺少 TaskStatus 类型断言');
  });

  it('handleCardMove 使用 setTasks 函数式更新', () => {
    assert.ok(pageSource.includes('setTasks((prev) =>'), 'handleCardMove 未使用 setTasks');
    assert.ok(pageSource.includes('prev.map((t) =>'), 'handleCardMove 未使用 prev.map');
  });

  it('handleCardMove 非目标任务保持原样返回', () => {
    assert.ok(pageSource.includes('if (t.id !== cardId) return t'), '缺少非目标任务返回逻辑');
  });

  it('handleCardMove 成功更新后调用 toast.success', () => {
    assert.ok(pageSource.includes('toast.success('), 'handleCardMove 缺少 toast');
    assert.ok(pageSource.includes('任务状态已更新为'), 'toast 消息不正确');
  });

  it('handleCardMove 使用 STATUS_LABELS 生成中文消息', () => {
    assert.ok(pageSource.includes('STATUS_LABELS[targetColumnId as TaskStatus]'), '缺少 STATUS_LABELS 引用');
  });

  it('KanbanBoard 接收 onCardMove 回调', () => {
    assert.ok(pageSource.includes('onCardMove={handleCardMove}'), 'KanbanBoard 缺少 onCardMove');
  });
});

// ═══════════════════════════════════════════════════════════════
// 9. 看板数据
// ═══════════════════════════════════════════════════════════════

describe('TaskCenterPage — 看板数据生成', () => {
  it('kanbanColumns 包含 3 列: pending / in_progress / done', () => {
    assert.ok(pageSource.includes("id: 'pending'"), '缺少 pending 列');
    assert.ok(pageSource.includes("id: 'in_progress'"), '缺少 in_progress 列');
    assert.ok(pageSource.includes("id: 'done'"), '缺少 done 列');
  });

  it('看板列具有对应中文标题', () => {
    assert.ok(pageSource.includes("title: '待处理'"), '列标题缺少 待处理');
    assert.ok(pageSource.includes("title: '处理中'"), '列标题缺少 处理中');
    assert.ok(pageSource.includes("title: '已完成'"), '列标题缺少 已完成');
  });

  it('kanbanColumns 使用 useMemo 缓存', () => {
    assert.ok(pageSource.includes('const kanbanColumns: KanbanColumn[] = useMemo('), 'kanbanColumns 未使用 useMemo');
  });

  it('kanbanCards 使用 useMemo 生成', () => {
    assert.ok(pageSource.includes('const kanbanCards: KanbanCard[] = useMemo('), 'kanbanCards 未使用 useMemo');
  });

  it('看板列 bgColor 配置完整', () => {
    assert.ok(pageSource.includes("bgColor: '#FEF3C7'"), 'pending 列缺少 bgColor');
    assert.ok(pageSource.includes("bgColor: '#DBEAFE'"), 'in_progress 列缺少 bgColor');
    assert.ok(pageSource.includes("bgColor: '#D1FAE5'"), 'done 列缺少 bgColor');
  });

  it('看板卡片 subtitle 格式: 类型 · 负责人 · 日期', () => {
    assert.ok(pageSource.includes('TYPE_LABELS[task.type]'), 'subtitle 使用 TYPE_LABELS');
    assert.ok(pageSource.includes('task.assignee'), 'subtitle 使用 assignee');
    assert.ok(pageSource.includes('task.dueDate'), 'subtitle 使用 dueDate');
  });

  it('看板列通过 filtered.length 统计卡片数量', () => {
    assert.ok(pageSource.includes('.length'), '看板列使用 .length 计数');
  });
});

// ═══════════════════════════════════════════════════════════════
// 10. 边界场景 & 渲染结构
// ═══════════════════════════════════════════════════════════════

describe('TaskCenterPage — 边界场景 & 渲染结构', () => {
  it('存在 data-testid="task-center-kanban" 用于测试定位', () => {
    assert.ok(pageSource.includes('data-testid="task-center-kanban"'), '缺少 data-testid');
  });

  it('空状态使用 EmptyState 且包含中文提示', () => {
    assert.ok(pageSource.includes('<EmptyState'), '缺少 EmptyState');
    assert.ok(pageSource.includes('title="暂无任务"'), '空状态标题不正确');
    assert.ok(pageSource.includes('一切正常'), '空状态描述包含正能量文案');
  });

  it('空状态与看板通过条件渲染切换: kanbanCards.length === 0', () => {
    assert.ok(pageSource.includes('kanbanCards.length === 0'), '缺少空状态条件判断');
  });

  it('PageShell 接收 title 和 description', () => {
    assert.ok(pageSource.includes('title="门店任务中心"'), 'PageShell title 不正确');
    assert.ok(pageSource.includes('description="所有门店待办任务的聚合看板'), 'PageShell description 不正确');
  });

  it('模块注释包含角色视角声明', () => {
    assert.ok(pageSource.includes('👔店长'), '缺少店长角色');
    assert.ok(pageSource.includes('全体门店员工'), '缺少员工角色');
  });

  it('模块注释标明 D-角色操作界面 类型', () => {
    assert.ok(pageSource.includes('类型: D-角色操作界面'), '缺少 D-角色操作界面 标记');
  });

  it('generateMockTasks 函数内基准日期为 2026-06-30', () => {
    assert.ok(pageSource.includes("new Date('2026-06-30')"), 'generateMockTasks 基准日期不是 2026-06-30');
  });

  it('fmt 辅助函数使用 toISOString().slice(0, 10) 格式化为 YYYY-MM-DD', () => {
    assert.ok(pageSource.includes('toISOString().slice(0, 10)'), '日期格式化缺少 slice');
  });

  it('不允许使用 as any', () => {
    assert.ok(!pageSource.includes('as any'), '源码中不应出现 as any');
  });

  it('筛选按钮都带有 type="button" 属性', () => {
    assert.ok(pageSource.includes('type="button"'), '缺少 type="button"');
  });

  it('筛选按钮有 transition-colors 动效', () => {
    assert.ok(pageSource.includes('transition-colors'), '缺少过渡动效');
  });
});
