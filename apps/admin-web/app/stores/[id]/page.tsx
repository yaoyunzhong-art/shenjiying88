'use client';

import { useState, useCallback, use, useEffect } from 'react';

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
  type DetailShellAction
} from '@m5/ui';
import {
  accessMeta,
  buildCapabilityEntrypoints,
  buildFallbackCapabilityAccessView,
  loadStoreCapabilityAccessSnapshot,
  readinessMeta,
  type StoreCapabilityAccessSnapshot
} from '../../lyt-capability-access';
import { useDetailActions } from '../../components/use-detail-actions';
import { buildStandardBreadcrumb, buildStandardClosureLinks } from '../../components/detail-workspace-registry';

// ---- 类型 ----

interface StoreDetail {
  id: string;
  code: string;
  name: string;
  marketCode: string;
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  tenantCount: number;
  brandCount: number;
  lastDeployed: string;
  riskLevel: 'low' | 'medium' | 'high';
  address: string;
  contactEmail: string;
  contactPhone: string;
  openedAt: string;
  floorArea: number;
  description: string;
}

type StoreStatusVariant = 'success' | 'neutral' | 'warning' | 'danger';

const STORE_STATUS_MAP: Record<StoreDetail['status'], { label: string; variant: StoreStatusVariant }> = {
  active: { label: '运营中', variant: 'success' },
  inactive: { label: '已停用', variant: 'neutral' },
  pending: { label: '待激活', variant: 'warning' },
  suspended: { label: '已暂停', variant: 'danger' }
};

const RISK_LEVEL_MAP: Record<StoreDetail['riskLevel'], { label: string; variant: StoreStatusVariant }> = {
  low: { label: '低风险', variant: 'success' },
  medium: { label: '中风险', variant: 'warning' },
  high: { label: '高风险', variant: 'danger' }
};

// ---- Mock 门店详情数据 ----

