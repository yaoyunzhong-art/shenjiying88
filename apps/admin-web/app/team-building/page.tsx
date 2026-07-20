'use client';

/**
 * team-building/page.tsx — 团建活动管理列表页 (admin-web)
 *
 * 功能:
 *  - 活动列表（名称/日期/状态/参与人数/预算）
 *  - 新建活动弹窗（名称/日期/地点/预算/人数/描述/类型）
 *  - 统计卡片（总活动/进行中/已完成/总参与人次）
 *  - 状态筛选（全部/待报名/进行中/已完成/已取消）
 *  - 搜索（按活动名称）
 *  - 三态覆盖: loading / error / empty
 */

import { useEffect, useMemo, useState, useCallback } from 'react';

import {
  DataTable,
  StatusBadge,
  Badge,
  SearchFilterInput,
  StatCard,
  Button,
  Modal,
  useToast,
  type DataTableColumn,
} from '@m5/ui';

// ============================================================
// 类型定义
// ============================================================

type ActivityStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

type ActivityType = 'team_building' | 'dinner' | 'travel' | 'sports' | 'other';

interface TeamBuildingRecord {
  id: string;
  name: string;
  date: string;
  status: ActivityStatus;
  participantCount: number;
  budget: number;
  location: string;
  type: ActivityType;
  description: string;
  createdAt: string;
  actualParticipants?: number;
}

interface NewActivityForm {
  name: string;
  date: string;
  location: string;
  budget: string;
  participantCount: string;
  description: string;
  type: ActivityType;
}

// ============================================================
// 常量映射
// ============================================================

const ACTIVITY_STATUS_LABEL: Record<ActivityStatus, string> = {
  pending: '待报名',
  in_progress: '进行中',
  completed: '已完成',
  cancelled: '已取消',
};

const ACTIVITY_STATUS_VARIANT: Record<ActivityStatus, string> = {
  pending: 'warning',
  in_progress: 'processing',
  completed: 'success',
  cancelled: 'default',
};

const ACTIVITY_TYPES: { value: ActivityType; label: string }[] = [
  { value: 'team_building', label: '团队拓展' },
  { value: 'dinner', label: '聚餐' },
  { value: 'travel', label: '旅游' },
  { value: 'sports', label: '运动' },
  { value: 'other', label: '其他' },
];

const ACTIVITY_TYPE_LABEL: Record<ActivityType, string> = {
  team_building: '团队拓展',
  dinner: '聚餐',
  travel: '旅游',
  sports: '运动',
  other: '其他',
};

const STATUSES: ActivityStatus[] = ['pending', 'in_progress', 'completed', 'cancelled'];

// ============================================================
// 种子数据（10 条活动记录）
// ============================================================

