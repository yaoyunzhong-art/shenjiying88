'use client';

import { useState, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';

import {
  DetailActionBar,
  DetailClosureBar,
  DetailShell,
  ConfirmDialog,
  StatusBadge,
  InfoRow,
  FormField,
  SubmitButton,
  WorkspaceBreadcrumb,
  useAlert,
  type DetailShellAction,
} from '@m5/ui';

import {
  getStaffById,
  STAFF_STATUS_MAP,
  STAFF_ROLE_MAP,
  type StaffDetail,
  type StaffStatus,
} from '../../staff-data';
import { useDetailActions } from '../../components/use-detail-actions';
import { buildStandardBreadcrumb, buildStandardClosureLinks } from '../../components/detail-workspace-registry';

// ─── 状态标签 ────────────────────────────────────────

const SUPPORTED_STATUS_TRANSITIONS: Record<StaffStatus, {
  to: StaffStatus[];
  label: string;
}> = {
  active:        { to: ['on_leave', 'resigned'],                         label: '操作' },
  probation:     { to: ['active', 'resigned'],                           label: '操作' },
  on_leave:      { to: ['active', 'resigned'],                           label: '操作' },
  resigned:      { to: [],                                                label: '已终结' },
};

// ─── 详情页 ────────────────────────────────────────

export default function StaffDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id ?? '';
  const detail = useMemo(() => getStaffById(id), [id]);

  // 编辑模式
  const [editing, setEditing] = useState(false);

  // 可编辑字段
  const [form, setForm] = useState<Partial<Pick<StaffDetail, 'name' | 'phone' | 'email' | 'address' | 'notes'>>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  // 状态流转
  const [statusFlowOpen, setStatusFlowOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<StaffStatus | null>(null);
  const [statusSaving, setStatusSaving] = useState(false);

  // 删除
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Alert
  const alert = useAlert();

  // ── 编辑开始 ──
  const startEdit = useCallback(() => {
    if (!detail) {
      return;
    }
    setForm({
      name: detail.name,
      phone: detail.phone,
      email: detail.email,
      address: detail.address,
      notes: detail.notes,
    });
    setSaveError('');
    setEditing(true);
  }, [detail]);

  // ── 保存编辑 ──
  const saveEdit = useCallback(async () => {
    if (!detail) {
      return;
    }
    setSaving(true);
    setSaveError('');
    try {
      // 模拟保存
      await new Promise((r) => setTimeout(r, 600));
      // 内联更新 detail (mock)
      Object.assign(detail, form);
      alert.success('保存成功', '员工信息已保存。');
      setEditing(false);
    } catch {
      setSaveError('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  }, [detail, form, alert]);

  // ── 取消编辑 ──
  const cancelEdit = useCallback(() => {
    setEditing(false);
    setForm({});
    setSaveError('');
  }, []);

  // ── 状态流转 ──
  const startStatusFlow = useCallback((target: StaffStatus) => {
    if (!detail) {
      return;
    }
    setPendingStatus(target);
    setStatusFlowOpen(true);
  }, [detail]);

  const confirmStatusFlow = useCallback(async () => {
    if (!pendingStatus || !detail) return;
    setStatusSaving(true);
    try {
      await new Promise((r) => setTimeout(r, 400));
      detail.status = pendingStatus;
      alert.success('状态变更', `员工状态已变更为「${STAFF_STATUS_MAP[pendingStatus].label}」。`);
      setStatusFlowOpen(false);
      setPendingStatus(null);
    } catch {
      alert.danger('变更失败', '状态变更失败，请重试。');
    } finally {
      setStatusSaving(false);
    }
  }, [detail, pendingStatus, alert]);

  // ── 删除 ──
  const confirmDelete = useCallback(async () => {
    setDeleting(true);
    try {
      await new Promise((r) => setTimeout(r, 500));
      alert.success('删除成功', '员工记录已删除。');
      router.push('/staff');
    } catch {
      alert.danger('删除失败', '删除操作失败，请重试。');
    } finally {
      setDeleting(false);
    }
  }, [alert, router]);

  // ── operations 区操作按钮 ──
  const operations: DetailShellAction[] = useMemo(() => {
    if (!detail) {
      return [];
    }

    const actions: DetailShellAction[] = [];

    const transitions = SUPPORTED_STATUS_TRANSITIONS[detail.status];
    if (transitions && transitions.to.length > 0) {
      for (const target of transitions.to) {
        actions.push({
          key: `status_${target}`,
          label: `转${STAFF_STATUS_MAP[target].label}`,
          variant: target === 'resigned' ? 'danger' : 'secondary',
          onClick: () => startStatusFlow(target),
        });
      }
    }

    if (!editing) {
      actions.push({
        key: 'edit',
        label: '编辑信息',
        onClick: startEdit,
      });
    }

    actions.push({
      key: 'delete',
      label: '删除员工',
      variant: 'danger',
      onClick: () => setDeleteOpen(true),
    });

    return actions;
  }, [detail, editing, startEdit, startStatusFlow]);

  // ── 状态流转操作：已离职 -> 无可用操作 ──
  const transitions = detail ? SUPPORTED_STATUS_TRANSITIONS[detail.status] : null;
  const canFlow = Boolean(transitions && transitions.to.length > 0);

  const { actions: detailActions } = useDetailActions({
    workspace: 'staff',
    detailId: detail?.id ?? 'unknown',
    record: detail ?? {},
    shareTitle: `员工 · ${detail?.name ?? ''}`,
    shareText: `查看员工 ${detail?.code ?? ''} (${detail?.name ?? ''}) 详情`
  });

  // 加载中 + 不存在
  if (!id) {
    return (
      <main style={{ maxWidth: 900, margin: '0 auto', padding: 32, color: '#cbd5e1' }}>
        <p>未指定员工 ID。</p>
      </main>
    );
  }

  if (!detail) {
    return (
      <main style={{ maxWidth: 900, margin: '0 auto', padding: 32, color: '#cbd5e1' }}>
        <div style={{ textAlign: 'center', marginTop: 80 }}>
          <p style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>员工不存在</p>
          <p style={{ fontSize: 14, color: '#94a3b8', marginBottom: 24 }}>
            未找到员工 {id} 的信息。
          </p>
          <button
            onClick={() => router.push('/staff')}
            style={backButtonStyle}
          >
            ← 返回员工列表
          </button>
        </div>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: 32 }}>
      <WorkspaceBreadcrumb
        {...buildStandardBreadcrumb({ workspace: 'staff', detailLabel: detail.name })}
      />
      <DetailShell
        title={detail.name}
        subtitle={detail.code}
        onBack={() => router.push('/staff')}
        backLabel="返回员工列表"
        actions={operations}
      >
        {/* ─┬─ 编辑模式 ─────────────────── */}
        {editing ? (
          <article style={sectionCardStyle}>
            <h3 style={sectionTitleStyle}>编辑员工信息</h3>

            {/* Edit error */}
            {saveError && (
              <div style={errorBannerStyle}>{saveError}</div>
            )}

            <div style={{ display: 'grid', gap: 14, gridTemplateColumns: '1fr 1fr' }}>
              <FormField label="姓名" htmlFor="sf-name">
                <input
                  id="sf-name"
                  type="text"
                  value={form.name ?? ''}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  style={inputStyle}
                />
              </FormField>

              <FormField label="手机号" htmlFor="sf-phone">
                <input
                  id="sf-phone"
                  type="text"
                  value={form.phone ?? ''}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  style={inputStyle}
                />
              </FormField>

              <FormField label="邮箱" htmlFor="sf-email">
                <input
                  id="sf-email"
                  type="email"
                  value={form.email ?? ''}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  style={inputStyle}
                />
              </FormField>

              <FormField label="居住地址" htmlFor="sf-address">
                <input
                  id="sf-address"
                  type="text"
                  value={form.address ?? ''}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, address: e.target.value }))
                  }
                  style={inputStyle}
                />
              </FormField>
            </div>

            <FormField label="备注" htmlFor="sf-notes">
              <textarea
                id="sf-notes"
                value={form.notes ?? ''}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, notes: e.target.value }))
                }
                rows={3}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </FormField>

            {/* 编辑按钮区 */}
            <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
              <SubmitButton onClick={saveEdit} loading={saving}>
                保存修改
              </SubmitButton>
              <button onClick={cancelEdit} disabled={saving} style={secondaryBtnStyle}>
                取消
              </button>
            </div>
          </article>
        ) : (
          <>
            {/* ─┬─ 基础信息卡片 ──────────────── */}
            <article style={sectionCardStyle}>
              <h3 style={sectionTitleStyle}>
                基础信息
                <span
                  role="button"
                  tabIndex={0}
                  onClick={startEdit}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') startEdit();
                  }}
                  style={{
                    marginLeft: 12,
                    fontSize: 13,
                    color: '#93c5fd',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    fontWeight: 400,
                  }}
                >
                  编辑
                </span>
              </h3>

              <div style={infoGridStyle}>
                <InfoRow label="员工编号" value={detail.code} />
                <InfoRow label="姓名" value={detail.name} />
                <InfoRow
                  label="岗位角色"
                  value={
                    <StatusBadge
                      label={STAFF_ROLE_MAP[detail.role].label}
                      variant={STAFF_ROLE_MAP[detail.role].variant}
                      size="sm"
                    />
                  }
                />
                <InfoRow
                  label="在职状态"
                  value={
                    <StatusBadge
                      label={STAFF_STATUS_MAP[detail.status].label}
                      variant={STAFF_STATUS_MAP[detail.status].variant}
                      size="sm"
                      dot
                    />
                  }
                />
                <InfoRow label="所属门店" value={detail.storeName} />
                <InfoRow label="市场" value={detail.marketCode} />
                <InfoRow label="手机号" value={detail.phone} />
                <InfoRow label="邮箱" value={detail.email} />
                <InfoRow label="入职日期" value={detail.hiredAt} />
                <InfoRow label="最后活跃" value={detail.lastActiveAt} />
                <InfoRow
                  label="绩效评分"
                  value={
                    <span>
                      <span style={{ fontWeight: 600, color: perfColor(detail.performanceScore) }}>
                        {detail.performanceScore}
                      </span>
                      <span style={{ color: '#94a3b8' }}> / 100</span>
                    </span>
                  }
                />
              </div>

              {/* 快速状态流转按钮 */}
              {canFlow && (
                <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                  {transitions?.to.map((target) => (
                    <button
                      key={target}
                      onClick={() => startStatusFlow(target)}
                      style={
                        target === 'resigned'
                          ? dangerBtnStyle
                          : secondaryBtnStyle
                      }
                    >
                      转{STAFF_STATUS_MAP[target].label}
                    </button>
                  ))}
                </div>
              )}
            </article>

            {/* ─┬─ 详细信息卡片 ──────────────── */}
            <article style={sectionCardStyle}>
              <h3 style={sectionTitleStyle}>详细信息</h3>
              <div style={infoGridStyle}>
                <InfoRow label="身份证号" value={detail.idNumber} />
                <InfoRow label="所属部门" value={detail.department} />
                <InfoRow label="直属上级" value={detail.supervisor} />
                <InfoRow label="紧急联系人" value={detail.emergencyContact} />
                <InfoRow label="紧急电话" value={detail.emergencyPhone} />
                <InfoRow label="居住地址" value={detail.address} />
                {detail.notes && (
                  <InfoRow label="备注" value={detail.notes} />
                )}
              </div>
            </article>

            <DetailActionBar
              actions={detailActions}
              heading="详情收口动作"
              caption="复制 / 导出 / 分享当前员工详情"
            />
          </>
        )}
      </DetailShell>

      <DetailClosureBar
        links={buildStandardClosureLinks({ workspace: 'staff', detailId: detail.id })}
      />

      {/* ── 状态流转确认弹窗 ── */}
      <ConfirmDialog
        open={statusFlowOpen}
        title="确认状态变更"
        message={
          pendingStatus === 'resigned'
            ? `确认将 ${detail.name} 标记为「已离职」？此操作不可逆，员工将失去系统访问权限。`
            : `确认将 ${detail.name} 的状态变更为「${STAFF_STATUS_MAP[pendingStatus!]?.label ?? ''}」？`
        }
        confirmLabel="确认变更"
        cancelLabel="取消"
        variant={pendingStatus === 'resigned' ? 'danger' : 'default'}
        loading={statusSaving}
        onConfirm={confirmStatusFlow}
        onCancel={() => {
          setStatusFlowOpen(false);
          setPendingStatus(null);
        }}
      />

      {/* ── 删除确认弹窗 ── */}
      <ConfirmDialog
        open={deleteOpen}
        title="删除员工"
        message={`确认永久删除 ${detail.name}（${detail.code}）？此操作不可撤销。`}
        confirmLabel="确认删除"
        cancelLabel="取消"
        variant="danger"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </main>
  );
}

