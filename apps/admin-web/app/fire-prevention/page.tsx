'use client';

/**
 * 消防管理 — Fire Prevention Page
 * 功能: 消防安全检查记录与风险管理
 * 角色: 🔥 安全管理员
 *
 * 页面结构:
 * - 统计面板: 全部检查 · 待检查 · 通过/未通过 · 高风险
 * - 搜索栏 + 状态筛选 + 风险等级 Tabs
 * - 检查列表 DataTable (排序/分页/选择)
 * - 创建检查 Modal (form + validation)
 * - 编辑检查 Modal (prefill + update)
 * - 批量操作栏 + 导出报告 + 刷新
 */

import { useState, useMemo, useCallback } from 'react';
import {
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
  useSearchFilter,
  useSortedItems,
} from '@m5/ui';

// ==================== 类型定义 ====================

type InspectionStatus = 'pending' | 'in_progress' | 'passed' | 'failed';
type RiskLevel = 'low' | 'medium' | 'high';

interface InspectionItem {
  id: string;
  area: string;
  inspector: string;
  scheduledDate: string;
  status: InspectionStatus;
  riskLevel: RiskLevel;
  notes: string;
  equipment: string;
  lastInspection: string;
  actionRequired: string;
}

// ==================== 常量与映射 ====================

const FIRE_STATUS_MAP: Record<InspectionStatus, { label: string; variant: 'neutral' | 'warning' | 'success' | 'danger' }> = {
  pending: { label: '待检查', variant: 'neutral' },
  in_progress: { label: '检查中', variant: 'warning' },
  passed: { label: '通过', variant: 'success' },
  failed: { label: '未通过', variant: 'danger' },
};

const RISK_MAP: Record<RiskLevel, { label: string; variant: 'neutral' | 'warning' | 'danger' }> = {
  low: { label: '低风险', variant: 'neutral' },
  medium: { label: '中风险', variant: 'warning' },
  high: { label: '高风险', variant: 'danger' },
};

const EQUIPMENT_OPTIONS = ['灭火器', '消防栓', '报警器', '喷淋系统', '疏散指示灯', '防火门', '排烟系统'] as const;
const AREA_OPTIONS = ['厨房A区', '厨房B区', '仓库A区', '仓库B区', '大厅', '办公室', '停车场', '走廊', '天台'] as const;
const INSPECTOR_OPTIONS = ['张三', '李四', '王五', '赵六', '陈七', '刘八'] as const;

// ==================== Mock 数据 ====================

const generateMockData = (): InspectionItem[] => {
  const statuses: InspectionStatus[] = ['passed', 'passed', 'passed', 'in_progress', 'failed', 'pending'];
  const levels: RiskLevel[] = ['low', 'low', 'medium', 'medium', 'high', 'low'];
  return AREA_OPTIONS.slice(0, 9).map((area, i) => {
    const d = new Date(Date.now() + i * 86400000);
    return {
      id: `FP-${String(i + 1).padStart(3, '0')}`,
      area,
      inspector: INSPECTOR_OPTIONS[i % INSPECTOR_OPTIONS.length],
      scheduledDate: d.toISOString().split('T')[0],
      status: statuses[i % statuses.length],
      riskLevel: levels[i % levels.length],
      notes: i === 4 ? '报警器故障需维修' : i === 0 ? '灭火器正常' : '',
      equipment: EQUIPMENT_OPTIONS[i % EQUIPMENT_OPTIONS.length],
      lastInspection: new Date(Date.now() - (30 + i * 5) * 86400000).toISOString().split('T')[0],
      actionRequired: statuses[i % statuses.length] === 'failed' ? '立即维修' : '',
    };
  });
};

const DEFAULT_FORM = {
  area: '' as string,
  inspector: '' as string,
  scheduledDate: '' as string,
  riskLevel: 'low' as RiskLevel,
  equipment: '' as string,
  notes: '',
};

// ==================== 列定义 ====================

