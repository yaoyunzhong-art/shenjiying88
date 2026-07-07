/**
 * 客服工作台 — 小程序端 (Taro)
 * 角色视角: 👩‍💼客服人员
 * 功能: 服务工单、会员咨询、满意度评价、快捷操作
 */
import { View, Text, Button, Input, Textarea } from '@tarojs/components';
import { useState, useMemo } from 'react';
import Taro from '@tarojs/taro';

// ---- 类型 ----

type TicketStatus = 'pending' | 'processing' | 'resolved' | 'closed';
type TicketPriority = 'urgent' | 'high' | 'normal' | 'low';
type TicketCategory = 'complaint' | 'consultation' | 'return' | 'feedback' | 'other';
type SatisfactionRating = 'very_satisfied' | 'satisfied' | 'neutral' | 'dissatisfied' | 'very_dissatisfied';

interface ServiceTicket {
  id: string;
  customer: string;
  phone: string;
  category: TicketCategory;
  status: TicketStatus;
  priority: TicketPriority;
  subject: string;
  createdAt: string;
  updatedAt: string;
  satisfaction: SatisfactionRating | null;
  handler: string;
}

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  clicks: number;
}

interface QuickReply {
  id: string;
  label: string;
  content: string;
}

// ---- 常量 ----

const PRIORITY_LABELS: Record<TicketPriority, string> = { urgent: '紧急', high: '高', normal: '普通', low: '低' };
const PRIORITY_COLORS: Record<TicketPriority, string> = { urgent: '#ef4444', high: '#f97316', normal: '#3b82f6', low: '#64748b' };
const STATUS_LABELS: Record<TicketStatus, string> = { pending: '待处理', processing: '处理中', resolved: '已解决', closed: '已关闭' };
const STATUS_COLORS: Record<TicketStatus, string> = { pending: '#f59e0b', processing: '#3b82f6', resolved: '#22c55e', closed: '#64748b' };
const CATEGORY_LABELS: Record<TicketCategory, string> = { complaint: '投诉', consultation: '咨询', return: '退换货', feedback: '反馈', other: '其他' };
const SATISFACTION_LABELS: Record<SatisfactionRating, string> = { very_satisfied: '非常满意', satisfied: '满意', neutral: '一般', dissatisfied: '不满意', very_dissatisfied: '非常不满' };
const SATISFACTION_COLORS: Record<SatisfactionRating, string> = { very_satisfied: '#22c55e', satisfied: '#86efac', neutral: '#facc15', dissatisfied: '#f97316', very_dissatisfied: '#ef4444' };

// ---- Mock 数据 ----

const MOCK_TICKETS: ServiceTicket[] = [
  { id: 'TK-001', customer: '李女士', phone: '138****5678', category: 'complaint', status: 'pending', priority: 'urgent', subject: '产品质量问题，希望退货退款', createdAt: '2026-06-30 14:20', updatedAt: '2026-06-30 14:20', satisfaction: null, handler: '' },
  { id: 'TK-002', customer: '王先生', phone: '139****1234', category: 'consultation', status: 'processing', priority: 'high', subject: '会员积分兑换规则咨询', createdAt: '2026-06-30 11:05', updatedAt: '2026-06-30 13:30', satisfaction: null, handler: '张客服' },
  { id: 'TK-003', customer: '赵女士', phone: '137****9012', category: 'return', status: 'resolved', priority: 'normal', subject: '换货物流异常处理', createdAt: '2026-06-29 16:40', updatedAt: '2026-06-30 10:15', satisfaction: 'satisfied', handler: '张客服' },
  { id: 'TK-004', customer: '孙小姐', phone: '136****3456', category: 'feedback', status: 'closed', priority: 'low', subject: '建议增加门店自取服务', createdAt: '2026-06-28 09:30', updatedAt: '2026-06-29 17:00', satisfaction: 'very_satisfied', handler: '李客服' },
  { id: 'TK-005', customer: '周先生', phone: '135****7890', category: 'consultation', status: 'pending', priority: 'urgent', subject: '订单配送时间超时', createdAt: '2026-06-30 15:50', updatedAt: '2026-06-30 15:50', satisfaction: null, handler: '' },
  { id: 'TK-006', customer: '陈女士', phone: '158****2345', category: 'complaint', status: 'processing', priority: 'high', subject: '收到的商品与描述不符', createdAt: '2026-06-30 10:30', updatedAt: '2026-06-30 14:00', satisfaction: null, handler: '李客服' },
  { id: 'TK-007', customer: '林先生', phone: '159****6789', category: 'other', status: 'pending', priority: 'normal', subject: '企业团购咨询', createdAt: '2026-06-30 09:20', updatedAt: '2026-06-30 09:20', satisfaction: null, handler: '' },
  { id: 'TK-008', customer: '吴女士', phone: '186****4321', category: 'return', status: 'resolved', priority: 'normal', subject: '退货退款进度查询', createdAt: '2026-06-27 14:00', updatedAt: '2026-06-29 11:30', satisfaction: 'neutral', handler: '张客服' },
];