const DEFAULT_ACTIVITIES: TeamBuildingRecord[] = [
  { id: 'tb-001', name: 'Q3季度团建拓展', date: '2026-08-15', status: 'pending', participantCount: 45, budget: 30000, location: '北京怀柔拓展基地', type: 'team_building', description: '年度Q3季度全员拓展训练，包含高空项目和团队协作', createdAt: '2026-07-10', actualParticipants: 0 },
  { id: 'tb-002', name: '研发中心聚餐', date: '2026-07-25', status: 'in_progress', participantCount: 30, budget: 5000, location: '望京海底捞', type: 'dinner', description: '研发部门季度聚餐', createdAt: '2026-07-15', actualParticipants: 0 },
  { id: 'tb-003', name: '销售团队张家界团建', date: '2026-09-10', status: 'pending', participantCount: 20, budget: 80000, location: '张家界国家森林公园', type: 'travel', description: '销售精英团队三天两夜团建旅游', createdAt: '2026-07-18', actualParticipants: 0 },
  { id: 'tb-004', name: '羽毛球友谊赛', date: '2026-07-20', status: 'completed', participantCount: 16, budget: 2000, location: '朝阳体育馆', type: 'sports', description: '跨部门羽毛球友谊赛', createdAt: '2026-07-05', actualParticipants: 14 },
  { id: 'tb-005', name: '新员工破冰活动', date: '2026-08-01', status: 'pending', participantCount: 25, budget: 5000, location: '公司多功能厅', type: 'team_building', description: 'Q3新入职员工破冰团建', createdAt: '2026-07-20', actualParticipants: 0 },
  { id: 'tb-006', name: '年中全员大团建', date: '2026-06-30', status: 'completed', participantCount: 120, budget: 150000, location: '北京古北水镇', type: 'travel', description: '年中华北区全员大型团建活动', createdAt: '2026-06-01', actualParticipants: 108 },
  { id: 'tb-007', name: '产品部桌游之夜', date: '2026-07-28', status: 'in_progress', participantCount: 12, budget: 1500, location: '望京SOHO桌游吧', type: 'other', description: '产品团队桌游团建', createdAt: '2026-07-19', actualParticipants: 0 },
  { id: 'tb-008', name: 'Q2季度团建', date: '2026-05-20', status: 'completed', participantCount: 80, budget: 60000, location: '奥森公园', type: 'sports', description: 'Q2季度户外运动团建', createdAt: '2026-04-15', actualParticipants: 72 },
  { id: 'tb-009', name: '十公里徒步挑战', date: '2026-08-08', status: 'pending', participantCount: 35, budget: 8000, location: '香山公园', type: 'sports', description: '健康徒步团建活动', createdAt: '2026-07-22', actualParticipants: 0 },
  { id: 'tb-010', name: '中秋节茶话会', date: '2026-09-17', status: 'pending', participantCount: 50, budget: 10000, location: '公司大会议室', type: 'dinner', description: '中秋佳节员工茶话会暨团建活动', createdAt: '2026-07-20', actualParticipants: 0 },
  { id: 'tb-011', name: '骑行团建活动', date: '2026-07-10', status: 'cancelled', participantCount: 20, budget: 3000, location: '延庆百里画廊', type: 'sports', description: '因天气原因取消的骑行团建', createdAt: '2026-06-25', actualParticipants: 0 },
];

// ============================================================
// 辅助函数
// ============================================================

function formatCurrency(n: number): string {
  if (n >= 10_000) return `¥${(n / 10_000).toFixed(1)}万`;
  if (n >= 1000) return `¥${(n / 1000).toFixed(1)}K`;
  return `¥${n}`;
}

function computeStats(activities: TeamBuildingRecord[]) {
  const total = activities.length;
  const inProgress = activities.filter((a) => a.status === 'in_progress').length;
  const completed = activities.filter((a) => a.status === 'completed').length;
  const totalParticipants = activities.reduce(
    (s, a) => s + Math.max(a.actualParticipants ?? 0, 0),
    0,
  );
  return { total, inProgress, completed, totalParticipants };
}

function filterActivities(
  items: TeamBuildingRecord[],
  search: string,
  statusFilter: ActivityStatus | 'all',
): TeamBuildingRecord[] {
  let result = items;

  if (search.trim()) {
    const lower = search.toLowerCase();
    result = result.filter((a) => a.name.toLowerCase().includes(lower));
  }

  if (statusFilter !== 'all') {
    result = result.filter((a) => a.status === statusFilter);
  }

  return result;
}

const emptyForm: NewActivityForm = {
  name: '',
  date: '',
  location: '',
  budget: '',
  participantCount: '',
  description: '',
  type: 'team_building',
};

const INPUT_STYLE: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  background: 'rgba(15,23,42,0.5)',
  border: '1px solid rgba(148,163,184,0.2)',
  borderRadius: 6,
  color: '#e2e8f0',
  fontSize: 13,
  outline: 'none',
  boxSizing: 'border-box',
};

const LABEL_STYLE: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  color: '#94a3b8',
  marginBottom: 4,
  fontWeight: 500,
};

// ============================================================
// 主页面组件
// ============================================================

