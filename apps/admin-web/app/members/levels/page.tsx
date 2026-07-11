// @ts-nocheck
'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';

import {
  DataTable,
  DetailActionBar,
  FormField,
  FormSubmitFeedback,
  PageShell,
  Pagination,
  SearchFilterInput,
  StatusBadge,
  SubmitButton,
  Tabs,
  WorkspaceBreadcrumb,
  Dialog,
  usePagination,
  useSearchFilter,
  useSortedItems,
  useToast,
  type DataTableColumn,
  type DataTableSortConfig,
} from '@m5/ui';

import {
  MOCK_MEMBER_LEVEL_CONFIGS,
  MEMBER_TIER_MAP,
  type MemberLevelConfig,
} from '../../members-data';

// ---- 等级状态映射 ----

const LEVEL_STATUS_MAP: Record<string, { label: string; variant: 'success' | 'warning' | 'neutral' }> = {
  active: { label: '启用', variant: 'success' },
  inactive: { label: '停用', variant: 'warning' },
  hidden: { label: '仅内部可见', variant: 'neutral' },
};

const LEVEL_STATUS_KEYS = ['active', 'inactive', 'hidden'] as const;

// ---- 颜色辅助 ----

function levelColor(level: number): string {
  const colors = ['#f0abfc', '#fbbf24', '#94a3b8', '#d97706', '#64748b'];
  return colors[Math.min(level - 1, colors.length - 1)];
}

function formatCurrency(amount: number): string {
  if (amount >= 10000) return `¥${(amount / 10000).toFixed(1)}万`;
  return `¥${amount.toLocaleString()}`;
}

// ---- 新增等级类型 ----

interface CreateLevelFormData {
  name: string;
  key: string;
  level: number;
  minPoints: number;
  maxPoints: number;
  discountRate: number;
  annualFee: number;
  benefits: string;
  status: 'active' | 'inactive' | 'hidden';
}

interface CreateLevelErrors {
  name?: string;
  key?: string;
  minPoints?: string;
  maxPoints?: string;
  discountRate?: string;
  annualFee?: string;
}

const DEFAULT_CREATE_FORM: CreateLevelFormData = {
  name: '',
  key: '',
  level: 5,
  minPoints: 0,
  maxPoints: 9999,
  discountRate: 100,
  annualFee: 0,
  benefits: '',
  status: 'active',
};

// ---- 页面 ----

