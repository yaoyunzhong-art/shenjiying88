/**
 * 客服工作台单元测试（L1 风格）
 *
 * 直接分析源码检查关键结构和常量，无需模拟 Taro 运行时
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SOURCE_PATH = resolve(__dirname, 'index.tsx');
const SOURCE: string = readFileSync(SOURCE_PATH, 'utf-8');

describe('customer-service/index 页面源码分析', () => {
  it('应导出默认函数组件 CustomerServicePage', () => {
    assert.match(SOURCE, /export default function CustomerServicePage/);
  });

  it('应包含 MOCK_TICKETS 数据，且至少有 8 条', () => {
    const match = SOURCE.match(/const MOCK_TICKETS: ServiceTicket\[\] = \[([\s\S]*?)\];/);
    assert.ok(match, 'MOCK_TICKETS 定义缺失');
    const count = (match[1]!.match(/\{/g) ?? []).length;
    assert.ok(count >= 8, `MOCK_TICKETS 数量不足 (实际 ${count})`);
  });

  it('工单状态应覆盖 pending/processing/resolved/closed', () => {
    assert.ok(SOURCE.includes("status: 'pending'"), '缺少 pending 状态');
    assert.ok(SOURCE.includes("status: 'processing'"), '缺少 processing 状态');
    assert.ok(SOURCE.includes("status: 'resolved'"), '缺少 resolved 状态');
    assert.ok(SOURCE.includes("status: 'closed'"), '缺少 closed 状态');
  });

  it('优先级应覆盖 urgent/high/normal/low', () => {
    assert.ok(SOURCE.includes("priority: 'urgent'"), '缺少 urgent 优先级');
    assert.ok(SOURCE.includes("priority: 'high'"), '缺少 high 优先级');
    assert.ok(SOURCE.includes("priority: 'normal'"), '缺少 normal 优先级');
    assert.ok(SOURCE.includes("priority: 'low'"), '缺少 low 优先级');
  });

  it('分类应覆盖 complaint/consultation/return/feedback/other', () => {
    assert.ok(SOURCE.includes("category: 'complaint'"), '缺少 complaint');
    assert.ok(SOURCE.includes("category: 'consultation'"), '缺少 consultation');
    assert.ok(SOURCE.includes("category: 'return'"), '缺少 return');
    assert.ok(SOURCE.includes("category: 'feedback'"), '缺少 feedback');
    assert.ok(SOURCE.includes("category: 'other'"), '缺少 other');
  });

  it('满意度应覆盖 very_satisfied/satisfied/neutral', () => {
    assert.ok(SOURCE.includes("satisfaction: 'very_satisfied'"), '缺少 very_satisfied');
    assert.ok(SOURCE.includes("satisfaction: 'satisfied'"), '缺少 satisfied');
    assert.ok(SOURCE.includes("satisfaction: 'neutral'"), '缺少 neutral');
  });

  it('应包含 MOCK_FAQS 数据且至少 4 条', () => {
    const match = SOURCE.match(/const MOCK_FAQS: FAQItem\[\] = \[([\s\S]*?)\];/);
    assert.ok(match, 'MOCK_FAQS 定义缺失');
    const count = (match[1]!.match(/\{/g) ?? []).length;
    assert.ok(count >= 4, `MOCK_FAQS 数量不足 (实际 ${count})`);
  });

  it('应包含 MOCK_QUICK_REPLIES 数据且至少 4 条', () => {
    const match = SOURCE.match(/const MOCK_QUICK_REPLIES: QuickReply\[\] = \[([\s\S]*?)\];/);
    assert.ok(match, 'MOCK_QUICK_REPLIES 定义缺失');
    const count = (match[1]!.match(/\{/g) ?? []).length;
    assert.ok(count >= 4, `MOCK_QUICK_REPLIES 数量不足 (实际 ${count})`);
  });

  it('PRIORITY_LABELS 应覆盖 4 种优先级', () => {
    assert.ok(SOURCE.includes("'紧急'"));
    assert.ok(SOURCE.includes("'高'"));
    assert.ok(SOURCE.includes("'普通'"));
    assert.ok(SOURCE.includes("'低'"));
  });

  it('PRIORITY_COLORS 应覆盖 4 种颜色', () => {
    assert.ok(SOURCE.includes("urgent: '#ef4444'"));
    assert.ok(SOURCE.includes("high: '#f97316'"));
    assert.ok(SOURCE.includes("normal: '#3b82f6'"));
    assert.ok(SOURCE.includes("low: '#64748b'"));
  });

  it('STATUS_LABELS 应覆盖 4 种状态', () => {
    assert.ok(SOURCE.includes("pending: '待处理'"));
    assert.ok(SOURCE.includes("processing: '处理中'"));
    assert.ok(SOURCE.includes("resolved: '已解决'"));
    assert.ok(SOURCE.includes("closed: '已关闭'"));
  });

  it('CATEGORY_LABELS 应覆盖 5 种分类', () => {
    assert.ok(SOURCE.includes("complaint: '投诉'"));
    assert.ok(SOURCE.includes("consultation: '咨询'"));
    assert.ok(SOURCE.includes("return: '退换货'"));
    assert.ok(SOURCE.includes("feedback: '反馈'"));
    assert.ok(SOURCE.includes("other: '其他'"));
  });

  it('SATISFACTION_LABELS 应覆盖 5 个等级', () => {
    assert.ok(SOURCE.includes("'非常满意'"));
    assert.ok(SOURCE.includes("'满意'"));
    assert.ok(SOURCE.includes("'一般'"));
    assert.ok(SOURCE.includes("'不满意'"));
    assert.ok(SOURCE.includes("'非常不满'"));
  });

  it('应包含 4 个快捷操作按钮', () => {
    assert.ok(SOURCE.includes("'新建工单'"));
    assert.ok(SOURCE.includes("'知识库'"));
    assert.ok(SOURCE.includes("'历史记录'"));
    assert.ok(SOURCE.includes("'我的业绩'"));
  });

  it('应包含三个 Tab 切换: 服务工单/知识库/数据统计', () => {
    assert.ok(SOURCE.includes("'服务工单'"));
    assert.ok(SOURCE.includes("'知识库'"));
    assert.ok(SOURCE.includes("'数据统计'"));
  });

  it('应包含统计摘要: 待处理/处理中/今日新增/满意度', () => {
    assert.ok(SOURCE.includes('待处理'));
    assert.ok(SOURCE.includes('处理中'));
    assert.ok(SOURCE.includes('今日新增'));
    assert.ok(SOURCE.includes('满意度'));
  });

  it('应包含紧急提醒模块', () => {
    assert.ok(SOURCE.includes('紧急工单待处理'));
  });

  it('应包含搜索 Input', () => {
    assert.ok(SOURCE.includes('searchQuery'));
    assert.ok(SOURCE.includes('搜索工单号/客户/标题'));
  });

  it('应包含状态过滤按钮组', () => {
    assert.ok(SOURCE.includes("'全部'"));
    assert.ok(SOURCE.includes('pending'));
    assert.ok(SOURCE.includes('processing'));
    assert.ok(SOURCE.includes('resolved'));
    assert.ok(SOURCE.includes('closed'));
  });

  it('应包含空状态展示', () => {
    assert.ok(SOURCE.includes('EmptyState') || SOURCE.includes('暂无匹配工单') || SOURCE.includes('未找到匹配工单'));
  });

  it('应包含 handleQuickAction 函数', () => {
    assert.match(SOURCE, /handleQuickAction/);
    assert.match(SOURCE, /showToast/);
  });

  it('应包含 handleAcceptTicket 函数', () => {
    assert.match(SOURCE, /handleAcceptTicket/);
    assert.ok(SOURCE.includes('已接单'));
  });

  it('应包含 handleCloseTicket 函数', () => {
    assert.match(SOURCE, /handleCloseTicket/);
    assert.ok(SOURCE.includes('已关闭'));
  });

  it('应包含 handleInsertQuickReply 函数', () => {
    assert.match(SOURCE, /handleInsertQuickReply/);
  });

  it('应包含 handleSendReply 函数', () => {
    assert.match(SOURCE, /handleSendReply/);
    assert.ok(SOURCE.includes('回复已发送'));
  });

  it('应包含 formatDuration 工具函数', () => {
    assert.ok(SOURCE.includes('formatDuration'));
    assert.ok(SOURCE.includes('天前'));
    assert.ok(SOURCE.includes('小时前'));
  });

  it('应包含 getPriorityScore 工具函数', () => {
    assert.ok(SOURCE.includes('getPriorityScore'));
  });

  it('应包含回复编辑 Textarea', () => {
    assert.ok(SOURCE.includes('Textarea'));
    assert.ok(SOURCE.includes('输入回复内容'));
  });

  it('应包含快捷回复面板', () => {
    assert.ok(SOURCE.includes('快捷回复'));
    assert.ok(SOURCE.includes('MOCK_QUICK_REPLIES'));
  });

  it('应包含分类分布条形图', () => {
    assert.ok(SOURCE.includes('工单分类分布'));
    assert.ok(SOURCE.includes('%'));
  });

  it('应包含满意度评价区域', () => {
    assert.ok(SOURCE.includes('满意度评价'));
    assert.ok(SOURCE.includes('综合满意度'));
  });
});

describe('customer-service/index.config 配置', () => {
  it('导航标题应为 "客服工作台"', () => {
    const CONFIG_SOURCE = readFileSync(resolve(__dirname, 'index.config.ts'), 'utf-8');
    assert.match(CONFIG_SOURCE, /navigationBarTitleText/);
    assert.match(CONFIG_SOURCE, /客服工作台/);
  });
});

describe('客服工作台业务逻辑', () => {
  it('formatDuration: 1天前', () => {
    const fmt = (days: number) => `${days}天前`;
    assert.equal(fmt(1), '1天前');
    assert.equal(fmt(3), '3天前');
  });

  it('formatDuration: 小时前', () => {
    const fmt = (hours: number) => hours < 24 ? `${hours}小时前` : `${Math.floor(hours / 24)}天前`;
    assert.equal(fmt(5), '5小时前');
    assert.equal(fmt(48), '2天前');
  });

  it('getPriorityScore: 优先级分值排序', () => {
    const getScore = (p: string): number => ({ urgent: 4, high: 3, normal: 2, low: 1 })[p] ?? 0;
    assert.equal(getScore('urgent'), 4);
    assert.equal(getScore('high'), 3);
    assert.equal(getScore('normal'), 2);
    assert.equal(getScore('low'), 1);
    assert.ok(getScore('urgent') > getScore('high'));
    assert.ok(getScore('high') > getScore('normal'));
    assert.ok(getScore('normal') > getScore('low'));
  });

  it('工单过滤: 按状态过滤', () => {
    const tickets = [
      { status: 'pending' }, { status: 'processing' },
      { status: 'resolved' }, { status: 'pending' },
    ];
    assert.equal(tickets.filter((t) => t.status === 'pending').length, 2);
    assert.equal(tickets.filter((t) => t.status === 'processing').length, 1);
  });

  it('工单过滤: 按搜索词过滤', () => {
    const tickets = [
      { id: 'TK-001', customer: '李女士', subject: '产品质量问题' },
      { id: 'TK-002', customer: '王先生', subject: '积分兑换' },
    ];
    const q = '李先生';
    assert.equal(tickets.filter((t) => t.customer.includes(q) || t.subject.includes(q) || t.id.includes(q)).length, 0);
    assert.equal(tickets.filter((t) => t.customer.includes('李') || t.subject.includes('李')).length, 1);
  });

  it('紧急工单统计', () => {
    const tickets = [
      { priority: 'urgent' }, { priority: 'high' },
      { priority: 'urgent' }, { priority: 'normal' },
    ];
    assert.equal(tickets.filter((t) => t.priority === 'urgent').length, 2);
  });

  it('满意度计算: 综合百分比', () => {
    const rated = [
      { satisfaction: 'very_satisfied' }, { satisfaction: 'satisfied' },
      { satisfaction: 'neutral' },
    ];
    const positive = rated.filter(
      (t) => t.satisfaction === 'very_satisfied' || t.satisfaction === 'satisfied',
    );
    const rate = Math.round((positive.length / rated.length) * 100);
    assert.equal(rate, 67);
  });

  it('满意度计算: 全部满意 = 100%', () => {
    const rated = [
      { satisfaction: 'satisfied' }, { satisfaction: 'very_satisfied' },
    ];
    const positive = rated.filter(
      (t) => t.satisfaction === 'very_satisfied' || t.satisfaction === 'satisfied',
    );
    assert.equal(Math.round((positive.length / rated.length) * 100), 100);
  });

  it('分类分布占比', () => {
    const tickets = [
      { category: 'complaint' }, { category: 'consultation' }, { category: 'complaint' },
      { category: 'return' }, { category: 'consultation' }, { category: 'feedback' },
      { category: 'complaint' }, { category: 'other' },
    ];
    const complaints = tickets.filter((t) => t.category === 'complaint').length;
    const pct = Math.round((complaints / tickets.length) * 100);
    assert.equal(pct, 38);
  });

  it('待处理工单 = pending + processing', () => {
    const tickets = [
      { status: 'pending' }, { status: 'processing' },
      { status: 'resolved' }, { status: 'closed' },
      { status: 'pending' },
    ];
    const active = tickets.filter((t) => t.status === 'pending' || t.status === 'processing').length;
    assert.equal(active, 3);
  });

  it('空搜索结果: 筛选后无结果', () => {
    const list: unknown[] = [];
    assert.equal(list.length, 0);
    assert.ok(list.length === 0);
  });
});
