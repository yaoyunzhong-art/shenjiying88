'use client';

/**
 * 营销活动管理详情页 — Campaign Rule Detail Page
 * G4 退回修复: 活动列表(+搜索+筛选) / 创建Modal(名称+日期+折扣+目标)
 * / 编辑面板(预填+更新+确认) / 状态管理(草稿/进行中/结束)
 */

import React, { useState, useMemo } from 'react';
import {
  Button, DetailClosureBar, Modal, PageShell, Pagination,
  SearchFilterInput, Select, StatusBadge, Tabs,
  usePagination, useSortedItems, type DataTableColumn, type DataTableSortConfig,
} from '@m5/ui';

// ---- 类型定义 ----
interface CampaignActivity {
  id: string; name: string; description: string;
  startDate: string; endDate: string;
  status: 'draft' | 'active' | 'ended';
  discount: number; targetAudience: string; budget: number; hitCount: number;
}

// ---- 模拟数据 ----
const MOCK: CampaignActivity[] = [
  { id: 'act-001', name: '618 年中大促', description: '年中购物节全场折扣', startDate: '2026-06-01', endDate: '2026-06-20', status: 'ended', discount: 0.7, targetAudience: '全部会员', budget: 500000, hitCount: 12430 },
  { id: 'act-002', name: '新会员首单礼', description: '新注册会员首单专享', startDate: '2026-07-01', endDate: '2026-08-31', status: 'active', discount: 0.8, targetAudience: '新注册会员', budget: 200000, hitCount: 3456 },
  { id: 'act-003', name: '夏季清凉特卖', description: '夏季商品清仓促销', startDate: '2026-07-15', endDate: '2026-08-15', status: 'draft', discount: 0.6, targetAudience: '高活跃会员', budget: 300000, hitCount: 0 },
  { id: 'act-004', name: '会员日双倍积分', description: '每月15日会员日双倍积分', startDate: '2026-07-15', endDate: '2026-12-31', status: 'active', discount: 1, targetAudience: '全部会员', budget: 100000, hitCount: 5678 },
  { id: 'act-005', name: '开学季大促', description: '开学季文具电子类促销', startDate: '2026-08-20', endDate: '2026-09-10', status: 'draft', discount: 0.75, targetAudience: '学生认证会员', budget: 250000, hitCount: 0 },
  { id: 'act-006', name: '双11 预热', description: '双十一提前预售活动', startDate: '2026-10-20', endDate: '2026-11-11', status: 'draft', discount: 0.5, targetAudience: '全部会员', budget: 1000000, hitCount: 0 },
];

// ---- 常量与辅助 ----
const STATUS_MAP: Record<string, { label: string; variant: 'success' | 'warning' | 'default' }> = {
  draft: { label: '草稿', variant: 'default' },
  active: { label: '进行中', variant: 'success' },
  ended: { label: '已结束', variant: 'warning' },
};
const STATUS_OPTS = [{ value: '', label: '全部状态' }, { value: 'draft', label: '草稿' }, { value: 'active', label: '进行中' }, { value: 'ended', label: '已结束' }];
const TARGET_OPTS = [{ value: '', label: '全部目标' }, { value: '全部会员', label: '全部会员' }, { value: '高活跃会员', label: '高活跃会员' }, { value: '新注册会员', label: '新注册会员' }, { value: '学生认证会员', label: '学生认证会员' }];

function fmt(v: number): string { return v >= 10000 ? `¥${(v / 10000).toFixed(1)}万` : `¥${v.toLocaleString()}`; }

// ---- 列定义 ----
function columns(onClick: (item: CampaignActivity) => void): DataTableColumn<CampaignActivity>[] {
  return [
    { key: 'name', title: '活动名称', dataKey: 'name', sortable: true, render: (item: CampaignActivity) => <span onClick={(e) => { e.stopPropagation(); onClick(item); }} className="text-blue-400 cursor-pointer underline">{item.name}</span> },
    { key: 'status', title: '状态', dataKey: 'status', sortable: true, render: (item: CampaignActivity) => { const c = STATUS_MAP[item.status] ?? { label: item.status, variant: 'default' as const }; return <StatusBadge label={c.label} variant={c.variant} />; } },
    { key: 'discount', title: '折扣', dataKey: 'discount', sortable: true, render: (item: CampaignActivity) => <span className="font-mono">{item.discount < 1 ? `${(item.discount * 100).toFixed(0)}折` : '无折扣'}</span> },
    { key: 'targetAudience', title: '目标人群', dataKey: 'targetAudience', sortable: true },
    { key: 'startDate', title: '开始日期', dataKey: 'startDate', sortable: true, render: (item: CampaignActivity) => <span className="text-xs text-gray-400">{item.startDate}</span> },
    { key: 'budget', title: '预算', dataKey: 'budget', sortable: true, align: 'right', render: (item: CampaignActivity) => <span className="font-mono text-green-400">{fmt(item.budget)}</span> },
    { key: 'hitCount', title: '参与数', dataKey: 'hitCount', sortable: true, align: 'right', render: (item: CampaignActivity) => <span className="font-mono">{item.hitCount.toLocaleString()}</span> },
  ];
}

