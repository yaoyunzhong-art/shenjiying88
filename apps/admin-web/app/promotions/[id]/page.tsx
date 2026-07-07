'use client';

import { useState, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';

import {
  DetailActionBar,
  DetailShell,
  ConfirmDialog,
  StatusBadge,
  InfoRow,
  FormField,
  SubmitButton,
  PageShell,
  FormSubmitFeedback,
  useAlert,
  type DetailShellAction,
  type DetailActionBarAction,
} from '@m5/ui';

import { getPromotions } from '../promotions-data';
import type { PromotionItem, PromotionStatus, PromotionType } from '../promotion-types';
import { useDetailActions } from '../../components/use-detail-actions';

// ─── 状态展示 ──────────────────────────────────────────

const STATUS_LABELS: Record<PromotionStatus, string> = {
  draft: '草稿',
  scheduled: '待开始',
  active: '进行中',
  paused: '已暂停',
  expired: '已过期',
  cancelled: '已取消',
};

const STATUS_VARIANTS: Record<PromotionStatus, 'success' | 'warning' | 'danger' | 'default'> = {
  draft: 'default',
  scheduled: 'warning',
  active: 'success',
  paused: 'warning',
  expired: 'danger',
  cancelled: 'danger',
};

const TYPE_LABELS: Record<PromotionType, string> = {
  discount: '折扣',
  coupon: '优惠券',
  cashback: '返现',
  gift: '赠品',
  bundle: '套餐',
  clearance: '清仓',
};

// ─── 状态流转 ──────────────────────────────────────────

const VALID_TRANSITIONS: Record<PromotionStatus, PromotionStatus[]> = {
  draft: ['scheduled', 'cancelled'],
  scheduled: ['active', 'draft', 'cancelled'],
  active: ['paused', 'expired', 'cancelled'],
  paused: ['active', 'cancelled'],
  expired: ['draft'],
  cancelled: ['draft'],
};

const TRANSITION_LABELS: Record<PromotionStatus, string> = {
  draft: '转为草稿',
  scheduled: '排期',
  active: '启动',
  paused: '暂停',
  expired: '标记过期',
  cancelled: '取消',
};

// ─── 工具函数 ──────────────────────────────────────────

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatMoney(n: number): string {
  return `¥${n.toLocaleString('zh-CN')}`;
}

function usagePercent(used: number, total: number): string {
  if (total <= 0) return '0%';
  return `${Math.round((used / total) * 100)}%`;
}

// ─── 查找活动 ──────────────────────────────────────────

function getPromotionById(id: string): PromotionItem | undefined {
  return getPromotions().find((p) => p.id === id);
}

// ─── 编辑表单 ──────────────────────────────────────────

interface EditFormData {
  name: string;
  description: string;
  discountPercent: string;
  budget: string;
  startAt: string;
  endAt: string;
}

interface EditFormErrors {
  name?: string;
  description?: string;
  discountPercent?: string;
  budget?: string;
  startAt?: string;
  endAt?: string;
}

function validateForm(data: EditFormData, promotionType: PromotionType): EditFormErrors {
  const errors: EditFormErrors = {};
  if (!data.name.trim()) errors.name = '活动名称不能为空';
  if (!data.description.trim()) errors.description = '活动描述不能为空';
  if (promotionType === 'discount' || promotionType === 'clearance') {
    const val = Number(data.discountPercent);
    if (isNaN(val) || val < 1 || val > 99) errors.discountPercent = '请输入 1-99 的折扣比例';
  }
  if (!data.budget.trim() || isNaN(Number(data.budget)) || Number(data.budget) <= 0) {
    errors.budget = '请输入有效的预算金额';
  }
  if (!data.startAt.trim()) errors.startAt = '开始时间不能为空';
  if (!data.endAt.trim()) errors.endAt = '结束时间不能为空';
  if (data.startAt && data.endAt && new Date(data.startAt) >= new Date(data.endAt)) {
    errors.endAt = '结束时间必须晚于开始时间';
  }
  return errors;
}

// ─── 主组件 ────────────────────────────────────────────

export default function PromotionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const alert = useAlert();

  const promotion = getPromotionById(id);

  // ─── 编辑状态 ────────────────────────────────────────
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<EditFormData | null>(null);
  const [formErrors, setFormErrors] = useState<EditFormErrors>({});
  const [submitState, setSubmitState] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // ─── 状态流转 ────────────────────────────────────────
  const handleTransition = useCallback(
    (targetStatus: PromotionStatus) => {
      if (!promotion) return;
      setConfirmAction({
        title: `确认${TRANSITION_LABELS[targetStatus]}`,
        message: `确定要将活动「${promotion.name}」${TRANSITION_LABELS[targetStatus]}吗？`,
        onConfirm: () => {
          alert.success('操作成功', `活动已${TRANSITION_LABELS[targetStatus]}`);
          setConfirmAction(null);
        },
      });
    },
    [promotion, alert],
  );

  // ─── 删除 ───────────────────────────────────────────
  const handleDelete = useCallback(() => {
    if (!promotion) return;
    setConfirmAction({
      title: '确认删除',
      message: `确定要删除活动「${promotion.name}」吗？此操作不可撤销。`,
      onConfirm: () => {
        alert.success('删除成功', '活动已删除');
        setConfirmAction(null);
        router.push('/promotions');
      },
    });
  }, [promotion, alert, router]);

  // ─── 编辑 ───────────────────────────────────────────
  const startEditing = useCallback(() => {
    if (!promotion) return;
    setFormData({
      name: promotion.name,
      description: promotion.description,
      discountPercent: promotion.discountPercent ? String(promotion.discountPercent) : '',
      budget: String(promotion.budget),
      startAt: promotion.startAt.slice(0, 16),
      endAt: promotion.endAt.slice(0, 16),
    });
    setFormErrors({});
    setIsEditing(true);
  }, [promotion]);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setFormData(null);
    setFormErrors({});
  }, []);

  const handleFieldChange = useCallback((field: keyof EditFormData, value: string) => {
    setFormData((prev) => (prev ? { ...prev, [field]: value } : prev));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!formData || !promotion) return;
    const errors = validateForm(formData, promotion.type);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setSubmitState('submitting');
    // simulate API call
    await new Promise((r) => setTimeout(r, 800));
    setSubmitState('success');
    alert.success('保存成功', '活动信息已更新');
    setIsEditing(false);
    setFormData(null);
    setFormErrors({});
    setTimeout(() => setSubmitState('idle'), 2000);
  }, [formData, promotion, alert]);

  // ─── Shell actions ─────────────────────────────────
  const shellActions: DetailShellAction[] = useMemo(() => {
    if (!promotion) return [];
    return [
      { key: 'edit', label: '编辑', variant: 'primary', onClick: startEditing, disabled: isEditing },
      ...(VALID_TRANSITIONS[promotion.status] ?? []).map((target) => ({
        key: `transition-${target}`,
        label: TRANSITION_LABELS[target],
        variant: 'secondary' as const,
        onClick: () => handleTransition(target),
      })),
      { key: 'delete', label: '删除', variant: 'danger' as const, onClick: handleDelete, disabled: promotion.status === 'active' },
    ];
  }, [promotion, isEditing, startEditing, handleTransition, handleDelete]);

  // ─── Bar actions (same items, all onClick defined) ──
  const barActions: DetailActionBarAction[] = useMemo(() => {
    if (!promotion) return [];
    return [
      { key: 'edit', label: '编辑', variant: 'primary', onClick: startEditing, disabled: isEditing },
      ...(VALID_TRANSITIONS[promotion.status] ?? []).map((target) => ({
        key: `transition-${target}`,
        label: TRANSITION_LABELS[target],
        variant: 'primary' as const,
        onClick: () => handleTransition(target),
      })),
      { key: 'delete', label: '删除', variant: 'danger' as const, onClick: handleDelete, disabled: promotion.status === 'active' },
    ];
  }, [promotion, isEditing, startEditing, handleTransition, handleDelete]);

  // nothing yet

  // ─── 未找到 ──────────────────────────────────────────
  if (!promotion) {
    return (
      <PageShell title="活动未找到">
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <p className="text-lg">未找到该促销活动</p>
          <a href="/promotions" className="mt-4 text-blue-600 hover:underline">
            返回促销管理
          </a>
        </div>
      </PageShell>
    );
  }

  const detailActions = useDetailActions({
    workspace: 'promotions',
    detailId: id,
    record: promotion,
    shareTitle: `促销活动 - ${promotion.name}`,
    shareText: promotion.description,
    enableExports: true,
  });

  // ─── 渲染 ────────────────────────────────────────────
  return (
    <PageShell title={promotion.name}>
      {/* 操作栏 */}
      <DetailActionBar actions={barActions} />

      {/* 主体 */}
      <DetailShell
        title={`促销活动: ${promotion.name}`}
        subtitle={`${TYPE_LABELS[promotion.type]} · ${STATUS_LABELS[promotion.status]}`}
        backLink={{ label: '返回促销管理', href: '/promotions' }}
        actions={shellActions}
      >
        {/* 概览区 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <InfoRow label="活动状态" value={<StatusBadge label={STATUS_LABELS[promotion.status]} variant={STATUS_VARIANTS[promotion.status]} />} />
          <InfoRow label="活动类型" value={TYPE_LABELS[promotion.type]} />
          <InfoRow label="所属门店" value={promotion.storeName} />
          <InfoRow label="预算使用" value={<>{formatMoney(promotion.usedBudget)} / {formatMoney(promotion.budget)} <span className="text-gray-500">({usagePercent(promotion.usedBudget, promotion.budget)})</span></>} />
        </div>

        {/* 编辑模式 */}
        {isEditing && formData ? (
          <div className="space-y-4 border rounded-lg p-6 bg-gray-50">
            <h3 className="text-lg font-medium">编辑活动信息</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="活动名称" error={formErrors.name} required>
                <input
                  className="border rounded px-3 py-2 w-full"
                  value={formData.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                />
              </FormField>
              {(promotion.type === 'discount' || promotion.type === 'clearance') && (
                <FormField label="折扣比例 (%)" error={formErrors.discountPercent} required>
                  <input
                    className="border rounded px-3 py-2 w-full"
                    type="number"
                    min={1}
                    max={99}
                    value={formData.discountPercent}
                    onChange={(e) => handleFieldChange('discountPercent', e.target.value)}
                  />
                </FormField>
              )}
              <FormField label="预算 (元)" error={formErrors.budget} required>
                <input
                  className="border rounded px-3 py-2 w-full"
                  type="number"
                  min={0}
                  value={formData.budget}
                  onChange={(e) => handleFieldChange('budget', e.target.value)}
                />
              </FormField>
              <FormField label="开始时间" error={formErrors.startAt} required>
                <input
                  className="border rounded px-3 py-2 w-full"
                  type="datetime-local"
                  value={formData.startAt}
                  onChange={(e) => handleFieldChange('startAt', e.target.value)}
                />
              </FormField>
              <FormField label="结束时间" error={formErrors.endAt} required>
                <input
                  className="border rounded px-3 py-2 w-full"
                  type="datetime-local"
                  value={formData.endAt}
                  onChange={(e) => handleFieldChange('endAt', e.target.value)}
                />
              </FormField>
            </div>
            <FormField label="活动描述" error={formErrors.description} required>
              <textarea
                className="border rounded px-3 py-2 w-full"
                rows={3}
                value={formData.description}
                onChange={(e) => handleFieldChange('description', e.target.value)}
              />
            </FormField>
            <div className="flex gap-3 pt-2">
              <SubmitButton
                label="保存修改"
                loading={submitState === 'submitting'}
                disabled={submitState === 'submitting'}
                onClick={handleSubmit}
              />
              <button
                className="px-4 py-2 border rounded hover:bg-gray-100"
                onClick={handleCancelEdit}
              >
                取消
              </button>
            </div>
            {submitState === 'error' && (
              <FormSubmitFeedback error="提交失败，请重试" />
            )}
          </div>
        ) : (
          /* 查看模式 */
          <div className="space-y-6">
            {/* 基本信息 */}
            <section>
              <h3 className="text-base font-semibold mb-3">基本信息</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoRow label="活动 ID" value={promotion.id} />
                <InfoRow label="活动名称" value={promotion.name} />
                <InfoRow label="创建人" value={promotion.createdBy} />
                <InfoRow label="创建时间" value={formatDateTime(promotion.createdAt)} />
                <InfoRow label="最后更新" value={formatDateTime(promotion.updatedAt)} />
              </div>
            </section>

            {/* 时间区间 */}
            <section>
              <h3 className="text-base font-semibold mb-3">活动时间</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoRow label="开始时间" value={formatDateTime(promotion.startAt)} />
                <InfoRow label="结束时间" value={formatDateTime(promotion.endAt)} />
              </div>
            </section>

            {/* 预算 */}
            <section>
              <h3 className="text-base font-semibold mb-3">预算</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoRow label="总预算" value={formatMoney(promotion.budget)} />
                <InfoRow label="已使用" value={formatMoney(promotion.usedBudget)} />
                <InfoRow label="使用率" value={usagePercent(promotion.usedBudget, promotion.budget)} />
              </div>
            </section>

            {/* 描述 */}
            <section>
              <h3 className="text-base font-semibold mb-3">活动描述</h3>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {promotion.description}
              </p>
            </section>
          </div>
        )}
      </DetailShell>

      {/* 确认对话框 */}
      {confirmAction && (
        <ConfirmDialog
          open
          title={confirmAction.title}
          message={confirmAction.message}
          onConfirm={confirmAction.onConfirm}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </PageShell>
  );
}
