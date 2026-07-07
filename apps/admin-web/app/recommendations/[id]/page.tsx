/**
 * 推荐策略详情页 — Recommendation Detail Page (Next.js App Router Page)
 * 角色视角: 👤营销运营 / 商品推荐
 * 功能: 查看推荐策略详情、编辑规则配置、状态流转、策略启停
 */
'use client';

import { useState, useCallback, use } from 'react';

import {
  DetailActionBar,
  DetailClosureBar,
  DetailShell,
  FormField,
  FormSubmitFeedback,
  InfoRow,
  StatusBadge,
  StatCard,
  CopyToClipboard,
  SubmitButton,
  WorkspaceBreadcrumb,
  useFormSubmit,
  Switch,
  type DetailShellAction,
} from '@m5/ui';
import { useDetailActions } from '../../components/use-detail-actions';
import { buildStandardBreadcrumb, buildStandardClosureLinks } from '../../components/detail-workspace-registry';

// ---- 类型 ----

type RecStrategyStatus = 'active' | 'paused' | 'draft' | 'archived';
type RecPriority = 'high' | 'medium' | 'low';
type RecStrategyType = 'item-cf' | 'user-cf' | 'popular' | 'recently-viewed' | 'personalized' | 'hybrid';

interface RecStrategyDetail {
  id: string;
  name: string;
  description: string;
  strategyType: RecStrategyType;
  status: RecStrategyStatus;
  priority: RecPriority;
  version: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  lastRunAt: string;
  totalRecommendations: number;
  conversionRate: number;
  avgCtr: number;
  avgRevenue: number;
  rules: { key: string; value: string; enabled: boolean }[];
  targetAudience: string[];
  channels: string[];
  coldStartEnabled: boolean;
  diversityWeight: number;
  cacheTtlMinutes: number;
}

type RecStatusVariant = 'success' | 'warning' | 'info' | 'default';

const REC_STATUS_MAP: Record<RecStrategyStatus, { label: string; variant: RecStatusVariant }> = {
  active: { label: '运行中', variant: 'success' },
  paused: { label: '已暂停', variant: 'warning' },
  draft: { label: '草稿', variant: 'info' },
  archived: { label: '已归档', variant: 'default' },
};

const REC_PRIORITY_MAP: Record<RecPriority, { label: string; color: string }> = {
  high: { label: '高优先级', color: '#ef4444' },
  medium: { label: '中优先级', color: '#f59e0b' },
  low: { label: '低优先级', color: '#64748b' },
};

const REC_TYPE_MAP: Record<RecStrategyType, string> = {
  'item-cf': '基于物品协同过滤',
  'user-cf': '基于用户协同过滤',
  'popular': '热门推荐',
  'recently-viewed': '最近浏览',
  'personalized': '个性化推荐',
  'hybrid': '混合策略',
};

const TRANSITION_ACTIONS: { from: RecStrategyStatus; to: RecStrategyStatus; label: string }[] = [
  { from: 'draft', to: 'active', label: '发布策略' },
  { from: 'active', to: 'paused', label: '暂停策略' },
  { from: 'paused', to: 'active', label: '恢复策略' },
  { from: 'active', to: 'archived', label: '归档策略' },
  { from: 'paused', to: 'archived', label: '归档策略' },
];

// ---- Mock 推荐策略详情数据 ----

