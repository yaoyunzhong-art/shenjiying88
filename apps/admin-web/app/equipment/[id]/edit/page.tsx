/**
 * 设备编辑页 — Equipment Edit Page (Next.js App Router Page)
 * 角色视角: 🏢总部管理 / 🛠️运维
 * 功能: 编辑设备信息（名称、型号、门店、供应商、备注）
 */
'use client';

import { useState, useCallback, use } from 'react';
import Link from 'next/link';

import {
  FormField,
  FormSubmitFeedback,
  SubmitButton,
  WorkspaceBreadcrumb,
  useFormSubmit,
} from '@m5/ui';

// ---- 类型 ----

export type EquipmentType = 'capsule' | 'claw' | 'cashier' | 'ac' | 'speaker' | 'lightbox' | 'turnstile';
export type EquipmentStatus = 'normal' | 'maintaining' | 'scrap_pending' | 'scrapped';

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

const ET: Record<EquipmentType, string> = {
  capsule: '扭蛋机',
  claw: '娃娃机',
  cashier: '收银机',
  ac: '空调',
  speaker: '音响',
  lightbox: '灯箱',
  turnstile: '闸机',
};

// ---- Mock 数据 ----

const MOCK_EQUIPMENT_DETAIL: Record<string, EquipmentItem> = {
  E001: { id: 'E001', name: '扭蛋机-A01', model: 'GACHA-X1', type: 'capsule', store: '旗舰店-解放路', supplier: '万代南梦宫', purchaseDate: '2024-03-15', warrantyEnd: '2026-03-14', status: 'normal', note: '3号机位' },
  E002: { id: 'E002', name: '娃娃机-B03', model: 'CLAW-Z2', type: 'claw', store: '门店-科技路', supplier: '世嘉', purchaseDate: '2024-06-01', warrantyEnd: '2026-05-31', status: 'normal' },
  E003: { id: 'E003', name: '收银机-主01', model: 'POS-3000', type: 'cashier', store: '旗舰店-解放路', supplier: '海信智能', purchaseDate: '2023-11-20', warrantyEnd: '2025-11-19', status: 'maintaining', note: '主板故障，已报修' },
};

function getEquipmentById(id: string): EquipmentItem | undefined {
  return MOCK_EQUIPMENT_DETAIL[id];
}

// ---- 编辑表单 ----

export interface EditFormData {
  name: string;
  model: string;
  store: string;
  supplier: string;
  note: string;
}

export interface EditFormErrors {
  name?: string;
  model?: string;
  store?: string;
  supplier?: string;
}

export function validateEditForm(data: EditFormData): EditFormErrors {
  const errors: EditFormErrors = {};
  if (!data.name.trim()) errors.name = '设备名称不能为空';
  if (!data.model.trim()) errors.model = '型号不能为空';
  if (!data.store.trim()) errors.store = '所属门店不能为空';
  if (!data.supplier.trim()) errors.supplier = '供应商不能为空';
  return errors;
}

async function submitEdit(_form: EditFormData): Promise<{ success: boolean }> {
  await new Promise((resolve) => setTimeout(resolve, 800));
  return { success: true };
}

// ---- 404 子组件 ----

function EditNotFound({ id }: { id: string }) {
  return (
    <div style={{ maxWidth: 800, margin: '60px auto', textAlign: 'center', color: '#94a3b8' }}>
      <h2 style={{ fontSize: 24, marginBottom: 12 }}>设备未找到</h2>
      <p>无法编辑 ID: {id}，该设备不存在。</p>
      <Link href="/equipment" style={{ color: '#93c5fd', marginTop: 16, display: 'inline-block' }}>
        ← 返回设备列表
      </Link>
    </div>
  );
}

// ---- 页面组件 ----

