'use client';

import React, { useState, useMemo, useCallback } from 'react';

import {
  PageShell,
  Card,
  StatCard,
  StatusBadge,
  Button,
  EmptyState,
  SearchFilterInput,
  usePagination,
  useSearchFilter,
  Pagination,
} from '@m5/ui';

// ---- 类型 ----

type MessageType = 'chat' | 'system' | 'customer_service' | 'broadcast';
type MessagePriority = 'high' | 'medium' | 'low';

interface MessageSession {
  id: string;
  contactName: string;
  contactAvatar?: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  type: MessageType;
  priority: MessagePriority;
  online: boolean;
  messages: Message[];
}

interface Message {
  id: string;
  content: string;
  sender: 'me' | 'other';
  sentAt: string;
  read: boolean;
}

// ---- 常量 ----

const TYPE_LABELS: Record<MessageType, string> = {
  chat: '会话消息',
  system: '系统消息',
  customer_service: '客服消息',
  broadcast: '广播通知',
};

const TYPE_ICONS: Record<MessageType, string> = {
  chat: '💬',
  system: '⚙️',
  customer_service: '🎧',
  broadcast: '📢',
};

const PRIORITY_VARIANTS: Record<MessagePriority, 'error' | 'warning' | 'info'> = {
  high: 'error',
  medium: 'warning',
  low: 'info',
};

// ---- Mock 数据生成 ----

function generateSessions(count: number): MessageSession[] {
  const types: MessageType[] = ['chat', 'system', 'customer_service', 'broadcast'];
  const contactNames = [
    '张伟（VIP会员）', '李娜（普通会员）', '王强（供应商）',
    '刘洋（门店经理）', '陈静（客服专员）', '赵明（配送员）',
    '系统服务中心', '运营管理组', '会员运营中心',
    '仓库管理员', '巡店督导组', '财务结算组',
  ];
  const lastMessages = [
    '好的，我马上安排补货',
    '请问这个订单什么时候能发货？',
    '系统将于今晚 02:00 进行维护',
    '新一批会员卡已到店，请查收',
    '今天的销售数据已同步完成',
    '客服提醒：有 3 个待处理退款请求',
    '促销活动已上线，请及时检查',
    '库存预警：电竞椅仅剩 2 件',
    '您的审批请求已通过',
    '巡店任务已完成，请查看报告',
    '月度结算报表已生成',
    '设备巡检通知：请检查收银台',
  ];

  return Array.from({ length: count }, (_, i) => {
    const type = types[i % types.length];
    const contactName = contactNames[i % contactNames.length];
    const lastMsg = lastMessages[i % lastMessages.length];
    const hourlyOffset = i * 3 + 1;
    const hour = Math.floor(hourlyOffset);
    const minute = (hourlyOffset % 60);
    const day = 15 - Math.floor(i / 8);

    // 生成会话内的消息历史
    const messageCount = 3 + (i % 5);
    const messages: Message[] = Array.from({ length: messageCount }, (_, j) => {
      const msgHour = 8 + (j * 2) % 10;
      return {
        id: `MSG-${String(i + 1).padStart(4, '0')}-${String(j + 1).padStart(3, '0')}`,
        content: j === messageCount - 1 ? lastMsg : `这是第 ${j + 1} 条消息内容，来自会话 ${i + 1}。`,
        sender: j % 2 === 0 ? 'other' : 'me',
        sentAt: `2026-07-${String(day).padStart(2, '0')} ${String(msgHour).padStart(2, '0')}:${String((j * 13) % 60).padStart(2, '0')}`,
        read: i < count * 0.5 || j < messageCount - 1,
      };
    });

    return {
      id: `SESSION-${String(i + 1).padStart(4, '0')}`,
      contactName,
      lastMessage: lastMsg,
      lastMessageAt: `2026-07-${String(day).padStart(2, '0')} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
      unreadCount: i < count * 0.6 ? (i % 5) + 1 : 0,
      type,
      priority: i < 3 ? 'high' : (i < 10 ? 'medium' : 'low'),
      online: i % 3 !== 0,
      messages,
    };
  });
}

const MOCK_SESSIONS = generateSessions(18);

// ---- 辅助函数 ----

function formatRelativeTime(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return '刚刚';
  if (diffMin < 60) return `${diffMin}分钟前`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}小时前`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay}天前`;
  return d.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
}

function filterSessions(
  sessions: MessageSession[],
  typeFilter: MessageType | 'all',
  searchQuery: string,
): MessageSession[] {
  let result = sessions;
  if (typeFilter !== 'all') {
    result = result.filter((s) => s.type === typeFilter);
  }
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    result = result.filter(
      (s) =>
        s.contactName.toLowerCase().includes(q) ||
        s.lastMessage.toLowerCase().includes(q)
    );
  }
  return result;
}

function sortSessions(sessions: MessageSession[]): MessageSession[] {
  return [...sessions].sort(
    (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
  );
}

function getUnreadStats(sessions: MessageSession[]): { totalUnread: number; sessionCount: number } {
  let totalUnread = 0;
  let sessionCount = 0;
  for (const s of sessions) {
    if (s.unreadCount > 0) {
      totalUnread += s.unreadCount;
      sessionCount++;
    }
  }
  return { totalUnread, sessionCount };
}

// ---- 子组件 ----

/** 统计卡片组 */
function MessageStats({ sessions }: { sessions: MessageSession[] }) {
  const { totalUnread, sessionCount } = getUnreadStats(sessions);
  const todayCount = sessions.filter((s) => {
    const d = new Date(s.lastMessageAt);
    return d.toDateString() === new Date().toDateString();
  }).length;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: 12,
        marginBottom: 20,
      }}
    >
      <StatCard label="全部会话" value={sessions.length.toString()} variant="info" />
      <StatCard label="未读会话" value={sessionCount.toString()} variant="warning" />
      <StatCard label="未读消息" value={totalUnread.toString()} variant="error" />
      <StatCard label="今日消息" value={todayCount.toString()} variant="success" />
    </div>
  );
}

/** 分类筛选标签 */
function MessageTypeTabs({
  activeType,
  onChange,
}: {
  activeType: MessageType | 'all';
  onChange: (key: MessageType | 'all') => void;
}) {
  const counts: Record<string, number> = {};
  const allTypes: MessageType[] = ['chat', 'system', 'customer_service', 'broadcast'];
  allTypes.forEach((t) => {
    counts[t] = MOCK_SESSIONS.filter((s) => s.type === t).length;
  });

  const tabs = [
    { key: 'all' as const, label: '全部', count: MOCK_SESSIONS.length },
    ...allTypes.map((t) => ({
      key: t as MessageType | 'all',
      label: `${TYPE_ICONS[t]} ${TYPE_LABELS[t]}`,
      count: counts[t]!,
    })),
  ];

  return (
    <div
      style={{
        display: 'flex',
        gap: 8,
        marginBottom: 16,
        flexWrap: 'wrap',
      }}
    >
      {tabs.map((tab) => (
        <div
          key={tab.key}
          onClick={() => onChange(tab.key)}
          style={{
            padding: '6px 14px',
            borderRadius: 8,
            background: tab.key === activeType ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${tab.key === activeType ? 'rgba(99,102,241,0.4)' : 'rgba(148,163,184,0.08)'}`,
            color: tab.key === activeType ? '#818cf8' : '#cbd5e1',
            fontSize: 13,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(99,102,241,0.1)';
            e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)';
            e.currentTarget.style.color = '#818cf8';
          }}
          onMouseLeave={(e) => {
            if (tab.key !== activeType) {
              e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
              e.currentTarget.style.borderColor = 'rgba(148,163,184,0.08)';
              e.currentTarget.style.color = '#cbd5e1';
            }
          }}
        >
          {tab.label} <span style={{ color: '#64748b', fontSize: 11 }}>({tab.count})</span>
        </div>
      ))}
    </div>
  );
}

