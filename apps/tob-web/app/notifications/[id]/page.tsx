'use client';

import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';

import { PageShell, StatusBadge } from '@m5/ui';

interface NotificationDetail {
  id: string;
  title: string;
  content: string;
  type: 'system' | 'alert' | 'reminder' | 'announcement';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'unread' | 'read' | 'archived';
  createdAt: string;
  expiresAt: string;
}

type BadgeV = 'success' | 'neutral' | 'warning' | 'danger';

const LABELS: Record<string, { label: string; variant: BadgeV }> = {
  system: { label: '系统', variant: 'neutral' },
  alert: { label: '告警', variant: 'danger' },
  reminder: { label: '提醒', variant: 'warning' },
  announcement: { label: '公告', variant: 'success' },
  urgent: { label: '紧急', variant: 'danger' },
  high: { label: '高', variant: 'warning' },
  medium: { label: '中', variant: 'success' },
  low: { label: '低', variant: 'neutral' },
  unread: { label: '未读', variant: 'warning' },
  read: { label: '已读', variant: 'neutral' },
  archived: { label: '已归档', variant: 'neutral' },
};

const MOCK_DATA: Record<string, NotificationDetail> = {
  n1: { id: 'n1', title: '系统维护通知', content: '平台将于 2026-06-16 02:00-04:00 进行季度维护，届时部分服务可能短暂不可用。建议提前做好业务安排，如有疑问请联系技术支持。', type: 'system', priority: 'high', status: 'unread', createdAt: '2026-06-14 04:00:00', expiresAt: '2026-06-17 04:00:00' },
  n2: { id: 'n2', title: '新合作品牌上线', content: '品牌 TechCore 已完成入驻配置，可查看品牌详情。请确保品牌资料和价格策略已正确配置。', type: 'announcement', priority: 'medium', status: 'unread', createdAt: '2026-06-14 03:30:00', expiresAt: '2026-07-14 03:30:00' },
  n3: { id: 'n3', title: '⚠️ SSL 证书即将过期', content: '您的 SSL 证书将在 7 天内过期。请尽快登录控制台进行证书续期操作，避免服务中断。', type: 'alert', priority: 'urgent', status: 'unread', createdAt: '2026-06-14 03:00:00', expiresAt: '2026-06-28 03:00:00' },
  n4: { id: 'n4', title: 'API 调用配额提醒', content: '您的 API 调用配额已使用 85%。建议联系运营团队评估是否需要扩容以避免限流。', type: 'reminder', priority: 'medium', status: 'unread', createdAt: '2026-06-14 02:30:00', expiresAt: '2026-06-21 02:30:00' },
  n5: { id: 'n5', title: '门店状态变更', content: '门店「杭州银泰旗舰店」运营状态已更新为「正常运营」。如有疑问请联系运营团队。', type: 'alert', priority: 'high', status: 'read', createdAt: '2026-06-14 02:00:00', expiresAt: '2026-06-21 02:00:00' },
  n6: { id: 'n6', title: '月度运营报告已发布', content: '2026 年 5 月运营月报已发布，涵盖 12 个市场、24 个门店的运营数据摘要，请在分析模块查看完整报告。', type: 'announcement', priority: 'low', status: 'read', createdAt: '2026-06-13 18:00:00', expiresAt: '2026-07-13 18:00:00' },
  n7: { id: 'n7', title: '新功能：智能搜索', content: '平台已上线智能搜索功能，支持跨市场、跨租户的全文搜索。详情请查看帮助文档或联系产品团队。', type: 'announcement', priority: 'low', status: 'read', createdAt: '2026-06-13 15:00:00', expiresAt: '2026-09-13 15:00:00' },
  n8: { id: 'n8', title: '⚠️ 边缘节点离线', content: '边缘节点 en-019 已离线超过 1 小时，影响相关门店数据同步。技术团队已收到通知并正在处理。', type: 'alert', priority: 'urgent', status: 'unread', createdAt: '2026-06-13 14:30:00', expiresAt: '2026-06-14 14:30:00' },
  n9: { id: 'n9', title: '季度审计报告已生成', content: '2026 Q2 审计报告已自动生成，相关方可在财务模块查看完整报告。如有疑问请联系审计部门。', type: 'system', priority: 'low', status: 'archived', createdAt: '2026-06-13 12:00:00', expiresAt: '2026-09-30 12:00:00' },
  n10: { id: 'n10', title: '数据备份确认', content: '2026-06-13 全量备份已完成并验证，备份文件大小 48.2 GB，保留至 2026-07-13。', type: 'system', priority: 'low', status: 'archived', createdAt: '2026-06-13 08:00:00', expiresAt: '2026-07-13 08:00:00' },
  n11: { id: 'n11', title: '安全补丁已推送', content: '所有节点已接收安全补丁 v2.4.1，修复了 3 个中危漏洞和 1 个高危漏洞。请确认各节点已成功更新。', type: 'system', priority: 'high', status: 'read', createdAt: '2026-06-12 14:00:00', expiresAt: '2026-06-26 14:00:00' },
  n12: { id: 'n12', title: '敏感数据访问检测', content: '检测到未授权数据访问尝试，已自动阻断并记录审计。安全团队正在溯源。', type: 'alert', priority: 'urgent', status: 'unread', createdAt: '2026-06-14 01:00:00', expiresAt: '2026-06-17 01:00:00' },
  n13: { id: 'n13', title: 'SEO 配置提醒', content: '新加坡市场的 SEO 元数据已过期，建议在 2 天内更新以保持搜索引擎优化效果。', type: 'reminder', priority: 'low', status: 'read', createdAt: '2026-06-07 10:00:00', expiresAt: '2026-06-15 10:00:00' },
  n14: { id: 'n14', title: '租户入驻确认', content: '新租户已提交入驻审核，请在管理控制台处理。审核流程预计 2-3 个工作日完成。', type: 'announcement', priority: 'medium', status: 'unread', createdAt: '2026-06-12 16:00:00', expiresAt: '2026-06-15 16:00:00' },
  n15: { id: 'n15', title: '消防安全整改通知', content: '门店消防安全检查结果已发布，请在门店管理模块查看整改清单。整改截止日期为 2026-07-01。', type: 'alert', priority: 'high', status: 'unread', createdAt: '2026-06-13 10:00:00', expiresAt: '2026-06-20 10:00:00' },
};

