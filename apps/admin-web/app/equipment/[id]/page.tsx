/**
 * 设备详情页 — Equipment Detail Page (Next.js App Router Page)
 * 角色视角: 🏢总部管理 / 🛠️运维
 * 功能: 查看详情、编辑信息、状态流转、删除确认
 */
'use client';

import { useState, useCallback, use } from 'react';
import Link from 'next/link';

import {
  DetailShell,
  DetailActionBar,
  DetailClosureBar,
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

const DEFAULT_WORKSPACE_HREF = '/equipment';
const DEFAULT_BREADCRUMB_LABEL = '设备管理';
const DEFAULT_CLOSURE_LABEL = '返回设备列表';

// ---- 类型 ----

export type EquipmentStatus = 'normal' | 'maintaining' | 'scrap_pending' | 'scrapped';
export type EquipmentType = 'capsule' | 'claw' | 'cashier' | 'ac' | 'speaker' | 'lightbox' | 'turnstile';

export interface EquipmentItem {
  id: string;
  name: string;
  model: string;
  type: EquipmentType;
  store: string;
  supplier: string;
  purchaseDate: string;
  warrantyEnd: string;
  status: EquipmentStatus;
  note?: string;
}

// ---- 映射表 ----

const ET: Record<EquipmentType, string> = {
  capsule: '扭蛋机',
  claw: '娃娃机',
  cashier: '收银机',
  ac: '空调',
  speaker: '音响',
  lightbox: '灯箱',
  turnstile: '闸机',
};

const ES: Record<EquipmentStatus, { l: string; v: 'success' | 'warning' | 'danger' | 'neutral' }> = {
  normal: { l: '正常', v: 'success' },
  maintaining: { l: '维修中', v: 'warning' },
  scrap_pending: { l: '待报废', v: 'danger' },
  scrapped: { l: '已报废', v: 'neutral' },
};

const STATUS_ORDER: EquipmentStatus[] = ['normal', 'maintaining', 'scrap_pending', 'scrapped'];

const ALLOWED_TRANSITIONS: Record<EquipmentStatus, { to: EquipmentStatus; label: string }[]> = {
  normal: [{ to: 'maintaining', label: '设为维修中' }, { to: 'scrap_pending', label: '申请报废' }],
  maintaining: [{ to: 'normal', label: '恢复正常' }, { to: 'scrap_pending', label: '申请报废' }],
  scrap_pending: [{ to: 'scrapped', label: '确认报废' }, { to: 'normal', label: '撤销报废' }],
  scrapped: [],
};

// ---- Mock 设备详情数据 ----

const MOCK_EQUIPMENT_DETAIL: Record<string, EquipmentItem> = {
  E001: { id: 'E001', name: '扭蛋机-A01', model: 'GACHA-X1', type: 'capsule', store: '旗舰店-解放路', supplier: '万代南梦宫', purchaseDate: '2024-03-15', warrantyEnd: '2026-03-14', status: 'normal', note: '3号机位' },
  E002: { id: 'E002', name: '娃娃机-B03', model: 'CLAW-Z2', type: 'claw', store: '门店-科技路', supplier: '世嘉', purchaseDate: '2024-06-01', warrantyEnd: '2026-05-31', status: 'normal' },
  E003: { id: 'E003', name: '收银机-主01', model: 'POS-3000', type: 'cashier', store: '旗舰店-解放路', supplier: '海信智能', purchaseDate: '2023-11-20', warrantyEnd: '2025-11-19', status: 'maintaining', note: '主板故障，已报修' },
  E004: { id: 'E004', name: '中央空调-01', model: 'AC-M5', type: 'ac', store: '旗舰店-解放路', supplier: '格力', purchaseDate: '2023-05-10', warrantyEnd: '2028-05-09', status: 'normal' },
  E005: { id: 'E005', name: '音响系统-S01', model: 'SPK-2000', type: 'speaker', store: '门店-科技路', supplier: 'JBL', purchaseDate: '2024-01-15', warrantyEnd: '2026-01-14', status: 'scrap_pending', note: '左右声道异常' },
  E006: { id: 'E006', name: '灯箱-L02', model: 'LB-800', type: 'lightbox', store: '门店-中山路', supplier: '欧普照明', purchaseDate: '2024-09-01', warrantyEnd: '2026-08-31', status: 'normal' },
  E007: { id: 'E007', name: '闸机-G01', model: 'GATE-100', type: 'turnstile', store: '旗舰店-解放路', supplier: '海康威视', purchaseDate: '2023-08-20', warrantyEnd: '2026-08-19', status: 'normal' },
  E008: { id: 'E008', name: '扭蛋机-A02', model: 'GACHA-X2', type: 'capsule', store: '门店-中山路', supplier: '多美', purchaseDate: '2024-12-01', warrantyEnd: '2026-11-30', status: 'scrapped' },
};

function getEquipmentById(id: string): EquipmentItem | undefined {
  return MOCK_EQUIPMENT_DETAIL[id];
}

// ---- 辅助函数 ----

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

function warrantyLabel(days: number): string {
  if (days < 0) return '已过期';
  if (days < 90) return `剩${days}天`;
  return '有效';
}

function warrantyColor(days: number): string {
  if (days < 0) return '#ef4444';
  if (days < 90) return '#eab308';
  return '#94a3b8';
}

// ---- 编辑表单 ----

interface EditFormData {
  name: string;
  model: string;
  store: string;
  supplier: string;
  note: string;
}

interface EditFormErrors {
  name?: string;
  model?: string;
  store?: string;
  supplier?: string;
}

function validateEquipmentForm(data: EditFormData): EditFormErrors {
  const errors: EditFormErrors = {};
  if (!data.name.trim()) errors.name = '设备名称不能为空';
  if (!data.model.trim()) errors.model = '型号不能为空';
  if (!data.store.trim()) errors.store = '所属门店不能为空';
  if (!data.supplier.trim()) errors.supplier = '供应商不能为空';
  return errors;
}

async function submitEquipmentEdit(_form: EditFormData): Promise<{ success: boolean }> {
  await new Promise((resolve) => setTimeout(resolve, 800));
  return { success: true };
}

async function submitEquipmentTransition(
  _id: string,
  _toStatus: EquipmentStatus,
): Promise<{ success: boolean }> {
  await new Promise((resolve) => setTimeout(resolve, 600));
  return { success: true };
}

// ---- 404 子组件 ----

function EquipmentNotFound({ id }: { id: string }) {
  return (
    <div style={{ maxWidth: 800, margin: '60px auto', textAlign: 'center', color: '#94a3b8' }}>
      <h2 style={{ fontSize: 24, marginBottom: 12 }}>设备未找到</h2>
      <p>ID: {id} 不存在，请返回设备列表。</p>
      <Link href="/equipment" style={{ color: '#93c5fd', marginTop: 16, display: 'inline-block' }}>
        ← 返回设备列表
      </Link>
    </div>
  );
}

// ---- 详情内容子组件 ----

function EquipmentDetailContent({ equipment }: { equipment: EquipmentItem }) {
  const [eq, setEq] = useState<EquipmentItem>(equipment);
  const [editOpen, setEditOpen] = useState(false);
  const [transitionLoading, setTransitionLoading] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const statusInfo = ES[eq.status];
  const typeLabel = ET[eq.type];
  const warrantyDays = daysUntil(eq.warrantyEnd);

  const [formData, setFormData] = useState<EditFormData>({
    name: eq.name,
    model: eq.model,
    store: eq.store,
    supplier: eq.supplier,
    note: eq.note ?? '',
  });
  const [errors, setErrors] = useState<EditFormErrors>({});

  const {
    submit,
    state: submitState,
    reset: resetSubmit,
  } = useFormSubmit<{ success: boolean }>({
    async onSubmit() {
      const validationErrors = validateEquipmentForm(formData);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        throw new Error(Object.values(validationErrors)[0]);
      }
      setErrors({});
      return submitEquipmentEdit(formData);
    },
    successMessage: '设备信息已更新成功。',
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
      name: eq.name,
      model: eq.model,
      store: eq.store,
      supplier: eq.supplier,
      note: eq.note ?? '',
    });
  }, [eq, resetSubmit]);

  const handleTransition = useCallback(
    async (toStatus: EquipmentStatus, label: string) => {
      setTransitionLoading(label);
      try {
        const result = await submitEquipmentTransition(eq.id, toStatus);
        if (result.success) {
          setEq((prev) => ({ ...prev, status: toStatus }));
        }
      } finally {
        setTransitionLoading(null);
      }
    },
    [eq.id],
  );

  const transitionActions = ALLOWED_TRANSITIONS[eq.status] ?? [];

  // ---- 操作栏按钮 ----
  const actions: DetailShellAction[] = [
    {
      key: 'edit',
      label: editOpen ? (submitState.isSubmitting ? '保存中...' : '保存') : '编辑',
      variant: 'primary',
      loading: submitState.isSubmitting,
      disabled: submitState.isSubmitting,
      onClick: editOpen ? handleSave : () => setEditOpen(true),
    },
    {
      key: 'delete',
      label: deleteConfirm ? '确认移除？' : '移除',
      variant: 'danger',
      onClick: deleteConfirm
        ? () => {
            window.location.href = '/equipment';
          }
        : () => setDeleteConfirm(true),
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
        workspaceLabel={DEFAULT_BREADCRUMB_LABEL}
        workspaceHref={DEFAULT_WORKSPACE_HREF}
        detailLabel={eq.name}
      />
      <DetailShell
        title={eq.name}
        subtitle={`${eq.model} · ${typeLabel} · ${eq.store}`}
        breadcrumbs={[
          { label: DEFAULT_BREADCRUMB_LABEL, href: DEFAULT_WORKSPACE_HREF },
          { label: eq.name },
        ]}
        backLink={{ label: DEFAULT_CLOSURE_LABEL, href: DEFAULT_WORKSPACE_HREF }}
        actions={actions}
      >
        {/* 统计卡片 */}
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
            value={statusInfo.l}
            helper={`${eq.purchaseDate.slice(0, 4)}年采购`}
          />
          <StatCard
            label="设备类型"
            value={typeLabel}
            helper={eq.model}
          />
          <StatCard
            label="所属门店"
            value={eq.store}
            helper={eq.supplier}
          />
          <StatCard
            label="保修状态"
            value={warrantyLabel(warrantyDays)}
            helper={warrantyDays < 0 ? '已过保' : warrantyDays < 90 ? '即将到期' : '正常'}
          />
        </div>

        {/* 删除确认 */}
        {deleteConfirm && (
          <div
            style={{
              borderRadius: 16,
              padding: 24,
              background: 'rgba(127, 29, 29, 0.28)',
              border: '1px solid rgba(248, 113, 113, 0.24)',
              marginBottom: 24,
            }}
          >
            <h3 style={{ margin: '0 0 8px', color: '#fca5a5', fontSize: 16 }}>
              确认移除设备
            </h3>
            <p style={{ margin: '0 0 16px', color: '#fecaca', fontSize: 14 }}>
              确定要移除设备「{eq.name}」（{eq.id}）吗？此操作不可恢复。
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                style={{
                  borderRadius: 10,
                  padding: '10px 20px',
                  background: '#dc2626',
                  color: '#fff',
                  border: 'none',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
                onClick={() => {
                  window.location.href = '/equipment';
                }}
              >
                确认移除
              </button>
              <button
                style={{
                  borderRadius: 10,
                  padding: '10px 20px',
                  background: 'rgba(148,163,184,0.12)',
                  color: '#cbd5e1',
                  border: 'none',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
                onClick={() => setDeleteConfirm(false)}
              >
                取消
              </button>
            </div>
          </div>
        )}

        {/* 状态流转按钮 */}
        {!editOpen && transitionActions.length > 0 && (
          <div
            style={{
              display: 'flex',
              gap: 10,
              flexWrap: 'wrap',
              marginBottom: 24,
            }}
          >
            {transitionActions.map((action) => (
              <SubmitButton
                key={action.to}
                loading={transitionLoading === action.label}
                disabled={transitionLoading !== null}
                onClick={() => handleTransition(action.to, action.label)}
                variant={
                  action.to === 'scrapped'
                    ? 'danger'
                    : action.to === 'normal'
                      ? 'primary'
                      : 'secondary'
                }
                style={{ fontSize: 13, padding: '6px 14px' }}
              >
                {action.label}
              </SubmitButton>
            ))}
          </div>
        )}

        {/* 编辑表单 */}
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
              编辑设备信息
            </h2>

            {submitState.isSubmitting ||
            submitState.errorMessage ||
            submitState.successMessage ? (
              <div style={{ marginBottom: 16 }}>
                <FormSubmitFeedback state={submitState} />
              </div>
            ) : null}

            <div style={{ display: 'grid', gap: 16 }}>
              <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr 1fr' }}>
                <FormField label="设备名称" required error={errors.name}>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleFieldChange('name', e.target.value)}
                    disabled={submitState.isSubmitting}
                    style={inputStyle}
                    placeholder="输入设备名称"
                  />
                </FormField>
                <FormField label="型号" required error={errors.model}>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) => handleFieldChange('model', e.target.value)}
                    disabled={submitState.isSubmitting}
                    style={inputStyle}
                    placeholder="输入型号"
                  />
                </FormField>
              </div>
              <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr 1fr' }}>
                <FormField label="所属门店" required error={errors.store}>
                  <input
                    type="text"
                    value={formData.store}
                    onChange={(e) => handleFieldChange('store', e.target.value)}
                    disabled={submitState.isSubmitting}
                    style={inputStyle}
                    placeholder="输入门店"
                  />
                </FormField>
                <FormField label="供应商" required error={errors.supplier}>
                  <input
                    type="text"
                    value={formData.supplier}
                    onChange={(e) => handleFieldChange('supplier', e.target.value)}
                    disabled={submitState.isSubmitting}
                    style={inputStyle}
                    placeholder="输入供应商"
                  />
                </FormField>
              </div>
              <FormField label="备注" helper="可选填写设备位置、故障记录等信息">
                <textarea
                  value={formData.note}
                  onChange={(e) => handleFieldChange('note', e.target.value)}
                  disabled={submitState.isSubmitting}
                  style={{ ...inputStyle, minHeight: 72, resize: 'vertical' }}
                  placeholder="输入备注信息"
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

        {/* 详细信息卡片 */}
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
            设备信息
          </h2>
          <div
            style={{
              display: 'grid',
              gap: 12,
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            }}
          >
            <InfoRow
              label="设备编号"
              value={
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  {eq.id}
                  <CopyToClipboard text={eq.id} size="sm" iconOnly />
                </span>
              }
            />
            <InfoRow label="名称" value={eq.name} />
            <InfoRow
              label="设备状态"
              value={
                <StatusBadge
                  label={statusInfo.l}
                  variant={statusInfo.v}
                  size="sm"
                  dot
                />
              }
            />
            <InfoRow label="设备类型" value={typeLabel} />
            <InfoRow label="型号" value={eq.model} />
            <InfoRow label="所属门店" value={eq.store} />
            <InfoRow label="供应商" value={eq.supplier} />
            <InfoRow label="采购日期" value={eq.purchaseDate} />
            <InfoRow
              label="保修到期"
              value={
                <span style={{ color: warrantyColor(warrantyDays), fontWeight: 600 }}>
                  {eq.warrantyEnd} ({warrantyLabel(warrantyDays)})
                </span>
              }
            />
            <InfoRow label="备注" value={eq.note ?? '-'} />
          </div>
        </div>
      </DetailShell>
      <DetailClosureBar
        links={[
          {
            key: 'workspace',
            title: DEFAULT_CLOSURE_LABEL,
            subtitle: `回到 ${DEFAULT_BREADCRUMB_LABEL}`,
            href: DEFAULT_WORKSPACE_HREF,
          },
        ]}
      />
    </div>
  );
}

// ---- 页面入口组件 ----

export default function EquipmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const equipment = getEquipmentById(id);

  if (!equipment) {
    return <EquipmentNotFound id={id} />;
  }

  return <EquipmentDetailContent equipment={equipment} />;
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