/** 单条会话行 */
function SessionItem({
  session,
  onMarkRead,
}: {
  session: MessageSession;
  onMarkRead: (id: string) => void;
}) {
  return (
    <div
      style={{
        padding: '12px 16px',
        borderRadius: 10,
        background: session.unreadCount > 0 ? 'rgba(30,41,59,0.5)' : 'rgba(255,255,255,0.02)',
        border: `1px solid ${session.unreadCount > 0 ? 'rgba(99,102,241,0.2)' : 'rgba(148,163,184,0.06)'}`,
        marginBottom: 8,
        transition: 'all 0.15s',
        cursor: 'pointer',
        display: 'flex',
        gap: 12,
        alignItems: 'center',
        position: 'relative' as const,
      }}
    >
      {/* 在线指示器 */}
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: session.online ? '#22c55e' : '#475569',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: 14,
          fontWeight: 600,
          flexShrink: 0,
          position: 'relative',
        }}
      >
        {session.contactName.charAt(0)}
        {/* 在线绿点 */}
        {session.online && (
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: '#22c55e',
              border: '2px solid #0f172a',
              position: 'absolute',
              bottom: -2,
              right: -2,
            }}
          />
        )}
      </div>

      {/* 会话详情 */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>
            {session.contactName}
          </span>
          <StatusBadge
            label={TYPE_LABELS[session.type]}
            variant="neutral"
            size="sm"
          />
          <StatusBadge
            label={session.priority === 'high' ? '紧急' : '普通'}
            variant={PRIORITY_VARIANTS[session.priority]}
            size="sm"
          />
        </div>
        <div
          style={{
            fontSize: 13,
            color: '#94a3b8',
            lineHeight: 1.4,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: 400,
          }}
        >
          {session.lastMessage}
        </div>
        <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
          {formatRelativeTime(session.lastMessageAt)}
        </div>
      </div>

      {/* 未读数 + 操作 */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
        {session.unreadCount > 0 && (
          <div
            style={{
              background: '#818cf8',
              color: '#fff',
              fontSize: 11,
              fontWeight: 700,
              borderRadius: 10,
              padding: '1px 8px',
              minWidth: 20,
              textAlign: 'center',
            }}
          >
            {session.unreadCount > 99 ? '99+' : session.unreadCount}
          </div>
        )}
        <Button variant="ghost" size="sm" onClick={() => onMarkRead(session.id)}>
          标为已读
        </Button>
      </div>
    </div>
  );
}