export default function MemberLevelsPage() {
  const router = useRouter();
  const toast = useToast();

  // 状态
  const [levels, setLevels] = useState<MemberLevelConfig[]>(MOCK_MEMBER_LEVEL_CONFIGS);
  const [sortConfig, setSortConfig] = useState<DataTableSortConfig | null>({
    key: 'level',
    direction: 'asc',
  });
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MemberLevelConfig | null>(null);
  const [createForm, setCreateForm] = useState<CreateLevelFormData>(DEFAULT_CREATE_FORM);
  const [createErrors, setCreateErrors] = useState<CreateLevelErrors>({});
  const [isCreating, setIsCreating] = useState(false);

  // 搜索
  const [searchTerm, setSearchTerm] = useState('');
  const searchFields = useMemo<(keyof MemberLevelConfig)[]>(
    () => ['name', 'key'] as (keyof MemberLevelConfig)[],
    []
  );

  // 筛选
  const statusFiltered = useMemo(
    () =>
      statusFilter === 'ALL'
        ? levels
        : levels.filter((l) => l.status === statusFilter),
    [levels, statusFilter]
  );

    const { searchTerm: filteredSearchTerm, setSearchTerm: setFilteredSearchTerm, filteredItems } = useSearchFilter(
    statusFiltered,
    searchFields
  );

  // 排序和分页
  const columns: DataTableColumn<MemberLevelConfig>[] = useMemo(
    () => [
      {
        key: 'level',
        title: '排序',
        dataKey: 'level',
        sortable: true,
        align: 'center',
        render: (item) => (
          <span
            style={{
              fontWeight: 700,
              color: levelColor(item.level),
              fontSize: 18,
            }}
          >
            #{item.level}
          </span>
        ),
      },
      {
        key: 'name',
        title: '等级名称',
        dataKey: 'name',
        sortable: true,
        render: (item) => (
          <span
            onClick={() => router.push(`/members/levels/${item.id}`)}
            style={{
              color: '#93c5fd',
              cursor: 'pointer',
              textDecoration: 'underline',
              fontWeight: 600,
              fontSize: 15,
            }}
          >
            {item.name}
          </span>
        ),
      },
      {
        key: 'key',
        title: '标识',
        dataKey: 'key',
        sortable: true,
        render: (item) => (
          <code style={{ color: '#cbd5e1', fontSize: 12 }}>{item.key}</code>
        ),
      },
      {
        key: 'memberCount',
        title: '会员数',
        dataKey: 'memberCount',
        sortable: true,
        align: 'right',
      },
      {
        key: 'minPoints',
        title: '积分下限',
        dataKey: 'minPoints',
        sortable: true,
        align: 'right',
        render: (item) => item.minPoints.toLocaleString(),
      },
      {
        key: 'maxPoints',
        title: '积分上限',
        dataKey: 'maxPoints',
        sortable: true,
        align: 'right',
        render: (item) =>
          item.maxPoints >= 999999 ? '∞' : item.maxPoints.toLocaleString(),
      },
      {
        key: 'discountRate',
        title: '折扣',
        dataKey: 'discountRate',
        sortable: true,
        align: 'right',
        render: (item) => `${item.discountRate}%`,
      },
      {
        key: 'annualFee',
        title: '年费',
        dataKey: 'annualFee',
        sortable: true,
        align: 'right',
        render: (item) =>
          item.annualFee === 0 ? (
            <span style={{ color: '#86efac' }}>免费</span>
          ) : (
            formatCurrency(item.annualFee)
          ),
      },
      {
        key: 'benefits',
        title: '权益',
        render: (item) => (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {item.benefits.slice(0, 3).map((b) => (
              <span
                key={b}
                style={{
                  fontSize: 11,
                  padding: '2px 6px',
                  borderRadius: 4,
                  background: 'rgba(147, 197, 253, 0.12)',
                  color: '#93c5fd',
                }}
              >
                {b}
              </span>
            ))}
            {item.benefits.length > 3 && (
              <span style={{ fontSize: 11, color: '#64748b' }}>
                +{item.benefits.length - 3}
              </span>
            )}
          </div>
        ),
      },
      {
        key: 'status',
        title: '状态',
        sortable: true,
        sortValue: (item) => item.status,
        render: (item) => {
          const s = LEVEL_STATUS_MAP[item.status] ?? { label: item.status, variant: 'neutral' as const };
          return <StatusBadge label={s.label} variant={s.variant as 'success' | 'warning' | 'neutral'} size="sm" />;
        },
      },
      {
        key: 'actions',
        title: '操作',
        width: '160px',
        render: (item) => (
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/members/levels/${item.id}`);
              }}
              style={miniBtnStyle('primary')}
            >
              编辑
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setDeleteTarget(item);
                setDeleteDialogOpen(true);
              }}
              disabled={item.memberCount > 0}
              style={miniBtnStyle('danger')}
            >
              删除
            </button>
          </div>
        ),
      },
    ],
    [router]
  );

  const pagination = usePagination({
    initialPageSize: 10,
    pageSizeOptions: [5, 10, 20],
  });
  const sortedItems = useSortedItems(filteredItems, columns, sortConfig);
  const pageItems = pagination.paginate(sortedItems);

  // 重置分页
  useMemo(() => {
    pagination.resetPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, statusFilter]);

  // 统计
  const stats = useMemo(
    () => ({
      total: levels.length,
      active: levels.filter((l) => l.status === 'active').length,
      totalMembers: levels.reduce((sum, l) => sum + l.memberCount, 0),
    }),
    [levels]
  );

  // 创建等级表单验证
  const validateCreateForm = useCallback((data: CreateLevelFormData): CreateLevelErrors => {
    const errs: CreateLevelErrors = {};
    if (!data.name.trim()) errs.name = '等级名称不能为空';
    if (!data.key.trim()) errs.key = '等级标识不能为空';
    else if (!/^[a-z_]{2,20}$/.test(data.key)) errs.key = '标识格式：2-20位小写字母和下划线';
    if (data.minPoints < 0) errs.minPoints = '最低积分不能为负';
    if (data.maxPoints < data.minPoints) errs.maxPoints = '上限必须大于下限';
    if (data.discountRate < 0 || data.discountRate > 100) errs.discountRate = '折扣率范围为0-100';
    if (data.annualFee < 0) errs.annualFee = '年费不能为负';
    return errs;
  }, []);

  // 创建等级提交
  const handleCreateLevel = useCallback(async () => {
    const errs = validateCreateForm(createForm);
    if (Object.keys(errs).length > 0) {
      setCreateErrors(errs);
      return;
    }

    setIsCreating(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));

      const newLevel: MemberLevelConfig = {
        id: `lv-${createForm.key}`,
        key: createForm.key,
        name: createForm.name,
        level: levels.length + 1,
        minPoints: createForm.minPoints,
        maxPoints: createForm.maxPoints,
        discountRate: createForm.discountRate,
        annualFee: createForm.annualFee,
        benefits: createForm.benefits.split(',').map((b) => b.trim()).filter(Boolean),
        memberCount: 0,
        status: createForm.status,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setLevels((prev) => [...prev, newLevel]);
      toast.success(`等级「${createForm.name}」创建成功`);
      setCreateDialogOpen(false);
      setCreateForm(DEFAULT_CREATE_FORM);
      setCreateErrors({});
    } catch {
      toast.error('创建失败，请稍后重试');
    } finally {
      setIsCreating(false);
    }
  }, [createForm, levels.length, toast, validateCreateForm]);

  // 删除等级
  const handleDeleteLevel = useCallback(async () => {
    if (!deleteTarget) return;
    setIsCreating(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 400));
      setLevels((prev) => prev.filter((l) => l.id !== deleteTarget.id));
      toast.success(`等级「${deleteTarget.name}」已删除`);
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
    } catch {
      toast.error('删除失败');
    } finally {
      setIsCreating(false);
    }
  }, [deleteTarget, toast]);

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>
      <PageShell
        title="会员等级管理"
        subtitle="配置和管理会员等级体系，包括等级名称、积分区间、折扣率和权益"
      >
        {/* 统计卡片 */}
        <div
          style={{
            display: 'grid',
            gap: 14,
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            marginBottom: 20,
          }}
        >
          <div
            style={{
              borderRadius: 16,
              padding: 18,
              background: 'rgba(15, 23, 42, 0.38)',
              border: '1px solid rgba(148, 163, 184, 0.18)',
            }}
          >
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>等级总数</div>
            <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: '#e2e8f0' }}>
              {stats.total}
            </div>
          </div>
          <div
            style={{
              borderRadius: 16,
              padding: 18,
              background: 'rgba(15, 23, 42, 0.38)',
              border: '1px solid rgba(148, 163, 184, 0.18)',
            }}
          >
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>启用等级</div>
            <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: '#4ade80' }}>
              {stats.active}
            </div>
          </div>
          <div
            style={{
              borderRadius: 16,
              padding: 18,
              background: 'rgba(15, 23, 42, 0.38)',
              border: '1px solid rgba(148, 163, 184, 0.18)',
            }}
          >
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>覆盖会员</div>
            <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: '#93c5fd' }}>
              {stats.totalMembers.toLocaleString()}
            </div>
          </div>
        </div>

        {/* 顶部操作栏 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ flex: 1, maxWidth: 320 }}>
            <SearchFilterInput
              value={filteredSearchTerm}
              onChange={setFilteredSearchTerm}
              placeholder="搜索等级名称或标识..."
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Tabs
              items={[
                { key: 'ALL', label: '全部', count: levels.length },
                { key: 'active', label: '启用', count: levels.filter((l) => l.status === 'active').length },
                { key: 'inactive', label: '停用', count: levels.filter((l) => l.status === 'inactive').length },
                { key: 'hidden', label: '隐藏', count: levels.filter((l) => l.status === 'hidden').length },
              ]}
              activeKey={statusFilter}
              onChange={setStatusFilter}
              variant="pills"
              size="sm"
            />
            <SubmitButton
              variant="primary"
              onClick={() => setCreateDialogOpen(true)}
            >
              + 新增等级
            </SubmitButton>
          </div>
        </div>

        {/* 数据表格 */}
        <DataTable
          title={`等级配置（共 ${sortedItems.length} 个）`}
          columns={columns}
          items={pageItems}
          rowKey={(item) => item.id}
          sort={sortConfig}
          onSortChange={setSortConfig}
          striped
          compact
        />

        {/* 分页 */}
        <Pagination
          page={pagination.page}
          pageSize={pagination.pageSize}
          total={sortedItems.length}
          onPageChange={pagination.setPage}
          onPageSizeChange={pagination.setPageSize}
        />
      </PageShell>

      {/* ---- 新增等级弹窗 ---- */}
      {createDialogOpen && (
        <Dialog
          open
          onClose={() => {
            setCreateDialogOpen(false);
            setCreateForm(DEFAULT_CREATE_FORM);
            setCreateErrors({});
          }}
          title="新增会员等级"
        >
          <div style={{ display: 'grid', gap: 16, minWidth: 480 }}>
            <div style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr' }}>
              <div data-field="name">
                <FormField label="等级名称" required error={createErrors.name}>
                  <input
                    type="text"
                    value={createForm.name}
                    onChange={(e) => {
                      setCreateForm((prev) => ({ ...prev, name: e.target.value }));
                      setCreateErrors((prev) => {
                        const next = { ...prev };
                        delete next.name;
                        return next;
                      });
                    }}
                    disabled={isCreating}
                    style={inputStyle(!!createErrors.name)}
                    placeholder="例如：钻石会员"
                  />
                </FormField>
              </div>
              <div data-field="key">
                <FormField label="等级标识" required error={createErrors.key}>
                  <input
                    type="text"
                    value={createForm.key}
                    onChange={(e) => {
                      setCreateForm((prev) => ({ ...prev, key: e.target.value }));
                      setCreateErrors((prev) => {
                        const next = { ...prev };
                        delete next.key;
                        return next;
                      });
                    }}
                    disabled={isCreating}
                    style={inputStyle(!!createErrors.key)}
                    placeholder="例如：diamond_vip"
                  />
                </FormField>
              </div>
            </div>
            <div style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr' }}>
              <div data-field="minPoints">
                <FormField label="最低积分" error={createErrors.minPoints}>
                  <input
                    type="number"
                    min={0}
                    value={createForm.minPoints}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, minPoints: Number(e.target.value) }))}
                    disabled={isCreating}
                    style={inputStyle(!!createErrors.minPoints)}
                  />
                </FormField>
              </div>
              <div data-field="maxPoints">
                <FormField label="最高积分" error={createErrors.maxPoints}>
                  <input
                    type="number"
                    min={0}
                    value={createForm.maxPoints}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, maxPoints: Number(e.target.value) }))}
                    disabled={isCreating}
                    style={inputStyle(!!createErrors.maxPoints)}
                  />
                </FormField>
              </div>
            </div>
            <div style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr' }}>
              <div data-field="discountRate">
                <FormField label="折扣率 (%)" error={createErrors.discountRate}>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={createForm.discountRate}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, discountRate: Number(e.target.value) }))}
                    disabled={isCreating}
                    style={inputStyle(!!createErrors.discountRate)}
                  />
                </FormField>
              </div>
              <div data-field="annualFee">
                <FormField label="年费 (元)" error={createErrors.annualFee}>
                  <input
                    type="number"
                    min={0}
                    value={createForm.annualFee}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, annualFee: Number(e.target.value) }))}
                    disabled={isCreating}
                    style={inputStyle(!!createErrors.annualFee)}
                  />
                </FormField>
              </div>
            </div>
            <div>
              <FormField label="状态">
                <select
                  value={createForm.status}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, status: e.target.value as 'active' | 'inactive' | 'hidden' }))}
                  disabled={isCreating}
                  style={{ ...inputStyle(false), minHeight: 40 }}
                >
                  <option value="active">启用</option>
                  <option value="inactive">停用</option>
                  <option value="hidden">仅内部可见</option>
                </select>
              </FormField>
            </div>
            <div>
              <FormField label="权益列表" helper="多个权益用逗号分隔">
                <input
                  type="text"
                  value={createForm.benefits}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, benefits: e.target.value }))}
                  disabled={isCreating}
                  style={inputStyle(false)}
                  placeholder="例如：全场8折, 双倍积分, 生日礼包"
                />
              </FormField>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
            <button
              onClick={() => {
                setCreateDialogOpen(false);
                setCreateForm(DEFAULT_CREATE_FORM);
                setCreateErrors({});
              }}
              style={dialogBtnStyle('secondary')}
            >
              取消
            </button>
            <SubmitButton
              loading={isCreating}
              onClick={() => void handleCreateLevel()}
              variant="primary"
            >
              {isCreating ? '创建中...' : '确认创建'}
            </SubmitButton>
          </div>
        </Dialog>
      )}

      {/* ---- 删除确认弹窗 ---- */}
      {deleteDialogOpen && deleteTarget && (
        <Dialog
          open
          onClose={() => {
            setDeleteDialogOpen(false);
            setDeleteTarget(null);
          }}
          title="确认删除等级"
        >
          <p style={{ color: '#f87171', fontSize: 14, marginBottom: 8 }}>
            确定要删除等级「{deleteTarget.name}」吗？此操作不可撤销。
          </p>
          {deleteTarget.memberCount > 0 && (
            <p style={{ color: '#fbbf24', fontSize: 12 }}>
              注意：当前有 {deleteTarget.memberCount} 名会员属于该等级，建议先调整会员等级后再删除。
            </p>
          )}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
            <button
              onClick={() => {
                setDeleteDialogOpen(false);
                setDeleteTarget(null);
              }}
              style={dialogBtnStyle('secondary')}
            >
              取消
            </button>
            <SubmitButton
              onClick={() => void handleDeleteLevel()}
              loading={isCreating}
              variant="danger"
            >
              确认删除
            </SubmitButton>
          </div>
        </Dialog>
      )}
    </main>
  );
}

// ---- 样式 ----

function miniBtnStyle(variant: 'primary' | 'danger'): React.CSSProperties {
  return {
    padding: '3px 10px',
    fontSize: 12,
    borderRadius: 6,
    border: '1px solid transparent',
    cursor: 'pointer',
    background: variant === 'primary'
      ? 'rgba(59,130,246,0.12)'
      : 'rgba(239,68,68,0.12)',
    borderColor: variant === 'primary'
      ? 'rgba(96,165,250,0.25)'
      : 'rgba(239,68,68,0.2)',
    color: variant === 'primary' ? '#dbeafe' : '#fecaca',
  };
}

function dialogBtnStyle(variant: 'primary' | 'secondary'): React.CSSProperties {
  return {
    padding: '8px 20px',
    borderRadius: 8,
    fontSize: 14,
    cursor: 'pointer',
    border: '1px solid transparent',
    background: variant === 'primary'
      ? 'rgba(59,130,246,0.16)'
      : 'rgba(148,163,184,0.1)',
    borderColor: variant === 'primary'
      ? 'rgba(96,165,250,0.3)'
      : 'rgba(148,163,184,0.2)',
    color: variant === 'primary' ? '#dbeafe' : '#94a3b8',
  };
}

function inputStyle(hasError: boolean): React.CSSProperties {
  return {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 10,
    border: `1px solid ${hasError ? '#ef4444' : 'rgba(148, 163, 184, 0.2)'}`,
    background: 'rgba(15, 23, 42, 0.4)',
    color: '#f1f5f9',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  };
}
