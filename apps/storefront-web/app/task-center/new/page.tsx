/**
 * 新建任务表单页 — Task Create Form Page (Next.js App Router Page)
 * 角色视角: 👔店长 / 🏪全体门店员工
 * 类型: B-表单页
 * 功能: 任务创建表单，含验证、提交、错误处理
 */
'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

/* ── 任务类型选项 ── */
const TASK_TYPE_OPTIONS = [
  { value: 'stocktaking', label: '盘点任务' },
  { value: 'cleaning', label: '清洁任务' },
  { value: 'training', label: '培训任务' },
  { value: 'customer_followup', label: '客户跟进' },
  { value: 'inspection', label: '巡检任务' },
  { value: 'promotion', label: '促销准备' },
  { value: 'other', label: '其他' },
] as const;

type TaskTypeValue = (typeof TASK_TYPE_OPTIONS)[number]['value'];

/* ── 优先级选项 ── */
const PRIORITY_OPTIONS = [
  { value: 'low', label: '低优先级', color: '#64748b' },
  { value: 'medium', label: '中优先级', color: '#eab308' },
  { value: 'high', label: '高优先级', color: '#f97316' },
  { value: 'urgent', label: '紧急', color: '#ef4444' },
] as const;

type PriorityValue = (typeof PRIORITY_OPTIONS)[number]['value'];

/* ── 表单数据 ── */
interface TaskFormData {
  title: string;
  description: string;
  type: TaskTypeValue;
  priority: PriorityValue;
  assignee: string;
  deadline: string;
}

