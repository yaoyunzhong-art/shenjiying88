'use client';

import { useState, useCallback, use, useMemo } from 'react';
import { useRouter } from 'next/navigation';

import {
  DetailShell,
  FormField,
  FormSubmitFeedback,
  PageShell,
  SubmitButton,
  WorkspaceBreadcrumb,
  StatusBadge,
  useDetailFormSubmit,
} from '@m5/ui';

import {
  MEMBER_TIER_MAP,
  MEMBER_STATUS_MAP,
  type MemberTier,
  type MemberStatus,
  type MemberDetail,
} from '../../../members-data';
import {
  loadAdminMemberDetail,
  updateAdminMemberProfile,
  updateAdminMemberLevel,
  updateAdminMemberStatus,
  type MemberApiProfile,
  isMemberMutationApprovalResult,
} from '../../../members-view-model';

// ---- 编辑表单数据类型 ----

interface EditFormData {
  name: string;
  phone: string;
  email: string;
  gender: 'male' | 'female' | 'other';
  birthday: string;
  wechatId: string;
  address: string;
  notes: string;
  tags: string;
}

interface EditFormErrors {
  name?: string;
  phone?: string;
  email?: string;
  gender?: string;
  birthday?: string;
  wechatId?: string;
  address?: string;
  notes?: string;
  tags?: string;
}

interface TierItem {
  key: MemberTier;
  label: string;
}

interface StatusItem {
  key: MemberStatus;
  label: string;
}

interface ActionFeedback {
  isSubmitting: boolean;
  errorMessage?: string;
  successMessage?: string;
}

const MEMBER_TIER_ITEMS: TierItem[] = [
  { key: 'diamond', label: '钻石卡' },
  { key: 'gold', label: '金卡' },
  { key: 'silver', label: '银卡' },
  { key: 'bronze', label: '铜卡' },
  { key: 'standard', label: '标准' },
];

function formatDateForInput(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().slice(0, 10);
  } catch {
    return '';
  }
}

function validateForm(data: EditFormData): EditFormErrors {
  const errors: EditFormErrors = {};
  if (!data.name.trim()) errors.name = '姓名不能为空';
  else if (data.name.trim().length > 50) errors.name = '姓名不能超过50个字符';

  if (!data.phone.trim()) errors.phone = '电话不能为空';
  else if (!/^[\d\s\-+()]{6,20}$/.test(data.phone.trim())) errors.phone = '电话号码格式不正确';

  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = '邮箱格式不正确';
  }

  if (data.gender && !['male', 'female', 'other'].includes(data.gender)) {
    errors.gender = '性别选择不正确';
  }

  if (data.birthday) {
    const parsed = new Date(data.birthday);
    if (isNaN(parsed.getTime())) {
      errors.birthday = '生日日期格式不正确';
    } else if (parsed > new Date()) {
      errors.birthday = '生日不能是未来日期';
    }
  }

  return errors;
}

// ---- 编辑页面组件 ----

