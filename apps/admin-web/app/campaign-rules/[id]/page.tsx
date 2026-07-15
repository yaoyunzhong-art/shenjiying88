'use client';

/**
 * 营销活动管理详情页 — Campaign Rule Detail Page
 * G4 退回修复: 含活动列表(搜索+筛选) / 创建Modal / 编辑面板 / 状态管理
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  Button, DataTable, DetailClosureBar, Modal, PageShell, Pagination,
  SearchFilterInput, Select, StatusBadge, Tabs, Typography,
  usePagination, useSortedItems, type DataTableColumn, type DataTableSortConfig,
} from '@m5/ui';

// ---- 类型 ----

interface CampaignActivity {
  id: string; name: string; description: string;
  startDate: string; endDate: string;
  status: 'draft' | 'active' | 'ended';
  discount: number; targetAudience: string; budget: number; hitCount: number;
}

// ---- 模拟数据 ----

const MOCK_ACTIVITIES: CampaignActivity[] = [
  { id: 'act-001', name: '618 年中大促', description: '年中购物节全场折扣', startDate: '2026-06-01', endDate: '2026-06-20', status: 'ended', discount: 0.7, targetAudience: '全部会员', budget: 500000, hitCount: 12430 },
  { id: 'act-002', name: '新会员首单礼', description: '新注册会员首单专享优惠', startDate: '2026-07-01', endDate: '2026-08-31', status: 'active', discount: 0.8, targetAudience: '新注册会员', budget: 200000, hitCount: 3456 },
  { id: 'act-003', name: '夏季清凉特卖', description: '夏季商品清仓促销', startDate: '2026-07-15', endDate: '2026-08-15', status: 'draft', discount: 0.6, targetAudience: '高活跃会员', budget: 300000, hitCount: 0 },
  { id: 'act-004', name: '会员日双倍积分', description: '每月15日会员日双倍积分', startDate: '2026-07-15', endDate: '2026-12-31', status: 'active', discount: 1, targetAudience: '全部会员', budget: 100000, hitCount: 5678 },
  { id: 'act-005', name: '开学季大促', description: '开学季文具/电子类促销', startDate: '2026-08-20', endDate: '2026-09-10', status: 'draft', discount: 0.75, targetAudience: '学生认证会员', budget: 250000, hitCount: 0 },
  { id: 'act-006', name: '双11 预热', description: '双十一提前预售活动', startDate: '2026-10-20', endDate: '2026-11-11', status: 'draft', discount: 0.5, targetAudience: '全部会员', budget: 1000000, hitCount: 0 },
];

// ---- 常量和辅助 ----

const STATUS_MAP: Record<string, { label: string; variant: 'success' | 'warning' | 'default' }> = {
  draft: { label: '草稿', variant: 'default' },
  active: { label: '进行中', variant: 'success' },
  ended: { label: '结束', variant: 'warning' },
};

const STATUS_OPTIONS = [
  { value: '', label: '全部状态' },
  { value: 'draft', label: '草稿' },
  { value: 'active', label: '进行中' },
  { value: 'ended', label: '结束' },
];

const TARGET_OPTIONS = [
  { value: '', label: '全部目标' },
  { value: '全部会员', label: '全部会员' },
  { value: '高活跃会员', label: '高活跃会员' },
  { value: '新注册会员', label: '新注册会员' },
  { value: '学生认证会员', label: '学生认证会员' },
  { value: '黄金会员', label: '黄金会员' },
];

function fmt(amount: number): string {
  return amount >= 10000 ? `¥${(amount / 10000).toFixed(1)}万` : `¥${amount.toLocaleString()}`;
}

// ---- 列定义 ----

function buildColumns(onRowClick: (item: CampaignActivity) => void): DataTableColumn<CampaignActivity>[] {
  return [
    { key: 'name', title: '活动名称', dataKey: 'name', sortable: true,
      render: (item: CampaignActivity) => (
        <span onClick={(e) => { e.stopPropagation(); onRowClick(item); }}
              className="text-blue-400 cursor-pointer underline hover:text-blue-300">{item.name}</span>
      ),
    },
    { key: 'status', title: '状态', dataKey: 'status', sortable: true,
      render: (item: CampaignActivity) => {
        const cfg = STATUS_MAP[item.status] ?? { label: item.status, variant: 'default' as const };
        return <StatusBadge label={cfg.label} variant={cfg.variant} />;
      },
    },
    { key: 'discount', title: '折扣', dataKey: 'discount', sortable: true,
      render: (item: CampaignActivity) => (
        <span className="font-mono text-slate-300">{item.discount < 1 ? `${(item.discount * 100).toFixed(0)}折` : '无折扣'}</span>
      ),
    },
    { key: 'targetAudience', title: '目标人群', dataKey: 'targetAudience', sortable: true },
    { key: 'startDate', title: '开始日期', dataKey: 'startDate', sortable: true,
      render: (item: CampaignActivity) => <span className="text-xs text-slate-400">{item.startDate}</span>,
    },
    { key: 'budget', title: '预算', dataKey: 'budget', sortable: true, align: 'right',
      render: (item: CampaignActivity) => <span className="font-mono text-emerald-400">{fmt(item.budget)}</span>,
    },
    { key: 'hitCount', title: '参与数', dataKey: 'hitCount', sortable: true, align: 'right',
      render: (item: CampaignActivity) => <span className="font-mono text-slate-300">{item.hitCount.toLocaleString()}</span>,
    },
  ];
}

// ---- 创建 Modal ----

function CreateModal({ open, onClose, onCreate }: {
  open: boolean; onClose: () => void; onCreate: (a: CampaignActivity) => void;
}) {
  const [name, setName] = useState(''); const [desc, setDesc] = useState('');
  const [start, setStart] = useState(''); const [end, setEnd] = useState('');
  const [discount, setDiscount] = useState('80'); const [target, setTarget] = useState('');
  const [budget, setBudget] = useState('100000'); const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = '请输入活动名称';
    if (!start) e.startDate = '请选择开始日期';
    if (!end) e.endDate = '请选择结束日期';
    if (!target) e.target = '请选择目标人群';
    const d = Number(discount);
    if (d < 1 || d > 100) e.discount = '折扣率需在1-100之间';
    setErrors(e); return Object.keys(e).length === 0;
  };

  const handleCreate = async () => {
    if (!validate()) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 300));
    onCreate({
      id: `act-${Date.now().toString(36)}`, name: name.trim(), description: desc.trim(),
      startDate: start, endDate: end, status: 'draft', discount: Number(discount) / 100,
      targetAudience: target, budget: Number(budget), hitCount: 0,
    });
    setSaving(false); setName(''); setDesc(''); setStart(''); setEnd('');
    setDiscount('80'); setTarget(''); setBudget('100000'); setErrors({}); onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="创建营销活动">
      <div className="space-y-4">
        <div>
          <label className="block text-xs text-slate-400 mb-1">活动名称 *</label>
          <input className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-sm text-white"
                 value={name} onChange={(e) => setName(e.target.value)} placeholder="输入活动名称" />
          {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">活动描述</label>
          <input className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-sm text-white"
                 value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="输入活动描述" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">开始日期 *</label>
            <input type="date" className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-sm text-white"
                   value={start} onChange={(e) => setStart(e.target.value)} />
            {errors.startDate && <p className="text-xs text-red-400 mt-1">{errors.startDate}</p>}
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">结束日期 *</label>
            <input type="date" className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-sm text-white"
                   value={end} onChange={(e) => setEnd(e.target.value)} />
            {errors.endDate && <p className="text-xs text-red-400 mt-1">{errors.endDate}</p>}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">折扣率 (%)</label>
            <input type="number" className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-sm text-white"
                   value={discount} onChange={(e) => setDiscount(e.target.value)} min={1} max={100} />
            {errors.discount && <p className="text-xs text-red-400 mt-1">{errors.discount}</p>}
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">目标人群 *</label>
            <select className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-sm text-white"
                    value={target} onChange={(e) => setTarget(e.target.value)}>
              <option value="">选择目标人群</option>
              {TARGET_OPTIONS.slice(1).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            {errors.target && <p className="text-xs text-red-400 mt-1">{errors.target}</p>}
          </div>
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">预算 (元)</label>
          <input type="number" className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-sm text-white"
                 value={budget} onChange={(e) => setBudget(e.target.value)} min={0} />
        </div>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={onClose}>取消</Button>
          <Button variant="primary" disabled={saving} onClick={handleCreate}>
            {saving ? '创建中...' : '创建活动'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ---- 编辑面板 ----

function EditPanel({ activity, onClose, onSave, onDelete, onStatusChange }: {
  activity: CampaignActivity; onClose: () => void;
  onSave: (a: CampaignActivity) => void; onDelete: (id: string) => void;
  onStatusChange: (id: string, s: CampaignActivity['status']) => void;
}) {
  const [name, setName] = useState(activity.name);
  const [desc, setDesc] = useState(activity.description);
  const [discount, setDiscount] = useState(String(activity.discount * 100));
  const [target, setTarget] = useState(activity.targetAudience);
  const [budget, setBudget] = useState(String(activity.budget));
  const [saving, setSaving] = useState(false);

  return (
    <div className="fixed inset-y-0 right-0 w-[420px] bg-slate-900 border-l border-slate-700 shadow-2xl z-50 overflow-y-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-white">编辑活动</h2>
        <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">✕</button>
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-xs text-slate-400 mb-1">名称</label>
          <input className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-sm text-white"
                 value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">描述</label>
          <input className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-sm text-white"
                 value={desc} onChange={(e) => setDesc(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">折扣率 (%)</label>
            <input type="number" className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-sm text-white"
                   value={discount} onChange={(e) => setDiscount(e.target.value)} min={1} max={100} />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">目标</label>
            <select className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-sm text-white"
                    value={target} onChange={(e) => setTarget(e.target.value)}>
              {TARGET_OPTIONS.slice(1).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">预算</label>
          <input type="number" className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-sm text-white"
                 value={budget} onChange={(e) => setBudget(e.target.value)} min={0} />
        </div>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={onClose}>取消</Button>
          <Button variant="primary" disabled={saving} onClick={async () => {
            setSaving(true); await new Promise((r) => setTimeout(r, 300));
            onSave({ ...activity, name, description: desc, discount: Number(discount) / 100, targetAudience: target, budget: Number(budget) });
            setSaving(false);
          }}>{saving ? '保存中...' : '保存'}</Button>
        </div>
      </div>
      <div className="mt-6 pt-4 border-t border-slate-700">
        <label className="block text-xs text-slate-400 mb-2">状态管理</label>
        <div className="flex gap-2 mb-4">
          {(['draft', 'active', 'ended'] as const).map((st) => (
            <button key={st}
                    disabled={activity.status === st}
                    onClick={() => onStatusChange(activity.id, st)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      activity.status === st
                        ? 'bg-blue-600 text-white cursor-default'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}>
              {STATUS_MAP[st]?.label ?? st}
            </button>
          ))}
        </div>
        <Button variant="danger" onClick={() => onDelete(activity.id)}>删除此活动</Button>
      </div>
    </div>
  );
}

// ---- 主页面 ----

export default function CampaignRuleDetailPage() {
  const [activities, setActivities] = useState<CampaignActivity[]>(MOCK_ACTIVITIES);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [targetFilter, setTargetFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editActivity, setEditActivity] = useState<CampaignActivity | null>(null);
  const [sortConfig, setSortConfig] = useState<DataTableSortConfig | null>({ key: 'startDate', direction: 'desc' });
  const pagination = usePagination({ initialPageSize: 10, pageSizeOptions: [10, 20, 50] });

  const stats = useMemo(() => ({
    total: activities.length,
    draft: activities.filter((a) => a.status === 'draft').length,
    active: activities.filter((a) => a.status === 'active').length,
    ended: activities.filter((a) => a.status === 'ended').length,
  }), [activities]);

  const tabFiltered = useMemo(() => {
    if (activeTab === 'all') return activities;
    return activities.filter((a) => a.status === activeTab);
  }, [activities, activeTab]);

  const filtered = useMemo(() => {
    let items = tabFiltered;
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter((a) =>
        a.name.toLowerCase().includes(q) || a.description.toLowerCase().includes(q) || a.targetAudience.toLowerCase().includes(q));
    }
    if (statusFilter) items = items.filter((a) => a.status === statusFilter);
    if (targetFilter) items = items.filter((a) => a.targetAudience === targetFilter);
    return items;
  }, [tabFiltered, search, statusFilter, targetFilter]);

  const columns = useMemo(() => buildColumns((item) => setEditActivity(item)), []);
  const sorted = useSortedItems(filtered, columns, sortConfig);
  const pageItems = pagination.paginate(sorted);

  const onTabChange = (key: string) => {
    setActiveTab(key); pagination.setPage(1); setSearch(''); setStatusFilter(''); setTargetFilter('');
  };

  return (
    <PageShell title="营销活动管理" description="管理全部营销活动，支持创建、编辑、状态切换与洞察分析">
      {/* 统计卡片 */}
      <div className="flex gap-3 mb-4 flex-wrap">
        {[
          { label: '活动总数', value: stats.total, color: 'text-blue-400' },
          { label: '进行中', value: stats.active, color: 'text-emerald-400' },
          { label: '草稿', value: stats.draft, color: 'text-slate-400' },
          { label: '已结束', value: stats.ended, color: 'text-amber-400' },
          { label: '总预算', value: fmt(activities.reduce((s, a) => s + a.budget, 0)), color: 'text-violet-400' },
        ].map((card) => (
          <div key={card.label} className="flex-1 min-w-[100px] rounded-xl bg-[rgba(15,23,42,0.4)] border border-[rgba(148,163,184,0.1)] p-3">
            <div className="text-[11px] text-slate-400 mb-1">{card.label}</div>
            <div className={`text-xl font-bold font-mono ${card.color}`}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* 操作栏 */}
      <div className="flex items-center gap-3 mb-3 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <SearchFilterInput placeholder="搜索活动名称/描述..." value={search}
                             onChange={(v) => { setSearch(v); pagination.setPage(1); }} />
        </div>
        <Select options={STATUS_OPTIONS} value={statusFilter}
                onChange={(v) => { setStatusFilter(v); pagination.setPage(1); }} placeholder="全部状态" />
        <Select options={TARGET_OPTIONS} value={targetFilter}
                onChange={(v) => { setTargetFilter(v); pagination.setPage(1); }} placeholder="全部目标" />
        <Button variant="secondary" onClick={() => { setActivities(MOCK_ACTIVITIES); setSearch(''); setStatusFilter('');
          setTargetFilter(''); setActiveTab('all'); }}>刷新</Button>
        <Button variant="primary" onClick={() => setShowCreate(true)}>+ 创建活动</Button>
      </div>

      {/* Tabs */}
      <Tabs items={[
        { key: 'all', label: '全部', count: stats.total },
        { key: 'active', label: '进行中', count: stats.active },
        { key: 'draft', label: '草稿', count: stats.draft },
        { key: 'ended', label: '已结束', count: stats.ended },
      ]} activeKey={activeTab} onChange={onTabChange} />

      {/* 表格 */}
      <DataTable<CampaignActivity>
        columns={columns} rows={pageItems} sort={sortConfig} onSortChange={setSortConfig}
        onRowClick={(item) => setEditActivity(item)}
        emptyText={search || statusFilter || targetFilter ? '未找到匹配的活动' : '暂无活动数据'}
        rowKey={(row) => row.id}
      />

      {/* 分页 */}
      <div className="flex justify-end mt-4">
        <Pagination page={pagination.page} pageSize={pagination.pageSize} total={sorted.length}
                    onPageChange={pagination.setPage} onPageSizeChange={pagination.setPageSize} />
      </div>

      {/* 创建 Modal */}
      <CreateModal open={showCreate} onClose={() => setShowCreate(false)}
                   onCreate={(a) => { setActivities((prev) => [a, ...prev]); setShowCreate(false); }} />

      {/* 编辑面板 */}
      {editActivity && (
        <EditPanel activity={editActivity} onClose={() => setEditActivity(null)}
                   onSave={(updated) => { setActivities((prev) => prev.map((a) => a.id === updated.id ? updated : a)); setEditActivity(null); }}
                   onDelete={(id) => { setActivities((prev) => prev.filter((a) => a.id !== id)); setEditActivity(null); }}
                   onStatusChange={(id, s) => setActivities((prev) => prev.map((a) => a.id === id ? { ...a, status: s } : a))} />
      )}

      <div className="mt-6">
        <DetailClosureBar links={[{
          key: 'list', title: '活动列表',
          subtitle: '返回营销活动管理首页', href: '/campaign-rules',
        }]} />
      </div>
    </PageShell>
  );
}
