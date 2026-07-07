/**
 * 新建销售报表表单页 — Reports New Form Page (Next.js App Router Page)
 * 角色视角: 👔店长 / 📊运营 / 💰财务
 * 功能: 表单验证、提交、错误处理、预览
 */
'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

/* ── 报表类型选项 ── */
const REPORT_TYPE_OPTIONS = [
  { value: 'daily', label: '日报' },
  { value: 'weekly', label: '周报' },
  { value: 'monthly', label: '月报' },
  { value: 'quarterly', label: '季报' },
  { value: 'yearly', label: '年报' },
  { value: 'custom', label: '自定义' },
] as const;

type ReportTypeValue = (typeof REPORT_TYPE_OPTIONS)[number]['value'];

/* ── 表单数据 ── */
interface ReportFormData {
  title: string;
  type: ReportTypeValue;
  period: string;
  includeMetrics: string[];
  notes: string;
}

/* ── 表单错误 ── */
interface FormErrors {
  title?: string;
  type?: string;
  period?: string;
  includeMetrics?: string;
}

/* ── 样式 ── */
const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: 720,
    margin: '0 auto',
    padding: '32px 24px',
  },
  header: {
    marginBottom: 32,
  },
  backLink: {
    color: '#60a5fa',
    textDecoration: 'none',
    fontSize: 13,
    fontWeight: 600,
    display: 'inline-block',
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    color: '#f1f5f9',
    margin: 0,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 6,
  },
  formGroup: {
    marginBottom: 22,
  },
  label: {
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    color: '#cbd5e1',
    marginBottom: 6,
  },
  required: {
    color: '#ef4444',
    marginLeft: 2,
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 8,
    border: '1px solid rgba(148,163,184,0.2)',
    fontSize: 14,
    color: '#e2e8f0',
    background: 'rgba(15,23,42,0.4)',
    outline: 'none',
    boxSizing: 'border-box' as const,
    transition: 'border-color 0.15s',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  textarea: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 8,
    border: '1px solid rgba(148,163,184,0.2)',
    fontSize: 14,
    color: '#e2e8f0',
    background: 'rgba(15,23,42,0.4)',
    outline: 'none',
    fontFamily: 'inherit',
    resize: 'vertical' as const,
    minHeight: 80,
    boxSizing: 'border-box' as const,
  },
  select: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 8,
    border: '1px solid rgba(148,163,184,0.2)',
    fontSize: 14,
    color: '#e2e8f0',
    background: 'rgba(15,23,42,0.4)',
    outline: 'none',
    cursor: 'pointer',
    boxSizing: 'border-box' as const,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
  },
  hint: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 4,
  },
  checkboxGroup: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 12,
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center' as const,
    gap: 6,
    fontSize: 13,
    color: '#cbd5e1',
    cursor: 'pointer',
  },
  checkbox: {
    accentColor: '#3b82f6',
    width: 16,
    height: 16,
    cursor: 'pointer',
  },
  actions: {
    display: 'flex',
    gap: 12,
    marginTop: 32,
    paddingTop: 24,
    borderTop: '1px solid rgba(148,163,184,0.1)',
  },
  submitBtn: {
    padding: '10px 28px',
    borderRadius: 8,
    border: 'none',
    background: '#3b82f6',
    color: '#fff',
    fontWeight: 600,
    fontSize: 14,
    cursor: 'pointer',
    transition: 'opacity 0.15s',
  },
  cancelBtn: {
    padding: '10px 28px',
    borderRadius: 8,
    border: '1px solid rgba(148,163,184,0.2)',
    background: 'transparent',
    color: '#94a3b8',
    fontWeight: 500,
    fontSize: 14,
    cursor: 'pointer',
  },
  feedback: {
    padding: '12px 16px',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 500,
    marginBottom: 20,
  },
  feedbackSuccess: {
    background: 'rgba(34,197,94,0.12)',
    border: '1px solid rgba(34,197,94,0.3)',
    color: '#4ade80',
  },
  feedbackError: {
    background: 'rgba(239,68,68,0.12)',
    border: '1px solid rgba(239,68,68,0.3)',
    color: '#f87171',
  },
};

