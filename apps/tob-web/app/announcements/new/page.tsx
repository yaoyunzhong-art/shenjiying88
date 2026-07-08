'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageShell } from '@m5/ui';

interface FormData {
  title: string;
  summary: string;
  content: string;
  category: 'system' | 'promotion' | 'operation' | 'emergency' | 'training';
  priority: 'low' | 'normal' | 'high' | 'urgent';
}

interface FormErrors {
  title?: string;
  summary?: string;
  content?: string;
}

export default function NewAnnouncementPage() {
  const router = useRouter();

  const [form, setForm] = useState<FormData>({
    title: '',
    summary: '',
    content: '',
    category: 'operation',
    priority: 'normal',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('enterprise_access_token');
    if (!token) {
      router.push('/enterprise/login');
    }
  }, [router]);

  function validate(): FormErrors {
    const errs: FormErrors = {};
    if (!form.title.trim()) errs.title = '请输入公告标题';
    else if (form.title.trim().length < 2) errs.title = '标题至少2个字符';
    else if (form.title.trim().length > 100) errs.title = '标题不能超过100个字符';
    if (!form.summary.trim()) errs.summary = '请输入公告摘要';
    else if (form.summary.trim().length > 200) errs.summary = '摘要不能超过200个字符';
    if (!form.content.trim()) errs.content = '请输入公告正文';
    else if (form.content.trim().length < 10) errs.content = '正文至少10个字符';
    return errs;
  }

  function handleChange(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => {
        const { [field as keyof FormErrors]: _, ...rest } = prev;
        return rest;
      });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setSubmitting(true);
    setSubmitError('');
    try {
      // 模拟提交
      await new Promise((resolve) => setTimeout(resolve, 800));
      router.push('/announcements');
    } catch {
      setSubmitError('提交失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageShell
      title="发布公告"
      subtitle="创建新的门店公告通知"
      actions={
        <button
          onClick={() => router.push('/announcements')}
          style={{
            padding: '10px 20px',
            borderRadius: 8,
            background: 'rgba(148, 163, 184, 0.1)',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            color: '#94a3b8',
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          取消
        </button>
      }
    >
      {submitError && (
        <div style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 8, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', fontSize: 13 }}>
          {submitError}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ background: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(148, 163, 184, 0.12)', borderRadius: 12, padding: 24, marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: '#f8fafc', margin: '0 0 20px' }}>公告信息</h2>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', marginBottom: 6 }}>公告标题 *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="请输入公告标题"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 8,
                background: 'rgba(15, 23, 42, 0.6)',
                border: `1px solid ${errors.title ? 'rgba(239, 68, 68, 0.4)' : 'rgba(148, 163, 184, 0.2)'}`,
                color: '#f8fafc',
                fontSize: 14,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            {errors.title && <div style={{ marginTop: 4, fontSize: 12, color: '#ef4444' }}>{errors.title}</div>}
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', marginBottom: 6 }}>公告摘要 *</label>
            <input
              type="text"
              value={form.summary}
              onChange={(e) => handleChange('summary', e.target.value)}
              placeholder="简明扼要的公告摘要"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 8,
                background: 'rgba(15, 23, 42, 0.6)',
                border: `1px solid ${errors.summary ? 'rgba(239, 68, 68, 0.4)' : 'rgba(148, 163, 184, 0.2)'}`,
                color: '#f8fafc',
                fontSize: 14,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            {errors.summary && <div style={{ marginTop: 4, fontSize: 12, color: '#ef4444' }}>{errors.summary}</div>}
          </div>

          <div style={{ marginBottom: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', marginBottom: 6 }}>分类</label>
              <select
                value={form.category}
                onChange={(e) => handleChange('category', e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 8,
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  color: '#f8fafc',
                  fontSize: 14,
                  outline: 'none',
                }}
              >
                <option value="system">系统</option>
                <option value="promotion">促销</option>
                <option value="operation">运营</option>
                <option value="emergency">应急</option>
                <option value="training">培训</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', marginBottom: 6 }}>优先级</label>
              <select
                value={form.priority}
                onChange={(e) => handleChange('priority', e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 8,
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  color: '#f8fafc',
                  fontSize: 14,
                  outline: 'none',
                }}
              >
                <option value="low">低</option>
                <option value="normal">普通</option>
                <option value="high">高</option>
                <option value="urgent">紧急</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', marginBottom: 6 }}>公告正文 *</label>
            <textarea
              value={form.content}
              onChange={(e) => handleChange('content', e.target.value)}
              placeholder="请输入公告正文内容..."
              rows={8}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 8,
                background: 'rgba(15, 23, 42, 0.6)',
                border: `1px solid ${errors.content ? 'rgba(239, 68, 68, 0.4)' : 'rgba(148, 163, 184, 0.2)'}`,
                color: '#f8fafc',
                fontSize: 14,
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit',
                lineHeight: 1.6,
                boxSizing: 'border-box',
              }}
            />
            {errors.content && <div style={{ marginTop: 4, fontSize: 12, color: '#ef4444' }}>{errors.content}</div>}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: '12px 32px',
              borderRadius: 8,
              background: submitting ? 'rgba(102, 126, 234, 0.4)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              color: '#fff',
              fontSize: 14,
              fontWeight: 500,
              cursor: submitting ? 'not-allowed' : 'pointer',
            }}
          >
            {submitting ? '发布中...' : '发布公告'}
          </button>
        </div>
      </form>
    </PageShell>
  );
}
