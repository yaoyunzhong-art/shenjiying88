/**
 * contracts/new/page.tsx — 新建合同表单页 (ToB 合同管理)
 *
 * B型任务：表单页（含字段验证、表单提交、错误处理、成功回调）
 */
'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  FormPageScaffold,
  validateFormFields,
  useToast,
  type FormPageSubmitResult,
} from '@m5/ui';

import {
  MOCK_CONTRACTS,
  type ContractStatus,
  type ContractType,
  type ContractItem,
} from '../../contracts-data';

import {
  FIELDS,
  type NewContractForm,
} from './contract-form.data';

// ── 选项列表 ──

import {
  CONTRACT_STATUSES,
  CONTRACT_TYPES,
  CONTRACT_STATUS_MAP,
  CONTRACT_TYPE_MAP,
} from '../../contracts-data';

const TYPE_OPTIONS = CONTRACT_TYPES.map((t: ContractType) => ({
  value: t,
  label: CONTRACT_TYPE_MAP[t],
}));

const STATUS_OPTIONS = CONTRACT_STATUSES.map((s: ContractStatus) => ({
  value: s,
  label: CONTRACT_STATUS_MAP[s].label,
}));

// ── 表单字段定义已迁移到 contract-form.data.ts ──

// ── 工具函数 ──

/** 生成下一条合同编号 */
function nextContractNo(): string {
  const existing = MOCK_CONTRACTS.map((c) => {
    const m = c.contractNo.match(/CT-2026-(\d{4})/);
    return m ? Number(m[1]) : 0;
  });
  const max = Math.max(0, ...existing);
  return `CT-2026-${String(max + 1).padStart(4, '0')}`;
}

/** 生成新合同 ID */
function nextId(): string {
  const existing = MOCK_CONTRACTS.map((c) => {
    const m = c.id.match(/co-(\d+)/);
    return m ? Number(m[1]) : 0;
  });
  const max = Math.max(0, ...existing);
  return `co-${String(max + 1).padStart(3, '0')}`;
}

// ── 页面组件 ──

export default function NewContractPage() {
  const router = useRouter();
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(
    async (
      formValues: NewContractForm,
    ): Promise<FormPageSubmitResult<NewContractForm> | null> => {
      // 客户端验证
      const errors = validateFormFields(FIELDS, formValues);
      if (Object.keys(errors).length > 0) {
        toast.error(
          `表单验证失败：${Object.values(errors).join('；')}`,
          { durationMs: 4000 },
        );
        return null;
      }

      // 模拟日期顺序交叉验证
      if (formValues.startDate && formValues.endDate) {
        if (formValues.endDate < formValues.startDate) {
          toast.error('截止日期不能早于生效日期', { durationMs: 3000 });
          return null;
        }
      }

      setSubmitting(true);
      try {
        // 模拟 API 提交延迟
        await new Promise((r) => setTimeout(r, 800));

        // 构造新合同对象并插入 mock 数据
        const newContract: ContractItem = {
          id: nextId(),
          contractNo: nextContractNo(),
          title: formValues.title.trim(),
          companyName: formValues.companyName.trim(),
          companyId: 'c-new',
          type: formValues.type as ContractType,
          status: formValues.status as ContractStatus,
          amount: Math.round(Number(formValues.amount.replace(/,/g, ''))),
          paid: 0,
          startDate: formValues.startDate,
          endDate: formValues.endDate,
          signatory: formValues.signatory.trim(),
          renewalCount: 0,
          updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
          description: formValues.description.trim() || undefined,
        };

        // 将新合同插入 mock 数据头部
        MOCK_CONTRACTS.unshift(newContract);

        return {
          data: formValues,
          message: `合同 ${newContract.contractNo} 创建成功`,
        };
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : '提交失败，请稍后重试';
        toast.error(msg, { durationMs: 4000 });
        return null;
      } finally {
        setSubmitting(false);
      }
    },
    [toast],
  );

  const handleSuccess = useCallback(
    (_result: FormPageSubmitResult<NewContractForm>) => {
      toast.success('合同创建成功，即将跳转合同列表', { durationMs: 2500 });
      setTimeout(() => router.push('/contracts'), 1200);
    },
    [router, toast],
  );

  return (
    <FormPageScaffold<NewContractForm>
      meta={{
        title: '新建合同',
        description:
          '填写合同基本信息，提交后将自动生成合同编号并跳转至合同列表。合同金额单位为元。',
      }}
      fields={FIELDS}
      onSubmit={handleSubmit}
      onSuccess={handleSuccess}
      submitLabel={submitting ? '提交中...' : '创建合同'}
      backUrl="/contracts"
      disabled={submitting}
    />
  );
}
