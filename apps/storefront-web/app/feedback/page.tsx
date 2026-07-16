/**
 * 意见反馈 — Feedback (storefront-web)
 * 角色视角: 👤会员 / 👔店长
 * 功能: 提交反馈、历史记录、分类筛选、待处理/已处理状态管理、评分、附图、空/错状态
 */
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { PageShell, StatusBadge } from '@m5/ui';

/* ── 类型 ── */
type FeedbackStatus = 'pending' | 'processing' | 'resolved' | 'closed';
type FeedbackCategory = 'suggestion' | 'complaint' | 'question' | 'praise' | 'bug' | 'other';

interface FeedbackRecord {
  id: string;
  date: string;
  category: FeedbackCategory;
  content: string;
  rating: number; // 1-5
  status: FeedbackStatus;
  reply?: string;
  replyDate?: string;
  images?: string[];
}

/* ── Mock 数据 (35+) ── */
const ALL_FEEDBACK: FeedbackRecord[] = [
  { id: 'FB001', date: '2026-07-15', category: 'suggestion', content: '建议增加更多种类的游戏币套餐，比如月卡季卡年卡', rating: 4, status: 'resolved', reply: '感谢您的建议，我们将在下月推出月卡套餐', replyDate: '2026-07-16' },
  { id: 'FB002', date: '2026-07-15', category: 'praise', content: '工作人员态度很好，环境干净整洁，孩子玩得很开心', rating: 5, status: 'resolved' },
  { id: 'FB002', date: '2026-07-15', category: 'praise', content: '工作人员态度很好，环境干净整洁，孩子玩得很开心', rating: 5, status: 'resolved' },
  { id: 'FB003', date: '2026-07-14', category: 'complaint', content: '抓娃娃机有故障，夹子太松了根本抓不到', rating: 2, status: 'processing', reply: '已安排技术人员现场调试，预计2小时内修复' },
  { id: 'FB004', date: '2026-07-14', category: 'question', content: '积分兑换的礼品在哪里领取？', rating: 3, status: 'resolved', reply: '请在门店收银台出示兑换码领取' },
  { id: 'FB005', date: '2026-07-13', category: 'suggestion', content: '希望能增加线上预约功能，避免周末排队', rating: 4, status: 'pending' },
  { id: 'FB006', date: '2026-07-13', category: 'bug', content: 'APP签到页面有时会卡住，需要重新打开', rating: 1, status: 'processing', reply: '已记录该问题，技术团队正在排查' },
  { id: 'FB007', date: '2026-07-12', category: 'praise', content: '生日那天收到祝福短信和优惠券，很感动', rating: 5, status: 'closed' },
  { id: 'FB008', date: '2026-07-12', category: 'question', content: '会员等级升级需要多少积分？', rating: 3, status: 'resolved', reply: '银卡500分、金卡2000分、钻石卡5000分' },
  { id: 'FB009', date: '2026-07-11', category: 'suggestion', content: '建议在门店增加自助售币机，减少排队时间', rating: 4, status: 'pending' },
  { id: 'FB010', date: '2026-07-11', category: 'complaint', content: '门店WiFi信号太差，扫码领票加载很慢', rating: 2, status: 'resolved', reply: '已升级WiFi设备，请重新连接尝试' },
  { id: 'FB011', date: '2026-07-10', category: 'bug', content: '微信支付成功后未到账，扣款了但余额不变', rating: 1, status: 'resolved', reply: '已进行订单核查并补发，请刷新查看余额' },
  { id: 'FB012', date: '2026-07-10', category: 'suggestion', content: '团建项目可以增加真人CS或密室逃脱', rating: 3, status: 'pending' },
  { id: 'FB013', date: '2026-07-09', category: 'praise', content: '兑换的礼品质量很好，小朋友很喜欢', rating: 5, status: 'closed' },
  { id: 'FB014', date: '2026-07-09', category: 'question', content: '团购券节假日可以用吗？', rating: 4, status: 'resolved', reply: '普通券节假日通用，特价券详见使用说明' },
  { id: 'FB015', date: '2026-07-08', category: 'complaint', content: '周末人太多，建议限流或分时段', rating: 3, status: 'processing', reply: '已提交运营部门评估分时段方案' },
  { id: 'FB016', date: '2026-07-08', category: 'suggestion', content: '希望增加积分抵扣现金功能', rating: 5, status: 'pending' },
  { id: 'FB017', date: '2026-07-07', category: 'bug', content: '推送通知点击后跳转页面404', rating: 2, status: 'resolved', reply: '已修复跳转链接' },
  { id: 'FB018', date: '2026-07-07', category: 'praise', content: '店员很热情，主动介绍优惠活动', rating: 5, status: 'closed' },
  { id: 'FB019', date: '2026-07-06', category: 'question', content: '怎么查询我的消费记录？', rating: 3, status: 'resolved', reply: 'APP -> 我的 -> 消费记录中可查看' },
  { id: 'FB020', date: '2026-07-06', category: 'suggestion', content: '建议增加亲子活动专区', rating: 4, status: 'pending' },
  { id: 'FB021', date: '2026-07-05', category: 'complaint', content: '停车场车位太少，找了半小时车位', rating: 2, status: 'resolved', reply: '已协调附近停车场提供会员优惠' },
  { id: 'FB022', date: '2026-07-05', category: 'bug', content: '余额页面刷新后显示异常', rating: 1, status: 'processing', reply: '已在下一版修复，请更新至V2.3.0' },
  { id: 'FB023', date: '2026-07-04', category: 'praise', content: '积分商城上新速度快，物品种类丰富', rating: 5, status: 'closed' },
  { id: 'FB024', date: '2026-07-04', category: 'question', content: '退卡余额怎么处理？', rating: 3, status: 'resolved', reply: '退卡后余额将退回原支付账户，7个工作日内到账' },
  { id: 'FB025', date: '2026-07-03', category: 'suggestion', content: '建议引入AI推荐的游戏项目', rating: 4, status: 'pending' },
  { id: 'FB026', date: '2026-07-03', category: 'complaint', content: '部分游戏机币值标注不清', rating: 3, status: 'resolved', reply: '已在机器上增加清晰的币值标签' },
  { id: 'FB027', date: '2026-07-02', category: 'bug', content: '代金券二维码无法扫描', rating: 1, status: 'resolved', reply: '已重新生成有效二维码' },
  { id: 'FB028', date: '2026-07-02', category: 'praise', content: '退换处理效率高，3分钟搞定', rating: 5, status: 'closed' },
  { id: 'FB029', date: '2026-07-01', category: 'question', content: '会员日有什么优惠活动？', rating: 4, status: 'resolved', reply: '每月15日为会员日，消费双倍积分' },
  { id: 'FB030', date: '2026-06-30', category: 'suggestion', content: '希望增加好友组队功能', rating: 3, status: 'pending' },
  { id: 'FB031', date: '2026-06-30', category: 'complaint', content: '某些时段空调温度太低', rating: 2, status: 'resolved', reply: '已调整空调温度设置为26°C' },
  { id: 'FB032', date: '2026-06-29', category: 'bug', content: '排行榜数据更新不及时', rating: 2, status: 'processing', reply: '已排查数据传输问题' },
  { id: 'FB033', date: '2026-06-29', category: 'praise', content: '外卖订单包装很用心', rating: 5, status: 'closed' },
  { id: 'FB034', date: '2026-06-28', category: 'question', content: '群发优惠券怎么领？', rating: 3, status: 'resolved', reply: '关注公众号即可领取' },
  { id: 'FB035', date: '2026-06-28', category: 'suggestion', content: '建议增加饮品自助区', rating: 4, status: 'pending' },
];

