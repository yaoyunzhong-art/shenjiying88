/**
 * contracts/[id]/edit/page.tsx — ToB 合同编辑页面 (从详情跳转)
 *
 * B型任务：表单编辑页（含字段验证、回填、提交、错误处理）
 * 角色视角: 🔧 运营商管理员
 */
'use client';

import { useParams, useRouter } from 'next/navigation';
import React, { useCallback, useMemo, useState } from 'react';
import {
  FormPageScaffold,
  validateFormFields,
  useToast,
  type FormPageField,
  type FormPageScaffoldMeta,
  type FormPageSubmitResult,
} from '@m5/ui';

import {
  MOCK_CONTRACTS,
  CONTRACT_STATUSES,
  CONTRACT_TYPES,
  CONTRACT_STATUS_MAP,
  CONTRACT_TYPE_MAP,
  type ContractStatus,
  type ContractType,
} from '../../../contracts-data';

// ── 编辑表单类型 ──

interface EditContractForm extends Record<string, string> {
  title: string;
  type: string;
  status: string;
  amount: string;
  startDate: string;
  endDate: string;
  signatory: string;
  description: string;
}

// ── 构建字段定义（动态注入 initialValue） ──

function buildEditFields(
  contract: EditContractForm | null,
): FormPageField<EditContractForm>[] {
  const iv = contract ?? null;

  return [
    {
      key: 'title',
      label: '合同名称',
      type: 'text' as const,
      required: true,
      placeholder: '输入合同名称',
      initialValue: iv?.title ?? '',
      rules: [
        { validate: (v: unknown) => (String(v).trim() ? null : '合同名称不能为空') },
      ],
    },
    {
      key: 'type',
      label: '合同类型',
      type: 'select' as const,
      required: true,
      initialValue: iv?.type ?? '',
      options: CONTRACT_TYPES.map((t: ContractType) => ({
        value: t,
        label: CONTRACT_TYPE_MAP[t],
      })),
    },
    {
      key: 'status',
      label: '合同状态',
      type: 'select' as const,
      required: true,
      initialValue: iv?.status ?? '',
      options: CONTRACT_STATUSES.map((s: ContractStatus) => ({
        value: s,
        label: CONTRACT_STATUS_MAP[s].label,
      })),
    },
    {
      key: 'amount',
      label: '合同金额（元）',
      type: 'text' as const,
      required: true,
      placeholder: '如: 100000',
      initialValue: iv?.amount ?? '',
      rules: [
        {
          validate: (v: unknown) => {
            const num = Number(String(v).replace(/,/g, ''));
            if (!String(v).trim()) return '合同金额不能为空';
            if (isNaN(num) || num <= 0) return '合同金额必须大于 0';
            return null;
          },
        },
      ],
    },
    {
      key: 'startDate',
      label: '生效日期',
      type: 'date' as const,
      required: true,
      initialValue: iv?.startDate ?? '',
    },
    {
      key: 'endDate',
      label: '截止日期',
      type: 'date' as const,
      required: true,
      initialValue: iv?.endDate ?? '',
    },
    {
      key: 'signatory',
      label: '签约人',
      type: 'text' as const,
      required: true,
      placeholder: '签约人姓名',
      initialValue: iv?.signatory ?? '',
      rules: [
        { validate: (v: unknown) => (String(v).trim() ? null : '签约人不能为空') },
      ],
    },
    {
      key: 'description',
      label: '备注说明',
      type: 'textarea' as const,
      required: false,
      placeholder: '可选备注信息',
      initialValue: iv?.description ?? '',
    },
  ];
}

// ── 页面组件 ──

export default function EditContractPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const id = params.id as string;

  const contract = useMemo(() => MOCK_CONTRACTS.find((c) => c.id === id), [id]);

  const initialForm: EditContractForm | null = useMemo(() => {
    if (!contract) return null;
    return {
      title: contract.title,
      type: contract.type,
      status: contract.status,
      amount: String(contract.amount),
      startDate: contract.startDate,
      endDate: contract.endDate,
      signatory: contract.signatory,
      description: contract.description ?? '',
    };
  }, [contract]);

  const fields = useMemo(() => buildEditFields(initialForm), [initialForm]);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(
    async (formValues: EditContractForm): Promise<FormPageSubmitResult<EditContractForm> | null> => {
      // 日期交叉验证（在 validateFormFields 标准验证之后）
      if (formValues.startDate && formValues.endDate) {
        if (formValues.endDate < formValues.startDate) {
          toast.error('截止日期不能早于生效日期', { durationMs: 3000 });
          return null;
        }
      }

      setSubmitting(true);
      try {
        await new Promise((r) => setTimeout(r, 600));

        if (contract) {
          contract.title = formValues.title.trim();
          contract.type = formValues.type as ContractType;
          contract.status = formValues.status as ContractStatus;
          contract.amount = Math.round(Number(formValues.amount.replace(/,/g, '')));
          contract.startDate = formValues.startDate;
          contract.endDate = formValues.endDate;
          contract.signatory = formValues.signatory.trim();
          contract.description = formValues.description.trim() || undefined;
          contract.updatedAt = new Date().toISOString().replace('T', ' ').slice(0, 19);
        }

        return {
          data: formValues,
          message: '合同信息更新成功',
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : '提交失败，请稍后重试';
        toast.error(msg, { durationMs: 4000 });
        return null;
      } finally {
        setSubmitting(false);
      }
    },
    [contract, toast],
  );

  const handleSuccess = useCallback(
    (_result: FormPageSubmitResult<EditContractForm>) => {
      toast.success('合同更新成功，即将返回详情', { durationMs: 2500 });
      setTimeout(() => router.push(`/contracts/${id}`), 1200);
    },
    [router, id, toast],
  );

  if (!contract) {
    return (
      <div style={{ textAlign: 'center', padding: 60, color: '#64748b' }}>
        <p style={{ fontSize: 18 }}>未找到合同 (ID: {id})</p>
        <button
          onClick={() => router.push('/contracts')}
          style={{
            marginTop: 16,
            padding: '8px 20px',
            borderRadius: 8,
            border: '1px solid rgba(148,163,184,0.2)',
            background: 'transparent',
            color: '#94a3b8',
            cursor: 'pointer',
          }}
        >
          返回合同列表
        </button>
      </div>
    );
  }

  return (
    <FormPageScaffold<EditContractForm>
      meta={
        {
          title: '编辑合同',
          description: `修改合同 "${contract.title}" (${contract.contractNo}) 的基本信息。`,
        } as FormPageScaffoldMeta
      }
      fields={fields}
      onSubmit={handleSubmit}
      onSuccess={handleSuccess}
      submitLabel={submitting ? '保存中...' : '保存修改'}
      backUrl={`/contracts/${id}`}
      disabled={submitting}
    />
  );
}