export default function TeamBuildingPage() {
  const [activities, setActivities] = useState<TeamBuildingRecord[]>(DEFAULT_ACTIVITIES);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ActivityStatus | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<NewActivityForm>(emptyForm);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof NewActivityForm, string>>>({});
  const toast = useToast();

  // 模拟异步数据加载
  useEffect(() => {
    setLoading(true);
    setError(null);
    queueMicrotask(() => {
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(
    () => filterActivities(activities, searchTerm, statusFilter),
    [activities, searchTerm, statusFilter],
  );

  const stats = useMemo(() => computeStats(activities), [activities]);

  const columns: DataTableColumn<TeamBuildingRecord>[] = [
    {
      key: 'name',
      header: '活动名称',
      render: (item) => (
        <span style={{ fontWeight: 600, color: '#e2e8f0' }}>{item.name}</span>
      ),
    },
    {
      key: 'date',
      header: '活动日期',
      render: (item) => (
        <span style={{ color: '#94a3b8', fontFamily: 'monospace', fontSize: 12 }}>{item.date}</span>
      ),
    },
    {
      key: 'type',
      header: '类型',
      render: (item) => (
        <Badge variant="default">{ACTIVITY_TYPE_LABEL[item.type]}</Badge>
      ),
    },
    {
      key: 'status',
      header: '状态',
      render: (item) => (
        <StatusBadge
          label={ACTIVITY_STATUS_LABEL[item.status]}
          variant={ACTIVITY_STATUS_VARIANT[item.status] as any}
        />
      ),
    },
    {
      key: 'participantCount',
      header: '预计人数',
    },
    {
      key: 'budget',
      header: '预算',
      render: (item) => formatCurrency(item.budget),
    },
    {
      key: 'location',
      header: '地点',
      render: (item) => (
        <span style={{ color: '#cbd5e1', fontSize: 12 }}>{item.location}</span>
      ),
    },
  ];

  // 表单验证
  const validateForm = useCallback((): boolean => {
    const errors: Partial<Record<keyof NewActivityForm, string>> = {};
    if (!form.name.trim()) errors.name = '请输入活动名称';
    else if (form.name.length > 50) errors.name = '活动名称不超过50字';
    if (!form.date) errors.date = '请选择活动日期';
    if (!form.location.trim()) errors.location = '请输入活动地点';
    if (!form.budget || isNaN(Number(form.budget)) || Number(form.budget) <= 0) {
      errors.budget = '请输入有效的预算金额';
    }
    if (!form.participantCount || isNaN(Number(form.participantCount)) || Number(form.participantCount) <= 0) {
      errors.participantCount = '请输入有效的参与人数';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [form]);

  const handleSubmit = useCallback(() => {
    if (!validateForm()) return;

    const newActivity: TeamBuildingRecord = {
      id: `tb-${String(activities.length + 1).padStart(3, '0')}`,
      name: form.name.trim(),
      date: form.date,
      status: 'pending',
      participantCount: Number(form.participantCount),
      budget: Number(form.budget),
      location: form.location.trim(),
      type: form.type,
      description: form.description.trim(),
      createdAt: new Date().toISOString().slice(0, 10),
      actualParticipants: 0,
    };

    setActivities((prev) => [newActivity, ...prev]);
    setModalOpen(false);
    setForm(emptyForm);
    setFormErrors({});
    toast.success('团建活动已创建');
  }, [form, activities, validateForm, toast]);

  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
    setForm(emptyForm);
    setFormErrors({});
  }, []);

  const handleFormField = useCallback(
    (key: keyof NewActivityForm, value: string) => {
      setForm((prev) => ({ ...prev, [key]: value }));
      if (formErrors[key]) {
        setFormErrors((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      }
    },
    [formErrors],
  );

  const handleRetry = useCallback(() => {
    setLoading(true);
    setError(null);
    queueMicrotask(() => {
      setLoading(false);
    });
  }, []);

  // ===== 三态渲染 =====

  if (loading) {
    return (
      <div style={{ padding: 32, color: '#94a3b8', textAlign: 'center' }}>
        <div style={{ fontSize: 14, marginBottom: 12 }}>加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 32, color: '#ef4444', textAlign: 'center' }}>
        <div style={{ fontSize: 14, marginBottom: 12 }}>错误: {error}</div>
        <button
          onClick={handleRetry}
          style={{
            padding: '8px 20px',
            background: 'rgba(239,68,68,0.15)',
            color: '#f87171',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 13,
          }}
        >
          重试
        </button>
      </div>
    );
  }

  // ===== 主渲染 =====

  return (
    <div>
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f1f5f9', marginBottom: 6 }}>
            🎯 团建活动管理
          </h1>
          <p style={{ fontSize: 13, color: '#64748b' }}>
            管理公司团建活动，查看活动统计信息和详情
          </p>
        </div>
        <Button variant="primary" onClick={() => setModalOpen(true)}>
          + 新建活动
        </Button>
      </header>

      {/* 统计卡片 */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <StatCard label="总活动数" value={stats.total} />
        <StatCard label="进行中" value={stats.inProgress} variant="info" />
        <StatCard label="已完成" value={stats.completed} variant="success" />
        <StatCard label="总参与人次" value={stats.totalParticipants} />
      </div>

      {/* 筛选栏 */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          marginBottom: 16,
          alignItems: 'center',
        }}
      >
        <SearchFilterInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="搜索活动名称..."
        />
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as ActivityStatus | 'all');
          }}
          style={{
            padding: '6px 12px',
            borderRadius: 6,
            border: '1px solid rgba(148,163,184,0.2)',
            background: 'rgba(15,23,42,0.6)',
            color: '#e2e8f0',
            fontSize: 14,
          }}
          aria-label="状态筛选"
        >
          <option value="all">全部状态</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {ACTIVITY_STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </div>

      {/* 空态 / 数据表格 */}
      {filtered.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '64px 24px',
            color: '#a1a1aa',
            background: 'rgba(15,23,42,0.4)',
            borderRadius: 12,
            border: '1px solid rgba(148,163,184,0.1)',
          }}
        >
          <div
            style={{ fontSize: 40, marginBottom: 16 }}
          >
            🏕️
          </div>
          <div
            style={{
              fontSize: 16,
              fontWeight: 600,
              marginBottom: 8,
              color: '#e2e8f0',
            }}
          >
            {searchTerm ? '未找到匹配活动' : '暂无团建活动'}
          </div>
          <div style={{ fontSize: 14, color: '#94a3b8', marginBottom: 20 }}>
            {searchTerm
              ? `搜索 "${searchTerm}" 未找到相关记录`
              : '还没有创建任何团建活动，点击下方按钮开始创建'}
          </div>
          {!searchTerm && (
            <Button variant="primary" onClick={() => setModalOpen(true)}>
              创建第一个活动
            </Button>
          )}
        </div>
      ) : (
        <>
          <DataTable
            columns={columns}
            items={filtered}
            rowKey={(r) => r.id}
            striped
          />
          <div
            style={{
              marginTop: 16,
              textAlign: 'right',
              color: '#94a3b8',
              fontSize: 13,
            }}
          >
            共 {filtered.length} 条记录
          </div>
        </>
      )}

      {/* 新建活动弹窗 */}
      <Modal
        open={modalOpen}
        onClose={handleCloseModal}
        title="新建团建活动"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '8px 0' }}>
          {/* 活动名称 */}
          <div>
            <label style={LABEL_STYLE}>
              活动名称 <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              style={{
                ...INPUT_STYLE,
                borderColor: formErrors.name
                  ? 'rgba(239,68,68,0.5)'
                  : 'rgba(148,163,184,0.2)',
              }}
              value={form.name}
              onChange={(e) => handleFormField('name', e.target.value)}
              placeholder="请输入活动名称"
            />
            {formErrors.name && (
              <span style={{ fontSize: 12, color: '#ef4444', marginTop: 2 }}>
                {formErrors.name}
              </span>
            )}
          </div>

          {/* 活动日期 */}
          <div>
            <label style={LABEL_STYLE}>
              活动日期 <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="date"
              style={{
                ...INPUT_STYLE,
                borderColor: formErrors.date
                  ? 'rgba(239,68,68,0.5)'
                  : 'rgba(148,163,184,0.2)',
              }}
              value={form.date}
              onChange={(e) => handleFormField('date', e.target.value)}
            />
            {formErrors.date && (
              <span style={{ fontSize: 12, color: '#ef4444', marginTop: 2 }}>
                {formErrors.date}
              </span>
            )}
          </div>

          {/* 活动地点 */}
          <div>
            <label style={LABEL_STYLE}>
              活动地点 <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              style={{
                ...INPUT_STYLE,
                borderColor: formErrors.location
                  ? 'rgba(239,68,68,0.5)'
                  : 'rgba(148,163,184,0.2)',
              }}
              value={form.location}
              onChange={(e) => handleFormField('location', e.target.value)}
              placeholder="请输入活动地点"
            />
            {formErrors.location && (
              <span style={{ fontSize: 12, color: '#ef4444', marginTop: 2 }}>
                {formErrors.location}
              </span>
            )}
          </div>

          {/* 活动类型 */}
          <div>
            <label style={LABEL_STYLE}>活动类型</label>
            <select
              style={INPUT_STYLE}
              value={form.type}
              onChange={(e) => handleFormField('type', e.target.value as ActivityType)}
            >
              {ACTIVITY_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* 预算 */}
          <div>
            <label style={LABEL_STYLE}>
              预算（元） <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="number"
              min={0}
              style={{
                ...INPUT_STYLE,
                borderColor: formErrors.budget
                  ? 'rgba(239,68,68,0.5)'
                  : 'rgba(148,163,184,0.2)',
              }}
              value={form.budget}
              onChange={(e) => handleFormField('budget', e.target.value)}
              placeholder="请输入预算金额"
            />
            {formErrors.budget && (
              <span style={{ fontSize: 12, color: '#ef4444', marginTop: 2 }}>
                {formErrors.budget}
              </span>
            )}
          </div>

          {/* 预计参与人数 */}
          <div>
            <label style={LABEL_STYLE}>
              预计参与人数 <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="number"
              min={1}
              style={{
                ...INPUT_STYLE,
                borderColor: formErrors.participantCount
                  ? 'rgba(239,68,68,0.5)'
                  : 'rgba(148,163,184,0.2)',
              }}
              value={form.participantCount}
              onChange={(e) => handleFormField('participantCount', e.target.value)}
              placeholder="请输入预计参与人数"
            />
            {formErrors.participantCount && (
              <span style={{ fontSize: 12, color: '#ef4444', marginTop: 2 }}>
                {formErrors.participantCount}
              </span>
            )}
          </div>

          {/* 活动描述 */}
          <div>
            <label style={LABEL_STYLE}>活动描述</label>
            <textarea
              style={{
                ...INPUT_STYLE,
                minHeight: 72,
                resize: 'vertical',
                fontFamily: 'inherit',
              }}
              value={form.description}
              onChange={(e) => handleFormField('description', e.target.value)}
              placeholder="请输入活动描述（选填）"
            />
          </div>
        </div>

        {/* 弹窗底部操作 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 12,
            marginTop: 20,
            borderTop: '1px solid rgba(148,163,184,0.15)',
            paddingTop: 16,
          }}
        >
          <Button variant="secondary" onClick={handleCloseModal}>
            取消
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            确认创建
          </Button>
        </div>
      </Modal>
    </div>
  );
}

// ============================================================
// 导出（供测试使用）
// ============================================================

export type { TeamBuildingRecord, ActivityStatus, ActivityType, NewActivityForm };
export {
  ACTIVITY_STATUS_LABEL,
  ACTIVITY_STATUS_VARIANT,
  ACTIVITY_TYPE_LABEL,
  ACTIVITY_TYPES,
  STATUSES,
  DEFAULT_ACTIVITIES,
  computeStats,
  filterActivities,
  formatCurrency,
};