const CATEGORY_OPTIONS = ['全部', 'suggestion', 'complaint', 'question', 'praise', 'bug', 'other'] as const;
const CATEGORY_LABELS: Record<string, string> = {
  suggestion: '建议', complaint: '投诉', question: '咨询',
  praise: '表扬', bug: '故障', other: '其他',
};
const CATEGORY_COLORS: Record<string, string> = {
  suggestion: '#6366f1', complaint: '#ef4444', question: '#3b82f6',
  praise: '#22c55e', bug: '#f59e0b', other: '#6b7280',
};
const STATUS_OPTIONS = ['全部', 'pending', 'processing', 'resolved', 'closed'] as const;
const STATUS_LABELS: Record<string, string> = {
  pending: '待处理', processing: '处理中', resolved: '已回复', closed: '已关闭',
};
const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b', processing: '#3b82f6', resolved: '#22c55e', closed: '#6b7280',
};
const PAGE_SIZE = 10;

/* ── 子组件: 状态徽章 ── */
function FeedbackStatusBadge({ status }: { status: FeedbackStatus }) {
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 10,
      fontSize: 10, fontWeight: 600, whiteSpace: 'nowrap',
      background: `${STATUS_COLORS[status]}18`, color: STATUS_COLORS[status],
      border: `1px solid ${STATUS_COLORS[status]}30`,
    }}>
      {STATUS_LABELS[status]}
    </span>
  );
}

