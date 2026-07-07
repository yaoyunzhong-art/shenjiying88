/**
 * contracts/new 合同表单字段定义
 *
 * 导出 FIELDS 供 page.tsx 和 page.test.ts 共享使用，
 * 避免从 'use client' 页面直接导出非路由成员导致 TS 约束冲突 (TS2344)
 */
import type { FormPageField } from '@m5/ui';

import {
  CONTRACT_STATUSES,
  CONTRACT_TYPES,
  CONTRACT_STATUS_MAP,
  CONTRACT_TYPE_MAP,
} from '../../contracts-data';

export interface NewContractForm extends Record<string, string> {
  title: string;
  companyName: string;
  signatory: string;
  type: string;
  status: string;
  amount: string;
  startDate: string;
  endDate: string;
  description: string;
}

export const FIELDS: FormPageField<NewContractForm>[] = [
  {
    key: 'title',
    label: '合同名称',
    required: true,
    placeholder: '请输入合同名称（4-120 字符）',
    rules: [
      {
        validate: (v: unknown) => {
          const trimmed = typeof v === "string" ? v.trim() : "";
          if (trimmed.length === 0) return '合同名称不能为空';
          if (trimmed.length < 4) return '合同名称至少 4 个字符';
          if (trimmed.length > 120) return '合同名称最多 120 个字符';
          return null;
        },
      },
    ],
  },
  {
    key: 'companyName',
    label: '签约公司',
    required: true,
    placeholder: '请输入公司全称',
    rules: [
      {
        validate: (v: unknown) => {
          const trimmed = typeof v === "string" ? v.trim() : "";
          if (trimmed.length === 0) return '公司名称不能为空';
          if (trimmed.length < 2) return '公司名称至少 2 个字符';
          return null;
        },
      },
    ],
  },
  {
    key: 'signatory',
    label: '签约人',
    required: true,
    placeholder: '请输入签约人姓名',
    rules: [
      {
        validate: (v: unknown) => {
          const trimmed = typeof v === "string" ? v.trim() : "";
          if (trimmed.length === 0) return '签约人不能为空';
          if (trimmed.length < 2) return '签约人至少 2 个字符';
          return null;
        },
      },
    ],
  },
  {
    key: 'type',
    label: '合同类型',
    required: true,
    options: CONTRACT_TYPES.map((t) => ({
      value: t,
      label: CONTRACT_TYPE_MAP[t as keyof typeof CONTRACT_TYPE_MAP] ?? t,
    })),
  },
  {
    key: 'status',
    label: '合同状态',
    required: true,
    options: CONTRACT_STATUSES.map((s) => ({
      value: s,
      label: CONTRACT_STATUS_MAP[s as keyof typeof CONTRACT_STATUS_MAP]?.label ?? s,
    })),
  },
  {
    key: 'amount',
    label: '合同金额（元）',
    required: true,
    placeholder: '请输入合同金额',
    rules: [
      {
        validate: (v: unknown) => {
          const sv = typeof v === 'string' ? v : '';
          const num = Number(sv);
          if (!/^\d+$/.test(sv)) return '请输入有效的正数金额';
          if (num < 0) return '请输入有效的正数金额';
          if (num > 99990000) return '金额不能超过 9999 万';
          return null;
        },
      },
    ],
  },
  {
    key: 'startDate',
    label: '合同开始日期',
    required: true,
    placeholder: 'YYYY-MM-DD',
    rules: [
      {
        validate: (v: unknown) => {
          const sv = typeof v === 'string' ? v : '';
          if (!/^\d{4}-\d{2}-\d{2}$/.test(sv)) return '请输入有效的开始日期 (YYYY-MM-DD)';
          return null;
        },
      },
    ],
  },
  {
    key: 'endDate',
    label: '合同结束日期',
    required: true,
    placeholder: 'YYYY-MM-DD',
    rules: [
      {
        validate: (v: unknown) => {
          const sv = typeof v === 'string' ? v : '';
          if (!/^\d{4}-\d{2}-\d{2}$/.test(sv)) return '请输入有效的结束日期 (YYYY-MM-DD)';
          return null;
        },
      },
    ],
  },
  {
    key: 'description',
    label: '合同描述',
    required: false,
    placeholder: '可选，最多 500 个字符',
    rules: [
      {
        validate: (v: unknown) => {
          if (typeof v === 'string' && v.length > 500) return '描述最多 500 个字符';
          return null;
        },
      },
    ],
  },
];
