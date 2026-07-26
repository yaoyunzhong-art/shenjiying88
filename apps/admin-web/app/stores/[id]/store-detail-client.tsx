'use client';

import { useCallback, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import {
  CopyToClipboard,
  DetailActionBar,
  DetailClosureBar,
  DetailShell,
  FormField,
  FormSubmitFeedback,
  InfoRow,
  StatCard,
  StatusBadge,
  SubmitButton,
  WorkspaceBreadcrumb,
  useFormSubmit,
  type DetailShellAction,
} from '@m5/ui';

import {
  accessMeta,
  buildCapabilityEntrypoints,
  readinessMeta,
} from '../../lyt-capability-access';
import { useDetailActions } from '../../components/use-detail-actions';
import {
  buildStandardBreadcrumb,
  buildStandardClosureLinks,
} from '../../components/detail-workspace-registry';
import type {
  StoreDetailPageSnapshot,
  StoreDetailView,
} from './store-detail-data';

type StoreStatusVariant = 'success' | 'neutral' | 'warning' | 'danger';

const STORE_STATUS_MAP: Record<
  StoreDetailView['status'],
  { label: string; variant: StoreStatusVariant }
> = {
  active: { label: '运营中', variant: 'success' },
  inactive: { label: '已停用', variant: 'neutral' },
  pending: { label: '待激活', variant: 'warning' },
  suspended: { label: '已暂停', variant: 'danger' },
};

const RISK_LEVEL_MAP: Record<
  StoreDetailView['riskLevel'],
  { label: string; variant: StoreStatusVariant }
> = {
  low: { label: '低风险', variant: 'success' },
  medium: { label: '中风险', variant: 'warning' },
  high: { label: '高风险', variant: 'danger' },
};

interface EditFormData {
  name: string;
  address: string;
  contactPhone: string;
  contactEmail: string;
  description: string;
}

interface EditFormErrors {
  name?: string;
  address?: string;
  contactPhone?: string;
  contactEmail?: string;
}

function validateForm(data: EditFormData): EditFormErrors {
  const errors: EditFormErrors = {};
  if (!data.name.trim()) errors.name = '门店名称不能为空';
  if (!data.address.trim()) errors.address = '门店地址不能为空';
  if (!data.contactPhone.trim()) errors.contactPhone = '联系电话不能为空';
  if (data.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.contactEmail)) {
    errors.contactEmail = '邮箱格式不正确';
  }
  return errors;
}

async function submitStoreEdit(form: EditFormData): Promise<{ success: boolean }> {
  void form;
  await new Promise((resolve) => setTimeout(resolve, 800));
  return { success: true };
}

function buildInitialFormData(store: StoreDetailView | null): EditFormData {
  return {
    name: store?.name ?? '',
    address: store?.address ?? '',
    contactPhone: store?.contactPhone ?? '',
    contactEmail: store?.contactEmail ?? '',
    description: store?.description ?? '',
  };
}