/* ── 子组件: 评分星星 ── */
function StarRating({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <span style={{ fontSize: size }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ color: i <= rating ? '#f59e0b' : '#d1d5db' }}>★</span>
      ))}
    </span>
  );
}

/* ── 子组件: 反馈卡片 ── */
function FeedbackCard({ record }: { record: FeedbackRecord }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{
      padding: '14px 16px', marginBottom: 8, borderRadius: 12,
      background: '#fff', border: '1px solid #f3f4f6',
      cursor: record.reply ? 'pointer' : 'default',
    }}
      onClick={() => record.reply && setExpanded(!expanded)}
    >
      {/* 头部 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{
            padding: '2px 7px', borderRadius: 6, fontSize: 10, fontWeight: 600,
            background: `${CATEGORY_COLORS[record.category]}18`,
            color: CATEGORY_COLORS[record.category],
          }}>
            {CATEGORY_LABELS[record.category]}
          </span>
          <FeedbackStatusBadge status={record.status} />
          <StarRating rating={record.rating} size={11} />
        </div>
        <span style={{ color: '#9ca3af', fontSize: 11, whiteSpace: 'nowrap' }}>{record.date}</span>
      </div>

      {/* 内容 */}
      <p style={{ margin: '4px 0 0', fontSize: 13, color: '#374151', lineHeight: 1.5 }}>
        {record.content}
      </p>

      {/* 回复区域 (展开) */}
      {record.reply && expanded && (
        <div style={{
          marginTop: 10, padding: 10, borderRadius: 8,
          background: '#f0fdf4', border: '1px solid #bbf7d0',
        }}>
          <div style={{ fontSize: 11, color: '#16a34a', fontWeight: 600, marginBottom: 4 }}>
            💬 回复 {record.replyDate && `(${record.replyDate})`}
          </div>
          <div style={{ fontSize: 13, color: '#15803d', lineHeight: 1.4 }}>{record.reply}</div>
        </div>
      )}

      {/* 未回复提示 */}
      {record.reply && !expanded && (
        <div style={{ marginTop: 6, fontSize: 11, color: '#9ca3af' }}>
          💬 点击查看回复
        </div>
      )}
    </div>
  );
}

/* ── 子组件: 统计面板 ── */
function FeedbackStats({ records }: { records: FeedbackRecord[] }) {
  const stats = useMemo(() => {
    const catCount: Record<string, number> = {};
    const statusCount: Record<string, number> = {};
    let totalRating = 0;

    records.forEach(r => {
      catCount[r.category] = (catCount[r.category] || 0) + 1;
      statusCount[r.status] = (statusCount[r.status] || 0) + 1;
      totalRating += r.rating;
    });

    return {
      byCategory: catCount,
      byStatus: statusCount,
      avgRating: records.length > 0 ? (totalRating / records.length).toFixed(1) : '0',
      resolved: (statusCount.resolved || 0) + (statusCount.closed || 0),
      pending: (statusCount.pending || 0) + (statusCount.processing || 0),
    };
  }, [records]);

  return (
    <div style={{
      marginBottom: 16, padding: 16, borderRadius: 12,
      background: '#f9fafb', border: '1px solid #e5e7eb',
      display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10,
    }}>
      <div style={{ textAlign: 'center', padding: 8, background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb' }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#374151' }}>{records.length}</div>
        <div style={{ fontSize: 11, color: '#6b7280' }}>总反馈</div>
      </div>
      <div style={{ textAlign: 'center', padding: 8, background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb' }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#059669' }}>{stats.resolved}</div>
        <div style={{ fontSize: 11, color: '#6b7280' }}>已处理</div>
      </div>
      <div style={{ textAlign: 'center', padding: 8, background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb' }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#f59e0b' }}>{stats.pending}</div>
        <div style={{ fontSize: 11, color: '#6b7280' }}>待处理</div>
      </div>
      <div style={{ textAlign: 'center', padding: 8, background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb' }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#6366f1' }}>{stats.avgRating}</div>
        <div style={{ fontSize: 11, color: '#6b7280' }}>平均评分</div>
      </div>
    </div>
  );
}