// ─── 工具 ────────────────────────────────────────

function perfColor(score: number): string {
  if (score >= 85) return '#4ade80';
  if (score >= 70) return '#fbbf24';
  return '#f87171';
}

// ─── 样式 ────────────────────────────────────────

const sectionCardStyle: React.CSSProperties = {
  borderRadius: 16,
  padding: 22,
  background: 'rgba(15, 23, 42, 0.38)',
  border: '1px solid rgba(148, 163, 184, 0.18)',
  marginBottom: 20,
};

const sectionTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 16,
  fontWeight: 700,
  color: '#e2e8f0',
  marginBottom: 18,
};

const infoGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
  gap: 12,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: 8,
  border: '1px solid rgba(148, 163, 184, 0.32)',
  background: 'rgba(15, 23, 42, 0.6)',
  color: '#e2e8f0',
  fontSize: 14,
  boxSizing: 'border-box' as const,
  outline: 'none',
};

const secondaryBtnStyle: React.CSSProperties = {
  padding: '8px 18px',
  borderRadius: 8,
  border: '1px solid rgba(148, 163, 184, 0.32)',
  background: 'rgba(148, 163, 184, 0.12)',
  color: '#cbd5e1',
  fontSize: 14,
  cursor: 'pointer',
  fontWeight: 500,
};

const dangerBtnStyle: React.CSSProperties = {
  ...secondaryBtnStyle,
  border: '1px solid rgba(248, 113, 113, 0.4)',
  color: '#fca5a5',
  background: 'rgba(248, 113, 113, 0.12)',
};

const errorBannerStyle: React.CSSProperties = {
  background: 'rgba(248, 113, 113, 0.12)',
  border: '1px solid rgba(248, 113, 113, 0.32)',
  borderRadius: 8,
  padding: '8px 14px',
  color: '#fca5a5',
  fontSize: 13,
  marginBottom: 14,
};

const backButtonStyle: React.CSSProperties = {
  padding: '8px 18px',
  borderRadius: 8,
  border: '1px solid rgba(148, 163, 184, 0.28)',
  background: 'transparent',
  color: '#93c5fd',
  fontSize: 14,
  cursor: 'pointer',
};
