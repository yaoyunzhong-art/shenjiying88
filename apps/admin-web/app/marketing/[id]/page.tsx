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
  SubmitButton,
  WorkspaceBreadcrumb,
  useFormSubmit,
  type DetailShellAction,
} from '@m5/ui';

import {
  campaignStatusLabel,
  campaignChannelLabel,
  formatCurrency,
  formatMemberCount,
  formatPercent,
  type MarketingCampaign,
} from '../../marketing-view-model';

import { useDetailActions } from '../../components/use-detail-actions';

// ---- 类型 ----

type CampaignStatus = MarketingCampaign['status'];
type CampaignChannel = MarketingCampaign['channel'];

const CHANNEL_OPTIONS: { value: CampaignChannel; label: string }[] = [
  { value: 'wechat', label: '微信' },
  { value: 'app_push', label: 'App推送' },
  { value: 'sms', label: '短信' },
  { value: 'douyin', label: '抖音' },
  { value: 'xiaohongshu', label: '小红书' },
];

const STATUS_VARIANT: Record<CampaignStatus, 'success' | 'neutral' | 'warning' | 'info'> = {
  running: 'success',
  ended: 'neutral',
  scheduled: 'info',
  draft: 'warning',
};

// ---- 状态流转图 ----
// draft ───→ scheduled ───→ running ───→ ended
const STATUS_TRANSITIONS: Partial<Record<CampaignStatus, CampaignStatus>> = {
  draft: 'scheduled',
  scheduled: 'running',
  running: 'ended',
};

function canTransition(status: CampaignStatus): CampaignStatus | null {
  return STATUS_TRANSITIONS[status] ?? null;
}

function getNextTransitionLabel(status: CampaignStatus): string {
  switch (status) {
    case 'draft': return '发布排期';
    case 'scheduled': return '开始执行';
    case 'running': return '结束活动';
    default: return '';
  }
}

// ---- Mock 活动详情数据 ----

function getMarketingCampaignById(id: string): MarketingCampaign | null {
  const lookup: Record<string, MarketingCampaign> = {
    c1: {
      id: 'c1',
      name: '年中促销活动',
      channel: 'wechat',
      status: 'running',
      targetSegment: '活跃会员',
      reachCount: 28000,
      conversionRate: 6.8,
      cost: 35000,
      roi: 4.2,
      startAt: '2026-06-01',
      endAt: '2026-06-20',
    },
    c2: {
      id: 'c2',
      name: '新注册福利券',
      channel: 'app_push',
      status: 'ended',
      targetSegment: '新用户',
      reachCount: 5200,
      conversionRate: 18.3,
      cost: 8000,
      roi: 3.5,
      startAt: '2026-05-15',
      endAt: '2026-05-31',
    },
    c3: {
      id: 'c3',
      name: '会员日双倍积分',
      channel: 'sms',
      status: 'scheduled',
      targetSegment: '全部会员',
      reachCount: 18420,
      conversionRate: 0,
      cost: 1200,
      roi: 0,
      startAt: '2026-07-05',
      endAt: undefined,
    },
    c4: {
      id: 'c4',
      name: '端午节抖音直播',
      channel: 'douyin',
      status: 'draft',
      targetSegment: '新用户',
      reachCount: 0,
      conversionRate: 0,
      cost: 50000,
      roi: 0,
      startAt: '2026-06-22',
      endAt: undefined,
    },
    c5: {
      id: 'c5',
      name: '小红书种草计划',
      channel: 'xiaohongshu',
      status: 'draft',
      targetSegment: '活跃会员',
      reachCount: 0,
      conversionRate: 0,
      cost: 15000,
      roi: 0,
      startAt: '2026-07-01',
      endAt: undefined,
    },
  };
  return lookup[id] ?? null;
}

interface EditFormData {
  name: string;
  targetSegment: string;
  channel: CampaignChannel;
}

interface EditFormErrors {
  name?: string;
  targetSegment?: string;
  channel?: string;
}

function validateCampaignForm(data: EditFormData): EditFormErrors {
  const errors: EditFormErrors = {};
  if (!data.name.trim()) errors.name = '活动名称不能为空';
  if (data.name.trim().length > 100) errors.name = '活动名称不能超过100个字符';
  if (!data.targetSegment.trim()) errors.targetSegment = '目标人群不能为空';
  if (!CHANNEL_OPTIONS.some((opt) => opt.value === data.channel)) {
    errors.channel = '请选择有效的渠道';
  }
  return errors;
}

async function submitCampaignEdit(form: EditFormData): Promise<{ success: boolean }> {
  void form;
  await new Promise((resolve) => setTimeout(resolve, 800));
  return { success: true };
}