export default function EditMemberPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [snapshot, setSnapshot] = useState<{
    status: 'loading' | 'ready' | 'error';
    member: MemberDetail | null;
  }>({ status: 'loading', member: null });
  const [loadError, setLoadError] = useState<string | null>(null);

  // 加载会员数据
  const loadMember = useCallback(async () => {
    try {
      setLoadError(null);
      const result = await loadAdminMemberDetail(id);
      if (!result.member) {
        setSnapshot({ status: 'error', member: null });
        return;
      }
      setSnapshot({ status: 'ready', member: result.member });
    } catch {
      setLoadError('加载会员信息失败，请稍后重试。');
      setSnapshot({ status: 'error', member: null });
    }
  }, [id]);

  // 首次加载
  useState(() => { void loadMember(); });

  // 表单状态
  const [member, setMember] = useState<MemberDetail | null>(null);
  const [memberLoaded, setMemberLoaded] = useState(false);

  if (!memberLoaded && snapshot.status === 'ready' && snapshot.member) {
    setMember(snapshot.member);
    setMemberLoaded(true);
  }

  // 重新加载
  const [reloadTrigger, setReloadTrigger] = useState(0);
  if (reloadTrigger > 0 && snapshot.status === 'ready' && snapshot.member) {
    if (!member || member.id !== snapshot.member.id) {
      setMember(snapshot.member);
      setMemberLoaded(true);
    }
  }

  const [formData, setFormData] = useState<EditFormData>({
    name: '',
    phone: '',
    email: '',
    gender: 'male',
    birthday: '',
    wechatId: '',
    address: '',
    notes: '',
    tags: '',
  });
  const [formInitialized, setFormInitialized] = useState(false);

  // 表单数据初始化
  useMemo(() => {
    if (member && !formInitialized) {
      setFormData({
        name: member.name || '',
        phone: member.phone || '',
        email: member.email || '',
        gender: member.gender || 'male',
        birthday: formatDateForInput(member.birthday || ''),
        wechatId: member.wechatId || '',
        address: member.address || '',
        notes: member.notes || '',
        tags: (member.tags || []).join(', '),
      });
      setFormInitialized(true);
    }
  }, [member, formInitialized]);

  const [errors, setErrors] = useState<EditFormErrors>({});
  const [submitState, setSubmitState] = useState<ActionFeedback>({ isSubmitting: false });

  // 字段变更处理
  const handleFieldChange = useCallback(
    (field: keyof EditFormData, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      if (errors[field]) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[field];
          return next;
        });
      }
    },
    [errors]
  );

  // 提交保存
  const handleSave = useCallback(async () => {
    const validationErrors = validateForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setSubmitState({ isSubmitting: true });

    try {
      const result = await updateAdminMemberProfile(id, {
        nickname: formData.name.trim(),
        mobile: formData.phone.trim(),
        email: formData.email.trim() || undefined,
        address: formData.address.trim() || undefined,
        notes: formData.notes.trim() || undefined,
      });

      if (!result) {
        throw new Error('会员资料更新失败，请稍后重试。');
      }

      if (isMemberMutationApprovalResult(result)) {
        setSubmitState({
          isSubmitting: false,
          successMessage: `${result.summary}${result.approvalTicket ? `，审批单 ${result.approvalTicket}` : ''}`,
        });
        return;
      }

      await loadMember();
      setSubmitState({
        isSubmitting: false,
        successMessage: '会员资料已成功更新。',
      });
    } catch (error) {
      setSubmitState({
        isSubmitting: false,
        errorMessage: error instanceof Error ? error.message : '保存失败，请稍后重试。',
      });
    }
  }, [formData, id, loadMember]);

  // 取消
  const handleCancel = useCallback(() => {
    router.push(`/members/${id}`);
  }, [router, id]);

  if (snapshot.status === 'loading') {
    return (
      <DetailShell
        title="正在加载..."
        backLink={{ label: '返回会员详情', href: `/members/${id}` }}
      >
        <div style={{ padding: 48, textAlign: 'center', color: '#64748b' }}>
          正在加载会员信息...
        </div>
      </DetailShell>
    );
  }

  if (snapshot.status === 'error' || !member) {
    return (
      <DetailShell
        title="加载失败"
        backLink={{ label: '返回会员列表', href: '/members' }}
        error={loadError || '未找到该会员'}
      />
    );
  }

  const getFieldError = (field: keyof EditFormData): string | undefined => errors[field];

  const handleGenderChange = (value: string) => {
    handleFieldChange('gender', value as EditFormData['gender']);
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 32 }}>
      <WorkspaceBreadcrumb
        workspaceLabel="会员管理"
        workspaceHref="/members"
        extraSegments={[
          { label: member.name, href: `/members/${id}` },
          { label: '编辑资料' },
        ]}
      />

      <PageShell
        title={`编辑会员资料 · ${member.name}`}
        subtitle={`${member.code} · ${member.marketCode} · 修改后自动保存至持久化档案`}
      >
        {/* 提示信息 */}
        <div
          style={{
            marginBottom: 24,
            borderRadius: 12,
            padding: '12px 16px',
            border: '1px solid rgba(96, 165, 250, 0.2)',
            background: 'rgba(30, 41, 59, 0.42)',
            color: '#dbeafe',
            fontSize: 13,
            lineHeight: 1.6,
          }}
        >
          当前编辑的是会员 {member.code} 的持久化档案。带 <span style={{ color: '#fca5a5' }}>*</span> 的字段为必填项。
        </div>

        {/* 提交反馈 */}
        {submitState.isSubmitting || submitState.errorMessage || submitState.successMessage ? (
          <div style={{ marginBottom: 24 }}>
            <FormSubmitFeedback state={submitState} />
          </div>
        ) : null}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void handleSave();
          }}
          style={{ display: 'flex', flexDirection: 'column', gap: 24 }}
        >
          {/* 基本信息 */}
          <section
            style={{
              borderRadius: 16,
              padding: 24,
              background: 'rgba(15, 23, 42, 0.35)',
              border: '1px solid rgba(148, 163, 184, 0.18)',
            }}
          >
            <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700, color: '#e2e8f0' }}>
              基本信息
            </h3>

            <div style={{ display: 'grid', gap: 20 }}>
              <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr 1fr' }}>
                <div data-field="name">
                  <FormField label="姓名" required error={getFieldError('name')}>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleFieldChange('name', e.target.value)}
                      disabled={submitState.isSubmitting}
                      style={inputStyle(!!errors.name)}
                      placeholder="输入会员姓名"
                    />
                  </FormField>
                </div>
                <div data-field="phone">
                  <FormField label="电话" required error={getFieldError('phone')}>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => handleFieldChange('phone', e.target.value)}
                      disabled={submitState.isSubmitting}
                      style={inputStyle(!!errors.phone)}
                      placeholder="输入电话号码"
                    />
                  </FormField>
                </div>
              </div>

              <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr 1fr' }}>
                <div data-field="email">
                  <FormField label="邮箱" error={getFieldError('email')} helper="选填">
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleFieldChange('email', e.target.value)}
                      disabled={submitState.isSubmitting}
                      style={inputStyle(!!errors.email)}
                      placeholder="输入邮箱地址"
                    />
                  </FormField>
                </div>
                <div data-field="gender">
                  <FormField label="性别" error={getFieldError('gender')}>
                    <select
                      value={formData.gender}
                      onChange={(e) => handleGenderChange(e.target.value)}
                      disabled={submitState.isSubmitting}
                      style={{ ...inputStyle(false), minHeight: 40 }}
                    >
                      <option value="male">男</option>
                      <option value="female">女</option>
                      <option value="other">其他</option>
                    </select>
                  </FormField>
                </div>
              </div>

              <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr 1fr' }}>
                <div data-field="birthday">
                  <FormField label="生日" error={getFieldError('birthday')} helper="选填，格式 YYYY-MM-DD">
                    <input
                      type="date"
                      value={formData.birthday}
                      onChange={(e) => handleFieldChange('birthday', e.target.value)}
                      disabled={submitState.isSubmitting}
                      style={inputStyle(!!errors.birthday)}
                    />
                  </FormField>
                </div>
                <div data-field="wechatId">
                  <FormField label="微信ID" helper="选填">
                    <input
                      type="text"
                      value={formData.wechatId}
                      onChange={(e) => handleFieldChange('wechatId', e.target.value)}
                      disabled={submitState.isSubmitting}
                      style={inputStyle(false)}
                      placeholder="微信ID或昵称"
                    />
                  </FormField>
                </div>
              </div>

              <div data-field="address">
                <FormField label="地址" helper="选填">
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => handleFieldChange('address', e.target.value)}
                    disabled={submitState.isSubmitting}
                    style={inputStyle(false)}
                    placeholder="输入地址"
                  />
                </FormField>
              </div>
            </div>
          </section>

          {/* 标签 */}
          <section
            style={{
              borderRadius: 16,
              padding: 24,
              background: 'rgba(15, 23, 42, 0.35)',
              border: '1px solid rgba(148, 163, 184, 0.18)',
            }}
          >
            <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: '#e2e8f0' }}>
              标签与备注
            </h3>

            <div style={{ display: 'grid', gap: 20 }}>
              <div data-field="tags">
                <FormField label="标签" helper="多个标签用逗号分隔">
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => handleFieldChange('tags', e.target.value)}
                    disabled={submitState.isSubmitting}
                    style={inputStyle(false)}
                    placeholder="例如：高净值, 母婴, 数码"
                  />
                </FormField>
                {member && member.tags.length > 0 && (
                  <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {member.tags.map((tag) => (
                      <span
                        key={tag}
                        style={{
                          fontSize: 11,
                          padding: '2px 8px',
                          borderRadius: 999,
                          background: 'rgba(147, 197, 253, 0.12)',
                          color: '#93c5fd',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div data-field="notes">
                <FormField label="内部备注" helper="管理后台可见">
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleFieldChange('notes', e.target.value)}
                    disabled={submitState.isSubmitting}
                    style={{ ...inputStyle(false), minHeight: 100, resize: 'vertical', fontFamily: 'inherit' }}
                    placeholder="输入会员备注信息"
                  />
                </FormField>
              </div>
            </div>
          </section>

          {/* 提交按钮 */}
          <div
            style={{
              display: 'flex',
              gap: 12,
              justifyContent: 'flex-end',
              padding: '16px 0',
              borderTop: '1px solid rgba(148, 163, 184, 0.15)',
            }}
          >
            <SubmitButton
              variant="secondary"
              onClick={handleCancel}
              disabled={submitState.isSubmitting}
            >
              取消
            </SubmitButton>
            <SubmitButton
              variant="primary"
              loading={submitState.isSubmitting}
              type="submit"
            >
              {submitState.isSubmitting ? '保存中...' : '保存修改'}
            </SubmitButton>
          </div>
        </form>
      </PageShell>
    </div>
  );
}

// ---- 输入框样式 ----

function inputStyle(hasError: boolean): React.CSSProperties {
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