/* ── 可用指标选项 ── */
const METRIC_OPTIONS = [
  { value: 'sales', label: '销售额' },
  { value: 'orders', label: '订单数' },
  { value: 'avgOrderValue', label: '客单价' },
  { value: 'conversionRate', label: '转化率' },
  { value: 'memberGrowth', label: '会员增长' },
  { value: 'topProducts', label: '热销商品' },
  { value: 'categoryDistribution', label: '品类分布' },
  { value: 'hourlyDistribution', label: '时段分布' },
] as const;

/* ── 表单验证 ── */
function validateForm(data: ReportFormData): FormErrors {
  const errors: FormErrors = {};
  const title = (data.title || '').trim();
  if (!title) {
    errors.title = '请输入报表标题';
  } else if (title.length < 2) {
    errors.title = '标题至少2个字符';
  } else if (title.length > 60) {
    errors.title = '标题不能超过60个字符';
  }

  if (!data.type) {
    errors.type = '请选择报表类型';
  }

  const period = (data.period || '').trim();
  if (!period) {
    errors.period = '请填写报表周期';
  } else if (period.length > 50) {
    errors.period = '周期描述不能超过50个字符';
  }

  if (!data.includeMetrics || data.includeMetrics.length === 0) {
    errors.includeMetrics = '请至少选择一个统计指标';
  }

  return errors;
}

/* ── 模拟提交 ── */
async function submitReport(data: ReportFormData): Promise<{ success: boolean; id?: string; error?: string }> {
  // 模拟异步提交
  await new Promise(r => setTimeout(r, 800));
  if (Math.random() > 0.1) {
    return { success: true, id: String(Date.now()) };
  }
  return { success: false, error: '服务器繁忙，请稍后重试' };
}

