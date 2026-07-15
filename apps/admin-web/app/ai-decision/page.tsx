'use client';

/**
 * AI 决策中心首页 — AI Decision Center (Next.js App Router Page)
 * 功能: AI 决策面板，展示规则执行结果、决策事件流、置信度分布
 * 组件: AIDecisionPanel (from @m5/ui)
 *
 * 页面结构:
 * - 统计卡片区: 今日决策、平均置信度、已批准/待处理数
 * - AI决策面板: 规则命中分析
 * - 决策历史表格: 搜索/筛选/排序/分页/状态管理
 */

import React, { useState, useMemo } from 'react';
import {
  AIDecisionPanel,
  Badge,
  DataTable,
  PageShell,
  Pagination,
  SearchFilterInput,
  Select,
  StatCard,
  StatusBadge,
  type DataTableColumn,
  type DataTableSortConfig,
  usePagination,
  useSortedItems,
} from '@m5/ui';

export const dynamic = 'force-dynamic';

// ---- 类型定义 ----

interface DecisionRecord {
  id: string;
  ruleName: string;
  status: 'approved' | 'rejected' | 'pending';
  confidence: number;
  source: string;
  createdAt: string;
  targetAudience: string;
  description: string;
}

// ---- 模拟数据 ----

const MOCK: DecisionRecord[] = [
  { id: 'dec-001', ruleName: '首单折扣规则', status: 'approved', confidence: 0.92, source: '规则引擎-A', createdAt: '2026-07-15 10:30', targetAudience: '全部会员', description: '首单自动折扣审批' },
  { id: 'dec-002', ruleName: '高消费返券规则', status: 'approved', confidence: 0.88, source: '规则引擎-B', createdAt: '2026-07-15 10:28', targetAudience: '高活跃会员', description: '满500返券' },
  { id: 'dec-003', ruleName: '大额订单审批', status: 'rejected', confidence: 0.45, source: '人工审核', createdAt: '2026-07-15 10:15', targetAudience: '全部会员', description: '超10000元人工审批' },
  { id: 'dec-004', ruleName: '流失预警关怀', status: 'pending', confidence: 0.73, source: '规则引擎-A', createdAt: '2026-07-15 09:50', targetAudience: '低活跃会员', description: '30天未活跃发送关怀' },
  { id: 'dec-005', ruleName: '生日月双倍积分', status: 'approved', confidence: 0.95, source: '规则引擎-C', createdAt: '2026-07-15 09:30', targetAudience: '全部会员', description: '自动双倍积分' },
  { id: 'dec-006', ruleName: 'VIP专属折扣', status: 'rejected', confidence: 0.38, source: '人工审核', createdAt: '2026-07-15 09:00', targetAudience: '黄金会员', description: '85折审批' },
  { id: 'dec-007', ruleName: '库存预警补货', status: 'pending', confidence: 0.81, source: '规则引擎-B', createdAt: '2026-07-15 08:45', targetAudience: '仓储', description: '安全水位自动补货' },
  { id: 'dec-008', ruleName: '新客注册礼包', status: 'approved', confidence: 0.99, source: '规则引擎-A', createdAt: '2026-07-15 08:30', targetAudience: '新注册会员', description: '自动发放注册礼包' },
  { id: 'dec-009', ruleName: '季节性促销', status: 'pending', confidence: 0.65, source: '规则引擎-C', createdAt: '2026-07-14 16:00', targetAudience: '全部会员', description: '换季商品促销' },
  { id: 'dec-010', ruleName: '欺诈风险拦截', status: 'rejected', confidence: 0.28, source: '人工审核', createdAt: '2026-07-14 14:30', targetAudience: '全部会员', description: '短时间多次下单拦截' },
];

// ---- 常量和辅助 ----

const STATUS_OPTS = [
  { value: '', label: '全部状态' },
  { value: 'approved', label: '已批准' },
  { value: 'rejected', label: '已拒绝' },
  { value: 'pending', label: '待定' },
];

const STATUS_MAP: Record<string, { label: string; variant: 'success' | 'error' | 'pending' | 'default' }> = {
  approved: { label: '已批准', variant: 'success' },
  rejected: { label: '已拒绝', variant: 'error' },
  pending: { label: '待定', variant: 'pending' },
};

// ---- 列定义 ----

