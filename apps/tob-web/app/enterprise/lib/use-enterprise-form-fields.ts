/**
 * use-enterprise-form-fields.ts
 *
 * 企业登录/注册页共享的 form fields 状态 hook。
 *
 * 由来：login/register 两个页面都要管一组字段值 + 字段错误 + 字段输入时清错，
 *       但实现路径两套（register 用 handleChange 工厂+delete key；login 用
 *       多个 handleXxxChange+set undefined），delete vs set-undefined 的
 *       语义差异让 Object.keys(fieldErrors).length 行为漂移。
 * 集中后：单一 hook，统一采用 `delete key` 策略；测试用纯函数 helper 守护。
 */

import { useCallback, useState } from 'react';
import type { ChangeEvent } from 'react';
import type { Validator } from './enterprise-validators';

// ─── 纯函数 helper（不依赖 React，便于无 React 测试栈下测试） ───

/**
 * 清除字段错误：把 prev[field] 删掉（新对象），prev 不含该 key 则原样返回。
 * 策略：delete key（而非 set undefined），让 Object.keys() 行为与字段键一致。
 */
export function clearFieldError<K extends string>(
  prev: Partial<Record<K, string>>,
  field: K
): Partial<Record<K, string>> {
  if (!prev[field]) return prev;
  const { [field]: _removed, ...rest } = prev;
  return rest as Partial<Record<K, string>>;
}

/** 浅拷贝并设置字段值（不可变更新） */
export function setFieldValue<T extends Record<string, string>>(
  prev: T,
  field: keyof T,
  value: string
): T {
  return { ...prev, [field]: value };
}

/**
 * 跑一轮校验，返回 {字段: 错误信息}，无错的字段不会出现在结果中。
 * 由 hook 内部调用，但抽离为纯函数后可在测试中独立验证。
 */
export function runFieldValidation<T extends Record<string, string>>(
  values: T,
  rules: Partial<Record<keyof T, Validator>>
): Partial<Record<keyof T, string>> {
  const next: Partial<Record<keyof T, string>> = {};
  (Object.keys(rules) as (keyof T)[]).forEach((key) => {
    const rule = rules[key];
    if (!rule) return;
    const value = values[key] as string;
    const err = rule(value, values as unknown as Record<string, string>);
    if (err) next[key] = err;
  });
  return next;
}

// ─── Hook ─────────────────────────────────────────────

export interface EnterpriseFormFieldsApi<T extends Record<string, string>> {
  values: T;
  fieldErrors: Partial<Record<keyof T, string>>;
  /** handleChange('email') 返回一个 (e) => void，绑定到 input onChange */
  handleChange: (field: keyof T) => (e: ChangeEvent<HTMLInputElement>) => void;
  /**
   * validate({ email, password }) 跑一轮校验，写入 fieldErrors，
   * 返回 true 表示无错。
   */
  validate: (rules: Partial<Record<keyof T, Validator>>) => boolean;
  /** 提交前清空所有错误状态 */
  clearAllErrors: () => void;
  /** 兜底：setFieldErrors 直接写入，submit 失败时用 */
  setFieldErrors: React.Dispatch<React.SetStateAction<Partial<Record<keyof T, string>>>>;
}

export function useEnterpriseFormFields<T extends Record<string, string>>(
  initial: T
): EnterpriseFormFieldsApi<T> {
  const [values, setValues] = useState<T>(initial);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof T, string>>>({});

  const handleChange = useCallback(
    (field: keyof T) => (e: ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setValues((prev) => setFieldValue(prev, field, value));
      setFieldErrors((prev) =>
        clearFieldError(prev as Partial<Record<string, string>>, field as string) as Partial<Record<keyof T, string>>
      );
    },
    []
  );

  const validate = useCallback(
    (rules: Partial<Record<keyof T, Validator>>) => {
      const next = runFieldValidation(values, rules);
      setFieldErrors(next);
      return Object.keys(next).length === 0;
    },
    [values]
  );

  const clearAllErrors = useCallback(() => setFieldErrors({}), []);

  return {
    values,
    fieldErrors,
    handleChange,
    validate,
    clearAllErrors,
    setFieldErrors,
  };
}
