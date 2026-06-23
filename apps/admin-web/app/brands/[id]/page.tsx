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
  type DetailShellAction
} from '@m5/ui';
import { useDetailActions } from '../../components/use-detail-actions';
import { buildStandardBreadcrumb, buildStandardClosureLinks } from '../../components/detail-workspace-registry';

// ---- 类型 ----

interface BrandDetail {
  id: string;
  code: string;
  name: string;
  marketCode: string;
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  storeCount: number;
  tenantCount: number;
  lastDeployed: string;
  tier: 'premium' | 'standard' | 'basic';
  logoUrl: string;
  contactEmail: string;
  contactPhone: string;
  foundedAt: string;
  description: string;
  category: string;
}

type BrandStatusVariant = 'success' | 'neutral' | 'warning' | 'danger';

const BRAND_STATUS_MAP: Record<BrandDetail['status'], { label: string; variant: BrandStatusVariant }> = {
  active: { label: '运营中', variant: 'success' },
  inactive: { label: '已停用', variant: 'neutral' },
  pending: { label: '待激活', variant: 'warning' },
  suspended: { label: '已暂停', variant: 'danger' },
};

const TIER_MAP: Record<BrandDetail['tier'], { label: string; variant: BrandStatusVariant }> = {
  premium: { label: '旗舰', variant: 'success' },
  standard: { label: '标准', variant: 'neutral' },
  basic: { label: '基础', variant: 'warning' },
};

// ---- Mock 品牌详情数据 ----

