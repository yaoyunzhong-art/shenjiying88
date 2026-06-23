'use client';

import { useState, useCallback, use } from 'react';

import {
  DetailActionBar,
  DetailClosureBar,
  DetailShell,
  FormField,
  FormSubmitFeedback,
  InfoRow,
  StatusBadge,
  CopyToClipboard,
  SubmitButton,
  WorkspaceBreadcrumb,
  useFormSubmit,
  type DetailShellAction
} from '@m5/ui';
import { useDetailActions } from '../../components/use-detail-actions';
import { buildStandardBreadcrumb, buildStandardClosureLinks } from '../../components/detail-workspace-registry';

// ---- 类型 ----

interface NotificationDetail {
  id: string;
  title: string;
  content: string;
  type: 'system' | 'alert' | 'reminder' | 'announcement';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'unread' | 'read' | 'archived';
  targetScope: 'PLATFORM' | 'TENANT' | 'BRAND' | 'STORE' | 'MARKET';
  targetId: string;
  targetName: string;
  createdBy: string;
  createdAt: string;
  expiresAt: string;
  readAt?: string;
  ackRequired: boolean;
  ackedBy?: string;
  ackedAt?: string;
  tags: string[];
}

type StatusVariant = 'success' | 'neutral' | 'warning' | 'danger';

const TYPE_MAP: Record<NotificationDetail['type'], { label: string; variant: StatusVariant }> = {
  system: { label: '系统', variant: 'neutral' },
  alert: { label: '告警', variant: 'danger' },
  reminder: { label: '提醒', variant: 'warning' },
  announcement: { label: '公告', variant: 'success' },
};

const PRIORITY_MAP: Record<NotificationDetail['priority'], { label: string; variant: StatusVariant }> = {
  low: { label: '低', variant: 'neutral' },
  medium: { label: '中', variant: 'success' },
  high: { label: '高', variant: 'warning' },
  urgent: { label: '紧急', variant: 'danger' },
};

const STATUS_MAP: Record<NotificationDetail['status'], { label: string; variant: StatusVariant }> = {
  unread: { label: '未读', variant: 'warning' },
  read: { label: '已读', variant: 'neutral' },
  archived: { label: '已归档', variant: 'neutral' },
};

const SCOPE_MAP: Record<NotificationDetail['targetScope'], string> = {
  PLATFORM: '平台级',
  TENANT: '租户级',
  BRAND: '品牌级',
  STORE: '门店级',
  MARKET: '市场级',
};

// ---- Mock 详情数据 ----

