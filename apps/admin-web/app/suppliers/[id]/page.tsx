/**
 * 供应商详情页 — Supplier Detail Page (Next.js App Router Page)
 * 角色视角: 👤采购管理 / 📊供应链
 * 功能: 查看详情、编辑信息、状态流转、删除确认
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
  type DetailShellAction,
} from '@m5/ui';
import { useDetailActions } from '../../components/use-detail-actions';
import { buildStandardBreadcrumb, buildStandardClosureLinks } from '../../components/detail-workspace-registry';

// ---- 类型 ----

type SupplierStatus = 'active' | 'paused' | 'blacklisted' | 'pending_audit';
type SupplierCategory = 'raw_material' | 'packaging' | 'equipment' | 'logistics' | 'service' | 'others';
type SupplierCredit = 'AAA' | 'AA' | 'A' | 'B' | 'C';

interface SupplierDetail {
  id: string;
  code: string;
  name: string;
  contactPerson: string;
  contactPhone: string;
  email: string;
  category: SupplierCategory;
  status: SupplierStatus;
  creditRating: SupplierCredit;
  cooperationMonths: number;
  totalOrders: number;
  totalAmount: number;
  defectRate: number;
  avgDeliveryDays: number;
  address: string;
  marketCode: string;
  createdBy: string;
  createdAt: string;
  lastOrderAt: string;
}

type SupplierStatusVariant = 'success' | 'warning' | 'danger' | 'info';

const SUPPLIER_STATUS_MAP: Record<SupplierStatus, { label: string; variant: SupplierStatusVariant }> = {
  active: { label: '合作中', variant: 'success' },
  paused: { label: '暂停合作', variant: 'warning' },
  blacklisted: { label: '黑名单', variant: 'danger' },
  pending_audit: { label: '待审核', variant: 'info' },
};

const SUPPLIER_CATEGORY_MAP: Record<SupplierCategory, string> = {
  raw_material: '原材料',
  packaging: '包装耗材',
  equipment: '设备',
  logistics: '物流配送',
  service: '服务',
  others: '其他',
};

const SUPPLIER_CREDIT_MAP: Record<SupplierCredit, { label: string; color: string }> = {
  AAA: { label: 'AAA', color: '#22c55e' },
  AA: { label: 'AA', color: '#34d399' },
  A: { label: 'A', color: '#facc15' },
  B: { label: 'B', color: '#fb923c' },
  C: { label: 'C', color: '#ef4444' },
};

const TRANSITION_ACTIONS: { from: SupplierStatus; to: SupplierStatus; label: string }[] = [
  { from: 'pending_audit', to: 'active', label: '通过审核' },
  { from: 'pending_audit', to: 'blacklisted', label: '拒绝' },
  { from: 'active', to: 'paused', label: '暂停合作' },
  { from: 'paused', to: 'active', label: '恢复合作' },
  { from: 'active', to: 'blacklisted', label: '加入黑名单' },
];

// ---- Mock 供应商详情数据 ----

const MOCK_SUPPLIERS_DETAIL: Record<string, SupplierDetail> = {
  'sp-001': { id: 'sp-001', code: 'SUP-001', name: '绿源食品有限公司', contactPerson: '王建国', contactPhone: '13800010001', email: 'wjg@lyfood.com', category: 'raw_material', status: 'active', creditRating: 'AA', cooperationMonths: 36, totalOrders: 142, totalAmount: 3850000, defectRate: 0.8, avgDeliveryDays: 2, address: '北京市大兴区生物医药基地', marketCode: 'cn-mainland', createdBy: '张建国', createdAt: '2023-01-15', lastOrderAt: '2026-06-20' },
  'sp-002': { id: 'sp-002', code: 'SUP-002', name: '鼎盛包装科技有限公司', contactPerson: '李志强', contactPhone: '13800010002', email: 'lzq@dsbz.com', category: 'packaging', status: 'active', creditRating: 'AAA', cooperationMonths: 24, totalOrders: 89, totalAmount: 1260000, defectRate: 0.3, avgDeliveryDays: 3, address: '上海市松江区新桥镇', marketCode: 'cn-mainland', createdBy: '张建国', createdAt: '2023-06-01', lastOrderAt: '2026-06-22' },
  'sp-003': { id: 'sp-003', code: 'SUP-003', name: '海龙物流集团', contactPerson: '陈海', contactPhone: '13800010003', email: 'chenhai@hllog.com', category: 'logistics', status: 'active', creditRating: 'A', cooperationMonths: 48, totalOrders: 520, totalAmount: 7200000, defectRate: 1.2, avgDeliveryDays: 1, address: '广州市白云区太和镇', marketCode: 'cn-mainland', createdBy: '刘强', createdAt: '2022-08-20', lastOrderAt: '2026-06-23' },
  'sp-004': { id: 'sp-004', code: 'SUP-004', name: '鲜生活食材配送', contactPerson: '赵敏', contactPhone: '13800010004', email: 'zhaomin@freshlife.com', category: 'raw_material', status: 'active', creditRating: 'AAA', cooperationMonths: 18, totalOrders: 68, totalAmount: 980000, defectRate: 0.1, avgDeliveryDays: 1, address: '深圳市南山区西丽街道', marketCode: 'cn-mainland', createdBy: '李小红', createdAt: '2024-01-10', lastOrderAt: '2026-06-24' },
  'sp-005': { id: 'sp-005', code: 'SUP-005', name: '锦华设备制造厂', contactPerson: '钱锦华', contactPhone: '13800010005', email: 'qjh@jhdevice.com', category: 'equipment', status: 'paused', creditRating: 'B', cooperationMonths: 12, totalOrders: 6, totalAmount: 450000, defectRate: 5.5, avgDeliveryDays: 15, address: '浙江省宁波市鄞州区', marketCode: 'cn-mainland', createdBy: '陈芳', createdAt: '2024-03-15', lastOrderAt: '2025-11-05' },
  'sp-006': { id: 'sp-006', code: 'SUP-006', name: '嘉华物业管理有限公司', contactPerson: '周建华', contactPhone: '13800010006', email: 'zhoujh@jiahua.com', category: 'service', status: 'pending_audit', creditRating: 'A', cooperationMonths: 0, totalOrders: 0, totalAmount: 0, defectRate: 0, avgDeliveryDays: 0, address: '成都市武侯区天府大道', marketCode: 'cn-mainland', createdBy: '周涛', createdAt: '2026-06-10', lastOrderAt: '-' },
  'sp-007': { id: 'sp-007', code: 'SUP-007', name: '恒达包装材料厂', contactPerson: '李恒', contactPhone: '13800010007', email: 'liheng@hdpack.com', category: 'packaging', status: 'active', creditRating: 'AA', cooperationMonths: 30, totalOrders: 76, totalAmount: 890000, defectRate: 0.6, avgDeliveryDays: 4, address: '江苏省苏州市工业园区', marketCode: 'cn-mainland', createdBy: '张建国', createdAt: '2023-04-01', lastOrderAt: '2026-06-18' },
  'sp-008': { id: 'sp-008', code: 'SUP-008', name: '源广达食材供应链', contactPerson: '孙广源', contactPhone: '13800010008', email: 'sgy@ygdsc.com', category: 'raw_material', status: 'blacklisted', creditRating: 'C', cooperationMonths: 6, totalOrders: 12, totalAmount: 185000, defectRate: 12.3, avgDeliveryDays: 5, address: '湖北省武汉市江汉区', marketCode: 'cn-mainland', createdBy: '赵丽', createdAt: '2024-03-01', lastOrderAt: '2024-09-20' },
  'sp-009': { id: 'sp-009', code: 'SUP-009', name: '星空科技服务有限公司', contactPerson: '林星辰', contactPhone: '13800010009', email: 'linx@starlight.com', category: 'service', status: 'active', creditRating: 'AA', cooperationMonths: 20, totalOrders: 34, totalAmount: 620000, defectRate: 0.4, avgDeliveryDays: 7, address: '北京市海淀区中关村', marketCode: 'cn-mainland', createdBy: '黄志明', createdAt: '2024-02-01', lastOrderAt: '2026-06-15' },
  'sp-010': { id: 'sp-010', code: 'SUP-010', name: 'Global Trade Logistics Inc.', contactPerson: 'John Miller', contactPhone: '14150001001', email: 'jmiller@gtl.com', category: 'logistics', status: 'active', creditRating: 'AAA', cooperationMonths: 60, totalOrders: 410, totalAmount: 15800000, defectRate: 0.2, avgDeliveryDays: 5, address: '200 Mission St, San Francisco, CA', marketCode: 'us-default', createdBy: 'James Smith', createdAt: '2021-07-01', lastOrderAt: '2026-06-24' },
  'sp-011': { id: 'sp-011', code: 'SUP-011', name: 'Eco Pack Solutions Ltd.', contactPerson: 'Sarah Connor', contactPhone: '12120001001', email: 'sconnor@ecopack.com', category: 'packaging', status: 'active', creditRating: 'AA', cooperationMonths: 28, totalOrders: 95, totalAmount: 2100000, defectRate: 0.5, avgDeliveryDays: 6, address: '55 Broadway, New York, NY', marketCode: 'us-default', createdBy: 'Emily Chen', createdAt: '2024-01-05', lastOrderAt: '2026-06-21' },
  'sp-012': { id: 'sp-012', code: 'SUP-012', name: '华北粮油批发市场', contactPerson: '郑大勇', contactPhone: '13800010012', email: 'zdy@hbliang.com', category: 'raw_material', status: 'active', creditRating: 'A', cooperationMonths: 15, totalOrders: 42, totalAmount: 1560000, defectRate: 1.5, avgDeliveryDays: 3, address: '天津市河北区粮库路18号', marketCode: 'cn-mainland', createdBy: '王伟', createdAt: '2024-04-20', lastOrderAt: '2026-06-19' },
  'sp-013': { id: 'sp-013', code: 'SUP-013', name: '西南冷链物流有限公司', contactPerson: '张凯', contactPhone: '13800010013', email: 'zhangk@xnll.com', category: 'logistics', status: 'pending_audit', creditRating: 'A', cooperationMonths: 0, totalOrders: 0, totalAmount: 0, defectRate: 0, avgDeliveryDays: 0, address: '重庆市渝北区回兴街道', marketCode: 'cn-mainland', createdBy: '周涛', createdAt: '2026-06-12', lastOrderAt: '-' },
  'sp-014': { id: 'sp-014', code: 'SUP-014', name: '福瑞德咖啡设备有限公司', contactPerson: '陈福瑞', contactPhone: '13800010014', email: 'cfr@friendcoffee.com', category: 'equipment', status: 'active', creditRating: 'AA', cooperationMonths: 42, totalOrders: 28, totalAmount: 3200000, defectRate: 0.9, avgDeliveryDays: 10, address: '广东省佛山市顺德区', marketCode: 'cn-mainland', createdBy: '杨帆', createdAt: '2022-10-01', lastOrderAt: '2026-06-10' },
  'sp-015': { id: 'sp-015', code: 'SUP-015', name: '悦读文化传媒', contactPerson: '文艺', contactPhone: '13800010015', email: 'wenyi@yuedu.com', category: 'others', status: 'paused', creditRating: 'B', cooperationMonths: 8, totalOrders: 5, totalAmount: 45000, defectRate: 3.0, avgDeliveryDays: 7, address: '长沙市岳麓区大学城', marketCode: 'cn-mainland', createdBy: '孙静', createdAt: '2024-11-01', lastOrderAt: '2025-08-15' },
  'sp-016': { id: 'sp-016', code: 'SUP-016', name: '欧风烘焙原料进口', contactPerson: '欧阳雪', contactPhone: '13800010016', email: 'oyx@oufeng.com', category: 'raw_material', status: 'active', creditRating: 'AAA', cooperationMonths: 40, totalOrders: 110, totalAmount: 4500000, defectRate: 0.1, avgDeliveryDays: 4, address: '上海市浦东新区外高桥保税区', marketCode: 'cn-mainland', createdBy: '陈芳', createdAt: '2023-01-05', lastOrderAt: '2026-06-23' },
};

function getSupplierById(id: string): SupplierDetail {
  return MOCK_SUPPLIERS_DETAIL[id] ?? MOCK_SUPPLIERS_DETAIL['sp-001']!;
}

// ---- 编辑表单 ----

interface EditFormData {
  name: string;
  contactPerson: string;
  contactPhone: string;
  email: string;
  address: string;
}

interface EditFormErrors {
  name?: string;
  contactPerson?: string;
  contactPhone?: string;
  email?: string;
  address?: string;
}

function validateForm(data: EditFormData): EditFormErrors {
  const errors: EditFormErrors = {};
  if (!data.name.trim()) errors.name = '供应商名称不能为空';
  if (!data.contactPerson.trim()) errors.contactPerson = '联系人不能为空';
  if (!data.contactPhone.trim()) errors.contactPhone = '联系电话不能为空';
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = '邮箱格式不正确';
  }
  return errors;
}

async function submitSupplierEdit(_form: EditFormData): Promise<{ success: boolean }> {
  await new Promise((resolve) => setTimeout(resolve, 800));
  return { success: true };
}

async function submitStatusTransition(
  _id: string,
  _toStatus: SupplierStatus
): Promise<{ success: boolean }> {
  await new Promise((resolve) => setTimeout(resolve, 600));
  return { success: true };
}

function formatAmount(amount: number): string {
  if (amount >= 1000000) return `${(amount / 10000).toFixed(1)}万`;
  if (amount >= 10000) return `${(amount / 10000).toFixed(2)}万`;
  return String(amount);
}

// ---- 页面组件 ----

export default function SupplierDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [supplier, setSupplier] = useState<SupplierDetail>(getSupplierById(id));
  const [editOpen, setEditOpen] = useState(false);
  const [transitionLoading, setTransitionLoading] = useState<string | null>(null);
  const [formData, setFormData] = useState<EditFormData>({
    name: supplier.name,
    contactPerson: supplier.contactPerson,
    contactPhone: supplier.contactPhone,
    email: supplier.email,
    address: supplier.address,
  });
  const [errors, setErrors] = useState<EditFormErrors>({});

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
      return submitSupplierEdit(formData);
    },
    successMessage: '供应商信息已更新成功。',
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
    [errors],
  );

  const handleCancel = useCallback(() => {
    setEditOpen(false);
    setErrors({});
    resetSubmit();
    setFormData({
      name: supplier.name,
      contactPerson: supplier.contactPerson,
      contactPhone: supplier.contactPhone,
      email: supplier.email,
      address: supplier.address,
    });
  }, [supplier, resetSubmit]);

  const handleTransition = useCallback(
    async (toStatus: SupplierStatus, label: string) => {
      setTransitionLoading(label);
      try {
        const result = await submitStatusTransition(id, toStatus);
        if (result.success) {
          setSupplier((prev) => ({ ...prev, status: toStatus }));
        }
      } finally {
        setTransitionLoading(null);
      }
    },
    [id],
  );

  const statusInfo = SUPPLIER_STATUS_MAP[supplier.status];
  const creditInfo = SUPPLIER_CREDIT_MAP[supplier.creditRating];

  const { actions: detailActions } = useDetailActions({
    workspace: 'suppliers',
    detailId: supplier.id,
    record: supplier,
    shareTitle: `供应商 · ${supplier.name}`,
    shareText: `查看供应商 ${supplier.name} (${supplier.code}) 详情`,
  });

  // ---- 操作栏按钮 ----
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
          workspace: 'suppliers',
          detailLabel: supplier.name,
        })}
      />
      <DetailShell
        title={supplier.name}
        subtitle={`${supplier.code} · ${SUPPLIER_CATEGORY_MAP[supplier.category]}`}
        breadcrumbs={[
          { label: '供应商管理', href: '/suppliers' },
          { label: supplier.name },
        ]}
        backLink={{ label: '返回供应商列表', href: '/suppliers' }}
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
            label="合作状态"
            value={statusInfo.label}
            helper={supplier.cooperationMonths > 0 ? `已合作 ${supplier.cooperationMonths} 个月` : '新供应商'}
          />
          <StatCard
            label="信用评级"
            value={creditInfo.label}
            helper={supplier.avgDeliveryDays > 0 ? `平均配送 ${supplier.avgDeliveryDays} 天` : '暂无数据'}
          />
          <StatCard
            label="累积订单"
            value={String(supplier.totalOrders)}
            helper={`总金额 ${formatAmount(supplier.totalAmount)}`}
          />
          <StatCard
            label="不良率"
            value={`${supplier.defectRate}%`}
            helper={supplier.defectRate > 5 ? '⚠️ 需关注' : '正常'}
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
            {TRANSITION_ACTIONS.filter((a) => a.from === supplier.status).map(
              (action) => (
                <SubmitButton
                  key={action.to}
                  loading={transitionLoading === action.label}
                  disabled={transitionLoading !== null}
                  onClick={() => handleTransition(action.to, action.label)}
                  variant={
                    action.to === 'blacklisted'
                      ? 'danger'
                      : action.to === 'paused'
                        ? 'secondary'
                        : 'primary'
                  }
                  style={{ fontSize: 13, padding: '6px 14px' }}
                >
                  {action.label}
                </SubmitButton>
              ),
            )}
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
              编辑供应商信息
            </h2>

            {submitState.isSubmitting ||
            submitState.errorMessage ||
            submitState.successMessage ? (
              <div style={{ marginBottom: 16 }}>
                <FormSubmitFeedback state={submitState} />
              </div>
            ) : null}

            <div style={{ display: 'grid', gap: 16 }}>
              <FormField label="供应商名称" required error={errors.name}>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  disabled={submitState.isSubmitting}
                  style={inputStyle}
                  placeholder="输入供应商名称"
                />
              </FormField>
              <div
                style={{
                  display: 'grid',
                  gap: 16,
                  gridTemplateColumns: '1fr 1fr',
                }}
              >
                <FormField
                  label="联系人"
                  required
                  error={errors.contactPerson}
                >
                  <input
                    type="text"
                    value={formData.contactPerson}
                    onChange={(e) =>
                      handleFieldChange('contactPerson', e.target.value)
                    }
                    disabled={submitState.isSubmitting}
                    style={inputStyle}
                    placeholder="输入联系人"
                  />
                </FormField>
                <FormField
                  label="联系电话"
                  required
                  error={errors.contactPhone}
                >
                  <input
                    type="text"
                    value={formData.contactPhone}
                    onChange={(e) =>
                      handleFieldChange('contactPhone', e.target.value)
                    }
                    disabled={submitState.isSubmitting}
                    style={inputStyle}
                    placeholder="输联系电話"
                  />
                </FormField>
              </div>
              <FormField
                label="联系邮箱"
                error={errors.email}
                helper="选填"
              >
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleFieldChange('email', e.target.value)}
                  disabled={submitState.isSubmitting}
                  style={inputStyle}
                  placeholder="输入联系邮箱"
                />
              </FormField>
              <FormField label="地址">
                <textarea
                  value={formData.address}
                  onChange={(e) => handleFieldChange('address', e.target.value)}
                  disabled={submitState.isSubmitting}
                  style={{ ...inputStyle, minHeight: 72, resize: 'vertical' }}
                  placeholder="输入地址"
                />
              </FormField>

              <div
                style={{
                  display: 'flex',
                  gap: 12,
                  alignItems: 'center',
                  marginTop: 8,
                }}
              >
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
          <h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700 }}>
            供应商信息
          </h2>
          <div
            style={{
              display: 'grid',
              gap: 12,
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            }}
          >
            <InfoRow
              label="供应商编码"
              value={
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  {supplier.code}
                  <CopyToClipboard text={supplier.code} size="sm" iconOnly />
                </span>
              }
            />
            <InfoRow label="所属市场" value={supplier.marketCode} />
            <InfoRow
              label="合作状态"
              value={
                <StatusBadge
                  label={statusInfo.label}
                  variant={statusInfo.variant}
                  size="sm"
                  dot
                />
              }
            />
            <InfoRow
              label="信用评级"
              value={
                <span
                  style={{
                    color: creditInfo.color,
                    fontWeight: 600,
                    fontSize: 14,
                  }}
                >
                  {creditInfo.label}
                </span>
              }
            />
            <InfoRow label="品类" value={SUPPLIER_CATEGORY_MAP[supplier.category]} />
            <InfoRow label="合作时长" value={`${supplier.cooperationMonths} 个月`} />
            <InfoRow label="联系人" value={supplier.contactPerson} />
            <InfoRow label="联系电话" value={supplier.contactPhone} />
            <InfoRow label="电子邮箱" value={supplier.email} />
            <InfoRow label="地址" value={supplier.address} />
            <InfoRow label="创建人" value={supplier.createdBy} />
            <InfoRow label="创建时间" value={supplier.createdAt} />
          </div>

          {supplier.totalOrders > 0 ? (
            <div
              style={{
                marginTop: 16,
                paddingTop: 16,
                borderTop: '1px solid rgba(148, 163, 184, 0.1)',
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gap: 16,
                  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 12,
                      color: '#64748b',
                      marginBottom: 4,
                    }}
                  >
                    累积订单数
                  </div>
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 700,
                      color: '#e2e8f0',
                    }}
                  >
                    {supplier.totalOrders}
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 12,
                      color: '#64748b',
                      marginBottom: 4,
                    }}
                  >
                    总交易额
                  </div>
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 700,
                      color: '#e2e8f0',
                    }}
                  >
                    ¥{formatAmount(supplier.totalAmount)}
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 12,
                      color: '#64748b',
                      marginBottom: 4,
                    }}
                  >
                    最近订单
                  </div>
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 700,
                      color: '#e2e8f0',
                    }}
                  >
                    {supplier.lastOrderAt}
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          <DetailActionBar
            actions={detailActions}
            heading="详情收口动作"
            caption="复制 / 导出 / 分享当前供应商详情"
          />
        </div>
      </DetailShell>
      <DetailClosureBar
        links={buildStandardClosureLinks({
          workspace: 'suppliers',
          detailId: supplier.id,
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