function row(label: string, value: string) {
  return (
    <div style={{ display: 'flex', gap: 12, padding: '8px 12px', borderBottom: '1px solid rgba(148,163,184,0.08)' }}>
      <div style={{ width: 100, fontSize: 13, color: '#94a3b8', flexShrink: 0 }}>{label}</div>
      <div style={{ fontSize: 13, color: '#e2e8f0' }}>{value}</div>
    </div>
  );
}

export default function NotificationDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const notif = useMemo<NotificationDetail | null>(() => MOCK_DATA[id] ?? null, [id]);

  if (!notif) {
    return (
      <main style={{ maxWidth: 720, margin: '0 auto', padding: 48, textAlign: 'center' }}>
        <PageShell title="通知不存在" description="未找到该通知">
          <div style={{ fontSize: 16, color: '#94a3b8', marginTop: 24 }}>
            通知 ID &quot;{id}&quot; 不存在或已被删除。
          </div>
          <button
            onClick={() => router.push('/notifications')}
            style={{
              marginTop: 24, padding: '10px 24px', border: 'none', borderRadius: 8,
              background: 'rgba(59,130,246,0.15)', color: '#93c5fd', cursor: 'pointer', fontSize: 14,
            }}
          >
            ← 返回通知列表
          </button>
        </PageShell>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: 32 }}>
      <PageShell title={notif.title} description="通知详情">
        <div
          style={{
            background: 'rgba(15,23,42,0.5)',
            border: '1px solid rgba(148,163,184,0.12)',
            borderRadius: 12,
            padding: 24,
          }}
        >
          {/* 头部 badge */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <StatusBadge label={LABELS[notif.status]?.label ?? notif.status} variant={(LABELS[notif.status] as { label: string; variant: BadgeV })?.variant ?? 'neutral'} size="sm" dot />
            <StatusBadge label={LABELS[notif.type]?.label ?? notif.type} variant={(LABELS[notif.type] as { label: string; variant: BadgeV })?.variant ?? 'neutral'} size="sm" />
            <StatusBadge label={LABELS[notif.priority]?.label ?? notif.priority} variant={(LABELS[notif.priority] as { label: string; variant: BadgeV })?.variant ?? 'neutral'} size="sm" />
          </div>

          {/* 内容 */}
          <div style={{ fontSize: 14, color: '#e2e8f0', lineHeight: 1.8, marginBottom: 20, whiteSpace: 'pre-wrap' }}>
            {notif.content}
          </div>

          {/* 元数据 */}
          <div style={{ borderRadius: 8, background: 'rgba(0,0,0,0.2)', overflow: 'hidden' }}>
            {row('通知 ID', notif.id)}
            {row('发布时间', notif.createdAt)}
            {row('过期时间', notif.expiresAt)}
            {row('类型', LABELS[notif.type]?.label ?? notif.type)}
            {row('优先级', LABELS[notif.priority]?.label ?? notif.priority)}
            {row('状态', LABELS[notif.status]?.label ?? notif.status)}
          </div>

          {/* 返回按钮 */}
          <div style={{ marginTop: 24 }}>
            <button
              onClick={() => router.push('/notifications')}
              style={{
                padding: '10px 24px', border: 'none', borderRadius: 8,
                background: 'rgba(59,130,246,0.15)', color: '#93c5fd',
                cursor: 'pointer', fontSize: 14, fontWeight: 500,
              }}
            >
              ← 返回通知列表
            </button>
          </div>
        </div>
      </PageShell>
    </main>
  );
}
