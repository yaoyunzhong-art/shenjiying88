'use client';

/**
 * 安全记录 — Safety Page
 * 功能: 安全事件、隐患与整改跟踪
 * 角色: 🛡️ 安全管理员
 *
 * 页面结构:
 * - 统计面板: 待处理 · 调查中 · 已解决 · 已关闭
 * - 搜索 + 状态/严重程度筛选
 * - 安全记录 DataTable (排序/分页/选择)
 * - 创建记录 Modal (form + validation)
 * - 编辑记录 Modal (prefill + update)
 * - 批量操作栏 + 导出日志 + 刷新
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

type SafetyStatus = 'open' | 'investigating' | 'resolved' | 'closed';
type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';

interface SafetyRecord {
  id: string;
  category: string;
  reporter: string;
  reportedDate: string;
  status: SafetyStatus;
  severity: SeverityLevel;
  description: string;
  location: string;
  assignee: string;
  resolvedDate: string | null;
  actionTaken: string;
}

// ==================== 常量与映射 ====================

const STATUS_MAP: Record<SafetyStatus, { label: string; variant: 'neutral' | 'warning' | 'success' | 'danger' }> = {
  open: { label: '待处理', variant: 'neutral' },
  investigating: { label: '调查中', variant: 'warning' },
  resolved: { label: '已解决', variant: 'success' },
  closed: { label: '已关闭', variant: 'danger' },
};

const SEVERITY_MAP: Record<SeverityLevel, { label: string; variant: 'neutral' | 'warning' | 'danger' }> = {
  low: { label: '低', variant: 'neutral' },
  medium: { label: '中', variant: 'warning' },
  high: { label: '高', variant: 'danger' },
  critical: { label: '严重', variant: 'danger' },
};

const CATEGORY_OPTIONS = ['电气安全', '消防安全', '食品安全', '设备安全', '环境安全', '人身安全', '信息安全'] as const;
const LOCATION_OPTIONS = ['厨房A区', '仓库B区', '大厅', '办公室', '停车场', '配电室', '冷冻库', '天台'] as const;
const REPORTER_OPTIONS = ['电工组', '安保部', '厨房组', '设备组', '行政部门', '运营部'] as const;
const ASSIGNEE_OPTIONS = ['张工', '李工', '王工', '赵工', '陈工', '刘工'] as const;

// ==================== Mock 数据 ====================

const generateMockRecords = (): SafetyRecord[] => {
  const statuses: SafetyStatus[] = ['open', 'investigating', 'resolved', 'closed', 'open', 'resolved', 'closed', 'investigating'];
  const severities: SeverityLevel[] = ['low', 'medium', 'high', 'critical', 'low', 'medium', 'high', 'critical'];
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(Date.now() - i * 86400000);
    const res = statuses[i % statuses.length] === 'resolved' || statuses[i % statuses.length] === 'closed'
      ? new Date(Date.now() - (i - 2) * 86400000).toISOString().split('T')[0]
      : null;
    return {
      id: `SAF-${String(i + 1).padStart(3, '0')}`,
      category: CATEGORY_OPTIONS[i % CATEGORY_OPTIONS.length],
      reporter: REPORTER_OPTIONS[i % REPORTER_OPTIONS.length],
      reportedDate: d.toISOString().split('T')[0],
      status: statuses[i % statuses.length],
      severity: severities[i % severities.length],
      description: i === 0 ? '配电箱线路老化' : i === 3 ? '天花板漏水有触电风险' : `安全记录 #${i + 1}`,
      location: LOCATION_OPTIONS[i % LOCATION_OPTIONS.length],
      assignee: ASSIGNEE_OPTIONS[i % ASSIGNEE_OPTIONS.length],
      resolvedDate: res,
      actionTaken: res ? (i === 2 ? '已更换老化线路' : '已安排检修') : '',
    };
  });
};

const DEFAULT_FORM = {
  category: '' as string,
  reporter: '' as string,
  location: '' as string,
  severity: 'medium' as SeverityLevel,
  description: '',
  assignee: '' as string,
};

// ==================== 列定义 ====================

function buildColumns(): DataTableColumn<SafetyRecord>[] {
  return [
    { key: 'id', title: '编号', dataKey: 'id', width: 80 },
    { key: 'category', title: '类别', dataKey: 'category', sortable: true },
    { key: 'reporter', title: '上报人', dataKey: 'reporter', sortable: true },
    { key: 'reportedDate', title: '上报日期', dataKey: 'reportedDate', sortable: true },
    {
      key: 'status',
      title: '状态',
      sortValue: (item) => item.status,
      render: (item) => {
        const s = STATUS_MAP[item.status];
        return <StatusBadge label={s.label} variant={s.variant} size="sm" dot />;
      },
    },
    {
      key: 'severity',
      title: '严重程度',
      sortValue: (item) => item.severity,
      render: (item) => {
        const s = SEVERITY_MAP[item.severity];
        return <StatusBadge label={s.label} variant={s.variant} size="sm" />;
      },
    },
    { key: 'location', title: '位置', dataKey: 'location', sortable: true },
    { key: 'assignee', title: '处理人', dataKey: 'assignee', sortable: true },
    { key: 'description', title: '描述', dataKey: 'description', render: (item) => (
      <div style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.description}</div>
    )},
    {
      key: 'actions',
      title: '操作',
      width: 100,
      render: (item) => (
        <div style={{ display: 'flex', gap: 4 }}>
          <Button size="xs" variant="text">编辑</Button>
          {item.status === 'open' && <Button size="xs" variant="primary">受理</Button>}
        </div>
      ),
    },
  ];
}

// ==================== 主页面 ====================

export default function SafetyPage() {
  const [records, setRecords] = useState<SafetyRecord[]>(generateMockRecords);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<SafetyStatus | 'ALL'>('ALL');
  const [severityFilter, setSeverityFilter] = useState<SeverityLevel | 'ALL'>('ALL');
  const [sortConfig, setSortConfig] = useState<DataTableSortConfig | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<SafetyRecord | null>(null);
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // 搜索过滤
  const searchFields = useMemo<(keyof SafetyRecord)[]>(
    () => ['category', 'reporter', 'description', 'location', 'assignee'],
    [],
  );
  const { filteredItems: searchedItems } = useSearchFilter(records, searchFields, searchQuery);

  const filteredRecords = useMemo(() => {
    let result = searchedItems;
    if (statusFilter !== 'ALL') result = result.filter((r) => r.status === statusFilter);
    if (severityFilter !== 'ALL') result = result.filter((r) => r.severity === severityFilter);
    return result;
  }, [searchedItems, statusFilter, severityFilter]);

  const columns = useMemo(() => buildColumns(), []);
  const sorted = useSortedItems(filteredRecords, columns, sortConfig);
  const pagination = usePagination({ initialPageSize: 10 });
  const pageItems = pagination.paginate(sorted);

  // 统计
  const stats = useMemo(() => ({
    total: records.length,
    open: records.filter((r) => r.status === 'open').length,
    investigating: records.filter((r) => r.status === 'investigating').length,
    resolved: records.filter((r) => r.status === 'resolved').length,
    closed: records.filter((r) => r.status === 'closed').length,
    critical: records.filter((r) => r.severity === 'critical').length,
  }), [records]);

  // 表单校验
  const validateForm = useCallback((data: typeof DEFAULT_FORM): boolean => {
    const errors: Record<string, string> = {};
    if (!data.category) errors.category = '请选择类别';
    if (!data.reporter) errors.reporter = '请选择上报人';
    if (!data.description.trim()) errors.description = '描述不能为空';
    if (!data.location) errors.location = '请选择位置';
    if (!data.assignee) errors.assignee = '请选择处理人';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, []);

  // 创建
  const handleCreate = useCallback(() => {
    if (!validateForm(formData)) return;
    const newRecord: SafetyRecord = {
      id: `SAF-${String(records.length + 1).padStart(3, '0')}`,
      category: formData.category,
      reporter: formData.reporter,
      reportedDate: new Date().toISOString().split('T')[0],
      status: 'open',
      severity: formData.severity,
      description: formData.description,
      location: formData.location,
      assignee: formData.assignee,
      resolvedDate: null,
      actionTaken: '',
    };
    setRecords((prev) => [newRecord, ...prev]);
    setFeedback({ type: 'success', message: `安全记录 ${newRecord.id} 已创建` });
    setShowCreateModal(false);
    setFormData(DEFAULT_FORM);
  }, [formData, validateForm, records.length]);

  // 编辑
  const handleStartEdit = useCallback((record: SafetyRecord) => {
    setEditingRecord(record);
    setFormData({
      category: record.category,
      reporter: record.reporter,
      location: record.location,
      severity: record.severity,
      description: record.description,
      assignee: record.assignee,
    });
    setFormErrors({});
    setShowEditModal(true);
  }, []);

  const handleUpdate = useCallback(() => {
    if (!editingRecord || !validateForm(formData)) return;
    setRecords((prev) =>
      prev.map((r) =>
        r.id === editingRecord.id
          ? {
              ...r,
              category: formData.category,
              reporter: formData.reporter,
              location: formData.location,
              severity: formData.severity,
              description: formData.description,
              assignee: formData.assignee,
            }
          : r,
      ),
    );
    setFeedback({ type: 'success', message: `安全记录 ${editingRecord.id} 已更新` });
    setShowEditModal(false);
    setEditingRecord(null);
    setFormData(DEFAULT_FORM);
  }, [editingRecord, formData, validateForm]);

  // 批量处理
  const handleBatchResolve = useCallback(() => {
    setRecords((prev) =>
      prev.map((r) =>
        selectedIds.has(r.id) && (r.status === 'open' || r.status === 'investigating')
          ? { ...r, status: 'resolved' as SafetyStatus, resolvedDate: new Date().toISOString().split('T')[0], actionTaken: '批量处理' }
          : r,
      ),
    );
    setFeedback({ type: 'success', message: `已解决 ${selectedIds.size} 项` });
    setSelectedIds(new Set());
  }, [selectedIds]);

  const handleExport = useCallback(() => {
    const exportItems = selectedIds.size > 0 ? records.filter((r) => selectedIds.has(r.id)) : records;
    const csv = ['id,category,status,severity,assignee,reportedDate']
      .concat(exportItems.map((r) => `${r.id},${r.category},${STATUS_MAP[r.status].label},${SEVERITY_MAP[r.severity].label},${r.assignee},${r.reportedDate}`))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `safety-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [records, selectedIds]);

  const handleRefresh = useCallback(() => {
    setFeedback({ type: 'success', message: '数据已刷新' });
  }, []);

  return (
    <PageShell title="🛡️ 安全记录" subtitle="安全事件、隐患与整改跟踪">
      {/* 统计面板 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
        <StatCard title="总记录" value={stats.total.toString()} secondary={`严重 ${stats.critical}`} />
        <StatCard title="待处理" value={stats.open.toString()} secondary={`调查中 ${stats.investigating}`} tone="warning" />
        <StatCard title="已解决" value={stats.resolved.toString()} secondary="待关闭" tone="success" />
        <StatCard title="已关闭" value={stats.closed.toString()} secondary="已完成" tone="default" />
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
        <SearchFilterInput placeholder="搜索类别、上报人..." value={searchQuery} onChange={setSearchQuery} width="auto" />
        <Select
          value={statusFilter}
          onChange={(v) => setStatusFilter(v as SafetyStatus | 'ALL')}
          options={[
            { value: 'ALL', label: '全部状态' },
            ...Object.entries(STATUS_MAP).map(([k, v]) => ({ value: k, label: v.label })),
          ]}
        />
        <Select
          value={severityFilter}
          onChange={(v) => setSeverityFilter(v as SeverityLevel | 'ALL')}
          options={[
            { value: 'ALL', label: '全部严重程度' },
            ...Object.entries(SEVERITY_MAP).map(([k, v]) => ({ value: k, label: v.label })),
          ]}
        />
        <div style={{ flex: 1 }} />
        <SubmitButton label="＋ 新建记录" variant="primary" onClick={() => { setFormData(DEFAULT_FORM); setFormErrors({}); setShowCreateModal(true); }} />
        <Button variant="outline" onClick={handleRefresh}>🔄 刷新</Button>
        <Button variant="outline" onClick={handleExport}>📥 导出日志</Button>
      </div>

      {/* 批量操作栏 */}
      {selectedIds.size > 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, padding: '8px 12px', borderRadius: 8, background: 'rgba(34,197,94,0.08)', alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: '#22c55e', fontWeight: 600 }}>已选 {selectedIds.size} 项</span>
          <Button variant="primary" size="sm" onClick={handleBatchResolve}>标记已解决</Button>
          <Button variant="outline" size="sm" onClick={() => setSelectedIds(new Set())}>取消选择</Button>
        </div>
      )}

      {/* 表格 */}
      <DataTable
        title={`安全记录 (${filteredRecords.length})`}
        columns={columns}
        items={pageItems}
        rowKey={(r) => r.id}
        sort={sortConfig}
        onSortChange={setSortConfig}
        striped
        compact
        selectable
        selectedKeys={selectedIds}
        onSelectionChange={(keys) => setSelectedIds(new Set(Array.from(keys)))}
        emptyText={searchQuery || statusFilter !== 'ALL' || severityFilter !== 'ALL' ? '没有匹配的记录' : '暂无记录'}
      />

      <Pagination
        page={pagination.page}
        pageSize={pagination.pageSize}
        total={filteredRecords.length}
        onPageChange={pagination.setPage}
        onPageSizeChange={pagination.setPageSize}
      />

      {/* 创建 Modal */}
      <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)} title="新建安全记录" width={580}>
        <SafetyForm formData={formData} onChange={setFormData} errors={formErrors} />
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
          <SubmitButton label="取消" variant="secondary" onClick={() => setShowCreateModal(false)} />
          <SubmitButton label="创建记录" variant="primary" onClick={handleCreate} />
        </div>
      </Modal>

      {/* 编辑 Modal */}
      <Modal open={showEditModal} onClose={() => { setShowEditModal(false); setEditingRecord(null); }} title={`编辑安全记录`} width={580}>
        <p style={{ fontSize: 13, color: '#666', marginBottom: 12 }}>编号: {editingRecord?.id}</p>
        <SafetyForm formData={formData} onChange={setFormData} errors={formErrors} />
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
          <SubmitButton label="取消" variant="secondary" onClick={() => { setShowEditModal(false); setEditingRecord(null); }} />
          <SubmitButton label="保存修改" variant="primary" onClick={handleUpdate} />
        </div>
      </Modal>

      {/* 安全合规概览 */}
      <div style={{ marginTop: 16, padding: '12px 16px', background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0', fontSize: 13 }}>
        <div style={{ fontWeight: 600, color: '#166534', marginBottom: 6 }}>🛡️ 安全合规概览</div>
        <div style={{ display: 'flex', gap: 16, color: '#15803d' }}>
          <span>待处理: {stats.pending} 项</span>
          <span>调查中: {stats.inProgress} 项</span>
          <span>已解决: {stats.resolved} 项</span>
          <span>已关闭: {stats.closed} 项</span>
        </div>
        <div style={{ fontSize: 12, color: '#16a34a', marginTop: 4 }}>
          总体完成率: {stats.total > 0 ? Math.round(((stats.resolved + stats.closed) / stats.total) * 100) : 0}%
        </div>
      </div>
    </PageShell>
  );
}