/** 加载骨架屏 */
function LoadingSkeleton() {
  return (
    <div style={{ padding: 32, maxWidth: 900 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              height: 70,
              borderRadius: 10,
              background: 'linear-gradient(90deg, rgba(30,41,59,0.4) 25%, rgba(30,41,59,0.6) 50%, rgba(30,41,59,0.4) 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.5s infinite',
            }}
          />
        ))}
      </div>
      <div style={{ height: 40, borderRadius: 10, background: 'rgba(30,41,59,0.3)', marginBottom: 16 }} />
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          style={{
            height: 80,
            borderRadius: 10,
            background: 'rgba(30,41,59,0.3)',
            marginBottom: 8,
          }}
        />
      ))}
    </div>
  );
}

/** 空状态 */
function MessagesEmptyState() {
  return (
    <EmptyState
      title="暂无消息"
      description="当前没有任何会话消息。新的会话消息产生后会出现在这里。"
      actionLabel="刷新"
      actionHref="/messages"
    />
  );
}

/** "全部已读"按钮 */
function MarkAllReadButton({
  unreadSessionCount,
  onMarkAll,
}: {
  unreadSessionCount: number;
  onMarkAll: () => void;
}) {
  if (unreadSessionCount === 0) return null;
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
      <Button variant="ghost" size="sm" onClick={onMarkAll}>
        全部标为已读 ({unreadSessionCount}个会话)
      </Button>
    </div>
  );
}

// ---- 主组件 ----

export default function MessagesPage() {
  const [activeType, setActiveType] = useState<MessageType | 'all'>('all');
  const [sessions, setSessions] = useState<MessageSession[]>(MOCK_SESSIONS);
  const searchFilter = useSearchFilter('', 300);
  const pagination = usePagination({ initialPageSize: 6 });

  // 过滤
  const filtered = useMemo(
    () => filterSessions(sessions, activeType, searchFilter.value),
    [sessions, activeType, searchFilter.value]
  );

  // 排序
  const sorted = useMemo(() => sortSessions(filtered), [filtered]);

  // 未读统计
  const { totalUnread, sessionCount: unreadSessionCount } = useMemo(
    () => getUnreadStats(sessions),
    [sessions]
  );

  // 分页
  const pagedSessions = sorted.slice(
    (pagination.page - 1) * pagination.pageSize,
    pagination.page * pagination.pageSize
  );

  const totalPages = Math.ceil(sorted.length / pagination.pageSize);

  const handlePageChange = useCallback(
    (newPage: number) => {
      pagination.setPage(newPage);
    },
    [pagination]
  );

  // 标记单个会话已读
  const handleMarkRead = useCallback(
    (sessionId: string) => {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId ? { ...s, unreadCount: 0, messages: s.messages.map((m) => ({ ...m, read: true })) } : s
        )
      );
    },
    []
  );

  // 全部标为已读
  const handleMarkAllRead = useCallback(() => {
    setSessions((prev) =>
      prev.map((s) => ({
        ...s,
        unreadCount: 0,
        messages: s.messages.map((m) => ({ ...m, read: true })),
      }))
    );
  }, []);

  return (
    <PageShell title="消息中心" subtitle="管理所有会话消息、系统通知和客服对话">
      {/* 统计 */}
      <MessageStats sessions={sessions} />

      {/* 全部已读 */}
      <MarkAllReadButton
        unreadSessionCount={unreadSessionCount}
        onMarkAll={handleMarkAllRead}
      />

      {/* 搜索 */}
      <div style={{ marginBottom: 12 }}>
        <SearchFilterInput
          placeholder="搜索联系人名称、消息内容..."
          value={searchFilter.value}
          onChange={(v) => searchFilter.setValue(v)}
        />
      </div>

      {/* 分类筛选 */}
      <MessageTypeTabs
        activeType={activeType}
        onChange={(key) => {
          setActiveType(key);
          pagination.setPage(1);
        }}
      />

      {/* 会话列表 */}
      <div>
        {pagedSessions.length === 0 ? (
          <MessagesEmptyState />
        ) : (
          pagedSessions.map((s) => (
            <SessionItem key={s.id} session={s} onMarkRead={handleMarkRead} />
          ))
        )}
      </div>

      {/* 分页 */}
      {sorted.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <Pagination
            page={pagination.page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            pageSize={pagination.pageSize}
            onPageSizeChange={pagination.setPageSize}
            total={sorted.length}
          />
        </div>
      )}
    </PageShell>
  );
}