function getNotificationById(id: string): NotificationDetail {
  const lookup: Record<string, NotificationDetail> = {
    n1: {
      id: 'n1', title: '系统维护通知', content: '平台将于 2026-06-16 02:00-04:00 (UTC+8) 进行季度维护，届时以下服务可能短暂不可用：\n\n• 网关 API 灰度发布（预计中断 ≤ 2 分钟）\n• 边缘节点固件升级（离线 ≤ 5 分钟）\n• 数据库备份切换（无中断）\n\n请各租户管理员提前做好业务安排。如有疑问，请联系平台运维团队：ops@m5.com。',
      type: 'system', priority: 'high', status: 'unread',
      targetScope: 'PLATFORM', targetId: 'platform', targetName: 'M5 全平台',
      createdBy: 'system', createdAt: '2026-06-14 04:00:00', expiresAt: '2026-06-17 04:00:00',
      ackRequired: false, tags: ['维护', '系统升级', '全平台'],
    },
    n3: {
      id: 'n3', title: '⚠️ 证书即将过期', content: 'SSL 证书 cert-007（绑定的域名：*.m5platform.cn, api.m5platform.cn）将在 7 天内过期。\n\n过期影响：\n• 所有客户端连接将被标记为"不安全"\n• 用户端浏览器将显示 SSL 警告页面\n• 小程序端可能停止网络请求\n\n建议操作：\n1. 登录密钥管理系统 > 证书管理\n2. 找到 cert-007，点击「执行轮换」\n3. 选择新证书来源（自动申请 Let\'s Encrypt 或上传自有证书）\n4. 验证新证书生效后，归档旧证书\n\n安全联系人：security@m5.com',
      type: 'alert', priority: 'urgent', status: 'unread',
      targetScope: 'PLATFORM', targetId: 'cert-007', targetName: '*.m5platform.cn',
      createdBy: 'system', createdAt: '2026-06-14 03:00:00', expiresAt: '2026-06-28 03:00:00',
      ackRequired: true, tags: ['安全', '证书', 'SSL/TLS', '紧急'],
    },
    n4: {
      id: 'n4', title: '租户配额提醒', content: '租户「华润万象生活」(TNT-001) 的 API 调用配额已使用 85%。\n\n当前配额详情：\n• 套餐：企业版（enterprise）\n• 日配额：500,000 次\n• 当前已用：425,000 次（85%）\n• 预计超限时间：结合历史斜率，约 3.5 小时后\n\n建议操作：\n• 短期：联系租户管理员确认是否有计划内的高负载活动\n• 长期：评估是否需要扩容至更高配额包\n\n可进入「配置管理 > 配额策略」进行调整。',
      type: 'reminder', priority: 'medium', status: 'unread',
      targetScope: 'TENANT', targetId: 't-001', targetName: '华润万象生活',
      createdBy: 'system', createdAt: '2026-06-14 02:30:00', expiresAt: '2026-06-21 02:30:00',
      ackRequired: false, tags: ['配额', 'API', '性能', '租户管理'],
    },
    n5: {
      id: 'n5', title: '门店暂停通知', content: '门店「杭州银泰旗舰店」(STORE-005) 于 2026-06-14 02:00 暂停运营。\n\n暂停原因：消防安全整改检查中发现 3 项不合格项，需在 7 日内完成复查。\n\n门店关联信息：\n• 租户：银泰商业\n• 品牌：M5 Premium 旗舰品牌\n• 状态：暂停运营\n• 已关闭的服务：H5、小程序、App、PC 后台\n\n暂停期间不影响已产生的订单履约。恢复运营后需重新上线全部终端。',
      type: 'alert', priority: 'high', status: 'read',
      targetScope: 'STORE', targetId: 's-005', targetName: '杭州银泰旗舰店',
      createdBy: 'admin@m5.com', createdAt: '2026-06-14 02:00:00', expiresAt: '2026-06-21 02:00:00',
      readAt: '2026-06-14 03:15:00', ackRequired: true, ackedBy: 'ops@m5.com', ackedAt: '2026-06-14 03:15:00',
      tags: ['安全', '门店', '暂停运营', '合规'],
    },
    n8: {
      id: 'n8', title: '⚠️ 边缘节点离线警告', content: '边缘节点 en-019（位置：深圳万象天地店负一层机房）已离线超过 1 小时。\n\n离线影响：\n• 门店数据同步暂停：库存、订单、会员数据未同步至中央\n• 本地缓存可继续运营约 4 小时（降级模式已自动启用）\n• 离线期间的订单将在节点恢复后批量同步\n\n建议操作：\n1. 联系门店 IT 确认机房网络和电源状态\n2. 如 2 小时内无法恢复，建议启用备用节点 en-020（位于同城中心机房）\n3. 通知门店运营团队启用线下 POS 备用方案\n\n边缘节点管理面板：op.m5platform.cn/edge/nodes/en-019',
      type: 'alert', priority: 'urgent', status: 'unread',
      targetScope: 'STORE', targetId: 's-003', targetName: '深圳万象天地店',
      createdBy: 'system', createdAt: '2026-06-13 14:30:00', expiresAt: '2026-06-14 14:30:00',
      ackRequired: true, tags: ['边缘节点', '离线', '数据同步', '降级', '紧急'],
    },
  };
  return lookup[id] ?? lookup['n3']!;
}

// ---- 编辑表单 ----

interface EditFormData {
  content: string;
}

interface EditFormErrors {
  content?: string;
}