export default function StoreDetailClient({
  snapshot,
}: {
  snapshot: StoreDetailPageSnapshot;
}) {
  const router = useRouter();
  const [isRefreshing, startRefresh] = useTransition();
  const [editOpen, setEditOpen] = useState(false);
  const [errors, setErrors] = useState<EditFormErrors>({});
  const [formData, setFormData] = useState<EditFormData>(() =>
    buildInitialFormData(snapshot.store),
  );

  const store = snapshot.store;
  const capabilityAccess = snapshot.capabilitySnapshot.capabilityAccess;
  const entrypoints = useMemo(
    () =>
      store
        ? buildCapabilityEntrypoints(store.id, capabilityAccess)
        : [],
    [capabilityAccess, store],
  );
  const visibleEntrypoints = entrypoints.filter((item) => item.visibility === 'visible');
  const recommendedEntrypoint = visibleEntrypoints.find((item) => item.isNavigable);
  const hiddenEntrypointCount = entrypoints.length - visibleEntrypoints.length;
  const blockedEntrypointCount = entrypoints.filter((item) => item.access === 'blocked').length;
  const degradedEntrypointCount = entrypoints.filter((item) => item.access === 'degraded').length;

  const {
    submit,
    state: submitState,
    reset: resetSubmit,
  } = useFormSubmit<{ success: boolean }>({
    async onSubmit() {
      const validationErrors = validateForm(formData);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        throw new Error(Object.values(validationErrors)[0]);
      }
      setErrors({});
      return submitStoreEdit(formData);
    },
    successMessage: '门店信息已更新成功。',
  });

  const handleRefresh = useCallback(() => {
    startRefresh(() => router.refresh());
  }, [router, startRefresh]);

  const handleSave = useCallback(async () => {
    const result = await submit();
    if (result) {
      setEditOpen(false);
      resetSubmit();
      startRefresh(() => router.refresh());
    }
  }, [resetSubmit, router, startRefresh, submit]);

  const handleFieldChange = useCallback(
    (field: keyof EditFormData, value: string) => {
      setFormData((previous) => ({ ...previous, [field]: value }));
      if (errors[field]) {
        setErrors((previous) => {
          const next = { ...previous };
          delete next[field];
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
    setFormData(buildInitialFormData(store));
  }, [resetSubmit, store]);

  const { actions: detailActions } = useDetailActions({
    workspace: 'stores',
    detailId: store?.id ?? snapshot.storeId,
    record: store ?? { id: snapshot.storeId, missing: true },
    shareTitle: store ? `门店 · ${store.name}` : `门店 · ${snapshot.storeId}`,
    shareText: store
      ? `查看门店 ${store.code} (${store.name}) 详情`
      : `查看门店 ${snapshot.storeId} 的 fallback 详情占位`,
  });

  const actions: DetailShellAction[] = [
    ...(recommendedEntrypoint
      ? [
          {
            key: 'recommended-entry',
            label:
              recommendedEntrypoint.access === 'degraded'
                ? `${recommendedEntrypoint.label}·降级`
                : recommendedEntrypoint.label,
            variant: 'secondary' as const,
            href: recommendedEntrypoint.href,
          },
        ]
      : []),
    {
      key: 'refresh',
      label: isRefreshing ? '刷新中...' : '刷新快照',
      variant: 'secondary',
      disabled: isRefreshing,
      onClick: handleRefresh,
    },
    {
      key: 'capability-access',
      label: '能力访问',
      variant: 'secondary',
      href: `/stores/${snapshot.storeId}/capability-access`,
    },
    ...(store
      ? [
          {
            key: 'edit',
            label: editOpen ? '保存中...' : '编辑',
            variant: 'primary' as const,
            loading: submitState.isSubmitting,
            disabled: submitState.isSubmitting,
            onClick: editOpen ? handleSave : () => setEditOpen(true),
          },
        ]
      : []),
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
          workspace: 'stores',
          detailLabel: store?.name ?? snapshot.storeId,
        })}
      />
      <DetailShell
        title={store?.name ?? `门店 ${snapshot.storeId}`}
        subtitle={store ? `${store.code} · ${store.marketCode}` : `fallback detail · ${snapshot.storeId}`}
        breadcrumbs={[
          { label: '门店管理', href: '/stores' },
          { label: store?.name ?? snapshot.storeId },
        ]}
        backLink={{ label: '返回门店列表', href: '/stores' }}
        actions={actions}
      >
        {snapshot.error ? (
          <div
            style={{
              marginBottom: 24,
              borderRadius: 12,
              padding: '12px 14px',
              border: '1px solid rgba(245, 158, 11, 0.28)',
              background: 'rgba(120, 53, 15, 0.22)',
              color: '#fcd34d',
              fontSize: 13,
            }}
          >
            {snapshot.error}
          </div>
        ) : null}

        {store ? (
          <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', marginBottom: 24 }}>
            <StatCard label="运营状态" value={STORE_STATUS_MAP[store.status].label} helper={store.lastDeployed} />
            <StatCard label="风险等级" value={RISK_LEVEL_MAP[store.riskLevel].label} helper={store.marketCode} />
            <StatCard label="关联租户" value={String(store.tenantCount)} helper={`${store.brandCount} 个品牌`} />
            <StatCard label="面积" value={`${store.floorArea.toLocaleString()} m²`} helper={`建档: ${store.openedAt}`} />
          </div>
        ) : null}

        <section
          style={{
            borderRadius: 16,
            padding: 24,
            background: 'rgba(15, 23, 42, 0.35)',
            border: '1px solid rgba(148, 163, 184, 0.18)',
            marginBottom: 24,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <h2 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 700 }}>常用入口治理</h2>
              <div style={{ color: '#94a3b8', fontSize: 14 }}>
                当前详情快照: {snapshot.detailDeliveryMode} · capability access: {snapshot.capabilityDeliveryMode}
              </div>
            </div>
            <a
              href={`/stores/${snapshot.storeId}/capability-access`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 10,
                padding: '10px 14px',
                background: 'rgba(59,130,246,0.12)',
                color: '#93c5fd',
                textDecoration: 'none',
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              查看完整能力矩阵
            </a>
          </div>

          <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', marginBottom: 18 }}>
            <StatCard label="连接状态" value={capabilityAccess.connectionStatus} helper={`health: ${capabilityAccess.healthStatus ?? 'unknown'}`} />
            <StatCard label="降级入口" value={String(degradedEntrypointCount)} helper="保留提示但允许进入" />
            <StatCard label="阻塞入口" value={String(blockedEntrypointCount)} helper="需先补齐治理配置" />
            <StatCard label="隐藏入口" value={String(hiddenEntrypointCount)} helper="门店角色默认不展示" />
          </div>

          {visibleEntrypoints.length ? (
            <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
              {visibleEntrypoints.slice(0, 4).map((entry) => (
                <article
                  key={entry.key}
                  style={{
                    borderRadius: 16,
                    padding: 18,
                    background: 'rgba(15, 23, 42, 0.38)',
                    border: '1px solid rgba(148, 163, 184, 0.18)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700 }}>{entry.label}</div>
                      <div style={{ marginTop: 6, color: '#94a3b8', fontSize: 13 }}>{entry.description}</div>
                    </div>
                    <StatusBadge label={accessMeta[entry.access].label} variant={accessMeta[entry.access].variant} size="sm" />
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <StatusBadge label={readinessMeta[entry.readiness].label} variant={readinessMeta[entry.readiness].variant} size="sm" />
                    <span style={{ color: '#cbd5e1', fontSize: 13 }}>{entry.capability}</span>
                  </div>
                  <div style={{ color: '#cbd5e1', fontSize: 13, lineHeight: 1.6 }}>{entry.reason}</div>
                </article>
              ))}
            </div>
          ) : (
            <div style={{ color: '#94a3b8', fontSize: 14 }}>
              当前暂无可见入口，建议先进入能力访问页查看 hidden / blocked 原因。
            </div>
          )}
        </section>

        {editOpen && store ? (
          <section
            style={{
              borderRadius: 16,
              padding: 24,
              background: 'rgba(15, 23, 42, 0.35)',
              border: '1px solid rgba(148, 163, 184, 0.18)',
              marginBottom: 24,
            }}
          >
            <h2 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700 }}>编辑门店信息</h2>

            {submitState.isSubmitting || submitState.errorMessage || submitState.successMessage ? (
              <div style={{ marginBottom: 16 }}>
                <FormSubmitFeedback state={submitState} />
              </div>
            ) : null}

            <div style={{ display: 'grid', gap: 16 }}>
              <FormField label="门店名称" required error={errors.name}>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(event) => handleFieldChange('name', event.target.value)}
                  disabled={submitState.isSubmitting}
                  style={inputStyle}
                  placeholder="输入门店名称"
                />
              </FormField>
              <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr 1fr' }}>
                <FormField label="门店地址" required error={errors.address}>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(event) => handleFieldChange('address', event.target.value)}
                    disabled={submitState.isSubmitting}
                    style={inputStyle}
                    placeholder="输入门店地址"
                  />
                </FormField>
                <FormField label="联系电话" required error={errors.contactPhone}>
                  <input
                    type="text"
                    value={formData.contactPhone}
                    onChange={(event) => handleFieldChange('contactPhone', event.target.value)}
                    disabled={submitState.isSubmitting}
                    style={inputStyle}
                    placeholder="输入联系电话"
                  />
                </FormField>
              </div>
              <FormField label="联系邮箱" error={errors.contactEmail} helper="选填">
                <input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(event) => handleFieldChange('contactEmail', event.target.value)}
                  disabled={submitState.isSubmitting}
                  style={inputStyle}
                  placeholder="输入联系邮箱"
                />
              </FormField>
              <FormField label="描述" helper="简要描述门店定位与特色">
                <textarea
                  value={formData.description}
                  onChange={(event) => handleFieldChange('description', event.target.value)}
                  disabled={submitState.isSubmitting}
                  style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
                  placeholder="输入门店描述"
                />
              </FormField>
            </div>
          </section>
        ) : null}

        <div
          style={{
            borderRadius: 16,
            padding: 24,
            background: 'rgba(15, 23, 42, 0.35)',
            border: '1px solid rgba(148, 163, 184, 0.18)',
            marginBottom: 24,
          }}
        >
          <h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700 }}>门店信息</h2>
          {store ? (
            <>
              <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
                <InfoRow label="门店编码" value={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>{store.code}<CopyToClipboard text={store.code} size="sm" iconOnly /></span>} />
                <InfoRow label="所属市场" value={store.marketCode} />
                <InfoRow label="运营状态" value={<StatusBadge label={STORE_STATUS_MAP[store.status].label} variant={STORE_STATUS_MAP[store.status].variant} size="sm" dot />} />
                <InfoRow label="风险等级" value={<StatusBadge label={RISK_LEVEL_MAP[store.riskLevel].label} variant={RISK_LEVEL_MAP[store.riskLevel].variant} size="sm" />} />
                <InfoRow label="门店地址" value={store.address} />
                <InfoRow label="建档时间" value={store.openedAt} />
                <InfoRow label="联系电话" value={store.contactPhone} />
                <InfoRow label="联系邮箱" value={store.contactEmail} />
                <InfoRow label="建筑面积" value={`${store.floorArea.toLocaleString()} m²`} />
                <InfoRow label="关联租户数" value={`${store.tenantCount} 个`} />
                <InfoRow label="关联品牌数" value={`${store.brandCount} 个`} />
                <InfoRow label="最后部署" value={store.lastDeployed} />
                <InfoRow label="门店 ID" value={store.id} />
              </div>
              {store.description ? (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(148, 163, 184, 0.1)' }}>
                  <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 6 }}>门店简介</div>
                  <div style={{ fontSize: 14, color: '#e2e8f0', lineHeight: 1.6 }}>{store.description}</div>
                </div>
              ) : null}
            </>
          ) : (
            <div style={{ color: '#94a3b8', fontSize: 14 }}>
              当前未命中门店详情快照，请返回门店列表重新选择门店。
            </div>
          )}

          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(148, 163, 184, 0.1)', color: '#94a3b8', fontSize: 13 }}>
            当前门店详情已切换为 server wrapper + snapshot loader + client renderer，刷新按钮仅通过 router.refresh() 触发服务端快照重拉。
          </div>

          <DetailActionBar
            actions={detailActions}
            heading="详情收口动作"
            caption="复制 / 导出 / 分享当前门店详情"
          />
        </div>
      </DetailShell>
      <DetailClosureBar
        links={buildStandardClosureLinks({
          workspace: 'stores',
          detailId: store?.id ?? snapshot.storeId,
        })}
      />
    </div>
  );
}

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