/* ── 页面组件 ── */
export default function ReportsNewFormPage() {
  const router = useRouter();
  const [form, setForm] = useState<ReportFormData>({
    title: '',
    type: '' as ReportTypeValue,
    period: '',
    includeMetrics: [],
    notes: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleChange = useCallback(<K extends keyof ReportFormData>(field: K, value: ReportFormData[K]) => {
    setForm(prev => ({ ...prev, [field]: value }));
    // 输入时清除对应错误
    setErrors(prev => ({ ...prev, [field]: undefined }));
    setFeedback(null);
  }, []);

  const handleMetricToggle = useCallback((metric: string) => {
    setForm(prev => {
      const exists = prev.includeMetrics.includes(metric);
      const updated = exists
        ? prev.includeMetrics.filter(m => m !== metric)
        : [...prev.includeMetrics, metric];
      return { ...prev, includeMetrics: updated };
    });
    setErrors(prev => ({ ...prev, includeMetrics: undefined }));
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const validationErrors = validateForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    try {
      const result = await submitReport(form);
      if (result.success) {
        setFeedback({ type: 'success', message: `报表"${form.title}"创建成功！即将跳转...` });
        setTimeout(() => {
          router.push(`/reports/${result.id}`);
        }, 1500);
      } else {
        setFeedback({ type: 'error', message: result.error || '创建失败，请重试' });
      }
    } catch {
      setFeedback({ type: 'error', message: '提交异常，请检查网络后重试' });
    } finally {
      setSubmitting(false);
    }
  }, [form, router]);

  const metricLabels = Object.fromEntries(METRIC_OPTIONS.map(m => [m.value, m.label]));

  return (
    <div style={styles.container}>
      {/* 页面标题 */}
      <div style={styles.header}>
        <a href="/reports" style={styles.backLink}>← 返回报表列表</a>
        <h1 style={styles.title}>新建报表</h1>
        <p style={styles.subtitle}>填写以下信息生成销售统计分析报表</p>
      </div>

      {/* 反馈提示 */}
      {feedback && (
        <div
          style={{
            ...styles.feedback,
            ...(feedback.type === 'success' ? styles.feedbackSuccess : styles.feedbackError),
          }}
        >
          {feedback.type === 'success' ? '✅ ' : '❌ '}
          {feedback.message}
        </div>
      )}

      {/* 表单 */}
      <form onSubmit={handleSubmit} noValidate>
        {/* 报表标题 */}
        <div style={styles.formGroup}>
          <label style={styles.label}>
            报表标题<span style={styles.required}>*</span>
          </label>
          <input
            style={{ ...styles.input, ...(errors.title ? styles.inputError : {}) }}
            type="text"
            placeholder="例：2026年7月销售月报"
            value={form.title}
            onChange={e => handleChange('title', e.target.value)}
            maxLength={60}
            disabled={submitting}
          />
          {errors.title && <div style={styles.errorText}>{errors.title}</div>}
          <div style={styles.hint}>{form.title.length}/60 字符</div>
        </div>

        {/* 报表类型 */}
        <div style={styles.formGroup}>
          <label style={styles.label}>
            报表类型<span style={styles.required}>*</span>
          </label>
          <select
            style={{ ...styles.select, ...(errors.type ? styles.inputError : {}) }}
            value={form.type}
            onChange={e => handleChange('type', e.target.value as ReportTypeValue)}
            disabled={submitting}
          >
            <option value="">请选择报表类型</option>
            {REPORT_TYPE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {errors.type && <div style={styles.errorText}>{errors.type}</div>}
        </div>

        {/* 报表周期 */}
        <div style={styles.formGroup}>
          <label style={styles.label}>
            报表周期<span style={styles.required}>*</span>
          </label>
          <input
            style={{ ...styles.input, ...(errors.period ? styles.inputError : {}) }}
            type="text"
            placeholder="例：2026-07（月报）/ 2026-07-01 ~ 2026-07-07（周报）"
            value={form.period}
            onChange={e => handleChange('period', e.target.value)}
            maxLength={50}
            disabled={submitting}
          />
          {errors.period && <div style={styles.errorText}>{errors.period}</div>}
          <div style={styles.hint}>根据选择的报表类型填写对应周期描述</div>
        </div>

        {/* 统计指标 */}
        <div style={styles.formGroup}>
          <label style={styles.label}>
            统计指标<span style={styles.required}>*</span>
          </label>
          <div style={styles.checkboxGroup}>
            {METRIC_OPTIONS.map(opt => (
              <label key={opt.value} style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  style={styles.checkbox}
                  checked={form.includeMetrics.includes(opt.value)}
                  onChange={() => handleMetricToggle(opt.value)}
                  disabled={submitting}
                />
                {opt.label}
              </label>
            ))}
          </div>
          {errors.includeMetrics && <div style={styles.errorText}>{errors.includeMetrics}</div>}
          <div style={styles.hint}>已选 {form.includeMetrics.length} 项指标</div>
        </div>

        {/* 备注 */}
        <div style={styles.formGroup}>
          <label style={styles.label}>备注说明</label>
          <textarea
            style={styles.textarea}
            placeholder="可选：填写报表用途、特殊说明等..."
            value={form.notes}
            onChange={e => handleChange('notes', e.target.value)}
            maxLength={200}
            disabled={submitting}
          />
          <div style={styles.hint}>{form.notes.length}/200 字符（可选）</div>
        </div>

        {/* 操作按钮 */}
        <div style={styles.actions}>
          <button
            type="submit"
            style={{
              ...styles.submitBtn,
              opacity: submitting ? 0.5 : 1,
              cursor: submitting ? 'not-allowed' : 'pointer',
            }}
            disabled={submitting}
          >
            {submitting ? '⏳ 生成中...' : '📊 生成报表'}
          </button>
          <button
            type="button"
            style={styles.cancelBtn}
            onClick={() => router.push('/reports')}
            disabled={submitting}
          >
            取消
          </button>
        </div>
      </form>
    </div>
  );
}