function buildColumns(): DataTableColumn<DecisionRecord>[] {
  return [
    {
      key: 'ruleName',
      title: '规则名称',
      dataKey: 'ruleName',
      sortable: true,
      render: (r: DecisionRecord) => (
        <span className="text-blue-400 font-medium">{r.ruleName}</span>
      ),
    },
    {
      key: 'status',
      title: '状态',
      dataKey: 'status',
      sortable: true,
      render: (r: DecisionRecord) => {
        const m = STATUS_MAP[r.status] ?? { label: r.status, variant: 'default' as const };
        return <StatusBadge label={m.label} variant={m.variant} />;
      },
    },
    {
      key: 'confidence',
      title: '置信度',
      dataKey: 'confidence',
      sortable: true,
      render: (r: DecisionRecord) => (
        <span className="font-mono text-slate-300">{(r.confidence * 100).toFixed(0)}%</span>
      ),
    },
    {
      key: 'source',
      title: '来源',
      dataKey: 'source',
      sortable: true,
      render: (r: DecisionRecord) => <Badge variant="info">{r.source}</Badge>,
    },
    {
      key: 'targetAudience',
      title: '目标人群',
      dataKey: 'targetAudience',
      sortable: true,
    },
    {
      key: 'createdAt',
      title: '时间',
      dataKey: 'createdAt',
      sortable: true,
      render: (r: DecisionRecord) => (
        <span className="text-xs text-slate-400">{r.createdAt}</span>
      ),
    },
    {
      key: 'description',
      title: '描述',
      dataKey: 'description',
    },
  ];
}

// ---- 主页面 ----

export default function AiDecisionPage() {
  const [decisions] = useState<DecisionRecord[]>(MOCK);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortConfig, setSortConfig] = useState<DataTableSortConfig | null>({
    key: 'createdAt', direction: 'desc',
  });
  const pagination = usePagination({ initialPageSize: 8, pageSizeOptions: [5, 8, 15] });

  // ---- 筛选逻辑 ----
  const filtered = useMemo(() => {
    let items = decisions;
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(
        (r) => r.ruleName.toLowerCase().includes(q) ||
               r.source.toLowerCase().includes(q) ||
               r.description.toLowerCase().includes(q) ||
               r.targetAudience.toLowerCase().includes(q),
      );
    }
    if (statusFilter) {
      items = items.filter((r) => r.status === statusFilter);
    }
    return items;
  }, [decisions, search, statusFilter]);

  // ---- 统计数据 ----
  const approved = decisions.filter((d) => d.status === 'approved').length;
  const pending = decisions.filter((d) => d.status === 'pending').length;
  const rejected = decisions.filter((d) => d.status === 'rejected').length;
  const avgConf = decisions.length > 0
    ? decisions.reduce((s, d) => s + d.confidence, 0) / decisions.length
    : 0;

  // ---- 排序和分页 ----
  const cols = useMemo(() => buildColumns(), []);
  const sorted = useSortedItems(filtered, cols, sortConfig);
  const pageItems = pagination.paginate(sorted);

  // ---- 页面渲染 ----
  return (
    <main style={{ maxWidth: 1120, margin: '0 auto', padding: 24 }}>
      <PageShell
        title="AI 决策中心"
        subtitle="AI 规则引擎决策事件面板 — 查看命中规则、置信度分析、决策快照与建议操作"
      >
        {/* 统计卡片 */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
          <StatCard label="今日决策" value={decisions.length} />
          <StatCard label="平均置信度" value={`${(avgConf * 100).toFixed(0)}%`} />
          <StatCard label="已批准" value={approved} />
          <StatCard label="待处理" value={pending} />
          <StatCard label="已拒绝" value={rejected} />
        </div>

        {/* AI 决策面板 */}
        <AIDecisionPanel variant="pc" />

        {/* 决策历史记录 */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-slate-200 mb-4">
            决策历史记录
          </h3>

          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <div className="flex-1 min-w-[240px]">
              <SearchFilterInput
                placeholder="搜索规则名称/来源/描述..."
                value={search}
                onChange={(v) => { setSearch(v); pagination.setPage(1); }}
              />
            </div>
            <Select
              options={STATUS_OPTS}
              value={statusFilter}
              onChange={(v) => { setStatusFilter(v); pagination.setPage(1); }}
              placeholder="状态"
            />
            <span className="text-xs text-slate-500">共 {sorted.length} 条</span>
          </div>

          <DataTable<DecisionRecord>
            columns={cols}
            rows={pageItems}
            sort={sortConfig}
            onSortChange={setSortConfig}
            emptyText={search || statusFilter ? '未找到匹配的决策记录' : '暂无决策数据'}
            rowKey={(r) => r.id}
          />

          <div className="flex justify-end mt-4">
            <Pagination
              page={pagination.page}
              pageSize={pagination.pageSize}
              total={sorted.length}
              onPageChange={pagination.setPage}
              onPageSizeChange={pagination.setPageSize}
            />
          </div>
        </div>
      </PageShell>
    </main>
  );
}