function getBrandById(id: string): BrandDetail {
  // 生产环境替换为 API 调用
  const lookup: Record<string, BrandDetail> = {
    b1: { id: 'b1', code: 'BRAND-001', name: 'M5 Premium 旗舰品牌', marketCode: 'cn-mainland', status: 'active', storeCount: 5, tenantCount: 3, lastDeployed: '2026-06-12 14:30', tier: 'premium', logoUrl: '', contactEmail: 'premium@m5.com', contactPhone: '+86-10-6666-8888', foundedAt: '2024-01-15', description: 'M5 体系顶级旗舰品牌，拥有全渠道门店布局，支持多租户运营。覆盖全国核心商圈，品牌知名度持续攀升。', category: '综合百货' },
    b2: { id: 'b2', code: 'BRAND-002', name: '轻奢生活馆', marketCode: 'cn-mainland', status: 'active', storeCount: 3, tenantCount: 2, lastDeployed: '2026-06-12 10:15', tier: 'standard', logoUrl: '', contactEmail: 'luxlife@m5.com', contactPhone: '+86-21-5555-7777', foundedAt: '2024-06-01', description: '主打轻奢生活方式的品牌线，精选全球优质好物，专注提升消费者日常生活品质。', category: '生活方式' },
    b3: { id: 'b3', code: 'BRAND-003', name: 'CityStyle 城市时尚', marketCode: 'cn-mainland', status: 'pending', storeCount: 1, tenantCount: 1, lastDeployed: '2026-06-11 09:00', tier: 'basic', logoUrl: '', contactEmail: 'citystyle@m5.com', contactPhone: '+86-755-3333-6666', foundedAt: '2025-03-20', description: '定位城市年轻人群的时尚品牌，主打快时尚和高性价比商品。', category: '时尚服饰' },
    b4: { id: 'b4', code: 'BRAND-004', name: 'TechCore 科技核心', marketCode: 'cn-mainland', status: 'active', storeCount: 4, tenantCount: 2, lastDeployed: '2026-06-12 16:45', tier: 'premium', logoUrl: '', contactEmail: 'techcore@m5.com', contactPhone: '+86-10-8888-9999', foundedAt: '2024-09-10', description: '科技+零售的旗舰品牌，融合 AI 智能体验与线下门店运营，打造未来零售新范式。', category: '科技零售' },
    b5: { id: 'b5', code: 'BRAND-005', name: 'NatureEssence 自然精华', marketCode: 'cn-mainland', status: 'suspended', storeCount: 2, tenantCount: 1, lastDeployed: '2026-06-10 11:00', tier: 'standard', logoUrl: '', contactEmail: 'nature@m5.com', contactPhone: '+86-571-2222-4444', foundedAt: '2024-11-01', description: '专注天然有机产品的品牌线，覆盖护肤、食品、家居等品类。因供应链调整暂时停运。', category: '健康生活' },
    b6: { id: 'b6', code: 'BRAND-006', name: 'GlobalFit 全球健身', marketCode: 'us-default', status: 'active', storeCount: 3, tenantCount: 2, lastDeployed: '2026-06-12 08:30', tier: 'premium', logoUrl: '', contactEmail: 'globalfit@m5.com', contactPhone: '+1-415-555-0100', foundedAt: '2025-01-15', description: '全球健身品牌，覆盖北美市场核心城市，提供线上线下结合的健身体验。', category: '运动健身' },
    b7: { id: 'b7', code: 'BRAND-007', name: 'FoodieLabs 美食实验室', marketCode: 'us-default', status: 'active', storeCount: 2, tenantCount: 1, lastDeployed: '2026-06-12 12:00', tier: 'standard', logoUrl: '', contactEmail: 'foodie@m5.com', contactPhone: '+1-212-555-0200', foundedAt: '2025-04-20', description: '探索美食+科技融合的品牌，主打健康快捷餐饮体验，已在美国东西海岸布局。', category: '餐饮美食' },
    b8: { id: 'b8', code: 'BRAND-008', name: 'LondonStyle 伦敦风尚', marketCode: 'uk-default', status: 'pending', storeCount: 1, tenantCount: 1, lastDeployed: '2026-06-11 15:20', tier: 'basic', logoUrl: '', contactEmail: 'londonstyle@m5.com', contactPhone: '+44-20-5555-0100', foundedAt: '2025-06-01', description: '英伦风尚品牌，侧重于英伦风格的生活方式商品，正处于英国市场启动阶段。', category: '生活方式' },
    b9: { id: 'b9', code: 'BRAND-009', name: '家居优选 HomeSelect', marketCode: 'cn-mainland', status: 'inactive', storeCount: 2, tenantCount: 1, lastDeployed: '2026-06-09 18:00', tier: 'basic', logoUrl: '', contactEmail: 'homeselect@m5.com', contactPhone: '+86-27-4444-3333', foundedAt: '2024-12-01', description: '家居优选品牌，提供精选家居商品，目前处于调整期。', category: '家居' },
    b10: { id: 'b10', code: 'BRAND-010', name: 'SportMax 运动极限', marketCode: 'cn-mainland', status: 'active', storeCount: 4, tenantCount: 2, lastDeployed: '2026-06-12 13:45', tier: 'standard', logoUrl: '', contactEmail: 'sportmax@m5.com', contactPhone: '+86-10-7777-6666', foundedAt: '2025-02-14', description: '运动极限品牌，涵盖跑步、篮球、足球等运动品类，拥有忠实运动消费群体。', category: '运动健身' },
    b11: { id: 'b11', code: 'BRAND-011', name: 'KidJoy 儿童乐园', marketCode: 'cn-mainland', status: 'active', storeCount: 3, tenantCount: 1, lastDeployed: '2026-06-12 09:30', tier: 'standard', logoUrl: '', contactEmail: 'kidjoy@m5.com', contactPhone: '+86-25-3333-2222', foundedAt: '2025-05-01', description: '专注儿童用品与娱乐的品牌，覆盖童装、玩具、亲子活动等品类。', category: '母婴儿童' },
    b12: { id: 'b12', code: 'BRAND-012', name: 'PetSpace 萌宠空间', marketCode: 'cn-mainland', status: 'pending', storeCount: 1, tenantCount: 1, lastDeployed: '2026-06-11 14:00', tier: 'basic', logoUrl: '', contactEmail: 'petspace@m5.com', contactPhone: '+86-29-6666-5555', foundedAt: '2025-08-08', description: '萌宠空间品牌，提供宠物食品、用品及服务，正处于起步阶段。', category: '宠物' },
  };
  return lookup[id] ?? lookup['b1']!;
}

// ---- 编辑表单 ----

interface EditFormData {
  name: string;
  category: string;
  contactPhone: string;
  contactEmail: string;
  description: string;
}

interface EditFormErrors {
  name?: string;
  category?: string;
  contactPhone?: string;
  contactEmail?: string;
  description?: string;
}

function validateForm(data: EditFormData): EditFormErrors {
  const errors: EditFormErrors = {};
  if (!data.name.trim()) errors.name = '品牌名称不能为空';
  if (!data.category.trim()) errors.category = '品类不能为空';
  if (!data.contactPhone.trim()) errors.contactPhone = '联系电话不能为空';
  if (data.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.contactEmail)) {
    errors.contactEmail = '邮箱格式不正确';
  }
  return errors;
}

async function submitBrandEdit(form: EditFormData): Promise<{ success: boolean }> {
  // 生产环境替换为 API 调用
  void form;
  await new Promise((resolve) => setTimeout(resolve, 800));
  return { success: true };
}

// ---- 页面组件 ----

