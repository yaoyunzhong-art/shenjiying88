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

interface MarketDetail {
  id: string;
  code: string;
  name: string;
  locale: string;
  currency: string;
  timezone: string;
  status: 'active' | 'inactive' | 'pending';
  tenantCount: number;
  brandCount: number;
  storeCount: number;
  lastDeployed: string;
  region: 'asia-pacific' | 'north-america' | 'europe' | 'middle-east' | 'latin-america';
  defaultLanguage: string;
  supportedLanguages: string[];
  contactEmail: string;
  contactPhone: string;
  registeredAt: string;
  description: string;
}

type StatusVariant = 'success' | 'neutral' | 'warning' | 'danger';

const STATUS_MAP: Record<MarketDetail['status'], { label: string; variant: StatusVariant }> = {
  active: { label: '运营中', variant: 'success' },
  inactive: { label: '已停用', variant: 'neutral' },
  pending: { label: '待激活', variant: 'warning' },
};

const REGION_MAP: Record<MarketDetail['region'], { label: string; variant: StatusVariant }> = {
  'asia-pacific': { label: '亚太', variant: 'success' },
  'north-america': { label: '北美', variant: 'neutral' },
  'europe': { label: '欧洲', variant: 'warning' },
  'middle-east': { label: '中东', variant: 'danger' },
  'latin-america': { label: '拉美', variant: 'neutral' },
};

// ---- Mock 市场详情数据 ----

function getMarketById(id: string): MarketDetail {
  const lookup: Record<string, MarketDetail> = {
    m1: { id: 'm1', code: 'cn-mainland', name: '中国大陆', locale: 'zh-CN', currency: 'CNY', timezone: 'Asia/Shanghai', status: 'active', tenantCount: 8, brandCount: 7, storeCount: 12, lastDeployed: '2026-06-12 14:30', region: 'asia-pacific', defaultLanguage: '简体中文', supportedLanguages: ['简体中文', '繁体中文'], contactEmail: 'cn-mainland@m5.com', contactPhone: '+86-10-8000-1000', registeredAt: '2023-06-01', description: '中国大陆是全球最大的零售市场之一，也是 M5 体系的旗舰市场。覆盖全国主要城市，拥有完善的本地化部署和运营体系。' },
    m2: { id: 'm2', code: 'cn-hk', name: '中国香港', locale: 'zh-HK', currency: 'HKD', timezone: 'Asia/Hong_Kong', status: 'active', tenantCount: 3, brandCount: 2, storeCount: 4, lastDeployed: '2026-06-12 10:15', region: 'asia-pacific', defaultLanguage: '繁體中文', supportedLanguages: ['繁體中文', 'English'], contactEmail: 'cn-hk@m5.com', contactPhone: '+852-3000-4000', registeredAt: '2024-03-15', description: '香港作为国际金融中心和购物天堂，是 M5 体系连接内地与国际市场的重要枢纽。' },
    m3: { id: 'm3', code: 'us-default', name: '美国', locale: 'en-US', currency: 'USD', timezone: 'America/New_York', status: 'active', tenantCount: 5, brandCount: 4, storeCount: 6, lastDeployed: '2026-06-12 08:30', region: 'north-america', defaultLanguage: 'English', supportedLanguages: ['English', 'Español'], contactEmail: 'us-default@m5.com', contactPhone: '+1-800-555-0100', registeredAt: '2024-01-20', description: '美国市场是全球最大的消费市场，M5 体系在北美的业务版图持续拓展，覆盖东西海岸核心城市。' },
    m5: { id: 'm5', code: 'jp-default', name: '日本', locale: 'ja-JP', currency: 'JPY', timezone: 'Asia/Tokyo', status: 'pending', tenantCount: 2, brandCount: 1, storeCount: 2, lastDeployed: '2026-06-11 09:00', region: 'asia-pacific', defaultLanguage: '日本語', supportedLanguages: ['日本語', 'English'], contactEmail: 'jp-default@m5.com', contactPhone: '+81-3-5000-6000', registeredAt: '2025-01-10', description: '日本市场是亚洲重要的零售市场之一，M5 体系正在积极拓展日本本地化服务能力。' },
    m7: { id: 'm7', code: 'sg-default', name: '新加坡', locale: 'en-SG', currency: 'SGD', timezone: 'Asia/Singapore', status: 'active', tenantCount: 2, brandCount: 2, storeCount: 3, lastDeployed: '2026-06-12 16:45', region: 'asia-pacific', defaultLanguage: 'English', supportedLanguages: ['English', '简体中文', 'Bahasa Melayu'], contactEmail: 'sg-default@m5.com', contactPhone: '+65-6000-7000', registeredAt: '2024-08-01', description: '新加坡是东南亚科技与金融中心，M5 体系以此为东南亚总部基地。' },
    m8: { id: 'm8', code: 'de-default', name: '德国', locale: 'de-DE', currency: 'EUR', timezone: 'Europe/Berlin', status: 'pending', tenantCount: 1, brandCount: 1, storeCount: 1, lastDeployed: '2026-06-10 14:00', region: 'europe', defaultLanguage: 'Deutsch', supportedLanguages: ['Deutsch', 'English'], contactEmail: 'de-default@m5.com', contactPhone: '+49-30-8000-9000', registeredAt: '2025-05-01', description: '德国是欧洲最大的经济体，M5 体系正在积极布局德国及欧洲大陆市场。' },
    m10: { id: 'm10', code: 'ae-default', name: '阿联酋', locale: 'ar-AE', currency: 'AED', timezone: 'Asia/Dubai', status: 'pending', tenantCount: 0, brandCount: 0, storeCount: 0, lastDeployed: '-', region: 'middle-east', defaultLanguage: 'العربية', supportedLanguages: ['العربية', 'English'], contactEmail: 'ae-default@m5.com', contactPhone: '+971-4-3000-4000', registeredAt: '2025-09-01', description: '阿联酋是中东地区的商业中心，M5 体系战略性布局迪拜，拓展中东及北非市场。' },
    m13: { id: 'm13', code: 'ca-default', name: '加拿大', locale: 'en-CA', currency: 'CAD', timezone: 'America/Toronto', status: 'active', tenantCount: 2, brandCount: 1, storeCount: 2, lastDeployed: '2026-06-12 09:30', region: 'north-america', defaultLanguage: 'English', supportedLanguages: ['English', 'Français'], contactEmail: 'ca-default@m5.com', contactPhone: '+1-800-555-0200', registeredAt: '2025-04-15', description: '加拿大市场是北美第二大市场，M5 体系在多伦多和温哥华部署了运营体系。' },
    m12: { id: 'm12', code: 'br-default', name: '巴西', locale: 'pt-BR', currency: 'BRL', timezone: 'America/Sao_Paulo', status: 'pending', tenantCount: 0, brandCount: 0, storeCount: 0, lastDeployed: '-', region: 'latin-america', defaultLanguage: 'Português', supportedLanguages: ['Português', 'English', 'Español'], contactEmail: 'br-default@m5.com', contactPhone: '+55-11-4000-5000', registeredAt: '2025-10-01', description: '巴西是拉丁美洲最大的经济体，M5 体系正在战略性进入南美市场。' },
  };
  return lookup[id] ?? lookup['m1']!;
}

