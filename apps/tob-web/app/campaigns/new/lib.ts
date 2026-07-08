/**
 * campaigns/new/lib.ts — 活动创建表单工具函数与类型
 *
 * 与 page.tsx 分离，避免 Next.js App Router 对 page 的非标准导出限制。
 */

export interface CampaignFormValues {
  name: string;
  type: string;
  channel: string;
  budget: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface CampaignFormErrors {
  name?: string;
  type?: string;
  channel?: string;
  budget?: string;
  startDate?: string;
  endDate?: string;
}

export type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error';

export function validateCampaignForm(values: CampaignFormValues): CampaignFormErrors {
  const errors: CampaignFormErrors = {};

  if (!values.name || values.name.trim().length === 0) {
    errors.name = '活动名称为必填项';
  } else if (values.name.trim().length > 50) {
    errors.name = '活动名称不能超过50个字符';
  }

  if (!values.type) {
    errors.type = '请选择活动类型';
  }

  if (!values.channel) {
    errors.channel = '请选择投放渠道';
  }

  if (!values.budget || values.budget.trim().length === 0) {
    errors.budget = '预算为必填项';
  } else {
    const budgetNum = Number(values.budget);
    if (isNaN(budgetNum) || budgetNum < 1000) {
      errors.budget = '预算金额不能小于 ¥1,000';
    } else if (budgetNum > 10_000_000) {
      errors.budget = '预算金额不能超过 ¥10,000,000';
    }
  }

  if (!values.startDate) {
    errors.startDate = '请选择开始日期';
  }

  if (!values.endDate) {
    errors.endDate = '请选择结束日期';
  }

  if (values.startDate && values.endDate && values.endDate < values.startDate) {
    errors.endDate = '结束日期不能早于开始日期';
  }

  return errors;
}

export function isFormValid(errors: CampaignFormErrors): boolean {
  return Object.keys(errors).length === 0;
}

export async function submitCampaignForm(
  values: CampaignFormValues,
  signal?: AbortSignal,
): Promise<{ ok: boolean; id?: string; error?: string }> {
  // 模拟网络延迟 500-1500ms
  const delay = 500 + Math.random() * 1000;
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, delay);
    if (signal) {
      if (signal.aborted) {
        clearTimeout(timer);
        reject(new DOMException('Aborted', 'AbortError'));
        return;
      }
      signal.addEventListener(
        'abort',
        () => {
          clearTimeout(timer);
          reject(new DOMException('Aborted', 'AbortError'));
        },
        { once: true },
      );
    }
  });

  // 模拟 5% 的随机失败
  if (Math.random() < 0.05) {
    return { ok: false, error: '服务器繁忙，请稍后重试' };
  }

  return { ok: true, id: `cmp-${Date.now()}` };
}