// ---- 创建 Modal ----
function CreateModal({ open, onClose, onCreate }: { open: boolean; onClose: () => void; onCreate: (a: CampaignActivity) => void }) {
  const [n, setN] = useState(''); const [d, setD] = useState(''); const [s, setS] = useState(''); const [e, setE] = useState('');
  const [dc, setDc] = useState('80'); const [t, setT] = useState(''); const [bg, setBg] = useState('100000');
  const [sv, setSv] = useState(false); const [err, setErr] = useState<Record<string, string>>({});
  const validate = () => {
    const r: Record<string, string> = {};
    if (!n.trim()) r.name = '请输入活动名称'; if (!s) r.start = '请选择开始日期'; if (!e) r.end = '请选择结束日期';
    if (!t) r.target = '请选择目标人群'; const dv = Number(dc); if (dv < 1 || dv > 100) r.discount = '折扣率需在1-100之间';
    setErr(r); return Object.keys(r).length === 0;
  };
  const handleCreate = async () => {
    if (!validate()) return; setSv(true); await new Promise((r) => setTimeout(r, 300));
    onCreate({ id: `act-${Date.now().toString(36)}`, name: n.trim(), description: d.trim(), startDate: s, endDate: e, status: 'draft', discount: Number(dc) / 100, targetAudience: t, budget: Number(bg), hitCount: 0 });
    setSv(false); setN(''); setD(''); setS(''); setE(''); setDc('80'); setT(''); setBg('100000'); setErr({}); onClose();
  };
  return (<Modal open={open} onClose={onClose} title="创建营销活动">
    <div className="space-y-4">
      <div><label className="block text-xs text-gray-400 mb-1">活动名称 *</label><input className="w-full rounded-lg bg-gray-800 border border-gray-600 px-3 py-2 text-sm text-white" value={n} onChange={(e) => setN(e.target.value)} placeholder="输入活动名称" />{err.name && <p className="text-xs text-red-400 mt-1">{err.name}</p>}</div>
      <div><label className="block text-xs text-gray-400 mb-1">活动描述</label><input className="w-full rounded-lg bg-gray-800 border border-gray-600 px-3 py-2 text-sm text-white" value={d} onChange={(e) => setD(e.target.value)} placeholder="输入活动描述" /></div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="block text-xs text-gray-400 mb-1">开始日期 *</label><input type="date" className="w-full rounded-lg bg-gray-800 border border-gray-600 px-3 py-2 text-sm text-white" value={s} onChange={(e) => setS(e.target.value)} />{err.start && <p className="text-xs text-red-400 mt-1">{err.start}</p>}</div>
        <div><label className="block text-xs text-gray-400 mb-1">结束日期 *</label><input type="date" className="w-full rounded-lg bg-gray-800 border border-gray-600 px-3 py-2 text-sm text-white" value={e} onChange={(e) => setE(e.target.value)} />{err.end && <p className="text-xs text-red-400 mt-1">{err.end}</p>}</div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="block text-xs text-gray-400 mb-1">折扣率 (%)</label><input type="number" className="w-full rounded-lg bg-gray-800 border border-gray-600 px-3 py-2 text-sm text-white" value={dc} onChange={(e) => setDc(e.target.value)} min={1} max={100} />{err.discount && <p className="text-xs text-red-400 mt-1">{err.discount}</p>}</div>
        <div><label className="block text-xs text-gray-400 mb-1">目标人群 *</label><select className="w-full rounded-lg bg-gray-800 border border-gray-600 px-3 py-2 text-sm text-white" value={t} onChange={(e) => setT(e.target.value)}><option value="">请选择</option>{TARGET_OPTS.slice(1).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>{err.target && <p className="text-xs text-red-400 mt-1">{err.target}</p>}</div>
      </div>
      <div><label className="block text-xs text-gray-400 mb-1">预算 (元)</label><input type="number" className="w-full rounded-lg bg-gray-800 border border-gray-600 px-3 py-2 text-sm text-white" value={bg} onChange={(e) => setBg(e.target.value)} min={0} /></div>
      <div className="flex gap-3 justify-end"><Button variant="secondary" onClick={onClose}>取消</Button><Button variant="primary" disabled={sv} onClick={handleCreate}>{sv ? '创建中...' : '创建活动'}</Button></div>
    </div>
  </Modal>);
}

// ---- 编辑面板 ----
function EditPanel({ a, onClose, onSave, onDelete, onStatusChange }: {
  a: CampaignActivity; onClose: () => void; onSave: (v: CampaignActivity) => void;
  onDelete: (id: string) => void; onStatusChange: (id: string, s: CampaignActivity['status']) => void;
}) {
  const [n, setN] = useState(a.name); const [d, setD] = useState(a.description);
  const [dc, setDc] = useState(String(a.discount * 100)); const [t, setT] = useState(a.targetAudience);
  const [bg, setBg] = useState(String(a.budget)); const [sv, setSv] = useState(false);
  return (<div className="fixed inset-y-0 right-0 w-[400px] bg-gray-900 border-l border-gray-700 shadow-2xl z-50 overflow-y-auto p-6">
    <div className="flex items-center justify-between mb-6"><h2 className="text-lg font-semibold text-white">编辑活动</h2><button onClick={onClose} className="text-gray-400 hover:text-white text-xl">✕</button></div>
    <div className="space-y-4">
      <div><label className="block text-xs text-gray-400 mb-1">名称</label><input className="w-full rounded-lg bg-gray-800 border border-gray-600 px-3 py-2 text-sm text-white" value={n} onChange={(e) => setN(e.target.value)} /></div>
      <div><label className="block text-xs text-gray-400 mb-1">描述</label><input className="w-full rounded-lg bg-gray-800 border border-gray-600 px-3 py-2 text-sm text-white" value={d} onChange={(e) => setD(e.target.value)} /></div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="block text-xs text-gray-400 mb-1">折扣率 (%)</label><input type="number" className="w-full rounded-lg bg-gray-800 border border-gray-600 px-3 py-2 text-sm text-white" value={dc} onChange={(e) => setDc(e.target.value)} min={1} max={100} /></div>
        <div><label className="block text-xs text-gray-400 mb-1">目标人群</label><select className="w-full rounded-lg bg-gray-800 border border-gray-600 px-3 py-2 text-sm text-white" value={t} onChange={(e) => setT(e.target.value)}>{TARGET_OPTS.slice(1).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
      </div>
      <div><label className="block text-xs text-gray-400 mb-1">预算 (元)</label><input type="number" className="w-full rounded-lg bg-gray-800 border border-gray-600 px-3 py-2 text-sm text-white" value={bg} onChange={(e) => setBg(e.target.value)} min={0} /></div>
      <div className="flex gap-3 justify-end"><Button variant="secondary" onClick={onClose}>取消</Button>
        <Button variant="primary" disabled={sv} onClick={async () => { setSv(true); await new Promise((r) => setTimeout(r, 300)); onSave({ ...a, name: n, description: d, discount: Number(dc) / 100, targetAudience: t, budget: Number(bg) }); setSv(false); }}>{sv ? '保存中...' : '保存'}</Button>
      </div>
    </div>
    <div className="mt-6 pt-4 border-t border-gray-700">
      <label className="block text-xs text-gray-400 mb-2">状态管理</label>
      <div className="flex gap-2 mb-4">{(['draft', 'active', 'ended'] as const).map((st) => (<button key={st} disabled={a.status === st} onClick={() => onStatusChange(a.id, st)} className={`px-4 py-2 rounded-lg text-sm font-medium ${a.status === st ? 'bg-blue-600 text-white cursor-default' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>{STATUS_MAP[st]?.label ?? st}</button>))}</div>
      <Button variant="danger" onClick={() => onDelete(a.id)}>删除活动</Button>
    </div>
  </div>);
}

// ---- 主页面 ----
export default function CampaignRuleDetailPage() {
  const [acts, setActs] = useState<CampaignActivity[]>(MOCK);
  const [tab, setTab] = useState<string>('all'); const [search, setSearch] = useState('');
  const [sf, setSf] = useState(''); const [tf, setTf] = useState('');
  const [showCreate, setShowCreate] = useState(false); const [editAct, setEditAct] = useState<CampaignActivity | null>(null);
  const [sc, setSc] = useState<DataTableSortConfig | null>({ key: 'startDate', direction: 'desc' });
  const pg = usePagination({ initialPageSize: 10, pageSizeOptions: [10, 20, 50] });

  const stats = useMemo(() => ({ t: acts.length, d: acts.filter((a) => a.status === 'draft').length, a: acts.filter((a) => a.status === 'active').length, e: acts.filter((a) => a.status === 'ended').length }), [acts]);
  const tabFiltered = useMemo(() => tab === 'all' ? acts : acts.filter((a) => a.status === tab), [acts, tab]);
  const filtered = useMemo(() => {
    let items = tabFiltered;
    if (search.trim()) { const q = search.toLowerCase(); items = items.filter((a) => a.name.toLowerCase().includes(q) || a.description.toLowerCase().includes(q) || a.targetAudience.toLowerCase().includes(q)); }
    if (sf) items = items.filter((a) => a.status === sf); if (tf) items = items.filter((a) => a.targetAudience === tf);
    return items;
  }, [tabFiltered, search, sf, tf]);

  const cols = useMemo(() => columns((item) => setEditAct(item)), []);
  const sorted = useSortedItems(filtered, cols, sc); const pageItems = pg.paginate(sorted);

  return (<PageShell title="营销活动管理" description="管理全部营销活动，支持创建、编辑与状态切换">
    {/* 统计卡片 */}
    <div className="flex gap-3 mb-4 flex-wrap">
      {[{ l: '活动总数', v: stats.t, c: 'text-blue-400' }, { l: '进行中', v: stats.a, c: 'text-green-400' }, { l: '草稿', v: stats.d, c: 'text-gray-400' }, { l: '已结束', v: stats.e, c: 'text-amber-400' }, { l: '总预算', v: fmt(acts.reduce((s, a) => s + a.budget, 0)), c: 'text-violet-400' }]
        .map((card) => (<div key={card.l} className="flex-1 min-w-[90px] rounded-xl bg-[rgba(15,23,42,0.4)] border border-[rgba(148,163,184,0.1)] p-3"><div className="text-[11px] text-gray-400 mb-1">{card.l}</div><div className={`text-xl font-bold font-mono ${card.c}`}>{card.v}</div></div>))}
    </div>
    {/* 操作栏 */}
    <div className="flex items-center gap-3 mb-3 flex-wrap">
      <div className="flex-1 min-w-[180px]"><SearchFilterInput placeholder="搜索活动名称/描述..." value={search} onChange={(v) => { setSearch(v); pg.setPage(1); }} /></div>
      <Select options={STATUS_OPTS} value={sf} onChange={(v) => { setSf(v); pg.setPage(1); }} placeholder="状态" />
      <Select options={TARGET_OPTS} value={tf} onChange={(v) => { setTf(v); pg.setPage(1); }} placeholder="目标" />
      <Button variant="secondary" onClick={() => { setActs(MOCK); setSearch(''); setSf(''); setTf(''); setTab('all'); pg.setPage(1); }}>刷新</Button>
      <Button variant="primary" onClick={() => setShowCreate(true)}>+ 创建</Button>
    </div>
    {/* Tabs */}
    <Tabs items={[{ key: 'all', label: '全部', count: stats.t }, { key: 'active', label: '进行中', count: stats.a }, { key: 'draft', label: '草稿', count: stats.d }, { key: 'ended', label: '已结束', count: stats.e }]} activeKey={tab} onChange={(k) => { setTab(k); pg.setPage(1); setSearch(''); setSf(''); setTf(''); }} />
    {/* 表格 */}
    <DataTable<CampaignActivity> columns={cols} rows={pageItems} sort={sc} onSortChange={setSc} onRowClick={(item) => setEditAct(item)} emptyText={search || sf || tf ? '未找到匹配的活动' : '暂无活动数据'} rowKey={(r) => r.id} />
    {/* 分页 */}
    <div className="flex justify-end mt-4"><Pagination page={pg.page} pageSize={pg.pageSize} total={sorted.length} onPageChange={pg.setPage} onPageSizeChange={pg.setPageSize} /></div>
    {/* 创建 Modal */}
    <CreateModal open={showCreate} onClose={() => setShowCreate(false)} onCreate={(a) => { setActs((prev) => [a, ...prev]); setShowCreate(false); }} />
    {/* 编辑面板 */}
    {editAct && <EditPanel a={editAct} onClose={() => setEditAct(null)} onSave={(u) => { setActs((prev) => prev.map((x) => x.id === u.id ? u : x)); setEditAct(null); }} onDelete={(id) => { setActs((prev) => prev.filter((x) => x.id !== id)); setEditAct(null); }} onStatusChange={(id, s) => setActs((prev) => prev.map((x) => x.id === id ? { ...x, status: s } : x))} />}
    {/* 返回 */}
    <div className="mt-6"><DetailClosureBar links={[{ key: 'list', title: '活动列表', subtitle: '返回营销活动管理首页', href: '/campaign-rules' }]} /></div>
  </PageShell>);
}
