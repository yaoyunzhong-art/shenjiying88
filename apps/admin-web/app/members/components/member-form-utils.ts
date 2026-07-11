/**
 * 会员表单工具函数集合
 * 包含类型定义、验证规则、格式化工具等共享逻辑
 */

import type { CSSProperties } from 'react';

// ---- 类型定义 ----

export interface MemberFormField<T = string> {
  key: keyof T;
  label: string;
  required?: boolean;
  type: 'text' | 'number' | 'email' | 'tel' | 'date' | 'select' | 'textarea' | 'checkbox';
  placeholder?: string;
  helper?: string;
  options?: Array<{ value: string; label: string }>;
  min?: number;
  max?: number;
  step?: number;
  validation?: (value: string) => string | undefined;
}

export interface MemberFormSection {
  title: string;
  description?: string;
  fields: MemberFormField[];
}

export interface FormValidationResult {
  isValid: boolean;
  errors: Record<string, string | undefined>;
}

// ---- 表单验证规则 ----

export const VALIDATORS = {
  required: (value: string, label: string): string | undefined => {
    if (!value || !value.trim()) return `${label}不能为空`;
    return undefined;
  },

  phone: (value: string): string | undefined => {
    if (!value) return undefined;
    if (!/^[\d\s\-+()]{6,20}$/.test(value)) return '电话号码格式不正确';
    return undefined;
  },

  email: (value: string): string | undefined => {
    if (!value) return undefined;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return '邮箱格式不正确';
    return undefined;
  },

  maxLength: (max: number) => (value: string, label: string): string | undefined => {
    if (value && value.length > max) return `${label}不能超过${max}个字符`;
    return undefined;
  },

  minLength: (min: number) => (value: string, label: string): string | undefined => {
    if (value && value.length < min) return `${label}至少需要${min}个字符`;
    return undefined;
  },

  numeric: (value: string, label: string): string | undefined => {
    if (!value) return undefined;
    if (isNaN(Number(value))) return `${label}必须为数字`;
    return undefined;
  },

  positiveNumber: (value: string, label: string): string | undefined => {
    if (!value) return undefined;
    const num = Number(value);
    if (isNaN(num) || num <= 0) return `${label}必须大于0`;
    return undefined;
  },

  range: (min: number, max: number) => (value: string, label: string): string | undefined => {
    if (!value) return undefined;
    const num = Number(value);
    if (isNaN(num) || num < min || num > max) return `${label}范围应为 ${min} 到 ${max}`;
    return undefined;
  },

  date: (value: string): string | undefined => {
    if (!value) return undefined;
    const parsed = new Date(value);
    if (isNaN(parsed.getTime())) return '日期格式不正确';
    if (parsed > new Date()) return '日期不能是未来时间';
    return undefined;
  },

  tierKey: (value: string): string | undefined => {
    if (!value || !value.trim()) return '等级标识不能为空';
    if (!/^[a-z_]{2,20}$/.test(value.trim())) return '标识格式：2-20位小写字母和下划线';
    return undefined;
  },
};

// ---- 表单验证工具 ----

export function validateFormField(
  value: string,
  rules: Array<(value: string, label: string) => string | undefined>,
  label: string
): string | undefined {
  for (const rule of rules) {
    const error = rule(value, label);
    if (error) return error;
  }
  return undefined;
}

export function validateForm<T extends Record<string, string>>(
  data: T,
  fieldDefinitions: MemberFormField[],
): FormValidationResult {
  const errors: Record<string, string | undefined> = {};

  for (const field of fieldDefinitions) {
    const value = data[field.key as keyof T] ?? '';
    const fieldErrors: Array<(value: string, label: string) => string | undefined> = [];

    if (field.required) {
      fieldErrors.push(VALIDATORS.required);
    }

    if (field.validation) {
      fieldErrors.push(field.validation);
    }

    if (fieldErrors.length > 0) {
      const error = validateFormField(String(value), fieldErrors, field.label);
      if (error) errors[field.key as string] = error;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

// ---- 格式化工具 ----

export function formatPhone(value: string): string {
  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
  }
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return value;
}

export function formatDateForDisplay(iso: string): string {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  } catch {
    return iso;
  }
}

export function formatDateForInput(iso: string): string {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().slice(0, 10);
  } catch {
    return '';
  }
}