export default function BrandDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const brand = getBrandById(id);
  const [editOpen, setEditOpen] = useState(false);
  const [formData, setFormData] = useState<EditFormData>({
    name: brand.name,
    category: brand.category,
    contactPhone: brand.contactPhone,
    contactEmail: brand.contactEmail,
    description: brand.description,
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
      return submitBrandEdit(formData);
    },
    successMessage: '品牌信息已更新成功。',
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
      name: brand.name,
      category: brand.category,
      contactPhone: brand.contactPhone,
      contactEmail: brand.contactEmail,
      description: brand.description,
    });
  }, [brand, resetSubmit]);

  const statusInfo = BRAND_STATUS_MAP[brand.status];
  const tierInfo = TIER_MAP[brand.tier];

  const { actions: detailActions } = useDetailActions({
    workspace: 'brands',
    detailId: brand.id,
    record: brand,
    shareTitle: `品牌 · ${brand.name}`,
    shareText: `查看品牌 ${brand.name} (${brand.code}) 详情`
  });

  const actions: DetailShellAction[] = [
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
        {...buildStandardBreadcrumb({ workspace: 'brands', detailLabel: brand.name })}
      />
      <DetailShell
        title={brand.name}
        subtitle={`${brand.code} · ${brand.marketCode}`}
        breadcrumbs={[
          { label: '品牌管理', href: '/brands' },
          { label: brand.name },
        ]}
      backLink={{ label: '返回品牌列表', href: '/brands' }}
      actions={actions}
    >
      {/* 统计数据卡片 */}
      <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', marginBottom: 24 }}>
        <StatCard label="运营状态" value={statusInfo.label} helper={brand.lastDeployed} />
        <StatCard label="品牌等级" value={tierInfo.label} helper={`类别: ${brand.category}`} />
        <StatCard label="关联门店" value={String(brand.storeCount)} helper={`${brand.tenantCount} 个租户`} />
        <StatCard label="成立时间" value={brand.foundedAt} helper={brand.marketCode} />
      </div>

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
          <h2 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700 }}>编辑品牌信息</h2>

          {/* 提交反馈 */}
          {submitState.isSubmitting || submitState.errorMessage || submitState.successMessage ? (
            <div style={{ marginBottom: 16 }}>
              <FormSubmitFeedback state={submitState} />
            </div>
          ) : null}

          <div style={{ display: 'grid', gap: 16 }}>
            <FormField label="品牌名称" required error={errors.name}>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                disabled={submitState.isSubmitting}
                style={inputStyle}
                placeholder="输入品牌名称"
              />
            </FormField>
            <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr 1fr' }}>
              <FormField label="品牌类别" required error={errors.category}>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => handleFieldChange('category', e.target.value)}
                  disabled={submitState.isSubmitting}
                  style={inputStyle}
                  placeholder="输入品牌类别"
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
            <FormField label="描述" helper="简要描述品牌定位与特色">
              <textarea
                value={formData.description}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                disabled={submitState.isSubmitting}
                style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
                placeholder="输入品牌描述"
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
        <h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700 }}>品牌信息</h2>
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
          <InfoRow label="品牌编码" value={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>{brand.code}<CopyToClipboard text={brand.code} size="sm" iconOnly /></span>} />
          <InfoRow label="所属市场" value={brand.marketCode} />
          <InfoRow
            label="运营状态"
            value={<StatusBadge label={statusInfo.label} variant={statusInfo.variant} size="sm" dot />}
          />
          <InfoRow
            label="品牌等级"
            value={<StatusBadge label={tierInfo.label} variant={tierInfo.variant} size="sm" />}
          />
          <InfoRow label="品牌类别" value={brand.category} />
          <InfoRow label="成立时间" value={brand.foundedAt} />
          <InfoRow label="联系电话" value={brand.contactPhone} />
          <InfoRow label="联系邮箱" value={brand.contactEmail} />
          <InfoRow label="关联门店数" value={`${brand.storeCount} 个`} />
          <InfoRow label="关联租户数" value={`${brand.tenantCount} 个`} />
          <InfoRow label="最后部署" value={brand.lastDeployed} />
          <InfoRow label="品牌 ID" value={brand.id} />
        </div>
        {brand.description ? (
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(148, 163, 184, 0.1)' }}>
            <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 6 }}>品牌简介</div>
            <div style={{ fontSize: 14, color: '#e2e8f0', lineHeight: 1.6 }}>{brand.description}</div>
          </div>
        ) : null}

        <DetailActionBar
          actions={detailActions}
          heading="详情收口动作"
          caption="复制 / 导出 / 分享当前品牌详情"
        />
      </div>
    </DetailShell>
    <DetailClosureBar
      links={buildStandardClosureLinks({ workspace: 'brands', detailId: brand.id })}
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