function getStoreById(id: string): StoreDetail {
  const lookup: Record<string, StoreDetail> = {
    s1: { id: 's1', code: 'STORE-001', name: '朝阳大悦城旗舰店', marketCode: 'cn-mainland', status: 'active', tenantCount: 12, brandCount: 8, lastDeployed: '2026-06-12 14:30', riskLevel: 'low', address: '北京市朝阳区朝阳北路101号', contactEmail: 'chaoyang@m5.com', contactPhone: '+86-10-8888-1111', openedAt: '2023-09-15', floorArea: 8500, description: '位于朝阳大悦城的旗舰级门店，覆盖全品类商品，是目前体量最大的门店之一。日均客流超5万人次，持续保持高运营效率。' },
    s2: { id: 's2', code: 'STORE-002', name: '上海陆家嘴中心店', marketCode: 'cn-mainland', status: 'active', tenantCount: 9, brandCount: 6, lastDeployed: '2026-06-12 10:15', riskLevel: 'medium', address: '上海市浦东新区陆家嘴环路1000号', contactEmail: 'lujiazui@m5.com', contactPhone: '+86-21-6666-2222', openedAt: '2024-01-10', floorArea: 6200, description: '位于上海陆家嘴金融核心区，主打高端消费人群，品牌组合精选国际与本土优质品牌。' },
    s3: { id: 's3', code: 'STORE-003', name: '深圳万象天地店', marketCode: 'cn-mainland', status: 'pending', tenantCount: 3, brandCount: 2, lastDeployed: '2026-06-11 09:00', riskLevel: 'low', address: '深圳市南山区深南大道9668号', contactEmail: 'wanxiang@m5.com', contactPhone: '+86-755-3333-8888', openedAt: '2025-08-01', floorArea: 4200, description: '深圳万象天地新开门店，主打科技零售与年轻时尚品牌组合，正处于启动筹备阶段。' },
    s4: { id: 's4', code: 'STORE-004', name: '成都太古里体验店', marketCode: 'cn-mainland', status: 'active', tenantCount: 6, brandCount: 4, lastDeployed: '2026-06-12 16:45', riskLevel: 'low', address: '成都市锦江区中纱帽街8号', contactEmail: 'taikooli@m5.com', contactPhone: '+86-28-5555-9999', openedAt: '2024-04-20', floorArea: 5100, description: '成都远洋太古里体验店，融合巴蜀文化与现代零售体验，深受本地消费者喜爱。' },
    s5: { id: 's5', code: 'STORE-005', name: '杭州银泰旗舰店', marketCode: 'cn-mainland', status: 'suspended', tenantCount: 4, brandCount: 3, lastDeployed: '2026-06-10 11:00', riskLevel: 'high', address: '杭州市上城区延安路530号', contactEmail: 'yintai@m5.com', contactPhone: '+86-571-4444-7777', openedAt: '2024-07-15', floorArea: 4800, description: '杭州银泰旗舰店，因消防整改暂停运营，预计下月恢复。需重点关注安全合规事项。' },
    s6: { id: 's6', code: 'STORE-006', name: 'San Francisco Union Square', marketCode: 'us-default', status: 'active', tenantCount: 5, brandCount: 3, lastDeployed: '2026-06-12 08:30', riskLevel: 'medium', address: '333 Post St, San Francisco, CA 94108', contactEmail: 'sf-union@m5.com', contactPhone: '+1-415-555-0300', openedAt: '2024-10-01', floorArea: 3900, description: '位于旧金山联合广场的旗舰店，覆盖美国西海岸市场。' },
    s7: { id: 's7', code: 'STORE-007', name: 'New York Fifth Avenue', marketCode: 'us-default', status: 'active', tenantCount: 8, brandCount: 5, lastDeployed: '2026-06-12 12:00', riskLevel: 'low', address: '640 Fifth Ave, New York, NY 10019', contactEmail: 'ny-fifth@m5.com', contactPhone: '+1-212-555-0400', openedAt: '2024-06-01', floorArea: 7200, description: '纽约第五大道旗舰店，全球最大门店之一，涵盖顶级奢侈与时尚品牌。' },
    s8: { id: 's8', code: 'STORE-008', name: 'London Oxford Street', marketCode: 'uk-default', status: 'pending', tenantCount: 2, brandCount: 2, lastDeployed: '2026-06-11 15:20', riskLevel: 'low', address: '100 Oxford St, London W1D 1LL', contactEmail: 'london-oxford@m5.com', contactPhone: '+44-20-5555-0200', openedAt: '2025-06-01', floorArea: 3500, description: '伦敦牛津街新开门店，正处于启动阶段，将引入精选英伦与国际品牌。' },
    s9: { id: 's9', code: 'STORE-009', name: '广州天河城店', marketCode: 'cn-mainland', status: 'inactive', tenantCount: 3, brandCount: 1, lastDeployed: '2026-06-09 18:00', riskLevel: 'medium', address: '广州市天河区天河路208号', contactEmail: 'tianhe@m5.com', contactPhone: '+86-20-8888-3333', openedAt: '2024-03-01', floorArea: 4400, description: '广州天河城门店，因商圈调整暂时停运。' },
    s10: { id: 's10', code: 'STORE-010', name: '南京德基广场店', marketCode: 'cn-mainland', status: 'active', tenantCount: 7, brandCount: 5, lastDeployed: '2026-06-12 13:45', riskLevel: 'low', address: '南京市玄武区中山路18号', contactEmail: 'deji@m5.com', contactPhone: '+86-25-7777-6666', openedAt: '2024-09-10', floorArea: 5600, description: '南京德基广场旗舰门店，覆盖华东地区高端消费群体。' },
    s11: { id: 's11', code: 'STORE-011', name: '武汉天地旗舰店', marketCode: 'cn-mainland', status: 'active', tenantCount: 4, brandCount: 3, lastDeployed: '2026-06-12 09:30', riskLevel: 'medium', address: '武汉市江岸区中山大道1515号', contactEmail: 'tiandi@m5.com', contactPhone: '+86-27-6666-4444', openedAt: '2025-01-15', floorArea: 3900, description: '武汉天地旗舰店，覆盖华中地区中高端消费市场。' },
    s12: { id: 's12', code: 'STORE-012', name: '重庆来福士店', marketCode: 'cn-mainland', status: 'pending', tenantCount: 1, brandCount: 1, lastDeployed: '2026-06-11 14:00', riskLevel: 'low', address: '重庆市渝中区接圣街8号', contactEmail: 'raffles@m5.com', contactPhone: '+86-23-5555-2222', openedAt: '2025-11-01', floorArea: 3100, description: '重庆来福士广场新开门店，定位西南地区桥头堡。' },
    s13: { id: 's13', code: 'STORE-013', name: 'Seattle Downtown', marketCode: 'us-default', status: 'active', tenantCount: 3, brandCount: 2, lastDeployed: '2026-06-12 07:00', riskLevel: 'low', address: '400 Pine St, Seattle, WA 98101', contactEmail: 'seattle@m5.com', contactPhone: '+1-206-555-0500', openedAt: '2025-03-01', floorArea: 2800, description: '西雅图市中心门店，服务太平洋西北地区消费者。' },
    s14: { id: 's14', code: 'STORE-014', name: '苏州中心旗舰店', marketCode: 'cn-mainland', status: 'active', tenantCount: 5, brandCount: 4, lastDeployed: '2026-06-12 11:30', riskLevel: 'low', address: '苏州市工业园区苏绣路89号', contactEmail: 'suzhou@m5.com', contactPhone: '+86-512-6666-8888', openedAt: '2024-12-01', floorArea: 4700, description: '苏州中心旗舰店，辐射长三角地区的优质消费客群。' },
    s15: { id: 's15', code: 'STORE-015', name: '西安大唐不夜城店', marketCode: 'cn-mainland', status: 'suspended', tenantCount: 2, brandCount: 1, lastDeployed: '2026-06-08 10:00', riskLevel: 'high', address: '西安市雁塔区雁塔南路518号', contactEmail: 'datang@m5.com', contactPhone: '+86-29-8888-5555', openedAt: '2024-08-20', floorArea: 3600, description: '西安大唐不夜城门店，因运营调整暂停。需协调多方资源推动恢复。' },
  };
  return lookup[id] ?? lookup['s1']!;
}