const MOCK_REC_STRATEGIES: Record<string, RecStrategyDetail> = {
  'rec-001': {
    id: 'rec-001', name: '首页猜你喜欢', description: '基于用户历史行为与偏好的人群推荐策略',
    strategyType: 'hybrid', status: 'active', priority: 'high', version: 3,
    createdBy: '张建国', createdAt: '2025-01-15', updatedAt: '2026-06-20', lastRunAt: '2026-06-28T14:30:00Z',
    totalRecommendations: 2840000, conversionRate: 12.5, avgCtr: 38.2, avgRevenue: 186000,
    rules: [
      { key: 'max_items', value: '20', enabled: true },
      { key: 'diversity_threshold', value: '0.6', enabled: true },
      { key: 'cold_start_fallback', value: 'popular', enabled: true },
      { key: 'recency_weight', value: '0.3', enabled: false },
    ],
    targetAudience: ['所有活跃会员', '新注册用户'],
    channels: ['首页', '搜索结果页'],
    coldStartEnabled: true, diversityWeight: 0.6, cacheTtlMinutes: 30,
  },
  'rec-002': {
    id: 'rec-002', name: '商品详情页关联推荐', description: '基于 Item-CF 的商品关联推荐',
    strategyType: 'item-cf', status: 'active', priority: 'high', version: 5,
    createdBy: '李小红', createdAt: '2024-09-01', updatedAt: '2026-06-22', lastRunAt: '2026-06-28T14:25:00Z',
    totalRecommendations: 5600000, conversionRate: 8.3, avgCtr: 24.5, avgRevenue: 92000,
    rules: [
      { key: 'max_similar_items', value: '10', enabled: true },
      { key: 'min_similarity_score', value: '0.5', enabled: true },
      { key: 'category_restriction', value: 'same_category', enabled: true },
    ],
    targetAudience: ['所有访客'],
    channels: ['商品详情页'],
    coldStartEnabled: false, diversityWeight: 0.4, cacheTtlMinutes: 60,
  },
  'rec-003': {
    id: 'rec-003', name: '购物车凑单推荐', description: '提升客单价的凑单推荐策略',
    strategyType: 'popular', status: 'paused', priority: 'medium', version: 2,
    createdBy: '刘强', createdAt: '2025-03-10', updatedAt: '2026-05-15', lastRunAt: '2026-05-14T12:00:00Z',
    totalRecommendations: 1200000, conversionRate: 18.7, avgCtr: 42.1, avgRevenue: 45000,
    rules: [
      { key: 'min_cart_amount', value: '50', enabled: true },
      { key: 'price_range', value: '10-200', enabled: true },
      { key: 'exclude_purchased', value: 'true', enabled: true },
    ],
    targetAudience: ['购物车金额 > 50 元的用户'],
    channels: ['购物车页面', '结算页'],
    coldStartEnabled: true, diversityWeight: 0.3, cacheTtlMinutes: 10,
  },
  'rec-004': {
    id: 'rec-004', name: '新用户冷启动推荐', description: '针对新注册用户的冷启动推荐，使用热门兜底',
    strategyType: 'personalized', status: 'draft', priority: 'medium', version: 1,
    createdBy: '陈芳', createdAt: '2026-06-25', updatedAt: '2026-06-25', lastRunAt: '-',
    totalRecommendations: 0, conversionRate: 0, avgCtr: 0, avgRevenue: 0,
    rules: [
      { key: 'cold_start_strategy', value: 'popular_fallback', enabled: true },
      { key: 'max_cold_items', value: '30', enabled: true },
      { key: 'onboarding_days', value: '7', enabled: true },
    ],
    targetAudience: ['注册 < 7 天的新用户'],
    channels: ['首页', '个性化推荐位'],
    coldStartEnabled: true, diversityWeight: 0.7, cacheTtlMinutes: 5,
  },
  'rec-005': {
    id: 'rec-005', name: '季节性促销推荐', description: '春夏换季/节日活动促销推荐',
    strategyType: 'hybrid', status: 'archived', priority: 'low', version: 4,
    createdBy: '王伟', createdAt: '2024-12-01', updatedAt: '2026-03-01', lastRunAt: '2026-03-01T00:00:00Z',
    totalRecommendations: 890000, conversionRate: 15.2, avgCtr: 36.8, avgRevenue: 67000,
    rules: [
      { key: 'seasonal_tags', value: 'spring, summer, festival', enabled: true },
      { key: 'discount_threshold', value: '0.3', enabled: true },
      { key: 'max_promotional_items', value: '15', enabled: true },
    ],
    targetAudience: ['历史购买过季节品的会员', '优惠敏感用户'],
    channels: ['首页横幅', '促销专区', '个性化推荐位'],
    coldStartEnabled: false, diversityWeight: 0.5, cacheTtlMinutes: 120,
  },
};

function getRecStrategyById(id: string): RecStrategyDetail {
  return MOCK_REC_STRATEGIES[id] ?? MOCK_REC_STRATEGIES['rec-001']!;
}

// ---- 编辑表单 ----

interface EditFormData {
  name: string;
  description: string;
  diversityWeight: number;
  cacheTtlMinutes: number;
  targetAudience: string;
  channels: string;
}

interface EditFormErrors {
  name?: string;
  description?: string;
  diversityWeight?: string;
  cacheTtlMinutes?: string;
}