/* ── 表单错误 ── */
interface FormErrors {
  title?: string;
  type?: string;
  assignee?: string;
  deadline?: string;
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
  priorityGroup: {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap' as const,
  },
  priorityBtn: {
    padding: '8px 18px',
    borderRadius: 8,
    border: '1px solid rgba(148,163,184,0.2)',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    background: 'transparent',
    color: '#94a3b8',
    transition: 'all 0.15s',
  },
  priorityBtnActive: {
    color: '#fff',
    borderWidth: 2,
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

/* ── 表单验证 ── */
function validateForm(data: TaskFormData): FormErrors {
  const errors: FormErrors = {};
  const title = (data.title || '').trim();
  if (!title) {
    errors.title = '请输入任务标题';
  } else if (title.length < 2) {
    errors.title = '标题至少2个字符';
  } else if (title.length > 100) {
    errors.title = '标题不能超过100个字符';
  }

  if (!data.type) {
    errors.type = '请选择任务类型';
  }

  const assignee = (data.assignee || '').trim();
  if (!assignee) {
    errors.assignee = '请填写负责人';
  } else if (assignee.length > 30) {
    errors.assignee = '负责人姓名不能超过30个字符';
  }

  if (!data.deadline) {
    errors.deadline = '请设置截止日期';
  } else if (data.deadline.length > 10) {
    errors.deadline = '日期格式不正确';
  }

  return errors;
}

/* ── 模拟提交 ── */
async function submitTask(data: TaskFormData): Promise<{ success: boolean; id?: string; error?: string }> {
  await new Promise(r => setTimeout(r, 600));
  if (data.title.includes('error')) {
    return { success: false, error: '创建失败，请检查参数后重试' };
  }
  return { success: true, id: `task-${Date.now()}` };
}

/* ── 页面组件 ── */
export default function TaskCreateFormPage() {
  const router = useRouter();
  const [form, setForm] = useState<TaskFormData>({
    title: '',
    description: '',
    type: '' as TaskTypeValue,
    priority: 'medium',
    assignee: '',
    deadline: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleChange = useCallback(<K extends keyof TaskFormData>(field: K, value: TaskFormData[K]) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
    setFeedback(null);
  }, []);

  const priorityColor = PRIORITY_OPTIONS.find(p => p.value === form.priority)?.color || '#94a3b8';

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
      const result = await submitTask(form);
      if (result.success) {
        setFeedback({ type: 'success', message: `任务"${form.title}"创建成功！即将跳转...` });
        setTimeout(() => {
          router.push(`/task-center/${result.id}`);
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

  return (
    <div style={styles.container}>
      {/* 页面标题 */}
      <div style={styles.header}>
        <a href="/task-center" style={styles.backLink}>← 返回任务中心</a>
        <h1 style={styles.title}>新建任务</h1>
        <p style={styles.subtitle}>创建门店任务并指派给相应负责人</p>
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
        {/* 任务标题 */}
        <div style={styles.formGroup}>
          <label style={styles.label}>
            任务标题<span style={styles.required}>*</span>
          </label>
          <input
            style={{ ...styles.input, ...(errors.title ? styles.inputError : {}) }}
            type="text"
            placeholder="例：7月第二周门店盘点"
            value={form.title}
            onChange={e => handleChange('title', e.target.value)}
            maxLength={100}
            disabled={submitting}
          />
          {errors.title && <div style={styles.errorText}>{errors.title}</div>}
          <div style={styles.hint}>{form.title.length}/100 字符</div>
        </div>

        {/* 任务类型 */}
        <div style={styles.formGroup}>
          <label style={styles.label}>
            任务类型<span style={styles.required}>*</span>
          </label>
          <select
            style={{ ...styles.select, ...(errors.type ? styles.inputError : {}) }}
            value={form.type}
            onChange={e => handleChange('type', e.target.value as TaskTypeValue)}
            disabled={submitting}
          >
            <option value="">请选择任务类型</option>
            {TASK_TYPE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {errors.type && <div style={styles.errorText}>{errors.type}</div>}
        </div>

        {/* 优先级 */}
        <div style={styles.formGroup}>
          <label style={styles.label}>优先级</label>
          <div style={styles.priorityGroup}>
            {PRIORITY_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                style={{
                  ...styles.priorityBtn,
                  ...(form.priority === opt.value ? {
                    ...styles.priorityBtnActive,
                    borderColor: opt.color,
                    color: opt.color,
                    background: `${opt.color}15`,
                  } : {}),
                }}
                onClick={() => handleChange('priority', opt.value)}
                disabled={submitting}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div style={{ ...styles.hint, color: priorityColor }}>
            当前: {PRIORITY_OPTIONS.find(p => p.value === form.priority)?.label}
          </div>
        </div>

        {/* 负责人 */}
        <div style={styles.formGroup}>
          <label style={styles.label}>
            负责人<span style={styles.required}>*</span>
          </label>
          <input
            style={{ ...styles.input, ...(errors.assignee ? styles.inputError : {}) }}
            type="text"
            placeholder="填写员工姓名"
            value={form.assignee}
            onChange={e => handleChange('assignee', e.target.value)}
            maxLength={30}
            disabled={submitting}
          />
          {errors.assignee && <div style={styles.errorText}>{errors.assignee}</div>}
        </div>

        {/* 截止日期 */}
        <div style={styles.formGroup}>
          <label style={styles.label}>
            截止日期<span style={styles.required}>*</span>
          </label>
          <input
            style={{ ...styles.input, ...(errors.deadline ? styles.inputError : {}) }}
            type="date"
            value={form.deadline}
            onChange={e => handleChange('deadline', e.target.value)}
            disabled={submitting}
          />
          {errors.deadline && <div style={styles.errorText}>{errors.deadline}</div>}
        </div>

        {/* 任务描述 */}
        <div style={styles.formGroup}>
          <label style={styles.label}>任务描述</label>
          <textarea
            style={styles.textarea}
            placeholder="可选：填写任务的具体要求、注意事项等..."
            value={form.description}
            onChange={e => handleChange('description', e.target.value)}
            maxLength={500}
            disabled={submitting}
          />
          <div style={styles.hint}>{form.description.length}/500 字符（可选）</div>
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
            {submitting ? '⏳ 创建中...' : '✅ 创建任务'}
          </button>
          <button
            type="button"
            style={styles.cancelBtn}
            onClick={() => router.push('/task-center')}
            disabled={submitting}
          >
            取消
          </button>
        </div>
      </form>
    </div>
  );
}