// ---- 编辑表单 ----

interface EditFormData {
  name: string;
  currency: string;
  timezone: string;
  contactEmail: string;
  contactPhone: string;
  description: string;
}

interface EditFormErrors {
  name?: string;
  currency?: string;
  timezone?: string;
  contactPhone?: string;
  contactEmail?: string;
  description?: string;
}

function validateForm(data: EditFormData): EditFormErrors {
  const errors: EditFormErrors = {};
  if (!data.name.trim()) errors.name = '市场名称不能为空';
  if (!data.currency.trim()) errors.currency = '货币不能为空';
  if (!data.timezone.trim()) errors.timezone = '时区不能为空';
  if (!data.contactPhone.trim()) errors.contactPhone = '联系电话不能为空';
  if (data.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.contactEmail)) {
    errors.contactEmail = '邮箱格式不正确';
  }
  return errors;
}

async function submitMarketEdit(form: EditFormData): Promise<{ success: boolean }> {
  void form;
  await new Promise((resolve) => setTimeout(resolve, 800));
  return { success: true };
}

// ---- 页面组件 ----

export default function MarketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const market = getMarketById(id);
  const [editOpen, setEditOpen] = useState(false);
  const [formData, setFormData] = useState<EditFormData>({
    name: market.name,
    currency: market.currency,
    timezone: market.timezone,
    contactEmail: market.contactEmail,
    contactPhone: market.contactPhone,
    description: market.description,
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
      return submitMarketEdit(formData);
    },
    successMessage: '市场信息已更新成功。',
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
      name: market.name,
      currency: market.currency,
      timezone: market.timezone,
      contactEmail: market.contactEmail,
      contactPhone: market.contactPhone,
      description: market.description,
    });
  }, [market, resetSubmit]);

  const statusInfo = STATUS_MAP[market.status];
  const regionInfo = REGION_MAP[market.region];
  const deployedTotal = market.tenantCount + market.brandCount + market.storeCount;

  const { actions: detailActions } = useDetailActions({
    workspace: 'markets',
    detailId: market.id,
    record: market,
    shareTitle: `市场 · ${market.name}`,
    shareText: `查看市场 ${market.code} (${market.name}) 详情`
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
        {...buildStandardBreadcrumb({ workspace: 'markets', detailLabel: market.name })}
      />
      <DetailShell
        title={market.name}
        subtitle={`${market.code} · ${regionInfo.label}区域`}
      breadcrumbs={[
        { label: '市场管理', href: '/markets' },
        { label: market.name },
      ]}
      backLink={{ label: '返回市场列表', href: '/markets' }}
      actions={actions}
    >
      {/* 统计数据卡片 */}
      <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', marginBottom: 24 }}>
        <StatCard label="运营状态" value={statusInfo.label} helper={market.lastDeployed} />
        <StatCard label="区域" value={regionInfo.label} helper={`语言: ${market.defaultLanguage}`} />
        <StatCard label="部署资源" value={String(deployedTotal)} helper={`${market.tenantCount} 租户 · ${market.brandCount} 品牌 · ${market.storeCount} 门店`} />
        <StatCard label="注册时间" value={market.registeredAt} helper={`货币: ${market.currency}`} />
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
          <h2 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700 }}>编辑市场信息</h2>

          {/* 提交反馈 */}
          {submitState.isSubmitting || submitState.errorMessage || submitState.successMessage ? (
            <div style={{ marginBottom: 16 }}>
              <FormSubmitFeedback state={submitState} />
            </div>
          ) : null}

          <div style={{ display: 'grid', gap: 16 }}>
            <FormField label="市场名称" required error={errors.name}>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                disabled={submitState.isSubmitting}
                style={inputStyle}
                placeholder="输入市场名称"
              />
            </FormField>
            <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr 1fr' }}>
              <FormField label="货币" required error={errors.currency}>
                <input
                  type="text"
                  value={formData.currency}
                  onChange={(e) => handleFieldChange('currency', e.target.value)}
                  disabled={submitState.isSubmitting}
                  style={inputStyle}
                  placeholder="例如: CNY, USD, EUR"
                />
              </FormField>
              <FormField label="时区" required error={errors.timezone}>
                <input
                  type="text"
                  value={formData.timezone}
                  onChange={(e) => handleFieldChange('timezone', e.target.value)}
                  disabled={submitState.isSubmitting}
                  style={inputStyle}
                  placeholder="例如: Asia/Shanghai"
                />
              </FormField>
            </div>
            <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr 1fr' }}>
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
            </div>
            <FormField label="描述" helper="简要描述市场定位与业务范围">
              <textarea
                value={formData.description}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                disabled={submitState.isSubmitting}
                style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
                placeholder="输入市场描述"
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
        <h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700 }}>市场信息</h2>
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
          <InfoRow label="市场编码" value={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>{market.code}<CopyToClipboard text={market.code} size="sm" iconOnly /></span>} />
          <InfoRow label="市场名称" value={market.name} />
          <InfoRow
            label="运营状态"
            value={<StatusBadge label={statusInfo.label} variant={statusInfo.variant} size="sm" dot />}
          />
          <InfoRow
            label="区域"
            value={<StatusBadge label={regionInfo.label} variant={regionInfo.variant} size="sm" />}
          />
          <InfoRow label="语言" value={market.locale} />
          <InfoRow label="默认语言" value={market.defaultLanguage} />
          <InfoRow label="支持语言" value={market.supportedLanguages.join(', ')} />
          <InfoRow label="货币" value={market.currency} />
          <InfoRow label="时区" value={market.timezone} />
          <InfoRow label="关联租户数" value={`${market.tenantCount} 个`} />
          <InfoRow label="关联品牌数" value={`${market.brandCount} 个`} />
          <InfoRow label="关联门店数" value={`${market.storeCount} 个`} />
          <InfoRow label="联系电话" value={market.contactPhone} />
          <InfoRow label="联系邮箱" value={market.contactEmail} />
          <InfoRow label="注册时间" value={market.registeredAt} />
          <InfoRow label="最后部署" value={market.lastDeployed} />
        </div>
        {market.description ? (
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(148, 163, 184, 0.1)' }}>
            <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 6 }}>市场简介</div>
            <div style={{ fontSize: 14, color: '#e2e8f0', lineHeight: 1.6 }}>{market.description}</div>
          </div>
        ) : null}

        <DetailActionBar
          actions={detailActions}
          heading="详情收口动作"
          caption="复制 / 导出 / 分享当前市场详情"
        />
      </div>
    </DetailShell>
    <DetailClosureBar
      links={buildStandardClosureLinks({ workspace: 'markets', detailId: market.id })}
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