// ==================== 安全记录表单 ====================

function SafetyForm({
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
        <FormField label="类别" error={errors.category} required>
          <select
            value={formData.category}
            onChange={(e) => update({ category: e.target.value })}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #d9d9d9' }}
          >
            <option value="">选择类别</option>
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </FormField>
        <FormField label="上报人" error={errors.reporter} required>
          <select
            value={formData.reporter}
            onChange={(e) => update({ reporter: e.target.value })}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #d9d9d9' }}
          >
            <option value="">选择上报人</option>
            {REPORTER_OPTIONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </FormField>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <FormField label="发生位置" error={errors.location} required>
          <select
            value={formData.location}
            onChange={(e) => update({ location: e.target.value })}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #d9d9d9' }}
          >
            <option value="">选择位置</option>
            {LOCATION_OPTIONS.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </FormField>
        <FormField label="严重程度">
          <select
            value={formData.severity}
            onChange={(e) => update({ severity: e.target.value as SeverityLevel })}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #d9d9d9' }}
          >
            {Object.entries(SEVERITY_MAP).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </FormField>
      </div>

      <FormField label="处理人" error={errors.assignee} required>
        <select
          value={formData.assignee}
          onChange={(e) => update({ assignee: e.target.value })}
          style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #d9d9d9' }}
        >
          <option value="">选择处理人</option>
          {ASSIGNEE_OPTIONS.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </FormField>

      <FormField label="描述" error={errors.description} required>
        <textarea
          value={formData.description}
          onChange={(e) => update({ description: e.target.value })}
          rows={3}
          placeholder="描述安全事件或隐患详情"
          style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #d9d9d9', resize: 'vertical' }}
        />
      </FormField>
    </div>
  );
}