// ---- 编辑表单 ----

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
  description?: string;
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
  // 生产环境替换为 API 调用
  void form;
  await new Promise((resolve) => setTimeout(resolve, 800));
  return { success: true };
}

// ---- 页面组件 ----

export default function StoreDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const store = getStoreById(id);
  const [editOpen, setEditOpen] = useState(false);
  const [capabilitySnapshot, setCapabilitySnapshot] = useState<StoreCapabilityAccessSnapshot>({
    deliveryMode: 'fallback',
    capabilityAccess: buildFallbackCapabilityAccessView(id)
  });
  const [isCapabilityLoading, setIsCapabilityLoading] = useState(true);
  const [formData, setFormData] = useState<EditFormData>({
    name: store.name,
    address: store.address,
    contactPhone: store.contactPhone,
    contactEmail: store.contactEmail,
    description: store.description,
  });
  const [errors, setErrors] = useState<EditFormErrors>({});

  const {
    submit,
    state: submitState,
    reset: resetSubmit
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
    setFormData({
      name: store.name,
      address: store.address,
      contactPhone: store.contactPhone,
      contactEmail: store.contactEmail,
      description: store.description,
    });
  }, [store, resetSubmit]);

  const statusInfo = STORE_STATUS_MAP[store.status];
  const riskInfo = RISK_LEVEL_MAP[store.riskLevel];
  const capabilityAccess = capabilitySnapshot.capabilityAccess;
  const entrypoints = buildCapabilityEntrypoints(id, capabilityAccess);
  const visibleEntrypoints = entrypoints.filter((item) => item.visibility === 'visible');
  const recommendedEntrypoint = visibleEntrypoints.find((item) => item.isNavigable);
  const hiddenEntrypointCount = entrypoints.length - visibleEntrypoints.length;
  const blockedEntrypointCount = entrypoints.filter((item) => item.access === 'blocked').length;
  const degradedEntrypointCount = entrypoints.filter((item) => item.access === 'degraded').length;

  useEffect(() => {
    let disposed = false;

    async function hydrateCapabilityAccess() {
      const nextSnapshot = await loadStoreCapabilityAccessSnapshot(id, {
        storeId: id,
        marketCode: store.marketCode
      });

      if (!disposed) {
        setCapabilitySnapshot(nextSnapshot);
        setIsCapabilityLoading(false);
      }
    }

    void hydrateCapabilityAccess();

    return () => {
      disposed = true;
    };
  }, [id, store.marketCode]);

  const { actions: detailActions } = useDetailActions({
    workspace: 'stores',
    detailId: store.id,
    record: store,
    shareTitle: `门店 · ${store.name}`,
    shareText: `查看门店 ${store.code} (${store.name}) 详情`
  });

  const actions: DetailShellAction[] = [
    ...(recommendedEntrypoint
      ? [
          {
            key: 'recommended-entry',
            label: recommendedEntrypoint.access === 'degraded' ? `${recommendedEntrypoint.label}·降级` : recommendedEntrypoint.label,
            variant: 'secondary' as const,
            href: recommendedEntrypoint.href
          }
        ]
      : []),
    {
      key: 'capability-access',
      label: '能力访问',
      variant: 'secondary',
      href: `/stores/${id}/capability-access`,
    },
    {
      key: 'edit',
      label: editOpen ? '保存中...' : '编辑',
      variant: 'primary',
      loading: submitState.isSubmitting,
      disabled: submitState.isSubmitting,
      onClick: editOpen
        ? handleSave
        : () => setEditOpen(true),
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
        {...buildStandardBreadcrumb({ workspace: 'stores', detailLabel: store.name })}
      />
      <DetailShell
        title={store.name}
        subtitle={`${store.code} · ${store.marketCode}`}
      breadcrumbs={[
        { label: '门店管理', href: '/stores' },
        { label: store.name },
      ]}
      backLink={{ label: '返回门店列表', href: '/stores' }}
      actions={actions}
    >
      {/* 统计数据卡片 */}
      <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', marginBottom: 24 }}>
        <StatCard label="运营状态" value={statusInfo.label} helper={store.lastDeployed} />
        <StatCard label="风险等级" value={riskInfo.label} helper={store.marketCode} />
        <StatCard label="关联租户" value={String(store.tenantCount)} helper={`${store.brandCount} 个品牌`} />
        <StatCard label="面积" value={`${store.floorArea.toLocaleString()} m²`} helper={`开业: ${store.openedAt}`} />
      </div>

      <section
        style={{
          borderRadius: 16,
          padding: 24,
          background: 'rgba(15, 23, 42, 0.35)',
          border: '1px solid rgba(148, 163, 184, 0.18)',
          marginBottom: 24
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <h2 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 700 }}>常用入口治理</h2>
            <div style={{ color: '#94a3b8', fontSize: 14 }}>
              {isCapabilityLoading ? '正在同步真实 capability access...' : `当前数据源：${capabilitySnapshot.deliveryMode === 'api' ? '真实 access view' : 'fallback access view'}`}
            </div>
          </div>
          <a
            href={`/stores/${id}/capability-access`}
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
              fontWeight: 600
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
                gap: 12
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
              {entry.isNavigable ? (
                <a
                  href={entry.href}
                  style={{
                    display: 'inline-flex',
                    width: 'fit-content',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 10,
                    padding: '10px 14px',
                    background: entry.access === 'enabled' ? 'rgba(59,130,246,0.14)' : 'rgba(245,158,11,0.16)',
                    color: entry.access === 'enabled' ? '#93c5fd' : '#fbbf24',
                    textDecoration: 'none',
                    fontSize: 14,
                    fontWeight: 600
                  }}
                >
                  {entry.actionLabel}
                </a>
              ) : (
                <div
                  style={{
                    display: 'inline-flex',
                    width: 'fit-content',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 10,
                    padding: '10px 14px',
                    background: 'rgba(239,68,68,0.14)',
                    color: '#fca5a5',
                    fontSize: 14,
                    fontWeight: 600
                  }}
                >
                  {entry.actionLabel}
                </div>
              )}
            </article>
          ))}
        </div>
        {!visibleEntrypoints.length ? (
          <div style={{ marginTop: 16, color: '#94a3b8', fontSize: 14 }}>
            当前暂无可见入口，建议先进入能力访问页查看 hidden / blocked 原因。
          </div>
        ) : null}
      </section>

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
          <h2 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700 }}>编辑门店信息</h2>

          {/* 提交反馈 */}
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
                onChange={(e) => handleFieldChange('name', e.target.value)}
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
                  onChange={(e) => handleFieldChange('address', e.target.value)}
                  disabled={submitState.isSubmitting}
                  style={inputStyle}
                  placeholder="输入门店地址"
                />
              </FormField>
              <FormField label="联系电话" required error={errors.contactPhone}>
                <input
                  type="text"
                  value={formData.contactPhone}
                  onChange={(e) => handleFieldChange('contactPhone', e.target.value)}
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
                onChange={(e) => handleFieldChange('contactEmail', e.target.value)}
                disabled={submitState.isSubmitting}
                style={inputStyle}
                placeholder="输入联系邮箱"
              />
            </FormField>
            <FormField label="描述" helper="简要描述门店定位与特色">
              <textarea
                value={formData.description}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                disabled={submitState.isSubmitting}
                style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
                placeholder="输入门店描述"
              />
            </FormField>

            {/* 提交 / 取消按钮 */}
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
        <h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700 }}>门店信息</h2>
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
          <InfoRow label="门店编码" value={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>{store.code}<CopyToClipboard text={store.code} size="sm" iconOnly /></span>} />
          <InfoRow label="所属市场" value={store.marketCode} />
          <InfoRow
            label="运营状态"
            value={<StatusBadge label={statusInfo.label} variant={statusInfo.variant} size="sm" dot />}
          />
          <InfoRow
            label="风险等级"
            value={<StatusBadge label={riskInfo.label} variant={riskInfo.variant} size="sm" />}
          />
          <InfoRow label="门店地址" value={store.address} />
          <InfoRow label="开业时间" value={store.openedAt} />
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
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(148, 163, 184, 0.1)', color: '#94a3b8', fontSize: 13 }}>
          当前门店详情已直接感知 capability access，可继续把同一治理策略前推到店长/导购/收银工作台首页。
        </div>

        <DetailActionBar
          actions={detailActions}
          heading="详情收口动作"
          caption="复制 / 导出 / 分享当前门店详情"
        />
      </div>
    </DetailShell>
    <DetailClosureBar
      links={buildStandardClosureLinks({ workspace: 'stores', detailId: store.id })}
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