async function submitStatusUpdate(
  campaign: MarketingCampaign,
  nextStatus: CampaignStatus
): Promise<{ success: boolean }> {
  void campaign;
  void nextStatus;
  await new Promise((resolve) => setTimeout(resolve, 600));
  return { success: true };
}

// ---- 页面组件 ----

export default function MarketingCampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [campaign, setCampaign] = useState<MarketingCampaign | null>(() =>
    getMarketingCampaignById(id)
  );
  const [editOpen, setEditOpen] = useState(false);
  const [formData, setFormData] = useState<EditFormData>({
    name: campaign?.name ?? '',
    targetSegment: campaign?.targetSegment ?? '',
    channel: campaign?.channel ?? 'wechat',
  });
  const [errors, setErrors] = useState<EditFormErrors>({});
  const [transitioning, setTransitioning] = useState(false);

  const {
    submit,
    state: submitState,
    reset: resetSubmit,
  } = useFormSubmit<{ success: boolean }>({
    async onSubmit() {
      const validationErrors = validateCampaignForm(formData);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        throw new Error(Object.values(validationErrors)[0]);
      }
      setErrors({});
      return submitCampaignEdit(formData);
    },
    successMessage: '活动信息已更新成功。',
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
      if (errors[field]) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[field];
          return next;
        });
      }
    },
    [errors]
  );

  const handleCancel = useCallback(() => {
    setEditOpen(false);
    setErrors({});
    resetSubmit();
    if (campaign) {
      setFormData({
        name: campaign.name,
        targetSegment: campaign.targetSegment,
        channel: campaign.channel,
      });
    }
  }, [campaign, resetSubmit]);

  const handleStatusTransition = useCallback(async () => {
    if (!campaign) return;
    const next = canTransition(campaign.status);
    if (!next) return;
    setTransitioning(true);
    try {
      await submitStatusUpdate(campaign, next);
      setCampaign((prev) => (prev ? { ...prev, status: next } : null));
    } finally {
      setTransitioning(false);
    }
  }, [campaign]);

  const handleRetry = useCallback(() => {
    const fresh = getMarketingCampaignById(id);
    setCampaign(fresh);
  }, [id]);

  // 页面未找到
  if (!campaign) {
    return (
      <div style={{ display: 'grid', gap: 16, padding: 32 }}>
        <WorkspaceBreadcrumb
          workspaceLabel="营销管理"
          workspaceHref="/marketing"
          detailLabel="未找到活动"
        />
        <section
          style={{
            borderRadius: 16,
            padding: 24,
            background: 'rgba(15, 23, 42, 0.35)',
            border: '1px solid rgba(148, 163, 184, 0.18)',
            textAlign: 'center',
          }}
        >
          <h2 style={{ color: '#f87171', marginBottom: 8 }}>活动未找到</h2>
          <p style={{ color: '#94a3b8', fontSize: 14 }}>
            未找到 ID 为 &ldquo;{id}&rdquo; 的营销活动。
          </p>
          <button
            onClick={handleRetry}
            style={{
              marginTop: 16,
              padding: '8px 20px',
              borderRadius: 8,
              border: 'none',
              background: '#2563eb',
              color: '#fff',
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            重新尝试
          </button>
        </section>
      </div>
    );
  }

  const nextStatus = canTransition(campaign.status);
  const statusInfo = campaignStatusLabel(campaign.status);
  const statusVariant = STATUS_VARIANT[campaign.status];

  const { actions: detailActions } = useDetailActions({
    workspace: 'marketing',
    detailId: campaign.id,
    record: campaign,
    shareTitle: `营销活动 · ${campaign.name}`,
    shareText: `查看活动 ${campaign.name} 详情`,
  });

  const actions: DetailShellAction[] = [
    ...(nextStatus
      ? [
          {
            key: 'status-transition',
            label: transitioning ? '更新中...' : getNextTransitionLabel(campaign.status),
            variant: 'primary' as const,
            loading: transitioning,
            disabled: transitioning || submitState.isSubmitting,
            onClick: handleStatusTransition,
          },
        ]
      : []),
    {
      key: 'edit',
      label: editOpen ? '保存中...' : '编辑',
      variant: 'secondary' as const,
      loading: submitState.isSubmitting,
      disabled: submitState.isSubmitting || transitioning,
      onClick: editOpen
        ? handleSave
        : () => setEditOpen(true),
    },
  ];

  if (editOpen) {
    actions.push({
      key: 'cancel',
      label: '取消',
      variant: 'secondary' as const,
      onClick: handleCancel,
    });
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <WorkspaceBreadcrumb
        workspaceLabel="营销管理"
        workspaceHref="/marketing"
        detailLabel={campaign.name}
      />
      <DetailShell
        title={campaign.name}
        subtitle={`活动 · ${campaign.id}`}
        breadcrumbs={[
          { label: '营销管理', href: '/marketing' },
          { label: campaign.name },
        ]}
        backLink={{ label: '返回营销列表', href: '/marketing' }}
        actions={actions}
      >
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
              编辑活动信息
            </h2>

            {submitState.isSubmitting || submitState.errorMessage || submitState.successMessage ? (
              <div style={{ marginBottom: 16 }}>
                <FormSubmitFeedback state={submitState} />
              </div>
            ) : null}

            <div style={{ display: 'grid', gap: 16 }}>
              <FormField label="活动名称" required error={errors.name}>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  disabled={submitState.isSubmitting}
                  style={inputStyle}
                  placeholder="输入活动名称"
                />
              </FormField>
              <FormField label="目标人群" required error={errors.targetSegment}>
                <input
                  type="text"
                  value={formData.targetSegment}
                  onChange={(e) => handleFieldChange('targetSegment', e.target.value)}
                  disabled={submitState.isSubmitting}
                  style={inputStyle}
                  placeholder="输入目标人群描述"
                />
              </FormField>
              <FormField label="渠道" required error={errors.channel}>
                <select
                  value={formData.channel}
                  onChange={(e) => handleFieldChange('channel', e.target.value)}
                  disabled={submitState.isSubmitting}
                  style={inputStyle}
                >
                  {CHANNEL_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </FormField>

              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 8 }}>
                <SubmitButton
                  loading={submitState.isSubmitting}
                  disabled={submitState.isSubmitting}
                  onClick={handleSave}
                  variant="primary"
                >
                  保存修改
                </SubmitButton>
                <SubmitButton
                  disabled={submitState.isSubmitting}
                  onClick={handleCancel}
                  variant="secondary"
                >
                  取消
                </SubmitButton>
              </div>
            </div>
          </section>
        ) : null}

        {/* 活动详情信息 */}
        <section
          style={{
            borderRadius: 16,
            padding: 24,
            background: 'rgba(15, 23, 42, 0.35)',
            border: '1px solid rgba(148, 163, 184, 0.18)',
            marginBottom: 24,
          }}
        >
          <h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700 }}>
            活动详情
          </h2>

          <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
            <InfoRow
              label="活动状态"
              value={
                <StatusBadge
                  label={statusInfo}
                  variant={statusVariant}
                  size="sm"
                  dot
                />
              }
            />
            <InfoRow
              label="渠道"
              value={campaignChannelLabel(campaign.channel)}
            />
            <InfoRow label="活动名称" value={campaign.name} />
            <InfoRow label="目标人群" value={campaign.targetSegment} />
            <InfoRow label="触达数" value={formatMemberCount(campaign.reachCount)} />
            <InfoRow
              label="转化率"
              value={formatPercent(campaign.conversionRate)}
            />
            <InfoRow label="成本" value={formatCurrency(campaign.cost)} />
            <InfoRow label="ROI" value={`${campaign.roi.toFixed(1)}x`} />
            <InfoRow label="开始日期" value={campaign.startAt} />
            <InfoRow
              label="结束日期"
              value={campaign.endAt ?? '未设置'}
            />
            <InfoRow label="活动 ID" value={campaign.id} />
          </div>

          {/* 状态流转提示 */}
          {nextStatus ? (
            <div
              style={{
                marginTop: 16,
                paddingTop: 16,
                borderTop: '1px solid rgba(148, 163, 184, 0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                fontSize: 14,
                color: '#94a3b8',
              }}
            >
              <span>下一步: </span>
              <StatusBadge
                label={getNextTransitionLabel(campaign.status)}
                variant="info"
                size="sm"
              />
              <span style={{ color: '#64748b' }}>
                {campaign.status === 'draft'
                  ? '发布排期后进入已排期状态'
                  : campaign.status === 'scheduled'
                    ? '开始执行后进入进行中状态'
                    : '点击结束活动，完成本次营销活动'}
              </span>
            </div>
          ) : null}

          <DetailActionBar
            actions={detailActions}
            heading="详情收口动作"
            caption="复制 / 导出 / 分享当前活动详情"
          />
        </section>
      </DetailShell>

      <DetailClosureBar
        links={[
          {
            key: 'marketing',
            title: '返回营销管理',
            subtitle: '回到营销管理总览',
            href: '/marketing',
          },
        ]}
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
