'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

import {
  FormField,
  Input,
  Select,
  SubmitButton,
  FormSubmitFeedback,
  PageShell,
  Breadcrumb,
  useFormSubmit,
  useToast,
} from '@m5/ui';

// ---- 类型 ----

type NotificationType = 'system' | 'alert' | 'reminder' | 'announcement';
type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';
type NotificationScope = 'PLATFORM' | 'TENANT' | 'BRAND' | 'STORE' | 'MARKET';

const TYPE_OPTIONS: { label: string; value: NotificationType }[] = [
  { label: '系统通知', value: 'system' },
  { label: '告警通知', value: 'alert' },
  { label: '提醒通知', value: 'reminder' },
  { label: '公告通知', value: 'announcement' },
];

const PRIORITY_OPTIONS: { label: string; value: NotificationPriority }[] = [
  { label: '低优先级', value: 'low' },
  { label: '中优先级', value: 'medium' },
  { label: '高优先级', value: 'high' },
  { label: '紧急', value: 'urgent' },
];

const SCOPE_OPTIONS: { label: string; value: NotificationScope }[] = [
  { label: '平台级', value: 'PLATFORM' },
  { label: '租户级', value: 'TENANT' },
  { label: '品牌级', value: 'BRAND' },
  { label: '门店级', value: 'STORE' },
  { label: '市场级', value: 'MARKET' },
];

interface FormData {
  title: string;
  content: string;
  type: NotificationType | '';
  priority: NotificationPriority | '';
  targetScope: NotificationScope | '';
  targetName: string;
  targetId: string;
  expiresAt: string;
  ackRequired: string;
  tags: string;
}

interface FormErrors {
  title?: string;
  content?: string;
  type?: string;
  priority?: string;
  targetScope?: string;
  targetName?: string;
  targetId?: string;
  expiresAt?: string;
}

type FormFieldKey = keyof FormData;

// ---- 验证 ----

function validateForm(data: FormData): FormErrors {
  const errors: FormErrors = {};

  if (!data.title.trim()) {
    errors.title = '通知标题不能为空';
  } else if (data.title.trim().length > 100) {
    errors.title = '标题不能超过 100 个字符';
  }

  if (!data.content.trim()) {
    errors.content = '通知内容不能为空';
  } else if (data.content.trim().length < 10) {
    errors.content = '内容至少 10 个字符';
  } else if (data.content.trim().length > 5000) {
    errors.content = '内容不能超过 5000 个字符';
  }

  if (!data.type) {
    errors.type = '请选择通知类型';
  }

  if (!data.priority) {
    errors.priority = '请选择优先级';
  }

  if (!data.targetScope) {
    errors.targetScope = '请选择作用域';
  }

  if (!data.targetName.trim()) {
    errors.targetName = '目标名称不能为空';
  } else if (data.targetName.trim().length > 50) {
    errors.targetName = '目标名称不能超过 50 个字符';
  }

  if (!data.targetId.trim()) {
    errors.targetId = '目标 ID 不能为空';
  }

  if (!data.expiresAt) {
    errors.expiresAt = '过期时间不能为空';
  }

  return errors;
}

function hasErrors(errors: FormErrors): boolean {
  return Object.keys(errors).length > 0;
}

async function submitCreateNotification(
  _data: FormData,
): Promise<{ ok: boolean; message?: string; id?: string }> {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return { ok: true, id: `n${Date.now()}` };
}

const INITIAL_STATE: FormData = {
  title: '',
  content: '',
  type: '',
  priority: '',
  targetScope: '',
  targetName: '',
  targetId: '',
  expiresAt: '',
  ackRequired: 'no',
  tags: '',
};

// ---- 样式 ----

const sectionCardStyle: React.CSSProperties = {
  borderRadius: 16,
  padding: 24,
  background: 'rgba(15, 23, 42, 0.35)',
  border: '1px solid rgba(148, 163, 184, 0.18)',
};

const textareaStyle: React.CSSProperties = {
  width: '100%',
  borderRadius: 10,
  padding: '10px 14px',
  border: '1px solid rgba(148, 163, 184, 0.2)',
  background: 'rgba(15, 23, 42, 0.4)',
  color: '#f1f5f9',
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
  resize: 'vertical',
  fontFamily: 'inherit',
  lineHeight: 1.6,
  minHeight: 200,
};

// ---- 页面 ----