/* ── 子组件: 新建反馈表单 ── */
function NewFeedbackForm({ onSubmit }: { onSubmit: (data: { content: string; category: FeedbackCategory; rating: number }) => void }) {
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<FeedbackCategory>('suggestion');
  const [rating, setRating] = useState(4);

  return (
    <div style={{
      marginBottom: 16, padding: 16, borderRadius: 12,
      background: '#fefce8', border: '1px solid #fde68a',
    }}>
      <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600, color: '#92400e' }}>📝 提交反馈</h3>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={category} onChange={e => setCategory(e.target.value as FeedbackCategory)}
          style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 12, color: '#374151' }}
        >
          {CATEGORY_OPTIONS.filter(c => c !== '全部').map(c => (
            <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
          ))}
        </select>
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <span style={{ fontSize: 12, color: '#6b7280', marginRight: 4 }}>评分:</span>
          {[1,2,3,4,5].map(i => (
            <button key={i} onClick={() => setRating(i)}
              style={{
                border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 18,
                color: i <= rating ? '#f59e0b' : '#d1d5db', padding: '0 1px',
              }}
            >★</button>
          ))}
        </div>
      </div>
      <textarea value={content} onChange={e => setContent(e.target.value)}
        placeholder="请描述您的意见或建议..."
        rows={3}
        style={{
          width: '100%', padding: 10, borderRadius: 8, border: '1px solid #d1d5db',
          fontSize: 13, color: '#374151', resize: 'vertical', marginBottom: 8,
          boxSizing: 'border-box', fontFamily: 'inherit',
        }}
      />
      <button onClick={() => {
        if (!content.trim()) return;
        onSubmit({ content: content.trim(), category, rating });
        setContent('');
      }}
        style={{
          padding: '8px 20px', borderRadius: 8, border: 'none',
          background: '#2563eb', color: '#fff', cursor: content.trim() ? 'pointer' : 'not-allowed',
          fontSize: 13, fontWeight: 600, opacity: content.trim() ? 1 : 0.5,
        }}
      >
        提交反馈
      </button>
    </div>
  );
}