function buildColumns(): DataTableColumn<InspectionItem>[] {
  return [
    { key: 'id', title: '编号', dataKey: 'id', width: '80px' },
    { key: 'area', title: '检查区域', dataKey: 'area', sortable: true },
    { key: 'equipment', title: '设备', dataKey: 'equipment', sortable: true },
    { key: 'inspector', title: '检查人', dataKey: 'inspector', sortable: true },
    { key: 'scheduledDate', title: '计划日期', dataKey: 'scheduledDate', sortable: true },
    {
      key: 'status',
      title: '状态',
      sortValue: (item) => item.status,
      render: (item) => {
        const s = FIRE_STATUS_MAP[item.status];
        return <StatusBadge label={s.label} variant={s.variant} size="sm" dot />;
      },
    },
    {
      key: 'riskLevel',
      title: '风险等级',
      sortValue: (item) => item.riskLevel,
      render: (item) => {
        const r = RISK_MAP[item.riskLevel];
        return <StatusBadge label={r.label} variant={r.variant} size="sm" />;
      },
    },
    { key: 'notes', title: '备注', dataKey: 'notes', render: (item) => item.notes || '—' },
    {
      key: 'actions',
      title: '操作',
      width: '100px',
      render: (item) => (
        <div style={{ display: 'flex', gap: 4 }}>
          <Button size="sm" variant="ghost">编辑</Button>
          {item.status === 'pending' && <Button size="sm" variant="primary">开始检查</Button>}
        </div>
      ),
    },
  ];
}

// ==================== 主页面 ====================