export default function EquipmentEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const equipment = getEquipmentById(id);

  const [formData, setFormData] = useState<EditFormData>({
    name: equipment?.name ?? '',
    model: equipment?.model ?? '',
    store: equipment?.store ?? '',
    supplier: equipment?.supplier ?? '',
    note: equipment?.note ?? '',
  });
  const [errors, setErrors] = useState<EditFormErrors>({});

  const {
    submit,
    state: submitState,
    reset: resetSubmit,
  } = useFormSubmit<{ success: boolean }>({
    async onSubmit() {
      const validationErrors = validateEditForm(formData);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        throw new Error(Object.values(validationErrors)[0]);
      }
      setErrors({});
      return submitEdit(formData);
    },
    successMessage: '设备信息已更新成功！',
  });

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

  const handleErrorDismiss = useCallback(() => {
    resetSubmit();
  }, [resetSubmit]);

  if (!equipment) {
    return <EditNotFound id={id} />;
  }

  const typeLabel = ET[equipment.type];

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: 32 }}>
      <WorkspaceBreadcrumb
        workspaceLabel="设备管理"
        workspaceHref="/equipment"
        detailLabel={`编辑 ${equipment.name}`}
      />

      <div
        style={{
          marginTop: 24,
          borderRadius: 16,
          padding: 28,
          background: 'rgba(15, 23, 42, 0.35)',
          border: '1px solid rgba(148, 163, 184, 0.18)',
        }}
      >
        <h1
          style={{
            margin: '0 0 8px',
            fontSize: 22,
            fontWeight: 700,
            color: '#f1f5f9',
          }}
        >
          编辑设备
        </h1>
        <p style={{ margin: '0 0 24px', fontSize: 14, color: '#94a3b8' }}>
          {equipment.name} · {equipment.model} · {typeLabel} · ID: {equipment.id}
        </p>

        {/* 提交反馈 */}
        {submitState.isSubmitting ||
        submitState.errorMessage ||
        submitState.successMessage ? (
          <div style={{ marginBottom: 20 }}>
            <FormSubmitFeedback state={submitState} />
            {submitState.hasSubmitted && (
              <div style={{ marginTop: 12 }}>
                <Link
                  href={`/equipment/${id}`}
                  style={{
                    color: '#93c5fd',
                    fontSize: 14,
                    textDecoration: 'underline',
                    marginRight: 16,
                  }}
                >
                  查看设备详情
                </Link>
                <Link
                  href="/equipment"
                  style={{
                    color: '#94a3b8',
                    fontSize: 14,
                    textDecoration: 'underline',
                  }}
                >
                  返回设备列表
                </Link>
              </div>
            )}
          </div>
        ) : null}

        <div style={{ display: 'grid', gap: 20 }}>
          {/* 表单字段 */}
          <section>
            <h2
              style={{
                margin: '0 0 16px',
                fontSize: 16,
                fontWeight: 600,
                color: '#e2e8f0',
              }}
            >
              基本信息
            </h2>
            <div
              style={{
                display: 'grid',
                gap: 16,
                gridTemplateColumns: '1fr 1fr',
              }}
            >
              <FormField label="设备名称" required error={errors.name}>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  disabled={submitState.isSubmitting || submitState.hasSubmitted}
                  style={inputStyle}
                  placeholder="输入设备名称"
                />
              </FormField>
              <FormField label="型号" required error={errors.model}>
                <input
                  type="text"
                  value={formData.model}
                  onChange={(e) => handleFieldChange('model', e.target.value)}
                  disabled={submitState.isSubmitting || submitState.hasSubmitted}
                  style={inputStyle}
                  placeholder="输入型号"
                />
              </FormField>
            </div>
          </section>

          <section>
            <h2
              style={{
                margin: '0 0 16px',
                fontSize: 16,
                fontWeight: 600,
                color: '#e2e8f0',
              }}
            >
              归属信息
            </h2>
            <div
              style={{
                display: 'grid',
                gap: 16,
                gridTemplateColumns: '1fr 1fr',
              }}
            >
              <FormField label="所属门店" required error={errors.store}>
                <input
                  type="text"
                  value={formData.store}
                  onChange={(e) => handleFieldChange('store', e.target.value)}
                  disabled={submitState.isSubmitting || submitState.hasSubmitted}
                  style={inputStyle}
                  placeholder="输入所属门店"
                />
              </FormField>
              <FormField label="供应商" required error={errors.supplier}>
                <input
                  type="text"
                  value={formData.supplier}
                  onChange={(e) => handleFieldChange('supplier', e.target.value)}
                  disabled={submitState.isSubmitting || submitState.hasSubmitted}
                  style={inputStyle}
                  placeholder="输入供应商"
                />
              </FormField>
            </div>
          </section>

          <section>
            <h2
              style={{
                margin: '0 0 16px',
                fontSize: 16,
                fontWeight: 600,
                color: '#e2e8f0',
              }}
            >
              其他信息
            </h2>
            <FormField label="备注" helper="可选填写设备位置、故障记录等信息">
              <textarea
                value={formData.note}
                onChange={(e) => handleFieldChange('note', e.target.value)}
                disabled={submitState.isSubmitting || submitState.hasSubmitted}
                style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
                placeholder="输入备注信息"
              />
            </FormField>
          </section>

          {/* 操作按钮 */}
          <div
            style={{
              display: 'flex',
              gap: 12,
              alignItems: 'center',
              paddingTop: 8,
              borderTop: '1px solid rgba(148,163,184,0.1)',
            }}
          >
            <SubmitButton
              loading={submitState.isSubmitting}
              disabled={submitState.isSubmitting || submitState.hasSubmitted}
              onClick={submit}
              variant="primary"
            >
              保存修改
            </SubmitButton>

            {!submitState.hasSubmitted && (
              <Link href={`/equipment/${id}`}>
                <SubmitButton disabled={submitState.isSubmitting} variant="secondary">
                  取消
                </SubmitButton>
              </Link>
            )}

            {submitState.errorMessage && (
              <SubmitButton onClick={handleErrorDismiss} variant="secondary">
                重试
              </SubmitButton>
            )}
          </div>
        </div>
      </div>
    </main>
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
