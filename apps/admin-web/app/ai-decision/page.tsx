'use client';

/**
 * AI 决策中心首页 — AI Decision Center (Next.js App Router Page)
 * 功能: AI 决策面板，展示规则执行结果、决策事件流、置信度分布
 * 组件: AIDecisionPanel (from @m5/ui)
 *
 * 页面结构:
 * - 统计卡片区: 今日决策、平均置信度、已批准/待处理数/已拒绝数
 * - AI决策面板: 规则命中分析
 * - 决策历史表格: 搜索/筛选/排序/分页/状态管理
 * - 创建决策规则 Modal
 * - 批量操作栏: 批量审批/导出/刷新
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  AIDecisionPanel,
  Button,
  DataTable,
  FormField,
  FormSubmitFeedback,
  Modal,
  PageShell,
  Pagination,
  SearchFilterInput,
  Select,
  StatCard,
  StatusBadge,
  SubmitButton,
  type DataTableColumn,
  type DataTableSortConfig,
  usePagination,
  useSortedItems,
} from '@m5/ui';

export const dynamic = 'force-dynamic';

// ==================== 类型定义 ====================

interface DecisionRecord {
  id: string;
  ruleName: string;
  status: 'approved' | 'rejected' | 'pending';
  confidence: number;
  source: string;
  createdAt: string;
  targetAudience: string;
  description: string;
  ruleCategory: string;
  triggeredCount: number;
}

// ==================== 模拟数据 ====================

const MOCK: DecisionRecord[] = [
  { id: 'dec-001', ruleName: '首单折扣规则', status: 'approved', confidence: 0.92, source: '规则引擎-A', createdAt: '2026-07-15 10:30', targetAudience: '全部会员', description: '首单自动折扣审批', ruleCategory: '营销', triggeredCount: 245 },
  { id: 'dec-002', ruleName: '高消费返券规则', status: 'approved', confidence: 0.88, source: '规则引擎-B', createdAt: '2026-07-15 10:28', targetAudience: '高活跃会员', description: '满500返券', ruleCategory: '营销', triggeredCount: 128 },
  { id: 'dec-003', ruleName: '大额订单审批', status: 'rejected', confidence: 0.45, source: '人工审核', createdAt: '2026-07-15 10:15', targetAudience: '全部会员', description: '超10000元人工审批', ruleCategory: '风控', triggeredCount: 12 },
  { id: 'dec-004', ruleName: '流失预警关怀', status: 'pending', confidence: 0.73, source: '规则引擎-A', createdAt: '2026-07-15 09:50', targetAudience: '低活跃会员', description: '30天未活跃发送关怀', ruleCategory: '运营', triggeredCount: 89 },
  { id: 'dec-005', ruleName: '生日月双倍积分', status: 'approved', confidence: 0.95, source: '规则引擎-C', createdAt: '2026-07-15 09:30', targetAudience: '全部会员', description: '自动双倍积分', ruleCategory: '营销', triggeredCount: 156 },
  { id: 'dec-006', ruleName: 'VIP专属折扣', status: 'rejected', confidence: 0.38, source: '人工审核', createdAt: '2026-07-15 09:00', targetAudience: '黄金会员', description: '85折审批', ruleCategory: '营销', triggeredCount: 34 },
  { id: 'dec-007', ruleName: '库存预警补货', status: 'pending', confidence: 0.81, source: '规则引擎-B', createdAt: '2026-07-15 08:45', targetAudience: '仓储', description: '安全水位自动补货', ruleCategory: '供应链', triggeredCount: 67 },
  { id: 'dec-008', ruleName: '新客注册礼包', status: 'approved', confidence: 0.99, source: '规则引擎-A', createdAt: '2026-07-15 08:30', targetAudience: '新注册会员', description: '自动发放注册礼包', ruleCategory: '营销', triggeredCount: 312 },
  { id: 'dec-009', ruleName: '季节性促销', status: 'pending', confidence: 0.65, source: '规则引擎-C', createdAt: '2026-07-14 16:00', targetAudience: '全部会员', description: '换季商品促销', ruleCategory: '营销', triggeredCount: 203 },
  { id: 'dec-010', ruleName: '欺诈风险拦截', status: 'rejected', confidence: 0.28, source: '人工审核', createdAt: '2026-07-14 14:30', targetAudience: '全部会员', description: '短时间多次下单拦截', ruleCategory: '风控', triggeredCount: 18 },
  { id: 'dec-011', ruleName: '新品上架推送', status: 'approved', confidence: 0.87, source: '规则引擎-A', createdAt: '2026-07-14 11:00', targetAudience: '活跃会员', description: '新品推送通知', ruleCategory: '运营', triggeredCount: 445 },
  { id: 'dec-012', ruleName: '会员等级保级', status: 'pending', confidence: 0.72, source: '规则引擎-B', createdAt: '2026-07-13 15:20', targetAudience: '银卡会员', description: '保级条件触发通知', ruleCategory: '会员', triggeredCount: 76 },
];

// ==================== 常量与映射 ====================

const STATUS_OPTS = [
  { value: '', label: '全部状态' },
  { value: 'approved', label: '已批准' },
  { value: 'rejected', label: '已拒绝' },
  { value: 'pending', label: '待定' },
];

const CATEGORY_OPTS = [
  { value: '', label: '全部类别' },
  { value: '营销', label: '营销' },
  { value: '运营', label: '运营' },
  { value: '风控', label: '风控' },
  { value: '会员', label: '会员' },
  { value: '供应链', label: '供应链' },
];

const STATUS_MAP: Record<string, { label: string; variant: 'success' | 'error' | 'warning' | 'neutral' }> = {
  approved: { label: '已批准', variant: 'success' },
  rejected: { label: '已拒绝', variant: 'error' },
  pending: { label: '待定', variant: 'warning' },
};

const DEFAULT_FORM = {
  ruleName: '',
  description: '',
  ruleCategory: '' as string,
  targetAudience: '' as string,
  source: '' as string,
};

// ==================== 列定义 ====================

function buildColumns(): DataTableColumn<DecisionRecord>[] {
  return [
    {
      key: 'ruleName',
      title: '规则名称',
      dataKey: 'ruleName',
      sortable: true,
      render: (r: DecisionRecord) => (
        <span style={{ color: '#93c5fd', fontWeight: 500 }}>{r.ruleName}</span>
      ),
    },
    {
      key: 'ruleCategory',
      title: '类别',
      dataKey: 'ruleCategory',
      sortable: true,
      width: 80,
    },
    {
      key: 'status',
      title: '状态',
      dataKey: 'status',
      sortable: true,
      width: 90,
      render: (r: DecisionRecord) => {
        const m = STATUS_MAP[r.status] ?? { label: r.status, variant: 'neutral' as const };
        return <StatusBadge label={m.label} variant={m.variant} size="sm" />;
      },
    },
    {
      key: 'confidence',
      title: '置信度',
      dataKey: 'confidence',
      sortable: true,
      width: 90,
      render: (r: DecisionRecord) => (
        <span style={{ fontFamily: 'monospace', color: '#e2e8f0' }}>{(r.confidence * 100).toFixed(0)}%</span>
      ),
    },
    {
      key: 'triggeredCount',
      title: '触发次数',
      dataKey: 'triggeredCount',
      sortable: true,
      width: 90,
      align: 'right',
    },
    {
      key: 'source',
      title: '来源',
      dataKey: 'source',
      sortable: true,
      width: 120,
    },
    {
      key: 'targetAudience',
      title: '目标人群',
      dataKey: 'targetAudience',
      sortable: true,
      width: 120,
    },
    {
      key: 'createdAt',
      title: '时间',
      dataKey: 'createdAt',
      sortable: true,
      width: 150,
      render: (r: DecisionRecord) => (
        <span style={{ fontSize: 12, color: '#94a3b8' }}>{r.createdAt}</span>
      ),
    },
    {
      key: 'description',
      title: '描述',
      dataKey: 'description',
      render: (r: DecisionRecord) => r.description,
    },
  ];
}

// ==================== 主页面 ====================

export default function AiDecisionPage() {
  const [decisions, setDecisions] = useState<DecisionRecord[]>(MOCK);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortConfig, setSortConfig] = useState<DataTableSortConfig | null>({
    key: 'createdAt', direction: 'desc',
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const pagination = usePagination({ initialPageSize: 8, pageSizeOptions: [5, 8, 15] });

  // 筛选
  const filtered = useMemo(() => {
    let items = decisions;
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(
        (r) =>
          r.ruleName.toLowerCase().includes(q) ||
          r.source.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.targetAudience.toLowerCase().includes(q),
      );
    }
    if (statusFilter) items = items.filter((r) => r.status === statusFilter);
    if (categoryFilter) items = items.filter((r) => r.ruleCategory === categoryFilter);
    return items;
  }, [decisions, search, statusFilter, categoryFilter]);

  // 统计
  const stats = useMemo(() => {
    const all = decisions;
    return {
      total: all.length,
      approved: all.filter((d) => d.status === 'approved').length,
      pending: all.filter((d) => d.status === 'pending').length,
      rejected: all.filter((d) => d.status === 'rejected').length,
      avgConf: all.length > 0 ? (all.reduce((s, d) => s + d.confidence, 0) / all.length) : 0,
      totalTriggered: all.reduce((s, d) => s + d.triggeredCount, 0),
    };
  }, [decisions]);

  const cols = useMemo(() => buildColumns(), []);
  const sorted = useSortedItems(filtered, cols, sortConfig);
  const pageItems = pagination.paginate(sorted);

  // 表单校验
  const validateForm = useCallback((data: typeof DEFAULT_FORM): boolean => {
    const errors: Record<string, string> = {};
    if (!data.ruleName.trim()) errors.ruleName = '规则名称不能为空';
    if (!data.description.trim()) errors.description = '规则描述不能为空';
    if (!data.ruleCategory) errors.ruleCategory = '请选择类别';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, []);

  // 创建
  const handleCreate = useCallback(() => {
    if (!validateForm(formData)) return;
    const newDec: DecisionRecord = {
      id: `dec-${String(decisions.length + 1).padStart(3, '0')}`,
      ruleName: formData.ruleName,
      status: 'pending',
      confidence: 0.5,
      source: formData.source || '手动创建',
      createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      targetAudience: formData.targetAudience || '全部会员',
      description: formData.description,
      ruleCategory: formData.ruleCategory,
      triggeredCount: 0,
    };
    setDecisions((prev) => [newDec, ...prev]);
    setFeedback({ type: 'success', message: `规则「${newDec.ruleName}」已创建` });
    setShowCreateModal(false);
    setFormData(DEFAULT_FORM);
  }, [formData, validateForm, decisions.length]);

  // 批量操作
  const handleBatchApprove = useCallback(() => {
    setDecisions((prev) =>
      prev.map((d) => (selectedIds.has(d.id) ? { ...d, status: 'approved' as const, confidence: Math.max(d.confidence, 0.7) } : d)),
    );
    setFeedback({ type: 'success', message: `已批量批准 ${selectedIds.size} 条` });
    setSelectedIds(new Set());
  }, [selectedIds]);

  const handleBatchReject = useCallback(() => {
    setDecisions((prev) =>
      prev.map((d) => (selectedIds.has(d.id) ? { ...d, status: 'rejected' as const } : d)),
    );
    setFeedback({ type: 'success', message: `已批量拒绝 ${selectedIds.size} 条` });
    setSelectedIds(new Set());
  }, [selectedIds]);

  const handleExport = useCallback(() => {
    const exportItems = selectedIds.size > 0 ? decisions.filter((d) => selectedIds.has(d.id)) : decisions;
    const csv = ['ruleName,status,confidence,source,targetAudience,createdAt']
      .concat(exportItems.map((d) => `${d.ruleName},${STATUS_MAP[d.status]?.label ?? d.status},${(d.confidence * 100).toFixed(0)}%,${d.source},${d.targetAudience},${d.createdAt}`))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-decisions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [decisions, selectedIds]);

  const handleRefresh = useCallback(() => {
    setFeedback({ type: 'success', message: '数据已刷新' });
  }, []);

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
      <PageShell
        title="AI 决策中心"
        subtitle="AI 规则引擎决策事件面板 — 查看命中规则、置信度分析、决策快照与建议操作"
      >
        {/* 统计卡片 */}
        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', marginBottom: 24 }}>
          <StatCard title="决策总数" value={stats.total.toString()} secondary={`今日`} />
          <StatCard title="平均置信度" value={`${(stats.avgConf * 100).toFixed(0)}%`} secondary={`总触发 ${stats.totalTriggered.toLocaleString()} 次`} />
          <StatCard title="已批准" value={stats.approved.toString()} secondary={`${((stats.approved / stats.total) * 100).toFixed(0)}%`} tone="success" />
          <StatCard title="待处理" value={stats.pending.toString()} secondary="需人工审核" tone="warning" />
          <StatCard title="已拒绝" value={stats.rejected.toString()} secondary={`${((stats.rejected / stats.total) * 100).toFixed(0)}%`} tone="danger" />
        </div>

        {/* 反馈 */}
        {feedback && (
          <FormSubmitFeedback
            success={feedback.type === 'success' ? feedback.message : undefined}
            onDismissSuccess={() => setFeedback(null)}
          />
        )}

        {/* AI 决策面板 */}
        <div style={{ marginBottom: 24 }}>
          <AIDecisionPanel variant="pc" />
        </div>

        {/* 工具栏 */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <SearchFilterInput
            placeholder="搜索规则名称/来源..."
            value={search}
            onChange={(v) => { setSearch(v); pagination.setPage(1); }}
            width="auto"
          />
          <Select
            options={STATUS_OPTS}
            value={statusFilter}
            onChange={(v) => { setStatusFilter(v); pagination.setPage(1); }}
            placeholder="状态"
          />
          <Select
            options={CATEGORY_OPTS}
            value={categoryFilter}
            onChange={(v) => { setCategoryFilter(v); pagination.setPage(1); }}
            placeholder="类别"
          />
          <div style={{ flex: 1 }} />
          <SubmitButton label="＋ 创建规则" variant="primary" onClick={() => { setFormData(DEFAULT_FORM); setFormErrors({}); setShowCreateModal(true); }} />
          <Button variant="outline" onClick={handleRefresh}>🔄 刷新</Button>
          <Button variant="outline" onClick={handleExport}>📥 导出</Button>
        </div>

        {/* 批量操作栏 */}
        {selectedIds.size > 0 && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, padding: '8px 12px', borderRadius: 8, background: 'rgba(59,130,246,0.08)', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: '#93c5fd', fontWeight: 600 }}>已选 {selectedIds.size} 条</span>
            <Button variant="primary" size="sm" onClick={handleBatchApprove}>批量批准</Button>
            <Button variant="outline" size="sm" onClick={handleBatchReject}>批量拒绝</Button>
            <Button variant="text" size="sm" onClick={() => setSelectedIds(new Set())}>取消选择</Button>
          </div>
        )}

        {/* 决策历史表格 */}
        <div style={{ marginTop: 8 }}>
          <DataTable<DecisionRecord>
            title={`决策历史 (${sorted.length})`}
            columns={cols}
            items={pageItems}
            sort={sortConfig}
            onSortChange={setSortConfig}
            striped
            compact
            selectable
            selectedKeys={selectedIds}
            onSelectionChange={(keys) => setSelectedIds(new Set(Array.from(keys)))}
            emptyText={search || statusFilter || categoryFilter ? '未找到匹配的决策记录' : '暂无决策数据'}
            rowKey={(r) => r.id}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
            <Pagination
              page={pagination.page}
              pageSize={pagination.pageSize}
              total={sorted.length}
              onPageChange={pagination.setPage}
              onPageSizeChange={pagination.setPageSize}
            />
          </div>
        </div>

        {/* 创建规则 Modal */}
        <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)} title="创建决策规则" width={560}>
          <div style={{ display: 'grid', gap: 14 }}>
            <FormField label="规则名称" error={formErrors.ruleName} required>
              <input
                type="text"
                value={formData.ruleName}
                onChange={(e) => setFormData((p) => ({ ...p, ruleName: e.target.value }))}
                placeholder="规则名称"
                style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #d9d9d9' }}
              />
            </FormField>

            <FormField label="规则类别" error={formErrors.ruleCategory} required>
              <select
                value={formData.ruleCategory}
                onChange={(e) => setFormData((p) => ({ ...p, ruleCategory: e.target.value }))}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #d9d9d9' }}
              >
                <option value="">选择类别</option>
                {CATEGORY_OPTS.filter((c) => c.value).map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </FormField>

            <FormField label="规则来源">
              <select
                value={formData.source}
                onChange={(e) => setFormData((p) => ({ ...p, source: e.target.value }))}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #d9d9d9' }}
              >
                <option value="">默认</option>
                <option value="规则引擎-A">规则引擎-A</option>
                <option value="规则引擎-B">规则引擎-B</option>
                <option value="规则引擎-C">规则引擎-C</option>
                <option value="手动创建">手动创建</option>
              </select>
            </FormField>

            <FormField label="目标人群">
              <input
                type="text"
                value={formData.targetAudience}
                onChange={(e) => setFormData((p) => ({ ...p, targetAudience: e.target.value }))}
                placeholder="全部会员 / 高活跃会员..."
                style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #d9d9d9' }}
              />
            </FormField>

            <FormField label="规则描述" error={formErrors.description} required>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                rows={3}
                placeholder="规则描述"
                style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #d9d9d9', resize: 'vertical' }}
              />
            </FormField>
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
            <SubmitButton label="取消" variant="secondary" onClick={() => setShowCreateModal(false)} />
            <SubmitButton label="创建规则" variant="primary" onClick={handleCreate} />
          </div>
        </Modal>
      </PageShell>
    </main>
  );
}