const MOCK_FAQS: FAQItem[] = [
  { id: 'faq-1', question: '如何查询订单物流？', answer: '进入"我的订单"页面，选择对应订单查看物流详情。', clicks: 128 },
  { id: 'faq-2', question: '退换货流程是什么？', answer: '请在订单详情页申请退换货，审核通过后安排上门取件。', clicks: 95 },
  { id: 'faq-3', question: '会员积分如何累积？', answer: '每消费1元累积1积分，特殊活动期间双倍积分。', clicks: 72 },
  { id: 'faq-4', question: '如何修改收货地址？', answer: '订单未发货前可在订单详情中修改收货地址。', clicks: 51 },
];

const MOCK_QUICK_REPLIES: QuickReply[] = [
  { id: 'qr-1', label: '问候', content: '您好，欢迎联系M5客服！请问有什么可以帮您？' },
  { id: 'qr-2', label: '致歉', content: '非常抱歉给您带来不便，我们会尽快为您处理。' },
  { id: 'qr-3', label: '物流查询', content: '请问您的订单号是？我帮您查询一下物流信息。' },
  { id: 'qr-4', label: '结束语', content: '感谢您的来电，祝您生活愉快！如有其他问题，随时联系我们。' },
];

// ---- 工具函数 ----

const formatDuration = (createdAt: string): string => {
  const now = new Date();
  const created = new Date(createdAt.replace(' ', 'T'));
  const diffMs = now.getTime() - created.getTime();
  const diffHours = Math.floor(diffMs / 3600000);
  if (diffHours < 1) return '不到1小时';
  if (diffHours < 24) return `${diffHours}小时前`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}天前`;
};

const getPriorityScore = (p: TicketPriority): number => ({ urgent: 4, high: 3, normal: 2, low: 1 })[p];

// ---- 组件 ----

export default function CustomerServicePage() {
  const [activeTab, setActiveTab] = useState<'ticket' | 'faq' | 'stats'>('ticket');
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [quickReplyVisible, setQuickReplyVisible] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  // 统计
  const pendingCount = MOCK_TICKETS.filter((t) => t.status === 'pending').length;
  const urgentCount = MOCK_TICKETS.filter((t) => t.priority === 'urgent').length;
  const processingCount = MOCK_TICKETS.filter((t) => t.status === 'processing').length;
  const resolvedCount = MOCK_TICKETS.filter((t) => t.status === 'resolved').length;
  const todayTickets = MOCK_TICKETS.filter((t) => t.createdAt.startsWith(todayStr)).length;

  // 满意度
  const ratedTickets = MOCK_TICKETS.filter((t) => t.satisfaction !== null);
  const positiveRated = ratedTickets.filter(
    (t) => t.satisfaction === 'very_satisfied' || t.satisfaction === 'satisfied',
  );
  const satisfactionRate = ratedTickets.length > 0
    ? Math.round((positiveRated.length / ratedTickets.length) * 100)
    : 0;

  // 工单过滤
  const filteredTickets = useMemo(() => {
    let list = MOCK_TICKETS;
    if (statusFilter !== 'all') list = list.filter((t) => t.status === statusFilter);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (t) => t.customer.toLowerCase().includes(q) || t.subject.toLowerCase().includes(q) || t.id.toLowerCase().includes(q),
      );
    }
    return list;
  }, [statusFilter, searchQuery]);

  // 排序: 紧急优先 > 待处理 > 处理中
  const sortedTickets = useMemo(() => {
    const order: Record<TicketStatus, number> = { pending: 0, processing: 1, resolved: 2, closed: 3 };
    return [...filteredTickets].sort((a, b) => {
      const pa = getPriorityScore(b.priority) - getPriorityScore(a.priority);
      if (pa !== 0) return pa;
      return order[a.status] - order[b.status];
    });
  }, [filteredTickets]);

  // 快捷操作
  const quickActions = [
    { label: '新建工单', icon: '📋', action: 'create' },
    { label: '知识库', icon: '📚', action: 'kb' },
    { label: '历史记录', icon: '📜', action: 'history' },
    { label: '我的业绩', icon: '📊', action: 'performance' },
  ];

  const handleQuickAction = (action: string) => {
    const labels: Record<string, string> = {
      create: '打开新建工单…',
      kb: '打开知识库…',
      history: '打开历史记录…',
      performance: '打开我的业绩…',
    };
    Taro.showToast({ title: labels[action] ?? '功能开发中', icon: 'none' });
  };

  const handleAcceptTicket = (id: string) => {
    Taro.showToast({ title: `已接单 ${id}`, icon: 'success' });
  };

  const handleCloseTicket = (id: string) => {
    Taro.showToast({ title: `工单 ${id} 已关闭`, icon: 'success' });
  };

  const handleInsertQuickReply = (content: string) => {
    setReplyContent((prev) => (prev ? `${prev}\n${content}` : content));
  };

  const handleSendReply = () => {
    if (!replyContent.trim()) {
      Taro.showToast({ title: '请先输入回复内容', icon: 'none' });
      return;
    }
    Taro.showToast({ title: '回复已发送 ✅', icon: 'success' });
    setReplyContent('');
    setQuickReplyVisible(false);
  };

  const handleApplyFAQ = (index: number) => {
    const faq = MOCK_FAQS[index];
    if (!faq) return;
    setReplyContent(faq.answer);
  };

  /* ---- 渲染: 工单列表 ---- */
  const renderTickets = () => (
    <View>
      {/* 统计摘要 */}
      <View style={statRow}>
        <View style={statCard}>
          <Text style={statLabel}>待处理</Text>
          <Text style={{ ...statValue, color: '#f59e0b' }}>{pendingCount}</Text>
        </View>
        <View style={statCard}>
          <Text style={statLabel}>处理中</Text>
          <Text style={{ ...statValue, color: '#3b82f6' }}>{processingCount}</Text>
        </View>
        <View style={statCard}>
          <Text style={statLabel}>今日新增</Text>
          <Text style={{ ...statValue, color: '#60a5fa' }}>{todayTickets}</Text>
        </View>
        <View style={statCard}>
          <Text style={statLabel}>满意度</Text>
          <Text style={{ ...statValue, color: '#22c55e', fontSize: 16 }}>{satisfactionRate}%</Text>
        </View>
      </View>

      {/* 紧急提醒 */}
      {urgentCount > 0 && (
        <View style={{
          padding: '8px 12px',
          marginTop: 8,
          borderRadius: 8,
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.3)',
        }}>
          <Text style={{ fontSize: 12, color: '#ef4444' }}>
            ⚠️ 有 {urgentCount} 个紧急工单待处理，请优先处理！
          </Text>
        </View>
      )}

      {/* 搜索与过滤 */}
      <View style={{ display: 'flex', gap: 6, marginTop: 12 }}>
        <Input
          style={{ ...searchInput, flex: 1 }}
          placeholder="搜索工单号/客户/标题…"
          value={searchQuery}
          onInput={(e) => setSearchQuery(e.detail.value)}
        />
      </View>
      <View style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
        {(['all', 'pending', 'processing', 'resolved', 'closed'] as const).map((s) => (
          <View
            key={s}
            style={{
              padding: '4px 10px',
              borderRadius: 12,
              background: statusFilter === s ? '#334155' : '#1e293b',
              border: `1px solid ${statusFilter === s ? 'rgba(59,130,246,0.5)' : 'rgba(148,163,184,0.15)'}`,
            }}
            onClick={() => setStatusFilter(s)}
          >
            <Text style={{ fontSize: 11, color: statusFilter === s ? '#93c5fd' : '#64748b' }}>
              {s === 'all' ? '全部' : STATUS_LABELS[s]}
            </Text>
          </View>
        ))}
      </View>

      {/* 工单列表 */}
      <View style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {sortedTickets.length === 0 ? (
          <View style={{ padding: 24, textAlign: 'center' }}>
            <Text style={{ color: '#64748b', fontSize: 14 }}>暂无匹配工单</Text>
          </View>
        ) : (
          sortedTickets.map((ticket) => (
            <View
              key={ticket.id}
              style={{
                padding: '12px',
                borderRadius: 10,
                background: 'rgba(15, 23, 42, 0.5)',
                border: `1px solid ${ticket.priority === 'urgent' ? 'rgba(239,68,68,0.3)' : 'rgba(148,163,184,0.1)'}`,
              }}
            >
              {/* 工单头 */}
              <View style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>{ticket.id}</Text>
                  <View style={{
                    padding: '2px 6px',
                    borderRadius: 6,
                    background: `${STATUS_COLORS[ticket.status]}22`,
                    border: `1px solid ${STATUS_COLORS[ticket.status]}44`,
                  }}>
                    <Text style={{ fontSize: 10, color: STATUS_COLORS[ticket.status] }}>
                      {STATUS_LABELS[ticket.status]}
                    </Text>
                  </View>
                  <View style={{
                    padding: '2px 6px',
                    borderRadius: 6,
                    background: `${PRIORITY_COLORS[ticket.priority]}22`,
                    border: `1px solid ${PRIORITY_COLORS[ticket.priority]}44`,
                  }}>
                    <Text style={{ fontSize: 10, color: PRIORITY_COLORS[ticket.priority] }}>
                      {PRIORITY_LABELS[ticket.priority]}
                    </Text>
                  </View>
                </View>
                <View style={{
                  padding: '2px 6px',
                  borderRadius: 6,
                  background: 'rgba(100,116,139,0.2)',
                }}>
                  <Text style={{ fontSize: 10, color: '#94a3b8' }}>{CATEGORY_LABELS[ticket.category]}</Text>
                </View>
              </View>

              {/* 客户信息 */}
              <Text style={{ fontSize: 13, color: '#e2e8f0', marginTop: 6, fontWeight: 500 }}>
                {ticket.customer} · {ticket.phone}
              </Text>

              {/* 主题 */}
              <Text style={{ fontSize: 12, color: '#94a3b8', marginTop: 4, lineHeight: '18px' }}>
                {ticket.subject}
              </Text>

              {/* 时间与操作 */}
              <View style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                <Text style={{ fontSize: 11, color: '#64748b' }}>
                  {formatDuration(ticket.createdAt)} · {ticket.handler || '未分配'}
                  {ticket.satisfaction && ` · ${SATISFACTION_LABELS[ticket.satisfaction]}`}
                </Text>
                <View style={{ display: 'flex', gap: 6 }}>
                  {ticket.status === 'pending' && (
                    <Button style={smallBtn} onClick={() => handleAcceptTicket(ticket.id)}>
                      接单
                    </Button>
                  )}
                  {(ticket.status === 'processing' || ticket.status === 'pending') && (
                    <Button style={{ ...smallBtn, background: '#16a34a' }} onClick={() => handleCloseTicket(ticket.id)}>
                      关闭
                    </Button>
                  )}
                </View>
              </View>
            </View>
          ))
        )}
      </View>
    </View>
  );

  /* ---- 渲染: FAQ ---- */
  const renderFAQ = () => (
    <View>
      <Text style={{ fontSize: 16, fontWeight: 600, color: '#f1f5f9' }}>常见问题知识库</Text>
      <Text style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>点击问题可快速填充回复内容</Text>

      <View style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {MOCK_FAQS.map((faq, idx) => (
          <View
            key={faq.id}
            style={{
              padding: '12px',
              borderRadius: 10,
              background: 'rgba(15, 23, 42, 0.5)',
              border: '1px solid rgba(148,163,184,0.1)',
            }}
            onClick={() => handleApplyFAQ(idx)}
          >
            <View style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 14, fontWeight: 500, color: '#e2e8f0' }}>{faq.question}</Text>
              <Text style={{ fontSize: 11, color: '#64748b' }}>
                {faq.clicks}次点击
                <Text style={{ marginLeft: 4, color: '#3b82f6' }}>使用 →</Text>
              </Text>
            </View>
            <Text style={{ fontSize: 12, color: '#94a3b8', marginTop: 6, lineHeight: '18px' }}>
              {faq.answer}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );

  /* ---- 渲染: 数据统计 ---- */
  const renderStats = () => {
    const categoryCounts = MOCK_TICKETS.reduce<Record<string, number>>((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + 1;
      return acc;
    }, {});

    return (
      <View>
        <Text style={{ fontSize: 16, fontWeight: 600, color: '#f1f5f9' }}>今日服务数据</Text>
        <Text style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{todayStr}</Text>

        {/* 核心指标 */}
        <View style={{ ...statRow, marginTop: 16 }}>
          <View style={statCard}>
            <Text style={statLabel}>总工单</Text>
            <Text style={{ ...statValue, color: '#60a5fa' }}>{MOCK_TICKETS.length}</Text>
          </View>
          <View style={statCard}>
            <Text style={statLabel}>待处理</Text>
            <Text style={{ ...statValue, color: '#f59e0b' }}>{pendingCount}</Text>
          </View>
          <View style={statCard}>
            <Text style={statLabel}>处理中</Text>
            <Text style={{ ...statValue, color: '#3b82f6' }}>{processingCount}</Text>
          </View>
          <View style={statCard}>
            <Text style={statLabel}>已解决</Text>
            <Text style={{ ...statValue, color: '#22c55e' }}>{resolvedCount}</Text>
          </View>
        </View>

        {/* 分类分布 */}
        <Text style={{ fontSize: 14, fontWeight: 500, color: '#e2e8f0', marginTop: 20, marginBottom: 10 }}>
          工单分类分布
        </Text>
        <View style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(Object.keys(CATEGORY_LABELS) as TicketCategory[]).map((cat) => {
            const count = categoryCounts[cat] ?? 0;
            const pct = MOCK_TICKETS.length > 0 ? Math.round((count / MOCK_TICKETS.length) * 100) : 0;
            return (
              <View key={cat} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Text style={{ width: 48, fontSize: 12, color: '#94a3b8' }}>{CATEGORY_LABELS[cat]}</Text>
                <View style={{
                  flex: 1,
                  height: 8,
                  borderRadius: 4,
                  background: '#1e293b',
                  overflow: 'hidden',
                }}>
                  <View style={{
                    width: `${pct}%`,
                    height: '100%',
                    borderRadius: 4,
                    background: cat === 'complaint' ? '#ef4444' : cat === 'consultation' ? '#3b82f6' : cat === 'return' ? '#f97316' : cat === 'feedback' ? '#22c55e' : '#64748b',
                  }} />
                </View>
                <Text style={{ width: 32, fontSize: 12, color: '#e2e8f0', textAlign: 'right' }}>{pct}%</Text>
              </View>
            );
          })}
        </View>

        {/* 满意度 */}
        <Text style={{ fontSize: 14, fontWeight: 500, color: '#e2e8f0', marginTop: 20, marginBottom: 10 }}>
          满意度评价
        </Text>
        {ratedTickets.length === 0 ? (
          <View style={{ padding: 16, textAlign: 'center', background: 'rgba(15,23,42,0.4)', borderRadius: 8 }}>
            <Text style={{ color: '#64748b', fontSize: 13 }}>暂无评价数据</Text>
          </View>
        ) : (
          <View style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(Object.keys(SATISFACTION_LABELS) as SatisfactionRating[]).map((rating) => {
              const count = ratedTickets.filter((t) => t.satisfaction === rating).length;
              return count > 0 ? (
                <View key={rating} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Text style={{ fontSize: 12, color: SATISFACTION_COLORS[rating] }}>
                    {SATISFACTION_LABELS[rating]}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#e2e8f0' }}>{count}条</Text>
                </View>
              ) : null;
            })}
            <Text style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
              综合满意度: {satisfactionRate}% ({positiveRated.length}/{ratedTickets.length})
            </Text>
          </View>
        )}
      </View>
    );
  };

  /* ---- 渲染: 快捷回复面板 ---- */
  const renderQuickReplyPanel = () => (
    <View style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      padding: 16,
      background: '#1e293b',
      borderTop: '1px solid rgba(148,163,184,0.2)',
      zIndex: 100,
    }}>
      <View style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Text style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>快捷回复</Text>
        <Text
          style={{ fontSize: 14, color: '#3b82f6' }}
          onClick={() => setQuickReplyVisible(false)}
        >
          关闭
        </Text>
      </View>
      <View style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {MOCK_QUICK_REPLIES.map((qr) => (
          <View
            key={qr.id}
            style={{
              padding: '6px 10px',
              borderRadius: 6,
              background: '#334155',
              border: '1px solid rgba(148,163,184,0.15)',
            }}
            onClick={() => handleInsertQuickReply(qr.content)}
          >
            <Text style={{ fontSize: 12, color: '#93c5fd' }}>{qr.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <View style={{ padding: '16px', color: '#e2e8f0', background: '#0f172a', minHeight: '100vh', paddingBottom: quickReplyVisible ? 160 : 16 }}>
      {/* 顶栏 */}
      <View style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: 20, fontWeight: 700, color: '#f1f5f9' }}>客服工作台</Text>
        <Text style={{ fontSize: 12, color: '#64748b' }}>{todayStr}</Text>
      </View>

      {/* 快捷操作区 */}
      <View style={{ display: 'flex', gap: 10, marginTop: 16 }}>
        {quickActions.map((qa) => (
          <View
            key={qa.action}
            style={{
              flex: 1,
              padding: '12px 4px',
              borderRadius: 12,
              background: 'rgba(30, 41, 59, 0.6)',
              border: '1px solid rgba(148,163,184,0.1)',
              alignItems: 'center',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
            onClick={() => handleQuickAction(qa.action)}
          >
            <Text style={{ fontSize: 20 }}>{qa.icon}</Text>
            <Text style={{ fontSize: 11, color: '#94a3b8' }}>{qa.label}</Text>
          </View>
        ))}
      </View>

      {/* Tab 切换 */}
      <View
        style={{
          display: 'flex',
          gap: 0,
          marginTop: 20,
          background: '#1e293b',
          borderRadius: 10,
          padding: 3,
        }}
      >
        {[
          { key: 'ticket' as const, label: '服务工单', badge: pendingCount + processingCount },
          { key: 'faq' as const, label: '知识库' },
          { key: 'stats' as const, label: '数据统计' },
        ].map((tab) => (
          <View
            key={tab.key}
            style={{
              flex: 1,
              padding: '8px 4px',
              borderRadius: 8,
              background: activeTab === tab.key ? '#334155' : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
              display: 'flex',
              gap: 4,
            }}
            onClick={() => setActiveTab(tab.key)}
          >
            <Text style={{
              fontSize: 13,
              fontWeight: activeTab === tab.key ? 600 : 400,
              color: activeTab === tab.key ? '#e2e8f0' : '#64748b',
            }}>
              {tab.label}
            </Text>
            {tab.badge !== undefined && tab.badge > 0 ? (
              <View style={{
                padding: '1px 6px',
                borderRadius: 8,
                background: activeTab === tab.key ? '#3b82f6' : '#475569',
              }}>
                <Text style={{ fontSize: 10, color: '#fff' }}>{tab.badge}</Text>
              </View>
            ) : null}
          </View>
        ))}
      </View>

      {/* Tab 内容 */}
      <View style={{ marginTop: 16 }}>
        {activeTab === 'ticket' && renderTickets()}
        {activeTab === 'faq' && renderFAQ()}
        {activeTab === 'stats' && renderStats()}
      </View>

      {/* 快捷回复入口 */}
      <View style={{ marginTop: 16, textAlign: 'center' }}>
        <Button
          style={{
            padding: '8px 20px',
            borderRadius: 8,
            background: '#2563eb',
            color: '#fff',
            fontSize: 13,
            border: 'none',
            minWidth: 140,
          }}
          onClick={() => setQuickReplyVisible((v) => !v)}
        >
          {quickReplyVisible ? '收起快捷回复' : '✏️ 快捷回复'}
        </Button>
      </View>

      {/* 回复编辑区 */}
      {(activeTab === 'ticket') && (
        <View style={{ marginTop: 12 }}>
          <Textarea
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 8,
              background: '#1e293b',
              color: '#e2e8f0',
              fontSize: 13,
              border: '1px solid rgba(148,163,184,0.2)',
              minHeight: 72,
            }}
            placeholder="输入回复内容… 或点击上方的 快捷回复 按钮使用模板"
            value={replyContent}
            onInput={(e) => setReplyContent(e.detail.value)}
          />
          <Button
            style={{
              marginTop: 8,
              padding: '8px 20px',
              borderRadius: 8,
              background: '#16a34a',
              color: '#fff',
              fontSize: 13,
              border: 'none',
              width: '100%',
            }}
            onClick={handleSendReply}
          >
            发送回复
          </Button>
        </View>
      )}

      {/* 快捷回复面板 */}
      {quickReplyVisible && renderQuickReplyPanel()}
    </View>
  );
}

// ---- 样式常量 ----

const statRow: React.CSSProperties = {
  display: 'flex',
  gap: 6,
};

const statCard: React.CSSProperties = {
  flex: 1,
  padding: '8px',
  borderRadius: 8,
  background: 'rgba(15, 23, 42, 0.4)',
  border: '1px solid rgba(148,163,184,0.1)',
};

const statLabel: React.CSSProperties = {
  fontSize: 10,
  color: '#94a3b8',
};

const statValue: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 700,
  marginTop: 2,
};

const searchInput: React.CSSProperties = {
  padding: '8px 10px',
  borderRadius: 6,
  background: '#1e293b',
  color: '#e2e8f0',
  fontSize: 13,
  border: '1px solid rgba(148,163,184,0.2)',
};

const smallBtn: React.CSSProperties = {
  padding: '3px 10px',
  borderRadius: 6,
  background: '#2563eb',
  color: '#fff',
  fontSize: 11,
  border: 'none',
  lineHeight: '18px',
  minWidth: 48,
};