// 区域分布统计
function AreaStats({ items }: { items: InspectionItem[] }) {
  const areaCounts = useMemo(() => {
    const map: Record<string, { total: number; passed: number; failed: number }> = {};
    items.forEach((i) => {
      if (!map[i.area]) map[i.area] = { total: 0, passed: 0, failed: 0 };
      map[i.area].total++;
      if (i.status === 'passed') map[i.area].passed++;
      if (i.status === 'failed') map[i.area].failed++;
    });
    return map;
  }, [items]);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8, marginBottom: 16 }}>
      {Object.entries(areaCounts).map(([area, st]) => (
        <div key={area} style={{ padding: '8px 12px', borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: 12 }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>{area}</div>
          <div style={{ display: 'flex', gap: 8, color: '#64748b' }}>
            <span>{st.total}项</span>
            <span style={{ color: '#16a34a' }}>✓{st.passed}</span>
            {st.failed > 0 && <span style={{ color: '#dc2626' }}>✗{st.failed}</span>}
          </div>
          <div style={{ height: 4, borderRadius: 2, background: '#e2e8f0', marginTop: 6 }}>
            <div style={{ height: '100%', width: `${(st.passed / Math.max(st.total, 1)) * 100}%`, background: '#22c55e', borderRadius: 2 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// 趋势数据
function FireTrendChart() {
  const months = ['1月','2月','3月','4月','5月','6月'];
  const data = [85, 92, 78, 95, 88, 91];
  const max = Math.max(...data);
  return (
    <div style={{ padding: 16, borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: '#1e293b' }}>📊 月度合规率趋势</div>
      <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 100, paddingBottom: 20 }}>
        {data.map((v, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ width: '100%', height: `${(v / max) * 100}%`, background: v >= 90 ? '#22c55e' : v >= 80 ? '#eab308' : '#ef4444', borderRadius: '4px 4px 0 0', minHeight: 8 }} />
            <div style={{ fontSize: 10, color: '#64748b' }}>{months[i]}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function FirePreventionPage() {
  const [items, setItems] = useState<InspectionItem[]>(generateMockData);
  const [statusFilter, setStatusFilter] = useState<InspectionStatus | 'ALL'>('ALL');
  const [sortConfig, setSortConfig] = useState<DataTableSortConfig | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InspectionItem | null>(null);
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // 搜索过滤
  const { filteredItems: searchedItems, searchTerm, setSearchTerm } = useSearchFilter(
    items,
    useMemo<(keyof InspectionItem)[]>(() => ['area', 'inspector', 'notes', 'equipment'], []),
  );
  const [searchQuery, setSearchQuery] = useState(searchTerm);
  // sync the hook's internal searchTerm when external value changes
  const syncSearch = useCallback((v: string) => { setSearchTerm(v); setSearchQuery(v); }, [setSearchTerm]);

  const filteredItems = useMemo(
    () => (statusFilter === 'ALL' ? searchedItems : searchedItems.filter((i) => i.status === statusFilter)),
    [searchedItems, statusFilter],
  );

  const columns = useMemo(() => buildColumns(), []);
  const sorted = useSortedItems(filteredItems, columns, sortConfig);
  const pagination = usePagination({ initialPageSize: 10 });
  const pageItems = pagination.paginate(sorted);

  // 统计
  const stats = useMemo(() => ({
    total: items.length,
    pending: items.filter((i) => i.status === 'pending').length,
    inProgress: items.filter((i) => i.status === 'in_progress').length,
    passed: items.filter((i) => i.status === 'passed').length,
    failed: items.filter((i) => i.status === 'failed').length,
    highRisk: items.filter((i) => i.riskLevel === 'high').length,
  }), [items]);

  // 表单校验
  const validateForm = useCallback((data: typeof DEFAULT_FORM): boolean => {
    const errors: Record<string, string> = {};
    if (!data.area) errors.area = '请选择检查区域';
    if (!data.inspector) errors.inspector = '请选择检查人';
    if (!data.scheduledDate) errors.scheduledDate = '请选择计划日期';
    if (!data.equipment) errors.equipment = '请选择检查设备';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, []);

  // 创建
  const handleCreate = useCallback(() => {
    if (!validateForm(formData)) return;
    const newItem: InspectionItem = {
      id: `FP-${String(items.length + 1).padStart(3, '0')}`,
      area: formData.area,
      inspector: formData.inspector,
      scheduledDate: formData.scheduledDate,
      status: 'pending',
      riskLevel: formData.riskLevel,
      notes: formData.notes,
      equipment: formData.equipment,
      lastInspection: new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0],
      actionRequired: '',
    };
    setItems((prev) => [newItem, ...prev]);
    setFeedback({ type: 'success', message: `检查记录 ${newItem.id} 已创建` });
    setShowCreateModal(false);
    setFormData(DEFAULT_FORM);
  }, [formData, validateForm, items.length]);

  // 编辑
  const handleEdit = useCallback((item: InspectionItem) => {
    setEditingItem(item);
    setFormData({
      area: item.area,
      inspector: item.inspector,
      scheduledDate: item.scheduledDate,
      riskLevel: item.riskLevel,
      equipment: item.equipment,
      notes: item.notes,
    });
    setFormErrors({});
    setShowEditModal(true);
  }, []);

  const handleUpdate = useCallback(() => {
    if (!editingItem || !validateForm(formData)) return;
    setItems((prev) =>
      prev.map((i) =>
        i.id === editingItem.id
          ? {
              ...i,
              area: formData.area,
              inspector: formData.inspector,
              scheduledDate: formData.scheduledDate,
              riskLevel: formData.riskLevel,
              equipment: formData.equipment,
              notes: formData.notes,
            }
          : i,
      ),
    );
    setFeedback({ type: 'success', message: `检查记录 ${editingItem.id} 已更新` });
    setShowEditModal(false);
    setEditingItem(null);
    setFormData(DEFAULT_FORM);
  }, [editingItem, formData, validateForm]);

  // 批量操作
  const handleBatchComplete = useCallback(() => {
    setItems((prev) =>
      prev.map((i) => (selectedIds.has(i.id) ? { ...i, status: 'passed' as InspectionStatus } : i)),
    );
    setFeedback({ type: 'success', message: `已完成 ${selectedIds.size} 项检查` });
    setSelectedIds(new Set());
  }, [selectedIds]);

  const handleExportReport = useCallback(() => {
    const exportItems = selectedIds.size > 0 ? items.filter((i) => selectedIds.has(i.id)) : items;
    const csv = ['id,area,equipment,status,riskLevel,notes']
      .concat(exportItems.map((i) => `${i.id},${i.area},${i.equipment},${FIRE_STATUS_MAP[i.status].label},${RISK_MAP[i.riskLevel].label},${i.notes}`))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fire-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [items, selectedIds]);

  const handleRefresh = useCallback(() => {
    setFeedback({ type: 'success', message: '数据已刷新' });
  }, []);

  return (
    <PageShell title="🔥 消防管理" subtitle="消防安全检查记录与风险管理">
      {/* 统计面板 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
        <StatCard label="总检查项" value={stats.total.toString()} helper={`高风险 ${stats.highRisk}`} />
        <StatCard label="待检查" value={stats.pending.toString()} helper={`检查中 ${stats.inProgress}`} variant="warning" />
        <StatCard label="已通过" value={stats.passed.toString()} helper="通过项" variant="success" />
        <StatCard label="未通过" value={stats.failed.toString()} helper="需整改" variant="error" />
      </div>

      {/* 效率概要 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
        <div style={{ padding: '10px 14px', background: '#f0fdf4', borderRadius: 8, fontSize: 13 }}>
          <span style={{ color: '#16a34a' }}>完成率</span>
          <div style={{ fontWeight: 700, fontSize: 20, color: '#166534', marginTop: 2 }}>
            {stats.total > 0 ? Math.round(((stats.passed + stats.failed) / stats.total) * 100) : 0}%
          </div>
        </div>
        <div style={{ padding: '10px 14px', background: '#fefce8', borderRadius: 8, fontSize: 13 }}>
          <span style={{ color: '#ca8a04' }}>高危占比</span>
          <div style={{ fontWeight: 700, fontSize: 20, color: '#854d0e', marginTop: 2 }}>
            {stats.total > 0 ? Math.round((stats.highRisk / stats.total) * 100) : 0}%
          </div>
        </div>
        <div style={{ padding: '10px 14px', background: '#eff6ff', borderRadius: 8, fontSize: 13 }}>
          <span style={{ color: '#2563eb' }}>需整改项</span>
          <div style={{ fontWeight: 700, fontSize: 20, color: '#1e40af', marginTop: 2 }}>{stats.failed}</div>
        </div>
      </div>

      {/* 反馈 */}
      {feedback && (
        <FormSubmitFeedback
          success={feedback.type === 'success' ? feedback.message : undefined}
          onDismissSuccess={() => setFeedback(null)}
        />
      )}

      {/* 工具栏 */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <SearchFilterInput placeholder="搜索区域、检查人..." value={searchQuery} onChange={syncSearch} width="auto" />
        <Select
          value={statusFilter}
          onChange={(v) => setStatusFilter(v as InspectionStatus | 'ALL')}
          options={[
            { value: 'ALL', label: '全部状态' },
            ...Object.entries(FIRE_STATUS_MAP).map(([k, v]) => ({ value: k, label: v.label })),
          ]}
        />
        <div style={{ flex: 1 }} />
        <SubmitButton label="＋ 新建检查" variant="primary" onClick={() => { setFormData(DEFAULT_FORM); setFormErrors({}); setShowCreateModal(true); }} />
        <Button variant="outline" onClick={handleRefresh}>🔄 刷新</Button>
        <Button variant="outline" onClick={handleExportReport}>📥 导出报告</Button>
      </div>

      {/* 批量操作栏 */}
      {selectedIds.size > 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, padding: '8px 12px', borderRadius: 8, background: 'rgba(34,197,94,0.08)', alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: '#22c55e', fontWeight: 600 }}>已选 {selectedIds.size} 项</span>
          <Button variant="primary" size="sm" onClick={handleBatchComplete}>标记已完成</Button>
          <Button variant="outline" size="sm" onClick={() => setSelectedIds(new Set())}>取消选择</Button>
        </div>
      )}

      {/* 表格 */}
      <DataTable
        title={`消防检查 (${filteredItems.length})`}
        columns={columns}
        items={pageItems}
        rowKey={(item) => item.id}
        sort={sortConfig}
        onSortChange={setSortConfig}
        striped
        compact
        emptyText={searchQuery || statusFilter !== 'ALL' ? '没有匹配的检查记录' : '暂无检查记录'}
      />

      <Pagination
        page={pagination.page}
        pageSize={pagination.pageSize}
        total={filteredItems.length}
        onPageChange={pagination.setPage}
        onPageSizeChange={pagination.setPageSize}
      />

      {/* 创建 Modal */}
      <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)} title="新建消防检查" width={560}>
        <InspectionForm formData={formData} onChange={setFormData} errors={formErrors} />
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
          <SubmitButton label="取消" variant="secondary" onClick={() => setShowCreateModal(false)} />
          <SubmitButton label="创建" variant="primary" onClick={handleCreate} />
        </div>
      </Modal>

      {/* 编辑 Modal */}
      <Modal open={showEditModal} onClose={() => { setShowEditModal(false); setEditingItem(null); }} title={`编辑检查记录`} width={560}>
        <p style={{ fontSize: 13, color: '#666', marginBottom: 12 }}>编号: {editingItem?.id}</p>
        <InspectionForm formData={formData} onChange={setFormData} errors={formErrors} />
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
          <SubmitButton label="取消" variant="secondary" onClick={() => { setShowEditModal(false); setEditingItem(null); }} />
          <SubmitButton label="保存修改" variant="primary" onClick={handleUpdate} />
        </div>
      </Modal>

      {/* 安全合规提示 */}
      <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
        <div style={{ flex: 1, padding: '10px 14px', background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0', fontSize: 13 }}>
          <div style={{ fontWeight: 600 }}>📋 合规状态</div>
          <div style={{ marginTop: 4, display: 'flex', justifyContent: 'space-between' }}>
            <span>通过率</span>
            <span style={{ fontWeight: 700 }}>{stats.total > 0 ? Math.round((stats.passed / stats.total) * 100) : 0}%</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
            <span>待检查</span>
            <span style={{ fontWeight: 700 }}>{stats.pending} 项</span>
          </div>
        </div>
        <div style={{ flex: 1, padding: '10px 14px', background: '#fefce8', borderRadius: 8, border: '1px solid #fde68a', fontSize: 13 }}>
          <div style={{ fontWeight: 600 }}>🛡️ 消防安全提示</div>
          <div style={{ marginTop: 4, color: '#92400e' }}>按时完成检查，确保所有设备正常运行。高风险区域需优先处理。</div>
        </div>
      </div>
    </PageShell>
  );
}

// ==================== 检查表单 ====================

function InspectionForm({
  formData,
  onChange,
  errors,
}: {
  formData: typeof DEFAULT_FORM;
  onChange: (d: typeof DEFAULT_FORM) => void;
  errors: Record<string, string>;
}) {
  const update = (partial: Partial<typeof DEFAULT_FORM>) => onChange({ ...formData, ...partial });

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <FormField label="检查区域" error={errors.area} required>
          <select
            value={formData.area}
            onChange={(e) => update({ area: e.target.value })}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #d9d9d9' }}
          >
            <option value="">选择区域</option>
            {AREA_OPTIONS.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </FormField>
        <FormField label="检查人" error={errors.inspector} required>
          <select
            value={formData.inspector}
            onChange={(e) => update({ inspector: e.target.value })}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #d9d9d9' }}
          >
            <option value="">选择检查人</option>
            {INSPECTOR_OPTIONS.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </FormField>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <FormField label="计划日期" error={errors.scheduledDate} required>
          <input
            type="date"
            value={formData.scheduledDate}
            onChange={(e) => update({ scheduledDate: e.target.value })}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #d9d9d9' }}
          />
        </FormField>
        <FormField label="风险等级">
          <select
            value={formData.riskLevel}
            onChange={(e) => update({ riskLevel: e.target.value as RiskLevel })}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #d9d9d9' }}
          >
            {Object.entries(RISK_MAP).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </FormField>
      </div>

      <FormField label="检查设备" error={errors.equipment} required>
        <select
          value={formData.equipment}
          onChange={(e) => update({ equipment: e.target.value })}
          style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #d9d9d9' }}
        >
          <option value="">选择设备</option>
          {EQUIPMENT_OPTIONS.map((e) => (
            <option key={e} value={e}>{e}</option>
          ))}
        </select>
      </FormField>

      <FormField label="备注">
        <textarea
          value={formData.notes}
          onChange={(e) => update({ notes: e.target.value })}
          rows={2}
          placeholder="备注信息"
          style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #d9d9d9', resize: 'vertical' }}
        />
      </FormField>
    </div>
  );
}