export function formatDateTime(iso: string): string {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export function formatCurrency(amount: number): string {
  if (amount >= 100000000) return `¥${(amount / 100000000).toFixed(2)}亿`;
  if (amount >= 10000) return `¥${(amount / 10000).toFixed(1)}万`;
  return `¥${amount.toLocaleString()}`;
}

export function formatNumber(n: number): string {
  return n.toLocaleString();
}

export function percentage(p: number): string {
  return `${(p * 100).toFixed(1)}%`;
}

export function truncateMiddle(value: string, edge = 10): string {
  if (value.length <= edge * 2 + 3) return value;
  return `${value.slice(0, edge)}...${value.slice(-edge)}`;
}

export function tierOrder(tier: string): number {
  const order: Record<string, number> = {
    diamond: 5,
    gold: 4,
    silver: 3,
    bronze: 2,
    standard: 1,
  };
  return order[tier] ?? 0;
}

export function pointsColor(points: number): string {
  if (points >= 150000) return '#f0abfc';
  if (points >= 80000) return '#fbbf24';
  if (points >= 30000) return '#94a3b8';
  return '#cbd5e1';
}

export function lifecycleColor(stage: string): string {
  const map: Record<string, string> = {
    new: '#fbbf24',
    growing: '#4ade80',
    loyal: '#818cf8',
    declining: '#fb923c',
    lost: '#f87171',
  };
  return map[stage] ?? '#94a3b8';
}

export function taskPriorityColor(priority: 'high' | 'medium' | 'low'): string {
  if (priority === 'high') return '#fca5a5';
  if (priority === 'medium') return '#fde68a';
  return '#93c5fd';
}

export function taskStatusColor(status: 'queued' | 'dispatched' | 'completed'): string {
  if (status === 'completed') return '#86efac';
  if (status === 'dispatched') return '#93c5fd';
  return '#fcd34d';
}

// ---- 通用样式工厂 ----

export function createInputStyle(hasError: boolean): CSSProperties {
  return {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 10,
    border: `1px solid ${hasError ? '#ef4444' : 'rgba(148, 163, 184, 0.2)'}`,
    background: 'rgba(15, 23, 42, 0.4)',
    color: '#f1f5f9',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  };
}

export function createFormInputStyle(hasError: boolean): CSSProperties {
  return {
    width: '100%',
    padding: '8px 12px',
    borderRadius: 8,
    border: `1px solid ${hasError ? '#ef4444' : 'rgba(148,163,184,0.2)'}`,
    background: 'rgba(30,41,59,0.8)',
    color: '#e2e8f0',
    fontSize: 13,
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  };
}

export function createActionBtnStyle(variant: 'primary' | 'warning' | 'danger'): CSSProperties {
  const base: CSSProperties = {
    fontSize: 13,
    padding: '6px 16px',
    borderRadius: 8,
    border: '1px solid transparent',
    cursor: 'pointer',
    fontWeight: 500,
  };
  if (variant === 'primary') {
    return {
      ...base,
      background: 'rgba(59,130,246,0.16)',
      borderColor: 'rgba(96,165,250,0.3)',
      color: '#dbeafe',
    };
  }
  if (variant === 'warning') {
    return {
      ...base,
      background: 'rgba(251,191,36,0.12)',
      borderColor: 'rgba(251,191,36,0.3)',
      color: '#fde68a',
    };
  }
  return {
    ...base,
    background: 'rgba(239,68,68,0.14)',
    borderColor: 'rgba(239,68,68,0.25)',
    color: '#fecaca',
  };
}

export function createMiniBtnStyle(variant: 'primary' | 'danger'): CSSProperties {
  return {
    padding: '3px 10px',
    fontSize: 12,
    borderRadius: 6,
    border: '1px solid transparent',
    cursor: 'pointer',
    background: variant === 'primary'
      ? 'rgba(59,130,246,0.12)'
      : 'rgba(239,68,68,0.12)',
    borderColor: variant === 'primary'
      ? 'rgba(96,165,250,0.25)'
      : 'rgba(239,68,68,0.2)',
    color: variant === 'primary' ? '#dbeafe' : '#fecaca',
  };
}

export function createDialogBtnStyle(isPrimary: boolean): CSSProperties {
  return {
    padding: '6px 16px',
    borderRadius: 8,
    fontSize: 13,
    cursor: 'pointer',
    border: `1px solid ${isPrimary ? 'rgba(96,165,250,0.3)' : 'rgba(148,163,184,0.2)'}`,
    background: isPrimary ? 'rgba(59,130,246,0.16)' : 'rgba(148,163,184,0.1)',
    color: isPrimary ? '#dbeafe' : '#94a3b8',
  };
}

export function createPillStyle(color: string, background: string): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '4px 10px',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
    color,
    background,
  };
}

export function createOperationCardStyle(): CSSProperties {
  return {
    borderRadius: 12,
    padding: 16,
    background: 'rgba(30, 41, 59, 0.45)',
    border: '1px solid rgba(148, 163, 184, 0.14)',
    display: 'grid',
    gap: 12,
    alignContent: 'start',
  };
}

export function createCardSectionStyle(): CSSProperties {
  return {
    borderRadius: 16,
    padding: 24,
    background: 'rgba(15, 23, 42, 0.35)',
    border: '1px solid rgba(148, 163, 184, 0.18)',
  };
}

export function createCardRowStyle(): CSSProperties {
  return {
    display: 'grid',
    gap: 12,
    gridTemplateColumns: '1fr 1fr',
    background: 'rgba(30, 41, 59, 0.6)',
    borderRadius: 12,
    padding: 16,
  };
}

export function createStatsGridStyle(columns = 4): CSSProperties {
  return {
    display: 'grid',
    gap: 14,
    gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
    marginBottom: 20,
  };
}

export function createStatCardStyle(borderColor?: string): CSSProperties {
  return {
    borderRadius: 16,
    padding: 18,
    background: 'rgba(15, 23, 42, 0.38)',
    border: `1px solid ${borderColor ?? 'rgba(148, 163, 184, 0.18)'}`,
  };
}