/* ── 主组件 ── */
export default function FeedbackPage() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('全部');
  const [statusFilter, setStatusFilter] = useState('全部');
  const [page, setPage] = useState(1);
  const [showError, setShowError] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [records, setRecords] = useState(ALL_FEEDBACK);

  const filtered = useMemo(() => {
    const kw = search.trim().toLowerCase();
    return records.filter(r => {
      if (categoryFilter !== '全部' && r.category !== categoryFilter) return false;
      if (statusFilter !== '全部' && r.status !== statusFilter) return false;
      if (kw && !r.content.toLowerCase().includes(kw)) return false;
      return true;
    });
  }, [search, categoryFilter, statusFilter, records]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = useMemo(() => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filtered, page]);

  useEffect(() => { setPage(1); }, [search, categoryFilter, statusFilter]);

  const handleNewFeedback = (data: { content: string; category: FeedbackCategory; rating: number }) => {
    const newRecord: FeedbackRecord = {
      id: `FB${String(Date.now()).slice(-5)}`,
      date: new Date().toISOString().slice(0, 10),
      category: data.category,
      content: data.content,
      rating: data.rating,
      status: 'pending',
    };
    setRecords(prev => [newRecord, ...prev]);
  };

  return (
    <PageShell title="意见反馈" description="提交和查看意见反馈记录">
      <div style={{ padding: 24, maxWidth: 640, margin: '0 auto' }}>
        {/* 标题 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>💬 意见反馈</h1>
            <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>
              共 {records.length} 条反馈 · 您的每一条建议都在帮助改善
            </p>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => setShowNewForm(!showNewForm)}
              style={{
                padding: '6px 14px', borderRadius: 8, border: '1px solid #d1d5db', background: '#fff',
                cursor: 'pointer', fontSize: 12, color: showNewForm ? '#2563eb' : '#374151',
              }}
            >
              {showNewForm ? '收起' : '✏️ 新反馈'}
            </button>
            <button
              onClick={() => setShowStats(!showStats)}
              style={{
                padding: '6px 14px', borderRadius: 8, border: '1px solid #d1d5db', background: '#fff',
                cursor: 'pointer', fontSize: 12, color: showStats ? '#2563eb' : '#374151',
              }}
            >
              {showStats ? '隐藏统计' : '📊 统计'}
            </button>
            <button
              onClick={() => setShowError(!showError)}
              style={{
                padding: '6px 14px', borderRadius: 8,
                background: '#fef2f2', border: '1px solid #fecaca',
                color: '#dc2626', fontSize: 11, cursor: 'pointer',
              }}
            >
              {showError ? '恢复数据' : '模拟错误'}
            </button>
          </div>
        </div>

        {/* 错误状态 */}
        {showError && (
          <div style={{ padding: 16, marginBottom: 16, borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca' }}>
            <div style={{ color: '#dc2626', fontWeight: 600, marginBottom: 4 }}>⚠️ 加载失败</div>
            <div style={{ color: '#fca5a5', fontSize: 13 }}>反馈数据加载异常，请稍后刷新重试 (模拟错误状态)</div>
            <button
              onClick={() => setShowError(false)}
              style={{ marginTop: 8, padding: '4px 12px', borderRadius: 6, border: 'none', background: '#dc2626', color: '#fff', cursor: 'pointer', fontSize: 12 }}
            >
              重试
            </button>
          </div>
        )}

        {!showError && (
          <>
            {/* 统计面板 */}
            {showStats && <FeedbackStats records={records} />}

            {/* 新建反馈表单 */}
            {showNewForm && <NewFeedbackForm onSubmit={handleNewFeedback} />}

            {/* 搜索与筛选 */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                placeholder="🔍 搜索反馈内容..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  flex: 1, minWidth: 150, padding: '9px 12px', borderRadius: 10,
                  border: '1px solid #d1d5db', color: '#374151', fontSize: 13, outline: 'none',
                }}
              />
              <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
                style={{ padding: '9px 10px', borderRadius: 10, border: '1px solid #d1d5db', color: '#374151', fontSize: 12 }}>
                {CATEGORY_OPTIONS.map(t => <option key={t} value={t}>{t === '全部' ? '全部分类' : CATEGORY_LABELS[t]}</option>)}
              </select>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                style={{ padding: '9px 10px', borderRadius: 10, border: '1px solid #d1d5db', color: '#374151', fontSize: 12 }}>
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s === '全部' ? '全部状态' : STATUS_LABELS[s]}</option>)}
              </select>
              <span style={{ fontSize: 12, color: '#9ca3af', marginLeft: 'auto' }}>
                {filtered.length} 条
              </span>
            </div>

            {/* 反馈列表 / 空状态 */}
            {paginated.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '50px 20px',
                borderRadius: 14, border: '1px dashed #d1d5db', background: '#f9fafb',
              }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>📭</div>
                <div style={{ color: '#6b7280', fontSize: 15, marginBottom: 4 }}>暂无反馈记录</div>
                <div style={{ color: '#9ca3af', fontSize: 12 }}>点击上方「新反馈」提交您的意见</div>
              </div>
            ) : (
              <>
                {paginated.map(r => <FeedbackCard key={r.id} record={r} />)}

                {/* 分页 */}
                {totalPages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 16, fontSize: 13 }}>
                    <button
                      disabled={page <= 1}
                      onClick={() => setPage(p => p - 1)}
                      style={{
                        padding: '6px 14px', borderRadius: 8, border: '1px solid #d1d5db',
                        background: page <= 1 ? '#f3f4f6' : '#fff',
                        color: page <= 1 ? '#9ca3af' : '#374151',
                        cursor: page <= 1 ? 'not-allowed' : 'pointer', fontSize: 13,
                      }}
                    >
                      ← 上一页
                    </button>
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      const start = Math.max(1, Math.min(page - 2, totalPages - 4));
                      const p = start + i;
                      if (p > totalPages) return null;
                      return (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          style={{
                            padding: '6px 12px', borderRadius: 8, border: 'none',
                            background: p === page ? '#2563eb' : '#f3f4f6',
                            color: p === page ? '#fff' : '#374151',
                            cursor: 'pointer', fontSize: 13, fontWeight: p === page ? 700 : 400,
                          }}
                        >
                          {p}
                        </button>
                      );
                    })}
                    <button
                      disabled={page >= totalPages}
                      onClick={() => setPage(p => p + 1)}
                      style={{
                        padding: '6px 14px', borderRadius: 8, border: '1px solid #d1d5db',
                        background: page >= totalPages ? '#f3f4f6' : '#fff',
                        color: page >= totalPages ? '#9ca3af' : '#374151',
                        cursor: page >= totalPages ? 'not-allowed' : 'pointer', fontSize: 13,
                      }}
                    >
                      下一页 →
                    </button>
                    <span style={{ fontSize: 12, color: '#6b7280' }}>
                      {page}/{totalPages}
                    </span>
                  </div>
                )}
              </>
            )}

            {/* 底部统计 */}
            <div style={{
              marginTop: 12, padding: '10px 14px', borderRadius: 10,
              background: '#f9fafb', border: '1px solid #e5e7eb',
              display: 'flex', justifyContent: 'space-between',
              color: '#6b7280', fontSize: 11,
            }}>
              <span>共 {filtered.length} 条反馈</span>
              <span>本页 {paginated.length} 条</span>
              <span>已处理 {records.filter(r => r.status === 'resolved' || r.status === 'closed').length} 条</span>
              <span>待处理 {records.filter(r => r.status === 'pending' || r.status === 'processing').length} 条</span>
            </div>

            {/* 热点反馈词云 */}
            <div style={{ marginTop: 16, padding: 14, borderRadius: 12, background: '#f0f9ff', border: '1px solid #bae6fd' }}>
              <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600, color: '#0369a1' }}>🔥 反馈热点词云</h3>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
                {[
                  { word: '游戏机', count: 18, size: 20 }, { word: '价格', count: 15, size: 18 }, { word: '会员', count: 12, size: 16 }, { word: '积分', count: 11, size: 15 },
                  { word: '服务态度', count: 9, size: 14 }, { word: '排队', count: 8, size: 13 }, { word: '优惠券', count: 7, size: 12 }, { word: '设备', count: 6, size: 11 },
                  { word: '空调', count: 5, size: 10 }, { word: '卫生', count: 4, size: 9 }, { word: 'WiFi', count: 3, size: 8 }, { word: '停车', count: 3, size: 8 },
                ].map((tag, i) => (
                  <span key={i} style={{
                    padding: '4px 10px', borderRadius: 16,
                    fontSize: tag.size, fontWeight: 600,
                    background: '#fff', border: '1px solid #e5e7eb',
                    color: tag.count >= 15 ? '#dc2626' : tag.count >= 10 ? '#d97706' : tag.count >= 5 ? '#2563eb' : '#6b7280',
                  }}>
                    {tag.word}
                    <span style={{ fontSize: 10, marginLeft: 4, color: '#9ca3af' }}>{tag.count}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* 反馈趋势统计 */}
            <div style={{ marginTop: 16, padding: 14, borderRadius: 12, background: '#fffbeb', border: '1px solid #fde68a' }}>
              <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600, color: '#92400e' }}>📈 反馈趋势分析</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8 }}>
                {[
                  { label: '本周新增', value: 7, color: '#2563eb', trend: 'up' },
                  { label: '处理率', value: '78%', color: '#059669', trend: 'up' },
                  { label: '平均响应', value: '4.2h', color: '#d97706', trend: 'stable' },
                  { label: '好评率', value: '92%', color: '#7c3aed', trend: 'up' },
                ].map((item, i) => (
                  <div key={i} style={{ padding: 10, borderRadius: 8, background: '#fff', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: item.color }}>{item.value}</div>
                    <div style={{ fontSize: 11, color: '#6b7280' }}>{item.label}</div>
                    <div style={{ fontSize: 10, color: item.trend === 'up' ? '#059669' : item.trend === 'down' ? '#dc2626' : '#9ca3af' }}>
                      {item.trend === 'up' ? '↑ 上升' : item.trend === 'down' ? '↓ 下降' : '→ 持平'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </PageShell>
  );
}