export default function NewNotificationPage() {
  const router = useRouter();
  const toast = useToast();
  const [formData, setFormData] = useState<FormData>({ ...INITIAL_STATE });
  const [errors, setErrors] = useState<FormErrors>({});

  const {
    submit,
    state: submitState,
    reset: resetSubmit,
  } = useFormSubmit<{ ok: boolean; message?: string; id?: string }>({
    async onSubmit() {
      const validationErrors = validateForm(formData);
      if (hasErrors(validationErrors)) {
        setErrors(validationErrors);
        const first = Object.values(validationErrors).find(Boolean);
        throw new Error(first ?? '请修正表单中的错误');
      }
      setErrors({});
      return submitCreateNotification(formData);
    },
    successMessage: '通知已成功创建！',
  });

  const handleFieldChange = useCallback(
    <K extends FormFieldKey>(key: K, value: FormData[K]) => {
      setFormData((prev) => ({ ...prev, [key]: value }));
      if (errors[key as keyof FormErrors]) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[key as keyof FormErrors];
          return next;
        });
      }
    },
    [errors],
  );

  const handleSubmit = useCallback(async () => {
    const result = await submit();
    if (result?.ok) {
      toast?.success?.('通知创建成功！');
      router.push('/notifications');
    }
  }, [submit, toast, router]);

  const handleCancel = useCallback(() => {
    const hasContent = formData.title || formData.content;
    if (hasContent && !window.confirm('确定取消创建？已填写的内容将丢失。')) return;
    router.push('/notifications');
  }, [router, formData]);

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <Breadcrumb
        items={[
          { label: '总览', href: '/' },
          { label: '通知中心', href: '/notifications' },
          { label: '创建通知' },
        ]}
      />
      <PageShell title="创建通知" description="填写表单创建一条新的系统通知，发布后将推送到指定目标范围。">
        {/* 提交反馈 */}
        {submitState.isSubmitting || submitState.errorMessage || submitState.successMessage ? (
          <div style={{ marginBottom: 16 }}>
            <FormSubmitFeedback state={submitState} />
          </div>
        ) : null}

        {/* 基本信息 */}
        <section style={sectionCardStyle}>
          <h2 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700 }}>基本信息</h2>

          <div style={{ display: 'grid', gap: 20, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
            <FormField label="通知标题" required error={errors.title}>
              <Input
                value={formData.title}
                onChange={(e) => handleFieldChange('title', e.target.value)}
                disabled={submitState.isSubmitting}
                placeholder="输入通知标题（最多 100 字）"
              />
            </FormField>

            <FormField label="通知类型" required error={errors.type}>
              <Select
                value={formData.type}
                onChange={(v) => handleFieldChange('type', v as NotificationType)}
                options={TYPE_OPTIONS}
                placeholder="选择通知类型"
                disabled={submitState.isSubmitting}
              />
            </FormField>

            <FormField label="优先级" required error={errors.priority}>
              <Select
                value={formData.priority}
                onChange={(v) => handleFieldChange('priority', v as NotificationPriority)}
                options={PRIORITY_OPTIONS}
                placeholder="选择优先级"
                disabled={submitState.isSubmitting}
              />
            </FormField>

            <FormField label="作用域" required error={errors.targetScope}>
              <Select
                value={formData.targetScope}
                onChange={(v) => handleFieldChange('targetScope', v as NotificationScope)}
                options={SCOPE_OPTIONS}
                placeholder="选择作用域"
                disabled={submitState.isSubmitting}
              />
            </FormField>

            <FormField label="目标名称" required error={errors.targetName}>
              <Input
                value={formData.targetName}
                onChange={(e) => handleFieldChange('targetName', e.target.value)}
                disabled={submitState.isSubmitting}
                placeholder="例如：全平台、华润万象生活"
              />
            </FormField>

            <FormField label="目标 ID" required error={errors.targetId}>
              <Input
                value={formData.targetId}
                onChange={(e) => handleFieldChange('targetId', e.target.value)}
                disabled={submitState.isSubmitting}
                placeholder="例如：platform、t-001、s-005"
              />
            </FormField>
          </div>

          <div style={{ marginTop: 20 }}>
            <FormField label="过期时间" required error={errors.expiresAt}>
              <Input
                type="date"
                value={formData.expiresAt}
                onChange={(e) => handleFieldChange('expiresAt', e.target.value)}
                disabled={submitState.isSubmitting}
                placeholder="选择过期日期"
              />
            </FormField>
          </div>
        </section>

        {/* 通知内容 */}
        <section style={sectionCardStyle}>
          <h2 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700 }}>通知内容</h2>

          <FormField
            label="通知内容"
            required
            error={errors.content}
            helper="至少 10 个字符，最多 5000 字"
          >
            <textarea
              value={formData.content}
              onChange={(e) => handleFieldChange('content', e.target.value)}
              disabled={submitState.isSubmitting}
              placeholder="输入通知详细内容（支持 Markdown 格式描述）"
              style={textareaStyle}
            />
          </FormField>

          <div style={{ display: 'grid', gap: 20, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', marginTop: 20 }}>
            <FormField
              label="标签（逗号分隔）"
              helper="可选，多个标签用逗号分隔"
            >
              <Input
                value={formData.tags}
                onChange={(e) => handleFieldChange('tags', e.target.value)}
                disabled={submitState.isSubmitting}
                placeholder="安全,维护,紧急"
              />
            </FormField>

            <FormField label="需要确认" helper="启用后，目标用户必须手动确认收到该通知">
              <Select
                value={formData.ackRequired}
                onChange={(v) => handleFieldChange('ackRequired', v)}
                options={[
                  { label: '需要确认', value: 'yes' },
                  { label: '无需确认', value: 'no' },
                ]}
                disabled={submitState.isSubmitting}
              />
            </FormField>
          </div>
        </section>

        {/* 底部操作 */}
        <div
          style={{
            display: 'flex',
            gap: 12,
            justifyContent: 'flex-end',
            padding: '16px 24px',
            borderRadius: 16,
            background: 'rgba(15, 23, 42, 0.35)',
            border: '1px solid rgba(148, 163, 184, 0.18)',
          }}
        >
          <SubmitButton
            variant="secondary"
            onClick={handleCancel}
            disabled={submitState.isSubmitting}
          >
            取消返回
          </SubmitButton>
          <SubmitButton
            variant="primary"
            onClick={handleSubmit}
            loading={submitState.isSubmitting}
            disabled={submitState.isSubmitting}
          >
            创建通知
          </SubmitButton>
        </div>
      </PageShell>
    </div>
  );
}