function validateForm(data: EditFormData): EditFormErrors {
  const errors: EditFormErrors = {};
  if (!data.name.trim()) errors.name = '策略名称不能为空';
  if (data.name.trim().length > 30) errors.name = '策略名称不能超过30个字符';
  if (!data.description.trim()) errors.description = '策略描述不能为空';
  if (data.diversityWeight < 0 || data.diversityWeight > 1) errors.diversityWeight = '多样性权重应在 0-1 之间';
  if (data.cacheTtlMinutes < 1 || data.cacheTtlMinutes > 1440) errors.cacheTtlMinutes = '缓存时间应在 1-1440 分钟之间';
  return errors;
}

async function submitRecEdit(_form: EditFormData): Promise<{ success: boolean }> {
  await new Promise((resolve) => setTimeout(resolve, 600));
  return { success: true };
}

async function submitStatusTransition(_id: string, _toStatus: RecStrategyStatus): Promise<{ success: boolean }> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return { success: true };
}

function formatNumber(n: number): string {
  if (n >= 1_0000_0000) return `${(n / 1_0000_0000).toFixed(2)}亿`;
  if (n >= 1_0000) return `${(n / 1_0000).toFixed(1)}万`;
  return String(n);
}

// ---- 页面组件 ----

export default function RecommendationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [strategy, setStrategy] = useState<RecStrategyDetail>(getRecStrategyById(id));
  const [editOpen, setEditOpen] = useState(false);
  const [transitionLoading, setTransitionLoading] = useState<string | null>(null);
  const [coldStartEnabled, setColdStartEnabled] = useState(strategy.coldStartEnabled);
  const [formData, setFormData] = useState<EditFormData>({
    name: strategy.name,
    description: strategy.description,
    diversityWeight: strategy.diversityWeight,
    cacheTtlMinutes: strategy.cacheTtlMinutes,
    targetAudience: strategy.targetAudience.join('; '),
    channels: strategy.channels.join('; '),
  });
  const [errors, setErrors] = useState<EditFormErrors>({});

  const { submit, state: submitState, reset: resetSubmit } = useFormSubmit<{ success: boolean }>({
    async onSubmit() {
      const validationErrors = validateForm(formData);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        throw new Error(Object.values(validationErrors)[0]);
      }
      setErrors({});
      return submitRecEdit(formData);
    },
    successMessage: '推荐策略信息已更新成功。',
  });

  const handleSave = useCallback(async () => {
    const result = await submit();
    if (result) {
      setEditOpen(false);
      resetSubmit();
    }
  }, [submit, resetSubmit]);

  const handleFieldChange = useCallback(
    (field: keyof EditFormData, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      if (errors[field as keyof EditFormErrors]) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[field as keyof EditFormErrors];
          return next;
        });
      }
    },
    [errors],
  );

  const handleCancel = useCallback(() => {
    setEditOpen(false);
    setErrors({});
    resetSubmit();
    setFormData({
      name: strategy.name,
      description: strategy.description,
      diversityWeight: strategy.diversityWeight,
      cacheTtlMinutes: strategy.cacheTtlMinutes,
      targetAudience: strategy.targetAudience.join('; '),
      channels: strategy.channels.join('; '),
    });
  }, [strategy, resetSubmit]);

  const handleTransition = useCallback(
    async (toStatus: RecStrategyStatus, label: string) => {
      setTransitionLoading(label);
      try {
        const result = await submitStatusTransition(id, toStatus);
        if (result.success) {
          setStrategy((prev) => ({ ...prev, status: toStatus }));
        }
      } finally {
        setTransitionLoading(null);
      }
    },
    [id],
  );

  const statusInfo = REC_STATUS_MAP[strategy.status];
  const priorityInfo = REC_PRIORITY_MAP[strategy.priority];

  const { actions: detailActions } = useDetailActions({
    workspace: 'recommendations',
    detailId: strategy.id,
    record: strategy,
    shareTitle: `推荐策略 · ${strategy.name}`,
    shareText: `查看推荐策略 ${strategy.name} 详情`,
  });

  const actions: DetailShellAction[] = [
    {
      key: 'edit',
      label: editOpen ? '保存中...' : '编辑',
      variant: 'primary',
      loading: submitState.isSubmitting,
      disabled: submitState.isSubmitting,
      onClick: editOpen ? handleSave : () => setEditOpen(true),
    },
  ];
  if (editOpen) {
    actions.push({
      key: 'cancel',
      label: '取消',
      variant: 'secondary',
      onClick: handleCancel,
    });
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <WorkspaceBreadcrumb
        {...buildStandardBreadcrumb({
          workspace: 'recommendations',
          detailLabel: strategy.name,
        })}
      />
      <DetailShell
        title={strategy.name}
        subtitle={`${REC_TYPE_MAP[strategy.strategyType]} · v${strategy.version}`}
        breadcrumbs={[
          { label: '推荐策略管理', href: '/recommendations' },
          { label: strategy.name },
        ]}
        backLink={{ label: '返回推荐策略列表', href: '/recommendations' }}
        actions={actions}
      >
        {/* 统计数据卡片 */}
        <div
          style={{
            display: 'grid',
            gap: 14,
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
            marginBottom: 24,
          }}
        >
          <StatCard
            label="运行状态"
            value={statusInfo.label}
            helper={strategy.lastRunAt !== '-' ? `上次运行: ${new Date(strategy.lastRunAt).toLocaleDateString('zh-CN')}` : '未运行'}
          />
          <StatCard
            label="转化率"
            value={`${strategy.conversionRate}%`}
            helper={strategy.conversionRate > 10 ? '优秀' : strategy.conversionRate > 5 ? '良好' : '需优化'}
          />
          <StatCard
            label="累计推荐"
            value={formatNumber(strategy.totalRecommendations)}
            helper={`点击率 ${strategy.avgCtr}%`}
          />
          <StatCard
            label="平均收入"
            value={`¥${formatNumber(strategy.avgRevenue)}`}
            helper={strategy.avgRevenue > 100000 ? '高收入策略' : '普通'}
          />
        </div>

        {/* 状态流转 */}
        {!editOpen && (
          <div
            style={{
              display: 'flex',
              gap: 10,
              flexWrap: 'wrap',
              marginBottom: 24,
            }}
          >
            {TRANSITION_ACTIONS.filter((a) => a.from === strategy.status).map((action) => (
              <SubmitButton
                key={action.to}
                loading={transitionLoading === action.label}
                disabled={transitionLoading !== null}
                onClick={() => handleTransition(action.to, action.label)}
                variant={
                  action.to === 'archived' ? 'secondary' :
                  action.to === 'paused' ? 'secondary' :
                  'primary'
                }
                style={{ fontSize: 13, padding: '6px 14px' }}
              >
                {action.label}
              </SubmitButton>
            ))}
          </div>
        )}

        {/* 编辑模式 */}
        {editOpen ? (
          <section
            style={{
              borderRadius: 16,
              padding: 24,
              background: 'rgba(15, 23, 42, 0.35)',
              border: '1px solid rgba(148, 163, 184, 0.18)',
              marginBottom: 24,
            }}
          >
            <h2 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700 }}>
              编辑推荐策略
            </h2>

            {submitState.isSubmitting || submitState.errorMessage || submitState.successMessage ? (
              <div style={{ marginBottom: 16 }}>
                <FormSubmitFeedback state={submitState} />
              </div>
            ) : null}

            <div style={{ display: 'grid', gap: 16 }}>
              <FormField label="策略名称" required error={errors.name}>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  disabled={submitState.isSubmitting}
                  style={inputStyle}
                  placeholder="输入策略名称"
                />
              </FormField>
              <FormField label="策略描述" required error={errors.description}>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleFieldChange('description', e.target.value)}
                  disabled={submitState.isSubmitting}
                  style={{ ...inputStyle, minHeight: 64, resize: 'vertical' }}
                  placeholder="输入策略描述"
                />
              </FormField>
              <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr 1fr' }}>
                <FormField label="多样性权重 (0-1)" error={errors.diversityWeight}>
                  <input
                    type="number"
                    min={0} max={1} step={0.1}
                    value={formData.diversityWeight}
                    onChange={(e) => handleFieldChange('diversityWeight', e.target.value)}
                    disabled={submitState.isSubmitting}
                    style={inputStyle}
                  />
                </FormField>
                <FormField label="缓存时间 (分钟)" error={errors.cacheTtlMinutes}>
                  <input
                    type="number"
                    min={1} max={1440}
                    value={formData.cacheTtlMinutes}
                    onChange={(e) => handleFieldChange('cacheTtlMinutes', e.target.value)}
                    disabled={submitState.isSubmitting}
                    style={inputStyle}
                  />
                </FormField>
              </div>
              <FormField label="目标人群" helper="多个用 ; 分隔">
                <input
                  type="text"
                  value={formData.targetAudience}
                  onChange={(e) => handleFieldChange('targetAudience', e.target.value)}
                  disabled={submitState.isSubmitting}
                  style={inputStyle}
                  placeholder="所有活跃会员; 新注册用户"
                />
              </FormField>
              <FormField label="展示渠道" helper="多个用 ; 分隔">
                <input
                  type="text"
                  value={formData.channels}
                  onChange={(e) => handleFieldChange('channels', e.target.value)}
                  disabled={submitState.isSubmitting}
                  style={inputStyle}
                  placeholder="首页; 搜索结果页"
                />
              </FormField>

              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 8 }}>
                <SubmitButton loading={submitState.isSubmitting} disabled={submitState.isSubmitting} onClick={handleSave} variant="primary">
                  保存修改
                </SubmitButton>
                <SubmitButton disabled={submitState.isSubmitting} onClick={handleCancel} variant="secondary">
                  取消
                </SubmitButton>
              </div>
            </div>
          </section>
        ) : null}

        {/* 详情信息卡片 */}
        <div
          style={{
            borderRadius: 16,
            padding: 24,
            background: 'rgba(15, 23, 42, 0.35)',
            border: '1px solid rgba(148, 163, 184, 0.18)',
            marginBottom: 24,
          }}
        >
          <h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700 }}>
            策略配置信息
          </h2>
          <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
            <InfoRow label="策略ID" value={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>{strategy.id}<CopyToClipboard text={strategy.id} size="sm" iconOnly /></span>} />
            <InfoRow label="策略版本" value={`v${strategy.version}`} />
            <InfoRow label="运行状态" value={<StatusBadge label={statusInfo.label} variant={statusInfo.variant} size="sm" dot />} />
            <InfoRow label="优先级" value={<span style={{ color: priorityInfo.color, fontWeight: 600, fontSize: 14 }}>{priorityInfo.label}</span>} />
            <InfoRow label="推荐类型" value={REC_TYPE_MAP[strategy.strategyType]} />
            <InfoRow label="冷启动" value={coldStartEnabled ? '✅ 启用' : '❌ 关闭'} />
            <InfoRow label="多样性权重" value={strategy.diversityWeight.toFixed(1)} />
            <InfoRow label="缓存 TTL" value={`${strategy.cacheTtlMinutes} 分钟`} />
            <InfoRow label="创建人" value={strategy.createdBy} />
            <InfoRow label="创建时间" value={strategy.createdAt} />
            <InfoRow label="更新时间" value={strategy.updatedAt} />
            <InfoRow label="目标人群" value={strategy.targetAudience.join('、')} />
            <InfoRow label="展示渠道" value={strategy.channels.join('、')} />
          </div>

          {/* 规则列表 */}
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(148, 163, 184, 0.1)' }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 12px', color: '#e2e8f0' }}>
              策略规则 ({strategy.rules.length})
            </h3>
            <div style={{ display: 'grid', gap: 8 }}>
              {strategy.rules.map((rule) => (
                <div
                  key={rule.key}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '8px 12px',
                    background: 'rgba(15, 23, 42, 0.2)',
                    borderRadius: 8,
                    border: '1px solid rgba(148, 163, 184, 0.08)',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 13, color: '#94a3b8', fontFamily: 'monospace' }}>{rule.key}</span>
                    <span style={{ fontSize: 13, color: '#f1f5f9', marginLeft: 12 }}>= {rule.value}</span>
                  </div>
                  <Switch
                    checked={rule.enabled}
                    onChange={() => {}}
                    size="sm"
                    label={rule.enabled ? '启用' : '禁用'}
                  />
                </div>
              ))}
            </div>
          </div>

          <DetailActionBar
            actions={detailActions}
            heading="详情收口动作"
            caption="复制 / 导出 / 分享当前推荐策略详情"
          />
        </div>
      </DetailShell>
      <DetailClosureBar
        links={buildStandardClosureLinks({
          workspace: 'recommendations',
          detailId: strategy.id,
        })}
      />
    </div>
  );
}

// ---- 样式 ----

const inputStyle: React.CSSProperties = {
  width: '100%',
  borderRadius: 10,
  padding: '10px 14px',
  border: '1px solid rgba(148, 163, 184, 0.2)',
  background: 'rgba(15, 23, 42, 0.4)',
  color: '#f1f5f9',
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
};