function validateForm(data: EditFormData): EditFormErrors {
  const errors: EditFormErrors = {};
  if (!data.content.trim()) errors.content = '通知内容不能为空';
  return errors;
}

async function submitEdit(form: EditFormData): Promise<{ success: boolean }> {
  void form;
  await new Promise((resolve) => setTimeout(resolve, 800));
  return { success: true };
}

// ---- 页面组件 ----

export default function NotificationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const notice = getNotificationById(id);
  const [editOpen, setEditOpen] = useState(false);
  const [formData, setFormData] = useState<EditFormData>({ content: notice.content });
  const [errors, setErrors] = useState<EditFormErrors>({});

  const {
    submit,
    state: submitState,
    reset: resetSubmit
  } = useFormSubmit<{ success: boolean }>({
    async onSubmit() {
      const validationErrors = validateForm(formData);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        throw new Error(Object.values(validationErrors)[0]);
      }
      setErrors({});
      return submitEdit(formData);
    },
    successMessage: '通知内容已更新成功。',
  });

  const handleSave = useCallback(async () => {
    const result = await submit();
    if (result) {
      setEditOpen(false);
      resetSubmit();
    }
  }, [submit, resetSubmit]);

  const handleCancel = useCallback(() => {
    setEditOpen(false);
    setErrors({});
    resetSubmit();
    setFormData({ content: notice.content });
  }, [notice, resetSubmit]);

  const typeInfo = TYPE_MAP[notice.type];
  const priorityInfo = PRIORITY_MAP[notice.priority];
  const statusInfo = STATUS_MAP[notice.status];

  const { actions: detailActions } = useDetailActions({
    workspace: 'notifications',
    detailId: notice.id,
    record: notice,
    shareTitle: `通知 · ${notice.title}`,
    shareText: `查看通知 ${notice.id} (${notice.title}) 详情`
  });

  const actions: DetailShellAction[] = [
    {
      key: 'edit',
      label: editOpen ? '保存中...' : '编辑',
      variant: 'primary',
      loading: submitState.isSubmitting,
      disabled: submitState.isSubmitting,
      onClick: editOpen ? handleSave : () => setEditOpen(true),
    },
  ];

  if (editOpen) {
    actions.push({
      key: 'cancel',
      label: '取消',
      variant: 'secondary',
      onClick: handleCancel,
    });
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <WorkspaceBreadcrumb
        {...buildStandardBreadcrumb({ workspace: 'notifications', detailLabel: notice.title })}
      />
      <DetailShell
        title={notice.title}
        subtitle={`${typeInfo.label}通知 · ${notice.id}`}
      breadcrumbs={[
        { label: '通知中心', href: '/notifications' },
        { label: notice.title },
      ]}
      backLink={{ label: '返回通知列表', href: '/notifications' }}
      actions={actions}
    >
      {/* 状态概览 */}
      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', marginBottom: 24 }}>
        <div style={statCardStyle}>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>状态</div>
          <div style={{ marginTop: 6 }}><StatusBadge label={statusInfo.label} variant={statusInfo.variant} size="sm" dot /></div>
          {notice.readAt ? <div style={{ marginTop: 4, fontSize: 11, color: '#64748b' }}>读取于 {notice.readAt}</div> : null}
        </div>
        <div style={statCardStyle}>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>类型</div>
          <div style={{ marginTop: 6 }}><StatusBadge label={typeInfo.label} variant={typeInfo.variant} size="sm" /></div>
        </div>
        <div style={statCardStyle}>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>优先级</div>
          <div style={{ marginTop: 6 }}><StatusBadge label={priorityInfo.label} variant={priorityInfo.variant} size="sm" /></div>
        </div>
        <div style={statCardStyle}>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>确认要求</div>
          <div style={{ marginTop: 6, fontSize: 20, fontWeight: 700, color: notice.ackRequired ? '#fbbf24' : '#4ade80' }}>
            {notice.ackRequired ? '需要' : '无需'}
          </div>
          {notice.ackedBy ? <div style={{ marginTop: 4, fontSize: 11, color: '#64748b' }}>已由 {notice.ackedBy} 确认</div> : null}
        </div>
      </div>

      {/* 编辑模式 */}
      {editOpen ? (
        <section
          style={{
            borderRadius: 16,
            padding: 24,
            background: 'rgba(15, 23, 42, 0.35)',
            border: '1px solid rgba(148, 163, 184, 0.18)',
            marginBottom: 24,
          }}
        >
          <h2 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700 }}>编辑通知内容</h2>

          {submitState.isSubmitting || submitState.errorMessage || submitState.successMessage ? (
            <div style={{ marginBottom: 16 }}>
              <FormSubmitFeedback state={submitState} />
            </div>
          ) : null}

          <FormField label="通知内容" required error={errors.content}>
            <textarea
              value={formData.content}
              onChange={(e) => {
                setFormData({ content: e.target.value });
                if (errors.content) setErrors({});
              }}
              disabled={submitState.isSubmitting}
              style={{ ...textareaStyle, minHeight: 200 }}
              placeholder="输入通知内容"
            />
          </FormField>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 12 }}>
            <SubmitButton
              loading={submitState.isSubmitting}
              disabled={submitState.isSubmitting}
              onClick={handleSave}
              variant="primary"
            >
              保存修改
            </SubmitButton>
            <SubmitButton
              disabled={submitState.isSubmitting}
              onClick={handleCancel}
              variant="secondary"
            >
              取消
            </SubmitButton>
          </div>
        </section>
      ) : null}

      {/* 详细信息卡片 */}
      <div
        style={{
          borderRadius: 16,
          padding: 24,
          background: 'rgba(15, 23, 42, 0.35)',
          border: '1px solid rgba(148, 163, 184, 0.18)',
          marginBottom: 24,
        }}
      >
        <h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700 }}>基本信息</h2>
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
          <InfoRow label="通知ID" value={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>{notice.id}<CopyToClipboard text={notice.id} size="sm" iconOnly /></span>} />
          <InfoRow label="作用域" value={`${SCOPE_MAP[notice.targetScope]} (${notice.targetId})`} />
          <InfoRow label="目标名称" value={notice.targetName} />
          <InfoRow label="发布者" value={notice.createdBy} />
          <InfoRow label="发布时间" value={notice.createdAt} />
          <InfoRow label="过期时间" value={notice.expiresAt} />
          {notice.readAt ? <InfoRow label="读取时间" value={notice.readAt} /> : null}
          {notice.ackedAt ? <InfoRow label="确认时间" value={notice.ackedAt} /> : null}
          {notice.ackedBy ? <InfoRow label="确认人" value={notice.ackedBy} /> : null}
        </div>

        {/* 标签 */}
        {notice.tags.length > 0 ? (
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(148, 163, 184, 0.1)' }}>
            <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 8 }}>标签</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {notice.tags.map((tag) => (
                <span key={tag} style={tagStyle}>{tag}</span>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {/* 内容卡片 */}
      <div
        style={{
          borderRadius: 16,
          padding: 24,
          background: 'rgba(15, 23, 42, 0.35)',
          border: '1px solid rgba(148, 163, 184, 0.18)',
        }}
      >
        <h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700 }}>通知内容</h2>
        <div style={{ fontSize: 14, color: '#e2e8f0', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
          {notice.content}
        </div>

        <DetailActionBar
          actions={detailActions}
          heading="详情收口动作"
          caption="复制 / 导出 / 分享当前通知详情"
        />
      </div>
    </DetailShell>
    <DetailClosureBar
      links={buildStandardClosureLinks({ workspace: 'notifications', detailId: notice.id })}
    />
    </div>
  );
}

// ---- 样式 ----

const statCardStyle: React.CSSProperties = {
  borderRadius: 16,
  padding: 16,
  background: 'rgba(15, 23, 42, 0.38)',
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
};

const tagStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '3px 10px',
  fontSize: 12,
  fontWeight: 500,
  borderRadius: 6,
  background: 'rgba(59, 130, 246, 0.12)',
  color: '#93c5fd',
  border: '1px solid rgba(59, 130, 246, 0.2)',
};
